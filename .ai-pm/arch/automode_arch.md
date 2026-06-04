# automode — design notes

## Context

The plan adds a **decision-authority mode**: a per-feature dial (`autonomous | interactive`)
that, when `autonomous`, redirects `pm-product-advocate`'s existing gap output through a
*derive-from-cited-canon-or-escalate* gate instead of blanket-relaying every gap to the PM.
The plan's WHAT/WHY is settled by research + the three PM forks (8 scenarios, graded/capped,
decide-and-log, merge-stays-manual). This note resolves only the **structural placement**
questions the spawn names: where the single source for the authority rule lives, where the
interactive-vs-autonomous redirect seam sits, the back-compat surface, and the shape of the
citation guard.

This is a protocol-spec change in the template repo (no-user-facing-contract exception;
dev-docs in `doc/`). There is no runtime, no shared mutable state, no concurrency — the only
"interactions" are with adjacent **protocol mechanisms** that share the Step 3.5 pipeline or
read the advocate's `## Resolutions` trail. So the usual event-subscription / feedback-loop
analysis (Section B step 2) is N/A; in its place the relevant analysis is *which existing
single-source + owner-split + soft-enforcement precedents this feature must structurally match.*

Three precedents are load-bearing and recur below. This feature does not introduce a new family
member — it is a **rider on the already-shipped `pm-product-advocate` family member** (`doc/architecture.md`
"pm-product-advocate: an independent product-axis referee", v-current), and inherits its discipline wholesale:

- **Single-source-of-conditions, referenced by name** — `### Project kind`, `### Security-relevant
  surfaces`, `### Foundational product questions`, `### Pending-migration detection`. Each owns its
  enum + load-bearing default **once** in a protocol-root `.md` (`WORKFLOW.md` / `MIGRATIONS.md`),
  referenced by name from every consumer, never re-encoded. The home is a protocol-root file and
  **not** `doc/<name>.md` — the `doc/`-vs-`docs/` resolution trap recorded in the migrations decision
  (a `doc/` path resolves in this repo but a downstream reads it at `.ai-pm/tooling/`).
- **The advocate is a pure presence-referee (player/referee independence).** `pm-product-advocate`
  reports *which foundational questions have no recorded answer* — presence, never meaning; it never
  addresses the PM and never judges an answer. The orchestrator is the player that both elicits and
  drives toward coding; the advocate is the separate role/context/prompt that breaks that self-check.
  Any redirect logic that taught the advocate to *resolve* a gap would collapse that independence.
- **Soft enforcement, no `PreToolUse` hook; gates key on a loud positive marker.** "Is this gap
  derivable from canon" is a semantic judgement a regex cannot make — the same shape that made the
  threat-model, blast-radius, and advocate decisions all reject a hook. Enforcement is prose at the
  gated Step 3.5 + a presence-keyed backstop at `pm-plan-checker` DoD and `pm-auditor` dimension 1,
  exactly the advocate's two existing backstops.

## Adjacent implementations

1. **`### Project kind`** (`WORKFLOW.md` ~L213) — the *exact* single-source-subsection shape to mirror.
   One subsection owns the enum (`software | documentation`) + the load-bearing `absent OR unrecognized
   ⇒ software` default; the closing paragraph (L226) names every consumer (mandatory-table rider, Pass-2
   routing, no-code validation, `## Validation` stamp, advocate `documentation` tier) and states they
   reference it **by name** and **never re-encode the enum or the default**. The per-project value is a
   `## Project kind: software` line in downstream `CLAUDE.md`, carried by `CLAUDE.md.tmpl`. `### Decision
   authority` is the same object: enum + `absent OR unrecognized ⇒ interactive` default in the subsection;
   `## Decision authority: interactive` line in `CLAUDE.md`/tmpl; consumers reference by name.

2. **`pm-product-advocate` Step 3.5 gate** (`WORKFLOW.md` L117–124) — the seam being redirected. The
   advocate emits `clean` (silent pass) or `gaps: N`; the *orchestrator* relays all N in one
   `AskUserQuestion` and records each as a numbered `## Resolutions` entry (the Edit-ownership second
   carve-out — trail is orchestrator-owned). The advocate owns through `## Verdict`; it does not write the
   trail. This is the precise insertion point: today the orchestrator blanket-relays; automode inserts a
   per-gap derivability test *before* the relay, so only the escalation subset reaches the one
   `AskUserQuestion`.

3. **The advocate's two backstops** (`pm-plan-checker` DoD L76 + `pm-auditor` dimension 1 L77) — both
   already presence-key on the *same greppable verdict token*: `clean`, or `gaps: N` with N `## Resolutions`
   entries. The citation guard is strictly additive to this existing count-check: on an `auto`-marked entry,
   also assert a citation token is present. It rides the artifact the backstops already read; it adds no new
   artifact and no new gate.

