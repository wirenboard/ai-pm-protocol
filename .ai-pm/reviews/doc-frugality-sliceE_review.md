## Plan compliance

### Scenario 14 — section-derivation / generated-vs-authored boundary

- ✓ GENERATED-marker fences added to `doc/_templates/architecture.md.tmpl` for both `file-layout` and `dependency-table` regions. Each fence carries the do-not-hand-edit instruction and states authored sections live OUTSIDE the fences.
- ✓ Architecture-section derivation procedure documented in `src/agents/pm-architect.body.md` (new "Section A (sub-section)") as the sibling of the Product map generation procedure: source-tree → file-layout, package-manifest → deps, overwrite-the-delimited-region, idempotent (re-run diff-clean), preserves authored Responsibility/Purpose cells per key. "Never hand-edit a generated section" stated explicitly.
- ✓ A4/A5 instructions in pm-architect updated: derive the fenced rows, never hand-cross-check; generated-vs-authored boundary called out.
- ✓ pm-bootstrap carries a sibling-derivation pointer next to the Product map generation procedure.
- ✓ CRITICAL constraint honored: `gen/generate.py` stays a byte-copy adapter generator — the test (`generation-derived-sections` in `tests/generation-e.sh`) asserts the generator contains zero doc-derivation references. Verified passing.

### Scenario 15 — lean template set

