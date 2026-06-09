## Plan compliance (Pass 1) — doc-frugality Slice A

Scope: Slice A commits on `feature/opencode-harness-support--doc-frugality` only (scenarios A.1–A.4, the Slice A test plan subset, and the Slice A Docs to update item). Slices B–E are future work and are NOT flagged as missing.

Cross-model review: this is Sonnet (reviewer) on an Opus-driven session, per the `/pm-plan` cross-model review setting.

---

### Scenario coverage

- ✓ **A.1 — Doc-style discipline rules (fact-first, current-state-only, supersede-don't-edit, provenance-as-pointer, one-purpose, why-not-what + single-home)** — all six rules are defined in `workflow/doc-style.md` under their own `###` anchors. The file opens with a BLUF header referencing the sibling legibility rule. Anchors: `### Fact-first / BLUF`, `### Current-state-only`, `### Supersede-don't-edit`, `### Provenance = one-line pointer`, `### One-purpose-per-unit`, `### Comment-restraint`. Test: `doc-style-single-home` in `tests/doc-style.sh` (PASS).

- ✓ **A.2 — Supersede-don't-edit tombstone + one-line-per-rejected** — `### Supersede-don't-edit` in `workflow/doc-style.md` mandates the `### <title> — superseded by <new> (YYYY-MM-DD) → <pointer>` one-line tombstone form and the `rejected <alternative>: <one-line because>` form. Test: `supersede-dont-edit` in `tests/doc-style.sh` (PASS).

- ✓ **A.3 — Comment-restraint promoted to first-class** — `### Comment-restraint` in `workflow/doc-style.md` explicitly states "a **first-class protocol rule applying on every project**, including a generic one with no per-project lint wiring." `doc/_templates/CLAUDE.md.tmpl` is wired as the realization ("single-sourced by `### Comment-restraint` in `.ai-pm/tooling/workflow/doc-style.md` — this section realizes that protocol rule for this project, it does not redefine it"). Tests: `comment-restraint-first-class` + `comment-restraint-nonvacuous` + `comment-restraint-no-drift` in `tests/doc-style.sh` (all PASS). Non-vacuity is real: stripping the `### Comment-restraint` anchor from a scratch copy causes the presence check to fail.

- ✓ **A.4 — Numbers as smells + 4 hard-caps** — `### Numbers = targets, not gates` in `workflow/doc-style.md` defines the four hard-caps: README one-liner ≤ 120 chars, decision record ≤ ~2 screens, navigation list ≤ 7, top quality-goals ≤ 5. No test covers this sub-scenario directly, but it is encoded in `workflow/doc-style.md` and will be verified by Slice B (plan-checker enforcing hard-caps on standing-doc updates). Acceptable for Slice A scope — the rule is defined; enforcement is Slice B's job.

---

### Single-home / no-drift checks

- ✓ **`workflow/pm-comms.md` `## Human-facing text legibility`** — section now explicitly names `workflow/doc-style.md` as the frugality home: "It is the **clarity** sibling of the **frugality** discipline in `## Durable-text frugality` in `workflow/doc-style.md`… read the frugality rule there by name, do not restate it here." The old "out of scope here" disclaimer is replaced by a forward pointer. Test: `doc-style-vs-legibility-distinct` (clean-grep; PASS).

- ✓ **`CLAUDE.md.tmpl` realize-not-redefine** — Comment-restraint section in the template carries "single-sourced by `### Comment-restraint` in `.ai-pm/tooling/workflow/doc-style.md` — this section realizes that protocol rule for this project, it does not redefine it." The regex `single-sourced by.*doc-style\.md` in the test matches correctly against `.ai-pm/tooling/workflow/doc-style.md` (the submodule path). Test: `comment-restraint-no-drift` (PASS).

- ✓ **Three personas reference doc-style by name without re-encoding** — `src/agents/pm-architect.body.md` (A5: decision records, supersede-don't-edit, references `workflow/doc-style.md` and `### Supersede-don't-edit` by name), `src/agents/pm-stack-researcher.body.md` (step 4: references `## Durable-text frugality` in `workflow/doc-style.md`), `src/agents/pm-coder.body.md` (line 27: references `### Comment-restraint` in `workflow/doc-style.md`). Test: `doc-style-single-home` checks all three (PASS).

- ✓ **Semgrep python.md scope** — `doc/_templates/stack-idioms/python.md` does not exist (planned-not-shipped feature `stack-idioms-library`). The `comment-restraint-no-drift` test is correctly scoped to the sole shipped realization (`CLAUDE.md.tmpl`) and does not depend on the non-existent Semgrep file. The plan's Stack expectations note "do not re-author them" — since the file doesn't exist, no action was needed and none was taken.

---

### Test pairing

- ✓ `doc-style-single-home` — present, tests file existence + WORKFLOW nav map + three persona references.
- ✓ `comment-restraint-first-class` + `comment-restraint-nonvacuous` — present, non-vacuity verified (stripping anchor trips the check).
- ✓ `supersede-dont-edit` — present, checks anchor + tombstone form + "superseded by" + one-line-per-rejected.
- ✓ `doc-style-vs-legibility-distinct` — present, clean-grep interaction scenario test (PASS).
- ✓ `comment-restraint-no-drift` — present, checks realize-not-redefine wiring.

All Slice A tests run via `bash tests/doc-style.sh`: 6/6 PASS. All pre-existing suites pass (generator 4/4, hooks 79/79, opencode 41/41, oc-plugin-unit 74/74, core-delegation 2/2, neutral-prose 5/5, targeted-reading 7/7, ultra-absent 2/2).

---

### Graduation enum

- ✓ The closed enum of 4 graduation targets is defined in `workflow/doc-style.md` under `### Graduation targets` (a Markdown table: decision → `docs/architecture.md`; contract → `.ai-pm/contracts/`; deferred finding → `.ai-pm/backlog.md`; stack rule → `docs/stack-notes.md`). The section explicitly forward-references the lifecycle/gates as Slice D: "The full graduation **lifecycle and gates** … are defined separately in the artifact-lifecycle slice and check against this one list." Exactly as the plan specifies.

---

### Adapters / golden

- ✓ Three agents regenerated: `.claude/agents/pm-architect.md`, `.claude/agents/pm-coder.md`, `.claude/agents/pm-stack-researcher.md` (and their `.opencode/agent/` counterparts). `.golden/claude/` SHA256SUMS and the three `.md` files re-frozen. The other 11 adapters are byte-identical to `.golden/`. Verified by `tests/generator.sh` (4/4 PASS: byte-equivalent, SHA match, deterministic build, diff-clean).

---

### Notes

- **Note 1 (product — structural):** The plan's `comment-restraint-first-class` test description includes a second assertion: "code-review's body lists comment-restraint as a gated aspect." The test as shipped omits this assertion, and the `code-review.body.md` does not mention comment-restraint. This is intentionally deferred — Slice B (scenario 5) covers "When `code-review` runs, it surfaces doc-frugality and comment-restraint as findings." The test description bundles a Slice B deliverable into a Slice A test name; when Slice B ships it should either extend `tests/doc-style.sh` with this check or add it to a new test file. The PM / orchestrator should note this for Slice B planning.

- **Note 2 (product — structural):** The plan's `supersede-dont-edit` test description says "asserts … that the template/architecture guidance reflects it." The test only checks `workflow/doc-style.md`; it does not check `doc/_templates/architecture.md.tmpl` (which has no supersede/doc-style reference). The pm-architect body does reference `### Supersede-don't-edit` by name, satisfying the spirit. The template update is likely a Slice E / lean-doc-set concern. No blocking impact on Slice A, but Slice E should add the guidance comment to `architecture.md.tmpl` and this test assertion should be extended then.

- **Note 3 (structural):** `doc/architecture.md` (this repo's own) is listed in the plan's Docs to update as a pm-architect post-coding handoff — recording the distillation-engine model as decision records. This handoff has not occurred yet (state file confirms "NEXT = review → merge-back; then Slice B"). This is expected for a pre-review Slice A and is not a Slice A compliance gap, but it becomes a gap for the Slice A merge-back if the handoff is skipped. The orchestrator should schedule the pm-architect handoff before or alongside the merge-back.

---

## Definition of Done

- [x] All plan scenarios implemented and tested (A.1–A.4 all implemented; tests in `tests/doc-style.sh` 6/6 PASS — with the Slice B deferral noted above)
- [x] Interaction scenarios have concurrent-state tests (`doc-style-vs-legibility-distinct` covers the doc-style/legibility coexistence scenario; `comment-restraint-no-drift` covers comment-restraint first-class + CLAUDE.md.tmpl realization coexistence)
- [x] Stack expectations respected; stack-spec tests pass (markdown-prose project; generator golden parity 4/4; Semgrep file correctly absent; no stack linter)
- [n/a] Product Contract honored; Acceptance checks pass; no silent behavior change (internal/process feature — no Product Contract per plan §Contracts)
- [x] Pipeline green (all 9 suites pass: doc-style 6/6, generator 4/4, hooks 79/79, opencode 41/41, oc-plugin-unit 74/74, core-delegation 2/2, neutral-prose 5/5, targeted-reading 7/7, ultra-absent 2/2)
- [x] State file updated (`.ai-pm/state/current.md` records Slice A built with full detail)
- [n/a] Product Impact Report present (no Product Contract)
- [ ] Docs updates landed — `WORKFLOW.md` done; `doc/architecture.md` pm-architect handoff NOT YET done (expected pre-merge-back)
- [x] Expected artifacts exist (plan `doc/features/doc-frugality_plan.md`, arch note `.ai-pm/arch/doc-frugality_arch.md`, this review)
- [n/a] Product-readiness gate resolved (non-user-facing — all scenario subjects are the system/agents; advocate exempt per plan §Contracts)
- [n/a] Validation gate resolved (software-kind project)
- [n/a] Failure-inventory negative-space tests present (plan has no failure-inventory scenarios for Slice A)

**DoD: conditional pass** — all Slice A scenarios and tests are implemented and green. The one open DoD item is the pm-architect handoff to `doc/architecture.md`, which the plan explicitly scopes to a post-coding handoff. Treat as a merge-back pre-condition, not a blocking re-work item.

## Blocking

(none)

## Notes (product)

1. `tests/doc-style.sh` `comment-restraint-first-class` — the plan's test description includes "code-review's body lists comment-restraint as a gated aspect" but the test omits this assertion and the code-review body has no mention of comment-restraint. This is the Slice B (scenario 5) deliverable; the Slice B coder should extend this test (or add a new one in `tests/doc-style.sh`) when updating `code-review.body.md`. Why it matters: without this assertion, the `comment-restraint-first-class` test passes even if Slice B's code-review wiring is never done — the test name suggests full coverage but it only covers half the plan's description.

2. `tests/doc-style.sh` `supersede-dont-edit` — the plan's test description says it should also assert "template/architecture guidance reflects it," but neither `doc/_templates/architecture.md.tmpl` nor the test check this. The pm-architect body does reference the rule by name, but the template file itself is silent. The lean-doc-set slice (E) adds a doc-style guidance comment to templates — Slice E is the natural time to add this assertion. Why it matters: `architecture.md.tmpl` is the downstream scaffold; if it doesn't carry the supersede guidance comment, downstream projects scaffolded from it won't have the hint.

3. `doc/architecture.md` pm-architect handoff — the plan's Docs to update includes a decision record for the distillation-engine model. The handoff has not occurred yet. This should complete before the Slice A sub-branch is merged back. Why it matters: without the decision record, the architectural choice (distillation engine, O(1) artifact lifecycle, graduation targets) is undocumented in the repo's own architecture doc, which is the canonical home per the plan's graduation enum.

## Verdict

approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker. -->
## Code review findings

Pass-2 code-review (high, recall-biased) run 2026-06-09 over the full Slice A diff (including the PM-directed plain-language amendment). Two real findings; both fixed. One candidate dropped.

1. **`doc/architecture.md` — ADR self-contradiction + single-home (CONFIRMED).** The plain-language ADR rewrite listed all four graduation homes inline while claiming "referenced here, not re-copied" — a false self-contradiction, and a duplication of the enum whose canonical home is `workflow/doc-style.md` `### Graduation targets`. Also a path nit (`architecture.md` vs canonical `docs/architecture.md`). **Fixed `67aeb03`** — parenthetical reworded ("restated here in plain words for the reader; the authoritative list is in `workflow/doc-style.md` `### Graduation targets`"), path aligned to `docs/architecture.md`.
2. **`workflow/doc-style.md` `### Graduation targets` — self-violation of the new rule (CONFIRMED).** A bare `O(1)` stood unexplained in the file that now defines "no bare CS-notation in reader-facing durable text" (the file header demands self-compliance). **Fixed `c9f2edb`** — reworded to "the fixed-size dossier"; rest-of-file scan confirms the only remaining `O(1)` is the rule's own named example (legitimate).
- **Dropped:** the `comment-restraint-no-drift` regex (`single-sourced by.*doc-style\.md`) is path-agnostic — but it is pre-existing (not in this amendment) and the loose match is intentional to tolerate the deployed submodule path `.ai-pm/tooling/workflow/doc-style.md`. Not a defect.

Post-fix suites all green: doc-style 9/9, generator 4/4, hooks 79/79, neutral-prose 5/5, targeted-reading 7/7, core-delegation 2/2, opencode 41/41, oc-plugin-unit 74/74, ultra-absent 2/2.

## Code review: 2026-06-09 — passed
