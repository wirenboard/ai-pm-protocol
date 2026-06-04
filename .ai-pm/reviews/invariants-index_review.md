# invariants-index — Pass-1 plan compliance

## Plan compliance

- ✓ **Sc1 — Behavioral contract carries a System-invariants index.** `doc/_templates/architecture.md.tmpl:81-96` adds a `### System invariants` subsection *inside* `## Behavioral contract (taxonomies & invariants)`. Index role defined (inline / `SCn` by ID / journey by name), reference-don't-duplicate, `N/A — <reason>` guidance present, plus a worked index example. Existing taxonomy/format content above is byte-unchanged (template diff is a pure addition — zero deletions).
- ✓ **Sc2 — `SCn`-enforced invariants indexed by ID, never moved.** Index example references `SC5` by ID with a human hint + "see `## Security constraints`"; no `SCn` rule text added anywhere. The threat→constraint Mitigation pattern is mirrored ("never copy the rule text down here").
- ✓ **Sc3 — `pm-architect` authors/maintains the index.** `pm-architect.md` A2 (line 62) appends "Build its `### System invariants` index by reference" — index `SCn` by ID, journey by name, inline only for Behavioral-contract-native invariants; never restate; `N/A` when none; never invent. Same one-way reference-don't-duplicate discipline.
- ✓ **Sc3a — index NOT added to A4 cross-check set.** `pm-architect.md` A4 (line 66) still lists exactly the three pairings (File layout ↔ tree, Release flow ↔ CI, Integration contract ↔ README); the index explicitly inherits the Behavioral-contract exclusion and is "not added to the cross-check set."
- ✓ **Sc4 — auditor notes scattered-but-unindexed invariants (conditional).** `pm-auditor.md` dimension 5 gains a check sibling to the threat↔constraint wiring check. Firing condition gated on invariant-bearing homes (**≥1 `SCn`** AND/OR **≥1 journey `**Invariants:**` block**), NOT on security-bearing; silent when neither home. Two notes: no-index, and dangling `SCn`. Remediation = spawn `pm-architect`.
- ✓ **Sc5 — structural / shape-not-meaning, never prose-policing.** Auditor check states "Structural / shape-not-meaning only … never judge whether a statement 'is really an invariant' … same no-prose-policing discipline as the threat ↔ constraint ID-match check beside it." Marked **Note, never blocking.**
- ✓ **Sc6 — additive and back-compat.** No `MIGRATIONS.md`, `CLAUDE.md`/`CLAUDE.md.tmpl`, `docs|doc/user-journeys.md`, or hook change (clean-grep: none). No new required field; project with no invariant homes sees nothing change.

### Existing behaviors this feature touches
- ✓ Behavioral contract section role/format preserved (additive subsection, content above byte-unchanged).
- ✓ `SCn` scheme + threat→constraint-by-ID wiring untouched — `pm-architect.md:120` wiring text confirmed byte-unchanged (not in diff; appears in file only because A2 at line 62 was edited). `pm-auditor.md` is a pure addition — the existing threat↔constraint check has zero deletions.
- ✓ A4 cross-check set stays the three pairings (Sc3a).
- ✓ `docs/user-journeys.md` move-not-copy unchanged (file untouched; index points *to* journeys).
- ✓ No-prose-policing rule preserved (Sc5).
- ✓ Proportionality — presence-conditional auditor check; this template repo's own `doc/` (no `SCn`, no journey `**Invariants:**`) triggers nothing.

### Test-plan verification items
- ✓ Editorial walkthrough — index additive, taxonomy/`SCn` content unchanged, references by ID/name not restated.
- ✓ Clean-grep no-relocation/no-duplication — no `SCn` rule text moved out of `## Security constraints` or duplicated into the index; wiring text byte-unchanged.
- ✓ Clean-grep A4 untouched — exactly three pairings; Behavioral contract + index excluded.
- ✓ Clean-grep auditor conditionality — fires only on `SCn` and/or `**Invariants:**` homes; structural/shape-not-meaning; note never blocking; sits beside threat↔constraint check.
- ✓ Proportionality — no-home project triggers nothing.
- ✓ `bash tests/hooks.sh` → **71/71 passed**.

## Definition of Done
- [x] All plan scenarios implemented and tested (editorial + clean-grep per repo discipline)
- [x] Interaction scenarios have concurrent-state tests — n/a: plan declares Provably isolated (prose-spec, no runtime/shared state/concurrency/I/O)
- [x] Stack expectations respected; stack-spec tests pass — n/a: no stack component touched
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change — **n/a (software-kind, non-user-facing): every scenario subject is the architecture doc / index / pm-architect / pm-auditor; no Product Contract touched**
- [x] Pipeline green — `tests/hooks.sh` 71/71
- [x] State file updated — `.ai-pm/state/current.md` reflects `invariants-index` active task
- [x] Product Impact Report present (when contract touched) — n/a: no contract touched
- [x] Docs updates landed — all four plan "Docs to update" files present in branch (template, pm-architect, pm-auditor, doc/architecture.md decision record)
- [x] Expected artifacts exist — plan, this review; contract n/a (non-user-facing)
- [n/a] Product-readiness gate resolved — **n/a: non-user-facing (all scenario subjects are non-human: doc/index/pm-architect/pm-auditor); no advocate artifact required**
- [n/a] Validation gate resolved — **n/a: software-kind project (Pass-2 is `code-review`, not `## Validation`)**

**DoD: pass**

## Blocking
None.

## Notes (product)
None. Scope matches the plan exactly (one EPIC slice; siblings explicitly deferred under Out of scope). No wire-token structural notes: the diff introduces no contract PM-facing section, and `SCn` / `**Invariants:**` appear only in architecture-doc and agent-spec prose (the protocol's own architecture vocabulary), not in a `## User value` / `## Out of scope` contract section.

## Verdict
approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See WORKFLOW.md "Edit-ownership rule" — the Pass-2 code-review trail is the single
     carve-out to "orchestrator does not edit content artefacts". -->
## Code review findings
(populated by orchestrator from code-review output; pm-coder reads and fixes these)

## Code review: NOT YET RUN
<!-- The orchestrator replaces THIS WHOLE LINE with `## Code review: <date> — passed`
     only when code-review clears. Until then the section is UNSTAMPED: `pm-pr-prep`
     refuses to release it (step 0) and `pm-auditor` blocks on it (dimension 1).
     Never ship an empty `## Code review` heading — an empty section reads as
     "no findings / passed" to a quick eye or grep; `NOT YET RUN` reads as "not done". -->
