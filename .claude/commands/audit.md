# Audit project

Run a protocol compliance audit across the project. Use when PM wants to verify that the development process was followed — plans exist for all features, reviews happened, contracts are current, docs reflect reality.

This is optional and PM-initiated. It is not part of the regular feature pipeline.

## Orchestration

This command does **not** read the codebase itself. It spawns the `auditor` subagent and uses its structured summary to drive a PM-facing flow.

1. **Spawn `auditor`** (defined in `.claude/agents/auditor.md`) using the Agent tool. Pass:
   - The project root (`git rev-parse --show-toplevel`).
   - The audit date (today, ISO format).
   - `scope`: `full` (default — check all merged feature branches) or `diff` (check only branches merged since the most recent `docs/audits/audit-*.md`). Use `diff` for routine checks between full audits; use `full` quarterly or when PM asks for a broad sweep.
   - Optional focus area if PM asked for a narrow audit.

   Wait for it to complete. It will write `docs/audits/audit-<YYYY-MM-DD>.md` and return the structured summary block.

2. **Read the structured summary** from auditor's return — that is what drives the next steps. Do not re-read the full report unless PM asks a specific detail.

3. **Tell PM the headline:**
   > "Audit complete. Found [N blocking / N notes]. Full report in `docs/audits/audit-<YYYY-MM-DD>.md`."

4. **Walk PM through blocking findings using the priority order** from auditor's summary. For each blocking finding ask **one** question — when to fix:
   > "Blocking #<n>: <short title>. **Fix now** (run the remediation step next), **next sprint** (backlog with reason), or **accept-with-context** (document the conscious acceptance, stays in audit history)?"

   Three valid PM answers per blocking:
   - **Fix now** → orchestrator runs the remediation step after the audit conversation closes (see step 6).
   - **Next sprint** → add to `docs/backlog.md` with a reference to this audit report.
   - **Accept-with-context** → add a one-line entry to `docs/backlog.md` marked "accepted (auditor-<date>): <reason>" so the next audit does not re-raise it as new.

   Never auto-batch these answers. Each blocking gets its own PM decision.

   **"Fix it" / "исправь" after the audit summary** — if PM says this before the per-finding loop starts, treat it as "fix now" for all blocking findings. Confirm before acting:
   > "I'll fix all N findings in priority order: 1. X, 2. Y, 3. Z. Starting with #1 now."
   Then run step 6 in priority order. Do NOT silently start without this confirmation — the PM must see what they approved.

5. **Walk PM through notes** the same way, briefer:
   > "Note <n>: <short title>. **Fix now / backlog / ignore?**"

   Ignore drops the note. Backlog adds to `docs/backlog.md`. Fix now runs the remediation step.

6. **Run the chosen remediation steps** in the priority order from auditor's summary. One at a time — never in parallel, never skipping ahead.

   Remediation depends on finding type:
   - **Missing plan** → `/plan-feature <topic>` (retroactive plan — document what was built)
   - **Missing review** → respawn `reviewer` on the feature's commits
   - **Missing contract** → PM validates; orchestrator drafts and saves `.ai-pm/contracts/<feature>.md`
   - **Stale contract** → PM validates update; orchestrator updates `.ai-pm/contracts/<feature>.md`
   - **Orphaned implementation** → `/plan-feature <topic>` (retroactive)
   - **Stale docs** → spawn `docs-extractor` or `architect` to refresh `docs/architecture.md` / `docs/user-journeys.md`

   Each remediation that produces new artifacts (plans, contracts) goes through the normal pipeline — plan → coder (if code gaps) → reviewer → pr-prep. Doc-only remediations (missing plan for already-correct code, stale docs) do not require coder.

7. **After all chosen remediations land**, the next audit will compare against the new artifacts. Findings present in the previous audit and not addressed (either by fix-now, accept-with-context, or backlog item) will surface again — that is the design.

## What this command does NOT do

- Does not read the source code itself. That is the auditor's job, in a subagent context that does not pollute main session.
- Does not check technical code quality (security, performance, dead code) — that is the reviewer's job per feature.
- Does not edit any file, including the audit report. Audit reports are snapshots; once written by the auditor, they are not patched.
- Does not `ssh`-patch any remote system. Closures go through the normal pipeline.
- Does not skip PM. Every blocking and every note gets an explicit PM decision. No silent backlog adds, no silent fixes.

## Hard rules

- Read-only orchestration. Only the auditor reads artifacts; only the PM-facing flow above runs in the main session.
- Write for the PM in product language. The auditor's technical detail lives in the report; the conversation surfaces severity and choice.
- One PM decision per finding. No batching.
- No silent remediation. PM sees the full list before the first step runs.
