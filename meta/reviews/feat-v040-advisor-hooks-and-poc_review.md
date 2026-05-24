---
pr: TBD
branch: feat/v040-advisor-hooks-and-poc
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-25
trail_type: committed-review
spawned_agents: N/A
---

**Verdict:** approve

v0.4.0 Path B PR 2 of 2 (final). Advisor invocation hooks + PoC accuracy protocol + CHANGELOG + tag prep.

# Coverage

## Advisor invocation hooks (opt-in)

3 subagents updated с advisor invocation sections:

- **planner.md** § «Discipline-advisor invocation (v0.4.0+, opt-in)» — end of Step 2 plan draft, scope-proportionality + ADR forks + test plan completeness check
- **coder.md** § «Discipline-advisor invocation (v0.4.0+, opt-in)» — pre/post diff, gap closure pre-check (gaps 1/2/3 + AP-24)
- **reviewer.md** Step 3.5 «Discipline-advisor 6-axis coverage check (v0.4.0+, opt-in)» — multi-axis coverage verification

Все три — **opt-in** до PoC accuracy gate ≥80% per axis достигнут. После validation → mandatory (separate PR).

## PoC accuracy protocol document

`meta/experiments/2026-05-25_advisor-poc-accuracy-protocol.md` (~150 LOC):

- **Test set design:** 15 synthetic projects covering different complexity axes (CLI / TUI / backend API / public web + payments / mobile + backend / embedded / SaaS / personal utility / etc.)
- **Labelling rubric:** pre-labelled expected output (skip / recommended / mandatory per artifact), operator-judged
- **Measurement protocol:** per-axis + per-trigger accuracy formula
- **Bar:** ≥80% per axis. Below → fallback static rules. 70-80% → retry с improved prompt. <70% → abandon для axis.
- **Output document format** для PoC results
- **Risks + mitigations** (synthetic vs real / labelling bias / overfitting / threshold rationale)

Closes plan-review concerning-2.

## CHANGELOG v0.4.0 entry

Comprehensive [0.4.0] section в CHANGELOG.md:

- Added (skip_eligibility metadata × 31 / state schema additions × 3 / discipline-advisor agent / 3 advisor invocation hooks / PoC accuracy protocol / Layer-climbing escalation)
- Architecture notes (MAJOR→MINOR decision rationale, opt-in vs mandatory transitions)
- Concerning items closure (concerning-2 / concerning-5 / concerning-6 / дыра 4 / дыра 5)
- Deferred к v0.5.0+ (full per-AP trade-off / advisor mandatory rollout / downstream feedback loop)

Footer compare links updated.

# Cross-cutting findings

## Spec coverage

Соответствует v0.4.0 Path B PR 2 scope.

## Plan adherence

После этого PR — v0.4.0 wave **complete**. 5 из 7 PRs estimated в плане v3 — actual 2 PRs (более consolidated, but cohesive). Trade-off acceptable per plan v3 «logical batch» guidance.

## Test discipline

N/A. PoC validation runs — оператор responsibility после v0.4.0 merge.

## Security / architecture

- AP-12 / AP-17 clean
- Advisor opt-in preserves discipline floor (existing CI gates все ещё mandatory)

# Protocol compliance

- ✅ AP-1: нет архитектурных решений (extension PR)
- ✅ AP-3: scope утверждён через plan v3
- ✅ AP-4: spec coverage — план v3 + concerning-2 + complexity-honesty revised
- ✅ AP-6: scope без deviation
- ✅ AP-12: clean
- ✅ AP-16: этот trail
- ✅ AP-17: clean
- ✅ AP-19: один логический change (advisor integration + PoC validation prep)

# Severity summary

- Blocking: 0
- Question: 0
- Nit: 0

# Out of scope для этого PR

- Advisor mandatory rollout — после PoC validation runs
- Full per-AP trade-off filling — backlog v0.5.0+
- Downstream feedback loop — будет в HeartVault first prod-run (task #65)
- Tag v0.4.0 — после merge этого PR
