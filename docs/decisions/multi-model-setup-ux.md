# Multi-model setup UX — one coherent flow from "I have a proxy" to "my seats run on my models"

**Status: RATIFIED by the Operator (2026-06-30).** The launch-time-models fork is settled
as **option (c) hybrid, with a source-of-truth refinement** (see `## The fork`): the
session + guard models live in `.ai-dev/config.json` as the ONE home, and **every launch
path reads them** — `router-launch.mjs` exports them as env automatically, and a wrapper
launcher reads the same config values (a documented one-liner / mirror). This keeps (c)'s
con — a "sometimes-dead" field for wrapper users — from materialising: the field is the
documented SOURCE that the launch path consumes, never a value nothing applies, so it
honours the no-dead-cosmetic bar requirements 1+2 set. The concrete build
(`## The build worklist`) is a single follow-up feature through the loop, NOT built here.

**Question.** Setting up multi-model routing — running the loop's seats on different
model providers via an external Anthropic-format proxy (`modelpipe`) — is today a
fragmented, papercut-ridden flow. The Operator wants the transition and setup to be
**simple and coherently designed**, not patched piecemeal. This doc maps the full
journey and proposes one flow that removes every papercut at once.

This consolidates six 2026-06-30 backlog entries into one UX (referenced, not restated):
the coarse models-per-role dialog, the re-bake-awareness gap, the false installer log,
the guard-model seat, modelpipe expose-configured-models, and Claude-native autostart.

**`auto` is a vanilla-only convenience, and `haiku` is allow-listed (RATIFIED 2026-06-30).**
Two coupled refinements to the per-seat model, settled after the flow above:

- **`auto` is honored only in the VANILLA state.** `auto` (the reviewer rides the model
  opposite the session, opus↔sonnet) is a safe out-of-box default ONLY on stock Claude
  Code, where that pair is guaranteed. The moment the config carries any explicit model
  decision — a concrete pin on any seat, or a non-empty launch model (the multi-model /
  proxy world, where an alias can hide anything) — that automatic opus↔sonnet guess is a
  fiction. So once the config is **customized**, a reviewer `auto` (or an absent reviewer,
  which defaults to `auto`) degrades to `session`: no baked line, an honest inherit, no
  false cross-model claim. A per-seat **`default`** dialog choice un-pins a seat (omit the
  `model` key); un-pinning everything returns the config to vanilla and `auto` revives. The
  vanilla/customized predicate's single home is `src/adapter/claude/install-agents.mjs`
  `isVanilla`; the contract it serves is `docs/contracts/cross-model-review.md`.
- **`haiku` is a first-class allow-listed Claude model** (`tool-map.json`
  `models.claude.allow` = opus/sonnet/haiku, `ids.haiku` = `claude-haiku-4-5`). It is a real
  choice for any seat — the cheap background guard, or an explicit builder/reviewer pin —
  and bakes like any other alias (a haiku pin resolves automatically; the installer code is
  not touched per-model). **`auto`'s opposite logic itself stays opus↔sonnet** and never
  picks haiku — haiku is not a review-grade slot for the automatic cross-model default; it
  is only ever chosen by an explicit pin.

This refines the seat-question dialog (`## Recommendation` item 2, `## Papercut 1`): the
dialog leads with zero-config (vanilla); when the Operator pins any seat, it presents
per-seat explicit choices (`default` to un-pin + concrete ids incl. haiku), with **no `auto`
option in that customized branch**, and states plainly that pinning turns auto off and that
`default` on the reviewer rides the session (no cross-model). Where this supersedes the
earlier "each `session`/`auto`/typed-id" framing, the rule here wins.

---

## The conceptual split the whole design rests on

The Operator's requirements 1+2 force one distinction that the current flow blurs and
that every later decision follows from. There are **two kinds of "model choice"**, set
in two different places by two different mechanisms:

