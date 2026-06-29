# Per-seat models across endpoints — routing the pipeline (Opus plan · DeepSeek build · Sonnet review)

**Question (2026-06-29).** The Operator wants the loop's beats on different models:
**Opus** plans + ships, **DeepSeek v4 PRO** builds, **Sonnet** reviews and returns
findings to the builder. The protocol already supports a different model per seat
(`roles.{seat}.model`), so plan/build/review-on-different-models is *config*, not new
architecture. The one genuinely new constraint: **DeepSeek lives behind a different
endpoint** (its own base-URL + auth), and a Claude Code instance takes endpoint/auth
**at the process level** (one `ANTHROPIC_BASE_URL` per instance) — a subagent cannot
be pointed at a second base-URL. So how does the DeepSeek (Builder) seat get reached?

---

## What the facts settle

**(1) No format translation is needed.** DeepSeek exposes an **Anthropic-compatible**
endpoint (`https://api.deepseek.com/anthropic`) that speaks the same Messages API
Claude expects. So any router here is a *pure reverse-proxy with model-based routing +
per-backend auth swap* — NOT a format translator (which is the heavy part of LiteLLM,
and the part we get to skip entirely).

**(2) Per-subagent `model:` reaches the endpoint as a DISTINCT id — verified.** The
doc resolution order is: `CLAUDE_CODE_SUBAGENT_MODEL` (if set, **forces every subagent
to one model** — highest precedence) → per-agent `model:` frontmatter (alias or full
id) → the main conversation's model. The field has a history of bugs (model: ignored,
all agents ran opus — `affaan-m/everything-claude-code#173`; `CLAUDE_CODE_SUBAGENT_MODEL`
behaviour "unclear" — `anthropics/claude-code#10993`), so this was **probed
empirically**, not trusted to docs. A throwaway logging proxy as `ANTHROPIC_BASE_URL`
recorded the `model` field of every request while a headless session delegated to two
subagents pinned `model: haiku` and `model: sonnet`:

| Caller | `model:` pin | `model` arriving at the endpoint |
| --- | --- | --- |
| main session | — | `claude-opus-4-8` |
| probe-alpha | `haiku` | `claude-haiku-4-5-20251001` |
| probe-beta | `sonnet` | `claude-sonnet-4-6` |

Three **distinct** model ids arrived separately (the result JSON's `modelUsage`
confirmed opus + sonnet + haiku, each with its own cost). **Conclusion:** a router
keying on the model id CAN distinguish the Builder (deepseek) seat from the Reviewer
(sonnet) seat. **Load-bearing constraint:** `CLAUDE_CODE_SUBAGENT_MODEL` must be left
**unset**, else it collapses every seat to one model.

**(3) Cost is observable per model.** Headless `--output-format json` returns
`total_cost_usd` + a per-model `modelUsage` breakdown — feeding the ship-time
token-spend relay (`orchestrator.md ## Your seat`) natively, per backend.

---

## The three options

**(A) Multi-harness relay — a second process per cross-endpoint seat.** The Builder
seat is realised by a thin wrapper (`claude-ds` = the same `claude`, run with the
DeepSeek env) invoked headless (`claude -p … --output-format json`) by the Opus
orchestrator; Sonnet stays an in-session subagent (same Anthropic endpoint). Needs a
**new adapter spawn realisation** — "spawn via external harness" (the `## Core and
adapter` spawn contract point) bound to `roles.builder`.

- *Pro:* session continuity is explicit and strong — `--resume <session_id>` keeps the
  Builder's context across rework rounds. Smallest supply-chain surface (no extra
  package — same `claude`, different env).
- *Con:* a real (if bounded) protocol extension; a second Node process during a build.

**(B) Third-party proxy (CCR / LiteLLM).** One instance, `ANTHROPIC_BASE_URL` → the
proxy, which routes by model. **Pure config** on the protocol side (the existing
`roles.*.model` pins ARE the routing key).

