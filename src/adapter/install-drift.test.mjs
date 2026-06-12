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
