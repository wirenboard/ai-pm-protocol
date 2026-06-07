# OpenCode orchestrator-primary agent — plan

Source: PM live test of the OpenCode adapter in the `nula` downstream (2026-06-07). Observation: the OpenCode session drove Step 0 (git branch) + Step 1 (read context) but then **wrote project files itself** (`tsconfig.json`, `next.config.ts`, `npm install`) — **0 `pm-*` subagents spawned**. Root-cause diagnosis (orchestrator, confirmed against the adapter): the protocol ships only `mode: subagent` agents, so the OpenCode orchestrator is the **default `build` primary** — a generic do-it-all coder with `write`/`edit` tools, onto which the protocol rules are layered only as always-on *instructions*; with no per-prompt route reminder, a capable model just does the work itself. Continues on the local integration branch `feature/opencode-harness-support` (no remote/PR; sub-branch merged back).

> **STATUS: APPROVED — PM said "оформи и построй" (2026-06-07).** Design settled from the diagnosis; no arch note needed.

## Problem

On Claude Code the orchestrator is a **first-class identity** — `CLAUDE.md` is its system prompt ("drive the pipeline, never freehand-edit content artifacts, spawn the owning `pm-*` agent"), reinforced by a per-prompt route-reminder hook. On OpenCode that seat does **not** exist as an agent: the protocol relies on OpenCode's built-in `build` primary "behaving" per layered instructions. It does not — `build`'s built-in coder persona + its `write`/`edit` tools dominate, so the orchestrator authors content directly and the disciplined pipeline (plan → `pm-coder` → review) is bypassed. This is the central OpenCode-faithfulness gap.

## Scenarios

1. **The OpenCode adapter ships a first-class protocol orchestrator as a PRIMARY agent.** A committed `.opencode/agent/<orchestrator>.md` with `mode: primary` carries the orchestrator identity as its **system prompt** (not as layered instructions): it drives the Step 0–7 pipeline, delegates to the `pm-*` subagents via the `task` tool, surfaces product forks via the structured-question tool, and does only git + `.ai-pm` bookkeeping itself — it **never authors content artifacts** (source, `docs/`, plans, contracts).
2. **The orchestrator structurally CANNOT author code/docs.** Its tool grant **excludes `write` and `edit`** — so it is physically unable to use the clean authoring tools and is pushed to delegate (`pm-coder` for code, `pm-architect` for docs). It keeps `read`/`grep`/`glob`/`bash`/`task`/`question`/`skill`/`todowrite` (bash for git ops + `.ai-pm` bookkeeping; task/question/skill to drive the pipeline). This mirrors the Claude orchestrator's discipline as a *construction*, not a hope.
3. **The downstream uses this orchestrator, not the default `build`.** The OpenCode install makes the shipped orchestrator the agent the PM runs (a default-agent config in `opencode.json` if OpenCode supports it, otherwise the documented `opencode --agent <name>` entry point). The `## The orchestrator seat` section of `AGENTS.md` is updated to name the shipped primary, superseding the earlier "the default `build` primary is the orchestrator" stance.
4. **The orchestrator is OpenCode-only, generated like the engines.** It is built through the harness-local generator mechanism (the same `harness_local_agents` path that ships `code-review`/`deep-research`) — Claude's orchestrator is the main session, so no agent file is generated there.

## Existing behaviors this feature touches

- **The OpenCode adapter (slices 1–9 + engines + neutral prose).** Unchanged in mechanism; this adds one primary agent + an install/AGENTS.md update.
- **The slice-4 orchestrator-seat work** (the `question`-grant on the primary): superseded/extended — the `question`/`task`/`skill` grants now belong to the **shipped** orchestrator primary; the per-subagent `question: deny` stays.
- **The enforcement plugin.** Unchanged this slice; note that a future hardening could also deny the orchestrator *bash-writing* to content-artifact paths (defense-in-depth) — out of scope here (the no-write/edit tool grant + the persona are the fix).
- **Claude self-host.** Untouched — Claude's orchestrator stays the main session; `generated-claude-adapter-byte-equivalent` must stay green (this is OpenCode-only).

