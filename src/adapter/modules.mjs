// The shared capability-module assembler. ONE copy of the compose logic, imported
// by BOTH install-agents shims (Claude + OpenCode) — mirrors how engine.mjs is the
// one home shared by both deny shims. A role agent is no longer a hand-authored
// monolith: it is a lean FLOOR body carrying a single marker (`<!-- ai-pm:modules -->`),
// and this helper REPLACES that marker with the enabled modules' fragments, in
// registry order. Toggle a module off and its fragment is simply not composed in.
//
// What is whose home (PROTOCOL.md manifesto, no duplication):
//   • the floor PROSE (always-on role text, e.g. the Reviewer's security item) lives
//     in src/agents/<role>.md and is NEVER a module fragment — the marker only ADDS;
//   • src/modules/registry.json carries the catalog (toggle shape · per-kind defaults · targets ·
//     fragment pointers), never floor prose;
//   • src/modules/<id>/<role>.md carries the DEEPENING a module adds to a role.
//
// HONESTY: a capability module is `[persona]` prompt content — it sharpens what the
// Builder/Reviewer THINK about; it blocks nothing at the tool-call layer (no deny
// rule). The architecture and registry label it so; this helper just assembles text.
//
// THREE security checks the assembler enforces (its own threat model):
//   1. a fragment pointer that escapes the repo root (absolute, or `..`-bearing) is
//      REJECTED — a typo'd/hostile pointer in the registry cannot read outside root
//      (invariant 2; mirrors the engine's isInsideRoot);
//   2. a fragment file NAMED by an ENABLED module but MISSING on disk is a HARD ERROR
//      — never silently ship a role missing its security section (the dangerous drop);
//   3. the fail-safe direction is toward MORE rigor: an unknown/malformed CONFIG
//      toggle, or an unknown/absent project kind, resolves the module ON with the
//      strict-side defaults — a bad config can never silently DISABLE the rigor.
//      The ONE default-OFF path is REGISTRY-authored: a per-kind default of literal
//      `false` (the registry is our data; the config is the untrusted input), and it
//      applies only while the config never names the module — any named config value
//      overrides it.

import fs from "node:fs";
import path from "node:path";

// ── path safety (mirrors engine.mjs isInsideRoot) ─────────────────────────────
function isInsideRoot(root, resolved) {
  const r = path.resolve(root);
  return resolved === r || resolved.startsWith(r + path.sep);
}

// Resolve a registry-relative fragment pointer against the root, REJECTING any
// pointer that is absolute or escapes the root. A fragment pointer is data in
// the registry; this is the trust boundary for it.
export function resolveFragmentPath(root, pointer) {
  if (typeof pointer !== "string" || pointer.length === 0) {
    throw new Error(`module fragment pointer is empty or not a string: ${JSON.stringify(pointer)}`);
  }
  if (path.isAbsolute(pointer)) {
    throw new Error(`module fragment pointer escapes root (absolute path): ${pointer}`);
  }
  const resolved = path.resolve(root, pointer);
  if (!isInsideRoot(root, resolved)) {
    throw new Error(`module fragment pointer escapes root: ${pointer}`);
  }
  return resolved;
}

// ── registry ──────────────────────────────────────────────────────────────────
export function loadRegistry(root) {
  return JSON.parse(fs.readFileSync(path.join(path.resolve(root), "src", "modules", "registry.json"), "utf8"));
}

// ── enabled-resolution (fail-safe to ON / strict side) ────────────────────────
// The project's kind (config.kind). Unknown/absent ⇒ the strict side: the kind
// whose defaults this module declares first, falling to "code" — mirrors the
// absent-`mode` ⇒ `interactive` fail-safe. A module's defaults map names the
// per-kind default toggle; an unknown kind takes the strictest declared default.
function strictKind(mod, kind) {
  const defaults = mod.defaults || {};
  if (kind && Object.prototype.hasOwnProperty.call(defaults, kind)) return kind;
  // Unknown/absent kind ⇒ the strict side. "code" is the attack-surface-heavy
  // kind; prefer it when declared, else the first declared default.
  if (Object.prototype.hasOwnProperty.call(defaults, "code")) return "code";
  const keys = Object.keys(defaults);
  return keys.length ? keys[0] : null;
}

// Is a config toggle value an explicit OFF? Only a literal `false` (or an object
// `{ enabled: false }`) disables. Every other NAMED value — true, an object, a
// malformed value — resolves the module ON (fail-safe to MORE rigor); an ABSENT key
// falls to the registry's per-kind default (defaultOffForKind). A bad/typo'd toggle
// can never silently disable the rigor.
function isExplicitlyOff(toggle) {
  if (toggle === false) return true;
  if (toggle && typeof toggle === "object" && toggle.enabled === false) return true;
  return false;
}

