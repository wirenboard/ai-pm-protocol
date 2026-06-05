> **Topic file of the orchestration spec** — read on demand from `WORKFLOW.md`'s navigation map. The cross-cutting always-on invariants live in `WORKFLOW.md`; this file is the single home for the rules named in its headings. Read it before acting on those rules.

### Security-relevant surfaces

**Single source for "this feature touches security."** These are the only surfaces that mark a feature as security-touching. `/pm-plan`, `pm-plan-checker`, and `pm-auditor` reference this subsection **by name** ("`### Security-relevant surfaces` in `workflow/security-surfaces.md`") and must never re-encode the list — mirroring how `### Pending-migration detection in MIGRATIONS.md` is the single source for un-migrated state. A feature touches a security-relevant surface when it touches any of:

- **Authentication** — login, sessions, tokens, credential handling.
- **Cryptography / key management** — encryption, signing, key generation / storage / rotation.
- **Data-at-rest / storage** — how persisted data is stored, protected, or encrypted.
- **Network / transport** — what crosses the wire, TLS, exposed endpoints, transport security.
- **User input** — anything externally supplied that reaches a query, command, parser, or rendering path.
- **PII** — personally identifiable or otherwise sensitive personal data.
- **Access control** — who may do what; roles, permissions, authorization checks.

### Threat-model lifecycle

`docs/threat-model.md` has a full lifecycle on **security-bearing projects only** — a project is security-bearing exactly when `docs/threat-model.md` is present (it is drafted at bootstrap only when security is in play, so its presence is the durable on-disk signal). Non-security projects have no threat-model and are never flagged.

- **Owner:** `pm-architect` — the same owner as the adjacent `docs/architecture.md` `## Security constraints`. The two are complementary: the threat-model is *what we protect / from whom / likelihood-impact* (the risk layer); Security constraints are *the enforceable implementation rules* (the rule layer). They are wired **threat → constraint by stable `SCn` ID reference**, one-way, no duplicated content.
- **Bootstrap:** when security is in play, `pm-architect` **drafts a populated** `docs/threat-model.md` from the Q7 security answers — never an empty skeleton.
- **Per feature:** a feature touching any `### Security-relevant surfaces` item on a security-bearing project must list `docs/threat-model.md` in its plan's "Docs to update" with the relevant Threat rows; after coding, the orchestrator spawns `pm-architect` to update it (the same handoff as `docs/architecture.md`).
- **Plan-checker:** a security-touching plan that omits the threat-model update is **blocking** (same class as a missing "Stack expectations touched" section).
- **Auditor:** an empty / skeleton threat-model is **blocking**; a stale one (`Last reviewed` predates a merged security-touching feature) is a **note**. Remediation: spawn `pm-architect` to draft / refresh.
