# Installing the adapter into a downstream project

The single home for **where each file lands and how each platform is wired**. The adapter is one shared core (`engine.mjs`, `deny-rules.json`, `tool-map.json`) plus the two platform shims; install ships the whole `src/adapter/` tree to one place the project can reach, then wires the active platform to its shim.

## The one command

```sh
node src/adapter/install.mjs <target-dir> [--platform claude|opencode]
```

`install.mjs` does the **whole** procedure below in one idempotent pass — vendor the adapter, lay down the core + doc templates, wire the active platform — so a downstream is adopted by one command, not a hand-followed checklist. It:

- **vendors** the shared adapter and the neutral bodies the assembler reads (`src/agents/`, `src/modules/`) into `<target>/.ai-dev/tooling/src/` (the convention below);
- **lays down** the core (`PROTOCOL.md`, the role agents, the `src/modules/` fragments, the quality-registry SHAPE — the template rows, not this repo's own) and the doc templates (`product.md`, `contracts.md`, `architecture.md`, `README.md`) into the target's `docs/`, **only where the target has no such doc** (never clobbers a real one);
- **wires** the active platform by running its assembly scripts (the `## Claude Code` / `## OpenCode` sections) against the target and merging its load-instruction surface (the `CLAUDE.md` import + `.claude/settings.json` hooks for Claude; `opencode.json` + `AGENTS.md` + the generated plugin for OpenCode), de-duped so a re-run never duplicates a hook or an import;
- writes a minimal default `ai-dev.config.json` where absent (a real project then runs `/dev-setup`), and prints a summary + the next step.

Platform resolution: the `--platform` flag, else the target's `ai-dev.config.json` `platform`, else a clear error — never a silent guess. The guarantee it realises is `docs/contracts/one-command-install.md`; the test is `src/adapter/install.test.mjs`.

The rest of this file is the **underlying detail** — what each wiring step does, the single home for each. The installer automates exactly these; reach for a manual step only to understand or to wire one platform by hand.

Convention used below: the adapter ships inside the protocol's tooling submodule at `.ai-dev/tooling/src/adapter/`. A project that vendors the adapter elsewhere rewrites the one path in each wiring step — nothing else changes.

## Upgrade

A downstream upgrades by bumping the protocol source and re-running the same one command:

1. Bump the protocol to the new version (the tooling-submodule bump, or re-fetch the release).
2. Re-run the one command above — its idempotence and never-clobber guarantees are exactly why a re-run is the whole upgrade: the project's `ai-dev.config.json` and real docs survive.
3. Read the CHANGELOG between the two versions. A **MAJOR** bump is the one that may break the wiring (a renamed agent or command, a changed config key) — its entry names what to rename or re-run. MINOR/PATCH need nothing beyond the re-run.

### MAJOR 5.0.0 — ai-pm → ai-dev rename

After the re-run, rename these in your project by hand (the installer cannot rename files it did not create):

1. **Config:** rename `ai-pm.config.json` → `ai-dev.config.json`. Update its `"platform"` and `"roles"` agent IDs: `"ai-pm"` → `"ai-dev"`, `"pm-builder"` → `"dev-builder"`, `"pm-reviewer"` → `"dev-reviewer"`.
2. **State directory:** rename `.ai-pm/` → `.ai-dev/` (all subdirs: `state/`, `plans/`, `reviews/`, `audit/`, `8d/`, `backlog.md`; the `tooling/` submodule is re-vendored by the re-run, so delete the old `.ai-pm/tooling/` after renaming).
3. **Commands:** rename `.claude/commands/pm-setup.md` → `dev-setup.md`; `.opencode/commands/pm-setup.md` → `dev-setup.md`.
4. **Agents:** rename `.claude/agents/pm-builder.md` → `dev-builder.md`, `pm-reviewer.md` → `dev-reviewer.md`; `.opencode/agents/ai-pm.md` → `ai-dev.md`, `pm-builder.md` → `dev-builder.md`, `pm-reviewer.md` → `dev-reviewer.md`.
5. **Plugin:** rename `.opencode/plugins/ai-pm.mjs` → `ai-dev.mjs`.
6. **Hook paths** in `.claude/settings.json`: replace any `/.ai-pm/tooling/` path references with `/.ai-dev/tooling/` (the hook re-runs the shim — if you wired it manually, update the command path).
7. **CLAUDE.md / AGENTS.md**: no changes needed (they import by protocol file names, not agent IDs).
8. **Re-run** `node .ai-dev/tooling/src/adapter/install.mjs . --platform <your-platform>` one more time to regenerate assembled agents with the new IDs.
9. **Search your codebase** for any remaining `/pm-setup`, `.ai-pm`, `ai-pm.config`, `pm-builder`, `pm-reviewer` references and update them.

### Old-protocol migration

A downstream running a **prior protocol version** (pre-5.0, when the docs were `WORKFLOW.md`, agent roster `pm-*`, state dir `.ai-pm/`) migrates mechanically then runs doc bootstrap in old-protocol source mode (`src/agents/orchestrator.md` `## Doc bootstrap`).

**Mechanical steps:**

1. **Bump and re-run** — bump the tooling to the new version and re-run `node .ai-dev/tooling/src/adapter/install.mjs . --platform <platform>`. The installer vendors the new adapter and lays down the new template docs (only where absent — it never clobbers existing content).
2. **Rename the old surface** — follow MAJOR 5.0.0 steps above for any `ai-pm.config.json`, `.ai-pm/` dirs, `pm-*` agent files, and command files not already renamed.
3. **Run doc bootstrap (old-protocol source mode)** — the Builder reads the old docs (`WORKFLOW.md`, prior role files, the legacy agent roster) as primary source and compresses their truth into the new templates (`docs/architecture.md`, `docs/contracts.md`). Any old-doc claim contradicting the code surfaces as a finding for the Operator. After drafting, a comment de-water pass removes wall comments that duplicate the new docs.
4. **Delete old docs** — once their content moved, delete `WORKFLOW.md` and any pm-* role files (supersede, one home — invariant 6).
5. **Accept the closing audit** — the orchestrator offers a whole-project sweep after close; take it to catch any drift the per-diff bootstrap missed.

## Claude Code

Merge this into the project's `.claude/settings.json` (the fragment lives at `claude/hooks.json`). One `PreToolUse` hook and one `UserPromptSubmit` hook, both piping the harness payload to `node claude/shim.mjs`; the shim self-locates `deny-rules.json` (two dirs up) and prints the verdict JSON.

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Read|Write|Edit|Bash|Task|Skill",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.ai-dev/tooling/src/adapter/claude/shim.mjs\"" }] }
    ],
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.ai-dev/tooling/src/adapter/claude/shim.mjs\"" }] }
    ]
  }
}
```

Every guard reads the one shared engine.

### Load instructions (the orchestrator session)

`CLAUDE.md` imports the constitution and the orchestrator's procedure — that is all the running session loads as the protocol (plus the project's own kind + language lines):

```text
@PROTOCOL.md
@src/agents/orchestrator.md
```

The orchestrator **is** the session; the Builder and Reviewer are spawned (below).

### Spawn a sub-agent (the Builder and Reviewer)

**`node src/adapter/claude/install-agents.mjs`** assembles the two spawnable roles into Claude agent files:

- It reads each neutral role body (`src/agents/<role>.md`) + the Claude frontmatter (`src/adapter/claude/agents/<role>.fm`) and writes `.claude/agents/<agentId>.md`.
- The **agent id comes from `ai-dev.config.json` `roles`** (so `builder` → `dev-builder`, `reviewer` → `dev-reviewer`).
- It is concatenation, not a generator — the neutral body stays the single source.
- Re-run it whenever a role body, its frontmatter, or the config binding changes.

The orchestrator spawns each by that id, on the model `ai-dev.config.json` resolves.

### Command (the explicit setup trigger)

**`node src/adapter/claude/install-commands.mjs`** assembles the `/dev-setup` slash-command into **`.claude/commands/dev-setup.md`** — the neutral command body (`src/adapter/commands/dev-setup.body.md`) + the Claude frontmatter (`src/adapter/claude/commands/dev-setup.fm`).

- The filename without extension is the command (`dev-setup.md` → `/dev-setup`).
- The body becomes the prompt injected into the session; the orchestrator **is** the session, so it runs its own `## Setup`.
- The body is a thin pointer — no copy of the dialog (single home, invariant 6).
- Re-run it whenever the neutral body or the frontmatter changes.