// Is the REGISTRY's per-kind default for this config an explicit OFF? A kind default
// of literal `false` (e.g. a docs project gets no UI module) defaults the module off
// for that kind — the ONE default-OFF path, and it is registry-authored (our data,
// never the untrusted config). Resolved through strictKind, so an unknown/absent kind
// takes the strict-side (code-preferred) default, never another kind's `false`.
function defaultOffForKind(mod, config) {
  const sk = strictKind(mod, config && config.kind);
  return sk !== null && (mod.defaults || {})[sk] === false;
}

// Compute the set of ENABLED module ids for this config, against the registry.
// Returns an array of { id, mod } in REGISTRY ORDER (stable, declared — not config
// order), so assembly is deterministic and reviewable.
export function enabledModules(registry, config) {
  const toggles = (config && config.modules) || {};
  const out = [];
  for (const mod of registry.modules || []) {
    const toggle = toggles[mod.id]; // undefined when the project never names it
    if (isExplicitlyOff(toggle)) continue; // the ONLY config-side way off; every other named value ⇒ on
    if (toggle === undefined && defaultOffForKind(mod, config)) continue; // registry kind-default OFF, config silent
    out.push({ id: mod.id, mod });
  }
  return out;
}

// Resolve the effective toggle VALUE a module runs with (its depth / nonSecurity /
// …), merging the per-kind default with any config override. Fail-safe: unknown
// kind ⇒ strict-side defaults. Exposed for setup and for tests; the fragment text
// itself is depth-agnostic in the skeleton (Slice 2 will branch on it).
export function effectiveToggle(mod, config) {
  const kind = config && config.kind;
  const sk = strictKind(mod, kind);
  const base = (mod.defaults && sk && mod.defaults[sk]) || {};
  const override = ((config && config.modules) || {})[mod.id];
  if (override && typeof override === "object") return { ...base, ...override };
  return { ...base };
}

// ── compose ─────────────────────────────────────────────────────────────────
export const MARKER = "<!-- ai-pm:modules -->";

// Apply the resolved DEPTH to a fragment's tagged checklist. A fragment marks each
// item with a leading code-span tag — `[light]` (the core subset every depth keeps)
// or `[rich]` (kept only at full depth). At light the rich lines are STRIPPED, so a
// light project gets
// genuinely less text — not the same prose with a label. The depth tags are then
// removed from the kept lines (they are an authoring signal, not reader prose), and a
// one-line banner names the resolved depth so the role knows which set it is reading.
// Fail-safe: anything other than the literal "light" ⇒ rich (the stricter side),
// mirroring the module's fail-safe-to-ON — a malformed depth can never silently thin
// the checklist.
function applyDepth(text, depth) {
  const light = depth === "light";
  const kept = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^(\s*[-*]\s*)`\[(light|rich)\]`\s*(.*)$/);
    if (!m) { kept.push(line); continue; }
    if (light && m[2] === "rich") continue; // rich-only item dropped at light depth
    kept.push(`${m[1]}${m[3]}`); // strip the authoring tag from a kept item
  }
  const banner = `> Depth: **${light ? "light" : "rich"}** — ${light ? "the core subset" : "the full enumeration"}.`;
  return kept.join("\n").replace(/\n\n+/g, "\n\n") + "\n\n" + banner;
}

// Read the fragment text a module contributes to a role, or null when the module
// does not target that role, with the module's resolved DEPTH applied. MISSING
// fragment for a targeted+enabled module is a HARD ERROR (never a silent drop).
// Path safety is enforced by resolveFragmentPath.
function fragmentFor(root, mod, role, config) {
  const pointer = mod.fragments && mod.fragments[role];
  if (!pointer) return null; // this module does not target this role
  const fpath = resolveFragmentPath(root, pointer);
  if (!fs.existsSync(fpath)) {
    throw new Error(
      `enabled module "${mod.id}" names a fragment for role "${role}" that is missing on disk: ${pointer}`
    );
  }
  const raw = fs.readFileSync(fpath, "utf8").trim();
  // A fragment carries depth tags only when its module declares a `depth` toggle; a
  // tag-free fragment is returned as-is (applyDepth is a no-op on untagged lines).
  return applyDepth(raw, effectiveToggle(mod, config).depth);
}

// Compose a role's FLOOR body with the enabled modules' fragments for that role.
// Replaces the single MARKER with the fragments (registry order, blank-line
// separated). A floor body WITHOUT the marker takes no fragments — a role a
// module does not target simply omits the marker and is returned unchanged.
export function composeBody(root, floorBody, role, registry, config) {
  const fragments = [];
  for (const { mod } of enabledModules(registry, config)) {
    const text = fragmentFor(root, mod, role, config);
    if (text) fragments.push(text);
  }
  if (!floorBody.includes(MARKER)) return floorBody; // no insertion point ⇒ no modules
  const block = fragments.join("\n\n");
  // Replace the marker AND its trailing newline. A non-empty block lands as its own
  // section followed by a blank line, so the next floor heading does not collide with
  // the fragment's last line; an empty block (no enabled module targets this role)
  // collapses the marker to nothing, leaving the floor's own spacing intact.
  const markerRe = new RegExp(MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\n?");
  return floorBody.replace(markerRe, block ? block + "\n\n" : "");
}
