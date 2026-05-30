# integrate-consultancy — plan

## Context

External consultancy reviewed the protocol after this very session's pain points: stash conflict I forgot, technical phrasing question I asked PM, coder doing 5 things in one run. The full document is captured externally (`~/Develop/ai-pm-protocol-issues.md` on PM's workstation, 525 lines, 10 parts).

This plan integrates the parts of the consultancy that close real gaps observed in practice, rejects two parts that conflict with our subagent-isolation model, and treats four small parts as separate fixup PRs handled after this one.

## Scenarios

1. **PM returns to a paused task** — opens `.ai-pm/state/current.md`, sees status, what's done, what's remaining, next step. No need to re-read chat history. Works after any pause (session reset, model switch, days off).

2. **PM works on a user-facing feature** — protocol creates `.ai-pm/contracts/<feature>.md` with structured User Value / Must Work / Must Not Break / Acceptance Checks. Future reviewer passes verify the contract is honored; future audits flag drift.

3. **PM reads a review verdict** — sees an explicit `Definition of Done: pass | fail` section listing 7 hard checks (scope respected, contract honored, acceptance checks executed, tests run, state updated, impact report written, next step defined). No more "approve with three side notes" ambiguity.

4. **PM reads README** — guarantees are reworded as risk reductions, not absolutes. The promise is honest: "reduces silent drift", not "guarantees no drift".

5. **Existing downstream projects bump submodule** — get the new artefacts as additions, not replacements. A short migration note in CHANGELOG explains what to create per existing feature (one Product Contract per active user-facing feature).

## Existing guarantees this touches

| # | Guarantee | Effect of this plan |
|---|---|---|
| 1 | Code matches plan | Strengthened — Definition of Done sub-check makes "matches plan" a hard checkbox |
| 2 | Existing behavior doesn't break | Strengthened — Product Contracts make "Must Not Break" explicit per feature |
| 7 | Docs don't drift from code | Strengthened — contracts are a new docs surface that reviewer verifies |
| 10 | All changes through pipeline | Unchanged |
| 11 | Code matches stack | Unchanged |
| 12 | Scope without silent deformation | Strengthened — Product Impact Report makes behavior changes explicit |

No guarantee weakened or removed. README wording shifts from absolutes to risk reductions — same content, more honest framing.

## Key design decisions

1. **PM remains product-only.** State and Contract files are agent-maintained; PM reads state when curious, writes nothing.

2. **Execution State is one file per active task at a time, not per session.** `.ai-pm/state/current.md` is overwritten as the active task progresses. Past states get archived to `.ai-pm/state/archive/<topic>-<date>.md` on completion. Avoids state-file proliferation.

3. **Product Contracts are user-facing-feature-only.** Backend-only changes (refactor, infra) don't need a contract. Bootstrap doesn't require contracts for every existing feature on day one — they get created as features get touched.

4. **Definition of Done is part of reviewer verdict, not a separate file.** Adds a Definition of Done section to the existing `<topic>_review.md` rather than introducing yet another artefact. Reviewer outputs `pass | fail` against 7 checks.

5. **Rejected from consultancy:**
   - **Modes vs roles (Part 3)** — our subagents are isolated contexts; modes would collapse them into one context and lose isolation. Keep agents-as-personas.
   - **Strict One Logical Step (Part 4)** — kept as coder.md guidance ("smallest meaningful change first"), not enforced. Atomic commits already deliver the same intent without spawn overhead.

