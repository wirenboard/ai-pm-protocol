#!/bin/sh
# tests/hooks.sh — unit tests for the PreToolUse hooks declared in
# .claude/settings.json. Each case builds the JSON payload that Claude Code
# would pipe to the hook on stdin (per the PreToolUse contract in
# doc/stack-notes.md § "Claude Code hooks API": `{tool_name, tool_input}`),
# extracts the hook command from settings.json with jq, runs it under
# `bash -c`, and checks the produced hookSpecificOutput.
#
# For positive cases (deny/ask) the full hookSpecificOutput shape is asserted:
# hookEventName == "PreToolUse", permissionDecision == expected enum value,
# permissionDecisionReason is a non-empty string. Negative cases (pass) only
# assert the no-output invariant — they do not produce hookSpecificOutput.
#
# Stack rules respected (citations in doc/stack-notes.md):
#   * PreToolUse stdin contract — `tool_name` + `tool_input` fields.
#     Source: https://code.claude.com/docs/en/hooks
#   * hookSpecificOutput shape — `hookEventName: "PreToolUse"`,
#     `permissionDecision` enum "allow" / "ask" / "deny",
#     `permissionDecisionReason` string shown to the user.
#     Source: https://code.claude.com/docs/en/hooks
#   * jq `-r` for raw output, `// empty` for absent-field safety.
#     Source: https://jqlang.org/manual/
#   * git rev-parse --show-toplevel returns project root (used as the
#     boundary guard inside Read and find hooks). Source:
#     https://git-scm.com/docs/git-rev-parse
#
# Exit code: 0 if every case matches expectation, 1 if any case fails.
# One line per case is printed: "PASS: ..." or "FAIL: ...".
#
# Usage: bash tests/hooks.sh
# Dependencies: jq, grep (PCRE support), git, bash. No npm/python toolchain.

set -u

# Resolve project root via git so the script can be invoked from anywhere.
# (doc/stack-notes.md § git: "Show the (by default, absolute) path of the
# top-level directory of the working tree.")
ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
    echo "FAIL: not inside a git repo — tests/hooks.sh must run inside ai-pm-protocol" >&2
    exit 1
}
cd "$ROOT" || exit 1

SETTINGS="$ROOT/.claude/settings.json"
[ -f "$SETTINGS" ] || {
    echo "FAIL: $SETTINGS missing" >&2
    exit 1
}

# Sanity: jq must parse settings.json before any hook can be extracted.
jq -e . "$SETTINGS" > /dev/null 2>&1 || {
    echo "FAIL: $SETTINGS is not valid JSON" >&2
    exit 1
}

PASS_COUNT=0
FAIL_COUNT=0

# Hook indices in settings.json (cross-checked against the file shape):
#   read    -> .hooks.PreToolUse[0].hooks[0] (matcher "Read")
#   find    -> .hooks.PreToolUse[1].hooks[0] (matcher "Bash", if "Bash(find *)")
#   ssh_edit-> .hooks.PreToolUse[1].hooks[1] (matcher "Bash", if "Bash(ssh *)")
#   ssh_mut -> .hooks.PreToolUse[1].hooks[2] (matcher "Bash", if "Bash(ssh *)")
#   git_pf  -> .hooks.PreToolUse[1].hooks[3] (matcher "Bash", if "Bash(git push *)")
#   git_nv  -> .hooks.PreToolUse[1].hooks[4] (matcher "Bash", if "Bash(git commit *)")
#   guard   -> .hooks.PreToolUse[2].hooks[0] (matcher "Task|Agent|Skill")
get_hook_cmd() {
    # $1 = jq path, e.g. ".hooks.PreToolUse[1].hooks[0].command"
    jq -r "$1" "$SETTINGS"
}

