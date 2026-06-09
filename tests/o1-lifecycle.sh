#!/bin/sh
# tests/o1-lifecycle.sh — the O(1) artifact-lifecycle + distillation guard suite
# (doc-frugality, Slice D — one transient dossier per in-flight feature,
# distill-on-merge into the four graduation homes, the pre-ship graduation gate,
# and the clean supersede of the state-archive-home model).
#
# Slice D replaces the persist-archive-on-branch model with: a feature in flight
# carries ONE transient dossier `.ai-pm/features/<topic>.md`; on merge its durable
# knowledge is distilled into the four `### Graduation targets`; the dossier then
# ceases to be maintained (git keeps the bytes). `.ai-pm/tmp/` is git-ignored so
# scratch never enters the committed tree. A pre-ship Step-6 checklist (procedural,
# not a plugin deny) is the PREVENT half; the auditor git-aware check (C.9) is the
# RECOVER backstop.
#
# Cases (plan Slice D test plan + interaction scenarios):
#
#   o1-artifact-lifecycle
#     the dossier model (one `.ai-pm/features/<topic>.md`) is documented in
#     workflow/state.md; distill-on-merge references `### Graduation targets` by
#     name (not a re-listed enum); `.ai-pm/tmp/` is git-ignored (the rule landed
#     where Slice D put it — this repo's .gitignore + the downstream bootstrap
#     scaffolding instruction).
#
#   state-archive-superseded-clean
#     FULL-REPO clean-grep (Slice E extended it from the Slice-D state.md+pipeline.md
#     scope now that the template/bootstrap archive refs are removed): no LIVE text
#     anywhere in the git-tracked tree still asserts the persist-archive-on-branch
#     model (`.ai-pm/state/archive/`, "archive the state", "archived to").
#     Excludes (legitimate non-live mentions): historical process files
#     (doc/features/*_plan.md), the CHANGELOG (release history), the ADR's own
#     self-describing supersede line in doc/architecture.md (it names the superseded
#     model on purpose), generated/golden adapters + the test files themselves, and
#     negation lines (a "not archived to a separate directory" pointer IS the
#     supersede statement). NON-VACUITY: re-introducing the phrase trips it.
#
#   graduation-gate-procedural
#     workflow/pipeline.md Step 6 carries the graduation checklist, names it as a
#     PROCEDURAL gate (not a plugin deny), and names the auditor git-aware check as
#     the structural backstop. The OpenCode orchestrator persona echoes the same.
#
# Exit code: 0 if every case matches expectation, 1 if any case fails.
# One line per case is printed: "PASS: ..." or "FAIL: ...".
#
# Usage: bash tests/o1-lifecycle.sh
# Dependencies: grep, sed, git. No third-party framework.

set -u

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
    echo "FAIL: not inside a git repo — tests/o1-lifecycle.sh must run inside ai-pm-protocol" >&2
    exit 1
}
cd "$ROOT" || exit 1

STATE="$ROOT/workflow/state.md"
PIPE="$ROOT/workflow/pipeline.md"
GITIGNORE="$ROOT/.gitignore"
BOOT="$ROOT/src/commands/pm-bootstrap.body.md"
ORCH="$ROOT/src/manifests/opencode/harness_local/body/ai-pm.body.md"

