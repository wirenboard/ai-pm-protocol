// Claude realisation of the adapter's `spawn-a-sub-agent` contract point.
// Assembles each platform-neutral role FLOOR body (src/agents/<role>.md) + the enabled
// capability modules' fragments (composed at the body's `<!-- ai-dev:modules -->`
// marker by the SHARED assembler, src/adapter/modules.mjs) + the Claude per-role
// frontmatter (src/adapter/claude/agents/<role>.fm) into a spawnable Claude agent file
// (.claude/agents/<agentId>.md). Concatenation + module-compose, NOT a generator:
// the neutral floor body is the single source, the modules add their deepening, the
// .fm adds only Claude's frontmatter, and the agent id comes from .ai-dev/config.json
// `roles` (its single home — name is injected, never duplicated in the .fm). The
// module-compose logic is the ONE home shared with the OpenCode shim — never copied
// here (mirrors how engine.mjs is shared by both deny shims).
//
// PER-SEAT MODEL BAKE (Claude only): each spawnable role's `config.roles[role].model`
// wish is resolved against the Claude model policy (tool-map.json `models.claude`) and,
// when it yields a model, baked as a `model:` frontmatter line. Claude forwards a baked
// subagent `model:` to the endpoint, so this line is what actually makes the reviewer
// run on a model different from the session (without it a Claude subagent inherits the
// session model — the bug this path fixes: the reviewer reviewed under itself). The
// resolution lives in resolveModelPin below (the Claude-side mirror of OpenCode's
// same-named export — intentionally per-platform: OpenCode ALWAYS returns null because
// its `task` runtime ignores a subagent's model:, Claude resolves a real pin because it
// honours one). `session` and an off-allowlist id bake no line (honest inherit;
// never invent a model). The orchestrator is never baked — it IS the session. The
// REVIEWER is the one seat whose ABSENT model defaults to `auto` (so a no-pin reviewer
// still cross-models — the cross-model-review contract); that default is applied in
// install() at the reviewer seat, NOT in resolveModelPin (the pure resolver keeps
// absent ⇒ null). Every other seat absent ⇒ no line ⇒ session inherit.
//
// The Claude allow-list is the SET fable/opus/sonnet/haiku (tool-map.json `models.claude`),
// not a fixed pair — a haiku (or fable) pin bakes like any other allow-listed alias (its
// resolveModelPin path is automatic, aliasOf already loops the whole `allow`, so a 4th tier
// needs no code here). `auto`'s opposite logic itself stays opus↔sonnet (it never picks
// haiku or fable, non-review-grade / non-default slots for the automatic cross-model guess). `auto` is a VANILLA-ONLY convenience: it cross-models out of the box, but the
// opus↔sonnet guess is a fiction the moment the Operator makes any explicit model
// decision (a concrete seat pin, or a launch model — the proxy/alias world). So when the
// config is NOT vanilla (isVanilla below), a reviewer `auto` is degraded to `session` in
// install() — no baked line, an honest inherit, no false cross-model claim. The gate
// lives at the reviewer seat in install(), beside the absent⇒auto default, so the pure
// resolveModelPin stays "auto ⇒ opposite".
//
// The ORCHESTRATOR is special on Claude: it IS the session (held by CLAUDE.md), NOT a
// spawnable subagent. Claude auto-registers subagents from `.claude/agents/` ONLY — so a
// file there would wrongly surface the orchestrator as a spawnable `ai-dev` agent. We
// therefore assemble its body too (so the SAME composeBody platform filter that runs on
// the spawnable agents and on the OpenCode default_agent also runs here — dropping the
// inactive `platform:opencode` blocks), but write it to a NEUTRAL committed path OUTSIDE
// the agents dir (`.claude/ai-dev.md`, a sibling of outDir), which CLAUDE.md @imports as
// the session's instructions. Mirrors the OpenCode side's committed+drift-guarded
// `.opencode/agents/ai-dev.md`; the drift guard for this file is install-drift.test.mjs.
//
// Run from the repo root: node src/adapter/claude/install-agents.mjs [outDir]
//   outDir defaults to .claude/agents/ (pass a temp dir to dry-run); the orchestrator
//   load surface is written to outDir's PARENT as ai-dev.md.
//   AI_DEV_CONFIG lets a test drive a fixture config without mutating the repo's.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRegistry, composeBody } from "../modules.mjs";
import { loadConfigWithLocal } from "../router-launch.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SPAWNABLE = ["planner", "builder", "reviewer"];
const TOOL_MAP = path.join(ROOT, "src", "adapter", "tool-map.json");
// The orchestrator load-surface filename is FIXED (not keyed on the configurable agent id):
// CLAUDE.md @imports it by a stable string in both dogfood and downstream modes. Unlike the
// OpenCode default_agent (a real registered agent keyed on its id), the Claude orchestrator
// is the SESSION, so a stable load-surface name is what the import must point at.
const ORCHESTRATOR_FILE = "ai-dev.md";

