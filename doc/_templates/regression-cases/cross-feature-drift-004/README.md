# Regression case: cross-feature-drift-004

**Class:** Layer 3 — AP-31 spec staleness.

## What this fixture tests

- `features/f-stale_spec.md` — `merged: yes`, `last_modified: 2026-01-01`.
- `STALENESS_FIXTURE_OVERRIDE=90` simulates 90 days since spec date (> 30 default threshold).
- `--regression` runner triggers fixture override automatically via env if expected_finding declares it.

Linter `check_spec_staleness` reads `STALENESS_FIXTURE_OVERRIDE` env var as fixture-only path.

## Expected behavior

`check_spec_staleness` warns at fixture-simulated staleness.
