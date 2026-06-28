// Claude platform wiring: assemble the agents + the setup command, merge the deny
// hooks into .claude/settings.json (keyed so a re-run never duplicates), import the
// constitution via CLAUDE.md, and self-verify the deny wiring just written.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { runScript, ensureLine } from "./install-fs.mjs";
import { stripBreadcrumbFile } from "./install-breadcrumb.mjs";

// A hook group is OURS when any of its commands targets the protocol shim. The
// marker is the shim's stable path tail — it survives a vendor-location change
// (.ai-pm/tooling/ → .ai-dev/tooling/) where an exact-command compare would not.
const HOOK_MARKER = "adapter/claude/shim.mjs";

// The tools the mechanical floor RIDES — the PreToolUse matcher MUST route them to the
// shim or that part of the deny layer goes silently off. verifyClaudeWiring step 1b
// asserts every one stays covered. The map doubles as the per-tool failure description, so
// a dropped-`Read` error names the boundary denies it disabled, not Bash's merge-gate.
const FLOOR_TOOL_DENIES = {
  Bash: "the merge-gate, remote-edit, and git-add-all denies", // push/commit/ssh are Bash ops
  Task: "the role/seat spawn-deny",
  Read: "the boundary read/find-outside-root deny",
  Write: "the boundary write-outside-root, truncation, and orchestrator-authors-content denies",
  Edit: "the boundary write-outside-root, truncation, and orchestrator-authors-content denies",
};
const FLOOR_TOOLS = Object.keys(FLOOR_TOOL_DENIES); // ["Bash","Task","Read","Write","Edit"]

// 5a. Wire Claude: assemble the agents + the setup command against the target root,
// merge the deny hooks into .claude/settings.json (keyed so a re-run never
// duplicates), and import the constitution + the orchestrator procedure via CLAUDE.md.
export function wireClaude(target, dogfood) {
  const cfg = { AI_DEV_CONFIG: path.join(target, ".ai-dev", "config.json") };
  // Children run from the vendored tooling copy downstream, the source tree in
  // dogfood mode (they self-locate ROOT three dirs up — the source copies point
  // ROOT at the repo root, correct for self-host).
  const scriptBase = dogfood ? path.join(target, "src") : path.join(target, ".ai-dev", "tooling", "src");
  runScript(scriptBase, path.join("adapter", "claude", "install-agents.mjs"), [path.join(target, ".claude", "agents")], cfg);
  runScript(scriptBase, path.join("adapter", "claude", "install-commands.mjs"), [path.join(target, ".claude", "commands")], cfg);

  // Merge the two deny hooks into .claude/settings.json idempotently. The hook
  // fragment is the claude/hooks.json (the single home of the hook shape) — read
  // from the source tree in dogfood mode, the vendored copy downstream; we merge
  // its PreToolUse/UserPromptSubmit arrays, de-duping by command.
  const hooksFragment = JSON.parse(
    fs.readFileSync(path.join(scriptBase, "adapter", "claude", "hooks.json"), "utf8"),
  );
  // The hooks.json fragment carries the DOWNSTREAM shim path
  // (.ai-dev/tooling/src/adapter/claude/shim.mjs). In dogfood mode the active shim
  // is the source copy — retarget the command to src/adapter/claude/shim.mjs so the
  // wired settings.json matches the committed self-host form. The HOOK_MARKER (the
  // path tail) is unchanged, so the merge still prunes a prior group correctly.
  if (dogfood) {
    for (const groups of Object.values(hooksFragment.hooks)) {
      for (const g of groups) {
        for (const h of g.hooks || []) {
          if (typeof h.command === "string") {
            h.command = h.command.split(".ai-dev/tooling/src/adapter/claude/shim.mjs").join("src/adapter/claude/shim.mjs");
          }
        }
      }
    }
  }
  const settingsPath = path.join(target, ".claude", "settings.json");
  const settings = fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath, "utf8")) : {};
  settings.hooks = mergeHooks(settings.hooks || {}, hooksFragment.hooks);
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");

  // Load instructions: the orchestrator session loads the constitution + its
  // procedure via CLAUDE.md imports — appended only if not already present. A
  // breadcrumb left from when this platform was inactive is replaced by this
  // full wiring. The constitution path is layout-dependent (source root in dogfood,
  // vendored downstream); the orchestrator import is UNIFIED — both modes @import the
  // committed platform:claude-FILTERED artifact .claude/ai-dev.md that install-agents
  // assembled above (so the session loads the filtered body, not the raw source that
  // re-injects the inactive platform's caveats every turn).
  const claudeMd = path.join(target, "CLAUDE.md");
  stripBreadcrumbFile(claudeMd);
  ensureLine(claudeMd, dogfood ? "@PROTOCOL.md" : "@.ai-dev/PROTOCOL.md");
  repointOrchestratorImport(claudeMd);

  // Self-verify the Claude wiring just written (item 3) — the symmetric twin of the
  // opencode plugin self-verify. A broken Claude deny path otherwise goes SILENTLY
  // off at the first tool call under a printed success; this FAILS THE INSTALL loudly.
  verifyClaudeWiring(target, settingsPath);
}

