# optimize-without-losing-rigor — review v2 (re-check)

Narrow re-check of the two fix commits applied after v1 (`b176c1c fix(optimize): close DoD item 7 — three stale dim-11 mentions + arch.md updates + matrix typo`, `44a180d fix(architecture): add missing decisions entry for the 4 optimizations`). Plan: `doc/features/optimize-without-losing-rigor_plan.md`. v1 review: `doc/features/optimize-without-losing-rigor_review.md`. Branch tip: `44a180d` on `feature/optimize-without-losing-rigor`. Hooks pipeline re-run: `bash tests/hooks.sh` → 44/44 PASS.

## v1 finding closure check

Each v1 fix is verified by reading the live file at the cited location:

1. **README.md:108 — `dim 11` → `dim 1`.** Closed. Current line 108 reads `…drift между контрактом и кодом ловится auditor'ом dim 1 (Plan & Contract compliance).` The added qualifier `(Plan & Contract compliance)` matches the new dim-1 label exactly.
2. **README.md:122 — `dim 11` → `dim 1`.** Closed. Current line 122 reads `Reviewer dim 1 блокирует PR, в котором поведение изменилось, но контракт не обновлён. Auditor dim 1 ловит дрейф контракта от кода в проекте в целом.` Both occurrences updated in a single sentence.
3. **doc/architecture.md:78 — `dimension 11` → `dimension 1`.** Closed. Current line 78 reads `…reviewer verifies the diff against the contract (dimension 1, Plan & Contract compliance)…`. Phrasing aligns with the new reviewer rubric.
4. **doc/architecture.md File layout — `Four` → `Five` slash-commands.** Closed. Current line 121 reads `| `.claude/commands/` | Five slash-command procedures (`audit`, `bootstrap`, `fixup`, `plan-feature`, `research`). |`. Count and roster both updated; `fixup` inserted in alphabetical order.
5. **doc/architecture.md Architectural decisions — new entry "Eight review dimensions, decision matrix, trivial fast path, audit scope".** Closed. The entry is at lines 86–94, placed between "Definition of Done as an explicit reviewer subsection" and the next `---` divider, before "## Architectural constraints". The four bullets correspond 1:1 to the four scenarios in the plan (dim merge, decision matrix, `/fixup`, audit `--scope=diff`). **Source** line cites `doc/features/optimize-without-losing-rigor_plan.md` and the four feature-commit SHAs (`d09ac14`, `e441949`, `d563b02`, `310695d`) — all four resolve in `git log` and match the commits the plan promised.
6. **WORKFLOW.md matrix typo — `1, 2, 4, 6, 7` → `1, 2, 4, 5, 7`.** Closed. Current line 130 reads `| Backend refactor / infrastructure / build / CI | required, update each step | skip with one-line reason in commit message | yes, items 1, 2, 4, 5, 7 | required if stack touched |`. Logic now self-consistent: state required (item 5), Product Impact Report N/A on backend (no item 6).

## Re-applied Definition of Done

- [x] Code changes are within the plan's scope — confirmed; only the six text fixes plus the v1 review file landed since v1.
- [x] Plan's "Stack expectations touched" rules respected — N/A meta-case (no new stack components in the diff); status from v1 unchanged.
- [x] Product Contract (if any) honored — N/A meta-case (template self-edit, no user-visible behavior); explicitly noted, no contract regression introduced by the fixes.
- [x] Tests run; pipeline (test + lint + validators) green — `bash tests/hooks.sh` → 44/44 PASS on the post-fix tree.
- [x] `.ai-pm/state/current.md` updated — N/A meta-case (template repo has no `.ai-pm/state/`); status from v1 unchanged.
- [x] Coder's Product Impact Report present (when contract touched) — N/A meta-case (no contract touched); status from v1 unchanged.
- [x] Docs updates listed in plan are landed in this branch — **now closed.** All three sub-items the v1 review flagged as not landed are present:
  - `doc/architecture.md` File layout: commands count and roster updated to Five (line 121).
  - `doc/architecture.md` Architectural decisions: new entry "Eight review dimensions, decision matrix, trivial fast path, audit scope" present (lines 86–94).
  - `README.md` dim-11 lines and `doc/architecture.md:78` dim-11 reference all updated to dim 1.

**DoD: pass.**

## Blocking

None.

## Notes (product)

(none new — the four v1 product notes either correspond to the items now closed, or were addressed:)
- v1 product notes 1 (`doc/architecture.md:78` dim 11) and 2 (README dim 11 lines) — closed by fix `b176c1c`.
- v1 product note 3 (architecture decisions entry + File layout) — closed by fixes `b176c1c` + `44a180d`.
- v1 product note 4 (WORKFLOW.md backend row item list) — closed by fix `b176c1c` (the "fix now" path was taken).

## Notes (technical)

1. `doc/_templates/contract.md.tmpl:58` — the contract template downstream projects copy still reads `auditor (dimension 11) — flags features with no contract…`. The fix sweep covered README, WORKFLOW, architecture.md, and the agent personas, but the contract template was missed. **Why it matters:** this is template content downstream projects materialize for every new contract; stale dimension number propagates to every consumer that copies the template. Same dim-7 drift class as the v1 README/architecture findings, just in a less prominent file. **Routing:** respawn `architect` (owns `doc/_templates/`) with a one-line ask to flip `(dimension 11)` to `(dimension 1, Plan & Contract compliance)`. Alternatively `pr-prep` can sweep it as part of a release-ceremony pass. Defer-to-next-plan is also defensible since this is a single-line template edit and the protocol just shipped the 8-dim form. Not blocking on its own (template-prose drift, no behavior risk), and the v1 review note already documented the broader pattern.

(CHANGELOG.md entries that say "dimension 11" are historical record — dim-6 / dim-7 convention from reviewer.md treats CHANGELOG and historical `doc/features/*_review.md` as immutable history. Not flagged.)

## Chicken-and-egg check

- The new architecture decision entry cites four commit SHAs (`d09ac14`, `e441949`, `d563b02`, `310695d`) — all four exist on the current branch and map 1:1 to the four feature commits the plan promised. No dangling reference.
- The entry sits before "## Architectural constraints" and after the "Definition of Done as an explicit reviewer subsection" decision — chronological order in the decisions log is preserved (DoD shipped earlier; the eight-dim form is the most recent decision).
- The fixed WORKFLOW.md matrix row now lists `1, 2, 4, 5, 7`. The DoD checklist in reviewer.md has 7 items numbered 1..7; backend skips items 3 (Product Contract) and 6 (Product Impact Report) — both consistent with the matrix row's "skip with one-line reason" for contract and the N/A logic for impact report when contract is skipped. No cross-doc contradiction.
- README dim-1 references now match the reviewer.md heading "1. Plan & Contract compliance" — consistent label.

No new chicken-and-egg issues introduced by the two fix commits.

## Verdict

**approve.**

All five v1 fixes landed correctly at the exact locations the v1 review cited, the new architecture decision entry is well-placed and faithfully cites its plan and commits, the WORKFLOW.md matrix typo is fixed to a self-consistent value, and the hooks pipeline is 44/44 green on the post-fix tree. The only residual drift is a single template line at `doc/_templates/contract.md.tmpl:58` (filed as a technical note for `architect` or `pr-prep`); it does not change any agent behavior and does not block merge.
