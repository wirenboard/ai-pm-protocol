# Installing the adapter into a downstream project

The single home for **where each file lands and how each platform is wired**. The adapter is one shared core (`engine.mjs`, `deny-rules.json`, `tool-map.json`) plus the two platform shims; install ships the whole `src/adapter/` tree to one place the project can reach, then wires the active platform to its shim.

## The one command

```sh
node src/adapter/install.mjs <target-dir> [--platform claude|opencode]
```

`install.mjs` does the **whole** procedure below in one idempotent pass — vendor the adapter, lay down the core + doc templates, wire the active platform — so a downstream is adopted by one command, not a hand-followed checklist. It:

- **vendors** the shared adapter, the neutral bodies the assembler reads (`src/agents/`, `src/modules/`), and everything the vendored installer itself reads on an upgrade re-run (`PROTOCOL.md`, `src/quality/`, `src/templates/`, its own `VERSION`) into `<target>/.ai-dev/tooling/` (the convention below) — so the vendored installer is self-sufficient;
- **lays down** the core (`.ai-dev/PROTOCOL.md`, the quality-runner shape at `.ai-dev/quality/`, the per-version migration notes at `.ai-dev/upgrades.md`) into the target's `.ai-dev/` directory. Doc templates are NOT copied to the target root — they live in `.ai-dev/tooling/src/templates/` and are laid down on demand when product discovery / doc bootstrap run;
- **wires** the active platform by running its assembly scripts (the `## Claude Code` / `## OpenCode` sections) against the target and merging its load-instruction surface (the `CLAUDE.md` import + `.claude/settings.json` hooks for Claude; `opencode.json` + `AGENTS.md` + the generated plugin for OpenCode), de-duped so a re-run never duplicates a hook or an import — a stale ai-dev hook group whose command changed is *replaced* (recognised by the shim's path tail), never accumulated;
- writes a minimal **breadcrumb load-surface for the INACTIVE platform** (a marker-delimited block in its `CLAUDE.md` / `AGENTS.md`) — a session opened on the unwired platform learns the protocol exists and what to run; merged in without clobbering a real file, replaced by the full wiring when that platform becomes active;
- **stamps `.ai-dev/VERSION`** on every run and, on a detected version change, writes the transient `.ai-dev/UPGRADING.md` marker + prints a restart notice (the upgrade channel's mechanical half — `docs/decisions/upgrade-migration.md`; the session half is `src/agents/orchestrator.md` `## Upgrade`);
- writes a minimal default `.ai-dev/config.json` where absent (a real project then runs `/dev-setup`), and prints a summary + the next step.
- **warns when the target has no git repository** (the loop — branches, reviews, the merge-gate — runs on git). A warning, never a block or an auto-`git init`: the interactive init offer is setup's repo check (`src/agents/orchestrator.md` `## Setup` step 0, the single home).

Platform resolution: the `--platform` flag, else the target's `.ai-dev/config.json` `platform`, else a clear error — never a silent guess. The guarantee it realises is `docs/contracts/one-command-install.md`; the test is `src/adapter/install.test.mjs`.

### Dogfood / source mode (`--dogfood`)

```sh
node src/adapter/install.mjs . --dogfood --platform claude     # or --platform opencode
```

The protocol's own repo develops itself under its own protocol, so it must wire to its **own `src/` tree**, not to a vendored copy of itself. `--dogfood` is that self-host mode — use it **only** when installing into the protocol's own source repo. It:

- wires the three tracked surfaces to the source tree — the Claude hook → `src/adapter/claude/shim.mjs`; `CLAUDE.md` imports → `@PROTOCOL.md` + `@src/agents/orchestrator.md`; OpenCode `opencode.json` `instructions` → `PROTOCOL.md` and the plugin → `src/adapter` (the existing dev-layout auto-detection);
- **skips** vendoring `.ai-dev/tooling/` (the repo already carries its core at the root — a copy would be untracked debris) and **skips** the `.ai-dev/VERSION` stamp + `UPGRADING.md` marker (the repo's authoritative version is its own `package.json`, read live);
- writes no inactive-platform breadcrumb (both load surfaces are real, hand-authored, committed files).

The guarantee: **a reinstall here converges to the committed bytes** — `git status --porcelain` is empty after a dogfood reinstall on either platform.

Fail-closed and **symmetric** (the footgun made loud): `--dogfood` against a non-source target is a hard error (the wired `src/...` paths would dangle), and its **absence** when the target IS the source repo is equally a hard error (a downstream-mode install there would churn the tracked source-mode files). Neither direction proceeds silently.

The rest of this file is the **underlying detail** — what each wiring step does, the single home for each. The installer automates exactly these; reach for a manual step only to understand or to wire one platform by hand.

Convention used below: the adapter ships inside the protocol's tooling submodule at `.ai-dev/tooling/src/adapter/`. A project that vendors the adapter elsewhere rewrites the one path in each wiring step — nothing else changes.

## Upgrade

A downstream upgrades by bumping the protocol source and re-running the same one command:

1. Bump the protocol to the new version — re-fetch the release (`npx github:aadegtyarev/ai-dev-protocol <target>`), or bump the tooling submodule and re-run the **vendored** installer (`node .ai-dev/tooling/src/adapter/install.mjs . --platform <platform>` — the vendored tree is self-sufficient for this).
2. The re-run IS the upgrade — its idempotence and never-clobber guarantees mean the project's `.ai-dev/config.json` and real docs survive. It stamps `.ai-dev/VERSION`, refreshes `.ai-dev/upgrades.md`, and on a detected version change writes the `.ai-dev/UPGRADING.md` marker and asks for a session restart; the next session offers the migration check (`src/agents/orchestrator.md` `## Upgrade`).
3. Read the CHANGELOG between the two versions (shipped in the package). The per-version migration steps — what a MAJOR bump renames, what survives, why downgrades are unsupported — live in **`upgrades.md`** (this directory; laid down at `.ai-dev/upgrades.md`), the single home. MINOR/PATCH versions without a section there need nothing beyond the re-run.

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
@.ai-dev/PROTOCOL.md
@.ai-dev/tooling/src/agents/orchestrator.md
```

The orchestrator **is** the session; the Builder and Reviewer are spawned (below).

### Spawn a sub-agent (the Builder and Reviewer)

**`node src/adapter/claude/install-agents.mjs`** assembles the two spawnable roles into Claude agent files:

- It reads each neutral role body (`src/agents/<role>.md`) + the Claude frontmatter (`src/adapter/claude/agents/<role>.fm`) and writes `.claude/agents/<agentId>.md`.
- The **agent id comes from `.ai-dev/config.json` `roles`** (so `builder` → `dev-builder`, `reviewer` → `dev-reviewer`).
- It is concatenation, not a generator — the neutral body stays the single source.
- Re-run it whenever a role body, its frontmatter, or the config binding changes.

The orchestrator spawns each by that id, on the model `.ai-dev/config.json` resolves.

### Command (the explicit setup trigger)

**`node src/adapter/claude/install-commands.mjs`** assembles the `/dev-setup` slash-command into **`.claude/commands/dev-setup.md`** — the neutral command body (`src/adapter/commands/dev-setup.body.md`) + the Claude frontmatter (`src/adapter/claude/commands/dev-setup.fm`).

- The filename without extension is the command (`dev-setup.md` → `/dev-setup`).
- The body becomes the prompt injected into the session; the orchestrator **is** the session, so it runs its own `## Setup`.
- The body is a thin pointer — no copy of the dialog (single home, invariant 6).
- Re-run it whenever the neutral body or the frontmatter changes.

**Apply config** — the shared re-assemble-after-setup step is homed in `tool-map.json` `apply-config` + `docs/architecture.md`. Claude delta: the reviewer model is resolved at *spawn*, not baked, so applying is just **`node src/adapter/claude/install-agents.mjs`** refreshing the assembled bodies (re-run `install-commands.mjs` too if the command surface changed).

## OpenCode

**OpenCode loads agents from `.opencode/agents/` — PLURAL** (the singular `.opencode/agent/` is **not** loaded). A **plugin** is deployed to `.opencode/plugins/` but, as of OpenCode **1.17.8**, is loaded ONLY when registered in the `plugin` key of `opencode.json` — project-folder plugin auto-discovery was dropped in that release. The deploy dir is where the file lands; the `plugin` key is what makes OpenCode load it (see *Enforce deny* below).

### Enforce deny + inject (the plugin)

**`node src/adapter/opencode/install-plugin.mjs`** generates the deployed plugin — `.opencode/plugins/ai-dev.mjs` — FROM the source entry `src/adapter/opencode/plugin-entry.mjs`. It retargets only the adapter location to where the target vendors it (downstream: `.ai-dev/tooling/src/adapter`, no rewrite; dev/this repo: `src/adapter`).

- It must **define** each hook function inline — a hook imported from another module and re-exported under the entry's own name is NOT registered by the loader (it loads but its hook never fires).
- So the thin wrappers are **inline in the entry**; only the rule logic (`decide`/`decidePrompt` + the engine) is imported from the adapter tree, which sits outside the scanned plugin dir. The rules stay single-sourced.
- The deployed file is **generated, not hand-copied** — so it cannot drift from the source (`src/adapter/install-plugin.test.mjs` guards byte-identity).
- Re-run it whenever the entry changes.
- **Registration is REQUIRED** (OpenCode 1.17.8 dropped project-folder plugin auto-discovery): the deployed plugin loads only when listed in the `plugin` key of `opencode.json`. The installer adds `"./plugins/ai-dev.mjs"` to that key (de-duped, never clobbering a project's own entries). The spec is **`.opencode/`-relative**, not project-root-relative — OpenCode resolves a relative plugin path against the dir of `opencode.json` (i.e. `.opencode/`), so `./plugins/ai-dev.mjs` is correct and `./.opencode/plugins/...` double-resolves and silently fails to load. Without this key the boundary deny never fires — the whole `[mechanical]` floor is absent.

The entry registers **two** hooks — the two enforcement classes OpenCode realises:

- **`tool.execute.before`** (deny) — resolve root, resolve the actor, call `decide`, **throw** on a deny verdict (the throw is OpenCode's block).
- **`chat.message`** (inject) — OpenCode's analog of Claude's `UserPromptSubmit`: it fires once per user message before the LLM call, and `output.parts` is mutable. The entry joins the text parts into `userText`, calls `decidePrompt`, and on an inject verdict **pushes** `{ type: "text", text: reason }` onto `output.parts` — one-shot context for that turn. This is how the lazy-setup nudge (`no-config-run-setup`) and the `change-route-reminder` reach the model on OpenCode.

`ask` has no plugin-hook realisation on OpenCode, so an `ask`-class rule falls back to persona (recorded per-rule in `deny-rules.json` `fallback`). The plugin supplies only the mechanism — the verb list and predicates stay in `deny-rules.json` + the engine.

### Load instructions + the orchestrator personality

UNLIKE Claude (where the orchestrator IS the session, held by `CLAUDE.md`), an OpenCode session runs as a **primary agent** — so the orchestrator is its own primary agent: `default_agent` points at it, and the shared constitution loads via `instructions`:

```json
{
  "default_agent": "ai-dev",
  "instructions": [".ai-dev/PROTOCOL.md"],
  "permission": { "edit": "allow", "bash": "allow", "webfetch": "allow", "question": "allow" },
  "agent": { "build": { "disable": true }, "plan": { "disable": true } },
  "plugin": ["./plugins/ai-dev.mjs"]
}
```

The permission block sets native OpenCode permissions to full-speed inside the project. Division of labor: the **protocol plugin is the sole boundary guard** (mechanically denies reads/writes/finds outside the project root); native `permission` is the speed dial for tool calls inside that boundary. Honest residual: `bash` boundary is best-effort (the engine parses obvious path tokens; an opaque escape like `python3 -c '...'` is not mechanically caught). `edit`/`read`/`write` tool-call checks are exact. `webfetch: allow` because research needs outbound fetches; sending project data out is a separate `[persona]` rule, not a filesystem-boundary concern.

The generic `build`/`plan` primaries are disabled so none can fill the orchestrator seat (invariant 1); `AGENTS.md` (repo root) is OpenCode's always-on surface and points at the same constitution.

### Spawn a sub-agent (and assemble the orchestrator)

`node src/adapter/opencode/install-agents.mjs` assembles the three role agents into `.opencode/agents/`: each neutral role body (`src/agents/<role>.md`) + its OpenCode frontmatter (`src/adapter/opencode/agents/<role>.fm`) → `.opencode/agents/<agentId>.md`.

- The agent id comes from `.ai-dev/config.json` `roles`: orchestrator → `ai-dev` with `mode: primary`; builder → `dev-builder`, reviewer → `dev-reviewer` with `mode: subagent`.
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

**Apply config** — the shared re-assemble-after-setup step is homed in `tool-map.json` `apply-config` + `docs/architecture.md`. OpenCode delta: **`node src/adapter/opencode/install-agents.mjs`** assembles the role agents but bakes **no** reviewer `model:` line — the OpenCode `task` runtime ignores a subagent's `model:`, so no cross-model reviewer is realisable here (why: `tool-map.json` `models.opencode._note`). Re-run `install-commands.mjs` too if the command surface changed.

> **Fallback (no dir guess needed):** if a future opencode stops loading the markdown command dir, define the command inline in `opencode.json` under the `command` key. The SDK `Config.command` schema (`{ template, description, agent, model, subtask }`, confirmed in `@opencode-ai/sdk`) takes the same body as `template` and `agent: ai-dev`. The markdown-dir form is preferred here because it shares the one neutral body file with Claude.
