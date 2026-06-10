# Execution State

> Resume pointer — lean by design (a pointer, **not** a log). On resume READ THIS FIRST, by this exact path. Deferred work lives in `.ai-pm/backlog.md`; full history in the commit log + CHANGELOG. Keep this file short.

**Status (2026-06-10): no active feature. Working tree clean, `main` = `uni/main` = `b7308b1`.**

## Active direction — the protocol as a product-creation engine

Compass: **`.ai-pm/design/direction-product-engine.md`** (read it). The protocol is a development *engine*; products on it are arbitrary. Four pillars, each growing as **side-tools / config / checklists, NEVER core bloat** (`PROTOCOL.md` stays one-sitting), under the whole-surface no-dup guard:
1. **Configurable rigor — SHIPPED (3.3.0).** `profile: full|lite|solo` in `ai-pm.config.json`; the floor (independent review · honesty · merge-stamp · Operator merges) is never cuttable; engine fails safe to `full`.
2. **Threat model — first-class.** NEXT (bigger/fuzzier — design as a side-tool, carefully).
3. **Product discovery** (market/competitors/users/feature-landing) — after threat model.
4. **Relentless discipline** — ongoing (doc/code brevity, no rookie errors, no comment-prose).

Competitor/market research lands per-pillar when there's something concrete to position — not up front.

## Shipped to `uni/main`, newest first
- **#8 `b7308b1` 3.3.0** — configurable rigor (pillar 1, above).
- **#3–#7 (3.1.0–3.2.3) — the setup feature, complete + fully live-verified on opencode.** `setup` = a neutral orchestrator procedure (discover models → dialog → write config → re-assemble/apply); lazy + `/setup` triggers; the OpenCode `inject` class realized (`chat.message`); docs audited + de-duplicated (+ a whole-surface no-dup guard added to the Reviewer); the deployed opencode plugin is now generated (no hand-copy drift); **PM → Operator** rename. Details in CHANGELOG.
- **#1/#2 (3.0.0)** — minimal env-agnostic core + opencode-live-fix.

**Conventions:** conversation = Russian; artifacts/commits = English; the human role is the **Operator**. Decision authority = **`interactive`** (`ai-pm.config.json` `mode`); merge/ship always manual (Operator authorizes each). THIS repo runs `profile: full`. Quality gates in `quality/tools.json` (parity 55, neutral-prose, install-{model,commands,plugin}, opencode-inject, rigor-profile).

**Remotes:** `uni` (`aadegtyarev/ai-pm-protocol-uni`) is the live fork — local `main` tracks it. `origin` (public) `main` is OLD (pre-redesign); a public sync is deferred (backlog).

**Local branch cleanup pending:** `backup-2026-06-10` + stale `feature/opencode-harness-support--*` slices (superseded by #1).
