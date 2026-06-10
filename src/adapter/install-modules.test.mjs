// Capability-module assembly test — proves the SHARED assembler (src/adapter/modules.mjs)
// composes a module's fragment into a role agent, omits it when off, never drops the
// floor, fails SAFE to ON, and enforces its two security guards (missing-fragment
// hard error, root-escape rejection). The mechanism is BINARY — a module toggles and
// the assembled agent provably gains/loses its section — so this is the Slice-1 DoD.
// Both install shims (Claude + OpenCode) share the one compose helper, so the
// resolver is tested directly AND through one shim end-to-end.
//
// Run: node src/adapter/install-modules.test.mjs

import {
  loadRegistry, enabledModules, effectiveToggle,
  resolveFragmentPath, composeBody, MARKER,
} from "./modules.mjs";
import { install as claudeInstall } from "./claude/install-agents.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const registry = loadRegistry(ROOT);

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.log(`  ✗ ${name}`); }
}

// The fragment text's distinguishing marker (present iff the module composed in).
const FRAGMENT_MARK = "The **threat-model** module is on";
// A floor-body distinguishing line — must be present under EVERY config.
const REVIEWER_FLOOR = "a security-relevant change names its threats";
// A `[rich]`-only checklist item — present at rich depth, STRIPPED at light depth.
const RICH_ONLY = "Supply chain";
// A `[light]`-core item — present at EVERY depth.
const LIGHT_CORE = "Attack surface";

// ── 1. enabledModules — the resolver's on/off decision ────────────────────────
console.log("RESOLVER — enabled/disabled + fail-safe-to-ON:");
check("on: an object toggle ⇒ enabled",
  enabledModules(registry, { modules: { "threat-model": { depth: "rich" } } }).some((m) => m.id === "threat-model"));
check("on: true ⇒ enabled",
  enabledModules(registry, { modules: { "threat-model": true } }).some((m) => m.id === "threat-model"));
check("on: absent modules key ⇒ enabled (per-kind default)",
  enabledModules(registry, { kind: "software" }).some((m) => m.id === "threat-model"));
check("off: literal false ⇒ disabled",
  !enabledModules(registry, { modules: { "threat-model": false } }).some((m) => m.id === "threat-model"));
check("off: { enabled: false } ⇒ disabled",
  !enabledModules(registry, { modules: { "threat-model": { enabled: false } } }).some((m) => m.id === "threat-model"));
// FAIL-SAFE: a malformed/unknown toggle value (string, number, null) ⇒ ON (strict side).
for (const bad of ["garbage", 42, null]) {
  check(`fail-safe-to-ON: malformed toggle ${JSON.stringify(bad)} ⇒ enabled`,
    enabledModules(registry, { modules: { "threat-model": bad } }).some((m) => m.id === "threat-model"));
}

// ── 2. effectiveToggle — per-kind defaults + strict fallback ──────────────────
console.log("RESOLVER — per-kind defaults:");
const tm = registry.modules.find((m) => m.id === "threat-model");
check("default: software ⇒ rich", effectiveToggle(tm, { kind: "software" }).depth === "rich");
check("default: documentation ⇒ light", effectiveToggle(tm, { kind: "documentation" }).depth === "light");
check("default: unknown kind ⇒ strict side (software/rich)", effectiveToggle(tm, { kind: "bogus" }).depth === "rich");
check("default: absent kind ⇒ strict side (software/rich)", effectiveToggle(tm, {}).depth === "rich");
check("override: config value overrides the kind default",
  effectiveToggle(tm, { kind: "software", modules: { "threat-model": { depth: "light" } } }).depth === "light");

// ── 3. composeBody — compose / omit / floor-always / no-marker ────────────────
console.log("COMPOSE — fragment in/out, floor always present:");
const reviewerFloor = fs.readFileSync(path.join(ROOT, "src", "agents", "reviewer.md"), "utf8");
const orchFloor = fs.readFileSync(path.join(ROOT, "src", "agents", "orchestrator.md"), "utf8");

const composedOn = composeBody(ROOT, reviewerFloor, "reviewer", registry, { modules: { "threat-model": { depth: "rich" } } });
check("compose: enabled ⇒ fragment text present", composedOn.includes(FRAGMENT_MARK));
check("compose: enabled ⇒ marker consumed (not left in output)", !composedOn.includes(MARKER));
check("compose: enabled ⇒ floor still present", composedOn.includes(REVIEWER_FLOOR));

const composedOff = composeBody(ROOT, reviewerFloor, "reviewer", registry, { modules: { "threat-model": false } });
check("omit: disabled ⇒ fragment text absent", !composedOff.includes(FRAGMENT_MARK));
check("omit: disabled ⇒ marker consumed (no leftover comment)", !composedOff.includes(MARKER));
check("omit: disabled ⇒ floor STILL present", composedOff.includes(REVIEWER_FLOOR));

// Floor always present under every config shape, including malformed.
for (const cfg of [{}, { modules: {} }, { modules: { "threat-model": "garbage" } }, { kind: "documentation" }]) {
  check(`floor-always: ${JSON.stringify(cfg)} ⇒ floor present`,
    composeBody(ROOT, reviewerFloor, "reviewer", registry, cfg).includes(REVIEWER_FLOOR));
}

