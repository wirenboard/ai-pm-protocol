#!/bin/sh
# tests/generator.sh — integrity tests for the form-C single-source generator
# (opencode-harness-support, stage (a), slice 1). Proves form C's central claim
# on the Claude side: a single authored neutral source (src/) + a deterministic
# generator (gen/generate.py) reproduce the .claude/ adapter BYTE-FOR-BYTE.
#
# Two cases, matching the plan's Test plan wording:
#
#   generated-claude-adapter-byte-equivalent
#     given the neutral source + generator, when .claude/ is regenerated, then
#     it is byte-identical to the frozen golden reference (.golden/claude/) —
#     all 14 files: agents, commands, settings.json. This is the guard that the
#     new build step introduces NO behavioural change to what the Claude
#     self-host session loads.
#
#   single-source-diff-clean
#     given the committed generated tree, when the generator runs over the live
#     .claude/, then `git diff` is empty over the adapter surface — no generated
#     file diverges from a fresh build (the build-time integrity guard: it fails
#     loudly on a hand-edit to a generated file or a stale build).
#
# Determinism is also asserted directly: two independent builds into separate
# scratch dirs must be byte-identical to each other.
#
# Exit code: 0 if every case matches expectation, 1 if any case fails.
# One line per case is printed: "PASS: ..." or "FAIL: ...".
#
# Usage: bash tests/generator.sh
# Dependencies: python3 (stdlib only — the deterministic generator), git,
# sha256sum, diff. No node/npm, no third-party framework.

set -u

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
    echo "FAIL: not inside a git repo — tests/generator.sh must run inside ai-pm-protocol" >&2
    exit 1
}
cd "$ROOT" || exit 1

GOLDEN="$ROOT/.golden/claude"
GEN="$ROOT/gen/generate.py"

PASS_COUNT=0
FAIL_COUNT=0

pass() { echo "PASS: $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { echo "FAIL: $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

# Preconditions.
[ -d "$GOLDEN" ] || { echo "FAIL: golden reference missing at $GOLDEN" >&2; exit 1; }
[ -f "$GEN" ]    || { echo "FAIL: generator missing at $GEN" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "FAIL: python3 not available" >&2; exit 1; }

# Compute the sha256 of every file under a dir, keyed by the path relative to
# that dir, sorted — the canonical fingerprint of an adapter tree. Excludes the
# golden's own bookkeeping files (SHA256SUMS, README.md) so the comparison is
# over the 14 adapter files only.
tree_sums() {
    # $1 = dir
    ( cd "$1" && find . -type f \
        ! -name SHA256SUMS ! -name README.md \
        | LC_ALL=C sort \
        | while read -r f; do
            sha=$(sha256sum "$f" | cut -d' ' -f1)
            printf '%s  %s\n' "$sha" "${f#./}"
          done )
}

# ----------------------------------------------------------------------
# generated-claude-adapter-byte-equivalent
# Regenerate .claude/ from the neutral source into a scratch dir and assert
# byte-identity with the frozen golden (all 14 files).
# ----------------------------------------------------------------------
SCRATCH1=$(mktemp -d) || { echo "FAIL: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$SCRATCH1" "$SCRATCH2"' EXIT

if python3 "$GEN" --harness claude --out "$SCRATCH1" >/dev/null 2>&1; then
    # Byte-level recursive diff (content), excluding golden bookkeeping.
    if diff -r "$SCRATCH1" "$GOLDEN" --exclude=SHA256SUMS --exclude=README.md >/dev/null 2>&1; then
        pass "generated-claude-adapter-byte-equivalent: regenerated .claude/ is byte-identical to the golden (14 files)"
    else
        fail "generated-claude-adapter-byte-equivalent: regenerated tree diverges from the golden"
        diff -r "$SCRATCH1" "$GOLDEN" --exclude=SHA256SUMS --exclude=README.md 2>&1 | sed 's/^/    /'
    fi
else
    fail "generated-claude-adapter-byte-equivalent: generator exited non-zero"
fi

# Cross-check against the frozen SHA256SUMS manifest (independent of diff -r):
# the generated tree's fingerprint must equal the recorded golden fingerprint.
if [ -f "$GOLDEN/SHA256SUMS" ]; then
    GOT=$(tree_sums "$SCRATCH1")
    WANT=$(LC_ALL=C sort "$GOLDEN/SHA256SUMS")
    if [ "$(printf '%s' "$GOT" | LC_ALL=C sort)" = "$WANT" ]; then
        pass "generated-claude-adapter-byte-equivalent: generated fingerprint matches frozen SHA256SUMS"
    else
        fail "generated-claude-adapter-byte-equivalent: generated fingerprint differs from frozen SHA256SUMS"
    fi
fi

# ----------------------------------------------------------------------
# Determinism: two independent builds must be byte-identical to each other.
# (Same inputs -> byte-identical outputs every run — required for both guards.)
# ----------------------------------------------------------------------
SCRATCH2=$(mktemp -d) || { echo "FAIL: mktemp failed" >&2; exit 1; }
if python3 "$GEN" --harness claude --out "$SCRATCH2" >/dev/null 2>&1; then
    if [ "$(tree_sums "$SCRATCH1")" = "$(tree_sums "$SCRATCH2")" ]; then
        pass "generator-deterministic: two independent builds are byte-identical"
    else
        fail "generator-deterministic: two builds differ"
    fi
else
    fail "generator-deterministic: second build exited non-zero"
fi

# ----------------------------------------------------------------------
# single-source-diff-clean
# Run the generator over the LIVE .claude/ (the committed generated tree), then
# assert the working tree is diff-clean over the adapter surface — no generated
# file diverges from a fresh build.
# ----------------------------------------------------------------------
if python3 "$GEN" --harness claude >/dev/null 2>&1; then
    DIRTY=$(git status --porcelain -- .claude/ 2>/dev/null)
    if [ -z "$DIRTY" ]; then
        pass "single-source-diff-clean: regenerating .claude/ leaves the tree diff-clean"
    else
        fail "single-source-diff-clean: regenerated .claude/ diverges from the committed tree"
        printf '%s\n' "$DIRTY" | sed 's/^/    /'
    fi
else
    fail "single-source-diff-clean: generator exited non-zero on the live build"
fi

# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "----"
echo "Total: $TOTAL  Passed: $PASS_COUNT  Failed: $FAIL_COUNT"

[ "$FAIL_COUNT" -gt 0 ] && exit 1
exit 0
