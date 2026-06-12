// Adapter integrity tests — the three guards the data-adapter design calls for
// (src/adapter/README.md "No regex drift"):
//
//   1. PARITY      — one shared fixture, each case run through BOTH shims' full
//                    path (normalise → shared engine → verdict). Both must reach
//                    the identical engine verdict, except where a platform's
//                    capability legitimately diverges (recorded per-case, printed).
//   2. SINGLE-ENGINE — grep each shim for rule logic (patterns, role lists). A
//                    predicate re-implemented in a shim instead of called from the
//                    engine makes a forbidden token appear, and this fails.
//   3. NODE-SPIKE  — the one unproven assumption: a Claude PreToolUse hook running
//                    `node shim.mjs` with the payload on stdin actually emits the
//                    deny JSON. Run as a real subprocess; also measure latency.
//
// Run: node src/adapter/parity.test.mjs

import { loadConfig } from "./engine.mjs";
import { decide as claudeDecide } from "./claude/shim.mjs";
import { decide as ocDecide, decidePrompt as ocDecidePrompt } from "./opencode/normalise.mjs";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const config = loadConfig(HERE);

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.log(`  ✗ ${name}: got ${got}, want ${want}`); }
}

// ── fixture root: a real tmp dir (paths are fs-checked by some predicates) ────
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "ai-pm-parity-"));
fs.writeFileSync(path.join(ROOT, "existing.txt"), "real content"); // for truncating-write
fs.writeFileSync(path.join(ROOT, "README.md"), "readme");          // for allow-read
const TOOLING = path.join(ROOT, ".ai-pm", "tooling", "engine.mjs"); // never-writable
const STAMP = path.join(ROOT, ".ai-pm", "reviews", "x_review.md");  // the Reviewer's deliverable

// A second root with an EXPLICIT `full` profile, for the orchestrator-content case
// only: the profile default is `solo` (PROTOCOL.md `## Project config`), so on the
// unconfigured ROOT that deny relaxes — only an explicit `full` keeps it. The
// default-resolution itself is pinned in rigor-profile.test.mjs.
const FULL = fs.mkdtempSync(path.join(os.tmpdir(), "ai-pm-parity-full-"));
fs.writeFileSync(path.join(FULL, "ai-pm.config.json"), '{ "profile": "full" }');
const ARCH = path.join(FULL, "docs", "architecture.md");           // canonical doc (not orch-writable)

