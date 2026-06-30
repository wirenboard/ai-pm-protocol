# A mechanical backstop for the audit cadence

**Question (2026-06-27).** Should the every-~5-features audit offer (`orchestrator.md`
`## Audit`, *Proactive cadence*) gain a **mechanical** backstop, so a runaway or
non-cooperative session cannot *silently* skip it — and if so, how, given that any
mechanical "N features since last audit" check needs a **durable** record of the last
audit, which today does not exist (the cadence lives in the gitignored, local-only
resume pointer)?

This is the F5 thread of the persona-floor epic
(`docs/decisions/persona-floor-external-substitute.md`), revisited after 5.23.0 made the
cadence *derivable* and *fail-safe-to-offer* but left it `[persona]`. The doc explicitly
parked "a mechanical cadence backstop remains deferred research" — this is that research.

---

## What 5.23.0 already fixed, and the precise residual hole

5.23.0 changed two things (`## Audit` cadence prose, `## Your seat` pointer note):

1. **Derivable, not pointer-only.** The *current* version is recoverable from git (tags /
   CHANGELOG), so the count no longer lives *solely* in the gitignored pointer.
2. **Fail-safe to offering.** A lost or stale pointer defaults to *offering* an audit
   (fail-safe to more rigor), so a dropped pointer self-heals into an offer instead of a
   silent drift to zero.

This already closes the *worst* failure (silent drift to zero on a lost pointer). What
remains is a **narrow** window: a session with a *present, valid* pointer reading `< N`
that nonetheless never relays the offer — a cooperative-but-forgetful or a deliberately
non-cooperative model. The cost of that window is a **lagged quality sweep**, never an
unsafe ship (see the safety frame below).

**The crux, named honestly.** 5.23.0's "recoverable from git" is only half true. A count
is a *range* `[last-audit-version, current-version]`. The **end** of that range
(current version) is git-durable. The **start** (the last audit) is durable **nowhere** —
it exists only in the gitignored pointer. So *no* purely-mechanical check can today
compute "features since last audit" at all; it can only compute "features since some
fixed point". Any mechanical backstop must first make the **start of the range durable**.
That is the real subject of this decision.

---

## Is it even worth it? (the safety frame)

The persona-floor doc (F5-1, shipped) settled the posture this research must not
re-litigate: **the audit is a QUALITY sweep, not a SAFETY gate.** The safety floor —
broken or unreviewed code reaching `main` — is held by the **merge-gate + remote branch
protection**, which are model-, platform-, and plugin-independent. A missed audit costs a
delayed sweep, not an unsafe ship.

Two consequences for *this* question:

- **A backstop buys timeliness, not safety.** It surfaces accumulated quality debt
  sooner. It adds **zero** to the safety floor — that floor is already model-independent.
  So the honest framing of any mechanism below is *nudge-redundancy on a quality cadence*,
  not *a new safety guarantee*.
- **A backstop can at most NUDGE — it can never block.** "Audit due" is not a failing
  condition. You cannot refuse a ship because a quality sweep is overdue without
  converting a quality cadence into a hard gate — which would be wrong by design
  (an audit produces findings to triage, it is not a pass/fail check), annoying, and
  gameable (push a trivial "audit" tag to clear it). The enforcement-class this belongs
  to is therefore **inject (nudge, never blocks)** — never deny, never ask.

**Verdict on worth:** the marginal *safety* value is ~zero, and the marginal *timeliness*
value is **modest** — it narrows one already-fail-safe persona window. The one genuinely
new property a mechanism *can* add is **audience**: shift the nudge from "the model
chooses to relay it" to "surfaced regardless of the model", so the **Operator** sees
"audit due" directly. That is the same robustness class as branch protection, and it is
the only thing here worth building for — and only with a mechanism that costs little and
changes no load-bearing convention.

---

## The durable-anchor problem (the crux fork)

Every mechanical option needs a durable "last audit" reference. Four ways to supply it:

**(a) A committed `.ai-dev/last-audit` marker.**
A small tracked file (date + the version audited), updated at each audit's close.

