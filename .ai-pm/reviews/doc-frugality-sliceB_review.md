## Plan compliance

- ✓ **Scenario 5** — `code-review` surfaces doc-frugality + comment-restraint findings — implemented in `src/manifests/opencode/harness_local/body/code-review.body.md` (the `documentation` aspect extended to list: over-commenting, what-not-why, trivial docstrings, inline rule-ID citations, buried-lede, inline-provenance). References the named rules in `workflow/doc-style.md` by section anchor (`### Comment-restraint`, `### Fact-first / BLUF`, `### Provenance = one-line pointer`, `### Current-state-only`). Does not redefine them. Harness-neutral (no harness-specific syntax in body). OpenCode adapter regenerated; Claude golden untouched for code-review (no `.claude/` code-review file exists — correct). Test at `tests/doc-style.sh` (`code-review-frugality-aspect` + `code-review-frugality-nonvacuous`).
- ✓ **Scenario 6** — `pm-plan-checker` blocks standing-doc plans that violate a hard-cap — implemented in `src/agents/pm-plan-checker.body.md` (`### Standing-doc hard-cap (blocking)` section). Lists exactly the four enforceable caps from `### Numbers = targets, not gates` in `workflow/doc-style.md`, referenced by name. Explicitly states soft smells are NOT blocks (`do NOT turn the soft smells … into blocks here`). Test at `tests/doc-style.sh` (`plan-checker-hardcaps` + `plan-checker-hardcaps-nonvacuous`).

### Single-home / no-drift checks

- code-review body references the four rule sections by name (`### Comment-restraint`, `### Fact-first / BLUF`, `### Provenance = one-line pointer`, `### Current-state-only`) with the explicit instruction "reference them, do not redefine them here". No frugality rules are restated.
- pm-plan-checker body references `### Numbers = targets, not gates` in `workflow/doc-style.md` by name. Does not restate the caps as its own rule; the four bullets are a verbatim transcription required to make the check mechanical, not a second definition. The instruction "do not re-encode the rule" is present. The word `comment-restraint` appears exactly once in the file, in an unrelated `provenance`-context — no drift.

### Test non-vacuity

- `code-review-frugality-nonvacuous`: strips the sentinel sentence containing `Doc-frugality + comment-restraint` and asserts "trivial docstring" no longer appears (the phrase exists only in the new sentence). Confirmed non-vacuous.
- `plan-checker-hardcaps-nonvacuous`: strips the `### Standing-doc hard-cap` heading and asserts it is absent in the stripped copy. All four cap values (`120`, `2 screens`, `7 entries`, `quality-goals`) exist only within that section — stripping the heading section removes them. Confirmed non-vacuous (the greps for individual cap values would trip on a stripped file; the single non-vacuity probe on the heading is sufficient because the caps are exclusive to that block).

### Adapter / golden parity

- `.opencode/agent/code-review.md` — regenerated (OpenCode only, no `.claude/` counterpart). Correct per plan.
- `.opencode/agent/pm-plan-checker.md` — regenerated.
- `.claude/agents/pm-plan-checker.md` — regenerated.
- `.golden/claude/agents/pm-plan-checker.md` — re-frozen (byte-identical to regenerated `.claude/agents/pm-plan-checker.md`).
- `.golden/claude/SHA256SUMS` — updated for pm-plan-checker only.
- All other golden files byte-identical (confirmed: `generator.sh` 4/4).

## Definition of Done

