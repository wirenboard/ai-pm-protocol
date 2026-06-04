# nfr-operational-limits-prompt — plan compliance review

Scope: meta-feature on the no-user-facing-contract template repo (software-kind exception). Backend/meta only — **no Product Contract touched** (every scenario subject is `/pm-plan` / the planner / `pm-architect` / a template — non-human). No `## Validation` gate (software-kind; Pass-2 is `code-review`). No automated tests by design; verification is editorial + clean-grep, `tests/hooks.sh` 71/71.

## Plan completeness
- ✓ No "Stack expectations touched" section needed — plan touches no `docs/stack-notes.md` stack component (prose-spec change).
- ✓ "Interaction scenarios" — present with an explicit `Provably isolated:` declaration (prose-spec, no runtime/shared state). Valid.
- ✓ Not a `hotfix-` topic. Non-security project for *this* repo's own surfaces; no threat-model obligation.
- ✓ Categorical coverage — the NFR class is scoped to "resource footprint + scale/capacity budget" and each excluded sibling (reliability/availability, latency SLOs, security-as-NFR, state/event model) is listed under Out of scope with a one-line reason.

## Plan compliance
- ✓ **Sc1 — scale-bearing feature fires the prompt** — implemented, `pm-plan.md:128–141` (new "NFR / operational-limits check"). Fires on the concrete bounded-count list (devices/endpoints/connections/sessions/subscriptions/messages-per-second/queue depth), re-judged each plan, with the "not any feature touching more than one thing" guard. Verified editorially (no automated test by design).
- ✓ **Sc2 — resource-constrained platform fires (system-level)** — implemented, `pm-plan.md` bullet 2: signal read from the **two named sources only** (`docs/stack-notes.md` / `docs/architecture.md` `## Architectural constraints`); explicitly fires for the system's budget even when the feature is not scale-bearing.
- ✓ **Sc3 — neither holds → silent/proportional** — implemented, `pm-plan.md`: "If **neither** holds — the check is **silent** … proportional, never blanket-mandatory on every tiny project"; no hook, no mandatory plan section, paralleled to the Security-surface check.
- ✓ **Sc4 — user-facing limits → Product Contract `## Must not break`** — implemented two-sided: `pm-plan.md` routes user-facing limits to the contract as a **product question** per the existing product-vs-technical rule; `contract.md.tmpl:32–33` gains the one note line ("A quantified user-facing limit belongs here") pointing the engineering bound to the architecture section.
- ✓ **Sc5 — resource budgets → conditional `## Operational limits & budgets`** — implemented: new conditional section in `architecture.md.tmpl` (beside `## Architectural constraints`, `N/A`-default, `[?]`-not-invented, engineering-bounds-only with user-facing pointer); `pm-plan.md` references it **by name** without re-encoding; owned by `pm-architect` on the post-coding handoff.
- ✓ **Sc6 — structural/proportional, additive, no migration** — implemented: judgement not regex (no hook), records into existing-owner homes (contract + new conditional section), no new mandatory document, no `MIGRATIONS.md`/`CLAUDE.md` change. Confirmed by diff (no migration files touched).

## Audience-split homes — both named
- ✓ User-facing half → Product Contract `## Must not break` (named in `pm-plan.md` + `contract.md.tmpl` note line).
- ✓ Resource half → `docs/architecture.md` `## Operational limits & budgets` (named in `pm-plan.md`, defined in `architecture.md.tmpl`, walked by `pm-architect` A2, recorded in the decision record).

## A4-EXCLUSION load-bearing detail (the one thing to get exact)
- ✓ Correct. `pm-architect.md` A2 (line 62) **adds** `Operational limits & budgets` to the walk-list. A4 (line 64) explicitly **excludes** it: "The cross-check set is exactly these three pairings (File layout ↔ tree, Release flow ↔ CI, Integration contract ↔ README install) … The `Operational limits & budgets` section inherits the same exclusion … A2-walked but **not** added to the cross-check set." The set stays exactly three pairings, mirroring the Behavioral-contract / System-invariants-index exclusions. No self-inflicted A4 finding manufactured on authored budgets.

## Disciplines present
- ✓ Conditional / judgment-triggered (OR of two judgements, no presence shortcut) — `pm-plan.md`.
- ✓ Proportional / silent otherwise — `pm-plan.md`; this repo's own `doc/architecture.md` `## Operational limits & budgets` born `N/A — <reason>` (self-consistency check passes).
- ✓ `[?]`-not-invented — carried verbatim into `pm-plan.md`, `architecture.md.tmpl`, and `pm-architect.md` A2 ("never invent a number" / "a confabulated 'RAM ≤ 64 MB' … worse than `[?]`").
- ✓ No-hard-gate decision matches plan Out-of-scope (line 72) and is recorded in the decision record with the did-it-right slice-4 deferral rationale (incoherent did-it-at-all gate; no non-`N/A` corpus yet).

## Coder's flagged ambiguity — "When you are invoked" trigger list (assessed)
The new section got **no NEW dedicated bullet** in `pm-architect.md`'s "When you are invoked" list; the coder relied on the existing generic bullet "An architectural decision landed via a feature plan and the architecture.md must be updated to reflect it" (line 20) plus the A2 refresh-trigger text.

