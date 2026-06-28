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
// here (mirrors how engine.mjs is shared by both deny shims). The orchestrator is
// the session, not a spawned agent, so it has no entry here; it loads via CLAUDE.md
// (see INSTALL.md, load-instructions).
//
// Run from the repo root: node src/adapter/claude/install-agents.mjs [outDir]
//   outDir defaults to .claude/agents/ (pass a temp dir to dry-run).
//   AI_DEV_CONFIG lets a test drive a fixture config without mutating the repo's.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRegistry, composeBody } from "../modules.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SPAWNABLE = ["builder", "reviewer"];

// Assemble every spawnable role agent file into outDir from the given config.
// Returns the agentId→path map written, so a test can read the result without
// re-deriving it (mirrors the OpenCode install signature).
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
  return written;
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
