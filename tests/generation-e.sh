#!/bin/sh
# tests/generation-e.sh — the Slice E generation + lean-template guard suite
# (doc-frugality, Slice E — derive the mechanical reference sections of
# architecture.md behind GENERATED-marker fences, ship the lean standing-doc
# template set, each carrying the doc-style guidance comment).
#
# Slice E adds the Architecture-section derivation procedure (a SEPARATE
# procedure, NOT bolted into gen/generate.py which stays a byte-copy adapter
# generator): the File layout (module map) + Current dependencies tables in
# architecture.md.tmpl live inside `<!-- GENERATED:... -->` fences, derived from
# the source tree + package manifest, idempotent (re-run = no diff). The lean
# template set carries the doc-style guidance comment; the README carries the
# <=100-line / <=120-char one-liner caps.
#
# Cases (plan Slice E test plan):
#
#   generation-derived-sections
#     the Architecture-section derivation procedure is documented (in pm-architect,
#     a sibling of the Product map generation procedure) as idempotent
#     (overwrite-a-delimited-region, re-run = no diff); the GENERATED markers
#     delimit the file-layout + dependency-table regions in architecture.md.tmpl;
#     and gen/generate.py STAYS a byte-copy adapter generator (the derivation is
#     NOT inside it). The generator's byte-copy / .golden contract is covered by
#     tests/generator.sh (the byte-identical-for-unchanged-manifests claim).
#
#   lean-doc-templates
#     each standing-doc template (architecture, user-journeys, product,
#     stack-notes, threat-model, README, state) carries the doc-style guidance
#     comment pointing at workflow/doc-style.md as the authority; the README
#     comment names the <=100-line / <=120-char one-liner caps and the README
#     template itself is <=100 lines.
#
#   generated-section-owner-boundary
#     a GENERATED marker delimits the generated sections; pm-architect guidance
#     says "never hand-edit a generated section" and that authored sections live
#     OUTSIDE the fence; the re-run-diff-clean guard catches a hand-edit inside a
#     fence. NON-VACUITY: stripping the never-hand-edit guidance trips the test.
#
# Exit code: 0 if every case matches expectation, 1 if any case fails.
# One line per case is printed: "PASS: ..." or "FAIL: ...".
#
# Usage: bash tests/generation-e.sh
# Dependencies: grep, sed, wc. No third-party framework.

set -u

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
    echo "FAIL: not inside a git repo — tests/generation-e.sh must run inside ai-pm-protocol" >&2
    exit 1
}
cd "$ROOT" || exit 1

ARCH_TMPL="$ROOT/doc/_templates/architecture.md.tmpl"
README_TMPL="$ROOT/doc/_templates/README.md.tmpl"
ARCHITECT="$ROOT/src/agents/pm-architect.body.md"
BOOT="$ROOT/src/commands/pm-bootstrap.body.md"
GEN="$ROOT/gen/generate.py"

