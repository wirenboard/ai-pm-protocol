---
pr: TBD
branch: feat/v040-skip-eligibility-and-advisor
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-25
trail_type: committed-review
spawned_agents: N/A
---

**Verdict:** approve

v0.4.0 PR 1 of 2. Primitives для Path B conditional skip framework + discipline-advisor agent definition. MINOR-additive per plan-review concerning-5 (most changes additive с sensible defaults preserving existing behavior).

# Coverage

## skip_eligibility metadata в 31 templates

Mass-added через Python script — каждый `_templates/*.md.tmpl` получает frontmatter секцию:

```yaml
skip_eligibility:
  default: required | recommended | optional | conditional
  skip_if: <text condition>
  hard_floor: <never-skip-if condition>  # optional
```

Per-artifact rules matched к plan v3 Skip eligibility table:
- `required` — vision, mvp-scope (для new-product), dev-environment, development-protocol-overlay
- `recommended` — personas, user-journeys, strategic-frame, customer-interview-script
- `optional` — competitive-analysis (now redirect), brand-voice (now redirect), positioning, dependency-policy (redirect), refactor-playbook (redirect), maintenance-playbook
- `conditional` — ui-style-guide-* (per ui_kind), database-design-* (per db_kind), threat-model (per security capabilities), legal (per PII/payments/GDPR), incident-runbook-draft (per runtime), tech-stack

**Pre/post-merge clarity** (concerning-6 plan review): redirect stubs preserve skip_eligibility metadata pointing to merged target. Advisor / scripts могут resolve either.

## State schema additions (bootstrap-state.md.tmpl)

3 новых поля после `project_capabilities:`:

- `advisor_preset` — full (default existing) / standard (default новые в v0.4.0+) / minimal
- `skip_decisions: []` — per-artifact decisions log с state / reason / declared_at / next_reprompt / promoted_by
- `advisor_log: []` — append-only trace advisor sessions для audit trail

**Backwards compat preserved:** existing state files без полей → defaults (`advisor_preset: full` = old behavior, empty `skip_decisions` / `advisor_log` = no advisor activity). No migration needed.

## discipline-advisor subagent

`.claude/agents/discipline-advisor.md` (~200 LOC):

- **Hybrid architecture:** deterministic floor (irreducible) + smart layer (bounded scan)
- **Hard detection rules:** PII / payments / crypto / auth → mandatory recommendations без opt-out
- **5-axis quality challenger** на каждом Stage F step (Step 1 spec / Step 2 plan / Step 4 coding / Step 7 review) + bootstrap entry / preset change
- **Cost-bounded:** sample scan (entry points + manifests + 5-10 heuristic files), cached per session, trigger-based, <10k tokens budget
- **PoC accuracy gate ≥80% per axis** (concerning-2 plan review closure) — validation protocol described, документ to be generated в PR2
- **Layer-climbing escalation (дыра 4):** next_reprompt default 90 days, severity escalation (1st friendly / 2nd warning / 3rd finding в review)
- **Output:** structured advisory с mandatory / recommended / skip-safe + reasons + pointers
- **Что НЕ делает:** не пишет файлы (read-only), не overrides floor (hard rules absolute)

# Cross-cutting findings

## Spec coverage

Plan v3 § v0.4.0 Path B revised + advisor 5-axis. Подаёт addresses:
- concerning-2 (PoC accuracy measurement protocol) — addressed in agent definition § PoC accuracy gate
- concerning-5 (MAJOR vs MINOR) — addressed via additive-with-defaults design (no breaking)
- concerning-6 (skip eligibility pre/post-merge) — addressed via redirect stubs preserving metadata
- дыра 4 (layer-climbing) — addressed via next_reprompt + escalation severity
- дыра 5 (advisor vaporware) — addressed via PoC accuracy gate ≥80% per axis

## Plan adherence

Соответствует v0.4.0 § Path B revised (conditional skip + presets вместо Layer model). 

## Test discipline

N/A для definition PR; PoC accuracy gate validation — следующий PR.

## Security / architecture

- AP-12 / AP-17 clean
- Hard floor preserves security discipline (AP-3 / AP-19 / AP-20 always on)
- Advisor read-only — не может introduce bugs в product code

## Code hygiene

- 31 templates updated (Python script mass-add, AP-12 safe)
- 1 state template extended (bootstrap-state.md.tmpl)
- 1 new agent file
- ~250 LOC net added

# Protocol compliance

- ✅ AP-1: нет архитектурных решений (definition PR)
- ✅ AP-3: scope утверждён через plan v3
- ✅ AP-4: spec coverage — план v3 + critique audit + complexity-honesty revised
- ✅ AP-6: scope без deviation
- ✅ AP-12: clean (техтермы wrapped)
- ✅ AP-14: structural — нет new product docs
- ✅ AP-16: этот trail
- ✅ AP-17: clean
- ✅ AP-19: один логический change (Path B primitives — skip_eligibility metadata + state schema + advisor definition — coherent foundation)

# Severity summary

- Blocking: 0
- Question: 0
- Nit: 0

# Out of scope для этого PR

- 5-axis advisor invocation hooks в planner/coder/reviewer — PR2
- PoC accuracy protocol document с test set rubric — PR2
- Layer-climbing escalation runtime logic — PR2 (mechanism declared, implementation deferred)
- CHANGELOG v0.4.0 entry — PR2 after both PRs merged
- Tag v0.4.0 — PR2 final
