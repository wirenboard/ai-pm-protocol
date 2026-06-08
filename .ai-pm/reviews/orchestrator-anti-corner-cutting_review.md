# Plan-quality review — orchestrator-anti-corner-cutting (pre-coding)

This is a **pre-coding plan-quality check** (no implementation exists yet — both
`doc/features/orchestrator-anti-corner-cutting_plan.md` and the arch note are
untracked). The DoD checklist below is read as **plan-completeness**, not
implementation compliance.

## Plan completeness
- ✓ Three pieces named; each with scenarios.
- ✓ Failure-inventory scenarios are first-class (scenarios 1–4: failure / refusal / crash → retry N=2 → STOP+report → never-substitute verdict/code/stamp/merge), with the load-bearing "failed = missing, never a pass" rule stated.
- ✓ Spike gate for the chat-hook reminder is explicit and the plan does NOT commit to shipping it pre-spike (scenario 10 + the `oc-route-reminder-spike` guarded-skip runtime gate + the named fallback "stay on the always-on `instructions`/`AGENTS.md` surface", not a silent no-op hook).
- ✓ Stack expectations cite stack-notes rules with source URLs and **correct** confidence tags: `tool.execute.before` and ESM single-export `execution-verified (1.16.2)`; subagent containment (4b) `execution-verified (1.16.2, pinned)`; message/prompt-injection (10) correctly `doc-cited (unverified)` / `to-verify`. Matches `doc/stack-notes.md` verbatim.
- ✓ Interaction scenarios section present with the not-provably-isolated declaration and three shared-state scenarios.
- ✓ Docs-to-update names `doc/architecture.md` (pm-architect post-coding decision record), `workflow/enforcement.md`, and `doc/stack-notes.md` for BOTH the known-limitation note AND the to-verify→execution-verified flip after the spike.
- ✓ Out-of-scope honestly lists the residual persona-only verdict-self-substitution gap, the OpenCode SQLite bug, the Claude-side deferral, and the categorical failure-kind siblings (failure/refusal/crash treated uniformly).
- ✓ Non-user-facing confirmed: every scenario subject is the orchestrator / plugin / subagent (the system), no human role → advocate (Step 3.5) gate correctly not required. Product-readiness gate `n/a`.
- ✓ Software-kind project (CLAUDE.md `## Project kind: software`; no `docs/threat-model.md`) → no `## Validation` section, no security-surface block.

