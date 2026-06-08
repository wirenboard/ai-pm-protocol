> **Topic file of the orchestration spec** — read on demand from `WORKFLOW.md`'s navigation map. The cross-cutting always-on invariants (including the always-true "use only the `pm-*` agents, never the `wb-*` role duplicators" one-liner) live in `WORKFLOW.md`; this file is the full roster. Read it when you need the complete agent / command tables.

## Workflow agents and commands

### Agents (in the adapter directory)

Spawned by the orchestrator — do not run manually. Use only these — do not substitute with similarly-named agents from other toolsets (the enforcement layer denies the known `wb-*` role duplicators automatically — see **Hook-level enforcement** in `workflow/enforcement.md`):

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

### Commands (in the adapter directory)

Run in the main orchestrator session:

| Command | When |
|---|---|
| `/pm-bootstrap` | Initialize a new or legacy project — create docs structure, spawn pm-stack-researcher and pm-architect. |
| `/pm-plan` | Plan a feature, fix, or non-trivial change. Initializes execution state; handles hotfix mode. |
| `/pm-research` | Research existing solutions and analogues (build vs use). PM-facing pros/cons output. Different from `pm-stack-researcher` (which is agent-facing canonical citations). |
| `/pm-audit` | PM-initiated protocol compliance check. Orchestrator auto-decides scope: full (all features) or diff (since last audit) — based on last audit date and feature count; never asks PM. Spawns `pm-auditor`, drives a PM-facing finding loop (fix now / next sprint / accept-with-context). Full scope offered after `/pm-audit` completes as an optional whole-codebase quality sweep. |
| `/pm-fixup` | Fast path for trivial changes (≤ 50 lines, no behavior change, no stack-notes touch, no new code file). Skips `/pm-plan`; goes directly to `pm-coder` + `pm-plan-checker` in trivial mode. Falls back to `/pm-plan` if any condition fails. |

`code-review` (a built-in engine on Claude; a protocol-shipped compact reviewer subagent on OpenCode) — full technical-quality sweep: bugs, security, dead code. Runs automatically as Pass 2 in the review loop after every feature, and as the optional whole-codebase sweep after `/pm-audit`. The whole-codebase sweep prefers `wb-development:code-review-orchestrator` when installed (the multi-aspect whole-project engine) and otherwise falls back to this `code-review` engine run over the whole tree — see `### Review typology` in `workflow/review-typology.md` for the engine-selection rule.

### Role-delegation integrity — one designated agent per pipeline role, never a generic stand-in

The "use only these — do not substitute" framing above is **not** only about cross-toolset `wb-*` look-alikes. It is the role-side statement of one rule: **every pipeline role has exactly one designated protocol agent or engine, and the orchestrator fills that seat with that agent — never with a generic harness built-in nor any other non-protocol agent standing in for the role.** The roles and their designated fillers:

| Pipeline role | Designated filler (the ONLY thing that fills this seat) |
|---|---|
| Plan a feature | `/pm-plan` (orchestrator-driven command) |
| Plan-compliance check | `pm-plan-checker` |
| Product-readiness gate | `pm-product-advocate` |
| Implementation | `pm-coder` |
| Per-diff / whole-codebase review | the `code-review` **engine** (Claude built-in / the OpenCode compact reviewer), per `### Review typology` |
| Protocol-compliance audit | `pm-auditor` |
| Canonical docs / arch / journeys / threat-model | `pm-architect` |
| Stack-rule research | `pm-stack-researcher` |
| Existing-codebase deep read | `pm-codebase-reader` |

A **generic harness built-in** — `general` (the catch-all subagent), `build`, `plan` — or any other non-protocol agent **carries none of the role's discipline**: spawn `general` to "do a review" and you get prose from an agent that has no severity scale, no nine review aspects, no verdict rubric, no secrets-hygiene pass; spawn it to "do an audit" and you get none of the auditor's dimensions. The output *looks* like the deliverable and is not it — the exact corner-cut the live incident named (a `general` subagent asked to "update the review file and run code-review," recognized as wrong, then rationalized as "very little actual code"). This is the **same violation family** as the `wb-*` role-duplicator deny — a non-protocol agent occupying a protocol seat — just sourced from the harness's own built-ins instead of an installed toolset. Name it as the extension, not a new rule: a generic does not become the reviewer by being asked to act like one.

**The carve-out is unchanged.** The built-in **engines the protocol delegates to on purpose** — `code-review` (the designated review filler) and `deep-research` (the `/pm-research` engine) — are **not** generic stand-ins: they **are** the designated filler for their role. The line is *generic-catch-all-as-role-substitute* (denied), not *built-in-tool* (the protocol uses several on purpose). The protocol roster has **no "generic exploration" seat**: the orchestrator does its own read / grep inline and routes deep codebase reads to `pm-codebase-reader`, so a `task`-spawn of `general` is, by construction, a role substitution — there is no legitimate orchestrator use of it to over-block.

**The Pass-2 review trail is the orchestrator's OWN work, not a delegation.** "Update the `## Code review` review-file trail" is the orchestrator's own carve-out (the edit-route carve-out in `workflow/enforcement.md`) — it writes that trail itself and does **not** hand the edit to a generic (or any) agent. What it delegates is only the **finding generation**, to the designated `code-review` engine it spawns this turn; the orchestrator then records those findings in the trail. Routing the trail edit through `general` is two violations at once: a generic standing in for the reviewer role **and** a content-edit the orchestrator owns being handed off. See `### Role-delegation integrity (full)` in `workflow/enforcement.md` for the enforcement realization.
