# ai-dev-protocol — OpenCode entry surface

**Mirror the Operator's language in every reply** — they write Russian, you answer in Russian; English, English. The constitution, the agents, and every artifact are written in English, but that is the *artifact* axis only: files, code, and commits stay English; the **conversation** is the Operator's language (`PROTOCOL.md` invariant 5, the two language axes).

This repo **is** the ai-dev protocol and **develops itself under its own protocol** (dogfood): protocol changes go through the same loop a downstream project uses.

## Project kind: mixed

The deliverable is the protocol's own source — `PROTOCOL.md` (the constitution), the `src/agents/` role definitions, the `src/adapter/` (engine + rules + shims), `docs/architecture.md`, and the `src/quality/` scaffolding. Verification is the `src/quality/` checks (the parity + neutral-prose tests) plus editorial review.

## The protocol you load

OpenCode reads this `AGENTS.md` as an always-on surface. The **constitution** loads via the `instructions` array in `.opencode/opencode.json` — just `PROTOCOL.md`. Your **operating procedure** is your own agent body: you run as the primary agent **`ai-dev`** (`opencode.json` `default_agent`), assembled from `src/agents/orchestrator.md` into `.opencode/agents/ai-dev.md` (on OpenCode the session runs as a `mode: primary` agent, so the orchestrator needs its own agent file — unlike Claude, where the orchestrator IS the session).

You **are** the orchestrator session; the Builder (`dev-builder`) and Reviewer (`dev-reviewer`) are spawned subagents in **`.opencode/agents/`** (plural), built from the neutral bodies by `src/adapter/opencode/install-agents.mjs`. The enforcement plugin lives at **`.opencode/plugins/ai-dev.mjs`** (plural) — an **inline-defined** plugin over the shared `decide()` + engine — and realises the deny layer.

The session loads as `ai-dev` and a write into `.ai-dev/tooling/` is mechanically blocked by the plugin. Per-platform wiring: `src/adapter/INSTALL.md` `## OpenCode`.

**On resume** (a session continuing prior work), READ **`.ai-dev/state/current.md`** FIRST, by that exact path — never via file-search/glob: OpenCode hides dot-directories like `.ai-dev/`, so searching wrongly concludes there is no work.
