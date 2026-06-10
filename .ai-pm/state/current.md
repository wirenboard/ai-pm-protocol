# Execution State

> Resume pointer — lean by design (a pointer, **not** a log). On resume READ THIS FIRST, by this exact path. Deferred work lives in `.ai-pm/backlog.md`; full history in the commit log + CHANGELOG. Keep this file short.

**Status (2026-06-10): no active feature. Working tree clean, `main` = `uni/main` = `a6af179`.**

The minimal environment-agnostic redesign is fully SHIPPED to `uni/main`:

- **#1 `50f5ffb` — 3.0.0 minimal core.** One `PROTOCOL.md` + 3 roles (Orchestrator / Builder / Reviewer) + the 5-beat loop (understand → plan → build → review → ship) + data-adapter enforcement (`adapter/engine.mjs` + `deny-rules.json` + `tool-map.json`, per-platform shims). The old 8-persona surface is archived to git history.
- **#2 `a6af179` — opencode-live-fix.** OpenCode adapter **live-verified on opencode 1.17.0** (session runs as primary `ai-pm`; a write into `.ai-pm/tooling/` is mechanically blocked); plural `.opencode/{agents,plugins}/`; inline-defined plugin. Plus the protocol resume-state-path fix — this file's path is now named in `PROTOCOL.md`, `agents/orchestrator.md`, and `AGENTS.md`. Cross-model reviewed (sonnet) → approve; stamp `.ai-pm/reviews/opencode-live-fix_review.md`.

**Conventions:** conversation = Russian; artifacts/commits = English. Decision authority = **autonomous** (procedural gates announce-and-proceed; product forks → PM; merge/ship stay manual). Quality gates: `node adapter/parity.test.mjs` (50/50) + `node quality/neutral-prose.test.mjs`.

**Remotes:** `uni` (`aadegtyarev/ai-pm-protocol-uni`) is the live fork — local `main` tracks it. `origin` (public `aadegtyarev/ai-pm-protocol`) `main` is OLD (pre-redesign); a public sync is a deferred decision (backlog).

**Local branch cleanup pending:** `backup-2026-06-10` (safety net from the git-untangle — deletable once trusted) + the stale `feature/opencode-harness-support--*` slice branches (superseded by #1).
