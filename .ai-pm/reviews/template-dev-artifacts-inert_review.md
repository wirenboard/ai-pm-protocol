# template-dev-artifacts-inert — Pass-1 plan-compliance review

Model: claude-sonnet-4-6 (cross-model Pass-1; session model is claude-sonnet-4-6)

## Plan compliance

- ✓ **Scenario 1 — WORKFLOW.md always-on kernel names the submodule exclusion.** The "Project boundary" one-liner in `WORKFLOW.md` line 12 gained the clause naming `.ai-pm/tooling/` as inside the root but outside the readable content surface, listing the named shipped surface exactly as specified. Implemented in commit `28b81ca`.

- ✓ **Scenario 2 — `workflow/enforcement.md` project-boundary rule elaborates the submodule exclusion.** A new "Submodule exclusion" paragraph was added immediately after the "Project boundary rule" paragraph in `workflow/enforcement.md`. It names the shipped surface, explains that the prior protection was a `doc/`-vs-`docs/` coincidence, and instructs agents to stop before reading out-of-scope paths. Implemented in commit `28b81ca`.

- ✓ **Scenario 3 — `pm-auditor.md` inventory step gains an explicit exclusion note.** Step 1 `docs/features/` inventory line in `.claude/agents/pm-auditor.md` gained the parenthetical `(never .ai-pm/tooling/doc/features/ — that is the protocol template's own plans, not the downstream project's features)`. Implemented in commit `28b81ca`.

- ✓ **`doc/architecture.md` decision record present.** The plan's "Docs to update" item required a decision record authored by `pm-architect` post-coding. Commit `ee22c0d` added the `### Template dev-artifacts inert downstream` entry at `doc/architecture.md` line 435–437, covering all three layers and the shipped surface list. Authored post-coding as specified.

- ✓ **Test plan honored.** The plan explicitly declares "New tests: none" for a markdown-prose repo — verification is editorial (Pass-1 + Pass-2). `tests/hooks.sh` ran 73/73 green (verified this turn).

## Definition of Done

- [x] All plan scenarios implemented and tested — three file changes per plan, editorial verification via Pass-1; test plan declared no new tests required; 73/73 hooks green.
- [x] Interaction scenarios have concurrent-state tests — plan declared `Provably isolated: prose additions to three files. No shared mutable state, no concurrency, no I/O.` No concurrent-state tests required.
- [x] Stack expectations respected; stack-spec tests pass — plan declared no stack expectations touched (Markdown prose only). Hooks suite 73/73 green.
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change — no Product Contract: plan explicitly declares "No Product Contract — protocol boundary rule; not user-facing product behavior. No human-role subject."
- [x] Pipeline green — `tests/hooks.sh` 73/73, verified this turn.
- [x] State file updated — `.ai-pm/state/current.md` updated in commit `28b81ca`; records implementation complete and lists all touched files.
- [ ] Product Impact Report present (when contract touched) — n/a; no contract touched.
- [x] Docs updates landed — `doc/architecture.md` decision record present (commit `ee22c0d`). README not touched per plan ("README not touched — no install/quickstart/architecture-one-liner/doc-pointer change").
- [x] Expected artifacts exist (plan, this review, contract if user-facing) — plan at `doc/features/template-dev-artifacts-inert_plan.md` present; this review now present; contract correctly absent (non-user-facing).
- [n/a] Product-readiness gate resolved (user-facing only) — plan's scenario subjects are all system/agent entities (agents, the boundary rule, the invariant), not human roles. Non-user-facing feature; gate is n/a.
- [n/a] Validation gate resolved (documentation-kind only) — project kind is `software` per `CLAUDE.md` ("Project kind: software"). Gate is n/a.
- [n/a] Failure-inventory negative-space tests present — plan has no failure-inventory scenarios (no external I/O touched). Gate is n/a.

**DoD: pass**

## Blocking

(none)

## Notes (product)

1. **Selection-citation backstop satisfied.** The plan's `Source:` line declares `selected autonomously per ### Decision authority; source: .ai-pm/backlog.md § "Template dev-artifacts must stay inert downstream" (2026-06-04)`. The backlog entry exists (confirmed at line 201 of `.ai-pm/backlog.md` where it appears in the "Still open" list). Citation token is present and traceable. No block.

