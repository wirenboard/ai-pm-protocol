# Harness-reference table

> **GENERATED — do not edit by hand.** Rendered from `src/manifests/capabilities.json` (`harness_reference` block) by `gen/generate.py --harness reference`. The single source of the neutral-noun -> concrete mapping is that manifest; this file is a derived view. A hand-edit or a stale render trips `reference-table-matches-capabilities` in `tests/neutral-prose.sh`.

The protocol's shared instruction prose (the `pm-*` agent and command bodies) names every harness-specific concept with a **neutral noun**, never a bare Claude or OpenCode primitive. A reader (human or model) who needs the concrete for their harness resolves it here.

| Neutral noun | Claude | OpenCode |
|---|---|---|
| the project entry file | `CLAUDE.md` | `AGENTS.md` |
| the structured-question tool | `AskUserQuestion` | `question` |
| the enforcement layer | `settings.json PreToolUse hook` | `tool.execute.before plugin (throw)` |
| the instruction-loading mechanism | `@-import (@.ai-pm/tooling/WORKFLOW.md)` | `instructions[] array` |
| the change-intent route reminder | `UserPromptSubmit hook` | `always-on AGENTS.md/instructions content` ⚠ |
| the skill-invocation tool | `Skill` | `skill` |
| the adapter directory | `.claude/` | `.opencode/` |

⚠ **Behavioral skew (not just naming).** The two harnesses differ in *behavior*, not only in the name of the primitive:
- **the change-intent route reminder** — BEHAVIORAL: per-prompt on Claude (fires on change-intent), always-on on OpenCode (no UserPromptSubmit-equivalent). Name the intent neutrally; each adapter doc states its realized timing.
