# pm-audit — project health check

Run when PM says "check the project", "audit", "review the project", "is everything ok?", "проверь проект", "аудит", "всё ок?", "проверь состояние", or similar. Also triggered automatically from `/pm-plan` when N features have accumulated since the last audit.

**IMPORTANT:** Do NOT perform inline ad-hoc checks (reading review files, running tests manually). Always invoke this skill and spawn `pm-auditor` as a subagent — that is the only valid audit path. Inline checks bypass protocol compliance verification and produce no audit artifact.

## Auto-scope decision (orchestrator decides, not PM)

Before spawning any agent:

1. Check `.ai-pm/audits/` for the most recent `audit-*.md` (by filename date).
2. If `.ai-pm/audits/` is empty or does not exist → first audit → always `full`.
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

## Agent dispatch

All agents below are project agents — use the Agent tool with the exact `subagent_type` shown. Never substitute with `wb-development:code-reviewer` or any other agent — a `PreToolUse` guard in `.claude/settings.json` denies the known `wb-*` role duplicators automatically (see WORKFLOW.md § Hook-level enforcement).

| Agent | subagent_type |
|---|---|
| pm-auditor | `"pm-auditor"` |
| pm-plan-checker | `"pm-plan-checker"` |
| pm-legacy-reader | `"pm-legacy-reader"` |
| pm-architect | `"pm-architect"` |

## Execution

1. **Spawn the `pm-auditor` agent** — Agent tool, `subagent_type: "pm-auditor"`. Pass:
   - Project root
   - Audit date (today, ISO)
   - `scope`: as decided above
   - Optional focus area

   Wait for it to complete. It writes `.ai-pm/audits/audit-<YYYY-MM-DD>.md` and returns the structured summary.

2. **Read the structured summary** — drives the PM-facing flow below.

## PM-facing flow

3. **Tell PM the headline:**
   > "Check complete. Found [N blocking / N notes]. Full report in `.ai-pm/audits/audit-<YYYY-MM-DD>.md`."

   If scope was `diff` — after the headline, ask PM via AskUserQuestion:
   > "This was a quick diff check — only commits since the last audit were scanned. A full audit sweeps the entire project history and can surface gaps that predate the last check (e.g. missing contracts on older features). Run a full audit now?"
   
   Options: **Yes, run full audit** / **No, continue with these findings**.
   If yes — re-spawn `pm-auditor` with `scope: full` before walking through findings.

4. **Walk PM through blocking findings** using the auditor's priority order. For each:
   > "Blocking #<n>: <short title>. **Fix now** (run the remediation step next), **next sprint** (backlog), or **accept-with-context** (note the reason, skip next time)?"

   Three valid answers:
   - **Fix now** → run the remediation step after this conversation (step 6).
   - **Next sprint** → add to `.ai-pm/backlog.md` with reference to this audit.
   - **Accept-with-context** → add to `.ai-pm/backlog.md` marked `accepted (auditor-<date>): <reason>`.

   Never auto-batch. Each blocking gets its own PM decision.

   **"Fix it all" shortcut** — if PM says this before the loop, confirm the full list:
   > "I'll fix all N findings in order: 1. X, 2. Y, 3. Z. Starting with #1."
   Then run step 6 in order. Never start without this confirmation.

5. **Walk PM through notes** briefly:
   > "Note <n>: <short title>. **Fix now / backlog / ignore?**"

6. **Run the chosen remediations** in priority order. One at a time:
   - Missing plan → `/pm-plan <topic>` (retroactive)
   - Missing review → respawn `pm-plan-checker` agent (`subagent_type: "pm-plan-checker"`) on that feature's commits
   - Missing contract → PM validates; orchestrator drafts `.ai-pm/contracts/<feature>.md`
   - Stale contract → PM validates update; orchestrator updates the contract
   - Orphaned implementation → `/pm-plan <topic>` (retroactive)
   - Stale docs → spawn `pm-legacy-reader` (`subagent_type: "pm-legacy-reader"`) or `pm-architect` (`subagent_type: "pm-architect"`)

   **Plan naming rule.** Topic = what is being fixed, not where it came from. `confed-schema-delivery`, not `audit-fixup-confed-schema-delivery`. The audit finding belongs in the plan's context or git history — not in the filename.

   **Update vs create.** If `docs/features/<area>_plan.md` already exists and the finding is a missing scenario or gap within that feature's scope → add to the existing plan rather than creating a new file. Create a new plan only when the fix is genuinely new standalone work that has no existing plan.

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
- PM can accept all at once: `accept-with-context: pre-protocol-migration` → add one entry to `.ai-pm/backlog.md`.
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
