# Fixup (trivial change fast path)

Use this command for changes that meet all four conditions below. Otherwise, use `/pm-plan`.

## Conditions (all must hold)

1. **Diff is ≤ 50 lines** (rough estimate before starting; coder reports actual at end).
2. **No user-visible behavior change.** No new user input, no new output format, no error message a user reads, no new screen, no new public API.
3. **No `docs/stack-notes.md` touch.** If the change requires citing a new stack rule, it's not a fixup.
4. **No new source code file.** Edits to existing files are fine; creating a new `.ts` / `.py` / `.go` / `.rs` / `.js` / etc. is not.

If any condition fails — fall back to `/pm-plan`. Examples:
- ✅ Fix a typo in `WORKFLOW.md`. ✓ all four hold.
- ✅ Delete a dead variable across two files (≤ 50 lines, no behavior change). ✓.
- ✅ Add a missing PR number to a CHANGELOG entry. ✓.
- ❌ Rename a public function — public API change → fails condition 2.
- ❌ Add a new test file → new code file → fails condition 4.
- ❌ Update `docs/stack-notes.md` — fails condition 3.

## Agent dispatch

All agents below are project agents — use the Agent tool with the exact `subagent_type` shown.

| Agent | subagent_type |
|---|---|
| pm-coder | `"pm-coder"` |
| pm-plan-checker | `"pm-plan-checker"` |
| pm-pr-prep | `"pm-pr-prep"` |

## What the orchestrator does

1. **Validate the four conditions.** State them explicitly to the PM in one sentence each. If any fails, say which one and switch to `/pm-plan`.

2. **Spawn `pm-coder`** (`subagent_type: "pm-coder"`) with a compact prompt. The prompt includes:
   - The change rationale (one paragraph; this replaces the plan file).
   - The four conditions, restated.
   - The pipeline command to run (from the project entry file).
   - Instruction: "this is a trivial fixup; do not create plan/contract files; update `.ai-pm/state/current.md` once at end with `Status: done`."

   Coder writes the change, runs pipeline, commits atomically. No plan file.

3. **Spawn `pm-plan-checker`** (`subagent_type: "pm-plan-checker"`) in trivial mode. Pass `--mode=trivial` as a hint in the prompt. Reviewer's trivial-mode behavior:
   - Re-validate the four conditions against the actual diff. If any broke during implementation → `request-changes` with reason "trivial-fixup violation — escalate to /pm-plan". This is the only escape hatch from the fast path.
   - Apply trivial DoD: scope respected (the change is what was asked), pipeline green, docs that needed updating are updated. Skip Product Contract check (condition 2 forbids user-facing changes), skip stack-spec tests (condition 3 forbids stack-notes touch), skip Impact Report (no contract touched).
   - Output: a short verdict file `.ai-pm/reviews/fixup-<short-topic>_review.md` with the four conditions checked, the trivial DoD, and `Verdict: approve | request-changes`.

4. **`pm-pr-prep`** (`subagent_type: "pm-pr-prep"`) runs as usual. Bump is PATCH because trivial fixups by definition are non-feature.

## What it does NOT do

- Does not skip the reviewer. Trivial fixups still need a verdict.
- Does not skip the pipeline. `bash tests/hooks.sh` and any project-specific tests / lint / validators still run.
- Does not skip the PR. A `/pm-fixup` change still goes through GitHub PR (or the project's equivalent), still gets squash-merged.
- Does not allow chaining ("while I'm here, also …"). Each `/pm-fixup` is one self-contained change. A second change starts a new `/pm-fixup` (or escalates to `/pm-plan` if combined they exceed the conditions).

## Hard rules

- The orchestrator never silently relaxes the four conditions to keep a change on the fast path. If a condition fails, escalate.
- The reviewer in trivial mode never adds notes (product or technical). If there's something worth noting, the change isn't trivial — escalate.
- The fixup verdict file is short. If the verdict gets long, the change wasn't trivial.
- `/pm-fixup` and `/pm-plan` are mutually exclusive on a single PR. A PR is either a trivial fixup or a planned change, not both.
