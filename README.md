# ai-dev-protocol

A protocol for building software and documentation with AI. You are the operator: you say *what* to build and *why*, approve the plan, and decide what ships — in plain product language, no code reading required. A small set of AI roles plans the change, builds it, reviews it independently, and ships it.

It runs inside an AI coding harness — Claude Code and OpenCode, both live-verified — and **develops itself under its own protocol** — this repository is its own first project.

## How it works

The whole protocol is one short constitution you can read in one sitting: **[`PROTOCOL.md`](PROTOCOL.md)**. The essence:

**Three roles.** A Builder plans and makes the change; a Reviewer independently checks it in a separate context; an Orchestrator drives the loop, talks to you, and owns git — the reviewer is never the builder, so a maker can't catch its own blind spots. The full role table: `PROTOCOL.md` `## The three roles`.

**Product-first.** Onboarding goes **install → setup → product discovery → loop**. Before any feature, a genuine discovery dialog records a short brief (`docs/product.md`): the idea, the customer, the problem in their words, the zero-to-working story, the competition, who runs and funds it — and, at the end, the honest case against. It gathers prejudice-free and concludes willing to say "we are building the wrong thing". Every feature then grounds in that brief, so you are building a product, not churning code.

**Five beats.** Every feature flows: **understand → plan → build → review → ship**. You approve the plan in plain language before any code; the review is a fresh, independent pass; **you authorize every merge** — nothing lands without your explicit go.

**You decide product, not code.** The orchestrator leads with user impact, frames decisions as trade-offs, asks one question at a time, and never shows you code.

**Speed↔quality dial.** One axis, set per project (`profile` in `ai-dev.config.json`): `lite`/`solo` verify a hypothesis fast — lighter plan ceremony, the orchestrator may build directly; `full` trades speed for no-rewrites. The floor — working code or docs, an independent review by a fresh Reviewer, your explicit go on every merge — holds at every dial position on the guarantee profiles (`full`/`lite`/`solo`); the dial caps ceremony, never rigor. A fourth value, `yolo`, is an explicit off-guarantee escape hatch: no Reviewer, no merge-gate, maximum speed — your explicit merge word is the one floor that remains.

## Platform-neutral by design

The protocol is **one neutral core + one thin adapter per platform**. The core (`PROTOCOL.md`, the `src/agents/` roles, `docs/architecture.md`) names only abstract acts — *read a file*, *spawn a sub-agent*, *deny a write outside the project*. Each platform (Claude Code, OpenCode, the next one) is a thin **adapter** (`src/adapter/`) that maps those acts to its concrete tools. Adding a platform is its adapter and **zero edits to the core**.

Part of that adapter is a real **enforcement layer** — a deny layer that mechanically blocks certain tool calls (reading or writing outside the project, spawning a look-alike role into a protocol seat, merging an unreviewed change). What is mechanically enforced versus held by the prose alone is labelled honestly throughout (`PROTOCOL.md` `## Enforcement`, `docs/architecture.md`).

## Install

One idempotent command, no checkout needed:

```sh
npx github:aadegtyarev/ai-dev-protocol <target-dir> --platform claude|opencode
```

(From a protocol checkout, the same installer runs directly: `node src/adapter/install.mjs <target-dir> --platform claude|opencode`.)

It vendors the adapter, lays down the core and doc templates (only where the target has none), and wires the chosen platform — hooks, role agents, the `PROTOCOL.md` load. Per-platform detail: **[`src/adapter/INSTALL.md`](src/adapter/INSTALL.md)**. After wiring, start a fresh session so the harness loads the protocol.

## Configure

Once wired, run **`/dev-setup`** to configure the project — platform, mode, roles, models, and **kind** (`code` / `docs` / `mixed`). Kind sets the artifact consumer: machine-executed code, human-read documentation, or both — a protocol or process-doc project is `mixed`; a pure docs project is `docs`. It is a plain-language dialog: it discovers the models your environment actually offers and asks you to pick, then writes `ai-dev.config.json`. You need not run it by hand — on a fresh, unconfigured project the orchestrator offers setup on your first work request (an offer you may decline to proceed on safe defaults).

Re-run it anytime — the `/dev-setup` command, or just ask to reconfigure — when you change models or switch platform. It reads the current config, shows what changes, rewrites it, and re-applies so the new models take effect. The full procedure lives in **[`src/agents/orchestrator.md`](src/agents/orchestrator.md)** `## Setup` (`PROTOCOL.md` `## The loop` frames it; `src/adapter/INSTALL.md` has the per-platform command).

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
ai-dev.config.json  the project's choices — roles, mode, platform, kind
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

## History

Previously published at [wirenboard/ai-pm-protocol](https://github.com/wirenboard/ai-pm-protocol). Same author, no other contributors — moved to a personal account and renamed to reflect what the protocol actually is.
