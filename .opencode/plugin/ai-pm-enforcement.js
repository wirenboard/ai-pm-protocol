// ai-pm-enforcement.js — OpenCode CORE enforcement plugin for the ai-pm protocol.
//
// GENERATED, do not hand-edit. Emitted by gen/generate.py from this template
// (src/manifests/opencode/plugin/ai-pm-enforcement.js.tmpl). The wb-* role
// deny-list below is the SINGLE-SOURCE one: the generator extracts it from the
// Claude settings.json Task|Agent|Skill matcher at build time and substitutes
// the ["wb-development:coder", "wb-development:code-reviewer", "wb-development:design-review", "wb-development:plan-feature", "wb-development:pr-prep", "wb-git:workflow", "wb-git:pr-author"] placeholder, so there is exactly one authored copy of
// the role set (settings.json) and the two adapters cannot drift. The
// single-source test (tests/opencode.sh) fails if the emitted set diverges from
// settings.json. Edit the source (settings.json / this template) and regenerate;
// single-source-diff-clean fails on a hand-edit to the generated copy.
//
// CORE enforcement = the clear-DENY guards of the protocol's role-duplicator +
// boundary deny-list (the OpenCode-side realization of the same neutral CORE
// deny rules the Claude adapter realizes as PreToolUse hooks), as a
// tool.execute.before hook that THROWS to deny. This plugin depends on NOTHING
// in the Claude adapter tree at load or run time (the symmetry / no-cross-read
// invariant): the wb-* role set is injected at BUILD time from the Claude
// settings manifest, not read from a sibling adapter at run time. Per
// https://opencode.ai/docs/plugins/ : a plugin is an async function receiving a
// context object and returning a hooks object; throwing inside
// tool.execute.before blocks the tool call (the documented .env example throws
// on output.args.filePath). input.tool is the tool name; output.args is the
// args object.
//
// PACKAGING / LOAD SHAPE (slice 5 fix — the must-not-regress part):
// OpenCode loads each plugin file as an ES MODULE and treats EACH of its exports
// as a plugin function. So the module MUST be ESM and MUST export exactly the
// plugin function — nothing else. An earlier CommonJS shape
// (`module.exports = fn`, plus exported `makeDenyHook` / a `WB_DENY_ROLES`
// ARRAY) made the real runtime fail with
// `ERROR service=plugin ... error=Plugin export is not a function — failed to
// load plugin` (the exported array is not a function), so the plugin never
// loaded and enforcement was silently off. This file is therefore an ES module
// with a SINGLE named export — the plugin function `AiPmEnforcement` — and NO
// other exports. The deny logic (and the single-sourced role set) lives in
// module-scope consts/functions that are NOT exported, so the only export the
// loader sees is the plugin function. Live-confirmed loading cleanly on OpenCode
// 1.16.2 (`opencode run`, no "Plugin export is not a function"); matches the
// working Spike-B plugin shape. The `oc-plugin-esm-loadable` regression guard
// (tests/opencode.sh) asserts this load shape; oc-enforcement-plugin-throws
// loads the module as ESM (a temp .mjs + dynamic import, the way the runtime
// does) and exercises the four deny + four allow behaviors.
//
// OpenCode tool/arg mapping (verified against the OpenCode 1.16.2 runtime, not
// only the docs):
//   task   -> output.args.subagent_type   (the spawned subagent's id)
//   skill  -> output.args.name             (skill loaded by name; skill({name}))
//   read   -> output.args.filePath         (per the docs .env example)
//   write  -> output.args.filePath + .content
//   bash   -> output.args.command          (the shell command string)
//
// CORE DENY SET (this plugin now enforces the SAME clear-DENY guards as the
// Claude settings.json adapter): (a) wb-* role-duplicator task spawn,
// (b) wb-* role-duplicator skill load, (c) read outside the project root,
// (d) empty/whitespace-only write over an existing non-empty file (truncation),
// and (e) a `find` invocation whose first absolute-path argument resolves
// OUTSIDE the project root (the bash find-boundary guard — ported from the
// Claude settings.json Bash matcher's `find`-boundary `if` hook). With (e) the
// OpenCode plugin reaches clear-DENY parity with Claude: role-duplicator +
// read-boundary + truncating-write + find-boundary.
//
// SCOPE: CORE (clear-DENY) rules only. The "ask"-class guards (force-push, git
// commit --no-verify, ssh content-edit, ssh mutating action) are NOT ported
// here: tool.execute.before can only throw (hard deny) or allow — it has no
// "ask" return — so those map to OpenCode's permission config, a later slice.
// This is a documented divergence (see AGENTS.md). Do NOT force them into throws.
//
// SUBAGENT-EFFECTIVE: verified on OpenCode 1.16.2 (Spike B, 2026-06-07) — a
// task-spawned subagent's tool call DOES fire and get denied by this hook (the
// subagent runs in its own child session; the per-instance plugin intercepts
// it). Version-pinned: re-verify on upgrade (#5894 is historically
// version-sensitive).

import path from "node:path";
import fs from "node:fs";

// The wb-* role-duplicator deny set. SINGLE-SOURCE: injected by the generator
// from the Claude settings.json Task|Agent|Skill matcher. Both a task spawn
// (subagent_type) and a skill load (name) of one of these is denied — mirroring
// the Claude deny path that gates subagent_type // skill alike. Module-scope and
// NOT exported (an exported array would break the ESM plugin load).
const WB_DENY_ROLES = ["wb-development:coder", "wb-development:code-reviewer", "wb-development:design-review", "wb-development:plan-feature", "wb-development:pr-prep", "wb-git:workflow", "wb-git:pr-author"];