// Each case carries BOTH platforms' native payloads + the expected ENGINE verdict
// (pre platform-mapping). `claudeExpect` / `opencodeExpect` override `expect` only
// where a platform's capability legitimately diverges — those are the documented
// divergences, printed below, never hidden.
const FIXTURE = [
  { name: "read-outside-root", expect: "deny",
    claude: { tool_name: "Read", tool_input: { file_path: "/etc/passwd" } },
    opencode: { tool: "read", args: { filePath: "/etc/passwd" } } },

  { name: "find-outside-root", expect: "deny",
    claude: { tool_name: "Bash", tool_input: { command: "find / -name secret" } },
    opencode: { tool: "bash", args: { command: "find / -name secret" } } },

  { name: "write-outside-root", expect: "deny",
    claude: { tool_name: "Write", tool_input: { file_path: "/etc/foo", content: "x" } },
    opencode: { tool: "write", args: { filePath: "/etc/foo", content: "x" } } },

  { name: "truncating-write", expect: "deny",
    claude: { tool_name: "Write", tool_input: { file_path: path.join(ROOT, "existing.txt"), content: "   " } },
    opencode: { tool: "write", args: { filePath: path.join(ROOT, "existing.txt"), content: "  " } } },

  // THE documented actor divergence: the orchestrator-content rule is mechanical
  // on OpenCode (session lookup resolves the actor) but persona on Claude (a hook
  // payload carries no session-role signal → isOrchestrator undefined → allow).
  // Runs on the explicit-`full` root — under the `solo` default this deny relaxes.
  { name: "orchestrator-authors-content", claudeExpect: "allow", opencodeExpect: "deny", divergence: true, root: FULL,
    claude: { tool_name: "Write", tool_input: { file_path: ARCH, content: "x" } },
    opencode: { tool: "write", args: { filePath: ARCH, content: "x" }, isOrchestrator: true } },

  { name: "self-patch-enforcer", expect: "deny",
    claude: { tool_name: "Write", tool_input: { file_path: TOOLING, content: "x" } },
    opencode: { tool: "write", args: { filePath: TOOLING, content: "x" } } },

  // The stamp-fabrication guard shares the actor divergence: the orchestrator
  // writing a review stamp is denied where the actor resolves (OpenCode), persona
  // on Claude (no session-role signal in the hook payload).
  { name: "orchestrator-writes-review-stamp", claudeExpect: "allow", opencodeExpect: "deny", divergence: true,
    claude: { tool_name: "Write", tool_input: { file_path: STAMP, content: "## Code review: APPROVED" } },
    opencode: { tool: "write", args: { filePath: STAMP, content: "## Code review: APPROVED" }, isOrchestrator: true } },

  { name: "merge-while-unstamped", expect: "deny",
    claude: { tool_name: "Bash", tool_input: { command: "git push origin feature/foo" } },
    opencode: { tool: "bash", args: { command: "git push origin feature/foo" } } },

  // The merge-gate's no-silent-pass companion: an UNRESOLVABLE topic (ROOT has no
  // .git HEAD ref, and a bare push names no branch ref) leaves the stamp
  // uncheckable — ask, never pass.
  { name: "merge-topic-unresolvable", expect: "ask",
    claude: { tool_name: "Bash", tool_input: { command: "git push" } },
    opencode: { tool: "bash", args: { command: "git push" } } },

  // A non-shell heredoc body is DATA: push prose inside it must not trip the
  // merge-gate verbs on either platform (the engine strips it before any rule).
  { name: "heredoc-body-is-data", expect: "allow",
    claude: { tool_name: "Bash", tool_input: { command: "python3 <<'EOF'\nprint(\"git push origin main\")\nEOF" } },
    opencode: { tool: "bash", args: { command: "python3 <<'EOF'\nprint(\"git push origin main\")\nEOF" } } },

  { name: "role-generic-in-seat", expect: "deny",
    claude: { tool_name: "Task", tool_input: { subagent_type: "general" } },
    opencode: { tool: "task", args: { subagent_type: "general" } } },

  { name: "role-duplicator-in-seat", expect: "deny",
    claude: { tool_name: "Task", tool_input: { subagent_type: "wb-development:coder" } },
    opencode: { tool: "task", args: { subagent_type: "wb-development:coder" } } },

  { name: "ssh-content-edit", expect: "deny",
    claude: { tool_name: "Bash", tool_input: { command: 'ssh host "sed -i s/a/b/ /etc/f"' } },
    opencode: { tool: "bash", args: { command: 'ssh host "sed -i s/a/b/ /etc/f"' } } },

  { name: "ssh-mutating-action", expect: "ask",
    claude: { tool_name: "Bash", tool_input: { command: 'ssh host "systemctl restart nginx"' } },
    opencode: { tool: "bash", args: { command: 'ssh host "systemctl restart nginx"' } } },

  { name: "force-push", expect: "ask",
    claude: { tool_name: "Bash", tool_input: { command: "git push --force origin topic" } },
    opencode: { tool: "bash", args: { command: "git push --force origin topic" } } },

  { name: "commit-no-verify", expect: "ask",
    claude: { tool_name: "Bash", tool_input: { command: "git commit --no-verify -m wip" } },
    opencode: { tool: "bash", args: { command: "git commit --no-verify -m wip" } } },

  // inject is prompt-act: Claude realises it via UserPromptSubmit, OpenCode via the
  // chat.message hook. The engine DECISION is asserted here for both platforms; that
  // the OpenCode plugin APPLIES the verdict (pushes a message part) is covered by
  // opencode-inject.test.mjs (driving the chat.message hook directly). A change-verb
  // prompt on the shared (UNconfigured) ROOT yields an inject; WHICH inject (setup vs
  // route) is asserted by ruleId in block 1b below.
  { name: "change-verb-prompt-injects", expect: "inject",
    claude: { hook_event_name: "UserPromptSubmit", prompt: "please implement the new export feature" },
    opencodePrompt: "please implement the new export feature" },

  { name: "allow-read-inside-root", expect: "allow",
    claude: { tool_name: "Read", tool_input: { file_path: path.join(ROOT, "README.md") } },
    opencode: { tool: "read", args: { filePath: path.join(ROOT, "README.md") } } },

  { name: "allow-spawn-pm-role", expect: "allow",
    claude: { tool_name: "Task", tool_input: { subagent_type: "pm-builder" } },
    opencode: { tool: "task", args: { subagent_type: "pm-builder" } } },
];

