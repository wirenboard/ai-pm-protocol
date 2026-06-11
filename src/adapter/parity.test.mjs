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
const ARCH = path.join(ROOT, "docs", "architecture.md");           // canonical doc (not orch-writable)
const TOOLING = path.join(ROOT, ".ai-pm", "tooling", "engine.mjs"); // never-writable

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
  { name: "orchestrator-authors-content", claudeExpect: "allow", opencodeExpect: "deny", divergence: true,
    claude: { tool_name: "Write", tool_input: { file_path: ARCH, content: "x" } },
    opencode: { tool: "write", args: { filePath: ARCH, content: "x" }, isOrchestrator: true } },

  { name: "self-patch-enforcer", expect: "deny",
    claude: { tool_name: "Write", tool_input: { file_path: TOOLING, content: "x" } },
    opencode: { tool: "write", args: { filePath: TOOLING, content: "x" } } },

  { name: "merge-while-unstamped", expect: "deny",
    claude: { tool_name: "Bash", tool_input: { command: "git push origin feature/foo" } },
    opencode: { tool: "bash", args: { command: "git push origin feature/foo" } } },

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
  let cv, ov;
  if (c.claude) {
    cv = claudeDecide(c.claude, ROOT, config).verdict;
    check(`claude:${c.name}`, cv, c.claudeExpect ?? c.expect);
  }
  if (c.opencode) {
    ov = ocDecide(c.opencode.tool, c.opencode.args, ROOT, c.opencode.isOrchestrator ?? false, config).verdict;
    check(`opencode:${c.name}`, ov, c.opencodeExpect ?? c.expect);
  }
  // Prompt-act cases drive the OpenCode chat.message path (decidePrompt) rather
  // than the tool path — same shared engine, asserting OpenCode reaches the same
  // verdict as Claude on a prompt.
  if (c.opencodePrompt) {
    ov = ocDecidePrompt(c.opencodePrompt, ROOT, false, config).verdict;
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

// ── 1b. CONFIG-SENSITIVE INJECT: which inject fires depends on config presence ─
// Both inject rules match a change-verb prompt; the engine returns the FIRST, and
// no-config-run-setup is ordered ahead of change-route-reminder. So an UNCONFIGURED
// project (no ai-pm.config.json) gets the setup nudge; a CONFIGURED one gets the
// route reminder. Asserted by ruleId (verdict is `inject` either way) — this is the
// only place the two injects are told apart. The ruleId distinction is engine-level
// and platform-independent (both Claude's UserPromptSubmit and OpenCode's chat.message
// reach the same engine), so it is asserted once via the Claude prompt path.
console.log("CONFIG-SENSITIVE INJECT (no config ⇒ setup nudge; configured ⇒ route reminder):");
const changePrompt = { hook_event_name: "UserPromptSubmit", prompt: "please implement the new export feature" };

// Unconfigured root: a fresh tmp dir with NO ai-pm.config.json.
const NOCFG = fs.mkdtempSync(path.join(os.tmpdir(), "ai-pm-nocfg-"));
check("no-config-run-setup:fires", claudeDecide(changePrompt, NOCFG, config).ruleId, "no-config-run-setup");
fs.rmSync(NOCFG, { recursive: true, force: true });

// Configured root: same dir once ai-pm.config.json exists ⇒ promptNeedsSetup is
// false ⇒ change-route-reminder fires instead.
const CFG = fs.mkdtempSync(path.join(os.tmpdir(), "ai-pm-cfg-"));
fs.writeFileSync(path.join(CFG, "ai-pm.config.json"), "{}");
check("change-route-reminder:fires-when-configured", claudeDecide(changePrompt, CFG, config).ruleId, "change-route-reminder");
// A non-change prompt on an unconfigured root ⇒ neither inject fires (allow).
check("no-config:non-change-prompt-allows",
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
console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
