# Installing the adapter into a downstream project

The single home for **where each file lands and how each platform is wired**. The adapter is one shared core (`engine.mjs`, `deny-rules.json`, `tool-map.json`) plus the two platform shims; install ships the whole `src/adapter/` tree to one place the project can reach, then wires the active platform to its shim.

Convention used below: the adapter ships inside the protocol's tooling submodule at `.ai-pm/tooling/src/adapter/`. A project that vendors the adapter elsewhere rewrites the one path in each wiring step — nothing else changes.

## Claude Code

Merge this into the project's `.claude/settings.json` (the fragment lives at `claude/hooks.json`). One `PreToolUse` hook and one `UserPromptSubmit` hook, both piping the harness payload to `node claude/shim.mjs`; the shim self-locates `deny-rules.json` (two dirs up) and prints the verdict JSON.

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Read|Write|Edit|Bash|Task|Skill",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.ai-pm/tooling/src/adapter/claude/shim.mjs\"" }] }
    ],
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.ai-pm/tooling/src/adapter/claude/shim.mjs\"" }] }
    ]
  }
}
```

That replaces the whole inline shell+jq hook set — every guard now reads the one shared engine.

### Load instructions (the orchestrator session)

`CLAUDE.md` imports the constitution and the orchestrator's procedure — that is all the running session loads as the protocol (plus the project's own kind + language lines):

```
@PROTOCOL.md
@src/agents/orchestrator.md
```

The orchestrator **is** the session; the Builder and Reviewer are spawned (below).

### Spawn a sub-agent (the Builder and Reviewer)

The two spawnable roles are assembled into Claude agent files by **`node src/adapter/claude/install-agents.mjs`**. It reads each neutral role body (`src/agents/<role>.md`) + the Claude frontmatter (`src/adapter/claude/agents/<role>.fm`) and writes `.claude/agents/<agentId>.md`, taking the **agent id from `ai-pm.config.json` `roles`** (so `builder` → `pm-builder`, `reviewer` → `pm-reviewer`). It is concatenation, not a generator — the neutral body stays the single source. Re-run it whenever a role body, its frontmatter, or the config binding changes. The orchestrator spawns each by that id, on the model `ai-pm.config.json` resolves.

### Command (the explicit setup trigger)

**`node src/adapter/claude/install-commands.mjs`** assembles the `/pm-setup` slash-command into **`.claude/commands/pm-setup.md`** — the neutral command body (`src/adapter/commands/pm-setup.body.md`) + the Claude frontmatter (`src/adapter/claude/commands/pm-setup.fm`). The filename without extension is the command (`pm-setup.md` → `/pm-setup`); the body becomes the prompt injected into the session, and the orchestrator **is** the session, so it runs its own `## Setup`. The body is a thin pointer — no copy of the dialog (single home, invariant 6). Re-run it whenever the neutral body or the frontmatter changes.

**Apply config** — the shared re-assemble-after-setup step is homed in `tool-map.json` `apply-config` + `docs/architecture.md`. Claude delta: the reviewer model is resolved at *spawn*, not baked, so applying is just **`node src/adapter/claude/install-agents.mjs`** refreshing the assembled bodies (re-run `install-commands.mjs` too if the command surface changed).

## OpenCode

**OpenCode loads plugins from `.opencode/plugins/` and agents from `.opencode/agents/` — PLURAL** (verified on opencode 1.17.x). The singular forms (`.opencode/plugin/`, `.opencode/agent/`) are **not** loaded, so nothing in them takes effect.

### Enforce deny + inject (the plugin)

