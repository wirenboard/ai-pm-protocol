## Plan compliance

### Scenario 10 — one transient dossier documented in `workflow/state.md`
- Implemented: `workflow/state.md` rewrites the archive paragraph to describe the one-dossier model. New sections `### One transient dossier per in-flight feature` and `### Distill on merge` added.
- Test: `tests/o1-lifecycle.sh` case `o1-artifact-lifecycle` — greps for `.ai-pm/features/<topic>.md`, `transient dossier`, reference to `### Graduation targets` and `workflow/doc-style.md`. PASS 4/4 confirmed live.

### Scenario 11 — distill-on-merge references `### Graduation targets` by name; dossier ceases to be maintained
- Implemented: `workflow/state.md` `### Distill on merge` references `### Graduation targets` in `workflow/doc-style.md` by name and does not re-list the enum. The dossier lifecycle (ceases to be maintained; git retains bytes) is stated.
- Test: same `o1-artifact-lifecycle` case above checks `### Graduation targets` by-name reference in `state.md`. PASS.

### Scenario 12 — `.ai-pm/tmp/` git-ignored (proportional minimum)
- Implemented at two levels: (a) this repo's `.gitignore` already carries `.ai-pm/tmp/`; (b) `src/commands/pm-bootstrap.body.md` carries a scaffold-the-ignore instruction in the greenfield, legacy-adoption, and codebase-reader scaffolding paths (line 94 / 184).
- The `.ai-pm/state/archive/` directory creation at line 88 and equivalent lines at 183 / 222 of `pm-bootstrap.body.md` survive in the bootstrap — these are the deferred Slice E template references (see Template/bootstrap deferral verdict below).
- Test: `o1-artifact-lifecycle` asserts `.ai-pm/tmp/` in `.gitignore` and that `pm-bootstrap.body.md` carries a scaffold-ignore instruction. PASS.

### Scenario 13 — pre-ship graduation gate as PROCEDURAL Step-6 gate
- Implemented: `workflow/pipeline.md` Step 6 replaces the archive procedure with the graduation checklist. The text explicitly names it "a procedural Step-6 gate, not a plugin deny", explains why (the plugin cannot verify semantic durable-bit presence), names `### Graduation targets` in `workflow/doc-style.md` as the reference list, and names the auditor git-aware graduation check (C.9) as the structural backstop.
- OpenCode orchestrator persona (`src/manifests/opencode/harness_local/body/ai-pm.body.md` `## Conditional steps are DEFAULT-ON`) echoes the same checklist, names the four graduation targets explicitly, and states "NOT a plugin deny ... the auditor's git-aware graduation check is the structural backstop after the dossier is gone."
- Test: `tests/o1-lifecycle.sh` case `graduation-gate-procedural` — greps pipeline.md and the OpenCode persona for graduation checklist, procedural-gate, not-a-plugin-deny, auditor-git-aware-check, and `### Graduation targets` reference. PASS.

---

## Supersede-loci checks

| Locus | File | Supersede applied? | Form correct? |
|---|---|---|---|
| 1 | `workflow/state.md` (archive→reset-to-idle) | Yes — archive assertion removed; "not curated into an archive directory — git already retains it incidentally; we keep no separate `.ai-pm/state/archive/`" | Current-state-only. No narrative. |
| 2 | `workflow/pipeline.md` Step 6 (archive→graduation checklist) | Yes — "I archive the state: copy … to `.ai-pm/state/archive/…`" replaced by graduation checklist + reset to idle | Current-state-only. No narrative. |
| 3 | `doc/architecture.md` ~83 (`### Execution State as the single source of progress`) | Yes — "there is no curated archive to keep" replaces the archive claim; done by `pm-architect` in commit `1d89f77` | Current-state-only. |
| 4 | `doc/architecture.md` ~529 (File layout downstream note) | Yes — `.ai-pm/state/archive/` dropped; `.ai-pm/features/<topic>.md` added as the in-flight transient dossier; done by `pm-architect` in commit `1d89f77` | Current-state-only. |
| 5 | `src/agents/pm-auditor.body.md` (confirm no archive dimension) | Confirmed no-op: grep of `pm-auditor.body.md` for "archive" returns empty — no archive-existence dimension present. No edit required. |
| 6 | `MIGRATIONS.md` supersede entry | Scope = Slice E (the arch note §5 explicitly lists this as locus 6 under Slice E). Not in Slice D. |

