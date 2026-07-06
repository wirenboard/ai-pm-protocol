// Auto-compact checkpoint-restart monitor test — drives the script as a subprocess
// with various hook payloads and environment configurations. Tests the two main
// functions: UserPromptSubmit (threshold monitor + injection) and PreCompact (block).
//
// Run: node src/adapter/claude/compact-monitor.test.mjs

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, "compact-monitor.mjs");

let pass = 0, fail = 0;
function check(name, condition) {
  if (condition) {
    pass++;
  } else {
    fail++;
    console.log(`  ✗ ${name}`);
  }
}


// Helper: run the script with a payload and environment.
// If env is provided with ANTHROPIC_BASE_URL explicitly, use it; otherwise unset it.
function runScript(payload, env = {}) {
  const defaultEnv = { ...process.env, ...env };
  // For native (no proxy) tests, ensure ANTHROPIC_BASE_URL is not inherited.
  if (!("ANTHROPIC_BASE_URL" in env)) {
    delete defaultEnv.ANTHROPIC_BASE_URL;
  }
  const result = spawnSync("node", [SCRIPT], {
    input: JSON.stringify(payload),
    env: defaultEnv,
    encoding: "utf8",
  });
  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    status: result.status,
  };
}

// Helper: create a fake transcript JSONL file with a given number of messages.
function createTranscript(tmpDir, messageCount = 5) {
  const transcriptPath = path.join(tmpDir, "transcript.jsonl");
  let content = "";
  for (let i = 0; i < messageCount; i++) {
    const entry = {
      id: `msg-${i}`,
      type: "message",
      usage: { input_tokens: (i + 1) * 1000 }, // cumulative tokens
      message: { role: "user", content: `Message ${i}` },
    };
    content += JSON.stringify(entry) + "\n";
  }
  fs.writeFileSync(transcriptPath, content);
  return transcriptPath;
}

// Helper: create a transcript with usage in the message.usage path.
function createTranscriptMessageUsage(tmpDir, messageCount = 5) {
  const transcriptPath = path.join(tmpDir, "transcript.jsonl");
  let content = "";
  for (let i = 0; i < messageCount; i++) {
    const entry = {
      id: `msg-${i}`,
      type: "message",
      message: { role: "user", content: `Message ${i}`, usage: { input_tokens: (i + 1) * 1000 } },
    };
    content += JSON.stringify(entry) + "\n";
  }
  fs.writeFileSync(transcriptPath, content);
  return transcriptPath;
}

// Helper: create a transcript without usage fields.
function createTranscriptNoUsage(tmpDir, messageCount = 5) {
  const transcriptPath = path.join(tmpDir, "transcript.jsonl");
  let content = "";
  for (let i = 0; i < messageCount; i++) {
    const entry = {
      id: `msg-${i}`,
      type: "message",
      message: { role: "user", content: `Message ${i}` },
    };
    content += JSON.stringify(entry) + "\n";
  }
  fs.writeFileSync(transcriptPath, content);
  return transcriptPath;
}

// Helper: create a state file in a temp .ai-dev/state directory.
function createStateFile(tmpDir, state) {
  const stateDir = path.join(tmpDir, ".ai-dev", "state");
  fs.mkdirSync(stateDir, { recursive: true });
  const statePath = path.join(stateDir, "auto-compact.json");
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  return statePath;
}

console.log("Running compact-monitor tests...\n");

// ── Test cases ──────────────────────────────────────────────────────────────────

