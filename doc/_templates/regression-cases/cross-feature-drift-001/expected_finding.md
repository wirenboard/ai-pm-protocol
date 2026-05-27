# Expected findings — cross-feature-drift-001

`check-spec-discipline.sh` running on this fixture **must** surface following findings.

## Expected check failures (Layer 3 cross-feature-bounded family)

### AP-33 — Cross-feature invariant contradiction

`f-auth_spec.md` invariant rejects `server-side-decrypt`. `f-export_spec.md` Decision implements `server-side-decrypt`. Pairwise check must flag contradiction.

expected_keyword: cross-feature-invariant
expected_keyword: server-side-decrypt