# run_case <label> <expected_decision: deny|ask|pass> <hook_jq_path> <input_json>
# Runs the hook command on the supplied stdin JSON, parses the output, and
# compares the decision. "pass" means the hook produced no output (exit 0).
#
# For positive cases (expected = deny|ask) the full hookSpecificOutput shape
# is asserted per doc/stack-notes.md § Claude Code hooks API:
#   * hookEventName == "PreToolUse" (literal)
#   * permissionDecision == expected enum value
#   * permissionDecisionReason is a non-empty string
# If any of the three fails, the case prints `FAIL: <case> — missing <field>`
# and FAIL_COUNT is incremented. Exact reason wording is not asserted (would
# lock the test to current message text).
#
# For negative cases (expected = pass) only the no-output invariant is checked
# — those cases do not produce hookSpecificOutput at all.
run_case() {
    label="$1"
    expected="$2"
    hook_path="$3"
    input_json="$4"

    cmd=$(get_hook_cmd "$hook_path")
    if [ -z "$cmd" ] || [ "$cmd" = "null" ]; then
        echo "FAIL: $label — could not extract hook command at $hook_path"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return
    fi

    output=$(printf '%s' "$input_json" | bash -c "$cmd" 2>/dev/null)

    if [ -z "$output" ]; then
        actual="pass"
    else
        actual=$(printf '%s' "$output" | jq -r '.hookSpecificOutput.permissionDecision // "malformed"' 2>/dev/null)
        if [ "$actual" = "malformed" ] || [ -z "$actual" ]; then
            echo "FAIL: $label — hook produced output but no permissionDecision: $output"
            FAIL_COUNT=$((FAIL_COUNT + 1))
            return
        fi
    fi

    if [ "$actual" != "$expected" ]; then
        echo "FAIL: $label — expected=$expected actual=$actual"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return
    fi

    # Negative ("pass") cases produce no output — nothing more to assert.
    if [ "$expected" = "pass" ]; then
        echo "PASS: $label"
        PASS_COUNT=$((PASS_COUNT + 1))
        return
    fi

    # Positive case: assert full hookSpecificOutput shape per
    # doc/stack-notes.md § Claude Code hooks API.
    event_name=$(printf '%s' "$output" | jq -r '.hookSpecificOutput.hookEventName // empty' 2>/dev/null)
    if [ "$event_name" != "PreToolUse" ]; then
        echo "FAIL: $label — missing hookEventName"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return
    fi

    reason=$(printf '%s' "$output" | jq -r '.hookSpecificOutput.permissionDecisionReason // empty' 2>/dev/null)
    # Non-empty AND non-blank: jq -r yields a string; strip whitespace via
    # POSIX parameter-expansion-free `printf | tr -d` then test for emptiness.
    reason_stripped=$(printf '%s' "$reason" | tr -d ' \t\n\r')
    if [ -z "$reason_stripped" ]; then
        echo "FAIL: $label — missing permissionDecisionReason"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return
    fi

    echo "PASS: $label"
    PASS_COUNT=$((PASS_COUNT + 1))
}

# Helper to build a PreToolUse-shaped JSON with a file_path field (Read).
mk_input_path() {
    jq -nc --arg p "$1" '{tool_name:"Read", tool_input:{file_path:$p}}'
}

# Helper to build a PreToolUse-shaped JSON with a command field (Bash).
mk_input_cmd() {
    jq -nc --arg c "$1" '{tool_name:"Bash", tool_input:{command:$c}}'
}

# Helper to build a PreToolUse-shaped JSON for a subagent spawn (Task/Agent).
mk_input_agent() {
    jq -nc --arg t "$1" '{tool_name:"Task", tool_input:{subagent_type:$t}}'
}

# Helper to build a PreToolUse-shaped JSON for a Skill invocation.
mk_input_skill() {
    jq -nc --arg s "$1" '{tool_name:"Skill", tool_input:{skill:$s}}'
}

# Helper to build a PreToolUse-shaped JSON for a Write (file_path + content).
mk_input_write() {
    jq -nc --arg p "$1" --arg c "$2" '{tool_name:"Write", tool_input:{file_path:$p, content:$c}}'
}

# Helper to build a UserPromptSubmit-shaped JSON with a prompt field.
mk_input_prompt() {
    jq -nc --arg p "$1" '{prompt:$p}'
}

# run_ups_case <label> <expected: inject|silent> <input_json>
# UserPromptSubmit hooks emit hookSpecificOutput.additionalContext rather
# than a permissionDecision, so they need their own assertion path.
run_ups_case() {
    label="$1"
    expected="$2"
    input_json="$3"
    cmd=$(get_hook_cmd "$UPS_HOOK")
    output=$(printf '%s' "$input_json" | bash -c "$cmd" 2>/dev/null)
    if [ -z "$output" ]; then
        actual="silent"
    else
        ctx=$(printf '%s' "$output" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)
        if [ -n "$ctx" ]; then actual="inject"; else actual="malformed"; fi
    fi
    if [ "$actual" != "$expected" ]; then
        echo "FAIL: $label — expected=$expected actual=$actual"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return
    fi
    echo "PASS: $label"
    PASS_COUNT=$((PASS_COUNT + 1))
}

