# Execution State

> Resume pointer — lean by design (a pointer, **not** a log). On resume READ THIS FIRST, by this exact path. Deferred work lives in `.ai-pm/backlog.md`; full history in the commit log + CHANGELOG. Keep this file short.

**Status (2026-06-10): no active feature. Working tree clean, `main` = `uni/main` = `382edf5`. NEXT: threat-model Slice 2 (the rich `rich`/`light` editorial threat-enumeration content; Slice 1 shipped the constructor + skeleton).**

## Active direction — the protocol as a product-creation engine

Compass: **`.ai-pm/design/direction-product-engine.md`** (the canonical four-pillar list + the constructor architecture — read it). The protocol is a development *engine*; products on it are arbitrary. Everything grows as **side-tools / config / modules — NEVER core bloat** (`PROTOCOL.md` one-sitting), under the whole-surface no-dup guard.

**The constructor is now real:** capabilities are **toggleable modules** — prompt content as per-module fragments (`modules/<id>/<role>.md`) composed into **assembled** role agents (floor body + enabled fragments), catalogued in `modules.json`, offered by `setup`. Two guards: **assemble UP from a floor** (the overall floor — independent review · honesty · merge-stamp · Operator merges — is never a toggle; malformed/unknown ⇒ fail-safe ON/strict) and **defaults over toggles**.

Pillar status:
- **Configurable rigor — SHIPPED (3.3.0).** `profile: full|lite|solo`; floor never cuttable; engine fails safe to `full`.
- **Threat-model + the module constructor — Slice 1 SHIPPED (3.4.0).** Constructor infra + threat-model skeleton (deepens the always-on Reviewer security floor; `[persona]`). **Slice 2 NEXT:** the real `rich`/`light` threat content + tightening the Reviewer floor wording.
- **Product discovery** (market/competitors/users/feature-landing) — later, as a module/side-tool.
- **Relentless discipline** — ongoing.

## Shipped to `uni/main`, newest first
- **#9 `382edf5` 3.4.0** — capability-module constructor + threat-model Slice 1 (above).
- **#8 `b7308b1` 3.3.0** — configurable rigor.
- **#3–#7 (3.1.0–3.2.3) — the setup feature, complete + fully live-verified on opencode.** Neutral orchestrator procedure (discover → dialog → write config → re-assemble/apply); lazy + `/setup` triggers; OpenCode `inject` class realized (`chat.message`); docs de-duplicated (+ a whole-surface no-dup guard on the Reviewer); the deployed opencode plugin generated (no hand-copy drift); **PM → Operator** rename. See CHANGELOG.
- **#1/#2 (3.0.0)** — minimal env-agnostic core + opencode-live-fix.

**Conventions:** conversation = Russian; artifacts/commits = English; the human role is the **Operator**. Decision authority = **`interactive`** (`ai-pm.config.json` `mode`); merge/ship always manual (Operator authorizes each). THIS repo: `kind: software`, `profile: full`, `threat-model` enabled (`rich`). Quality gates in `quality/tools.json` (parity 55, neutral-prose, install-{model,commands,plugin,modules}, opencode-inject, rigor-profile).

**Remotes:** `uni` (`aadegtyarev/ai-pm-protocol-uni`) is the live fork — local `main` tracks it. `origin` (public) `main` is OLD (pre-redesign); a public sync is deferred (backlog).

**Local branch cleanup pending:** `backup-2026-06-10` + stale `feature/opencode-harness-support--*` slices (superseded by #1).
