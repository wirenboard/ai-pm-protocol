// The downstream target's filesystem setup steps — platform-agnostic: vendor the
// shared adapter, lay down the core + quality shape, deploy the readable procedure
// bodies, ensure the config + gitignore, and install the local pre-push quality gate.
// The platform wiring (install-claude / install-opencode) runs AFTER these.

import fs from "node:fs";
import path from "node:path";
import { SOURCE, copyTree, copyFile, copyIfAbsent, ensureLine } from "./install-fs.mjs";

// ── steps ──────────────────────────────────────────────────────────────────

// 1. Vendor the shared adapter AND the neutral bodies the assembler reads, into the
// target's tooling location. The vendored install-*.mjs self-locate their ROOT as
// .ai-dev/tooling/ (three dirs up from the script), and read src/agents, src/modules,
// src/adapter from there — so all three must sit under .ai-dev/tooling/src/.
// Also vendored: everything the vendored installer ITSELF reads on the upgrade
// re-run (PROTOCOL.md, src/quality/, src/templates/ — layDownCore's sources) plus
// its own VERSION (resolveSourceVersion's vendored branch + the audit's skew check)
// — without these the documented upgrade command ENOENTs.
export function vendorTooling(target, version) {
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
export function layDownCore(target) {
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

// 2b. Deploy the on-demand procedure bodies (src/agents/procedures/) to a READABLE,
// non-tooling home: .ai-dev/procedures/. The orchestrator reads a procedure when its
// trigger fires (e.g. parallel-work) via the stable path .ai-dev/procedures/<x>.md —
// the SAME path in dogfood and downstream. vendorTooling also copies them under
// .ai-dev/tooling/src/agents/procedures/ (for the upgrade re-run), but that subtree is
// read-denied unconditionally (invariant 2), so the AGENT cannot read them there; this
// readable copy is the one the trigger resolves to. Source of truth stays
// src/agents/procedures/ (one home); this is the deployed copy, committed + drift-guarded
// (install-drift.test.mjs), like the assembled .opencode/.claude artifacts. Runs in BOTH
// modes — in dogfood SOURCE===target so it converges to the committed bytes (git clean).
export function deployProcedures(target) {
  copyTree(
    path.join(SOURCE, "src", "agents", "procedures"),
    path.join(target, ".ai-dev", "procedures"),
  );
}

// 3. Ensure a config exists so the agent assembly has its `roles` bindings. A real
// project configures via /dev-setup; pre-setup we write a minimal default carrying
// the resolved platform + the standard seat ids. Written ONLY where absent — a
// re-run never overwrites the Operator's configured file. Config lives inside
// .ai-dev/ — not at the project root.
// Returns TRUE when it actually wrote the default, FALSE when an existing config was
// kept — so the install summary reports the truth instead of an unconditional
// "wrote config" that scares a re-installing Operator into thinking their pins were
// clobbered (docs/decisions/multi-model-setup-ux.md papercut 9).
// The default carries NO roles.orchestrator.model: the orchestrator is the running
// session, its model is the launch model, never a baked pin (papercut 2).
export function ensureConfig(target, platform) {
  const dest = path.join(target, ".ai-dev", "config.json");
  if (fs.existsSync(dest)) return false;
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
  return true;
}

// 4. Ensure the local-only transient dirs are gitignored: state (the session
// pointer), feedback (the self-report holds RAW pre-leak-sweep context — a
// crash before its delete, or a blind `git add -A`, must not commit it), and
// worktrees (parallel-feature checkouts live inside the root so the
// project-boundary deny still covers them — but they are never repo content).
// Idempotent: appends only the lines not already present.
export function ensureTransientsGitignore(target) {
  ensureLine(path.join(target, ".gitignore"), ".ai-dev/state/");
  ensureLine(path.join(target, ".gitignore"), ".ai-dev/feedback/");
  ensureLine(path.join(target, ".gitignore"), ".ai-dev/worktrees/");
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

export function installPrePushHook(target) {
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
