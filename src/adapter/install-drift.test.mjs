// Assembled-artifact anti-drift test — the class rule's instances for the MARKDOWN
// artifacts (docs/decisions/assembled-drift-guard.md; the deployed plugin has its own
// row, install-plugin.test.mjs). Every committed generated markdown artifact — both
// platforms' agents and commands — must be byte-identical to a fresh assembly under
// the repo's TRACKED .ai-dev/config.json: (sources, config) → artifacts is
// deterministic, so a hand-edit to a committed file, a source change left
// un-regenerated, OR a config change (model pin, module toggle) not followed by
// re-assembly all fail here. The config is read from the tree, never a fixture — a
// fixture would test the composition logic (already covered by install-modules /
// install-model), not the committed bytes.
//
// Plus the ORPHAN check: a file sitting in a committed generated dir that no
// generator wrote this run (a renamed role's old file, a `.gen` stray) — the
// stale-leftover case a byte-compare of the expected files cannot see.
//
// Run: node src/adapter/install-drift.test.mjs

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { install as installClaudeAgents } from "./claude/install-agents.mjs";
import { install as installOpencodeAgents } from "./opencode/install-agents.mjs";
import { install as installClaudeCommands } from "./claude/install-commands.mjs";
import { install as installOpencodeCommands } from "./opencode/install-commands.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const config = JSON.parse(fs.readFileSync(path.join(ROOT, ".ai-dev", "config.json"), "utf8"));

let pass = 0, fail = 0;
function check(name, cond, hint) {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${hint ? `\n       fix: ${hint}` : ""}`); }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ai-dev-drift-"));

// One generator per committed dir. Generate into a temp sibling, byte-compare every
// file the generator wrote against its committed twin, then orphan-check the
// committed dir against this run's output.
const TARGETS = [
  { dir: path.join(".claude", "agents"), generate: (out) => installClaudeAgents(out, config), regen: "node src/adapter/claude/install-agents.mjs" },
  { dir: path.join(".opencode", "agents"), generate: (out) => installOpencodeAgents(out, config), regen: "node src/adapter/opencode/install-agents.mjs" },
  { dir: path.join(".claude", "commands"), generate: (out) => installClaudeCommands(out), regen: "node src/adapter/claude/install-commands.mjs" },
  { dir: path.join(".opencode", "commands"), generate: (out) => installOpencodeCommands(out), regen: "node src/adapter/opencode/install-commands.mjs" },
];

for (const t of TARGETS) {
  const outDir = path.join(tmp, t.dir);
  t.generate(outDir);
  const generated = fs.readdirSync(outDir).sort();

  for (const f of generated) {
    const committedPath = path.join(ROOT, t.dir, f);
    const same = fs.existsSync(committedPath)
      && fs.readFileSync(committedPath, "utf8") === fs.readFileSync(path.join(outDir, f), "utf8");
    check(
      `${t.dir}/${f} is byte-identical to a fresh assembly`,
      same,
      `re-run ${t.regen} (source or config changed without re-assembly, or the committed file was hand-edited)`,
    );
  }

  const orphans = fs.readdirSync(path.join(ROOT, t.dir)).filter((f) => !generated.includes(f));
  check(
    `${t.dir} holds no file this run's generator did not write${orphans.length ? ` (orphans: ${orphans.join(", ")})` : ""}`,
    orphans.length === 0,
    "delete the leftover, or register its generator",
  );
}

// The Claude orchestrator load surface (.claude/ai-dev.md) — the platform:claude-FILTERED
// orchestrator body. It is assembled by the SAME install-agents run as .claude/agents/ but
// written OUTSIDE that dir (it is the SESSION's @imported instructions, NOT a spawnable
// subagent — a file under .claude/agents/ would wrongly auto-register). The .claude/agents
// generate in the TARGETS loop above already wrote it to tmp/.claude/ai-dev.md (the shim
// writes the orchestrator to outDir's parent), so byte-compare the committed twin here.
{
  const rel = path.join(".claude", "ai-dev.md");
  const generated = path.join(tmp, rel);
  const committed = path.join(ROOT, rel);
  const same = fs.existsSync(committed) && fs.existsSync(generated)
    && fs.readFileSync(committed, "utf8") === fs.readFileSync(generated, "utf8");
  check(
    `${rel} is byte-identical to a fresh platform:claude assembly`,
    same,
    "re-run `node src/adapter/claude/install-agents.mjs .claude/agents` (orchestrator source or config changed without re-assembly, or the committed file was hand-edited)",
  );
}

// On-demand procedure bodies: the committed deployed copy (.ai-dev/procedures/) MUST be
// byte-identical to its source of truth (src/agents/procedures/). Unlike the agents above
// the "generator" here is a plain COPY (install.mjs deployProcedures), but the class rule
// is the same — every committed deployed artifact carries a mechanical drift guard
// (docs/decisions/assembled-drift-guard.md). The readable .ai-dev/procedures/ copy is the
// one the orchestrator's trigger resolves to (the .ai-dev/tooling/ vendored copy is
// read-denied, invariant 2). Byte-compare each source file against its deployed twin, plus
// an orphan check (a deployed file with no source — a renamed/removed procedure left behind).
const procSrcDir = path.join(ROOT, "src", "agents", "procedures");
const procDeployDir = path.join(ROOT, ".ai-dev", "procedures");
const procSources = fs.readdirSync(procSrcDir).filter((f) => f.endsWith(".md")).sort();
for (const f of procSources) {
  const deployed = path.join(procDeployDir, f);
  const same = fs.existsSync(deployed)
    && fs.readFileSync(deployed, "utf8") === fs.readFileSync(path.join(procSrcDir, f), "utf8");
  check(
    `.ai-dev/procedures/${f} is byte-identical to src/agents/procedures/${f}`,
    same,
    "re-run `node src/adapter/install.mjs . --dogfood` (the deployed procedure copy drifted from its source)",
  );
}
const procOrphans = fs.existsSync(procDeployDir)
  ? fs.readdirSync(procDeployDir).filter((f) => !procSources.includes(f))
  : [];
check(
  `.ai-dev/procedures/ holds no file without a source${procOrphans.length ? ` (orphans: ${procOrphans.join(", ")})` : ""}`,
  procOrphans.length === 0,
  "delete the leftover, or restore its src/agents/procedures/ source",
);

// The plugin dir's byte-compare lives in install-plugin.test.mjs (that row also locks
// the layout rewrite); the ORPHAN check still belongs here — a `.gen` stray beside the
// deployed plugin is the recorded incident this case exists for.
const pluginDir = path.join(".opencode", "plugins");
const pluginOrphans = fs.readdirSync(path.join(ROOT, pluginDir)).filter((f) => f !== "ai-dev.mjs");
check(
  `${pluginDir} holds only the generator's ai-dev.mjs${pluginOrphans.length ? ` (orphans: ${pluginOrphans.join(", ")})` : ""}`,
  pluginOrphans.length === 0,
  "delete the leftover (a manual generate run's stray)",
);

fs.rmSync(tmp, { recursive: true, force: true });

console.log(`\nINSTALL-DRIFT: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log("PASS — committed assembled artifacts are the generators' output under the tracked config; no orphans");