READ_HOOK='.hooks.PreToolUse[0].hooks[0].command'
FIND_HOOK='.hooks.PreToolUse[1].hooks[0].command'
SSH_EDIT_HOOK='.hooks.PreToolUse[1].hooks[1].command'
SSH_MUT_HOOK='.hooks.PreToolUse[1].hooks[2].command'
GIT_PUSH_HOOK='.hooks.PreToolUse[1].hooks[3].command'
GIT_COMMIT_HOOK='.hooks.PreToolUse[1].hooks[4].command'
AGENT_GUARD_HOOK='.hooks.PreToolUse[2].hooks[0].command'
WRITE_HOOK='.hooks.PreToolUse[3].hooks[0].command'
UPS_HOOK='.hooks.UserPromptSubmit[0].hooks[0].command'

# ----------------------------------------------------------------------
# Read boundary hook — denies file paths outside the project root.
# ----------------------------------------------------------------------

# Positive: paths outside the repo must be denied.
run_case "read: /etc/passwd is outside root -> deny" \
    "deny" "$READ_HOOK" "$(mk_input_path /etc/passwd)"
run_case "read: /tmp/foo is outside root -> deny" \
    "deny" "$READ_HOOK" "$(mk_input_path /tmp/foo)"
run_case "read: /var/log/syslog is outside root -> deny" \
    "deny" "$READ_HOOK" "$(mk_input_path /var/log/syslog)"

# Negative: paths inside the repo must pass.
run_case "read: project root itself -> pass" \
    "pass" "$READ_HOOK" "$(mk_input_path "$ROOT")"
run_case "read: file inside project -> pass" \
    "pass" "$READ_HOOK" "$(mk_input_path "$ROOT/README.md")"

# ----------------------------------------------------------------------
# find boundary hook — denies find on paths outside the project root.
# Regression for audit-2026-05-30 finding #4 (bare-root `find / -name x`).
# ----------------------------------------------------------------------

# Positive: filesystem-wide find must be denied. Pre-fix the extractor
# required at least one non-space char after `/`, so `find /` matched
# nothing and the hook fell through to exit 0.
run_case "find: 'find / -name x' (bare root) -> deny  # regression for audit-2026-05-30 finding #4" \
    "deny" "$FIND_HOOK" "$(mk_input_cmd "find / -name x")"
run_case "find: 'find / -type f' (bare root, type flag) -> deny  # regression for audit-2026-05-30 finding #4" \
    "deny" "$FIND_HOOK" "$(mk_input_cmd "find / -type f")"
run_case "find: 'find /etc' -> deny" \
    "deny" "$FIND_HOOK" "$(mk_input_cmd "find /etc -maxdepth 1")"
run_case "find: 'find /usr/share' -> deny" \
    "deny" "$FIND_HOOK" "$(mk_input_cmd "find /usr/share -name x")"

# Negative: in-repo find must pass.
run_case "find: 'find . -name x' (relative) -> pass" \
    "pass" "$FIND_HOOK" "$(mk_input_cmd "find . -name x")"
run_case "find: find inside project root (absolute) -> pass" \
    "pass" "$FIND_HOOK" "$(mk_input_cmd "find $ROOT -name x")"

# ----------------------------------------------------------------------
# ssh content-edit hook — denies in-place edits on remote systems.
# Regression for audit-2026-05-30 finding #3 (quoted-form bypass).
# ----------------------------------------------------------------------

# Positive: unquoted form (already worked pre-fix, kept as baseline).
run_case "ssh-edit: 'ssh host sed -i ...' (unquoted baseline) -> deny" \
    "deny" "$SSH_EDIT_HOOK" "$(mk_input_cmd 'ssh host sed -i s/x/y/ /etc/foo')"

