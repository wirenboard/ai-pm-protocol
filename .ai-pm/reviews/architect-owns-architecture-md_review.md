## Plan compliance

- ✓ Scenario 1 (greenfield bootstrap spawns architect for canonical architecture.md) — `.claude/commands/bootstrap.md:67` adds explicit "Spawn `architect` (Section A — canonical architecture.md)" step after stack-researcher returns. The old inline line "reflect Integration contracts in architecture.md" is removed from the greenfield path (now architect's job).
- ✓ Scenario 2 (audit-fixup style work, no extended-prompt workaround) — `.claude/agents/architect.md:17-20` "When you are invoked" lists three triggers for canonical mode, including "Audit-fixup that requires writing or refreshing canonical architecture.md". Section A (steps A1–A6) gives the full canonical workflow inside the persona itself; no extended prompt needed.
- ✓ Scenario 3 (per-feature arch notes unchanged) — Section B (`.claude/agents/architect.md:53-78`) preserves the existing per-feature flow verbatim: read plan, find 2-3 adjacent implementations, map ownership, propose 1-2 variants, recommend one. Output template at lines 82-111 is unchanged. Project-root boundary, no-cross-repo search, and feedback-loop mapping all preserved.

Persona internal consistency:
- Frontmatter description (line 3) accurately covers both responsibilities and write paths.
- "When you are invoked" splits cleanly into canonical and per-feature triggers (lines 17-25).
- "What to do" router at line 33 dispatches to Section A or Section B by trigger.
- Hard rules (lines 113-122) explicitly limit allowed writes to `docs/architecture.md` and `docs/features/<topic>_arch.md`. Section A explicitly forbids stack-notes duplication (line 121) and inventing components not in the project (line 122).

Categorical scope:
- Diff does not silently extend architect to siblings. References to `stack-notes.md` in architect.md are reads / cross-references / a no-duplication rule, not ownership claims. `user-journeys.md`, `ui-guide.md`, `threat-model.md` are not mentioned in architect.md at all.
- WORKFLOW.md sibling ownership rows (`stack-researcher` owns stack-notes, `docs-extractor` writes user-journeys, etc.) are untouched.

## Definition of Done
- [x] Code changes are within the plan's scope (no scope creep) — three files touched, all listed in plan's "Docs to update".
- [x] Plan's "Stack expectations touched" rules respected — plan declared "None" (pure persona text edit). Verified: no stack components touched.
- [x] Product Contract (if any) honored — N/A, meta-case (template self-documentation, no user-facing feature).
- [x] Tests run; pipeline (test + lint + validators) green — `bash tests/hooks.sh` returns 44/44 PASS.
- [x] `.ai-pm/state/current.md` updated — N/A, meta-case (template repo has no `.ai-pm/state/` of its own).
- [x] Coder's Product Impact Report present (when contract touched) — N/A, no contract touched.
- [x] Docs updates listed in plan are landed — architect.md, bootstrap.md, WORKFLOW.md all updated per plan.

**DoD: pass**

## Blocking

None.

## Notes (product)

1. `bootstrap.md:149` — In the legacy full-mode flow, the orchestrator still reflects "Integration contracts" into `architecture.md` after `docs-extractor` produced it, instead of spawning architect. The plan explicitly carves this out ("Bootstrap full-mode flow — docs-extractor already handles legacy architecture.md" is Out of scope), so this is not a blocker — but the asymmetry between greenfield (architect-owned) and legacy-full (docs-extractor + orchestrator inline) is now load-bearing. Worth a follow-up plan to either route legacy-full through architect for the integration-contract section, or document why orchestrator inline edits are acceptable here.

## Notes (technical)

1. `architect.md:31` — Step 0 (Establish the project root) appears before the Section A / Section B dispatch (line 33), so it correctly applies to both modes. No action needed — confirms structure is sound. Routing: drop on merge (no fix required).

## Verdict

approve

This PR extends the architect role to also own the project's main architecture document — at greenfield bootstrap, during audit-fixup work, and when an architectural decision lands. The per-feature flow (architect surfacing variants for where new code should live) is preserved unchanged. Greenfield bootstrap now spawns architect to write the architecture document instead of the orchestrator filling it inline.
