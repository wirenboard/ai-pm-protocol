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
        fail "oc-agent-frontmatter-shape: $name has no `description:` in frontmatter"
        shape_ok=0; continue
    fi
    if ! printf '%s\n' "$fm" | grep -Eq '^mode:[[:space:]]+(subagent|primary|all)[[:space:]]*$'; then
        fail "oc-agent-frontmatter-shape: $name has no valid `mode:` (subagent|primary|all)"
        shape_ok=0; continue
    fi
    # tools must be an OBJECT map: a `tools:` line with no value after it, then
    # at least one indented `  <name>: true|false` entry. A Claude comma-list
    # (`tools: Read, Edit`) has a value on the `tools:` line and would fail here.
    if printf '%s\n' "$fm" | grep -Eq '^tools:[[:space:]]*[^[:space:]]'; then
        fail "oc-agent-frontmatter-shape: $name uses a scalar `tools:` value (Claude comma-list shape), not an object map"
        shape_ok=0; continue
    fi
    if ! printf '%s\n' "$fm" | grep -q '^tools:[[:space:]]*$'; then
        fail "oc-agent-frontmatter-shape: $name has no `tools:` object key"
        shape_ok=0; continue
    fi
    if ! printf '%s\n' "$fm" | grep -Eq '^[[:space:]]+[a-z_]+:[[:space:]]+(true|false)[[:space:]]*$'; then
        fail "oc-agent-frontmatter-shape: $name `tools:` has no `<name>: true|false` object entries"
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
# oc-enforcement-plugin-throws
# Deterministic, CI-safe unit test of the plugin's tool.execute.before hook:
# unit-invoke the exported hook with SYNTHETIC inputs (no LLM, no OpenCode
# runtime) and assert it THROWS for each deny case (wb-* task, wb-* skill,
# out-of-root read, truncating write) and ALLOWS the legitimate cases (pm-* task,
# in-root read, real write). Requires node; SKIPS cleanly if node is absent.
# Source: https://opencode.ai/docs/plugins/
# ----------------------------------------------------------------------
if command -v node >/dev/null 2>&1; then
    if node "$ROOT/tests/oc-plugin-unit.js"; then
        pass "oc-enforcement-plugin-throws: the plugin hook throws for every deny case and allows the legitimate cases (deterministic unit test; https://opencode.ai/docs/plugins/)"
    else
        fail "oc-enforcement-plugin-throws: the plugin hook unit test failed (see node output above)"
    fi
else
    echo "SKIP: oc-enforcement-plugin-throws — node not on PATH (CI without node does not fail; the plugin form/behavior unit test is skipped)"
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
# Summary
# ----------------------------------------------------------------------
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "----"
echo "Total: $TOTAL  Passed: $PASS_COUNT  Failed: $FAIL_COUNT"

[ "$FAIL_COUNT" -gt 0 ] && exit 1
exit 0
