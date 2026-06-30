# Extracting the model-router into `modelpipe` (a standalone repo)

**Question (2026-06-30).** The protocol grew a model-router (5.32–5.36: passthrough
reverse-proxy + provider catalog + launcher + vision fallback). It is **useful on its own**,
beyond this protocol. Should it become its own repo, and where is the boundary?

**Decision.** Yes — extract the **transport** into a standalone repo **`modelpipe`**, owned by
the **user `aadegtyarev`** (NOT an org). Staged, transport-only, no-translator-ever.

---

## The boundary: transport vs policy (the load-bearing line)

- **Transport (→ `modelpipe`, standalone):** the router core + the provider catalog + a thin
  CLI to start it. It directs **ANY model-bearing call a client makes** to a chosen
  **Anthropic-format** backend: the `opus`/`sonnet`/`haiku` tiers across **different**
  providers, the auto-mode **guard** model (opt-in; default untouched), and the **image-turn
  vision fallback** (reactive catch-`400`). **Passthrough, no translator.** Works with **any
  Anthropic-format client** (the Anthropic SDK, Cline, Cursor's Anthropic mode, Claude Code —
  not Claude-Code-specific); the routing **richness scales with how many distinct model-ids
  the client emits** (Claude Code emits a rich set → the richest consumer).
- **Policy (stays in the protocol):** the **per-role baking** (`auto` → the opposite model;
  reviewer cross-model) and the **launcher** (`router-launch.mjs` reads `.ai-dev/config.json`
  seat pins, spins the router only when ≥2 endpoints, unsets `CLAUDE_CODE_SUBAGENT_MODEL`,
  execs `claude`). The launcher KNOWS about seats/config — that is policy, not transport, so
  it stays here and *uses* `modelpipe` as its transport.

Standalone, `modelpipe` gives transport (tiers + guard + vision). The **per-ROLE automatic
cross-model** review is the protocol's baking on top — not part of `modelpipe`.

## What moves vs stays

| Artifact | Destination |
| --- | --- |
| `model-router.mjs` (+ a `modelpipe` CLI bin) | **`modelpipe`** |
| `model-providers.json` (catalog) | **`modelpipe`** |
| `model-router.example.json` (routes example) | **`modelpipe`** |
| `model-router.test.mjs` | **`modelpipe`** |
| `router-launch.mjs` + `.test.mjs` (policy: reads `.ai-dev/config.json`) | **protocol** |
| the per-role baking (`claude/install-agents.mjs`) | **protocol** |

## Staged migration (why two phases)

- **Phase 1 (now, autonomous):** create `aadegtyarev/modelpipe` **PRIVATE**, populate it with
  the transport (router + catalog + example + tests + README install/config + `package.json`
  with a `modelpipe` bin + CI + MIT LICENSE). Self-contained; the protocol is **untouched**.
  The repo stays **private** until the Operator reviews and flips it public (publishing code is
  outward-facing and effectively permanent — the public-flip is the **Operator's explicit
  word**, never silent).
- **Phase 2 (DEFERRED to the Operator — the gnarly part):** rewire the protocol to **consume**
  `modelpipe` and drop its in-tree router copy. This is a real packaging decision with
  **downstream impact** (the installer vendors the adapter into `.ai-dev/tooling/`; a dep
  changes how downstream gets the router). Options: an **npm dependency** (cleanest for a Node
  tool — `npm i @aadegtyarev/modelpipe` or a published name) vs a **git submodule** (vendoring,
  like `.ai-dev/tooling`). Until phase 2, the router lives in BOTH the protocol and `modelpipe`
  — a **deliberate, tracked transient duplication** (this doc is its one home), resolved when
  phase 2 lands. Phase 2 is NOT done autonomously: it needs the Operator's packaging call and
  is the partly-irreversible cross-repo step.

## Naming / trademark

`modelpipe` — neutral, no `claude`/`anthropic` in a public name (Anthropic trademark; a name
implying endorsement is a liability). Conveys the transport ("a pipe for model calls").

## Sources

- The router design + the per-seat/vision/guard facts: `docs/decisions/per-seat-model-routing.md`,
  `docs/decisions/vision-routing.md`. The transport/policy framing + the "any Anthropic-format
  client; richness scales with model-ids emitted" value-prop were settled in the 2026-06-30
  working session. License: MIT, © Alexander Degtyarev (matches this repo's `LICENSE`).