- [x] All plan scenarios implemented and tested — Scenarios 5 and 6 implemented; `tests/doc-style.sh` 12/12 (was 8; added `code-review-frugality-aspect`, `code-review-frugality-nonvacuous`, `plan-checker-hardcaps`, `plan-checker-hardcaps-nonvacuous`).
- [x] Interaction scenarios have concurrent-state tests — the Slice B interaction scenario (code-review + plan-checker enforce frugality while doc-style.md is the single home) is validated by the single-home checks and no-drift tests (existing `doc-style-vs-legibility-distinct`, `comment-restraint-no-drift`); no new concurrent-state scenario was added in Slice B.
- [x] Stack expectations respected; stack-spec tests pass — generator 4/4; golden byte-identical for unchanged inputs; `tests/generator.sh` green.
- [x] Product Contract honored — no Product Contract exists (plan explicitly declares non-user-facing, advocate exempt).
- [x] Pipeline green — all 9 suites green: doc-style 12/12, generator 4/4, opencode 41/41, oc-plugin-unit 74/74, hooks 79/79, neutral-prose 5/5, targeted-reading 7/7, ultra-absent 2/2, core-delegation 2/2.
- [x] State file updated — `.ai-pm/state/current.md` carries the Slice B built record (commit `914a157`).
- [x] Product Impact Report present — n/a (non-user-facing; no contract touched).
- [x] Docs updates landed — no additional docs updates were listed in the plan for Slice B specifically (the plan's "Docs to update" items belong to Slices A/D/E, all either already landed or future).
- [x] Expected artifacts exist — plan `doc/features/doc-frugality_plan.md` exists; this review is being written; no contract required.
- [n/a] Product-readiness gate resolved — non-user-facing feature; advocate artifact not required (plan § Contracts confirms this).
- [n/a] Validation gate resolved — software-kind project; `## Validation` section not applicable.
- [n/a] Failure-inventory negative-space tests — the plan has no failure-inventory scenarios for Slice B (no external I/O failure modes listed as Slice B scenarios).

**DoD: pass**

## Blocking

None.

## Notes (product)

1. **Plan-checker non-vacuity is heading-keyed, not value-keyed.** The `plan-checker-hardcaps-nonvacuous` test proves the `### Standing-doc hard-cap` heading is removable, and relies on the fact that all four cap values live exclusively in that section. This is correct today. If a future change reuses any of those bare strings elsewhere in the file (e.g. `120` for a different limit, `quality-goals` in another context), the non-vacuity shield would weaken silently. A value-keyed non-vacuity probe (one per cap) would be more durable — worth considering at the next Slice B touch. Non-blocking: the current design is sound for the file as it stands and the Slice B scope is complete.

## Verdict

approve

## Code review findings

Pass-2 code-review (high, recall-biased) run 2026-06-09 over the Slice B diff. Two real findings; both fixed.

1. **`src/agents/pm-plan-checker.body.md` — single-home drift (CONFIRMED).** The `### Standing-doc hard-cap` section re-encoded the four numeric thresholds (≤120 / ≤~2 screens / ≤7 / ≤5) inline while instructing "reference by name; do not re-encode" — a self-contradiction and a duplicate of the authoritative numbers in `workflow/doc-style.md` `### Numbers = targets, not gates` (drift risk). **Fixed `763d332`** — inline numbers dropped; the four caps are named by subject and the checker applies the thresholds as defined in `### Numbers = targets, not gates` (read on demand → live values, zero drift). Soft-smells-stay-non-blocking preserved.
2. **`tests/doc-style.sh` — vacuous / weak non-vacuity (CONFIRMED).** `code-review-frugality-nonvacuous` stripped a sentinel that shared its line with the requirement tokens (proved nothing); `plan-checker-hardcaps-nonvacuous` was heading-keyed (would go stale after fix 1 removed the numbers). **Fixed `7b27f5a`** — both re-keyed to the substantive content (the actionable frugality tokens / the cap-subject names + the `### Numbers` reference); verified each now genuinely trips (production presence test FAILS when the shipped guidance is broken, restored to PASS).

Post-fix suites all green: doc-style 12/12, generator 4/4, neutral-prose 5/5, opencode 41/41, oc-plugin-unit 74/74, hooks 79/79, core-delegation 2/2, targeted-reading 7/7, ultra-absent 2/2.

## Code review: 2026-06-09 — passed
<!-- The orchestrator replaces THIS WHOLE LINE with `## Code review: <date> — passed`
     only when code-review clears. Until then the section is UNSTAMPED: `pm-pr-prep`
     refuses to release it (step 0) and `pm-auditor` blocks on it (dimension 1).
     Never ship an empty `## Code review` heading — an empty section reads as
     "no findings / passed" to a quick eye or grep; `NOT YET RUN` reads as "not done". -->
