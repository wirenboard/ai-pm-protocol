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
#   oc-compact-reviewer  (compact-reviewer slice A)
#     the generated .opencode/agent/code-review.md is the COMPACT one-pass
#     reviewer (compressed from the wb code-review-orchestrator skill): a SINGLE
#     agent that covers the aspect set in one pass with NO fan-out/spawn language,
#     carrying the load-bearing contract — the three severities, the structured
#     <finding> block, the consolidated-report sections, the verdict rubric with
#     the absolute plan-compliance-never-Approve row. Asserts it is substantially
#     smaller than the wb SKILL.md + references combined. Runtime guarded-skip:
#     `opencode agent list` shows code-review loaded. Source:
#     https://opencode.ai/docs/agents/
#
#   oc-single-model-default  (compact-reviewer slice B — replaced oc-crossmodel-pins)
#     SINGLE session-model default: the manifest `models` block carries ONLY
#     `session` (no `control` / `control_variant` / `control_agents` keys), NO
#     generated agent carries a baked `model:` or `variant:` pin (every agent
#     inherits the session), and opencode.json `model` == models.session. Runtime
#     guarded-skip: `opencode debug config --pure` exit 0 with no baked pins.
#     Source: https://github.com/anomalyco/opencode/pull/17577,
#     https://opencode.ai/docs/config/
#
#   oc-control-layer-model  (compact-reviewer slice B — replaced oc-effort-tier)
#     the control-layer model (the four checking agents — code-review, pm-auditor,
#     pm-plan-checker, pm-product-advocate — run on the reviewer model when set,
#     else the session) is a FOUR-line `agent.<id>.model` block in the PM's OWN
#     opencode.json, NOT a template pin (OpenCode has no native cross-agent model
#     inheritance / runtime per-task override). FORM: the shipped opencode.json
#     bakes no per-agent pin; the documented block names exactly the four checking
#     agents. Runtime guarded-skip: with a test 4-line agent.<id>.model block laid
#     over a scratch build, `opencode debug config --pure` resolves the four
#     checking agents to the override (else session). NOTE: the task-spawn
#     resolution is the to-verify residual (the in-tree runtime spike was
#     inconclusive due to parent-.opencode bleed); this guarded test is the
#     controlled check. Source: https://opencode.ai/docs/agents/,
#     https://opencode.ai/docs/permissions/
#
#   oc-builtins-hidden  (compact-reviewer slice B)
#     the shipped opencode.json disables the built-in build + plan primaries
#     (agent.build.disable = true, agent.plan.disable = true) so the personality
#     picker shows only the protocol's own ai-pm. Runtime guarded-skip: `opencode
#     debug config --pure` exit 0 with both disabled. Source:
#     https://opencode.ai/docs/agents/, https://opencode.ai/docs/config/
#
#   oc-orchestrator-primary-present  (slice 12)
#     the protocol ships a first-class orchestrator as a PRIMARY agent:
#     .opencode/agent/ai-pm.md exists with `mode: primary` (and — guarded-skip when
#     `opencode` absent — `opencode agent list --pure` shows it as a primary). This
#     is OpenCode-only (on Claude the orchestrator IS the main session). Source:
#     https://opencode.ai/docs/agents/
#
#   oc-orchestrator-can-author-own  (slice 18 — replaced oc-orchestrator-write-scoped)
#     the orchestrator can author its OWN artifacts (the feature plan during planning
#     + .ai-pm bookkeeping, like the Claude orchestrator): its `tools` map GRANTS
#     write + edit + task (and skill + read + bash), AND it carries NO `permission`
#     block restricting them. The persona — not a tool-rule — scopes WHAT it authors.
#     The earlier path-`permission` (allow .ai-pm/doc-features, deny **) was removed:
#     OpenCode matched the globs against ABSOLUTE paths so they never matched and
#     EVERY orchestrator write fell through to deny ** (breaking the legitimate
#     .ai-pm writes), and `bash` bypassed it anyway (zero real protection). The
#     question grant is the primary-only top-level permission (see
#     oc-orchestrator-can-question). Runtime guarded-skip: `opencode debug config
#     --pure` exits 0 (the config is still valid with no permission block). Source:
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
#       orchestrator PRIMARY `ai-pm`'s `question` permission to `allow` while every
#       `pm-*` subagent resolves it to `deny` (the grant is scoped to the
#       orchestrator). NOTE: keyed on `ai-pm` (the protocol's shipped primary), not
#       `build` — the compact-reviewer slice disables the built-in `build`/`plan`
#       primaries (oc-builtins-hidden), so `build` no longer appears in the roster.
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
# Keyed on the protocol's shipped primary `ai-pm` (the built-in `build` is
# disabled by the compact-reviewer slice, so it is absent from the roster).
primary_eff = None; bad = []
for nm, raw in blocks:
    eff = question_effective(raw)
    if nm == "ai-pm": primary_eff = eff
    if nm.startswith("pm-") and eff != "deny":
        bad.append((nm, eff))
