# ai-dev-protocol

A protocol for building software and documentation with AI. You are the operator: you say *what* to build and *why*, approve the plan, and decide what ships — in plain product language, no code reading required. A small set of AI roles plans the change, builds it, reviews it independently, and ships it.

It runs inside an AI coding harness — Claude Code and OpenCode, both live-verified — and **develops itself under its own protocol** — this repository is its own first project.

## How it works

The whole protocol is one short constitution you can read in one sitting: **[`PROTOCOL.md`](PROTOCOL.md)**. The essence:

**Four roles.** A profile-staffed Researcher-Planner plans the change on a strong model; a Builder executes the approved plan; a Reviewer independently checks it in a separate context; an Orchestrator drives the loop, talks to you, and owns git — the reviewer is never the builder, so a maker can't catch its own blind spots. The full role table: `PROTOCOL.md` `## The four roles`.

**Product-first.** Onboarding goes **install → setup → product discovery → loop**. Before any feature, a genuine discovery dialog records a short brief (`docs/product.md`): the idea, the customer, the problem in their words, the zero-to-working story, the competition, who runs and funds it — and, at the end, the honest case against. It gathers prejudice-free and concludes willing to say "we are building the wrong thing". Every feature then grounds in that brief, so you are building a product, not churning code.

**Five beats.** Every feature flows: **understand → plan → build → review → ship**. You approve the plan in plain language before any code; the review is a fresh, independent pass; **you authorize every merge** — nothing lands without your explicit go.

**You decide product, not code.** The orchestrator leads with user impact, frames decisions as trade-offs, asks one question at a time, and never shows you code.

**Speed↔quality dial.** One axis, set per project (`profile` in `.ai-dev/config.json`): `lite`/`solo` verify a hypothesis fast — lighter plan ceremony, the orchestrator may build directly; `full` trades speed for no-rewrites. The floor — working code or docs, an independent review by a fresh Reviewer, your explicit go on every merge — holds at every dial position on the guarantee profiles (`full`/`lite`/`solo`); the dial caps ceremony, never rigor. A fourth value, `yolo`, is an explicit off-guarantee escape hatch: no Reviewer, no merge-gate, maximum speed — your explicit merge word is the one floor that remains.

## Platform-neutral by design

The protocol is **one neutral core + one thin adapter per platform**. The core (`PROTOCOL.md`, the `src/agents/` roles, `docs/architecture.md`) names only abstract acts — *read a file*, *spawn a sub-agent*, *deny a write outside the project*. Each platform (Claude Code, OpenCode, the next one) is a thin **adapter** (`src/adapter/`) that maps those acts to its concrete tools. Adding a platform is its adapter and **zero edits to the core**.

Part of that adapter is a real **enforcement layer** — a deny layer that mechanically blocks certain tool calls (reading or writing outside the project, spawning a look-alike role into a protocol seat, merging an unreviewed change). What is mechanically enforced versus held by the prose alone is labelled honestly throughout (`PROTOCOL.md` `## Enforcement`, `docs/architecture.md`).

## Install

One idempotent command, no checkout needed:

```sh
npx github:wirenboard/ai-pm-protocol <target-dir> --platform claude|opencode
```

(From a protocol checkout, the same installer runs directly: `node src/adapter/install.mjs <target-dir> --platform claude|opencode`.)

It vendors the adapter, lays down the core and doc templates (only where the target has none), and wires the chosen platform — hooks, role agents, the `PROTOCOL.md` load. It also installs a local **pre-push quality gate** (a git hook that runs your registered quality suite and blocks a push of failing code — never clobbering a hook you already have; `git push --no-verify` bypasses it, remove the hook file to opt out). Per-platform detail: **[`src/adapter/INSTALL.md`](src/adapter/INSTALL.md)**. After wiring, start a fresh session so the harness loads the protocol.

## Updating an existing install

Re-running the installer **is** the upgrade — it is idempotent and never clobbers your config or real docs. One catch makes an update silently do nothing, so clear the npx cache first:

