// The unified installer test — guards the one-command-install contract
// (docs/contracts/one-command-install.md). It installs the protocol into a temp
// target dir created INSIDE the repo root (the out-of-root deny blocks an external
// sibling, which is exactly why the target sits inside the root), then asserts the
// adapter is vendored, the platform is wired, the doc templates landed, and a
// SECOND run is idempotent (identical tree, no duplication).
//
// Run: node src/adapter/install.test.mjs

import { install, hasGitRepo } from "./install.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");

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
