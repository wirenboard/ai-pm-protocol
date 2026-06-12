#!/usr/bin/env node
// The unified installer — the one realisation of the adapter's "install into a
// project" contract point (PROTOCOL.md `## Core and adapter`,
// docs/contracts/one-command-install.md). It automates exactly the manual
// procedure src/adapter/INSTALL.md documents: vendor the shared adapter, lay down
// the core + doc templates, and wire the active platform — idempotently.
//
// This is ADAPTER-LAYER code: platform-specific by nature, so concrete platform
// names (claude / opencode, .claude/, .opencode/) are allowed here. The neutral
// core (PROTOCOL.md, the role bodies, docs/architecture.md prose) names none of them.
//
// Usage:  node src/adapter/install.mjs <target-dir> [--platform claude|opencode]
//   platform: the --platform flag, else the target's ai-dev.config.json `platform`,
//   else a clear error (never a silent guess).
//
// Security (threat-model): the two untrusted inputs are the target path and the
// platform string, both validated AT entry (the boundary). The platform is checked
// against a literal allow-list before any filesystem or process use. Every write
// lands beneath the RESOLVED target root; the project-boundary deny (invariant 2)
// is the mechanical floor under that — installing into an external sibling from
// the protocol repo is blocked, so this is tested against a temp dir INSIDE the
// root. Child scripts are invoked via execFileSync with an argv ARRAY (no shell),
// so no path is ever parsed by a shell. No network, no secrets, no new dependency
// (Node stdlib only).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

// This script lives at <repo>/src/adapter/install.mjs — SOURCE is the protocol repo
// root (three dirs up), the tree we copy FROM.
const SOURCE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const PLATFORMS = ["claude", "opencode"];

// ── filesystem helpers ───────────────────────────────────────────────────────

// Recursively copy a directory tree, OVERWRITING files (so a re-run converges to
// the same bytes — idempotent). node:fs cpSync does this in one call; the explicit
// recursive form keeps the behaviour obvious and lets us skip node_modules / dot-git
// noise that must never be vendored.
function copyTree(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
  }
}

// Copy a single file, overwriting (idempotent — same bytes on a re-run).
function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// Copy a file ONLY when the destination is absent — never clobber a project's real
// file (the doc-template rule: lay down a template where the target has none).
function copyIfAbsent(src, dest) {
  if (fs.existsSync(dest)) return false;
  copyFile(src, dest);
  return true;
}

// Append a line to a text file only if it is not already present — idempotent
// import wiring (CLAUDE.md / AGENTS.md). Creates the file if absent.
function ensureLine(file, line) {
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (existing.split("\n").some((l) => l.trim() === line.trim())) return false;
  const sep = existing && !existing.endsWith("\n") ? "\n" : "";
  fs.writeFileSync(file, existing + sep + line + "\n");
  return true;
}