## Behavioral risks in this area

No runtime / event subscriptions (prose-spec feature). The one cross-artifact coupling is sequential
within a single feature's pipeline: advocate `gaps: N` → orchestrator derive-or-escalate → `## Resolutions`
trail (now `auto` | `escalated`-marked) → plan-checker/auditor presence-checks. The structural risks are
protocol-coherence, not concurrency:

- **Independence erosion (dominant).** If the derivability test were placed *in the advocate*, the advocate
  would stop being a pure presence-referee and start resolving — the orchestrator's player-role would have
  leaked into the referee. The redirect must live in the orchestrator's Step 3.5 handling so the advocate's
  prompt is byte-unchanged.
- **Confabulation from an under-specified baseline (the research's named dominant risk).** An `auto` entry
  with no canon citation = a direction the baseline never implied. The citation-presence guard is the
  countermeasure; it must be a *shape* check (a `file`/`### section` token is present), never a *meaning*
  check (does the citation truly support the decision) — the latter is the PM's call at batch review, and a
  protocol gate that judged citation validity would violate the protocol's "shape, not meaning" discipline.
- **Back-compat drift via a re-encoded default.** Any consumer that hard-codes `interactive` rather than
  referencing `### Decision authority` by name reintroduces exactly the drift the single-source rule exists
  to prevent — the same failure `### Project kind` (L226) calls out.

## Variant A: `### Decision authority` as a new `WORKFLOW.md` subsection; redirect in the orchestrator (plan's position)

- **Where the rule lives:** a new `### Decision authority` subsection in `WORKFLOW.md`, sibling to
  `### Project kind` / `### Security-relevant surfaces` / `### Foundational product questions`. It owns,
  once: the enum `autonomous | interactive`; the `absent OR unrecognized ⇒ interactive` default; the
  per-feature plan override; the effective-authority resolution order (plan override → `CLAUDE.md` default →
  `interactive`); the derivability test; the escalate-regardless cap (not-derivable / security-surface /
  PM-marked-irreversible); decide-and-log/no-veto-window; merge-stays-manual; and the `## Resolutions`
  `auto` | `escalated` markers + the `auto`-entry citation requirement. Per-project value is a
  `## Decision authority: interactive` line in downstream `CLAUDE.md` (carried by `CLAUDE.md.tmpl`).
- **Where the redirect lives:** the **orchestrator's Step 3.5 handling** branches on effective authority.
  The advocate spawn and prompt are **byte-unchanged** (still emits the same `gaps: N`). The `interactive`
  branch (default, every existing project) is byte-identical to today — blanket-relay all N. The
  `autonomous` branch runs the per-gap derive-or-escalate and relays only the escalation subset through the
  *same* one `AskUserQuestion`.
- **Relation to adjacent:** symmetric with `### Project kind` on the rule-home axis and with the advocate
  gate on the redirect axis. The redirect is the natural extension of the seam that already sits in the
  orchestrator (the orchestrator already owns the relay + the `## Resolutions` trail per the second
  carve-out).
- **Pros:** every consumer (`CLAUDE.md.tmpl`, `pm-plan`, `pm-plan-checker`, `pm-auditor`, Step 3.5, the
  PM-talk rider) references the subsection by name — the proven single-source shape, four times re-used,
  zero re-encoding. The autonomous path is **strictly additive** over a byte-unchanged interactive path
  (verifiable by editorial walkthrough). The advocate stays a pure presence-referee (independence intact).
  No `doc/`-vs-`docs/` trap (`WORKFLOW.md` resolves in both contexts). No new agent, no new command, no new
  artifact — minimal surface.
- **Cons:** `WORKFLOW.md` grows a fourth single-source subsection (acceptable — that growth *is* the proven
  pattern, not a smell). The orchestrator's Step 3.5 handling carries the only new conditional prose.
- **Risks:** the derivability test is judgement the orchestrator performs in prose — bounded by the citation
  guard (no canon passage ⇒ no auto-decision) and capped by the escalate-regardless rule; not a structural
  risk this note can further reduce.

## Variant B: a standalone `decision-authority.md` spec file + redirect in a new gating agent

- **Where the rule lives:** a standalone protocol-root spec (or `doc/`) file rather than a `WORKFLOW.md`
  subsection; **where the redirect lives:** a new agent (`pm-authority-gate` or similar) interposed at Step 3.5.
- **Relation to adjacent:** asymmetric — it breaks the established single-source-*subsection* shape and the
  established "orchestrator owns the relay" seam.
- **Pros:** a dedicated file is marginally more discoverable as a top-level concept.
- **Cons:** a standalone file is a *worse* home than a subsection on the load-bearing axis — if placed under
  `doc/` it re-introduces the `doc/`-vs-`docs/` resolution trap four agents would hit on every plan; if placed
  protocol-root it is a fifth root file competing with `WORKFLOW.md`/`MIGRATIONS.md` for no benefit over a
  subsection. A **new gating agent** is strictly worse: it would have to *resolve* gaps, which either
  duplicates advocate logic or pulls resolution out of the orchestrator that already owns the trail — and a
  separate referee-that-also-resolves re-creates the player/referee conflation the advocate exists to break.
  It also adds a command/agent surface the plan explicitly scopes out ("no new agent, no new command").
- **Risks:** independence erosion (the new agent resolving) is the dominant risk and is intrinsic to this
  variant, not incidental.

## Recommendation

**Variant A**, because it is the only variant that preserves all three load-bearing precedents at once:
the rule lands in the proven single-source-subsection shape (mirroring `### Project kind` byte-for-byte on
home, default, and by-name reference); the redirect lives in the orchestrator's Step 3.5 handling so the
advocate stays a **pure presence-referee** and the autonomous path is **strictly additive** over a
byte-unchanged interactive path; and the citation guard rides the advocate's two existing presence-keyed
backstops as a shape-not-meaning check, adding no new gate, agent, or artifact. Variant B's standalone file
and new gating agent each break one of these (the `doc/`-vs-`docs/` trap, and player/referee independence)
for no structural benefit.

**Answers to the four spawn questions:**

1. **Single-source placement — confirmed.** `### Decision authority` as a new `WORKFLOW.md` subsection is
   the right home, mirroring `### Project kind` exactly (enum + `absent OR unrecognized ⇒ interactive` default
   + resolution order + derivability test + cap + decide-and-log + merge-stays-manual + the `auto`/`escalated`
   markers + the citation requirement, all owned once; every consumer references by name, none re-encodes the
   default). No sharper placement exists — the protocol already has three siblings proving this is *the* shape,
   and any alternative home re-opens the `doc/`-vs-`docs/` trap those siblings were placed in `WORKFLOW.md` to avoid.

2. **Redirect seam — confirmed in the orchestrator, not the advocate.** The advocate must stay byte-unchanged
   (same prompt, same `gaps: N`); only the orchestrator's Step 3.5 handling branches (blanket-relay vs per-gap
   derive-or-escalate, with only the escalation set reaching the one `AskUserQuestion`). This keeps the
   player/referee independence intact (the advocate remains a pure presence-referee) and makes the autonomous
   path strictly additive over the byte-unchanged interactive path. No part of the logic belongs in the
   advocate — placing derivability there would turn the referee into a resolver and collapse the independence
   the advocate exists to provide.

