import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../../adapter/engine.mjs";
import { decide, decidePrompt } from "../../adapter/opencode/normalise.mjs";

const ADAPTER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "adapter");

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
