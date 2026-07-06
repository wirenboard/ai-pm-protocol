# Decision: minimal in-protocol proxy (let modelpipe go independent)

**Status: RATIFIED by the Operator (2026-07-06).** Supersedes `docs/decisions/proxy-consume-mechanism.md` (whole — the Option 3 sync-vendor mirror is dropped) and partially supersedes `docs/decisions/router-extraction.md` (the transport router is re-absorbed into the protocol as a first-party built-in). The standalone `modelpipe` product (`aadegtyarev/modelpipe`) is untouched — it is simply no longer consumed.
**Date:** 2026-07-06

## Question

`modelpipe` grew from a minimal passthrough router into a full product (dashboard, failover groups, schedules, a compact safety-net, stats — `feat(compact)` #17 onward). The protocol consumed it as a **drift-guarded vendor-copy** of one file (`src/router.mjs` → `src/adapter/model-router.mjs`, pinned to a ref; `proxy-consume-mechanism.md` Option 3) — but the new `router.mjs` grew hard sibling deps (`store.mjs`, `stats.mjs`, `compact.mjs`), so a single-file mirror would no longer even resolve. Should the protocol keep chasing `modelpipe`, or consume it differently?

## Answer

**Stop consuming `modelpipe`. Re-absorb a minimal first-party proxy.** `src/adapter/model-router.mjs` stays in-tree as the protocol's OWN built-in router (no longer a mirror of anything): routing by `body.model`, per-backend auth swap, streaming, fail-closed errors, the vision fallback (`forImages`/`forImagesModel`) + the `GET /v1/models` discovery endpoint — the surface the launcher already uses. The standalone CLI (`main()`) is cut (the launcher imports `createRouter` programmatically; `modelpipe` is the standalone CLI product). `sync-modelpipe.mjs` and its drift row are deleted. The transport/policy boundary (`router-extraction.md`) is partially reversed: the transport router is back in the protocol; `modelpipe` is free to be the full standalone product.

The launcher keeps all three routing modes: **direct** (all-native, no proxy), **router** (≥2 endpoints → the launcher spawns the built-in proxy on a free localhost port), **external** (`proxyUrl` → an already-running proxy the Operator chose — their standalone `modelpipe`, or any). The `external` mode is the maximally-flexible path, unchanged.

## The 200K/1M auto-compact window — OPT-IN

The auto-compact redesign (`auto-compact-non-claude.md`) put summarization on the proxy and kept only crash-resume checkpoints (5.54.1) in the protocol. The harness's built-in summarizer works for foreign models AT THE RIGHT WINDOW (Operator live-confirmed for GLM; the original "breaks on non-Claude" was the ~763% threshold miscalc, not the summarization itself). So the protocol does NOT force a window — it exposes one OPT-IN knob:

- **`launch.autoCompactWindow`** (optional, positive integer of tokens) in the personal `config.local.json` → exported as `CLAUDE_CODE_AUTO_COMPACT_WINDOW` (runtime, never committed). Absent ⇒ CC's default (200K for foreign models) — the safe default.

**Why opt-in and not a forced 1M:** CC resolves the effective window **per-model**, capping each at its REAL window — but CC does NOT know foreign models' real windows (no entry in its per-model lookup; verified in the CC 2.1.201 binary + the official sub-agent/model-config docs). So:

- For a provider whose EVERY model supports 1M (e.g. **deepseek**), setting `autoCompactWindow: 1000000` is safe and beneficial.
- For a **mixed 1M + 200K** lineup, a global higher window makes CC assume a 200K model can hold more than it can → it overflows BEFORE compacting. The `[1m]` model-id suffix is the per-NATIVE-model lever but is **not model-aware for foreign** (the picker slaps `[1m]` on whatever the default is — observed sticking to a 200K GLM variant) and has known subagent-suffix-stripping bugs. So for foreign mixes, LEAVE IT UNSET.

Default unset. The setup model-config dialog offers it (step 2 `(g)`) with the caveat named; the Operator self-nominates.

## Research grounding (CC 2.1.201 binary + official docs, 2026-07-06)

- **No subagent frontmatter field** sets the context window. The official frontmatter fields are `name`/`description`/`tools`/`model`/`permissionMode`/`maxTurns`/`skills`/`mcpServers`/`hooks`/`memory`/`background`/`effort`/`isolation`/`color`/`initialPrompt`. The binary confirms: `autoCompactWindow` is a **settings.json** field (zod `number().int().min(1e5)` or `"auto"`); `contextWindow` is a runtime per-model value computed via `bE(model, lookup)` and resolved via `A3(model, autoCompactWindow) → {window, source}`.
- **Per-subagent window = the `model` field** (native): `opus[1m]` / `sonnet[1m]` / `claude-opus-4-8[1m]` → 1M for that subagent, independent of the session; standard → 200K.
- **Foreign/proxied models:** CC's per-model lookup does not know them ⇒ default 200K; the only lever to raise the session's window is the global `autoCompactWindow` (env `CLAUDE_CODE_AUTO_COMPACT_WINDOW` or settings.json).
- CC's own hint string: *`Set "autoCompactWindow": 200000 in settings.json`*.
- Confirmed env vars in the binary: `CLAUDE_CODE_AUTO_COMPACT_WINDOW`, `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`, `CLAUDE_CODE_MAX_CONTEXT_TOKENS`.

## What it is NOT

- Not a compact/failover/dashboard/stats engine (those are `modelpipe`'s, not the protocol's need — the harness summarizer + the 5.54.1 checkpoints cover it).
- Not a forced window — opt-in only, with the mixed-lineage footgun named.

## Sources

- The reversed consume decision: `docs/decisions/proxy-consume-mechanism.md` (Option 3, now superseded), `docs/decisions/router-extraction.md` (partially superseded).
- The auto-compact split: `docs/decisions/auto-compact-non-claude.md`; the protocol-side checkpoint: 5.54.1.
- CC 2.1.201 binary (`/home/adegtyarev/.local/share/claude/versions/2.1.201`) — `autoCompactWindow`/`contextWindow`/`A3`/`bE` + the env-var names.
- Official docs (sub-agents + model-config + context-window + env-vars) — frontmatter field list, `[1m]` suffix semantics.
