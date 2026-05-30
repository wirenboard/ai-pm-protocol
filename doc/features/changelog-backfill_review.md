# changelog-backfill — review

## Plan compliance

- ✓ Scenario 1 — `## [1.6.0] — 2026-05-29` entry exists in `CHANGELOG.md` for orphan tag (b94b1d2). Verified by `git diff main..feature/changelog-backfill -- CHANGELOG.md`.
- ✗ Scenario 2 — Aggregate "intermediate work" block exists, but its scope is wrong. Block is titled "1.6.0 → 1.7.0 intermediate work" yet every commit it lists is actually an ancestor of the `v1.6.0` tag (`b94b1d2`), and one of them (`15e89d6`, PR #139) is already in `v1.5.1` and documented in the existing v1.5.1 entry. Audit-trail recovery from CHANGELOG alone is broken: a reader cross-referencing tag → CHANGELOG would mis-attribute 9 changes.
- ✓ Scenario 3 — No retroactive `gh release create` performed; v1.6.0 release stays absent as planned.
- ✓ No existing CHANGELOG entry mutated. `git diff` shows zero deleted lines outside the additive blocks.

Verification commands (for the record):

```
git log --oneline v1.5.0..v1.5.1    # → 15e89d6 (#139) only
git log --oneline v1.5.1..v1.6.0    # → b94b1d2 + 8 pre-merge incl. 2626106 (#141), 14dcd0d (#140)
git log --oneline v1.6.0..v1.7.0    # → 4 commits: PRs #142 #143 #144 #145
```

## Definition of Done

- [ ] Code changes are within the plan's scope (no scope creep) — scope was respected (CHANGELOG + plan only), but Scenario 2 implementation does not match git reality
- [x] Plan's "Stack expectations touched" rules respected (Keep a Changelog 1.1.0 shape used)
- [x] Product Contract — N/A (template self-edit, meta-case)
- [x] Tests run; pipeline green — `bash tests/hooks.sh` → 44/44 PASS
- [x] `.ai-pm/state/current.md` — N/A (meta-case, no user-facing feature)
- [x] Coder's Product Impact Report — N/A (no contract touched)
- [x] Docs landed — CHANGELOG.md and plan file present in the branch

**DoD: fail**

## Blocking

1. `CHANGELOG.md:103-118` — The "1.6.0 → 1.7.0 intermediate work" block lists 13 commits, but **only 4 of them (PRs #142, #143, #144, #145) are actually between v1.6.0 and v1.7.0**. The other 9 (bf84440, 7b1a05f, 596939f, b642b4c, 1352ed7, c86fb00, 2626106/#141, 14dcd0d/#140, 15e89d6/#139) are ancestors of the v1.6.0 tag — they *are* v1.6.0. And 15e89d6 (#139) is already in v1.5.1 and documented in the existing v1.5.1 entry under SHA d72da4e — listing it again here is double-counting. Why it matters: the explicit goal of this PR (per plan: "audit trail recoverable from CHANGELOG alone") fails — a reader reconciling `git tag v1.6.0` against the CHANGELOG would conclude these 9 commits arrived after v1.6.0, which is false. Fix: rewrite the v1.6.0 entry to include the 9 commits that v1.6.0 actually contains (b94b1d2 + the 8 pre-merge / PR-merge commits between v1.5.1 and v1.6.0, excluding #139), and shrink the intermediate block to the 4 PRs that are genuinely between v1.6.0 and v1.7.0. This is a plan correction, not just a CHANGELOG tweak — the plan's Scenario 2 carries the same factual error ("intermediate work between v1.6.0 and v1.7.0 (10+ commits incl. PRs #139, #140, #141…)") and should be corrected first.

## Notes (product)

None — this is a meta-case template self-edit; no user-facing behavior.

## Notes (technical)

1. `CHANGELOG.md:104` — Second heading reuses `## [1.6.0 → 1.7.0 intermediate work]`; the `[1.6.0` token there will collide with the real `## [1.6.0]` anchor in any tool that parses Keep-a-Changelog headings as version keys. Why it matters: small, cosmetic, but worth cleaning up during the block rewrite that's already required. Routing: respawn `coder` with the blocking fix — the rewrite will replace this heading anyway, so address it in the same pass.

## Verdict

request-changes

This PR backfills the missing v1.6.0 changelog entry plus an aggregate "intermediate work" block, but the intermediate block attributes 9 commits to the wrong release window (they are part of v1.6.0, not between v1.6.0 and v1.7.0; one of them was already in v1.5.1). The numbers don't match git history, which defeats the audit-trail purpose stated in the plan. Plan needs a factual correction first, then the CHANGELOG edit follows.
