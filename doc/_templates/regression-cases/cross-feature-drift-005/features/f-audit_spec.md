---
topic: f-audit
mode: feature
created: 2026-03-01
spec_approved: 2026-03-01
threat_impact: yes
---

# F-audit spec (synthetic)

## Контекст

Audit trail для compliance — `cleartext-logging` enabled для critical events. Trade-off accepted by compliance team.

## Сценарии

- Scenario: user action → `cleartext-logging` captures action + user_id + timestamp.