**Loci 1–4 clean. Locus 5 confirmed no-op. Locus 6 appropriately Slice-E-deferred.**

The `state-archive-superseded-clean` test in `tests/o1-lifecycle.sh` is scoped to `workflow/state.md` and `workflow/pipeline.md` only. This is the correct scope for Slice D: loci 3–4 (`doc/architecture.md`) are `pm-architect`'s parallel deliverable (different agent, different commit `1d89f77`) and are present in the diff. The test's comment explicitly records this scope choice and the full-repo sweep as a follow-up. Acceptable for Slice D — the two `doc/architecture.md` loci were applied in this same PR's commits, and the test's non-vacuity proof (injecting an affirmative phrase trips the scan) confirms the scan is live. No false sense of completeness.

Also checked the new ADR in `doc/architecture.md` (`### Keep only what's actually used; throw the rest away`): the supersede annotation names all six loci and states that the Slice D edits cover loci 1–4, with MIGRATIONS.md (locus 6) landing in Slice E — consistent with the plan and arch note §6.

---

## Template/bootstrap deferral verdict

**Verdict: plan-compliant deferral — not a Slice D gap.**

The `doc/_templates/state.md.tmpl` still carries archive instructions at lines 3 and 48 ("archived to `.ai-pm/state/archive/<topic>-<YYYY-MM-DD>.md`"). The `src/commands/pm-bootstrap.body.md` still creates the `.ai-pm/state/archive/` directory at lines 88, 183, and 222. These are live protocol surfaces that will tell a downstream project to do something the live rule now forbids.

The question is whether this self-contradiction is a Slice D gap or a legitimate Slice E deferral.

**Finding: legitimate deferral, but with one material condition.**

The arch note §5 explicitly lists the template as a separate item ("Note: `doc/_templates/state.md.tmpl` must also drop any archive instruction") and §6 places the lean-template-set entirely in Slice E. The plan scenario 12 scopes `.ai-pm/tmp/` git-ignoring to the proportional minimum — a bootstrap scaffold instruction — and explicitly states "the full lean template set is Slice E." The arch note §6 describes Slice E as "templates" and lists the MIGRATIONS.md locus-6 entry there too.

Deferral rationale holds because:
1. A downstream project running bootstrap after Slice D merges will get `.ai-pm/state/archive/` created AND the `state.md.tmpl` with archive instructions — but it will also get `workflow/state.md` and `workflow/pipeline.md` with the superseded rule. The bootstrap scaffolding is a one-time creation; the live rule governs ongoing behavior. A downstream developer reading the state template might be confused, but the protocol's operative prose (which agents read) is correct.
2. Slice E's explicit scope is the lean-template-set. The plan lists scenario 15 ("templates ship the lean standing-doc set") as Slice E. Fixing the templates now would be building Slice E out of order.
3. The arch note §5 footnote is a forward-pointer, not a blocking prerequisite for D — it says "must also drop" in the context of the complete supersede picture, acknowledged as a Slice E item.

**The condition:** the self-contradiction (rule says "no archive dir" while bootstrap creates one) is acknowledged and scoped. It is not invisible — the arch note names it explicitly, the plan's "Docs to update" section includes a MIGRATIONS.md entry (locus 6, Slice E) that downstream projects will consume. The risk is limited to the window between Slice D and Slice E shipping. Since these are slices of the same feature on the same integration branch (not two separate releases), that window is acceptable.

**Conclusion:** deferring the template and bootstrap archive references to Slice E is plan-compliant. The plan scenarios 12 (proportional minimum for tmp git-ignore) and 15 (lean templates = Slice E) make the split explicit. This is not a Slice D gap. **However**, when Slice E ships, fixing `state.md.tmpl` lines 3 and 48 and `pm-bootstrap.body.md` lines 88/183/222 is a hard prerequisite — the arch note §5 is unambiguous. The state.md.tmpl archive instruction is live in a shipped template; the MIGRATIONS.md locus-6 entry must accompany the template fix.

