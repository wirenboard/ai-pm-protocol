// tests/oc-plugin-unit.js — deterministic, CI-safe unit test for the OpenCode
// CORE enforcement plugin's tool.execute.before hook
// (opencode-harness-support, stage (a), slice 3 — case `oc-enforcement-plugin-throws`;
// slice 5 — ESM-load rework + `oc-plugin-esm-loadable` regression guard).
//
// NO LLM, NO OpenCode runtime, NO network. It loads the GENERATED plugin
// (.opencode/plugin/ai-pm-enforcement.js) THE WAY OPENCODE DOES — as an ES
// module — and exercises its hook:
//
//   1. Copy the generated plugin to a temp `.mjs` file and `import()` it
//      dynamically (matching the runtime's ESM load; a plain `require()` of the
//      CommonJS shape is NOT how OpenCode loads, which is exactly the slice-5
//      bug the old test missed).
//   2. LOAD-SHAPE GUARD (`oc-plugin-esm-loadable`): assert the plugin entry
//      export `AiPmEnforcement` is a function AND that the module exposes no
//      non-function export (OpenCode treats EVERY export as a plugin function, so
//      a non-function export — e.g. the old exported `WB_DENY_ROLES` array —
//      makes the real runtime fail with "Plugin export is not a function — failed
//      to load plugin"). This guard would have caught the slice-5 defect.
//   3. CALL `AiPmEnforcement({ directory: <tmp project root> })` to obtain the
//      `tool.execute.before` hook, then run SYNTHETIC (input, output) pairs,
//      asserting it THROWS for each deny case (wb-* task, wb-* skill, out-of-root
//      read, truncating write, and a `find` with an absolute path outside the
//      root) and ALLOWS the legitimate cases (incl. relative/in-root `find` and
//      a non-find bash command). The OpenCode tool/arg shapes used here are the
//      ones the 1.16.2 runtime passes (task.subagent_type, skill.name,
//      read.filePath, write.filePath+content, bash.command) and the documented
//      plugin contract
//      (https://opencode.ai/docs/plugins/ — throwing in tool.execute.before
//      blocks the call).
//
// The live subagent-containment truth came from Spike B (recorded in
// .ai-pm/state/current.md); the live ESM-load-success came from a real
// `opencode run` (slice 5). This test is the deterministic form/behavior guard
// for the hook's logic AND its load shape, run in CI without OpenCode.
//
// Exit 0 if every assertion holds; non-zero with a diagnostic otherwise.

"use strict";

const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const url = require("node:url");

const ROOT = process.cwd();
const PLUGIN = path.join(ROOT, ".opencode", "plugin", "ai-pm-enforcement.js");

let pass = 0;
let fail = 0;
function ok(name) { console.log("PASS: " + name); pass++; }
function bad(name, detail) { console.log("FAIL: " + name + (detail ? " — " + detail : "")); fail++; }

if (!fs.existsSync(PLUGIN)) {
  console.error("FAIL: generated plugin missing at " + PLUGIN + " (run gen/generate.py --harness opencode)");
  process.exit(1);
}

// Scratch dir: the temp .mjs copy (ESM load) + the read/write boundary cases.
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "oc-plugin-unit-"));