# Positive: double-quoted form (pre-fix bug: leading space required before
# vi/vim/nano/tee). Regression test for audit-2026-05-30 finding #3.
run_case 'ssh-edit: ssh host "sed -i ..." (double-quoted) -> deny  # regression for audit-2026-05-30 finding #3' \
    "deny" "$SSH_EDIT_HOOK" "$(mk_input_cmd 'ssh host "sed -i s/x/y/ /etc/foo"')"
run_case 'ssh-edit: ssh host "vim /etc/foo" (double-quoted vim) -> deny  # regression for audit-2026-05-30 finding #3' \
    "deny" "$SSH_EDIT_HOOK" "$(mk_input_cmd 'ssh host "vim /etc/foo"')"
run_case 'ssh-edit: ssh host "nano /etc/foo" (double-quoted nano) -> deny  # regression for audit-2026-05-30 finding #3' \
    "deny" "$SSH_EDIT_HOOK" "$(mk_input_cmd 'ssh host "nano /etc/foo"')"

# Positive: single-quoted form. Same regression class as #3.
run_case "ssh-edit: ssh host 'tee /etc/foo' (single-quoted tee) -> deny  # regression for audit-2026-05-30 finding #3" \
    "deny" "$SSH_EDIT_HOOK" "$(mk_input_cmd "ssh host 'tee /etc/foo'")"

# Positive: > redirect inside quotes.
run_case 'ssh-edit: ssh host "cat > /etc/foo" (redirect inside quotes) -> deny' \
    "deny" "$SSH_EDIT_HOOK" "$(mk_input_cmd 'ssh host "cat > /etc/foo"')"

# Negative: read-only diagnostics must pass.
run_case "ssh-edit: 'ssh host cat /etc/foo' (read-only) -> pass" \
    "pass" "$SSH_EDIT_HOOK" "$(mk_input_cmd 'ssh host cat /etc/foo')"
run_case "ssh-edit: 'ssh host ls -la' (read-only) -> pass" \
    "pass" "$SSH_EDIT_HOOK" "$(mk_input_cmd 'ssh host ls -la')"
run_case "ssh-edit: 'ssh host journalctl -xe' (read-only) -> pass" \
    "pass" "$SSH_EDIT_HOOK" "$(mk_input_cmd 'ssh host journalctl -xe')"

# ----------------------------------------------------------------------
# ssh mutating hook — asks before remote service/package/file ops.
# Regression for audit-2026-05-30 finding #3 (quoted-form bypass).
# ----------------------------------------------------------------------

# Positive: unquoted baseline (pre-fix already covered this).
run_case "ssh-mut: 'ssh host systemctl restart x' (unquoted baseline) -> ask" \
    "ask" "$SSH_MUT_HOOK" "$(mk_input_cmd 'ssh host systemctl restart x')"

# Positive: double-quoted form. Regression for audit-2026-05-30 finding #3.
run_case 'ssh-mut: ssh host "systemctl restart x" (double-quoted) -> ask  # regression for audit-2026-05-30 finding #3' \
    "ask" "$SSH_MUT_HOOK" "$(mk_input_cmd 'ssh host "systemctl restart x"')"
run_case 'ssh-mut: ssh host "docker compose up" (double-quoted) -> ask  # regression for audit-2026-05-30 finding #3' \
    "ask" "$SSH_MUT_HOOK" "$(mk_input_cmd 'ssh host "docker compose up"')"
run_case 'ssh-mut: ssh host "apt install foo" (double-quoted) -> ask  # regression for audit-2026-05-30 finding #3' \
    "ask" "$SSH_MUT_HOOK" "$(mk_input_cmd 'ssh host "apt install foo"')"
run_case 'ssh-mut: ssh host "npm install" (double-quoted) -> ask  # regression for audit-2026-05-30 finding #3' \
    "ask" "$SSH_MUT_HOOK" "$(mk_input_cmd 'ssh host "npm install"')"
run_case 'ssh-mut: ssh host "kubectl apply -f x.yaml" (double-quoted) -> ask  # regression for audit-2026-05-30 finding #3' \
    "ask" "$SSH_MUT_HOOK" "$(mk_input_cmd 'ssh host "kubectl apply -f x.yaml"')"

# Positive: single-quoted form. Same regression class.
run_case "ssh-mut: ssh host 'rm /etc/foo' (single-quoted rm) -> ask  # regression for audit-2026-05-30 finding #3" \
    "ask" "$SSH_MUT_HOOK" "$(mk_input_cmd "ssh host 'rm /etc/foo'")"
