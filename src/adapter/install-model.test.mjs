// OpenCode install-bake test — proves the reviewer-model bake and its honesty
// contract (src/adapter/opencode/install-agents.mjs). UNLIKE Claude (the orchestrator
// resolves the model and passes it at the spawn), OpenCode has no per-spawn model
// arg for a subagent, so a cross-model reviewer is realised at install by baking a
// `model:` line into the assembled frontmatter. The contract this locks:
//   • a CONCRETE pin (a `provider/model` string, or the per-platform `{opencode: …}`
//     form) ⇒ the assembled reviewer frontmatter carries exactly that `model:` line;
//   • `auto` / `session` / absent ⇒ NO `model:` line — honest zero-config same-model
//     review, no false claim of cross-model independence.
// A regression in either direction fails loudly here.
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

// 1. resolveModelPin — the pure pin-resolution across every input shape.
check("pin: bare provider/model string resolves", resolveModelPin("deepseek/deepseek-chat") === "deepseek/deepseek-chat");
check("pin: per-platform {opencode} form resolves", resolveModelPin({ opencode: "deepseek/deepseek-chat" }) === "deepseek/deepseek-chat");
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

// 2. end-to-end: a concrete pin is baked into the assembled reviewer frontmatter.
const pinned = reviewerFrontmatter({ opencode: "deepseek/deepseek-chat" });
check("bake: concrete pin emits the exact model line", /^model: deepseek\/deepseek-chat$/m.test(pinned));

const pinnedBare = reviewerFrontmatter("deepseek/deepseek-reasoner");
check("bake: bare-string pin emits the exact model line", /^model: deepseek\/deepseek-reasoner$/m.test(pinnedBare));

// 3. end-to-end: auto / session / absent emit NO model line (the honesty case).
check("no-bake: 'auto' emits no model line", !/^model:/m.test(reviewerFrontmatter("auto")));
check("no-bake: 'session' emits no model line", !/^model:/m.test(reviewerFrontmatter("session")));
check("no-bake: absent model emits no model line", !/^model:/m.test(reviewerFrontmatter(undefined)));

console.log(`\nINSTALL-MODEL bake: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log("PASS — pin baked, auto/session/absent stay model-free");
