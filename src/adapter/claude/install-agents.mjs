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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SPAWNABLE = ["builder", "reviewer"];
// The orchestrator load-surface filename is FIXED (not keyed on the configurable agent id):
// CLAUDE.md @imports it by a stable string in both dogfood and downstream modes. Unlike the
// OpenCode default_agent (a real registered agent keyed on its id), the Claude orchestrator
// is the SESSION, so a stable load-surface name is what the import must point at.
const ORCHESTRATOR_FILE = "ai-dev.md";

// Assemble the spawnable role agent files into outDir, PLUS the orchestrator's
// platform-filtered load surface into outDir's parent (`.claude/ai-dev.md`). Returns the
// agentId→path map written (orchestrator keyed on its configured agent id), so a test can
// read the result without re-deriving it (mirrors the OpenCode install signature).
export function install(outDir, config) {
  fs.mkdirSync(outDir, { recursive: true });
  const registry = loadRegistry(ROOT);
  const written = {};
  for (const role of SPAWNABLE) {
    const agentId = config.roles?.[role]?.agent;
    if (!agentId) throw new Error(`.ai-dev/config.json roles.${role}.agent is missing`);
    const fm = fs.readFileSync(path.join(ROOT, "src", "adapter", "claude", "agents", `${role}.fm`), "utf8").trim();
    const floor = fs.readFileSync(path.join(ROOT, "src", "agents", `${role}.md`), "utf8").trimStart();
    const body = composeBody(ROOT, floor, role, registry, config, "claude");
    const out = `---\nname: ${agentId}\n${fm}\n---\n\n${body}`;
    const outPath = path.join(outDir, `${agentId}.md`);
    fs.writeFileSync(outPath, out);
    written[agentId] = outPath;
    console.log(`wrote ${path.relative(ROOT, outPath)}  (role ${role} -> ${agentId})`);
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
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const outDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, ".claude", "agents");
  install(outDir, config);
}