// The Claude model policy from tool-map.json `models.claude` — the single data home for
// the allow-listed model space (`allow`) and the alias→canonical-id map (`ids`) the
// installer bakes. Read here, never re-listed: a new Claude model is added to that data,
// not to this code.
export function loadClaudeModelPolicy() {
  return JSON.parse(fs.readFileSync(TOOL_MAP, "utf8")).models.claude;
}

// Map a model WISH to its allow-listed Claude alias, or null when not knowable / not
// allow-listed. An alias (`fable`/`opus`/`sonnet`/`haiku`) maps to itself; a concrete
// `claude-<alias>-*` id maps to the alias of its family; everything else (`session`,
// `auto`, absent, or an off-allowlist id) is null. Loops the whole `allow` set, so a new
// allow-listed model resolves for free with no code change here.
export function aliasOf(wish, policy) {
  if (typeof wish !== "string") return null;
  if (policy.allow.includes(wish)) return wish;
  for (const alias of policy.allow) {
    if (wish.startsWith(`claude-${alias}-`)) return alias;
  }
  return null;
}

// Resolve a role's `model` wish to the model id to BAKE as a `model:` line, or null for
// no line. Per the Claude model policy (tool-map.json `models.claude`):
//   • `session` / absent      → null  (honest explicit inherit = the session model)
//   • a bare tier alias (`fable`/`opus`/`sonnet`/`haiku`) → the CONCRETE id when that tier is
//     NATIVE, but the BARE ALIAS itself when the tier is bound FOREIGN (see below).
//   • a concrete `claude-<alias>-*` id → that model verbatim (an explicit native pick)
//   • `auto`                  → the cross-model: the model OPPOSITE the orchestrator/
//     session wish — opus↔sonnet — when knowable from config, ELSE `sonnet` (the
//     documented opus-class-session default). `auto` never resolves to haiku; and it is
//     honored only in the vanilla state — the install() gate degrades it to `session`
//     in a customized config (it never reaches resolveModelPin as `auto` there).
//   • off-allowlist / unknown → null  (never invent a model)
//
// BARE ALIAS vs CONCRETE ID — the cross-endpoint mechanic (VERIFIED, docs/decisions/
// multi-model-setup-ux.md papercuts 13+14). Claude Code's `ANTHROPIC_DEFAULT_{FABLE,OPUS,
// SONNET,HAIKU}_MODEL` env vars override ALIAS resolution ONLY: a baked `model: opus` (a BARE
// alias) resolves THROUGH `ANTHROPIC_DEFAULT_OPUS_MODEL` (→ the foreign model a tier is
// bound to), while a baked `model: claude-opus-4-8` (a CONCRETE id) is used VERBATIM and
// bypasses the alias env (stays native). So a baked seat routed to a foreign provider MUST
// carry the bare alias, never the concrete id. `boundTiers` is the config's
// `launch.aliases` map ({ fable?, opus?, sonnet?, haiku? } → foreign id); when the seat's tier has
// a non-empty binding there, we bake the bare alias (routes foreign); otherwise the
// concrete id (native passthrough, immune to any stray alias env). Absent boundTiers ⇒ the
// common native case ⇒ concrete id, byte-identical to before this param existed.
//
// `sessionWish` is the orchestrator's `model` wish; the orchestrator IS the session, so a
// `session`/`auto`/absent orchestrator wish is "session model not knowable from config".
export function resolveModelPin(wish, sessionWish, policy = loadClaudeModelPolicy(), boundTiers = {}) {
  if (wish === undefined || wish === null || wish === "session") return null;
  if (wish === "auto") {
    const session = aliasOf(sessionWish, policy);
    const opposite = session === "opus" ? "sonnet"
      : session === "sonnet" ? "opus"
      : "sonnet"; // session not knowable from config → documented opus-class default
    return policy.ids[opposite];
  }
  const alias = aliasOf(wish, policy);
  if (!alias) return null; // off-allowlist / unknown → no line, never invent
  if (wish.startsWith("claude-")) return wish; // a concrete id is an explicit native pick — verbatim
  // A bare tier alias: bake the BARE ALIAS when that tier is bound foreign (so Claude
  // resolves it through ANTHROPIC_DEFAULT_<TIER>_MODEL → the foreign model), else the
  // CONCRETE native id (passthrough, immune to any alias env).
  const bound = boundTiers && typeof boundTiers[alias] === "string" && boundTiers[alias].trim() !== "";
  return bound ? alias : policy.ids[alias];
}

