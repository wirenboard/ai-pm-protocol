## Plan compliance

- ✓ Scenario 1 — durable-handoff principle paragraph in `workflow/state.md` § "How state is kept" — implemented. New paragraph: "The durable hand-off between agents is what is on disk — `state/current.md`, the review file, any scratch note — not what is in agent memory. `continue-the-same-agent` is an optional optimization: it saves tokens when available and breaks nothing when it is not. The protocol must never depend on it." Text matches the plan's prescribed content verbatim in intent and detail.

- ✓ Scenario 2 — flush-before-stop preamble in `.claude/agents/pm-coder.md` § "## When to stop and ask" — implemented. The new preamble sentence ("Before yielding control on any stop condition below, write the work-so-far to `.ai-pm/state/current.md`…") is placed as a freestanding paragraph before the bullet list, exactly as the plan specifies ("a preamble, not a new stop condition"). Existing bullet list is unchanged.

- ✓ Scenario 3 — fresh-agent-with-brief named as the standard in `workflow/pipeline.md` Step 4 — implemented. Sentence added: "When a coder stops at a blocking question and the same agent cannot be continued, the orchestrator spawns a fresh agent with a brief that explicitly quotes the stopped agent's conclusions from `state/current.md` — this is the protocol's designed fault-tolerance path, not an emergency workaround." Matches plan content exactly.

- ✓ Docs update — `doc/architecture.md` decision record — implemented. Section "### Agent-handoff durability: flush-before-stop + fresh-agent-with-brief as designed fault-tolerance" added at line 433, authored by `pm-architect` post-coding per the plan's "Docs to update" instruction. Record cites all three source files correctly.

- ✓ Test plan — `tests/hooks.sh` 73/73 green confirmed (the plan explicitly says new tests are none; verification is editorial; existing hook suite is the only required run).

## Definition of Done

- [x] All plan scenarios implemented and tested
- [x] Interaction scenarios have concurrent-state tests — n/a: plan declares "Provably isolated" with no concurrent state
- [x] Stack expectations respected; stack-spec tests pass — plan declares "None" for Stack expectations; `tests/hooks.sh` 73/73 green
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change — plan declares no Product Contract (not user-facing); no contract touched
- [x] Pipeline green — `tests/hooks.sh` 73/73 green; this is the only required pipeline step in a markdown-prose repo (CLAUDE.md: "there is no stack linter")
- [x] State file updated — `.ai-pm/state/current.md` reflects Status: review, Done items for all three file changes, Remaining for the review loop, Touched files list complete
- [ ] Product Impact Report present (when contract touched) — n/a: no user-facing contract touched
- [x] Docs updates landed — `doc/architecture.md` decision record present (committed in `6741a95`)
- [x] Expected artifacts exist (plan, this review, contract if user-facing) — plan at `doc/features/agent-handoff-durability_plan.md` present (untracked, not yet committed); this review created now; no contract required (not user-facing)
- [n/a] Product-readiness gate resolved (user-facing only) — plan explicitly states "No human-role subject"; all three scenario subjects are the protocol/orchestrator/agent, not a human role; gate is exempt
- [n/a] Validation gate resolved (documentation-kind only) — project kind is `software` (CLAUDE.md: "## Project kind: software")
- [n/a] Failure-inventory negative-space tests present — plan has no failure-inventory scenarios (the feature is prose additions with no external I/O; failure paths are not applicable)

**DoD: pass**

## Blocking

None.

## Notes (product)

1. The plan's `doc/architecture.md` decision record was authored post-coding by `pm-architect` (committed in `6741a95`), as the plan's "Docs to update" section instructs. The coder's state file correctly lists this as Remaining at the time of the coding commit (`fad0c70`), and it was subsequently completed before the review. This is the designed workflow — no action required.