// ── 1. PARITY ────────────────────────────────────────────────────────────────
console.log("PARITY (each case through both shims → identical engine verdict):");
const divergences = [];
for (const c of FIXTURE) {
  const root = c.root ?? ROOT; // a case may pin its own root (the explicit-`full` one)
  let cv, ov;
  if (c.claude) {
    cv = claudeDecide(c.claude, root, config).verdict;
    check(`claude:${c.name}`, cv, c.claudeExpect ?? c.expect);
  }
  if (c.opencode) {
    ov = ocDecide(c.opencode.tool, c.opencode.args, root, c.opencode.isOrchestrator ?? false, config).verdict;
    check(`opencode:${c.name}`, ov, c.opencodeExpect ?? c.expect);
  }
  // Prompt-act cases drive the OpenCode chat.message path (decidePrompt) rather
  // than the tool path — same shared engine, asserting OpenCode reaches the same
  // verdict as Claude on a prompt.
  if (c.opencodePrompt) {
    ov = ocDecidePrompt(c.opencodePrompt, root, false, config).verdict;
    check(`opencode:${c.name}`, ov, c.opencodeExpect ?? c.expect);
  }
  // Cross-check: where both platforms run and NO divergence is declared, the two
  // shims must agree byte-for-byte on the verdict — the real anti-drift assertion.
  if (c.claude && (c.opencode || c.opencodePrompt) && !c.divergence) check(`parity:${c.name}`, cv, ov);
  if (c.divergence) divergences.push(`${c.name}: claude=${cv} opencode=${ov}`);
}
if (divergences.length) {
  console.log("  documented capability divergences (NOT drift — recorded per-case):");
  for (const d of divergences) console.log(`    • ${d}`);
}

// ── 1b. CONFIG-SENSITIVE INJECT: which inject fires depends on project state ───
// Three inject rules match a change-verb prompt; the engine returns the FIRST, in
// registry order: no-config-run-setup → no-product-brief-discover → change-route-
// reminder. So the prompt walks a three-stage ladder as the project fills in:
//   no config           ⇒ setup nudge,
//   configured, no brief ⇒ product-discovery nudge,
//   configured + brief   ⇒ route reminder.
// Asserted by ruleId (verdict is `inject` at every stage) — the only place the
// three injects are told apart. Engine-level and platform-independent (both
// Claude's UserPromptSubmit and OpenCode's chat.message reach the same engine),
// so asserted once via the Claude prompt path.
console.log("CONFIG-SENSITIVE INJECT (no config ⇒ setup; configured no-brief ⇒ discovery; configured+brief ⇒ route):");
const changePrompt = { hook_event_name: "UserPromptSubmit", prompt: "please implement the new export feature" };

// Stage 1 — unconfigured root: a fresh tmp dir with NO ai-pm.config.json.
const NOCFG = fs.mkdtempSync(path.join(os.tmpdir(), "ai-pm-nocfg-"));
check("no-config-run-setup:fires", claudeDecide(changePrompt, NOCFG, config).ruleId, "no-config-run-setup");
fs.rmSync(NOCFG, { recursive: true, force: true });

// Stage 2 — configured but NO docs/product.md ⇒ promptNeedsSetup is false but
// promptNeedsProductBrief is true ⇒ the discovery nudge fires.
const CFG = fs.mkdtempSync(path.join(os.tmpdir(), "ai-pm-cfg-"));
fs.writeFileSync(path.join(CFG, "ai-pm.config.json"), "{}");
check("no-product-brief-discover:fires-when-configured-no-brief", claudeDecide(changePrompt, CFG, config).ruleId, "no-product-brief-discover");

