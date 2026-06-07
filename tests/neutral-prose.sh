#!/bin/sh
# tests/neutral-prose.sh — the harness-neutral-prose guard suite
# (harness-neutral-prose, slice 1). Proves the shared instruction prose names
# every harness-specific concept with a NEUTRAL NOUN, never a bare Claude
# primitive, and that the reader-facing reference table is a drift-free render of
# the single source (src/manifests/capabilities.json).
#
# Cases (plan Test plan wording + arch note § "The guard's residual-token
# allowlist"):
#
#   neutral-prose-no-claude-isms
#     given the neutralized corpus — the shared bodies (src/agents|commands/
#     *.body.md) AND the always-on core (WORKFLOW.md + workflow/*.md) — when
#     scanned for bare Claude primitives (CLAUDE.md, AskUserQuestion, settings.json
#     PreToolUse, UserPromptSubmit, the @-import-as-the-only-mechanism, .claude/,
#     the Skill tool), then NONE appears except in the documented allowlist. The
#     standard is mechanically enforced, the same loud-fail discipline as
#     single-source-diff-clean. NON-VACUOUS: the suite also injects a bare
#     CLAUDE.md into a scratch copy and asserts the scan trips
#     (claude-ism-reintroduction-trips-guard).
#
#     ALLOWLIST (arch note § "The guard's residual-token allowlist", extended for
#     the always-on core in slice 2):
#       * the install command bodies (pm-bootstrap + pm-audit) — DEFERRED install/
#         enforcement concretes, until the install-auto-detect slice.
#       * .git/hooks — a git mechanic, never a Claude-ism (not scanned).
#       * workflow/enforcement.md line 42 ONLY — the one passage that genuinely
#         TEACHES the per-harness enforcement MECHANISM, naming BOTH harnesses'
#         concretes side by side (Claude settings.json PreToolUse hook; OpenCode
#         tool.execute.before plugin) as the "realized per harness" detail and
#         pointing at the harness-reference table. The arch note explicitly keeps
#         this kind of mechanism-teaching passage concrete rather than forcing a
#         wrong neutralization. Matched by an exact marker phrase so a stray Claude
#         primitive ELSEWHERE in enforcement.md still trips.
#
#     SCOPE: slice 1 neutralized the BODIES; slice 2 extends the SAME scan to
#     WORKFLOW.md + workflow/*.md (the always-on core, the most-read surface).
#
#   reference-table-matches-capabilities
#     given the rendered reference table (gen/harness-reference.md), when its
#     neutral<->concrete mapping is compared to capabilities.json's
#     harness_reference block, then they are identical — no drift, no second
#     copy. The render is re-run and diffed against the committed file.
#
#   harness-reference-table-complete
#     given the harness_reference block, when each neutral noun is looked up,
#     then it has BOTH a Claude and an OpenCode concrete — no neutral noun is
#     unmapped.
#
# Exit code: 0 if every case matches expectation, 1 if any case fails.
# One line per case is printed: "PASS: ..." or "FAIL: ...".
#
# Usage: bash tests/neutral-prose.sh
# Dependencies: python3 (stdlib only), grep, diff, git. No third-party framework.

set -u

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
    echo "FAIL: not inside a git repo — tests/neutral-prose.sh must run inside ai-pm-protocol" >&2
    exit 1
}
cd "$ROOT" || exit 1

CAPS="$ROOT/src/manifests/capabilities.json"
TABLE="$ROOT/gen/harness-reference.md"
GEN="$ROOT/gen/generate.py"

