# Personal multi-model setup — the tier-lane / tier-binding split, and the config.local the installer must see

**Question (2026-07-01).** An Operator wants a personal, per-machine multi-model lineup
(session=Opus, builder=DeepSeek, reviewer=GLM, guard native Haiku) **without pushing any
of it onto teammates** — the foreign model ids and endpoints are personal, the repo is
shared. The launcher already reads a gitignored `.ai-dev/config.local.json` at runtime, so
the *launch env* could be kept personal. But the launcher was the ONLY reader: the Claude
installer (the bake + the routing self-verify) read `.ai-dev/config.json` alone. That gap
produced a **silent-native failure**, and it forced the question of what "personal model"
can even mean when a subagent's model is baked into a committed file.

---

## What "personal" can and cannot be

A Claude subagent's model comes from the `model:` line the installer **bakes** into
`.claude/agents/<seat>.md`, and those agent files are **committed (shared)** — `git ls-files
.claude/agents/` lists them. So a personal *concrete* model id cannot be baked into a
seat's committed file without forcing it on every teammate. "Roles fully in config.local"
is therefore **not possible**. The shape that works splits the decision in two:

- **SHARED — the tier LANE.** `roles.{builder,reviewer}.model = opus | sonnet | haiku`
  in the committed `.ai-dev/config.json`. This is *which generic tier a seat rides* — a
  team-wide assignment, baked into the committed agent file. It is the irreducible shared
  line, because it lives in a committed artifact.
- **PERSONAL — the tier BINDING.** `launch.aliases.<tier> = <foreign id>` (e.g.
  `opus → deepseek-v4-pro`), plus `launch.sessionModel` / `launch.guardModel` / `configDir`
  / the proxy `proxyUrl`, in the gitignored `.ai-dev/config.local.json`. This is *what
  concrete model a generic tier resolves to on this machine* — per-machine, applied as env
  at launch, never committed.

So a "personal model" is the **concrete foreign id behind a generic tier**, per-machine.
The chosen lineup maps cleanly: builder → opus tier (personal alias → deepseek), reviewer →
sonnet tier (personal alias → glm), session → a personal concrete opus pin, guard → native
haiku. The team sees only the generic lanes in `config.json`; the concrete foreign ids stay
in each developer's `config.local.json`.

## The silent-native bug this fixes

The cross-endpoint mechanic (verified — `multi-model-setup-ux.md` papercut 13): on Claude a
baked **bare tier alias** (`model: opus`) resolves through `ANTHROPIC_DEFAULT_OPUS_MODEL`
(→ the foreign model a tier is bound to), while a baked **concrete id**
(`model: claude-opus-4-8`) is used **verbatim** and ignores that env var (stays native).

Before this change the bake and the routing self-verify (`resolveModelPin`,
`verifyRoutingConsistency` / `checkRouting`) read `config.json` alone. A personal binding
(`opus → deepseek`) living only in `config.local.json` was invisible to them:

1. the bake saw no binding for `opus` ⇒ produced the **concrete** id `claude-opus-4-8`;
2. that concrete id is used verbatim at runtime ⇒ **ignores** `ANTHROPIC_DEFAULT_OPUS_MODEL`
   (which the launcher *did* export from `config.local`) ⇒ the seat ran **native**;
3. the self-verify was **consistent with `config.json`** (which also had no binding) ⇒ it
   **passed** — no error, just a wrong model.

That is the silent-native class: a personal foreign model that cannot be kept out of the
shared config AND take effect.

## The fix — the installer reads config.local for VALIDATION, not for committing

`loadConfigWithLocal(configPath)` (in `src/adapter/router-launch.mjs`, the one home shared
with the launcher) reads `config.json` and deep-merges `config.local.json`'s `launch` over
it (per-tier alias merge, via `mergeLocalLaunch`). Both installer readers now go through it:

- **The bake** (`src/adapter/claude/install-agents.mjs` — its real installer entry merges
  config.local before calling `install()`) sees the merged binding ⇒ `resolveModelPin` bakes
  the **bare alias** `model: opus` ⇒ at launch it routes foreign.
- **The routing self-verify** (`verifyRoutingConsistency`) sees the merged binding, so it
  no longer expects a native concrete id. Its env check accepts a **launcher-applied** tier
  (one bound in `config.local`) as satisfied even though the committed `settings.json` env
  does not carry it — because that env var is exported by the launcher at startup, not
  written to the shared file.

What is **NOT** merged: `mergeLaunchEnv` (the `settings.json` write) still reads
`config.json` alone, so **only shared values are committed to the harness env**. Personal
aliases/session/guard are never written to a shared file; the launcher applies them at
startup. With no `config.local.json` present the whole path is byte-identical to before.

### Honest limitation

Personal foreign models require launching via `./.ai-dev/launch` — the launcher is what
applies `config.local`. A wrapper-less `claude` launch gets only the shared `settings.json`
env (native), consistent with `config.local` already being launcher-only. And because the
bare-alias bake depends on the merged binding, a teammate **without** the personal binding
who re-bakes would produce a different `model:` line; committed agents are defined as the
bake of the tracked shared `config.json` (the drift guard's contract), so a personal re-bake
is a local, uncommitted artifact — not pushed.

## Operational hazard — foreign-model tool-id poisoning (unfixable by this repo)

Running a session (or seat) on a foreign model means tool calls it makes are recorded with
that model's native tool-call id format — `call_<hex>` (the OpenAI/GLM convention) — inside
an Anthropic `server_tool_use` block. Anthropic never emits such ids (its formats are
`toolu_…` / `srvtoolu_…`). On replay to a **native** Anthropic endpoint (e.g. switching the
session model back to Opus mid-session), the id fails `^srvtoolu_[a-zA-Z0-9_]+$` validation:

```text
API Error: 400 messages.N.content.M.server_tool_use.id
```

This is a **harness/proxy translation-layer behaviour, not a protocol bug** — this repo
generates no tool ids, so it cannot prevent it mechanically, only document it. The proof of
innocence: a fresh session in the same repo (no poisoned block) runs the native model fine.

**Mitigation (the operational tax of the multi-model path):** avoid mixing endpoints
mid-session; if a foreign-routed seat/session made tool calls, start a **fresh** session
(not a `--continue`/compact — compaction carries the bad block forward) before switching the
session model to a native one. The user-facing scan-point for this error is the README
`## Troubleshooting` entry, which points here for the rationale; this doc is its one home.

## Addendum (2026-07-02) — the routes config personal/shared split

The same personal/shared distinction extends to `.ai-dev/model-routes.json` (the routing
config). A **shared routes table** (team-committable, safe because keys live by env-var name
only, never a value) belongs in `.ai-dev/model-routes.json`. A **per-machine `proxyUrl`**
(a loopback proxy, personal external proxy, or per-developer choice) belongs in the gitignored
`.ai-dev/model-routes.local.json` and NEVER in the shared file — a bare `proxyUrl` in the
shared file is the **personal-value-in-a-shared-file class** this decision already names for
`launch.*` — a developer's personal pointer that breaks routing for teammates on pull.

The launcher now merges `.ai-dev/model-routes.local.json` over the shared file the same way
it merges `config.local.json` over `config.json` (`mergeLocalRoutes` / `loadRoutesWithLocal`
mirroring `mergeLocalLaunch` / `loadConfigWithLocal`). The shape: scalar fields like `proxyUrl`
are shallow overrides (local wins), and `routes` (the array field) is merged with local entries
concatenated first (because the router's matching is first-match-wins; a personal route must
sort first to override a shared glob).
