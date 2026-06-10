# Execution State

> Resume pointer — lean by design (a pointer, **not** a log). On resume READ THIS FIRST, by this exact path. Deferred work lives in `.ai-pm/backlog.md`; full history in the commit log + CHANGELOG. Keep this file short.

**Status (2026-06-10): no active feature. Working tree clean, `main` = `uni/main` = `30a3b10`. The setup feature is complete and fully live-verified on opencode; the docs were audited and de-duplicated.**

Shipped to `uni/main`, newest first:

- **#6 `30a3b10` — 3.2.2 doc de-duplication + a root-cause guard.** A manifesto-rule-1 audit found duplication that crept across the setup slices (model policy in 3 homes, one drifted to a stale Haiku blacklist; INSTALL.md narrative stamped 6×; twin Apply-config sections). Collapsed to one home + pointers, no fact lost (`INSTALL.md` −18% words). Root cause = the review gate checks each change in isolation, never the whole doc surface (same shape as the inject-class miss); added a **whole-surface no-dup check** to the Reviewer's checklist (`agents/reviewer.md`).
- **#5 `a155df9` — 3.2.1 setup applies the config it writes.** `## Setup` now re-assembles the agents after writing (a chosen reviewer model actually takes effect; idempotent for zero-config). Neutral `apply-config` contract point. **Full `/setup` live-verified end-to-end on opencode 1.17.x** (dialog → write → apply → reviewer pin `deepseek/deepseek-v4-flash` baked into the deployed agent; reconfigure shown) — the 3.2.0 unit-proven residual is now cleared. README gained a `## Configure` onboarding section.
- **#4 `bf563e9` — 3.2.0 setup triggers (Slice B) + OpenCode `inject` class realized.** Lazy offer on an unconfigured project (not a block) + an explicit `/setup` command on both platforms. Fixed a pre-existing gap the live run exposed: the `inject` class was never realized on OpenCode (plugin wired only `tool.execute.before`); now via the `chat.message` hook.
- **#3 `ea6a2a1` — 3.1.0 setup procedure (Slice A brain).** `setup` = a neutral orchestrator procedure: discover models → structured-question dialog → write `ai-pm.config.json`. OpenCode reviewer model-pin baked at install. Renamed the human role **PM → Operator** across the protocol.
- **#1 `50f5ffb` / #2 `a6af179`** — 3.0.0 minimal env-agnostic core + the opencode-live-fix (see CHANGELOG / earlier history).

**Conventions:** conversation = Russian; artifacts/commits = English; the human role is the **Operator**. Decision authority = **`interactive`** (`ai-pm.config.json` `mode`) — surface forks to the Operator; merge/ship always manual (Operator authorizes each). Quality gates live in `quality/tools.json` (parity 55, neutral-prose, install-commands, install-model, opencode-inject).

**Remotes:** `uni` (`aadegtyarev/ai-pm-protocol-uni`) is the live fork — local `main` tracks it. `origin` (public `aadegtyarev/ai-pm-protocol`) `main` is OLD (pre-redesign); a public sync is a deferred decision (backlog).

**Local branch cleanup pending:** `backup-2026-06-10` (safety net from the earlier git-untangle — deletable once trusted) + stale `feature/opencode-harness-support--*` slice branches (superseded by #1).
