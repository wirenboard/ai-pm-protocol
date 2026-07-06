#!/usr/bin/env node
// Auto-compact checkpoint-restart monitor for non-Claude (proxied) sessions.
// A standalone hook script (separate from shim.mjs) that estimates context usage from
// the transcript and manages two functions:
//   1. UserPromptSubmit: estimate usage from transcript tail; inject checkpoint instruction
//      when crossing the configured threshold.
//   2. PreCompact: block model-summarize on proxy sessions (exit 2).
//
// Run as a hook entry: reads the hook payload from stdin, prints JSON to stdout (or nothing),
// exits 0 (fail-open on error, except the intentional exit 2 in handlePreCompact).
// Holds NO engine rule logic — the shim.mjs handles all denies/injects/asks.

import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";

// ── isProxySession: detect if this is a non-Claude model via a proxy ────────────────────
// Returns true if ANTHROPIC_BASE_URL is set AND its hostname does not end with .anthropic.com
// (the native Anthropic API). Catches malformed URLs → false.
function isProxySession() {
  const baseUrl = process.env.ANTHROPIC_BASE_URL;
  if (!baseUrl) return false; // native session
  try {
    const { hostname } = new URL(baseUrl);
    return !hostname.endsWith(".anthropic.com");
  } catch {
    return false; // malformed URL — fail-open to no-op
  }
}

// ── resolveStatePath: resolve .ai-dev/state/auto-compact.json from cwd ──────────────────
function resolveStatePath(cwd) {
  return path.resolve(cwd, ".ai-dev", "state", "auto-compact.json");
}

// ── readState: read and parse the state file, or return defaults ───────────────────────
function readState(cwd) {
  const defaults = {
    enabled: true,
    threshold: 0.5,
    contextWindowEstimate: 200000,
    messageCountMax: 40,
    lastTriggeredSessionId: null,
    checkpointTriggered: false,
  };
  const statePath = resolveStatePath(cwd);
  if (!fs.existsSync(statePath)) return defaults;
  try {
    const content = fs.readFileSync(statePath, "utf8");
    const parsed = JSON.parse(content);
    return { ...defaults, ...parsed };
  } catch (e) {
    console.error(`[compact-monitor] warning: state file corrupt at ${statePath}, using defaults:`, e.message);
    return defaults;
  }
}

// ── writeState: write the state file (but only if it already exists) ───────────────────
// This avoids creating the state file on every first prompt of a fresh session.
function writeState(cwd, state) {
  const statePath = resolveStatePath(cwd);
  if (fs.existsSync(statePath)) {
    try {
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n", "utf8");
    } catch (e) {
      console.error(`[compact-monitor] warning: could not write state file:`, e.message);
    }
  }
}

// ── estimateUsageRatio: compute context usage as a ratio [0..1] ───────────────────────
// Primary path: read last 4 KB of JSONL, extract usage.input_tokens from the last entry.
// Fallback: count message lines and divide by messageCountMax.
// Returns { ratio, method, fallbackUsed }.
function estimateUsageRatio(transcriptPath, state) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    return { ratio: 0, method: "absent", fallbackUsed: false };
  }

  try {
    const stats = fs.statSync(transcriptPath);
    const fileSize = stats.size;

    // Primary path: read the tail and extract usage from the last entry.
    if (fileSize > 0) {
      const fd = fs.openSync(transcriptPath, "r");
      const tailSize = Math.min(4096, fileSize);
      const buffer = Buffer.alloc(tailSize);
      fs.readSync(fd, buffer, 0, tailSize, Math.max(0, fileSize - tailSize));
      fs.closeSync(fd);

      const tail = buffer.toString("utf8");
      const lines = tail.split("\n");

      // Parse from the end backward until we get a valid JSON entry.
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) continue;
        try {
          const entry = JSON.parse(line);
          // Extract token count from usage fields.
          const tokenCount = entry.usage?.input_tokens ?? entry.message?.usage?.input_tokens;
          if (typeof tokenCount === "number" && tokenCount > 0) {
            // Apply minimum clamp to contextWindowEstimate.
            const contextWindowEstimate = Math.max(state.contextWindowEstimate, 16000);
            const ratio = tokenCount / contextWindowEstimate;
            return { ratio, method: "usage_fields", fallbackUsed: false };
          }
        } catch {
          // JSON parse error — continue to next line.
        }
      }
    }

    // Fallback: count message lines.
    const fd = fs.openSync(transcriptPath, "r");
    const buffer = Buffer.alloc(fileSize);
    fs.readSync(fd, buffer, 0, fileSize, 0);
    fs.closeSync(fd);

    const content = buffer.toString("utf8");
    const lineCount = (content.match(/\n/g) || []).length;
    const messageCountMax = Math.max(state.messageCountMax, 5);
    const ratio = lineCount / messageCountMax;
    return { ratio, method: "message_count", fallbackUsed: true };
  } catch (e) {
    console.error(`[compact-monitor] warning: error reading transcript:`, e.message);
    return { ratio: 0, method: "error", fallbackUsed: false };
  }
}

