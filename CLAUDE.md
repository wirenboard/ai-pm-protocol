# ai-pm-protocol

This repo **is** the ai-pm protocol template, and it **develops itself under its own protocol** (dogfood): protocol changes go through the same `/pm-*` pipeline a downstream project uses. That is why a template repo carries its own `CLAUDE.md` — so the orchestrator driving protocol development auto-loads the thin core, router, and cross-cutting invariants, exactly as a downstream project would.

## Project kind: software

The deliverable is the protocol's own source — `WORKFLOW.md`, the `workflow/*.md` topic files, the `.claude/` agents and commands, and the `doc/_templates/` scaffolding. Verification is editorial + clean-grep plus `tests/hooks.sh` (the hook deny-list test); there is no stack linter (this repo is markdown-prose).

**Language canon:** Conversation language: the user's. Artifacts (files, code, commits, agent-authored docs): English.

---

@WORKFLOW.md