---

## `state-archive-superseded-clean` test scoping — acceptability

**Acceptable for Slice D.**

The test is scoped to the two files `pm-coder` authored (loci 1–2: `workflow/state.md` and `workflow/pipeline.md`). The `doc/architecture.md` loci 3–4 were authored by `pm-architect` in the same PR branch but as a separate parallel agent pass. The test comment is explicit: "the doc/architecture.md loci are pm-architect's (parallel agent) — out of scope here so the two agents do not race; a full-repo sweep is a follow-up." This is an honest scope declaration. Both loci 3–4 are verified clean in this review (grep above). The non-vacuity proof is live and correct.

The plan's interaction test `state-archive-superseded-clean` says "clean-grep for the old assertion" without specifying scope. The implemented scoped version is a proportional minimum for Slice D — it tests the files the Slice D `pm-coder` delivered, avoids racing with `pm-architect`'s parallel deliverable, and names the gap as a follow-up. Plan-compliant.

---

## Test non-vacuity assessment

`tests/o1-lifecycle.sh` runs 4 cases:

1. **`o1-artifact-lifecycle`** — 5 substantive greps (`.ai-pm/features/<topic>.md`, `transient dossier`, `### Graduation targets`, `workflow/doc-style.md` in state.md; `.ai-pm/tmp/` exact-line in `.gitignore`; bootstrap scaffold instruction via a compound grep). All non-trivial tokens.
2. **`state-archive-superseded-clean`** — uses `scan_archive()` which greps for `.ai-pm/state/archive/`, `archive the state`, `archived to` then filters negation cues. Non-vacuity: injects an affirmative archive phrase into a scratch copy of state.md and asserts the scan fires. The negation filter (`not curated|not archived|no separate|incidentally|never an archive`) is precise — it filters exactly the phrases the supersede prose uses. PASS.
3. **`state-archive-superseded-clean-nonvacuous`** — separate case proving the scan is live. PASS.
4. **`graduation-gate-procedural`** — 8 substantive greps (pipeline.md: graduation checklist, procedural gate, not-a-plugin-deny, git-aware graduation check, `### Graduation targets`; OpenCode persona: graduation checklist, `### Graduation targets`, NOT a plugin deny / procedural checklist). Non-trivial, non-vacuous.

All 4 cases pass. Non-vacuity is explicitly proven for the archive scan. The graduation-gate checks are non-trivial enough to catch a reversion.

---

## Interaction scenario coverage

Plan interaction scenario: "When the O(1) dossier model ships while `state-archive-home` is live: the supersede must be clean — `workflow/state.md` + `workflow/pipeline.md` Step 6 archive bullets are updated, not left contradicting."

Covered by `state-archive-superseded-clean` + the loci 1–2 supersede implementation. PASS.

---

## Generator golden parity

`tests/generator.sh` passes 4/4. The only golden hash change is `pm-bootstrap.md` (the bootstrap body was edited to add the `.ai-pm/tmp/` scaffold-ignore instruction) — consistent with the plan's scope. All other 13 generated files are byte-identical. SHA256SUMS re-frozen. PASS.

---

## Existing tests

All suites pass:
- `tests/hooks.sh` 79/79
- `tests/generator.sh` 4/4
- `tests/opencode.sh` 41/41
- `tests/oc-plugin-unit.js` 74/74
- `tests/core-delegation.sh` 2/2
- `tests/neutral-prose.sh` 5/5
- `tests/targeted-reading.sh` 7/7
- `tests/ultra-absent.sh` 2/2
- `tests/doc-style.sh` 12/12
- `tests/o1-lifecycle.sh` 4/4 (new, Slice D)

---

## Definition of Done