// Is the config in the VANILLA state — no explicit model decision anywhere? Vanilla =
// NO concrete pin on builder/reviewer/orchestrator (each `model` absent / `session` /
// `auto`) AND every `launch` model setting empty/whitespace — `sessionModel`, `guardModel`,
// AND every `launch.aliases` tier binding. Only in the vanilla state is the reviewer's
// `auto` honored (the opus↔sonnet cross-model guess
// is a safe out-of-box default ONLY on stock Claude Code where that pair is guaranteed).
// Any explicit decision — a concrete seat pin OR a launch model — moves the config to the
// CUSTOMIZED state, where `auto` degrades to `session` (install() applies it). A `session`
// or `auto` wish is NOT a concrete decision (it is the absence of one), so it does not
// break vanilla.
export function isVanilla(config) {
  const roles = config.roles ?? {};
  for (const role of ["builder", "reviewer", "orchestrator"]) {
    const wish = roles[role]?.model;
    if (wish !== undefined && wish !== null && wish !== "session" && wish !== "auto") return false;
  }
  const launch = config.launch ?? {};
  for (const key of ["sessionModel", "guardModel"]) {
    const v = launch[key];
    if (typeof v === "string" && v.trim() !== "") return false;
  }
  // A tier-alias binding (launch.aliases.{fable,opus,sonnet,haiku}) is an explicit cross-endpoint
  // decision — it redirects a Claude tier to a foreign model, so the reviewer's opus↔sonnet
  // `auto` guess is no longer honest (a proxy can hide what the tier resolves to). Any set
  // tier moves the config to CUSTOMIZED, exactly like a seat pin or a launch model.
  const aliases = launch.aliases && typeof launch.aliases === "object" ? launch.aliases : {};
  for (const tier of ["fable", "opus", "sonnet", "haiku"]) {
    const v = aliases[tier];
    if (typeof v === "string" && v.trim() !== "") return false;
  }
  return true;
}

