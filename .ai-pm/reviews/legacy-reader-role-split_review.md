# legacy-reader-role-split — plan-compliance review (Pass 1)

Protocol-spec / agent-prompt feature. No runtime, no executable tests by design (repo
"no automated tests by design" constraint; `doc/architecture.md` § Architectural constraints).
Verification is editorial — the `pm-product-advocate` / `review-stamp-gate` precedent. The
load-bearing check is reference-completeness (`grep`), not test presence.

## Plan compliance

- ✓ **Scenario 1 — `pm-architect` owns `docs/user-journeys.md`.** Ownership moved at every site:
  `pm-plan.md:45` gap-fill (`pm-architect` for `architecture.md` **or `user-journeys.md`**),
  `pm-plan.md:58` Docs-to-update handoff (all three docs → `pm-architect`), `WORKFLOW.md` roster
  row, edit-ownership agent-owned-artefact list (`pm-architect` — including `docs/user-journeys.md`)
  and Step-4 handoff, `pm-audit.md:83` stale-journeys remediation (→ `pm-architect`), `pm-coder.md:50`
  doc-ownership list. None of these still routes journeys to the reader.
- ✓ **Scenario 2 — `pm-codebase-reader` is a pure existing-codebase raw-drafter.** Description +
  body narrowed; spawned only at `/pm-bootstrap` legacy-full and bootstrap-validation code re-reads;
  still drafts `architecture.md` + `user-journeys.md`, each finalized by `pm-architect`.
- ✓ **Scenario 3 — Bootstrap legacy-full finalizes the journeys draft too.** `pm-bootstrap.md`
  finalize spawn now says finalize `docs/architecture.md` **and `docs/user-journeys.md`**;
  `pm-architect.md` legacy-finalization sub-section + the new user-journeys sub-section carry the
  same drafts-vs-owns rule (draft is source of truth).
- ✓ **Scenario 4 — Every agent reference consistent under the rename.** Live-surface grep
  (`grep -rn "pm-legacy-reader" .claude/ WORKFLOW.md doc/architecture.md
  doc/protocol-vs-builtins-analysis.md README.md MIGRATIONS.md` + `.ai-pm/backlog.md`) = **zero hits**.
  Agent file is `.claude/agents/pm-codebase-reader.md` with frontmatter `name: pm-codebase-reader`;
  old file gone. Both `subagent_type` token sites in `.claude/` read `"pm-codebase-reader"`; no
  dangling spawn. Roster (README, pm-plan, pm-bootstrap, pm-audit, WORKFLOW), analysis table, and
  architecture decision all describe the renamed, narrowed agent.
- ✓ **Scenario 5 — Journeys format discipline preserved.** `pm-architect.md` new user-journeys
  sub-section carries the human-language step rule + identifiers-referenced (move-not-copy to
  `## Behavioral contract`) rule — the rule the template and former owner carried.
- ✓ **Scenario 6 — Downstream unaffected, no migration.** No `MIGRATIONS.md` entry, no
  `.claude/settings.json` change in the diff (verified by name-only diff). The agent is named only
  via `subagent_type` in submodule command files; reference-completeness holds → submodule bump
  propagates the rename transparently.

Two-commit convention: ✓ commit `7e63ab1` is a pure rename (`git mv`, similarity 99%, only the
frontmatter `name:` line changed); `462d61a` carries the references + scope edits; `9dfe957` is the
post-coding `pm-architect` architecture.md decision.

`doc/architecture.md`: ✓ rename applied at § Project agent list (line 11), § File layout (module
map, line 181), and the read-only-subagents decision heading + body (lines 56-58) now records the
rename + journeys-ownership consolidation, framed as completing the existing drafts-vs-owns pattern.
All 4 former `pm-legacy-reader` hits cleared.

Historical artifacts: ✓ not rewritten. `CHANGELOG.md`, past `doc/features/*_plan.md`,
`.ai-pm/reviews|arch|audits/*` retain the old name and were not touched by the diff. The only
`.ai-pm/state/archive/` file in the diff (`pm-product-advocate-2026-06-04.md`) is a newly **added**
prior-feature snapshot — it mentions neither agent name and is not a history rewrite.

