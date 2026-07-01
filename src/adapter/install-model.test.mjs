// install-model bake test — the per-platform model-line bake contract, covering BOTH
// platforms because the two install-agents.mjs export a same-named resolveModelPin that
// differs precisely because the platforms differ:
//
// OPENCODE — NEVER bakes a reviewer `model:` line. The `task` runtime parses a subagent's
// `model:` frontmatter but does NOT apply it at execution (open upstream bugs #21632 /
// #17870 / #18615, no fix through our 1.17.7 — research:
// docs/decisions/opencode-task-capabilities.md Q1), so baking a concrete pin would claim a
// cross-model reviewer the runtime silently swallows. EVERY input — a concrete
// `provider/model` string, the per-platform `{opencode: …}` form, `auto`, `session`, or
// absent — resolves to NO `model:` line; the subagent inherits the session model, no false
// claim of cross-model independence.
//
// CLAUDE — DOES bake, because its `task` runtime honours a baked subagent `model:` (probe-
// verified; without the line a Claude subagent inherits the session model and the reviewer
// reviews under itself — the bug this path fixes). Resolved against the Claude model policy
// (tool-map.json `models.claude`, allow-list opus/sonnet/haiku): a concrete allow-listed pin
// (`opus`/`sonnet`/`haiku` or a `claude-<alias>-*` id) bakes that model; `session`/absent and
// an off-allowlist id bake NO line (honest inherit; never invent a model). `auto` bakes the
// model OPPOSITE the session — opus↔sonnet, never haiku — but ONLY in the VANILLA state (no
// concrete seat pin and no launch model anywhere); in a CUSTOMIZED config a reviewer `auto`
// (or absent ⇒ auto) degrades to `session` ⇒ NO line, because the opus↔sonnet guess is a
// fiction once the Operator makes any explicit model decision.
//
// (The WHY a cross-model reviewer is unavailable on OpenCode is documented for the Operator
// in orchestrator.md `## Your seat`, tool-map.json `models.opencode._note`, and the research
// doc above — not in the install log.) A regression that bakes on OpenCode, or stops baking
// on Claude, fails loudly here.
//
// Run: node src/adapter/install-model.test.mjs

import { install, resolveModelPin } from "./opencode/install-agents.mjs";
import {
  install as installClaude,
  resolveModelPin as resolveClaudePin,
  isVanilla,
} from "./claude/install-agents.mjs";
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

// ───────────────────────── Claude — DOES bake (additive) ─────────────────────────
// 4. resolveModelPin (Claude) — the real resolution against the live tool-map policy.
//    `auto` with a not-knowable session (orchestrator absent) → the opus-class default sonnet.
check("claude-pin: 'auto' (session not knowable) → claude-sonnet-4-6", resolveClaudePin("auto", undefined) === "claude-sonnet-4-6");
check("claude-pin: 'auto' opposite an opus session → claude-sonnet-4-6", resolveClaudePin("auto", "opus") === "claude-sonnet-4-6");
check("claude-pin: 'auto' opposite a sonnet session → claude-opus-4-8", resolveClaudePin("auto", "sonnet") === "claude-opus-4-8");
check("claude-pin: 'auto' opposite a claude-opus-* session id → claude-sonnet-4-6", resolveClaudePin("auto", "claude-opus-4-8") === "claude-sonnet-4-6");
// A1 — the full-id form of the sonnet session (the mirror of the line above); the
// 5.34.0 Reviewer named this edge as missing.
check("claude-pin: 'auto' opposite a claude-sonnet-* session id → claude-opus-4-8", resolveClaudePin("auto", "claude-sonnet-4-6") === "claude-opus-4-8");
check("claude-pin: alias 'sonnet' → canonical id claude-sonnet-4-6", resolveClaudePin("sonnet", undefined) === "claude-sonnet-4-6");
check("claude-pin: alias 'opus' → canonical id claude-opus-4-8", resolveClaudePin("opus", undefined) === "claude-opus-4-8");
check("claude-pin: a concrete claude-* id bakes verbatim", resolveClaudePin("claude-opus-4-8", undefined) === "claude-opus-4-8");
// haiku is now allow-listed (tool-map.json), so it BAKES like any other alias:
check("claude-pin: alias 'haiku' → canonical id claude-haiku-4-5", resolveClaudePin("haiku", undefined) === "claude-haiku-4-5");
check("claude-pin: a concrete claude-haiku-* id bakes verbatim", resolveClaudePin("claude-haiku-4-5", undefined) === "claude-haiku-4-5");
check("claude-pin: 'session' → null (honest inherit)", resolveClaudePin("session", undefined) === null);
check("claude-pin: absent (undefined) → null", resolveClaudePin(undefined, undefined) === null);
check("claude-pin: 'auto' never resolves to haiku (opposite stays opus↔sonnet)", resolveClaudePin("auto", "opus") !== "claude-haiku-4-5");
check("claude-pin: an off-allowlist id → null (never invent)", resolveClaudePin("claude-fictional-9-9", undefined) === null);
check("claude-pin: a non-claude pin → null", resolveClaudePin("deepseek/deepseek-chat", undefined) === null);

