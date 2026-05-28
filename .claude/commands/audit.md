# Audit project

Run a full code quality audit across the entire project codebase. Use when you want a broad health check — not tied to a specific feature or diff.

This is optional and PM-initiated. It is not part of the regular feature pipeline.

## Scope

Read all source files in the project — not just a diff. Skip: lockfiles, vendored dependencies, generated files, minified assets.

Load project context first: `CLAUDE.md`, `docs/architecture.md`, linter configs, test runner setup.

## Dimensions

Check all eight dimensions across the full codebase:

**1. Security** — Hardcoded secrets anywhere in source (high-entropy strings, `password=`, `secret=`, known key shapes). Auth/authorization gaps. Missing input validation at trust boundaries. Sensitive data in logs or error responses.

**2. Stability** — Unhandled errors on realistic failure paths. Null/undefined dereferences. Concurrency issues: races, non-atomic operations, unsafe shared state. Resource leaks: connections, subscriptions, timers without cleanup. Unbounded growth: queues or caches with no ceiling. Silent failures with no logging.

**3. Test coverage** — Areas of meaningful business logic with no tests. Bug-prone paths (error handling, edge cases, boundary conditions) left unexercised. Tests that call code but assert nothing meaningful.

**4. Regressions risk** — Public API surfaces with no contract documentation. Shared utilities used in many places with fragile assumptions. Config/env vars with undocumented behavior.

**5. Conventions** — Code in the wrong layer. Reimplemented utilities the project already provides. Naming or structure diverging from the established pattern across the project.

**6. Simplification** — Heavily duplicated logic that should be consolidated. Heavyweight dependencies used for trivial purposes. Dead code: unused exports, unreachable branches, stale flags.

**7. Documentation drift** — Code that contradicts `docs/architecture.md` or `docs/user-journeys.md`. Undocumented public APIs where the project documents such things. Stale comments describing removed behavior.

**8. Infrastructure completeness** — `docs/architecture.md` deploy section vs. actual infrastructure files present (Dockerfile, service units, etc.).

## Severity levels

- **blocking** — outage risk, data loss, exploitable, or critical infrastructure gap.
- **warning** — concrete measurable risk under realistic conditions.
- **nit** — improvement worth considering, not urgent.

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

## Warnings
1. `file:line` — <issue>

## Nits
(omit if none worth surfacing)

## What looks healthy
<brief note on areas that are solid — gives PM context for the findings above>
```

Tell PM: "Audit complete. Found [N blocking / N warnings]. Full report in `docs/audit-<date>.md`."

## Hard rules

- Read-only. Never edit code, never commit.
- Write for the PM — no internal jargon, no agent names, plain language.
- Don't manufacture findings. A short report with real issues is better than a long one with noise.
