# bootstrap-write-loss-guards — plan

Source: PM-relayed bootstrap doc-loss incident report, 2026-06-06 (severity High; `docs/architecture.md` truncated to 0 bytes by an empty `Write` from a re-spawned `pm-architect`, unrecoverable because the file was still untracked). P1+P2 scope PM-decided via AskUserQuestion (2026-06-06).

This is a protocol self-change (dogfood). Two independent, complementary guards that together make the incident impossible (P1) or recoverable (P2): a hook that blocks the destructive write itself, and a bootstrap-time git snapshot that closes the untracked-docs window so `git checkout` always recovers.

## Scenarios

1. **P1 — destructive empty Write is blocked at the tool layer.** When any caller (orchestrator or subagent) issues a `Write` whose content is empty or whitespace-only **and** the target file already exists and is non-empty, the `PreToolUse` hook denies the call with a reason explaining the truncation guard. The file is never zeroed. This is the exact step-6 action from the incident chronology; it is now stopped mechanically, regardless of which agent issues it.
2. **P1 — legitimate writes are unaffected.** A `Write` with real (non-empty) content over an existing file passes (normal overwrite). A `Write` to a path that does not yet exist passes (creating a file, including an intentionally-empty placeholder, destroys nothing). A `Write` of empty content over an already-empty file passes (no content to lose). The guard protects *existing authored content* and nothing else.
3. **P2 — the bootstrap untracked-docs window is closed.** During `/pm-bootstrap`, before any agent that mutates an already-created or already-authored doc is spawned, the procedure commits a WIP git snapshot of the docs on the bootstrap branch; it re-snapshots after each authoring agent returns, before any refinement re-spawn. So a later destructive write — even one P1 somehow does not catch — is recoverable via `git checkout <file>` instead of being lost to an untracked 0-byte file. Holds in both bootstrap modes (greenfield template-scaffold and existing-codebase reader-draft).

## Existing behaviors this feature touches