6. **Out of scope for this PR but planned separately:**
   - Additional document fragmentation (Part 6) — current fragmentation (agents, commands, templates, docs, stack-notes) is sufficient; revisit if pain shows.
   - ~~`.gitignore` cleanup (audit-fixup #23)~~ — **revised in-flight:** absorbed into this PR. PM observation triggered it: the consultancy introduces a new state-keeping system (`.ai-pm/state/`) that semantically supersedes the stale `.bootstrap-state.local.md` and `.ai-pm/.reviews/release-*.json` mentions in `.gitignore`. Cleaning the dead references in the same PR that introduces the replacement is more honest than splitting. Reviewer caught this as silent scope creep; this note legalises the absorption.
   - ~~Architect persona stale `design-review` reference (audit-fixup #25 sub-item)~~ — **revised in-flight:** absorbed into the same `.gitignore` cleanup commit. Same rationale: stale references to retired concepts are conceptually one cleanup; splitting would be ceremony.
   - CHANGELOG backfill (audit-fixup #26) — small separate PR.
   - Architect persona extension for canonical architecture.md ownership (audit-fixup #27) — small separate PR.

## Categorical scope

«State persistence mechanisms» is a category. **One element chosen:** Markdown file in `.ai-pm/state/current.md`. **Siblings in Out of scope:** SQLite, MQTT pub/sub, in-memory only, distributed state — each could become a separate plan if file-based approach proves insufficient.

«Contract types» is a category. **One element chosen:** Product Contract (user-visible behaviour). **Siblings in Out of scope:** Performance Contract, Security Contract, API Compatibility Contract — each gets a separate plan when the need surfaces.

«Review verdict types» is not categorical — `approve / request-changes` is a binary, not a multi-element set.

## Contracts

**New template files:**

- `doc/_templates/state.md.tmpl` — Execution State Protocol artefact (Status / Done / Remaining / Touched Files / Next Step / Validation).
- `doc/_templates/contract.md.tmpl` — Product Contract artefact (User Value / Must Work / Must Not Break / Acceptance Checks).

**Modified agent personas:**

- `.claude/agents/coder.md` — read `.ai-pm/state/current.md` as step 1; update state at end of run; produce Product Impact Report block in the closing report.
- `.claude/agents/reviewer.md` — read contract for the feature, verify Must Work / Must Not Break / Acceptance Checks against the diff; output a Definition of Done section with 7 explicit checks.
- `.claude/agents/architect.md` — no changes (read-only).
- `.claude/agents/auditor.md` — read all contracts; dimension 11 (new) "Contract integrity" — every user-facing feature should have a contract; stale contracts (not reviewed in 90 days while feature changed) flagged as notes.
- `.claude/agents/stack-researcher.md` — no changes.
- `.claude/agents/pr-prep.md` — no changes; CHANGELOG already captures behavioral changes when commits are conventional.
- `.claude/agents/docs-extractor.md` — for legacy bootstrap: create initial draft contracts from discovered user-facing flows (one per journey).

**Modified commands:**

- `.claude/commands/bootstrap.md` — create `.ai-pm/state/` directory and `.ai-pm/contracts/` directory in both greenfield and legacy paths.
- `.claude/commands/plan-feature.md` — after plan approval, if feature is user-facing, ask PM one product question ("does this change what users see / can do?"). If yes, spawn a draft contract; coder honors it during implementation; reviewer verifies it.
- `.claude/commands/audit.md` — no changes to command, but auditor now has dimension 11.

**Modified workflow / docs:**

- `WORKFLOW.md` — new "How state is kept" section between "How I work" and "When you say it doesn't work in production". One paragraph + example.
- `README.md` — guarantees section reworded from absolutes ("гарантирует") to risk reductions ("снижает риск"). Update flow diagram to show contract creation between plan and code. Updated wording about "what PM does NOT do" (remains product, plus reads state when curious).
- `doc/architecture.md` — add new architectural decisions: Execution State as the single source of progress; Product Contracts as the product-side complement to stack-notes; Definition of Done as a reviewer verdict checkbox set.
- `doc/stack-notes.md` — no changes; this PR introduces no new technical components.

**Out of scope file changes:**

- `.claude/settings.json` — unchanged; hooks already in place.
- `.github/workflows/*.yml` — unchanged; release flow unchanged.
- `tests/hooks.sh` — unchanged; this PR adds no new hooks.

## Stack expectations touched

From `doc/stack-notes.md`:

- **Markdown frontmatter (YAML 1.2.2)** — used by state.md.tmpl and contract.md.tmpl headers if any (likely simple Markdown, no frontmatter needed). Source: <https://yaml.org/spec/1.2.2/>.
- **git** — state file committed each step; contract files created and updated as features evolve. Standard git workflow, no new constraints. Source: stack-notes.md git section.

No new external systems introduced. No new validators needed in Pipeline. No new integration contracts.

## Test plan

This template repo follows "validation by use" — no traditional automated tests. Validation:

**Existing tests that must still pass:** `bash tests/hooks.sh` — unchanged hook regexes, 44/44 PASS.

**Validation by use — apply the new protocol to a tracer feature in a test downstream project:**

1. **State tracer** — Start a feature on the wb-mqtt-matter audit-fixup queue. Open `.ai-pm/state/current.md` mid-task — should show: current step, what's done, what's remaining, next step. Pause session, re-enter, re-read state — should be enough to resume without chat history.

2. **Contract tracer** — Add a user-facing feature (e.g., the next wb-mqtt-matter audit-fixup that touches device behavior). Coder must read the contract before implementing. Reviewer must verify the diff against Must Work + Must Not Break. Definition of Done section in the review explicitly checks all 7 items.

3. **Definition of Done tracer** — Generate a review on a fixup where one tier of pipeline fails (force a validator failure). Reviewer must output `Definition of Done: fail` with the specific check failing. No `approve` allowed when DoD fails.

4. **Bootstrap tracer** — In a fresh test repo, run `/bootstrap` greenfield. Verify `.ai-pm/state/` and `.ai-pm/contracts/` directories exist, with state.md skeleton placed.

**Stack-spec tests:** N/A — this PR introduces no new technical components from stack-notes.

**Anti-regression on existing flow:**

- An existing audit-fixup plan (e.g., #23 gitignore cleanup, planned next) runs without changes. Coder reads state, updates state at end, no friction.
- Reviewer on a non-user-facing change (refactor, infra) skips the contract check explicitly ("no contract — change is backend-only"), still outputs Definition of Done.

## Docs to update

- `README.md` — guarantees rewording (absolutes → risk reductions); flow diagram update.
- `WORKFLOW.md` — new "How state is kept" section; updated notes-routing section to mention Product Impact Report.
- `doc/architecture.md` — three new architectural decisions (State, Contracts, DoD).
- `CHANGELOG.md` — pr-prep adds entry.

## Out of scope

- **Modes instead of agents** (consultancy Part 3) — keeps subagent isolation.
- **Strict One Logical Step enforcement** (Part 4) — kept as coder guidance, not rule.
- **Document fragmentation per mode** (Part 6) — current structure is sufficient.
- **Migration of existing downstream projects to new artefacts** — they pick up additions at next submodule bump; CHANGELOG explains how to backfill contracts for active features.
- **Audit-fixup #23, #24, #26, #27** — separate small PRs after this one lands.
- **Performance / Security / API contracts** — siblings of Product Contract; separate plans when needed.

## Handoff

1. Orchestrator (me) writes the two new template files first — they are the artefact definitions everything else references.
2. Orchestrator updates agent personas (coder, reviewer, auditor, docs-extractor) in atomic commits, one per agent.
3. Orchestrator updates commands (bootstrap, plan-feature) in atomic commits.
4. Orchestrator updates WORKFLOW.md, README.md, doc/architecture.md.
5. Self-review: spawn `reviewer` on the branch to verify Definition of Done is correctly described and that the plan-as-contract optimization is preserved.
6. `pr-prep` opens the PR.

No external subagents needed for content creation — this is template-self-documentation, same workaround as audit-fixup-self-docs-architecture. Architect persona ownership gap (task #27) still pending and handled in a separate small PR after this lands.