// 5. end-to-end: assert the REAL assembled Claude reviewer frontmatter carries (or omits)
//    the right `model:` line. Claude's install() also writes the orchestrator load surface
//    to outDir's PARENT, so a tmp dir keeps it isolated. `sessionModel` sets the
//    orchestrator's wish so the `auto` opposite is exercised. `opts` injects what moves the
//    config OUT of the vanilla state: `builderModel` (a concrete builder pin) and/or
//    `launch` (a launch-time model block) — both default unset, so the helper builds a
//    VANILLA config unless an opt is passed (the existing vanilla cases stay unchanged).
function claudeReviewerFrontmatter(reviewerModel, sessionModel, opts = {}) {
  // outDir nested under a tmp parent: Claude's install writes the orchestrator surface to
  // dirname(outDir), so the parent (not /tmp) is what gets cleaned up.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ai-dev-claude-bake-"));
  const outDir = path.join(tmp, "agents");
  const config = {
    roles: {
      orchestrator: { agent: "ai-dev", ...(sessionModel !== undefined ? { model: sessionModel } : {}) },
      builder: { agent: "dev-builder", ...(opts.builderModel !== undefined ? { model: opts.builderModel } : {}) },
      reviewer: { agent: "dev-reviewer", ...(reviewerModel !== undefined ? { model: reviewerModel } : {}) },
    },
    ...(opts.launch !== undefined ? { launch: opts.launch } : {}),
  };
  const written = installClaude(outDir, config);
  const text = fs.readFileSync(written["dev-reviewer"], "utf8");
  const fm = text.split("\n---")[0]; // the frontmatter block, before the body
  fs.rmSync(tmp, { recursive: true, force: true });
  return fm;
}

// `auto`'s opus↔sonnet OPPOSITE logic is unit-tested directly above (resolveClaudePin) and
// stays unchanged. END-TO-END through install(), an orchestrator pin (sessionModel) is now a
// CONCRETE model decision ⇒ the config is CUSTOMIZED ⇒ a reviewer `auto` degrades to session
// ⇒ NO line (the new vanilla-only-auto spec). So these formerly-baked e2e cases now bake NO
// line — the opposite resolution they once exercised is covered by the pure-resolver tests.
check("claude-bake: 'auto' with an opus orchestrator pin (customized) bakes NO line", !/^model:/m.test(claudeReviewerFrontmatter("auto", "opus")));
check("claude-bake: 'auto' with a sonnet orchestrator pin (customized) bakes NO line", !/^model:/m.test(claudeReviewerFrontmatter("auto", "sonnet")));
// VANILLA (no orchestrator pin, no other decision): `auto` still bakes the sonnet default.
check("claude-bake: 'auto' in a vanilla config bakes the sonnet default", /^model: claude-sonnet-4-6$/m.test(claudeReviewerFrontmatter("auto", undefined)));
check("claude-bake: a concrete allow-listed pin (sonnet) bakes model: claude-sonnet-4-6", /^model: claude-sonnet-4-6$/m.test(claudeReviewerFrontmatter("sonnet", undefined)));
check("claude-bake: a concrete claude-* id bakes that line verbatim", /^model: claude-opus-4-8$/m.test(claudeReviewerFrontmatter("claude-opus-4-8", undefined)));
check("claude-bake: 'session' bakes NO model line", !/^model:/m.test(claudeReviewerFrontmatter("session", undefined)));
// A2 — an ABSENT reviewer model defaults to `auto` (cross-model-review.md: absent ⇒
// auto), so a no-pin reviewer still cross-models. This REPLACES the pre-A2 expectation
// (absent ⇒ no line): the reviewer-defaults-to-auto contract clause the 5.34.0 Reviewer
// flagged. The pure resolver still returns null for absent (asserted above) — the
// default is applied at the reviewer seat in install(), not in resolveModelPin.
check("claude-bake: absent reviewer (defaults to auto) in a vanilla config bakes the sonnet default", /^model: claude-sonnet-4-6$/m.test(claudeReviewerFrontmatter(undefined, undefined)));
// An orchestrator pin makes the config customized, so the absent⇒auto reviewer degrades to session ⇒ NO line:
check("claude-bake: absent reviewer WITH a sonnet orchestrator pin (customized) bakes NO line", !/^model:/m.test(claudeReviewerFrontmatter(undefined, "sonnet")));
// haiku is now allow-listed → a reviewer pinned haiku BAKES (flips the old off-allowlist case):
check("claude-bake: a reviewer pinned 'haiku' bakes model: claude-haiku-4-5", /^model: claude-haiku-4-5$/m.test(claudeReviewerFrontmatter("haiku", undefined)));
check("claude-bake: a reviewer pinned a claude-haiku-* id bakes that line verbatim", /^model: claude-haiku-4-5$/m.test(claudeReviewerFrontmatter("claude-haiku-4-5", undefined)));
check("claude-bake: a still-off-allowlist id bakes NO model line", !/^model:/m.test(claudeReviewerFrontmatter("claude-fictional-9-9", undefined)));