- *Pro:* zero protocol change; mature, model-picker / UI niceties.
- *Con:* **supply-chain surface** — a third-party package runs locally **with your API
  keys in its env**; LiteLLM PyPI `1.82.7`/`1.82.8` shipped credential-stealing malware
  (Anthropic's gateway docs warn; rotate if installed). `localhost` closes the *network*
  surface, NOT the supply chain — the malware runs locally exactly where the keys are.

**(C) Own minimal router — first-party tooling component. *(recommended)*** A ~60–80
line reverse-proxy in the tooling: route by `model` (`claude-*` → Anthropic, `deepseek-*`
→ DeepSeek/anthropic), swap the per-backend auth header, stream the response through.
No format translation (fact 1). The probe logger (`_scratch/proxy-probe/logger.mjs`) is
~80% of the skeleton — add the route table + auth swap.

- *Pro:* collapses the supply-chain add to **zero** — first-party code, reviewed,
  changes through git (invariant 4); keys touch no third-party package. Pure config on
  the protocol side (the seat pins) + a small owned component. Fits the protocol ethos
  (thin, owned, auditable). Cross-endpoint routing now proven viable (fact 2).
- *Con:* we own it — streaming SSE correctness, the per-backend **key** swap (both
  Anthropic and DeepSeek authenticate with `x-api-key`, different keys per backend —
  verified against DeepSeek's official Anthropic-API docs, 2026-06-30; the router still
  carries a configurable `auth.scheme` for any backend that genuinely needs a
  `Authorization: Bearer` form), error/edge passthrough, and tracking any API-shape drift.

---

## The continuity axis (so the proxy is not mis-sold)

Session preservation of the Builder across rework rounds depends on the **spawn
mechanism**, NOT on whether a proxy exists:

- **Separate headless process** (`claude -p … --resume <id>`) → continuity is explicit
  and robust (option A, or B/C if the Builder is spawned as its own process).
- **In-session subagent** → continuity is the platform's *optional* subagent-continue
  (the `## Core and adapter` "continue a sub-agent" point); absent ⇒ fresh spawn, only a
  re-read token cost.

A proxy is a **stateless forwarder** — it holds no conversation state, and DeepSeek's
API is itself stateless. So "is the DeepSeek session preserved?" is answered by the
spawn axis, never by the proxy.

---

## Recommendation

**Own minimal router (C)**, with:

- the existing per-seat `roles.*.model` pins as the routing key (no core change);
- a **documented constraint**: never set `CLAUDE_CODE_SUBAGENT_MODEL` (it force-collapses
  the seats — fact 2);
- the router shipped as a **tooling component**, with the per-backend auth swap and SSE
  passthrough as the two fiddly bits to get right under review.

If rework-without-re-reading is judged critical, fold in option A's separate-process
Builder (`--resume`) — a **hybrid**: own router for the same-endpoint seats, a headless
DeepSeek process for the Builder. Reject (B) as the primary path on the supply-chain
ground, while recording it as the zero-build fallback (a pinned CCR) if owning a router
is later judged not worth the maintenance.

**Next:** a feature plan builds the router from the logger skeleton through the loop
(Builder authors, Reviewer checks the stream/auth/route, ship). This doc rides that PR.

---

## UX & scope — the governing constraints (added with the catalog + launcher)

The 5.32.0 router shipped the mechanism; the provider catalog
(`src/adapter/model-providers.json`) and the launcher (`src/adapter/router-launch.mjs`)
make it usable. Three constraints govern the whole feature and were locked by the
Operator — record them here so a later reader does not re-litigate a settled call:

1. **Anthropic-format providers ONLY — no translator, EVER.** Every backend in the
   catalog speaks the Messages API natively (Anthropic, DeepSeek's Anthropic endpoint,
   z.ai GLM Coding Plan, OpenRouter's Anthropic skin). OpenAI-shaped providers are out
   of scope **permanently** — they cannot speak Anthropic, and adding a translator is
   the heavy, drift-prone part this design exists to avoid (fact 1 above). The router
   stays a pure passthrough.

2. **Proxy OFF by default — opt-in.** Out of the box the loop runs **directly, no
   router**. The launcher only starts the router when the seats' models touch **≥2
   distinct endpoints**; all-Anthropic role models (even different Anthropic models per
   seat) run `claude` straight through. A project that never configures a cross-endpoint
   seat is byte-unchanged. The opt-in is the routes config + the cross-endpoint pick,
   not a separate switch.

3. **Claude Code only — inert on OpenCode.** This is a *harness-capability* gate, not a
   router limitation (the router is neutral plumbing). The feature needs the harness to
   forward distinct per-subagent `model:` ids to the endpoint; **OpenCode's `task`
   runtime ignores a subagent's `model:`** (the honesty note in `orchestrator.md`
   `## Your seat` — point, don't restate), so every seat collapses to the session model
   and there is nothing to route per seat. On OpenCode the whole provider/router/launcher
   surface is offered not at all and stays inert; it breaks nothing.

**Subscription/OAuth sessions need no Anthropic key.** The catalog's Anthropic entry
supports `auth: "passthrough"` — a route may forward the client's incoming auth header
unchanged, so a Claude Code subscription/OAuth session reaches Anthropic with no API
key while a cross-endpoint seat (DeepSeek/GLM/OpenRouter) authenticates with its own
keyed backend.

**Path-prefix note (live-verify pending — G).** Each catalog `base_url` is the backend
origin **plus the path prefix that precedes `/v1/messages`** (the router appends the
client's `/v1/messages`). DeepSeek (`/anthropic`) and GLM (`/api/anthropic`) verified;
OpenRouter's real endpoint is `/api/v1/messages`, so its `base_url` ends at `/api` — the
path-prefix behaviour of the GLM and OpenRouter routes is what the deferred real-call
live-verify (G) confirms.

---

## Sources

- DeepSeek Anthropic-compatible endpoint + Claude Code env config:
  <https://api-docs.deepseek.com/guides/anthropic_api>,
  <https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code>.
- Claude Code subagent model resolution + `CLAUDE_CODE_SUBAGENT_MODEL`:
  <https://code.claude.com/docs/en/sub-agents>; ambiguity/bug history:
  <https://github.com/anthropics/claude-code/issues/10993>,
  <https://github.com/affaan-m/everything-claude-code/issues/173>.
- Headless mode (`-p`, `--output-format json`, `--resume`, per-model cost):
  <https://code.claude.com/docs/en/headless>.
- Third-party proxies: claude-code-router <https://github.com/musistudio/claude-code-router>;
  LiteLLM + the `1.82.7`/`1.82.8` compromise warning <https://www.morphllm.com/claude-code-litellm>.
- **Internal (primary evidence):** the empirical routing probe run this session —
  logger `_scratch/proxy-probe/logger.mjs`, two pinned probe agents, the distinct-model
  hit log (table above). Confidence: high (direct observation of the wire).
