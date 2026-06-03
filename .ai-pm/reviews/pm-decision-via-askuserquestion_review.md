# Plan-compliance review — pm-decision-via-askuserquestion

Plan: `doc/features/pm-decision-via-askuserquestion_plan.md`
Branch: `feature/pm-decision-via-askuserquestion` (commits `40aa892`, `dafc332`)
Diff: `git diff main...HEAD` — 4 files (`WORKFLOW.md` +2, `.claude/settings.json` +1/-1, `doc/architecture.md` +2, plan +131).

## Plan compliance

- ✓ **Scenario 1** (substantive multi-option forks → AskUserQuestion) — `WORKFLOW.md:303`: "Surface substantive decisions via the AskUserQuestion tool... a scope decision, accept-vs-fix, which-of-N options, prioritization... not a plain-prose '(A)…/(B)…?'." Placed directly in the PM-communication guidance block (right after "Ask one question at a time", after "plain language"/"never show code"). Check `workflow-convention-present` satisfied.
- ✓ **Scenario 2** (simple proceed/confirm gates stay prose) — `WORKFLOW.md:303`: "Simple proceed / confirm gates — merge-authorization, 'ready?', a plain yes/no — stay in prose; do **not** force AskUserQuestion on every binary, or it becomes tool-spam." Check `scope-not-overreaching` satisfied.
- ✓ **Scenario 3** (convention recorded in WORKFLOW.md near PM-communication guidance) — present at line 303, inside the PM-communication block (lines 290-303).
- ✓ **Scenario 4** (UPS route-reminder carries a short pointer clause) — `.claude/settings.json:66`, appended to `additionalContext`: "Surface substantive PM decision-forks (scope, accept-vs-fix, which-of-N, prioritization) via the AskUserQuestion tool, not plain prose; simple yes/no proceed-gates may stay prose." Check `reminder-clause-present` satisfied.
- ✓ **Key decision encoded** (SUBSTANTIVE forks only; EXEMPT simple gates; not "every binary") — present in BOTH surfaces: WORKFLOW.md ("do not force... on every binary... tool-spam") and the reminder clause ("simple yes/no proceed-gates may stay prose"). The Out-of-scope sibling ("strict every-choice via AskUserQuestion") is listed with a one-line reason (plan lines 121-124) — categorical coverage satisfied.

### Critical — settings.json is text-only
Verified by extracting the command string from `main` and `HEAD` and comparing:
- Trigger portion (everything up to `; jq -nc`) including the `grep -qiE` regex and all 41 keyword alternatives (EN + RU): **byte-identical**.
- `matcher`: identical. UPS hook object keys: `["hooks"]` only — **no `if:` added**.
- `hookSpecificOutput` shape: `{hookEventName:"UserPromptSubmit",additionalContext:...}` — structurally unchanged.
- `additionalContext`: old text is a clean prefix; the only change is one sentence appended before the closing `."}}'`.
- `jq . .claude/settings.json` → **valid JSON**.
The git one-line diff (`+1/-1` on the command string) and the byte-level prefix comparison agree: only the `additionalContext` prose changed.

### Stack expectations
- ✓ **Claude Code hooks API** (`doc/stack-notes.md` § Claude Code hooks API; <https://code.claude.com/docs/en/hooks>): `UserPromptSubmit` emits `hookSpecificOutput.additionalContext`. Shape preserved; grep-based gating preserved; no `if:` on UserPromptSubmit. The existing `run_ups_case` inject assertions (non-empty `additionalContext`) codify this shape — they pass.

### Interaction scenarios
- ✓ "When a change-request prompt fires the reminder": UPS inject cases all green (8 inject + silent cases), firing behavior unchanged — clause is text, not a new trigger.
- ✓ "When settings.json is edited": full `tests/hooks.sh` run = **71/71**, including all PreToolUse guard cases and UPS inject/silent cases. Shared-file edit broke nothing.

### Test plan
- ✓ `bash tests/hooks.sh` → `Total: 71  Passed: 71  Failed: 0` (exit 0).
- ✓ `tests/hooks.sh` **NOT modified** on the branch (confirmed via `git diff --name-only`). The existing UPS cases assert injection, not wording — they cover the text-only change as the plan states.

### Scope boundaries
- ✓ No hard `PreToolUse` guard added (no new deny case; guard set unchanged).
- ✓ Trigger regex / matcher / output shape unchanged (verified above).
- ✓ `doc/architecture.md`: a currency note only (`doc/architecture.md:104`) referencing `pm-decision-via-askuserquestion_plan.md`; no invented section, no contradicting claim.
- No scope expansion: diff is exactly the four files the plan names.

## Definition of Done
- [x] All plan scenarios (1-4) implemented and verified (review checks; no executable test required per plan — `run_ups_case` covers injection)
- [x] Interaction scenarios have concurrent-state coverage (full-suite green after shared-file edit; UPS inject/silent unbroken)
- [x] Stack expectations respected; stack-spec assertion (UPS additionalContext shape) holds; hooks suite passes
- [x] Product Contract — no Product Contract touched (template/meta repo; no `.ai-pm/contracts/`). Stated explicitly.
- [x] Pipeline green — `tests/hooks.sh` 71/71 (the only executable test in this repo)
- [x] State file — N/A (no `.ai-pm/state/` in this template repo)
- [x] Product Impact Report — N/A (no contract touched)
- [x] Docs updates landed — WORKFLOW.md convention, settings.json clause, architecture.md currency note all present (the three "Docs to update" entries; no `CLAUDE.md` Pipeline change, as planned)
- [x] Expected artifacts exist — plan present; this review present; no contract (not user-facing — protocol/template change)

**DoD: pass**

## Blocking
None.

## Notes (product)
None. No scope expansion, no user-visible trade-off beyond the planned convention, no wire-tokens introduced into PM-facing contract sections (no contracts in this repo).

## Verdict
approve

<!-- orchestrator appends after code-review pass: -->
## Code review findings

## Code review