| | **Baked subagent seats** | **Launch-time models** |
| --- | --- | --- |
| Seats | `builder`, `reviewer` | session/orchestrator, `guard` |
| Home | `roles.{builder,reviewer}.model` in `.ai-dev/config.json` | session env, set BEFORE `claude` starts |
| Mechanism | baked into the assembled agent at install (Claude forwards a subagent's baked `model:` to the endpoint — `docs/decisions/per-seat-model-routing.md` fact 2) | `ANTHROPIC_MODEL` (session) / `ANTHROPIC_SMALL_FAST_MODEL` (guard) |
| Change needs | a re-bake (re-run the installer) | nothing baked — re-exported next launch |

- The **orchestrator IS the running session** — its model is the launch model. A config
  pin for it is dead cosmetics: nothing reads it, nothing applies it. Requirement 2
  removes it from the selection entirely (see `## Papercut 2`).
- The **guard** is the harness background/small-fast model
  (`ANTHROPIC_SMALL_FAST_MODEL`) — a launch-time env, never baked, now a first-class
  configurable seat (requirement 1).

So the **only two true config-model pins are `builder` and `reviewer`.** Everything else
is launch-time env. The current setup dialog (`src/agents/orchestrator.md` `## Setup`
step 2, models-per-role) gets this wrong on both ends: it offers an orchestrator pin
(dead cosmetics) and it has no guard seat at all.

---

## The chain: what a model string actually does (requirement 5)

A user setting up routing needs to know **whether to write an alias or a concrete id**.
The answer is the resolution chain a model string travels, end to end:

```text
config pin (roles.{builder,reviewer}.model)  or  launch env (ANTHROPIC_MODEL / _SMALL_FAST_MODEL)
        │
        ▼  Claude Code alias resolution
   an alias ("sonnet"/"haiku"/"opus")  →  ANTHROPIC_DEFAULT_{SONNET,HAIKU,OPUS}_MODEL  (if set)
   a concrete id ("deepseek-v4-pro")    →  passthrough, used verbatim
        │
        ▼  the string lands in the request body's `model` field
        │
        ▼  modelpipe routing (src/adapter/model-router.mjs `pickRoute`)
   matched against each route's `match` glob, LITERAL FIRST-MATCH; modelpipe does NOT
   alias and does NOT translate — it routes by `body.model` alone and forwards.
```

**The practical rule for the user, stated crisply:**

- modelpipe matches the **exact string that arrives in `body.model`**. It never resolves
  an alias — that is Claude Code's job, upstream, via `ANTHROPIC_DEFAULT_*_MODEL`.
- So a route's `match` glob must target **what actually arrives**:
  - If a seat pins a **concrete provider id** (e.g. `deepseek-v4-pro`), that id passes
    through verbatim → the route matches `deepseek-*`. **Write the concrete id.**
    *(Superseded for BAKED seats by papercut 11 + 12: on Claude a concrete foreign id in
    `roles.{builder,reviewer}.model` is dropped by the installer — tier-bind instead. A
    concrete id still works for the launch-env session/guard seats.)*
  - If a seat pins a Claude **alias** (`sonnet`), it resolves to whatever
    `ANTHROPIC_DEFAULT_SONNET_MODEL` says (or the default `claude-sonnet-*`) → the route
    matches that. **An alias only works if the proxy has a route for the resolved id.**
- **For a cross-endpoint seat, write the concrete provider id**, not an alias — it is the
  string modelpipe sees, no indirection to reason about. Aliases stay useful for the
  all-Anthropic case where the default `claude-*` route catches them.

This chain belongs in the setup dialog's one-line explanation and in the routes-config
doc, so a user is never guessing which to write. (Provider catalog + `match` globs:
`src/adapter/model-providers.json`; the routing code: `model-router.mjs` `pickRoute`.)

---

## The journey: zero → working (the proposed flow)

The numbered steps a real user takes, from "I have a project + a running proxy" to "my
seats run on my models". The flow assumes `platform: claude` (the whole router surface is
inert on OpenCode — `docs/decisions/per-seat-model-routing.md` constraint 3).

1. **Start the proxy** (or have it running). The proxy exposes its route table — model
   ids, capabilities, host — on a safe-surface introspection (requirement 8, built in
   modelpipe; see `## Papercut 8`).
2. **Run `/dev-setup` (or the model-switch handler).** The dialog:
   - **reads the running proxy's exposed route table** and offers the configured model
     ids per seat instead of re-asking from scratch (requirement 8);
   - asks **three independent seat questions** — `builder`, `reviewer`, `guard` — each
     `session` / `auto` / a typed concrete id, defaulting to the current value
     (requirement 1). **No orchestrator question** (requirement 2);
   - states the alias-vs-concrete-id rule in one line (`## The chain` above);
   - confirms the external proxy URL (`proxyUrl`, already shipped — requirement 6).
3. **Setup writes the config** — `roles.{builder,reviewer}.model` (baked seats) and the
   launch-time section for session+guard (see `## The fork` for where that lives).