1. **Clear the npx cache** — `rm -rf "$(npm config get cache)/_npx"` — npx caches the GitHub checkout and will otherwise silently re-install the *stale* version (the upgrade appears to run, but nothing changes).
2. **Reinstall** — `npx github:wirenboard/ai-pm-protocol . --platform claude|opencode` (re-runs the installer; the re-run is the upgrade).
3. **Cache-proof alternative** (skips npx entirely) — `git clone --depth 1 https://github.com/wirenboard/ai-pm-protocol /tmp/aidp && node /tmp/aidp/src/adapter/install.mjs . --platform claude|opencode`.
4. **Verify it took** — the installer prints `→ Installing ai-dev-protocol vX.Y.Z` loudly and first; if that is the *old* version on a re-run, your npx cache is stale (the installer also warns when it spots this). `cat .ai-dev/VERSION` confirms the version that landed.
5. **OpenCode** — the installer self-verifies the plugin loads, so a clean exit (exits 0) *is* the load confirmation; a broken deploy fails loudly.
6. **Claude** — the installer likewise self-verifies the deny hook is wired and its shim loads, so a clean exit *is* the load confirmation; a broken settings/shim fails the install loudly. (A LOAD check, not a runtime-fires check — it proves the shim loads, not that Claude invokes it.)
7. **Restart the session** afterward — the next session offers the migration check (the `.ai-dev/UPGRADING.md` marker the installer writes on a version change).
8. **If hand-cleaning, do NOT delete** your project-owned files: `.ai-dev/config.json`, `.ai-dev/state/`, `.ai-dev/backlog.md`, `docs/`, and (OpenCode) `.opencode/opencode.json`.

The full upgrade mechanics — what each version's migration renames and why downgrades are unsupported — live in **[`src/adapter/INSTALL.md`](src/adapter/INSTALL.md)** `## Upgrade`.

## Configure

Once wired, run **`/dev-setup`** to configure the project — platform, mode, roles, models, and **kind** (`code` / `docs` / `mixed`). Kind sets the artifact consumer: machine-executed code, human-read documentation, or both — a protocol or process-doc project is `mixed`; a pure docs project is `docs`. It is a plain-language dialog: it discovers the models your environment actually offers and asks you to pick, then writes `.ai-dev/config.json`. You need not run it by hand — on a fresh, unconfigured project the orchestrator offers setup on your first work request (an offer you may decline to proceed on safe defaults).

Re-run it anytime — the `/dev-setup` command, or just ask to reconfigure — when you change models or switch platform. It reads the current config, shows what changes, rewrites it, and re-applies so the new models take effect. The full procedure lives in **[`src/agents/orchestrator.md`](src/agents/orchestrator.md)** `## Setup` (`PROTOCOL.md` `## The loop` frames it; `src/adapter/INSTALL.md` has the per-platform command).

## Define the product

Right after setup, the orchestrator runs **genuine product discovery** — a dialog that gathers the product's real story (who it is for, the problem in their words, the concrete zero-to-working journey, the competition researched first, who runs and funds it) and concludes with the honest case against — able to end on "we built the wrong thing." It never invents an answer for you. You need not start it by hand: on a configured project with no brief, the orchestrator offers it on your first feature request (an offer you may decline). The brief lives in `docs/product.md` and every feature grounds in it; revisit it whenever the product shifts. The procedure is **[`src/agents/orchestrator.md`](src/agents/orchestrator.md)** `## Product discovery`.

## Team development

Multi-user (team) mode is **opt-in and off by default** — single-user is the common case. When a team works one repo, the loop gains a colleague-approval step on the forge (on top of the AI Reviewer floor) and can move the backlog to forge issues. Turning it on and running it — prerequisites, the load-bearing branch-protection step, the per-developer loop, and the honest limits — is the **[team-collaboration guide](docs/team-collaboration.md)**. The design and trade-offs behind it live in `docs/decisions/multi-user-mode.md`.

## Multi-model routing (optional)

Run different loop seats on different model providers — e.g. a builder on DeepSeek or z.ai GLM, the reviewer on Anthropic — all behind one local endpoint. The router that makes this work **ships with the tooling** (vendored into `.ai-dev/tooling/src/adapter/` on install); there is nothing extra to pull. It is **off by default** — a project that never configures a cross-endpoint seat runs unchanged, and routing is **Claude Code only** (the harness must forward distinct per-subagent model ids).

**The launcher is OPTIONAL.** The installer always generates a convenient drop-in for `claude` at **`.ai-dev/launch`** (run from the project root), but you only **need** it for **multi-model + proxy** (or to pin a per-project claude profile, below) — a plain single-model project just launches normally. How each mode launches:

| Mode | How you launch | Routing |
| --- | --- | --- |
| **Claude, single model** | `claude` / your own wrapper — no launcher needed | none — direct |
| **Claude + multi-model** | `./.ai-dev/launch` — starts the proxy when ≥2 endpoints are in play | the local router |
| **OpenCode** | `opencode` normally — routing N/A (the stub says so) | not realisable |

To turn multi-model routing on:

