# seam-completeness — plan

Decision authority: autonomous

Source: selected autonomously per ### Decision authority; source: `.ai-pm/backlog.md` § "Seam-completeness + failure-inventory: closing the 'flawless-where-stated, gap-on-the-unstated' blind spot" (2026-06-05) + "Review passes must be backlog/review-history-aware + backlog in/out discipline" (2026-06-05).

## Scenarios

1. **Planner applies failure-inventory to an I/O-touching feature.** When planning a feature whose implementation touches external I/O (network calls, third-party APIs, file system, shared data stores), the planner explicitly enumerates — for each affected public function — invalid inputs, external failure modes, and the return/raise behavior in each case. These failure paths appear as explicit scenarios in the plan alongside the happy-path scenarios. The coder covers them as reliably as any other stated scenario.

2. **Negative-space tests accompany each enumerated failure path.** When the plan includes failure-inventory scenarios (scenario 1), each failure path requires at least one corresponding negative-space test in the test plan — a test that exercises the failure condition (network error, partial data, missing key), not the invariant path. `pm-plan-checker` verifies the pairing: a plan with failure-inventory scenarios must have failure-path tests for each one.

3. **Seam-completeness angle runs after per-diff code-review.** After the bundled `code-review` completes at Pass-2 (Step 5), the orchestrator additionally invokes a dedicated seam-completeness check as a separate Agent. The check's three-item checklist: (a) for every exception that can cross a module boundary — confirm the entry point / top level catches it; (b) for every read from a shared data store — confirm the contract is consistent across all reading modules (missing/corrupt input → empty/refused, not crash); (c) symmetry of paranoia — if one module entry point guards against a failure class, check that sibling entry points of the same kind also guard. Findings are merged into the `## Code review findings` trail alongside code-review findings.

4. **Review passes dedup against accepted findings.** Before the orchestrator records any finding (from code-review or the seam check), it cross-checks against `.ai-pm/reviews/<topic>_review.md` and `.ai-pm/backlog.md` accepted entries. An already-found-and-accepted item is suppressed; its recorded triage severity is never inflated by the current pass.

## Existing behaviors this feature touches

- **Per-diff review loop (Step 5 Pass-2)** — gains the seam-completeness angle (runs after code-review) and the backlog-aware dedup rule. The bundled `code-review` skill is **unchanged**; the seam check is additive. The `## Code review findings` trail, the `## Code review: <date> — passed` stamp, and the `pm-pr-prep` gate are untouched.
- **`/pm-plan` planning checks** — gains a new conditional "Failure-inventory check" alongside the existing NFR/state-model/security-surface/README-currency checks. All existing checks are unchanged.
- **`pm-plan-checker` DoD** — gains one new check: failure-inventory scenarios → negative-space tests pairing. All existing DoD items are unchanged.

## Contracts

(No Product Contract — protocol-discipline change only. All scenario subjects are system actors: planner, coder, reviewer, orchestrator. No user-facing behavior change.)

## Stack expectations touched

- **Markdown frontmatter (YAML in Claude Code agent files):** `.claude/agents/pm-plan-checker.md` is a Claude Code agent file with YAML frontmatter (`name`, `description`). Prose additions to the body must not corrupt the frontmatter block. Source: `doc/stack-notes.md` § "Markdown frontmatter (YAML in Claude Code agent files)".
- **Claude Code slash commands:** `.claude/commands/pm-plan.md` is a Claude Code slash command file. Prose additions must not corrupt the command body structure. Source: `doc/stack-notes.md` § "Claude Code context-loading model".

## Interaction scenarios

Provably isolated: prose additions to `workflow/review-typology.md`, `workflow/pipeline.md`, `.claude/commands/pm-plan.md`, and `.claude/agents/pm-plan-checker.md`. No shared mutable state, no concurrent operations, no I/O, no adjacent feature interference.

## Test plan

