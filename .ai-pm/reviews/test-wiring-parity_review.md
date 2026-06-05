# test-wiring-parity — Pass-1 plan-compliance review

Plan: `doc/features/test-wiring-parity_plan.md`
Branch: `feature/test-wiring-parity`
Diff: `.claude/commands/pm-plan.md`, `.claude/agents/pm-plan-checker.md`, `doc/architecture.md` (+ in-process `.ai-pm/backlog.md`, `.ai-pm/state/current.md`)

## Plan completeness

- Stack expectations: none touched — markdown command/agent prose, no library/format/external-system idiom. Empty section is correct, no blocking.
- Interaction scenarios: `Provably isolated` declared and accurate — prose edits in two protocol-source files, no shared mutable state / concurrency / I/O. No blocking.
- Not a security-bearing project (no `docs/threat-model.md`) and not a `hotfix-` topic — those completeness gates do not fire.
- `Source:` provenance present, not `selected autonomously` (PM-named feature) — selection-citation backstop does not fire.

## Plan compliance

- ✓ **Scenario 1 — `/pm-plan` gains a Test-wiring-parity rule.** Added at `.claude/commands/pm-plan.md:271`, a sibling of the Stack-spec test rule (line 269). Covers the trigger (init/registration/wiring-order dependence), the ≥1-test requirement driving the production registration path, the observable-post-condition assertion (`registerX()` → `container.has(X)`), and the "not a hand-rolled equivalent" prohibition. The three existing test rules — Test plan rule (:265), Interaction scenario test rule (:267), Stack-spec test rule (:269) — are byte-unchanged. Verification: editorial (markdown-prose repo, no runtime to host an automated "did the plan include a wiring-parity test" check — documented boundary, plan Test plan).
- ✓ **Scenario 2 — `pm-plan-checker` enforces it (blocking).** Added under "Implementation compliance" (`.claude/agents/pm-plan-checker.md:39`) as a **blocking** clause framed "the test measures a path the app never takes," explicitly in the same family as the Stack-spec test rule. The existing scenario+test blocking line (:37) and the Diff-noise structural note (:41) are both preserved — the new clause sits between them, an addition, not a replacement.
- ✓ **Scenario 3 — single-sourced.** The full rule text lives once in `/pm-plan` (:271); the checker clause ends "Enforce the `/pm-plan` Test-wiring-parity rule by name — do not re-encode it here (single-source: the rule lives in `/pm-plan`; the checker enforces its presence)." The checker states trigger + verdict but defers the rule definition. No duplication.
- ✓ **Scenario 4 — proportional / judgement-triggered.** Both the rule and the arch record frame the trigger as a semantic judgement in the NFR / state-model / security-surface family (no hook, silent when the trigger does not hold). No new mandatory `## ...` plan section was added to the `/pm-plan` skeleton; a non-wiring feature (pure function, self-contained transform) is not burdened or flagged.

**Categorical coverage:** the wiring-dependent / non-wiring pair is fully covered — scenario 2 = wiring-dependent → blocking; scenario 4 = non-wiring → silent. No silently-implemented sibling.

**Docs to update:** `doc/architecture.md` decision record landed under `## Architectural decisions` (rule + checker enforcement; judgement-triggered/no-hook; single-sourced; sibling of the Stack-spec rule; "moves a slice of Step 5.5 earlier"; Pass-2 half out of scope; `Source:` line present). README correctly **not** touched — no install/quickstart/architecture-one-liner/doc-pointer change, README-currency trigger does not fire.

**Out of scope intact:** the `code-review` "test initializes differently than `main` → finding" half is recorded as a known limitation (plan Out of scope + arch record "Recorded as a known limitation, not silently dropped") — `code-review` is a built-in engine, not protocol-reprogrammable, so it is correctly not baked in. Step 5.5 unchanged; the diagnostic-flow item untouched (separate backlog entry); no new judgement-triggered section; no mechanical auto-detect of wiring-dependency.

**Product Contract:** no Product Contract touched — dogfood repo has no user-facing contracts by design. All scenario subjects are non-human (`/pm-plan`, `pm-plan-checker`, "a feature") → the feature is non-user-facing, so product-readiness / advocate gate is **n/a** (exempt, no advocate artifact required). software-kind project → `## Code review` stamp applies (left for Pass-2).

**Structural / wire-token notes:** none — no contract PM-facing sections changed; the architecture record is the intended token-free home for the technical detail.

**Dogfood changeset hygiene (now in force):** clean. The two source edits are pure +2-line additions with no reflow of untouched lines; `doc/architecture.md` is +10 (the docs deliverable). `.ai-pm/backlog.md` (+30, the two PM-relayed feedback entries) and `.ai-pm/state/current.md` (rewrite) are in-process artifacts the orchestrator owns, not feature source — not flagged. No cosmetic churn, no reordering, no drive-by edits beyond the four scenarios.

**Pipeline:** `bash tests/hooks.sh` → 73/73, no hook touched.

## Definition of Done
- [x] All plan scenarios implemented and tested (editorial verification — documented no-automated-test boundary for markdown-prose repo)
- [x] Interaction scenarios have concurrent-state tests (none — `Provably isolated`)
- [x] Stack expectations respected; stack-spec tests pass (none touched)
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change (no Product Contract touched)
- [x] Pipeline green (hooks.sh 73/73)
- [x] State file updated (`.ai-pm/state/current.md` reflects this feature)
- [x] Product Impact Report present (n/a — no contract touched)
- [x] Docs updates landed (`doc/architecture.md` decision record; README correctly not touched)
- [x] Expected artifacts exist (plan, this review; no contract — not user-facing)
- [n/a] Product-readiness gate resolved (all scenario subjects non-human — exempt)
- [n/a] Validation gate resolved (software-kind project — no `## Validation` section)

**DoD: pass**

## Blocking
(none)

## Notes (product)
1. The `code-review` "test wired differently than `main` → finding" half of the originally-proposed defense is deliberately left out of scope (built-in engine, not protocol-reprogrammable) and recorded as a known limitation in both the plan and the architecture record. Net effect: the wiring-parity defense lands at plan-time + Pass-1 only, not inside the Pass-2 built-in engine. Why it matters: the safety net is one layer thinner than the PM's original sketch — intentional and documented, but worth the PM consciously confirming the Pass-1-only coverage is acceptable. Step 5.5 ("run it for real") remains the ultimate catch.

## Verdict
approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See the "Edit-ownership rule" in `workflow/enforcement.md`. -->
## Code review findings
`code-review` (built-in, high effort) over the diff (`pm-plan.md`, `pm-plan-checker.md`).

**Finding 1 (single-source drift — fixed).** `.claude/agents/pm-plan-checker.md` — the Test-wiring-parity clause said *"do not re-encode it here (single-source: the rule lives in `/pm-plan`)"* yet **re-encoded the trigger definition** — the "wiring-dependent" example list (provider on a shared singleton / side-effect import / plugin-factory hook / env-DI) already lives verbatim in the `/pm-plan` rule. The list in two places is a drift surface, and the clause contradicted its own "do not re-encode" instruction. Fix: trimmed the checker clause to **reference** the `/pm-plan` "wiring-dependent" definition by name (no re-listed examples), keeping its own enforcement substance — blocking when a wiring-dependent feature's tests bypass the production registration path, with the "measures a path the app never takes" rationale and the Stack-spec-family note. Resolved by a pm-coder fix; re-reviewed clean.

## Code review: 2026-06-05 — built-in code-review (high effort), 1 finding fixed (single-source) — passed
