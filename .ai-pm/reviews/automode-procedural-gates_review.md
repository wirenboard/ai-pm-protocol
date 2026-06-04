# automode-procedural-gates — plan compliance review

Meta-feature on the template repo. **Software-kind**, no-user-facing-contract exception: every scenario subject is the orchestrator / `### Decision authority` engine / `WORKFLOW.md` / `/pm-plan` / `/pm-bootstrap` / `pm-plan-checker` (non-human). **No Product Contract touched.** No `## Validation` gate (software-kind) — Pass-2 is `code-review`. Verification = editorial + clean-grep; `tests/hooks.sh` 71/71 green.

Plan-completeness: "Existing behaviors this feature touches" present; no stack-notes component touched (prose-spec only); Interaction scenarios section present with `Provably isolated:` declaration; Contracts = None (justified exception); Out of scope lists each sibling with a reason. No threat-model surface touched (`### Decision authority` is not in `### Security-relevant surfaces`). Plan is complete.

## Plan compliance
- ✓ **sc1 — the general procedural-vs-product-fork rule (single new rule).** `WORKFLOW.md` `### Decision authority` "Procedural-gate progression" subsection: classifies each PM-touch by the one dividing line "does it decide what the user gets?" → No ⇒ procedural checkpoint (announce-and-proceed); Yes ⇒ product fork (derivability test, unchanged); merge/ship manual both scopes. Lives once in the single source.
- ✓ **sc2 — feature-selection (idle + bootstrap), two entry points.** `WORKFLOW.md` named instance 1; `pm-bootstrap.md` autonomous first-feature branch; idle-after-merge pacing stated; "sequences PM-authored candidates, never invents direction" present.
- ✓ **sc3 — plan-approval → announce-and-proceed.** `pm-plan.md` Handoff autonomous branch; explicitly states the advocate gate + `pm-plan-checker` STILL run (does not skip the genuine-fork checks).
- ✓ **sc4 — optional/offer gates auto-decided + announced.** `pm-plan.md` carries all four autonomous branches: Architect check, Retrospective/audit nudge, pending-migration nudges, Product Contract / contract-existence check.
- ✓ **sc5 — canon-derived, escalate only when undecidable.** Three escalation conditions (empty backlog / no derivable tiebreak / high-stakes-irreversible); "absence of a derivable tiebreak, NOT absence of a formal rank" wording present; empty escalation set ⇒ fully silent.
- ✓ **sc6 — recorded, no new artifact, presence backstop.** `Source:` provenance line extended in place (`pm-plan.md`); state-file note; `pm-plan-checker` selection-citation backstop present (shape-not-meaning).
- ✓ **sc7 — interactive byte-unchanged; graded extension, additive.** `pm-plan.md` + `pm-bootstrap.md` diffs are purely additive (zero removed lines); "no new enum value / no new default / no migration" stated; interactive prompts intact.

Verification of the load-bearing invariants the PM flagged:
- ✓ **Single-source rule holds.** The procedural-gate rule body (the enum classification, the dividing line, the escalation conditions) lives ONCE in `### Decision authority`. The dividing line string "does it decide what the user gets?" appears only in `WORKFLOW.md` (single source) and `doc/architecture.md` (the decision record, which captures what/why and references the subsection by name). Consumers (`pm-plan.md`, `pm-bootstrap.md`) reference `### Decision authority` in `WORKFLOW.md` by name in every new branch (7 / 3 references) and re-encode neither the enum nor the `absent file OR unrecognized ⇒ interactive` default — that default string appears only in the single source. The single-source consumer list was correctly extended to include the Step 6 idle-after-merge transition.
- ✓ **Advocate product-fork flow (Step 3.5) byte-unchanged.** The Product-readiness gate section body and the Step 3.5 advocate prose are not modified. Plan-approval auto-proceed (sc3) explicitly runs the advocate gate as part of proceeding, not skips it — stated in both `pm-plan.md` Handoff branch and `WORKFLOW.md`/`architecture.md`.
- ✓ **Interactive-path wording byte-unchanged.** `pm-plan.md` and `pm-bootstrap.md` have zero removed/modified lines (purely additive). Each new branch is gated to `autonomous` effective authority.
- ✓ **Dividing line present** in `WORKFLOW.md` (×2) and the decision record.
- ✓ **Merge-manual invariant intact.** "Merge/ship stays manual in BOTH scopes" unchanged; the rider's "merge/ship stays manual in both scopes" clause survives in the `+` side (the rider was modified only by APPENDING the procedural-gate sentence). The autonomous selection slots at the idle-after-merge point, never inside the Step 6 ship gate.
- ✓ **`selected autonomously` → `source:` backstop present and shape-not-meaning.** `pm-plan-checker.md` carries the presence-keyed assertion; it explicitly states "**never** judge whether the cited source truly justifies the pick (the PM owns that at plan review)" — no over-reach into meaning, mirroring the `auto`-entry citation guard.

Categorical coverage: the `autonomous | interactive` authority set — `autonomous` fully covered; `interactive` declared Out of scope (byte-unchanged) with reason. Complete.

Interaction scenarios: `Provably isolated` (prose-spec, no runtime / shared state / concurrency / I/O) — no concurrent-state test required; coupling covered by Scenarios 1–7 and clean-grep.