// Assemble the spawnable role agent files into outDir, PLUS the orchestrator's
// platform-filtered load surface into outDir's parent (`.claude/ai-dev.md`). Returns the
// agentId→path map written (orchestrator keyed on its configured agent id), so a test can
// read the result without re-deriving it (mirrors the OpenCode install signature).
export function install(outDir, config) {
  fs.mkdirSync(outDir, { recursive: true });
  const registry = loadRegistry(ROOT);
  const policy = loadClaudeModelPolicy();
  const sessionWish = config.roles?.orchestrator?.model; // the session model wish (for `auto`)
  const vanilla = isVanilla(config); // `auto` is honored only in the vanilla state
  // The tier-alias bindings (config.launch.aliases) decide whether a bare-alias seat wish
  // bakes as the bare alias (tier bound foreign → routes through ANTHROPIC_DEFAULT_*) or
  // the concrete native id (tier native → passthrough) — see resolveModelPin.
  const boundTiers = config.launch?.aliases ?? {};
  const written = {};
  for (const role of SPAWNABLE) {
    const agentId = config.roles?.[role]?.agent;
    if (!agentId) throw new Error(`.ai-dev/config.json roles.${role}.agent is missing`);
    const fm = fs.readFileSync(path.join(ROOT, "src", "adapter", "claude", "agents", `${role}.fm`), "utf8").trim();
    const floor = fs.readFileSync(path.join(ROOT, "src", "agents", `${role}.md`), "utf8").trimStart();
    const body = composeBody(ROOT, floor, role, registry, config, "claude");
    // The REVIEWER defaults to `auto` when its `model` is absent/null (the
    // cross-model-review contract: absent/unrecognised ⇒ auto — docs/contracts/
    // cross-model-review.md). So a no-pin reviewer still cross-models (bakes the
    // opposite of the session). Every OTHER seat keeps the resolveModelPin default:
    // absent ⇒ no line ⇒ honest inherit of the session model (the builder IS the
    // maker, it should run on the session). The defaulting lives HERE, not in
    // resolveModelPin, so the pure resolver stays "absent ⇒ null".
    let wish = config.roles?.[role]?.model;
    if (role === "reviewer" && (wish === undefined || wish === null)) wish = "auto";
    // `auto` is a VANILLA-ONLY convenience (see header): once the config carries any
    // explicit model decision (a concrete seat pin or a launch model), the opus↔sonnet
    // guess is a fiction, so degrade `auto` → `session` (no line, honest inherit). The
    // gate lives here beside the absent⇒auto default, so resolveModelPin stays pure.
    if (wish === "auto" && !vanilla) wish = "session";
    const pin = resolveModelPin(wish, sessionWish, policy, boundTiers);
    const modelLine = pin ? `model: ${pin}\n` : "";
    if (!pin && typeof wish === "string" && wish !== "session" && wish !== "auto") {
      console.log(`note: model '${wish}' for ${role} is off the Claude allowlist (${policy.allow.join("/")}) — no model: line baked; the subagent inherits the session model`);
    }
    const out = `---\nname: ${agentId}\n${fm}\n${modelLine}---\n\n${body}`;
    const outPath = path.join(outDir, `${agentId}.md`);
    fs.writeFileSync(outPath, out);
    written[agentId] = outPath;
    console.log(`wrote ${path.relative(ROOT, outPath)}  (role ${role} -> ${agentId}${pin ? `, model ${pin}` : ""})`);
  }
  writeOrchestrator(outDir, config, registry, written);
  return written;
}

// Assemble the orchestrator FLOOR body with the SAME platform:claude filter (composeBody)
// the spawnable agents get — dropping the inactive platform:opencode block(s) — and write
// it OUTSIDE the agents dir, as a sibling of outDir (so it is NOT auto-registered as a
// spawnable subagent; see the header). No frontmatter: CLAUDE.md @imports it as raw
// session instructions, exactly as it did the raw orchestrator.md before this surface
// existed. The orchestrator floor carries no `<!-- ai-dev:modules -->` marker, so
// composeBody here reduces to filterPlatform — the artifact is the full floor minus only
// the opencode-tagged block(s), which the completeness/drift checks pin.
function writeOrchestrator(outDir, config, registry, written) {
  const agentId = config.roles?.orchestrator?.agent;
  if (!agentId) throw new Error(`.ai-dev/config.json roles.orchestrator.agent is missing`);
  const floor = fs.readFileSync(path.join(ROOT, "src", "agents", "orchestrator.md"), "utf8").trimStart();
  const body = composeBody(ROOT, floor, "orchestrator", registry, config, "claude");
  const outPath = path.join(path.dirname(outDir), ORCHESTRATOR_FILE);
  fs.writeFileSync(outPath, body);
  written[agentId] = outPath;
  console.log(`wrote ${path.relative(ROOT, outPath)}  (orchestrator load surface, @imported by CLAUDE.md — not a spawnable subagent)`);
}

// Run only when invoked directly (not when imported by a test). Config path:
// .ai-dev/config.json by default; AI_DEV_CONFIG lets a test drive a fixture
// without mutating the repo's real one.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const configPath = process.env.AI_DEV_CONFIG
    ? path.resolve(process.env.AI_DEV_CONFIG)
    : path.join(ROOT, ".ai-dev", "config.json");
  // Merge the gitignored config.local.json's `launch` over the shared config so a PERSONAL
  // tier binding (config.local `launch.aliases.<tier>`) is visible to the bake: resolveModelPin
  // then bakes the BARE alias (routes foreign at launch) instead of the concrete native id
  // (which would silently ignore the binding). The `install()` API stays config-object-in, so
  // a test still calls it directly with config.json alone — the merge happens only on this real
  // installer entry (docs/decisions/personal-multi-model-setup.md).
  const { config } = loadConfigWithLocal(configPath);
  const outDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, ".claude", "agents");
  install(outDir, config);
}