// ── handleUserPromptSubmit: threshold check and checkpoint injection ────────────────────
function handleUserPromptSubmit(payload, state, cwd) {
  // 1. Not a proxy session → no-op.
  if (!isProxySession()) return null;

  // 2. Monitoring disabled → no-op.
  if (!state.enabled) return null;

  // 3. Check for session ID change (new session → reset checkpointTriggered).
  const sessionId = payload.session_id;
  if (sessionId && sessionId !== state.lastTriggeredSessionId) {
    state.checkpointTriggered = false;
    writeState(cwd, state);
  }

  // 4. Already triggered in this session → no-op.
  if (state.checkpointTriggered) return null;

  // 5. No transcript yet (first turn of session) → no-op.
  if (!payload.transcript_path) return null;

  // 6. Estimate usage ratio.
  const { ratio, method, fallbackUsed } = estimateUsageRatio(payload.transcript_path, state);

  // 7. Below threshold → no-op.
  if (ratio < state.threshold) return null;

  // 8. Threshold crossed: mark as triggered and build the checkpoint instruction.
  state.checkpointTriggered = true;
  state.lastTriggeredSessionId = sessionId;
  writeState(cwd, state);

  const percentUsed = Math.round(ratio * 100);
  let methodLabel = method;
  if (fallbackUsed) methodLabel += " (estimate may be imprecise — proxy did not return usage fields)";

  const instruction = `CHECKPOINT REQUIRED — context is at approximately ${percentUsed}% of estimated capacity
(measured via ${methodLabel}).

Before answering the pending prompt, execute this checkpoint:
1. Write .ai-dev/state/current.md — reconcile CURRENT STATE: confirm version matches latest git tag,
   active branch against real state, queue highlights current.
2. Write .ai-dev/notes/session-checkpoint.md with:
   ## Current goal
   <1–2 lines: what this session is working on>
   ## Progress
   <what is complete, what remains>
   ## Open items
   <unresolved questions or blockers>
   ## Next step
   <exact first action for the next session>
3. Reply to the Operator with:
   "Checkpoint written. Please restart with: claude --continue
   (Your pending prompt will replay in the new session.)"

Do NOT answer the pending prompt in this turn — the restart will replay it.${fallbackUsed ? "\n\nTip: If this fires too early, set a higher messageCountMax in .ai-dev/state/auto-compact.json." : ""}`;

  return {
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: instruction,
    },
  };
}

// ── handlePreCompact: block model-summarize on proxy sessions ────────────────────────
// Returns null for allow (native or disabled), or exits with code 2 for block (proxy+enabled).
function handlePreCompact(payload, state) {
  // Not a proxy session → allow compaction.
  if (!isProxySession()) return null;

  // Monitoring disabled → allow compaction.
  if (!state.enabled) return null;

  // Proxy session with monitoring enabled → block compaction.
  // Exit code 2 tells Claude Code to skip the model-summarization compact.
  // We must exit here; returning null and continuing would allow the compact.
  process.exit(2);
  // never reached, but included for clarity
  return null;
}

// ── main: read stdin, dispatch, print output ────────────────────────────────────────────
async function main() {
  try {
    let inputData = "";

    // Read all stdin.
    for await (const chunk of process.stdin) {
      inputData += chunk.toString();
    }

    if (!inputData.trim()) {
      process.exit(0);
    }

    const payload = JSON.parse(inputData);

    if (!payload || typeof payload !== "object") {
      process.exit(0);
    }

    // Resolve cwd — default to process.cwd() if not in payload.
    const cwd = payload.cwd || process.cwd();

    // Read state.
    const state = readState(cwd);

    // Dispatch on hook event.
    let output = null;
    const eventName = payload.hook_event_name;

    if (eventName === "UserPromptSubmit") {
      output = handleUserPromptSubmit(payload, state, cwd);
    } else if (eventName === "PreCompact") {
      handlePreCompact(payload, state);
    }

    // Print output if any (null = no-op, allow).
    if (output) {
      console.log(JSON.stringify(output));
    }

    process.exit(0);
  } catch (e) {
    // Fail-open: any error exits 0 (allow), logged to stderr.
    console.error(`[compact-monitor] error:`, e.message || String(e));
    process.exit(0);
  }
}

// Use async main pattern so we can await the async stdin read.
main().catch((e) => {
  console.error(`[compact-monitor] fatal:`, e.message || String(e));
  process.exit(0);
});
