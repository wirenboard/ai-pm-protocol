// OpenCode realisation of the adapter's explicit-setup-command contract point.
// Assembles the platform-neutral command body (adapter/commands/setup.body.md) +
// the OpenCode per-command frontmatter (adapter/opencode/commands/setup.fm) into
// an OpenCode command file in **.opencode/commands/** (PLURAL — opencode 1.17
// loads the plural command dir, matching its plural agents/ + plugins/ dirs; the
// singular .opencode/command/ is NOT loaded, the same dogfood finding as the other
// dirs, adapter/INSTALL.md). On OpenCode the markdown BODY is the prompt template
// (the `template` field is only for the opencode.json inline `command` form), and
// the frontmatter targets the `ai-pm` agent so the orchestrator runs setup.
// Concatenation, NOT a generator: the neutral body is the single source (shared
// with the Claude adapter) — a thin wrapper pointing at the orchestrator's
// `## Setup`, never restating the dialog (single home, PROTOCOL.md invariant 6).
//
// Run from the repo root: node adapter/opencode/install-commands.mjs [outDir]
//   outDir defaults to .opencode/commands/ (pass a temp dir to dry-run).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// Assemble the setup command into outDir. Returns the path written so a test can
// read the result without re-deriving it.
export function install(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const fm = fs.readFileSync(path.join(ROOT, "adapter", "opencode", "commands", "setup.fm"), "utf8").trim();
  const body = fs.readFileSync(path.join(ROOT, "adapter", "commands", "setup.body.md"), "utf8").trimStart();
  const out = `---\n${fm}\n---\n\n${body}`;
  const outPath = path.join(outDir, "setup.md");
  fs.writeFileSync(outPath, out);
  console.log(`wrote ${path.relative(ROOT, outPath)}  (/setup command, agent ai-pm)`);
  return outPath;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, ".opencode", "commands");
  install(outDir);
}
