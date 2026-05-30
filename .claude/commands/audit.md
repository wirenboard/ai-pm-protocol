# Audit project

Run a full code quality audit across the entire project codebase. Use when PM wants a broad health check — not tied to a specific feature or diff.

This is optional and PM-initiated. It is not part of the regular feature pipeline.

## Orchestration

This command does **not** read the codebase itself. It spawns the `auditor` subagent and uses its structured summary to drive a PM-facing flow.

1. **Spawn `auditor`** (defined in `.claude/agents/auditor.md`) using the Agent tool. Pass:
   - The project root (`git rev-parse --show-toplevel`).
   - The audit date (today, ISO format).
   - `scope`: `full` (default — read all source) or `diff` (read only files changed since the most recent `docs/audit-*.md` + cross-references). Use `diff` for routine in-progress checks between full audits; use `full` quarterly or when PM asks for a broad sweep.
   - Optional focus area if PM asked for a narrow `full` audit.

   Wait for it to complete. It will write `docs/audit-<YYYY-MM-DD>.md` and return the structured summary block.

2. **Read the structured summary** from auditor's return — that is what drives the next steps. Do not re-read the full report unless PM asks a specific detail.

3. **Tell PM the headline:**
   > "Audit complete. Found [N blocking / N notes]. Full report in `docs/audit-<YYYY-MM-DD>.md`."

4. **Walk PM through blocking findings using the priority order** from auditor's summary. For each blocking finding ask **one** question — when to fix:
   > "Blocking #<n>: <short title>. **Fix now** (open `/plan-feature audit-fixup-<topic>` next), **next sprint** (backlog with reason), or **accept-with-context** (document the conscious acceptance, stays in audit history)?"

   Three valid PM answers per blocking:
   - **Fix now** → orchestrator opens `/plan-feature audit-fixup-<topic>` after the audit conversation closes.
   - **Next sprint** → add to `docs/backlog.md` with a reference to this audit report.
   - **Accept-with-context** → add a one-line entry to `docs/backlog.md` marked "accepted (auditor-<date>): <reason>" so the next audit does not re-raise it as new.

   Never auto-batch these answers. Each blocking gets its own PM decision.

5. **Walk PM through notes** the same way, briefer:
   > "Note <n>: <short title>. **Fix now / backlog / ignore?**"

   Ignore drops the note. Backlog adds to `docs/backlog.md`. Fix now opens `/plan-feature audit-fixup-<topic>`.

6. **Open the chosen fixup plans** in the priority order from auditor's summary. The orchestrator runs `/plan-feature` for each, one at a time — never in parallel, never skipping ahead. The plan title is `audit-fixup-<topic>`, and the plan's first section is **Audit reference** quoting the relevant finding verbatim (same shape as the **Incident facts** section for prod-incident hotfixes).

7. **After all chosen fixups land** (their PRs merged), the next audit will compare against the closed fixup PRs. Findings present in the previous audit and not addressed (either by fix-now, by an explicit accept-with-context, or by a backlog item) will surface again — that is the design.

## What this command does NOT do

- Does not read the source code itself. That is the auditor's job, in a subagent context that does not pollute main session.
- Does not edit any file, including the audit report. Audit reports are snapshots; once written by the auditor, they are not patched.
- Does not `ssh`-patch any remote system. Closures go through `/plan-feature` → coder → reviewer → pr-prep → PR → merge → deployment script.
- Does not skip PM. Every blocking and every note gets an explicit PM decision. No silent backlog adds, no silent fixes.

## Hard rules

- Read-only orchestration. Only the auditor reads the codebase; only the PM-facing flow above runs in the main session.
- Write for the PM in product language. The auditor's technical detail lives in the report; the conversation surfaces severity and choice.
- One PM decision per finding. No batching.
- Closures only through `/plan-feature audit-fixup-*`. No direct edits, no shortcut paths.