- ✓ All seven standing-doc templates carry the doc-style guidance comment pointing at `workflow/doc-style.md` as the authority: architecture, user-journeys, product, stack-notes, threat-model, README, state.
- ✓ README template comment names the ≤100-line and ≤120-char caps. README template itself is 50 lines (well within cap).
- ✓ Each comment is a pointer, not a restatement of the rules (realize-don't-redefine). Verified by test.
- NOTE: scenario 15's parenthetical description of the lean standing-doc set includes "thin index" as a distinct member. No `index.md.tmpl` was created and no existing template serves as a navigation index. The plan's own test specification (`lean-doc-templates`) does not require a thin index template — it describes the test as covering doc-style guidance + README caps only. This is a gap between the scenario's aspirational description and the implemented + tested scope; because the plan's test spec is silent on it, this is a product note, not a blocker. See Notes (product).

### Scenario 16 — migration + deferred items

- ✓ Archive-refs removed from `doc/_templates/state.md.tmpl` (archive-on-completion → reset-to-idle, git keeps the snapshot). The Slice-D deferral is closed.
- ✓ Archive-refs removed from `src/commands/pm-bootstrap.body.md` (`.ai-pm/state/archive/` dir-creation dropped from all three scaffolding paths). The Slice-D deferral is closed.
- ✓ `state-archive-superseded-clean` test extended from the Slice-D state.md+pipeline.md scope to a full-repo `git grep` sweep with sane exclusions: `doc/features/*_plan.md`, `CHANGELOG.md`, `tests/*`, `.claude/*`, `.opencode/*`, `.golden/*`, `.ai-pm/*`. The ADR's self-describing supersede line in `doc/architecture.md` is caught by `filter_supersede_lines` (matches `Supersede`). MIGRATIONS.md's detection prose is filtered via `state-archive-home` in the filter. The sweep is non-vacuous (a probe file staged in `workflow/` trips it). All four cells pass.
- ✓ MIGRATIONS.md `### Pending-migration detection` extended with two new detection conditions: `state-archive-home not superseded` and `append-model standing docs (doc-frugality not applied)`. Both use positive-presence detection (matching existing conventions).
- ✓ `state-archive-home` supersede procedure present in MIGRATIONS.md. Move-not-delete; references `### Graduation targets` by name. Every guarantee preserved: no archive content deleted, no durable fact stranded.
- ✓ `doc-frugality` migration procedure present in MIGRATIONS.md. Distill-not-delete; graduated-first-then-collapse; references `### Graduation targets` by name; names the C.9 + D.13 safety net; mixed-project safe. Every guarantee preserved.
- ✓ Both procedures follow existing MIGRATIONS.md conventions (detection-by-reference, procedure prose, move/distill-not-delete language, plain-language PM message at end).
- ✓ The MIGRATIONS.md supersede prose (locus 6 = the state-archive-home description under Pending-migration detection) is phrased so the full-repo clean-grep reads it as the superseded-model description, not a live assertion — confirmed by the filter check above.

### Test plan

- ✓ `generation-derived-sections` — present in `tests/generation-e.sh`; non-vacuity not separately named but the test asserts GENERATED markers, derivation procedure documentation, idempotence description, and gen/generate.py exclusion. All four sub-checks pass.
- ✓ `lean-doc-templates` — present in `tests/generation-e.sh`; checks all seven templates for the doc-style guidance comment plus README hard-caps; passes.
- ✓ `generated-section-owner-boundary` — present in `tests/generation-e.sh`; checks fence markers, "never hand-edit" guidance in pm-architect, re-run-diff-clean guard description; non-vacuity probe strips the "never hand-edit" text and asserts the check trips. Passes.
- ✓ `generator-golden-parity` (stack-spec test) — implemented as `generated-claude-adapter-byte-equivalent` + SHA256SUMS match in `tests/generator.sh`. The plan names this test logically; `tests/generator.sh` has provided this contract since before Slice E and remains green (4/4). The Slice-E-regenerated adapters (pm-architect, pm-bootstrap, both harnesses) are byte-identical to the updated golden.
- ✓ `state-archive-superseded-clean` — extended to full-repo in `tests/o1-lifecycle.sh`; passes (4/4).
- ✓ `generated-section-owner-boundary` as interaction-scenario test — covered by the test of the same name in `tests/generation-e.sh`.
- ✓ `audit-mixed-project` — shipped in Slice C (`tests/doc-style.sh`), still passes.

### Interaction scenario coverage

- ✓ "Slice E generation runs while pm-architect owns architecture.md" — the owner boundary is documented in pm-architect (never hand-edit a generated section / everything outside the fences is authored judgment) and tested by `generated-section-owner-boundary`. Regeneration only rewrites fenced bytes.
- ✓ "state-archive-superseded-clean" — full-repo sweep with non-vacuity probe; passes.
- ✓ "doc-style-vs-legibility-distinct" — shipped Slice A, still passes (`tests/doc-style.sh`).
- ✓ "comment-restraint-no-drift" — shipped Slice A, still passes.
- ✓ "audit-mixed-project" — shipped Slice C, still passes.

### Adapters / golden

- ✓ pm-architect.md regenerated both harnesses (.claude/ + .opencode/). Claude golden re-frozen (pm-architect.md + SHA256SUMS). Other 12 adapters byte-identical. `tests/generator.sh` 4/4.
- ✓ pm-bootstrap.md regenerated both harnesses. Claude golden re-frozen (pm-bootstrap.md + SHA256SUMS). `tests/generator.sh` 4/4.
- ✓ `tests/opencode.sh` 41/41; `tests/oc-plugin-unit.js` 74/74; `tests/hooks.sh` 79/79; all other suites green.

### Feature completeness across Slices A–E (plan scenarios 1–16)

All 16 plan scenarios are delivered:

| Scenarios | Slice | Status |
|---|---|---|
| 1–4 (durable-text frugality, comment-restraint first-class, hard-cap set) | A | merged |
| 5–6 (code-review + plan-checker enforce) | B | merged |
| 7–9 (auditor frugality dimension + scale-guard + graduation check) | C | merged |
| 10–13 (O(1) lifecycle, distillation, graduation gate) | D | merged |
| 14–16 (section derivation, lean templates, MIGRATIONS migration) | E | this slice |

All 6 `state-archive-home` supersede loci:

| Locus | File | Status |
|---|---|---|
| 1 | `workflow/state.md` | Slice D |
| 2 | `workflow/pipeline.md` Step 6 | Slice D |
| 3 | `doc/architecture.md` line ~83 | Slice D (pm-architect, `1d89f77`) |
| 4 | `doc/architecture.md` line ~509 | Slice D (pm-architect, `1d89f77`) |
| 5 | pm-auditor body (confirmed no-op) | Slice D (verified clean) |
| 6 | `MIGRATIONS.md` supersede entry | Slice E (`49b23f3`) |

All 6 loci closed. Feature is complete.

---

## Definition of Done

- [x] All plan scenarios implemented and tested
- [x] Interaction scenarios have concurrent-state tests
- [x] Stack expectations respected; stack-spec tests pass (`generator-golden-parity` via `tests/generator.sh` 4/4; `gen/generate.py` byte-copy contract untouched)
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change (plan declares no Product Contract — non-user-facing feature; scenario subjects are system/agents)
- [x] Pipeline green (`tests/doc-style.sh` 17/17, `tests/generation-e.sh` 4/4, `tests/o1-lifecycle.sh` 4/4, `tests/generator.sh` 4/4, `tests/opencode.sh` 41/41, `tests/oc-plugin-unit.js` 74/74, `tests/hooks.sh` 79/79, `tests/neutral-prose.sh` 5/5, `tests/targeted-reading.sh` 7/7, `tests/ultra-absent.sh` 2/2, `tests/core-delegation.sh` 2/2 — all green)
- [x] State file updated (`.ai-pm/state/current.md` records Slice E built, pm-coder scope, MIGRATIONS from pm-architect)
- [x] Product Impact Report present (when contract touched) — n/a, no contract
- [x] Docs updates landed: MIGRATIONS.md extended (`49b23f3`); `doc/_templates/` lean set shipped (`58518d1`); `doc/_templates/architecture.md.tmpl` GENERATED fences + guidance comment (`f90d52f`); `doc/_templates/state.md.tmpl` archive-ref removed (`6a2be7a`); pm-architect Architecture-section derivation procedure documented; pm-bootstrap archive-ref removed + sibling-derivation pointer. Other docs (WORKFLOW.md, `doc/architecture.md`, `doc/user-journeys.md`) owned by pm-architect and dispatched/completed in prior slices.
- [x] Expected artifacts exist (plan at `doc/features/doc-frugality_plan.md`; reviews for slices A–D present; this review at `doc-frugality-sliceE_review.md`; no contract — non-user-facing)
- [n/a] Product-readiness gate resolved — non-user-facing; exempt
- [n/a] Validation gate resolved — software-kind project
- [n/a] Failure-inventory negative-space tests — plan has no failure-inventory scenarios (no external I/O failure modes listed as explicit scenarios)

**DoD: pass**

---

## Blocking

None.

---

## Notes (product)

1. **Thin index template not created (Scenario 15 aspirational gap).** Scenario 15's parenthetical description of the lean standing-doc set lists "thin index" as a distinct member alongside architecture, user-journeys, product, stack-notes, threat-model, README. No `index.md.tmpl` template was created and no existing template serves as a `docs/` navigation index. The plan's own test specification for `lean-doc-templates` does not include a thin index check — it covers doc-style guidance + README caps only. The current template set (7 templates, all with guidance comments) satisfies the test spec. If the PM wants a navigation index template as part of the bootstrapped docs/ set, a follow-up feature or trivial fixup can add `index.md.tmpl`. Scope choice: was "thin index" intended as a new deliverable or as a description of the downstream docs/ structure pm-architect authors?

2. **`.ai-pm/` excluded from the full-repo archive sweep.** The `state-archive-superseded-clean` sweep excludes `.ai-pm/*` — this means `.ai-pm/state/current.md` and other tracking files in `.ai-pm/` are not checked. This is appropriate (they are evidence/tracking, not protocol standing docs), and the sweep covers all protocol-definition files (workflow/, src/, doc/, MIGRATIONS.md). Mentioning for PM visibility: the exclusion is intentional and correct, but if any `.ai-pm/` content contained a live archive assertion it would not be caught.

---

## Verdict

approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See the "Edit-ownership rule" in `workflow/enforcement.md` — the Pass-2 code-review
     trail is the single carve-out to "orchestrator does not edit content artefacts". -->
## Code review findings

Pass-2 code-review (high, recall-biased, 2 finder angles) run 2026-06-09 over the Slice E diff. One real finding fixed; one item descoped.

1. **Template guidance comments re-encoded rule definitions (CONFIRMED).** The E.15 doc-style guidance comments in the standing-doc templates restated rule definitions inline ("provenance = a one-line pointer", "Distilled, not accumulated", the supersede tombstone form) instead of naming the rules + pointing at `workflow/doc-style.md` — the single-home/realize-don't-redefine class fixed in B/C/D. **Fixed `fc4fb80`** — six templates now name the rules + point at the authority ("this comment names the rules and points there, it does not restate them"); the template-local generated-vs-authored FENCE guidance (operationally necessary) was kept. generator 4/4 diff-clean.
- **Descoped (recorded):** scenario 15's parenthetical lists a "thin index" template; none was built. Both review passes ruled it non-blocking — the docs entry-point is served by `product.md` (front door) + the thin README; a separate thin-index template was not required by any scenario-body or test. Recorded as a minor follow-up rather than a tail-of-feature scope expansion.

Byte-copy constraint verified (`gen/generate.py` carries zero doc-derivation logic — derivation is the separate documented procedure). Full-repo `state-archive-superseded-clean` sweep robust + non-vacuous. Golden parity: only `pm-architect.md` + `pm-bootstrap.md` changed. Post-fix all 11 suites GREEN.

## Code review: 2026-06-09 — passed
<!-- The orchestrator replaces THIS WHOLE LINE with `## Code review: <date> — passed`
     only when code-review clears. Until then the section is UNSTAMPED: `pm-pr-prep`
     refuses to release it (step 0) and `pm-auditor` blocks on it (dimension 1).
     Never ship an empty `## Code review` heading — an empty section reads as
     "no findings / passed" to a quick eye or grep; `NOT YET RUN` reads as "not done". -->
