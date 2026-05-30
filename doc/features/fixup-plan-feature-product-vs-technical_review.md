# Review: fixup-plan-feature-product-vs-technical (trivial mode)

Branch: `feature/fixup-plan-feature-product-vs-technical`
Commit: `9d71a0d feat(plan-feature): product-vs-technical check before AskUserQuestion`
Mode: `--mode=trivial` (invoked from `/fixup`)

## /fixup condition re-validation

1. **≤ 50 LOC diff** — pass. `git diff --stat main..HEAD` → 1 file, +7 / -0.
2. **No user-visible behavior change** — pass. Doc-only change inside `.claude/commands/plan-feature.md` (agent instructions, no runtime, no PM-visible UI).
3. **No `doc/stack-notes.md` touch** — pass. Only `.claude/commands/plan-feature.md` modified.
4. **No new source file** — pass. 0 added, 1 modified.

All four conditions hold.

## Trivial DoD

- [x] Scope respected — change adds a "Before every PM question — product vs technical check" block right after the "Typical questions" list and before `AskUserQuestion` is formed. Matches the request (gate every PM question against the product-vs-technical split that `WORKFLOW.md` already uses for reviewer notes).
- [x] Pipeline green — `bash tests/hooks.sh` → exit 0, Total 44 / Passed 44 / Failed 0.
- [x] Docs updates — N/A. This PR is itself the doc update.

**DoD: pass**

## Verdict

approve

Adds a one-paragraph gate to `/plan-feature` that asks the planner to verify each clarifying question is a product trade-off (PM-answerable) before forming `AskUserQuestion`; technical detail is decided by the orchestrator and recorded in the plan instead. Doc-only, no behavior change, 44/44 hooks tests pass.
