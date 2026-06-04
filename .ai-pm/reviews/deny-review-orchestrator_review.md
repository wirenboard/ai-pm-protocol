# deny-review-orchestrator — plan-compliance review

## Plan compliance

- ✓ Scenario 1 — **Auto-intercept blocked by default.** Orchestrator added as its OWN `case` branch in the routing hook (`.claude/settings.json`) emitting `permissionDecision: "deny"` with a reason naming `/code-review` Pass-2 and the escape flag. Test: `tests/hooks.sh` "routing: code-review-orchestrator without flag -> deny".
- ✓ Scenario 2 — **Surgical per-skill env-escape.** Guard `if [ "$NAME" = "wb-development:code-review-orchestrator" ] && [ "$WB_ALLOW_REVIEW_ORCHESTRATOR" = "1" ]; then exit 0; fi` placed BEFORE the `case` — exit-0-no-output let-through, gated on BOTH the exact skill name AND the flag. Test: "routing: code-review-orchestrator with WB_ALLOW_REVIEW_ORCHESTRATOR=1 -> pass".
- ✓ Scenario 3 — **Other wb-* role skills unchanged.** The 7-skill case label and its `permissionDecisionReason` are byte-identical to `main` (verified via `git show main` vs feature). They carry no env-escape. Test: "routing: wb-development:coder stays denied even with WB_ALLOW_REVIEW_ORCHESTRATOR=1" proves the flag does not loosen their deny.
- ✓ Scenario 4 — **Documented in README install section.** README diff adds `### Скилл code-review-orchestrator отключён по умолчанию` under the install section: states the default deny, the `/code-review` alternative, the per-skill `WB_ALLOW_REVIEW_ORCHESTRATOR=1` escape, and that it must be set at launch (not via in-session `export`).
- ✓ Scenario 5 — **Additive, ships downstream, no migration.** One extra branch in the existing hook + 3 test cases + one README note. No template/enum/migration change.

## Categorical coverage

The categorical set is the wb-* role/orchestrator skills. `code-review-orchestrator` is the only sibling receiving the escape; the 7 role skills are each listed under Out of scope with a one-line reason (they always have pm-* equivalents, never warrant explicit run). The "blanket disable-all toggle" sibling is explicitly rejected in Out of scope. Full set covered.

## Stack expectations compliance

- ✓ `permissionDecision: "deny"` enum value — used verbatim in the new orchestrator branch; matches the cited hooks-API contract.
- ✓ exit-0-no-output let-through — the escape is `exit 0` with no stdout (no custom "allow" object), the documented "no decision; normal permission flow applies" form. Test asserts `pass` (no output).
- ✓ name read from `tool_input.subagent_type // tool_input.skill` — unchanged extraction line, preserved.
- ✓ `jq -nc` — the new deny object is built with `jq -nc`, matching the existing routing-hook form.
- ✓ Stack-spec tests present, each cited to `doc/stack-notes.md § Claude Code hooks API` + `https://code.claude.com/docs/en/hooks` in a comment above the cases. Deny asserts the full `hookSpecificOutput` shape; let-through asserts exit-0-no-output, not an ad-hoc string.

No code contradicts a cited rule; no test codifies a forbidden value.

## Security scope (harness warning — settings.json self-modification + deny-bypass)

Confirmed correctly scoped. The bypass fires ONLY when `NAME == wb-development:code-review-orchestrator` AND `WB_ALLOW_REVIEW_ORCHESTRATOR == 1`; it is the FIRST statement and short-circuits with `exit 0` only for that one skill. Verified weakens no other hook/deny:
- The 7 role-skill deny (case label + message) is byte-identical to `main`; the `coder+flag→deny` regression test proves the flag does not reach them.
- All non-routing `PreToolUse` hooks (path-outside-root, find-outside-root, ssh-content-edit, force-push, no-verify) are byte-identical to `main` (jq-sorted diff: only the single routing command line changed).
- All non-`PreToolUse` hook groups (UserPromptSubmit route reminder) identical to `main`.
- `.claude/settings.json` is valid JSON (`jq empty` passes).

## Interaction scenarios

Plan declares `Provably isolated:` — hook is stateless (reads own stdin + env, decides, exits; env read never written). No concurrent-state test required. Honored.

## Definition of Done

- [x] All plan scenarios implemented and tested (Scenarios 1–5; tests at `tests/hooks.sh`)
- [x] Interaction scenarios have concurrent-state tests — n/a (`Provably isolated:` declared)
- [x] Stack expectations respected; stack-spec tests pass (74/74)
- [x] Product Contract honored — n/a, no Product Contract touched (non-user-facing meta-feature)
- [x] Pipeline green — `tests/hooks.sh` 74/74; `.claude/settings.json` valid JSON
- [x] State file updated (`.ai-pm/state/current.md`)
- [x] Product Impact Report present — n/a (no contract touched)
- [x] Docs updates landed (README install note in this branch)
- [x] Expected artifacts exist (plan, this review; no contract — feature non-user-facing)
- [n/a] Product-readiness gate — non-user-facing (every scenario subject is the hook / skill / project / downstream agents, not a human role); exempt, no advocate required
- [n/a] Validation gate — software-kind (no `## Project kind` line ⇒ software); no `## Validation` section

**DoD: pass**

## Blocking

None.

## Notes (product)

None. Scope matches the plan exactly (one hook branch + 3 tests + one README note); no scope expansion. No structural wire-token introduced into any PM-facing contract section (no contract exists; the env-flag is documented as an operational knob in the README, as the plan intends).

## Verdict

approve

## Code review findings
Pass-2 code-review (security-sensitive: settings.json deny-bypass). One thorough finder over the hook + tests + README. **No defects (`[]`).** Verified independently: the env-escape `exit 0` fires only for `NAME == wb-development:code-review-orchestrator` AND `WB_ALLOW_REVIEW_ORCHESTRATOR == 1` (coder+flag → still deny; orchestrator+flag=2 → deny; flag-unset → deny); the 7 role-skill denies + message + every other PreToolUse hook are byte-identical to `main` (jq-diff: only the one routing-command line changed); the `'\''` apostrophe escaping renders correctly and the JSON parses; deny uses `permissionDecision: "deny"`, let-through is exit-0-no-output; a mutation test confirmed the no-flag deny assertion has teeth (broadening the escape fails it); README accurately states the flag must be set at launch (not in-session). `tests/hooks.sh` 74/74.

## Code review: 2026-06-05 — passed