// Verify the Claude deny wiring just written actually holds: settings.json parses and
// carries the PreToolUse ai-dev hook entry, AND the shim it points at is loadable.
// THROWS (⇒ install exits non-zero) on any failure, naming the cause + the
// enforcement-off hint — mirroring the opencode plugin self-verify's message
// discipline. Honest scope: this proves the shim LOADS (syntax + its import chain),
// NOT that Claude invokes the hook at runtime (the registration class, the same
// residual the opencode plugin self-verify carries).
export function verifyClaudeWiring(target, settingsPath) {
  // 1. settings.json parses + carries the expected PreToolUse ai-dev hook entry.
  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch (e) {
    throw new Error(
      `Claude wiring self-verify FAILED: ${settingsPath} is not valid JSON — ` +
        "the deny path would be silently off at the first tool call. " +
        `Underlying parse error: ${e && e.message ? e.message : String(e)}`,
      { cause: e },
    );
  }
  const preGroups = (settings.hooks && settings.hooks.PreToolUse) || [];
  const shimCommand = preGroups
    .flatMap((g) => (g.hooks || []).map((h) => (typeof h.command === "string" ? h.command : "")))
    .find((c) => c.includes(HOOK_MARKER));
  if (!shimCommand) {
    throw new Error(
      `Claude wiring self-verify FAILED: ${settingsPath} carries no PreToolUse hook ` +
        `referencing the deny shim (${HOOK_MARKER}) — the deny path would be silently ` +
        "off at the first tool call.",
    );
  }

  // 1b. the matcher of OUR shim-routing group(s) still COVERS the floor's tools. The
  // mechanical floor RIDES specific tools (FLOOR_TOOLS): the merge-gate, remote-edit, and
  // git-add-all denies fire on `Bash` (push/commit/ssh are Bash ops); the role/seat
  // spawn-deny fires on `Task`; the boundary (read/find/write-outside-root), truncation,
  // and orchestrator-authors-content denies fire on `Read`/`Write`/`Edit`. A PreToolUse
  // matcher that has dropped ANY of these routes those tool calls AROUND the shim, silently
  // disabling that part of the deny layer — the entry-exists check above does NOT catch it.
  // Assert each floor tool is a whole-token member of some shim-routing group's matcher;
  // fail-closed (an absent/empty matcher covers nothing). Honest scope: mergeHooks REPLACES
  // our group on every install, so this primarily guards a hooks.json source-regression that
  // drops a floor tool (a downstream's between-run manual matcher edit auto-heals on the next
  // install) plus fail-closed defense-in-depth. Persona sibling: the audit
  // verification-coverage sweep (src/agents/orchestrator.md `## Audit`).
  const shimMatchers = preGroups
    .filter((g) => (g.hooks || []).some((h) => typeof h.command === "string" && h.command.includes(HOOK_MARKER)))
    .map((g) => g.matcher);
  for (const tool of FLOOR_TOOLS) {
    if (!shimMatchers.some((m) => matcherCoversTool(m, tool))) {
      throw new Error(
        `Claude wiring self-verify FAILED: the PreToolUse deny-shim matcher in ${settingsPath} ` +
          `does not cover \`${tool}\` — the mechanical floor that rides ${tool} ` +
          `(${FLOOR_TOOL_DENIES[tool]}) ` +
          "would be silently off at the first tool call.",
      );
    }
  }

  // 2. the shim itself loads. Resolve its on-disk path from the WIRED command (so the
  // check works in both downstream and dogfood layouts), substituting the harness's
  // $CLAUDE_PROJECT_DIR for the real target root.
  const shimPath = resolveShimPath(target, shimCommand);
  if (!fs.existsSync(shimPath)) {
    throw new Error(
      `Claude wiring self-verify FAILED: the wired deny shim does not exist at ${shimPath} ` +
        "— the deny path would be silently off at the first tool call.",
    );
  }
  // `node --check` = a SYNTAX check that does NOT execute the shim (it reads stdin/argv
  // when run, so executing it here would hang); a child import() then catches a broken
  // dependency chain (the shim's top-level imports of engine.mjs / deny-rules.json).
  // Both via execFileSync with an argv ARRAY (no shell) — consistent with runScript.
  try {
    execFileSync("node", ["--check", shimPath], { stdio: "pipe" });
    execFileSync(
      "node",
      ["--input-type=module", "-e", `await import(${JSON.stringify(pathToFileURL(shimPath).href)})`],
      { stdio: "pipe" },
    );
  } catch (e) {
    const detail = e && e.stderr ? e.stderr.toString() : e && e.message ? e.message : String(e);
    throw new Error(
      `Claude wiring self-verify FAILED: the deny shim at ${shimPath} does not load — ` +
        `the deny path would be silently off at the first tool call. Underlying load error: ${detail}`,
      { cause: e },
    );
  }
}