4. **Setup re-bakes automatically** and, if it cannot, **prints the context-correct
   install command** (requirement 4 — dogfood vs downstream, see `## Papercut 4`).
5. **Launch through the wrapper** so `ANTHROPIC_BASE_URL` (→ the proxy) and the launch-time
   models are exported BEFORE `claude` starts (requirement 7 — the honest constraint, see
   `## Papercut 7`). The launcher (`router-launch.mjs`) already handles the proxy URL via
   `proxyUrl` external mode.
6. **Done.** Builder and reviewer subagents carry their baked `model:` → it arrives in
   `body.model` → modelpipe routes each to its provider.

The transition from a non-routing project is the same flow minus step 1's "have a proxy":
a project that never sets a cross-endpoint seat is byte-unchanged (the opt-in is the
routes config + a cross-endpoint pin, never a switch — `per-seat-model-routing.md`
constraint 2).

---

## The papercuts, and how the flow removes each

Each maps to a 2026-06-30 backlog entry; the flow above removes it.

### Papercut 1 — the models-per-role dialog is too coarse

**Today:** the dialog bundles orchestrator+builder into one choice and offers presets, so
a user cannot set `builder ≠ orchestrator` or pick seats independently — the advertised
per-seat granularity is unreachable. **Removed by:** step 2's three independent seat
questions (`builder` / `reviewer` / `guard`), each `session`/`auto`/typed-id, defaulting
to the current value, zero-config (`auto`) led. The honesty caveats are unchanged: Claude
bakes the per-seat `model:`; `auto` resolves to an Anthropic id (flag this for
external-proxy users who need a concrete proxy-routed pin, per `## The chain`). **Refined by
the vanilla-only-`auto` rule above** — `auto` is offered only in the zero-config (vanilla)
lead; in the customized (any-pin) branch the dialog drops `auto` and offers `default` + concrete ids
(incl. haiku) instead.

### Papercut 2 — the orchestrator model is dead cosmetics

**Today:** the dialog asks for an orchestrator model and the config can carry
`roles.orchestrator.model`, but nothing applies it — the orchestrator IS the session, its
model is the launch model. A stored value that nothing reads is a honesty defect (it
implies a control that does not exist). **Removed by:** dropping the orchestrator question
from the dialog entirely and not storing `roles.orchestrator.model`. The session model is
a launch-time env (`## The fork`), set the same way the guard is. `roles.orchestrator`
keeps only its `agent` binding (no `model` key).

### Papercut 4 — a model change needs a re-bake, with the context-correct command

**Today:** nothing tells the Operator that editing `roles.{builder,reviewer}.model` (via
dialog OR by hand) requires re-assembling the agents so the baked `model:` updates. The
live trigger: the Operator ran the **dogfood** command in a **downstream** repo and hit
`MODULE_NOT_FOUND`, because `src/adapter/install.mjs` exists only in the protocol source —
the orchestrator never told them the downstream path
(`.ai-dev/tooling/src/adapter/install.mjs`, NO `--dogfood`). **Removed by:**

- A **model-switch-mid-stream handler**, mirroring `## Setup` *Mode switch mid-stream*
  (`src/agents/orchestrator.md`): the Operator names a seat model directly → a one-line
  confirm → flip the pin → **re-apply the config (re-bake)** → announce. This is the
  natural home for "a baked seat changed, re-bake now" — the same lightweight-flip pattern
  the mode/doc-language/collaboration switches already use.
- The orchestrator **knows the context** (dogfood = the protocol source repo;
  downstream = a project carrying `.ai-dev/tooling/`) and gives the **right command**:
  - dogfood: `node src/adapter/install.mjs . --dogfood --platform <p>`
  - downstream: `node .ai-dev/tooling/src/adapter/install.mjs . --platform <p>` (no
    `--dogfood`)
  - The context signal is the same sentinel `install.mjs` already uses (`isSourceRepo` —
    `src/adapter/install.mjs:84`: `src/adapter/install.mjs` present at root ⇒ dogfood).
- **Ideally auto-apply** the re-bake (the installer is idempotent — `install.mjs`), so the
  Operator never types a command. Printing the context-correct command is the fallback
  when the orchestrator cannot run the install itself (e.g. a write it must route).

### Papercut 9 — the installer falsely logs "wrote config"

