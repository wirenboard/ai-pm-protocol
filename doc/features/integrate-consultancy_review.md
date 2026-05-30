# integrate-consultancy — review

## Plan compliance

- ✓ Scenario 1 (PM returns to a paused task) — implemented; `doc/_templates/state.md.tmpl` defines the artefact; coder.md step 1 reads it, step 9 updates it; plan-feature initializes it (`Initialize Execution State` block).
- ✓ Scenario 2 (Product Contract for user-facing feature) — implemented; `doc/_templates/contract.md.tmpl` defines the artefact; plan-feature drafts it (`Product Contract check`); coder.md step 4 reads it; reviewer.md dim 11 verifies it; auditor.md dim 11 sweeps it; docs-extractor drafts initial contracts for legacy bootstrap.
- ✓ Scenario 3 (Definition of Done verdict) — implemented; reviewer.md "Verdict format" now includes the 7-item Definition of Done section and the `DoD: pass | fail` line, with the "Definition of Done rule" wired into the closing rules.
- ✗ Scenario 4 (README guarantees rewording) — partially implemented. Body of the section is reworded ("реже" framing replaces "гарантирует"); but the section header reads `## Что шаблон снижает риск`, which is broken Russian grammar (the verb has no subject — reads as "What the template reduces risk"). Plan specified the framing as "снижает риск". See Blocking 1.
- ✗ Scenario 5 / Migration path — partially. Plan said "A short migration note in CHANGELOG explains what to create per existing feature (one Product Contract per active user-facing feature)" — no CHANGELOG entry exists in this branch (the plan delegates CHANGELOG to `pr-prep`, which has not run yet, and the orchestrator may compose it at PR time). Not flagged as blocking — pr-prep step is downstream. WORKFLOW.md "How state is kept" + README guarantees both describe how downstream picks up contracts implicitly; that is enough for the "additions, not replacements" reading.
- ✗ Plan's "Modified workflow / docs" → "README.md — guarantees rewording (absolutes → risk reductions); flow diagram update" — flow diagram NOT updated. The "Новая фича" ASCII block still says "Reviewer-агент проверяет по 10 измерениям" and has no arrow for contract draft between plan-feature and coder. See Blocking 2.
- ✗ Plan's "Modified workflow / docs" → "WORKFLOW.md — new 'How state is kept' section between 'How I work' and 'When you say it doesn't work in production'. One paragraph + example" — section added. Plan also said "updated notes-routing section to mention Product Impact Report" — the notes-routing section was NOT updated to mention Product Impact Report (Impact Report appears only in `coder.md` and `reviewer.md`). See Note (technical) 1.
- ✗ Plan's "no changes" rule for `.claude/agents/architect.md` — silently violated. The `chore: drop stale trace artefacts` commit edited architect.md line 17 ("design-review" → "architecture review"). The plan's "Modified agent personas" list explicitly says `architect.md` — no changes. See Blocking 3 (scope creep).
- ✗ Plan's "Out of scope for this PR but planned separately" → `.gitignore` cleanup (audit-fixup #23) — silently included. The chore commit `3f96a2b` rewrites `.gitignore` and explicitly states "Closes audit-fixup #23 in-line (no separate PR needed)". Plan listed this item as a separate small PR after this one lands. See Blocking 3 (scope creep).
- ✓ Plan's "Out of scope file changes" → `.claude/settings.json`, `.github/workflows/*.yml`, `tests/hooks.sh` — confirmed untouched.
- ✓ Plan's "no new stack components" — confirmed; `doc/stack-notes.md` untouched; `CLAUDE.md.tmpl` untouched.
- ✓ Categorical scope (File-based state vs SQLite/MQTT/in-memory siblings; Product Contract vs Performance/Security/API contract siblings) — siblings remain listed in Out of scope; no diff implements a sibling as a permissive variant.
- ✓ Consultancy rejections honored. Modes-vs-roles (Part 3) — no diff collapses agents into modes. Strict One Logical Step (Part 4) — coder.md retains "smallest meaningful change first" intent, no per-step spawn enforcement was introduced.
- ✓ "Stack expectations touched" entries (Markdown + git) — neither stack-spec test is required (templates are not source code with parseable frontmatter; git workflow unchanged).

## Definition of Done