ok = (primary_eff == "allow") and not bad
if not ok:
    print("ai-pm question=%r (want allow); pm-* not denying: %r" % (primary_eff, bad))
sys.exit(0 if ok else 1)
PY
        then
            pass "oc-orchestrator-can-question (runtime): the real loader resolves question=allow for the orchestrator PRIMARY (ai-pm) and question=deny for every pm-* subagent (grant scoped to the orchestrator)"
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
# oc-compact-reviewer  (compact-reviewer slice A)
# The generated .opencode/agent/code-review.md is the COMPACT one-pass reviewer
# (compressed from the wb code-review-orchestrator skill): ONE agent that covers
# the aspect set in a single pass with NO fan-out/spawn language, carrying the
# load-bearing contract. Asserts (form, on the generated file):
#   (a) it is mode: subagent (still an engine, not a primary);
#   (b) it is SINGLE-PASS — NO fan-out/parallel-subagent/spawn orchestration
#       language (one agent reads the diff once and reports all aspects);
#   (c) it covers the aspect set (plan-compliance, security, stability,
#       regressions, test-coverage, conventions, simplification, documentation,
#       architecture);
#   (d) it carries the load-bearing contract — the three severities, the
#       structured <finding> block, the consolidated-report sections, and the
#       verdict rubric with the absolute "any plan-compliance deviation …
#       never Approve" row;
#   (e) it is SUBSTANTIALLY SMALLER than the wb SKILL.md + references combined
#       (the compression target — well under half the source bulk).
# Runtime guarded-skip: `opencode agent list` shows code-review loaded.
# Source: https://opencode.ai/docs/agents/
# ----------------------------------------------------------------------
CR="$OC/agent/code-review.md"
WBREFS="$ROOT/.ai-pm/tmp/wb-review-refs"
if [ ! -f "$CR" ]; then
    fail "oc-compact-reviewer: generated reviewer missing at $CR"
