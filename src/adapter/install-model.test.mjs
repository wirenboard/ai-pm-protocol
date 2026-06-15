// OpenCode install-model honesty test — proves install NEVER bakes a reviewer
// `model:` line (src/adapter/opencode/install-agents.mjs). The OpenCode `task`
// runtime parses a subagent's `model:` frontmatter but does NOT apply it at
// execution (open upstream bugs #21632 / #17870 / #18615, no fix through our
// 1.17.7 — research: docs/decisions/opencode-task-capabilities.md Q1), so baking a
// concrete pin would claim a cross-model reviewer the runtime silently swallows.
// The contract this locks:
//   • EVERY input — a concrete `provider/model` string, the per-platform
//     `{opencode: …}` form, `auto`, `session`, or absent — resolves to NO `model:`
//     line; the subagent inherits the session model, no false claim of cross-model
//     independence. (The WHY a cross-model reviewer is unavailable on OpenCode is
//     documented for the Operator in orchestrator.md `## Your seat`, tool-map.json
//     `models.opencode._note`, and the research doc above — not in the install log.)
// UNLIKE Claude, where the orchestrator resolves the model and passes it at the
// spawn (no bake path at all). A regression that bakes a line fails loudly here.
//
// Run: node src/adapter/install-model.test.mjs

import { install, resolveModelPin } from "./opencode/install-agents.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}`); }
}

// 1. resolveModelPin — on OpenCode ALWAYS null (the runtime ignores subagent
//    model: pins), across every input shape.
check("no-pin: a concrete bare provider/model string is dropped", resolveModelPin("deepseek/deepseek-chat") === null);
check("no-pin: a per-platform {opencode} pin is dropped", resolveModelPin({ opencode: "deepseek/deepseek-chat" }) === null);
check("no-pin: 'auto' resolves to null", resolveModelPin("auto") === null);
check("no-pin: 'session' resolves to null", resolveModelPin("session") === null);
check("no-pin: absent (undefined) resolves to null", resolveModelPin(undefined) === null);
check("no-pin: a {claude}-only pin gives no opencode id", resolveModelPin({ claude: "opus" }) === null);

// A config skeleton with all three role agent ids (install() requires each).
const baseRoles = {
  orchestrator: { agent: "ai-dev" },
  builder: { agent: "dev-builder" },
};

function reviewerFrontmatter(reviewerModel) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-dev-bake-"));
  const config = { roles: { ...baseRoles, reviewer: { agent: "dev-reviewer", ...(reviewerModel !== undefined ? { model: reviewerModel } : {}) } } };
  const written = install(outDir, config);
  const text = fs.readFileSync(written["dev-reviewer"], "utf8");
  const fm = text.split("\n---")[0]; // the frontmatter block, before the body
  fs.rmSync(outDir, { recursive: true, force: true });
  return fm;
}

// 2. end-to-end: a concrete pin emits NO model line — the runtime ignores it, so
//    the install must not claim it (the honesty case this change locks).
check("no-bake: a concrete {opencode} pin emits no model line", !/^model:/m.test(reviewerFrontmatter({ opencode: "deepseek/deepseek-chat" })));
check("no-bake: a concrete bare-string pin emits no model line", !/^model:/m.test(reviewerFrontmatter("deepseek/deepseek-reasoner")));

// 3. end-to-end: auto / session / absent emit NO model line (already honest).
check("no-bake: 'auto' emits no model line", !/^model:/m.test(reviewerFrontmatter("auto")));
check("no-bake: 'session' emits no model line", !/^model:/m.test(reviewerFrontmatter("session")));
check("no-bake: absent model emits no model line", !/^model:/m.test(reviewerFrontmatter(undefined)));

console.log(`\nINSTALL-MODEL honesty: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log("PASS — no model line ever baked on OpenCode (runtime ignores subagent model:)");