- *Pros:* trivial to read from anywhere (runner, CI, hook); explicit.
- *Cons:* **changes a standing convention** — `.ai-dev/state/` is gitignored *by design*
  (local-only since 5.5.0). Introducing a *committed* `.ai-dev/` state file is a real
  convention shift the Operator must own. It also adds a write the orchestrator must
  remember (a new persona step) — moving the unreliability from "remember to offer" to
  "remember to commit the marker", not removing it.

**(b) An annotated `audit/<date>` git tag, pushed at each audit close.** *(recommended IF
building)*
The audit's close (`## Audit` step 3, findings dispatched) pushes a lightweight, durable
tag — e.g. `audit/2026-06-27`. The count is then `git tag -l 'audit/*'` (latest) vs the
current `vX.Y.Z` tag — purely git, queryable by anyone.

- *Pros:* **no new file convention** — tags are already the durable version record, so
  this fits 5.23.0's "derive from git" direction exactly; the local-only-state convention
  is untouched; readable by CI, the runner, or a hook with one `git` call; durable and
  push-synced like every other tag.
- *Cons:* one more push step at audit close (persona — but it rides the audit's existing
  close, an act that already happens); a tag namespace addition (cheap, conventional).

**(c) A CHANGELOG line or commit trailer** (e.g. `Audit: 2026-06-27`).

- *Pros:* no new file, durable in git.
- *Cons:* an audit often produces **no** CHANGELOG entry (it dispatches findings; the
  fixes ship under their own entries), so there is no natural commit to carry the trailer;
  parsing prose/trailers is more brittle than `git tag -l`. Weaker than (b) for the same
  benefit.

**(d) No durable anchor — stay `[persona]`** (the 5.23.0 status quo). *(recommended as the
default)*
Accept that the start-of-range is non-durable, keep the fail-safe-to-offer behaviour, add
nothing.

- *Pros:* zero new convention, zero new step, zero new mechanism to maintain; honest —
  matches the F5-1 posture that the safety floor is elsewhere.
- *Cons:* the narrow forgetful/non-cooperative window stays open; the nudge's audience
  stays the model, not the Operator.

---

## The mechanism, IF pursued

Assuming an anchor exists (option b), *where does the nudge compute and surface?*

