# readme-template-canonical-shape — plan compliance review

Meta-feature, software-kind (no `## Project kind` line → software default), non-user-facing
(scenario subjects = the README template / `pm-architect` / downstream READMEs / the scaffold
step). Non-security project (no `docs/threat-model.md`). Verification = editorial + clean-grep;
no Product Contract, no advocate gate, no `## Validation` gate. Plan is complete: Interaction
scenarios section carries an explicit `Provably isolated:` declaration; no stack-notes component
touched (no "Stack expectations touched" section required); not a hotfix.

## Plan compliance
- ✓ **Scenario 1 — canonical shape, reconciled with front-gate.** Template body is on the
  canonical order что→зачем(pointer)→install→details→license: `# <Project Name>` + intro →
  `→ … docs/product.md` pointer → `## Quick start` → `## Architecture`/`## Development`
  (details tier) → `## License` last. Top guidance comment (`README.md.tmpl:1–13`) names all
  five beats. Body byte-identical to `main` (`diff` of body vs `main` = clean) — template was
  already on the order; this slice codifies it + adds the comment. Verified editorial + grep.
- ✓ **Scenario 2 — front-gate intact, no second capability statement.** No `## What it does`
  heading in the template (`grep` ABSENT); no value/"why" section added. The "зачем" beat is the
  pointer line only (`README.md.tmpl:18`). The `pm-auditor` `## What it does`-presence check and
  the A4 cross-check stay valid. Verified by clean-grep.
- ✓ **Scenario 3 — `pm-architect` authoring rule.** Canonical-README-shape authoring rule added
  in the README/front-door area (`pm-architect.md`, after the Product.md header-migration para):
  follows что→зачем(`docs/product.md` pointer)→install→details→license, keeps the README a thin
  front door (no capability/value section), **references** the front-gate discipline and
  explicitly says "do not duplicate that discipline here — reuse it". References the front-gate
  without restating it, as required.
- ✓ **Scenario 4 — optional auditor check, deferred to arch.** Arch note Recommendation =
  **Variant A: no new `pm-auditor` check this slice**. `pm-auditor.md` unchanged vs `main`
  (name-only diff empty) — the recommended absence is honored.
- ✓ **Scenario 5 — additive, no migration, no force-restructure.** No `MIGRATIONS.md` change
  (name-only diff empty), no template structural-migration trigger, no `doc/architecture.md`
  decision record (name-only diff empty — arch note Q4 = "below the bar, no record"). Existing
  downstream READMEs not force-restructured.

### Arch-recommended absences — confirmed correctly ABSENT
- ✓ No `pm-auditor` check (arch Variant A / Recommendation).
- ✓ No `doc/architecture.md` decision record (arch Q4 — substantive decision already recorded
  when the front-gate landed; this slice reuses it).
- ✓ No `MIGRATIONS.md` entry (additive, no migration).

### Byte-preservation (A4 `Integration contract ↔ README install` target) — confirmed
- ✓ `## Quick start` install fenced block, `## License` tail, and the `→ … docs/product.md`
  pointer line are byte-for-byte unchanged: the template body (everything below the new comment)
  is `diff`-identical to `main`. The A4 cross-check target survives; the front-gate detector's
  negative-space contract (no `## What it does`, pointer present) holds.

### Guidance comment — front-gate prohibition stated explicitly (not just beat names)
- ✓ `README.md.tmpl:9–12` states the prohibition in prose: "this README owns NO
  capability / value / 'why' section. The 'зачем / why' beat IS the `docs/product.md` pointer —
  do not add a Why-section here". This is the primary guard the arch note's Q1 risk requires
  ("must state the front-gate rule explicitly, not merely list beat names").

### Categorical coverage
- ✓ The canonical five-beat set is covered in full (what→why→install→details→license); no
  silently-implemented sibling. Out of scope siblings (force-migration, a why-section, the
  protocol's own README, a blanket auditor check, prose-language policy) each carry a one-line
  reason.

### Product Contract
No Product Contract touched — non-user-facing meta-feature (template/agent/scaffold subjects).

## Definition of Done
- [x] All plan scenarios implemented and tested — Scenarios 1–5 implemented; "test" = editorial +
  clean-grep per repo discipline (no automated tests by design for prose/template changes)
- [x] Interaction scenarios have concurrent-state tests — n/a (plan declares `Provably isolated:`)
- [x] Stack expectations respected; stack-spec tests pass — n/a (no stack component touched)
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change — n/a (no
  Product Contract touched; non-user-facing)
- [x] Pipeline green — `tests/hooks.sh` 74/74 (suite grew 71→74 in recent merges; 74 green is the
  current contract; the plan's "71" is a stale baseline, not a regression; no hook touched)
- [x] State file updated — `.ai-pm/state/current.md` reflects coding-done → review with touched
  files and arch-honored absences
- [x] Product Impact Report present (when contract touched) — n/a (no contract touched)
- [x] Docs updates landed — both planned edits present: `doc/_templates/README.md.tmpl` (guidance
  comment + front-gate prohibition) and `.claude/agents/pm-architect.md` (authoring rule); the
  three planned absences honored
- [x] Expected artifacts exist — plan, arch note, this review present; no contract required
  (non-user-facing)
- [n/a] Product-readiness gate resolved — non-user-facing (all scenario subjects are the
  system/template/agent/scaffold, no human role); exempt, no advocate artifact required
- [n/a] Validation gate resolved — software-kind feature, no `## Validation` section emitted

**DoD: pass**

## Blocking
None.

## Notes (product)
None. Scope matches the plan exactly (two files changed + three deliberate absences); no scope
expansion, no wire-token introduced into a PM-facing contract section (no contract touched). The
74-vs-71 test-count delta is a stale plan baseline, not a regression — noted for transparency, not
a finding.

## Verdict
approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See WORKFLOW.md "Edit-ownership rule" — the Pass-2 code-review trail is the single
     carve-out to "orchestrator does not edit content artefacts". -->
## Code review findings
Editorial Pass-2. Byte-preservation confirmed (diff = only the prepended 13-line guidance comment + the pm-architect paragraph; pointer line / `## Quick start` / `## License` byte-identical to `main`). Front-gate intact (no `## What it does` / value section). Two LOW findings:

1. **Latent (no action) — beat label "install" vs heading `## Quick start`.** A future author renaming the heading to `## Install` to match the beat label could break a *hypothetical* A4 grep on the literal `## Quick start`. **Not an active defect** — A4 is order/name-agnostic today (arch note confirms), and the guidance comment correctly bridges the two. Recorded as an observation; no fix.
2. **Markdown nit (fixed) — missing blank line between the comment close `-->` and the H1.** Harmless under CommonMark, but the repo's own blank-line discipline prefers a blank line after a block-level HTML comment. **Fixed by pm-coder** (one blank line added).

No front-gate contradiction, no preserved-content change, no correctness defect.

## Code review: 2026-06-05 — passed