1. **Pin the seats** — `/dev-setup` (or edit `.ai-dev/config.json`) so a seat's `model` names a non-Anthropic provider's model id. When you pin a cross-endpoint seat, `/dev-setup` runs **one coherent flow**: the per-seat models, an optional per-project claude profile dir (`configDir`), an offer to scaffold `.ai-dev/model-routes.json`, a reminder of which backend keys to export, and it prints the ready launch command.
2. **Write the routes** — create `.ai-dev/model-routes.json` (copy the shape from `.ai-dev/tooling/src/adapter/model-router.example.json`); a route can name a provider by id (`{ "provider": "deepseek" }`) and pull its endpoint + auth from the built-in catalog. Keys are referenced by **env-var name** only, never a value.
3. **Export the backend keys** (e.g. `DEEPSEEK_API_KEY`).
4. **Launch through `.ai-dev/launch`** instead of bare `claude`:

   ```sh
   ./.ai-dev/launch          # the engine is also runnable directly: node .ai-dev/tooling/src/adapter/router-launch.mjs
   ```

   It reads the pins + routes and, when ≥2 distinct endpoints are in play, starts the proxy on a free localhost port, wires `ANTHROPIC_BASE_URL`, keeps `CLAUDE_CODE_SUBAGENT_MODEL` unset, and tears it down on exit. Fewer than 2 endpoints ⇒ it runs `claude` directly, no proxy. A missing backend key ⇒ it refuses to launch (fail-closed).

**A per-project claude profile (no routing needed).** Set `launch.configDir` and the launcher exports `CLAUDE_CONFIG_DIR` to it before launching — a per-project keys/profile dir with no `.bashrc` edit. Personal/per-machine launch values (a `configDir`, a personal launch model) belong in the **gitignored `.ai-dev/config.local.json`**, whose `launch` the launcher merges over the shared config — never forced on a teammate.

**Already running a proxy yourself, or want the proxy without the launcher driving claude?** Set a top-level `proxyUrl` in `.ai-dev/model-routes.json` (the launcher points `claude` at that URL instead of spawning one; auth/keys then live in your proxy's env), or run `./.ai-dev/launch --proxy` to start the proxy in the foreground, print its URL, and point your own launch at it. The full reference — the provider catalog, route shape, the launcher's decisions, env precedence, and the load-bearing constraints — is **[`src/adapter/README.md`](src/adapter/README.md)** (`### The launcher`); the rationale is `docs/decisions/per-seat-model-routing.md` and `docs/decisions/launcher-ux.md`.

## Layout

```text
PROTOCOL.md        the constitution — the loop, the roles, the invariants, the honest enforcement map
docs/              human-readable documentation:
  architecture.md    the engineer's mental model — how the pieces fit
  contracts/         the product promises, one compact file each
  decisions/         the compacted decision-base — why the protocol is shaped this way
src/               the machinery:
  agents/            the role definitions (neutral bodies)
  adapter/           the only platform-specific code:
    engine.mjs         the shared enforcement engine (one copy, every platform)
    deny-rules.json    every guard, as data
    tool-map.json      neutral act -> each platform's concrete tool
    claude/            the Claude shim, hooks, and agent assembler
    opencode/          the OpenCode shim, plugin entry, and agent assembler
    INSTALL.md         where each file lands, per platform
  modules/           the optional capability modules (e.g. threat-model)
  quality/           what "green" means here (the parity + neutral-prose checks)
  templates/         the lean scaffold a downstream project starts from
.ai-dev/config.json  the project's choices — roles, mode, platform, kind
```

## Contributing

This repo develops itself under its own protocol — the same loop, roles, and checks it ships. Start with `PROTOCOL.md` (the rules), `docs/architecture.md` (how it is built), and the `src/quality/` checks: `node src/adapter/parity.test.mjs` and `node src/quality/neutral-prose.test.mjs`.

## Acknowledgements

Ideas this protocol gratefully borrowed and reshaped:

- **[BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD)** — the elicitation mechanic (a technique menu offered at decision points) and the browser-driven UX review, adopted in our shape as the `elicitation` capability module and the ui-ux reviewer's browser walkthrough (`docs/decisions/bmad-adoption.md` records what was taken and what consciously was not).
- **The 8D problem-solving discipline** (Ford's Eight Disciplines) — the failure-analysis side-tool follows its eight steps.
- **[Keep a Changelog](https://keepachangelog.com/) and [SemVer](https://semver.org/)** — the release record's format and versioning contract.

## License

MIT — free use, including commercial. Modifications may stay closed; there is no copyleft.