**`node src/adapter/opencode/install-plugin.mjs`** generates the deployed plugin — `.opencode/plugins/ai-pm.mjs` — FROM the source entry `src/adapter/opencode/plugin-entry.mjs`, retargeting only the adapter location to where the target vendors it (downstream: `.ai-pm/tooling/src/adapter`, no rewrite; dev/this repo: `src/adapter`). It must **DEFINE** the plugin function inline, NOT import-and-re-expose it: opencode 1.17 does not register a hook off an imported/re-exported binding (an own-export entry's deny fails open; an inline-defined one blocks). So the thin wrappers are **inline in the entry**; only the rule logic (`decide`/`decidePrompt` + the engine) is imported from the adapter tree, which sits outside the scanned plugin dir. The rules stay single-sourced. The deployed file is **generated, not hand-copied** — so it cannot drift from the source (`src/adapter/install-plugin.test.mjs` guards byte-identity); re-run it whenever the entry changes. No registration in `opencode.json` is needed.

The entry registers **two** hooks — the two enforcement classes OpenCode realises:

- **`tool.execute.before`** (deny) — resolve root, resolve the actor, call `decide`, **throw** on a deny verdict (the throw is OpenCode's block).
- **`chat.message`** (inject) — OpenCode's analog of Claude's `UserPromptSubmit`: it fires once per user message before the LLM call and `output.parts` is mutable. The entry joins the text parts into `userText`, calls `decidePrompt`, and on an inject verdict **pushes** `{ type: "text", text: reason }` onto `output.parts` — one-shot context for that turn. This is how the lazy-setup nudge (`no-config-run-setup`) and the `change-route-reminder` reach the model on OpenCode.

Live-verified on opencode 1.17.x (the dogfood run narrative — env discovery, the pin bake, reconfigure — is in `CHANGELOG.md`): the `chat.message` inject reaches the model on an unconfigured project, and the full `/pm-setup` flow runs end-to-end through the apply/re-assemble step.

`ask` has no plugin-hook realisation on OpenCode, so an `ask`-class rule falls back to persona (recorded per-rule in `deny-rules.json` `fallback`). The plugin supplies only the mechanism — the verb list and predicates stay in `deny-rules.json` + the engine.

### Load instructions + the orchestrator personality

UNLIKE Claude (where the orchestrator IS the session, held by `CLAUDE.md`), an OpenCode session runs as a **primary agent** — so the orchestrator is its own primary agent: `default_agent` points at it, and the shared constitution loads via `instructions`:

```json
{
  "default_agent": "ai-pm",
  "instructions": ["PROTOCOL.md"],
  "permission": { "question": "allow" },
  "agent": { "build": { "disable": true }, "plan": { "disable": true } }
}
```

The generic `build`/`plan` primaries are disabled so none can fill the orchestrator seat (invariant 1); `AGENTS.md` (repo root) is OpenCode's always-on surface and points at the same constitution.

### Spawn a sub-agent (and assemble the orchestrator)

`node src/adapter/opencode/install-agents.mjs` assembles the three role agents into `.opencode/agents/`: each neutral role body (`src/agents/<role>.md`) + its OpenCode frontmatter (`src/adapter/opencode/agents/<role>.fm`) → `.opencode/agents/<agentId>.md` (agent id from `ai-pm.config.json` `roles`: orchestrator → `ai-pm` with `mode: primary`; builder → `pm-builder`, reviewer → `pm-reviewer` with `mode: subagent`). On OpenCode the filename *is* the agent id, so the frontmatter carries no `name` key. Concatenation, not a generator — the neutral body stays the single source, shared with the Claude adapter. Re-run it whenever a role body, its frontmatter, or the config binding changes.

Live-verified on opencode 1.17.x: the session runs as `ai-pm` (the personality loads) and a write into `.ai-pm/tooling/` is mechanically blocked by the plugin (the engine's self-patch deny).

### Command (the explicit setup trigger)

**`node src/adapter/opencode/install-commands.mjs`** assembles the `/pm-setup` command into **`.opencode/commands/pm-setup.md`** (**PLURAL** — same dir convention as `.opencode/agents/` and `.opencode/plugins/`; verified against opencode 1.17.1 and the current docs, which both name the plural `commands/` dir — the older singular `.opencode/command/` is NOT loaded). The command body (`src/adapter/commands/pm-setup.body.md`, shared with Claude) is the prompt template; the frontmatter (`src/adapter/opencode/commands/pm-setup.fm`) carries `description` + **`agent: ai-pm`** so the command targets the orchestrator primary, which runs its own `## Setup`. It is a thin pointer — no copy of the dialog (single home, invariant 6). Re-run it whenever the neutral body or the frontmatter changes.

**Apply config** — the shared re-assemble-after-setup step is homed in `tool-map.json` `apply-config` + `docs/architecture.md`. OpenCode delta: there is no per-spawn model arg, so **`node src/adapter/opencode/install-agents.mjs`** *bakes* the reviewer `model:` line into the assembled frontmatter (re-run `install-commands.mjs` too if the command surface changed).

> **Fallback (no dir guess needed):** if a future opencode stops loading the markdown command dir, define the command inline in `opencode.json` under the `command` key — the SDK `Config.command` schema (`{ template, description, agent, model, subtask }`, confirmed in `@opencode-ai/sdk`) takes the same body as `template` and `agent: ai-pm`. The markdown-dir form is preferred here because it shares the one neutral body file with Claude.