// Case 1: native session (no ANTHROPIC_BASE_URL) → no-op.
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  const transcriptPath = createTranscript(tmpDir, 10);
  try {
    const r = runScript({
      hook_event_name: "UserPromptSubmit",
      session_id: "sess-1",
      transcript_path: transcriptPath,
      cwd: tmpDir,
    });
    check("native session: stdout empty", r.stdout.trim() === "");
    check("native session: exit 0", r.status === 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// Case 2: proxy with anthropic.com hostname → no-op.
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  const transcriptPath = createTranscript(tmpDir, 10);
  try {
    const r = runScript({
      hook_event_name: "UserPromptSubmit",
      session_id: "sess-2",
      transcript_path: transcriptPath,
      cwd: tmpDir,
    }, { ANTHROPIC_BASE_URL: "https://api.anthropic.com" });
    check("anthropic.com host: stdout empty", r.stdout.trim() === "");
    check("anthropic.com host: exit 0", r.status === 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// Case 3: proxy, below threshold.
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  const transcriptPath = createTranscript(tmpDir, 5); // 5k tokens
  createStateFile(tmpDir, { enabled: true, threshold: 0.5, contextWindowEstimate: 200000 });
  try {
    const r = runScript({
      hook_event_name: "UserPromptSubmit",
      session_id: "sess-3",
      transcript_path: transcriptPath,
      cwd: tmpDir,
    }, { ANTHROPIC_BASE_URL: "https://proxy.example.com/v1" });
    check("below threshold: stdout empty", r.stdout.trim() === "");
    check("below threshold: exit 0", r.status === 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// Case 4: proxy, above threshold → inject instruction.
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  const transcriptPath = createTranscript(tmpDir, 250); // 250k tokens (way over 50%)
  createStateFile(tmpDir, { enabled: true, threshold: 0.5, contextWindowEstimate: 200000 });
  try {
    const r = runScript({
      hook_event_name: "UserPromptSubmit",
      session_id: "sess-4",
      transcript_path: transcriptPath,
      cwd: tmpDir,
    }, { ANTHROPIC_BASE_URL: "https://proxy.example.com/v1" });
    check("above threshold: contains additionalContext", r.stdout.includes("additionalContext"));
    check("above threshold: contains CHECKPOINT REQUIRED", r.stdout.includes("CHECKPOINT REQUIRED"));
    check("above threshold: exit 0", r.status === 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// Case 5: proxy, enabled:false → no-op even above threshold.
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  const transcriptPath = createTranscript(tmpDir, 250);
  createStateFile(tmpDir, { enabled: false, threshold: 0.5, contextWindowEstimate: 200000 });
  try {
    const r = runScript({
      hook_event_name: "UserPromptSubmit",
      session_id: "sess-5",
      transcript_path: transcriptPath,
      cwd: tmpDir,
    }, { ANTHROPIC_BASE_URL: "https://proxy.example.com/v1" });
    check("enabled:false: stdout empty", r.stdout.trim() === "");
    check("enabled:false: exit 0", r.status === 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// Case 6: already triggered in session → no-op.
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  const transcriptPath = createTranscript(tmpDir, 250);
  createStateFile(tmpDir, {
    enabled: true,
    threshold: 0.5,
    contextWindowEstimate: 200000,
    checkpointTriggered: true,
    lastTriggeredSessionId: "sess-6",
  });
  try {
    const r = runScript({
      hook_event_name: "UserPromptSubmit",
      session_id: "sess-6",
      transcript_path: transcriptPath,
      cwd: tmpDir,
    }, { ANTHROPIC_BASE_URL: "https://proxy.example.com/v1" });
    check("already triggered: stdout empty", r.stdout.trim() === "");
    check("already triggered: exit 0", r.status === 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// Case 7: new session (different session_id) → reset and re-inject.
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  const transcriptPath = createTranscript(tmpDir, 250);
  createStateFile(tmpDir, {
    enabled: true,
    threshold: 0.5,
    contextWindowEstimate: 200000,
    checkpointTriggered: true,
    lastTriggeredSessionId: "sess-old",
  });
  try {
    const r = runScript({
      hook_event_name: "UserPromptSubmit",
      session_id: "sess-7-new",
      transcript_path: transcriptPath,
      cwd: tmpDir,
    }, { ANTHROPIC_BASE_URL: "https://proxy.example.com/v1" });
    check("new session: contains additionalContext", r.stdout.includes("additionalContext"));
    check("new session: exit 0", r.status === 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// Case 8: fallback (no usage fields, count messages).
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  const transcriptPath = createTranscriptNoUsage(tmpDir, 25); // 25 messages
  createStateFile(tmpDir, {
    enabled: true,
    threshold: 0.5,
    contextWindowEstimate: 200000,
    messageCountMax: 40,
  });
  try {
    const r = runScript({
      hook_event_name: "UserPromptSubmit",
      session_id: "sess-8",
      transcript_path: transcriptPath,
      cwd: tmpDir,
    }, { ANTHROPIC_BASE_URL: "https://proxy.example.com/v1" });
    // 25 messages / 40 max = 62.5% above the 50% threshold
    check("fallback: contains additionalContext", r.stdout.includes("additionalContext"));
    check("fallback: notes the proxy did not return usage", r.stdout.includes("proxy did not return usage fields"));
    check("fallback: exit 0", r.status === 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// Case 9: PreCompact on proxy → exit 2.
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  createStateFile(tmpDir, { enabled: true, threshold: 0.5, contextWindowEstimate: 200000 });
  try {
    const r = runScript({
      hook_event_name: "PreCompact",
      cwd: tmpDir,
    }, { ANTHROPIC_BASE_URL: "https://proxy.example.com/v1" });
    check("PreCompact proxy: exit 2", r.status === 2);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// Case 10: PreCompact on native → exit 0 (allow).
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  createStateFile(tmpDir, { enabled: true, threshold: 0.5, contextWindowEstimate: 200000 });
  try {
    const r = runScript({
      hook_event_name: "PreCompact",
      cwd: tmpDir,
    }); // no ANTHROPIC_BASE_URL
    check("PreCompact native: exit 0", r.status === 0);
    check("PreCompact native: stdout empty", r.stdout.trim() === "");
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// Case 11: transcript doesn't exist → no-op (fail-open).
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  createStateFile(tmpDir, { enabled: true, threshold: 0.5, contextWindowEstimate: 200000 });
  try {
    const r = runScript({
      hook_event_name: "UserPromptSubmit",
      session_id: "sess-11",
      transcript_path: "/nonexistent/transcript.jsonl",
      cwd: tmpDir,
    }, { ANTHROPIC_BASE_URL: "https://proxy.example.com/v1" });
    check("nonexistent transcript: stdout empty", r.stdout.trim() === "");
    check("nonexistent transcript: exit 0 (fail-open)", r.status === 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// Case 12: corrupt state file → use defaults, inject if needed.
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  const stateDir = path.join(tmpDir, ".ai-dev", "state");
  fs.mkdirSync(stateDir, { recursive: true });
  const statePath = path.join(stateDir, "auto-compact.json");
  fs.writeFileSync(statePath, "{ this is not valid json");
  const transcriptPath = createTranscript(tmpDir, 250);
  try {
    const r = runScript({
      hook_event_name: "UserPromptSubmit",
      session_id: "sess-12",
      transcript_path: transcriptPath,
      cwd: tmpDir,
    }, { ANTHROPIC_BASE_URL: "https://proxy.example.com/v1" });
    // Should fall back to defaults (threshold: 0.5, contextWindowEstimate: 200000)
    // 250k tokens / 200k = 1.25 (125% > 50% threshold)
    check("corrupt state: contains additionalContext", r.stdout.includes("additionalContext"));
    check("corrupt state: exit 0 (fail-open)", r.status === 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// Case 13: message.usage path (alternative field location).
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  const transcriptPath = createTranscriptMessageUsage(tmpDir, 120); // 120k tokens
  createStateFile(tmpDir, { enabled: true, threshold: 0.5, contextWindowEstimate: 200000 });
  try {
    const r = runScript({
      hook_event_name: "UserPromptSubmit",
      session_id: "sess-13",
      transcript_path: transcriptPath,
      cwd: tmpDir,
    }, { ANTHROPIC_BASE_URL: "https://proxy.example.com/v1" });
    // 120k / 200k = 60% > 50%
    check("message.usage path: contains additionalContext", r.stdout.includes("additionalContext"));
    check("message.usage path: exit 0", r.status === 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// Case 14: no transcript_path in payload → no-op (first turn).
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  createStateFile(tmpDir, { enabled: true, threshold: 0.5, contextWindowEstimate: 200000 });
  try {
    const r = runScript({
      hook_event_name: "UserPromptSubmit",
      session_id: "sess-14",
      cwd: tmpDir,
    }, { ANTHROPIC_BASE_URL: "https://proxy.example.com/v1" });
    check("no transcript_path: stdout empty", r.stdout.trim() === "");
    check("no transcript_path: exit 0", r.status === 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// Case 15: malformed JSON payload → fail-open, exit 0.
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  try {
    const result = spawnSync("node", [SCRIPT], {
      input: "this is not json at all",
      encoding: "utf8",
    });
    check("malformed payload: exit 0 (fail-open)", result.status === 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// Case 16: contextWindowEstimate clamp (minimum 16k).
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  const transcriptPath = createTranscript(tmpDir, 10); // 10k tokens
  createStateFile(tmpDir, {
    enabled: true,
    threshold: 0.5,
    contextWindowEstimate: 1, // intentionally low
  });
  try {
    const r = runScript({
      hook_event_name: "UserPromptSubmit",
      session_id: "sess-16",
      transcript_path: transcriptPath,
      cwd: tmpDir,
    }, { ANTHROPIC_BASE_URL: "https://proxy.example.com/v1" });
    // 10k / max(1, 16k) = 10k / 16k = 62.5% > 50%
    check("contextWindowEstimate clamp: contains additionalContext", r.stdout.includes("additionalContext"));
    check("contextWindowEstimate clamp: exit 0", r.status === 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// Case 17: messageCountMax clamp (minimum 5).
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  const transcriptPath = createTranscriptNoUsage(tmpDir, 3); // 3 messages
  createStateFile(tmpDir, {
    enabled: true,
    threshold: 0.5,
    messageCountMax: 1, // intentionally low
  });
  try {
    const r = runScript({
      hook_event_name: "UserPromptSubmit",
      session_id: "sess-17",
      transcript_path: transcriptPath,
      cwd: tmpDir,
    }, { ANTHROPIC_BASE_URL: "https://proxy.example.com/v1" });
    // 3 / max(1, 5) = 3 / 5 = 60% > 50%
    check("messageCountMax clamp: contains additionalContext", r.stdout.includes("additionalContext"));
    check("messageCountMax clamp: exit 0", r.status === 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// Case 18: PreCompact + proxy + enabled:false → exit 0 (allow, escape hatch).
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cm-test-"));
  createStateFile(tmpDir, { enabled: false, threshold: 0.5, contextWindowEstimate: 200000 });
  try {
    const r = runScript({
      hook_event_name: "PreCompact",
      cwd: tmpDir,
    }, { ANTHROPIC_BASE_URL: "https://proxy.example.com/v1" });
    check("PreCompact proxy enabled:false: exit 0 (allow)", r.status === 0);
    check("PreCompact proxy enabled:false: stdout empty", r.stdout.trim() === "");
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
