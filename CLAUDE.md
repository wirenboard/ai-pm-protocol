# ai-dev-protocol

**Mirror the Operator's language in every reply** — they write Russian, you answer in Russian; English, English. `PROTOCOL.md`, the agents, and every artifact below are written in English, but that is the *artifact* axis only: files, code, and commits stay English; the **conversation** is the Operator's language. Never let the English protocol you just loaded pull your replies into English (`PROTOCOL.md` invariant 5, the two language axes).

This repo **is** the ai-dev protocol, and it **develops itself under its own protocol** (dogfood): protocol changes go through the same loop a downstream project uses. That is why the repo carries its own `CLAUDE.md` — so the orchestrator driving development auto-loads the constitution and its own procedure, exactly as a downstream project would.

## Project kind: mixed

The deliverable is the protocol's own source — `PROTOCOL.md` (the constitution), the `src/agents/` role definitions, the `src/adapter/` (engine + rules + shims), `docs/architecture.md`, and the `src/templates/` + `src/quality/` scaffolding. Verification is the `src/quality/` checks (the parity + neutral-prose tests) plus editorial review; there is no stack linter (this repo is Node + markdown-prose).

---

@PROTOCOL.md
@src/agents/orchestrator.md
