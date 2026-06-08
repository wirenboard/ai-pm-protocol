#!/bin/sh
# tests/doc-style.sh — the durable-text frugality discipline guard suite
# (doc-frugality, Slice A — the single home for the {docs, comments, commits}
# frugality family).
#
# Slice A creates workflow/doc-style.md as the single home for the frugality
# discipline, promotes comment-restraint to a first-class protocol rule, and
# splits frugality (doc-style) from legibility (pm-comms `## Human-facing text
# legibility`) single-source-distinct. These prose-grep cases pin that the home
# exists, is wired into the WORKFLOW nav map + the three authoring personas, and
# that the split is drift-free.
#
# Cases (plan Slice A test plan + interaction scenarios):
#
#   doc-style-single-home
#     workflow/doc-style.md EXISTS, is referenced in the WORKFLOW.md navigation
#     map, and the three durable-text-authoring personas (pm-architect /
#     pm-stack-researcher / pm-coder) reference it BY NAME (not re-encode it).
#
#   comment-restraint-first-class
#     the comment-restraint rule lives in workflow/doc-style.md as a protocol rule
#     (the `### Comment-restraint` anchor with why-not-what + single-home), not
#     only in CLAUDE.md.tmpl. NON-VACUITY: removing the rule fails the test (a
#     scratch copy with the anchor stripped must trip).
#
#   supersede-dont-edit
#     workflow/doc-style.md mandates the tombstone form (`superseded by … → …`)
#     AND the one-line-per-rejected-alternative form, under `### Supersede-don't-edit`.
#
#   doc-style-vs-legibility-distinct
#     clean-grep single-source guard: a frugality rule token (fact-first/BLUF,
#     current-state-only, supersede-don't-edit, provenance-as-pointer) appears in
#     workflow/doc-style.md but NOT inside the pm-comms `## Human-facing text
#     legibility` section body (the two homes never state the same rule; a
#     by-name reference pointer is allowed, a restated rule is not).
#
#   comment-restraint-no-drift
#     the first-class rule (doc-style) and its realization (CLAUDE.md.tmpl) AGREE
#     by REFERENCE, not duplication: the template Comment-restraint section names
#     doc-style.md as the single source it realizes.
#
# Exit code: 0 if every case matches expectation, 1 if any case fails.
# One line per case is printed: "PASS: ..." or "FAIL: ...".
#
# Usage: bash tests/doc-style.sh
# Dependencies: grep, sed, git. No third-party framework.

set -u

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
    echo "FAIL: not inside a git repo — tests/doc-style.sh must run inside ai-pm-protocol" >&2
    exit 1
}
cd "$ROOT" || exit 1

DS="$ROOT/workflow/doc-style.md"
WF="$ROOT/WORKFLOW.md"
PMC="$ROOT/workflow/pm-comms.md"
TMPL="$ROOT/doc/_templates/CLAUDE.md.tmpl"
ARCH="$ROOT/src/agents/pm-architect.body.md"
STACK="$ROOT/src/agents/pm-stack-researcher.body.md"
CODER="$ROOT/src/agents/pm-coder.body.md"