// Run a vendored install script as a child process (node, argv array — no shell).
// `env` overrides (e.g. AI_DEV_CONFIG) layer onto the current environment.
function runScript(scriptRelPath, args, target, env) {
  const script = path.join(target, ".ai-dev", "tooling", scriptRelPath);
  execFileSync("node", [script, ...args], {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
}

// ── steps ──────────────────────────────────────────────────────────────────

// 1. Vendor the shared adapter AND the neutral bodies the assembler reads, into the
// target's tooling location. The vendored install-*.mjs self-locate their ROOT as
// .ai-dev/tooling/ (three dirs up from the script), and read src/agents, src/modules,
// src/adapter from there — so all three must sit under .ai-dev/tooling/src/.
function vendorTooling(target) {
  const tooling = path.join(target, ".ai-dev", "tooling", "src");
  copyTree(path.join(SOURCE, "src", "adapter"), path.join(tooling, "adapter"));
  copyTree(path.join(SOURCE, "src", "agents"), path.join(tooling, "agents"));
  copyTree(path.join(SOURCE, "src", "modules"), path.join(tooling, "modules"));
}

// 2. Lay down the core the downstream loads + the quality-layer shape + the doc
// templates (templates only where absent — never clobber a real doc).
function layDownCore(target) {
  copyFile(path.join(SOURCE, "PROTOCOL.md"), path.join(target, "PROTOCOL.md"));
  copyTree(path.join(SOURCE, "src", "agents"), path.join(target, "src", "agents"));
  copyTree(path.join(SOURCE, "src", "modules"), path.join(target, "src", "modules"));

  // The quality layer: ship the SHAPE (the registry format + the runner + its
  // README), NOT this repo's own tool rows. tools.json is laid down only where
  // absent so a project's own registry is never clobbered; the runner is the
  // shared mechanism and is overwritten.
  copyFile(path.join(SOURCE, "src", "quality", "run.mjs"), path.join(target, "src", "quality", "run.mjs"));
  copyFile(path.join(SOURCE, "src", "quality", "README.md"), path.join(target, "src", "quality", "README.md"));
  copyIfAbsent(path.join(SOURCE, "src", "templates", "tools.json"), path.join(target, "src", "quality", "tools.json"));

  // Doc templates → the target's docs/, only where the project has no such doc.
  copyIfAbsent(path.join(SOURCE, "src", "templates", "product.md"), path.join(target, "docs", "product.md"));
  copyIfAbsent(path.join(SOURCE, "src", "templates", "contracts.md"), path.join(target, "docs", "contracts.md"));
  copyIfAbsent(path.join(SOURCE, "src", "templates", "architecture.md"), path.join(target, "docs", "architecture.md"));
  copyIfAbsent(path.join(SOURCE, "src", "templates", "README.md"), path.join(target, "docs", "README.md"));
}

// 3. Ensure a config exists so the agent assembly has its `roles` bindings. A real
// project configures via /dev-setup; pre-setup we write a minimal default carrying
// the resolved platform + the standard seat ids. Written ONLY where absent — a
// re-run never overwrites the Operator's configured file.
function ensureConfig(target, platform) {
  const dest = path.join(target, "ai-dev.config.json");
  if (fs.existsSync(dest)) return;
  const config = {
    mode: "interactive",
    profile: "solo",
    platform,
    kind: "code",
    roles: {
      orchestrator: { agent: "ai-dev" },
      builder: { agent: "dev-builder" },
      reviewer: { agent: "dev-reviewer", model: "auto" },
    },
  };
  fs.writeFileSync(dest, JSON.stringify(config, null, 2) + "\n");
}

// 4a. Wire Claude: assemble the agents + the setup command against the target root,
// merge the deny hooks into .claude/settings.json (keyed so a re-run never
// duplicates), and import the constitution + the orchestrator procedure via CLAUDE.md.
function wireClaude(target) {
  const cfg = { AI_DEV_CONFIG: path.join(target, "ai-dev.config.json") };
  runScript(path.join("src", "adapter", "claude", "install-agents.mjs"), [path.join(target, ".claude", "agents")], target, cfg);
  runScript(path.join("src", "adapter", "claude", "install-commands.mjs"), [path.join(target, ".claude", "commands")], target, cfg);

  // Merge the two deny hooks into .claude/settings.json idempotently. The hook
  // fragment is the vendored claude/hooks.json (the single home of the hook shape);
  // we merge its PreToolUse/UserPromptSubmit arrays, de-duping by command.
  const hooksFragment = JSON.parse(
    fs.readFileSync(path.join(target, ".ai-dev", "tooling", "src", "adapter", "claude", "hooks.json"), "utf8"),
  );
  const settingsPath = path.join(target, ".claude", "settings.json");
  const settings = fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath, "utf8")) : {};
  settings.hooks = mergeHooks(settings.hooks || {}, hooksFragment.hooks);
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");

  // Load instructions: the orchestrator session loads the constitution + its
  // procedure via CLAUDE.md imports — appended only if not already present.
  const claudeMd = path.join(target, "CLAUDE.md");
  ensureLine(claudeMd, "@PROTOCOL.md");
  ensureLine(claudeMd, "@src/agents/orchestrator.md");
}

// Merge a hooks fragment into an existing hooks object without duplicating an
// already-present command — the idempotence guarantee for the deny wiring. Each
// event (PreToolUse / UserPromptSubmit) is an array of matcher-groups; we add a
// fragment group only when no existing group already carries the same command.
function mergeHooks(existing, fragment) {
  const merged = { ...existing };
  for (const [event, groups] of Object.entries(fragment)) {
    const current = Array.isArray(merged[event]) ? [...merged[event]] : [];
    const seenCommands = new Set(
      current.flatMap((g) => (g.hooks || []).map((h) => h.command)),
    );
    for (const group of groups) {
      const cmds = (group.hooks || []).map((h) => h.command);
      if (cmds.some((c) => seenCommands.has(c))) continue; // already wired
      current.push(group);
      for (const c of cmds) seenCommands.add(c);
    }
    merged[event] = current;
  }
  return merged;
}