PASS_COUNT=0
FAIL_COUNT=0
pass() { echo "PASS: $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { echo "FAIL: $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

[ -f "$CAPS" ]  || { echo "FAIL: capabilities.json missing at $CAPS" >&2; exit 1; }
[ -f "$TABLE" ] || { echo "FAIL: rendered reference table missing at $TABLE" >&2; exit 1; }
[ -f "$GEN" ]   || { echo "FAIL: generator missing at $GEN" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "FAIL: python3 not available" >&2; exit 1; }

# The in-scope neutralized corpus.
#   BODIES  — the shared agent + command bodies (slice 1) PLUS the OpenCode
#             harness-local agent bodies (the orchestrator `ai-pm` + the engines).
#             The harness-local bodies are OpenCode-specific, not neutral, so they
#             may legitimately name "Claude" in prose (e.g. the engines say "the
#             analogue of Claude's built-in") — but they must still NOT carry a
#             bare Claude PRIMITIVE (CLAUDE.md, AskUserQuestion, the Skill tool,
#             settings.json PreToolUse, the @-import, .claude/). The orchestrator
#             body must use the neutral vocabulary; this scan enforces it
#             (opencode-orchestrator-primary plan, Test plan
#             `oc-orchestrator-self-contained`).
#   CORE    — the always-on core (slice 2): WORKFLOW.md + every workflow/*.md.
#             These are ROOT files, NOT generated (the generator never touches
#             them; they ship to both harnesses via the instruction-loading
#             mechanism), so there is no golden impact — edited in place.
BODIES="$ROOT/src/agents $ROOT/src/commands $ROOT/src/manifests/opencode/harness_local/body"
CORE="$ROOT/WORKFLOW.md $ROOT/workflow"

# The ONE allowlisted line in the core: the per-harness enforcement-mechanism
# teaching passage in workflow/enforcement.md (arch note allowlist). Matched by an
# exact marker substring so a stray primitive elsewhere in enforcement.md trips.
ENFORCEMENT_TEACH_RE='The enforcement layer is \*\*realized per harness\*\*'

# ----------------------------------------------------------------------
# neutral-prose-no-claude-isms
#
# Two pattern classes (arch note § allowlist):
#   * STRICT — must NOT appear anywhere in the bodies (these were fully
#     neutralized this slice): AskUserQuestion, the bare `Skill` tool grant,
#     UserPromptSubmit.
#   * DEFERRED — the install/enforcement concretes (CLAUDE.md, .claude/,
#     settings.json PreToolUse) allowed ONLY in the two install command bodies
#     (pm-bootstrap.body.md, pm-audit.body.md), which the install-auto-detect
#     slice neutralizes later. A DEFERRED concrete anywhere ELSE is a fail; a NEW
#     STRICT concrete in the install bodies still trips.
#
# .git/hooks is NOT scanned — a git mechanic, never a Claude-ism (arch note).
# ----------------------------------------------------------------------

# Scan helper: grep the pattern across a file set, excluding the allowed files,
# and (optionally) excluding lines that are the template-filename / shell-literal
# install concretes already accounted for. Prints offending "file:line" hits.
INSTALL_BODIES_RE='src/commands/pm-bootstrap\.body\.md|src/commands/pm-audit\.body\.md'

scan_strict() {
    # $1 = grep ERE pattern; offending hits anywhere in the bodies are a fail.
    grep -rnE "$1" $BODIES 2>/dev/null | sed "s#^$ROOT/##"
}

scan_deferred() {
    # $1 = grep ERE pattern; hits are allowed ONLY in the two install bodies.
    grep -rnE "$1" $BODIES 2>/dev/null | sed "s#^$ROOT/##" \
        | grep -vE "^($INSTALL_BODIES_RE):"
}

violations=""

# STRICT patterns — fully neutralized; must not appear in any body.
for pat in 'AskUserQuestion' 'UserPromptSubmit'; do
    hits=$(scan_strict "$pat")
    [ -n "$hits" ] && violations="$violations
[$pat] (must be neutral everywhere):
$hits"
done

# The bare `Skill` tool grant (capitalised, as a tool name) — neutralized to
# "the skill-invocation tool". Match `Skill` as a word; the lowercase OpenCode
# `skill` and the `skill-invocation` neutral noun do NOT match (case-sensitive,
# word-boundary, not followed by `-invocation`).
skill_hits=$(grep -rnE '\bSkill\b' $BODIES 2>/dev/null | sed "s#^$ROOT/##")
[ -n "$skill_hits" ] && violations="$violations
[bare Skill tool] (must be 'the skill-invocation tool'):
$skill_hits"

# DEFERRED patterns — allowed only in the install command bodies.
for pat in 'CLAUDE\.md' '\.claude/' 'PreToolUse'; do
    hits=$(scan_deferred "$pat")
    [ -n "$hits" ] && violations="$violations
[$pat] (only allowed in the install command bodies, found elsewhere):
$hits"
done

# ----------------------------------------------------------------------
# CORE scan (slice 2) — WORKFLOW.md + workflow/*.md.
#
# These root files carry NO install bodies, so EVERY listed bare primitive must
# be neutral. The ONLY allowed home is the single enforcement-mechanism teaching
# line in workflow/enforcement.md (matched by ENFORCEMENT_TEACH_RE), which the
# arch note keeps concrete because it genuinely teaches both harnesses' wiring
# side by side. A primitive on any OTHER core line is a fail.
# ----------------------------------------------------------------------

scan_core() {
    # $1 = grep ERE pattern; offending hits anywhere in the core are a fail,
    # EXCEPT the one allowlisted enforcement-teaching line.
    grep -rnE "$1" $CORE 2>/dev/null | sed "s#^$ROOT/##" \
        | grep -vE "$ENFORCEMENT_TEACH_RE"
}

# Every listed bare Claude primitive must be neutral across the whole core.
# `@-import` is matched as the "@<word>" instruction-loading concrete (the bare
# @.ai-pm path or an @WORKFLOW.md-style import); the neutral noun "the
# instruction-loading mechanism" does NOT match.
for pat in 'AskUserQuestion' 'UserPromptSubmit' 'CLAUDE\.md' '\.claude/' \
           'PreToolUse' 'settings\.json' '@\.ai-pm/tooling' '@WORKFLOW'; do
    hits=$(scan_core "$pat")
    [ -n "$hits" ] && violations="$violations
[$pat] (core must be neutral; only the enforcement-teaching line is exempt):
$hits"
done

# The bare `Skill` tool grant in the core (same case-sensitive word-boundary rule
# as the bodies; the lowercase `skill` and `skill-invocation` noun do not match).
core_skill_hits=$(grep -rnE '\bSkill\b' $CORE 2>/dev/null | sed "s#^$ROOT/##" \
    | grep -vE "$ENFORCEMENT_TEACH_RE")
[ -n "$core_skill_hits" ] && violations="$violations
[bare Skill tool in core] (must be 'the skill-invocation tool'):
$core_skill_hits"

if [ -z "$violations" ]; then
    pass "neutral-prose-no-claude-isms: no bare Claude primitive in the neutralized bodies OR the always-on core (WORKFLOW.md + workflow/*.md) outside the documented allowlist (install bodies + .git/hooks + the one enforcement-mechanism teaching line)"
else
    fail "neutral-prose-no-claude-isms: bare Claude primitive(s) found outside the allowlist:"
    printf '%s\n' "$violations" | sed 's/^/    /'
fi

# ----------------------------------------------------------------------
# claude-ism-reintroduction-trips-guard (non-vacuity)
# Inject a bare CLAUDE.md into a scratch copy of a NON-install body and assert a
# strict scan over it trips. Proves the guard is live, not vacuous.
# ----------------------------------------------------------------------
SCRATCH=$(mktemp -d) || { echo "FAIL: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$SCRATCH"' EXIT
mkdir -p "$SCRATCH/agents"
# A non-install body that legitimately carries NO CLAUDE.md after neutralization.
printf 'A bare reintroduction: update CLAUDE.md before shipping.\n' > "$SCRATCH/agents/injected.body.md"
# Run the same deferred-scan logic, but over the scratch dir (NOT in the install
# allowlist), so a CLAUDE.md hit must surface.
inject_hits=$(grep -rnE 'CLAUDE\.md' "$SCRATCH/agents" 2>/dev/null)
if [ -n "$inject_hits" ]; then
    pass "claude-ism-reintroduction-trips-guard: an injected bare CLAUDE.md is detected by the scan (guard is live)"
else
    fail "claude-ism-reintroduction-trips-guard: injected CLAUDE.md was NOT detected — guard is vacuous"
fi

# ----------------------------------------------------------------------
# core-scan-non-vacuous (slice 2)
# Prove the CORE scan + its enforcement-teaching allowlist are BOTH live:
#   (a) a bare AskUserQuestion on an ordinary core line MUST surface, and
#   (b) the allowlisted enforcement-teaching marker line MUST be exempt (a Claude
#       concrete on that one line is NOT flagged) — so the allowlist is real, not
#       a blanket pass that would swallow violations.
# Built so the marker line itself ALSO carries a Claude concrete: if the exempt
# filter were too broad (e.g. matched the whole file) the violating line would be
# masked and the test would catch it.
# ----------------------------------------------------------------------
mkdir -p "$SCRATCH/workflow"
{
    printf 'Surface a fork via the AskUserQuestion tool before acting.\n'
    printf 'The enforcement layer is **realized per harness** (Claude settings.json PreToolUse hook).\n'
} > "$SCRATCH/workflow/injected.md"
core_inject_hits=$(grep -rnE 'AskUserQuestion' "$SCRATCH/workflow" 2>/dev/null \
    | grep -vE "$ENFORCEMENT_TEACH_RE")
core_exempt_hits=$(grep -rnE 'PreToolUse' "$SCRATCH/workflow" 2>/dev/null \
    | grep -vE "$ENFORCEMENT_TEACH_RE")
if [ -n "$core_inject_hits" ] && [ -z "$core_exempt_hits" ]; then
    pass "core-scan-non-vacuous: an injected AskUserQuestion on a core line trips; the enforcement-teaching line's concrete is correctly exempt (allowlist is precise, not blanket)"
else
    fail "core-scan-non-vacuous: core scan/allowlist not behaving — injected violation surfaced=[$core_inject_hits] exempt-line leaked=[$core_exempt_hits]"
fi

# ----------------------------------------------------------------------
# reference-table-matches-capabilities
# Re-render the table and diff against the committed gen/harness-reference.md.
# A drift / hand-edit / stale render fails (single source = capabilities.json).
# ----------------------------------------------------------------------
RENDERED="$SCRATCH/harness-reference.md"
if python3 "$GEN" --harness reference --out "$RENDERED" >/dev/null 2>&1; then
    if diff "$RENDERED" "$TABLE" >/dev/null 2>&1; then
        pass "reference-table-matches-capabilities: gen/harness-reference.md is a drift-free render of capabilities.json"
    else
        fail "reference-table-matches-capabilities: the committed table diverges from a fresh render of capabilities.json"
        diff "$TABLE" "$RENDERED" 2>&1 | sed 's/^/    /'
    fi
else
    fail "reference-table-matches-capabilities: the reference render exited non-zero"
fi

# ----------------------------------------------------------------------
# harness-reference-table-complete
# Every harness_reference entry has BOTH a claude_concrete and an
# opencode_concrete (no neutral noun is unmapped).
# ----------------------------------------------------------------------
incomplete=$(python3 - "$CAPS" <<'PY'
import json, sys
caps = json.load(open(sys.argv[1], encoding="utf-8"))
ref = caps.get("harness_reference", {})
bad = []
for key, entry in ref.items():
    if not isinstance(entry, dict) or "neutral_noun" not in entry:
        continue  # the _note documentation key
    if not entry.get("claude_concrete") or not entry.get("opencode_concrete"):
        bad.append(key)
print(",".join(bad))
PY
)
if [ -z "$incomplete" ]; then
    pass "harness-reference-table-complete: every neutral noun has both a Claude and an OpenCode concrete"
else
    fail "harness-reference-table-complete: neutral noun(s) missing a concrete: $incomplete"
fi

# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "----"
echo "Total: $TOTAL  Passed: $PASS_COUNT  Failed: $FAIL_COUNT"

[ "$FAIL_COUNT" -gt 0 ] && exit 1
exit 0
