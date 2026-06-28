# Durable-text hygiene + an audit cleanup dimension

**Decision (2026-06-28, 5.27.3):** invariant 6 ("lead with current truth; supersede,
don't accumulate; one home") and the thin-core manifesto gain a **periodic enforcing
mechanism** — an `audit` **durable-text hygiene** dimension that re-grounds durable
authored text against current reality, plus in-loop pointer compaction at session-reset.
The discipline is `[persona]` prose **plus** the audit dimension — there is **no
mechanical deny** (detecting "stale framing" or "a journaled pointer" is not reliably
mechanical).

## The rot

Invariant 6 is right but, in-loop, **persona-only**: nothing re-grounds durable text
against reality, so over a long-lived project (dogfood or downstream) three rot symptoms
accumulate — all observed **live in this repo**:

1. **Stale phase-framing.** Durable docs (the brief, `docs/architecture.md`, the resume
   pointer) keep **early-phase framing** — e.g. an "MVP" label — long after the project
   scaled past it. Nothing re-grounds the framing against the *current* phase.
2. **Resume-pointer journaling.** Under frequent checkpointing,
   `.ai-dev/state/current.md` grows into an **append-only journal** — stacked "supersedes
   everything below" status blocks — instead of staying a compact pointer. (Live: this
   repo's pointer was exactly this.)
3. **Backlog / forge-issue status cruft.** `.ai-dev/backlog.md` (and, in
   `collaboration.backlog: forge` mode, the forge issues) accumulate **RESOLVED entries
   left as archaeology** and stale statuses; resolved work is not pruned / closed.

The trigger was downstream feedback plus Operator findings observed directly here — the
same class the deployment-discipline decision (`deployment-discipline.md`) hit from the
pointer-journaling angle, generalised.

## The mechanism — where each piece lives (one home, point don't restate)

- **The periodic enforcement** is the `audit` **durable-text hygiene** dimension
  (`orchestrator.md` `## Audit` step 2). It checks and dispatches all three symptoms:
  phase-framing matches the current phase; the pointer is a compact pointer (points at
  the git tag / CHANGELOG / forge, carries only the live queue + cadence markers +
  non-canonical conventions), not a journal; backlog/issue status is pruned (RESOLVED
  removed; in forge mode, shipped work's issue closed). This is the Operator's "через
  аудит" — the self-enforcing mechanism that makes invariant 6 stick *between* sessions.
- **The in-loop maintenance** is pointer compaction at the **session-reset / checkpoint**
  step (`orchestrator.md` `## Your seat`): the pointer is collapsed (superseded status
  blocks dropped) so it stays a pointer, not a log. The pointer-update bullet's "points,
  never restates" is extended to "**and never accumulates a journal**".
- **The backlog status rule** (`orchestrator.md` `## Backlog`): an entry carries OPEN /
  RESOLVED; a RESOLVED entry is pruned at the next backlog touch (invariant 6 — don't
  accumulate); in forge mode a shipped issue is closed on ship. The audit dimension is
  the periodic catch for what slips through.

## De-dup with the deployment dimension (the one structural call)

The pre-existing **deployment-doc currency** dimension already checked "deploy/ops runbook
content is NOT journaled into the resume pointer". That overlaps the general
pointer-is-a-compact-pointer rule. To avoid two competing pointer checks, the **general**
rule ("the pointer is a compact pointer, not a journal") is owned **once** — by the
durable-text-hygiene dimension. The deployment dimension keeps its **specific** check
(runbook content belongs in `docs/deployment.md`, not the pointer) and **points at**
durable-text hygiene for the general rule rather than restating it (invariant 6 — one
home).

## Honesty — why no mechanical deny

`[persona]` + the audit dimension, **no new mechanical claim**. "This framing is stale"
and "this pointer is a journal" are **judgment reads**, not byte patterns a deny rule can
match — the same persona-floor class as a skipped Reviewer or an unread deployment doc
(`persona-floor-external-substitute.md`). The deny layer cannot catch rot in-flight; the
compensating control is the **audit cadence** (offered every ~5 shipped features), which
catches accumulated rot on the sweep. Claiming any of this as mechanical would be a
review-blocking over-claim.

## Out of scope

Editing the live `.ai-dev/backlog.md` or `.ai-dev/state/current.md` is the
**Orchestrator's** to author at ship/reset, not a discipline-doc change. This decision
records the discipline; the Orchestrator applies it (prunes, compacts, closes) in the
loop.
