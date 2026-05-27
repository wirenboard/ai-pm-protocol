---
topic: f-export
mode: feature
lite-mode: no
created: 2026-04-01
spec_approved: 2026-04-01
topology_impact: yes
threat_impact: yes
---

# F-export spec (synthetic)

## Контекст

Async CSV export — temp storage required.

## Сценарии

- Scenario: user requests export → background job → CSV download via `server-side-decrypt` middleware → email link.

## Implementation note

Use `server-side-decrypt` для temp CSV staging area, 15-min retention. Plaintext available на сервере на время export window.
