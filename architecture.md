# Architecture

> The engineer's mental model — how the pieces fit and where to change them. `PROTOCOL.md` is the constitution (*what* must happen); this file is the construction (*how* it is built). It stays **neutral**, like the rest of the core: platform specifics are not here, they live in the adapter (`adapter/README.md`, `adapter/INSTALL.md`). This file maps the parts; it does not restate the rules.

## What it is

One neutral core plus one thin adapter per platform. The **core** is prose and data an engineer reads without knowing the harness: the constitution (`PROTOCOL.md`), three role agents (`agents/`), this file, the project config (`ai-pm.config.json`), the quality layer (`quality/`), and the shared enforcement data (`adapter/deny-rules.json`, `adapter/tool-map.json`). The **adapter** is the only platform-specific code: a small shim per platform that wires the harness to the shared engine. The whole thing is small on purpose — readable in one sitting (`PROTOCOL.md` Manifesto).

## Actor model

Three roles, two of them spawned (contracts in `PROTOCOL.md` `## The three roles`):

- the **Orchestrator** is the running session — it routes, holds gates, owns git and state;
- the **Builder** and **Reviewer** are **separate spawned sub-agents** — separate contexts.

That separation is load-bearing, not cosmetic: it is what the enforcement layer reads to tell *the Orchestrator authored content* (denied) from *a sub-agent authored content* (allowed). The actor signal is resolved per platform and fed to the engine; where a platform cannot resolve it, the actor-dependent rule falls back to persona (below).

## How a guarded action flows

Every guarded action — a tool call (read / write / bash / spawn) or a submitted prompt — passes through the platform's deny layer before it runs. The layer is one shared engine plus a per-platform shim:

```
 a role acts (tool call, or a submitted prompt)
        │
        ▼
 [platform deny layer] ── the harness intercepts the action
        │
        ▼
 shim.normalise(payload) ──▶ neutral input { act, path, command, spawnTarget, … }
        │
        ▼
 engine.evaluate(input, deny-rules) ── ONE shared engine, every platform:
        │                               walk the rules, run each predicate
        ▼
 verdict { allow | deny | ask | inject }
        │
        ▼
 shim maps the verdict to the platform's mechanism
   deny → block · ask → confirm with the Operator · inject → add context · allow → run
```

The shim is the only platform-specific code; the engine and the rules are shared, read at runtime by **both** shims. That is why the two platforms cannot drift — there is exactly one rule list and one predicate, not a translated copy per platform (the full argument: `adapter/README.md` "No regex drift").

## Enforcement — the honest floor

The load-bearing distinction: what the deny layer actually **stops at the tool-call layer** versus what only the prose asks for. The layer can block an action (and, where the platform supports it, ask first). It **cannot** force a positive act (cannot make the Orchestrator spawn a Reviewer) and **cannot** read the Orchestrator's reasoning. So every protection is either *mechanical* (a rule in the engine) or *persona* (prose only). `PROTOCOL.md` `## Enforcement` labels each honestly and lists the persona-only ones; this section is the code map.

The rules are **data**: each row in `deny-rules.json` carries an intent, a class, which neutral act it watches, and the name of a **predicate** — a function in `engine.mjs` that decides. Classes: `deny` (block) · `ask` (confirm) · `inject` (add context, don't block). To see every rule, read `deny-rules.json`; to see how one decides, read its predicate in `engine.mjs`. The engine returns the first `deny`, else the first `ask`, else an `inject`, else `allow`.

Two wrinkles are the only non-obvious part, and both are **platform-capability** divergences — recorded per rule, never silent:

- **ask-class rules** need a platform that can confirm-before-proceeding. A platform with no ask-return falls back to persona for those (each such rule names it in its `fallback`).
- **actor-dependent rules** (the Orchestrator-authors-content guard) need the platform to resolve whether the session is the Orchestrator. A platform that cannot **fails open on the actor** — the rule allows rather than risk a false denial — and the guarantee falls back to persona there.

## Integration — core / adapter

```
 core (neutral, every platform)             adapter (the only platform code)
 ──────────────────────────────             ────────────────────────────────
 PROTOCOL.md       the constitution         engine.mjs       shared predicates
 agents/*.md       role procedures          deny-rules.json  shared rules (data)
 architecture.md   this file                tool-map.json    neutral noun → tool
 ai-pm.config.json roles · mode · platform  <platform>/      the shim (normalise
 quality/          the project's checks                      + map verdict) + glue
```

Adding a platform = write **only** its shim (input-normaliser + verdict-mapper + install glue) and add its column to `tool-map.json`; **zero edits** to the engine, the rules, or the core. If a new platform forces an edit to any of those, the boundary leaked (`PROTOCOL.md` `## Core and adapter`). Two integrity guards hold the boundary, both in `adapter/parity.test.mjs`: **parity** (both shims reach the identical verdict on a shared fixture, bar a recorded capability divergence) and **single-engine** (no rule logic leaked into a shim). Deploy layout for the two current platforms: `adapter/INSTALL.md`.

## Extension points

- **Add a platform.** `adapter/<platform>/` — the input-normaliser, the verdict-mapper, the install glue — plus a `tool-map.json` column and a parity-fixture pair. Nothing else.
- **Add a deny rule.** A row in `deny-rules.json` (intent · class · act · predicate); if the check is new, a predicate in `engine.mjs`; a case in `parity.test.mjs`. Both shims pick it up for free — they read the one list.
- **Swap a role.** Bind a different agent in `ai-pm.config.json` `roles` — any agent that honours the seat's contract (`PROTOCOL.md` `## Role contracts`), zero core edit.
- **Add a quality tool.** Drop its config in `quality/` and a row in `quality/tools.json` (what it checks · the command · the beat). No core edit (`PROTOCOL.md` `## Quality tools`).
- **List available models.** A neutral contract point setup uses to put real model choices before the Operator (the orchestrator's `## Setup`). Each adapter realises it: Claude returns its known model pair, OpenCode discovers the environment's models — realisation noted in `tool-map.json` `models`, no environment-specific id in the core.
- **Detect missing config / invoke setup.** Two neutral acts that fire the setup procedure. *Detect* — a work request to a project with no `ai-pm.config.json` runs setup first (the orchestrator's `## Setup` "when it fires", a `[persona]` act), reinforced by the `no-config-run-setup` inject row in `deny-rules.json` (it nudges, never blocks). *Invoke* — an explicit per-platform setup command runs it on demand; its assembly + deploy is the install step (`adapter/INSTALL.md`). Both point at the one home — the procedure is never restated.

## Open assumptions

- **OpenCode plugin load.** The OpenCode shim ships as an **own-export** entry (a bare re-export loads but its hook never fires — dogfood finding, `adapter/INSTALL.md`) so the engine stays out of the scanned plugin dir; the two shims are proven to decide identically by the parity guard, but the plugin's **live deny is pending a single interactive capture** (`adapter/INSTALL.md ## OpenCode`). The Claude side — a hook running `node shim.mjs` — is proven by the node-spike in `adapter/parity.test.mjs`.