## Test plan

- **Existing:** `tests/hooks.sh` 79/79; `tests/generator.sh` 4/4 (Claude byte-equivalent); `tests/opencode.sh` + plugin-unit green; `tests/neutral-prose.sh` green.
- **New:**
  - `oc-orchestrator-primary-present`: a generated `.opencode/agent/<orchestrator>.md` exists with `mode: primary` (and — guarded-skip when `opencode` absent — `opencode agent list` shows it as a primary).
  - `oc-orchestrator-cannot-author`: its frontmatter `tools` map sets `write: false` and `edit: false` (it cannot use the authoring tools) while granting `task`/`question`/`skill`/`read`/`bash` (it can drive the pipeline + bookkeep).
  - `oc-orchestrator-self-contained`: the orchestrator agent references no `.claude/` path; its body uses the neutral vocabulary (no bare Claude primitive outside the reference table) — i.e. `tests/neutral-prose.sh` covers it.
  - `oc-orchestrator-is-default`: the install wiring (`opencode.json` default-agent key, or the documented entry point) selects the orchestrator, not `build` — asserted in whatever form the install mechanism takes.

## Docs to update

- `doc/architecture.md`: a decision record — **OpenCode orchestrator is a shipped constrained primary agent, not the default `build`** (first-class orchestrator identity + no-author tool grant = the structural mirror of the Claude orchestrator discipline). Owned by `pm-architect`, post-coding.
- `AGENTS.md` (generated): the `## The orchestrator seat` section now names the shipped primary + how to run it; the route-reminder framing stays.
- `doc/stack-notes.md`: if a default-agent `opencode.json` key is used, record it (cite the docs).

## Out of scope

- **Enforcement-plugin path-based deny of orchestrator bash-writes** — defense-in-depth follow-up; the no-write/edit tool grant + persona are this slice's fix.
- **Forcing the model to actually delegate well** — the construction makes self-authoring hard and delegation natural; it does not guarantee a weak model drives the whole pipeline flawlessly (that is model quality, tracked separately).
- **Claude side** — Claude's orchestrator is the main session; nothing changes there.

## Key design decisions

- **Primary persona + no-author tools is the fix, not stronger instructions.** The diagnosis showed layered instructions lose to the `build` persona; the answer is a first-class `mode: primary` agent whose *identity* is the orchestrator and whose *tool set* makes content-authoring impossible — discipline by construction, mirroring how `CLAUDE.md` + the route-reminder hook hold the Claude orchestrator.
- **OpenCode-only, harness-local generated** (the `harness_local_agents` mechanism). Claude needs no such file.
- **Bookkeeping via bash, not the write tool.** The orchestrator legitimately writes `.ai-pm/state`, backlog, git — it does these via `bash`, keeping the `write`/`edit` tools (the content-authoring path) off the table so code/docs authoring routes to the `pm-*` agents.
- **Model assignment (PM, 2026-06-07) — the orchestrator runs on the strong PRO model; it does NOT pin.** Per the single-source `models` block (slice 9), the orchestrator is a PRIMARY → it inherits `models.session` = `deepseek/deepseek-v4-pro` (no `model:` pin), so the important driving/planning work runs on PRO — alongside the other producers (pm-architect, pm-coder, pm-codebase-reader, pm-stack-researcher, deep-research, pm-pr-prep, all unpinned → PRO). The control/review agents (code-review, pm-plan-checker, pm-auditor, pm-product-advocate) stay pinned to `models.control` = `deepseek/deepseek-v4-flash`. This is exactly the planning/architecture/coding-on-PRO, review-on-flash split the PM described; it is tunable in one place (the `models` block — e.g. a future `variant: max` for a control model, or moving a role producer↔control).
