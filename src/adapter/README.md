# The adapter layer

The protocol is one neutral core (`../../PROTOCOL.md`, `../agents/`) plus one thin adapter per platform. This directory is where a platform plugs in. The contract is fixed and small (`PROTOCOL.md` `## Core and adapter`); an adapter realises it and nothing more.

## How it's shaped

```text
deny-rules.json   the registry — every guard, as data (intent + class + predicate + params)
tool-map.json     neutral noun → per-platform concrete tool; which return-classes a platform supports
engine.mjs        the shared check engine — holds the PREDICATES; one copy, every platform
claude/shim.mjs   Claude shim: stdin hook payload → engine → verdict JSON on stdout
opencode/         OpenCode shim: normalise.mjs (pure normalise + decide) + plugin.mjs (the
                  single-export entry — async actor lookup, throw-to-deny)
```

The split that makes this work: **rules are data, the check is code.** A deny rule's *intent, class, and parameters* (the role-deny list, the change-verb pattern, the orchestrator-writable prefixes) live in `deny-rules.json`. The *predicate* that decides — "does this path resolve outside the root", "is this an empty write over a non-empty file" — is a function in `engine.mjs`, shared by every platform. So there is exactly one copy of each rule and one copy of each check.

## What a platform adapter does

A platform shim is the only platform-specific code. It:

1. **normalises input** — turns the harness's hook/plugin payload into the neutral shape `{act, path, command, content, spawnTarget, actor, prompt}`;
2. **calls the engine** — `evaluate(input, denyRules)` returns `allow | deny | ask | inject` with a reason;
3. **maps the verdict** to the harness's own mechanism — a Claude `PreToolUse` hook emits the deny/ask JSON; an OpenCode `tool.execute.before` plugin throws on deny.

A class the platform can't realise (OpenCode has no `ask`) **falls back to persona** for those rules — named in each rule's `fallback`, and the honest enforcement map in `PROTOCOL.md` already labels them. Nothing is silently dropped.

## Adding a new platform

Write `<platform>/` only: the input-normaliser, the three-class verdict mapper, and the install glue. Map its tools in `tool-map.json` and its `class_support`. **Zero edits to `engine.mjs`, `deny-rules.json`, or the core.** If a new platform forces an edit to any of those, the boundary leaked — that is the design's one failure condition.

## No regex drift — by construction

The danger: a guard's pattern (the change-verb regex, the ssh idioms, the role-deny list) drifts between the Claude realisation and the OpenCode one, so the *same* command is blocked on one platform and waved through on the other.

Here there is **no second copy to drift**: the patterns live once in `deny-rules.json`, and both shims `import` the same `engine.mjs`, which applies them with the same regex engine at runtime. The residual risk — a shim re-implementing a predicate instead of calling the engine — is held by two mechanical guards in `parity.test.mjs`:

- **Parity** — a shared fixture of `{input → expected verdict}` cases runs through each shim's full path (normalise → engine → verdict); both must return the identical class for every case, bar the one documented actor divergence (orchestrator-content: mechanical on OpenCode, persona on Claude).
- **Single-engine** — a shim must contain no rule logic of its own (only input-normalising + verdict-mapping); the test greps each shim for inline patterns/role-lists and fails if a rule leaked out of the registry or the engine.

Install glue is in `INSTALL.md` (where each file lands, the Claude hook fragment, the OpenCode plugin entry). The OpenCode entry defines its hook functions inline and imports only the rule logic — a hook imported and re-exported is not registered by the loader. Per-class support is in `tool-map.json`.

## Model router — per-seat cross-endpoint routing

A second, independent adapter-layer tool (`model-router.mjs`), unrelated to the deny-engine above. It lets the loop's seats run on models behind **different endpoints** — Opus/Sonnet on Anthropic, the Builder on DeepSeek's Anthropic-compatible endpoint — under **one** Claude Code instance, which itself takes a single `ANTHROPIC_BASE_URL`. The *why*, the alternatives, and the empirical routing probe live in `docs/decisions/per-seat-model-routing.md` — read it; this section is the HOW-TO only.

It is a reverse-proxy: it reads each request body's `model`, matches it against a config route table, swaps in that backend's auth header (key from an env var, never inline, never logged), and streams the response back — with one reactive exception, the vision fallback below. An unroutable request fails closed (a 4xx/5xx error, never a silent default backend) — sending a seat's traffic to the wrong provider is the worst outcome it must prevent.

**Run it:**

```sh
cp src/adapter/model-router.example.json router.json   # then edit the routes
export ANTHROPIC_API_KEY=sk-ant-…                       # the keys the routes name
export DEEPSEEK_API_KEY=sk-…
node src/adapter/model-router.mjs router.json           # listens on 127.0.0.1:8787
```

Then point Claude Code at it: `export ANTHROPIC_BASE_URL=http://127.0.0.1:8787`. Set `MODEL_ROUTER_LOG=1` for an opt-in `model -> host` line per request on stderr (never a key, body, or header).