## Definition of Done
- [x] All plan scenarios implemented and tested (editorial + clean-grep per the repo's "validation by use" discipline; sc1–7 all land)
- [x] Interaction scenarios have concurrent-state tests (n/a — provably isolated, declared)
- [x] Stack expectations respected; stack-spec tests pass (n/a — no stack component touched)
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change (n/a — no Product Contract touched; backend/meta feature)
- [x] Pipeline green (`tests/hooks.sh` 71/71)
- [x] State file updated (`.ai-pm/state/current.md` — both slices recorded)
- [x] Product Impact Report present (n/a — no contract touched)
- [x] Docs updates landed (`WORKFLOW.md` `### Decision authority` + Step 6 + rider; `pm-plan.md`; `pm-bootstrap.md`; `pm-plan-checker.md`; `doc/architecture.md` decision record — all listed docs present in branch)
- [x] Expected artifacts exist (plan `doc/features/automode-procedural-gates_plan.md`, this review; no contract required — non-user-facing)
- [n/a] Product-readiness gate resolved (non-user-facing — every scenario subject is the system/engine/command; exempt, no advocate artifact required)
- [n/a] Validation gate resolved (software-kind — no `## Validation` section)

**DoD: pass**

## Blocking
(none)

## Notes (product)
(none — scope matches the plan exactly; no scope expansion. No wire-token structural-note triggers: no Product Contract PM-facing sections touched.)

## Verdict
approve

## Code review findings
Prose-spec diff. Focused fan-out (spec-consistency + cross-doc-coherence). Five real spec-correctness findings (for pm-coder, command/agent files) + one for pm-architect + two observations.

**For pm-coder (command/agent files):**
1. **`Source:` line framed as pre-existing but it is NEW (`pm-plan.md` plan-format header; echoed in `WORKFLOW.md` `### Decision authority` + `pm-plan-checker.md`).** `main` has no plan-level `Source:` provenance line (only inline `Source: <URL>` under "Stack expectations touched"). This feature INTRODUCES the plan-level `Source:` line, but the wording says "the **existing** `Source:` provenance line (**extended in place**)". Wrong — a maintainer assumes every legacy plan already carries it. **Fix:** reword to "the plan's `Source:` provenance line (the plan-level provenance line **defined by this feature** in the plan format)"; drop "existing"/"extended in place" in `pm-plan.md`, `WORKFLOW.md`, and `pm-plan-checker.md`. (architecture.md's copy is pm-architect's — handled separately.)
2. **Retrospective autonomous branch omits the never-audited nudge (`pm-plan.md` Retrospective check).** The branch auto-decides only the "5-since-last threshold" case; the section's *second* trigger (no audit ever run) falls back to the interactive relay, contradicting the rider's "the retrospective/audit nudge is auto-decided, not relayed." **Fix:** broaden the autonomous branch to cover BOTH audit nudges (5-since-last AND never-audited).
3. **`pm-bootstrap.md` "Do NOT start planning a feature until PM explicitly asks" is unscoped** and read-order-contradicts the new autonomous first-feature branch beside it. **Fix:** scope the blanket directive to interactive mode (or add an explicit "(autonomous: see the branch below)" pointer).
4. **`pm-plan.md` migration nudges: trailing "Don't implement fixes, don't block planning. PM decides." is unscoped** and contradicts the new autonomous migration branch (orchestrator runs the migration). **Fix:** scope "PM decides" to interactive / note the autonomous exception.
5. **`WORKFLOW.md` Step 6 idle branch re-encodes the "has open items" escalation condition** instead of deferring wholesale — a single-source nibble (`### Decision authority` already owns the empty-backlog escalation). **Fix:** defer wholesale ("per `### Decision authority`") without restating the open-items precondition.

**For pm-architect (`doc/architecture.md` + arch note):**
6. The decision record's `Source:`-line description ("its existing `Source:` provenance line (extended in place)") carries the same inaccuracy as #1 — reword to the plan-level-provenance-line-defined-here framing. Also sync the arch note title (`# automode-feature-selection — design notes` → procedural-gates) left over from the rename.

**Observations (no fix needed):** state file staleness (orchestrator advances it); CHANGELOG/version bump deferred to pr-prep.

Verified clean: plan-approval auto-proceed does NOT skip the advocate gate / plan-checker; the `selected autonomously`→`source:` backstop is presence-only (no over-reach); merge-manual intact; advocate Step 3.5 byte-unchanged; interactive wording additive; cited commit hashes valid.

## Code review: 2026-06-04 — passed

All six findings fixed in-pass, routed through owners (edit-ownership discipline): findings 1–5 by pm-coder (`69fd859` — `Source:`-line-is-new reword in `pm-plan.md`/`WORKFLOW.md`; retrospective branch covers both audit triggers; `pm-bootstrap.md` "Do NOT plan" scoped to interactive; migration "PM decides" scoped to interactive; Step-6 idle defers wholesale to `### Decision authority`); finding 6 by pm-architect (`be10363` — `Source:`-line reword in the decision record + arch-note title sync). `pm-plan-checker.md` needed no change (already correctly worded). `tests/hooks.sh` 71/71 after fixes; no residual "extended in place" / "existing `Source:`" wording. Observations (state staleness, CHANGELOG/version) handled by the orchestrator / pr-prep.
