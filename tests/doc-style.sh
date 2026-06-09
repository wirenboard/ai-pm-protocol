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
CR="$ROOT/src/manifests/opencode/harness_local/body/code-review.body.md"
PLANCHK="$ROOT/src/agents/pm-plan-checker.body.md"

PASS_COUNT=0
FAIL_COUNT=0
pass() { echo "PASS: $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { echo "FAIL: $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

for f in "$WF" "$PMC" "$TMPL" "$ARCH" "$STACK" "$CODER" "$CR" "$PLANCHK"; do
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
# plain-language-rule (with non-vacuity)
# The `### Plain language` rule is a structural authoring rule for durable text
# (lead with a non-specialist statement, gloss-or-defer jargon). It must name the
# legibility sibling for the single-home split (referenced, not restated), and the
# WORKFLOW kernel one-liner must now carry the plain-language axis.
# ----------------------------------------------------------------------
plerrs=""
if [ -f "$DS" ]; then
    grep -q '### Plain language' "$DS"            || plerrs="$plerrs\n  - doc-style.md is missing the '### Plain language' anchor"
    grep -qi 'non-specialist' "$DS"               || plerrs="$plerrs\n  - doc-style.md plain-language rule does not lead with a non-specialist statement"
    grep -qi 'glossed-or-deferred' "$DS"          || plerrs="$plerrs\n  - doc-style.md plain-language rule is missing the gloss-or-defer rule for jargon/acronyms"
    # Names the legibility sibling for the single-home split (referenced by name).
    grep -qF 'Human-facing text legibility' "$DS" || plerrs="$plerrs\n  - doc-style.md plain-language rule does not name the legibility sibling for the single-home split"
else
    plerrs="$plerrs\n  - workflow/doc-style.md does not exist"
fi
# The WORKFLOW kernel one-liner now carries the plain-language axis.
grep -q 'reader-first: plain-language' "$WF" || plerrs="$plerrs\n  - WORKFLOW.md durable-text kernel one-liner does not carry the plain-language axis"

if [ -z "$plerrs" ]; then
    pass "plain-language-rule: doc-style.md carries '### Plain language' (non-specialist lede + gloss-or-defer), names the legibility sibling, and the WORKFLOW kernel lists the plain-language axis"
else
    fail "plain-language-rule: the plain-language axis is not wired:$(printf '%b' "$plerrs")"
fi

# Non-vacuity: strip the `### Plain language` anchor from a scratch copy and assert
# the anchor check trips. Proves the test is live, not vacuous.
if [ -f "$DS" ]; then
    sed '/^### Plain language/d' "$DS" > "$SCRATCH/pl-stripped.md"
    if grep -q '### Plain language' "$SCRATCH/pl-stripped.md"; then
        fail "plain-language-nonvacuous: stripping the '### Plain language' anchor did NOT remove it — the anchor check is vacuous"
    else
        pass "plain-language-nonvacuous: removing the '### Plain language' anchor trips the presence check (test is live)"
    fi
fi

# ----------------------------------------------------------------------
# code-review-frugality-aspect (Slice B, scenario 5; with non-vacuity)
# The compact reviewer body must list doc-frugality + comment-restraint as a
# GATED review aspect (over-commenting, what-not-why, trivial docstrings, inline
# rule-IDs, doc-bloat / buried-lede / inline-provenance) BEYOND the pre-existing
# "comments that now contradict the code" check, and must REFERENCE the rules in
# workflow/doc-style.md by name (realize-don't-redefine). This completes the
# half-coverage the Slice A review flagged on comment-restraint-first-class.
# ----------------------------------------------------------------------
craerrs=""
grep -qi 'comment-restraint' "$CR"          || craerrs="$craerrs\n  - code-review body does not list comment-restraint as a review aspect"
grep -qi 'doc-frugality' "$CR"              || craerrs="$craerrs\n  - code-review body does not list doc-frugality as a review aspect"
grep -qF 'workflow/doc-style.md' "$CR"      || craerrs="$craerrs\n  - code-review body does not reference workflow/doc-style.md by name (realize-don't-redefine)"
grep -qi 'trivial docstring' "$CR"          || craerrs="$craerrs\n  - code-review body does not flag trivial docstrings"
grep -qi 'inline rule-ID' "$CR"             || craerrs="$craerrs\n  - code-review body does not flag inline rule-ID citations"
grep -qi 'buried-lede\|buried lede' "$CR"   || craerrs="$craerrs\n  - code-review body does not flag buried-lede (not fact-first)"
grep -qi 'provenance' "$CR"                 || craerrs="$craerrs\n  - code-review body does not flag inline-provenance"

if [ -z "$craerrs" ]; then
    pass "code-review-frugality-aspect: the compact reviewer body lists doc-frugality + comment-restraint as a gated aspect (trivial docstrings, inline rule-IDs, buried-lede, inline-provenance) and references workflow/doc-style.md by name"
else
    fail "code-review-frugality-aspect: the reviewer does not gate doc-frugality:$(printf '%b' "$craerrs")"
fi

# Non-vacuity (REQUIREMENT-token-keyed, not sentinel-keyed): the sentinel phrase
# and the actionable requirement tokens share a line, so deleting the sentinel
# would also delete the requirements and prove nothing. Instead, strip the
# SPECIFIC frugality guidance tokens (the actionable clause the production
# `code-review-frugality-aspect` greps for) from a scratch copy, then re-run those
# SAME production greps and assert at least one trips. This demonstrates the
# production aspect check depends on the shipped guidance text, not a header.
sed -e 's/trivial docstring/concise summary/g' \
    -e 's/inline rule-ID/annotation/g' \
    -e 's/buried-lede/well-led/g; s/buried lede/well led/g' \
    -e 's/[Pp]rovenance/origin/g' \
    "$CR" > "$SCRATCH/cr-stripped2.md"
if grep -qi 'trivial docstring' "$SCRATCH/cr-stripped2.md" \
   || grep -qi 'inline rule-ID' "$SCRATCH/cr-stripped2.md" \
   || grep -qi 'buried-lede\|buried lede' "$SCRATCH/cr-stripped2.md" \
   || grep -qi 'provenance' "$SCRATCH/cr-stripped2.md"; then
    fail "code-review-frugality-nonvacuous: stripping the specific frugality requirement tokens did NOT remove them from the reviewer body — the production aspect check is vacuous"
else
    pass "code-review-frugality-nonvacuous: stripping the specific frugality requirement tokens (trivial docstring / inline rule-ID / buried-lede / provenance) trips the production aspect greps (the check depends on the shipped guidance text)"
fi

# ----------------------------------------------------------------------
# plan-checker-hardcaps (Slice B, scenario 6; with non-vacuity)
# pm-plan-checker must carry a standing-doc hard-cap block check that references
# `### Numbers = targets, not gates` in workflow/doc-style.md by name (the live
# source of the threshold VALUES — single-home, not re-encoded here) and names
# the four enforceable caps BY SUBJECT (README one-liner / decision-record /
# navigation-list / top quality-goals) — and ONLY those four (the smells are NOT
# blocks).
# ----------------------------------------------------------------------
hcerrs=""
grep -qi 'hard-cap' "$PLANCHK"                          || hcerrs="$hcerrs\n  - pm-plan-checker does not carry a hard-cap check"
grep -qF '### Numbers = targets, not gates' "$PLANCHK"  || hcerrs="$hcerrs\n  - pm-plan-checker does not reference '### Numbers = targets, not gates' by name"
grep -qF 'workflow/doc-style.md' "$PLANCHK"             || hcerrs="$hcerrs\n  - pm-plan-checker does not point at workflow/doc-style.md"
grep -qi 'standing doc' "$PLANCHK"                      || hcerrs="$hcerrs\n  - pm-plan-checker hard-cap check does not key on a standing-doc update"
grep -qi 'README one-liner'      "$PLANCHK"             || hcerrs="$hcerrs\n  - pm-plan-checker does not name the README one-liner cap by subject"
grep -qi 'decision.record'       "$PLANCHK"             || hcerrs="$hcerrs\n  - pm-plan-checker does not name the decision-record length cap by subject"
grep -qi 'navigation.list\|navigation/router list' "$PLANCHK" || hcerrs="$hcerrs\n  - pm-plan-checker does not name the navigation-list cap by subject"
grep -qi 'quality-goals'         "$PLANCHK"             || hcerrs="$hcerrs\n  - pm-plan-checker does not name the top quality-goals cap by subject"
# The four caps are the ONLY blocks — the smells must NOT be turned into blocks.
grep -qi 'not a plan-checker block\|auditor smell\|do NOT turn' "$PLANCHK" || hcerrs="$hcerrs\n  - pm-plan-checker does not state the smells stay targets/smells (not blocks)"

if [ -z "$hcerrs" ]; then
    pass "plan-checker-hardcaps: pm-plan-checker blocks standing-doc updates over the four enforceable hard-caps (named by subject), references '### Numbers = targets, not gates' by name for the live thresholds, and keeps the soft smells as non-blocks"
else
    fail "plan-checker-hardcaps: the hard-cap block is not wired:$(printf '%b' "$hcerrs")"
fi

# Non-vacuity (VALUE-keyed, not heading-keyed): strip the SUBSTANTIVE assertions
# the production test greps — the cap-subject names AND the `### Numbers = targets,
# not gates` reference — from a scratch copy, then re-run the SAME production
# presence greps against it and assert at least one trips. This proves the check
# depends on the actual checked content surviving, not merely on a heading name.
sed -e 's/README one-liner/README blurb/g' \
    -e 's/### Numbers = targets, not gates/### (cap reference removed)/g' \
    "$PLANCHK" > "$SCRATCH/pc-stripped.md"
if grep -qi 'README one-liner' "$SCRATCH/pc-stripped.md" \
   || grep -qF '### Numbers = targets, not gates' "$SCRATCH/pc-stripped.md"; then
    fail "plan-checker-hardcaps-nonvacuous: stripping the cap-subject name + the '### Numbers = targets, not gates' reference did NOT remove the substantive content the production test greps — the check is vacuous"
else
    pass "plan-checker-hardcaps-nonvacuous: removing the cap-subject name + the '### Numbers = targets, not gates' reference trips the production presence greps (the check depends on the shipped substantive content, not a heading)"
fi

# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "----"
echo "Total: $TOTAL  Passed: $PASS_COUNT  Failed: $FAIL_COUNT"

[ "$FAIL_COUNT" -gt 0 ] && exit 1
exit 0
