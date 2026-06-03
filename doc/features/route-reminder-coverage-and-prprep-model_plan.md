# Route-reminder coverage + pm-pr-prep model — plan

One PR fixing a real protocol bug found 2026-06-03: a repo-change request phrased
"убери … модель хайку" slipped past the protocol's route enforcement entirely, and
the orchestrator edited an agent file + CHANGELOG freehand (mimo protokola). Root
cause: the only route-enforcement is the soft `UserPromptSubmit` reminder in
`.claude/settings.json`, gated behind a keyword regex whose vocabulary has **no
removal/edit verbs** ("убери/убрать/удали/remove/delete/rename/…"), so the reminder
never fired. Three coupled changes ship together:

1. **Broaden the route-reminder trigger vocabulary** (`.claude/settings.json`) — add
   removal/rename/extract/update verbs (RU + EN). Keep the keyword-gate (PM decision
   2026-06-03: broaden vocabulary, **not** always-on — coverage vs noise, the gate
   stays so chit-chat/answers don't fire).
2. **`pm-pr-prep` model** (`.claude/agents/pm-pr-prep.md`) — remove `model: haiku` so
   it inherits the session model like every other `pm-*` agent. Evidence: pinned
   Haiku produced repeated factual errors in PM-facing CHANGELOG entries (a
   non-existent `/pm-architect` command, typos, invented `§` section numbers),
   hand-corrected before every recent merge.
3. **Reverse the documented decision** (`doc/protocol-vs-builtins-analysis.md`) — that
   doc (≈ lines 89/99/107) decided "keep haiku for pm-pr-prep — pure mechanics,
   nothing to lose." That rationale is falsified (CHANGELOG authoring is PM-facing and
   needs care). Record the reversal + evidence; do not leave a silent contradiction.

This fix touches the **soft reminder's coverage only**. The hard `PreToolUse`
edit-ownership guard stays rejected (PM decision 2026-06-02) — out of scope.

## Scenarios

