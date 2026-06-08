# Pass-1 plan-compliance review — opencode-compact-reviewer SLICE C (ultra removal + sweep-fallback rewrite)

Scope checked: plan pieces **2** (whole-codebase sweep fallback → compact reviewer, not ultra) and **3** (remove `ultra` everywhere). Pieces 1/4/5 already shipped+merged on `feature/opencode-harness-support` — out of this branch, not reviewed.
Diff: `git diff feature/opencode-harness-support...HEAD` (commits `901f505`, `c9f5811`).
Arch-note spec: `.ai-pm/arch/opencode-compact-reviewer_arch.md` part (c).

## Plan compliance

Piece 3 — `ultra` removed as a review LEVEL from the live-instruction surface:
- ✓ `workflow/review-typology.md` — depth ranges `low→ultra` → `low→high` / `low→max`; engine-selection block rewritten harness-neutral; `### Cross-model review` no-orchestrator `(a) ultra vs (b) built-in` fork collapsed to one pinnable whole-tree path; per-review-announce ultra case + "ultra is the one non-pinnable path" carve-outs removed; seam scope-boundary "ultra depth" → "heaviest depth".
- ✓ `workflow/roster.md` — "use `ultra` level…" sentence dropped; `/pm-audit` "optional `code-review ultra`" → "optional whole-codebase quality sweep"; engine line restated neutrally by reference to `### Review typology`.
- ✓ `src/commands/pm-audit.body.md` — depth menus + selectable-depth list ultra-free (`low/medium/high/max`); no-orchestrator offer collapsed to the single pinnable per-diff-engine-over-the-whole-tree fallback; "no hard-wired ultra" / "non-pinnable path" / "full-tree ultra sweep" prose removed.
- ✓ Regenerated `.claude/commands/pm-audit.md`, `.opencode/command/pm-audit.md`, `.golden/claude/commands/pm-audit.md` (+ `SHA256SUMS`) — byte-identical to the source change; generator 4/4 confirms.
- ✓ `README.md` — `### Выбор движка ревью` fallback sentence rewritten; ultra gone.
- ✓ No dangling/broken cross-reference: scan of `workflow/ src/commands/ src/manifests .claude .opencode .golden README.md AGENTS.md` for whole-word `ultra` is **empty**. No pointer left to a now-deleted "ultra" path.

Piece 2 — sweep-fallback rule, single-sourced + referenced:
- ✓ Single source in `workflow/review-typology.md` engine-selection block: orchestrator preferred when installed (and `WB_REVIEW_ORCHESTRATOR` ≠ `off`); else the per-diff review engine run over the whole tree (compact reviewer on OpenCode / built-in `code-review` on Claude) — explicitly NOT ultra. Orchestrator stays preferred when present.
- ✓ `pm-audit.body.md` references the rule by name and does not re-encode the engine list divergently ("fall back to the per-diff review engine … run over the whole tree at the selected depth").

Arch-note part (c) conformance + harness-neutrality:
- ✓ Engine prose matches arch part (c): per-diff = compact reviewer where no built-in / built-in where one exists; whole-tree fallback = the same per-diff engine; `### Cross-model review` fork collapse done as the note prescribes.
- ✓ `tests/neutral-prose.sh` 5/5 — no harness-specific noun introduced without its neutral form in shared prose.

`tests/ultra-absent.sh`:
- ✓ Present, scoped to git-tracked `workflow/ src/commands/ .claude .opencode .golden README.md` (excludes CHANGELOG history, `doc/`, `.ai-pm/`, untracked `node_modules`).
- ✓ Non-vacuous: `ultra-reintroduction-trips-guard` injects `code-review ultra` into a scratch file and asserts the whole-word scan trips. Both checks PASS (2/2).

Out of scope respected:
- ✓ `doc/architecture.md`, historical `doc/features/*_plan.md`, analysis docs untouched (diff name-list empty for `doc/`). Remaining `ultra` mentions live only in those historical/analysis docs — the expected post-coding `pm-architect` decision-record handoff, NOT a gap.

README language:
- ✓ Stayed Russian and coherent; heading + surrounding cross-model section intact.

Golden:
- ✓ Claude golden byte-identical except the legitimate pm-audit prose change (generator 4/4, fingerprint matches `SHA256SUMS`, regeneration leaves tree diff-clean).

