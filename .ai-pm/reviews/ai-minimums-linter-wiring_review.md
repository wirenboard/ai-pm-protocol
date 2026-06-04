# ai-minimums-linter-wiring — plan compliance review

Branch `feature/ai-minimums-linter-wiring` vs `origin/main`. Plan: `doc/features/ai-minimums-linter-wiring_plan.md`. Arch note: `.ai-pm/arch/ai-minimums-linter-wiring_arch.md`.

Meta-feature on the template repo: **software-kind**, **non-user-facing** (scenario subjects = `pm-stack-researcher` / the project's linter config / `/pm-bootstrap` / the reviewer / the Pipeline — system, not a human role). No Product Contract, no advocate gate, no `## Validation` gate. Non-security project (no `docs/threat-model.md`) → threat-model DoD n/a. Verification = editorial + clean-grep; `tests/hooks.sh` 74/74 (no hook touched).

## Plan completeness
- ✓ "Stack expectations touched" present; the entry is the stack-notes "Validators wired into pipeline" mechanism (researcher-supplied per-stack mapping, doc-URL cited) — no stack component of *this* repo touched, source attribution given.
- ✓ "Interaction scenarios" present with explicit `Provably isolated:` declaration (prose-spec, no runtime/shared-state/concurrency/I/O in the protocol repo; downstream linter config runs sequentially in the project's own pipeline). Correct.
- ✓ Not a hotfix topic; no "Incident facts" required.
- ✓ `Source:` line is `PM-flagged` (#211/#218/#224), not `selected autonomously` — selection-citation backstop n/a.

## Plan compliance (Scenarios 1–6)
- ✓ **S1 — AI-minimums wired into the real linter at bootstrap** — `pm-stack-researcher.md` step 6 produces the AI-minimums→linter-rule mapping into `docs/stack-notes.md`; `pm-bootstrap.md` wires it into the `<lint command>` config across **all three** stack-setup paths (greenfield line 104, legacy stack-literacy line 172, legacy codebase-reader line 201). So a diff crossing a minimum fails the Pipeline lint step. Verification: editorial + clean-grep (repo is markdown-prose, no linter to dogfa — proportionality honored, no config forced on this repo).
- ✓ **S2 — numbers single-sourced, linter encodes never re-declares** — values stay in `### AI-specific minimums` (the five number-lines in `architecture.md.tmpl` are UNCHANGED — only a pointer added). Clean-grep of `300` across all changed prose: every occurrence is either the pre-existing single-source home (`CLAUDE.md.tmpl` L50 / `architecture.md.tmpl` L144, not in added lines), the illustrative `max-module-lines=300` **enforcement encoding**, the rule-line *forbidding* prose re-statement, or the decision-record context recital / DriveBox `331-past-300` evidence. No new second prose authority.
- ✓ **S3 — reviewer/auditor verifies the linter encodes the minimums** — extends dim-9 across BOTH cadences (Variant A): `pm-plan-checker` Pipeline-green DoD extended **in place** (line count 1→1, not a new checklist gate); `pm-auditor` dim-5 gains a periodic non-blocking note (un-wired-project case). No new gate, no new dimension. `code-review` explicitly NOT made a third owner (stated in `doc/architecture.md` decision record).
- ✓ **S4 — honest partial (#211 boundary)** — unexpressible minimums recorded **convention-only**, explicitly, in `pm-stack-researcher.md` step 6; references the `### Review typology` **smell type by name** (not paraphrased) for cross-file/accumulated cases. Carried into bootstrap + auditor dim-5 (convention-only ≠ un-wired finding).
- ✓ **S5 — ties to review typology + smell type** — deterministically-linted minimums named as the per-diff deterministic half; smell type owns accumulated/cross-module cases. Tied by name in stack-researcher, auditor, and the decision record.
- ✓ **S6 — additive, no migration** — `MIGRATIONS.md` UNCHANGED; auditor dim-5 note is non-blocking, PM opts in, never a retroactive forced rewrite. `.claude/settings.json` + `tests/hooks.sh` UNCHANGED (no hook added) — confirmed.

## Categorical coverage
- ✓ Bootstrap stack-setup modes: the chosen set is greenfield + both legacy modes — all three covered, none silently excluded.
- ✓ Reviewer cadences (per-diff / periodic): both covered (Variant A); no sibling silently implemented or dropped.

## Stack expectations compliance
- ✓ Sole entry is the researcher-supplied per-stack mapping mechanism; no stack component of this repo is contradicted (markdown-prose, no linter). No stack-spec test owed in this repo (downstream, researcher-cited per the mapping). No value the mapping forbids is hardcoded — per-stack rules appear as **examples only**, never a fixed protocol list (Out-of-scope line 80 honored).

## Interaction scenario coverage
- ✓ `Provably isolated:` declared and justified; no concurrent-state test owed.

## Product Contract
- No Product Contract touched — backend/meta-feature, non-user-facing (every scenario subject is the system / role / pipeline). Stated explicitly.

## Definition of Done
- [x] All plan scenarios implemented and tested — Scenarios 1–6 implemented; verification is editorial + clean-grep per the repo discipline (no automated tests by design)
- [x] Interaction scenarios have concurrent-state tests — n/a, provably isolated
- [x] Stack expectations respected; stack-spec tests pass — no repo stack touched; no stack-spec test owed here
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change — no Product Contract touched (non-user-facing)
- [x] Pipeline green — `tests/hooks.sh` 74/74; clean-grep single-source / extends-not-duplicates / honest-partial all pass
- [x] State file updated — `.ai-pm/state/current.md` reflects coding-done + touched files
- [x] Product Impact Report present (when contract touched) — n/a, no contract touched
- [x] Docs updates landed — every "Docs to update" entry present (stack-researcher, bootstrap, CLAUDE.md.tmpl, architecture.md.tmpl, pm-plan-checker, pm-auditor, doc/architecture.md decision record); no out-of-scope file touched
- [x] Expected artifacts exist — plan, arch note, this review present; no contract (non-user-facing)
- [n/a] Product-readiness gate resolved — non-user-facing (system/role subjects); exempt, no advocate artifact required
- [n/a] Validation gate resolved — software-kind; no `## Validation` section

**DoD: pass**

## Blocking
None.

## Notes (product)
None. Scope matches the plan exactly (the changed-file list is precisely the plan's "Docs to update" plus the expected plan/arch/state artifacts); no scope expansion to weigh.

## Verdict
approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker. -->
## Code review findings
Pass-2. Clean on the load-bearing invariants: dim-9 extended in place (no new gate/dimension; code-review not a third owner), stack-agnostic ("examples only" everywhere), honest-partial references the smell type by name, `.claude/settings.json` + `tests/hooks.sh` byte-unchanged (74/74), cited hashes present. **One real defect — single-source violation in the decision record itself (ironic, given the feature), for pm-architect:**

1. **`doc/architecture.md` decision record re-states ALL FIVE minimum numbers in prose** ("max file 300 / function 50 / cyclomatic ≤10 / no file-level suppressions / coverage ≥80%") — a forbidden re-declaration outside `### AI-specific minimums`, **self-contradicting** (the same sentence claims "numbers stay single-sourced"). It is a narrative enumeration, not the allowed `max-module-lines=300` config encoding-example. **Fix:** replace the enumeration with a **reference** ("the AI-specific minimums declared in `### AI-specific minimums`") — do not list the numbers.
2. **Same record, the DriveBox "Why" evidence quotes "past the 300-line limit"** — a second prose authority for the number. ("331" as the observed drift value is fine.) **Fix:** "past the **max-source-file** minimum" (reference the cap by name; keep `cli.py` at 331 as the observed value).

(Out of scope / pre-existing, not this feature's defect: the numbers already live in both `### AI-specific minimums` (architecture.md.tmpl) and the `CLAUDE.md` Pipeline block — a loose pre-existing dup, noted for a future tidy.)

## Code review: 2026-06-05 — passed

One finding fixed in-pass by pm-architect (`723b950`): the decision record's single-source violation — the five-number prose enumeration → a reference to `### AI-specific minimums`; "past the 300-line limit" → "past the max-source-file minimum" (`cli.py` 331 kept as evidence). `tests/hooks.sh` 74/74; the allowed `max-module-lines=300` config encoding-example retained. Pre-existing `### AI-specific minimums` ↔ `CLAUDE.md` number dup noted for a future tidy (not this feature's defect).
