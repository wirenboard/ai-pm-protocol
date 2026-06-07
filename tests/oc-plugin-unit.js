// tests/oc-plugin-unit.js — deterministic, CI-safe unit test for the OpenCode
// CORE enforcement plugin's tool.execute.before hook
// (opencode-harness-support, stage (a), slice 3 — case `oc-enforcement-plugin-throws`).
//
// NO LLM, NO OpenCode runtime, NO network: it `require()`s the GENERATED plugin
// (.opencode/plugin/ai-pm-enforcement.js) and calls the exported pure hook
// factory `makeDenyHook(root)` with SYNTHETIC (input, output) pairs, asserting
// it THROWS for each deny case and ALLOWS the legitimate cases. The OpenCode
// tool/arg shapes used here are the ones the 1.16.2 runtime passes
// (task.subagent_type, skill.name, read.filePath, write.filePath+content) and
// the documented plugin contract (https://opencode.ai/docs/plugins/ — throwing
// in tool.execute.before blocks the call).
//
// The live subagent-containment truth came from Spike B (recorded in
// .ai-pm/state/current.md), not this test: this is the deterministic
// form/behavior guard for the hook's logic, run in CI without OpenCode.
//
// Exit 0 if every assertion holds; non-zero with a diagnostic otherwise.

"use strict";

const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

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

const plugin = require(PLUGIN);
const makeDenyHook = plugin.makeDenyHook;
const WB_DENY_ROLES = plugin.WB_DENY_ROLES;

if (typeof makeDenyHook !== "function") {
  console.error("FAIL: plugin does not export makeDenyHook");
  process.exit(1);
}
if (!Array.isArray(WB_DENY_ROLES) || WB_DENY_ROLES.length === 0) {
  console.error("FAIL: plugin does not export a non-empty WB_DENY_ROLES array");
  process.exit(1);
}

// A real wb-* role to use in the deny assertions (single-sourced into the plugin).
const DENIED_ROLE = WB_DENY_ROLES[0];

// Project root for the read/write boundary cases: a scratch dir we control.
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "oc-plugin-unit-"));
const hook = makeDenyHook(SCRATCH);

// Helper: assert the hook throws for a given (tool, args).
async function assertThrows(name, tool, args) {
  try {
    await hook({ tool }, { args });
    bad(name, "expected a throw (deny), but the hook allowed the call");
  } catch (e) {
    ok(name);
  }
}
// Helper: assert the hook ALLOWS (does not throw) for a given (tool, args).
async function assertAllows(name, tool, args) {
  try {
    await hook({ tool }, { args });
    ok(name);
  } catch (e) {
    bad(name, "expected the hook to allow, but it threw: " + (e && e.message));
  }
}

(async () => {
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

  // Cleanup.
  try { fs.rmSync(SCRATCH, { recursive: true, force: true }); } catch (_e) {}

  console.log("----");
  console.log("Total: " + (pass + fail) + "  Passed: " + pass + "  Failed: " + fail);
  process.exit(fail > 0 ? 1 : 0);
})();