// Resolve the shim's real on-disk path from the wired hook command. The command is
// `node "$CLAUDE_PROJECT_DIR/<rel>/shim.mjs"` (downstream) or `node "src/.../shim.mjs"`
// (dogfood, retargeted). Pull the token ending in the marker, strip the
// $CLAUDE_PROJECT_DIR prefix to the real target root, and resolve.
function resolveShimPath(target, command) {
  // The marker (HOOK_MARKER) is the path tail; the wired path is everything from the
  // start of the quoted/space-delimited shim token up to and including the marker.
  const tokens = command.match(/\S+/g) || [];
  const raw = tokens
    .map((t) => t.replace(/^["']|["']$/g, ""))
    .find((t) => t.includes(HOOK_MARKER));
  if (!raw) return path.join(target, ".ai-dev", "tooling", "src", HOOK_MARKER);
  const rel = raw
    .replace(/^["']/, "")
    .replace(/^\$CLAUDE_PROJECT_DIR\//, "")
    .replace(/^\$\{CLAUDE_PROJECT_DIR\}\//, "");
  return path.isAbsolute(rel) ? rel : path.join(target, rel);
}

// True when `tool` is a WHOLE alternation member of the matcher string (a regex-ish
// `A|B|C` Claude matches against the tool name). Whole-token membership via word
// boundaries — never a brittle exact-string compare — so a reordered, extended, or
// parenthesis-grouped (`(Read|Bash)`) matcher with the tool still present passes, while
// a substring like `BashTool`/`Bashful` does NOT count as coverage. `\b` is chosen over
// `|`-only anchors precisely because it also tolerates grouping (a trailing `)` defeats
// a `($|\|)` anchor); Claude's tool namespace is alphanumeric with no sub-word collision
// for `Bash`/`Task`, so `\b` carries no false positive here. Fail-closed: a non-string or
// empty matcher covers nothing. `tool` is only ever a fixed FLOOR_TOOLS literal (no regex
// metacharacters), so no escaping is required at this call site.
function matcherCoversTool(matcher, tool) {
  if (typeof matcher !== "string" || !matcher) return false;
  return new RegExp(`\\b${tool}\\b`).test(matcher);
}

// Repoint the orchestrator @import to the unified, platform-filtered load surface
// (.claude/ai-dev.md). The surface USED to be the raw orchestrator source, wired by a
// layout-dependent line: @src/agents/orchestrator.md (dogfood) or
// @.ai-dev/tooling/src/agents/orchestrator.md (downstream). A downstream UPGRADE from a
// pre-this-version install therefore carries the old vendored line — so we STRIP any stale
// raw-orchestrator import first, then ensure the new unified line. Strip-then-ensure (not a
// bare append) is what guarantees the old line is REPLACED, never left dangling beside the
// new one. Idempotent: on a tree already at the new form, the strip is a no-op (the file is
// not rewritten) and ensureLine no-ops — so a dogfood reinstall converges to committed bytes.
const ORCHESTRATOR_IMPORT = "@.claude/ai-dev.md";
const STALE_ORCHESTRATOR_IMPORTS = [
  "@src/agents/orchestrator.md",
  "@.ai-dev/tooling/src/agents/orchestrator.md",
];
function repointOrchestratorImport(claudeMd) {
  if (fs.existsSync(claudeMd)) {
    const lines = fs.readFileSync(claudeMd, "utf8").split("\n");
    const kept = lines.filter((l) => !STALE_ORCHESTRATOR_IMPORTS.includes(l.trim()));
    if (kept.length !== lines.length) fs.writeFileSync(claudeMd, kept.join("\n"));
  }
  ensureLine(claudeMd, ORCHESTRATOR_IMPORT);
}

// Merge a hooks fragment into an existing hooks object: foreign groups are kept
// untouched; every group recognised as ours (HOOK_MARKER) is REPLACED by the
// fragment's current group. Replace-not-append is both the idempotence guarantee
// (a re-run converges to the same bytes) and the prune: a stale ai-dev group whose
// command changed no longer accumulates beside the new one.
function mergeHooks(existing, fragment) {
  const merged = { ...existing };
  for (const [event, groups] of Object.entries(fragment)) {
    const foreign = (Array.isArray(merged[event]) ? merged[event] : []).filter(
      (g) => !(g.hooks || []).some((h) => typeof h.command === "string" && h.command.includes(HOOK_MARKER)),
    );
    merged[event] = [...foreign, ...groups];
  }
  return merged;
}
