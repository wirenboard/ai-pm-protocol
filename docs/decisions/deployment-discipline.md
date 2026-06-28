# Deployment doc + strict deploy-per-doc discipline

**Decision (2026-06-28, 5.27.0):** the protocol mandates a **deployment/ops doc**
(`docs/deployment.md`) for any project with a deploy/production surface, and a deploy
follows it **step by step** — never improvised. The doc is the single durable home for
deploy/ops knowledge; the discipline is held by `[persona]` prose plus an audit
dimension, **not** a mechanical deny.

## The incident

An Operator-reported **production incident**: the Orchestrator improvised a deploy and
**took the project down in prod**. Root-cause class — the protocol mandated
`docs/product.md`, `docs/architecture.md`, `docs/threat-model.md`, `docs/contracts/`,
and `docs/decisions/`, but **no deployment/ops doc**. With no canonical home, deploy
knowledge was improvised per-deploy and scattered into the **transient resume pointer**
(`.ai-dev/state/current.md`) — which is gitignored, convenience-cache, and routinely
reset (the session-reset hygiene rule). Scattered, then lost, then a deploy went wrong.

Two failures compounded: (1) no durable runbook to deploy *against*, and (2) the
knowledge that did exist lived in the one place designed to be thrown away. The pointer
is meant to **point** (invariant 6), not hold a runbook.

## The mandate

- A project with a **deploy / production surface** gets `docs/deployment.md` — seeded at
  inception (day-zero ops) or filled by doc-bootstrap from the tree, deepened as the
  deploy path evolves. Conditional, mirroring threat-discovery's *real-users-or-data*
  gate: a pure library / docs-kind project that never deploys is **not** burdened with it.
- A **deploy / release / ops-mutating action follows `docs/deployment.md` step by step**.
  If the doc is **absent or stale** (does not match the real deploy path), the
  Orchestrator **STOPS** and creates/confirms it WITH the Operator *first* — never
  improvises a deploy.
- Deploy/ops knowledge lands in `docs/deployment.md` (durable, through the loop),
  **never** in the resume pointer. The pointer may name "deployed vX" as state; the
  runbook content lives only in the doc (invariant 6 — one home).

## The design — where each piece lives (one home, point don't restate)

- **The discipline body** is an **on-demand procedure** (`src/agents/procedures/deployment.md`)
  with a one-line trigger in the orchestrator's `## Side-tools`. A deploy/ops action is
  *occasional* (it fires on the Operator's ask), so its body belongs read-on-demand —
  mirroring the nine side-tools extracted in 5.26.x — not in the always-loaded core. This
  keeps the core THIN (manifesto rule 3).
- **The mandate to read the doc** rides the **understand beat** (`PROTOCOL.md` beat 1) as
  **one clause**, parallel to how `docs/threat-model.md` is read "where one exists" —
  here, "where the project deploys". PROTOCOL gains a clause, never a section.
- **The doc shape** is a template (`src/templates/deployment.md`): deploy procedure
  (steps · order · preconditions), environments, **rollback**, the secrets home
  (LOCATIONS not values), how a production failure becomes visible, post-deploy
  verification, who owns/funds ops.
- **Inception** (`src/agents/procedures/project-inception.md`) routes its day-zero-ops
  answers into the seeded doc; **doc-bootstrap** (`…/doc-bootstrap.md`) fills it from a
  visible deploy surface in the tree.
- **The audit** (`orchestrator.md` `## Audit`) checks it: for a deploy-surface project,
  the doc exists and is current, and ops runbook content is not journaled into the
  pointer. This is the self-enforcing mechanism that makes the mandate stick between
  sessions.

## Honesty — why no mechanical deny

This is `[persona]` plus the audit dimension. There is **no new mechanical deploy-gate**,
and claiming one would be a review-blocking over-claim. A deploy crosses many surfaces —
an `ssh` session, a forge release/tag, a CI pipeline trigger, a package push, a container
publish, a migration command — and "this tool call is a deploy" is **not reliably
detectable** from the command alone (the same `ssh` or pipeline call serves a hundred
non-deploy purposes). So the deny layer cannot catch "deployed without reading the doc"
in-flight, exactly as it cannot catch a skipped Reviewer in-flight (the persona-floor
class — `docs/decisions/persona-floor-external-substitute.md`). The compensating controls
are the **audit dimension** (catches a missing/stale/scattered doc on the cadence) and the
existing **remote-mutation ask-class** (`PROTOCOL.md` `## Enforcement`), which already asks
before a remote mutation — adjacent to a deploy, but not a doc-currency check.

## Cross-links (not restated)

- The **remote-mutation ask-class** (`PROTOCOL.md` `## Enforcement`) confirms a remote
  mutation before it runs — the closest mechanical neighbour, but it gates *the act*, not
  *deploy-per-doc*.
- **Invariant 4** keeps repo-owned files under git; runtime, deploys, and remote state are
  the remote surface this discipline governs (invariant 4 explicitly carves them out as
  "fair game" for remote action — this discipline says *how* that action is run).

## Out of scope

Choosing a concrete deploy tool, CD platform, or runbook content for any stack is the
downstream project's call, recorded in *its* `docs/deployment.md`. The protocol mandates
*that* a current deployment doc exists and is followed; the project names *how* it deploys.
