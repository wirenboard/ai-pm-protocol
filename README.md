# ai-pm-protocol

A protocol for building software and documentation with AI. You are the operator: you say *what* to build and *why*, approve the plan, and decide what ships — in plain product language, no code reading required. A small set of AI roles plans the change, builds it, reviews it independently, and ships it.

It runs inside an AI coding harness — Claude Code and OpenCode, both live-verified — and **develops itself under its own protocol** — this repository is its own first project.

## How it works

The whole protocol is one short constitution you can read in one sitting: **[`PROTOCOL.md`](PROTOCOL.md)**. The essence:

**Three roles.** A Builder makes the change, a Reviewer independently checks it, an Orchestrator runs the loop — the reviewer is never the builder, so a maker can't catch its own blind spots.

| Role | Does |
| --- | --- |
| **Orchestrator** | The running session. Talks to you, drives the loop, owns git and state. Routes every other task to a role; builds and reviews nothing itself. |
| **Builder** | Plans the change, then writes the code, docs, and tests. |
| **Reviewer** | Independently checks the built change against the plan and a tight quality / security / honesty checklist. A separate context from the Builder. |

**Product-first.** Onboarding goes **install → setup → product discovery → loop**: before any feature, a genuine discovery dialog — gather the product's real story prejudice-free, then conclude, able to end on "we built the wrong thing" — records a short brief (`docs/product.md`): the idea, the customer, the problem in their words, the concrete **zero-to-working story** (how a user discovers it, onboards from nothing, carries across devices and recovers lost access), the competition, who runs and funds it, and — at the end — the case against. Grounded in the established discovery frameworks (Working Backwards, Lean Canvas, Cagan, Torres). Every feature then grounds in that brief, so you are building a product, not churning code.

**Five beats.** Every feature flows: **understand → plan → build → review → ship**. You approve the plan in plain language before any code; the review is a fresh, independent pass; **you authorize every merge** — nothing lands without your explicit go.

**You decide product, not code.** The orchestrator leads with user impact, frames decisions as trade-offs, asks one question at a time, and never shows you code.

**Speed↔quality dial.** One axis, set per project (`profile` in `ai-pm.config.json`):

- **Prototype mode** (`lite` / `solo`) — verify the hypothesis fast: lighter plan ceremony, the orchestrator may build directly.
- **Quality mode** (`full`) — trade speed for no-rewrites: an explicit plan you approve, every structural choice surfaced, a separately spawned Builder.

The floor — working code or docs, an independent review by a fresh Reviewer, your explicit go on every merge — holds at every dial position. The dial is a ceiling on ceremony, never on rigor: the orchestrator may always choose more.

## Platform-neutral by design

The protocol is **one neutral core + one thin adapter per platform**. The core (`PROTOCOL.md`, the `src/agents/` roles, `docs/architecture.md`) names only abstract acts — *read a file*, *spawn a sub-agent*, *deny a write outside the project*. Each platform (Claude Code, OpenCode, the next one) is a thin **adapter** (`src/adapter/`) that maps those acts to its concrete tools. Adding a platform is its adapter and **zero edits to the core**.

Part of that adapter is a real **enforcement layer** — a deny layer that mechanically blocks certain tool calls (reading or writing outside the project, spawning a look-alike role into a protocol seat, merging an unreviewed change). What is mechanically enforced versus held by the prose alone is labelled honestly throughout (`PROTOCOL.md` `## Enforcement`, `docs/architecture.md`).

## Install

Status: both **Claude Code** and **OpenCode** are live-verified — on each, the session loads as the orchestrator and the deny layer mechanically blocks a guarded write. Parity 56/56 (`src/adapter/parity.test.mjs`). Per-platform wiring: `src/adapter/INSTALL.md`.

The protocol is consumed as a git submodule; the active platform's adapter is then wired — the deny hooks, the role agents, and the `PROTOCOL.md` import. The concrete, per-platform wiring lives in **[`src/adapter/INSTALL.md`](src/adapter/INSTALL.md)** — the single home for where each file lands and how each platform is hooked up. After wiring, start a fresh session so the harness loads the protocol.

## Configure

Once wired, run **`/pm-setup`** to configure the project — platform, mode, roles, models, and **kind** (`code` / `docs` / `mixed`). Kind sets the artifact consumer: machine-executed code, human-read documentation, or both — a protocol or process-doc project is `mixed`; a pure docs project is `docs`. It is a plain-language dialog: it discovers the models your environment actually offers and asks you to pick, then writes `ai-pm.config.json`. You need not run it by hand — on a fresh, unconfigured project the orchestrator offers setup on your first work request (an offer you may decline to proceed on safe defaults).

Re-run it anytime — the `/pm-setup` command, or just ask to reconfigure — when you change models or switch platform. It reads the current config, shows what changes, rewrites it, and re-applies so the new models take effect. The full procedure lives in **[`src/agents/orchestrator.md`](src/agents/orchestrator.md)** `## Setup` (`PROTOCOL.md` `## The loop` frames it; `src/adapter/INSTALL.md` has the per-platform command).

## Define the product

Right after setup, the orchestrator runs **genuine product discovery** — a dialog that gathers the product's real story (who it is for, the problem in their words, the concrete zero-to-working journey, the competition researched first, who runs and funds it) and concludes with the honest case against — able to end on "we built the wrong thing." It never invents an answer for you. You need not start it by hand: on a configured project with no brief, the orchestrator offers it on your first feature request (an offer you may decline). The brief lives in `docs/product.md` and every feature grounds in it; revisit it whenever the product shifts. The procedure is **[`src/agents/orchestrator.md`](src/agents/orchestrator.md)** `## Product discovery`.

## Layout

```text
PROTOCOL.md        the constitution — the loop, the roles, the invariants, the honest enforcement map
docs/              human-readable documentation:
  architecture.md    the engineer's mental model — how the pieces fit
  contracts/         the product promises, one compact file each
  decisions/         the compacted decision-base — why the protocol is shaped this way
src/               the machinery:
  agents/            the three role definitions (neutral bodies)
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
ai-pm.config.json  the project's choices — roles, mode, platform, kind
```

## Contributing

This repo develops itself under its own protocol — the same loop, roles, and checks it ships. Start with `PROTOCOL.md` (the rules), `docs/architecture.md` (how it is built), and the `src/quality/` checks: `node src/adapter/parity.test.mjs` and `node src/quality/neutral-prose.test.mjs`.

## License

MIT — free use, including commercial. Modifications may stay closed; there is no copyleft.