**Today:** `ensureConfig` (`src/adapter/install-core.mjs:81`) writes the default config
**only where absent** (correct — never clobbers), but the install summary
(`src/adapter/install.mjs:201`) prints `• wrote .ai-dev/config.json (minimal default)`
**unconditionally**, even when `ensureConfig` was a no-op. A re-install on a configured
project reads as a config-clobber scare (the Operator thought their model pins / mode /
profile were overwritten). No data loss, but the log lying is a real honesty defect.
**Removed by:** `ensureConfig` reports whether it wrote (return a flag, or the caller
checks `fs.existsSync` first); the summary prints `wrote … (minimal default)` only on an
actual write, else `kept existing .ai-dev/config.json` (or nothing). Trivial — folds into
this slice or a standalone fixup.

### Papercut 8 — the proxy exposes its configured models (reuse, don't re-ask)

**Today:** setup asks the routing from scratch even when a running proxy already knows its
full route table. **Removed by:** modelpipe exposing its configured set (model ids,
capabilities, base_url host) on a safe-surface introspection — a `--list` dump or a
read-only localhost endpoint — that the setup dialog reads to offer the configured models
per seat (step 2). **Safe-surface boundary (load-bearing):** expose model ids +
capabilities + host; the `keyEnv` *names* are borderline (probably fine); **never key
values or auth secrets** — the no-secret-logging posture (`model-router.mjs` SECURITY
POSTURE) extends here. This half **lands in modelpipe** (the transport owns its own
config); the protocol **consumes** it (`docs/decisions/proxy-consume-mechanism.md` — the
synced vendor-copy boundary). It needs its own scoping in modelpipe before the protocol
can read it; until then, the dialog falls back to asking (no hard dependency).

---

### Papercut 10 — cross-endpoint is undiscoverable; "impossible from the session" overclaim (a `/dev-setup` dogfood run, 2026-07-01)

A live `/dev-setup` surfaced three setup-UX defects, fixed together:

- **Undiscoverable cross-endpoint.** The per-seat model question buried the non-Anthropic
  choice behind the structured-question "Other" free-text escape — a feature you can only
  reach if you already know it exists. **Removed by:** a **visible `another provider
  (non-Anthropic)` option** in every seat's option set (a NAMED choice that opens the
  routing sub-flow), and a **uniform per-seat option set** so no seat silently omits a model
  (the live slip that started this: `haiku` offered for builder/guard but not reviewer).
- **Probe-first discovery.** The dialog never checked for a proxy the Operator already runs.
  **Removed by:** `./.ai-dev/launch --probe` — a best-effort `GET /v1/models` over the
  candidate origins (an explicit url, the routes-config `proxyUrl`, the conventional
  localhost `8787`) printing `{ alive, url, models }`. A live hit offers its ids per seat and
  **skips the URL question**; nothing answering falls through to the explicit **external
  (proxyUrl) vs built-in (spawn, random free port)** fork. This is the **consume** half of
  papercut 8's "read-only localhost endpoint": the probe targets exactly that endpoint, and
  the modelpipe side of it (the `/v1/models` route) is the upstream change papercut 8 names.
  Against an older modelpipe the probe simply finds nothing — honest, no false promise.
- **"Proxy can't be configured from a session" overclaim.** The launcher README's "No true
  in-harness autostart … cannot be wired from inside a running session" read as *impossible*.
  **Corrected to** the honest framing (`src/adapter/README.md` `### The launcher`): the
  *configuration* is fully written from the session; only the *running process* cannot rebind
  its own env, so the accurate statement is **"set it from the session → restart to apply"**.

The probe's candidate-list + response parse are pure, unit-tested (`probeCandidates` /
`parseModelsResponse`, `router-launch.test.mjs`); the live HTTP is the one untestable rung.

---

### Papercut 11 — the per-seat model dialog has the WRONG SHAPE for cross-endpoint (the Operator's two-stage insight, 2026-07-01)

**The mechanism (confirmed):** Claude Code connects a foreign model by binding a **tier
alias** — `ANTHROPIC_DEFAULT_{OPUS,SONNET,HAIKU}_MODEL=<foreign-id>`; a role uses a tier and
resolves to it. The Operator's own `noos` runs exactly this way
(`ANTHROPIC_DEFAULT_SONNET_MODEL=glm-5.2`, `…HAIKU…=deepseek-v4-pro`; builder=haiku→deepseek,
reviewer=sonnet→glm), set by hand in a personal wrapper.

**The defects:**

