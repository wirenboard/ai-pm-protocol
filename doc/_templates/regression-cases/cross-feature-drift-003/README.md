# Regression case: cross-feature-drift-003

**Class:** Layer 3 — foundational invariant violation (vision.md).

## What this fixture tests

- `vision.md` устанавливает foundational invariant: «`telemetry-collection` ни при каких не выполняется без opt-in».
- `features/f-analytics_spec.md` вводит affirmative `telemetry-collection` без mention opt-in.

This tests foundational vs feature spec cross-check (different code path than spec-vs-spec).

## Expected behavior

`check_cross_feature_invariant` flags foundational contradiction.