run_case "ssh-mut: ssh host 'cp /etc/a /etc/b' (single-quoted cp) -> ask  # regression for audit-2026-05-30 finding #3" \
    "ask" "$SSH_MUT_HOOK" "$(mk_input_cmd "ssh host 'cp /etc/a /etc/b'")"
run_case "ssh-mut: ssh host 'mv /etc/a /etc/b' (single-quoted mv) -> ask" \
    "ask" "$SSH_MUT_HOOK" "$(mk_input_cmd "ssh host 'mv /etc/a /etc/b'")"
run_case "ssh-mut: ssh host 'mkdir /opt/x' (single-quoted mkdir) -> ask" \
    "ask" "$SSH_MUT_HOOK" "$(mk_input_cmd "ssh host 'mkdir /opt/x'")"
run_case "ssh-mut: ssh host 'touch /etc/foo' (single-quoted touch) -> ask" \
    "ask" "$SSH_MUT_HOOK" "$(mk_input_cmd "ssh host 'touch /etc/foo'")"

# Negative: read-only diagnostics must pass through the mutating hook too.
run_case "ssh-mut: 'ssh host cat /etc/foo' (read-only) -> pass" \
    "pass" "$SSH_MUT_HOOK" "$(mk_input_cmd 'ssh host cat /etc/foo')"
run_case "ssh-mut: 'ssh host systemctl status x' (read-only status) -> pass" \
    "pass" "$SSH_MUT_HOOK" "$(mk_input_cmd 'ssh host systemctl status x')"
run_case "ssh-mut: 'ssh host docker logs x' (read-only logs) -> pass" \
    "pass" "$SSH_MUT_HOOK" "$(mk_input_cmd 'ssh host docker logs x')"

# ----------------------------------------------------------------------
# git force-push hook — asks before --force / -f / --force-with-lease.
# ----------------------------------------------------------------------

run_case "git-push: 'git push --force' -> ask" \
    "ask" "$GIT_PUSH_HOOK" "$(mk_input_cmd 'git push --force origin main')"
run_case "git-push: 'git push -f' -> ask" \
    "ask" "$GIT_PUSH_HOOK" "$(mk_input_cmd 'git push -f origin main')"
run_case "git-push: 'git push --force-with-lease' -> ask" \
    "ask" "$GIT_PUSH_HOOK" "$(mk_input_cmd 'git push --force-with-lease')"

run_case "git-push: 'git push origin main' (no force) -> pass" \
    "pass" "$GIT_PUSH_HOOK" "$(mk_input_cmd 'git push origin main')"
run_case "git-push: 'git push' (no flags) -> pass" \
    "pass" "$GIT_PUSH_HOOK" "$(mk_input_cmd 'git push')"

# ----------------------------------------------------------------------
# git commit-no-verify hook — asks before --no-verify / --no-gpg-sign.
# ----------------------------------------------------------------------

run_case "git-commit: 'git commit --no-verify' -> ask" \
    "ask" "$GIT_COMMIT_HOOK" "$(mk_input_cmd 'git commit --no-verify -m x')"
run_case "git-commit: 'git commit --no-gpg-sign' -> ask" \
    "ask" "$GIT_COMMIT_HOOK" "$(mk_input_cmd 'git commit --no-gpg-sign -m x')"
run_case "git-commit: 'git commit -m x --no-verify' (flag after message) -> ask" \
    "ask" "$GIT_COMMIT_HOOK" "$(mk_input_cmd 'git commit -m x --no-verify')"

run_case "git-commit: 'git commit -m x' (normal) -> pass" \
    "pass" "$GIT_COMMIT_HOOK" "$(mk_input_cmd 'git commit -m x')"
run_case "git-commit: 'git commit --amend' (no verify bypass) -> pass" \
    "pass" "$GIT_COMMIT_HOOK" "$(mk_input_cmd 'git commit --amend --no-edit')"

# ----------------------------------------------------------------------
# agent/skill routing guard — denies spawning/loading class-1 role
# duplicators (wb-* agents/skills that occupy a protocol seat). Named
# deny-list, NEVER an "everything but pm-*" pattern: code-review,
# deep-research and wb knowledge skills must stay available.
# ----------------------------------------------------------------------