- [x] Code changes are within the plan's scope (no scope creep) → **unchecked**: see Blocking 3 (architect.md tweak + `.gitignore` cleanup absorbed)
- [x] Plan's "Stack expectations touched" rules respected; stack-spec tests pass
- [x] Product Contract (if any) honored; Acceptance checks pass; no silent behavior change → **N/A** (chicken-and-egg, see below); recording as "no Product Contract touched"
- [x] Tests run; pipeline (test + lint + validators) green → `bash tests/hooks.sh` → 44/44 PASS
- [ ] `.ai-pm/state/current.md` updated; Done / Remaining / Next step current → **N/A** (template repo has no `.ai-pm/state/current.md`; meta-case, see below)
- [x] Coder's Product Impact Report present (when contract touched) → **N/A** (no contract touched; meta-case)
- [ ] Docs updates listed in plan are landed in this branch → **unchecked**: README flow diagram + WORKFLOW.md notes-routing update not landed (see Blocking 2 and Note tech 1)

**DoD: fail** (scope respected = no; docs landed = no; verdict must be `request-changes` per the rule the very PR introduces).

## Blocking

1. `README.md:80` — section header reads `## Что шаблон снижает риск`. The clause is grammatically broken in Russian — `шаблон` becomes the subject, `снижает риск` lacks a subject argument; the intended reading "What reduces risk" cannot be recovered. **Why it matters:** the README is the user's first impression of the template; a broken-grammar header undermines the very claim ("honest framing") the rewording was supposed to deliver. **Fix:** rename to `## Что снижает риск` (as the orchestrator brief specifies) or `## Какие риски шаблон снижает`. One-line edit.

2. `README.md:9–36` — the "Новая фича" flow diagram still describes `Reviewer-агент проверяет по 10 измерениям` (now 11) and has no node for contract draft between the plan step and the coder step. Plan's "Docs to update" explicitly required "flow diagram update to show contract creation between plan and code". **Why it matters:** the diagram is the canonical at-a-glance description of the protocol that the README sells. Leaving it at "10 dimensions" silently contradicts the new dim 11 introduced one section below in the same README, and PMs reading the diagram will not see the contract step that this PR is built around. **Fix:** add an arrow between the plan-fixing step and the coder step labelled "Если фича пользовательская — оформляем Product Contract"; change "10 измерениям" to "11 измерениям".

3. Scope creep — two items declared Out of scope by the plan were silently included:
   - `.claude/agents/architect.md:17` — `design-review` → `architecture review`. Plan's "Modified agent personas" line for architect: "no changes (read-only)". The change is cosmetically correct (the audit doc identified it as a stale reference), but absorbing it here violates the plan-as-contract rule that this very PR strengthens.
   - `.gitignore` — full rewrite "drop stale trace artefacts". Plan's "Out of scope for this PR but planned separately" item: "`.gitignore` cleanup (audit-fixup #23) — small separate PR." The chore commit message explicitly states "Closes audit-fixup #23 in-line (no separate PR needed)" — that is a unilateral plan revision by the implementer.
   
   **Why it matters:** the new Definition of Done rule item 1 is "Code changes are within the plan's scope (no scope creep)". The first feature merged under that rule is itself in scope-creep. **Fix:** either (a) revert both edits and land them as the planned separate PRs `audit-fixup-self-gitignore-cleanup` and a tiny architect-design-review fix; or (b) update the plan in-place — add an "Out of scope removed" line under "Key design decisions" with rationale, then re-commit. Option (a) keeps the categorical discipline; option (b) records the revision honestly. Either is acceptable, but a silent merge is not.

4. `.claude/agents/auditor.md:3, 7, 31` and `WORKFLOW.md:13` — three header / introductory statements still claim "10 dimensions" / "10 audit dimensions" / "the 10 dimensions". Body of `auditor.md` adds dimension 11. **Why it matters:** the auditor persona is internally self-contradicting — description, intro, and "Apply the 10 dimensions" step say 10; the catalog at the bottom has 11. A future audit run will print "10 dimensions" in its summary while applying 11, or skip dim 11 because the step says "Apply the 10 dimensions". `WORKFLOW.md` references the same wrong count in the agent table. **Fix:** change "10" → "11" in `auditor.md:3` (description frontmatter), `auditor.md:7` (intro), `auditor.md:31` (step 3), and `WORKFLOW.md:13` (agent table). Trivial textual edit; should land in this PR alongside the dim-11 body it documents.

## Notes (product)

1. README guarantees section — the new bullet "Завершённость задачи объективна — реже субъективна" is a great way to phrase the DoD value, but the sub-claim "Pass без всех галок — противоречие, и verdict должен быть request-changes даже без Blocking" exposes an internal protocol rule that PMs do not need to know. **Why it matters:** the README is product-facing; this kind of meta-rule belongs in `WORKFLOW.md` or `doc/architecture.md`, not the user-facing intro. Routing for PM: keep as-is, soften, or move? PM decision.

