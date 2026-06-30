// Nested-repo deny scoping — the SECURITY FLOOR fix for a legitimate separate-repo
// bootstrap (a nested `.git` under the session root, e.g. `_scratch/proj`).
//
// Two coupled changes, both proven here against REAL git fixtures (git-init'd repos,
// never mocked):
//   1. resolveSessionRoot anchors to the nearest `.ai-dev/config.json` marker — a nested
//      `.git` under it no longer flips the resolved root (the old `git rev-parse
//      --show-toplevel` did). The normal case is byte-identical (marker dir == toplevel).
//   2. the git-targeting denies (f4-floor `git add -A`, the merge-gate, and their family
//      siblings) fire ONLY when the command targets the SESSION repo. FAIL-CLOSED: the
//      signal is computed by session-root.mjs and defaults to TRUE (deny applies) on any
//      doubt; a command is exempt ONLY on positive confirmation cwd is a different repo.
//
// THE SECURITY INVARIANT proven below:
//   • from the session repo (cwd-toplevel == session toplevel): every existing f4 +
//     merge-gate deny still fires — ZERO regression (the undefined-signal path, which the
//     whole existing f4-floor/merge-gate suite exercises, stays DENY);
//   • a nested DIFFERENT repo exempts ONLY its own `add -A`/`push main` — they target a
//     separate git db + origin and can never move the protocol's main;
//   • the write-boundary / tooling denies stay session-root-anchored and unconditional —
//     change 1 fixes their root resolution, it does NOT exempt them in a nested repo.
//
// Run: node src/adapter/nested-repo-scope.test.mjs

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluate, loadConfig } from "./engine.mjs";
import { decide as claudeDecide } from "./claude/shim.mjs";
import { decide as ocDecide } from "./opencode/normalise.mjs";
import { findSessionMarkerRoot, resolveSessionRoot, targetsSessionRepo, gitToplevel } from "./session-root.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHIM = path.join(HERE, "claude", "shim.mjs");
const config = loadConfig(HERE);

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.log(`  ✗ ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
}

function gitInit(dir) {
  execFileSync("git", ["init", "-q"], { cwd: dir, stdio: ["ignore", "ignore", "ignore"] });
}

// ── REAL fixture: a configured session repo with a nested separate repo inside it ─
// session/  — .git + .ai-dev/config.json (the marker) → the SESSION root
//   _scratch/proj/ — its OWN .git, NO config.json → a separate NESTED repo
// Parent realpath'd so git's canonical --show-toplevel aligns with our expected paths.
function buildFixture() {
  const parent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ai-dev-nested-")));
  const session = path.join(parent, "session");
  const nested = path.join(session, "_scratch", "proj");
  fs.mkdirSync(nested, { recursive: true });
  gitInit(session);
  gitInit(nested);
  fs.mkdirSync(path.join(session, ".ai-dev", "state"), { recursive: true });
  fs.writeFileSync(path.join(session, ".ai-dev", "config.json"), "{}");
  fs.writeFileSync(path.join(session, "README.md"), "readme");
  // Put the session repo on a feature branch (the normal in-loop checkout) so a
  // `push origin main` is the unstamped-trunk deny, never a stamped one.
  execFileSync("git", ["symbolic-ref", "HEAD", "refs/heads/feature/x"], { cwd: session, stdio: "ignore" });
  return { parent, session, nested };
}

const fx = buildFixture();
try {
  // ── 1. resolveSessionRoot — the marker anchors past a nested `.git` ───────────
  console.log("RESOLVE-SESSION-ROOT (the .ai-dev/config.json marker anchors the session):");

  // 1a. cwd INSIDE the nested repo → the SESSION root (the nested `.git` does NOT flip it).
  check("nested-cwd-resolves-session", resolveSessionRoot(fx.nested), fx.session);
  // 1b. cwd at the session root → the session root (normal case, unchanged).
  check("session-cwd-resolves-session", resolveSessionRoot(fx.session), fx.session);
  // 1c. the marker walk returns the session root from the nested cwd.
  check("marker-walk-from-nested", findSessionMarkerRoot(fx.nested), fx.session);

  // 1d. NO marker anywhere (unconfigured) → git-toplevel fallback (old behaviour).
  {
    const u = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ai-dev-nomark-")));
    const repo = path.join(u, "repo");
    const sub = path.join(repo, "sub");
    fs.mkdirSync(sub, { recursive: true });
    gitInit(repo);
    check("no-marker-falls-to-git-toplevel", resolveSessionRoot(sub), repo);
    // 1e. no marker AND no git → cwd itself (last-resort fallback).
    const plain = path.join(u, "plain");
    fs.mkdirSync(plain, { recursive: true });
    check("no-marker-no-git-falls-to-cwd", resolveSessionRoot(plain), plain);
    fs.rmSync(u, { recursive: true, force: true });
  }

  // 1f. DEEPEST marker wins — a configured project nested under another resolves to ITS own root.
  {
    const w = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ai-dev-deep-")));
    const outer = path.join(w, "outer");
    const inner = path.join(outer, "inner");
    const leaf = path.join(inner, "leaf");
    fs.mkdirSync(leaf, { recursive: true });
    fs.mkdirSync(path.join(outer, ".ai-dev"), { recursive: true });
    fs.writeFileSync(path.join(outer, ".ai-dev", "config.json"), "{}");
    fs.mkdirSync(path.join(inner, ".ai-dev"), { recursive: true });
    fs.writeFileSync(path.join(inner, ".ai-dev", "config.json"), "{}");
    check("deepest-marker-wins", resolveSessionRoot(leaf), inner);
    fs.rmSync(w, { recursive: true, force: true });
  }

  // ── 2. targetsSessionRepo — fail-CLOSED scoping ──────────────────────────────
  console.log("TARGETS-SESSION-REPO (fail-closed: true unless a different repo is proven):");

  // 2a. cwd at the session root → TRUE (same git db).
  check("session-cwd-targets-session", targetsSessionRepo(fx.session, fx.session), true);
  // 2b. cwd in the nested DIFFERENT repo → FALSE (provably a separate git db).
  check("nested-cwd-different-repo", targetsSessionRepo(fx.nested, fx.session), false);
  // 2c. cwd git-unresolvable (a non-git dir) → TRUE (fail-closed — deny still applies).
  {
    const nogit = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ai-dev-nogit-")));
    check("cwd-unresolvable-fail-closed", targetsSessionRepo(nogit, fx.session), true);
    check("gitToplevel-nongit-is-null", gitToplevel(nogit), null);
    fs.rmSync(nogit, { recursive: true, force: true });
  }
  // 2d. a SUBDIR of the session repo (not a nested repo) → TRUE — the session repo's own
  // subtree is still the session repo (no false exemption of a plain subdir).
  {
    const sub = path.join(fx.session, "src");
    fs.mkdirSync(sub, { recursive: true });
    check("plain-subdir-targets-session", targetsSessionRepo(sub, fx.session), true);
  }

  // ── 3. ENGINE consumption — the gated predicates, fail-CLOSED ─────────────────
  // Drive the engine directly with an explicit signal: undefined (no signal) and true
  // ⇒ the deny fires (zero regression); false ⇒ exempt. Asserted for BOTH the f4 floor
  // (`git add -A`, `git commit` on main) and the merge-gate (`push origin main`).
  console.log("ENGINE CONSUMPTION (undefined/true ⇒ deny; false ⇒ allow):");
  function engineVerdict(command, signal, root = fx.session) {
    const input = { act: "bash", root, command };
    if (signal !== undefined) input.targetsSessionRepo = signal;
    return evaluate(input, config);
  }
  // 3a. git add -A
  check("add-all:no-signal-denies", engineVerdict("git add -A", undefined).verdict, "deny");
  check("add-all:session-true-denies", engineVerdict("git add -A", true).verdict, "deny");
  check("add-all:nested-false-allows", engineVerdict("git add -A", false).verdict, "allow");
  // 3b. push origin main (the session repo is on feature/x, no stamp → the merge-gate)
  check("push-main:no-signal-denies", engineVerdict("git push origin main", undefined).verdict, "deny");
  check("push-main:session-true-denies", engineVerdict("git push origin main", true).verdict, "deny");
  check("push-main:nested-false-allows", engineVerdict("git push origin main", false).verdict, "allow");
  // 3c. git commit on a main checkout of a configured repo with history — the F4 sibling.
  {
    const mc = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ai-dev-maincommit-")));
    fs.mkdirSync(path.join(mc, ".git", "refs", "heads"), { recursive: true });
    fs.writeFileSync(path.join(mc, ".git", "HEAD"), "ref: refs/heads/main\n");
    fs.writeFileSync(path.join(mc, ".git", "refs", "heads", "main"), "abc1234\n");
    fs.mkdirSync(path.join(mc, ".ai-dev"), { recursive: true });
    fs.writeFileSync(path.join(mc, ".ai-dev", "config.json"), "{}");
    check("commit-main:no-signal-denies", engineVerdict("git commit -m x", undefined, mc).verdict, "deny");
    check("commit-main:session-true-denies", engineVerdict("git commit -m x", true, mc).verdict, "deny");
    check("commit-main:nested-false-allows", engineVerdict("git commit -m x", false, mc).verdict, "allow");
    fs.rmSync(mc, { recursive: true, force: true });
  }

  // ── 4. PARITY — both shims consume the signal identically ─────────────────────
  // The engine is shared, so both shims' decide() must reach the same verdict for the
  // same explicit signal. (The OpenCode plugin entry does not COMPUTE the signal — see
  // normalise.mjs — but its decide() accepts and threads it, the mechanism under test.)
  console.log("PARITY (claude.decide == opencode.decide for the same signal):");
  for (const [name, cmd] of [["add-all", "git add -A"], ["push-main", "git push origin main"]]) {
    for (const [sig, want] of [[undefined, "deny"], [true, "deny"], [false, "allow"]]) {
      const opts = sig === undefined ? {} : { targetsSessionRepo: sig };
      const cv = claudeDecide({ tool_name: "Bash", tool_input: { command: cmd } }, fx.session, config, opts).verdict;
      const ov = ocDecide("bash", { command: cmd }, fx.session, false, config, opts).verdict;
      check(`parity:${name}:sig=${sig}:claude`, cv, want);
      check(`parity:${name}:sig=${sig}:opencode`, ov, want);
      check(`parity:${name}:sig=${sig}:agree`, cv, ov);
    }
  }

  // ── 5. END-TO-END through the REAL Claude shim subprocess ─────────────────────
  // The real hook path: `node shim.mjs`, payload (incl. cwd) on stdin, verdict on stdout.
  // This exercises resolveSessionRoot + targetsSessionRepo END TO END from the on-disk
  // fixture — the seam the engine-level cases above bypass.
  console.log("E2E REAL SHIM SUBPROCESS (cwd from the on-disk fixture):");
  function shimVerdict(payload) {
    const out = execFileSync("node", [SHIM], { input: JSON.stringify(payload), encoding: "utf8" }).trim();
    if (out === "") return "allow";
    try { return JSON.parse(out).hookSpecificOutput.permissionDecision; }
    catch { return `non-json:${out.slice(0, 60)}`; }
  }

  // 5a. write to the SESSION's .ai-dev/state from the NESTED cwd ⇒ ALLOW (change 1 fixes
  //     the write-boundary: the root anchors to the marker, not the nested `.git`).
  check("e2e:nested-cwd-write-session-state-allows",
    shimVerdict({ tool_name: "Write", tool_input: { file_path: path.join(fx.session, ".ai-dev", "state", "current.md"), content: "x" }, cwd: fx.nested }),
    "allow");
  // 5b. `git add -A` from the NESTED cwd ⇒ ALLOW (a different repo's own bulk-stage).
  check("e2e:nested-cwd-add-all-allows",
    shimVerdict({ tool_name: "Bash", tool_input: { command: "git add -A" }, cwd: fx.nested }), "allow");
  // 5c. unstamped `git push origin main` from the NESTED cwd ⇒ ALLOW (its own main).
  check("e2e:nested-cwd-push-main-allows",
    shimVerdict({ tool_name: "Bash", tool_input: { command: "git push origin main" }, cwd: fx.nested }), "allow");

  // 5d-f. THE SAME commands from the SESSION repo cwd ⇒ DENY (zero regression — the floor
  //       holds for the session repo).
  check("e2e:session-cwd-add-all-denies",
    shimVerdict({ tool_name: "Bash", tool_input: { command: "git add -A" }, cwd: fx.session }), "deny");
  check("e2e:session-cwd-push-main-denies",
    shimVerdict({ tool_name: "Bash", tool_input: { command: "git push origin main" }, cwd: fx.session }), "deny");
  // 5g. SECURITY: a write into the SESSION's `.ai-dev/tooling/` from the nested cwd STILL
  //     DENIES — change 1 anchors the root, it does NOT exempt the tooling carve-out.
  check("e2e:nested-cwd-session-tooling-write-denies",
    shimVerdict({ tool_name: "Write", tool_input: { file_path: path.join(fx.session, ".ai-dev", "tooling", "engine.mjs"), content: "x" }, cwd: fx.nested }),
    "deny");
  // 5h. SECURITY: a write OUTSIDE the session root from the nested cwd STILL DENIES (the
  //     boundary is the session root, not the nested repo).
  check("e2e:nested-cwd-write-outside-denies",
    shimVerdict({ tool_name: "Write", tool_input: { file_path: path.join(fx.parent, "escape.txt"), content: "x" }, cwd: fx.nested }),
    "deny");
} finally {
  fs.rmSync(fx.parent, { recursive: true, force: true });
}

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
