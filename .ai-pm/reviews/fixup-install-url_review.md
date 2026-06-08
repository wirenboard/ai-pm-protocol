# Trivial-fixup review — install-url

**Mode:** `--mode=trivial` (from `/pm-fixup`)
**Commit:** `58b4969` — fixup(install): point template submodule URL at the new ai-pm-protocol-uni repo
**Branch:** `feature/opencode-harness-support`

## Four fixup conditions

1. **diff ≤ 50 lines** — ✓ PASS. `git show --shortstat`: 7 files, 9 insertions + 9 deletions = 18 lines.
2. **no user-visible behavior change** — ✓ PASS. A clone/submodule install-URL string correction (`wirenboard/ai-pm-protocol.git` → `aadegtyarev/ai-pm-protocol-uni.git`). No new input/output/screen/API; install steps and behavior are unchanged.
3. **no stack-notes touch** — ✓ PASS. `doc/stack-notes.md` (this repo's stack-notes location) is not in the diff.
4. **no new source code file** — ✓ PASS. All 7 paths are status `M` (modification); zero `A` (added).

All four conditions hold. No escalation.

## Trivial DoD

- [x] **Scope respected** — only the install URL changed. Protocol NAME string `ai-pm-protocol` and chore-commit labels preserved. README ×3, `src/commands/pm-bootstrap.body.md` (source), `doc/architecture.md` descriptive sentence; generated `.claude`/`.opencode`/`.golden` pm-bootstrap artifacts regenerated and re-frozen from source.
- [x] **Pipeline green** — re-run: generator 4/4, hooks 79/79, neutral-prose 5/5.
- [x] **Generated artifacts consistent with source** — generator diff-clean guard PASS (regenerated `.claude/` byte-identical to golden, fingerprint matches frozen SHA256SUMS, tree diff-clean). No hand-edit of generated files.
- [x] **Zero `wirenboard/ai-pm-protocol` occurrences remain** in the shipped surface (README, doc/, src/, .claude/, .opencode/, .golden/). The single remaining mention is in `.ai-pm/state/current.md`, where it is the historical changelog note describing the swap — correct, not a residual install URL.

**DoD: pass**

## Verdict
approve
