# integrate-consultancy — review (v2, re-check after fix-pass)

Re-applied against commit `d60612a fix(integrate-consultancy): close 4 blocking + 4 technical notes from review`. v1 verdict was `request-changes` with DoD `fail`. This v2 verifies each of the 4 blocking items and 4 technical notes are closed and re-runs the Definition of Done.

## Plan compliance

- ✓ Scenario 1 (PM returns to a paused task) — unchanged from v1; still implemented.
- ✓ Scenario 2 (Product Contract for user-facing feature) — unchanged from v1; still implemented.
- ✓ Scenario 3 (Definition of Done verdict) — unchanged from v1; still implemented.
- ✓ Scenario 4 (README guarantees rewording) — **now fully implemented**. Header `README.md:88` reads `## Какие риски шаблон снижает` (grammatically coherent). v1 Blocking 1 closed.
- ✓ Scenario 5 / Migration path — unchanged from v1; pr-prep step still downstream.
- ✓ Plan's "Modified workflow / docs" → README flow diagram update — **now landed**. `README.md:23–25` adds the contract-draft step between plan and architect; `README.md:37` reads "по 11 измерениям"; `README.md:40` adds "Definition of Done: pass | fail". v1 Blocking 2 closed.
- ✓ Plan's "Modified workflow / docs" → WORKFLOW.md "How state is kept" + notes-routing — **now landed**. `WORKFLOW.md:120` has the section; `WORKFLOW.md:132–142` adds the new "Three channels surface to PM, not one" subsection that explicitly names the Coder's Product Impact Report. v1 Technical 1 closed.
- ✓ Plan's scope contract — **now legalised**. `doc/features/integrate-consultancy_plan.md:50–51` carries ~~strikethroughs~~ on the two Out-of-scope items absorbed (`.gitignore` cleanup, architect.md `design-review` reference) plus a "revised in-flight" note explaining the rationale. v1 Blocking 3 closed via plan-revision route (option (b) from the v1 fix proposal — the route that records the revision honestly).
- ✓ `.claude/agents/auditor.md:3, 7, 31` and `WORKFLOW.md:13` — **all corrected to "11 dimensions"**. No residual "10 dimension" / "10-dimension" wording in any touched file. (Only remaining "10-dimension" mentions repo-wide are in `doc/features/protocol-integrity-and-stack-literacy_validation.md`, which is a historical artefact predating the dim-11 introduction and outside the touched-files set.) v1 Blocking 4 closed.
- ✓ Plan's "Out of scope file changes" → `.claude/settings.json`, `.github/workflows/*.yml`, `tests/hooks.sh` — confirmed untouched.
- ✓ Categorical scope (file-based state, Product Contract) — unchanged from v1.
- ✓ Consultancy rejections (Modes-vs-roles, Strict One Logical Step) — unchanged from v1.
- ✓ "Stack expectations touched" — unchanged from v1.

## Definition of Done

- [x] Code changes are within the plan's scope (no scope creep) → **now checked**: the plan revision on lines 50–51 legalises the two absorptions; this is no longer a silent merge. The first feature merged under DoD item 1 satisfies the rule honestly via plan-revision rather than reversion.
- [x] Plan's "Stack expectations touched" rules respected; stack-spec tests pass → unchanged from v1.
- [x] Product Contract (if any) honored; Acceptance checks pass; no silent behavior change → **N/A** (chicken-and-egg, see below); recording as "no Product Contract touched".
- [x] Tests run; pipeline (test + lint + validators) green → `bash tests/hooks.sh` → 44/44 PASS.
- [x] `.ai-pm/state/current.md` updated; Done / Remaining / Next step current → **N/A** (template repo has no `.ai-pm/state/current.md`; meta-case).
- [x] Coder's Product Impact Report present (when contract touched) → **N/A** (no contract touched; meta-case).
- [x] Docs updates listed in plan are landed in this branch → **now checked**: README flow diagram updated (dim-11 count, contract step, DoD line); WORKFLOW.md "How state is kept" present; WORKFLOW.md notes-routing extended via the new Three-channels subsection that names the Product Impact Report; doc/architecture.md three new decisions present (state, contracts, DoD).

**DoD: pass**

The v1 contradictions (pass DoD with scope creep, pass DoD with docs not landed) are both resolved. No checkbox carries a hidden unchecked status. No Blocking item remains open.

## Each v1 blocking closed