## Definition of Done
- [x] All plan scenarios (pieces 2+3) implemented and tested
- [x] Interaction scenarios have concurrent-state tests — n/a (config/prose generation, no shared-state/async surface; arch note "no subscription/feedback-loop class")
- [x] Stack expectations respected; stack-spec tests pass — n/a (no `Stack expectations touched`; markdown-prose protocol surface)
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change — the user here is the LLM/agent; engine-selection behavior change is intended + reflected in the canonical workflow prose. No PM-facing product contract regressed.
- [x] Pipeline green — generator 4/4, opencode 33/33 (+plugin-unit 39/39), ultra-absent 2/2, hooks 79/79, neutral-prose 5/5
- [x] State file updated (`.ai-pm/state/current.md`)
- [x] Product Impact Report present — n/a (no `.ai-pm/contracts/` product contract touched by this slice)
- [x] Docs updates landed — the workflow/roster/README/pm-audit edits the plan lists for pieces 2+3 are all in this branch; `doc/architecture.md` decision record is the explicitly-deferred post-coding pm-architect handoff (per plan "Docs to update" + Out of scope), not due in this slice
- [x] Expected artifacts exist (plan, this review; no new user-facing feature → no new contract)
- [n/a] Product-readiness gate — non-user-facing (every scenario subject is the protocol / engine / sweep, not a human role)
- [n/a] Validation gate — `software`-kind project (CLAUDE.md `## Project kind: software`)
- [n/a] Failure-inventory negative-space tests — plan lists no failure-inventory scenarios

**DoD: pass**

## Blocking
None.

## Notes (product)
None. Diff is tightly scoped to pieces 2+3; every hunk is traceable to the ultra-removal / fallback-rewrite. No cosmetic/whitespace noise, no wire-token leakage into PM-facing prose (the engine grammar lives in `### Review typology`, referenced by name).

## Verdict
approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker. -->
## Code review findings
Pass-2 `code-review` (slice C; base `feature/opencode-harness-support`). Diff is prose (ultra removal + engine-selection rewrite) + one new shell test. 3 real findings, all confirmed against the files:

1. **(prose) `workflow/review-typology.md:10` depth-ladder inconsistency** — the smell/hygiene type's depth was rewritten `low→high`, but the engine-selection rule (`:17`), the #211 split (`:24`), and the runner `pm-audit.body.md` menu (`low/medium/high/max`) all say `low→max`. Original was `low→ultra`; line 10 was downgraded one notch too far, dropping `max` from the canonical type registry while its runner still offers it.
2. **(test, false-pass risk) `tests/ultra-absent.sh` `scan_ultra()`** — `git ls-files -z … | xargs -0 grep` with no `--no-run-if-empty`: GNU xargs runs grep once even on EMPTY input → grep reads inherited stdin instead of the surface → vacuous PASS if the scoped paths ever yield no tracked files.
3. **(test, weak guard) `tests/ultra-absent.sh` self-check** — the non-vacuousness check grepped a scratch file directly, never exercising the real `scan_ultra()` plumbing, so finding 2 (and any future plumbing defect) was invisible to it.

Out-of-scope note (not a slice-C defect): `doc/architecture.md` still carries 4 `ultra` mentions — correctly deferred to the post-coding pm-architect decision-record handoff.

## Code review: FIXED — `3d3c319`
All 3 fixed by `pm-coder`, smallest faithful change each: (1) `:10` `low→high` → `low→max` (confirmed no other `low→high`/`low→ultra` depth ladder remains); (2) `scan_ultra()` now hard-FAILS (rc 2 → FAIL) when the scoped surface yields zero tracked files, plus `--no-run-if-empty` as a defensive stdin-leak stop, `-z`/`-0` pairing preserved (counts emptiness via `git ls-files | wc -l`, not by storing the NUL stream); (3) the self-check rewritten to inject an `ultra` review-level phrase into a tracked in-scope file, run the REAL `scan_ultra()`, assert it catches the injection, restore via `git checkout` under an EXIT trap — coder verified it goes red when `scan_ultra()` is sabotaged. Re-verified independently: ultra-absent 2/2, generator 4/4 (Claude byte-identical), neutral-prose 5/5, opencode 33/33, hooks 79/79, plugin-unit 39/39, targeted-reading 7/7.

## Verdict (Pass 2): approve
