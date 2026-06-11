// OpenCode plugin entry — install drops THIS file (only) into .opencode/plugins/
// (PLURAL — opencode 1.17 loads `.opencode/plugins/`, not the singular form). Rewrite
// the adapter path below if the adapter is vendored somewhere other than the tooling
// submodule.
//
// It must DEFINE the plugin function inline, NOT import-and-re-expose it. Dogfooded on
// opencode 1.17.0: an own export of an imported function (`import { X as impl }; export
// const X = impl`) — like a bare re-export — LOADS without error but its hooks NEVER
// fire. opencode only registers hooks off a function DEFINED in the loaded module. So
// the thin wrappers live here, inline; only the rule logic (engine + decide/decidePrompt)
// is imported, so the rules stay single-sourced. Verified live: the inline form blocks a
// write into `.ai-pm/tooling/` (the engine's self-patch deny).
//
// Two hooks, the two classes OpenCode realises: `tool.execute.before` (deny — throw)
// and `chat.message` (inject — push a text part, the analog of Claude UserPromptSubmit).
// `ask` has no plugin-hook realisation and falls back to persona.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../../../.ai-pm/tooling/src/adapter/engine.mjs";
import { decide, decidePrompt } from "../../../.ai-pm/tooling/src/adapter/opencode/normalise.mjs";

const ADAPTER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", ".ai-pm", "tooling", "src", "adapter");

// Resolve whether the calling session is the orchestrator (no parentID, or agent id
// `ai-pm`). FAIL-OPEN to false on any lookup failure — a miss never produces a false
// denial; persona is the fail-safe (matches the engine's fail-open-on-actor contract).
async function isOrchestrator(client, sessionID) {
  try {
    if (!client || !client.session || !client.session.get || !sessionID) return false;
    const res = await client.session.get({ path: { id: sessionID } });
    const data = (res && res.data) || {};
    if (data.agent === "ai-pm") return true;
    return data.parentID == null;
  } catch { return false; }
}

export const AiPmEnforcement = async (ctx) => {
  const root = (ctx && (ctx.directory || ctx.worktree)) || process.cwd();
  const config = loadConfig(ADAPTER);
  return {
    "tool.execute.before": async (input, output) => {
      const isOrch = await isOrchestrator(ctx && ctx.client, input && input.sessionID);
      const r = decide(input && input.tool, (output && output.args) || {}, root, isOrch, config);
      if (r.verdict === "deny") throw new Error("[ai-pm] " + r.reason);
    },
    // chat.message — OpenCode's analog of Claude's UserPromptSubmit: it fires once
    // per user message before the LLM call, and output.parts is MUTABLE. This is
    // how the inject class is REALISED on OpenCode: extract the user text, ask the
    // SHARED engine to decide the prompt-class rules, and on an inject push a text
    // part — one-shot context for THIS turn only. The plugin supplies ONLY the
    // mechanism; the verb list and the predicate stay in deny-rules.json + the
    // engine (single source, invariant 6). No-op for allow; ask is unsupported on
    // OpenCode (falls back to persona) so it is left untouched here.
    "chat.message": async (input, output) => {
      const parts = (output && output.parts) || [];
      const userText = parts
        .filter((p) => p && p.type === "text" && typeof p.text === "string")
        .map((p) => p.text)
        .join("\n");
      const isOrch = await isOrchestrator(ctx && ctx.client, input && input.sessionID);
      const r = decidePrompt(userText, root, isOrch, config);
      if (r.verdict === "inject") output.parts.push({ type: "text", text: r.reason });
    },
  };
};