- Existing tests that must pass: all `tests/hooks.sh` — 73/73 (no hook touched, no `settings.json` change).
- New tests: **none** — markdown-prose repo with no runtime. Verification is editorial, per the project-kind documentation discipline: Pass-1 plan-compliance (all four scenarios implemented; seam-completeness angle defined with 3-item checklist; failure-inventory check added to `pm-plan.md`; pm-plan-checker DoD gains one check; backlog-aware dedup rule in `workflow/review-typology.md`) + Pass-2 `code-review` over the diff. Consistent with `cross-model-review`, `stack-idioms-library`, `test-wiring-parity`, and other protocol-discipline precedents for this repo.

## Docs to update

- `doc/architecture.md`: decision record — "Seam-completeness + failure-inventory: failure-inventory as a conditional `/pm-plan` planning discipline (triggers on external I/O / cross-module seams, silent otherwise); negative-space test pairing (each failure path → one test); seam-completeness angle as a parallel per-diff Agent check with 3-item checklist (exception-boundary, store-contract-consistency, symmetry-of-paranoia); backlog-aware dedup as a universal rule for all review passes (dedup + respect triage before recording findings). Sources: `workflow/review-typology.md`, `.claude/commands/pm-plan.md`, `.claude/agents/pm-plan-checker.md`, `workflow/pipeline.md`." Authored by `pm-architect` post-coding.

## Key design decisions

- **Seam check = separate Agent, not a new bundled code-review angle.** The bundled `code-review` skill's 7 angles are fixed upstream; the seam check is a parallel dedicated Agent invocation after code-review, with a 3-item seam checklist. Findings merge into the same `## Code review findings` trail. This keeps the bundled skill unchanged and the seam check composable.
- **Failure inventory = conditional, not mandatory.** Same trigger shape as NFR/state-model/security-surface: a semantic judgement (does the feature touch external I/O or cross-module seams?), no hook, silent when not triggered. Consistent with the proportional-checks philosophy across those slices.
- **Failure paths go into plan Scenarios, not a parallel `## Failure inventory` section.** Ensures the coder treats them as first-class requirements, not optional documentation. The test-plan pairing rule is a new bullet in the `pm-plan.md` "Test plan rule" section.
- **Negative-space test pairing is IN SCOPE.** Paired explicitly in the backlog ("negative-space testing pairs with the inventory"). Adding the rule to pm-plan.md's test-plan section closes the "stated failure modes → untested" gap the failure inventory creates without testing. Negligible added scope — one bullet.
- **Backlog-aware dedup = a mandatory universal rule in `workflow/review-typology.md`.** Applied to all review passes (per-diff code-review + seam check + quality sweep), stated once as a required pre-condition before recording any finding. Reuses existing `.ai-pm/reviews/` + `.ai-pm/backlog.md` artifacts.
- **Severity triage context-awareness is OUT OF SCOPE.** "Severity triage must be deployment-context-aware" (separate backlog entry 2026-06-05) — involves `## Operational limits & budgets` consultation during review severity assessment. Different scope, own plan.

## Out of scope

- **Severity triage context-awareness** — "Severity triage must be deployment-context-aware; context-enrichment before cross-model" (separate backlog entry). Involves review severity consulting `## Operational limits & budgets` + `## Architectural constraints`. Own plan.
- **`functional/integration` review type (later slice)** — the cross-component seam type registered in `### Review typology` as "later slice, not built." The seam-completeness angle here is a *per-diff* check (every change, fast, 3-item checklist); the functional/integration type is a *rare full-system sweep* (ultra depth, runs integration tests). Different scope and cadence.
- **Building a deterministic seam-detection hook** — the seam checklist is AI-evaluated (a reasoning subagent), consistent with backlog #211 ("genuinely semantic → AI" tier). The 3 checklist items are cross-module reasoning questions a regex/linter cannot answer.
- **Retroactive sweep of existing codebase for seam violations** — the seam check is scoped to newly-introduced seams in each per-diff pass, not a whole-codebase sweep.
- **Review-typology engine selection** — already shipped via `review-engine-selection_plan.md`.