3. **Back-compat surface — confirmed, no migration.** `absent OR unrecognized ⇒ interactive` mirrors
   `### Project kind`'s `absent OR unrecognized ⇒ software` exactly: no existing artifact gains a required
   field, no consumer treats an absent `## Decision authority` line as anything but `interactive`, and the
   feature is fully dormant unless `autonomous` is explicitly declared. Absence is safe and complete — no
   migration entry is needed (unlike a *renamed* value, which would need the `### Pending-migration detection`
   flag; here the default simply absorbs absence and any unrecognized value).

4. **Citation guard — confirmed as a presence/shape check at both backstops.** The anti-confabulation check
   (an `auto` entry must carry a `file`/`### section` citation token) is correctly placed at `pm-plan-checker`
   DoD (per-feature, blocking) + `pm-auditor` dimension 1 (project-wide backstop), keyed on the `auto` marker,
   additive to the existing `gaps: N` ↔ N-resolutions count check. It must check **presence of a citation
   token, not validity of the citation** — judging whether the cited passage truly supports the decision is the
   PM's job at batch review and would violate the protocol's "shape, not meaning" discipline that every other
   structural check (the wire-token note, the advocate presence-check, the review-stamp gate) already honors.

## Notes for the plan / PM

- **One coherence dependency to verify at coding time (clean-grep already in the plan's Test plan).** The
  whole back-compat guarantee rests on *no consumer re-encoding the `interactive` default*. The plan's
  clean-grep ("`### Decision authority` is the only place that encodes the enum + default; every consumer
  references it by name") is the load-bearing check — it is the same drift `### Project kind` L226 warns
  about, and it should be treated as blocking, not advisory.
- **Family-framing risk to record in the eventual `doc/architecture.md` decision (post-coding handoff).**
  Like the advocate's own record, automode's backstops are not redundant: drop the `pm-auditor` dimension-1
  citation check as "duplicating plan-checker" and a skipped/uncited auto-decision lands silently
  project-wide — exactly the degradation the review-stamp and advocate gates were built to close. The
  architecture decision should carry this family framing (graded/capped autonomy; ODD-as-baseline; the
  no-number derivability proxy *and why not a confidence threshold*; the `### Decision authority`
  single-source pattern) so a future reader does not "simplify" a backstop away.
