# Parallel feature work — worktree-per-feature

**Question.** Can several features run concurrently under the protocol without
weakening any guarantee, and what is the minimal mechanism?

**Decision (Operator-approved, 2026-06-12).** Worktree-per-feature, inside the
project root, with a disjointness rule and no scheduler. The operating
procedure: `src/agents/procedures/parallel-work.md` (loaded on demand — the
first on-demand procedure body; the orchestrator carries only the trigger).

## The design

- **Worktrees live inside the root** — `.ai-dev/worktrees/<topic>/`,
  gitignored. Forced by the project-boundary deny (PROTOCOL.md invariant 2):
  an agent cannot read or write outside the root, so an external worktree
  would be unreachable. Enforcement holds **via the main session's root** —
  agents spawned by the main-checkout session are covered wherever they work,
  worktrees included. **Never seat a standalone session inside a worktree:**
  the vendored tooling is untracked, so a worktree has none — a session
  rooted there runs with no mechanical enforcement (the hook fails open).
- **One feature = one branch = one worktree.** The main checkout stays on
  `main` as the Orchestrator's seat: transients (plans, stamps, state) live
  there, and pushes run there — the merge-gate reads the stamp at push time
  in the pushing tree. Builders work in the feature's worktree; the Reviewer
  reads that worktree's diff.
- **Disjointness rule.** Each plan names its touched surface. A feature
  overlapping an active feature's surface queues instead of parallelizing —
  the stale-branch rule (conflict ⇒ cut fresh, work lost) prices overlap out.
  Judgment call by the Orchestrator from the named surfaces; when in doubt,
  serial.
- **What parallelizes:** Builder and Reviewer wall time (background spawns).
  **What serializes, honestly:** Operator plan approvals and merges, and the
  Orchestrator's own git operations. The human is the deliberate bottleneck —
  decisions are the Operator's (invariant 7).
- **Merge order is free, the ship beat is serial.** Disjoint features open
  independent PRs to `main` in any order — but `package.json` + CHANGELOG are
  a shared surface every ship touches, so only one shipped-unmerged PR exists
  at a time; a branch whose base `main` advanced is recut before its bump
  (the procedure's ship step). Deliberate stacking instead falls under the
  stacked-queue rules (orchestrator.md `## Your seat`: retarget before merge;
  verify async merge).
- **Cleanup at ship:** remove the worktree, delete the branch, transients in
  the standard order (stamp last).

## Guarantees untouched

Stamp format, merge-gate, deny rules are already per-topic and hold as-is.
Each parallel feature gets its own fresh Reviewer (invariant 3 applies per
feature, unchanged). PROTOCOL.md's loop is unchanged — parallelism is an
orchestrator operating mode, not a new beat.

## Consciously deferred

No scheduler or engine; no automatic surface detection (plans name surfaces,
the Orchestrator judges); no multi-plan approval UX beyond the state table.
Field evidence first — revisit when real parallel use shows the gaps.

## Sources

The backlog's parallel-work entry (2026-06-12) seeded the design questions and
the stacked-PR field notes (auto-close on base delete; async merge
verification) that became the stacking caveat above; the 8D run-notes behind
those field notes are deleted per D8 — git history holds them.