**(M1) CI advisory annotation.** *(recommended surface IF building)*
A non-failing step/job in `.github/workflows/checks.yml` computes
`audit/* (latest)` vs the current version tag and, past threshold, emits a
GitHub Actions **notice/annotation** ("N versions since the last audit tag — consider a
whole-project sweep") on the PR.

- *Honesty label:* **inject-class — nudges, never blocks.** The step never fails the
  `quality` job (it is `continue-on-error` / a pure annotation), so it cannot gate a
  merge. It makes the cadence **mechanically SURFACED**, not mechanically enforced.
- *Why it is the strongest option:* it inherits branch protection's robustness class —
  **model-, platform-, and plugin-independent**, and surfaced **to the Operator** (who
  reads PRs) rather than depending on the orchestrator to relay. It is exactly the layer
  that survives a dead plugin and a non-compliant model. Cheap: a few lines of workflow +
  the tag query.

**(M2) Quality-runner advisory line.**
A new `tools.json` row (or a runner addendum) prints "audit due (N ≥ threshold)" on the
`build`/`review` beat.

- *Honesty label:* inject-class — an advisory **print**, never a red tool (making it red
  would block every build until an audit, absurd — see "can never block" above).
- *Cons:* it runs in the **Builder/Reviewer** sub-agent context, not the orchestrator's,
  so the role that sees it is not the one that offers the audit; it prints on **every**
  build (noisy); and it still relies on the orchestrator to notice and relay. Weaker
  audience than M1 for the same cost.

**(M3) Claude-only inject hook.**
The existing `UserPromptSubmit` hook reads the anchor + git tags and injects "audit due".

- *Cons:* **platform-asymmetric in the wrong direction** — inject is dropped on OpenCode
  (5.17.7, `chat.message` crashed opencode 1.17.8), so this restores the nudge *only on
  Claude*, exactly where the persona floor is already strongest (Claude resolves the actor
  and keeps more mechanical teeth). It also needs the hook to read project git state,
  which it does not today. **Rejected** as the primary answer — same conclusion as F5-2 in
  the persona-floor doc: it re-creates parity debt the epic is closing.

---

## Recommendation

**Default: stay `[persona]` (anchor (d), no mechanism).** Given the F5-1 safety frame and
5.23.0's fail-safe-to-offer, a mechanical backstop buys **modest timeliness and zero
safety**, at the cost of either a convention change (anchor a) or a new step + mechanism.
The proportionate answer is to record that the cadence is *honestly* `[persona]`, its
safety is held elsewhere (merge-gate + branch protection), and 5.23.0 already removed the
silent-drift failure. This needs no build.

**IF the Operator wants the cadence surfaced model-independently** (the one real new
property — the Operator, not the model, sees "audit due"), the proportionate build is the
**minimal, convention-preserving pair**:

- **Anchor (b)** — an annotated `audit/<date>` tag pushed at audit close. No new committed
  state-file convention; fits "derive from git".
- **Surface (M1)** — a non-failing CI advisory annotation keyed on that tag.
- **Honesty label, load-bearing:** this makes the cadence **mechanically SURFACED, never
  mechanically enforced**. The audit cadence stays a `[persona]` *decision to act*; only
  its *visibility* becomes mechanical. Selling this as "the audit cadence is now
  mechanical" would be a review-blocking honesty over-claim (`PROTOCOL.md` `## Role
  contracts`). It is an inject-class nudge — it never blocks a ship.

**Rejected:** committed `.ai-dev/last-audit` (anchor a — needless convention change for a
non-safety nudge); the quality-runner print (M2 — wrong audience, noisy); the Claude-only
inject hook (M3 — platform-asymmetric, deepens parity debt).

---

## Forks the Operator must decide

1. **Build at all, or stay persona?** *Recommended: stay `[persona]` (d)* — record the
   honest posture, build nothing; the safety floor is already model-independent and
   5.23.0 removed the silent-drift failure. Choose to build **only** if surfacing the
   cadence *to the Operator, regardless of the model* is judged worth a small mechanism.
2. **The durable anchor (the convention fork — this one is squarely the Operator's).** IF
   building: an `audit/<date>` annotated **git tag** (b, *recommended* — no convention
   change) vs a committed **`.ai-dev/last-audit` file** (a — changes the local-only-state
   convention) vs a **commit-trailer/CHANGELOG** marker (c — brittle, no natural carrier
   commit).
3. **The surface.** IF building: a **CI advisory annotation** (M1, *recommended* —
   model/platform/plugin-independent, surfaced to the Operator) vs a **quality-runner
   print** (M2 — wrong audience) vs a **Claude-only inject hook** (M3 — rejected, parity
   debt).

Whatever is chosen, the honesty label is fixed: **inject-class — it surfaces the cadence,
it does not enforce it.** The cadence cannot become a hard gate without breaking what an
audit *is*.

---

## Sources

- Internal: `docs/decisions/persona-floor-external-substitute.md` (F5-1 posture: audit is
  a quality sweep, safety floor is merge-gate + branch protection; F5-2 Claude-only inject
  parked); `orchestrator.md` `## Audit` (5.23.0 derivable + fail-safe-to-offer cadence) and
  `## Your seat` (pointer marker as a recoverable cache); `PROTOCOL.md` `## Enforcement`
  (the inject-class: nudges, never blocks) and `## Role contracts` (over-claim = blocking
  honesty failure); `.gitignore` (`.ai-dev/state/` local-only since 5.5.0);
  `.github/workflows/checks.yml` (the `quality` job an advisory step would ride);
  `src/quality/tools.json` (the registry an M2 row would land in); CHANGELOG 5.23.0 (the
  "mechanical cadence backstop remains deferred research" note this doc answers).
- GitHub Actions workflow annotations (`::notice::` / `continue-on-error`) as a
  non-failing PR surface — standard Actions behaviour, model-independent (confidence:
  high; the same forge layer branch protection already relies on).
