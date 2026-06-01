# pm-audit — project health check

Run when PM says "check the project", "audit", "review the project", or "is everything ok?". Also triggered automatically from `/pm-plan-feature` when N features have accumulated since the last audit.

## Auto-scope decision (orchestrator decides, not PM)

Before spawning any agent:

1. Check `docs/audits/` for the most recent `audit-*.md` (by filename date).
2. If `docs/audits/` is empty or does not exist → first audit → always `full`.
3. Count `feat:` and `fix:` commits since last audit date:
   ```
   git log --since="<last_audit_date>" --oneline | grep -cE "^[a-f0-9]+ (feat|fix):"
   ```
4. Auto-decide:
   - No prior audit OR last audit > 60 days ago OR > 15 feature commits → **full**
   - Otherwise → **diff** (protocol only, fast)

Tell PM one sentence before starting:
> "Running a [quick / full] protocol check — [N features / first audit / N days] since last check."

PM can redirect naturally: "just a quick one" → `diff`; "go deep" / "everything" / "comprehensive" → `full`.

## Execution

1. **Spawn `pm-auditor`** (`.claude/agents/pm-auditor.md`) with:
   - Project root
   - Audit date (today, ISO)
   - `scope`: as decided above
   - Optional focus area

   Wait for it to complete. It writes `docs/audits/audit-<YYYY-MM-DD>.md` and returns the structured summary.

2. **Read the structured summary** — drives the PM-facing flow below.

## PM-facing flow

3. **Tell PM the headline:**
   > "Check complete. Found [N blocking / N notes]. Full report in `docs/audits/audit-<YYYY-MM-DD>.md`."

4. **Walk PM through blocking findings** using the auditor's priority order. For each:
   > "Blocking #<n>: <short title>. **Fix now** (run the remediation step next), **next sprint** (backlog), or **accept-with-context** (note the reason, skip next time)?"

   Three valid answers:
   - **Fix now** → run the remediation step after this conversation (step 6).
   - **Next sprint** → add to `docs/backlog.md` with reference to this audit.
   - **Accept-with-context** → add to `docs/backlog.md` marked `accepted (auditor-<date>): <reason>`.

   Never auto-batch. Each blocking gets its own PM decision.

   **"Fix it all" shortcut** — if PM says this before the loop, confirm the full list:
   > "I'll fix all N findings in order: 1. X, 2. Y, 3. Z. Starting with #1."
   Then run step 6 in order. Never start without this confirmation.

5. **Walk PM through notes** briefly:
   > "Note <n>: <short title>. **Fix now / backlog / ignore?**"

6. **Run the chosen remediations** in priority order. One at a time:
   - Missing plan → `/pm-plan-feature <topic>` (retroactive)
   - Missing review → respawn `pm-plan-checker` on that feature's commits
   - Missing contract → PM validates; orchestrator drafts `.ai-pm/contracts/<feature>.md`
   - Stale contract → PM validates update; orchestrator updates the contract
   - Orphaned implementation → `/pm-plan-feature <topic>` (retroactive)
   - Stale docs → spawn `pm-docs-extractor` or `pm-architect`

   Doc-only remediations (missing plan for already-correct code, stale docs) do not require `pm-coder`.

## Technical quality (full scope only)

After the protocol findings are walked through, if scope was `full`:

> "Protocol check done. Want a deep technical quality review too? It scans the whole project for bugs, security issues, and dead code using multi-agent review. Takes 10–15 minutes. Run it?"

If PM says yes → invoke the built-in `code-review` skill with `ultra` level.
If PM says no → done.

This step is always offered, never assumed. The protocol check is fast and always runs; the deep technical sweep is expensive and PM-gated.

## Pre-protocol-migration artifacts

If the project has artifacts from before this protocol version (old `docs/audit-*.md` files in root, `audit-fixup-*` plans in `docs/features/`):
- Group them as a single note: "Pre-protocol-migration artifacts: [list]".
- PM can accept all at once: `accept-with-context: pre-protocol-migration` → add one entry to `docs/backlog.md`.
- Do NOT surface them as individual blocking findings.

## What this command does NOT do

- Does not read source code — that is the auditor's job in its subagent context.
- Does not check technical code quality on its own — that is the `code-review` skill.
- Does not skip PM. Every finding gets an explicit decision.
- Does not silently start remediation without showing PM the list first.

## Hard rules

- Orchestrator decides scope — never ask PM "full or diff?".
- One PM decision per finding. No batching unless PM says "fix all".
- All remediations go through the normal pipeline — no direct edits.