PASS_COUNT=0
FAIL_COUNT=0
pass() { echo "PASS: $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { echo "FAIL: $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

for f in "$STATE" "$PIPE" "$GITIGNORE" "$BOOT" "$ORCH"; do
    [ -f "$f" ] || { echo "FAIL: required file missing at $f" >&2; exit 1; }
done

SCRATCH=$(mktemp -d) || { echo "FAIL: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$SCRATCH"' EXIT

# ----------------------------------------------------------------------
# o1-artifact-lifecycle
# ----------------------------------------------------------------------
lerrs=""

# The dossier model — one transient `.ai-pm/features/<topic>.md` — is documented
# in workflow/state.md.
grep -qF '.ai-pm/features/<topic>.md' "$STATE" \
    || lerrs="$lerrs\n  - workflow/state.md does not document the one-dossier path .ai-pm/features/<topic>.md"
grep -qi 'transient dossier' "$STATE" \
    || lerrs="$lerrs\n  - workflow/state.md does not name the transient dossier model"

# Distill-on-merge references `### Graduation targets` BY NAME (single-home, not
# a re-listed enum).
grep -qF '### Graduation targets' "$STATE" \
    || lerrs="$lerrs\n  - workflow/state.md distill-on-merge does not reference '### Graduation targets' by name"
grep -qF 'workflow/doc-style.md' "$STATE" \
    || lerrs="$lerrs\n  - workflow/state.md does not point at workflow/doc-style.md (the graduation-targets home)"

# `.ai-pm/tmp/` is git-ignored in THIS repo.
grep -qx '.ai-pm/tmp/' "$GITIGNORE" \
    || lerrs="$lerrs\n  - this repo's .gitignore does not ignore .ai-pm/tmp/"

# A downstream scaffold also ignores it: the bootstrap body carries the
# scaffold-the-ignore instruction (the proportional minimum — no gitignore
# template file exists; the full lean template set is Slice E).
grep -qi 'tmp/.*git-ignored\|git-ignored.*tmp/\|append.*\.ai-pm/tmp/' "$BOOT" \
    || lerrs="$lerrs\n  - pm-bootstrap does not scaffold a downstream .ai-pm/tmp/ ignore rule"

if [ -z "$lerrs" ]; then
    pass "o1-artifact-lifecycle: the one-dossier model is documented in workflow/state.md, distill-on-merge references '### Graduation targets' by name, and .ai-pm/tmp/ is git-ignored (this repo + the downstream bootstrap scaffold)"
else
    fail "o1-artifact-lifecycle: the lifecycle model is not fully wired:$(printf '%b' "$lerrs")"
fi

# ----------------------------------------------------------------------
# state-archive-superseded-clean (FULL-REPO sweep; with non-vacuity)
# No LIVE text ANYWHERE in the git-tracked tree still asserts the
# persist-archive-on-branch model. We scan for the archive-model tokens and drop
# the legitimate non-live mentions:
#   - historical process files (doc/features/*_plan.md), the CHANGELOG, and the
#     test files themselves are path-excluded;
#   - generated/golden adapters mirror src/ and are path-excluded (the src/ home
#     is what we assert);
#   - the ADR's own supersede prose legitimately NAMES the superseded model — a
#     line carrying a supersede cue (state-archive-home / Supersedes / superseded /
#     rejected keep-archives) or a negation cue ("not archived", "not curated",
#     "no separate", "incidentally", "never an archive") is the supersede
#     statement itself, not an assertion of the model.
# ----------------------------------------------------------------------
filter_supersede_lines() {
    # Drop negation lines and ADR-self-describing supersede-cue lines.
    grep -viE 'not curated|not archived|no separate|incidentally|never an archive|state-archive-home|[Ss]upersede|rejected keep-archives'
}

# Full-repo sweep over git-tracked files, with path exclusions for historical /
# generated / test files.
archive_sweep() {
    git grep -nE '\.ai-pm/state/archive/|archive the state|archived to' -- \
        ':!doc/features/*_plan.md' \
        ':!CHANGELOG.md' \
        ':!tests/*' \
        ':!.claude/*' \
        ':!.opencode/*' \
        ':!.golden/*' \
        ':!.ai-pm/*' \
        2>/dev/null \
        | filter_supersede_lines
}

hits=$(archive_sweep)
if [ -z "$hits" ]; then
    pass "state-archive-superseded-clean: no live text anywhere in the git-tracked tree still asserts the persist-archive-on-branch model (full-repo sweep)"
else
    fail "state-archive-superseded-clean: the archive model survives the supersede:\n$(printf '%s' "$hits" | sed 's/^/      /')"
fi

# Non-vacuity: a fresh tracked file affirming the archive model must trip the
# sweep. We add+commit a scratch file inside the tree, run the sweep, then undo —
# proving the full-repo grep is live and not vacuously excluded.
NV_FILE="$ROOT/workflow/_nv_archive_probe.md"
printf 'When a task finishes, the file is archived to .ai-pm/state/archive/x-2026-01-01.md and reset.\n' > "$NV_FILE"
git -C "$ROOT" add "$NV_FILE" >/dev/null 2>&1
if [ -n "$(archive_sweep)" ]; then
    pass "state-archive-superseded-clean-nonvacuous: a fresh tracked file affirming the archive model trips the full-repo sweep (the clean-grep is live)"
else
    fail "state-archive-superseded-clean-nonvacuous: re-introducing the archive assertion did NOT trip the sweep — the clean-grep is vacuous"
fi
git -C "$ROOT" reset -q -- "$NV_FILE" >/dev/null 2>&1
rm -f "$NV_FILE"

# ----------------------------------------------------------------------
# graduation-gate-procedural
# Step 6 carries the graduation checklist, names it PROCEDURAL (not a plugin deny),
# and names the auditor git-aware check as the structural backstop. The OpenCode
# orchestrator persona echoes the same.
# ----------------------------------------------------------------------
gerrs=""
grep -qi 'graduation checklist' "$PIPE" \
    || gerrs="$gerrs\n  - workflow/pipeline.md Step 6 does not carry the graduation checklist"
grep -qi 'procedural Step-6 gate\|procedural.*gate' "$PIPE" \
    || gerrs="$gerrs\n  - workflow/pipeline.md does not name the graduation gate as procedural"
grep -qi 'not a plugin deny\|cannot check this\|beyond a structural deny' "$PIPE" \
    || gerrs="$gerrs\n  - workflow/pipeline.md does not state the gate is NOT a plugin deny"
grep -qi 'git-aware graduation check\|auditor.*git-aware\|git history.*standing docs' "$PIPE" \
    || gerrs="$gerrs\n  - workflow/pipeline.md does not name the auditor git-aware check as the backstop"
grep -qF '### Graduation targets' "$PIPE" \
    || gerrs="$gerrs\n  - workflow/pipeline.md Step 6 does not reference '### Graduation targets' by name"

# The OpenCode orchestrator persona echoes the pre-ship graduation checklist.
grep -qi 'graduation checklist' "$ORCH" \
    || gerrs="$gerrs\n  - OpenCode orchestrator body does not echo the pre-ship graduation checklist"
grep -qF '### Graduation targets' "$ORCH" \
    || gerrs="$gerrs\n  - OpenCode orchestrator body does not reference '### Graduation targets' by name"
grep -qi 'NOT a plugin deny\|not a plugin deny\|procedural checklist' "$ORCH" \
    || gerrs="$gerrs\n  - OpenCode orchestrator body does not state the graduation gate is procedural, not a plugin deny"

if [ -z "$gerrs" ]; then
    pass "graduation-gate-procedural: Step 6 carries the graduation checklist named as procedural (not a plugin deny) with the auditor git-aware check as backstop, and the OpenCode persona echoes it"
else
    fail "graduation-gate-procedural: the procedural graduation gate is not fully wired:$(printf '%b' "$gerrs")"
fi

# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "----"
echo "Total: $TOTAL  Passed: $PASS_COUNT  Failed: $FAIL_COUNT"

[ "$FAIL_COUNT" -gt 0 ] && exit 1
exit 0