2. **Diff scope — prior features on the same long-running branch.** `git diff main...HEAD` covers 40 files spanning 8+ earlier features (`cross-model-review`, `agent-reporting-discipline`, `stack-idioms-library`, `seam-completeness`, `comment-restraint`, `state-archive-home`, `integration-risk-spike-gate`, `agent-handoff-durability`). The two commits belonging to this feature (`28b81ca`, `ee22c0d`) touch only the four files the plan specifies. The additional files in the broad diff are artifacts of prior features already reviewed on this branch — they are not scope expansion for this feature. The orchestrator may wish to confirm all prior features on the branch are fully reviewed and cleared before PR-prep.

## Verdict

approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See the "Edit-ownership rule" in `workflow/enforcement.md` — the Pass-2 code-review
     trail is the single carve-out to "orchestrator does not edit content artefacts". -->
## Code review findings

Model: claude-opus-4-8 (cross-model Pass-2; session model is claude-sonnet-4-6). Scope: the two feature commits `28b81ca` (feat) + `ee22c0d` (docs/arch) only — prior features on the long-running branch excluded. Doc-prose diff: correctness = misleading prose, missing edge case, contradiction, uncovered constraint. All 7 finder angles + seam-completeness (exception-boundary, store-contract-consistency, symmetry-of-paranoia) run. Cross-checked against `.ai-pm/backlog.md` § "Template dev-artifacts must stay inert downstream" and the Pass-1 verdict above.

**Blocking:** none.

**Verified correct (no defect — recorded so the cross-check is auditable):**

- **Named-shipped-surface completeness — no designed read banned.** Every actual `.ai-pm/tooling/` reference across the agents (`pm-stack-researcher`, `pm-architect`, `pm-codebase-reader` → `doc/_templates/*.tmpl`; `pm-auditor` / `pm-plan-checker` → `MIGRATIONS.md` by name) lands inside the rule's permitted surface (`WORKFLOW.md`, `MIGRATIONS.md`, `.claude/agents|commands|settings.json`, `doc/_templates/`). The "named surface, not a blanket ban" design decision holds — no false ban. Surface list is identical across all three layers (WORKFLOW.md kernel, enforcement.md full rule, arch record) and matches the backlog's authoritative enumeration. Symmetry-of-paranoia: clean.

- **`git log` escape path (backlog's named residual risk) — correctly not covered.** The backlog flagged "broad `grep -r` / `glob` / `git log` over the root" as the escape vector. The rule scopes itself to `Read`/`Grep`, not `git log`. This is correct, not a gap: `.ai-pm/tooling/` is a separate git repository, so a superproject `git log` does not surface submodule commits — there is no `git log` escape to guard against. Missing-constraint angle: no real omission.

**Notes (non-blocking):**

1. **`pm-auditor` note placement: Step 1 (load-context), not Step 2 (inventory) as the plan worded it.** Plan scenario 3 / "Existing behaviors" named the "Step 2 inventory instruction" as the home for the exclusion note; the implementation placed it on the Step 1 `docs/features/` load-context line instead. This is a *better* home — Step 1 is where `docs/features/` is first read, which is the actual highest-risk descent point — and Pass-1 accepted it. Recorded only so the plan-vs-impl divergence is on the record; no change needed.

2. **`MIGRATIONS.md` is reachable at the downstream root, not only inside the submodule.** The rule lists `MIGRATIONS.md` among the surface "inside `.ai-pm/tooling/`". In practice downstream agents reference `MIGRATIONS.md` by bare name (it resolves at the project root / via the shipped pointer), and it also exists at `.ai-pm/tooling/MIGRATIONS.md`. Listing it as a permitted in-submodule path is correct and harmless (it is reachable both ways); the slight imprecision ("inside the submodule" reads as the *only* location) does not mislead any agent into a wrong action. No fix needed.

**Editorial:** prose is unambiguous; the three layers are internally consistent and consistent with the existing Project-boundary / edit-ownership / remote-system invariants (no contradiction). The "read-only submodule" framing is accurate (the submodule is a separate git; downstream consumes it via symlink/copy of the shipped surface only).

## Code review: 2026-06-05 — passed
<!-- The orchestrator replaces THIS WHOLE LINE with `## Code review: <date> — passed`
     only when code-review clears. Until then the section is UNSTAMPED: `pm-pr-prep`
     refuses to release it (step 0) and `pm-auditor` blocks on it (dimension 1).
     Never ship an empty `## Code review` heading — an empty section reads as
     "no findings / passed" to a quick eye or grep; `NOT YET RUN` reads as "not done". -->