1. A change request phrased with a removal/edit verb — "убери модель хайку у агента",
   "remove the haiku model", "удали старый шаблон", "переименуй файл", "обнови
   README" — now fires the `UserPromptSubmit` route reminder (`[ai-pm protocol] …
   /pm-plan (or /pm-fixup if trivial) → pm-coder → review → pm-pr-prep; the
   orchestrator does not edit content artifacts directly`).
2. Chit-chat and questions still stay silent — "спасибо, отлично", "как это
   устроено?" and near-miss innocent phrasings do **not** start firing. The broadened
   vocabulary does not over-match.
3. `pm-pr-prep` inherits the session model (no `model:` line), like every other
   `pm-*` agent; release notes get the stronger model's care and the recurring
   CHANGELOG factual slips stop.
4. `doc/protocol-vs-builtins-analysis.md` records the reversal of the "keep haiku"
   decision with the falsifying evidence — the doc and the shipped config agree.

## Existing behaviors this feature touches

(from the protocol's own config/agent behavior — what must not break)

- **`UserPromptSubmit` hook** (`.claude/settings.json`): the regex is broadened, but
  the gating mechanism is unchanged — filtering stays a `grep -qiE` **inside the hook
  command** (an `if:` field does **not** work on `UserPromptSubmit`; see Stack
  expectations). The `hookSpecificOutput.additionalContext` output shape is unchanged.
  Every existing inject/silent case in `tests/hooks.sh` must still pass.
- **`tests/hooks.sh`** has a UPS test harness (`run_ups_case`, existing inject/silent
  cases). Existing cases are **not modified**; new cases are **added** for the new
  verbs and a regression-silent near-miss.
- **`pm-pr-prep` instructions** are unchanged — only the model tier changes (haiku →
  inherit). Its CHANGELOG/version/push/PR behavior is the same, run on a stronger
  model.
- **The PreToolUse guards** (path-boundary, ssh, force-push, commit --no-verify, wb-*
  routing) share `settings.json` — editing the file must keep all of them green.
- **No new hard guard** — the hard `PreToolUse` edit-ownership guard stays rejected;
  this only changes when the soft reminder appears.

## Contracts

(changed config/data shapes)

- **`UserPromptSubmit` trigger vocabulary** (the `grep -qiE` regex in
  `.claude/settings.json`): adds removal/rename/extract/update verbs (RU: убери/убрать/
  удали/сними/вынеси/переименуй/обнови and EN: remove/delete/drop/rename/extract/update
  — final list the coder's call, must include the verbs in Scenario 1). Keyword-gate
  retained.
- **`pm-pr-prep` frontmatter**: the `model: haiku` line is removed (field defaults to
  inherit). No Product Contract (template-repo meta change; no `.ai-pm/contracts/`).

## Stack expectations touched

- **Claude Code hooks API** (`doc/stack-notes.md` § "Claude Code hooks API"): "`if:` …
  Only evaluated on tool events: `PreToolUse`, `PostToolUse`, … On other events, a
  hook with `if` set never runs." Source: <https://code.claude.com/docs/en/hooks>.
  → The `UserPromptSubmit` hook must keep filtering **inside the command** (grep), not
  via an `if:` field. The regex change stays in the command string.
- **Claude Code hooks API** — UserPromptSubmit emits `hookSpecificOutput` with
  `additionalContext`; the shape is preserved. Source:
  <https://code.claude.com/docs/en/hooks>.
- **Markdown frontmatter (YAML in Claude Code agent files)** (`doc/stack-notes.md`):
  "`model` … Defaults to `inherit`." Source:
  <https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields>. → Removing
  the `model:` line makes `pm-pr-prep` inherit the session/main model.

## Interaction scenarios

This feature is **not** provably isolated: the UPS hook fires on **every** user
prompt (shared global flow), and `settings.json` is shared with all PreToolUse guards.

- **When any future user prompt arrives:** the broadened reminder must fire on
  change-intent phrasings (incl. the new removal/edit verbs) **and** stay silent on
  chit-chat/questions — broadening must not regress the silent cases or over-match
  innocent prompts. Verified by keeping existing silent cases + adding a near-miss
  silent case.
- **When `settings.json` is edited:** all existing PreToolUse guard cases in
  `tests/hooks.sh` must remain green (the regex change is isolated to the UPS hook
  command, but the file is shared) — full-suite green is the guard.

## Test plan

- Existing tests that must pass: `bash tests/hooks.sh` — the full suite (incl. all
  current UPS inject/silent cases and every PreToolUse guard case) stays green.
  Existing cases are not modified.
- **New tests (added to `tests/hooks.sh`, additive `run_ups_case` lines):**
  - `ups: 'убери модель хайку у агента' -> inject`: given the originating prompt that
    slipped, when run through the UPS hook, then it now injects the protocol reminder.
  - `ups: 'remove the haiku model' -> inject`: EN removal verb fires.
  - `ups: 'удали старый шаблон' -> inject`: another RU removal verb fires.
  - `ups: 'переименуй файл конфигурации' -> inject`: rename verb fires.
  - `ups: 'обнови README' -> inject`: update verb fires.
  - `ups: 'как это обновляется?' -> silent`: regression — a *question* containing an
    update-root must NOT fire (broadening did not over-match).
- **Interaction scenario tests:**
  - `ups regression: existing silent cases stay silent` — "спасибо, отлично" / "как
    это устроено?" remain silent after the broadening (already in the suite; assert
    unchanged).
  - `hooks suite green after settings.json edit` — running the whole `tests/hooks.sh`
    is the interaction guard that the shared file's PreToolUse cases didn't break.
- **Stack-spec tests:** the UPS cases extract and run the **actual** hook command from
  `settings.json` (the existing `run_ups_case` harness does this) — they verify
  behavior against the hooks-API contract, not a coder's own mapping; the harness
  header already cites <https://code.claude.com/docs/en/hooks>.

## Docs to update

- `doc/protocol-vs-builtins-analysis.md` — record the reversal of the "keep haiku for
  `pm-pr-prep`" decision (≈ lines 89/99/107): mark it superseded 2026-06-03 with the
  falsifying evidence (Haiku produced factual errors in PM-facing CHANGELOG entries);
  do not delete the original analysis, mark it reversed. Owner: `pm-architect`
  (decision-record territory).
- `doc/architecture.md` — only if it carries a now-stale claim about agent model tiers
  or the route-reminder: a one-line currency note that no agent pins a model (pm-pr-prep
  inherits) and that the reminder vocabulary covers edit/removal verbs. Owner:
  `pm-architect` (it judges whether the doc needs the note; skip if no stale claim).
- No `CLAUDE.md` Pipeline change — no new validator; `tests/hooks.sh` already exists
  and gains cases.

## Out of scope

- **Always-on reminder** — the sibling of the keyword-gate choice. The reminder could
  fire on every turn (zero coverage gaps) instead of keyword-gated; PM chose broaden-
  vocabulary to avoid noise on every "да"/question and alarm-fatigue. Always-on is a
  separate change if the broadened vocabulary still proves leaky.
- **Hard `PreToolUse` edit-ownership guard** — stays rejected (PM decision
  2026-06-02). This fix is to the soft reminder's coverage, not a new hard block.
- **The other `protocol-vs-builtins-analysis.md` proposals** (tool-lock `tools:` pass,
  removing `model:` from the six judge-agents, the REWORK/NEW engine items) — separate
  work; this PR touches only `pm-pr-prep`'s model and records only that one reversal.
- **Smarter (non-keyword) intent detection** — the hook is a bash+grep one-liner;
  semantic intent detection is out of its surface and out of scope here.
