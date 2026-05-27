---
topic: f-analytics
mode: feature
created: 2026-04-01
spec_approved: 2026-04-01
threat_impact: yes
---

# F-analytics spec (synthetic)

## Контекст

Default `telemetry-collection` enabled для product analytics. Sends events on user actions.

## Сценарии

- Scenario: user opens app → `telemetry-collection` начинает sending events to `/metrics` endpoint.
