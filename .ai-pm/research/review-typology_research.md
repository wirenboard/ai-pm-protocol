# Research: review typology — multi-type code review with per-type cadence

## What we looked for

How mature teams/tools structure code review as **several distinct types** (not one undifferentiated pass), each with its own **cadence, depth, scope**, and which parts are **deterministic tooling** vs **AI/semantic judgement** — to design an EPIC for the protocol (which today has only per-diff review). Source: `deep-research` workflow `wf_aa28c5c0-435` (multi-source, adversarially verified).

## Headline finding

Review in mature shops is a **layered system**, and the dominant cadence rule across tools is **"review NEW/changed code, not already-clean code"** (SonarQube *Clean-as-You-Code*: gate on new-code conditions; overall quality improves incrementally without re-reviewing clean legacy). This **validates the slice-1 draft** (a last-sweep marker → review changed-since-last + never-swept, periodic full re-sweep). The clean split that emerged: **structural/repeatable checks → deterministic tools run every time; semantic judgement → the LLM review.** This is exactly our recorded "deterministic-enforceable vs AI-evaluated boundary" (backlog #211).

## The review types (validated taxonomy)

| Type | What it catches (that others miss) | Deterministic part (tool/hook) | Judgement part (AI) | Cadence |
|---|---|---|---|---|
| **Per-diff** (have it) | correctness of *this change* | lint/format on the diff | semantic review of the diff (low/med depth) | every change |
| **Smell / hygiene** | warning signs of deeper weakness that **don't** break functionality — dead code, duplication, high cognitive complexity, long methods, magic numbers, over-complexity | smell **detection** (static-analysis-style enumerable catalog) — a hook/linter | root-cause + **prioritization** of which smells matter (SOTA LLM auto-fix tops ~85%, fails ~28% of multi-file refactors → judgement, not blind fix) | light / frequent |
| **Architectural** | design-level: coupling/cohesion, **layering violations, dependency direction, cycles**, duplicated abstractions, convention/approach drift | layering/dependency/cycle **rules** (ArchUnit / dependency-cruiser / "fitness functions" — deterministic) | "is this the right approach / does it adhere to our conventions" — judgement over the deterministic rule output | heavier / periodic, scoped to changed+hotspot |
| **Functional / integration** | does everything **interact** without problems across components | contract tests (Pact), integration/e2e, **characterization/approval** tests on legacy — *testable by running* | reasoning about cross-component behavior from reading — *reviewable* where running isn't possible | heaviest / rare / manual |

**Boundaries:** smell ≠ bug (functionality-preserving); architectural ≠ line-bug (it's about structure/dependencies, not a single line); functional/integration is mostly **testable** (run it) more than **reviewable** (read it) — an AI sweep adds value where tests are absent (legacy, never-tested seams).

## Cadence / proportionality (the "don't re-review clean code" machinery)

- **New-code gating** (SonarQube Clean-as-You-Code): conditions apply to *new code only* (no new issues, new hotspots reviewed, new-code coverage/duplication thresholds). Deterministic. **← directly our last-sweep-marker design.**
- **Baselines / ratchet** (ESLint bulk-suppressions / `eslint-baseline`): snapshot existing violations, fail only on *new* ones, ratchet down over time. Deterministic.
- **Churn / hotspot targeting** (CodeScene): prioritize review on frequently-changed × complex code (where defects cluster). Deterministic scoping signal.
- **Periodic full re-sweep**: reserved for drift, run rarely — matches "the heaviest, rarest type, manual or low cadence."

## Risk-based prioritization (critical → cosmetic)

Risk-based review concentrates effort by **blast-radius / change-criticality**. We can **derive criticality from our own artifacts**: a feature's **Product Contract** `## Must work` / `## Must not break` invariants mark what's critical; a **`docs/threat-model.md`** marks security-critical surfaces; **churn/hotspot** marks defect-prone areas. So "review critical features first" is computable from contracts + threat-model + git churn — no new tagging needed.

## AI-agent vs deterministic split (the load-bearing recommendation)

- **Deterministic → PreToolUse hooks / linters / fitness rules, run every time, cheap:** smell *detection*, layering/dependency/cycle rules, baseline gating, coverage/duplication thresholds, "new code" scoping.
- **Semantic judgement → the LLM `code-review` skill (low→ultra depth):** root-cause of a smell, prioritization, convention/approach adherence, cross-component behavioral reasoning, risk weighting.
- **Depth ↔ type mapping:** hooks = hygiene + arch-fitness on every diff; **low/medium** AI = per-diff semantic review; **high** AI = periodic *architectural* review scoped to changed+hotspot; **ultra** = rare *functional/integration* full sweep, prioritized by contract/threat-model criticality.

## Conclusion / recommendation for the EPIC

Build the EPIC as a **layered review framework** that reuses our existing engine (`code-review` low→ultra) + hooks, with the new-code-gating proportional machinery shared across types:

- **Slice 1 (framework + smell/hygiene):** the type registry + per-type cadence/depth/scope + the **proportional last-sweep marker** (new-code gating, validated) + selectable depth (economy) + findings-triage. The first concrete type = **smell/hygiene** (cheapest, most frequent), with *detection* candidates for deterministic hooks and *prioritization* by the low/med AI depth.
- **Slice 2 (architectural):** high-depth AI review scoped to changed+hotspot, fed by deterministic layering/dependency/cycle signals where a project has them (note: a markdown-prose protocol repo has no ArchUnit, so for *itself* this is AI-judgement over the doc/agent structure; for downstream code projects it can lean on real fitness tools).
- **Slice 3 (functional/integration):** ultra-depth rare sweep, prioritized by contract/threat-model criticality; explicitly note it is **more testable than reviewable** — the protocol should prefer pointing at integration/contract **tests** and only AI-review the seams tests don't cover.
- **Slice 4 (criticality prioritization):** derive critical→cosmetic order from contracts (must-work/must-not-break) + threat-model + churn — a scoping lens applied across all types.

**Tie to backlog #211 (deterministic-vs-AI boundary):** this EPIC is where that boundary gets applied concretely — every type names its deterministic half (hook/tool) and its judgement half (AI depth).

## Sources

- [SonarQube — Clean as You Code / new code](https://docs.sonarsource.com/sonarqube-server/user-guide/about-new-code)
- [SonarSource — Code smells library](https://www.sonarsource.com/resources/library/code-smells/)
- Martin Fowler, *Refactoring* (code-smell catalog); Wikipedia: Code smell (boundary smell≠bug)
- ESLint bulk-suppressions / `eslint-baseline`; CodeScene (churn/hotspot); ArchUnit / dependency-cruiser / *Building Evolutionary Architectures* (fitness functions); Pact (contract testing); characterization/approval testing (legacy)
- 2025/26 LLM auto-fix benchmarks (SmellBench / BitsAI-Fix) — ~85% ceiling, ~28% multi-file-refactor failure → detection=tool, judgement=AI
