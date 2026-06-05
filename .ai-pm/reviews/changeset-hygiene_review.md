# changeset-hygiene — Pass-1 plan-compliance review

Plan: `doc/features/changeset-hygiene_plan.md` · Branch: `feature/changeset-hygiene` · Kind: software (no `doc/threat-model.md` → not security-bearing; no `.ai-pm/contracts/` → no Product Contract).

## Plan completeness
- ✓ Stack expectations: plan declares "(none — Markdown agent/convention prose)"; no stack-notes component touched — section present, correctly empty.
- ✓ Interaction scenarios: `Provably isolated:` declared (convention prose, no shared state / concurrency / I/O). The one adjacency (scenario 2 ↔ existing scope-expansion note) handled editorially as an addition.
- ✓ Categorical coverage: the A→B→C track's siblings (B linters #218/#211, C idioms #227) and the deeper #386 comment-restraint rubric are each listed under Out of scope with a reason. No sibling silently implemented.
- n/a Security-relevant-surfaces docs-update gate — non-security project (no `doc/threat-model.md`).

## Plan compliance
- ✓ **Scenario 1 — changeset carries only plan-serving hunks** — `pm-coder.md` step 6 (line 30) sharpened IN PLACE: cosmetic-only / whitespace / reformat-of-untouched-lines / reordering / opportunistic micro-opt excluded "even when they look harmless"; necessary-incidental carve-out present. Step 34 (line 34) sharpened to route worthwhile unrelated finds (functional OR cosmetic) to the report (→ backlog), not the diff. Atomic-commit step 10 unchanged. Not duplicated. Verification editorial (no runtime test — correct for markdown prose).
- ✓ **Scenario 2 — reviewer surfaces diff-noise as a structural note** — `pm-plan-checker.md` "Implementation compliance" (line 39) gains **Diff-noise structural note (non-blocking)** beside the preserved feature-scope-expansion note; wire-token-note shape, "structural, not prose-policing, never a hard block." Feature-scope-expansion note preserved.
- ✓ **Scenario 3 — human-facing text read-before-ship / rewrite-if-unclear** — `workflow/pm-comms.md` gains single-source `## Human-facing text legibility` (line 50), distinct from the untouched `## How to talk to the PM` (line 3, governs live chat). Read-before-ship, rewrite-if-unclear, never-paste-verbatim all present; #386 deeper rubric flagged out of scope. Referenced by name from `pm-pr-prep.md` step 4 (line 117). See Notes 2 + 3 on reference precision.
- ✓ **Scenario 4 — necessary incidental changes are NOT noise** — categorical "not strip-everything" boundary present in BOTH the coder rule (`pm-coder.md` line 30 parenthetical) and the plan-checker note (`pm-plan-checker.md` line 39 "Necessary incidental changes are NOT noise and are NOT flagged").
- ✓ **Single-source / split-source discipline** — legibility rule lives once (pm-comms.md) and is referenced by name (not re-encoded) in pm-pr-prep. Diff-noise rule split source-side (pm-coder) vs reviewer-side (pm-plan-checker) without duplicating the full rule.
- ✓ **Docs landed** — `doc/architecture.md` decision record `### Changeset hygiene: …` present (line 298+) under `## Architectural decisions`: three disciplines, soft/non-blocking framing in the soft-enforced+single-sourced family, A→B→C sequencing. README correctly NOT touched (no install/quickstart/architecture-one-liner/doc-pointer change — README-currency trigger does not fire).
- ✓ **Test plan** — no new automated test (markdown protocol-discipline prose, no runtime/linter to host it — documented boundary matching the engine-selection / audit-scope-menu precedent). `bash tests/hooks.sh` re-run: **73/73 green** (no hook touched).
- ✓ **Scope / Out-of-scope intact** — no linter added (not B), no idioms library (not C), no code-readability-of-code rule, no #386 comment-restraint rubric, no hard block on diff-noise (it is a non-blocking note + no hook).
- ✓ **Dogfood — this diff is itself clean** — 38 insertions across 6 files; every hunk traces to a scenario or the docs-to-update list. No reflowed untouched lines, no whitespace churn, no drive-by edits beyond the four scenarios. The feature does not self-contradict.

## Product Contract
No Product Contract touched — no-contract dogfood repo (no `.ai-pm/contracts/`), and all scenario subjects are the system/agent/artifact, not a human role. Advocate gate **n/a** (exempt, non-user-facing).