const DENY_REASON_ROLE =
  " duplicates a protocol role in this ai-pm project. Use the pm-* equivalent" +
  " (pm-coder / pm-plan-checker + code-review / pm-architect / /pm-plan /" +
  " pm-pr-prep / WORKFLOW.md git rules), not a wb-* role agent. code-review," +
  " deep-research and wb-knowledge skills stay available.";

// Resolve a (possibly relative) target path against the project root.
function resolveTarget(root, target) {
  if (typeof target !== "string" || target.length === 0) return null;
  return path.resolve(root, target);
}

// True if `resolved` is the root itself or sits inside it.
function isInsideRoot(root, resolved) {
  const rootResolved = path.resolve(root);
  if (resolved === rootResolved) return true;
  return resolved.startsWith(rootResolved + path.sep);
}

// Extract the first ABSOLUTE-path argument of a `find` invocation in a bash
// command string, mirroring the Claude settings.json find-boundary guard's
// intent (`grep -oP 'find +\K/[^ |;&"\x27]*' | head -1`): the Claude regex takes
// the first `/`-leading token that immediately follows `find ` (one-or-more
// spaces), stopping at a space/pipe/semicolon/ampersand/quote. So `find /etc -name x`
// yields `/etc`; `find . -name x` and `find src -type f` yield null (the token
// after `find` is relative — ALLOWED). A relative `find` (no leading-slash first
// arg) is allowed. Returns the absolute path string, or null if the command is
// not a `find` with an absolute first argument. Conservative and behavior-faithful
// to the Claude guard: only the first token after `find` is considered.
function findAbsolutePathArg(command) {
  if (typeof command !== "string" || command.length === 0) return null;
  // Match `find` (as a word) followed by 1+ spaces and a `/`-leading token,
  // capturing the path up to the first space/pipe/semicolon/ampersand/quote —
  // the same delimiter class the Claude grep -oP pattern stops at.
  const m = command.match(/(?:^|[\s;&|(])find[ \t]+(\/[^\s|;&"']*)/);
  return m ? m[1] : null;
}

// OpenCode plugin entry — the SINGLE named export. Per
// https://opencode.ai/docs/plugins/ the plugin is an async function receiving
// { project, client, $, directory, worktree } and returning a hooks object; the
// runtime treats every export of this module as a plugin function, so this is
// the only export. The read-boundary root is the session's project directory
// (directory/worktree); fall back to process.cwd() if absent. The deny logic is
// inlined here so the module exposes nothing but this function.
export const AiPmEnforcement = async (ctx) => {
  const projectRoot = (ctx && (ctx.directory || ctx.worktree)) || process.cwd();

  return {
    // Throws to deny; returns undefined to allow. Behavior is UNCHANGED from the
    // prior (CommonJS) shape — this slice is a packaging/export fix only.
    "tool.execute.before": async (input, output) => {
      const tool = input && input.tool;
      const args = (output && output.args) || {};

      // (a) task -> deny a wb-* role-duplicator subagent spawn.
      if (tool === "task") {
        const sub = args.subagent_type;
        if (typeof sub === "string" && WB_DENY_ROLES.includes(sub)) {
          throw new Error(sub + DENY_REASON_ROLE);
        }
        return;
      }

      // (b) skill -> deny a wb-* role-duplicator skill load (mirror Claude skill).
      if (tool === "skill") {
        const name = args.name;
        if (typeof name === "string" && WB_DENY_ROLES.includes(name)) {
          throw new Error(name + DENY_REASON_ROLE);
        }
        return;
      }

      // (c) read -> deny a target path that resolves outside the project root.
      if (tool === "read") {
        const resolved = resolveTarget(projectRoot, args.filePath);
        if (resolved !== null && !isInsideRoot(projectRoot, resolved)) {
          throw new Error(
            "Path outside project root: " +
              args.filePath +
              " (resolves to " +
              resolved +
              "). Reads must stay within the project root."
          );
        }
        return;
      }

      // (d) write -> deny an empty/whitespace-only write over an existing
      //     non-empty file (truncation guard; mirrors the Claude destructive-Write
      //     guard / the 2026-06-06 doc-loss regression guard).
      if (tool === "write") {
        const content = typeof args.content === "string" ? args.content : "";
        const stripped = content.replace(/[\s]/g, "");
        if (stripped.length > 0) return; // non-empty content is fine
        const resolved = resolveTarget(projectRoot, args.filePath);
        if (resolved === null) return;
        let existingNonEmpty = false;
        try {
          const st = fs.statSync(resolved);
          existingNonEmpty = st.isFile() && st.size > 0;
        } catch (_e) {
          existingNonEmpty = false; // file does not exist -> creating is fine
        }
        if (existingNonEmpty) {
          throw new Error(
            "Empty/whitespace-only write over an existing non-empty file would" +
              " zero authored content (truncation guard): " +
              args.filePath +
              ". A genuine truncate should use a different tool; additions should" +
              " use edit. Regression guard for the 2026-06-06 doc-loss incident."
          );
        }
        return;
      }

      // (e) bash -> deny a `find` whose first absolute-path argument resolves
      //     OUTSIDE the project root (ports the Claude settings.json Bash
      //     matcher's find-boundary guard; clear-DENY parity). A relative
      //     `find` (find ., find src) carries no absolute first arg and is
      //     allowed; every non-find bash command is allowed (this guard gates
      //     only the find boundary — the "ask"-class bash guards stay deferred).
      if (tool === "bash") {
        const absPath = findAbsolutePathArg(args.command);
        if (absPath !== null) {
          const resolved = path.resolve(absPath);
          if (!isInsideRoot(projectRoot, resolved)) {
            throw new Error("find searches outside project root: " + absPath);
          }
        }
        return;
      }
    },
  };
};
