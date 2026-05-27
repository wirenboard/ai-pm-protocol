---
topic: f-auth
mode: feature
lite-mode: no
created: 2026-01-01
spec_approved: 2026-01-01
merged: yes
topology_impact: yes
threat_impact: yes
---

# F-auth spec (synthetic)

## Контекст

E2E encrypted auth flow.

## Invariants extracted

- `server-side-decrypt` ни при каких обстоятельствах не выполняется — plaintext остаётся client-side.
- Master key MUST NOT leave client device.