**The route config** (`model-router.example.json`) is a list of `{ match, base_url, auth: { header, keyEnv } }`: `match` is a glob over the model id (`claude-*`, `deepseek-*`); `base_url` is the backend origin (with an optional base path the request path is appended to); `auth.keyEnv` names the env var holding that backend's key — **never a key value in the file** (it is committed). An optional `auth.scheme` (e.g. `"Bearer"`) prepends a prefix to the key for backends that want `Authorization: Bearer <key>` rather than a raw `x-api-key`. Verified per the official DeepSeek docs (2026-06-30): its Anthropic-compatible endpoint is `https://api.deepseek.com/anthropic` and authenticates with `x-api-key`, the same scheme as Anthropic.

**Vision fallback (`forImages: true`).** One route may carry `forImages: true` to mark it the **vision fallback target**. When a non-vision backend rejects an image-bearing request with a `400 … does not support image blocks`, the router buffers that `400`, re-forwards the **same** request to the `forImages` route, and caches the model as non-vision so the next image call pre-routes there directly — the client sees the vision route's response. Capability is **discovered from the wire, not declared**: a multimodal model just returns `200` and is never rerouted; an ambiguous `400` (a real bad request) relays as-is; and with no `forImages` route configured the router fails loud with a clear error rather than the cryptic upstream `400`. It is **reroute only — the payload (image bytes included) is never transformed**. At most one route may set `forImages`. The why and the full case table: `docs/decisions/vision-routing.md`.

**Load-bearing constraint — `CLAUDE_CODE_SUBAGENT_MODEL` must stay UNSET.** It has the highest precedence in Claude Code's per-subagent model resolution and **collapses every seat to one model** when set — which defeats the router (every request would arrive carrying the same model id, so the route table can no longer tell the Builder seat from the Reviewer seat). The per-seat `model:` pins are the routing key; this env var overrides them. See `docs/decisions/per-seat-model-routing.md` (fact 2) for the empirical proof.

### The provider catalog — `model-providers.json`

A built-in, data-only map of the known Anthropic-format backends, so a routes config can name a provider by `id` instead of restating its endpoint. Each entry carries `id`, `base_url` (the origin **plus the path prefix before `/v1/messages`** — the router appends the client's request path), the `models` globs that select it, and `auth { header, scheme?, keyEnv }` (key by env-var **name** only). The four verified providers (2026-06-30): **anthropic** (`x-api-key`, also `supports_passthrough`), **deepseek** (`x-api-key`), **glm** (z.ai GLM Coding Plan — `Authorization: Bearer`, models `GLM-*`), **openrouter** (`Authorization: Bearer`). **Governing constraint: Anthropic-format only, no translator ever** — OpenAI-shaped providers are out of scope permanently (`docs/decisions/per-seat-model-routing.md`).

A route in a routes config references one: `{ "provider": "deepseek" }` (base_url + auth + match patterns pulled from the catalog), with any field overridable inline — e.g. `{ "provider": "anthropic", "auth": "passthrough" }` to forward a subscription/OAuth session's own auth (no API key), or a `base_url` override for a regional GLM host.

### The launcher — `router-launch.mjs`

One command to run the wired pipeline, **direct by default**:

```sh
node src/adapter/router-launch.mjs [claude args…]
#   AI_DEV_CONFIG        config path   (default .ai-dev/config.json)
#   MODEL_ROUTER_ROUTES  routes path   (default .ai-dev/model-routes.json)
```

It reads the seats' `roles.*.model` pins and the routes config (resolved against the catalog), then decides: if the seats touch **fewer than 2 distinct endpoints** (e.g. all-Anthropic), it execs `claude` **directly, no router** — a project that never opts in is unchanged. If **≥2 endpoints** are in play, it starts `model-router.mjs` on a free localhost port, points the child at it (`ANTHROPIC_BASE_URL`), **guarantees `CLAUDE_CODE_SUBAGENT_MODEL` is unset** in the child env, execs `claude`, and tears the router down on exit. **Fail-closed:** if a route in play names a backend key env var that is unset, the launcher errors **before launching anything** — never a silent wrong-backend.

**External proxy (opt-in `proxyUrl`).** Set a top-level `proxyUrl` in the routes config to point at an **already-running** proxy (a self-hosted or shared modelpipe, or one under a debugger) instead of spawning one. The launcher then skips the spawn entirely and just points `claude` at that URL (still unsetting `CLAUDE_CODE_SUBAGENT_MODEL`). Auth/keys live in **that proxy's own env**, so the launcher's fail-closed key check does not apply — it cannot see the external proxy's credentials. A present-but-malformed `proxyUrl` is a hard error (never a silent fall-through to a local spawn); absent/blank ⇒ the launcher decides direct-vs-spawn itself.
