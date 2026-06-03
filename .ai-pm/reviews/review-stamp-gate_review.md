# review-stamp-gate — plan-compliance review

## Plan compliance

- ✓ Scenario 1 (Loud incompleteness marker) — `.claude/agents/pm-plan-checker.md` template now writes `## Code review: NOT YET RUN` (never an empty `## Code review` heading), with an inline comment defining stamped vs unstamped; "File ownership" prose reflects the born-honest marker.
- ✓ Scenario 2 (Contradiction removed + ownership reframed) — `WORKFLOW.md` § "Edit-ownership rule" reframed to "orchestrator writes the outputs of the processes it drives" and adds an explicit carve-out: `pm-plan-checker` owns through `## Verdict`, orchestrator owns ONLY the `## Code review` trail. The same model lands in `doc/architecture.md` § "Edit-ownership split".
- ✓ Scenario 3 (Hard pre-merge gate) — `.claude/agents/pm-pr-prep.md` new "### 0. Pre-flight: code-review stamp gate", keyed on `## Code review` section PRESENCE, with a BLOCKED report naming the feature; Hard-rule line added.
- ✓ Scenario 4 (Auditor backstop) — `.claude/agents/pm-auditor.md` dimension 1 gains an unstamped-`## Code review`-section == blocking bullet ("empty == unstamped == blocker"); reuses dimension 1, no new dimension.
- ✓ Scenario 5 (DoD ordering corrected) — `WORKFLOW.md` Step 5 Pass 2 states "Pass 2 is NOT complete until the stamp is written" and that the binary check lives at the gate (after the last action), not in the Pass-1 DoD.
- ✓ Scenario 6 (Downstream migration) — `MIGRATIONS.md` adds a `### Pending-migration detection` condition (positive presence of an unstamped heading) and an idempotent loud-marker normalization procedure performed by the orchestrator (per the carve-out).
- ✓ Scenario 7 (Protocol-gap feedback obligation) — `WORKFLOW.md` new "## When the protocol itself has a gap" section: fixed shape (Symptom / Root cause / Minimal fixes / Protocol files touched), artefact path `.ai-pm/protocol-feedback/<topic>.md`, never edits `.ai-pm/tooling` in place.

### Plan-specific editorial checks (Test plan)

- ✓ Carve-out and Step 5 Pass 2 no longer contradict each other. The edit-ownership rule and `doc/architecture.md` both name `.ai-pm/reviews/` everything-through-`## Verdict` as agent-owned and the `## Code review` trail as the single orchestrator-owned section; Step 5 tells the orchestrator to stamp exactly that trail. No file is simultaneously "orchestrator must not touch" and "orchestrator must stamp".
- ✓ Gate keyed on `## Code review` section presence, no filename special-casing. `pm-pr-prep` step 0 stamp grep `^## Code review(:.*)?$` matches the stamp line and structurally excludes `## Code review findings` (commit `44b92ef`). Section-absent (`fixup-*_review.md`) is the stated exemption.
- ✓ Auditor rule encodes "unstamped == blocking" and reuses dimension 1, not a new dimension.
- ✓ Migration detection uses positive presence of an unstamped heading; procedure is idempotent — never rewrites a `passed` stamp nor an existing `NOT YET RUN` marker; matches the single-source-of-conditions convention (`### Pending-migration detection` + procedure below) already in `MIGRATIONS.md`.
- ✓ Protocol-feedback section names a fixed report shape and an orchestration-artefact path, consistent with the reframed orchestrator-writes model.

### Interaction scenarios (editorial coverage)

- ✓ gate-blocks-unstamped — `pm-pr-prep` step 0: STOP + BLOCKED report naming the feature.
- ✓ gate-exempts-fixup — `pm-pr-prep` step 0: section-absent file is exempt.
- ✓ auditor-blocks-unstamped — `pm-auditor` dimension 1: unstamped == blocking; stamped == clean; section-absent not flagged.
- ✓ migration-idempotent — `MIGRATIONS.md` procedure step 2: no-op on already-`passed` or already-`NOT YET RUN`.

### Product Contract

No Product Contract touched — this is a docs-only / infrastructure change (protocol-spec prose + agent prompts). Plan classifies it mechanically docs-only under "Mandatory-table classification". No user-facing feature, no contract, no Product Impact Report required (backend/docs-only — stated explicitly).

### Stack expectations

Plan declares "Stack expectations touched: None" — no library, hook, schema, or external artefact; no `docs/stack-notes.md` component touched. Confirmed: no hook or test file changed on the branch.

## Definition of Done

- [x] All plan scenarios implemented and tested (editorially — all 7 realized; verification is editorial per Test plan, no executable tests)
- [x] Interaction scenarios have concurrent-state tests (editorial coverage of all four interaction scenarios)
- [x] Stack expectations respected; stack-spec tests pass (none applicable — no stack component touched)
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change (no Product Contract touched — docs-only)
- [x] Pipeline green (`tests/hooks.sh` 71/71; no hook touched, so unaffected)
- [x] State file updated (`.ai-pm/state/current.md` present and current)
- [x] Product Impact Report present when contract touched (N/A — no contract touched)
- [x] Docs updates landed (`doc/architecture.md` § "Edit-ownership split" updated on this branch — carve-out + reframed model + protocol-gap mechanism)
- [x] Expected artifacts exist (plan `doc/features/review-stamp-gate_plan.md`, this review; no contract — not user-facing)

**DoD: pass**

## Blocking

None.

## Notes (product)

None. Scope matches the plan exactly: WORKFLOW.md, the three agent prompts, MIGRATIONS.md, and the planned `doc/architecture.md` docs update. The branch also re-opens backlog line 33 and records downstream wb-mqtt-matter lessons in `.ai-pm/backlog.md` — these are orchestration-artefact bookkeeping the plan's Context and Out-of-scope already anticipate (edit-guard re-opened separately, whole-system-property gaps deferred to `/pm-plan`), not an unplanned scope expansion of this feature.

## Verdict

approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See WORKFLOW.md "Edit-ownership rule" — the Pass-2 code-review trail is the single
     carve-out to "orchestrator does not edit content artefacts". -->

## Code review findings

Round 1 (`code-review`, 2026-06-04) — 1 finding (low). The claimed High markdown-fence
break in `pm-plan-checker.md` was verified and **refuted** (the trail headings sit inside
the ```` ```markdown ```` fence, lines 93–132; render is correct).

- **CR1 (low) — `.claude/agents/pm-pr-prep.md:33`: the illustrative stamp-gate grep
  locates the heading but does not test for the stamp.** `grep -nE '^## Code review(:.*)?$'`
  matches `## Code review: NOT YET RUN` and `## Code review: <date> — passed` identically —
  it only confirms the *heading exists*. Read in isolation (without the prose rule on line 36),
  an implementer could treat a match as "stamped present" and let an unstamped feature pass —
  the exact failure this gate exists to prevent, ironically located in the gate itself. The
  validating rule is correct in prose; the snippet should be self-sufficient. **Fix:** make the
  illustrative snippet test for the stamp, not the heading — a section is stamped iff
  `grep -qE '^## Code review:.*— passed$' "$f"` matches; if a `## Code review` heading exists
  without that, it is unstamped → block. Keep the prose rule (line 36) as the normative spec.

Round 2 (re-verify, 2026-06-04) — CR1 fixed in `d77ce8c` (the stamp-gate snippet now
positively tests for the `— passed` stamp, not just the heading presence); re-verified
against all four heading forms, no new findings. Clean.

## Code review: 2026-06-04 — passed