(the protocol's own machinery — what must not break)
- **The existing PreToolUse deny-list family** (`tests/hooks.sh` is currently 73/73): the Read path-boundary, find-boundary, ssh-edit/mutate, force-push, commit-no-verify, and agent/skill-routing hooks. The new Write matcher is **appended** as a new top-level `PreToolUse` entry so it does not shift the array indices the existing tests bind to (`PreToolUse[0]=Read`, `[1]=Bash`, `[2]=Task|Agent|Skill` → new `[3]=Write`). All 73 existing cases must still pass.
- **`/pm-bootstrap` end-to-end flow** in both modes: the existing final `chore: bootstrap project docs` commit (greenfield line ~133) and the existing-codebase commit path stay the completion markers; P2 adds *earlier* snapshots, it does not remove the final commit. The `--no-verify` bootstrap-commit convention (no test framework exists yet at bootstrap) is reused for the WIP snapshots.
- **Subagent Write calls in normal pipeline work** (pm-coder, pm-architect authoring real content): unaffected — they write non-empty content, scenario 2.

## Contracts

(new behavioral guarantees — not a user-facing API; recorded here for the reviewer and the architecture decision record)
- **Destructive-Write guard** — `Write(file_path, content)` is **denied** when `strip(content) == ""` AND `file_path` exists with size > 0; **allowed** otherwise. Mirrors the code-scalpel **SC6** invariant ("write_file rejects empty content"). Hard deny (not ask): zeroing an existing authored file via `Write` is never a legitimate need — a genuine truncate uses a different tool.
- **Bootstrap snapshot point** — no `/pm-bootstrap` agent spawn mutates a doc while that doc is untracked. The procedure guarantees a committed git state of the docs exists before the first mutating spawn and after each authoring spawn returns.

## Stack expectations touched

(from `doc/stack-notes.md` § "Claude Code hooks API" — the same rules `tests/hooks.sh` already cites)
- **Claude Code PreToolUse hooks**: stdin payload is `{tool_name, tool_input}`; the hook emits `hookSpecificOutput` with `hookEventName: "PreToolUse"`, `permissionDecision` ∈ `allow|ask|deny`, and a non-empty `permissionDecisionReason`; exit-0-with-no-output is the let-through. The Write hook reads `tool_input.file_path` and `tool_input.content`. Source: https://code.claude.com/docs/en/hooks
- **jq**: `-r` raw output, `// empty` / `// ""` for absent-field safety. Source: https://jqlang.org/manual/
- **POSIX test `-s`**: true iff the path exists and has size > 0 — the single primitive that distinguishes "existing non-empty file" (guard) from "missing or already-empty" (allow). Source: POSIX `test` utility.
- **git**: `git add <docs> && git commit --no-verify` for the bootstrap WIP snapshot on the bootstrap branch. Source: https://git-scm.com/docs/git-commit

## Interaction scenarios

- **P1 hook vs the existing Bash/Read/Task hooks**: the new entry uses matcher `Write`, disjoint from `Read` / `Bash` / `Task|Agent|Skill`, so no call is matched by two arms; appended as `PreToolUse[3]` it leaves existing test index bindings intact. Verified by re-running the full 73-case suite plus the new cases.
- **P1 vs P2 (complementary, not conflicting)**: during bootstrap, P1 blocks the destructive write at the tool layer; P2 ensures that if a destructive write is ever *not* empty-content (e.g. a 5-byte stub that P1 lets through but still loses authored content), the snapshot makes it recoverable. They cover overlapping-but-distinct failure modes; neither depends on the other.
- **P1 TOCTOU on `-s`**: between the hook's `-s` check and the actual Write the file could change. Irrelevant to the guard — if the file became empty in that window, allowing an empty Write loses nothing; if it gained content, the guard would (correctly) re-deny on the next attempt. No shared mutable state beyond the filesystem the hook reads synchronously.

## Test plan

- **Existing tests that must pass:** all of `tests/hooks.sh` (currently 73 cases) — unchanged and still green, proving the appended Write matcher shifted no indices.
- **New tests (P1 — added to `tests/hooks.sh`, new `WRITE_HOOK='.hooks.PreToolUse[3].hooks[0].command'`, with a `mk_input_write` helper building `{tool_name:"Write", tool_input:{file_path,content}}`):**
  - `write: empty content over existing non-empty file -> deny  # regression for incident 2026-06-06`: given an existing non-empty repo file (e.g. `$ROOT/README.md`), when content is `""`, the hook denies — the exact incident step.
  - `write: whitespace-only content over existing non-empty file -> deny`: given the same file, when content is spaces/newlines only, the hook denies (partial-read truncation guard; SC6 mirror).
  - `write: non-empty content over existing file -> pass`: given an existing file, when content is real text, the hook passes (normal overwrite is Write's job).
  - `write: empty content to non-existent path -> pass`: given a path that does not exist (e.g. `$ROOT/.hooks-test-absent-$$`), when content is `""`, the hook passes (creating an empty file destroys nothing).
  - `write: empty content over an already-empty file -> pass`: given a freshly-created empty temp file under `$ROOT`, when content is `""`, the hook passes (no content to lose); the temp file is removed after the case.
- **Stack-spec tests (one per cited rule):** the deny cases above assert the full `hookSpecificOutput` shape via the existing `run_case` positive-case path (`hookEventName == "PreToolUse"`, `permissionDecision == "deny"`, non-empty `permissionDecisionReason`) — i.e. behavior against the documented Claude Code hooks API, not a self-consistent mapping. Source URL recorded in the new section's comment block, matching the file's existing citation style.
- **P2 verification (editorial + clean-grep, per CLAUDE.md — no automated test for command-file prose):** `.claude/commands/pm-bootstrap.md` reads coherently; the snapshot step is present and placed *before* the first doc-mutating spawn and *after* each authoring spawn, in both the greenfield and existing-codebase sections; the existing final bootstrap commit is preserved; the `--no-verify` rationale is carried. `pm-plan-checker` Pass 1 confirms every scenario above is covered; Pass 2 routes P1 (settings.json + hooks.sh) through `code-review` and P2 (prose) through the documentation-kind editorial validation.

## Docs to update

- `doc/architecture.md`: add one decision record under `## Architectural decisions` — the destructive-Write guard (new PreToolUse deny in the existing hook family; SC6 mirror; hard deny rationale) **and** the bootstrap doc-snapshot durability rule (no mutating spawn over an untracked doc). Owned by `pm-architect`, post-coding handoff. Source: this plan + the incident report.
- `workflow/enforcement.md` § "Hook-level enforcement": add one bullet to the enumerated deny-list — an empty/whitespace-only `Write` over an existing non-empty file is denied automatically (truncation guard, SC6 mirror). This file is protocol-source (the deliverable), edited by `pm-coder` as part of implementation, not the post-coding architect handoff.
- `.claude/commands/pm-bootstrap.md`: the P2 snapshot step itself (this *is* the implementation, edited by `pm-coder`, listed here for completeness).

## Out of scope

- **P3 (owner-instruction nudges in `pm-architect`/`pm-coder`: "never empty Write, use Edit for additions"), P4 (orchestrator recovery carve-out for tiny PM-confirmed edits via Edit), P5 (transcript-recovery as the canonical data-loss procedure in MIGRATIONS.md/WORKFLOW.md)** — PM-scoped this plan to P1+P2. P1's hard deny already removes the incident's destructive step, lowering P3's urgency; P4/P5 are separate edit-ownership / recovery-doctrine changes, each its own `/pm-plan`.
- **Sibling tools of the categorical "Write" guard (technical classification, orchestrator-decided, not a PM fork):** the guard covers the `Write` tool only. `Edit` is excluded — it does targeted string replacement and requires the old content to match, so it cannot blindly zero a file the way a whole-file `Write` does; `NotebookEdit` operates on notebook cells, not whole-file content, and is not a truncation vector. If a future incident shows an Edit/NotebookEdit truncation path, that is a separate guard.
- **An always-on invariant bullet in `WORKFLOW.md`**: the Write guard is a purely mechanical hook requiring no orchestrator freeform reasoning, so by WORKFLOW.md's own boundary criterion it lives in `workflow/enforcement.md` (hook mechanics home) alongside the ssh-edit and force-push hooks — which are likewise not in the always-on bullet list. Not a WORKFLOW.md change.
- **WB / downstream stack work, runtime behavior, any non-protocol surface.**