2. The plan's untracked status: `doc/features/agent-handoff-durability_plan.md` appears as an untracked file in `git status`. The plan file is present on disk and readable; it is not yet staged/committed. This is consistent with the git status output for several other plan files on this branch (`doc/features/seam-completeness_plan.md`, `doc/features/state-archive-home_plan.md` are also untracked). The review counts the artifact as present because the file exists on disk; the orchestrator should stage and commit the plan file before `pm-pr-prep`.

## Verdict

approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See the "Edit-ownership rule" in `workflow/enforcement.md` — the Pass-2 code-review
     trail is the single carve-out to "orchestrator does not edit content artefacts". -->
## Code review findings

Reviewed on Opus 4.8 (cross-model, session=Sonnet 4.6). Scope: the agent-handoff-durability hunks only (commits `fad0c70` impl + `6741a95` arch record) — three prose additions (`workflow/state.md` durable-handoff principle, `.claude/agents/pm-coder.md` flush-before-stop preamble, `workflow/pipeline.md` Step 4 fresh-agent path) plus the `doc/architecture.md` decision record. The state-archive paragraphs that appear in the same files (`state.md` line 9, `pipeline.md` pre-`pm-pr-prep` block) belong to the prior state-archive-home feature (commits `f3a61c1`/`629b529`, already Pass-2 stamped in `1490984`) and are out of scope for this review.

7 finder angles + seam-completeness (exception-boundary / store-contract-consistency / symmetry-of-paranoia) + review-history dedup against this file's `## Plan compliance` and `.ai-pm/backlog.md` accepted entries.

(none — no blocking or correctness findings)

Notes (non-blocking, considered and dismissed — recorded for the trail):

1. **"any scratch note" as a durable hand-off artifact (state.md).** The principle lists `state/current.md`, the review file, and "any scratch note" as on-disk hand-off. A scratch note lives in `.claude/tmp/`, which is git-ignored and throwaway (`workflow/enforcement.md` line 52; `.gitignore` line 10), so unlike `state/current.md` it does not survive a commit/branch boundary. Dismissed: the principle is explicitly scoped "between agents … what is on disk" (the in-session successor/replacement case), not the week-long-resume-after-commit case — within a session a scratch note is on disk and readable by a replacement agent, so the claim is accurate at the altitude it is made. The wording is also plan-prescribed verbatim (Scenario 1) and Pass-1 confirmed the verbatim match. No change required; if a future edit ever wants to tighten it, scope "scratch note" to in-session hand-off explicitly.

2. **pm-coder flush rule names only `state/current.md`, not the review file (vs plan Scenario 2's "or the feature's review file").** Dismissed as intentional: the plan's own Key design decision ("Flush to `state/current.md`, not a new scratch file … the default is the state file") resolves the operative rule to a single named target; narrowing the principle's three-artifact list to one target in the operative rule is plan-sanctioned single-source discipline, not an inconsistency. The arch-record body matches the operative rule (flush to `state/current.md`); its first sentence matches the principle (all three count as durable) — the two altitudes are internally consistent.

3. **Seam-completeness — exception-boundary:** the flush preamble is inserted before yielding on *any* stop condition (covers the whole exception boundary symmetrically). **store-contract-consistency:** the "store" (`state/current.md`) is named consistently across pm-coder (write), pipeline Step 4 (read-and-brief), and the arch record. **symmetry-of-paranoia:** the principle/operative narrowing (3 artifacts → 1) is plan-deliberate, not an asymmetry bug. All three checks clean.

## Code review: 2026-06-05 — passed
<!-- The orchestrator replaces THIS WHOLE LINE with `## Code review: <date> — passed`
     only when code-review clears. Until then the section is UNSTAMPED: `pm-pr-prep`
     refuses to release it (step 0) and `pm-auditor` blocks on it (dimension 1).
     Never ship an empty `## Code review` heading — an empty section reads as
     "no findings / passed" to a quick eye or grep; `NOT YET RUN` reads as "not done". -->
