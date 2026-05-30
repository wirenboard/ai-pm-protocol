# changelog-backfill — review v2 (re-check)

Narrow re-check of fix-pass commit `8f5eddf fix(changelog-backfill): correct commit attribution per review v1` against the single blocking item from v1 (`doc/features/changelog-backfill_review.md`).

## Plan compliance

- ✓ Scenario 1 — `## [1.6.0] — 2026-05-29` entry now lists all 9 commits from `v1.5.1..v1.6.0` (verified via `git log v1.5.1..v1.6.0 --oneline`). Distribution: Added (b94b1d2, c86fb00, 7b1a05f), Fixed (bf84440, 596939f, b642b4c, 1352ed7, 14dcd0d/#140), Changed (2626106/#141). 3+5+1 = 9 commits, exact match to the range.
- ✓ Scenario 2 — Intermediate block now lists exactly 4 PRs (#142 6e1bf14, #143 cf889c6, #144 9f81f64, #145 ac5827a), matching `git log v1.6.0..v1.7.0 --oneline` (the 5th commit in that range, 1df684c, is the v1.7.0 release commit itself and is correctly excluded).
- ✓ Scenario 3 — No retroactive `gh release create`; unchanged from v1.
- ✓ No existing CHANGELOG entry mutated. `git diff main..HEAD -- CHANGELOG.md` shows zero deleted lines; all changes are additive within the two new entries.
- ✓ Plan corrections — Scenarios 1 and 2 in `doc/features/changelog-backfill_plan.md` now state the correct ranges with explicit cardinality ("9 commits in the actual `v1.5.1..v1.6.0` range", "exactly the 4 PRs #142, #143, #144, #145"). Correction note at plan line 16 explicitly acknowledges the prior misattribution.

## Definition of Done

- [x] Code changes are within the plan's scope (no scope creep) — `CHANGELOG.md` + plan file only
- [x] Plan's "Stack expectations touched" rules respected — Keep a Changelog 1.1.0 shape preserved (Added / Fixed / Changed / Note subsections)
- [x] Product Contract — N/A (template self-edit, no user-facing surface)
- [x] Tests run; pipeline green — `bash tests/hooks.sh` → 44/44 PASS
- [x] `.ai-pm/state/current.md` — N/A (meta-case, infra-only)
- [x] Coder's Product Impact Report — N/A (no contract touched)
- [x] Docs landed — CHANGELOG.md + plan file present in branch (`8f5eddf`)

**DoD: pass**

## Blocking

None. v1 blocking #1 closed: attribution now matches `git log` reality on both sides.

## Notes (product)

None — meta-case template self-edit, no user-facing behavior.

## Notes (technical)

1. `CHANGELOG.md:119` — Second heading `## [1.6.0 → 1.7.0 intermediate work]` still reuses the `[1.6.0` token. Carried over from v1 review (technical note #1, unaddressed in this fix-pass). The fix-pass was correctly scoped to attribution only, and this is cosmetic — a Keep-a-Changelog parser might key off the leading `[1.6.0` substring, but humans read it correctly. Routing: drop on merge — cosmetic, the v1.6.0 release backfill is a one-time historical event; not worth a third pass.

## Verdict

approve

The fix-pass corrects the commit attribution: the v1.6.0 changelog entry now lists the 9 commits that v1.6.0 actually contains (per `git log v1.5.1..v1.6.0`), and the intermediate block lists the 4 PRs that genuinely landed between v1.6.0 and v1.7.0. The plan was corrected first as required, and the CHANGELOG follows. Audit trail from CHANGELOG alone is now recoverable.