**Apply config** — the shared re-assemble-after-setup step is homed in `tool-map.json` `apply-config` + `docs/architecture.md`. Claude delta: the reviewer model is resolved at *spawn*, not baked, so applying is just **`node src/adapter/claude/install-agents.mjs`** refreshing the assembled bodies (re-run `install-commands.mjs` too if the command surface changed).

## OpenCode

**OpenCode loads plugins from `.opencode/plugins/` and agents from `.opencode/agents/` — PLURAL.** The singular forms (`.opencode/plugin/`, `.opencode/agent/`) are **not** loaded.

### Enforce deny + inject (the plugin)

**`node src/adapter/opencode/install-plugin.mjs`** generates the deployed plugin — `.opencode/plugins/ai-dev.mjs` — FROM the source entry `src/adapter/opencode/plugin-entry.mjs`. It retargets only the adapter location to where the target vendors it (downstream: `.ai-dev/tooling/src/adapter`, no rewrite; dev/this repo: `src/adapter`).

- It must **define** each hook function inline — a hook imported from another module and re-exported under the entry's own name is NOT registered by the loader (it loads but its hook never fires).
- So the thin wrappers are **inline in the entry**; only the rule logic (`decide`/`decidePrompt` + the engine) is imported from the adapter tree, which sits outside the scanned plugin dir. The rules stay single-sourced.
- The deployed file is **generated, not hand-copied** — so it cannot drift from the source (`src/adapter/install-plugin.test.mjs` guards byte-identity).
- Re-run it whenever the entry changes. No registration in `opencode.json` is needed.

