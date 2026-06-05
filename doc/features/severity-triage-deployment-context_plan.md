# severity-triage-deployment-context — plan

Decision authority: autonomous

Source: selected autonomously per ### Decision authority; source: `.ai-pm/backlog.md` § "Severity triage must be deployment-context-aware; context-enrichment before cross-model" (2026-06-05).

## Scenarios

1. **`workflow/review-typology.md` gains a `### Deployment-context triage` subsection.** Placed after `### Review history awareness` (the other universal pre-condition for all review passes). Rule: before any review subagent runs — per-diff Pass-2, seam-completeness check, and the quality sweep in `/pm-audit` `## Technical quality` — the orchestrator reads `docs/architecture.md` `## Operational limits & budgets` + `## Architectural constraints` from the project, and when `docs/threat-model.md` is present (security-bearing project), reads it too. These sections are passed as explicit context in the review subagent prompt. The reviewer uses this context when assigning severity to any resource/memory/CPU/I/O/availability finding: a finding triaged on generic assumptions (a 16 GB dev laptop) that maps to a constrained embedded target must be recalibrated against the actual documented budgets. The rule applies universally — stated once here; every review pass references `### Deployment-context triage` in `workflow/review-typology.md` by name and re-encodes none of it.

2. **`workflow/pipeline.md` Step 5 Pass-2 gains a deployment-context enrichment bullet.** Between the `### Review history awareness` reference and the `code-review` invocation, a new bullet: "Apply **deployment-context enrichment** per `### Deployment-context triage` in `workflow/review-typology.md` — before spawning the review subagents (code-review and seam-completeness), read `docs/architecture.md` `## Operational limits & budgets` + `## Architectural constraints` (and `docs/threat-model.md` when present) and include them in each subagent prompt." By-name consumer reference — does not re-encode the rule.

3. **`pm-audit.md` `## Technical quality` section gains a deployment-context enrichment reference.** In the opening paragraph (which already says "Read `workflow/review-typology.md` before running the sweep"), an additive sentence names the deployment-context enrichment step explicitly: "Before spawning the sweep subagent, apply **deployment-context enrichment** per `### Deployment-context triage` in `workflow/review-typology.md`." By-name consumer reference — does not re-encode the rule.

## Existing behaviors this feature touches

- `workflow/review-typology.md` `### Review history awareness` — the new `### Deployment-context triage` subsection is placed after it, in the same "universal pre-conditions for all review passes" zone. `### Review history awareness` itself is unchanged.
- `workflow/pipeline.md` Step 5 Pass-2 — gains one bullet (deployment-context enrichment reference, covering both code-review and seam-completeness subagents). Cross-model resolution, review history awareness, and the review invocations are unchanged.
- `workflow/review-typology.md` `### Seam-completeness per-diff angle` — gains a one-liner at the end of the section, per the same pattern as line 81 for `### Review history awareness`: "The seam check is also subject to deployment-context enrichment — see `### Deployment-context triage` below." Seam checklist and scope boundary unchanged.
- `.claude/commands/pm-audit.md` `## Technical quality` first paragraph — gains one sentence (deployment-context enrichment reference). Engine selection, model resolution, and sweep steps 1–5 are unchanged.

## Contracts

(No Product Contract — reviewer discipline rule; not user-facing product behavior. No human-role subject.)

## Stack expectations touched

(None — Markdown prose additions to three protocol files. No library, format, or external-system idiom touched.)

## Interaction scenarios

Provably isolated: prose addition to one file. No shared mutable state, no concurrency, no I/O. No adjacent feature interference — the deployment-context read is additive to the review pass; it does not change the review engine or the finding format.

## Test plan

- Existing tests that must pass: all `tests/hooks.sh` — untouched (no hook touched); confirm 73/73.
- New tests: **none** — Markdown protocol-discipline change in a markdown-prose repo with no runtime to host a test for "did the reviewer read the operational limits before triaging." Verification is editorial: Pass-1 plan-compliance (one file updated, the rule is named and scoped correctly) + Pass-2 `code-review` over the diff.

## Docs to update

- `doc/architecture.md`: a short decision record — "Deployment-context triage: all review passes must read `docs/architecture.md ## Operational limits & budgets` + `## Architectural constraints` (+ `docs/threat-model.md` when present) before assigning severity to resource/availability findings; context-enrichment is cheaper and often sufficient vs cross-model for this class of blind spot (same model, better prompt catches the same gap); rule lives in `workflow/review-typology.md ### Deployment-context triage`, referenced by all review passes by name." Authored by `pm-architect` post-coding.

(README not touched — no install/quickstart/architecture-one-liner/doc-pointer change.)

## Key design decisions

- **Context-enrichment, not cross-model.** The backlog explicitly records: "Same model, different prompt → a better catch — undercuts 'need a different MODEL' for this class." The reviewer missed the deployment constraint not because of model-level bias but because it lacked the documented project context. Fix = provide the context; no cross-model upgrade needed for this class.
- **Universal rule in review-typology.md (single source), not per-consumer duplication.** All review passes (per-diff, seam-completeness, quality sweep) already reference `workflow/review-typology.md` by name. Adding the rule there propagates to all consumers without touching pipeline.md, pm-audit.md, or seam-completeness prose.
- **Security-bearing gate for threat-model.** The threat-model read is presence-conditional (same gate as all other security-surface checks — the project is security-bearing exactly when `docs/threat-model.md` is present). Silent when absent.
- **Absent / N/A budget sections are silent.** `## Operational limits & budgets` and `## Architectural constraints` may be N/A or absent on a greenfield project with no resource constraints. The reviewer reads what is there; the rule is read-once-silent-when-absent, never a hard gate.
- **Scope: reviewer, not pm-audit finding-walk.** The PM already knows their deployment context. The gap was in the reviewer's severity assignment. The fix is context passed to the review subagent; the PM-facing finding-walk in pm-audit.md needs no change (the PM decides priority with full knowledge of their own deployment target).

## Out of scope

- **Changing the bundled `code-review` skill** — it is an upstream artifact; the fix is in what context the orchestrator provides to the subagent, not in the skill's own angles.
- **`pm-auditor.md`** — the compliance auditor does not do severity triage of resource findings; the gap is in the `code-review` quality reviewer.
- **`pm-audit.md` finding-walk** — no change needed; deployment context flows through the review subagent's severity assessment, which the reviewer already corrects with the enriched context.
- **Adding deployment-context reading to pm-plan-checker** — the plan-checker verifies scenario completeness, not finding severity; not a severity-triage consumer.
