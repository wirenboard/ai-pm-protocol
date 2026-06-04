# review-typology-framework — plan-compliance review

EPIC review-typology slice 1. Branch `feature/review-typology-epic`, 5 commits ahead of `origin/main` (research / plan / plan+arch / feat / arch-decision-record). Software-kind, non-user-facing meta-feature.

## Plan-completeness checks (pre-compliance)
- ✓ "Stack expectations touched" present (plan §50–55) — git + Claude Code hooks API, both with source URLs. Feature touches `doc/stack-notes.md` components → section required and present.
- ✓ "Interaction scenarios" section present with a `Provably isolated:` declaration (plan §57–59) — prose-spec + a marker the orchestrator reads/writes in one sequential audit pass; no shared mutable state.
- ✓ Not a `hotfix-` topic; not security-bearing (no `doc/threat-model.md` / `docs/threat-model.md`) → the threat-model "Docs to update" block never fires.
- ✓ Categorical coverage — the registry's chosen set (the five review TYPES) is covered in full: 2 built (per-diff, smell/hygiene), 3 registered as "later slice — not built" (architectural, functional/integration, criticality-prioritization), each with a one-line Out-of-scope reason (plan §85–93). No sibling type silently implemented.

## Plan compliance — Scenarios 1–9
- ✓ **S1 — review-typology registry (single-sourced).** `### Review typology` added to `WORKFLOW.md` (lines 323–340) as a sibling to `### Decision authority` / `### Project kind`; names the 5 types each with cadence · depth · scope · deterministic-half · AI-half. Consumers reference by name; enum/cadence lives once. Verified by clean-grep (below).
- ✓ **S2 — smell/hygiene type, run from `/pm-audit`.** `## Technical quality` strengthened into "the smell / hygiene sweep" (`pm-audit.md` line 114), referencing `### Review typology` by name, running the `code-review` skill over the proportional scope; detection-half named as future/not-run-here, AI prioritization/root-cause half is the sweep.
- ✓ **S3 — proportional new-code gating.** `pm-audit.md` step 1 (lines 116–123): `## Quality sweep: <date> — swept <sha>..HEAD at depth <d>` marker line in the existing `audit-*.md` report, NO new file; scopes `git diff <sha>..HEAD` + never-swept + periodic full; reuses the auditor's "first run = full" fallback verbatim; "latest `audit-*.md` containing a `## Quality sweep` line" reader rule stated.
- ✓ **S4 — selectable depth (no hard-wired ultra).** `pm-audit.md` step 3 (lines 126–131): low/medium/high/max/ultra selectable; interactive presents cost/depth trade-off; autonomous picks a proportionate depth and announces, never silently the costliest. The old hard-wired `code-review ultra` offer is gone (diff removes the three `ultra`-offer lines).
- ✓ **S5 — findings triaged.** `pm-audit.md` step 4 (line 132): findings run through the existing fix-now / next-sprint / accept-with-context loop; accepts marked `accepted (quality-sweep-<date>): <reason>`, mirroring `accepted (auditor-<date>)`; fix-now spawns the normal `/pm-plan` path, never auto-edits.
- ✓ **S6 — autonomous procedural gate, proportionally bounded.** `pm-audit.md` step 5 (line 134): procedural checkpoint per `### Decision authority`, bounded by the step-2 proportionality gate (runs only on un-swept/changed surface, never a full-tree ultra sweep every audit); interactive yes/no preserved; merge/ship stays manual.
- ✓ **S7 — det-vs-AI split, named per type (ties #211).** `WORKFLOW.md` line 337 names the smell type's deterministic detection half as a downstream/future hook, explicitly NOT built; `#211` cited. **Confirmed UNCHANGED:** `.claude/settings.json` and `tests/hooks.sh` (empty diff vs origin/main); `tests/hooks.sh` 74/74 green.
- ✓ **S8 — heavier types registered, not built.** Exactly 3 rows marked "later slice — not built" (`WORKFLOW.md` lines 331–333: architectural, functional/integration, criticality-prioritization), each with cadence/depth/det-vs-AI sketched. No partial half-built heavy type; per-diff and smell are the only two built rows.
- ✓ **S9 — additive, no migration.** No `.claude/settings.json` / hook / template / `MIGRATIONS.md` change; the only new files are docs (research, arch, plan, slice1-draft). First full `/pm-audit` records the baseline marker; existing `## Technical quality` offer strengthened, not removed for interactive mode.

## Interaction scenarios
- ✓ `Provably isolated:` declared and justified (no runtime, no concurrent shared mutable state, I/O limited to git-read + marker/backlog-write in one sequential audit pass). No concurrent-state test owed. Covered by Scenarios 1–9 + clean-grep, per the Test plan.

## Stack expectations compliance
- ✓ **Claude Code hooks API** — only *referenced* (smell detection-half named as a future hook); no hook added, no new `permissionDecision` surface. `.claude/settings.json` and `tests/hooks.sh` unchanged — consistent with the cited "no new hook in this slice" rule. No stack-spec test owed.
- ✓ **git** — `git diff <last-sweep-sha>..HEAD` + a stored commit SHA, consistent with the cited usage. No code contradicts either citation.

## Decision-record / coupling checks
- ✓ `doc/architecture.md` decision record present (lines 264–273): framework as a new whole-system discipline, EPIC slice 1, registry home = `WORKFLOW.md` `### Review typology`, marker = audit-report line.
- ✓ **Marker↔audit-report coupling noted** in the decision record (line 268, "Marker↔audit-report coupling (the explicit constraint)") — a future standalone sweep trigger would need a dedicated marker home (rejected Variant-B `.ai-pm/state/` file); flagged so the constraint is visible.
- ✓ **No new file for the marker** — the `## Quality sweep` line lives in the existing `audit-*.md`; the only added files are docs. Confirmed by `git diff --name-status`.

## Boundary / single-source clean-greps
- ✓ Single-source: `pm-audit.md` references `### Review typology` by name and carries the explicit "do not re-encode the type list or cadence rule here" instruction; it does not restate the 5-type enum/cadence.
- ✓ Boundary stated (`WORKFLOW.md` line 339): smell typology distinct from the compliance audit, from the per-diff `code-review` pass (itself one registered type), and from the cross-model-review backlog item.

## Product Contract
No Product Contract touched — non-user-facing meta-feature (subjects = the review-typology discipline / `/pm-audit` / the orchestrator / the `code-review` skill). Backend/meta-only: Product Contract checks skipped explicitly.

## Definition of Done
- [x] All plan scenarios implemented and tested (prose-spec; verification = editorial + clean-grep per Test plan — all greps pass)
- [x] Interaction scenarios have concurrent-state tests (n/a — `Provably isolated:` declared and justified)
- [x] Stack expectations respected; stack-spec tests pass (git + hooks API only referenced; `tests/hooks.sh` 74/74)
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change (n/a — no Product Contract touched)
- [x] Pipeline green (`tests/hooks.sh` 74/74; no hook touched)
- [x] State file updated (`.ai-pm/state/current.md` — status, touched-files, next-step)
- [x] Product Impact Report present (n/a — no contract touched)
- [x] Docs updates landed (`WORKFLOW.md` registry, `pm-audit.md` sweep, `doc/architecture.md` decision record — all four "Docs to update" items in this branch)
- [x] Expected artifacts exist (plan `doc/features/review-typology-framework_plan.md`, this review; no contract — non-user-facing)
- [n/a] Product-readiness gate resolved (user-facing only — feature is non-user-facing, no advocate artifact required)
- [n/a] Validation gate resolved (documentation-kind only — project is software-kind / kind-absent; no `## Validation` section emitted)

**DoD: pass**

## Blocking
None.

## Notes (product)
None. Scope matches the plan exactly — no out-of-plan changes, no scope expansion. No structural wire-token surfaced (the diff touches no Product Contract PM-facing sections).

## Verdict
approve

## Code review findings
Pass-2, two-finder fan-out (spec-consistency + cross-doc). Clean: single-source (type enum/cadence lives once in `### Review typology`; pm-audit references by name), registry consistency (5 types, exactly 3 marked "later slice — not built"), autonomous gate bounded by proportionality, depth fully selectable (no stray hard-wired `ultra`), det-vs-AI/#211 (no hook implied as done; settings.json + tests/hooks.sh unchanged), cited hashes + v2.24.0 + #211 verified. **Real findings to fix (for pm-coder):**

1. **(marker, most severe) `pm-audit.md` — a swept-clean SKIP must not leave a sha-less `## Quality sweep` line, or the next sweep's reader (which reads `<sha>` from the latest sweep-bearing report) is undefined in the steady state.** Fix: on a skip, write NO `## Quality sweep: … swept <sha>..HEAD …` marker (only a plain note like "Quality sweep skipped — swept-clean since <date>"). State the reader rule precisely: find the latest `audit-*.md` containing a **real** `## Quality sweep: … swept <sha>..HEAD …` line (a skip note is not one) and scope `git diff <that sha>..HEAD`.
2. **(marker) `pm-audit.md` — state that the written `<sha>` is HEAD-at-sweep-time** (currently only in the arch note). One clause in the operative command.
3. **(marker) `pm-audit.md` — "never-swept (legacy) areas" is undefined on incremental sweeps (no signal).** Reframe the scope honestly: an incremental sweep = `git diff <last-sweep-sha>..HEAD`; **legacy/never-swept code is covered by the first sweep (first-run-full) + the periodic full re-sweep**, NOT by a per-incremental legacy detector. Drop the decorative "+ never-swept areas" as a separate incremental component.
4. **(marker) `pm-audit.md` — first-run precedence:** state that when no prior `## Quality sweep` marker exists anywhere → first-run-full (overrides the skip gate); the skip gate applies only when a prior marker exists AND nothing changed since its sha.
5. **`WORKFLOW.md` `### Decision authority` consumer list omits the new `pm-audit.md` consumer.** The smell-sweep autonomous gate makes `pm-audit.md` (the command — distinct from the listed `pm-auditor.md`) a consumer of `### Decision authority`; add `pm-audit.md` to that subsection's named consumer list (single-source-drift guard).
6. **`WORKFLOW.md` `### Review typology` omits the marker↔audit-report coupling caveat.** The caveat (the marker exists only where an `audit-*.md` does; a future non-audit sweep trigger needs a dedicated marker home) lives only in pm-audit.md + architecture.md. Add it to the registry so a future slice reading `### Review typology` by name sees it.

Not fixed (minor, acceptable): the marker **format string** appears in pm-audit.md (operative) + architecture.md + the plan — decision records legitimately describe the mechanism; not drift-prone enough to dedupe.

## Code review: 2026-06-05 — passed

All 6 findings fixed in-pass by pm-coder (`182db36`): (1) swept-clean skip writes no `## Quality sweep` marker + precise reader rule; (2) `<sha>` = HEAD-at-sweep-time stated; (3) per-incremental "never-swept" detector dropped — legacy covered by first-run-full + periodic re-sweep; (4) first-run-full precedence over the skip gate; (5) `pm-audit.md` added to the `### Decision authority` consumer list; (6) marker↔audit-report coupling caveat added to `### Review typology`. Plus a follow-up alignment (`f6aea8c`): the registry's conceptual cadence reworded to match the no-phantom-never-swept realization. `tests/hooks.sh` 74/74; `.claude/settings.json` + `tests/hooks.sh` byte-unchanged (no hook added — the smell deterministic-detection half is named, not built). Marker-format-string triplication accepted (decision records legitimately describe the mechanism).