# Positive: class-1 duplicators denied, whether spawned as agent or loaded as skill.
run_case "guard: spawn wb-development:coder -> deny" \
    "deny" "$AGENT_GUARD_HOOK" "$(mk_input_agent wb-development:coder)"
run_case "guard: spawn wb-development:code-reviewer -> deny" \
    "deny" "$AGENT_GUARD_HOOK" "$(mk_input_agent wb-development:code-reviewer)"
run_case "guard: spawn wb-development:design-review -> deny" \
    "deny" "$AGENT_GUARD_HOOK" "$(mk_input_agent wb-development:design-review)"
run_case "guard: skill wb-development:plan-feature -> deny" \
    "deny" "$AGENT_GUARD_HOOK" "$(mk_input_skill wb-development:plan-feature)"
run_case "guard: skill wb-git:workflow -> deny" \
    "deny" "$AGENT_GUARD_HOOK" "$(mk_input_skill wb-git:workflow)"

# Negative: protocol agents pass.
run_case "guard: spawn pm-coder -> pass" \
    "pass" "$AGENT_GUARD_HOOK" "$(mk_input_agent pm-coder)"
run_case "guard: spawn pm-plan-checker -> pass" \
    "pass" "$AGENT_GUARD_HOOK" "$(mk_input_agent pm-plan-checker)"

# Negative: built-in engines must stay available. code-review (skill) vs
# code-reviewer (wb agent) is the one-character boundary the guard must honor.
run_case "guard: skill code-review -> pass  # boundary vs wb code-reviewer" \
    "pass" "$AGENT_GUARD_HOOK" "$(mk_input_skill code-review)"
run_case "guard: skill deep-research -> pass" \
    "pass" "$AGENT_GUARD_HOOK" "$(mk_input_skill deep-research)"

# Negative: wb knowledge skills are capability-providers, not duplicators.
run_case "guard: skill wb-development:codestyle -> pass (knowledge)" \
    "pass" "$AGENT_GUARD_HOOK" "$(mk_input_skill wb-development:codestyle)"
run_case "guard: skill wb-development:package-bootstrap -> pass (knowledge)" \
    "pass" "$AGENT_GUARD_HOOK" "$(mk_input_skill wb-development:package-bootstrap)"
run_case "guard: skill wb-network -> pass (platform knowledge, used read-only)" \
    "pass" "$AGENT_GUARD_HOOK" "$(mk_input_skill wb-network)"
run_case "guard: skill wiren-board -> pass (platform knowledge)" \
    "pass" "$AGENT_GUARD_HOOK" "$(mk_input_skill wiren-board)"

# Positive: PR-forward duplicators now denied — the protocol grew its own
# PR-review-response path (WORKFLOW.md Step 7), so pr-author/pr-prep no
# longer fill a gap.
run_case "guard: skill wb-git:pr-author -> deny" \
    "deny" "$AGENT_GUARD_HOOK" "$(mk_input_skill wb-git:pr-author)"
run_case "guard: spawn wb-development:pr-prep -> deny" \
    "deny" "$AGENT_GUARD_HOOK" "$(mk_input_agent wb-development:pr-prep)"

# Negative: pr-review (reviewing someone else's PR) has no protocol seat.
run_case "guard: skill wb-git:pr-review -> pass (no protocol seat)" \
    "pass" "$AGENT_GUARD_HOOK" "$(mk_input_skill wb-git:pr-review)"

# code-review-orchestrator: a LEGITIMATE engine, no longer denied. The protocol
# never auto-routes a routine per-diff review to it (per-diff Pass-2 stays on the
# built-in /code-review — protocol routing discipline, not a hook block); the
# whole-codebase smell sweep uses it as the preferred engine. So it falls through
# the routing case to the trailing implicit exit 0 = "no decision; normal
# permission flow applies" — the let-through form of the Claude Code hooks API
# (doc/stack-notes.md § Claude Code hooks API; the deny enum value and the
# no-decision exit-0-no-output let-through are both from
# <https://code.claude.com/docs/en/hooks>). Removing its case arm + escape guard
# must NOT loosen the 7 role-duplicator denies — proven by the second case below.
run_case "routing: code-review-orchestrator is NOT denied (let-through)" \
    "pass" "$AGENT_GUARD_HOOK" "$(mk_input_skill wb-development:code-review-orchestrator)"