## Definition of Done
- [x] All plan scenarios implemented and tested (editorial verification; no runtime test by documented boundary)
- [x] Interaction scenarios have concurrent-state tests (n/a — `Provably isolated:` declared)
- [x] Stack expectations respected; stack-spec tests pass (n/a — none touched)
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change (n/a — no contract; no user-visible behavior)
- [x] Pipeline green — `tests/hooks.sh` 73/73; no stack linter in this repo by design
- [x] State file updated — `.ai-pm/state/current.md` reflects all 4 scenarios + pm-architect record landed
- [x] Product Impact Report present (n/a — no contract touched)
- [x] Docs updates landed — `doc/architecture.md` decision record on this branch; README correctly untouched
- [x] Expected artifacts exist — plan + this review (no contract: not user-facing)
- [n/a] Product-readiness gate (user-facing only — every scenario subject is non-human; exempt)
- [n/a] Validation gate (documentation-kind only — this is software-kind)

**DoD: pass**

## Blocking
(none)

## Notes (product)
1. **Architecture record overclaims a `pm-coder` reference that did not land.** `doc/architecture.md` line 300 states the legibility rule is "referenced **by name** from `pm-coder` (comments) and `pm-pr-prep`" — but `.claude/agents/pm-coder.md` contains **no** reference to `### Human-facing text legibility` (only the scenario-1 diff-scope sharpening landed there). The plan body did not mandate a pm-coder reference (Existing-behaviors line 14 lists pm-coder for diff-scope only; line 17 lists pm-pr-prep for the legibility reference), so this is not a missing scenario — it is a doc-accuracy slip in the landed decision record, on the one feature whose subject is reviewability. Why it matters: the architecture record is now factually inconsistent with the code; a colleague reading the record will expect a pm-coder comment-discipline pointer that isn't there. PM to decide: either add the by-name reference to pm-coder (closing the gap the record already promises — comments are exactly the durable-text case the legibility rule names), or correct the record to drop the `pm-coder (comments)` claim.
2. **Reference anchor cites `### ` but the heading is `## `.** The subsection landed as `## Human-facing text legibility` (H2, structurally correct as a sibling of `## How to talk to the PM` in the same file), but every by-name reference cites `### Human-facing text legibility` (`pm-pr-prep.md` line 117, `doc/architecture.md` line 300, plan scenario 3). The protocol's stated resolution convention ties the cited hash-level to the actual heading level (e.g. `### Decision authority` is cited `### ` and is an H3) — so this is a real anchor-precision inconsistency, though the reference still resolves by identical section name. Why it matters: a structural slip in a feature explicitly about precision/reviewability (dogfood). PM to decide: align the references to `## ` (or promote the heading to `### ` under a parent) so the anchor convention holds.

## Verdict
approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker. -->
## Code review findings
`code-review` (built-in, high effort) over the full diff (`pm-coder.md`, `pm-plan-checker.md`, `pm-comms.md`, `pm-pr-prep.md`, `doc/architecture.md`). **No defects (`[]`).**

Markdown protocol-discipline prose — no executable logic. Traced for cross-ref consistency, single-source integrity, and dogfood:
- **Anchor consistency:** every reference to the legibility rule cites `## Human-facing text legibility` (H2) — pm-coder (comments), pm-pr-prep (CHANGELOG/PR), the pm-comms self-reference, and the architecture record (Pass-1 precision slip `###`→`##` fixed). No dangling/mismatched anchor.
- **Cross-ref:** the pm-plan-checker diff-noise note cites "the wire-token structural note below" — the wire-token note is indeed further down in Product Contract compliance. Correct.
- **Single-source:** the legibility rule is stated once (`workflow/pm-comms.md`), referenced by name elsewhere, never re-encoded; the diff-noise rule is split source-side (pm-coder) vs reviewer-side (pm-plan-checker) without duplication.
- **Carve-out:** the "necessary incidental edits are not noise" boundary is present in both the coder rule and the reviewer note (scenario 4).
- **Dogfood:** the diff is itself clean (24 insertions / 2 deletions, no cosmetic churn, no reflowed untouched lines) — the feature practices what it preaches.
- Pass-1's two precision notes were resolved (the pm-coder by-name reference now exists; the anchor level is `##` everywhere).

## Code review: 2026-06-05 — built-in code-review (high effort), no defects — passed