(async () => {
  // --- (1) Load the plugin the way OpenCode does: ESM dynamic import of an .mjs
  //     copy of the GENERATED file. Copying to `.mjs` forces ESM parsing
  //     regardless of any package.json "type", exactly as the runtime treats a
  //     plugin module. ---
  const mjs = path.join(SCRATCH, "ai-pm-enforcement.mjs");
  fs.copyFileSync(PLUGIN, mjs);

  let mod;
  try {
    mod = await import(url.pathToFileURL(mjs).href);
  } catch (e) {
    bad("oc-plugin-esm-loadable: the generated plugin imports cleanly as an ES module", e && e.message);
    finish();
    return;
  }

  // --- (2) LOAD-SHAPE GUARD `oc-plugin-esm-loadable`: the regression guard for
  //     the slice-5 bug. OpenCode treats EACH export of a plugin module as a
  //     plugin function, so (a) the plugin entry export must be a function, and
  //     (b) NO export may be a non-function (an exported array/object/string is
  //     what produced "Plugin export is not a function — failed to load plugin").
  const exportNames = Object.keys(mod).filter((k) => k !== "default");
  const entry = mod.AiPmEnforcement;
  if (typeof entry !== "function") {
    bad("oc-plugin-esm-loadable: the plugin entry export `AiPmEnforcement` is a function",
        "typeof AiPmEnforcement === " + typeof entry);
  } else {
    ok("oc-plugin-esm-loadable: the plugin entry export `AiPmEnforcement` is a function");
  }

  const nonFnExports = exportNames.filter((k) => typeof mod[k] !== "function");
  if (nonFnExports.length > 0) {
    bad("oc-plugin-esm-loadable: the plugin module exposes no non-function export (OpenCode would fail to load it)",
        "non-function exports: " + JSON.stringify(nonFnExports));
  } else {
    ok("oc-plugin-esm-loadable: every export of the plugin module is a function (no array/object export to break the ESM plugin load)");
  }

  // If the load shape is already broken, the behavior assertions cannot run
  // meaningfully — but we still try, to surface as much as possible.
  if (typeof entry !== "function") { finish(); return; }

  // --- (3) Obtain the hook by calling the plugin with a synthetic ctx, the way
  //     the runtime calls it (ctx.directory = the session's project root). ---
  const hooks = await entry({ directory: SCRATCH });
  const hook = hooks && hooks["tool.execute.before"];
  if (typeof hook !== "function") {
    bad("oc-enforcement-plugin-throws: the plugin returns a tool.execute.before hook function",
        "got typeof " + typeof hook);
    finish();
    return;
  }

  // The single-source role set is internal now (not exported). Use a known wb-*
  // role literal for the deny assertions — it must match the injected set; the
  // separate `oc-enforcement-plugin-single-source` test asserts the injected set
  // equals settings.json. We read one role out of the generated plugin text so
  // this test stays in step with whatever was injected, without importing it.
  const pluginText = fs.readFileSync(PLUGIN, "utf8");
  const roleMatch = pluginText.match(/const WB_DENY_ROLES = (\[[^\]]*\]);/);
  if (!roleMatch) {
    bad("oc-enforcement-plugin-throws: could not read the injected WB_DENY_ROLES from the generated plugin");
    finish();
    return;
  }
  const denyRoles = JSON.parse(roleMatch[1]);
  if (!Array.isArray(denyRoles) || denyRoles.length === 0) {
    bad("oc-enforcement-plugin-throws: the injected WB_DENY_ROLES is empty");
    finish();
    return;
  }
  const DENIED_ROLE = denyRoles[0];

  async function assertThrows(name, tool, args) {
    try {
      await hook({ tool }, { args });
      bad(name, "expected a throw (deny), but the hook allowed the call");
    } catch (e) {
      ok(name);
    }
  }
  async function assertAllows(name, tool, args) {
    try {
      await hook({ tool }, { args });
      ok(name);
    } catch (e) {
      bad(name, "expected the hook to allow, but it threw: " + (e && e.message));
    }
  }

  // (a) wb-* task spawn -> DENY.
  await assertThrows(
    "oc-enforcement-plugin-throws: (a) wb-* task spawn is denied",
    "task",
    { subagent_type: DENIED_ROLE }
  );

  // (b) wb-* skill load -> DENY.
  await assertThrows(
    "oc-enforcement-plugin-throws: (b) wb-* skill load is denied",
    "skill",
    { name: DENIED_ROLE }
  );

  // (c) read outside the project root -> DENY.
  await assertThrows(
    "oc-enforcement-plugin-throws: (c) read outside project root is denied",
    "read",
    { filePath: "/etc/passwd" }
  );

  // (d) truncating write over an existing non-empty file -> DENY.
  const victim = path.join(SCRATCH, "authored.md");
  fs.writeFileSync(victim, "real authored content that must not be zeroed\n");
  await assertThrows(
    "oc-enforcement-plugin-throws: (d) empty/whitespace write over an existing non-empty file is denied",
    "write",
    { filePath: victim, content: "   \n\t  " }
  );

  // (e) bash `find` with an absolute path argument OUTSIDE the project root ->
  //     DENY (the find-boundary guard ported from the Claude settings.json Bash
  //     matcher; clear-DENY parity).
  await assertThrows(
    "oc-enforcement-plugin-throws: (e) bash `find /etc -name x` (absolute path outside root) is denied",
    "bash",
    { command: "find /etc -name x" }
  );

  // --- ALLOW cases (the hook must not over-block) ---

  // A pm-* task spawn -> ALLOW (not in the deny set).
  await assertAllows(
    "oc-enforcement-plugin-allows: a pm-* task spawn is allowed",
    "task",
    { subagent_type: "pm-coder" }
  );

  // An ordinary read inside the project root -> ALLOW.
  const insideFile = path.join(SCRATCH, "inside.md");
  fs.writeFileSync(insideFile, "x\n");
  await assertAllows(
    "oc-enforcement-plugin-allows: an in-root read is allowed",
    "read",
    { filePath: insideFile }
  );

  // A normal write (non-empty content) over the existing file -> ALLOW.
  await assertAllows(
    "oc-enforcement-plugin-allows: a write with real content is allowed",
    "write",
    { filePath: victim, content: "new real content\n" }
  );

  // A write creating a NEW file with empty content -> ALLOW (no truncation: the
  // file does not yet exist, so nothing authored is zeroed).
  await assertAllows(
    "oc-enforcement-plugin-allows: an empty write creating a new (non-existent) file is allowed",
    "write",
    { filePath: path.join(SCRATCH, "brand-new.md"), content: "" }
  );

  // A relative `find` (no absolute first arg) -> ALLOW (the find-boundary guard
  // gates only an absolute path resolving outside root).
  await assertAllows(
    "oc-enforcement-plugin-allows: bash `find . -name x` (relative, no absolute arg) is allowed",
    "bash",
    { command: "find . -name x" }
  );

  // A `find` rooted at a path INSIDE the project root -> ALLOW.
  await assertAllows(
    "oc-enforcement-plugin-allows: bash `find <root-relative absolute> ...` (inside root) is allowed",
    "bash",
    { command: "find " + path.join(SCRATCH, "sub") + " -name x" }
  );

  // A non-find bash command -> ALLOW (this guard gates only the find boundary;
  // the "ask"-class bash guards are not ported in this slice).
  await assertAllows(
    "oc-enforcement-plugin-allows: a non-find bash command is allowed",
    "bash",
    { command: "echo hello && ls -la" }
  );

  finish();
})().catch((e) => {
  console.error("FAIL: unexpected error in oc-plugin-unit.js — " + (e && e.stack || e));
  try { fs.rmSync(SCRATCH, { recursive: true, force: true }); } catch (_e) {}
  process.exit(1);
});

function finish() {
  try { fs.rmSync(SCRATCH, { recursive: true, force: true }); } catch (_e) {}
  console.log("----");
  console.log("Total: " + (pass + fail) + "  Passed: " + pass + "  Failed: " + fail);
  process.exit(fail > 0 ? 1 : 0);
}
