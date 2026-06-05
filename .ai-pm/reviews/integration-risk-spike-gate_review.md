# integration-risk-spike-gate — plan compliance review

## Plan compliance

- ✓ Scenario 1 — **Spike gate fires — hinge idiom is doc-cited.** Implemented in `.claude/commands/pm-plan.md` § "Integration-risk spike gate (conditional, judgment-triggered)" (lines 104–122). Gate fires after Stack component check. Interactive branch: one `AskUserQuestion`. Autonomous branch: announce-before-act + `spike-deferred: (autonomous — proceed)`. Silent when `execution-verified`. Editorial verification passed.
- ✓ Scenario 2 — **`pm-stack-researcher` confidence tags.** Implemented in `.claude/agents/pm-stack-researcher.md` step 2 (idioms and constraints sub-bullet, lines 41–46). Two tags defined: `confidence: doc-cited (unverified)` and `confidence: execution-verified`. Absent-tag = `doc-cited (unverified)` convention documented. Researcher-never-self-promotes rule stated ("Only the orchestrator (relaying a confirmed spike result) promotes a rule to this tag; the researcher never self-promotes."). The final sentence cross-references the gate: "The **Integration-risk spike gate** in `/pm-plan` reads these tags…"
- ✓ Scenario 3 — **Spike executed — idiom confirmed.** Gate section in `/pm-plan` specifies: "the orchestrator updates the hinge rule's tag to `confidence: execution-verified` in `docs/stack-notes.md`. The gate is satisfied; the plan finalizes." Blast-radius preflight referenced for live+coupled spike targets, with explicit note "This reference does not relax the preflight rule."
- ✓ Scenario 4 — **Spike explicitly deferred.** Gate section specifies: "record the decision in the plan's Key design decisions as `spike-deferred: <rationale>`. The plan proceeds with the doc-cited hinge idiom surfaced; coder and reviewer are aware the design premise is not execution-verified."

## Specific check results

- **Gate is conditional/judgment-triggered (not blanket-mandatory):** Confirmed. The gate text opens: "After the Stack component check, **judge** whether this feature's core design hinges on a **load-bearing SDK idiom or a novel combination of stack capabilities**…" and explicitly states "The trigger is a **semantic judgement a regex cannot make** — so there is **no hook** and no mandatory plan section."
- **Gate is SILENT when idiom is `execution-verified`:** Confirmed. "The gate is **silent** when the hinge idiom already carries `confidence: execution-verified`." (pm-plan.md line 108).
- **Blast-radius preflight referenced-not-relaxed:** Confirmed. pm-plan.md reads "read `### Blast-radius preflight` in `workflow/incident.md` before acting. The spike goes to a **separate or throwaway instance by default**, never the user's live coupled target. **This reference does not relax the preflight rule.**"
- **Spike distinct from Step A.5 and Step 5.5:** Confirmed. pm-plan.md line 110: "The spike is **distinct** from Step A.5 (diagnostic probe — reactive, post-failure) and Step 5.5 (run it for real — post-implementation, whole feature)."
- **Absent-tag = `doc-cited` convention documented in researcher:** Confirmed. pm-stack-researcher.md: "A rule with **no confidence tag** is treated as `doc-cited (unverified)` by convention — the safe default."
- **Only orchestrator promotes to `execution-verified`:** Confirmed. pm-stack-researcher.md: "Only the orchestrator (relaying a confirmed spike result) promotes a rule to this tag; the researcher never self-promotes."
- **`tests/hooks.sh` 73/73:** Confirmed. No hook touched; `.claude/settings.json` unchanged. Pipeline output: `Total: 73  Passed: 73  Failed: 0`.

## DoD scope check

Changed files in commit `ccdebdf`:
- `.ai-pm/state/current.md` — state update (expected)
- `.claude/commands/pm-plan.md` — spike gate section added (in-scope)
- `.claude/agents/pm-stack-researcher.md` — confidence tags added (in-scope)

No new agent, command, or hook added. Scope is respected.

## Definition of Done

- [x] All plan scenarios implemented and tested (editorial verification: all four scenarios present in the two changed files)
- [x] Interaction scenarios have concurrent-state tests (n/a — `Provably isolated:` declared in plan)
- [x] Stack expectations respected; stack-spec tests pass (n/a — plan section "Stack expectations touched" is None; markdown-prose repo)
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change (n/a — plan section "Contracts" states no Product Contract; protocol-discipline change only)
- [x] Pipeline green (`tests/hooks.sh` 73/73; no hook touched)
- [x] State updated (`.ai-pm/state/current.md` Status: `review`; Touched files and Remaining listed)
- [x] Product Impact Report present (n/a — no contract touched; backend-only/protocol change)
- [x] Docs updates landed — `doc/architecture.md` `### Integration-risk spike gate` decision record present under `## Architectural decisions` (commit `bd375c5`, authored by `pm-architect`). Verified 2026-06-05.
- [x] Expected artifacts exist (plan present; this review being written; no contract — correct for backend-only)
- [x] Product-readiness gate resolved (n/a — no scenario subject is a human role; all scenarios are system/orchestrator-actor; exempt)
- [x] Validation gate resolved (n/a — software-kind project)

**DoD: pass**

## Blocking

None.

## Notes (product)

None.

## Verdict

approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See the "Edit-ownership rule" in `workflow/enforcement.md` — the Pass-2 code-review
     trail is the single carve-out to "orchestrator does not edit content artefacts". -->
## Code review findings

Cross-model review: Opus 4.8 overloaded → fallback Sonnet 4.6 (session model). Two minor findings, both in plan text only (implementation files clean):

- [minor] **Promotion-authority inconsistency in plan text.** Plan Scenario 2 said "orchestrator (or PM)" and Key design decisions said "only it (researcher) or orchestrator" — both contradicting the implementation files which correctly say "only orchestrator". Fixed in plan: Scenario 2 now reads "the orchestrator (relaying a confirmed spike result) updates it — the researcher never self-promotes"; Key design decisions now reads "The orchestrator is the promotion authority." Implementation files unchanged (were already correct).
- [minor] **Plan label ambiguity** (suggestion-only): plan's `## Out of scope` reference to "Scenario 1" in the spike-vs-A.5 distinction was slightly ambiguous. No change — prose is clear in context; noted for the record.

Both findings resolved in the plan file. No changes to implementation files required.

## Code review: 2026-06-05 — passed