- **No config home** for the alias bindings — `launch` had only `sessionModel`/`guardModel`/
  `configDir`. **Removed by** `launch.aliases.{opus,sonnet,haiku}` → exported as
  `ANTHROPIC_DEFAULT_*_MODEL` by both consumers (installer→`settings.json` env; launcher→child
  env), same launch-env class. `aliases` is the one nested launch field — `mergeLocalLaunch`
  deep-merges it per-tier (a personal `config.local.json` overrides one tier, keeps the rest).
- **The dialog asked per-seat for a concrete id** and **README + the 5.45.0 setup edits
  recommended the wrong path** ("write the concrete provider id"). **Removed by** the
  two-stage dialog: **Stage 1** binds Claude tiers ↔ foreign models, **Stage 2** maps roles →
  tiers. README's chain conclusion now leads with tier-binding (the lever that also moves
  subagents + the background model); concrete-id-per-seat stays documented as the alternative.

**The probe returns provider GLOBS, not concrete ids** (modelpipe routes by glob): a binding
needs a concrete id, so Stage 1 is **provider + model name** — pick a provider from the probe,
enter the concrete id, validated against the glob (`glm-5.2` matches `glm-*`). Proxy-agnostic
by response shape: a concrete `id` (no `*`) is a direct pick-list (third-party LiteLLM-class
proxies work out of the box); a glob means the provider step. **Follow-up (modelpipe):** a
`/v1/models?expand=1` that queries each backend's catalog and returns concrete ids filtered by
the glob (only the proxy holds the provider keys) — spec handed to the Operator; upgrades
Stage 1's glob branch from manual entry to a real filtered pick-list. **Follow-up (probe):** an
auth header so an authed third-party proxy's `/v1/models` discovers too (today it 401s → manual).

---

### Papercut 12 — the dialog regressed to role-first; corrected to Stage-1-global-first (2026-07-01)

Papercut 11 ratified the two-stage shape but the **implementation** landed role-first: the
"models per seat" step asked per-seat and buried *"another provider (non-Anthropic)"* as a
per-role option that opened the sub-flow — which then re-asked the role in Stage 2 (a
double-ask) and, worse, **hid the global effect** of a tier binding. That framing bricked a
live downstream session: binding a tier silently re-pointed the running session (opus) and the
background/guard (haiku), so setting one role re-routed the whole family without warning.

**Corrected** (`src/agents/procedures/setup.md`) to the ratified order:

- **A native per-seat step** (Anthropic tiers only — `default`/opus/sonnet/haiku), then **one
  top-level GATE** — *"route any Claude tier to a non-Anthropic provider?"* (default no). The
  all-Anthropic case never leaves this one added question (the gate, ratified over
  always-two-stage on 2026-07-01: native stays lightweight).
- **On yes, Stage 1 (global tier binding) runs FIRST**, before any role picks a tier, and
  **states the global effect up front** — opus also backs the session, haiku also backs the
  guard — plus a **tier-budget note** (N foreign seats need N free tiers; native session+guard
  and both routed builder+reviewer collide). This visible warning is the guard that would have
  prevented the brick.
- **Stage 2 assigns each role a PURE tier** (opus/sonnet/haiku only — no provider choice at the
  role level).

**Direct-id claim corrected (defect verified from code, not empirical Claude behaviour).** The
README + the papercut-11 setup edits still documented "write the concrete provider id" as a valid
alternative. But on Claude a foreign id in a **baked** seat (`roles.{builder,reviewer}.model`) is
off the allow-list, so `resolveModelPin` (`src/adapter/claude/install-agents.mjs`) bakes **no**
`model:` line and the seat silently inherits the session model — it does **not** route. So **tier
binding is the sole working cross-endpoint path for a baked seat**; a concrete foreign id works
only for the launch-env session/guard (passthrough, not baked). No spike needed — the installer
code settles it. Whether Claude *would* forward a raw foreign id if one were baked is moot (the
installer never bakes it).

---

## The fork: where do the launch-time models live? (requirement, conceptual split)

The session and guard models are launch-time env, never baked. There must be **no dead
cosmetic config field** for them. Three options:

### Option (a) — config section + the protocol launcher applies it

A config section (e.g. `launch: { sessionModel, guardModel }`) that `router-launch.mjs`
reads and **exports as env before exec'ing `claude`** (`ANTHROPIC_MODEL`,
`ANTHROPIC_SMALL_FAST_MODEL`). Config is the one home; the launcher applies it.

- **Pro:** one home (the config), discoverable, the setup dialog writes it, the launcher
  enforces it — symmetric with how the baked seats flow from config to assembled agent.