- [x] All plan scenarios implemented and tested — scenarios 10, 11, 12, 13 each have an implementation and a test case in `tests/o1-lifecycle.sh`
- [x] Interaction scenarios have concurrent-state tests — the `state-archive-superseded-clean` case covers the "O(1) model ships while state-archive-home is live" scenario
- [x] Stack expectations respected; stack-spec tests pass — generator golden parity confirmed; `generator.sh` 4/4; only `pm-bootstrap.md` golden changed as expected
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change — no Product Contract (process/internal feature, explicitly declared in plan § Contracts)
- [x] Pipeline green — all 10 test suites pass (confirmed live run)
- [x] State file updated — `.ai-pm/state/current.md` updated in commit `351d722` with Slice D build record
- [x] Product Impact Report present — n/a (no Product Contract)
- [x] Docs updates landed — `workflow/state.md`, `workflow/pipeline.md`, `doc/architecture.md` (two loci via pm-architect `1d89f77`), `doc/user-journeys.md` (pm-architect `7655caa`); MIGRATIONS.md locus-6 deferred to Slice E (plan-compliant)
- [x] Expected artifacts exist — plan (`doc/features/doc-frugality_plan.md`), this review, no Product Contract required (non-user-facing)
- [n/a] Product-readiness gate resolved — non-user-facing feature (all scenario subjects are the system/agents); exempt
- [n/a] Validation gate resolved — software-kind project; not applicable
- [n/a] Failure-inventory negative-space tests — plan has no failure-inventory scenarios (no external I/O failure modes listed); not applicable

**DoD: pass**

---

## Blocking

None.

---

## Notes (product)

1. `doc/_templates/state.md.tmpl` lines 3 and 48 and `src/commands/pm-bootstrap.body.md` lines 88, 183, and 222 still describe the archive model that Slice D supersedes at the rule level. A downstream project bootstrapped between Slice D and Slice E shipping will get conflicting instructions (the protocol rule says no archive dir; the bootstrap creates one; the state template instructs archiving on completion). The window is the time between Slice D's integration and Slice E's delivery. Since both are sub-branches of `feature/opencode-harness-support` this is contained, but the inconsistency would be live in the integration branch for any downstream developer reading the template. Slice E's template-fix obligation is unambiguous per arch note §5 — this note is to ensure it is not overlooked when scoping Slice E.

2. The `state-archive-superseded-clean` test does not cover the full repo (it intentionally scopes to `workflow/state.md` + `workflow/pipeline.md`). The test comment records the gap. A full-repo sweep (adding `doc/_templates/state.md.tmpl` and `src/commands/pm-bootstrap.body.md` to the scan after Slice E lands) should be the first new case in the follow-up. This is the Slice E completion signal for the supersede.

---

## Verdict

approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See the "Edit-ownership rule" in `workflow/enforcement.md` — the Pass-2 code-review
     trail is the single carve-out to "orchestrator does not edit content artefacts". -->
## Code review findings

Pass-2 code-review (high, recall-biased, 2 finder angles) run 2026-06-09 over the Slice D diff. One real finding; fixed. Two candidates dropped.

1. **`doc/architecture.md` — stale loci-count over-claim (CONFIRMED).** The distillation-engine decision record claimed all "six supersede loci … land in Slice D", but `MIGRATIONS.md` (locus 6) lands in Slice E per the plan §16 / arch note §5.6. **Fixed `8632139`** — corrected to "the five in-protocol loci land in Slice D; the `MIGRATIONS.md` entry lands in Slice E" (current-state-only).
- **Dropped ×2:** `doc/_templates/state.md.tmpl:3,48` still assert the archive model — but this is the template/scaffold deferral Pass-1 explicitly ruled plan-compliant (Slice E lean-template-set, arch note §5/§6); the obligation is tracked as Slice E's first task. Not a Slice D defect.

Plugin (h)-gate change verified comment-only (oc-plugin-unit 74/74, byte-behavior identical). Persona echo references the pipeline rule by name (no drift). Generator golden parity: only `pm-bootstrap.md` hash changed. Post-fix all 10 suites GREEN.

## Code review: 2026-06-09 — passed
<!-- The orchestrator replaces THIS WHOLE LINE with `## Code review: <date> — passed`
     only when code-review clears. Until then the section is UNSTAMPED: `pm-pr-prep`
     refuses to release it (step 0) and `pm-auditor` blocks on it (dimension 1).
     Never ship an empty `## Code review` heading — an empty section reads as
     "no findings / passed" to a quick eye or grep; `NOT YET RUN` reads as "not done". -->
