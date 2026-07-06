# The subagent safety classifier — what model knob it rides (and why `aliases` doesn't route it)

**Question (2026-07-06, downstream-feedback #346).** A downstream session's spawned
subagent returned a platform note — *"the safety classifier was unavailable when reviewing
this subagent's work. Please carefully verify the sub-agent's actions and output before
acting on them."* — and the Operator asked two things: (1) what is the prescribed fallback
(landed as a fire-time-anchored `orchestrator.md` `## Your seat` bullet, **not** here); and
(2) **which model knob does that classifier call ride** — a tier alias
(`ANTHROPIC_DEFAULT_<TIER>_MODEL`), `guardModel` (`ANTHROPIC_SMALL_FAST_MODEL`, the
background model), or a hardcoded id? The downstream had `launch.aliases.opus` bound to a
foreign proxy and the classifier "did not appear to honour the alias."

---

## What the facts settle (sourced)

The classifier is **Claude Code's Auto Mode transcript classifier** — a full second LLM
that replaces the human approve/deny prompt by reading the transcript and deciding each
action's safety. It is the platform's *own* gate on the main session and on subagents;
it is **orthogonal to this protocol's Reviewer** (invariant 3 governs *our* Reviewer, a
separate spawn).

**(1) It is a full second Claude LLM, NOT the background/small-fast model.** The
classifier is described throughout as *"a second instance of Claude (Sonnet 4.6)"*
([sc0tfree Auto-Mode gist](https://gist.github.com/sc0tfree/11c86116df4c2281a976d796f9493cd7));
the same source documents the call going through `sideQuery` with a `model` argument —
the standard Claude Messages path, with its own two-stage (fast / chain-of-thought)
prompt. It is therefore **not** the small-fast model `guardModel` points at
(`ANTHROPIC_SMALL_FAST_MODEL` — titling, summaries, the cheap background calls); those are
a *different* call family. **`guardModel` does not cover the classifier** — that was the
first hypothesis and it is refuted.

**(2) For a subagent, the classifier runs at handoff — and the #346 message is its
advisory-unavailable branch, verbatim.** The gist's reverse-engineering of
`classifyHandoffIfNeeded()` (`agentToolUtils.ts`) returns, when
`classifierResult.unavailable` is set:

```text
Note: The safety classifier was unavailable when reviewing this sub-agent's work.
Please carefully verify the sub-agent's actions and output before acting on them.
```

That is the #346 string, character for character — which is also what validates the gist
as an accurate source. Critically, this branch is **advisory, not a block**: the per-action
classifier is fail-closed (an unavailable classifier *denies* the action under the default
`tengu_iron_gate_closed` gate), but the **subagent handoff** review, when unavailable,
returns a note that asks the *main agent to verify the work itself* — it does not block the
handoff. So the platform's own fallback is exactly "you verify it" — which is what makes
the protocol fallback (#346 gap 1) the correct, well-grounded response, not an improvisation.

**(3) The classifier is pinned to a SPECIFIC model id — not a tier alias.** The decisive
evidence is [anthropics/claude-code#49535](https://github.com/anthropics/claude-code/issues/49535):
during a classifier outage the error reads *"claude-opus-4-6[1m] is temporarily
unavailable, so auto mode cannot determine the safety of Edit…"* — **even though the user
had selected Opus 4.7**. The reporter flags this directly: *"the error message references
claude-opus-4-6[1m] as the classifier even when the user has explicitly selected Opus
4.7."* Auto Mode runs on a pinned classifier model (Sonnet 4.6 / Opus 4.6 by version —
[community writeups](https://medium.com/@AdithyaGiridharan/claude-codes-auto-mode-solves-the-permission-fatigue-problem-1bb7417bb858)
note it "works with Sonnet 4.6 and Opus 4.6 only"), not whatever the user picked.

**(4) The call rides `ANTHROPIC_BASE_URL` — but the proxy must route the classifier's
literal id, or the call fails "unavailable".** [anthropics/claude-code#60438](https://github.com/anthropics/claude-code/issues/60438)
("Persistent HTTP 429 on auto-mode classifier") and [farion1231/cc-switch#1678](https://github.com/farion1231/cc-switch/issues/1678)
both report that **unsetting `ANTHROPIC_BASE_URL` makes the classifier work** — i.e. the
classifier call *does* go through the configured base URL / proxy like any Claude API call.
It fails through a proxy when the proxy has **no route for the classifier's pinned concrete
model id** (`claude-opus-4-6` / `claude-sonnet-4-6`): the proxy returns an error, the call
is treated as unavailable, and the handoff surfaces the #346 note.

---

## The boundary (the answer to #346 gap 2)

`launch.aliases` binds the **four tier slots** (`fable`/`opus`/`sonnet`/`haiku` →
`ANTHROPIC_DEFAULT_<TIER>_MODEL`) for **role** model resolution — and only for a request
that names a **bare tier**. The classifier does not request a tier; it requests a
**specific concrete model id** (`claude-opus-4-6` / `claude-sonnet-4-6`), pinned by the
platform. A concrete id **bypasses tier-env rerouting** — the tier vars only catch bare-tier
requests. So `aliases.opus` cannot route the classifier, by the same mechanism that already
bites programmatic role-spawns (a concrete id loaded at startup bypasses a bare-alias
re-bake — `.ai-dev/state/current.md` "programmatic role-spawns" finding).

**To make the classifier reachable through a foreign proxy, the proxy's route table must
carry a route for the classifier's literal pinned id** (e.g. `claude-opus-4-6` → the
foreign backend). `aliases` is the wrong lever — it never claimed to cover platform
background calls; it is role-resolution only. `guardModel` is also the wrong lever — it
points at the small-fast model, an unrelated call. The honest statement is: **the classifier
is a platform-internal call whose model the protocol does not choose**; on a foreign-proxy
setup it is covered only by giving the proxy a route for its pinned id, which is the
proxy-operator's concern (this repo's proxy is `src/adapter/router-launch.mjs`'s first-party
built-in; a downstream's proxy is theirs).

---

## What the protocol *does* own (gap 1, the high-value part)

Because the handoff-unavailable note is **advisory** (the platform's own fallback is "you
verify it"), the protocol's correct move is a prescribed verification discipline — not a
routing fix and not a new gate. That lives fire-time-anchored in `orchestrator.md`
`## Your seat` (one home): on receiving a subagent result that carries the classifier-was-
unavailable note, the Orchestrator translates the opaque note for the Operator, runs an
explicit verification pass over the subagent's diff, and still ships the independent
Reviewer — the fallback covers the handoff-to-gate gap, it does not replace the gate
(invariant 3 is about *our* Reviewer; the platform classifier is orthogonal).

---

## Open residual (honest)

Whether the classifier honours `ANTHROPIC_BASE_URL` *universally* or only on some builds
is community-evidence (#60438, cc-switch#1678), not a primary Anthropic statement. The
behavior could be version-dependent (the pinned id and the routing both shift across
Claude Code releases — #49535 is CC 2.1.112). The boundary above holds for the documented
builds; a live probe of the proxy's request log is the only way to confirm the literal id
on a given install. Recorded, not blocking — the fallback (#346 gap 1) is correct
regardless of which model id is pinned, because it does not depend on routing at all.
