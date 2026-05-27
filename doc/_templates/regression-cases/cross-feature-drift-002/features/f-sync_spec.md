---
topic: f-sync
mode: feature
created: 2026-04-15
spec_approved: 2026-04-15
threat_impact: yes
---

# F-sync spec (synthetic)

## Контекст

Cross-device sync via `shared-master-key` rotated quarterly.

## Сценарии

- Scenario: device A registers → fetches `shared-master-key` → device B decrypts via same `shared-master-key`.
