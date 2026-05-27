# Regression case: cross-feature-drift-005

**Class:** Layer 3 — `affects_features:` scoped cross-check.

## What this fixture tests

- `features/f-base_spec.md` — invariant: `cleartext-logging` запрещено. `affects_features: [f-audit]`.
- `features/f-audit_spec.md` — Decision: `cleartext-logging` enabled для audit trail.
- `features/f-unrelated_spec.md` — Mentions `cleartext-logging` в Не-в-scope (NOT в targets due to affects_features scope).

Validates: when `affects_features:` populated, scope narrows to declared targets (O(N) targeted, not O(N²) pairwise).

## Expected behavior

Linter flags contradiction f-base ↔ f-audit (in scope); does NOT flag f-unrelated (out of scope).