// 4b. Wire OpenCode: assemble the three agents + the setup command + generate the
// plugin (downstream layout, since the adapter is now vendored under .ai-dev/tooling/),
// merge opencode.json keys, and import the constitution via AGENTS.md.
function wireOpenCode(target) {
  const cfg = { AI_DEV_CONFIG: path.join(target, "ai-dev.config.json") };
  runScript(path.join("src", "adapter", "opencode", "install-agents.mjs"), [path.join(target, ".opencode", "agents")], target, cfg);
  runScript(path.join("src", "adapter", "opencode", "install-commands.mjs"), [path.join(target, ".opencode", "commands")], target, cfg);
  // The plugin generator resolves the adapter layout from the TARGET root (passed via
  // --root, since the vendored script self-locates to the tooling root, not the target).
  // The target has .ai-dev/tooling/src/adapter ⇒ downstream layout ⇒ the deployed plugin
  // keeps the tooling-submodule import path.
  runScript(
    path.join("src", "adapter", "opencode", "install-plugin.mjs"),
    [path.join(target, ".opencode", "plugins", "ai-dev.mjs"), "--root", target],
    target,
    cfg,
  );

  // opencode.json — merge the protocol's keys without dropping a project's own.
  const ocPath = path.join(target, ".opencode", "opencode.json");
  const oc = fs.existsSync(ocPath) ? JSON.parse(fs.readFileSync(ocPath, "utf8")) : {};
  oc.default_agent = "ai-dev";
  oc.instructions = Array.from(new Set([...(oc.instructions || []), "PROTOCOL.md"]));
  // The protocol plugin is the SOLE project-boundary guard; OpenCode's native
  // permission dial is set to full-speed inside the project. Division of labor:
  // plugin = the mechanical boundary (deny outside-root reads/writes/finds);
  // native permission = speed dial for tool calls inside the boundary.
  // Honest residual: bash boundary is best-effort (the engine parses obvious path
  // tokens; an opaque escape like `python3 -c` is not mechanically caught). edit/read/write
  // tool checks are exact; webfetch=allow because research needs it (exfil via
  // HTTP is a separate persona rule, not a filesystem-boundary concern).
  oc.permission = { ...(oc.permission || {}), edit: "allow", bash: "allow", webfetch: "allow", question: "allow" };
  oc.agent = { ...(oc.agent || {}), build: { disable: true }, plan: { disable: true } };
  fs.mkdirSync(path.dirname(ocPath), { recursive: true });
  fs.writeFileSync(ocPath, JSON.stringify(oc, null, 2) + "\n");

  // AGENTS.md is OpenCode's always-on surface — import the constitution idempotently.
  ensureLine(path.join(target, "AGENTS.md"), "@PROTOCOL.md");
}

// ── orchestration ────────────────────────────────────────────────────────────

// Resolve the active platform: --platform flag, else the target config's `platform`,
// else a hard error (fail-closed — never wire a guessed platform).
function resolvePlatform(target, flag) {
  if (flag) {
    if (!PLATFORMS.includes(flag)) {
      throw new Error(`unknown --platform "${flag}" — expected one of ${PLATFORMS.join(" | ")}`);
    }
    return flag;
  }
  const cfgPath = path.join(target, "ai-dev.config.json");
  if (fs.existsSync(cfgPath)) {
    const platform = JSON.parse(fs.readFileSync(cfgPath, "utf8")).platform;
    if (PLATFORMS.includes(platform)) return platform;
  }
  throw new Error(
    `cannot resolve the platform — pass --platform ${PLATFORMS.join("|")} ` +
      `or set "platform" in ${path.join(target, "ai-dev.config.json")}`,
  );
}

// Install the protocol into `targetDir`. Returns the resolved platform. Exported so
// the test drives it directly against a temp dir.
export function install(targetDir, platformFlag) {
  const target = path.resolve(targetDir);
  const platform = resolvePlatform(target, platformFlag);

  vendorTooling(target);
  layDownCore(target);
  ensureConfig(target, platform);
  if (platform === "claude") wireClaude(target);
  else wireOpenCode(target);

  return platform;
}

// CLI entry — only when invoked directly, not when imported by the test. argv[1] is
// realpath'd because an npm bin shim invokes this file through a symlink, while the
// loaded module URL is the real path — without it the npx run would silently no-op.
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const flagIdx = args.indexOf("--platform");
  const platformFlag = flagIdx >= 0 ? args[flagIdx + 1] : undefined;
  const targetDir = args.find((a, i) => !a.startsWith("--") && (flagIdx < 0 || i !== flagIdx + 1));

  if (!targetDir) {
    console.error("Usage: node src/adapter/install.mjs <target-dir> [--platform claude|opencode]");
    process.exit(2);
  }

  try {
    const platform = install(targetDir, platformFlag);
    const rel = path.relative(process.cwd(), path.resolve(targetDir)) || ".";
    console.log(`\nInstalled the ai-dev protocol into ${rel} (platform: ${platform}).`);
    console.log("  • vendored the shared adapter into .ai-dev/tooling/");
    console.log("  • laid down PROTOCOL.md, the role agents, the quality shape, the modules, the doc templates");
    console.log(`  • wired ${platform} (deny hooks, agents, the /dev-setup command${platform === "opencode" ? ", the plugin" : ""})`);
    console.log("\nNext: run /dev-setup to configure roles, models, mode, and the module kit.");
  } catch (e) {
    console.error(`install failed: ${e.message}`);
    process.exit(1);
  }
}
