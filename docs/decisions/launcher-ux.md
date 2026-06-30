# Launcher UX — an optional, configurable, platform-aware project launcher

**Status: RATIFIED by the Operator (2026-07-01).** The launcher is `.ai-dev/launch`, an
**OPTIONAL** per-project script the installer generates ALWAYS (so enabling routing or a
`configDir` later needs no re-install) but that a plain single-model Claude project never
has to use. It is a drop-in for `claude`, wrapping the routing engine
(`src/adapter/router-launch.mjs`). The eight forks below are all settled; this doc is the
one home for *why* each is shaped the way it is. The mechanism lives in
`src/adapter/README.md` `### The launcher` (the launch path) and `## Multi-model routing`
of the top `README.md` (the modes × launch matrix); this doc records the decisions, not
the recipe.

## The three defects this closes

The prior multi-model UX (built per `docs/decisions/multi-model-setup-ux.md`) worked but
had three Operator-reported usability defects:

1. **No convenient entry.** Routing meant running
   `node .ai-dev/tooling/src/adapter/router-launch.mjs` — a long path no one remembers.
2. **Wrapper lockout.** The launcher hard-coded `spawn("claude")` and set
   `ANTHROPIC_BASE_URL`, so it could not coexist with the Operator's real launch: a global
   `.bashrc` function setting `CLAUDE_CONFIG_DIR` (different keys per task), used across
   **many** projects, **not all with the protocol**. A project-local launcher must not be
   forced into that global wrapper, and the per-project key/profile need had no home.
3. **Scattered config.** Turning routing on meant hand-editing `.ai-dev/config.json` (seat
   models) AND `model-routes.json` (routes) AND exporting keys AND knowing the launch
   command — four disjoint steps with no single flow.

## The launcher is OPTIONAL — the modes × launch matrix

The launcher is generated always but **framed optional**, never a forced uniform entry. It
is only NEEDED for multi-model + proxy, or a per-project claude profile (`configDir`).

| Mode | How you launch | Routing |
| --- | --- | --- |
| **Claude, single model** | `claude` / your own wrapper (or `.ai-dev/launch`, which just execs claude) | none — direct |
| **Claude + multi-model** | `.ai-dev/launch` — starts the proxy when ≥2 endpoints are in play | the local router |
| **OpenCode** | `opencode` normally (or `.ai-dev/launch`, the honest stub) | N/A — Claude-only |

On a vanilla Claude project `.ai-dev/launch` is effectively `exec node <engine> "$@"` and
the engine runs `claude` directly (no proxy) — so it is never in the way; the Operator can
ignore it entirely.

## The eight ratified forks

- **Entry = always-generated project-local `.ai-dev/launch`.** A short, root-relative
  drop-in for `claude`. Generated even on a vanilla project so enabling routing/configDir
  later needs no re-install. Rejected: a global `ai-dev` bin (project-local keeps each
  repo self-contained and avoids a PATH install).
- **`launch.configDir` → `CLAUDE_CONFIG_DIR`.** The launcher exports it before exec'ing
  claude — the Operator's per-task-keys mechanism, **per project, no `.bashrc` edit**. It
  is exported in `launchModelEnv`, which **every** exec path (proxy / direct / external)
  layers, so it works WITHOUT routing too (just pin a project's claude profile).
- **`configDir` is homed in the gitignored `.ai-dev/config.local.json`.** It is a
  per-machine personal path, never forced on teammates. The launcher merges
  `config.local.json`'s `launch` OVER `.ai-dev/config.json`'s `launch` — the shared config
  stays clean; any personal launch value (configDir, a personal launch model) lives local.
  The installer ensures `config.local.json` is gitignored (like the state pointer).
- **No `launch.command`.** Dropped — the launcher is a pure drop-in; a configurable inner
  command would re-introduce the wrapper-lockout coupling this feature removes.
- **OpenCode = an honest stub.** `.ai-dev/launch` is still generated on OpenCode, but
  routing is not realisable there (`tool-map.json` `opencode._note`: the `task` runtime
  does not apply a subagent's `model:`). So the stub prints "multi-model routing is
  Claude-Code only" and execs `opencode` (no proxy) — never a silent no-op or a false
  routing claim.
- **Standalone foreground `--proxy` mode.** `.ai-dev/launch --proxy` starts the router in
  the foreground, prints its URL on stdout, and does NOT exec claude — for "don't touch my
  launch": point your own claude/wrapper at the URL (or wire it as the routes config
  `proxyUrl`). It errors when there is no LOCAL router to start (an external proxy already
  runs, or fewer than 2 endpoints are in play) rather than launching a useless idle proxy.
- **`ANTHROPIC_BASE_URL` conflict: launcher wins + a visible warning.** When routing is on
  and the environment already carries a different `ANTHROPIC_BASE_URL` (e.g. a personal
  wrapper pointed at another proxy), the launcher overrides it — but emits a stderr
  WARNING naming both URLs, so a silent hijack of the user's own proxy can never happen.
  The launcher layers ONLY `ANTHROPIC_BASE_URL` (when routing) + unsets
  `CLAUDE_CODE_SUBAGENT_MODEL` + the launch-model env; everything else passes through.
- **One-flow `/dev-setup`.** When the Operator pins a cross-endpoint seat, the setup model
  step runs a single coherent launch & routing sub-flow: the per-seat models (existing),
  `configDir` → written to `config.local.json`, an offer to scaffold `model-routes.json`
  from the example for the named providers, a reminder of which backend key env-vars to
  export, and printing the ready `.ai-dev/launch` command. Each value lands in its right
  home (shared → `config.json`, personal → `config.local.json`, routes → `model-routes.json`).

## Security note (the generated shim's shell-exec surface)

`.ai-dev/launch` is a fixed `#!/bin/sh` template. The only interpolated value is the engine
path — a literal the installer controls, never user input. It uses `exec ... "$@"` (argv
passthrough), so no argument is ever re-parsed by a shell (`no sh -c "$untrusted"`). The
file is written `0755`. The installer test asserts the no-injection shape; semgrep sweeps
`src/` for the unsafe forms.

## Non-goals

- No general `launch.env` map — only `configDir` now (a general env map is deferred; add it
  the same way if a need appears).
- No global `ai-dev` bin — project-local was chosen.
- No change to the routing/proxy internals (the modelpipe vendor-copy) or to OpenCode's
  (absent) routing capability — the stub is honest about the limitation.
