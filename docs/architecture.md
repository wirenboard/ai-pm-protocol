# Architecture

> The engineer's mental model — how the pieces fit and where to change them. `PROTOCOL.md` is the constitution (*what* must happen); this file is the construction (*how* it is built). It stays **neutral**, like the rest of the core: platform specifics are not here, they live in the adapter (`src/adapter/README.md`, `src/adapter/INSTALL.md`). This file maps the parts; it does not restate the rules.

## What it is

One neutral core plus one thin adapter per platform. The **core** is prose and data an engineer reads without knowing the harness: the constitution (`PROTOCOL.md`), three role agents (`src/agents/`), this file, the project config (`ai-pm.config.json`), the quality layer (`src/quality/`), and the shared enforcement data (`src/adapter/deny-rules.json`, `src/adapter/tool-map.json`). The **adapter** is the only platform-specific code: a small shim per platform that wires the harness to the shared engine. The whole thing is small on purpose — readable in one sitting (`PROTOCOL.md` Manifesto).

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

The shim is the only platform-specific code; the engine and the rules are shared, read at runtime by **both** shims. That is why the two platforms cannot drift — there is exactly one rule list and one predicate, not a translated copy per platform (the full argument: `src/adapter/README.md` "No regex drift").

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
 src/agents/*.md   role procedures          deny-rules.json  shared rules (data)
 docs/architecture.md this file             tool-map.json    neutral noun → tool
 ai-pm.config.json roles · mode · platform  <platform>/      the shim (normalise
src/quality/          the project's checks                      + map verdict) + glue
```

Adding a platform = write **only** its shim (input-normaliser + verdict-mapper + install glue) and add its column to `tool-map.json`; **zero edits** to the engine, the rules, or the core. If a new platform forces an edit to any of those, the boundary leaked (`PROTOCOL.md` `## Core and adapter`). Two integrity guards hold the boundary, both in `src/adapter/parity.test.mjs`: **parity** (both shims reach the identical verdict on a shared fixture, bar a recorded capability divergence) and **single-engine** (no rule logic leaked into a shim). Deploy layout for the two current platforms: `src/adapter/INSTALL.md`.

## Capability modules

The protocol's decomposition runs on one more axis than platform / role / quality: **role content**. A role agent is no longer a hand-authored monolith — it is a lean **floor body** (`src/agents/<role>.md`, the always-on text, the single home of a role's floor) plus the project's enabled **capability modules**, each a toggleable bundle that DEEPENS a role's checklist. Toggle a module off and its part is simply not composed in; the floor never moves.

The pieces and their single homes:

```
 modules.json            the registry — the catalog (toggle shape · per-kind
                         defaults · targets · fragment pointers). NO floor prose.
 src/modules/<id>/<role>.md  a FRAGMENT — the deepening one module adds to one role
                         (core prose; subject to the neutral-prose guard).
 src/agents/<role>.md        the FLOOR body — always-on role text + ONE marker line
                         `<!-- ai-pm:modules -->` where modules compose in.
 src/adapter/modules.mjs     the SHARED assembler — read by BOTH install-agents shims
                         (one home, like engine.mjs for the deny shims).
 ai-pm.config.json       `modules` — the project's per-module toggle values.
```

**Assembly.** Each install-agents shim builds a role file as `frontmatter + composeBody(floor)`. `composeBody` replaces the role's single marker with the enabled modules' fragments for that role, in **registry order** (stable, declared — not config order). A floor body with no marker takes no modules and is returned unchanged.

**Enabled-resolution** mirrors the engine's `projectProfile` fail-safe: a module is OFF only on a literal `false` (or `{ enabled: false }`); **everything else — `true`, an object, a malformed value, an absent key — resolves it ON** with the per-`kind` default merged under any config override. An unknown/absent project `kind` takes the **strict-side** defaults. So a bad config can only ever turn MORE rigor on, never silently disable it.

**Two security guards** (the assembler's own threat model): a fragment pointer that is absolute or `..`-bearing is **rejected** (`resolveFragmentPath`, mirroring the engine's `isInsideRoot` — invariant 2); a fragment NAMED by an enabled module but MISSING on disk is a **hard error** at assembly, never a silent drop of a security section.

**Honesty.** A capability module is **`[persona]`** — composed prompt text that sharpens what a role THINKS about. It blocks nothing at the tool-call layer unless it ALSO carries a deny rule (in which case that rule, not the fragment, is the `[mechanical]` part, and it lives in `deny-rules.json` like every other). The registry, the config doc, and the fragments all label it so; over-claiming a module as mechanical enforcement is a Reviewer honesty-gate find.

The shipped module is **threat-model**: it deepens the Reviewer's always-on security item and the Builder's plan-time Security-surface question into explicit threat enumeration. Its FLOOR (a security-relevant change must have its threats named and considered) stays in the role floor bodies; the module fragment is purely the deepening.

## Extension points

- **Add a platform.** `src/adapter/<platform>/` — the input-normaliser, the verdict-mapper, the install glue — plus a `tool-map.json` column and a parity-fixture pair. Nothing else.
- **Add a capability module.** A row in `modules.json` (toggle · per-kind defaults · targets · fragment pointers) + its `src/modules/<id>/<role>.md` fragments + a `<!-- ai-pm:modules -->` marker in each targeted role's floor body. Both install-agents shims compose it for free — they share the one assembler (`src/adapter/modules.mjs`). No core edit.
- **Add a deny rule.** A row in `deny-rules.json` (intent · class · act · predicate); if the check is new, a predicate in `engine.mjs`; a case in `parity.test.mjs`. Both shims pick it up for free — they read the one list.
- **Swap a role.** Bind a different agent in `ai-pm.config.json` `roles` — any agent that honours the seat's contract (`PROTOCOL.md` `## Role contracts`), zero core edit.
- **Add a quality tool.** Drop its config in `src/quality/` and a row in `src/quality/tools.json` (what it checks · the command · the beat). No core edit (`PROTOCOL.md` `## Quality tools`).
- **List available models.** A neutral contract point setup uses to put real model choices before the Operator (the orchestrator's `## Setup`). Each adapter realises it: Claude returns its known model pair, OpenCode discovers the environment's models — realisation noted in `tool-map.json` `models`, no environment-specific id in the core.
- **Apply config / re-assemble agents.** The neutral act setup runs after writing `ai-pm.config.json` to make the choices take effect — re-assemble the role agents (and commands) from the just-written config (the orchestrator's `## Setup` step 4). Each adapter realises it as its install command, recorded in `tool-map.json` `apply-config`; no platform mechanism in this prose.
- **Detect missing config / invoke setup.** Two neutral acts that fire the setup procedure. *Detect* — a work request to a project with no `ai-pm.config.json` runs setup first (the orchestrator's `## Setup` "when it fires", a `[persona]` act), reinforced by the `no-config-run-setup` inject row in `deny-rules.json` (it nudges, never blocks). *Invoke* — an explicit per-platform setup command runs it on demand; its assembly + deploy is the install step (`src/adapter/INSTALL.md`). Both point at the one home — the procedure is never restated.

## Open assumptions

- **OpenCode plugin load.** The OpenCode shim ships as an **own-export** entry (a bare re-export loads but its hook never fires — dogfood finding, `src/adapter/INSTALL.md`) so the engine stays out of the scanned plugin dir; the two shims are proven to decide identically by the parity guard, and the plugin's **live deny is verified on opencode 1.17.x** (a write into `.ai-pm/tooling/` is mechanically blocked — `src/adapter/INSTALL.md`, the OpenCode "Spawn a sub-agent" note). The Claude side — a hook running `node shim.mjs` — is proven by the node-spike in `src/adapter/parity.test.mjs`.