# The role-duplicator deny still fires after the orchestrator arm is gone.
run_case "routing: wb-development:coder still denied" \
    "deny" "$AGENT_GUARD_HOOK" "$(mk_input_agent wb-development:coder)"

# ----------------------------------------------------------------------
# destructive-Write guard — denies an empty/whitespace-only Write over an
# existing non-empty file (truncation guard; mirrors the code-scalpel SC6
# invariant). Allows real-content overwrites, writes to non-existent paths,
# and empty writes over already-empty files (nothing to lose).
# Source: https://code.claude.com/docs/en/hooks
# ----------------------------------------------------------------------

# A fresh empty temp file under $ROOT for the already-empty pass case.
WRITE_EMPTY_TMP="$ROOT/.hooks-test-empty-$$"
touch "$WRITE_EMPTY_TMP"

# Positive: zeroing an existing authored file via Write is denied.
run_case "write: empty content over existing non-empty file -> deny  # regression for incident 2026-06-06" \
    "deny" "$WRITE_HOOK" "$(mk_input_write "$ROOT/README.md" "")"
run_case "write: whitespace-only content over existing non-empty file -> deny" \
    "deny" "$WRITE_HOOK" "$(mk_input_write "$ROOT/README.md" "

")"

# Negative: legitimate writes pass.
run_case "write: non-empty content over existing file -> pass" \
    "pass" "$WRITE_HOOK" "$(mk_input_write "$ROOT/README.md" "real new content")"
run_case "write: empty content to non-existent path -> pass" \
    "pass" "$WRITE_HOOK" "$(mk_input_write "$ROOT/.hooks-test-absent-$$" "")"
run_case "write: empty content over an already-empty file -> pass" \
    "pass" "$WRITE_HOOK" "$(mk_input_write "$WRITE_EMPTY_TMP" "")"

rm -f "$WRITE_EMPTY_TMP"

# ----------------------------------------------------------------------
# UserPromptSubmit route reminder — injects the protocol route on
# change-intent prompts (RU + EN), stays silent on chit-chat so it does
# not pollute ordinary conversation.
# ----------------------------------------------------------------------

run_ups_case "ups: 'поправь баг в коде' -> inject" \
    "inject" "$(mk_input_prompt 'поправь баг в коде')"
run_ups_case "ups: 'please implement the feature' -> inject" \
    "inject" "$(mk_input_prompt 'please implement the feature')"
run_ups_case "ups: 'добавь поле в форму' -> inject" \
    "inject" "$(mk_input_prompt 'добавь поле в форму')"
run_ups_case "ups: 'спасибо, отлично' (chit-chat) -> silent" \
    "silent" "$(mk_input_prompt 'спасибо, отлично')"
run_ups_case "ups: 'как это устроено?' (question) -> silent" \
    "silent" "$(mk_input_prompt 'как это устроено?')"

# Removal/rename/extract/update verbs (RU + EN) — the broadened vocabulary
# that closes the route-enforcement gap (repo-change requests phrased with an
# edit/removal verb now fire the reminder).
run_ups_case "ups: 'убери модель хайку у агента' -> inject" \
    "inject" "$(mk_input_prompt 'убери модель хайку у агента')"
run_ups_case "ups: 'remove the haiku model' -> inject" \
    "inject" "$(mk_input_prompt 'remove the haiku model')"
run_ups_case "ups: 'удали старый шаблон' -> inject" \
    "inject" "$(mk_input_prompt 'удали старый шаблон')"
run_ups_case "ups: 'переименуй файл конфигурации' -> inject" \
    "inject" "$(mk_input_prompt 'переименуй файл конфигурации')"
run_ups_case "ups: 'обнови README' -> inject" \
    "inject" "$(mk_input_prompt 'обнови README')"
run_ups_case "ups: 'как это обновляется?' (question) -> silent" \
    "silent" "$(mk_input_prompt 'как это обновляется?')"

# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------

TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "----"
echo "Total: $TOTAL  Passed: $PASS_COUNT  Failed: $FAIL_COUNT"

if [ "$FAIL_COUNT" -gt 0 ]; then
    exit 1
fi
exit 0