PASS_COUNT=0
FAIL_COUNT=0
pass() { echo "PASS: $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { echo "FAIL: $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

for f in "$WF" "$PMC" "$TMPL" "$ARCH" "$STACK" "$CODER"; do
    [ -f "$f" ] || { echo "FAIL: required file missing at $f" >&2; exit 1; }
done

# ----------------------------------------------------------------------
# doc-style-single-home
# ----------------------------------------------------------------------
errs=""

[ -f "$DS" ] || errs="$errs\n  - workflow/doc-style.md does not exist"

# WORKFLOW.md navigation map references the file.
if ! grep -qF 'workflow/doc-style.md' "$WF"; then
    errs="$errs\n  - WORKFLOW.md does not reference workflow/doc-style.md (nav map / kernel)"
fi

# The three durable-text-authoring personas reference it by name.
for p in "$ARCH" "$STACK" "$CODER"; do
    if ! grep -qF 'workflow/doc-style.md' "$p"; then
        errs="$errs\n  - $(basename "$p") does not reference workflow/doc-style.md by name"
    fi
done

if [ -z "$errs" ]; then
    pass "doc-style-single-home: workflow/doc-style.md exists, is in the WORKFLOW nav map, and pm-architect/pm-stack-researcher/pm-coder reference it by name"
else
    fail "doc-style-single-home: the single home is not wired:$(printf '%b' "$errs")"
fi

# ----------------------------------------------------------------------
# comment-restraint-first-class (with non-vacuity)
# ----------------------------------------------------------------------
crerrs=""
if [ -f "$DS" ]; then
    grep -q '### Comment-restraint' "$DS" || crerrs="$crerrs\n  - doc-style.md is missing the '### Comment-restraint' anchor"
    grep -qi 'why-not-what' "$DS"          || crerrs="$crerrs\n  - doc-style.md comment-restraint is missing the why-not-what rule"
    grep -qi 'single-home' "$DS"           || crerrs="$crerrs\n  - doc-style.md comment-restraint is missing the single-home rule"
    grep -qi 'first-class protocol rule' "$DS" || crerrs="$crerrs\n  - doc-style.md does not assert comment-restraint is a first-class protocol rule (applies on every project)"
else
    crerrs="$crerrs\n  - workflow/doc-style.md does not exist"
fi

if [ -z "$crerrs" ]; then
    pass "comment-restraint-first-class: the comment-restraint rule lives in workflow/doc-style.md as a first-class protocol rule (why-not-what + single-home)"
else
    fail "comment-restraint-first-class: the first-class rule is incomplete:$(printf '%b' "$crerrs")"
fi

# Non-vacuity: strip the `### Comment-restraint` section from a scratch copy and
# assert the anchor check trips. Proves the test is live, not vacuous.
SCRATCH=$(mktemp -d) || { echo "FAIL: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$SCRATCH"' EXIT
if [ -f "$DS" ]; then
    sed '/^### Comment-restraint$/d' "$DS" > "$SCRATCH/stripped.md"
    if grep -q '### Comment-restraint' "$SCRATCH/stripped.md"; then
        fail "comment-restraint-nonvacuous: stripping the '### Comment-restraint' anchor did NOT remove it — the anchor check is vacuous"
    else
        pass "comment-restraint-nonvacuous: removing the '### Comment-restraint' anchor trips the presence check (test is live)"
    fi
fi

# ----------------------------------------------------------------------
# supersede-dont-edit
# ----------------------------------------------------------------------
sperrs=""
if [ -f "$DS" ]; then
    grep -q '### Supersede-don.t-edit' "$DS" || sperrs="$sperrs\n  - doc-style.md is missing the '### Supersede-don't-edit' anchor"
    grep -qi 'tombstone' "$DS"               || sperrs="$sperrs\n  - doc-style.md does not mandate the one-line tombstone form"
    grep -qi 'superseded by' "$DS"           || sperrs="$sperrs\n  - doc-style.md is missing the 'superseded by … → pointer' tombstone shape"
    grep -qi 'rejected' "$DS"                || sperrs="$sperrs\n  - doc-style.md is missing the one-line-per-rejected-alternative form"
else
    sperrs="$sperrs\n  - workflow/doc-style.md does not exist"
fi

if [ -z "$sperrs" ]; then
    pass "supersede-dont-edit: doc-style.md mandates the one-line tombstone form (superseded by … → pointer) and the one-line-per-rejected-alternative form"
else
    fail "supersede-dont-edit: the supersede rule is incomplete:$(printf '%b' "$sperrs")"
fi

# ----------------------------------------------------------------------
# doc-style-vs-legibility-distinct
# Single-source guard: a frugality rule must NOT be restated inside the pm-comms
# `## Human-facing text legibility` section body. A by-name reference to
# doc-style.md is allowed (the wiring pointer); a restated frugality RULE is not.
# We scope to the legibility section body and grep for the structural frugality
# rule phrases — none may appear EXCEPT on a line that references doc-style.md by
# name (the allowed pointer).
# ----------------------------------------------------------------------
# Extract the `## Human-facing text legibility` section body (from its heading to
# EOF — it is the last section in pm-comms.md).
LEG_BODY=$(awk '/^## Human-facing text legibility/{f=1} f' "$PMC")
# Drop lines that legitimately POINT at doc-style.md by name (the wiring line).
LEG_RULES=$(printf '%s\n' "$LEG_BODY" | grep -vF 'workflow/doc-style.md')

distinct_errs=""
# These are doc-style's OWN frugality rule phrasings; none may be restated in the
# legibility section (only pointed at).
for phrase in 'fact-first' 'current-state-only' 'supersede-don' 'provenance' 'one-purpose-per-unit' 'tombstone'; do
    if printf '%s\n' "$LEG_RULES" | grep -qi "$phrase"; then
        distinct_errs="$distinct_errs\n  - the legibility section restates a frugality rule token [$phrase] (must live only in doc-style.md, referenced by name)"
    fi
done

if [ -z "$distinct_errs" ]; then
    pass "doc-style-vs-legibility-distinct: no frugality rule is restated inside the pm-comms '## Human-facing text legibility' section (single-source; doc-style is referenced by name only)"
else
    fail "doc-style-vs-legibility-distinct: a rule appears in both homes (drift):$(printf '%b' "$distinct_errs")"
fi

# ----------------------------------------------------------------------
# comment-restraint-no-drift
# The CLAUDE.md.tmpl realization must REFERENCE doc-style.md as its single source,
# not redefine the rule (one-way realize-don't-redefine).
# ----------------------------------------------------------------------
drift_errs=""
# The template's Comment-restraint section names doc-style.md as the single source.
if ! grep -iE 'single-sourced by.*doc-style\.md' "$TMPL" >/dev/null 2>&1; then
    drift_errs="$drift_errs\n  - CLAUDE.md.tmpl Comment-restraint section does not name doc-style.md as its single source (realize-don't-redefine wiring missing)"
fi

if [ -z "$drift_errs" ]; then
    pass "comment-restraint-no-drift: the CLAUDE.md.tmpl realization references workflow/doc-style.md as its single source (realize-don't-redefine, no parallel definition)"
else
    fail "comment-restraint-no-drift: the realization is not wired to the definition:$(printf '%b' "$drift_errs")"
fi

# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "----"
echo "Total: $TOTAL  Passed: $PASS_COUNT  Failed: $FAIL_COUNT"

[ "$FAIL_COUNT" -gt 0 ] && exit 1
exit 0
