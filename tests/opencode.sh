#!/bin/sh
# tests/opencode.sh — OpenCode-adapter form checks for the form-C single-source
# generator (opencode-harness-support, stage (a), slice 2). Proves the SECOND
# harness (OpenCode) builds from the SAME neutral bodies as the Claude adapter
# via an OpenCode manifest, with NO re-carving — and that the generated
# .opencode/ adapter + the root AGENTS.md carry the documented OpenCode shapes.
#
# These are FORM checks against the documented OpenCode contract (the cited
# source URLs), not behavioural tests — behavioural truth for the unsettled
# rules (subagent containment; submodule-path sourcing) comes from the spikes,
# not a static test (plan Test plan note).
#
# Cases (plan Test plan wording):
#
#   opencode-adapter-self-contained
#     no .opencode/ file (nor AGENTS.md) cross-reads a .claude/ path as part of
#     the adapter's OWN wiring/load surface (agent frontmatter, opencode.json,
#     AGENTS.md). The symmetry / no-cross-read invariant: the OpenCode adapter
#     never depends on .claude/ existing. (Allowlist note below.)
#
#   oc-agent-frontmatter-shape
#     each .opencode/agent/*.md carries `description` + a valid `mode` + a
#     `tools` OBJECT map (not a Claude comma-list). Source:
#     https://opencode.ai/docs/agents/
#
#   oc-instructions-points-at-submodule-core
#     .opencode/opencode.json `instructions` includes the submodule-relative
#     always-on core path. Source: https://opencode.ai/docs/config/
#
#   preview-label-and-supported-harnesses-present
#     AGENTS.md contains the preview label, the two named upstream gaps
#     (PR #17577, issue #5894), and the explicit supported-harness declaration.
#
#   opencode-adapter-inert-under-claude
#     .opencode/ lives entirely OUTSIDE .claude/ (so it cannot register as a
#     Claude agent / alter a Claude hook), and the Claude byte-equivalence is
#     unaffected by the OpenCode build (a fresh OpenCode build leaves .claude/
#     diff-clean). tests/hooks.sh + tests/generator.sh remain the Claude guards.
#
#   single-source-diff-clean (opencode)
#     regenerating the .opencode/ adapter (+ root AGENTS.md) from the neutral
#     source leaves the tree diff-clean — the build-time integrity guard,
#     extended to the second adapter (no OpenCode golden: .opencode/ is new, so
#     its guard is determinism + diff-clean, not byte-equivalence-to-a-baseline).
#
#   oc-orchestrator-can-question  (slice 4)
#     opencode.json grants `question` to the PRIMARY orchestrator via a top-level
#     permission { question: allow } (form), and — guarded-skip when `opencode`
#     absent — the real loader resolves question=allow for the primary and
#     question=deny for every pm-* subagent (grant scoped to the orchestrator).
#     Source: https://opencode.ai/docs/permissions/
#
#   oc-agent-toolgrant-parity  (slice 4)
#     each .opencode/agent/*.md `tools` map COVERS its Claude counterpart's grant
#     (no skill/webfetch/websearch/edit dropped in slice 2's 1:1 translation).
#     Source: https://opencode.ai/docs/tools/
#
#   oc-engine-agents-present  (slice 7)
#     the OpenCode-only review/research engines are shipped:
#     .opencode/agent/code-review.md and .opencode/agent/deep-research.md exist,
#     each with valid OpenCode frontmatter (`description` + `mode: subagent` + a
#     `tools` object) — and (guarded-skip when `opencode` absent) `opencode agent
#     list` shows both load. OpenCode has no built-in code-review/deep-research, so
#     the adapter ships its own. Source: https://opencode.ai/docs/agents/
#
#   oc-engine-not-denied  (slice 7)
#     the enforcement plugin's wb-* deny set does NOT include `code-review` /
#     `deep-research` — they are ALLOWED engines (same as on Claude, where
#     code-review/deep-research are not gated). Source: https://opencode.ai/docs/plugins/
#
#   oc-engine-self-contained  (slice 7)
#     neither engine agent file references a .claude/ path (the symmetry /
#     no-cross-read invariant, asserted directly on the two engine files).
#
#   oc-crossmodel-pins  (slice 9)
#     the cross-model rule degrades to STATIC frontmatter pins on OpenCode (no
#     runtime per-task model override — PR #17577). Driven off the manifest
#     `models` block: each control agent carries `model: <models.control>`, every
#     producer agent has NO pin (inherits the session), and opencode.json `model`
#     == models.session. Runtime guarded-skip: `opencode agent list` resolves each
#     control agent to the control model. Source:
#     https://github.com/anomalyco/opencode/pull/17577
#
#   oc-orchestrator-primary-present  (slice 12)
#     the protocol ships a first-class orchestrator as a PRIMARY agent:
#     .opencode/agent/ai-pm.md exists with `mode: primary` (and — guarded-skip when
#     `opencode` absent — `opencode agent list --pure` shows it as a primary). This
#     is OpenCode-only (on Claude the orchestrator IS the main session). Source:
#     https://opencode.ai/docs/agents/
#
#   oc-orchestrator-write-scoped  (slice 13)
#     the orchestrator KEEPS write + edit (it legitimately authors the feature plan
#     during planning + .ai-pm bookkeeping, like the Claude orchestrator) and GRANTS
#     task + skill + read + bash, AND carries a per-agent `permission` whose `edit`
#     and `write` keys ALLOW .ai-pm/** + doc/features/** and DENY ** (so code +
#     canonical docs route to pm-coder / pm-architect). The persona is the real
#     enforcement; the path-permission is a structural hint. The question grant is
#     the primary-only top-level permission (see oc-orchestrator-can-question).
#     Runtime guarded-skip: the loader resolves ai-pm's edit/write to the allow-
#     .ai-pm/doc/features + deny-** rules while task=allow. Source:
#     https://opencode.ai/docs/agents/, https://opencode.ai/docs/permissions/
#
#   oc-orchestrator-is-default  (slice 12)
#     the downstream runs the SHIPPED orchestrator, not the default `build`:
#     opencode.json sets the top-level `default_agent: "ai-pm"` key (verified 1.16.2:
#     the loader selects config.default_agent as the default primary, falling back to
#     build only when absent), and AGENTS.md names the shipped primary + the run
#     mechanism. Source: https://opencode.ai/docs/config/
#
#   oc-orchestrator-pipeline-order  (slice 14)
#     the persona body states the load-bearing pipeline-ORDER rules (a form/grep
#     check over the generated body): /pm-plan precedes any pm-coder spawn; the
#     plan-approval gate follows the decision-authority mode (interactive +
#     autonomous both named, referencing the decision-authority rule, NOT a blanket
#     "PM approves"); the pipeline is sequential with docs a POST-CODING handoff
#     (never pm-coder + the docs-owner in parallel); merge/ship stays manual in both
#     modes. Catches a regression that drops one rule. Source:
#     opencode-orchestrator-primary plan scenario 7.
#
# Exit code: 0 if every case matches expectation, 1 if any case fails.
#
# Usage: bash tests/opencode.sh
# Dependencies: python3 (stdlib only), git, diff, grep. No node/npm.

set -u

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
    echo "FAIL: not inside a git repo — tests/opencode.sh must run inside ai-pm-protocol" >&2
    exit 1
}
cd "$ROOT" || exit 1

GEN="$ROOT/gen/generate.py"
OC="$ROOT/.opencode"
AGENTS="$ROOT/AGENTS.md"

PASS_COUNT=0
FAIL_COUNT=0

