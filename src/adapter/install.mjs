#!/usr/bin/env node
// The unified installer — the one realisation of the adapter's "install into a
// project" contract point (PROTOCOL.md `## Core and adapter`,
// docs/contracts/one-command-install.md). It automates exactly the manual
// procedure src/adapter/INSTALL.md documents: vendor the shared adapter, lay down
// the core, and wire the active platform — idempotently.
//
// This is ADAPTER-LAYER code: platform-specific by nature, so concrete platform
// names (claude / opencode, .claude/, .opencode/) are allowed here. The neutral
// core (PROTOCOL.md, the role bodies, docs/architecture.md prose) names none of them.
//
// Usage:  node src/adapter/install.mjs <target-dir> [--platform claude|opencode] [--dogfood]
//   platform: the --platform flag, else the target's .ai-dev/config.json `platform`,
//   else a clear error (never a silent guess).
//   --dogfood: SELF-HOST mode — only valid when the target IS the protocol's own
//   source repo. It wires the three tracked surfaces to the source tree (src/...),
//   skips vendoring .ai-dev/tooling/ and skips the .ai-dev/VERSION stamp + UPGRADING
//   marker, so a reinstall into this repo converges to the committed bytes
//   (git status clean) instead of churning tracked files to the downstream layout.
//   Fail-closed, symmetric: --dogfood against a non-source target, OR its absence
//   when the target IS the source repo, is a hard error (the footgun made loud).
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
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

// This script lives at <repo>/src/adapter/install.mjs — SOURCE is the protocol repo
// root (three dirs up), the tree we copy FROM.
const SOURCE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const PLATFORMS = ["claude", "opencode"];

// ── filesystem helpers ───────────────────────────────────────────────────────

// Recursively copy a directory tree, OVERWRITING files (so a re-run converges to
// the same bytes — idempotent). node:fs cpSync does this in one call; the explicit
// recursive form keeps the behaviour obvious and lets us skip node_modules / dot-git
// noise that must never be vendored. Identity guard: when the vendored installer
// re-runs from .ai-dev/tooling/ (the upgrade path), SOURCE and the vendor target
// coincide — copying a tree onto itself must be a no-op, never a truncation.
function copyTree(src, dest) {
  if (path.resolve(src) === path.resolve(dest)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
  }
}

