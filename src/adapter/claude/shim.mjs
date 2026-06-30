#!/usr/bin/env node
// Claude adapter shim. The ONLY Claude-specific code: it normalises a Claude
// hook payload to the neutral input shape, calls the shared engine, and maps the
// engine verdict to Claude's hook stdout JSON. It holds NO rule logic — every
// pattern, role list, and predicate lives in ../deny-rules.json + ../engine.mjs.
//
// Run as the hook entry (`node shim.mjs`): reads the hook payload from stdin,
// prints the deny/ask/inject JSON (nothing for allow) to stdout, exits 0 — a
// drop-in for the inline shell+jq guards. Install wiring: adapter README.

import { evaluate, loadConfig } from "../engine.mjs";
import { resolveSessionRoot, targetsSessionRepo } from "../session-root.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── normalise: Claude hook payload → neutral input ───────────────────────────
// Returns the neutral `{ act, root, ... }` shape the engine consumes, or null
// when this payload carries nothing the engine watches (the shim then allows).
// `isOrchestrator` is intentionally left undefined: a Claude hook payload carries
// no session-role signal, so the actor-dependent rules (orchestrator-authors-
// content, stamp-write) fall back to persona by the engine's fail-open-on-actor
// contract. This is the documented Claude capability gap, not an omission.
export function normalise(payload, root) {
  if (!payload || typeof payload !== "object") return null;

  // UserPromptSubmit — the only prompt-act event.
  if (payload.hook_event_name === "UserPromptSubmit") {
    if (typeof payload.prompt !== "string" || !payload.prompt) return null;
    return { act: "prompt", root, prompt: payload.prompt };
  }

  const tool = payload.tool_name;
  const ti = payload.tool_input || {};
  switch (tool) {
    case "Read":
      if (typeof ti.file_path !== "string" || !ti.file_path) return null;
      return { act: "read", root, path: ti.file_path };
    case "Write": {
      if (typeof ti.file_path !== "string" || !ti.file_path) return null;
      const content = typeof ti.content === "string" ? ti.content : "";
      return {
        act: "write", root, path: ti.file_path, content,
        contentEmpty: content.replace(/\s/g, "").length === 0,
      };
    }
    case "Edit":
      // Edit never truncates to empty (the Write tool does) — contentEmpty:false
      // so only the path-boundary / orchestrator-content rules apply.
      if (typeof ti.file_path !== "string" || !ti.file_path) return null;
      return { act: "write", root, path: ti.file_path, contentEmpty: false };
    case "Bash":
      if (typeof ti.command !== "string" || !ti.command) return null;
      return { act: "bash", root, command: ti.command };
    case "Task":
      if (typeof ti.subagent_type !== "string" || !ti.subagent_type) return null;
      return { act: "spawn", root, spawnTarget: ti.subagent_type };
    case "Skill":
      if (typeof ti.skill !== "string" || !ti.skill) return null;
      return { act: "spawn", root, spawnTarget: ti.skill };
    default:
      return null;
  }
}

// ── mapVerdict: engine verdict → Claude hook stdout object ───────────────────
// Returns the object to print as JSON, or null for allow (print nothing). The
// engine's class is realised directly: Claude supports deny, ask, and inject.
export function mapVerdict(result, eventName) {
  if (!result || result.verdict === "allow") return null;
  if (result.verdict === "inject") {
    return {
      hookSpecificOutput: {
        hookEventName: eventName || "UserPromptSubmit",
        additionalContext: result.reason,
      },
    };
  }
  // deny | ask — both are PreToolUse permission decisions.
  return {
    hookSpecificOutput: {
      hookEventName: eventName || "PreToolUse",
      permissionDecision: result.verdict,
      permissionDecisionReason: result.reason,
    },
  };
}

// ── decide: full pure path (for the parity test) ─────────────────────────────
// `opts.targetsSessionRepo` (when supplied) is threaded onto the neutral input so the
// engine's git-targeting denies (f4-floor, merge-gate) can scope to the session repo.
// Omitted (undefined) ⇒ the engine's fail-CLOSED default applies (the deny fires) —
// so a caller that passes no signal gets the unchanged, strict behaviour.
export function decide(payload, root, config, opts = {}) {
  const input = normalise(payload, root);
  if (!input) return { verdict: "allow", ruleId: null, reason: "" };
  if (opts.targetsSessionRepo !== undefined) input.targetsSessionRepo = opts.targetsSessionRepo;
  return evaluate(input, config);
}

// ── main: stdin → stdout ─────────────────────────────────────────────────────
function resolveCwd(payload) {
  return (payload && typeof payload.cwd === "string" && payload.cwd) || process.cwd();
}

function main() {
  let raw = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (c) => (raw += c));
  process.stdin.on("end", () => {
    let payload;
    try { payload = JSON.parse(raw); } catch { process.exit(0); }
    // Fail-OPEN past this point: a malformed deny-rules.json (loadConfig throws) or any
    // other decide-path error logs to stderr and exits 0 (allow), never crashes the hook.
    // Rationale: the tooling dir is immutable (self-patch deny) and ships a valid registry,
    // so a broken registry means a broken install, not an attack — and a fail-CLOSED crash
    // that blocks EVERY tool call makes the harness unusable, which the Operator routes
    // around by disabling the hook entirely (strictly worse than fail-open). The immutable
    // tooling dir is the compensating control. Matches the JSON.parse(raw) fail-open above.
    try {
      const cwd = resolveCwd(payload);
      const root = resolveSessionRoot(cwd);
      const config = loadConfig(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
      // Scope the git-targeting denies to the session repo (fail-CLOSED — see
      // session-root.mjs): a command in a separate nested repo is exempt, the session
      // repo's floor is untouched, any doubt denies.
      const result = decide(payload, root, config, { targetsSessionRepo: targetsSessionRepo(cwd, root) });
      const out = mapVerdict(result, payload.hook_event_name);
      if (out) process.stdout.write(JSON.stringify(out));
    } catch (e) {
      console.error("[ai-dev] config load / decide failed, allowing this call: " + (e && e.message ? e.message : String(e)));
    }
    process.exit(0);
  });
}

// Run main only as the hook entry, not when imported by the parity test.
if (import.meta.url === `file://${process.argv[1]}`) main();
