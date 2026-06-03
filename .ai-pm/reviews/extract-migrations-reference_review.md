# Plan-compliance review — extract-migrations-reference

Branch: `feature/extract-migrations-reference` (commits `a160021`, `95758e8`)
Reviewed against `doc/features/extract-migrations-reference_plan.md` + `.ai-pm/arch/extract-migrations-reference_arch.md` (Variant B — `MIGRATIONS.md` at protocol root).

This is a pure structural refactor of the protocol's own docs — no behavior change. No `.ai-pm/contracts/` and no `.ai-pm/state/` in this template repo (correct); no Product Contract touched. Only executable test is `tests/hooks.sh`.

## Plan compliance

- ✓ **Scenario 1 — catalogue in one dedicated reference.** The full catalogue (the `### Pending template-upgrade migrations` / `### Pending-migration detection` block + every per-version procedure) lives in `MIGRATIONS.md` (lines 3–104). `grep -rl "Single source for \"this project is on an older template structure"` returns `MIGRATIONS.md` only — exactly one home.
- ✓ **Scenario 2 — short pointer in `pm-bootstrap.md`.** The inline catalogue is replaced by a single pointer at `.claude/commands/pm-bootstrap.md:41` naming `MIGRATIONS.md`; the file dropped ~101 lines. The detect-scenario flow ("Check for pending template-upgrade migrations (below)") now lands on the pointer, which routes to `MIGRATIONS.md`.
- ✓ **Scenario 3 — every live by-name reference re-pointed, no dangling ref.** `grep -rn "Pending-migration detection" .claude` shows every live referrer naming `MIGRATIONS.md`: `pm-plan.md` (222/227/232/237/242), `pm-audit.md` (84/88/92/96/100), `pm-auditor.md` (38/103/111/113/119/123/126), `pm-plan-checker.md` (53), and the `pm-bootstrap.md:41` pointer. No live file still says "in `pm-bootstrap.md`" for a detection/migration reference.
- ✓ **Scenario 4 — generation procedure stays; cross-refs rewritten.** `## Product map generation procedure` remains in `pm-bootstrap.md` (line 265). Its referrers (pm-audit, pm-architect, pm-auditor, pm-plan, architecture.md) are unchanged — `git diff main...HEAD -- .claude/agents/pm-architect.md` is empty. The 3 cross-references from `MIGRATIONS.md` to the generation procedure (lines 18, 30, 81) were rewritten from "… below" to "… in `pm-bootstrap.md`" and resolve.
- ✓ **Scenario 5 — nothing lost.** Diffing the moved block against its pre-move `pm-bootstrap.md` content shows the only substantive changes are the three planned cross-ref edits (detection self-ref `pm-bootstrap.md`→`MIGRATIONS.md`; two `Product map generation procedure below`→`in pm-bootstrap.md`). All six detection conditions (v2.2, v2.3, old-format-map, README front-gate, pre-English-canonical product.md, token-laden-contract) and all per-version procedures (incl. the contract two-layer worked example, MIGRATIONS.md:85–104) are present verbatim in substance.

## Critical invariants

- ✓ **move-not-copy.** The detection block / catalogue exists in exactly one file (`MIGRATIONS.md`). `pm-bootstrap.md` retains only the pointer — no copy-plus-pointer, no duplication.
- ✓ **no-dangling-refs.** All live referrers name `MIGRATIONS.md`; the cross-file generation refs name `pm-bootstrap.md` and resolve. Historical `doc/features/*_plan.md` references are frozen — the only file changed under `doc/features/` is the new plan itself (`git diff --name-only main...HEAD -- doc/features/`), confirming no historical plan was rewritten.
- ✓ **section names preserved.** `### Pending template-upgrade migrations` and `### Pending-migration detection` headers kept exactly in `MIGRATIONS.md` (lines 3, 7) — the by-name refs depend on them.
- ✓ **scope.** No migration condition or step changed (relocation only); `doc/architecture.md` records the decision (new `###` subsection) and the File-layout row for `MIGRATIONS.md`.

## Definition of Done

- [x] All plan scenarios implemented and tested (review/grep checks per the meta-infrastructure test plan — no automated doc-structure harness, as the plan states)
- [x] Interaction scenarios have concurrent-state coverage — N/A as concurrent code; all four interaction scenarios (nudge-resolve, condition-eval-resolve, cross-file-ref-resolve, downstream re-bootstrap) verified by reference resolution in review
- [x] Stack expectations respected; stack-spec tests pass — none touched (no tracked stack component)
- [x] Product Contract honored — no Product Contract touched (template/meta refactor; no `.ai-pm/contracts/` in this repo)
- [x] Pipeline green — `bash tests/hooks.sh` → 71/71
- [x] State file updated — N/A (no `.ai-pm/state/` in this template repo)
- [x] Product Impact Report present — N/A (no contract touched)
- [x] Docs updates landed — `MIGRATIONS.md` (new), `pm-bootstrap.md` (pointer + generation stays), `pm-plan.md`, `pm-audit.md`, `pm-auditor.md`, `pm-plan-checker.md` (re-pointed), `doc/architecture.md` (decision + File-layout row) all present in the branch
- [x] Expected artifacts exist — plan (`doc/features/extract-migrations-reference_plan.md`), arch note, this review; no contract required (not user-facing)

**DoD: pass**

## Blocking

None.

## Notes (product)

None. The relocation is faithful: no detection condition or migration step was altered, the single-source-of-conditions invariant is preserved (just relocated to `MIGRATIONS.md`), and the generation procedure deliberately stays in `pm-bootstrap.md` per the Out-of-scope decision.

## Verdict

approve