The entry registers **two** hooks — the two enforcement classes OpenCode realises:

- **`tool.execute.before`** (deny) — resolve root, resolve the actor, call `decide`, **throw** on a deny verdict (the throw is OpenCode's block).
- **`chat.message`** (inject) — OpenCode's analog of Claude's `UserPromptSubmit`: it fires once per user message before the LLM call, and `output.parts` is mutable. The entry joins the text parts into `userText`, calls `decidePrompt`, and on an inject verdict **pushes** `{ type: "text", text: reason }` onto `output.parts` — one-shot context for that turn. This is how the lazy-setup nudge (`no-config-run-setup`) and the `change-route-reminder` reach the model on OpenCode.

`ask` has no plugin-hook realisation on OpenCode, so an `ask`-class rule falls back to persona (recorded per-rule in `deny-rules.json` `fallback`). The plugin supplies only the mechanism — the verb list and predicates stay in `deny-rules.json` + the engine.

### Load instructions + the orchestrator personality

UNLIKE Claude (where the orchestrator IS the session, held by `CLAUDE.md`), an OpenCode session runs as a **primary agent** — so the orchestrator is its own primary agent: `default_agent` points at it, and the shared constitution loads via `instructions`:

```json
{
  "default_agent": "ai-dev",
  "instructions": ["PROTOCOL.md"],
  "permission": { "edit": "allow", "bash": "allow", "webfetch": "allow", "question": "allow" },
  "agent": { "build": { "disable": true }, "plan": { "disable": true } }
}
```

The permission block sets native OpenCode permissions to full-speed inside the project. Division of labor: the **protocol plugin is the sole boundary guard** (mechanically denies reads/writes/finds outside the project root); native `permission` is the speed dial for tool calls inside that boundary. Honest residual: `bash` boundary is best-effort (the engine parses obvious path tokens; an opaque escape like `python3 -c '...'` is flagged by the `opaque-bash-boundary-risk` ask rule, not a hard deny). `edit`/`read`/`write` tool-call checks are exact. `webfetch: allow` because research needs outbound fetches; sending project data out is a separate `[persona]` rule, not a filesystem-boundary concern.

The generic `build`/`plan` primaries are disabled so none can fill the orchestrator seat (invariant 1); `AGENTS.md` (repo root) is OpenCode's always-on surface and points at the same constitution.

### Spawn a sub-agent (and assemble the orchestrator)

`node src/adapter/opencode/install-agents.mjs` assembles the three role agents into `.opencode/agents/`: each neutral role body (`src/agents/<role>.md`) + its OpenCode frontmatter (`src/adapter/opencode/agents/<role>.fm`) → `.opencode/agents/<agentId>.md`.

- The agent id comes from `ai-dev.config.json` `roles`: orchestrator → `ai-dev` with `mode: primary`; builder → `dev-builder`, reviewer → `dev-reviewer` with `mode: subagent`.
- On OpenCode the filename *is* the agent id, so the frontmatter carries no `name` key.
- Concatenation, not a generator — the neutral body stays the single source, shared with the Claude adapter.
- Re-run it whenever a role body, its frontmatter, or the config binding changes.

The session runs as `ai-dev` (the personality loads) and a write into `.ai-dev/tooling/` is mechanically blocked by the plugin (the engine's self-patch deny).

### Command (the explicit setup trigger)

**`node src/adapter/opencode/install-commands.mjs`** assembles the `/dev-setup` command into **`.opencode/commands/dev-setup.md`** (the plural `commands/` dir, matching `.opencode/agents/` and `.opencode/plugins/`; the singular `.opencode/command/` is NOT loaded).

- The command body (`src/adapter/commands/dev-setup.body.md`, shared with Claude) is the prompt template.
- The frontmatter (`src/adapter/opencode/commands/dev-setup.fm`) carries `description` + **`agent: ai-dev`** so the command targets the orchestrator primary, which runs its own `## Setup`.
- It is a thin pointer — no copy of the dialog (single home, invariant 6).
- Re-run it whenever the neutral body or the frontmatter changes.

**Apply config** — the shared re-assemble-after-setup step is homed in `tool-map.json` `apply-config` + `docs/architecture.md`. OpenCode delta: there is no per-spawn model arg, so **`node src/adapter/opencode/install-agents.mjs`** *bakes* the reviewer `model:` line into the assembled frontmatter (re-run `install-commands.mjs` too if the command surface changed).

> **Fallback (no dir guess needed):** if a future opencode stops loading the markdown command dir, define the command inline in `opencode.json` under the `command` key. The SDK `Config.command` schema (`{ template, description, agent, model, subtask }`, confirmed in `@opencode-ai/sdk`) takes the same body as `template` and `agent: ai-dev`. The markdown-dir form is preferred here because it shares the one neutral body file with Claude.