Categorical coverage: ✓ the two roles are the full set — Role 1 (legacy-code/raw-draft reading)
stays with the reader, Role 2 (journeys ownership) → `pm-architect`. Siblings (`architecture.md` /
`threat-model.md` ownership) are already with `pm-architect` and correctly out of scope.

## Definition of Done

- [x] All plan scenarios implemented and tested — implemented; "tested" satisfied editorially
  (no executable tests by design; reference-completeness grep is the load-bearing check, passes)
- [x] Interaction scenarios have concurrent-state tests — N/A: no runtime, no shared mutable state,
  no concurrency (plan's Interaction-scenarios section is reference-consistency only, all verified)
- [x] Stack expectations respected; stack-spec tests pass — N/A: plan declares "Stack expectations
  touched: None"; no `docs/stack-notes.md` component touched, no frontmatter structural change
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change — N/A: this repo
  has no user-facing Product Contracts (the documented exception); change is protocol-internal
- [x] Pipeline green — `bash tests/hooks.sh` = 71/71 passed; no hook touched, `.claude/settings.json`
  unchanged
- [x] State file updated — `.ai-pm/state/current.md` reflects this feature (two-commit record,
  reference-completeness note, remaining post-coding handoff now landed)
- [x] Product Impact Report present (when contract touched) — N/A: no contract touched
- [x] Docs updates landed — all plan "Docs to update" sites (A rename, B references, C scope edits,
  D architecture decision) are present in this branch
- [x] Expected artifacts exist — plan (`doc/features/legacy-reader-role-split_plan.md`) and this
  review present; no contract expected (not user-facing, repo exception)
- [n/a] Product-readiness gate resolved — **exempt.** This feature's scenario subjects are
  non-human (agents / the orchestrator / the bootstrap process); the human-role-subject extraction
  yields no human role, so the user-facing gate does not apply (the plan declares this exemption
  explicitly, the `pm-product-advocate` / `bootstrap-populated-journeys` precedent). No advocate
  artifact required.

**DoD: pass**

## Blocking

None.

## Notes (product)

None. The change is a pure internal-ownership / rename refactor with no user-visible surface and no
scope expansion beyond the plan; the parked `bootstrap-populated-journeys` plan and backlog
downstream-isolation note committed alongside are in-scope per the plan (Context + Out of scope).

## Verdict

approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See WORKFLOW.md "Edit-ownership rule" — the Pass-2 code-review trail is the single
     carve-out to "orchestrator does not edit content artefacts". -->
## Code review findings

Pass 2 (`code-review`, high effort, prose-protocol adaptation: 2 targeted finders —
ownership-consistency/contradiction + architect↔reader boundary coherence). **Both finders
returned zero defects.** Verified: no residual reader-owns-journeys claim on the live surface;
no double/ambiguous owner; the journeys move-not-copy format rule travelled to `pm-architect`;
`pm-codebase-reader` narrowed coherently (raw-drafter + bootstrap-validation code re-read only);
every journeys trigger (per-feature update, gap-fill, stale remediation, bootstrap-legacy
finalize) routes to `pm-architect` with matching responsibility text (no orphaned trigger); the
bootstrap legacy-full finalize handoff names the journeys draft in both `pm-bootstrap.md` and
`pm-architect.md`; roster/count/name coherent across WORKFLOW.md, architecture.md, README.md.
No findings — nothing to fix.

## Code review: 2026-06-04 — passed
<!-- The orchestrator replaces THIS WHOLE LINE with `## Code review: <date> — passed`
     only when code-review clears. Until then the section is UNSTAMPED: `pm-pr-prep`
     refuses to release it (step 0) and `pm-auditor` blocks on it (dimension 1).
     Never ship an empty `## Code review` heading — an empty section reads as
     "no findings / passed" to a quick eye or grep; `NOT YET RUN` reads as "not done". -->
