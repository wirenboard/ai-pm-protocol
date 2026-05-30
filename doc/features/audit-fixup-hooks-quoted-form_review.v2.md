# audit-fixup-hooks-quoted-form — review v2 (re-check shape assertion)

## Scope of this re-check

Narrow follow-up to v1. The v1 verdict was `approve` with 3 product + 4 technical
notes. Coder actioned product note #2 only ("output-shape stack-spec test is
partial"). This review verifies that single fix and confirms no collateral damage.

v1 product notes #1 (backtick sanity) and #3 (architecture/WORKFLOW edit
ownership) and all technical notes remain on the backlog or were routed for
drop-on-merge per v1; they are not re-litigated here.

## What changed

One commit: `28e763c test(hooks): assert full hookSpecificOutput shape (hookEventName, reason)`.

Files touched in commit: `tests/hooks.sh` only (51 insertions, 5 deletions).
Confirmed via `git diff HEAD~1 HEAD -- .claude/settings.json .github/workflows/lint-hooks.yml doc/architecture.md WORKFLOW.md` — empty diff.

## Plan compliance — stack-spec output-shape test

The plan's "Stack expectations touched" + "Test plan" sections require the test
suite to verify the hookSpecificOutput shape per
`doc/stack-notes.md` § Claude Code hooks API: `hookEventName == "PreToolUse"`,
`permissionDecision` matches the enum, and `permissionDecisionReason` is the
user-facing string.

v1 found this only partially satisfied — only `permissionDecision` was asserted.
v2 of the test now asserts:

- `tests/hooks.sh:127-132` — `hookEventName == "PreToolUse"` literal check; on
  miss prints `FAIL: <case> — missing hookEventName` and increments fail count.
- `tests/hooks.sh:134-142` — `permissionDecisionReason` extracted via `jq -r`,
  whitespace-stripped with `printf | tr -d ' \t\n\r'`, then tested for emptiness;
  on miss prints `FAIL: <case> — missing permissionDecisionReason`.
- `tests/hooks.sh:112-116` — existing `permissionDecision` enum match preserved
  (this assertion already lived in v1).

The negative ("pass") branch at `tests/hooks.sh:118-123` keeps the
no-output invariant only — those cases produce no `hookSpecificOutput` at all,
so asserting the shape on them would be a category error. Correct.

Exact reason wording is deliberately not asserted — coder noted this in the
commit message and in `tests/hooks.sh:81-82` ("would lock the test to current
message text"). Reasonable trade-off; the spec only requires the field exist
and be non-empty.

## Coverage of deny/ask cases

Total cases in `tests/hooks.sh`: 44 (verified by test run output).

- Positive cases (expected `deny` or `ask`): **30** — each one now goes through
  the full shape assertion block (counted from PASS lines ending in `-> deny`
  or `-> ask`).
- Negative cases (expected `pass`): **14** — each one stays on the no-output
  invariant only.

Spot-check on 5 cases by reading the script:

1. `tests/hooks.sh:170-171` `read: /etc/passwd is outside root -> deny` — expected `"deny"`, runs full shape assertion path. Real hook output verified: `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Path outside project root: /etc/passwd"}}` — all three fields present.
2. `tests/hooks.sh:191-192` `find: 'find / -name x' (bare root) -> deny` — expected `"deny"`, runs full shape assertion.
3. `tests/hooks.sh:217-218` `ssh-edit: ssh host "sed -i ..." (double-quoted) -> deny` — expected `"deny"`, runs full shape assertion. Real hook output verified: contains `hookEventName: "PreToolUse"`, `permissionDecision: "deny"`, and a non-trivial `permissionDecisionReason` referencing the workflow rule.
4. `tests/hooks.sh:250-251` `ssh-mut: ssh host "systemctl restart x" (double-quoted) -> ask` — expected `"ask"`, runs full shape assertion.
5. `tests/hooks.sh:301-302` `git-commit: 'git commit --no-verify' -> ask` — expected `"ask"`, runs full shape assertion.

All five exercise the new code path. No deny/ask case bypasses the shape check.

## Negative cases untouched

Negative-path branch sits at `tests/hooks.sh:118-123`:

```
# Negative ("pass") cases produce no output — nothing more to assert.
if [ "$expected" = "pass" ]; then
    echo "PASS: $label"
    PASS_COUNT=$((PASS_COUNT + 1))
    return
fi
```

This is the only check applied to the 14 `pass` cases. Semantics unchanged
from v1 — the diff inserts an early `return` before the shape block so that
negative cases never hit `hookEventName` / `permissionDecisionReason` lookups
on empty output. Correct minimal change.

## Scope check on collateral files

Confirmed via `git diff HEAD~1 HEAD` filter:

- `.claude/settings.json` — untouched.
- `.github/workflows/lint-hooks.yml` — untouched.
- `doc/architecture.md` — untouched.
- `WORKFLOW.md` — untouched.

Only `tests/hooks.sh` changed. No scope creep.

## Tests run

`bash tests/hooks.sh` → exit 0, 44 PASS / 0 FAIL.

Output formatting unchanged from v1 — same `PASS: <label> -> <decision>` lines,
same summary footer. Failure mode is new: extra `FAIL: <label> — missing
<field>` strings would appear if a hook regressed on shape, but those don't
fire today.

## New findings

None. The one v1 product note that was actioned is now closed by the
implementation. No new issues introduced. Remaining v1 notes
(backtick-sanity recommendation, edit-ownership transparency flag, four
technical notes) are unaffected by this commit and stand as they did.

## Verdict

approve

The single commit tightens the test suite to assert the full
`hookSpecificOutput` shape (hookEventName + permissionDecision +
permissionDecisionReason) on every positive case, matching what the plan's
"Stack expectations touched" section asked for. Negative cases are correctly
left on the no-output invariant. No other files were touched. 44/44 tests pass.