**Judgement: this satisfies the plan, not a gap.** The plan (line 62) requires the section be added to "the Section A **A2 walk-list** and the Section A **ownership/refresh triggers**, so `pm-architect` authors/refreshes it on the `/pm-plan` 'Docs to update' post-coding handoff (the same trigger as a decision record)." Both are met:
- A2 walk-list — done (line 62).
- Ownership/refresh trigger — the refresh trigger now lives **inside A2** verbatim ("authored or refreshed on the `/pm-plan` 'Docs to update' post-coding handoff (the same trigger as a decision record, when a scale-bearing feature or resource-constrained platform earned the NFR prompt)").

The plan asks for parity with **a decision record**, and a decision record is itself driven by the *generic* "architectural decision landed via a feature plan" trigger — it has no dedicated per-section bullet either. A dedicated bullet would be *more* specific than the precedent the plan names, not less. The handoff path is real and unambiguous (A2 refresh text + the `/pm-plan` "Docs to update" reference). No gap.

## Definition of Done
- [x] All plan scenarios (1–6) implemented and verified (editorial + clean-grep, per the no-automated-test repo discipline)
- [x] Interaction scenarios have concurrent-state tests — n/a, `Provably isolated:` declared and valid
- [x] Stack expectations respected — n/a, no stack component touched
- [x] Product Contract honored — **n/a, no Product Contract touched** (meta-feature, non-user-facing; documented exception)
- [x] Pipeline green — `tests/hooks.sh` 71/71 (no hook touched); editorial + clean-grep verification clean
- [x] State file updated — `.ai-pm/state/current.md` reflects the active task, the four edits, and next step
- [x] Product Impact Report present — n/a (no contract touched)
- [x] Docs updates landed — all 6 "Docs to update" entries present in branch (`pm-plan.md`, `architecture.md.tmpl`, `contract.md.tmpl`, `pm-architect.md`, `doc/architecture.md` decision record + own `N/A` section)
- [x] Expected artifacts exist — plan, arch note, this review (no contract: non-user-facing)
- [ ] n/a — Product-readiness gate (non-user-facing: every scenario subject is the system / planner / agent / template — exempt, no advocate artifact required)
- [ ] n/a — Validation gate (software-kind; no `## Validation` section)

**DoD: pass**

## Blocking
None.

## Notes (product)
None. Scope matches the plan exactly — no scope expansion observed. The audience-split routes the *product-facing* half (user-facing limits → Product Contract `## Must not break` as a PM product question) correctly per the existing product-vs-technical rule; the resource half stays technical. No structural wire-token leaked into a PM-facing contract section (the contract note line routes the engineering bound *out* to the architecture section rather than encoding a grammar in `## User value` / `## Out of scope`).

## Verdict
approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker. -->
## Code review findings
Prose-spec diff (agent-instruction markdown). Focused fan-out: spec-consistency + cross-doc-coherence finders. Four real findings, all **fixed in-pass**:

1. **`pm-architect.md` A2 — antecedent regression.** The new Operational-limits paragraph was spliced between the Behavioral-contract intro and the standalone imperative "**Build its `### System invariants` index by reference.**", re-pointing "its" to the wrong section (Operational limits & budgets has no System-invariants index). **Fix:** moved the Operational-limits paragraph to after the System-invariants index block, restoring the Behavioral-contract → "its index" adjacency.
2. **`pm-plan.md` — resource-constrained branch over-fire.** The system-budget branch had no "already-recorded ⇒ silent" guard; since the platform property is static, the system-budget question would re-fire on every later plan, contradicting proportionality. **Fix:** added a guard — if `## Operational limits & budgets` already carries a quantified budget (not `N/A`/`[?]`), stay silent on the system-budget question and fire only for a *new* scale dimension the feature itself introduces.
3. **`contract.md.tmpl` — `[?]`-not-invented missing at the user-facing-limit home.** The discipline was present at every resource-budget home but not at the contract `## Must not break` note. **Fix:** added "a limit the PM cannot yet quantify is `[?]` — never invent a number" to the contract note.
4. **`doc/architecture.md` + arch note — EPIC-name inconsistency.** The slice-3 record named the EPIC "whole-system-property auditor" while the slice-1/slice-2 records and backlog (lines 69/93/115) all name it "cross-document-consistency auditor" (the slice-2 deferred list even predicts this slice). **Fix (via `pm-architect`, commit `c8ad2b7`):** renamed to "cross-document-consistency auditor, slice 3"; "whole-system-property" kept only as a descriptor for the gap-cluster. All three records now self-consistent.

Verified clean: the A4-exclusion wiring (cross-check set kept at exactly three pairings), the section-name anchoring across template/agents/command, the template placement + born-`N/A`, the cited commit hashes, and this repo's own `## Operational limits & budgets` section as `N/A`. `tests/hooks.sh` 71/71 after the fixes.

## Code review: 2026-06-04 — passed