// ── 3b. DEPTH — rich composes the full enumeration, light the core subset only ──
console.log("DEPTH — rich vs light (light gets genuinely less):");
function reviewerComposed(modulesCfg) {
  return composeBody(ROOT, reviewerFloor, "reviewer", registry, modulesCfg);
}
const richBody = reviewerComposed({ kind: "software", modules: { "threat-model": { depth: "rich" } } });
check("rich: light-core item present", richBody.includes(LIGHT_CORE));
check("rich: rich-only item present", richBody.includes(RICH_ONLY));
check("rich: banner names rich depth", richBody.includes("Depth: **rich**"));
check("rich: no authoring tag leaks into composed prose", !/\[(light|rich)\]/.test(richBody));

const lightBody = reviewerComposed({ kind: "software", modules: { "threat-model": { depth: "light" } } });
check("light: light-core item present", lightBody.includes(LIGHT_CORE));
check("light: rich-only item STRIPPED", !lightBody.includes(RICH_ONLY));
check("light: banner names light depth", lightBody.includes("Depth: **light**"));
check("light: genuinely shorter than rich", lightBody.length < richBody.length);

// Per-kind default drives depth with no explicit override: documentation ⇒ light.
const docDefault = reviewerComposed({ kind: "documentation" });
check("depth-default: documentation kind ⇒ light (rich-only stripped)", !docDefault.includes(RICH_ONLY));
const swDefault = reviewerComposed({ kind: "software" });
check("depth-default: software kind ⇒ rich (rich-only kept)", swDefault.includes(RICH_ONLY));

// FAIL-SAFE: a malformed/unknown depth ⇒ rich (the stricter side) — never silently thin.
for (const bad of ["garbage", "LIGHT", "", 42, null]) {
  const body = reviewerComposed({ kind: "software", modules: { "threat-model": { depth: bad } } });
  check(`depth fail-safe: depth ${JSON.stringify(bad)} ⇒ rich (rich-only kept)`, body.includes(RICH_ONLY));
}

// A floor body with NO marker (the orchestrator — no module targets it) is returned
// unchanged and does NOT error.
const orchOut = composeBody(ROOT, orchFloor, "orchestrator", registry, { modules: { "threat-model": true } });
check("no-marker: orchestrator body returned unchanged", orchOut === orchFloor);
check("no-marker: orchestrator gains no fragment", !orchOut.includes(FRAGMENT_MARK));

// ── 4. SECURITY: missing-fragment is a HARD ERROR (never a silent drop) ───────
console.log("SECURITY — missing fragment, root escape:");
{
  // A synthetic registry whose enabled module points at a fragment that does not exist.
  const badRegistry = { modules: [{ id: "ghost", fragments: { reviewer: "src/modules/ghost/reviewer.md" } }] };
  let threw = false;
  try { composeBody(ROOT, reviewerFloor, "reviewer", badRegistry, { modules: { ghost: true } }); }
  catch (_e) { threw = true; }
  check("missing-fragment: enabled module with absent fragment ⇒ throws", threw);
}

// ── 5. SECURITY: a root-escaping fragment pointer is REJECTED ─────────────────
check("root-escape: absolute pointer ⇒ throws", (() => {
  try { resolveFragmentPath(ROOT, "/etc/passwd"); return false; } catch (_e) { return true; }
})());
check("root-escape: `..`-bearing pointer ⇒ throws", (() => {
  try { resolveFragmentPath(ROOT, "../outside.md"); return false; } catch (_e) { return true; }
})());
check("root-escape: empty pointer ⇒ throws", (() => {
  try { resolveFragmentPath(ROOT, ""); return false; } catch (_e) { return true; }
})());
check("in-root pointer resolves", resolveFragmentPath(ROOT, "src/modules/threat-model/reviewer.md").startsWith(ROOT));
// A root-escaping pointer carried by an ENABLED module also fails at compose time.
{
  const escRegistry = { modules: [{ id: "esc", fragments: { reviewer: "../escape.md" } }] };
  let threw = false;
  try { composeBody(ROOT, reviewerFloor, "reviewer", escRegistry, { modules: { esc: true } }); }
  catch (_e) { threw = true; }
  check("root-escape: enabled module with escaping pointer ⇒ throws at compose", threw);
}

// ── 6. END-TO-END through a real shim (Claude) — the deployed agent gains/loses
//      the section, floor intact. Proves the shared helper is wired into install().
console.log("END-TO-END — Claude install composes the module:");
const baseRoles = { builder: { agent: "pm-builder" }, reviewer: { agent: "pm-reviewer" } };
function reviewerAgentText(modulesCfg) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-pm-modtest-"));
  const written = claudeInstall(outDir, { roles: baseRoles, kind: "software", ...modulesCfg });
  const text = fs.readFileSync(written["pm-reviewer"], "utf8");
  fs.rmSync(outDir, { recursive: true, force: true });
  return text;
}
const e2eOn = reviewerAgentText({ modules: { "threat-model": { depth: "rich" } } });
check("e2e: ON ⇒ assembled agent carries the fragment", e2eOn.includes(FRAGMENT_MARK));
check("e2e: ON ⇒ assembled agent carries the floor", e2eOn.includes(REVIEWER_FLOOR));
check("e2e: ON ⇒ no leftover marker in deployed agent", !e2eOn.includes(MARKER));
const e2eOff = reviewerAgentText({ modules: { "threat-model": false } });
check("e2e: OFF ⇒ assembled agent omits the fragment", !e2eOff.includes(FRAGMENT_MARK));
check("e2e: OFF ⇒ assembled agent keeps the floor", e2eOff.includes(REVIEWER_FLOOR));

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
