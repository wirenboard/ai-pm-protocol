#!/bin/sh
# tests/core-delegation.sh — the Delegation & gate integrity core-invariant guard
# (orchestrator anti-corner-cutting, EXTENSION / Piece 0 — the core hoist).
#
# The corner-cut variants (skip a conditional agent / collapse the pipeline /
# self-substitute a crashed agent's output / reuse a stale on-disk artifact /
# self-stamp+merge) are ONE violation by different routes. Piece 0 hoists the
# always-on Edit-ownership invariant into the broader **Delegation & gate
# integrity** invariant — WORKFLOW.md carries the kernel, workflow/enforcement.md
# the generalized full rule. These two prose-grep cases pin that the kernel + full
# rule are PRESENT and that the broadened rule did NOT drop the edit-ownership
# carve-outs (the #1 regression risk: a false over-block of the orchestrator's own
# legitimate bookkeeping).
#
# Cases (plan EXTENSION test plan + scenario 12):
#
#   core-delegation-invariant-present
#     WORKFLOW.md `## Cross-cutting invariants` carries the Delegation & gate
#     integrity kernel (the load-bearing clauses: "fresh spawn of the owning agent
#     this turn", "never produces, paraphrases, reuses, or skips", and the
#     existing-artifact/"not run" clause) AND workflow/enforcement.md carries the
#     generalized full rule (the named full-rule heading + the fresh-spawn-this-turn
#     test + the named-rationalization ban).
#
#   edit-ownership-carveouts-preserved
#     workflow/enforcement.md STILL names the two carve-outs (the Pass-2
#     `## Code review` trail + the advocate `## Resolutions` trail) AND the
#     orchestrator-own-output artefact list (backlog / `.ai-pm/state` / Pass-2
#     code-review / advocate Resolutions / protocol-gap / git ops). Guards the
#     broadened rule against dropping the carve-outs / over-blocking.
#
# Each grep is over a SPECIFIC load-bearing phrase that the kernel/rule would lose
# if the clause were removed — non-vacuous by construction.
#
# Exit code: 0 if every case matches expectation, 1 if any case fails.
# One line per case is printed: "PASS: ..." or "FAIL: ...".
#
# Usage: bash tests/core-delegation.sh
# Dependencies: grep, git. No third-party framework.

set -u

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
    echo "FAIL: not inside a git repo — tests/core-delegation.sh must run inside ai-pm-protocol" >&2
    exit 1
}
cd "$ROOT" || exit 1

WF="$ROOT/WORKFLOW.md"
ENF="$ROOT/workflow/enforcement.md"

PASS_COUNT=0
FAIL_COUNT=0
pass() { echo "PASS: $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { echo "FAIL: $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

[ -f "$WF" ]  || { echo "FAIL: WORKFLOW.md missing at $WF" >&2; exit 1; }
[ -f "$ENF" ] || { echo "FAIL: workflow/enforcement.md missing at $ENF" >&2; exit 1; }

# ----------------------------------------------------------------------
# core-delegation-invariant-present
# ----------------------------------------------------------------------
errs=""

# WORKFLOW.md: the Cross-cutting-invariants section exists and carries the kernel.
if ! grep -q '## Cross-cutting invariants' "$WF"; then
    errs="$errs\n  - WORKFLOW.md is missing the '## Cross-cutting invariants' section"
fi
if ! grep -q 'Delegation & gate integrity' "$WF"; then
    errs="$errs\n  - WORKFLOW.md is missing the 'Delegation & gate integrity' kernel name"
fi
# The fresh-spawn-this-turn clause (the operational core of the kernel).
if ! grep -q 'fresh spawn of the owning agent this turn' "$WF"; then
    errs="$errs\n  - WORKFLOW.md kernel is missing the 'fresh spawn of the owning agent this turn' clause"
fi
# never produce/paraphrase/reuse/skip a deliverable.
if ! grep -q 'never produces, paraphrases, reuses, or skips' "$WF"; then
    errs="$errs\n  - WORKFLOW.md kernel is missing the 'never produces, paraphrases, reuses, or skips' clause"
fi
# existing-artifact / "not run".
if ! grep -q 'already-existing / skipped all count as "not run"' "$WF"; then
    errs="$errs\n  - WORKFLOW.md kernel is missing the existing-artifact = 'not run' clause"
fi

# workflow/enforcement.md: the generalized full rule.
if ! grep -q 'Delegation & gate integrity rule' "$ENF"; then
    errs="$errs\n  - enforcement.md is missing the 'Delegation & gate integrity rule' full-rule heading"
fi
if ! grep -q 'fresh-spawn-this-turn test' "$ENF"; then
    errs="$errs\n  - enforcement.md is missing the 'fresh-spawn-this-turn test'"
fi
if ! grep -q 'named-rationalization ban' "$ENF"; then
    errs="$errs\n  - enforcement.md is missing the 'named-rationalization ban'"
fi

if [ -z "$errs" ]; then
    pass "core-delegation-invariant-present: WORKFLOW.md '## Cross-cutting invariants' carries the Delegation & gate integrity kernel (fresh spawn this turn; never produce/paraphrase/reuse/skip; existing-artifact = 'not run') and workflow/enforcement.md carries the generalized full rule (full-rule heading + fresh-spawn-this-turn test + named-rationalization ban)"
else
    fail "core-delegation-invariant-present: the kernel / full rule is missing clauses:$(printf '%b' "$errs")"
fi

# ----------------------------------------------------------------------
# edit-ownership-carveouts-preserved
# The broadened rule must NOT drop the two edit-ownership carve-outs or the
# orchestrator-own-output artefact list (false-over-block guard).
# ----------------------------------------------------------------------
cerrs=""

# The two carve-outs are named explicitly.
if ! grep -q 'The one carve-out inside' "$ENF"; then
    cerrs="$cerrs\n  - enforcement.md dropped the FIRST carve-out (the Pass-2 '## Code review' trail in .ai-pm/reviews)"
fi
if ! grep -q 'A second carve-out' "$ENF"; then
    cerrs="$cerrs\n  - enforcement.md dropped the SECOND carve-out (the advocate '## Resolutions' trail)"
fi

# The orchestrator-own-output artefact list tokens — each must still be present.
#   backlog / `.ai-pm/state` (the execution-state carve-out) / Pass-2
#   `## Code review` trail / advocate `## Resolutions` / protocol-gap report /
#   git ops.
for tok in 'backlog' '.ai-pm/state' '## Code review' '## Resolutions' 'protocol-feedback report' 'git operations'; do
    if ! grep -qF "$tok" "$ENF"; then
        cerrs="$cerrs\n  - enforcement.md artefact list dropped the token: [$tok]"
    fi
done

if [ -z "$cerrs" ]; then
    pass "edit-ownership-carveouts-preserved: workflow/enforcement.md still names the two carve-outs (Pass-2 '## Code review' trail + advocate '## Resolutions' trail) and the orchestrator-own-output artefact list (backlog / .ai-pm/state / Pass-2 code-review / advocate Resolutions / protocol-gap report / git ops) — the broadened rule did not over-block"
else
    fail "edit-ownership-carveouts-preserved: a carve-out / artefact-list token was dropped (over-block risk):$(printf '%b' "$cerrs")"
fi

# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "----"
echo "Total: $TOTAL  Passed: $PASS_COUNT  Failed: $FAIL_COUNT"

[ "$FAIL_COUNT" -gt 0 ] && exit 1
exit 0
