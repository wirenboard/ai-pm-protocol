// OpenCode inject-APPLICATION test — the lesson of the live-run defect. The parity
// test proves the shared engine DECIDES "inject"; it never proved the OpenCode
// adapter APPLIES it. That gap shipped a plugin with NO prompt hook to a live run:
// the engine returned inject, nothing pushed it, the nudge never reached the model.
//
// This test drives the plugin's `chat.message` hook DIRECTLY against the deployed
// plugin (.opencode/plugins/ai-dev.mjs — the module OpenCode actually loads) and
// asserts the SIDE EFFECT: a no-config root + a change-verb message ⇒ output.parts
// gains the reminder; a configured root OR a non-change message ⇒ no part pushed.
// It asserts application, not decision — the decision is parity.test.mjs's job.
//
// Run: node src/adapter/opencode-inject.test.mjs

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AiPmEnforcement } from "../../.opencode/plugins/ai-dev.mjs";

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}`); }
}

// Build the hook set for a given project root (the plugin reads ctx.directory as
// the root). No client → isOrchestrator fails open to false, which is fine: the
// prompt-class rules here do not depend on the actor.
async function hooksFor(root) {
  return AiPmEnforcement({ directory: root });
}

// Drive chat.message with a single text part carrying `userText`; return the parts
// array AFTER the hook ran (the plugin mutates it in place).
async function runChat(hooks, userText) {
  const output = { parts: [{ type: "text", text: userText }] };
  await hooks["chat.message"]({ sessionID: "s1" }, output);
  return output.parts;
}

function injectedReminder(parts) {
  // The reminder is any text part beyond the original user message.
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

// A change-verb message — must match deny-rules.json change_verbs (single source).
const CHANGE_MSG = "please implement the new export feature";
const PLAIN_MSG = "good morning, how are you";

// ── 1. the hook is registered at all (the exact bug: it was absent) ───────────
const tmpUnconfigured = fs.mkdtempSync(path.join(os.tmpdir(), "ai-dev-oc-nocfg-"));
const hooks = await hooksFor(tmpUnconfigured);
check("chat.message hook is registered", typeof hooks["chat.message"] === "function");
check("tool.execute.before hook still registered", typeof hooks["tool.execute.before"] === "function");

// ── 2. no-config root + change verb ⇒ a reminder part is pushed ───────────────
const partsNoCfgChange = await runChat(hooks, CHANGE_MSG);
const reminder = injectedReminder(partsNoCfgChange);
check("no-config + change-verb ⇒ a part is pushed", reminder !== null);
check("the pushed part is a text part", reminder && reminder.type === "text" && typeof reminder.text === "string");
check("the pushed part is non-empty", reminder && reminder.text.length > 0);
check("original user part is untouched", partsNoCfgChange[0].text === CHANGE_MSG);

// ── 3. no-config root + NON-change message ⇒ nothing pushed ───────────────────
const partsNoCfgPlain = await runChat(hooks, PLAIN_MSG);
check("no-config + non-change ⇒ no part pushed", partsNoCfgPlain.length === 1);

// ── 4. configured root + change verb ⇒ still a part pushed ─────────────────────
// A configured project gets a later-stage inject instead of the setup nudge (with
// no docs/product.md at all, the discovery nudge) — still an inject, so a part is
// still pushed. WHICH nudge is pinned by cases 5b/5c below via the part text.
const tmpConfigured = fs.mkdtempSync(path.join(os.tmpdir(), "ai-dev-oc-cfg-"));
fs.writeFileSync(path.join(tmpConfigured, "ai-dev.config.json"), "{}");
const hooksCfg = await hooksFor(tmpConfigured);
const partsCfgChange = await runChat(hooksCfg, CHANGE_MSG);
check("configured + change-verb ⇒ a part is pushed", partsCfgChange.length === 2);

// ── 5. configured root + non-change ⇒ nothing pushed ──────────────────────────
const partsCfgPlain = await runChat(hooksCfg, PLAIN_MSG);
check("configured + non-change ⇒ no part pushed", partsCfgPlain.length === 1);

// ── 5b. configured + brief still the TEMPLATE ⇒ the discovery part is pushed ───
// The 4.18.0 fix applied end to end: install.mjs lands docs/product.md as the
// template verbatim, so a template-state brief must still draw the discovery
// nudge — before the fix, presence alone silenced it on every real install. The
// REAL template file drives the case; the part text pins WHICH nudge was applied.
const tmpTemplate = fs.mkdtempSync(path.join(os.tmpdir(), "ai-dev-oc-tmpl-"));
fs.writeFileSync(path.join(tmpTemplate, "ai-dev.config.json"), "{}");
fs.mkdirSync(path.join(tmpTemplate, "docs"));
fs.writeFileSync(path.join(tmpTemplate, "docs", "product.md"), fs.readFileSync(new URL("../templates/product.md", import.meta.url)));
const hooksTmpl = await hooksFor(tmpTemplate);
const partsTmplChange = await runChat(hooksTmpl, CHANGE_MSG);
const tmplPart = injectedReminder(partsTmplChange);
check("configured + template brief + change-verb ⇒ a part is pushed", tmplPart !== null);
check("the template-brief part is the discovery nudge", tmplPart !== null && tmplPart.text.includes("product-discovery"));

// ── 5c. configured + FILLED brief ⇒ the route-reminder part is pushed ──────────
const tmpFilled = fs.mkdtempSync(path.join(os.tmpdir(), "ai-dev-oc-filled-"));
fs.writeFileSync(path.join(tmpFilled, "ai-dev.config.json"), "{}");
fs.mkdirSync(path.join(tmpFilled, "docs"));
fs.writeFileSync(path.join(tmpFilled, "docs", "product.md"), "# Product brief\n\nA real, filled brief.\n");
const hooksFilled = await hooksFor(tmpFilled);
const partsFilledChange = await runChat(hooksFilled, CHANGE_MSG);
const filledPart = injectedReminder(partsFilledChange);
check("configured + filled brief + change-verb ⇒ a part is pushed", filledPart !== null);
check("the filled-brief part is the route reminder", filledPart !== null && filledPart.text.includes("follow the loop"));

// ── 6. a message with no text parts ⇒ no crash, no part ───────────────────────
const emptyOutput = { parts: [] };
await hooks["chat.message"]({ sessionID: "s1" }, emptyOutput);
check("empty parts ⇒ no crash, no part pushed", emptyOutput.parts.length === 0);

// cleanup
fs.rmSync(tmpUnconfigured, { recursive: true, force: true });
fs.rmSync(tmpConfigured, { recursive: true, force: true });
fs.rmSync(tmpTemplate, { recursive: true, force: true });
fs.rmSync(tmpFilled, { recursive: true, force: true });

console.log(`\nOPENCODE-INJECT: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log("PASS — the OpenCode chat.message hook APPLIES the inject verdict (part pushed)");
