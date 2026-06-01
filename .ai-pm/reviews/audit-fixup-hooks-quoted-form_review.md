# audit-fixup-hooks-quoted-form — review

## Plan compliance

- Scenario 1 (ssh + content edit blocks quoted form `ssh host "sed -i ..."`, `ssh host 'rm /etc/foo'`, `ssh host "cat > /etc/foo"`) — implemented in `.claude/settings.json:26`; covered by tests at `tests/hooks.sh:171-184` (4 quoted positive cases including double-quoted `sed -i`, `vim`, `nano`, single-quoted `tee`, plus redirect-in-quotes). All pass.
- Scenario 2 (ssh + mutating action blocks quoted form `ssh host "systemctl restart x"` etc.) — implemented in `.claude/settings.json:32`; covered by tests at `tests/hooks.sh:204-225` (5 double-quoted + 5 single-quoted ask cases). All pass.
- Scenario 3 (`find /` boundary hook now denies bare root) — implemented in `.claude/settings.json:20` (the `+` → `*` quantifier change makes the `case "$FPATH" in "$ROOT"|...` deny path fire for bare `/`); covered by tests at `tests/hooks.sh:145-152` including `find / -name x` and `find / -type f`. All pass.
- Scenario 4 (`tests/hooks.sh` covers all five hooks with positive + negative) — present. Coverage by hook: Read 3+/2-, find 4+/2-, ssh-edit 6+/3-, ssh-mut 10+/3-, git-push 3+/2-, git-commit 3+/2-. Each hook meets the `≥3+/≥2-` minimum. Quoted-form: ≥2 per content-edit and mutating hooks satisfied. `find /`: 2 forms satisfied.
- Scenario 5 (CI workflow runs `tests/hooks.sh` on PRs touching settings.json or the tests) — `.github/workflows/lint-hooks.yml` present; `paths:` filter on both `push` and `pull_request` covers `.claude/settings.json`, `tests/hooks.sh`, and the workflow itself (self-reference). Job step `bash tests/hooks.sh` is wired.
- Scenario 6 (guarantee #10 — "all changes go through the pipeline" — now has a test gate) — delivered via `.github/workflows/lint-hooks.yml`; cross-referenced in `WORKFLOW.md:49` and `doc/architecture.md:78`.

Stack expectations (from the plan's "Stack expectations touched" section):

- PreToolUse stdin contract `{tool_name, tool_input}` — `tests/hooks.sh:103-110` (`mk_input_path` / `mk_input_cmd` helpers) constructs exactly this shape; every case feeds it through the real hook command, so if the hook's jq path stopped matching the contract the case would fail. Citation reproduced at `tests/hooks.sh:11-12` with the source URL.
- `permissionDecision` enum `allow|ask|deny` — asserted in `tests/hooks.sh:85-90`. Citation reproduced at `tests/hooks.sh:13-14`.
- `if:` Bash-pattern filter — every test exercises the hook command directly without going through the `if:` filter (filter behaviour is enforced by Claude Code, not by the shell). The `if:` patterns in `settings.json` (`Bash(find *)`, `Bash(ssh *)`, `Bash(git push *)`, `Bash(git commit *)`) match the plan's text.
- jq `-r` raw output + `// empty` for absent-field safety — used inside every hook command; tests pass an empty `{tool_input: {}}`-equivalent through the same code path as the malformed-input check (`[ -z "$CMD" ] && exit 0` falls back to pass when jq returns empty).
- `git rev-parse --show-toplevel` boundary guard — used by Read and find hooks; tested by Read-inside-vs-outside-project pairs at `tests/hooks.sh:124-135` and find-bare-root denial at `tests/hooks.sh:145-148`.

Plan-completeness sub-check: passes. The plan lists "Stack expectations touched" with source URLs for every cited rule.

Categorical scope check: passes. Plan declares `PreToolUse`-only scope, lists `PostToolUse / SessionStart / Stop / UserPromptSubmit / Notification` under Out of scope with one-line reasons. Diff stays inside `PreToolUse`.

JSON validation: `jq -e . .claude/settings.json` returns success — file is valid JSON.

Test run: `bash tests/hooks.sh` → exit 0, 44/44 PASS.

Inspection-based regression check (per the task brief, "verify by inspection that ≥10 cases would fail against the pre-fix regex"): the pre-fix ssh keyword regex used `[ ]<keyword>[ ]+` (literal space required on both sides of the keyword), and the pre-fix find extractor used `find +\K/[^ |;&"\x27]+` (`+` quantifier required ≥1 char after `/`). Cases that would fail against the pre-fix code:

- ssh-edit double-quoted (`sed -i`, `vim`, `nano`) — 3 cases (lines 171-176)
- ssh-edit single-quoted (`tee`) — 1 case (line 179)
- ssh-edit redirect inside quotes (`cat > /etc/foo`) — 1 case (line 183)
- ssh-mut double-quoted (`systemctl`, `docker compose`, `apt`, `npm`, `kubectl`) — 5 cases (lines 204-213)
- ssh-mut single-quoted (`rm`, `cp`, `mv`, `mkdir`, `touch`) — 5 cases (lines 216-225)
- find bare root (`find /`, `find / -type f`) — 2 cases (lines 145-148)

Total: 17 cases would have failed against pre-fix code, well above the ≥10 inspection threshold.

## Blocking

None.

## Notes (product)

1. **ssh-detection regex backtick handling — the coder flagged this as out-of-scope finding #2 and the flag itself is incorrect.** The ssh-detection regex on `.claude/settings.json:26,32` is `grep -qE '(^|[ ;&|`(])ssh([ ]|$)'` — that character class contains a literal backtick character (verified by reading the raw bytes from `jq -r`), not the string `\x60`. So the backtick boundary on the ssh-detection step actually works today: `printf 'foo \`ssh bar' | grep -qE '(^|[ ;&|\`(])ssh([ ]|$)'` matches. The keyword-side regex (the second `grep -qP`) does use `\x60` PCRE escapes, which `grep -P` interprets correctly. **Why it matters:** the coder's note suggests a real bug that is not actually present; if PM had routed this to a follow-up plan based on the incorrect description, the follow-up would have found nothing to fix. Recommend dropping it from the follow-up backlog rather than scheduling a fixup against a non-bug. Worth a brief sanity-check by re-running the test command above before dropping, in case I am the one who misread.
2. **Output-shape stack-spec test is partial.** The plan's test plan asked for a stack-spec test that "hook output JSON contains exactly `hookSpecificOutput.hookEventName` + `permissionDecision` + `permissionDecisionReason` fields (no extra, no missing)". The current test (`tests/hooks.sh:85`) checks only that `permissionDecision` exists with a value matching the expected enum — it does not assert that `hookEventName` is `"PreToolUse"` or that `permissionDecisionReason` is non-empty. **Why it matters:** if a future refactor accidentally drops `permissionDecisionReason` (the user-facing reason string), the test suite passes silently and the user gets a denial with no explanation. Low likelihood, but the test plan asked for it explicitly. PM call: tighten now or accept partial coverage.
3. **Coder touched `doc/architecture.md` and `WORKFLOW.md` directly.** The reviewer persona / WORKFLOW.md edit-ownership rule reserves `docs/architecture.md` and orchestration documents for their owning agents. The plan explicitly authorized these doc changes under "Docs to update", so this is plan-approved, not a violation — but it should be noted in the audit trail that the coder, not an `architect` or PM, applied them. The diff content is faithful to what the plan asked for and reads cleanly. No action needed; flagging for transparency.

## Notes (technical)

1. **`tests/hooks.sh:1` shebang is `#!/bin/sh` but the script calls `bash -c` and the CI runs `bash tests/hooks.sh`.** Mixed: the script presents as POSIX-sh but the hook commands it runs require bash (the actual hook commands themselves use bash-specific features through `bash -c`). The shebang is misleading but harmless since the script is never invoked as `./tests/hooks.sh` directly (CI says `bash tests/hooks.sh`, docs say the same). Routing: drop on merge — cosmetic and current invocation pattern always uses bash anyway. If the CI ever switched to running it as `./tests/hooks.sh`, this would need a real fix.
2. **`grep -E → grep -P` switch is fine for keyword regex, but `\xNN` is the only PCRE feature actually used.** GNU grep on Debian / Ubuntu / Alpine all ship `grep -P` (PCRE) by default, and the workflow runs on `ubuntu-latest`. The portability concern raised in the brief — "is this overstretching PCRE dependency?" — is mild: the only PCRE-specific escape used is `\xNN` for `"`, `'`, and `` ` ``. Plain `grep -E` could equivalently use the literal characters inside a `[...]` class (e.g., `[ "'\`]`), but the chosen `\xNN` form is more readable when the class lives inside a doubly-escaped JSON string. Acceptable trade-off. Routing: drop on merge — no portability issue on the supported platforms.
3. **`tests/hooks.sh` has no `#!/usr/bin/env bash` line and no explicit `cd "$ROOT"` race against weird PWD.** Already handled at line 35 (`cd "$ROOT" || exit 1`). No change.
4. **Comment on the `find` fix could be clearer about why `*` plus the `case "$FPATH" in "$ROOT"|...` chain still rejects bare `/`.** The logic is: with `*`, `find /` extracts `FPATH=/`; then `case "/" in "$ROOT"|"$ROOT"/*) exit 0 ;; /*) ...deny ...` — since `/` is not equal to `$ROOT` and not a prefix of `$ROOT/`, it falls into the `/*) deny` branch. This is correct but non-obvious; one inline comment would save a future reader a minute. Routing: respawn `coder` if PM batches further hook polish; otherwise drop on merge.

## Verdict

approve

This PR closes two regex bugs in the hook layer that let dangerous remote commands (`ssh host "rm /etc/foo"`, `find / -name x`) slip past the in-session guardrails. It adds a 44-case test suite and a CI workflow that re-runs those tests whenever the hooks or tests change. The "no automated tests" architectural constraint is updated honestly with a narrow exception so the audit trail records the decision. All scenarios are implemented, all 44 tests pass, the underlying JSON is valid, and the regression cases match the audit findings the plan was opened against.
