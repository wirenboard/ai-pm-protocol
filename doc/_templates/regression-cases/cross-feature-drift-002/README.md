# Regression case: cross-feature-drift-002

**Class:** Layer 3 — cross-feature scope creep on crypto invariant.

## What this fixture tests

- `features/f-keystore_spec.md` — invariant: «`shared-master-key` ни при каких не используется — per-device keys mandatory».
- `features/f-sync_spec.md` — Decision: vводит `shared-master-key` для cross-device sync convenience.

## Expected behavior

`check_cross_feature_invariant` flags contradiction.
