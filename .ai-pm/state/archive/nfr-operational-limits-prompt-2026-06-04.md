# Execution State

- **Status:** review-complete — plan-check approve + code-review (4 findings, all fixed in-pass); shipped
- **Decision authority:** `autonomous` (project-wide, `.ai-pm/decision-authority.md`) — merge/ship stayed manual.
- **Active task:** `nfr-operational-limits-prompt` — EPIC cross-document-consistency auditor slice 3. Conditional NFR / operational-limits prompt in `/pm-plan` (fires when feature is scale-bearing OR platform resource-constrained), audience-split homes: user-facing limits → Product Contract `## Must not break`; resource budgets → new conditional `docs/architecture.md` `## Operational limits & budgets` section. Conditional/proportional, judgment-not-regex, no hook, no hard gate (deferred). Software-kind, non-user-facing → no contract/advocate. Additive, no migration. Plan: `doc/features/nfr-operational-limits-prompt_plan.md`. Arch note: `.ai-pm/arch/nfr-operational-limits-prompt_arch.md`.
- **Pipeline:** /pm-plan → arch-review (pm-architect, flagged A2-walk/A4-exclude) → pm-coder (4 edits, hooks 71/71) → pm-architect decision record + repo's own `N/A` section → review loop (plan-check approve; code-review found+fixed 4: pm-architect antecedent, pm-plan over-fire guard, contract `[?]`-not-invented, EPIC-name alignment) → pr-prep.
- **Outcome:** Released v2.23.0, PR #208 merged 2026-06-04 (auto-tag ships `v2.23.0`). Review: `.ai-pm/reviews/nfr-operational-limits-prompt_review.md`.
- **Last shipped before this:** `taxonomy-drift-sweep` v2.22.0 (PR #203).
