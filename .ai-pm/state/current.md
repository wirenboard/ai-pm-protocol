# Execution State

- **Status:** planning
- **Active task:** `taxonomy-drift-sweep` — EPIC cross-doc auditor slice 2 ("drift catcher"). pm-auditor dim 5 gets a structural NOTE catching a taxonomy/enum value/identifier-grammar RESTATED in `docs/user-journeys.md` (step bodies / `**Invariants:**` blocks) instead of referencing `## Behavioral contract`: (1) exact-token match against a declared taxonomy (the precise "6-in-docs-7-in-code" catch); (2) wire-token SHAPES reused-by-reference from the existing structural-token note; (3) dangling Behavioral-contract reference. user-journeys.md ONLY (no overlap with the existing contract/product-map token note). Structural/shape-not-meaning, note-not-blocking, presence-conditional, additive, no migration. Running AUTONOMOUS (per-feature). Plan: `doc/features/taxonomy-drift-sweep_plan.md`. Branch `feature/taxonomy-drift-sweep`.
- **Next step:** arch-review → pm-coder (pm-auditor.md + optional 1-line pm-architect.md) → pm-architect updates doc/architecture.md → review loop → pr-prep → STOP before merge. Target ~v2.22.0.
- **Last shipped:** `invariants-index` v2.21.0 (PR #201).