- **Con:** it **only helps launcher users.** The Operator uses their OWN wrapper
  (requirement 7's honest constraint — `ANTHROPIC_BASE_URL` must be set before `claude`
  starts, so many users have a personal launch wrapper). A config field the protocol
  launcher reads is dead cosmetics for anyone not launching through `router-launch.mjs` —
  re-introducing exactly the dead-field defect papercut 2 removes, one layer down.

### Option (b) — pure launch-env, documented, never stored in the config

The session and guard models are **only** env vars the user exports in their proxy/wrapper
setup (`ANTHROPIC_MODEL`, `ANTHROPIC_SMALL_FAST_MODEL`). The config stores nothing for
them; setup documents the two env vars and (where it can) prints a ready export block.

- **Pro:** **no dead field, ever** — honest by construction. Works regardless of which
  wrapper the user launches through (the env is the universal contract Claude Code reads,
  whoever sets it). Matches requirement 7's honest reality: the launch env is the only
  mechanism that works before `claude` starts.
- **Con:** the two models are not "in the config" — a reader inspecting `.ai-dev/config.json`
  does not see them. Mitigated: they are not config-kind data (they are launch
  environment, like `ANTHROPIC_BASE_URL` and the API keys, which are also never in the
  config — `model-router.mjs` SECURITY: keys come only from env). The setup dialog and the
  routes/proxy doc are their documented home.

### Option (c) — hybrid

Store them in the config AND have the launcher export them (a), but **also** document the
raw env (b) for non-launcher users, marking the config field "applied only when launching
through `router-launch.mjs`".

- **Pro:** launcher users get one-home config; wrapper users get the documented env.
- **Con:** the field is honestly-labelled-dead for wrapper users — a "sometimes dead"
  field is harder to reason about than no field, and invites the same clobber-scare /
  false-expectation class as papercut 2.

**Original analysis recommended (b)** (pure launch-env, no stored field) as the only option
with no dead field under any launch path. **The Operator ratified (c) instead, with a
source-of-truth refinement that defeats (c)'s "sometimes-dead" con:**

**RATIFIED — (c) hybrid, config is the source every launch path reads.** The session +
guard models live in `.ai-dev/config.json` as the ONE home (e.g. a `launch:
{ sessionModel, guardModel }` section). The field is never "dead" because **every launch
path is documented to consume it**:

- **The installer writes `.claude/settings.json` `env`** (the wrapper-less consumer added by
  the protocol-consume PR — the spike's positive finding, `## Requirement 7`): the launch
  section's two values land in the harness's declarative startup env, applied on the next
  install with **no wrapper at all**. This is now the primary consume mechanism on Claude.
- `router-launch.mjs` reads the section and exports `ANTHROPIC_MODEL` /
  `ANTHROPIC_SMALL_FAST_MODEL` before exec'ing `claude` (option a's mechanism) — for projects
  launched through the protocol launcher.
- A **personal wrapper** (the Operator's case, when `ANTHROPIC_BASE_URL` must also be set
  pre-launch) reads the same config values — a documented one-liner
  (`export ANTHROPIC_MODEL=$(node -e '…read .ai-dev/config.json…')`) or an explicit
  "mirror these two values into your wrapper's env" note.

