# Execution State

- **Status:** coding
- **Decision authority:** `autonomous` (project-wide, `.ai-pm/decision-authority.md`) — merge/ship stays manual.
- **Active task:** `nfr-operational-limits-prompt` — EPIC whole-system-property auditor slice 3. Conditional NFR / operational-limits prompt in `/pm-plan` (fires when feature is scale-bearing OR platform resource-constrained), audience-split homes: user-facing limits → Product Contract `## Must not break`; resource budgets → new conditional `docs/architecture.md` `## Operational limits & budgets` section. Conditional/proportional, judgment-not-regex, no hook, no hard gate (deferred). Software-kind, non-user-facing → no contract/advocate. Additive, no migration. Plan: `doc/features/nfr-operational-limits-prompt_plan.md`. Arch note: `.ai-pm/arch/nfr-operational-limits-prompt_arch.md`. Branch `feature/nfr-operational-limits-prompt`.
- **Next step:** pm-coder (pm-plan.md NFR check + architecture.md.tmpl new section + contract.md.tmpl note + pm-architect.md A2/ownership w/ A4-exclusion) → pm-architect updates doc/architecture.md (decision record) → review loop (pm-plan-checker + code-review) → pr-prep → STOP before merge. Target ~v2.23.0.
- **Last shipped:** `taxonomy-drift-sweep` v2.22.0 (PR #203).
