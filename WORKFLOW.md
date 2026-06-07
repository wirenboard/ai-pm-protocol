> **This file is the canonical orchestration spec** — read by agents and by the downstream project entry file, loaded for every session via the instruction-loading mechanism (each harness's concrete in the harness-reference table). For a friendlier overview of the protocol (Russian, marketing-level) see `README.md`. When the two documents disagree, this one wins.

This file is a **thin constitution + router**. It carries the cross-cutting invariants that must hold on *every* action, the Step 0–7 pipeline skeleton, and a navigation map to the on-demand **`workflow/*.md`** topic files. Each topic file is the single home for its rule; read it with the Read tool at the step that needs it (the instruction-loading mechanism loads only this thin core — the topic files are read on demand, not eager-loaded). The section name is the stable anchor: a rule referenced as `` `### X` in `workflow/<topic>.md` `` resolves to the `### X` heading in that file.

---

## Cross-cutting invariants (always on)

These hold on **every** action, regardless of which pipeline step you are in. The full detail of each lives in a topic file (cited inline); the one-liner here is the always-true subset. **The boundary criterion:** a rule the orchestrator applies in its own freeform reasoning, outside any injected command/skill procedure (potentially on every action), keeps its decision-critical kernel here in the always-on core; on-demand carries only what is applied *inside* a procedure (which carries its own Read step) or *at a specific pipeline step*.

- **Use only the `pm-*` agents, never the `wb-*` role duplicators.** Spawn only the protocol's `pm-*` agents (in the adapter directory) and run only the `pm-*` commands; never substitute a similarly-named `wb-*` role agent or role skill that occupies a protocol seat. This is enforced by the enforcement layer (a deny-list, realized per harness — see the harness-reference table) — built-in engines (`code-review`, `deep-research`) and `wb-*` *knowledge* skills are not gated. Full roster + enforcement mechanics: `workflow/roster.md` and `workflow/enforcement.md`.
- **Project boundary.** Every agent stays within the project root (`git rev-parse --show-toplevel`); never read, search, or write outside it — no parent directories, no sibling repos. The `.ai-pm/tooling/` submodule is inside the project root but outside the readable content surface — downstream agents never read its plans, backlog, reviews, or arch notes; only the named shipped surface is reachable: `WORKFLOW.md` (via the instruction-loading mechanism), `MIGRATIONS.md`, the adapter directory (agents, commands, and the enforcement-layer config), `doc/_templates/`. Full rule: `workflow/enforcement.md`.
- **Edit-ownership.** The orchestrator never freehand-edits canon owned by an autonomous agent (source code, schemas, `docs/`, feature plans, the through-`## Verdict` body of review/advocate artifacts, arch notes, audit reports) — it respawns the owning agent. It *does* write the outputs of the processes it drives (backlog, PM decisions, the Pass-2 `## Code review` trail, the advocate `## Resolutions` trail, protocol-gap reports, git ops). The two carve-outs and the full artefact list: `workflow/enforcement.md`.
- **Remote-system boundary.** A repo-owned file (code, schema, config template, unit file, manifest) changes through git — never by an in-place edit on a remote system. Runtime state, deployment actions, dev experiments, and PM-initiated maintenance are fair game. Full forbidden/allowed lists: `workflow/enforcement.md`.
- **Language canon (two axes).** Conversation = the PM's language. Artifacts written to disk — files, code, commits, agent-authored docs — are **English**; translate-on-read when relaying a persisted artifact in chat. Full PM-comms rules + examples: `workflow/pm-comms.md`.
- **Decision authority.** A product fork is resolved under one of two modes — enum `autonomous | interactive`; **absent file OR unrecognized ⇒ `interactive`** (the safe default; never an error, never a random branch). The orchestrator applies this kernel in freeform reasoning on every fork: **derivability test** — if the fork is derivable from cited project canon (the bootstrap mandate + `docs/`/`.ai-pm/contracts/`/prior `## Resolutions`), auto-resolve and **announce-before-act**; else **escalate**. **Escalate regardless** (autonomy is an upper bound, never required) when any of three holds: it is **not derivable** from canon; it touches a `### Security-relevant surfaces` item on a security-bearing project; or the PM marked it **irreversible / high-stakes**. **Merge/ship stays manual in both scopes.** Full elaboration (the value-home file, per-feature override, procedural-gate instances, `## Resolutions` mechanics, consumer list): `### Decision authority` in `workflow/decision-authority.md`.
- **Read the on-demand elaboration before acting on it** (secondary backstop). The decision-critical kernels are already in this core; before acting on the *full detail* of a `workflow/*.md` rule — a carve-out, a procedural-gate instance, a forbidden/allowed list — Read its topic file in the current turn rather than from memory.

### Git workflow — orchestrator owns this, not subagents

Never commit to `main`. One branch per PR (may carry one or several features).

```
git checkout main && git pull          # always start from current main
git checkout -b feature/<topic>        # fresh branch — one branch per PR
... implement, commit ...
pr-prep                                # CHANGELOG + version + push + PR
merge on GitHub                        # GitHub squashes
git checkout main && git pull          # back to main, ready for next branch
```

Never reuse a branch across PRs. Never commit "resolve merge conflicts" — if conflicts appear, the branch is stale; cut a fresh one from main. Full git-flow detail: `workflow/enforcement.md`.

### PM communication — core

The PM makes product decisions and does not read code. Always: **lead with user impact** (not code), **explain decisions as trade-offs**, **ask one question at a time** (2–3 concrete options, recommend one), **surface substantive forks via the structured-question tool** (simple proceed/confirm gates stay in prose), **never show code**, **no jargon without a plain-language gloss**. Full rule list + ✓/✗ examples + the autonomous-mode rider: `workflow/pm-comms.md` (worked examples: `workflow/examples.md`).

---

## The pipeline — Step 0–7 skeleton (router)

The named steps in order. Each line is *what happens + where the full body lives*. **Read `workflow/pipeline.md` before driving a feature through the pipeline** — it holds the full prose of every step.

**If `docs/` doesn't exist yet** — ask a few questions and set up project documentation first (`/pm-bootstrap`).

- **Step 0 — Check git state.** `git branch --show-current` + `git status`; branch from main or ask; clean tree. → `workflow/pipeline.md`
- **Step 1 — Read project context.** `docs/architecture.md`, `docs/user-journeys.md`, `docs/features/`. → `workflow/pipeline.md`
- **Step 2 — Plan together.** Clarify, then show the plan in plain language and confirm. → `workflow/pipeline.md`
- **Step 3 — Show the architecture decision** (if a structural question was raised). → `workflow/pipeline.md`
- **Step 3.5 — Product-readiness gate** (user-facing features only): spawn `pm-product-advocate`; `clean` → pass, `gaps: N` → one structured-question-tool pass (or the autonomous derive-or-escalate branch). → `workflow/pipeline.md`
- **Step 4 — Coder implements.** Feature branch, atomic commits, pipeline, never touches existing tests; spawn doc-owner for any "Docs to update". → `workflow/pipeline.md`
- **Step 5 — Review loop.** Pass 1 plan-compliance (`pm-plan-checker`) then Pass 2 technical quality (`code-review`, or the documentation-kind validation route); the `## Code review` / `## Validation` stamp is load-bearing. → `workflow/pipeline.md`
- **Step 5.5 — Optional: run it for real** (`verify` / `run`); the **Blast-radius preflight** applies before any on-hardware action. → `workflow/pipeline.md` + `workflow/incident.md`
- **Step 6 — Ship.** The A/B/C ship gate; wait for the PM before `pm-pr-prep`. **Merge/ship stays manual in both authority scopes.** → `workflow/pipeline.md`
- **Step 7 — PR review comments.** Same-branch response loop, all `gh`; escalate only product-scope changes. → `workflow/pipeline.md`

---

## Navigation map — the on-demand topic files

For each topic, read its file with the Read tool at the step that needs it. One single-source rule-home per file; the section name is the anchor.

| For… | Read |
|---|---|
| The full agent + command roster tables | `workflow/roster.md` |
| Boundary / edit-ownership / remote-system **full** rules + carve-outs + hook-level enforcement | `workflow/enforcement.md` |
| The full Step 0–7 step bodies | `workflow/pipeline.md` |
| What artefacts a change type requires (the change-type table + riders) | `workflow/mandatory-matrix.md` |
| `### Project kind` (the kind enum + its load-bearing default + no-code validation discipline — declared once there, never re-encoded here) | `workflow/project-kind.md` |
| `### Decision authority` **elaboration** (the value-home file + rationale, per-feature override + resolution order, the procedural-gate instances, `## Resolutions` recording mechanics, consumer list) — the enum/default/cap/derivability **kernel** is the always-on core invariant above, not restated there | `workflow/decision-authority.md` |
| `### Review typology` (the five review types + det/AI split + new-code-gating) **and `### Cross-model review`** (which *model* runs the review/audit — the four settings, the opinionated default, Haiku-blacklist, the model-pinned-subagent mechanism, the change-dialog + per-review announce) | `workflow/review-typology.md` |
| `### Security-relevant surfaces` + `### Threat-model lifecycle` | `workflow/security-surfaces.md` |
| `### Foundational product questions` (the three tiers) | `workflow/foundational-questions.md` |
| How state is kept + the three channels to the PM | `workflow/state.md` |
| The "doesn't work in production" diagnose flow + Blast-radius preflight + probe rules | `workflow/incident.md` |
| When the protocol itself has a gap (protocol-feedback report) | `workflow/protocol-gap.md` |
| Template-bump / post-bump-audit (Maintenance) | `workflow/maintenance.md` |
| The full "How to talk to the PM" rule list | `workflow/pm-comms.md` |
| Worked examples (✓/✗ pairs, ASCII diagram, Matter blast-radius case, probe template) | `workflow/examples.md` |

`code-review` and `deep-research` are built-in Claude Code engines the protocol delegates to on purpose (not gated). `MIGRATIONS.md` (protocol-root sibling) is the single source for pending-migration detection and the Expected-discipline manifest.