// Copy a single file, overwriting (idempotent — same bytes on a re-run). Same
// identity guard as copyTree (the vendored self-re-run case).
function copyFile(src, dest) {
  if (path.resolve(src) === path.resolve(dest)) return;
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

// Run an install script as a child process (node, argv array — no shell).
// `scriptBase` is the dir the script's `scriptRelPath` is resolved against: the
// vendored tooling copy in downstream mode, the source tree (<target>/src/...) in
// dogfood mode — the children self-locate their ROOT three dirs up, so the source
// copies point ROOT at the repo root (correct for self-host). `env` overrides
// (e.g. AI_DEV_CONFIG) layer onto the current environment.
function runScript(scriptBase, scriptRelPath, args, env) {
  const script = path.join(scriptBase, scriptRelPath);
  execFileSync("node", [script, ...args], {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
}

// ── version stamp + upgrade detection (docs/decisions/upgrade-migration.md) ──

// The installing protocol's own version: this repo's package.json when running from
// the repo / the npx package; the vendored stamp (.ai-dev/tooling/VERSION, written by
// vendorTooling) when the vendored installer re-runs from a downstream's tooling dir.
function resolveSourceVersion() {
  const pkg = path.join(SOURCE, "package.json");
  if (fs.existsSync(pkg)) return JSON.parse(fs.readFileSync(pkg, "utf8")).version;
  const vendored = path.join(SOURCE, "VERSION");
  if (fs.existsSync(vendored)) return fs.readFileSync(vendored, "utf8").trim();
  throw new Error("cannot resolve the protocol version — neither package.json nor VERSION sits beside the installer's source root");
}

// The target's previously installed version, read BEFORE any write: the stamp where
// one exists; "pre-5.10" for an existing .ai-dev/ tree that predates the stamp
// (every version before the stamp shipped); null for a fresh install (no upgrade).
function readPriorVersion(target) {
  const stamp = path.join(target, ".ai-dev", "VERSION");
  if (fs.existsSync(stamp)) return fs.readFileSync(stamp, "utf8").trim();
  if (fs.existsSync(path.join(target, ".ai-dev"))) return "pre-5.10";
  return null;
}

// Stamp .ai-dev/VERSION on every run (outside the agent-read-denied tooling dir, so
// the session can read it). On a detected version CHANGE additionally write the
// transient handoff marker .ai-dev/UPGRADING.md and print the restart notice — an
// installer cannot restart a session; the print is the whole ask. The marker is the
// session's to consume and delete (orchestrator `## Upgrade`); a same-version re-run
// never touches it, so idempotence holds.
function stampVersion(target, version, prior) {
  fs.mkdirSync(path.join(target, ".ai-dev"), { recursive: true });
  fs.writeFileSync(path.join(target, ".ai-dev", "VERSION"), version + "\n");
  // An unconsumed marker from an earlier bump keeps its ORIGIN: the migration range
  // must start at the last version whose notes actually RAN, not at the last
  // stamped (installed-but-unmigrated) one — chained re-runs must not eat notes.
  const markerPath = path.join(target, ".ai-dev", "UPGRADING.md");
  if (prior && fs.existsSync(markerPath)) {
    const origin = fs.readFileSync(markerPath, "utf8").match(/Upgraded (\S+) → /);
    if (origin) prior = origin[1];
  }
  if (!prior || prior === version) return false;
  const date = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    markerPath,
    `# Protocol upgrade pending\n\nUpgraded ${prior} → ${version} on ${date}.\n` +
      `Next session: read the \`(${prior}, ${version}]\` sections of \`.ai-dev/upgrades.md\` and run the upgrade check ` +
      "(the orchestrator's `## Upgrade`); the check deletes this marker last.\n",
  );
  console.log(`\n⚠ Protocol upgraded ${prior} → ${version} — RESTART YOUR SESSION.`);
  console.log("  The next session will offer the migration check (.ai-dev/UPGRADING.md → .ai-dev/upgrades.md).");
  return true;
}

// ── steps ──────────────────────────────────────────────────────────────────

// 1. Vendor the shared adapter AND the neutral bodies the assembler reads, into the
// target's tooling location. The vendored install-*.mjs self-locate their ROOT as
// .ai-dev/tooling/ (three dirs up from the script), and read src/agents, src/modules,
// src/adapter from there — so all three must sit under .ai-dev/tooling/src/.
// Also vendored: everything the vendored installer ITSELF reads on the upgrade
// re-run (PROTOCOL.md, src/quality/, src/templates/ — layDownCore's sources) plus
// its own VERSION (resolveSourceVersion's vendored branch + the audit's skew check)
// — without these the documented upgrade command ENOENTs.
function vendorTooling(target, version) {
  const toolingRoot = path.join(target, ".ai-dev", "tooling");
  const tooling = path.join(toolingRoot, "src");
  copyTree(path.join(SOURCE, "src", "adapter"), path.join(tooling, "adapter"));
  copyTree(path.join(SOURCE, "src", "agents"), path.join(tooling, "agents"));
  copyTree(path.join(SOURCE, "src", "modules"), path.join(tooling, "modules"));
  copyTree(path.join(SOURCE, "src", "quality"), path.join(tooling, "quality"));
  copyTree(path.join(SOURCE, "src", "templates"), path.join(tooling, "templates"));
  copyFile(path.join(SOURCE, "PROTOCOL.md"), path.join(toolingRoot, "PROTOCOL.md"));
  fs.writeFileSync(path.join(toolingRoot, "VERSION"), version + "\n");
}

// 2. Lay down the core the downstream loads + the quality-layer shape.
// agents and modules are already vendored under .ai-dev/tooling/ (step 1);
// the downstream does NOT get a bare src/agents/ or src/modules/ at its root.
// Doc templates are NOT copied to the project root — they are accessible via
// .ai-dev/tooling/src/templates/ when product discovery / doc bootstrap run.
function layDownCore(target) {
  // The constitution lives inside .ai-dev/ — not at the project root.
  copyFile(path.join(SOURCE, "PROTOCOL.md"), path.join(target, ".ai-dev", "PROTOCOL.md"));

  // The quality layer: ship the SHAPE (the registry format + the runner),
  // NOT this repo's own tool rows. tools.json is laid down only where absent
  // so a project's own registry is never clobbered; the runner is the shared
  // mechanism and is overwritten.
  copyFile(path.join(SOURCE, "src", "quality", "run.mjs"), path.join(target, ".ai-dev", "quality", "run.mjs"));
  copyIfAbsent(path.join(SOURCE, "src", "templates", "tools.json"), path.join(target, ".ai-dev", "quality", "tools.json"));

  // The per-version migration notes, readable by the session (the tooling dir is
  // agent-read-denied). Overwritten every run — it is always the NEW version's copy.
  copyFile(path.join(SOURCE, "src", "adapter", "upgrades.md"), path.join(target, ".ai-dev", "upgrades.md"));

  // The session-state dir: gitignored (ensureTransientsGitignore) but the
  // orchestrator's first current.md write expects the parent to exist — create it
  // here so a fresh install is write-ready. Only state/; feedback/ and worktrees/
  // are created on demand by their own use.
  fs.mkdirSync(path.join(target, ".ai-dev", "state"), { recursive: true });
}

// 3. Ensure a config exists so the agent assembly has its `roles` bindings. A real
// project configures via /dev-setup; pre-setup we write a minimal default carrying
// the resolved platform + the standard seat ids. Written ONLY where absent — a
// re-run never overwrites the Operator's configured file. Config lives inside
// .ai-dev/ — not at the project root.
function ensureConfig(target, platform) {
  const dest = path.join(target, ".ai-dev", "config.json");
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

// 4. Ensure the local-only transient dirs are gitignored: state (the session
// pointer), feedback (the self-report holds RAW pre-leak-sweep context — a
// crash before its delete, or a blind `git add -A`, must not commit it), and
// worktrees (parallel-feature checkouts live inside the root so the
// project-boundary deny still covers them — but they are never repo content).
// Idempotent: appends only the lines not already present.
function ensureTransientsGitignore(target) {
  ensureLine(path.join(target, ".gitignore"), ".ai-dev/state/");
  ensureLine(path.join(target, ".gitignore"), ".ai-dev/feedback/");
  ensureLine(path.join(target, ".gitignore"), ".ai-dev/worktrees/");
}

// 5a. Wire Claude: assemble the agents + the setup command against the target root,
// merge the deny hooks into .claude/settings.json (keyed so a re-run never
// duplicates), and import the constitution + the orchestrator procedure via CLAUDE.md.
function wireClaude(target, dogfood) {
  const cfg = { AI_DEV_CONFIG: path.join(target, ".ai-dev", "config.json") };
  // Children run from the vendored tooling copy downstream, the source tree in
  // dogfood mode (they self-locate ROOT three dirs up — the source copies point
  // ROOT at the repo root, correct for self-host).
  const scriptBase = dogfood ? path.join(target, "src") : path.join(target, ".ai-dev", "tooling", "src");
  runScript(scriptBase, path.join("adapter", "claude", "install-agents.mjs"), [path.join(target, ".claude", "agents")], cfg);
  runScript(scriptBase, path.join("adapter", "claude", "install-commands.mjs"), [path.join(target, ".claude", "commands")], cfg);

  // Merge the two deny hooks into .claude/settings.json idempotently. The hook
  // fragment is the claude/hooks.json (the single home of the hook shape) — read
  // from the source tree in dogfood mode, the vendored copy downstream; we merge
  // its PreToolUse/UserPromptSubmit arrays, de-duping by command.
  const hooksFragment = JSON.parse(
    fs.readFileSync(path.join(scriptBase, "adapter", "claude", "hooks.json"), "utf8"),
  );
  // The hooks.json fragment carries the DOWNSTREAM shim path
  // (.ai-dev/tooling/src/adapter/claude/shim.mjs). In dogfood mode the active shim
  // is the source copy — retarget the command to src/adapter/claude/shim.mjs so the
  // wired settings.json matches the committed self-host form. The HOOK_MARKER (the
  // path tail) is unchanged, so the merge still prunes a prior group correctly.
  if (dogfood) {
    for (const groups of Object.values(hooksFragment.hooks)) {
      for (const g of groups) {
        for (const h of g.hooks || []) {
          if (typeof h.command === "string") {
            h.command = h.command.split(".ai-dev/tooling/src/adapter/claude/shim.mjs").join("src/adapter/claude/shim.mjs");
          }
        }
      }
    }
  }
  const settingsPath = path.join(target, ".claude", "settings.json");
  const settings = fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath, "utf8")) : {};
  settings.hooks = mergeHooks(settings.hooks || {}, hooksFragment.hooks);
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");

  // Load instructions: the orchestrator session loads the constitution + its
  // procedure via CLAUDE.md imports — appended only if not already present. A
  // breadcrumb left from when this platform was inactive is replaced by this
  // full wiring. Dogfood wires to the SOURCE paths (the committed self-host form);
  // downstream wires to the vendored layout.
  const claudeMd = path.join(target, "CLAUDE.md");
  stripBreadcrumbFile(claudeMd);
  ensureLine(claudeMd, dogfood ? "@PROTOCOL.md" : "@.ai-dev/PROTOCOL.md");
  ensureLine(claudeMd, dogfood ? "@src/agents/orchestrator.md" : "@.ai-dev/tooling/src/agents/orchestrator.md");

  // Self-verify the Claude wiring just written (item 3) — the symmetric twin of the
  // opencode plugin self-verify. A broken Claude deny path otherwise goes SILENTLY
  // off at the first tool call under a printed success; this FAILS THE INSTALL loudly.
  verifyClaudeWiring(target, settingsPath);
}

// Verify the Claude deny wiring just written actually holds: settings.json parses and
// carries the PreToolUse ai-dev hook entry, AND the shim it points at is loadable.
// THROWS (⇒ install exits non-zero) on any failure, naming the cause + the
// enforcement-off hint — mirroring the opencode plugin self-verify's message
// discipline. Honest scope: this proves the shim LOADS (syntax + its import chain),
// NOT that Claude invokes the hook at runtime (the registration class, the same
// residual the opencode plugin self-verify carries).
export function verifyClaudeWiring(target, settingsPath) {
  // 1. settings.json parses + carries the expected PreToolUse ai-dev hook entry.
  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch (e) {
    throw new Error(
      `Claude wiring self-verify FAILED: ${settingsPath} is not valid JSON — ` +
        "the deny path would be silently off at the first tool call. " +
        `Underlying parse error: ${e && e.message ? e.message : String(e)}`,
      { cause: e },
    );
  }
  const preGroups = (settings.hooks && settings.hooks.PreToolUse) || [];
  const shimCommand = preGroups
    .flatMap((g) => (g.hooks || []).map((h) => (typeof h.command === "string" ? h.command : "")))
    .find((c) => c.includes(HOOK_MARKER));
  if (!shimCommand) {
    throw new Error(
      `Claude wiring self-verify FAILED: ${settingsPath} carries no PreToolUse hook ` +
        `referencing the deny shim (${HOOK_MARKER}) — the deny path would be silently ` +
        "off at the first tool call.",
    );
  }

  // 1b. the matcher of OUR shim-routing group(s) still COVERS the floor's tools. The
  // mechanical floor RIDES specific tools (FLOOR_TOOLS): the merge-gate, remote-edit, and
  // git-add-all denies fire on `Bash` (push/commit/ssh are Bash ops); the role/seat
  // spawn-deny fires on `Task`. A PreToolUse matcher that has dropped either routes those
  // tool calls AROUND the shim, silently disabling that whole half of the deny layer — the
  // entry-exists check above does NOT catch it. Assert each floor tool is a whole-token
  // member of some shim-routing group's matcher; fail-closed (an absent/empty matcher
  // covers nothing). Honest scope: mergeHooks REPLACES our group on every install, so this
  // primarily guards a hooks.json source-regression that drops a floor tool (a downstream's
  // between-run manual matcher edit auto-heals on the next install) plus fail-closed
  // defense-in-depth. Persona sibling: the audit verification-coverage sweep
  // (src/agents/orchestrator.md `## Audit`).
  const shimMatchers = preGroups
    .filter((g) => (g.hooks || []).some((h) => typeof h.command === "string" && h.command.includes(HOOK_MARKER)))
    .map((g) => g.matcher);
  for (const tool of FLOOR_TOOLS) {
    if (!shimMatchers.some((m) => matcherCoversTool(m, tool))) {
      throw new Error(
        `Claude wiring self-verify FAILED: the PreToolUse deny-shim matcher in ${settingsPath} ` +
          `does not cover \`${tool}\` — the mechanical floor that rides ${tool} ` +
          `(${tool === "Bash" ? "the merge-gate, remote-edit, and git-add-all denies" : "the role/seat spawn-deny"}) ` +
          "would be silently off at the first tool call.",
      );
    }
  }

  // 2. the shim itself loads. Resolve its on-disk path from the WIRED command (so the
  // check works in both downstream and dogfood layouts), substituting the harness's
  // $CLAUDE_PROJECT_DIR for the real target root.
  const shimPath = resolveShimPath(target, shimCommand);
  if (!fs.existsSync(shimPath)) {
    throw new Error(
      `Claude wiring self-verify FAILED: the wired deny shim does not exist at ${shimPath} ` +
        "— the deny path would be silently off at the first tool call.",
    );
  }
  // `node --check` = a SYNTAX check that does NOT execute the shim (it reads stdin/argv
  // when run, so executing it here would hang); a child import() then catches a broken
  // dependency chain (the shim's top-level imports of engine.mjs / deny-rules.json).
  // Both via execFileSync with an argv ARRAY (no shell) — consistent with runScript.
  try {
    execFileSync("node", ["--check", shimPath], { stdio: "pipe" });
    execFileSync(
      "node",
      ["--input-type=module", "-e", `await import(${JSON.stringify(pathToFileURL(shimPath).href)})`],
      { stdio: "pipe" },
    );
  } catch (e) {
    const detail = e && e.stderr ? e.stderr.toString() : e && e.message ? e.message : String(e);
    throw new Error(
      `Claude wiring self-verify FAILED: the deny shim at ${shimPath} does not load — ` +
        `the deny path would be silently off at the first tool call. Underlying load error: ${detail}`,
      { cause: e },
    );
  }
}

// Resolve the shim's real on-disk path from the wired hook command. The command is
// `node "$CLAUDE_PROJECT_DIR/<rel>/shim.mjs"` (downstream) or `node "src/.../shim.mjs"`
// (dogfood, retargeted). Pull the token ending in the marker, strip the
// $CLAUDE_PROJECT_DIR prefix to the real target root, and resolve.
function resolveShimPath(target, command) {
  // The marker (HOOK_MARKER) is the path tail; the wired path is everything from the
  // start of the quoted/space-delimited shim token up to and including the marker.
  const tokens = command.match(/\S+/g) || [];
  const raw = tokens
    .map((t) => t.replace(/^["']|["']$/g, ""))
    .find((t) => t.includes(HOOK_MARKER));
  if (!raw) return path.join(target, ".ai-dev", "tooling", "src", HOOK_MARKER);
  const rel = raw
    .replace(/^["']/, "")
    .replace(/^\$CLAUDE_PROJECT_DIR\//, "")
    .replace(/^\$\{CLAUDE_PROJECT_DIR\}\//, "");
  return path.isAbsolute(rel) ? rel : path.join(target, rel);
}

// A hook group is OURS when any of its commands targets the protocol shim. The
// marker is the shim's stable path tail — it survives a vendor-location change
// (.ai-pm/tooling/ → .ai-dev/tooling/) where an exact-command compare would not.
const HOOK_MARKER = "adapter/claude/shim.mjs";

// The tools the mechanical floor RIDES — the PreToolUse matcher MUST route them to the
// shim or that half of the deny layer goes silently off. `Bash`: the merge-gate, the
// remote-edit deny, and the git-add-all guard (push/commit/ssh are Bash ops); `Task`:
// the role/seat spawn-deny. verifyClaudeWiring step 1b asserts both stay covered.
const FLOOR_TOOLS = ["Bash", "Task"];

// True when `tool` is a WHOLE alternation member of the matcher string (a regex-ish
// `A|B|C` Claude matches against the tool name). Whole-token membership via word
// boundaries — never a brittle exact-string compare — so a reordered, extended, or
// parenthesis-grouped (`(Read|Bash)`) matcher with the tool still present passes, while
// a substring like `BashTool`/`Bashful` does NOT count as coverage. `\b` is chosen over
// `|`-only anchors precisely because it also tolerates grouping (a trailing `)` defeats
// a `($|\|)` anchor); Claude's tool namespace is alphanumeric with no sub-word collision
// for `Bash`/`Task`, so `\b` carries no false positive here. Fail-closed: a non-string or
// empty matcher covers nothing. `tool` is only ever a fixed FLOOR_TOOLS literal (no regex
// metacharacters), so no escaping is required at this call site.
function matcherCoversTool(matcher, tool) {
  if (typeof matcher !== "string" || !matcher) return false;
  return new RegExp(`\\b${tool}\\b`).test(matcher);
}

// Merge a hooks fragment into an existing hooks object: foreign groups are kept
// untouched; every group recognised as ours (HOOK_MARKER) is REPLACED by the
// fragment's current group. Replace-not-append is both the idempotence guarantee
// (a re-run converges to the same bytes) and the prune: a stale ai-dev group whose
// command changed no longer accumulates beside the new one.
function mergeHooks(existing, fragment) {
  const merged = { ...existing };
  for (const [event, groups] of Object.entries(fragment)) {
    const foreign = (Array.isArray(merged[event]) ? merged[event] : []).filter(
      (g) => !(g.hooks || []).some((h) => typeof h.command === "string" && h.command.includes(HOOK_MARKER)),
    );
    merged[event] = [...foreign, ...groups];
  }
  return merged;
}

// ── cross-platform breadcrumb (backlog: downstream field report 2026-06-13) ──
// The INACTIVE platform always gets a minimal load-surface: a session opened on the
// unwired platform otherwise starts with zero protocol surface and cannot even know
// what it is missing (the platform-switch offer is prose that never loads there).
// The block is marker-delimited so a re-run REPLACES it (never duplicates, never
// clobbers the file's real content) and the active wiring can strip it.

const BREADCRUMB_OPEN = "<!-- ai-dev:breadcrumb -->";
const BREADCRUMB_CLOSE = "<!-- /ai-dev:breadcrumb -->";

// Remove a previously written breadcrumb block from a text, leaving the real
// content (normalised to one trailing newline) — the strip half of replace.
function stripBreadcrumb(text) {
  const start = text.indexOf(BREADCRUMB_OPEN);
  if (start < 0) return text;
  const close = text.indexOf(BREADCRUMB_CLOSE);
  const end = close < 0 ? text.length : close + BREADCRUMB_CLOSE.length;
  const kept = text.slice(0, start) + text.slice(end).replace(/^\n+/, "");
  return kept.replace(/\n+$/, "\n").replace(/^\n$/, "");
}

// Strip the breadcrumb from a file in place — called by the active platform's
// wiring: when a platform becomes active, its full wiring REPLACES the breadcrumb.
function stripBreadcrumbFile(file) {
  if (!fs.existsSync(file)) return;
  const existing = fs.readFileSync(file, "utf8");
  const kept = stripBreadcrumb(existing);
  if (kept !== existing) fs.writeFileSync(file, kept);
}

// Write (replace) the breadcrumb on the inactive platform's load surface. Skipped
// when that surface already carries the real protocol import (a prior platform
// switch left both wirings live) — a "not wired" claim there would be false.
function writeInactiveBreadcrumb(target, activePlatform, dogfood) {
  // Dogfood mode: BOTH load surfaces (CLAUDE.md and AGENTS.md) are real,
  // hand-authored, committed files carrying their own protocol content — appending a
  // breadcrumb to the inactive one would churn a tracked file (break idempotency).
  // The self-host repo always carries both wirings; no breadcrumb is ever needed.
  if (dogfood) return;
  const inactive = activePlatform === "claude" ? "opencode" : "claude";
  const file = path.join(target, inactive === "claude" ? "CLAUDE.md" : "AGENTS.md");
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const kept = stripBreadcrumb(existing);
  if (kept.split("\n").some((l) => l.trim() === "@.ai-dev/PROTOCOL.md")) {
    if (kept !== existing) fs.writeFileSync(file, kept);
    return;
  }
  const harness = inactive === "claude" ? "Claude Code" : "OpenCode";
  const block = [
    BREADCRUMB_OPEN,
    `This project runs the **ai-dev protocol**; its active platform is **${activePlatform}** — this ${harness} session has no protocol wiring yet.`,
    `Run \`node .ai-dev/tooling/src/adapter/install.mjs . --platform ${inactive}\` to wire ${harness}, then offer the Operator the platform switch (\`.ai-dev/tooling/src/agents/orchestrator.md\` \`## Setup\`, "Platform switch").`,
    BREADCRUMB_CLOSE,
  ].join("\n");
  const sep = kept ? (kept.endsWith("\n") ? "\n" : "\n\n") : "";
  fs.writeFileSync(file, kept + sep + block + "\n");
}

// 5b. Wire OpenCode: assemble the three agents + the setup command + generate the
// plugin (downstream layout, since the adapter is now vendored under .ai-dev/tooling/),
// merge opencode.json keys, and import the constitution via AGENTS.md.
function wireOpenCode(target, dogfood) {
  const cfg = { AI_DEV_CONFIG: path.join(target, ".ai-dev", "config.json") };
  const scriptBase = dogfood ? path.join(target, "src") : path.join(target, ".ai-dev", "tooling", "src");
  runScript(scriptBase, path.join("adapter", "opencode", "install-agents.mjs"), [path.join(target, ".opencode", "agents")], cfg);
  runScript(scriptBase, path.join("adapter", "opencode", "install-commands.mjs"), [path.join(target, ".opencode", "commands")], cfg);
  // The plugin generator resolves the adapter layout from the TARGET root (passed via
  // --root). Downstream: the target has .ai-dev/tooling/src/adapter ⇒ tooling-submodule
  // import path. Dogfood: the target has src/adapter/opencode/plugin-entry.mjs ⇒
  // detectLayout resolves the DEV layout ⇒ the deployed plugin imports ../../src/adapter
  // (the committed self-host form) — no extra flag needed, the existing signal handles it.
  runScript(
    scriptBase,
    path.join("adapter", "opencode", "install-plugin.mjs"),
    [path.join(target, ".opencode", "plugins", "ai-dev.mjs"), "--root", target],
    cfg,
  );

  // opencode.json — merge the protocol's keys without dropping a project's own.
  // Key order matters for byte-idempotency in dogfood mode: the committed self-host
  // file leads with $schema and orders permission question→edit→bash→webfetch, so
  // dogfood emits exactly that canonical shape (the committed opencode.json is the
  // single home of that form; the installer converges to it rather than the reverse).
  const ocPath = path.join(target, ".opencode", "opencode.json");
  const existing = fs.existsSync(ocPath) ? JSON.parse(fs.readFileSync(ocPath, "utf8")) : {};
  // The protocol plugin is the SOLE project-boundary guard; OpenCode's native
  // permission dial is set to full-speed inside the project. Division of labor:
  // plugin = the mechanical boundary (deny outside-root reads/writes/finds);
  // native permission = speed dial for tool calls inside the boundary.
  // Honest residual: bash boundary is best-effort (the engine parses obvious path
  // tokens; an opaque escape like `python3 -c` is not mechanically caught). edit/read/write
  // tool checks are exact; webfetch=allow because research needs it (exfil via
  // HTTP is a separate persona rule, not a filesystem-boundary concern).
  const instructionsEntry = dogfood ? "PROTOCOL.md" : ".ai-dev/PROTOCOL.md";
  // The boundary-deny plugin MUST be registered in the `plugin` key — OpenCode
  // 1.17.8 dropped project-folder plugin auto-discovery, so a plugin sitting at
  // .opencode/plugins/ai-dev.mjs loads ONLY when listed here. Without this key the
  // whole [mechanical] floor is silently absent on every downstream (the bug this
  // restores). The spec is `.opencode/`-relative — opencode resolves a relative
  // plugin path against the dir of opencode.json (i.e. .opencode/), NOT the project
  // root — so it is `./plugins/ai-dev.mjs` (the plugin always deploys to
  // .opencode/plugins/ai-dev.mjs in both dogfood and downstream layouts). De-duped
  // via Set so a project's own `plugin` entries are preserved, never clobbered, and
  // a re-install never doubles ours.
  const PLUGIN_ENTRY = "./plugins/ai-dev.mjs";
  let oc;
  if (dogfood) {
    oc = {
      ...(existing.$schema ? { $schema: existing.$schema } : { $schema: "https://opencode.ai/config.json" }),
      default_agent: "ai-dev",
      instructions: Array.from(new Set([...(existing.instructions || []), instructionsEntry])),
      permission: { ...(existing.permission || {}), question: "allow", edit: "allow", bash: "allow", webfetch: "allow" },
      agent: { ...(existing.agent || {}), build: { disable: true }, plan: { disable: true } },
      plugin: Array.from(new Set([...(existing.plugin || []), PLUGIN_ENTRY])),
    };
  } else {
    oc = { ...existing };
    oc.default_agent = "ai-dev";
    oc.instructions = Array.from(new Set([...(oc.instructions || []), instructionsEntry]));
    oc.permission = { ...(oc.permission || {}), edit: "allow", bash: "allow", webfetch: "allow", question: "allow" };
    oc.agent = { ...(oc.agent || {}), build: { disable: true }, plan: { disable: true } };
    oc.plugin = Array.from(new Set([...(oc.plugin || []), PLUGIN_ENTRY]));
  }
  fs.mkdirSync(path.dirname(ocPath), { recursive: true });
  fs.writeFileSync(ocPath, JSON.stringify(oc, null, 2) + "\n");

  // AGENTS.md is OpenCode's always-on surface. Downstream: import the constitution
  // via an @-line (replacing any breadcrumb). Dogfood: the committed AGENTS.md is a
  // rich hand-authored file that loads PROTOCOL.md via opencode.json `instructions`,
  // NOT an @-import — so dogfood only strips a stale breadcrumb and never appends an
  // @-line that isn't in the committed form.
  const agentsMd = path.join(target, "AGENTS.md");
  stripBreadcrumbFile(agentsMd);
  if (!dogfood) ensureLine(agentsMd, "@.ai-dev/PROTOCOL.md");
}

// The stale-npx-cache heuristic (item 2), as a pure predicate so it is unit-testable
// without a heavyweight _npx tree on disk. A re-run that did NOT bump the version
// (prior === version, both non-null) is the stale-no-op signature WHEN the source was
// fetched via npx — detected by an `_npx` path SEGMENT in the installer's own source
// root (npx extracts the GitHub checkout under <cache>/_npx/...). HEURISTIC, not
// detection: the installer runs FROM the (possibly stale) source, so it cannot KNOW it
// is stale; this surfaces the signal so the Operator can judge. Absent `_npx` ⇒ false
// (no false alarm: a git-clone / repo run never trips it).
export function isStaleNpxReRun(sourcePath, prior, version) {
  if (!prior || !version || prior !== version) return false;
  return String(sourcePath).split(path.sep).includes("_npx");
}

// 6. Lay down the LOCAL pre-push quality gate (F3): a git pre-push hook that runs
// the registry runner WHOLESALE (`node .ai-dev/quality/run.mjs build`) and blocks a
// push of build-beat-failing code before it leaves the machine — the local
// complement to the once-per-project remote CI offer (orchestrator `## Your seat`).
// Single-home discipline: it invokes the runner, never a re-listed tool subset (same
// rule as the CI wiring). Default-ON downstream; never written in dogfood mode (the
// source repo carries its own committed hooks). Returns one of:
//   "written"     — a fresh hook was written (or our own prior hook refreshed)
//   "foreign"     — a non-ai-dev pre-push hook exists; left UNTOUCHED, warning surfaced
//   "no-repo"     — no <target>/.git ⇒ skipped silently (the install already warns)
// The marker line lets a re-run recognise its own hook (overwrite ⇒ idempotent
// refresh) while NEVER clobbering a project's own pre-push hook (fail-safe).
const PREPUSH_MARKER = "# ai-dev:pre-push";
const PREPUSH_BODY =
  "#!/bin/sh\n" +
  PREPUSH_MARKER + "\n" +
  "# Local quality gate — blocks a push of build-beat-failing code (the registry\n" +
  "# runner, WHOLESALE — never a re-listed tool subset). Bypass with --no-verify.\n" +
  "# Remove this file to opt out. The merge-gate + remote CI are the other two layers.\n" +
  "node .ai-dev/quality/run.mjs build\n";

function installPrePushHook(target) {
  const gitDir = path.join(target, ".git");
  if (!fs.existsSync(gitDir)) return "no-repo"; // no repo ⇒ skip (install already warns)
  const hooksDir = path.join(gitDir, "hooks");
  const hookPath = path.join(hooksDir, "pre-push");
  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, "utf8");
    if (!existing.includes(PREPUSH_MARKER)) {
      // A project's OWN pre-push hook — never clobber it (fail-safe). Warn + proceed.
      console.log(
        `\n⚠ A pre-push hook already exists at ${hookPath} and is not ai-dev's — left UNTOUCHED.`,
      );
      console.log("  To get the local quality gate, add this line to it:  node .ai-dev/quality/run.mjs build");
      return "foreign";
    }
    // Our own prior hook ⇒ overwrite (idempotent refresh, converges to identical bytes).
  }
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.writeFileSync(hookPath, PREPUSH_BODY, { mode: 0o755 });
  fs.chmodSync(hookPath, 0o755); // ensure executable even if the file pre-existed
  return "written";
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
  const cfgPath = path.join(target, ".ai-dev", "config.json");
  if (fs.existsSync(cfgPath)) {
    const platform = JSON.parse(fs.readFileSync(cfgPath, "utf8")).platform;
    if (PLATFORMS.includes(platform)) return platform;
  }
  throw new Error(
    `cannot resolve the platform — pass --platform ${PLATFORMS.join("|")} ` +
      `or set "platform" in ${path.join(target, ".ai-dev", "config.json")}`,
  );
}

// Is `target` the protocol's OWN source repo? The sentinel is the installer's own
// source presence at <target>/src/adapter/install.mjs (the same SOURCE===target
// signal install-plugin.mjs uses with plugin-entry.mjs). A real downstream never
// carries the installer source at its root.
function isSourceRepo(target) {
  return fs.existsSync(path.join(target, "src", "adapter", "install.mjs"));
}

// Install the protocol into `targetDir`. Returns the resolved platform. Exported so
// the test drives it directly against a temp dir. `opts.dogfood` selects SELF-HOST
// mode (wire to src/, skip vendoring + stamping) — fail-closed and symmetric: it is
// valid ONLY against the protocol's own source repo, and its ABSENCE against that
// repo is equally a hard error (the footgun made loud, the Operator's call).
export function install(targetDir, platformFlag, opts = {}) {
  const target = path.resolve(targetDir);
  const dogfood = !!opts.dogfood;
  const source = isSourceRepo(target);
  if (dogfood && !source) {
    throw new Error(
      "--dogfood is only valid when installing into the protocol's own source repo " +
        `(no src/adapter/install.mjs found under ${target}) — drop the flag for a downstream install`,
    );
  }
  if (!dogfood && source) {
    throw new Error(
      `target ${target} IS the protocol's own source repo — pass --dogfood to wire it to its own src/ ` +
        "(a downstream-mode install here would churn the tracked source-mode files)",
    );
  }

  const platform = resolvePlatform(target, platformFlag);

  if (dogfood) {
    // SELF-HOST: skip vendoring AND skip layDownCore — the self-host repo carries its
    // core at the root (PROTOCOL.md, src/quality/, src/templates/), so it needs no
    // copy under .ai-dev/ (a copy would be untracked debris that breaks idempotency).
    // No version stamp / UPGRADING marker either — the repo's authoritative version is
    // its own package.json (read live). config.json + .gitignore are committed and
    // present, so ensureConfig / ensureTransientsGitignore are no-ops; only the
    // gitignored session-state dir is created for write-readiness. This is the path
    // that converges to the committed bytes (git status clean).
    fs.mkdirSync(path.join(target, ".ai-dev", "state"), { recursive: true });
    ensureConfig(target, platform);
    ensureTransientsGitignore(target);
    if (platform === "claude") wireClaude(target, true);
    else wireOpenCode(target, true);
    return platform;
  }

  const version = resolveSourceVersion();
  const prior = readPriorVersion(target); // BEFORE any write creates .ai-dev/

  vendorTooling(target, version);
  layDownCore(target);
  ensureConfig(target, platform);
  ensureTransientsGitignore(target);
  if (platform === "claude") wireClaude(target, false);
  else wireOpenCode(target, false);
  writeInactiveBreadcrumb(target, platform, false);
  installPrePushHook(target); // F3 local quality gate (default-ON; never-clobber)
  stampVersion(target, version, prior);

  return platform;
}

// Does the target carry a git repository? The protocol's loop stands on git
// (branches, commits, the merge-gate reads pushes) — the CLI warns when none
// exists. A check, never an init: a one-shot script must not mutate the
// target's VCS state; the interactive offer lives in setup's repo check
// (src/agents/orchestrator.md `## Setup` step 0). Exported for the test.
export function hasGitRepo(targetDir) {
  return fs.existsSync(path.join(path.resolve(targetDir), ".git"));
}

// CLI entry — only when invoked directly, not when imported by the test. argv[1] is
// realpath'd because an npm bin shim invokes this file through a symlink, while the
// loaded module URL is the real path — without it the npx run would silently no-op.
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const flagIdx = args.indexOf("--platform");
  const platformFlag = flagIdx >= 0 ? args[flagIdx + 1] : undefined;
  const dogfood = args.includes("--dogfood");
  const targetDir = args.find((a, i) => !a.startsWith("--") && (flagIdx < 0 || i !== flagIdx + 1));

  if (!targetDir) {
    console.error("Usage: node src/adapter/install.mjs <target-dir> [--platform claude|opencode] [--dogfood]");
    process.exit(2);
  }

  try {
    // Loud version banner (item 2) — print the EXACT version being installed FIRST,
    // before the per-step lines, so a stale-cache no-op is visible. Skipped in dogfood
    // (the source repo's version is its live package.json, not an install stamp). The
    // resolve is best-effort: a failure must not abort the install, so guard it.
    let bannerVersion = null, priorBeforeInstall = null;
    if (!dogfood) {
      try {
        bannerVersion = resolveSourceVersion();
        priorBeforeInstall = readPriorVersion(path.resolve(targetDir));
        console.log(`\n→ Installing ai-dev-protocol v${bannerVersion}`);
        if (priorBeforeInstall && priorBeforeInstall !== "pre-5.10") {
          console.log(`  (previously installed: v${priorBeforeInstall})`);
        }
      } catch { /* a version-resolve failure is non-fatal to the banner */ }
    }

    const platform = install(targetDir, platformFlag, { dogfood });
    const rel = path.relative(process.cwd(), path.resolve(targetDir)) || ".";
    if (dogfood) {
      console.log(`\nInstalled the ai-dev protocol into ${rel} in DOGFOOD (self-host) mode (platform: ${platform}).`);
      console.log("  • wired the tracked surfaces to the source tree (src/...) — no .ai-dev/tooling/ vendored copy");
      console.log("  • skipped the .ai-dev/VERSION stamp + UPGRADING marker (the repo's version is its own package.json)");
      console.log(`  • wired ${platform} (deny hooks, agents, the /dev-setup command${platform === "opencode" ? ", the plugin" : ""}) against src/`);
      console.log("  • a reinstall here converges to the committed bytes — git status stays clean");
      process.exit(0);
    }
    console.log(`\nInstalled the ai-dev protocol into ${rel} (platform: ${platform}).`);
    console.log("  • vendored the shared adapter into .ai-dev/tooling/ (self-sufficient for the upgrade re-run)");
    console.log("  • laid down .ai-dev/PROTOCOL.md, .ai-dev/quality/ (the quality-runner shape), and .ai-dev/upgrades.md");
    console.log("  • wrote .ai-dev/config.json (minimal default — run /dev-setup to configure)");
    console.log(`  • wired ${platform} (deny hooks, agents, the /dev-setup command${platform === "opencode" ? ", the plugin" : ""})`);
    console.log("  • stamped .ai-dev/VERSION and left a breadcrumb load-surface for the inactive platform");
    if (!hasGitRepo(targetDir)) {
      console.log("\n⚠ No git repository found — the protocol's loop (branches, reviews, merges) requires one.");
      console.log("  Initialize before the first feature:  git init -b main && git add . && git commit -m 'init'");
      console.log("  (setup will also offer this; the remote — gh repo create / git remote add — is yours.)");
    }
    // Stale-npx-cache caveat (item 2, HEURISTIC) — a re-run that did NOT bump the
    // version (prior === installed) is the stale-no-op signature WHEN the Operator
    // believed they were updating. Fired only when the source was fetched via npx
    // (an `_npx` segment in the installer's own source path) — absent ⇒ no caveat,
    // no false alarm. The installer runs FROM the (possibly stale) source, so it
    // CANNOT know it is stale; this makes the version loud so the Operator can judge.
    if (isStaleNpxReRun(SOURCE, priorBeforeInstall, bannerVersion)) {
      console.log(`\n⚠ Same version as before (v${bannerVersion}) — if you expected a newer one, the npx cache may be STALE.`);
      console.log("  Clear it and re-run:  rm -rf \"$(npm config get cache)/_npx\"   (or use the git-clone path)");
      console.log("  See README `## Updating an existing install`.");
    }
    console.log("\nNext: run /dev-setup to configure roles, models, mode, and the module kit.");
  } catch (e) {
    console.error(`install failed: ${e.message}`);
    process.exit(1);
  }
}