1. **v1 Blocking 1 — README header grammar.** Closed. `README.md:88` reads `## Какие риски шаблон снижает`. Subject-predicate now coherent. Old `## Что шаблон снижает риск` is gone repo-wide.
2. **v1 Blocking 2 — README flow diagram.** Closed. Contract-draft step inserted between plan-approval and state-update (lines 23–25); reviewer dimension count 10 → 11 (line 37); explicit "Definition of Done: pass | fail" line (line 40). All three deltas the v1 review required are present.
3. **v1 Blocking 3 — scope creep.** Closed via plan-revision. `doc/features/integrate-consultancy_plan.md:50–51` strikes through the two Out-of-scope items and writes the "revised in-flight" rationale ("the consultancy introduces a new state-keeping system that semantically supersedes the stale .bootstrap-state.local.md ...; cleaning the dead references in the same PR that introduces the replacement is more honest than splitting"). The reviewer offered (a) revert or (b) plan-update; the orchestrator chose (b). Acceptable; the revision is no longer silent.
4. **v1 Blocking 4 — auditor 10 → 11 dimensions.** Closed. `.claude/agents/auditor.md:3` (frontmatter description), `auditor.md:7` (intro), `auditor.md:31` (step 3 "Apply the 11 dimensions"), and `WORKFLOW.md:13` (agent-table row) all now say "11". Internal contradiction (description vs. catalog) resolved.

## Each v1 technical note addressed

1. **WORKFLOW.md notes-routing → Product Impact Report.** Addressed. New "Three channels surface to PM, not one" subsection at `WORKFLOW.md:132–142` under "How state is kept" names the Coder's Product Impact Report as the third channel (alongside Reviewer's Notes and DoD line) and adds the meta-rule "if the three channels contradict, surface that as itself a finding". The orchestrator placed the subsection under "How state is kept" rather than splicing into the lines 105–110 notes-routing paragraph; this is a reasonable structural choice (the Impact Report is a state-of-the-task artefact, not a Notes routing rule) and the two sections do not contradict.
2. **plan-feature.md template path.** Addressed. `plan-feature.md:191` now names the explicit template file path `.ai-pm/tooling/doc/_templates/contract.md.tmpl`. Consistent with `docs-extractor.md` wording.
3. **state.md.tmpl `idle` enum.** Addressed. `state.md.tmpl:15` Status enum reads `idle | planning | coding | reviewing | fixing | pr-prep | blocked | done`. Consistent with `state.md.tmpl:48` "Status: idle" reset instruction and with `bootstrap.md` initial value.
4. **docs-extractor.md budget rule.** Addressed. `docs-extractor.md:97` adds the explicit budget rule: cap at 8 draft contracts, surface remaining journeys as `**Pending contracts:**` list to the caller for PM-driven prioritisation. Avoids wall-of-stubs friction on 30-journey legacy projects.

## Product notes accepted by orchestrator

- **v1 Product note 1 — DoD meta-rule moved out of README.** Accepted. The README bullet at `README.md:120` ("Завершённость задачи объективна — реже субъективна") now keeps only the user-facing framing (7 checks, pass | fail) and points at WORKFLOW.md for details. The actual contradiction-handling rule ("pass with any unchecked box is a contradiction") lives at `WORKFLOW.md:142` under the new Three-channels subsection. Product-facing surface stays product-facing; protocol-internal rule lives in WORKFLOW.md.
- **v1 Product note 2 — docs-extractor budget.** Accepted. Realised as v1 Technical 4 (cap at 8, "Pending contracts" list). Closes the wall-of-stubs concern explicitly.

## New findings (introduced by fix-pass)

None.

Sanity checks performed:

- README bullet at line 120 truncates to "Подробности в WORKFLOW.md" — verified the linked WORKFLOW.md content actually carries the DoD-contradiction rule (`WORKFLOW.md:142`). No broken pointer.
- The original notes-routing paragraph in WORKFLOW.md (lines 105–110, under "How I work") and the new Three-channels subsection (lines 132–142, under "How state is kept") describe overlapping concerns from different angles — workflow operation vs. taxonomy. Re-read both: no contradiction. The original paragraph still owns the orchestrator's split-and-route mechanics; the new subsection enumerates the three channels and their contradiction-resolution rule. Reviewer's "product Notes" appear in both, which is appropriate.
- All remaining "10-dimension" references repo-wide are in `doc/features/protocol-integrity-and-stack-literacy_validation.md`, which is a historical validation artefact for an earlier audit milestone. Out of scope for this PR; touching it now would itself be scope creep.
- Plan strikethroughs on lines 50–51 are visible in the rendered Markdown (`~~text~~`); the replacement rationale is on the same bullet, not a separate paragraph — keeps the audit trail compact.

## Chicken-and-egg observations (carried from v1)

Unchanged: DoD items 3, 5, 6 remain N/A for the same template-repo reasons documented in v1. The protocol still catches its introducing PR's own deviations — and this time, those deviations are closed.

## Tests run

`bash tests/hooks.sh` → exit 0, 44 PASS / 0 FAIL.

## Verdict

approve

This PR ships the state + contracts + Definition of Done machinery cleanly. All four v1 blocking items are closed, all four technical notes are addressed, and both v1 product notes were folded into the implementation (DoD meta-rule relocated from README to WORKFLOW.md; budget rule added to docs-extractor). The plan-as-contract optimisation now applies cleanly to its own introducing PR: scope absorptions are legalised in the plan rather than buried in chore commits, the README and auditor agree on the dimension count, the flow diagram shows the contract step, and the DoD column reads pass without contradictions.