// Stage 2b — configured AND docs/product.md present but STILL THE TEMPLATE ⇒ the
// discovery nudge still fires (the 4.18.0 fix: install.mjs lands the template
// verbatim, so presence alone proved nothing — on every real install the nudge
// was dead code). Three sub-cases, one per detection layer:
//   the real template file (the exact install-landed content, end to end),
//   the sentinel alone (the forward-looking layer),
//   the legacy §0 placeholder alone (a pre-sentinel template, no first line).
fs.mkdirSync(path.join(CFG, "docs"));
fs.writeFileSync(path.join(CFG, "docs", "product.md"), fs.readFileSync(path.join(HERE, "..", "templates", "product.md")));
check("no-product-brief-discover:fires-on-installed-template", claudeDecide(changePrompt, CFG, config).ruleId, "no-product-brief-discover");
fs.writeFileSync(path.join(CFG, "docs", "product.md"), "<!-- ai-pm:template -->\n# Product brief\n");
check("no-product-brief-discover:fires-on-sentinel-marker", claudeDecide(changePrompt, CFG, config).ruleId, "no-product-brief-discover");
fs.writeFileSync(path.join(CFG, "docs", "product.md"), "# Product brief\n\n`<one plain sentence: what this product is and what it does. …>`\n");
check("no-product-brief-discover:fires-on-legacy-placeholder", claudeDecide(changePrompt, CFG, config).ruleId, "no-product-brief-discover");

// Stage 3 — configured AND docs/product.md present and FILLED (no template
// marker) ⇒ both setup and brief predicates are false ⇒ change-route-reminder fires.
fs.writeFileSync(path.join(CFG, "docs", "product.md"), "brief");
check("change-route-reminder:fires-when-configured-with-brief", claudeDecide(changePrompt, CFG, config).ruleId, "change-route-reminder");
// A non-change prompt on a configured root ⇒ no inject fires (allow).
check("configured:non-change-prompt-allows",
  claudeDecide({ hook_event_name: "UserPromptSubmit", prompt: "good morning" }, CFG, config).verdict, "allow");
fs.rmSync(CFG, { recursive: true, force: true });

// ── 2. SINGLE-ENGINE: no rule logic leaked into a shim ───────────────────────
// Tokens that appear ONLY in rule data/predicates (deny-rules.json / engine.mjs),
// never in legitimate normalise/verdict-map glue. If one shows up in a shim, a
// rule was re-implemented there and parity could silently drift.
console.log("SINGLE-ENGINE (shims carry no rule logic):");
const FORBIDDEN = ["wb-development", "systemctl", "force-with-lease", "no-verify", "реализ", "maskQuotedSpans"];
const SHIMS = ["claude/shim.mjs", "opencode/normalise.mjs", "opencode/plugin-entry.mjs"];
for (const rel of SHIMS) {
  const text = fs.readFileSync(path.join(HERE, rel), "utf8");
  const hit = FORBIDDEN.find((tok) => text.includes(tok));
  check(`no-rule-logic:${rel}`, hit ? `leaked:${hit}` : "clean", "clean");
}

// ── 3. NODE-SPIKE: a Claude hook running `node shim.mjs` denies via stdin ─────
console.log("NODE-SPIKE (Claude hook → node shim.mjs → deny JSON on stdin):");
const SHIM = path.join(HERE, "claude", "shim.mjs");
function runShim(payload) {
  return execFileSync("node", [SHIM], { input: JSON.stringify(payload), encoding: "utf8" });
}
// deny: a read outside root. cwd is a non-git tmp dir → root falls back to it.
const denyOut = runShim({ tool_name: "Read", tool_input: { file_path: "/etc/passwd" }, cwd: ROOT });
let denyOK = false;
try { denyOK = JSON.parse(denyOut).hookSpecificOutput.permissionDecision === "deny"; } catch { /* non-JSON output ⇒ denyOK stays false */ }
check("spike:deny-json", denyOK, true);
// allow: a read inside root prints nothing.
const allowOut = runShim({ tool_name: "Read", tool_input: { file_path: path.join(ROOT, "README.md") }, cwd: ROOT });
check("spike:allow-empty", allowOut.trim(), "");
// latency: the cost of node-per-call (the assumption being validated).
const N = 5; const t0 = process.hrtime.bigint();
for (let i = 0; i < N; i++) runShim({ tool_name: "Read", tool_input: { file_path: "/etc/passwd" }, cwd: ROOT });
const msPerCall = Number(process.hrtime.bigint() - t0) / 1e6 / N;
console.log(`  node-per-call latency ≈ ${msPerCall.toFixed(0)} ms (cold spawn; inline shell+jq is the fallback if a hot path needs it)`);

// ── cleanup + report ─────────────────────────────────────────────────────────
fs.rmSync(ROOT, { recursive: true, force: true });
fs.rmSync(FULL, { recursive: true, force: true });
console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
