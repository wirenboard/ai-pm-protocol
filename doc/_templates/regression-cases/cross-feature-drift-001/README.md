# Regression case: cross-feature-drift-001

**Class:** Layer 3 cross-feature contradiction — invariant overlap between two specs (encryption).

**Anchor incident reference:** spec § Scenario А1. F-01 устанавливает «server не имеет plaintext access». F-07 (export) добавляет server-side temp storage.

## What this fixture tests

Synthetic anonymized case с 2 files:
- `features/f-auth_spec.md` — invariant в `## Invariants extracted` section: «`server-side-decrypt` ни при каких обстоятельствах запрещено».
- `features/f-export_spec.md` — Decision вводит affirmative `server-side-decrypt` для temp CSV storage.

## Expected behavior

Run `bash scripts/check-spec-discipline.sh --regression`:

`check_cross_feature_invariant` должен flag contradiction (см. `expected_finding.md`).