## Slice-order consistency (the headline finding) — RE-CHECK: CLOSED
- ✓ **Plan header now states the build order unambiguously and reconciles the arch-vs-plan numbering.** Plan line 18: "Build order (this plan's numbering): 1 → 2 → 3. This equals the arch note's recommended order (failure-path → artifact-gate → reminder)." The note then explains the numbering difference explicitly — "the arch note numbers the reminder as its piece 2 and the gate as its piece 3, so the arch note writes the same order as '1 → 3 → 2'; THIS plan renumbers so the build order matches the numbering (1 failure-path, 2 artifact-gate, 3 reminder)."
- ✓ The arch note's "1 → 3 → 2" (arch line 409) is correctly mapped: arch Piece 1 = failure-path, Piece 2 = reminder, Piece 3 = gate → arch order = failure-path → gate → reminder. Identical physical order to the plan's "1 → 2 → 3" under the plan's own numbering.
- ✓ Piece 3 (the route-reminder) is explicitly sequenced LAST because spike-gated ("piece 3 is sequenced LAST because it is spike-gated … do not build it before the spike passes"). Matches the arch rationale that the high-confidence, no-spike pieces land first.
- ✓ No remaining contradictory "1 → 3 → 2" token under the plan's OWN numbering: the single occurrence of that token is attributed by name to the arch note's numbering. Grep confirms only one `1 → 3 → 2` (arch-attributed) and one `1 → 2 → 3` (plan's own).

## Interaction-scenario test pairing — RE-CHECK: CLOSED
- ✓ The Test plan now carries a dedicated "Interaction scenario tests (one per Interaction scenario)" block (plan lines 83–86).
- ✓ Interaction scenario 2 (merge-deny during a believed-stamped autonomous ship = "stop and report", NOT retry-loop) is paired with `oc-gate-deny-is-stop-not-loop` — a persona prose-grep asserting a denied pre-ship merge = "gate not satisfied → stop and report to the PM", explicitly NOT a retry-loop. This now exercises the no-retry-loop post-condition that the prior single-deny test did not.
- ✓ Interaction scenario 3 (a half-stamped artifact left by a failed run must not be misread as satisfied) is paired with `oc-gate-partial-stamp-denied` (`tests/oc-plugin-unit.js`) — a PARTIALLY-stamped review artifact (plan-checker stamped but `## Code review: NOT YET RUN`) read by the pre-ship gate as UNSATISFIED → merge THROW. This sets up the post-condition state the rule requires.
- ✓ Interaction scenario 1 (chat-map vs concurrent subagent) explicitly noted as covered by `oc-route-reminder-agent-scoped` + the spike's containment step — acceptable, as accepted in the prior verdict.

## Definition of Done (read as plan-completeness)
- [x] All plan scenarios specified and have a planned test (scenarios 1–10)
- [x] Interaction scenarios have planned concurrent-state tests (all three now paired; see RE-CHECK above)
- [x] Stack expectations cited with sources + correct confidence tags; stack-spec test discipline (version pin, source URLs in comments) specified
- [x] Product Contract: no Product Contract touched (backend/protocol-internal; non-user-facing)
- [x] Pipeline tests enumerated (existing must-pass list + new tests per piece)
- [x] State-file update implied (spike outcome recorded in `.ai-pm/state` per Docs/spike)
- [x] Docs updates listed (architecture.md, enforcement.md, stack-notes.md, AGENTS.md)
- [x] Expected artifacts: plan + arch note present; this review; no contract needed (non-user-facing)
- [n/a] Product-readiness gate (user-facing only) — non-user-facing, advocate not required
- [n/a] Validation gate (documentation-kind only) — software-kind
- [x] Failure-inventory negative-space tests: present for the deny-side consequences (`oc-gate-merge-deny-unstamped`, `oc-gate-precode-no-plan-deny`); the persona failure paths are grep-presence tested per the arch note's "persona text, not unit-testable" rationale (see Note 1)

**DoD: pass** (both prior blocking gaps verified closed; no other change of substance)

## Blocking
(none — the two prior blocking gaps are closed)

1. ~~Slice-order contradiction (`...plan.md:16` + "## The three pieces" header)~~ — **CLOSED.** Header now states build order `1 → 2 → 3` (failure-path → artifact-gate → reminder) unambiguously, explains the arch-vs-plan numbering difference, and sequences the spike-gated reminder last. No contradictory token under the plan's own numbering.
2. ~~Two interaction scenarios without a paired test (`...plan.md:63-64`)~~ — **CLOSED.** Interaction scenario 2 paired with `oc-gate-deny-is-stop-not-loop` (persona prose-grep, no-retry-loop post-condition); interaction scenario 3 paired with `oc-gate-partial-stamp-denied` (plugin unit test, half-stamped → deny); scenario 1 noted covered by `oc-route-reminder-agent-scoped` + spike containment.

## Notes (product)
1. Piece 1 (the failure-path state machine) is **persona text**, tested only by a single bundled grep (`oc-failure-path-persona` covering scenarios 1–4) plus the deny-side consequence backstops. This matches the arch note's explicit rationale (a crashed `task` is not a subsequent tool call a plugin can deny → not unit-testable). It is the honest mechanism, but the PM should be aware that the never-self-substitute rule for a NON-ship-gating step has no structural backstop at all (correctly listed in Out of scope) — it rests entirely on the weak model honoring persona text, which is the very failure this feature responds to. The per-prompt reminder (spike-gated, may not ship) is the only added reinforcement, and it is the least-certain piece. Worth a conscious PM acknowledgement that the highest-value structural guarantees here are the merge-gate and the existing write-deny; the verdict-substitution gap is mitigated, not closed.
2. The plan folds a "persona-strengthening rider" (default-on conditional steps) across pieces — not numbered as a scenario but tested by `persona-conditional-default-on`. Scope is coherent with the backlog item; flagging only so the PM notes the rider rides along with the three pieces rather than being a separate slice.

---

## EXTENSION (2026-06-08) re-check — one core invariant + the stale-artifact variant

Scope of THIS re-check: ONLY the `## EXTENSION (2026-06-08)` section of the plan (lines 16–50) + the reframed pieces. Pieces 1–3 and scenarios 1–10 below the extension are already-validated/shipped context (above) and were not re-litigated. Design source verified against the arch note's "EXTENSION — stale-artifact reuse" + "CORE HOIST — Delegation & gate integrity" sections, and against the live canon (`WORKFLOW.md:13` Edit-ownership invariant + `:9` boundary criterion; `workflow/enforcement.md` lines 9–17 the edit-ownership full rule + its two carve-outs + the Orchestration-artefacts list).

### Extension compliance
- ✓ **CORE HOIST (Piece 0) matches the arch note's ABSORB decision.** Plan lines 24, 34 generalize the always-on Edit-ownership invariant → **Delegation & gate integrity** in `WORKFLOW.md` (kernel) + `workflow/enforcement.md` (full rule), with Edit-ownership **demoted to the edit-route instance** ("the edit-route instance" / "demoted"). This is verbatim the arch §1 ABSORB decision (arch lines 710–748: "ABSORB … rename/generalize the existing always-on heading … Edit-ownership one named instance … do NOT add a second sibling"). No sibling-invariant drift — plan is single-rule, matching the arch's anti-drift rationale.
- ✓ **Kernel one-liner carries all four required elements.** Plan lines 24–25 (drawn near-verbatim from arch §2, lines 764–778): (1) gate = fresh spawn this turn ("A gate is satisfied only by a fresh spawn of the owning agent this turn"); (2) never produce/paraphrase/reuse/skip ("never produces, paraphrases, reuses, or skips an autonomous agent's deliverable by any route"); (3) existing-artifact ≠ this-run ("an artifact already on disk is evidence of a prior run … failed / missing / already-existing / skipped all count as 'not run'"); (4) pointer to the full rule (`workflow/enforcement.md`). The kernel also names the carve-out surface inline (backlog / PM decisions / Pass-2 `## Code review` trail / advocate `## Resolutions` / protocol-gap / git ops) — the same depth discipline as the current Edit-ownership bullet at `WORKFLOW.md:13`.
- ✓ **Carve-outs explicitly PRESERVED — the highest-risk regression is guarded.** Plan line 27 requires the carve-outs + artefact list be "preserved VERBATIM in force" so the broadened invariant does NOT over-block. This is backed by **scenario 12** (line 31: "the two edit-ownership carve-outs + the orchestrator-own-output artefact list intact … the orchestrator still legitimately writes backlog/state/Pass-2 trail/Resolutions/git ops — no false over-block") AND a dedicated test **`edit-ownership-carveouts-preserved`** (line 42: prose-grep that `workflow/enforcement.md` still names the two carve-outs + the artefact list — "the broadened rule must NOT drop them … guards against a false over-block"). Matches arch §1's load-bearing constraint (lines 735–748: carve-outs preserved verbatim in force, "merely re-parented") and arch §3 step 3 (lines 817–827). Scenario + test both present for the single highest-risk regression of a core-invariant generalization. Confirmed.
- ✓ **4th variant (stale-artifact reuse) has scenario 11 + test `oc-stale-artifact-persona`, correctly characterized.** Scenario 11 (line 30: gate-artifact already on disk → RE-SPAWN this turn, do NOT read+present the existing artifact = "not run"). Test `oc-stale-artifact-persona` (line 43: persona echo states existing-artifact = not run + the named-rationalization ban). Correctly characterized as **pure-behavioural / no env failure** (line 20: "NO environment failure (subagents spawn fine …): a pure behavioural reuse, not the env-crash self-substitution of piece 1") and **persona-enforced / no deniable tool call** (consistent with arch lines 543–548 + 614–633: "read a file and paraphrase it in chat" has no deniable tool call → persona-only). Confirmed.
- ✓ **Cross-harness correctness asserted.** Plan line 27: both `WORKFLOW.md` + `workflow/enforcement.md` are non-generated → no `.claude/` golden churn; neutral-prose must stay clean. Regression line 44: `generator.sh` stays 4/4 (Claude golden byte-identical), `neutral-prose.sh` 5/5 (new core prose must read harness-neutral). The core rule is harness-neutral; the OpenCode persona (piece 1, line 35) is the **echo**, single-sourced from the core. Matches arch §4 (lines 859–893): "the core hoist itself is a non-generated edit (no golden churn); only the persona-echo reframe touches a generated surface." Confirmed — I verified `WORKFLOW.md` and `workflow/enforcement.md` are indeed hand-authored source (not generator outputs), so the byte-identical claim is sound.
- ✓ **Piece reframe coherence.** Pieces are reframed as ENFORCEMENT of the one invariant, not independent patches (plan lines 27, 33–38; matches arch §5, lines 895–915). The **provenance gate is DEFERRED** with the arch's feasibility rationale (line 37: a `tool.execute.before` gate "can't catch the read+paraphrase-in-chat act — no deniable tool call … largely duplicates piece-2 (h)" → DEFER; mirrors arch lines 550–659). **Piece 3 stays deferred** (line 38: spike blocked, 3 attempts — the `opencode run` startup race + the refuted `opencode serve` mitigation; always-on `instructions` is the interim carrier). Confirmed.
- ✓ **Ownership routed correctly (not pm-coder freehand).** Plan lines 47–48 name the `WORKFLOW.md` kernel edit AND the `workflow/enforcement.md` full-rule generalization as **`pm-architect`-owned** ("constitution prose" / canonical-prose). Line 50 names the `doc/architecture.md` decision-record extension as **`pm-architect`, post-coding**. Correct: the always-on invariant and the canonical full rule are constitution/canonical prose owned by `pm-architect`, not pm-coder content. The persona-echo edit (line 49) correctly routes through the manifest/generated surface (piece 1).
- ✓ **Each new test has a one-sentence behavior intent.** `core-delegation-invariant-present` (line 41), `edit-ownership-carveouts-preserved` (line 42), `oc-stale-artifact-persona` (line 43) each carry a one-line intent + scenario back-reference. The model-calibration is recorded so the plan's framing is NOT "weak model": line 9 ("DeepSeek v4-pro — NOT a weak model; see the calibration") + line 22 ("DeepSeek v4-pro is NOT weak (the original 'weak model' framing is retracted) … strong metacognition … The failure is architectural"). Matches arch lines 463–470. Confirmed.
- ✓ **Non-user-facing still holds.** Every extension-scenario subject is the orchestrator / protocol / persona / plugin (the system) — scenarios 11–12 subjects are "the orchestrator" and "`WORKFLOW.md` … carries". No human role → no advocate (Step 3.5) gate. Product-readiness gate remains `n/a`.

### Extension DoD (plan-completeness)
- [x] Extension scenarios (11, 12) specified, each with a planned test (`oc-stale-artifact-persona`; `core-delegation-invariant-present` + `edit-ownership-carveouts-preserved`)
- [x] The carve-out-preservation regression — the highest-risk failure of a core-invariant generalization — has BOTH a scenario (12) and a dedicated test (`edit-ownership-carveouts-preserved`)
- [x] Regression discipline named (generator 4/4 byte-identical, neutral-prose 5/5) — cross-harness no-golden-churn claim verified against the non-generated nature of the two files
- [x] Docs-to-update names the owners correctly (`pm-architect` for `WORKFLOW.md` + `workflow/enforcement.md` + `doc/architecture.md`; persona-echo via manifest)
- [n/a] Product-readiness gate — non-user-facing (subjects = orchestrator/protocol/plugin)
- [n/a] Validation gate — software-kind

**Extension DoD: pass**

### Extension blocking
(none)

### Extension notes (product)
1. The core hoist is a **protocol-constitution change** (it rewrites an always-on cross-cutting invariant that fires on every orchestrator action, on both harnesses). The plan's correctness rests entirely on the generalized prose reading harness-neutrally AND the two carve-outs surviving verbatim — both are prose-discipline guarantees, grep-tested (`core-delegation-invariant-present` + `edit-ownership-carveouts-preserved`) but not behaviourally simulable (there is no executable test that the broadened invariant doesn't over-block a legitimate orchestrator write — only the grep that the carve-out names are still present). The PM should note that the safety of broadening a core invariant rests on the `pm-architect` editorial pass + the presence-grep, not a behavioural gate; the Pass-2 editorial review (this is a software-kind prose deliverable) is the load-bearing quality check, so it must scrutinize the generalized `enforcement.md` rule specifically for any carve-out wording that the broadened first sentence could be read to catch.
2. Variant 4 (stale-artifact reuse) is closed at the **persona/instruction level only** — identical honesty to piece 1's verdict-self-substitution gap: a "read a file and paraphrase it in chat" act has no deniable tool call, so there is no structural backstop, and the provenance gate that could catch a downstream consequence is deferred (narrow reach, duplicates piece-2 (h), blocked spike). This is the correct call per the arch note, but it means the newest observed corner-cut is mitigated by stronger/more-salient persona prose, not structurally closed — the same residual the PM already acknowledged for the verdict-substitution gap (Note 1 above), now extended to the reuse route.

## Verdict
approve

<!-- This file is the PRE-CODING PLAN review (Pass-1 plan-quality + the EXTENSION
     validation), not a code review. The Pass-2 code review of the IMPLEMENTATION
     lives in the per-slice review files, so no Pass-2 trail belongs here
     (section intentionally omitted — the auditor's section-absence exemption). -->
## Code review: n/a — plan review; implementation Pass-2 is in `orchestrator-anti-corner-cutting-p12_review.md` (`## Code review: FIXED — 60151f7`). Piece 0 / piece-1-echo extension reviews land in their own per-slice files when built.