else
    cr_ok=1
    crfm=$(awk 'NR==1 && $0=="---"{inb=1;next} inb && $0=="---"{exit} inb{print}' "$CR")
    crbody=$(awk 'c==2{print} /^---$/{c++}' "$CR")

    # (a) still a subagent engine
    printf '%s\n' "$crfm" | grep -Eq '^mode:[[:space:]]+subagent[[:space:]]*$' \
        || { fail "oc-compact-reviewer: code-review.md is not mode: subagent"; cr_ok=0; }

    # (b) single-pass — NO fan-out / parallel-subagent / spawn orchestration. A
    #     compact one-pass reviewer must not instruct spawning per-aspect agents,
    #     a coordinator/judge pass over OTHER reviewers, or a "run in parallel".
    if printf '%s\n' "$crbody" \
        | grep -Eiq 'spawn|fan-?out|one (subagent|reviewer) per (aspect|dimension)|parallel (sub)?agents?|in parallel|coordinator pass|sub-?reviewers'; then
        fail "oc-compact-reviewer: code-review body carries fan-out/spawn orchestration language (must be a single one-pass reviewer)"
        printf '%s\n' "$crbody" | grep -Ein 'spawn|fan-?out|one (subagent|reviewer) per (aspect|dimension)|parallel (sub)?agents?|in parallel|coordinator pass|sub-?reviewers' | sed 's/^/    /'
        cr_ok=0
    fi
    # It MUST positively state it is one pass / single agent.
    printf '%s\n' "$crbody" | grep -Eiq 'one[ -]pass|single[ -](pass|agent)|reads the diff once|in (a |one )single pass' \
        || { fail "oc-compact-reviewer: code-review body does not state it is a single one-pass reviewer"; cr_ok=0; }

    # (c) covers the aspect set (the nine aspects the plan/arch preserve).
    for asp in plan-compliance security stability regressions test-coverage conventions simplification documentation architecture; do
        printf '%s\n' "$crbody" | grep -qi "$asp" \
            || { fail "oc-compact-reviewer: aspect '$asp' not covered in the reviewer body"; cr_ok=0; }
    done

    # (d) load-bearing contract pieces.
    #   three severities
    for sev in critical warning suggestion; do
        printf '%s\n' "$crbody" | grep -qi "$sev" \
            || { fail "oc-compact-reviewer: severity '$sev' missing from the body"; cr_ok=0; }
    done
    #   the structured <finding> block
    printf '%s\n' "$crbody" | grep -q '<finding>' \
        || { fail "oc-compact-reviewer: the structured <finding> block is missing"; cr_ok=0; }
    printf '%s\n' "$crbody" | grep -q '<severity>' \
        || { fail "oc-compact-reviewer: <finding> block lacks <severity>"; cr_ok=0; }
    #   the consolidated-report sections
    for sec in '## Code review' '### Critical' '### Warnings' '### Suggestions' '### Test coverage' '### Plan compliance' '### Out-of-scope changes' '### Architecture'; do
        printf '%s\n' "$crbody" | grep -qF "$sec" \
            || { fail "oc-compact-reviewer: consolidated-report section '$sec' missing"; cr_ok=0; }
    done
    #   the verdict rubric with the absolute plan-compliance-never-Approve row
    printf '%s\n' "$crbody" | grep -qi 'verdict rubric' \
        || { fail "oc-compact-reviewer: the verdict rubric is missing"; cr_ok=0; }
    if ! printf '%s\n' "$crbody" \
        | grep -Eiq 'plan-compliance deviation.*never Approve|never Approve.*plan-compliance'; then
        fail "oc-compact-reviewer: the absolute 'any plan-compliance deviation → never Approve' rubric row is missing"
        cr_ok=0
    fi

    # (e) compactness — TWO guards.
    #   (e1) ABSOLUTE size ceiling — runs ALWAYS, off-machine too. The arch note
    #        targets the generated reviewer at ~¼ of the ~58 KB wb SKILL.md+refs
    #        source (~18.4 KB / 120-160 lines today). A 28000 B ceiling proves
    #        "compact" (well under half the ~58 KB source) and fails if the body
    #        bloated back toward the source, yet is generous enough that normal
    #        edits to a ~18 KB body don't trip it. This is the only compactness
    #        guard that runs on CI / a fresh clone (where $WBREFS is absent).
    cr_bytes=$(wc -c < "$CR")
    CR_CEILING=28000
    if [ "$cr_bytes" -ge "$CR_CEILING" ]; then
        fail "oc-compact-reviewer: reviewer ($cr_bytes B) is at/over the $CR_CEILING B compactness ceiling — it has bloated away from the arch-note ~18 KB / ~¼-of-source target"
        cr_ok=0
    fi
    #   (e2) RELATIVE guard (BONUS, only when the wb source dir is present on this
    #        dev machine) — a stronger check that the reviewer is well under half
    #        the actual wb SKILL.md+refs source bulk. $WBREFS is .gitignored, so
    #        this is absent off-machine and the absolute ceiling above stands alone.
    cr_rel_checked=0
    if [ -d "$WBREFS" ]; then
        wb_bytes=$(cat "$WBREFS"/*.md 2>/dev/null | wc -c)
        if [ "$wb_bytes" -gt 0 ]; then
            cr_rel_checked=1
            if [ "$((cr_bytes * 2))" -lt "$wb_bytes" ]; then
                : # ok — less than half the actual source
            else
                fail "oc-compact-reviewer: reviewer ($cr_bytes B) is not substantially smaller than the wb source ($wb_bytes B) — expected well under half"
                cr_ok=0
            fi
        fi
    fi

    if [ "$cr_ok" -eq 1 ]; then
        if [ "$cr_rel_checked" -eq 1 ]; then
            pass "oc-compact-reviewer: .opencode/agent/code-review.md is the compact ONE-PASS reviewer — single agent, no fan-out, covers the nine-aspect set, carries the severities + <finding> block + consolidated-report sections + the absolute plan-compliance-never-Approve verdict row, and is compact ($cr_bytes B, under the $CR_CEILING B ceiling; this run also confirmed it is well under half the wb SKILL.md+refs source) (https://opencode.ai/docs/agents/)"
        else
            pass "oc-compact-reviewer: .opencode/agent/code-review.md is the compact ONE-PASS reviewer — single agent, no fan-out, covers the nine-aspect set, carries the severities + <finding> block + consolidated-report sections + the absolute plan-compliance-never-Approve verdict row, and is compact ($cr_bytes B, under the $CR_CEILING B ceiling; the stronger wb-source-relative comparison runs only where the wb refs are present) (https://opencode.ai/docs/agents/)"
        fi
    fi
fi

# Runtime: the real loader must list the compact reviewer. GUARDED-SKIP when
# opencode is absent (CI without opencode must not fail).
if command -v opencode >/dev/null 2>&1; then
    CRDIR=$(mktemp -d) || { echo "FAIL: mktemp failed" >&2; exit 1; }
    CRAL="$CRDIR/agentlist.txt"
    if timeout 300 opencode agent list </dev/null >"$CRAL" 2>/dev/null; then
        if grep -Eq '^code-review \((subagent|all)\)' "$CRAL"; then
            pass "oc-compact-reviewer (runtime): \`opencode agent list\` shows the compact code-review reviewer loaded as a subagent"
        else
            fail "oc-compact-reviewer (runtime): \`opencode agent list\` did not show code-review loaded"
            grep -E '^code-review ' "$CRAL" | sed 's/^/    /'
        fi
    else
        fail "oc-compact-reviewer (runtime): \`opencode agent list\` exited non-zero"
    fi
    rm -rf "$CRDIR"
else
    echo "SKIP: oc-compact-reviewer (runtime) — opencode not on PATH (the form contract above still runs)"
fi

# ----------------------------------------------------------------------
# oc-single-model-default  (compact-reviewer slice B — replaced oc-crossmodel-pins)
# SINGLE session-model default: the baked cross-model pins are retired. The
# manifest `models` block carries ONLY `session` (no `control` /
# `control_variant` / `control_agents` keys), so NO generated agent gets a baked
# `model:`/`variant:` pin — every agent inherits the session model. Assert:
#   (a) the manifest `models` block has NO control* keys (only `session`);
#   (b) NO generated agent frontmatter carries a top-level `model:` OR `variant:`
#       line (every agent inherits the session);
#   (c) .opencode/opencode.json top-level `model` == models.session.
# The control-layer override is a personal-config block in the PM's own
# opencode.json (oc-control-layer-model), not a template pin. Source:
# https://github.com/anomalyco/opencode/pull/17577, https://opencode.ai/docs/config/
# ----------------------------------------------------------------------
MANIFEST="$ROOT/src/manifests/opencode/adapter.json"
if [ ! -f "$MANIFEST" ]; then
    fail "oc-single-model-default: opencode adapter manifest missing at $MANIFEST"
elif python3 - "$MANIFEST" "$OC" <<'PY'
import json, re, sys, pathlib
manifest_path, oc = sys.argv[1], pathlib.Path(sys.argv[2])
man = json.load(open(manifest_path))
models = man.get("models") or {}
session = models.get("session")
errs = []
if not session:
    errs.append("manifest models.session is missing/empty")
# (a) no control* keys in the models block.
control_keys = [k for k in models if k.startswith("control")]
if control_keys:
    errs.append(f"manifest models block still carries control* key(s): {control_keys}")

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

def top_pin(fm, key):
    # a top-level `<key>: <value>` line in frontmatter (not indented/comment)
    for l in fm:
        m = re.match(rf'^{key}:\s*(\S+)\s*$', l)
        if m:
            return m.group(1)
    return None

# (b) NO generated agent carries a baked model: or variant: pin.
agent_files = sorted((oc / "agent").glob("*.md"))
if not agent_files:
    errs.append("no .opencode/agent/*.md files found")
for f in agent_files:
    name = f.stem
    fm = frontmatter(f)
    if fm is None:
        errs.append(f"{name}: could not parse frontmatter"); continue
    mp = top_pin(fm, "model")
    if mp is not None:
        errs.append(f"agent {name}: has a baked model pin {mp!r} (every agent must inherit the session — no pin)")
    vp = top_pin(fm, "variant")
    if vp is not None:
        errs.append(f"agent {name}: has a baked variant {vp!r} (no per-agent variant — every agent inherits the session)")

# (c) opencode.json top-level model == session
cfg = json.load(open(oc / "opencode.json"))
if cfg.get("model") != session:
    errs.append(f"opencode.json model is {cfg.get('model')!r}, want session {session!r}")

if errs:
    for e in errs: print(e)
    sys.exit(1)
sys.exit(0)
PY
then
    pass "oc-single-model-default: the manifest models block carries only \`session\` (no control* keys), NO generated agent has a baked model:/variant: pin (every agent inherits the session), and opencode.json model == models.session (https://opencode.ai/docs/config/)"
else
    fail "oc-single-model-default: a baked per-agent model/variant pin or a leftover control* key remains (see above)"
fi

# ----------------------------------------------------------------------
# oc-builtins-hidden  (compact-reviewer slice B)
# The shipped opencode.json must disable the built-in `build` + `plan` primaries
# so the personality picker shows only the protocol's own ai-pm. FORM: the config
# carries agent.build.disable == true AND agent.plan.disable == true. Spike-verified
# accepted on 1.16.2. Runtime guarded-skip below (rides the oc-single-model-default
# debug-config check). Source: https://opencode.ai/docs/agents/,
# https://opencode.ai/docs/config/
# ----------------------------------------------------------------------
if [ -f "$OCJSON" ] && python3 - "$OCJSON" <<'PY'
import json, sys
cfg = json.load(open(sys.argv[1]))
agent = cfg.get("agent") or {}
ok = (agent.get("build", {}).get("disable") is True
      and agent.get("plan", {}).get("disable") is True)
sys.exit(0 if ok else 1)
PY
then
    pass "oc-builtins-hidden: the shipped opencode.json disables the built-in build + plan primaries (agent.build.disable = agent.plan.disable = true) — the picker shows only ai-pm (https://opencode.ai/docs/agents/)"
else
    fail "oc-builtins-hidden: opencode.json does not disable both build and plan (agent.build.disable / agent.plan.disable must be true)"
fi

# Runtime (GUARDED-SKIP): the real loader must ACCEPT the shipped config (opencode
# debug config --pure exit 0) — i.e. the config with the build/plan disables and
# no baked per-agent pins PARSES / LOADS cleanly. This check verifies only that the
# shipped config is valid to the real loader; the disables + no-pins are asserted by
# the FORM checks above (oc-builtins-hidden, oc-single-model-default), not here.
# SKIPS cleanly when `opencode` is absent. `no_proxy` includes registry.npmjs.org so
# the runtime's npm-install does not hang.
if command -v opencode >/dev/null 2>&1; then
    BDIR=$(mktemp -d) || { echo "FAIL: mktemp failed" >&2; exit 1; }
    python3 "$GEN" --harness opencode --out "$BDIR/.opencode" >/dev/null 2>&1
    if (cd "$BDIR" && no_proxy="${no_proxy:-},registry.npmjs.org" NO_PROXY="${NO_PROXY:-},registry.npmjs.org" timeout 120 opencode debug config --pure </dev/null >/dev/null 2>&1); then
        pass "oc-single-model-default + oc-builtins-hidden (runtime): the real OpenCode loader accepts the shipped config — it parses / loads cleanly (opencode debug config --pure, exit 0); the build/plan disables and no-baked-pins are verified by the FORM checks above"
    else
        fail "oc-single-model-default + oc-builtins-hidden (runtime): the real OpenCode loader REJECTED the config (opencode debug config --pure exited non-zero — a disable key or the no-pin config is invalid)"
    fi
    rm -rf "$BDIR"
else
    echo "SKIP: oc-single-model-default + oc-builtins-hidden (runtime) — opencode not on PATH (CI without opencode does not fail; the form checks above still run)"
fi

# ----------------------------------------------------------------------
# oc-control-layer-model  (compact-reviewer slice B — replaced oc-effort-tier)
# The control-layer model rule: the FOUR checking agents — code-review,
# pm-auditor, pm-plan-checker, pm-product-advocate — run on the reviewer model
# when the PM sets one, else the session. OpenCode has NO native cross-agent
# model inheritance / runtime per-task override (PR #17577), so the override is a
# FOUR-line `agent.<id>.model` block in the PM's OWN opencode.json — NOT a
# template pin. FORM:
#   (a) the shipped opencode.json bakes NO per-agent `agent.<id>.model` override
#       (the default IS session, with nothing baked in the template);
#   (b) the documented canonical block (doc/stack-notes.md + the AGENTS.md
#       control-layer section) names exactly the four checking agents.
# RUNTIME guarded-skip: lay a test 4-line agent.<id>.model block (using a DISTINCT
# synthetic id, NOT the session model) over a scratch build and assert `opencode
# debug config --pure` resolves each of the four checking agents to that override
# model — proving the config-layer override MOVES them OFF the session (a session-
# valued override could not distinguish "moved off" from "coerced back to session").
# NOTE: the task-spawn resolution (does a checking agent
# spawned as a Task by the orchestrator resolve to the override?) is the to-verify
# residual — the in-tree spike was inconclusive due to parent-.opencode bleed;
# this controlled scratch-dir check is the deterministic surrogate.
# Source: https://opencode.ai/docs/agents/, https://opencode.ai/docs/config/
# ----------------------------------------------------------------------
CHECKING_AGENTS="code-review pm-auditor pm-plan-checker pm-product-advocate"

# (a) the shipped opencode.json bakes NO agent.<id>.model override (default=session).
if [ -f "$OCJSON" ] && python3 - "$OCJSON" <<'PY'
import json, sys
cfg = json.load(open(sys.argv[1]))
agent = cfg.get("agent") or {}
# The shipped config may carry agent.<built-in>.disable (build/plan), but NO
# agent.<id>.model override — the control-layer model is the PM's own config.
baked = [aid for aid, spec in agent.items()
         if isinstance(spec, dict) and "model" in spec]
if baked:
    print("shipped opencode.json bakes agent model override(s): %r" % baked)
    sys.exit(1)
sys.exit(0)
PY
then
    pass "oc-control-layer-model (form): the shipped opencode.json bakes NO agent.<id>.model override — the control-layer default is the session model, the override lives in the PM's own config (https://opencode.ai/docs/config/)"
else
    fail "oc-control-layer-model (form): the shipped opencode.json bakes an agent.<id>.model override — the control-layer model must be the PM's own config, not a template pin"
fi

# (b) the documented canonical control-layer BLOCK names EXACTLY the four checking
#     agents — and no other agent id — in both doc homes (doc/stack-notes.md + the
#     AGENTS.md control-layer section). A bare anywhere-in-the-file substring grep
#     would pass even if the four ids were scattered across an 80 KB doc; instead
#     scope to the canonical config block: the contiguous run of `"<id>": { "model"
#     ... }` lines (the four-line `agent.<id>.model` block the docs ship verbatim).
#     Assert all four expected ids appear inside that block AND no UNEXPECTED id
#     does (so a stray fifth `agent.<id>.model` entry in the block is caught). This
#     keys off the JSON config-line shape, not prose wording, so it is robust to
#     surrounding rephrasing.
clm_doc_ok=1
for doc in "$ROOT/doc/stack-notes.md" "$ROOT/src/manifests/opencode/AGENTS.md"; do
    if ! python3 - "$doc" "$CHECKING_AGENTS" <<'PY'
import re, sys, pathlib
doc, expected = pathlib.Path(sys.argv[1]), set(sys.argv[2].split())
lines = doc.read_text(encoding="utf-8").split("\n")
# A canonical-block line: `"<id>": { "model": ... }` (the agent.<id>.model entry).
line_re = re.compile(r'^\s*"([A-Za-z0-9_-]+)"\s*:\s*\{\s*"model"')
# Find the contiguous run that holds the most of these entries (the block).
blocks, cur = [], []
for l in lines:
    m = line_re.match(l)
    if m:
        cur.append(m.group(1))
    else:
        if cur:
            blocks.append(cur); cur = []
if cur:
    blocks.append(cur)
if not blocks:
    print(f"{doc}: no canonical control-layer config block (`\"<id>\": {{ \"model\" ... }}` lines) found")
    sys.exit(1)
# The control-layer block is the run that carries the checking agents.
block = max(blocks, key=lambda b: len(set(b) & expected))
ids = set(block)
missing = expected - ids
extra = ids - expected
errs = []
if missing:
    errs.append(f"control-layer block is missing checking agent(s): {sorted(missing)}")
if extra:
    errs.append(f"control-layer block carries UNEXPECTED agent id(s): {sorted(extra)}")
if errs:
    print(f"{doc}: " + "; ".join(errs))
    sys.exit(1)
sys.exit(0)
PY
    then
        fail "oc-control-layer-model (docs): $doc control-layer block does not name exactly the four checking agents (see above)"
        clm_doc_ok=0
    fi
done
[ "$clm_doc_ok" -eq 1 ] && pass "oc-control-layer-model (docs): the canonical control-layer config block names EXACTLY the four checking agents (code-review, pm-auditor, pm-plan-checker, pm-product-advocate) — and no other id — in doc/stack-notes.md and the AGENTS.md control-layer section"

# RUNTIME (GUARDED-SKIP): lay a test 4-line agent.<id>.model block over a scratch
# build and confirm the loader resolves the four checking agents to the override.
# The override model is a synthetic id; --pure validates the resolved config parse
# without a model round-trip. SKIPS cleanly when `opencode` is absent.
if command -v opencode >/dev/null 2>&1; then
    CLMDIR=$(mktemp -d) || { echo "FAIL: mktemp failed" >&2; exit 1; }
    python3 "$GEN" --harness opencode --out "$CLMDIR/.opencode" >/dev/null 2>&1
    # Overlay the 4-line control-layer block onto the scratch opencode.json (the
    # PM's-own-config simulation). Use a DISTINCT synthetic override id (NOT the
    # session model) so a pass proves the override actually MOVES the four agents
    # OFF the session — a session-valued override could not tell "moved off
    # session" from "coerced back to session". Verified against OpenCode 1.16.2:
    # `debug config --pure` accepts an unknown model id in agent.<id>.model and
    # echoes it back in the resolved config (no provider round-trip under --pure).
    OVERRIDE_MODEL=$(python3 - "$CLMDIR/.opencode/opencode.json" "$CHECKING_AGENTS" <<'PY'
import json, sys
path, checking = sys.argv[1], sys.argv[2].split()
cfg = json.load(open(path))
session = cfg["model"]
override = "dummy-provider/dummy-control-model"  # distinct from the session model
assert override != session, "override id must differ from the session model"
cfg.setdefault("agent", {})
for aid in checking:
    cfg["agent"].setdefault(aid, {})["model"] = override
json.dump(cfg, open(path, "w"), indent=2)
print(override)
PY
)
    if (cd "$CLMDIR" && no_proxy="${no_proxy:-},registry.npmjs.org" NO_PROXY="${NO_PROXY:-},registry.npmjs.org" timeout 120 opencode debug config --pure </dev/null >"$CLMDIR/cfg.json" 2>/dev/null); then
        # The resolved --pure config must carry the override on each checking agent.
        if python3 - "$CLMDIR/cfg.json" "$OVERRIDE_MODEL" "$CHECKING_AGENTS" <<'PY'
import json, sys
resolved = json.load(open(sys.argv[1]))
override, checking = sys.argv[2], sys.argv[3].split()
agent = resolved.get("agent") or {}
bad = []
for aid in checking:
    spec = agent.get(aid) or {}
    if spec.get("model") != override:
        bad.append((aid, spec.get("model")))
if bad:
    print("checking agents not resolved to the override: %r" % bad)
    sys.exit(1)
sys.exit(0)
PY
        then
            pass "oc-control-layer-model (runtime): with a 4-line agent.<id>.model block (a DISTINCT id, not the session model) laid over a scratch build, the loader resolves all four checking agents to that override — proving the config-layer override MOVES them OFF the session model (opencode debug config --pure)"
        else
            fail "oc-control-layer-model (runtime): the loader did not resolve all four checking agents to the override model (see above)"
        fi
    else
        fail "oc-control-layer-model (runtime): \`opencode debug config --pure\` exited non-zero with the control-layer block applied"
    fi
    rm -rf "$CLMDIR"
else
    echo "SKIP: oc-control-layer-model (runtime) — opencode not on PATH (CI without opencode does not fail; the form/docs checks above still run). NOTE: the task-spawn resolution remains the to-verify residual."
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
# oc-orchestrator-can-author-own  (slice 18 — replaced oc-orchestrator-write-scoped)
# The orchestrator is the seat that DRIVES the pipeline. It must be able to author
# its OWN artifacts (the feature plan during planning + .ai-pm bookkeeping — state,
# backlog, contracts, decision/resolution trails), exactly as the Claude
# orchestrator does. So:
#   (a) the `tools` map must GRANT write + edit + task (and skill + read + bash) —
#       drive the pipeline, delegate, bookkeep, and author its own plan/bookkeeping;
#   (b) the frontmatter must carry NO `permission` block restricting them. The
#       PERSONA (not a tool-rule) scopes WHAT it authors. The earlier path-
#       `permission` (allow .ai-pm/doc-features, deny **) was REMOVED: OpenCode
#       matched the globs against ABSOLUTE paths so they never matched and every
#       orchestrator write fell through to `**: deny` (breaking the legitimate
#       .ai-pm writes), and `bash` bypassed it anyway (zero real protection).
# NOTE: `question` is granted to the primary via the top-level opencode.json
# permission (oc-orchestrator-can-question above), not in this per-agent tools map.
# Source: https://opencode.ai/docs/agents/, https://opencode.ai/docs/permissions/.
# ----------------------------------------------------------------------
if [ ! -f "$ORCH" ]; then
    fail "oc-orchestrator-can-author-own: orchestrator agent missing at $ORCH"
elif python3 - "$ORCH" <<'PY'
import sys, re, pathlib
# Stdlib-only frontmatter parse (the rest of this suite avoids a YAML dep): a
# shallow indentation walk over the `tools:` block (scalar bools) plus a check that
# NO top-level `permission:` key is present. The .fm authors a fixed 2-space
# nesting; this is a form check, not a general YAML parser.
text = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
lines = text.split("\n")
fences = [i for i, l in enumerate(lines) if l == "---"]
if len(fences) < 2:
    print("no frontmatter block"); sys.exit(1)
fm = lines[fences[0]+1:fences[1]]

tools = {}
has_permission = False
section = None  # None | "tools"
for l in fm:
    if re.match(r'^\s*#', l) or l.strip() == "":
        continue
    if re.match(r'^tools:\s*$', l):
        section = "tools"; continue
    if re.match(r'^permission:\s*$', l):
        has_permission = True; section = None; continue
    if re.match(r'^[a-z_]+:', l):  # any other top-level key ends the block
        section = None; continue
    if section == "tools":
        m = re.match(r'^\s+([a-z_]+):\s+(true|false)\s*$', l)
        if m:
            tools[m.group(1)] = (m.group(2) == "true")

errs = []
# (a) Must GRANT write + edit + task (author own artifacts + delegate) AND the
#     drive-the-pipeline + bookkeep tools.
for t in ("write", "edit", "task", "skill", "read", "bash"):
    if tools.get(t) is not True:
        errs.append(f"tools.{t} must be granted (true); got {tools.get(t)!r}")
# (b) Must carry NO `permission` block (the persona scopes WHAT it authors; the
#     removed path-permission broke legitimate writes and was bypassable).
if has_permission:
    errs.append("frontmatter must carry NO `permission` block restricting "
                "write/edit — the persona scopes authoring, not a tool-rule")
if errs:
    for e in errs: print(e)
    sys.exit(1)
sys.exit(0)
PY
then
    pass "oc-orchestrator-can-author-own: ai-pm.md GRANTS write+edit+task (and skill/read/bash) and carries NO permission block restricting them — it can author its own plan + .ai-pm bookkeeping; the persona scopes WHAT it authors (https://opencode.ai/docs/permissions/)"
else
    fail "oc-orchestrator-can-author-own: the orchestrator tools do not grant write+edit+task/skill/read/bash, OR it still carries a permission block restricting them (see above)"
fi

# Runtime: the generated config must still be VALID with no permission block.
# GUARDED-SKIP when opencode is absent. `opencode debug config --pure` validates
# the config parse without loading external plugins or a model round-trip.
if command -v opencode >/dev/null 2>&1; then
    OCFGDIR=$(mktemp -d) || { echo "FAIL: mktemp failed" >&2; exit 1; }
    python3 "$GEN" --harness opencode --out "$OCFGDIR/.opencode" >/dev/null 2>&1
    if (cd "$OCFGDIR" && timeout 60 opencode debug config --pure </dev/null >/dev/null 2>&1); then
        pass "oc-orchestrator-can-author-own (runtime): the real OpenCode loader accepts the generated config with the orchestrator's permission block removed (opencode debug config --pure, exit 0)"
    else
        fail "oc-orchestrator-can-author-own (runtime): the real OpenCode loader REJECTED the generated config after removing the orchestrator's permission block (opencode debug config --pure exited non-zero)"
    fi
    rm -rf "$OCFGDIR"
else
    echo "SKIP: oc-orchestrator-can-author-own (runtime) — opencode not on PATH (CI without opencode does not fail; the form check above still runs)"
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
