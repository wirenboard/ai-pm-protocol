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
AUDITOR="$ROOT/src/agents/pm-auditor.body.md"

PASS_COUNT=0
FAIL_COUNT=0
pass() { echo "PASS: $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { echo "FAIL: $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

for f in "$STATE" "$PIPE" "$GITIGNORE" "$BOOT" "$ORCH" "$AUDITOR"; do
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
# auditor-dims-defer-to-c9
# Dimensions 1 (artifact completeness — plan/review existence) and 2 (plan->impl
# parity, which reads the per-feature _review.md as evidence) must be O(1)-aware:
# for a MERGED feature whose per-feature plan/review evidence has EVAPORATED to
# git AND whose durable bits GRADUATED into their `### Graduation targets` homes,
# they DEFER to the C.9 git-aware graduation check — a merged + graduated +
# evaporated feature reads as CLEAN through dims 1+2, not as a missing-artifact
# finding. The file-existence expectations apply to in-flight / not-yet-distilled
# features (and to the durable contract registry). This pins the reconciliation
# so a future edit cannot silently re-introduce the FALSE-BLOCK of every collapsed
# merged feature.
#
# We extract dimension 1 (### 1. … up to ### 2.) and dimension 2 (### 2. … up to
# ### 3.) from the auditor body and assert each carries the defer-to-C.9 wording,
# names the O(1) model, and (for dim 1) keeps the in-flight / contract-registry
# carve-out. Non-vacuity: stripping the dim-1 defer sentence trips the check.
# ----------------------------------------------------------------------
dim_section() {
    # $1 = section file, $2 = start heading, $3 = stop heading
    awk -v start="$2" -v stop="$3" '
        $0 ~ start {grab=1}
        grab && $0 ~ stop && $0 != start {grab=0}
        grab {print}
    ' "$1"
}

DIM1=$(dim_section "$AUDITOR" '^### 1[.] Artifact completeness' '^### 2[.]')
DIM2=$(dim_section "$AUDITOR" '^### 2[.] Plan' '^### 3[.]')

aerrs=""

# Dimension 1 defers a MERGED feature to the C.9 graduation check.
printf '%s' "$DIM1" | grep -qi 'merged feature.*defer\|defer.*C\.9\|defers to.*graduation' \
    || aerrs="$aerrs\n  - dimension 1 does not state a MERGED feature defers to the C.9 graduation check"
# It names the O(1) lifecycle model by its single home.
printf '%s' "$DIM1" | grep -qF 'One transient dossier per in-flight feature' \
    || aerrs="$aerrs\n  - dimension 1 does not reference the O(1) lifecycle model in workflow/state.md"
# It keeps the file-existence checks scoped to in-flight / not-yet-distilled work.
printf '%s' "$DIM1" | grep -qi 'in-flight' \
    || aerrs="$aerrs\n  - dimension 1 does not scope the file-existence checks to in-flight features"
# The durable contract registry is NOT treated as evaporating evidence.
printf '%s' "$DIM1" | grep -qi 'contract registry\|durable home' \
    || aerrs="$aerrs\n  - dimension 1 does not keep the contract registry as a durable (non-evaporating) home"
# It references the graduation-targets homes by name (single-home, not re-encoded).
printf '%s' "$DIM1" | grep -qF '### Graduation targets' \
    || aerrs="$aerrs\n  - dimension 1 does not reference '### Graduation targets' by name"

# Dimension 2 inherits the same scoping — a merged feature whose review evaporated
# defers to C.9 (absent review is not itself a parity finding).
printf '%s' "$DIM2" | grep -qi 'merged.*defer\|defer.*C\.9\|evaporated.*defer' \
    || aerrs="$aerrs\n  - dimension 2 does not defer a merged feature's absent review to the C.9 check"
printf '%s' "$DIM2" | grep -qi 'in-flight' \
    || aerrs="$aerrs\n  - dimension 2 does not scope its review-as-evidence check to in-flight features"

if [ -z "$aerrs" ]; then
    pass "auditor-dims-defer-to-c9: dimensions 1+2 are O(1)-aware — a merged + graduated + evaporated feature defers to the C.9 graduation check (not a missing-artifact finding), with file-existence checks scoped to in-flight work and the contract registry kept durable"
else
    fail "auditor-dims-defer-to-c9: the dims-1+2 -> C.9 reconciliation is not fully wired:$(printf '%b' "$aerrs")"
fi

# Non-vacuity: a copy of the auditor body with the dim-1 defer wording removed
# must trip the dim-1 defer assertion (proves the grep reads real text, not a
# vacuous always-true).
NV_AUD="$SCRATCH/pm-auditor-novacuum.body.md"
# Neutralize every "defer"/"defers" verb so the positive grep's defer-keyed
# patterns can no longer match — this is exactly the wording the reconciliation
# adds; stripping it must reinstate the old always-block reading.
sed 's/defers/checks-existence/g; s/defer/always-block/g' "$AUDITOR" > "$NV_AUD"
NV_DIM1=$(dim_section "$NV_AUD" '^### 1[.] Artifact completeness' '^### 2[.]')
if printf '%s' "$NV_DIM1" | grep -qi 'merged feature.*defer\|defer.*C\.9\|defers to.*graduation'; then
    fail "auditor-dims-defer-to-c9-nonvacuous: stripping the defer-to-C.9 wording did NOT trip the dim-1 check — the assertion is vacuous"
else
    pass "auditor-dims-defer-to-c9-nonvacuous: removing the defer-to-C.9 wording trips the dim-1 check (the assertion reads real text)"
fi

# ----------------------------------------------------------------------
# auditor-inventory-from-ledger
# Under the O(1) lifecycle a merged feature's plan/review files EVAPORATE to git,
# so the auditor must build its merged-feature inventory WITHOUT depending on them:
#   (a) the inventory-building step sources merged features from git + the
#       docs/product-map.md ledger (the durable feature list), reading
#       docs/features/*_plan.md ONLY for in-flight / not-yet-merged features;
#   (b) the product-map RE-DERIVE source list is .ai-pm/contracts/ + git ONLY —
#       it no longer names docs/features/ or .ai-pm/reviews/ as re-derivation
#       sources (matching the updated generation procedure in pm-bootstrap).
#   (c) step 3 (the contract-check table) sources a MERGED feature's row from the
#       durable contract registry + the ledger (the merged plan has EVAPORATED to
#       git — there is no plan file to open), keeping the in-flight arm that opens
#       the surviving _plan.md and reads scenario 1.
#   (d) dimension 5 matches the name+date `| Feature | Added |` ledger shape (no
#       Review link column, no Done review-date column), and its stale-map "feature
#       not rendered" sub-check sources from git + the ledger, NOT the evaporated
#       docs/features/.
# This pins the reconciliation so a future edit cannot silently re-source the
# inventory / map / contract-check from the now-evaporating per-feature evidence
# files, nor re-introduce the old map shape.
#
# We extract the inventory-building step, the product-map re-derive bullet, step 3,
# and dimension 5 from the auditor body and assert the new sourcing/shape.
# Non-vacuity: restoring the OLD re-derive source list (which named docs/features/ +
# .ai-pm/reviews/) trips (b); stripping the step-3 MERGED-arm wording trips (c).
# ----------------------------------------------------------------------
ierrs=""

# (a) Inventory-building step: merged features come from git + the product-map
# ledger; plan files are read only for in-flight features.
grep -qF 'inventory comes from `git log`' "$AUDITOR" \
    || ierrs="$ierrs\n  - inventory step does not source the merged-feature inventory from git log"
grep -qF '`docs/product-map.md` ledger' "$AUDITOR" \
    || ierrs="$ierrs\n  - inventory step does not name the docs/product-map.md ledger as the durable merged-feature list"
grep -qi 'only for in-flight / not-yet-merged features\|only for in-flight' "$AUDITOR" \
    || ierrs="$ierrs\n  - inventory step does not scope docs/features/*_plan.md reads to in-flight / not-yet-merged features"
grep -qi 'present in git / the ledger .*OR.* surviving plan file\|present in git .* ledger' "$AUDITOR" \
    || ierrs="$ierrs\n  - inventory step does not keep mixed-project tolerance (git/ledger OR a surviving plan counts)"

# (b) Product-map re-derive SOURCE LIST: the parenthetical immediately after
# "re-derive it from source" is .ai-pm/contracts/ + git ONLY; the evaporated
# docs/features/ + .ai-pm/reviews/ are NO LONGER named as re-derivation sources.
# Extract just the source parenthetical (between "from source (" and the closing
# ")") so the later "deliberately does NOT read docs/features/" negation prose
# does not false-trip the source-list assertion.
SRCLIST=$(grep -i 're-derive it from source' "$AUDITOR" | sed -n 's/.*from source (\([^)]*\)).*/\1/p')
[ -n "$SRCLIST" ] \
    || ierrs="$ierrs\n  - could not extract the product-map re-derive source parenthetical"
printf '%s' "$SRCLIST" | grep -qF '.ai-pm/contracts/' \
    || ierrs="$ierrs\n  - product-map re-derive source list does not name .ai-pm/contracts/"
printf '%s' "$SRCLIST" | grep -qiw 'git' \
    || ierrs="$ierrs\n  - product-map re-derive source list does not name git"
printf '%s' "$SRCLIST" | grep -qF 'docs/features/' \
    && ierrs="$ierrs\n  - product-map re-derive source list STILL names the evaporated docs/features/ as a re-derivation source"
printf '%s' "$SRCLIST" | grep -qF '.ai-pm/reviews/' \
    && ierrs="$ierrs\n  - product-map re-derive source list STILL names the evaporated .ai-pm/reviews/ as a re-derivation source"

# (c) Step-3 contract-check sourcing: for a MERGED feature the row sources from the
# durable contract registry + the ledger, NOT the evaporated plan; the plan file is
# opened ONLY for an in-flight feature. Extract step 3 (the "Fill the contract check
# table" step, up to the next numbered step "4.") and assert both arms.
STEP3=$(awk '
    /^3[.] [*][*]Fill the contract check table/ {grab=1}
    grab && /^4[.] / {grab=0}
    grab {print}
' "$AUDITOR")
[ -n "$STEP3" ] \
    || ierrs="$ierrs\n  - could not extract step 3 (the contract-check table step)"
# The MERGED arm sources from the contract registry (durable home), not the plan.
printf '%s' "$STEP3" | grep -qi 'MERGED feature.*contract registry\|contract registry.*ledger\|evaporated to git' \
    || ierrs="$ierrs\n  - step 3 does not source a MERGED feature's contract-check row from the durable contract registry + ledger"
# It explicitly states the merged plan has evaporated (no plan file to open).
printf '%s' "$STEP3" | grep -qi 'evaporated to git\|no plan file to open\|plan has .*evaporated' \
    || ierrs="$ierrs\n  - step 3 does not state a MERGED feature's plan has evaporated (so the plan cannot be opened)"
# The in-flight arm still opens the plan file (the plan survives on the branch).
printf '%s' "$STEP3" | grep -qi 'in-flight.*plan survives\|in-flight.*open.*_plan.md\|open .*_plan.md.*scenario 1' \
    || ierrs="$ierrs\n  - step 3 does not keep the in-flight arm (open the surviving plan file, read scenario 1)"
# It names the O(1) lifecycle model by its single home.
printf '%s' "$STEP3" | grep -qF 'One transient dossier per in-flight feature' \
    || ierrs="$ierrs\n  - step 3 does not reference the O(1) lifecycle model in workflow/state.md"

# (d) Dimension 5 stale-map shape: the ledger is a name+date `| Feature | Added |`
# shape with NO `Review` link column and NO `Done` review-date column; the
# now-evaporated-plan stale-map sub-check sources from the ledger, not docs/features/.
DIM5=$(dim_section "$AUDITOR" '^### 5[.] Docs currency' '^### 6[.]')
[ -n "$DIM5" ] \
    || ierrs="$ierrs\n  - could not extract dimension 5 (docs currency)"
# The ledger shape is name+date with no Review/Done column.
printf '%s' "$DIM5" | grep -qi 'name . date ledger\|name + date\|no .*Review.* column\|no .*Done.* .*column' \
    || ierrs="$ierrs\n  - dimension 5 does not describe the ledger as a name+date shape with no Review/Done column"
# The stale-map "feature not rendered" sub-check sources from git + the ledger, NOT
# the evaporated docs/features/.
printf '%s' "$DIM5" | grep -qi 'from git . the ledger.*not.*the evaporated\|not.*the evaporated.*docs/features/' \
    || ierrs="$ierrs\n  - dimension 5 stale-map sub-check still sources from the evaporated docs/features/ instead of git + the ledger"

if [ -z "$ierrs" ]; then
    pass "auditor-inventory-from-ledger: the merged-feature inventory is sourced from git + the docs/product-map.md ledger (plan files read only for in-flight work); the product-map re-derive source list is .ai-pm/contracts/ + git only (docs/features/ + .ai-pm/reviews/ dropped); step 3 sources a MERGED feature's contract-check row from the contract registry + ledger (not its evaporated plan), keeping the in-flight open-the-plan arm; and dimension 5 matches the name+date ledger shape (no Review/Done column, stale-map check off the ledger not docs/features/)"
else
    fail "auditor-inventory-from-ledger: the inventory/map O(1) re-sourcing is not fully wired:$(printf '%b' "$ierrs")"
fi

# Non-vacuity: a copy of the auditor body whose re-derive line is restored to the
# OLD source list (naming docs/features/ + .ai-pm/reviews/) must trip the (b)
# check — proving the grep reads the real re-derive line, not a vacuous always-true.
NV_LEDGER="$SCRATCH/pm-auditor-ledger-novacuum.body.md"
sed 's#re-derive it from source (`\.ai-pm/contracts/` + git)#re-derive it from source (`.ai-pm/contracts/`, `docs/features/`, `.ai-pm/reviews/`, git)#' "$AUDITOR" > "$NV_LEDGER"
NV_SRCLIST=$(grep -i 're-derive it from source' "$NV_LEDGER" | sed -n 's/.*from source (\([^)]*\)).*/\1/p')
if printf '%s' "$NV_SRCLIST" | grep -qF 'docs/features/'; then
    pass "auditor-inventory-from-ledger-nonvacuous: restoring the OLD re-derive source list (naming docs/features/ + .ai-pm/reviews/) trips the (b) source check (the assertion reads the real re-derive line)"
else
    fail "auditor-inventory-from-ledger-nonvacuous: restoring the OLD re-derive source list did NOT trip the (b) check — the assertion is vacuous"
fi

# Non-vacuity for (c): a copy of the auditor body whose step-3 MERGED-arm wording is
# stripped (the "contract registry" + "evaporated to git" cues removed) must trip the
# step-3 (c) check — proving the grep reads the real reconciled step 3, not a vacuous
# always-true. We neutralize the registry/evaporated cues that the merged arm adds.
NV_STEP3="$SCRATCH/pm-auditor-step3-novacuum.body.md"
sed 's/contract registry/PLAN-FILE/g; s/evaporated to git/still on disk/g' "$AUDITOR" > "$NV_STEP3"
NV_S3=$(awk '
    /^3[.] [*][*]Fill the contract check table/ {grab=1}
    grab && /^4[.] / {grab=0}
    grab {print}
' "$NV_STEP3")
if printf '%s' "$NV_S3" | grep -qi 'MERGED feature.*contract registry\|contract registry.*ledger\|evaporated to git'; then
    fail "auditor-inventory-from-ledger-step3-nonvacuous: stripping the step-3 MERGED-arm wording (contract registry / evaporated) did NOT neutralize the (c) check — the assertion is vacuous"
else
    pass "auditor-inventory-from-ledger-step3-nonvacuous: removing the step-3 MERGED-arm wording trips the (c) check (the assertion reads the real reconciled step 3, not a vacuous always-true)"
fi

# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "----"
echo "Total: $TOTAL  Passed: $PASS_COUNT  Failed: $FAIL_COUNT"

[ "$FAIL_COUNT" -gt 0 ] && exit 1
exit 0