// ───────── 6. isVanilla + the customized-state `auto` degrade (the new spec) ─────────
// isVanilla — `session`/`auto`/absent are NOT explicit decisions (stay vanilla); a concrete
// seat pin OR a non-empty launch model is (customized).
check("isVanilla: bare config (no models) → vanilla", isVanilla({ roles: { orchestrator: { agent: "ai-dev" }, builder: { agent: "b" }, reviewer: { agent: "r" } } }) === true);
check("isVanilla: reviewer 'auto' alone → still vanilla", isVanilla({ roles: { reviewer: { agent: "r", model: "auto" } } }) === true);
check("isVanilla: a 'session' seat → still vanilla", isVanilla({ roles: { builder: { agent: "b", model: "session" } } }) === true);
check("isVanilla: empty/whitespace launch models → still vanilla", isVanilla({ launch: { sessionModel: "", guardModel: "  " } }) === true);
check("isVanilla: a concrete builder pin → customized", isVanilla({ roles: { builder: { agent: "b", model: "sonnet" } } }) === false);
check("isVanilla: a concrete orchestrator pin → customized", isVanilla({ roles: { orchestrator: { agent: "ai-dev", model: "opus" } } }) === false);
check("isVanilla: a non-empty launch.sessionModel → customized", isVanilla({ launch: { sessionModel: "deepseek-chat" } }) === false);
check("isVanilla: a non-empty launch.guardModel → customized", isVanilla({ launch: { guardModel: "claude-haiku-4-5" } }) === false);
// A tier-alias binding is an explicit cross-endpoint decision ⇒ customized (auto no longer honest).
check("isVanilla: a launch.aliases tier binding → customized", isVanilla({ launch: { aliases: { sonnet: "glm-4.6" } } }) === false);
check("isVanilla: empty/whitespace alias tiers → still vanilla", isVanilla({ launch: { aliases: { sonnet: "", haiku: "  " } } }) === true);
check("isVanilla: non-object aliases → still vanilla (fail-safe, no crash)", isVanilla({ launch: { aliases: "nope" } }) === true);

// end-to-end: in a CUSTOMIZED config, a reviewer `auto` / absent ⇒ degrades to session ⇒ NO line.
check("claude-bake: reviewer 'auto' WITH a concrete builder pin (customized) bakes NO line", !/^model:/m.test(claudeReviewerFrontmatter("auto", undefined, { builderModel: "sonnet" })));
check("claude-bake: ABSENT reviewer WITH a concrete builder pin (customized) bakes NO line", !/^model:/m.test(claudeReviewerFrontmatter(undefined, undefined, { builderModel: "sonnet" })));
check("claude-bake: reviewer 'auto' WITH a launch model (customized) bakes NO line", !/^model:/m.test(claudeReviewerFrontmatter("auto", undefined, { launch: { sessionModel: "deepseek-chat" } })));
check("claude-bake: ABSENT reviewer WITH a launch model (customized) bakes NO line", !/^model:/m.test(claudeReviewerFrontmatter(undefined, undefined, { launch: { guardModel: "claude-haiku-4-5" } })));
// but a CONCRETE reviewer pin in a customized config still bakes (the explicit choice is honored):
check("claude-bake: a concrete reviewer pin in a customized config still bakes", /^model: claude-opus-4-8$/m.test(claudeReviewerFrontmatter("opus", undefined, { builderModel: "sonnet" })));

console.log(`\nINSTALL-MODEL bake: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log("PASS — OpenCode bakes no line (runtime ignores subagent model:); Claude bakes the resolved per-seat model");
