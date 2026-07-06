# Decision: scratch-regenerated files are gitignored, never tracked

**Status:** accepted (2026-07-06). **Source:** issue #325 (sub-agent workspace leak).

## The problem

A file the toolchain regenerates on every run — `.secrets.baseline` (`detect-secrets`), coverage reports, a generated lockfile-class artifact — MUST NOT be committed tracked. Tracking it manufactures noise across every git workspace the protocol spawns:

- Every worktree (a feature worktree, a sub-agent's `worktree-agent-*`) regenerates the file ⇒ every worktree shows **false-dirty** ⇒ every branch-switch stashes a meaningless one-file diff ⇒ **"stray" stashes accumulate** (~17 in the #325 incident).
- The noise hides real work: `git worktree list` / `git branch` become unusable at a glance, and the safe reflex — leave the scary-looking "dirty" worktree alone — means the leak only grows.

This is the **compounding mechanism** behind the #325 leak, layered on top of the missing teardown (addressed by the `gc` side-tool + the audit's workspace-hygiene dimension). Even with teardown, a tracked scratch-regenerated file re-manufactures the noise on every spawn.

## The rule

**Gitignore scratch-regenerated files; never commit them.** Add them to `.gitignore`:

```gitignore
.secrets.baseline
*.coverage
# …any file a tool regenerates on run
```

A tool that needs the file at a path finds it regenerated (or generates it); the repo carries no tracked copy to drift.

## How to detect a violation

A tracked file that changes on a clean checkout after a normal build/tool pass is scratch-regenerated — untrack it (`git rm --cached <file>`) and gitignore it. The audit's **workspace-hygiene** dimension flags a tracked scratch-regenerated file as a finding pointing here (`src/agents/procedures/audit.md`).
