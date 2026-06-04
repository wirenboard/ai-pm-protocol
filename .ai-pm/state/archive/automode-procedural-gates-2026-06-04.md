# Execution State

- **Status:** shipped (review-complete → pr-prep → merged)
- **Active task:** `automode-procedural-gates` (renamed mid-flight from `automode-feature-selection`, then broadened). Extends the shipped automode (`### Decision authority` engine): in autonomous mode a routine procedural checkpoint (feature-selection, plan-approval, arch-offer, retrospective/audit + migration nudges, contract-existence) → announce-and-proceed; a genuine product fork (advocate gaps, irreversible/high-stakes) → derivability test unchanged; merge/ship stays manual. Dividing line: "does it decide what the user gets?". Plan: `doc/features/automode-procedural-gates_plan.md`. Arch note: `.ai-pm/arch/automode-procedural-gates_arch.md`.
- **Pipeline:** /pm-plan → arch-review → pm-coder (feature-selection) → PM broadened scope → rename + generalize → pm-coder (procedural-gates) → pm-architect decision record → review loop (plan-check approve; code-review 6 findings all fixed in-pass, routed through owners pm-coder `69fd859` + pm-architect `be10363` — honoring edit-ownership) → pr-prep.
- **Outcome:** Released v2.24.0, PR #212 merged 2026-06-04 (auto-tag ships `v2.24.0`). Review: `.ai-pm/reviews/automode-procedural-gates_review.md`.
- **Last shipped before this:** `nfr-operational-limits-prompt` v2.23.0 (PR #208).