pass() { echo "PASS: $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { echo "FAIL: $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

# Preconditions.
[ -f "$GEN" ]    || { echo "FAIL: generator missing at $GEN" >&2; exit 1; }
[ -d "$OC" ]     || { echo "FAIL: .opencode/ adapter missing at $OC (run gen/generate.py --harness opencode)" >&2; exit 1; }
[ -f "$AGENTS" ] || { echo "FAIL: AGENTS.md missing at $AGENTS" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "FAIL: python3 not available" >&2; exit 1; }

# ----------------------------------------------------------------------
# opencode-adapter-self-contained
# The symmetry / no-cross-read invariant (plan scenario 1): the OpenCode adapter
# must never depend on .claude/ existing. We enforce it over the adapter's OWN
# WIRING / LOAD surface — the files slice 2 authors and the loaders read for
# wiring: every .opencode/agent/*.md (frontmatter + inlined body), the
# .opencode/opencode.json config, and the root AGENTS.md entry surface. A
# .claude/ reference in any of those would be a real cross-read (a load
# dependency on the other harness's tree).
#
# ALLOWLIST (documented, tight): the two SHARED NEUTRAL COMMAND BODIES
# pm-audit.body.md and pm-bootstrap.body.md carry descriptive/install PROSE that
# names the Claude path (the PreToolUse guard in .claude/settings.json; the
# Claude symlink-install step). That prose is harness-specific content frozen in
# the neutral body by slice 1; making the bootstrap install step harness-neutral
# is the INSTALL-AUTO-DETECT slice, explicitly OUT OF SCOPE for slice 2. It is
# not a wiring cross-read (the OpenCode loaders do not follow it), so it is
# allowlisted by exact filename here and tracked as a known carry-over. The
# allowlist is tight: ONLY those two command files, and ONLY in .opencode/command/.
# Any NEW .claude/ reference anywhere else in the adapter trips this case.
# ----------------------------------------------------------------------
crossref_hits=$(
    grep -rln '\.claude/' "$OC" "$AGENTS" 2>/dev/null \
        | sed "s#^$ROOT/##" \
        | grep -vx '.opencode/command/pm-audit.md' \
        | grep -vx '.opencode/command/pm-bootstrap.md'
)
if [ -z "$crossref_hits" ]; then
    pass "opencode-adapter-self-contained: no .claude/ cross-read in the OpenCode adapter's wiring surface (agent frontmatter/body, opencode.json, AGENTS.md); the two known shared command-body prose carry-overs are allowlisted (install-auto-detect slice owns them)"
else
    fail "opencode-adapter-self-contained: unexpected .claude/ reference(s) outside the allowlisted shared command bodies:"
    printf '%s\n' "$crossref_hits" | sed 's/^/    /'
fi

# Defensive: the allowlist must not be vacuous — the two allowlisted files must
# actually still be the ONLY non-wiring carry-overs (so the allowlist tracks a
# real, bounded carry-over, not a silent escape hatch).
allowlisted_present=$(grep -rl '\.claude/' "$OC/command" 2>/dev/null | sed "s#^$ROOT/##" | LC_ALL=C sort | tr '\n' ' ')
expected_allowlist='.opencode/command/pm-audit.md .opencode/command/pm-bootstrap.md '
if [ "$allowlisted_present" = "$expected_allowlist" ]; then
    pass "opencode-adapter-self-contained: the allowlist is exact — only pm-audit + pm-bootstrap command bodies carry the known .claude/ prose"
else
    fail "opencode-adapter-self-contained: the set of command bodies carrying .claude/ prose changed — expected exactly pm-audit + pm-bootstrap, got: $allowlisted_present"
fi

# ----------------------------------------------------------------------
# oc-agent-frontmatter-shape
# Each .opencode/agent/*.md must carry, in its frontmatter: `description:`,
# a valid `mode:` (subagent|primary|all), and a `tools:` OBJECT map (a `tools:`
# line with NOTHING after it on the same line, followed by indented `key: bool`
# entries) — NOT a Claude comma-list (`tools: Read, Edit, ...`).
# Source: https://opencode.ai/docs/agents/
# ----------------------------------------------------------------------
shape_ok=1
for f in "$OC"/agent/*.md; do
    # Frontmatter = the first --- ... --- block.
    fm=$(awk 'NR==1 && $0=="---"{inb=1;next} inb && $0=="---"{exit} inb{print}' "$f")
    name=$(basename "$f")

    if ! printf '%s\n' "$fm" | grep -q '^description:'; then
        fail "oc-agent-frontmatter-shape: $name has no \`description:\` in frontmatter"
        shape_ok=0; continue
    fi
    if ! printf '%s\n' "$fm" | grep -Eq '^mode:[[:space:]]+(subagent|primary|all)[[:space:]]*$'; then
        fail "oc-agent-frontmatter-shape: $name has no valid \`mode:\` (subagent|primary|all)"
        shape_ok=0; continue
    fi
    # tools must be an OBJECT map: a `tools:` line with no value after it, then
    # at least one indented `  <name>: true|false` entry. A Claude comma-list
    # (`tools: Read, Edit`) has a value on the `tools:` line and would fail here.
    if printf '%s\n' "$fm" | grep -Eq '^tools:[[:space:]]*[^[:space:]]'; then
        fail "oc-agent-frontmatter-shape: $name uses a scalar \`tools:\` value (Claude comma-list shape), not an object map"
        shape_ok=0; continue
    fi
    if ! printf '%s\n' "$fm" | grep -q '^tools:[[:space:]]*$'; then
        fail "oc-agent-frontmatter-shape: $name has no \`tools:\` object key"
        shape_ok=0; continue
    fi
    if ! printf '%s\n' "$fm" | grep -Eq '^[[:space:]]+[a-z_]+:[[:space:]]+(true|false)[[:space:]]*$'; then
        fail "oc-agent-frontmatter-shape: $name \`tools:\` has no \`<name>: true|false\` object entries"
        shape_ok=0; continue
    fi
done
[ "$shape_ok" -eq 1 ] && pass "oc-agent-frontmatter-shape: every .opencode/agent/*.md carries description + valid mode + a tools OBJECT map (https://opencode.ai/docs/agents/)"

# ----------------------------------------------------------------------
# oc-instructions-points-at-submodule-core
# .opencode/opencode.json `instructions` must include the submodule-relative
# always-on core path (.ai-pm/tooling/WORKFLOW.md). Source:
# https://opencode.ai/docs/config/
# ----------------------------------------------------------------------
if [ -f "$OC/opencode.json" ] && grep -q '"\.ai-pm/tooling/WORKFLOW\.md"' "$OC/opencode.json"; then
    # Confirm it is inside an "instructions" array, not a stray mention.
    if python3 - "$OC/opencode.json" <<'PY'
import json, sys
cfg = json.load(open(sys.argv[1]))
instr = cfg.get("instructions", [])
sys.exit(0 if ".ai-pm/tooling/WORKFLOW.md" in instr else 1)
PY
    then
        pass "oc-instructions-points-at-submodule-core: opencode.json instructions[] includes the submodule-relative always-on core (.ai-pm/tooling/WORKFLOW.md) (https://opencode.ai/docs/config/)"
    else
        fail "oc-instructions-points-at-submodule-core: .ai-pm/tooling/WORKFLOW.md present in opencode.json but NOT inside the instructions array"
    fi
else
    fail "oc-instructions-points-at-submodule-core: opencode.json missing the submodule-relative always-on core path"
fi

# ----------------------------------------------------------------------
# preview-label-and-supported-harnesses-present
# AGENTS.md must contain: a preview label, the two named upstream gaps
# (PR #17577 + issue #5894), and the explicit supported-harness declaration.
# ----------------------------------------------------------------------
pl_ok=1
grep -qi 'PREVIEW' "$AGENTS"                       || { fail "preview-label-and-supported-harnesses-present: AGENTS.md has no PREVIEW label"; pl_ok=0; }
grep -q  '17577' "$AGENTS"                          || { fail "preview-label-and-supported-harnesses-present: AGENTS.md does not name upstream gap PR #17577 (runtime model override)"; pl_ok=0; }
grep -q  '5894' "$AGENTS"                           || { fail "preview-label-and-supported-harnesses-present: AGENTS.md does not name upstream gap issue #5894 (subagent hook containment)"; pl_ok=0; }
grep -qi 'Supported harnesses' "$AGENTS"            || { fail "preview-label-and-supported-harnesses-present: AGENTS.md has no explicit supported-harness declaration"; pl_ok=0; }
grep -qi 'Claude Code' "$AGENTS"                    || { fail "preview-label-and-supported-harnesses-present: supported-harness declaration omits Claude Code"; pl_ok=0; }
grep -qi 'OpenCode' "$AGENTS"                       || { fail "preview-label-and-supported-harnesses-present: supported-harness declaration omits OpenCode"; pl_ok=0; }
[ "$pl_ok" -eq 1 ] && pass "preview-label-and-supported-harnesses-present: AGENTS.md carries the preview label, both named upstream gaps (#17577, #5894), and the explicit supported-harness declaration (Claude Code + OpenCode-preview)"

# ----------------------------------------------------------------------
# opencode-adapter-inert-under-claude
# (a) .opencode/ lives entirely OUTSIDE .claude/ — structurally inert under a
#     Claude session (it cannot register as a Claude agent / alter a Claude
#     hook). (b) Building the OpenCode adapter does NOT disturb the Claude
#     byte-equivalence: a fresh OpenCode build leaves .claude/ diff-clean.
# ----------------------------------------------------------------------
case "$OC" in
    "$ROOT/.claude"/*) fail "opencode-adapter-inert-under-claude: .opencode/ is nested under .claude/" ;;
    *)
        # No .opencode path component sits inside .claude/.
        if find "$ROOT/.claude" -type d 2>/dev/null | grep -q '\.opencode'; then
            fail "opencode-adapter-inert-under-claude: an .opencode path was found under .claude/"
        else
            pass "opencode-adapter-inert-under-claude: .opencode/ lives entirely outside .claude/ (structurally inert under a Claude session)"
        fi
        ;;
esac

# Building OpenCode must not touch .claude/.
before_claude=$(git status --porcelain -- .claude/ 2>/dev/null)
python3 "$GEN" --harness opencode >/dev/null 2>&1 || fail "opencode-adapter-inert-under-claude: OpenCode build exited non-zero"
after_claude=$(git status --porcelain -- .claude/ 2>/dev/null)
if [ "$before_claude" = "$after_claude" ]; then
    pass "opencode-adapter-inert-under-claude: building the OpenCode adapter leaves .claude/ unchanged (Claude byte-equivalence unaffected)"
else
    fail "opencode-adapter-inert-under-claude: the OpenCode build altered the .claude/ tree"
fi

# ----------------------------------------------------------------------
# single-source-diff-clean (opencode)
# Regenerate the .opencode/ adapter (+ root AGENTS.md) over the live tree and
# assert it is diff-clean — the build-time integrity guard, extended to the
# second adapter. No OpenCode golden (the tree is new): the guard is
# determinism + diff-clean, not byte-equivalence-to-a-baseline.
# ----------------------------------------------------------------------
if python3 "$GEN" --harness opencode >/dev/null 2>&1; then
    DIRTY=$(git status --porcelain -- .opencode/ AGENTS.md 2>/dev/null)
    if [ -z "$DIRTY" ]; then
        pass "single-source-diff-clean (opencode): regenerating .opencode/ + AGENTS.md leaves the tree diff-clean"
    else
        fail "single-source-diff-clean (opencode): regenerated .opencode/ / AGENTS.md diverges from the committed tree"
        printf '%s\n' "$DIRTY" | sed 's/^/    /'
    fi
else
    fail "single-source-diff-clean (opencode): generator exited non-zero on the live OpenCode build"
fi

# ----------------------------------------------------------------------
# oc-enforcement-plugin-single-source
# The OpenCode enforcement plugin's wb-* role deny-list must be SINGLE-SOURCED
# from the Claude settings.json Task|Agent|Skill matcher (the one authored copy
# of the role set). We extract the role set from settings.json INDEPENDENTLY
# (here, in the test) and assert the GENERATED plugin's injected WB_DENY_ROLES
# array equals it, in order — proving no drift between the two adapters.
# Source: https://opencode.ai/docs/plugins/
# ----------------------------------------------------------------------
PLUGIN="$OC/plugin/ai-pm-enforcement.js"
if [ ! -f "$PLUGIN" ]; then
    fail "oc-enforcement-plugin-single-source: generated plugin missing at $PLUGIN"
else
    if python3 - "$ROOT/src/manifests/claude/settings.json" "$PLUGIN" <<'PY'
import json, re, sys
settings_path, plugin_path = sys.argv[1], sys.argv[2]
settings = json.load(open(settings_path))
cmd = None
for grp in settings.get("hooks", {}).get("PreToolUse", []):
    if grp.get("matcher") == "Task|Agent|Skill":
        cmd = grp["hooks"][0]["command"]
        break
if cmd is None:
    print("no Task|Agent|Skill matcher in settings.json"); sys.exit(2)
m = re.search(r'case "\\?\$NAME" in ([^)]+)\)', cmd)
if not m:
    print("no case-pattern role set in matcher"); sys.exit(2)
authored = [r.strip() for r in m.group(1).split("|") if r.strip()]
# Extract the injected literal from the generated plugin.
src = open(plugin_path).read()
pm = re.search(r'const WB_DENY_ROLES = (\[[^\]]*\]);', src)
if not pm:
    print("no WB_DENY_ROLES literal in generated plugin"); sys.exit(2)
emitted = json.loads(pm.group(1))
if authored != emitted:
    print("DRIFT: settings.json role set %r != plugin role set %r" % (authored, emitted))
    sys.exit(1)
sys.exit(0)
PY
    then
        pass "oc-enforcement-plugin-single-source: the generated plugin's wb-* role deny-list is byte-equal (and in order) to the Claude settings.json role set — no drift (one authored copy)"
    else
        fail "oc-enforcement-plugin-single-source: the plugin's role set drifted from the settings.json single source (or could not be extracted)"
    fi
fi

# ----------------------------------------------------------------------
# oc-plugin-esm-loadable + oc-enforcement-plugin-throws
# Deterministic, CI-safe unit test of the plugin (tests/oc-plugin-unit.js). It
# loads the GENERATED plugin THE WAY OPENCODE DOES — copies it to a temp `.mjs`
# and dynamic-`import()`s it (ESM), NOT via require() — then:
#   * oc-plugin-esm-loadable (slice-5 regression guard): asserts the plugin entry
#     export `AiPmEnforcement` is a function AND the module exposes no
#     non-function export. OpenCode treats every export as a plugin function, so a
#     non-function export (e.g. the old exported WB_DENY_ROLES array) makes the
#     real runtime fail with "Plugin export is not a function — failed to load
#     plugin". This guard would have caught that defect.
#   * oc-enforcement-plugin-throws: calls AiPmEnforcement({directory}) to get the
#     tool.execute.before hook and asserts it THROWS for each deny case (wb-* task,
#     wb-* skill, out-of-root read, truncating write, and a bash `find` with an
#     absolute path outside the root) and ALLOWS the legitimate cases (pm-* task,
#     in-root read, real write, relative/in-root `find`, a non-find bash command).
# Requires node; SKIPS cleanly if node is absent.
# Source: https://opencode.ai/docs/plugins/
# ----------------------------------------------------------------------
if command -v node >/dev/null 2>&1; then
    if node "$ROOT/tests/oc-plugin-unit.js"; then
        pass "oc-plugin-esm-loadable + oc-enforcement-plugin-throws: the plugin loads as an ESM single-function export (slice-5 load-shape guard) and its hook throws for every deny case / allows the legitimate cases (deterministic unit test; https://opencode.ai/docs/plugins/)"
    else
        fail "oc-plugin-esm-loadable + oc-enforcement-plugin-throws: the plugin ESM-load/behavior unit test failed (see node output above)"
    fi
else
    echo "SKIP: oc-plugin-esm-loadable + oc-enforcement-plugin-throws — node not on PATH (CI without node does not fail; the plugin ESM-load/behavior unit test is skipped)"
fi

# ----------------------------------------------------------------------
# oc-config-valid (runtime-backed, GUARDED-SKIP)
# The REAL OpenCode loader must ACCEPT the generated .opencode/opencode.json.
# This is the check that would have caught the slice-2 `_comment` defect
# (OpenCode rejects unrecognized config keys). Runs `opencode debug config
# --pure` in a scratch build dir (--pure validates the config parse without
# loading external plugins, so it neither hangs on plugin init nor needs the
# network). SKIPS cleanly (prints SKIP, does NOT fail) when `opencode` is not on
# PATH — CI without opencode must not break. The end-to-end validator for an
# OpenCode adapter is "run the loader and observe" (doc/stack-notes.md § OpenCode
# Required validators); this is that, guarded.
# ----------------------------------------------------------------------
if command -v opencode >/dev/null 2>&1; then
    CFGDIR=$(mktemp -d) || { echo "FAIL: mktemp failed" >&2; exit 1; }
    python3 "$GEN" --harness opencode --out "$CFGDIR/.opencode" >/dev/null 2>&1
    # --pure: validate config parse, skip external plugin load (avoids the
    # debug-config-with-plugins hang and any network/model call).
    if (cd "$CFGDIR" && timeout 60 opencode debug config --pure </dev/null >/dev/null 2>&1); then
        pass "oc-config-valid: the real OpenCode loader accepts the generated .opencode/opencode.json (opencode debug config --pure, exit 0 — would catch a rejected key like the slice-2 _comment defect)"
    else
        fail "oc-config-valid: the real OpenCode loader REJECTED the generated .opencode/opencode.json (opencode debug config --pure exited non-zero — a config key is unrecognized or the config is invalid)"
    fi
    rm -rf "$CFGDIR"
else
    echo "SKIP: oc-config-valid — opencode not on PATH (CI without opencode does not fail; the runtime config-validity check is skipped)"
fi

# Determinism: two independent OpenCode builds must be byte-identical.
S1=$(mktemp -d) || { echo "FAIL: mktemp failed" >&2; exit 1; }
S2=$(mktemp -d) || { echo "FAIL: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$S1" "$S2"' EXIT
python3 "$GEN" --harness opencode --out "$S1/.opencode" >/dev/null 2>&1
python3 "$GEN" --harness opencode --out "$S2/.opencode" >/dev/null 2>&1
if diff -r "$S1" "$S2" >/dev/null 2>&1; then
    pass "generator-deterministic (opencode): two independent OpenCode builds are byte-identical"
else
    fail "generator-deterministic (opencode): two OpenCode builds differ"
fi

# ----------------------------------------------------------------------
# oc-orchestrator-can-question
# The protocol surfaces PM decision-forks via the structured-question tool, and
# on OpenCode that seat is the PRIMARY (orchestrator) agent — NOT the subagents
# (subagents return findings to the orchestrator; they never prompt the PM
# directly). OpenCode's default primary denies `question`, so the adapter's
# .opencode/opencode.json must carry a top-level `permission: { question: allow }`
# to grant it to the primary.
#
#   (a) FORM: opencode.json has a top-level `permission` object whose `question`
#       value is "allow".
#   (b) RUNTIME (guarded-skip when `opencode` absent): the real loader accepts the
#       config (debug config --pure exit 0) AND `opencode agent list` resolves the
#       primary `build` agent's `question` permission to `allow` while every `pm-*`
#       subagent resolves it to `deny` (the grant is scoped to the orchestrator).
# Source: https://opencode.ai/docs/permissions/
# ----------------------------------------------------------------------
OCJSON="$OC/opencode.json"
if [ -f "$OCJSON" ] && python3 - "$OCJSON" <<'PY'
import json, sys
cfg = json.load(open(sys.argv[1]))
perm = cfg.get("permission") or {}
sys.exit(0 if perm.get("question") == "allow" else 1)
PY
then
    pass "oc-orchestrator-can-question (form): opencode.json grants question to the primary via a top-level permission { question: allow } (https://opencode.ai/docs/permissions/)"
else
    fail "oc-orchestrator-can-question (form): opencode.json has no top-level permission { question: allow } — the orchestrator cannot surface forks to the PM"
fi

# Runtime: the real loader must resolve question=allow for the PRIMARY and
# question=deny for every pm-* subagent. GUARDED-SKIP when opencode is absent.
if command -v opencode >/dev/null 2>&1; then
    QDIR=$(mktemp -d) || { echo "FAIL: mktemp failed" >&2; exit 1; }
    AL="$QDIR/agentlist.txt"
    # `opencode agent list` reads the project's .opencode/ (this repo's, live tree).
    if timeout 300 opencode agent list </dev/null >"$AL" 2>/dev/null; then
        if python3 - "$AL" <<'PY'
import sys, re, json
txt = open(sys.argv[1]).read()
lines = txt.split("\n"); name=None; body=[]; blocks=[]
for ln in lines:
    m = re.match(r'^(\S[^(]*?) \((primary|subagent|all)\)\s*$', ln)
    if m:
        if name is not None: blocks.append((name, "\n".join(body)))
        name = m.group(1).strip(); body = []
    else:
        body.append(ln)
if name is not None: blocks.append((name, "\n".join(body)))
def question_effective(raw):
    try: arr = json.loads(raw.strip())
    except Exception: return None
    q = [r["action"] for r in arr if r.get("permission") == "question"]
    return q[-1] if q else None  # last-match-wins
build_eff = None; bad = []
for nm, raw in blocks:
    eff = question_effective(raw)
    if nm == "build": build_eff = eff
    if nm.startswith("pm-") and eff != "deny":
        bad.append((nm, eff))
ok = (build_eff == "allow") and not bad
if not ok:
    print("build question=%r (want allow); pm-* not denying: %r" % (build_eff, bad))
sys.exit(0 if ok else 1)
PY
        then
            pass "oc-orchestrator-can-question (runtime): the real loader resolves question=allow for the PRIMARY (build) and question=deny for every pm-* subagent (grant scoped to the orchestrator)"
        else
            fail "oc-orchestrator-can-question (runtime): the loader did not scope question correctly (primary must be allow; every pm-* subagent must be deny)"
        fi
    else
        fail "oc-orchestrator-can-question (runtime): \`opencode agent list\` exited non-zero"
    fi
    rm -rf "$QDIR"
else
    echo "SKIP: oc-orchestrator-can-question (runtime) — opencode not on PATH (CI without opencode does not fail; the form check above still runs)"
fi

# ----------------------------------------------------------------------
# oc-agent-toolgrant-parity
# Each .opencode/agent/*.md `tools` object map must COVER (be a superset of) its
# Claude counterpart's grant — so slice-2's 1:1 translation dropped no capability
# (skill/webfetch/websearch/edit). The mapping below is the Claude grant per agent
# translated to OpenCode tool names (https://opencode.ai/docs/tools/):
#   Read->read Grep->grep Glob->glob Bash->bash Write->write Edit->edit
#   Skill->skill WebFetch->webfetch WebSearch->websearch
# This is a STATIC parity check (OpenCode grant ⊇ mapped Claude grant); it does not
# forbid an extra OpenCode tool, only a MISSING one.
# ----------------------------------------------------------------------
python3 - "$OC" <<'PY'
import sys, re, pathlib
oc = pathlib.Path(sys.argv[1])
# Claude grants (the parity reference), mapped to OpenCode tool names.
expected = {
    "pm-architect":        {"read","grep","glob","bash","write"},
    "pm-auditor":          {"read","grep","glob","bash","write"},
    "pm-codebase-reader":  {"read","grep","glob","bash","write"},
    "pm-plan-checker":     {"read","grep","glob","bash","write"},
    "pm-product-advocate": {"read","grep","glob","bash","write"},
    "pm-coder":            {"read","edit","write","bash","grep","glob","skill"},
    "pm-pr-prep":          {"bash","read","edit"},
    "pm-stack-researcher": {"webfetch","websearch","read","grep","glob","bash","write","skill"},
}
def granted_tools(path):
    text = path.read_text(encoding="utf-8")
    lines = text.split("\n")
    # frontmatter = first ---...--- block
    fences = [i for i,l in enumerate(lines) if l == "---"]
    if len(fences) < 2: return None
    fm = lines[fences[0]+1:fences[1]]
    # find the tools: object key and collect indented `name: true` entries until
    # dedent (a non-indented frontmatter key).
    out = set(); in_tools = False
    for l in fm:
        if re.match(r'^tools:\s*$', l):
            in_tools = True; continue
        if in_tools:
            m = re.match(r'^\s+([a-z_]+):\s+true\s*$', l)
            if m:
                out.add(m.group(1)); continue
            # a `false` entry or a comment line inside the block: keep scanning
            if re.match(r'^\s+([a-z_]+):\s+false\s*$', l) or re.match(r'^\s+#', l):
                continue
            # a non-indented key ends the tools block
            if re.match(r'^[a-z_]+:', l):
                in_tools = False
    return out
fail = []
for name, want in expected.items():
    f = oc / "agent" / f"{name}.md"
    if not f.is_file():
        fail.append(f"{name}: agent file missing"); continue
    got = granted_tools(f)
    if got is None:
        fail.append(f"{name}: could not parse tools map"); continue
    missing = want - got
    if missing:
        fail.append(f"{name}: missing {sorted(missing)} (has {sorted(got)})")
if fail:
    for x in fail: print(x)
    sys.exit(1)
sys.exit(0)
PY
if [ $? -eq 0 ]; then
    pass "oc-agent-toolgrant-parity: every .opencode/agent/*.md tools map covers its Claude grant (no skill/webfetch/websearch/edit dropped in the 1:1 translation; https://opencode.ai/docs/tools/)"
else
    fail "oc-agent-toolgrant-parity: an .opencode/agent tools map is missing a capability its Claude counterpart grants (see above)"
fi

# ----------------------------------------------------------------------
# oc-engine-agents-present
# OpenCode ships NO built-in code-review / deep-research engine (verified 1.16.2:
# built-ins are only build/plan/general/explore). So the adapter must SHIP its
# own. Assert both engine agent files exist with valid OpenCode frontmatter
# (description + mode: subagent + a tools object), and — guarded-skip when
# `opencode` is absent — that `opencode agent list` shows both load.
# Source: https://opencode.ai/docs/agents/
# ----------------------------------------------------------------------
engine_ok=1
for eng in code-review deep-research; do
    ef="$OC/agent/$eng.md"
    if [ ! -f "$ef" ]; then
        fail "oc-engine-agents-present: missing engine agent $ef"
        engine_ok=0; continue
    fi
    efm=$(awk 'NR==1 && $0=="---"{inb=1;next} inb && $0=="---"{exit} inb{print}' "$ef")
    printf '%s\n' "$efm" | grep -q '^description:' \
        || { fail "oc-engine-agents-present: $eng.md has no description:"; engine_ok=0; }
    printf '%s\n' "$efm" | grep -Eq '^mode:[[:space:]]+subagent[[:space:]]*$' \
        || { fail "oc-engine-agents-present: $eng.md is not mode: subagent"; engine_ok=0; }
    printf '%s\n' "$efm" | grep -q '^tools:[[:space:]]*$' \
        || { fail "oc-engine-agents-present: $eng.md has no tools: object key"; engine_ok=0; }
    printf '%s\n' "$efm" | grep -Eq '^[[:space:]]+[a-z_]+:[[:space:]]+(true|false)[[:space:]]*$' \
        || { fail "oc-engine-agents-present: $eng.md tools: has no object entries"; engine_ok=0; }
done
[ "$engine_ok" -eq 1 ] && pass "oc-engine-agents-present: .opencode/agent/code-review.md + deep-research.md exist with valid OpenCode frontmatter (description + mode: subagent + a tools object) — the protocol-shipped review/research engines OpenCode has no built-in for (https://opencode.ai/docs/agents/)"

# Runtime: the real loader must list both engines as subagents. GUARDED-SKIP when
# opencode is absent (CI without opencode must not fail).
if command -v opencode >/dev/null 2>&1; then
    EDIR=$(mktemp -d) || { echo "FAIL: mktemp failed" >&2; exit 1; }
    EAL="$EDIR/agentlist.txt"
    if timeout 300 opencode agent list </dev/null >"$EAL" 2>/dev/null; then
        if grep -Eq '^code-review \((subagent|all)\)' "$EAL" \
           && grep -Eq '^deep-research \((subagent|all)\)' "$EAL"; then
            pass "oc-engine-agents-present (runtime): \`opencode agent list\` shows both code-review and deep-research loaded as subagents"
        else
            fail "oc-engine-agents-present (runtime): \`opencode agent list\` did not show both engines as subagents"
            grep -E '^(code-review|deep-research) ' "$EAL" | sed 's/^/    /'
        fi
    else
        fail "oc-engine-agents-present (runtime): \`opencode agent list\` exited non-zero"
    fi
    rm -rf "$EDIR"
else
    echo "SKIP: oc-engine-agents-present (runtime) — opencode not on PATH (CI without opencode does not fail; the form check above still runs)"
fi

# ----------------------------------------------------------------------
# oc-engine-not-denied
# The review/research engines are ALLOWED engines (the same way code-review /
# deep-research are not gated on Claude). The enforcement plugin's wb-* role
# deny-list (single-sourced from settings.json) must NOT include `code-review`
# or `deep-research` — otherwise the orchestrator could not delegate to them.
# Source: https://opencode.ai/docs/plugins/
# ----------------------------------------------------------------------
if [ ! -f "$PLUGIN" ]; then
    fail "oc-engine-not-denied: generated plugin missing at $PLUGIN"
else
    if python3 - "$PLUGIN" <<'PY'
import re, sys
src = open(sys.argv[1]).read()
m = re.search(r'const WB_DENY_ROLES = (\[[^\]]*\]);', src)
if not m:
    print("no WB_DENY_ROLES literal in generated plugin"); sys.exit(2)
import json
roles = json.loads(m.group(1))
bad = [r for r in roles if r in ("code-review", "deep-research")]
if bad:
    print("DENIED engines present in deny-list: %r" % bad); sys.exit(1)
sys.exit(0)
PY
    then
        pass "oc-engine-not-denied: the enforcement plugin's wb-* deny set does NOT include code-review/deep-research — they are allowed engines (https://opencode.ai/docs/plugins/)"
    else
        fail "oc-engine-not-denied: the enforcement plugin denies code-review and/or deep-research — they must be allowed engines"
    fi
fi

# ----------------------------------------------------------------------
# oc-engine-self-contained
# The symmetry / no-cross-read invariant, asserted directly on the two engine
# agent files: neither references a .claude/ path (it must not depend on the
# Claude adapter existing). The broader opencode-adapter-self-contained case
# already scans the whole adapter; this is a tight, explicit guard on the
# slice-7 engine files.
# ----------------------------------------------------------------------
engine_xref=$(grep -l '\.claude/' "$OC/agent/code-review.md" "$OC/agent/deep-research.md" 2>/dev/null)
if [ -z "$engine_xref" ]; then
    pass "oc-engine-self-contained: neither code-review.md nor deep-research.md references a .claude/ path (no cross-read)"
else
    fail "oc-engine-self-contained: an engine agent references a .claude/ path:"
    printf '%s\n' "$engine_xref" | sed 's/^/    /'
fi

# ----------------------------------------------------------------------
# oc-crossmodel-pins  (slice 9)
# The protocol's cross-model rule degrades to STATIC frontmatter pins on OpenCode
# (no runtime per-task model override — PR #17577 closed-not-merged). The model
# choice is single-sourced in the manifest's `models` block. Assert, DRIVEN OFF
# that block so the test stays correct if the values change:
#   (a) each CONTROL agent (.opencode/agent/<name>.md for name in
#       models.control_agents) carries `model: <models.control>` in frontmatter;
#   (b) the PRODUCER agents (every generated agent NOT in control_agents) carry
#       NO `model:` pin — they inherit the session;
#   (c) .opencode/opencode.json top-level `model` == models.session.
# Source: https://github.com/anomalyco/opencode/pull/17577,
#         https://opencode.ai/docs/agents/, https://opencode.ai/docs/config/
# ----------------------------------------------------------------------
MANIFEST="$ROOT/src/manifests/opencode/adapter.json"
if [ ! -f "$MANIFEST" ]; then
    fail "oc-crossmodel-pins: opencode adapter manifest missing at $MANIFEST"
elif python3 - "$MANIFEST" "$OC" <<'PY'
import json, re, sys, pathlib
manifest_path, oc = sys.argv[1], pathlib.Path(sys.argv[2])
man = json.load(open(manifest_path))
models = man.get("models") or {}
session = models.get("session")
control = models.get("control")
control_agents = set(models.get("control_agents", []))
errs = []
if not session:        errs.append("manifest models.session is missing/empty")
if not control:        errs.append("manifest models.control is missing/empty")
if not control_agents: errs.append("manifest models.control_agents is empty")

def frontmatter(path):
    lines = path.read_text(encoding="utf-8").split("\n")
    if not lines or lines[0] != "---":
        return None
    out = []
    for l in lines[1:]:
        if l == "---":
            return out
        out.append(l)
    return None

def model_pin(fm):
    # a top-level `model: <value>` line in frontmatter (not an indented/comment line)
    for l in fm:
        m = re.match(r'^model:\s*(\S+)\s*$', l)
        if m:
            return m.group(1)
    return None

# Enumerate the full generated agent set, classify producer vs control off the
# manifest (every agent file that is NOT a control agent is a producer here).
agent_files = sorted((oc / "agent").glob("*.md"))
if not agent_files:
    errs.append("no .opencode/agent/*.md files found")
seen_controls = set()
for f in agent_files:
    name = f.stem
    fm = frontmatter(f)
    if fm is None:
        errs.append(f"{name}: could not parse frontmatter"); continue
    pin = model_pin(fm)
    if name in control_agents:
        seen_controls.add(name)
        if pin != control:
            errs.append(f"CONTROL agent {name}: model pin is {pin!r}, want {control!r}")
    else:
        if pin is not None:
            errs.append(f"PRODUCER agent {name}: has a model pin {pin!r} (producers must inherit the session — no pin)")

missing_controls = control_agents - seen_controls
for nm in sorted(missing_controls):
    errs.append(f"control agent {nm} named in manifest has no generated .opencode/agent/{nm}.md")

# opencode.json top-level model == session
cfg = json.load(open(oc / "opencode.json"))
if cfg.get("model") != session:
    errs.append(f"opencode.json model is {cfg.get('model')!r}, want session {session!r}")

if errs:
    for e in errs: print(e)
    sys.exit(1)
sys.exit(0)
PY
then
    pass "oc-crossmodel-pins: each control agent (driven off manifest models.control_agents) carries model: <models.control>, every producer agent has NO pin, and opencode.json model == models.session (https://github.com/anomalyco/opencode/pull/17577)"
else
    fail "oc-crossmodel-pins: the cross-model static pins do not match the manifest models block (see above)"
fi

# Runtime: `opencode agent list` reports each agent's resolved PERMISSIONS but
# NOT its resolved model (the model is not in that output), so the pin "taking"
# at runtime cannot be confirmed from `agent list`. The runtime confirmation that
# a control agent's LLM call actually uses the control model is a real
# `opencode run --print-logs` check (the `service=llm ... modelID=` log lines for
# the session vs the pinned subagent) — done as the slice-9 LIVE confirmation, not
# wired here (it needs a real model round-trip + the configured provider). The
# form check above (driven off the manifest) is the deterministic, CI-safe guard.

# ----------------------------------------------------------------------
# oc-effort-tier  (per-operation effort tiering)
# Per-operation reasoning-effort tiering: the cross-model CONTROL/review agents
# run at LOW reasoning effort to cut reasoning-token COUNT, while producers + the
# orchestrator keep their DEFAULT reasoning. The tier is single-sourced in the
# manifest's `models.control_variant` and injected into each control agent's
# frontmatter as a `variant:` line (mirroring the slice-9 `model:` pin). Assert,
# DRIVEN OFF the manifest so the test stays correct if the value changes:
#   (a) each CONTROL agent (.opencode/agent/<name>.md for name in
#       models.control_agents) carries `variant: <models.control_variant>`;
#   (b) every PRODUCER agent (generated agent NOT in control_agents — incl. the
#       orchestrator ai-pm + the non-control engine deep-research) carries NO
#       `variant:` line (default reasoning).
# When the manifest omits control_variant, the case is a no-op pass (no variant
# expected anywhere). Source: per-operation-effort-tiering plan scenario 1;
# verified 1.16.2 — a per-agent `variant:` is accepted, a top-level one is not.
# ----------------------------------------------------------------------
if [ ! -f "$MANIFEST" ]; then
    fail "oc-effort-tier: opencode adapter manifest missing at $MANIFEST"
elif python3 - "$MANIFEST" "$OC" <<'PY'
import json, re, sys, pathlib
manifest_path, oc = sys.argv[1], pathlib.Path(sys.argv[2])
man = json.load(open(manifest_path))
models = man.get("models") or {}
control_variant = models.get("control_variant")
control_agents = set(models.get("control_agents", []))
errs = []

def frontmatter(path):
    lines = path.read_text(encoding="utf-8").split("\n")
    if not lines or lines[0] != "---":
        return None
    out = []
    for l in lines[1:]:
        if l == "---":
            return out
        out.append(l)
    return None

def variant_line(fm):
    # a top-level `variant: <value>` line in frontmatter (not indented/comment)
    for l in fm:
        m = re.match(r'^variant:\s*(\S+)\s*$', l)
        if m:
            return m.group(1)
    return None

agent_files = sorted((oc / "agent").glob("*.md"))
if not agent_files:
    errs.append("no .opencode/agent/*.md files found")
seen_controls = set()
for f in agent_files:
    name = f.stem
    fm = frontmatter(f)
    if fm is None:
        errs.append(f"{name}: could not parse frontmatter"); continue
    v = variant_line(fm)
    if name in control_agents:
        seen_controls.add(name)
        if control_variant:
            if v != control_variant:
                errs.append(f"CONTROL agent {name}: variant is {v!r}, want {control_variant!r}")
        else:
            if v is not None:
                errs.append(f"CONTROL agent {name}: has variant {v!r} but manifest sets no control_variant")
    else:
        # producers + orchestrator + non-control engines: NO variant (default reasoning)
        if v is not None:
            errs.append(f"PRODUCER agent {name}: has a variant {v!r} (producers/orchestrator keep default reasoning — no variant)")

if control_variant:
    missing_controls = control_agents - seen_controls
    for nm in sorted(missing_controls):
        errs.append(f"control agent {nm} named in manifest has no generated .opencode/agent/{nm}.md")

if errs:
    for e in errs: print(e)
    sys.exit(1)
sys.exit(0)
PY
then
    pass "oc-effort-tier: each control agent (driven off manifest models.control_variant) carries variant: <models.control_variant>, and every producer/orchestrator agent has NO variant line (default reasoning) — per-operation effort tiering"
else
    fail "oc-effort-tier: the per-operation effort variants do not match the manifest models.control_variant (see above)"
fi

# Runtime (GUARDED-SKIP): the real OpenCode loader must ACCEPT the generated
# config WITH the per-agent variants present (opencode debug config --pure exit 0
# — would catch a rejected variant value or a top-level-variant mistake). SKIPS
# cleanly when `opencode` is absent. `no_proxy` includes registry.npmjs.org so the
# runtime's npm-install does not hang on the proxy; --pure validates the parse
# without external plugin load; generous timeout + an empty-output guard on a
# precondition probe that the variants actually reached the scratch build.
if command -v opencode >/dev/null 2>&1; then
    VDIR=$(mktemp -d) || { echo "FAIL: mktemp failed" >&2; exit 1; }
    python3 "$GEN" --harness opencode --out "$VDIR/.opencode" >/dev/null 2>&1
    # Precondition: the scratch build must actually carry the injected variants
    # (empty-output guard — a silent no-inject would make the loader check vacuous).
    variant_hits=$(grep -rl '^variant:' "$VDIR/.opencode/agent" 2>/dev/null)
    if [ -z "$variant_hits" ]; then
        fail "oc-effort-tier (runtime): no variant lines in the scratch build — nothing to validate (inject failed?)"
    elif (cd "$VDIR" && no_proxy="${no_proxy:-},registry.npmjs.org" NO_PROXY="${NO_PROXY:-},registry.npmjs.org" timeout 120 opencode debug config --pure </dev/null >/dev/null 2>&1); then
        pass "oc-effort-tier (runtime): the real OpenCode loader accepts the generated config WITH the per-agent variant: lines present (opencode debug config --pure, exit 0)"
    else
        fail "oc-effort-tier (runtime): the real OpenCode loader REJECTED the config with the per-agent variant: lines (opencode debug config --pure exited non-zero — a variant value or placement is invalid)"
    fi
    rm -rf "$VDIR"
else
    echo "SKIP: oc-effort-tier (runtime) — opencode not on PATH (CI without opencode does not fail; the form check above still runs)"
fi

# ----------------------------------------------------------------------
# oc-orchestrator-primary-present  (slice 12)
# The protocol ships a first-class ORCHESTRATOR as a PRIMARY agent (not the
# default `build`): .opencode/agent/ai-pm.md must exist with `mode: primary` in
# frontmatter. On Claude the orchestrator IS the main session, so no agent file
# is generated there — this is OpenCode-only (harness-local). RUNTIME
# (guarded-skip when `opencode` absent): `opencode agent list --pure` shows
# `ai-pm` as a primary. Source: https://opencode.ai/docs/agents/,
# opencode-orchestrator-primary plan scenario 1.
# ----------------------------------------------------------------------
ORCH="$OC/agent/ai-pm.md"
if [ ! -f "$ORCH" ]; then
    fail "oc-orchestrator-primary-present: orchestrator agent missing at $ORCH"
else
    ofm=$(awk 'NR==1 && $0=="---"{inb=1;next} inb && $0=="---"{exit} inb{print}' "$ORCH")
    if printf '%s\n' "$ofm" | grep -Eq '^mode:[[:space:]]+primary[[:space:]]*$'; then
        pass "oc-orchestrator-primary-present: .opencode/agent/ai-pm.md exists with mode: primary (the shipped orchestrator seat, not the default build; https://opencode.ai/docs/agents/)"
    else
        fail "oc-orchestrator-primary-present: ai-pm.md is not mode: primary"
    fi
fi

# ----------------------------------------------------------------------
# oc-orchestrator-write-scoped  (slice 13)
# The orchestrator is the seat that DRIVES the pipeline. It KEEPS write + edit
# because it legitimately authors its OWN artifacts (the feature plan during
# planning + .ai-pm bookkeeping — state, backlog, contracts, decision/resolution
# trails), exactly as the Claude orchestrator does. A per-agent path-`permission`
# scopes those tools as a STRUCTURAL HINT (the persona is the real enforcement):
#   (a) the `tools` map must GRANT write + edit (true) AND task + skill + read +
#       bash (drive the pipeline + delegate + bookkeep);
#   (b) the frontmatter must carry a `permission` block whose `edit` and `write`
#       keys each map path-globs that ALLOW .ai-pm/** + doc/features/** and DENY **
#       (so code + canonical doc/*.md route to pm-coder / pm-architect).
# NOTE: `question` is granted to the primary via the top-level opencode.json
# permission (oc-orchestrator-can-question above), not in this per-agent tools map.
# Source: https://opencode.ai/docs/agents/, https://opencode.ai/docs/permissions/,
# plan scenario 2 (CORRECTED — the slice-12 write:false/edit:false was wrong).
# ----------------------------------------------------------------------
if [ ! -f "$ORCH" ]; then
    fail "oc-orchestrator-write-scoped: orchestrator agent missing at $ORCH"
elif python3 - "$ORCH" <<'PY'
import sys, re, pathlib
# Stdlib-only frontmatter parse (the rest of this suite avoids a YAML dep): a
# shallow indentation walk over the two two-level blocks we care about — `tools:`
# (scalar bools) and `permission:` (edit/write -> glob -> action). Both are
# authored as a fixed 2-space nesting in the .fm; this is a form check, not a
# general YAML parser.
text = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
lines = text.split("\n")
fences = [i for i, l in enumerate(lines) if l == "---"]
if len(fences) < 2:
    print("no frontmatter block"); sys.exit(1)
fm = lines[fences[0]+1:fences[1]]

tools = {}
perm = {}      # perm[edit|write][glob] = action
section = None  # None | "tools" | ("perm", <edit|write>)
for l in fm:
    if re.match(r'^\s*#', l) or l.strip() == "":
        continue
    if re.match(r'^tools:\s*$', l):
        section = "tools"; continue
    if re.match(r'^permission:\s*$', l):
        section = ("perm", None); continue
    if re.match(r'^[a-z_]+:', l):  # any other top-level key ends the block
        section = None; continue
    if section == "tools":
        m = re.match(r'^\s+([a-z_]+):\s+(true|false)\s*$', l)
        if m:
            tools[m.group(1)] = (m.group(2) == "true")
    elif isinstance(section, tuple) and section[0] == "perm":
        m = re.match(r'^  ([a-z_]+):\s*$', l)  # edit: / write: (2-space indent)
        if m:
            section = ("perm", m.group(1)); perm.setdefault(m.group(1), {}); continue
        m = re.match(r'^    "([^"]+)":\s*(allow|deny)\s*$', l)  # 4-space glob rule
        if m and section[1]:
            perm[section[1]][m.group(1)] = m.group(2)

errs = []
# (a) Must GRANT write + edit (the orchestrator authors plan + bookkeeping) AND
#     the drive-the-pipeline + bookkeep + delegate tools.
for t in ("write", "edit", "task", "skill", "read", "bash"):
    if tools.get(t) is not True:
        errs.append(f"tools.{t} must be granted (true); got {tools.get(t)!r}")
# (b) Must carry a `permission` block whose edit + write keys allow the
#     orchestrator's own artifacts (.ai-pm/** + doc/features/**) and deny **.
for key in ("edit", "write"):
    sub = perm.get(key)
    if not isinstance(sub, dict) or not sub:
        errs.append(f"permission.{key} must be a path-glob map; got {sub!r}")
        continue
    for glob, want in ((".ai-pm/**", "allow"), ("doc/features/**", "allow"), ("**", "deny")):
        if sub.get(glob) != want:
            errs.append(f"permission.{key}[{glob!r}] must be {want!r}; got {sub.get(glob)!r}")
if errs:
    for e in errs: print(e)
    sys.exit(1)
sys.exit(0)
PY
then
    pass "oc-orchestrator-write-scoped: ai-pm.md GRANTS write+edit (true) + task/skill/read/bash, AND its permission.edit/permission.write allow .ai-pm/** + doc/features/** and deny ** (path-scoped authoring; persona is the real enforcement; https://opencode.ai/docs/permissions/)"
else
    fail "oc-orchestrator-write-scoped: the orchestrator tools/permission do not grant write+edit+task/skill/read/bash AND carry the path-scoped edit/write permission (see above)"
fi

# Runtime: the real loader must resolve ai-pm as a PRIMARY whose `edit` AND `write`
# permission rules show the deny-** + allow-.ai-pm/doc-features path scoping, while
# `task` is allowed. GUARDED-SKIP when opencode is absent. `--pure` resolves the
# agent set without a model round-trip (a live interactive session starves
# non-pure calls).
if command -v opencode >/dev/null 2>&1; then
    ODIR=$(mktemp -d) || { echo "FAIL: mktemp failed" >&2; exit 1; }
    OAL="$ODIR/agentlist.txt"
    # `timeout 300` matches the pre-existing runtime checks (the agent-list resolve
    # is slow on a cold loader / under contention); a shorter cap truncated the
    # output under load. `--pure` resolves the agent set without a model round-trip.
    if timeout 300 opencode agent list --pure </dev/null >"$OAL" 2>/dev/null && [ -s "$OAL" ]; then
        if grep -Eq '^ai-pm \(primary\)' "$OAL" && python3 - "$OAL" <<'PY'
import sys, re, json
raw = open(sys.argv[1]).read()
# Find the `ai-pm (primary)` header, then bracket-match the JSON permission
# array that follows it. Bracket-matching (not a non-greedy regex with an
# `^\S...\(subagent\)` lookahead — under re.DOTALL `.*` crosses newlines and the
# lookahead lands on the block's own closing `]` line, truncating it before the
# `]`) is robust to the multi-line pretty-printed array.
hm = re.search(r'^ai-pm \(primary\)\s*$', raw, re.M)
if not hm:
    print("ai-pm block not found"); sys.exit(1)
start = raw.find("[", hm.end())
if start == -1:
    print("ai-pm permission array not found"); sys.exit(1)
depth = 0; endpos = -1
for i in range(start, len(raw)):
    if raw[i] == "[": depth += 1
    elif raw[i] == "]":
        depth -= 1
        if depth == 0: endpos = i + 1; break
if endpos == -1:
    print("ai-pm permission array not balanced"); sys.exit(1)
try:
    rules = json.loads(raw[start:endpos])
except Exception as e:
    print("ai-pm permission array did not parse: %s" % e); sys.exit(1)
# The path-scoped edit/write resolve to per-pattern rules. For each of edit/write
# the resolved rule set must show: a deny on the `**` catch-all AND an allow on the
# .ai-pm and doc/features patterns. We match by the rule's pattern field (OpenCode
# carries the glob alongside the permission/action).
def rules_for(perm):
    return [r for r in rules if r.get("permission") == perm]
def has(perm, pat_substr, action):
    for r in rules_for(perm):
        pat = str(r.get("pattern", r.get("glob", "")))
        if pat_substr in pat and r.get("action") == action:
            return True
    return False
errs = []
for perm in ("edit", "write"):
    if not has(perm, "**", "deny") and not has(perm, "*", "deny"):
        errs.append(f"{perm}: expected a deny rule on the ** catch-all")
    if not has(perm, ".ai-pm", "allow"):
        errs.append(f"{perm}: expected an allow rule on .ai-pm")
    if not has(perm, "doc/features", "allow"):
        errs.append(f"{perm}: expected an allow rule on doc/features")
task_acts = [r["action"] for r in rules if r.get("permission") == "task"]
if not task_acts or task_acts[-1] != "allow":
    errs.append(f"task: expected allow; resolved {task_acts!r}")
if errs:
    for e in errs: print(e)
    print("--- resolved ai-pm permission rules ---")
    print(json.dumps(rules, indent=2))
    sys.exit(1)
sys.exit(0)
PY
        then
            pass "oc-orchestrator-write-scoped (runtime): the real loader resolves ai-pm as a primary whose edit + write are path-scoped (deny **, allow .ai-pm + doc/features) while task=allow (it can delegate)"
        else
            fail "oc-orchestrator-write-scoped (runtime): the loader did not resolve ai-pm's path-scoped edit/write + can-delegate permissions correctly"
        fi
    else
        fail "oc-orchestrator-write-scoped (runtime): \`opencode agent list --pure\` exited non-zero"
    fi
    rm -rf "$ODIR"
else
    echo "SKIP: oc-orchestrator-write-scoped (runtime) — opencode not on PATH (CI without opencode does not fail; the form check above still runs)"
fi

# ----------------------------------------------------------------------
# oc-orchestrator-is-default  (slice 12)
# The downstream must run the SHIPPED orchestrator, not the default `build`.
# OpenCode supports a top-level `default_agent` config key (verified 1.16.2: the
# loader selects `config.default_agent` as the default primary, falling back to
# `build` only when it is absent). So .opencode/opencode.json must set
# `default_agent: "ai-pm"`. RUNTIME (guarded-skip): the loader accepts the config
# AND `ai-pm` resolves as a primary (asserted above). The AGENTS.md orchestrator
# seat section must also name the shipped primary + the run mechanism. Source:
# https://opencode.ai/docs/config/, plan scenario 3.
# ----------------------------------------------------------------------
if [ -f "$OCJSON" ] && python3 - "$OCJSON" <<'PY'
import json, sys
cfg = json.load(open(sys.argv[1]))
sys.exit(0 if cfg.get("default_agent") == "ai-pm" else 1)
PY
then
    pass "oc-orchestrator-is-default (form): opencode.json sets default_agent: \"ai-pm\" — a plain \`opencode\` runs the orchestrator, not build (https://opencode.ai/docs/config/)"
else
    fail "oc-orchestrator-is-default (form): opencode.json does not set default_agent to ai-pm — the downstream would run the default build primary"
fi

# AGENTS.md must name the shipped orchestrator primary + the default-agent wiring
# in its orchestrator-seat section.
if grep -q 'default_agent' "$AGENTS" && grep -q 'ai-pm' "$AGENTS"; then
    pass "oc-orchestrator-is-default (docs): AGENTS.md names the shipped ai-pm orchestrator primary and the default_agent run mechanism"
else
    fail "oc-orchestrator-is-default (docs): AGENTS.md does not name the ai-pm orchestrator primary + the default_agent wiring"
fi

# ----------------------------------------------------------------------
# oc-orchestrator-pipeline-order  (slice 14)
# Delegating is necessary but not sufficient — the PM live re-test showed the
# orchestrator delegated yet ran the pipeline OUT OF ORDER (it spawned pm-coder
# AND pm-architect in parallel with NO /pm-plan first). The persona body must
# carry the HARD sequencing rules so a regression that drops one is caught. This
# is a FORM (presence/grep) check over the GENERATED body — prose, so each rule is
# matched by its load-bearing tokens, kept specific enough that deleting a rule
# trips it. Source: opencode-orchestrator-primary plan scenario 7, the
# disciplined-pipeline + decision-authority contracts, WORKFLOW.md Step 0–7.
# ----------------------------------------------------------------------
if [ ! -f "$ORCH" ]; then
    fail "oc-orchestrator-pipeline-order: orchestrator agent missing at $ORCH"
else
    # Scan the BODY (below the closing frontmatter fence) so a rule cannot be
    # satisfied by a frontmatter comment.
    obody=$(awk 'f{print} /^---$/{c++} c==2{f=1}' "$ORCH")
    oerrs=""
    # (1) A plan precedes code: /pm-plan runs BEFORE any pm-coder spawn.
    if ! printf '%s\n' "$obody" | grep -Eq '`/pm-plan`.*`pm-coder`|plan precedes code'; then
        oerrs="$oerrs\n  - missing the plan-before-code rule (/pm-plan before pm-coder)"
    fi
    # (2) The plan-approval gate follows the decision-authority mode — both modes
    #     named, referencing the decision-authority rule (not a blanket "PM approves").
    if ! printf '%s\n' "$obody" | grep -Eq 'decision-authority'; then
        oerrs="$oerrs\n  - missing the decision-authority reference for the plan-approval gate"
    fi
    if ! printf '%s\n' "$obody" | grep -qi 'interactive'; then
        oerrs="$oerrs\n  - the plan-approval gate does not name the interactive mode"
    fi
    if ! printf '%s\n' "$obody" | grep -qi 'autonomous'; then
        oerrs="$oerrs\n  - the plan-approval gate does not name the autonomous mode"
    fi
    # (3) The pipeline is sequential AND docs are a POST-CODING handoff — no
    #     parallel coder + docs-owner.
    if ! printf '%s\n' "$obody" | grep -qi 'sequential'; then
        oerrs="$oerrs\n  - missing the sequential-pipeline rule"
    fi
    if ! printf '%s\n' "$obody" | grep -Eqi 'never.*parallel|parallel.*never|not concurrently'; then
        oerrs="$oerrs\n  - missing the never-parallel coder+docs-owner rule"
    fi
    if ! printf '%s\n' "$obody" | grep -Eqi 'post-coding'; then
        oerrs="$oerrs\n  - missing the docs-are-post-coding-handoff rule"
    fi
    # (4) Merge/ship stays manual in both modes.
    if ! printf '%s\n' "$obody" | grep -Eqi 'merge and ship stay manual|merge/ship.*manual|stay manual'; then
        oerrs="$oerrs\n  - missing the merge/ship-stays-manual rule"
    fi
    if [ -z "$oerrs" ]; then
        pass "oc-orchestrator-pipeline-order: the persona body states the load-bearing order rules — /pm-plan precedes pm-coder, the plan-approval gate follows the decision-authority mode (interactive + autonomous named), the pipeline is sequential with docs a post-coding handoff (no parallel coder+docs-owner), and merge/ship stays manual"
    else
        fail "oc-orchestrator-pipeline-order: the persona body is missing one or more load-bearing order rules:$(printf '%b' "$oerrs")"
    fi
fi

# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "----"
echo "Total: $TOTAL  Passed: $PASS_COUNT  Failed: $FAIL_COUNT"

[ "$FAIL_COUNT" -gt 0 ] && exit 1
exit 0
