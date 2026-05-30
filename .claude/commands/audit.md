# Audit project

Run a full code quality audit across the entire project codebase. Use when you want a broad health check — not tied to a specific feature or diff.

This is optional and PM-initiated. It is not part of the regular feature pipeline.

## Scope

Read all source files in the project — not just a diff. Skip: lockfiles, vendored dependencies, generated files, minified assets.

Load project context first: `CLAUDE.md`, `docs/architecture.md`, `docs/stack-notes.md`, linter configs, test runner setup.

If `docs/stack-notes.md` is missing or empty for stack components actually used in the codebase — that itself is the first finding (dim 10 below) and changes how the rest of the audit reads the code: without stack-notes, the audit cannot evaluate stack expectations, only structural quality.

## Dimensions

Check all eight dimensions across the full codebase:

**1. Security** — Hardcoded secrets anywhere in source (high-entropy strings, `password=`, `secret=`, known key shapes). Auth/authorization gaps. Missing input validation at trust boundaries. Sensitive data in logs or error responses.

**2. Stability** — Unhandled errors on realistic failure paths. Null/undefined dereferences. Concurrency issues: races, non-atomic operations, unsafe shared state. Resource leaks: connections, subscriptions, timers without cleanup. Unbounded growth: queues or caches with no ceiling. Silent failures with no logging.

**3. Test coverage** — Areas of meaningful business logic with no tests. Bug-prone paths (error handling, edge cases, boundary conditions) left unexercised. Tests that call code but assert nothing meaningful.

**4. Regressions risk** — Public API surfaces with no contract documentation. Shared utilities used in many places with fragile assumptions. Config/env vars with undocumented behavior.

**5. Conventions** — Code in the wrong layer. Reimplemented utilities the project already provides. Naming or structure diverging from the established pattern across the project.

**6. Simplification** — Heavily duplicated logic that should be consolidated. Heavyweight dependencies used for trivial purposes. Dead code: unused exports, unreachable branches, stale flags.

**7. Documentation drift** — Code that contradicts `docs/architecture.md`, `docs/user-journeys.md`, `docs/stack-notes.md`. Undocumented public APIs where the project documents such things. Stale comments describing removed behavior. `docs/stack-notes.md` sections with `Last reviewed` older than 6 months for components still actively used — note (request `stack-researcher` refresh).

**8. Infrastructure completeness and integration delivery** — Two layers:

- *Presence:* `docs/architecture.md` deploy section vs. actual infrastructure files (Dockerfile, service units, etc.).
- *Delivery:* For every entry in `docs/stack-notes.md` "Integration contracts" — the local artifact (schema, manifest, unit file) is present; the delivery mechanism (Dockerfile COPY, deb package install, volume mount, CRD apply) reaches the path the external system expects; the native validator from the contract is wired into the `Pipeline` block of `CLAUDE.md`. A schema in `schemas/` that the Dockerfile does not copy to the external system's expected path is blocking — the project is shipping a broken integration on every build.

**9. Stack expectations compliance** — For every component with an entry in `docs/stack-notes.md`, audit the code against the cited idioms and constraints. Code that contradicts a sourced rule → blocking with citation reproduced in the finding. Tests that codify a spec-forbidden value (e.g., property-based round-trip over a range the spec rejects) → blocking — they freeze the wrong contract.

**10. Stack-notes integrity** — Components used in the code but missing from `docs/stack-notes.md` → blocking (orchestrator must spawn `stack-researcher` and re-audit). Validators listed in stack-notes "Validators wired into pipeline" but absent from `CLAUDE.md` Pipeline block → blocking. Integration contracts listed but lacking a delivery mechanism in the repo → blocking. Unsourced rules in stack-notes → blocking (every rule must cite a URL).

## Severity levels

Two levels only:

- **blocking** — outage risk, data loss, exploitable, or critical infrastructure gap. Must be addressed.
- **note** — a real observation worth considering. PM decides: fix now, add to backlog, or ignore.

## What NOT to flag

- Theoretical risks that need unlikely preconditions.
- Style and formatting linters already govern.
- Every small imperfection in a healthy codebase — focus on real risks.
- Pre-existing issues that pose no active risk and are clearly known/accepted.

## Output

Write to `docs/audit-<YYYY-MM-DD>.md`:

```markdown
# Project audit — <date>

## Summary
<2-3 sentences: overall health, biggest concerns, tone — written for a PM>

## Blocking
1. `file:line` — <issue>. Why it matters: ... Fix: ...

## Notes
1. `file:line` — <observation>. Why it matters: ...

## What looks healthy
<brief note on areas that are solid — gives PM context for the findings above>
```

Tell PM: "Audit complete. Found [N blocking / N notes]. Full report in `docs/audit-<date>.md`."

Present each note to PM: "Fix now, add to backlog, or ignore?" — never add to backlog without explicit PM approval.

## How fixes happen (and how they do not)

Audit is read-only — it finds gaps, it does not close them. Closure is the job of the standard pipeline. When PM says **"Fix now"** for a finding, the orchestrator:

1. Opens `/plan-feature` with topic `audit-fixup-<short-area>` (e.g., `audit-fixup-missing-stack-notes`, `audit-fixup-schema-delivery`).
2. Plan includes the audit finding verbatim in an **Audit reference** section — same shape as the "Incident facts" section used for prod incidents.
3. Standard pipeline runs: plan → coder → reviewer → pr-prep → PR → merge → deployment script.
4. PM sees the PR, approves merge.

The orchestrator never edits files directly to close an audit finding, never `ssh`-patches remote systems based on an audit finding, never amends the audit report itself to mark a finding "fixed" — fixes are evidenced by closed PRs, not by edited reports.

If an audit finding is a missing `docs/stack-notes.md` entry — the fix is to spawn `stack-researcher`, not to edit stack-notes by hand.

If an audit finding is a missing validator in `CLAUDE.md` Pipeline — the fix is a plan that extends the Pipeline block (and the project's CI), reviewer dim 9 enforces the new validator from that point forward.

If an audit finding is a delivery gap (artifact not reaching its external system) — the fix is a plan that updates Dockerfile / deployment script and adds the native validator to Pipeline.

## Hard rules

- Read-only. Never edit code, never commit, never `ssh`-patch any remote system.
- Write for the PM — no internal jargon, no agent names, plain language.
- Don't manufacture findings. A short report with real issues is better than a long one with noise.
- Every closure goes through `/plan-feature`. Audit reports are not patched after the fact — the report is a snapshot; the PR is the truth.
