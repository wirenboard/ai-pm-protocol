# state-model-section — plan-compliance review

Branch `feature/state-model-section`. Plan `doc/features/state-model-section_plan.md`; arch note `.ai-pm/arch/state-model-section_arch.md`. Diff vs `main`: `.claude/commands/pm-plan.md`, `doc/_templates/architecture.md.tmpl`, `.claude/agents/pm-architect.md`, `doc/architecture.md`, `.ai-pm/state/current.md`.

Prose-spec meta-feature on the template repo: **software-kind** (no `## Project kind:` line in `CLAUDE.md` ⇒ software), **no `docs/threat-model.md`** (non-security project — Security-surface plan-completeness rule does not fire). Every scenario subject is `/pm-plan` / the planner / `pm-architect` / the architecture doc (non-human) → **not user-facing**: no Product Contract, no product-readiness advocate gate, no `## Validation` gate. **No Product Contract touched.** Verification is editorial + clean-grep; `tests/hooks.sh` 71/71 (no hook touched).

## Plan completeness (pre-compliance gate)
- ✓ No stack-notes component touched (prose-spec, no runtime) → no "Stack expectations touched" section required.
- ✓ "Interaction scenarios" present with explicit `Provably isolated:` declaration (no runtime, no shared state, no I/O).
- ✓ Non-security project (no `docs/threat-model.md`) → threat-model "Docs to update" rule does not fire.
- ✓ Not a `hotfix-` topic → no "Incident facts" required.
- ✓ Categorical coverage: "state model" is the named EPIC sub-class; sibling whole-system gaps each listed under Out of scope with a one-line reason (temporal-status conflation, ADR ↔ stack-notes, state-machine ↔ journeys single-diagram, journeys ↔ threat-model UX, other NFR classes).

## Plan compliance
- ✓ Scenario 1 (State-model check fires on a state-machine/protocol-bearing core) — `.claude/commands/pm-plan.md` new "## State-model check (conditional, judgment-triggered)" after the NFR/operational-limits check; concrete trigger list (status ladder w/ transitions; named-state lifecycle + events; wire/connection protocol). Verified editorial + clean-grep.
- ✓ Scenario 2 (non-state-bearing → silent, proportional, no hook, never blanket-mandatory) — "silent otherwise", "the check is **silent**", "proportional, never blanket-mandatory", "there is **no hook**" all present in pm-plan.md.
- ✓ Scenario 3 (model lands in conditional `docs/architecture.md ## State model`, by reference) — template section added at `architecture.md.tmpl` immediately after `## Behavioral contract` + its `### System invariants` sub-block, before `## Release flow`; born `N/A — <reason>`; states×transitions table + triggers/debounce list; references the Behavioral-contract enum + existing prose; `[?]`-not-invented present. pm-plan routes the model to the section by name, never re-encodes it.
- ✓ Scenario 4 (already-captured guard) — "stay **silent** on the already-modeled states and fire only for a feature that introduces a *new* state / transition / trigger" present in pm-plan.md (inherited from the NFR system-budget guard).
- ✓ Scenario 5 (structural/proportional, additive, no migration, no hard gate) — "no hard gate this slice" present; no `MIGRATIONS.md`/`CLAUDE.md`/hook change in the diff; the new template section is conditional and born `N/A`.

### Column-level drift-bound (verified in all three loci)
- ✓ `pm-plan.md` — "Reference the enum, add the edges, never re-declare a state"; "Its own new datum is the **transitions** and their triggers".
- ✓ `architecture.md.tmpl` — "Reference the enum, add the edges, never re-declare or re-mean a state here"; "status enum **owns the value set**"; "table's **own new datum is the transitions** and their triggers".
- ✓ `pm-architect.md` (A2 section guidance) — "Reference the enum, add the edges, never re-declare or re-mean a state here"; "status enum **owns the state value set**"; "own new datum is the **transitions** and their triggers".

### A4-EXCLUSION (A2-walked, A4-excluded)
- ✓ `## State model` added to the A2 walk-list (between `Behavioral contract` and `Release flow`) and to the greenfield invocation list.
- ✓ A4 cross-check set stays **exactly three pairings** (File layout ↔ tree, Release flow ↔ CI, Integration contract ↔ README); `State model` added to the explicit "Do not add … to the cross-check set" exclusion, beside the Behavioral-contract / System-invariants index / Operational-limits exclusions. A2-walked but explicitly "**not** added to the cross-check set".

### Detection trigger
- ✓ Concrete state-machine/protocol list (status ladder w/ transitions; named-state lifecycle + triggering events; wire/connection protocol states) — **not** "any status field". Explicit guard "A **status enum alone does not trigger it**" present.

