# Golden reference — frozen `.claude/` adapter baseline

This directory is the **immovable baseline** for the form-C byte-equivalence proof
(`opencode-harness-support`, stage (a), slice 1). It is a pristine snapshot of the
current Claude Code adapter surface **as it existed before the neutral source was
carved**, captured as the very first commit of the slice so the baseline is frozen
clean.

## What is frozen here

`claude/` holds an exact byte-for-byte copy of the **14 git-tracked files** of the
live `.claude/` adapter at freeze time:

- `claude/agents/*.md` — the 8 `pm-*` subagent files (Claude frontmatter + body).
- `claude/commands/*.md` — the 5 `/pm-*` command files (pure body, no frontmatter).
- `claude/settings.json` — the hooks / deny-list / route-reminder configuration.

`claude/SHA256SUMS` records the sha256 of each of those 14 files, keyed by the path
relative to `.claude/` (e.g. `agents/pm-architect.md`). The untracked
`.claude/settings.local.json` is deliberately **excluded** — it is a developer-local
override, gitignored, never part of the adapter surface the protocol ships.

## Why it exists

Form C's central claim is that a single authored **neutral source** plus a
**deterministic generator** reproduce this adapter **byte-for-byte**. The
`generated-claude-adapter-byte-equivalent` test regenerates `.claude/` from the
neutral source and asserts byte-identity against this frozen golden. Freezing the
golden *before* carving guarantees the comparison target can never drift to match a
buggy generator — the baseline is the bytes that the Claude self-host session
actually loaded before any build step existed.

## Do not edit by hand

If the adapter surface legitimately changes in a future slice, the golden is
re-frozen by an explicit, reviewed step — never silently. A hand-edit here would
defeat the entire guarantee.