2. `.ai-pm/contracts/<feature>.md` docs-extractor mapping — the plan said one contract per discovered user-facing journey, but `docs-extractor.md` does not put a budget on this (a project with 30 journeys would get 30 stub contracts on bootstrap, each carrying `(needs PM validation)`). **Why it matters:** PM-validation load on legacy adoption could become a wall-of-stubs problem. Worth a "PM picks the top N" gate or similar; not blocking, but a foreseeable friction point.

## Notes (technical)

1. `WORKFLOW.md` "How state is kept" section landed, but the plan's other line ("updated notes-routing section to mention Product Impact Report") did not. **Why it matters:** the orchestrator flow on lines 105–110 splits notes into product / technical but does not mention that the coder also produces a Product Impact Report (a separate artefact that lives in the coder's closing report, not in the reviewer's verdict). When orchestrator splits notes for the PM, the Impact Report is the missing third channel ("here's what user-visible changed"). **Routing:** respawn `coder` (orchestrator) with a one-line append to the notes-routing paragraph mentioning where the Product Impact Report fits.

2. `.claude/commands/plan-feature.md:185–193` — "Draft `.ai-pm/contracts/<feature>.md` from the template" does not name the template file path. `docs-extractor.md:87` correctly names `.ai-pm/tooling/doc/_templates/contract.md.tmpl`. **Why it matters:** minor inconsistency — the plan-feature step relies on the orchestrator finding the template by name. **Routing:** respawn `plan-feature.md` editor (orchestrator) to add the explicit path; trivial.

3. `doc/_templates/state.md.tmpl:14` — `Status` enum is listed inline (`planning | coding | reviewing | fixing | pr-prep | blocked | done`). `idle` is referenced in bootstrap.md as the initial state but is not in the template's enum. **Why it matters:** when a coder later reads the template and validates the enum, `idle` will look invalid; bootstrap will write a value the artefact's own how-to does not list. **Routing:** respawn `coder` to add `idle` to the enum line.

4. `doc/_templates/contract.md.tmpl` — `Last reviewed` line uses `(extracted from legacy code — needs PM validation)` marker only in the docs-extractor mapping table, not in the template. **Why it matters:** if a future agent fills the contract field without docs-extractor context, the marker will not appear and the PM-validation expectation is lost. **Routing:** orchestrator can leave this as documented elsewhere; cosmetic. `drop on merge: covered by docs-extractor.md text`.

## Chicken-and-egg observations (meta-case)

This PR introduces the rules that grade it. Three explicit chicken-and-egg points:

1. **State updated** check (DoD item 5) is N/A because this template repo, by architectural design, does not host `.ai-pm/state/current.md` — `doc/architecture.md` says state files live "in downstream projects only". Applying the rule to its introducing PR yields "no state file exists, cannot be updated", which is correct. The DoD checklist could spell this case out explicitly ("N/A when reviewing the template itself") — see Note product 1.

2. **Product Contract honored** check (DoD item 3) is N/A because there is no pre-existing Product Contract for "the protocol" itself to honor. The Out of scope item "PM remains product-only" in plan §1 means the protocol does not get a contract about itself. Consistent with the design choice "backend-only changes skip dim 11" — this PR is "infra of the protocol", contract-less.

3. **Coder's Product Impact Report** check (DoD item 6) is N/A for the same reason. The reviewer-format text honestly handles this with "(when contract touched)".

The actual rule the new format introduces *does* bite this PR — DoD item 1 (scope creep) and item 7 (docs landed) both fail (see Blocking 2, 3 and the Plan compliance miss on flow diagram + notes-routing). The protocol catches its introducing PR's own deviations. The dogfooding holds.

## Verdict

request-changes

This PR ships the new state and contracts machinery (templates + persona changes + bootstrap + plan-feature) and the new Definition of Done reviewer section — the structural parts are sound and the chicken-and-egg meta-cases are handled honestly. The reason for request-changes is two scope absorptions the plan explicitly listed as separate PRs (architect.md tweak + `.gitignore` cleanup), one missed plan deliverable (README flow diagram not updated for the dim-11 / contract step), and internal contradictions (auditor still says "10 dimensions" while applying 11, README header is grammatically broken). All fixable with small in-branch edits or a clean revert; once those land, the PR meets its own new Definition of Done.