So the config is the documented SOURCE of truth and the launch path (ours or the user's) is
the documented CONSUMER — the value is always applied, never cosmetic, which is the exact
no-dead-field bar requirements 1+2 set. The cost vs (b): the launch-env contract now has a
config home that a launcher must be wired to read (router-launch must gain the read+export;
the wrapper path is doc-only). Setup still prints a **ready export block** as the wrapper
recipe. This supersedes the (b) recommendation above; (a)/(b) are kept only as the reasoning
record.

---

## Requirement 7 — the autostart honesty (SPIKE-confirmed, 2026-06-30)

**The honest constraint, now confirmed by spike:** `ANTHROPIC_BASE_URL` and the launch-time
models must be set **before `claude` starts** — Claude Code reads them at process startup.
A true in-harness autostart that wires `ANTHROPIC_BASE_URL` for the *running* session is
**IMPOSSIBLE** (not "likely impossible" — the spike settled it): a `SessionStart` hook fires
**after** the API client has already bound, and `settings.json` is read **once** at startup,
so neither can retroactively change the base URL the process already read. The proxy
*process* is therefore always started separately; no harness hook can launch it for the
session that needs it.

**The wrapper-less startup home the installer now writes: `.claude/settings.json` `env`.**
The spike's positive finding: `settings.json` `env` IS a valid **declarative** startup home
that Claude Code reads at launch — so it sets `ANTHROPIC_MODEL` / `ANTHROPIC_SMALL_FAST_MODEL`
(and could carry `ANTHROPIC_BASE_URL`) with **no bash wrapper**. The installer already manages
`.claude/settings.json` (the deny hooks), so it now also writes the config `launch` section
into `env` — `sessionModel` → `ANTHROPIC_MODEL`, `guardModel` → `ANTHROPIC_SMALL_FAST_MODEL`
(G1, below) — merging only those two keys, never clobbering a user key, and pruning them when
the `launch` section is empty (a non-routing project is byte-unchanged). This is cleaner than
the shipped "launcher/wrapper exports": the launch-time models auto-apply on the next install
with no wrapper at all. (Code: `src/adapter/install-claude.mjs` `mergeLaunchEnv`; the env-name
home + the wrapper recipe: `src/adapter/README.md` `### The launcher`.) `ANTHROPIC_BASE_URL`
itself stays the user's own proxy URL — out of scope for the installer to write unless the
config already carries it; there is no invented base-URL config field.

**The restart requirement (Operator-required MUST).** Because `settings.json` `env` is read
**only at startup**, a launch-time change (guard / session model, or the proxy base-URL) lands
in `env` but the **running session keeps the old value until restart**. So the setup dialog
AND the model-switch-mid-stream handler MUST, on any launch-time change, explicitly tell the
Operator **"restart your session for this to take effect"**. The two apply-paths are distinct
and named at the seam (`src/agents/orchestrator.md` `## Setup`): a **baked** seat change
(builder/reviewer) ⇒ **re-bake** (takes effect on the next spawn); a **launch-time** change
(guard/session) ⇒ **re-run the installer to update `settings.json` `env`** + **announce a
session RESTART**.

**G1 — the guard maps to the DEPRECATED `ANTHROPIC_SMALL_FAST_MODEL` (decided, kept).** The
modern path folds the background/small-fast model into the haiku slot
(`ANTHROPIC_DEFAULT_HAIKU_MODEL`), which in a typical routed setup is *also* the builder seat —
so the only way to set the background model **independently** of the haiku slot is the
deprecated `ANTHROPIC_SMALL_FAST_MODEL` (still honoured today). G1 keeps the separate `guard`
seat mapped to it for that independence, documents the deprecation, and the backlog watches for
its removal in a future Claude Code release — on removal, the independent guard knob is gone
and background folds into the haiku slot.

**For the user who needs `ANTHROPIC_BASE_URL` set too**, the launch wrapper (or
`router-launch.mjs`) remains the honest mechanism for the proxy URL, reading the same config
`launch` source for the models. This is recorded so a later reader does not re-litigate "why
isn't the proxy auto-started inside the session" — the env-before-launch constraint makes it
impossible, and the declarative `settings.json` `env` plus the wrapper are the conscious,
honest substitutes.

---

## Recommendation (summary)

Build one coherent flow, in one follow-up feature:

1. **Two true config-model pins only** — `roles.{builder,reviewer}.model`. Drop the
   orchestrator pin (papercut 2).
2. **Three independent seat questions in setup** — `builder` / `reviewer` / `guard`, each
   `session`/`auto`/typed-id, current-value default, zero-config led (papercut 1 + the
   guard seat).
3. **Launch-time models as config source, every launch path consumes it (RATIFIED option c,
   with refinement)** — session + guard live in a `.ai-dev/config.json` `launch` section (the
   one home); `router-launch.mjs` reads it and exports `ANTHROPIC_MODEL` /
   `ANTHROPIC_SMALL_FAST_MODEL`; a wrapper launcher reads the same values (documented
   one-liner / mirror). Setup prints a ready export block as the wrapper recipe. Never a
   dead field — the source is always consumed by the launch path.
4. **A model-switch-mid-stream handler** that flips a baked pin, re-bakes
   (auto-apply, else prints the context-correct dogfood-vs-downstream command), and
   announces (papercut 4).
5. **Honest installer log** — report what `ensureConfig` actually did (papercut 9).
6. **The alias-vs-concrete-id chain** documented in the dialog + the routes-config doc
   (requirement 5).
7. **Proxy expose-configured-models** consumed by the dialog where modelpipe exposes it,
   with the safe-surface boundary; fall back to asking until modelpipe ships it (papercut 8
   — modelpipe half is its own scoping).
8. **Frictionless documented wrapper, not a true autostart** — the env-before-launch
   constraint makes in-harness autostart impossible; the launcher is the honest mechanism
   (requirement 7).

---

## The build worklist (the follow-up feature — NOT built here)

A single feature through the loop, `platform: claude`-scoped (inert on OpenCode):

1. **`src/agents/orchestrator.md` `## Setup` step 2 (models per role)** — rewrite to three
   independent seat questions (`builder`/`reviewer`/`guard`); remove the orchestrator
   question; add the one-line alias-vs-concrete-id rule; add the proxy-route-table read
   (guarded on modelpipe exposing it). Add a **model-switch-mid-stream** handler to
   `## Setup` mirroring *Mode switch mid-stream*.
2. **Config + its `_roles` doc (`.ai-dev/config.json`)** — `roles.orchestrator` carries
   `agent` only (no `model`); document `roles.{builder,reviewer}.model` as the only baked
   pins; document that session + guard models are launch env (option b), not config keys.
   The installer default (`install-core.mjs` `ensureConfig`) drops any orchestrator
   `model` key (it already does — keep it that way).
3. **Installer log honesty (`install-core.mjs` + `install.mjs`)** — `ensureConfig` reports
   write-vs-no-op; the summary line reflects it (papercut 9). Tiny, standalone-shippable.
4. **Launch-time models — config `launch` section + every launch path consumes it (RATIFIED
   option c).** Add a `launch: { sessionModel, guardModel }` section to `.ai-dev/config.json`
   (+ its `_launch` doc); **`router-launch.mjs` reads it and exports `ANTHROPIC_MODEL` /
   `ANTHROPIC_SMALL_FAST_MODEL` before exec'ing `claude`** (a real launcher change, not a
   no-op); document the wrapper path that reads the same config values (one-liner / mirror)
   so a personal wrapper consumes the source too; setup prints a ready export block as the
   wrapper recipe; document the wrapper as THE launch path for a routed project
   (requirement 7). The field is the documented source, never cosmetic.
