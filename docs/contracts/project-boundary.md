# Contract: project-boundary

**Agents stay within the permitted root set, and repo-owned files change only through git** — no agent reads, searches, or writes outside the session root or any sibling root a valid component manifest declares, and a repo-owned file is never silently edited in place on a remote system.

Two hard lines: every agent stays inside the permitted root set; and any repo-owned file changes through git, never by an in-place remote edit.

## Must work

- Every agent stays within the **permitted root set** — never reads, searches, or writes outside it. The set is the **session root** by default, widened to the sibling roots a valid `.ai-dev/components.json` declares (the multi-repo case: one session spanning a front end, a back end, firmware). The carve-out inside the root holds regardless of any manifest: the enforcer's own source (`.ai-dev/tooling/`) is off-limits to read and write.
- The widening is **fail-CLOSED — the load-bearing guarantee.** An absent, malformed, wrong-shaped, non-existent-directory, or overbroad manifest (one declaring a filesystem root or an ancestor of the session root) collapses the permitted set back to the **single session root** — never widening on doubt. A project with no manifest behaves byte-identically to a single-root one; the widening is opt-in. The schema, the validator, and the full fail-closed rule have one home: `docs/architecture.md` `## Components` and the validator it points at (`componentRoots` in `src/adapter/engine.mjs`, unit-tested in `src/adapter/components.test.mjs`) — not restated here.
- A repo-owned file (code, schema, config template, manifest) changes through git — never by an in-place edit on a remote system.
- Runtime state, deployment actions, dev experiments, and Operator-initiated remote maintenance remain permitted — the boundary is about the source of truth, not about whether remote access is allowed at all.

## Must not break

- The boundary holds across sessions — mechanically enforced at the tool boundary, not dependent on a session re-reading the rule. It is `[mechanical]` on **both** platforms: the read/find/write boundary checks resolve no actor, so there is no Claude fail-open caveat (unlike the actor-dependent orchestrator-content and stamp-write denies).
- **Only the read/find/write boundary denies consult the component set.** The `.ai-dev/tooling/` self-patch deny, the stamp-write deny, the truncation deny, the orchestrator-content deny, and the merge-gate stay anchored to the session root, unconditional — a manifest never widens them. A sibling the manifest does **not** declare stays denied.
- Legitimate read-only diagnostics and the project's own deployment/CI channel are never blocked — the bright line is "does the remote file have a sibling in the repo?", not "is remote access allowed?".
