// The unified installer test — guards the one-command-install contract
// (docs/contracts/one-command-install.md). It installs the protocol into a temp
// target dir created INSIDE the repo root (the out-of-root deny blocks an external
// sibling, which is exactly why the target sits inside the root), then asserts the
// adapter is vendored (self-sufficiently — the vendored installer can re-run), the
// platform is wired, the version is stamped (with the UPGRADING handoff marker on a
// version change), the inactive platform gets its breadcrumb, and a SECOND run is
// idempotent (identical tree, no duplication, stale ai-dev hook groups replaced).
//
// Run: node src/adapter/install.test.mjs

import { install, hasGitRepo } from "./install.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const PKG_VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}`); }
}

// Snapshot a directory tree as a sorted relPath→bytes map, for the idempotence diff.
function snapshot(dir) {
  const out = {};
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else out[path.relative(dir, p)] = fs.readFileSync(p, "utf8");
    }
  };
  walk(dir);
  return out;
}

// A fresh temp target INSIDE the repo root (allowed by the boundary). Random suffix
// so parallel runs never collide; cleaned up at the end.
function freshTarget(tag) {
  const dir = fs.mkdtempSync(path.join(ROOT, `.tmp-install-${tag}-`));
  return dir;
}

// ── Claude install ────────────────────────────────────────────────────────────
function testPlatform(platform, assertWiring) {
  const target = freshTarget(platform);
  try {
    const resolved = install(target, platform);
    check(`[${platform}] install returns the resolved platform`, resolved === platform);

    // 1. adapter vendored
    check(`[${platform}] adapter engine vendored`, fs.existsSync(path.join(target, ".ai-dev", "tooling", "src", "adapter", "engine.mjs")));
    check(`[${platform}] deny-rules vendored`, fs.existsSync(path.join(target, ".ai-dev", "tooling", "src", "adapter", "deny-rules.json")));
    check(`[${platform}] neutral role bodies vendored beside the adapter`, fs.existsSync(path.join(target, ".ai-dev", "tooling", "src", "agents", "builder.md")));
    check(`[${platform}] modules registry vendored`, fs.existsSync(path.join(target, ".ai-dev", "tooling", "src", "modules", "registry.json")));
    check(`[${platform}] node_modules NOT vendored`, !fs.existsSync(path.join(target, ".ai-dev", "tooling", "src", "adapter", "node_modules")));

    // 2. core laid down
    check(`[${platform}] PROTOCOL.md laid down at .ai-dev/PROTOCOL.md`, fs.existsSync(path.join(target, ".ai-dev", "PROTOCOL.md")));
    check(`[${platform}] PROTOCOL.md NOT at project root`, !fs.existsSync(path.join(target, "PROTOCOL.md")));
    check(`[${platform}] quality runner laid down at .ai-dev/quality/`, fs.existsSync(path.join(target, ".ai-dev", "quality", "run.mjs")));
    check(`[${platform}] src/agents/ NOT at project root`, !fs.existsSync(path.join(target, "src", "agents")));
    check(`[${platform}] docs/ NOT created by installer`, !fs.existsSync(path.join(target, "docs")));
    // the quality SHAPE, not this repo's own tool rows
    const tools = JSON.parse(fs.readFileSync(path.join(target, ".ai-dev", "quality", "tools.json"), "utf8"));
    check(`[${platform}] quality registry is the template shape, not this repo's rows`, tools.tools.length === 1 && tools.tools[0].id === "example-lint");

    // 2b. version stamp + migration notes (the upgrade channel's mechanical half)
    check(`[${platform}] .ai-dev/VERSION stamped with the source version`, fs.readFileSync(path.join(target, ".ai-dev", "VERSION"), "utf8").trim() === PKG_VERSION);
    check(`[${platform}] tooling carries its own VERSION`, fs.readFileSync(path.join(target, ".ai-dev", "tooling", "VERSION"), "utf8").trim() === PKG_VERSION);
    check(`[${platform}] migration notes laid down at .ai-dev/upgrades.md`, fs.existsSync(path.join(target, ".ai-dev", "upgrades.md")));
    check(`[${platform}] no UPGRADING marker on a fresh install`, !fs.existsSync(path.join(target, ".ai-dev", "UPGRADING.md")));

    // 2c. cross-platform breadcrumb: the INACTIVE platform's load surface exists
    const inactiveFile = platform === "claude" ? "AGENTS.md" : "CLAUDE.md";
    const inactivePlatform = platform === "claude" ? "opencode" : "claude";
    const bc = fs.readFileSync(path.join(target, inactiveFile), "utf8");
    check(`[${platform}] inactive-platform breadcrumb written to ${inactiveFile}`, bc.includes("ai-dev:breadcrumb") && bc.includes(`--platform ${inactivePlatform}`));

    // 3. config present inside .ai-dev/
    check(`[${platform}] config written at .ai-dev/config.json with the resolved platform`, JSON.parse(fs.readFileSync(path.join(target, ".ai-dev", "config.json"), "utf8")).platform === platform);

    // 3b. .gitignore excludes the local-only transients (state + raw feedback reports)
    const gi = fs.existsSync(path.join(target, ".gitignore")) ? fs.readFileSync(path.join(target, ".gitignore"), "utf8") : "";
    check(`[${platform}] .gitignore excludes .ai-dev/state/`, gi.includes(".ai-dev/state/"));
    check(`[${platform}] .gitignore excludes .ai-dev/feedback/`, gi.includes(".ai-dev/feedback/"));
    check(`[${platform}] .gitignore excludes .ai-dev/worktrees/`, gi.includes(".ai-dev/worktrees/"));

    // 4. platform wiring
    assertWiring(target);

    // 5. IDEMPOTENCE — a second run yields an identical tree
    const before = snapshot(target);
    install(target, platform);
    const after = snapshot(target);
    const beforeKeys = Object.keys(before).sort();
    const afterKeys = Object.keys(after).sort();
    check(`[${platform}] second run adds/removes no files`, JSON.stringify(beforeKeys) === JSON.stringify(afterKeys));
    const allIdentical = beforeKeys.every((k) => before[k] === after[k]);
    check(`[${platform}] second run leaves every file byte-identical`, allIdentical);
    check(`[${platform}] same-version re-run writes no UPGRADING marker`, !fs.existsSync(path.join(target, ".ai-dev", "UPGRADING.md")));
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

testPlatform("claude", (target) => {
  check("[claude] agents assembled", fs.existsSync(path.join(target, ".claude", "agents", "dev-builder.md")) && fs.existsSync(path.join(target, ".claude", "agents", "dev-reviewer.md")));
  check("[claude] /dev-setup command assembled", fs.existsSync(path.join(target, ".claude", "commands", "dev-setup.md")));
  const settings = JSON.parse(fs.readFileSync(path.join(target, ".claude", "settings.json"), "utf8"));
  const cmds = (settings.hooks.PreToolUse || []).flatMap((g) => g.hooks.map((h) => h.command));
  check("[claude] deny hook wired into settings.json", cmds.some((c) => c.includes("shim.mjs")));
  // idempotence of the hook merge: exactly one PreToolUse + one UserPromptSubmit group
  check("[claude] hook merge did not duplicate (one PreToolUse group)", settings.hooks.PreToolUse.length === 1);
  const claudeMd = fs.readFileSync(path.join(target, "CLAUDE.md"), "utf8");
  check("[claude] CLAUDE.md imports the constitution", claudeMd.includes("@.ai-dev/PROTOCOL.md") && claudeMd.includes("@.ai-dev/tooling/src/agents/orchestrator.md"));
  // import appears exactly once (idempotent line append)
  check("[claude] constitution import appears once", claudeMd.split("@.ai-dev/PROTOCOL.md").length - 1 === 1);
});

testPlatform("opencode", (target) => {
  check("[opencode] three agents assembled", ["ai-dev", "dev-builder", "dev-reviewer"].every((id) => fs.existsSync(path.join(target, ".opencode", "agents", `${id}.md`))));
  check("[opencode] /dev-setup command assembled", fs.existsSync(path.join(target, ".opencode", "commands", "dev-setup.md")));
  const plugin = path.join(target, ".opencode", "plugins", "ai-dev.mjs");
  check("[opencode] plugin generated", fs.existsSync(plugin));
  // downstream layout: the plugin keeps the tooling-submodule import path (adapter vendored there)
  check("[opencode] plugin uses the downstream (tooling-submodule) adapter path", fs.readFileSync(plugin, "utf8").includes(".ai-dev/tooling/src/adapter"));
  const oc = JSON.parse(fs.readFileSync(path.join(target, ".opencode", "opencode.json"), "utf8"));
  check("[opencode] opencode.json wires the orchestrator primary + constitution", oc.default_agent === "ai-dev" && oc.instructions.includes(".ai-dev/PROTOCOL.md"));
  check("[opencode] generic build/plan primaries disabled", oc.agent.build.disable === true && oc.agent.plan.disable === true);
  const agentsMd = fs.readFileSync(path.join(target, "AGENTS.md"), "utf8");
  check("[opencode] AGENTS.md imports the constitution once", agentsMd.split("@.ai-dev/PROTOCOL.md").length - 1 === 1);
});

// ── platform resolution: a clear error when unresolvable, validation of the flag ─
{
  const target = freshTarget("resolve");
  try {
    let threw = false;
    try { install(target, "borkcode"); } catch { threw = true; }
    check("[resolve] unknown --platform is a hard error", threw);

    let threw2 = false;
    try { install(target, undefined); } catch { threw2 = true; }
    check("[resolve] no flag + no config platform is a hard error", threw2);
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

// ── F4 migration: installer over prior-version artifacts ─────────────────────
// Verifies the installer succeeds and lays the new structure when a target already
// carries old-protocol artifacts (WORKFLOW.md, .ai-pm/ state dir) without deleting them.
{
  const target = freshTarget("f4migration");
  try {
    fs.mkdirSync(path.join(target, ".ai-pm", "state"), { recursive: true });
    fs.writeFileSync(path.join(target, ".ai-pm", "state", "current.md"), "# old state\n");
    fs.writeFileSync(path.join(target, "WORKFLOW.md"), "# old workflow\n");
    install(target, "claude");
    check("[f4] installer succeeds over old-protocol artifacts", fs.existsSync(path.join(target, ".ai-dev", "PROTOCOL.md")));
    check("[f4] old artifacts not deleted by installer", fs.existsSync(path.join(target, "WORKFLOW.md")) && fs.existsSync(path.join(target, ".ai-pm", "state", "current.md")));
    check("[f4] new structure laid down alongside old", fs.existsSync(path.join(target, ".ai-dev", "tooling", "src", "adapter", "engine.mjs")));
    check("[f4] .gitignore excludes .ai-dev/state/ after migration install", fs.readFileSync(path.join(target, ".gitignore"), "utf8").includes(".ai-dev/state/"));
    check("[f4] version stamped on a migration install", fs.readFileSync(path.join(target, ".ai-dev", "VERSION"), "utf8").trim() === PKG_VERSION);
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

// ── version-change detection: the UPGRADING handoff marker ───────────────────
{
  const target = freshTarget("upgrade");
  try {
    install(target, "claude");
    fs.writeFileSync(path.join(target, ".ai-dev", "VERSION"), "1.0.0\n"); // simulate an older install
    install(target, "claude");
    const markerPath = path.join(target, ".ai-dev", "UPGRADING.md");
    check("[upgrade] marker written on a version-change re-run", fs.existsSync(markerPath));
    const marker = fs.existsSync(markerPath) ? fs.readFileSync(markerPath, "utf8") : "";
    check("[upgrade] marker names old → new", marker.includes("1.0.0") && marker.includes(PKG_VERSION));
    check("[upgrade] marker points at the notes + the upgrade check", marker.includes(".ai-dev/upgrades.md") && marker.includes("## Upgrade"));
    check("[upgrade] stamp updated to the new version", fs.readFileSync(path.join(target, ".ai-dev", "VERSION"), "utf8").trim() === PKG_VERSION);

    // a chained bump with the marker still unconsumed keeps the ORIGIN version —
    // the (old, new] notes range must not shrink to the last unmigrated install
    fs.writeFileSync(path.join(target, ".ai-dev", "VERSION"), "1.5.0\n");
    install(target, "claude");
    check("[upgrade] unconsumed marker keeps its origin across a chained bump", fs.readFileSync(markerPath, "utf8").includes("Upgraded 1.0.0 →"));
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

// ── pre-stamp detection: an existing .ai-dev/ tree without a VERSION ─────────
{
  const target = freshTarget("prestamp");
  try {
    fs.mkdirSync(path.join(target, ".ai-dev"), { recursive: true });
    fs.writeFileSync(path.join(target, ".ai-dev", "backlog.md"), "# existing pre-stamp install\n");
    install(target, "claude");
    const marker = path.join(target, ".ai-dev", "UPGRADING.md");
    check("[prestamp] existing stampless .ai-dev/ tree detected as pre-5.10 upgrade", fs.existsSync(marker) && fs.readFileSync(marker, "utf8").includes("pre-5.10"));
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

// ── hook prune: a stale ai-dev hook group is replaced, foreign groups kept ───
{
  const target = freshTarget("hookprune");
  try {
    const settingsPath = path.join(target, ".claude", "settings.json");
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify({
      hooks: {
        PreToolUse: [
          // a stale ai-dev group — the old vendor location (its command CHANGED)
          { matcher: "Read|Write", hooks: [{ type: "command", command: "node \"$CLAUDE_PROJECT_DIR/.ai-pm/tooling/src/adapter/claude/shim.mjs\"" }] },
          // a foreign group the merge must never touch
          { matcher: "Bash", hooks: [{ type: "command", command: "my-own-linter --check" }] },
        ],
      },
    }, null, 2));
    install(target, "claude");
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    const cmds = settings.hooks.PreToolUse.flatMap((g) => g.hooks.map((h) => h.command));
    check("[prune] stale ai-dev hook group (changed command) pruned", !cmds.some((c) => c.includes(".ai-pm/")));
    check("[prune] exactly one ai-dev shim group remains", cmds.filter((c) => c.includes("adapter/claude/shim.mjs")).length === 1);
    check("[prune] foreign hook group preserved", cmds.includes("my-own-linter --check"));
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

// ── breadcrumb: never clobbers a real file; replaced by full wiring ──────────
{
  const target = freshTarget("breadcrumb");
  try {
    fs.writeFileSync(path.join(target, "CLAUDE.md"), "# My real project notes — keep me\n");
    install(target, "opencode");
    const withBc = fs.readFileSync(path.join(target, "CLAUDE.md"), "utf8");
    check("[breadcrumb] real CLAUDE.md content preserved", withBc.includes("keep me"));
    check("[breadcrumb] breadcrumb merged into the existing file", withBc.includes("ai-dev:breadcrumb") && withBc.includes("--platform claude"));

    // the platform becomes active ⇒ its breadcrumb is replaced by the full wiring
    install(target, "claude");
    const wired = fs.readFileSync(path.join(target, "CLAUDE.md"), "utf8");
    check("[breadcrumb] replaced by full wiring when the platform becomes active", !wired.includes("ai-dev:breadcrumb") && wired.includes("@.ai-dev/PROTOCOL.md") && wired.includes("keep me"));
    // the other surface is REALLY wired (a prior install) ⇒ no false breadcrumb on it
    const agentsMd = fs.readFileSync(path.join(target, "AGENTS.md"), "utf8");
    check("[breadcrumb] no false breadcrumb on an already-wired surface", !agentsMd.includes("ai-dev:breadcrumb") && agentsMd.includes("@.ai-dev/PROTOCOL.md"));
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

// ── vendored installer self-re-run — the documented upgrade command ──────────
// INSTALL.md's upgrade path is `node .ai-dev/tooling/src/adapter/install.mjs <target>`;
// it used to ENOENT because layDownCore's sources (PROTOCOL.md, src/quality/,
// src/templates/) were never vendored (docs/decisions/upgrade-migration.md). This
// pins the regression: the vendored tree must be self-sufficient.
{
  const target = freshTarget("vendored");
  try {
    install(target, "claude");
    const vendoredInstaller = path.join(target, ".ai-dev", "tooling", "src", "adapter", "install.mjs");
    const r = spawnSync("node", [vendoredInstaller, target, "--platform", "claude"], { encoding: "utf8" });
    check("[vendored] self-re-run exits 0 (no ENOENT)", r.status === 0);
    const protocolSrc = fs.readFileSync(path.join(ROOT, "PROTOCOL.md"), "utf8");
    check("[vendored] PROTOCOL.md intact after self-re-run", fs.existsSync(path.join(target, ".ai-dev", "PROTOCOL.md")) && fs.readFileSync(path.join(target, ".ai-dev", "PROTOCOL.md"), "utf8") === protocolSrc);
    const engineSrc = fs.readFileSync(path.join(ROOT, "src", "adapter", "engine.mjs"), "utf8");
    check("[vendored] tooling not corrupted by the self-copy", fs.readFileSync(path.join(target, ".ai-dev", "tooling", "src", "adapter", "engine.mjs"), "utf8") === engineSrc);
    check("[vendored] same-version self-re-run leaves no upgrade marker", !fs.existsSync(path.join(target, ".ai-dev", "UPGRADING.md")));
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

// ── never clobber a real doc ─────────────────────────────────────────────────
{
  const target = freshTarget("clobber");
  try {
    fs.mkdirSync(path.join(target, "docs"), { recursive: true });
    const realDoc = path.join(target, "docs", "architecture.md");
    fs.writeFileSync(realDoc, "# the project's REAL architecture — keep me\n");
    install(target, "claude");
    check("[clobber] an existing real doc is never overwritten", fs.readFileSync(realDoc, "utf8").includes("keep me"));
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
}


// ── hasGitRepo — the CLI's no-repo warning predicate ─────────────────────────
{
  const target = freshTarget("gitcheck");
  try {
    check("[git] repo-less target detected", hasGitRepo(target) === false);
    fs.mkdirSync(path.join(target, ".git"), { recursive: true });
    check("[git] .git presence detected", hasGitRepo(target) === true);
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

console.log(`\nINSTALL: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log("PASS — installer vendors the adapter, wires the platform, and is idempotent");