5. **The chain doc** — the alias → `ANTHROPIC_DEFAULT_*` → `body.model` → modelpipe
   first-match chain lands in the routes-config doc (and the dialog one-liner).
6. **modelpipe expose-configured-models (separate, in modelpipe)** — scope the expose shape
   (`--list` vs localhost endpoint) + the safe-surface boundary; the protocol consumes it
   per `docs/decisions/proxy-consume-mechanism.md`. Gated; not on this feature's critical
   path (the dialog falls back to asking).
7. **Autostart investigation (spike)** — confirm `SessionStart`/settings-env cannot set
   `ANTHROPIC_BASE_URL` for the running session; record the negative result; the wrapper
   stands as the mechanism.

Items 1–5 are the protocol-side core; item 3 is independently shippable as a fixup; items
6–7 are the modelpipe-side and the spike.

---

## Grounding (point, don't restate)

- Per-seat routing rationale, the `auto`/`session` semantics, the Claude-only constraint,
  the `CLAUDE_CODE_SUBAGENT_MODEL`-must-be-unset fact:
  `docs/decisions/per-seat-model-routing.md`.
- modelpipe consume mechanism (synced drift-guarded vendor-copy; transport owns its config,
  protocol consumes): `docs/decisions/proxy-consume-mechanism.md`.
- The launcher (direct/router/external modes, `proxyUrl`, fail-closed key check):
  `src/adapter/router-launch.mjs`. The routing code (`pickRoute`, literal first-match,
  no aliasing/translation): `src/adapter/model-router.mjs`. The provider catalog + `match`
  globs: `src/adapter/model-providers.json`.
- The installer summary log + dogfood-vs-downstream paths + `isSourceRepo` sentinel:
  `src/adapter/install.mjs`. `ensureConfig` (writes only where absent):
  `src/adapter/install-core.mjs`.
- The current models-per-role dialog + the *Mode switch mid-stream* lightweight-flip
  pattern the model-switch handler mirrors: `src/agents/orchestrator.md` `## Setup`.
- The config `roles` + its `_roles` doc: `.ai-dev/config.json`.
- The six consolidated papercuts: the 2026-06-30 entries in `.ai-dev/backlog.md`
  (coarse models-per-role dialog; re-bake awareness; false installer log; expose-configured
  -models; Claude-native autostart) — this doc is their single coherent UX resolution.
