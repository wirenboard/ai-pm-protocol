---
topic: f-keystore
mode: feature
created: 2026-02-01
spec_approved: 2026-02-01
merged: yes
threat_impact: yes
---

# F-keystore spec (synthetic)

## Invariants extracted

- `shared-master-key` ни при каких обстоятельствах не используется — каждый device имеет собственный rotation cycle.
- Cross-device sync MUST NOT rely on shared secret.