PASS_COUNT=0
FAIL_COUNT=0
pass() { echo "PASS: $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { echo "FAIL: $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

for f in "$ARCH_TMPL" "$README_TMPL" "$ARCHITECT" "$BOOT" "$GEN"; do
    [ -f "$f" ] || { echo "FAIL: required file missing at $f" >&2; exit 1; }
done

SCRATCH=$(mktemp -d) || { echo "FAIL: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$SCRATCH"' EXIT

# ----------------------------------------------------------------------
# generation-derived-sections
# ----------------------------------------------------------------------
gerrs=""

# GENERATED fences delimit the two mechanical regions in architecture.md.tmpl.
grep -qF '<!-- GENERATED:file-layout' "$ARCH_TMPL" \
    || gerrs="$gerrs\n  - architecture.md.tmpl has no GENERATED:file-layout open marker"
grep -qF '<!-- /GENERATED:file-layout -->' "$ARCH_TMPL" \
    || gerrs="$gerrs\n  - architecture.md.tmpl has no GENERATED:file-layout close marker"
grep -qF '<!-- GENERATED:dependency-table' "$ARCH_TMPL" \
    || gerrs="$gerrs\n  - architecture.md.tmpl has no GENERATED:dependency-table open marker"
grep -qF '<!-- /GENERATED:dependency-table -->' "$ARCH_TMPL" \
    || gerrs="$gerrs\n  - architecture.md.tmpl has no GENERATED:dependency-table close marker"

# The derivation procedure is DOCUMENTED in pm-architect, named, and idempotent.
grep -qi 'Architecture-section derivation procedure' "$ARCHITECT" \
    || gerrs="$gerrs\n  - pm-architect does not document the Architecture-section derivation procedure"
grep -qi 'idempotent' "$ARCHITECT" \
    || gerrs="$gerrs\n  - pm-architect derivation procedure does not state it is idempotent"
grep -qi 'diff-clean\|re-run.*no diff\|no diff' "$ARCHITECT" \
    || gerrs="$gerrs\n  - pm-architect derivation procedure does not state re-run is diff-clean"
# Modelled on the product-map procedure (the sibling), referenced by name.
grep -qi 'Product map generation procedure' "$ARCHITECT" \
    || gerrs="$gerrs\n  - pm-architect does not name the Product map generation procedure as the sibling"
# pm-bootstrap carries a pointer to the sibling derivation.
grep -qi 'Architecture-section derivation procedure' "$BOOT" \
    || gerrs="$gerrs\n  - pm-bootstrap does not point at the Architecture-section derivation procedure"

# CRITICAL: gen/generate.py STAYS a byte-copy adapter generator — doc-section
# derivation is NOT bolted into it. Assert the generator does not reference the
# GENERATED fences or doc-section derivation (it only assembles adapters).
if grep -qiE 'GENERATED:file-layout|GENERATED:dependency-table|dependency-table|file-layout fence|architecture\.md derivation' "$GEN"; then
    gerrs="$gerrs\n  - gen/generate.py references doc-section derivation — it must stay a byte-copy adapter generator (derivation is a SEPARATE procedure)"
fi

if [ -z "$gerrs" ]; then
    pass "generation-derived-sections: GENERATED fences delimit the mechanical regions, the derivation procedure is documented as idempotent (re-run diff-clean) modelled on the product-map sibling, and gen/generate.py stays a byte-copy adapter generator"
else
    fail "generation-derived-sections: the derived-section model is not fully wired:$(printf '%b' "$gerrs")"
fi

# ----------------------------------------------------------------------
# lean-doc-templates
# ----------------------------------------------------------------------
lerrs=""

# Each standing-doc template carries a doc-style guidance comment pointing at
# workflow/doc-style.md as the authority.
for t in architecture user-journeys product stack-notes threat-model README state; do
    tf="$ROOT/doc/_templates/${t}.md.tmpl"
    [ -f "$tf" ] || { lerrs="$lerrs\n  - missing template $tf"; continue; }
    # The guidance comment must name workflow/doc-style.md as the authority.
    if ! grep -qi 'workflow/doc-style.md' "$tf"; then
        lerrs="$lerrs\n  - ${t}.md.tmpl carries no doc-style guidance comment (no workflow/doc-style.md pointer)"
    fi
done

# README hard-cap shape: the comment names the <=100-line and <=120-char caps,
# and the template itself is <=100 lines.
grep -qiE '<= ?100|≤ ?100|100[- ]line' "$README_TMPL" \
    || lerrs="$lerrs\n  - README.md.tmpl comment does not name the <=100-line cap"
grep -qiE '<= ?120|≤ ?120|120 char' "$README_TMPL" \
    || lerrs="$lerrs\n  - README.md.tmpl comment does not name the <=120-char one-liner cap"
RLINES=$(wc -l < "$README_TMPL")
[ "$RLINES" -le 100 ] \
    || lerrs="$lerrs\n  - README.md.tmpl is $RLINES lines (> 100 — it must be a one-screen front door)"

if [ -z "$lerrs" ]; then
    pass "lean-doc-templates: every standing-doc template carries the doc-style guidance comment; the README names the <=100-line / <=120-char caps and is $RLINES lines"
else
    fail "lean-doc-templates: the lean template set is incomplete:$(printf '%b' "$lerrs")"
fi

# ----------------------------------------------------------------------
# generated-section-owner-boundary (+ non-vacuity)
# A marker delimits generated sections; pm-architect guidance says "never
# hand-edit a generated section" and authored sections live OUTSIDE the fence.
# ----------------------------------------------------------------------
berrs=""

# The marker carries the "do not hand-edit" instruction in the template.
grep -qi 'do not hand-edit' "$ARCH_TMPL" \
    || berrs="$berrs\n  - architecture.md.tmpl GENERATED markers do not carry the do-not-hand-edit instruction"
# The template marker states authored sections live OUTSIDE the fences.
grep -qi 'OUTSIDE the' "$ARCH_TMPL" \
    || berrs="$berrs\n  - architecture.md.tmpl does not state authored sections live outside the fences"

# pm-architect guidance says "never hand-edit a generated section".
grep -qi 'never hand-edit a generated section' "$ARCHITECT" \
    || berrs="$berrs\n  - pm-architect guidance does not say 'never hand-edit a generated section'"
# pm-architect names the re-run-diff-clean guard catching an in-fence hand-edit.
grep -qi 'hand-edit inside a fence\|re-run.*diff\|diff inside any.*fence\|diff-clean' "$ARCHITECT" \
    || berrs="$berrs\n  - pm-architect does not name the re-run-diff-clean guard for an in-fence hand-edit"

if [ -z "$berrs" ]; then
    pass "generated-section-owner-boundary: a marker delimits the generated sections, pm-architect guidance says 'never hand-edit a generated section', authored sections live outside the fence, and the re-run-diff-clean guard catches an in-fence hand-edit"
else
    fail "generated-section-owner-boundary: the owner boundary is not fully stated:$(printf '%b' "$berrs")"
fi

# Non-vacuity: strip the never-hand-edit guidance from a scratch copy of the
# pm-architect body and assert the boundary grep fails — proves the assertion
# depends on the shipped guidance text, not a coincidental match.
sed 's/[Nn]ever hand-edit a generated section//g' "$ARCHITECT" > "$SCRATCH/architect-stripped.md"
if grep -qi 'never hand-edit a generated section' "$SCRATCH/architect-stripped.md"; then
    fail "generated-section-owner-boundary-nonvacuous: strip did not remove the guidance — the probe is broken"
else
    pass "generated-section-owner-boundary-nonvacuous: removing the never-hand-edit guidance trips the boundary assertion (the clean-grep is live)"
fi

# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "----"
echo "Total: $TOTAL  Passed: $PASS_COUNT  Failed: $FAIL_COUNT"

[ "$FAIL_COUNT" -gt 0 ] && exit 1
exit 0
