> **Topic file of the orchestration spec** — read on demand from `WORKFLOW.md`'s navigation map. The cross-cutting always-on invariants (including the always-true "use only the `pm-*` agents, never the `wb-*` role duplicators" one-liner) live in `WORKFLOW.md`; this file is the full roster. Read it when you need the complete agent / command tables.

## Workflow agents and commands

### Agents (`.claude/agents/`)

Spawned by the orchestrator — do not run manually. Use only these — do not substitute with similarly-named agents from other toolsets (a `PreToolUse` guard in `.claude/settings.json` denies the known `wb-*` role duplicators automatically — see **Hook-level enforcement** in `workflow/enforcement.md`):

| Agent | When |
|---|---|
| `pm-stack-researcher` | Auto-spawn from `/pm-bootstrap` (initial stack onboarding) or from `/pm-plan` (when a feature touches a stack component not yet in `docs/stack-notes.md`). Reads canonical docs + spec, writes cited rules into stack-notes |
| `pm-architect` | Structural choice in the plan — where does new code live? Plus: owns canonical `docs/architecture.md` **and `docs/user-journeys.md`** (creates/finalizes at bootstrap, refreshes on audit findings, updates on decisions and per-feature journey changes, fills doc gaps spawned from `/pm-plan`). |
| `pm-product-advocate` | Pre-coding product-readiness gate on **user-facing** features — spawned from `/pm-plan` after the plan is approved and the contract drafted, before the coder handoff. Also the `/pm-bootstrap` foundational-question pass. Independent product-axis referee (the `code-review` twin): matches the plan/contract/product docs against `### Foundational product questions` and reports the gaps; never talks to the PM, never judges answer quality. |
| `pm-coder` | Implement the plan |
| `pm-plan-checker` | Plan compliance after implementation — verifies all scenarios implemented, contracts honored, interaction scenarios tested, DoD satisfied |
| `pm-pr-prep` | Bump version, generate CHANGELOG, push branch, open or update PR |
| `pm-codebase-reader` | Auto-spawn from `/pm-bootstrap` legacy full mode; existing-codebase raw-drafter — reads the codebase and writes raw drafts of `docs/architecture.md` + `docs/user-journeys.md` (+ optional docs), each finalized by `pm-architect`. Standalone = bootstrap-validation code re-read only. |
| `pm-auditor` | Auto-spawn from `/pm-audit`; protocol compliance sweep — checks artifact completeness, plan↔implementation parity, contract currency, docs currency. Writes `.ai-pm/audits/audit-<YYYY-MM-DD>.md` and returns a structured summary. Does NOT review technical code quality — that is pm-plan-checker + code-review per feature. |

### Commands (`.claude/commands/`)

Run in the main orchestrator session:

| Command | When |
|---|---|
| `/pm-bootstrap` | Initialize a new or legacy project — create docs structure, spawn pm-stack-researcher and pm-architect. |
| `/pm-plan` | Plan a feature, fix, or non-trivial change. Initializes execution state; handles hotfix mode. |
| `/pm-research` | Research existing solutions and analogues (build vs use). PM-facing pros/cons output. Different from `pm-stack-researcher` (which is agent-facing canonical citations). |
| `/pm-audit` | PM-initiated protocol compliance check. Orchestrator auto-decides scope: full (all features) or diff (since last audit) — based on last audit date and feature count; never asks PM. Spawns `pm-auditor`, drives a PM-facing finding loop (fix now / next sprint / accept-with-context). Full scope offered after `/pm-audit` completes as optional `code-review ultra`. |
| `/pm-fixup` | Fast path for trivial changes (≤ 50 lines, no behavior change, no stack-notes touch, no new code file). Skips `/pm-plan`; goes directly to `pm-coder` + `pm-plan-checker` in trivial mode. Falls back to `/pm-plan` if any condition fails. |

`code-review` (built-in Claude Code skill) — full technical quality sweep: bugs, security, dead code. Use `ultra` level for deep multi-agent review. Runs automatically as Pass 2 in the review loop after every feature; offered as optional deep sweep after `/pm-audit`.
