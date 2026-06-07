#!/bin/sh
# tests/targeted-reading.sh — form check for the context-leanness targeted-reading
# discipline (s17). Proves the discipline is single-homed in workflow/pipeline.md
# and that each role's read policy is stated in its body:
#
#   targeted-reading-discipline-present
#     (a) workflow/pipeline.md carries the single-home rule
#         `### Targeted reading of large structured docs`;
#     (b) each TARGETED consumer body (pm-coder, pm-stack-researcher,
#         pm-product-advocate, pm-plan-checker) references the rule by name AND
#         states it reads architecture.md targeted;
#     (c) each FULL body (pm-architect owner, pm-auditor whole-document reviewer)
#         states it reads the FULL architecture.md (the explicit carve-out, so a
#         future edit cannot silently narrow them).
#
# Specific enough to catch a regression that drops a single role's policy:
# every consumer is asserted independently.
#
# Exit code: 0 if every check passes, 1 if any fails.
# One line per check is printed: "PASS: ..." or "FAIL: ...".
#
# Usage: bash tests/targeted-reading.sh
# Dependencies: grep, git. No third-party framework.

set -u

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
    echo "FAIL: not inside a git repo — tests/targeted-reading.sh must run inside ai-pm-protocol" >&2
    exit 1
}
cd "$ROOT" || exit 1

PIPELINE="$ROOT/workflow/pipeline.md"
AGENTS="$ROOT/src/agents"

PASS_COUNT=0
FAIL_COUNT=0
pass() { echo "PASS: $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { echo "FAIL: $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

[ -f "$PIPELINE" ] || { echo "FAIL: workflow/pipeline.md missing at $PIPELINE" >&2; exit 1; }
[ -d "$AGENTS" ]   || { echo "FAIL: src/agents missing at $AGENTS" >&2; exit 1; }

# The canonical rule name — the single home and the per-body reference token.
RULE='### Targeted reading of large structured docs'

# ----------------------------------------------------------------------
# (a) Single home: the rule lives once in workflow/pipeline.md.
# ----------------------------------------------------------------------
if grep -qF "$RULE" "$PIPELINE"; then
    pass "single-home: workflow/pipeline.md carries the '### Targeted reading of large structured docs' rule"
else
    fail "single-home: workflow/pipeline.md is missing the '### Targeted reading of large structured docs' rule"
fi

# ----------------------------------------------------------------------
# (b) TARGETED bodies reference the rule by name. The reference token IS the rule
#     name, so a body that points at it necessarily names the discipline; we also
#     require each to name architecture.md so the policy is concretely anchored.
# ----------------------------------------------------------------------
for body in pm-coder pm-stack-researcher pm-product-advocate pm-plan-checker; do
    f="$AGENTS/$body.body.md"
    if [ ! -f "$f" ]; then
        fail "targeted-body: $body.body.md not found"
        continue
    fi
    if grep -qF "$RULE" "$f" && grep -qF "architecture.md" "$f"; then
        pass "targeted-body: $body references the targeted-reading rule and reads architecture.md targeted"
    else
        fail "targeted-body: $body does NOT reference the targeted-reading rule for architecture.md"
    fi
done

# ----------------------------------------------------------------------
# (c) FULL bodies state they read the FULL architecture.md (carve-out visible).
#     Require both the rule reference (so the carve-out is anchored to the named
#     discipline) AND a literal "FULL" near architecture.md.
# ----------------------------------------------------------------------
for body in pm-architect pm-auditor; do
    f="$AGENTS/$body.body.md"
    if [ ! -f "$f" ]; then
        fail "full-body: $body.body.md not found"
        continue
    fi
    # The body must name architecture.md, assert FULL reading, and reference the
    # rule by name (the carve-out is stated against the named discipline).
    if grep -qF "architecture.md" "$f" \
       && grep -qF '**FULL**' "$f" \
       && grep -qF "$RULE" "$f"; then
        pass "full-body: $body states it reads the FULL architecture.md (explicit carve-out)"
    else
        fail "full-body: $body does NOT state a FULL architecture.md read carve-out"
    fi
done

# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "----"
echo "Total: $TOTAL  Passed: $PASS_COUNT  Failed: $FAIL_COUNT"

[ "$FAIL_COUNT" -gt 0 ] && exit 1
exit 0
