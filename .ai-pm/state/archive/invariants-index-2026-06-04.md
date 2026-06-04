# Execution State

- **Status:** planning
- **Active task:** `invariants-index` — first slice of the EPIC cross-document-consistency-auditor. Make `## Behavioral contract (taxonomies & invariants)` the single System-invariants INDEX: reference invariants by place (inline / `SCn` by ID / journey by name), never relocate `SCn` (would break threat→constraint wiring), never duplicate. pm-architect authors the index; pm-auditor dim 5 gets a structural, presence-conditional, shape-not-meaning NOTE (scattered SCn/journey-invariant homes but no index, or dangling SCn) — not blocking. Software-kind, non-user-facing → no contract/advocate. Additive, no migration. Plan: `doc/features/invariants-index_plan.md`. Branch `feature/invariants-index`.
- **Next step:** PM review of plan → (offer arch-review) → pm-coder (architecture.md.tmpl + pm-architect.md + pm-auditor.md) → pm-architect updates doc/architecture.md (decision record) → review loop → pr-prep. Target ~v2.21.0.
- **Last shipped:** `automode` v2.20.0 (PR #199).
