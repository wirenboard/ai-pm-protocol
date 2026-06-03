# Surface PM decisions via AskUserQuestion — plan

Backlog item "From orchestrator-discipline gap — 2026-06-03", sequenced after the
contract-token-lint PR (now landed, v2.10.0). Observed live this session: the
orchestrator repeatedly surfaced A/B decision-forks to the PM as plain-text
"(A)…/(B)…?" instead of using the **AskUserQuestion** tool — the protocol's intended,
structured way to surface a choice (comparable options, previews). Nothing in the
protocol nudged it, so it drifted. This adds the convention to the canonical spec and
reinforces it on the every-change-turn reminder.

**Key decision (PM 2026-06-03): the rule targets SUBSTANTIVE multi-option forks only.**
Mandatory `AskUserQuestion` for: scope choices, accept-vs-fix, which-of-N options,
prioritization. **Exempt** (prose is fine): simple proceed / confirm gates —
merge-authorization, "ready?", plain yes/no. This avoids tool-spam and alarm-fatigue.

## Scenarios

1. When the orchestrator needs a **substantive multi-option decision** from the PM
   (scope choice, accept-vs-fix, which-of-N, prioritization), it surfaces the choice
   via the **AskUserQuestion** tool — structured, comparable options — not as a
   plain-prose "(A)…/(B)…?" fork.
2. Simple **proceed / confirm gates** (merge-authorization, "ready?", a plain yes/no)
   stay in prose — the rule explicitly does not force `AskUserQuestion` on them, so the
   orchestrator does not tool-spam trivial binary confirmations.
3. The convention is recorded in `WORKFLOW.md` (the canonical spec read by the
   orchestrator and imported by downstream `CLAUDE.md`), near the existing PM-communication
   guidance ("plain language", "never show code").
4. The every-change-turn `UserPromptSubmit` route-reminder carries a short clause
   pointing at the rule, so it is reinforced on each repo-change request — the same soft
   enforcement surface the protocol already relies on.

## Existing behaviors this feature touches

(from the protocol's own behavior — what must not break)

- **`UserPromptSubmit` route-reminder** (`.claude/settings.json`): the change adds a
  clause to the `additionalContext` **text** only — the matcher, the trigger regex, the
  output shape (`hookSpecificOutput.additionalContext`), and the firing behavior are
  unchanged. Every `tests/hooks.sh` UPS case (inject/silent) stays green — the test
  asserts injection (non-empty `additionalContext`), not the exact wording.
- **`WORKFLOW.md` PM-communication guidance** (the "plain language" / "never show code"
  rules): the new convention sits alongside them; it refines *how* the orchestrator
  surfaces a choice, it does not contradict the existing communication rules.
- **No hard guard** — the protocol relies on the soft reminder for route-enforcement
  (the hard `PreToolUse` edit-ownership guard was rejected 2026-06-02); this rule is a
  convention + a reminder clause, not a new hard block.

## Contracts

(changed text — convention + reminder clause)

- **`WORKFLOW.md`**: a new convention line/paragraph — substantive PM decision-forks go
  through `AskUserQuestion`; simple proceed/confirm gates may stay prose.
- **`.claude/settings.json`** UPS reminder `additionalContext`: a short clause pointing
  at the rule (e.g. "surface substantive PM decision-forks via AskUserQuestion, not
  prose"). No Product Contract (template/meta change; no `.ai-pm/contracts/` in this
  repo).

## Stack expectations touched

- **Claude Code hooks API** (`doc/stack-notes.md` § "Claude Code hooks API"):
  `UserPromptSubmit` emits `hookSpecificOutput` with `additionalContext`. Source:
  <https://code.claude.com/docs/en/hooks>. → The change edits only the
  `additionalContext` text; the `hookSpecificOutput` shape and the grep-based gating are
  preserved (no `if:` — it does not run on UserPromptSubmit). The JSON must stay valid.

## Interaction scenarios

This feature is **not** provably isolated: the reminder fires on every user prompt
(shared global flow) and `settings.json` is shared with all PreToolUse guards.

- **When any future change-request prompt fires the reminder:** the added clause appears
  in the injected `additionalContext`; firing behavior (which prompts inject vs stay
  silent) is unchanged — the clause is text, not a new trigger.
- **When `settings.json` is edited:** all existing `tests/hooks.sh` cases (PreToolUse
  guards + UPS inject/silent) stay green — the edit is confined to the UPS reminder text;
  full-suite green is the guard.

## Test plan

- Existing tests that must pass: `bash tests/hooks.sh` — full suite (71/71) stays green;
  in particular the UPS inject/silent cases are unaffected (text-only change; the harness
  asserts injection, not wording).
- **New tests (review checks; no executable test needed — `run_ups_case` already covers
  injection):**
  - `workflow-convention-present`: `WORKFLOW.md` carries the convention near the
    PM-communication guidance — substantive multi-option forks via `AskUserQuestion`,
    simple proceed/confirm gates may stay prose (the Key decision encoded; not "every
    yes/no").
  - `reminder-clause-present`: the `UserPromptSubmit` `additionalContext` in
    `.claude/settings.json` carries the short pointer clause; `jq . .claude/settings.json`
    parses (valid JSON); the trigger regex and output shape are unchanged.
  - `scope-not-overreaching`: both the WORKFLOW.md text and the reminder clause state the
    rule is for substantive forks and exempt simple proceed/confirm gates (no
    tool-spam mandate).
- **Interaction scenario tests:**
  - `hooks-suite-green-after-settings-edit`: running the whole `tests/hooks.sh` confirms
    the shared file's PreToolUse cases and the UPS inject/silent cases are unbroken.
- **Stack-spec tests:**
  - `ups-additionalcontext-shape-preserved`: a representative change-intent prompt run
    through the UPS hook still emits a non-empty `hookSpecificOutput.additionalContext`
    (verifies the hooks-API shape from stack-notes is respected, not just the text). The
    existing `run_ups_case` "inject" cases satisfy this; comment cites
    <https://code.claude.com/docs/en/hooks>.

## Docs to update

- `WORKFLOW.md` — add the AskUserQuestion convention (substantive forks; exempt simple
  gates) near the PM-communication guidance.
- `.claude/settings.json` — add the short pointer clause to the UPS reminder text.
- `doc/architecture.md` — only if it carries a now-stale claim about the reminder or
  PM-decision surfacing; otherwise no change. The reminder is already described there
  (hook surface) — a one-line currency note that the reminder now also points at the
  AskUserQuestion convention may fit. Owner: `pm-architect` (it judges fit; skip if no
  stale claim).
- No `CLAUDE.md` Pipeline change — no new validator; `tests/hooks.sh` already covers the
  hook.

## Out of scope

- **Strict "every choice via AskUserQuestion"** — the sibling of the scope decision. The
  rule deliberately exempts simple proceed/confirm gates (merge-auth, yes/no) to avoid
  tool-spam and alarm-fatigue (PM decision 2026-06-03). Making it mandatory for every
  binary is a separate decision, not taken here.
- **A hard `PreToolUse` guard** that blocks prose-forks — out of the protocol's surface
  and contrary to the rejected-hard-guard decision (2026-06-02); this is a soft
  convention + reminder only.
- **Changing the UPS trigger regex / matcher / output shape** — only the
  `additionalContext` text changes; the route-reminder's firing logic is untouched.
- **Migration-procedures extraction to a reference** and the **markdown soft-break sweep**
  (other open backlog items) — independent, not folded in here.
