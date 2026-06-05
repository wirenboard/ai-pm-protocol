# integration-risk-spike-gate — plan

Decision authority: autonomous

Source: selected autonomously per ### Decision authority; source: `.ai-pm/backlog.md` § "Integration-risk spike gate: docs-research is necessary-not-sufficient — verify a load-bearing idiom by execution before design" (PM-named root, 2026-06-05) + `.ai-pm/state/current.md` "Next queue" first item.

## Scenarios

1. **Spike gate fires — hinge idiom is doc-cited.** When a plan's core design hinges on a load-bearing SDK idiom — an SDK/library combination the docs don't directly cover, a non-standard capability interaction, a flag or registration sequence the happy-path README omits — the `/pm-plan` Integration-risk spike gate fires **after** the Stack component check. It reads the hinge idiom's confidence tag from `docs/stack-notes.md`: if the tag is `doc-cited (unverified)`, the orchestrator surfaces the spike requirement before finalizing the plan. In **interactive** mode: one `AskUserQuestion` — authorize a throwaway spike now, or explicitly defer with a rationale. In **autonomous** mode: announce-before-act; record `spike-deferred: (autonomous — proceed)` in the plan's Key design decisions and continue. The gate is **silent** when the hinge idiom already carries `execution-verified`.

2. **`pm-stack-researcher` confidence tags.** Every load-bearing rule in `docs/stack-notes.md` — an idiom the design depends on, not incidental reference patterns — carries a confidence tag on its source line: `confidence: doc-cited (unverified)` or `confidence: execution-verified`. A rule with no tag is treated as `doc-cited (unverified)` (the safe default). The researcher adds the tag when it first documents the rule; the **orchestrator** (relaying a confirmed spike result) updates it to `execution-verified` — the researcher never self-promotes.

3. **Spike executed — idiom confirmed.** After running the minimal throwaway spike that exercises the hinge idiom on a throwaway target, the orchestrator updates the rule's tag to `confidence: execution-verified` in `docs/stack-notes.md`. The gate is satisfied; the plan finalizes. The Blast-radius preflight (in `workflow/incident.md`) applies when the spike target is a live, coupled external system — the spike goes to a separate or throwaway instance by default, never the user's live coupled target.

4. **Spike explicitly deferred.** When the PM consciously accepts the doc-cited risk (low-stakes idiom use, no throwaway target available, docs coverage is sufficient for the specific combination), the decision is recorded in the plan's Key design decisions as `spike-deferred: <rationale>`. The plan proceeds with the doc-cited hinge idiom surfaced; coder and reviewer are aware the design premise is not execution-verified.

## Existing behaviors this feature touches

(from `workflow/pipeline.md`, `.claude/commands/pm-plan.md`, `.claude/agents/pm-stack-researcher.md` — what must not break)

- **`/pm-plan` Stack component check** — spike gate fires AFTER the existing check (researcher populates `docs/stack-notes.md` with doc-cited tags first, spike gate reads those tags second). The existing check is unchanged.
- **`pm-stack-researcher` output format** — confidence tag added per load-bearing rule; backward compatible (absent tag = `doc-cited (unverified)` by rule, no retroactive sweep of existing entries).
- **`workflow/incident.md` Blast-radius preflight** — referenced by the spike gate for the case where the spike target is live and coupled; the preflight rule itself is unchanged and not relaxed.
- **Step A.5 (diagnostic probe)** in `workflow/incident.md` — distinct from the spike: probe is reactive (post-failure), spike is proactive (pre-design). This feature does not touch Step A.5.
- **Step 5.5 (run it for real)** in `workflow/pipeline.md` — distinct: Step 5.5 validates a finished feature; spike validates a specific hinge idiom before the design commits to it. This feature does not touch Step 5.5.

## Contracts

(No Product Contract — protocol-discipline change, not user-facing product behavior.)

## Stack expectations touched

(None — this is a markdown-prose repo; no library/format/external-system idiom of this repo is touched by this feature.)

## Interaction scenarios

Provably isolated: prose additions to `.claude/commands/pm-plan.md` and `.claude/agents/pm-stack-researcher.md`. No shared mutable state, no concurrent operations, no I/O, no adjacent feature interference.

## Test plan

- Existing tests that must pass: all `tests/hooks.sh` — 73/73 (no hook touched, no `settings.json` change).
- New tests: **none** — markdown-prose repo with no runtime to host "did the spike gate fire correctly?" tests. Verification is editorial, per the project-kind documentation discipline: Pass-1 plan-compliance (all four scenarios implemented; Blast-radius preflight correctly referenced-not-relaxed; spike gate is conditional/judgment-triggered, not blanket-mandatory; `execution-verified` / `doc-cited` tags documented in researcher output format) + Pass-2 `code-review` over the diff. Consistent with `diagnostic-flow-discipline`, `changeset-hygiene`, and `test-wiring-parity` test precedents for this repo.

## Docs to update

- `doc/architecture.md`: decision record — "Integration-risk spike gate: docs-research is necessary-not-sufficient (a load-bearing idiom the design hinges on can break silently under a non-standard config even when research cited it correctly — the BLE root case); a conditional `/pm-plan` gate fires when the hinge idiom is `doc-cited (unverified)`; `pm-stack-researcher` outputs `confidence: doc-cited (unverified) | execution-verified` per load-bearing rule; the spike is a minimal throwaway run on a throwaway target, distinct from Step A.5 (reactive probe) and Step 5.5 (whole-feature verify); Blast-radius preflight applies when the spike target is live+coupled." Authored by `pm-architect` post-coding.

## Key design decisions

- **Trigger is a semantic judgement, not a keyword.** "Does the design hinge on a load-bearing idiom the docs don't directly cover for this combination?" is a per-plan call, like the NFR/state-model/product-readiness checks. No hook — hooks cannot detect novel cross-capability interactions.
- **Gate lives in `/pm-plan`, not as a standalone command.** The spike gate is a conditional section in the Stack component check flow (after researcher runs); it does not add a new agent, command, or hook.
- **The orchestrator is the promotion authority.** The researcher marks each new rule it writes as `doc-cited (unverified)`; only the **orchestrator** (relaying a confirmed spike result) promotes a tag to `execution-verified`. No other agent edits confidence tags directly.
- **Distinct from existing probes (Scenario 1 / Step A.5 / Step 5.5).** Each has a different lifecycle position and trigger: spike = proactive-pre-design; probe = reactive-post-failure; Step 5.5 = post-implementation-whole-feature. Naming them distinctly avoids conflation.
- **Backward compatibility.** Existing `docs/stack-notes.md` entries without a confidence tag default to `doc-cited (unverified)` by rule — no retroactive sweep required. The researcher adds tags only to rules it newly documents.

## Out of scope

- **Hard gate / hook** — the trigger is a semantic judgement a regex cannot make.
- **Automated spike execution by the orchestrator** — the spike requires a target environment the orchestrator doesn't have; the orchestrator surfaces the requirement, the PM (or a PM-authorized action) runs it; the orchestrator records the result.
- **Step A.5 / Blast-radius preflight** — unchanged; the spike references the preflight for the live-coupled-target case but does not weaken it.
- **Step 5.5 (run it for real)** — unchanged; complementary, not replaced.
- **Anti-thrash / mid-debug tripwire / bisect** — already implemented in `diagnostic-flow-discipline`; out of scope here.
- **Retroactive confidence sweep of existing stack-notes entries** — existing entries without tags default to `doc-cited (unverified)` by rule; no forced retroactive tagging.