### Placement
- ✓ Template: `## State model` immediately after `## Behavioral contract (taxonomies & invariants)` + its `### System invariants` sub-block, before `## Release flow`.
- ✓ This repo's own `doc/architecture.md`: `## State model` carries `N/A — <reason>` (the tooling is not a state machine), sits among the conditional engineering sections (after `## Operational limits & budgets`, before `## File layout`) — consistent with the template's relative order (this repo has no top-level `## Behavioral contract` section, only the template defines it).

### Source / selection-citation backstop
- ✓ Plan `Source:` line declares `selected autonomously per ### Decision authority` and carries a `source:` token (`.ai-pm/backlog.md` "From downstream artifact review — 2026-06-04" + `.ai-pm/state/current.md` queue). Selection-citation backstop passes (presence-keyed; meaning is the PM's at plan review).

## Interaction scenario coverage
- ✓ `Provably isolated:` declared — no concurrent-state test required. Cross-artifact coupling is read/written sequentially within a single planning pass, covered by Scenarios 1–5 + clean-grep.

## Definition of Done
- [x] All plan scenarios implemented and tested (editorial + clean-grep, repo's "no automated tests by design" discipline; Scenarios 1–5 all verified)
- [x] Interaction scenarios have concurrent-state tests (n/a — provably isolated)
- [x] Stack expectations respected; stack-spec tests pass (n/a — no stack component touched)
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change (n/a — no Product Contract touched; non-user-facing meta-feature)
- [x] Pipeline green (`tests/hooks.sh` 71/71)
- [x] State file updated (`.ai-pm/state/current.md` reflects coding-done + remaining handoff)
- [x] Product Impact Report present (n/a — no contract touched)
- [x] Docs updates landed (all four "Docs to update" entries present in this branch: pm-plan.md check, template section, pm-architect A2/A4 wiring, architecture.md decision record + repo's own `N/A` section)
- [x] Expected artifacts exist (plan ✓, this review ✓, contract n/a — not user-facing)
- [n/a] Product-readiness gate resolved (non-user-facing — every scenario subject is the system/agent/template; no advocate artifact required)
- [n/a] Validation gate (software-kind — no `## Validation` section; Pass-2 is `code-review`)

**DoD: pass**

## Blocking
None.

## Notes (product)
None. Scope matches the plan exactly (the four declared "Docs to update" loci, no expansion); siblings correctly deferred to later EPIC slices.

## Verdict
approve

## Code review findings
Prose-spec diff. Focused fan-out (spec-consistency + cross-doc-coherence). Two real findings (both about the very drift-bound this slice introduces), routed through owners:

**For pm-coder (`doc/_templates/architecture.md.tmpl`):**
1. **The worked `## State model` EXAMPLE re-declares states absent from the example Behavioral-contract enum — it demonstrates the exact drift the column-level drift-bound forbids.** The example caption says states are "referenced from the `## Behavioral contract` enum above," but that enum is `pending`/`active`/`done`/`failed` while the example State-model table introduces `pairing`/`paired`/`lost` (three states the enum never lists). The most-copied artifact teaches the opposite of the rule. **Fix:** rewrite the example table's State column to use ONLY the example enum's values (`pending`/`active`/`done`/`failed`), with illustrative transitions + triggers as the new datum — so the canonical example itself obeys "reference the enum, add the edges, never re-declare a state."

**For pm-architect (`doc/architecture.md`):**
2. **The repo's own `## State model` N/A note makes a false placement claim.** It says the section is placed "after `## Behavioral contract`" — but this repo's `doc/architecture.md` has NO `## Behavioral contract` section; the section actually sits after `## Operational limits & budgets`. **Fix:** reword the N/A note to ground its placement to an anchor that exists here (as the `## Operational limits & budgets` N/A note already does — "among the conditional engineering sections / sibling to `## Architectural constraints`"), dropping the template-relative "after `## Behavioral contract`" claim for this doc. (The section's clustered placement among the conditional N/A sections is fine — only the note's claim is wrong. No need to move it.)

Verified clean: the A4 cross-check set stays exactly the three pairings + `## State model` in the exclusion; the column-level drift-bound wording is consistent across pm-plan.md / architecture.md.tmpl / pm-architect.md; the trigger is a concrete state-machine/protocol list with "status enum alone is NOT the trigger"; no-hook / proportional / `[?]`-not-invented / no-hard-gate / already-captured guard present; section name byte-identical across files; cited commit hashes valid; EPIC name consistent ("cross-document-consistency auditor", slice 4); deferred journeys-single-diagram boundary clean.

## Code review: 2026-06-04 — passed

Both findings fixed in-pass, routed through owners (edit-ownership): finding 1 by pm-coder (`812f7c8` — the worked `## State model` example table rewritten to enum-consistent states `pending`/`active`/`done`/`failed`, so the canonical example obeys its own column-level drift-bound); finding 2 by pm-architect (`43e12f2` — the repo's own `## State model` N/A note re-grounded to an existing anchor, false "after `## Behavioral contract`" claim dropped, template-relative fact kept only as a parenthetical about the template). `tests/hooks.sh` 71/71 after fixes.
