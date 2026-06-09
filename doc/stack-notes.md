<!--
  Doc-style rules apply: fact-first, current-state-only, supersede-don't-edit,
  provenance-as-pointer, plain-language. Read them in `## Durable-text frugality`
  in `workflow/doc-style.md` — the authority; this comment names the rules and
  points there, it does not restate them. Current-state-only: each entry states
  what is true now; the investigation narrative that reached an execution-verified
  fact lives in git, not here.
-->

# Stack notes

Living document. Initialised at bootstrap, extended on every feature that touches a new external system. Maintained by `pm-stack-researcher`; read by `/pm-plan`, `pm-architect`, `pm-coder`, and the review engine.

This document is for **this template repository itself** — the template documents its own stack (a meta-research case) so the auditor / reviewer can apply the stack dimension on the template the same way it would on a downstream project.

**Last full review:** 2026-06-08

---

## How this document is used

- **`/pm-plan`** reads it before drafting a plan that touches a listed component; if a touched component is missing here, it spawns `pm-stack-researcher` to extend this document **before** continuing.
- **`pm-architect`** reads it when proposing variants — stack constraints are part of the trade-off space.
- **`pm-coder`** reads it before writing integration code for a listed component. On a task↔stack-notes contradiction, coder stops and escalates — no fallback to web search.
- **the review engine** checks every diff against the relevant entries; code that contradicts an idiom or constraint here is **blocking** with a citation back to this file.

A missing / empty entry for a touched component is a protocol-level defect (bootstrap or `/pm-plan` should have caught it), not a content gap.

---

## Components

### jq

- **Role:** JSON processor inside `.claude/settings.json` hook commands — parses the `PreToolUse` stdin contract (`tool_input.file_path`, `tool_input.command`, …) and emits `hookSpecificOutput` JSON on stdout.
- **Canonical docs:** <https://jqlang.org/manual/> (jq 1.8 Manual).
- **Required validators:** none — jq is a runtime tool inside hook strings; the end-to-end check is exercising the hook with a representative `tool_input` JSON on stdin.
- **Idioms:**
  - `-r` / `--raw-output`: a string result is written directly, not as a quoted JSON string. Source: <https://jqlang.org/manual/#invoking-jq>.
  - `//` alternative operator: produces the left-hand values that are neither `false` nor `null`, else the right-hand values. Source: <https://jqlang.org/manual/#alternative-operator>.
  - `empty`: returns no results at all. The `// empty` idiom = "produce nothing when the left side is null/false", suppressing downstream `[ -z "$VAR" ] && exit 0` guards from firing on an explicit `null`. Source: <https://jqlang.org/manual/#empty>.
  - Exit codes: 2 usage/system error, 3 program compile error, 0 ran. With `-e`/`--exit-status`: 0 if last output was neither `false` nor `null`, 1 if it was, 4 if no valid result. Source: <https://jqlang.org/manual/#--exit-status-e>.
- **Gotchas:**
  - `//` treats both `null` AND `false` as "missing on the left" — a literal `false` falls through to the default (intentional but surprising; a separate `??` was discussed, not adopted). Source: <https://github.com/jqlang/jq/issues/3098>.
  - On invalid-JSON stdin jq does not silently emit empty; the FAQ recommends `try fromjson catch …`. Source: <https://github.com/jqlang/jq/wiki/FAQ>.
- **Last reviewed:** 2026-05-30

---

### gh (GitHub CLI)

- **Role:** used by `pm-pr-prep` (`gh pr list/create/edit`) and `.github/workflows/auto-tag.yml` (`gh release view/create`) to drive PR/release flow.
- **Canonical docs:** <https://cli.github.com/manual/>.
- **Required validators:** none native; the project uses `gh pr list --state open --head <branch>` as a caller-side pre-check.
- **Idioms:**
  - Auth precedence for github.com / ghe.com: `GH_TOKEN`, then `GITHUB_TOKEN` — set to avoid prompts and take precedence over stored creds. Source: <https://cli.github.com/manual/gh_help_environment>.
  - `--json <fields>` + `--jq <expr>` compose (`--jq` runs on the `--json` output). Source: <https://cli.github.com/manual/gh_pr_list>.
  - `gh pr edit` / `gh pr create` with no arg select the current branch's PR; create flags `--title`/`--body`/`--base`/`--draft`/`--head`; off-remote branch prompts where to push. Sources: <https://cli.github.com/manual/gh_pr_edit>, <https://cli.github.com/manual/gh_pr_create>.
  - `gh pr list` defaults: state open, 30 most-recent items. Source: <https://cli.github.com/manual/gh_pr_list>.
- **Gotchas:**
  - `gh auth status` once returned 0 even on auth failure (fixed in `cli/cli#9240`; older releases affected — do not depend on the exit code alone). Source: <https://github.com/cli/cli/issues/8845>.
  - `gh auth login --with-token` in CI can exit 1 on success when `GH_TOKEN` is also set. Source: <https://github.com/cli/cli/issues/7008>.
  - gh is GitHub-specific — a non-GitHub remote has no documented behaviour and will fail. Source: <https://cli.github.com/manual/gh_help_environment>.
- **Last reviewed:** 2026-05-30

---

### git

- **Role:** branches/commits/PR flow, conventional-commit parsing (`pm-pr-prep`), `git rev-parse --show-toplevel` (the project-root boundary guard in every hook), `git describe --tags` (release flow), submodule semantics (the template ships as a submodule at `.ai-pm/tooling/`).
- **Canonical docs:** <https://git-scm.com/docs>.
- **Required validators:** `git check-ref-format --branch <name>` (branch-name rules). Source: <https://git-scm.com/docs/git-check-ref-format>.
- **Idioms:**
  - `git rev-parse --show-toplevel` prints the absolute working-tree root, reports an error (non-zero) outside a working tree. The hook idiom `ROOT=$(git rev-parse --show-toplevel 2>/dev/null); [ -z "$ROOT" ] && exit 0` relies on the empty-stdout-on-error contract, not a specific exit code. Source: <https://git-scm.com/docs/git-rev-parse>.
  - Ref-name rules (10-rule list): ≥1 slash (without `--allow-onelevel`), no `..`, no control chars/space/`~`/`^`/`:`/`?`/`*`/`[`, no leading/trailing slash, no trailing `.`, no `@{`, not bare `@`, no backslash. Source: <https://git-scm.com/docs/git-check-ref-format>.
  - `git describe --tags` matches lightweight tags too (default = annotated only). Source: <https://git-scm.com/docs/git-describe>.
  - `git push`: non-fast-forward / `remote rejected` outputs (the latter from a remote hook or `receive.deny*` options); `--force` disables the safety checks (can lose commits); `--force-with-lease` overrides only if the remote ref equals the expected value. Source: <https://git-scm.com/docs/git-push>.
  - Submodule data model: a submodule is a repo embedded in a superproject — git dir under `$GIT_DIR/modules/`, a `.git` file pointing to it, a gitlink tree entry, and a `.gitmodules` name/path entry. `git submodule init/update` maintain checkout/revision. Source: <https://git-scm.com/docs/gitsubmodules>.
- **Gotchas:**
  - Default `git clone` does NOT check out submodules — `--recurse-submodules` or `git submodule update --init` required; the path otherwise appears empty. Source: <https://git-scm.com/docs/gitsubmodules>.
  - Submodule config precedence (high→low): CLI flags → submodule `$GIT_DIR/config` → superproject `$GIT_DIR/config` → `.gitmodules` (so "I changed `.gitmodules` and nothing happened"). Source: <https://git-scm.com/docs/gitsubmodules>.
- **Last reviewed:** 2026-05-30

---

### GitHub Actions

- **Role:** `.github/workflows/auto-tag.yml` runs on every push to `main`, reads the top version from `CHANGELOG.md`, creates a tag + GitHub Release if missing.
- **Canonical docs:** <https://docs.github.com/en/actions>.
- **Required validators:** none native (`actionlint`/`yamllint` are external); the authoritative validator is the actual workflow run.
- **Idioms:**
  - Workflow keys `name` / `on` / `jobs` (jobs run in parallel by default); workflow-level and per-job `permissions` modify the `GITHUB_TOKEN` grants; `steps[*].run` runs commands on the runner. Source: <https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions>.
  - `${{ <expr> }}` evaluates an expression; on `if:` keys the wrapping is optional for **simple reference expressions** but **required for anything with operators** (`!`, `&&`, `||`, function-with-operators) or it fails to parse. `steps.<id>.outputs.<name>` evaluates as a string. Sources: <https://docs.github.com/en/actions/concepts/workflows-and-actions/expressions>, <https://github.com/github/docs/issues/3001>.
  - `GITHUB_TOKEN` is a per-job installation access token scoped to the workflow's repo; lifetime ≤ 6h on GitHub-hosted runners (≤ 24h refresh self-hosted). Source: <https://docs.github.com/en/actions/concepts/security/github_token>.
  - `actions/checkout@v4` checks out under `$GITHUB_WORKSPACE`; `fetch-depth` default `1`, set `0` for all history/tags. Source: <https://github.com/actions/checkout>.
  - `gh` is preinstalled on `ubuntu-latest` runners — `gh release create/view` work when `GH_TOKEN=secrets.GITHUB_TOKEN`. Source: <https://github.com/actions/runner-images>.
- **Gotchas:**
  - `if:` expressions with operators silently mis-parse — canonical failing example `if: !startsWith(...)` (no `${{ }}`). Source: <https://github.com/github/docs/issues/3001>.
  - Default `fetch-depth: 1` makes `git describe --tags` / tag-based version detection fail when recent tags are off the fetched commit — version-from-tags needs `fetch-depth: 0`. Source: <https://github.com/actions/checkout>.
- **Last reviewed:** 2026-05-30

---

### Claude Code hooks API

- **Role:** `.claude/settings.json` registers `PreToolUse` hooks gating Read/Edit/Bash against the project-root boundary, `find` outside the root, ssh-driven content edits + mutating actions, `git push --force`, and `git commit --no-verify`. Hook scripts read stdin JSON, parse with jq, emit `hookSpecificOutput` JSON to deny / ask / let-through.
- **Canonical docs:** <https://code.claude.com/docs/en/hooks>; settings <https://code.claude.com/docs/en/settings>; permissions <https://code.claude.com/docs/en/permissions>.
- **Required validators:** none native; end-to-end validation is running a representative `tool_input` JSON through the hook command and observing stdout (automated in `tests/hooks.sh`).
- **Idioms:**
  - Tool-axis hook events: `PreToolUse` (before a call — can block), `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`, `PermissionRequest`, `PermissionDenied`. Source: <https://code.claude.com/docs/en/hooks>.
  - `PreToolUse` stdin: common fields + `tool_name` (string) and `tool_input` (object), e.g. `{"tool_name":"Bash","tool_input":{"command":"npm test"}}`.
  - `hookSpecificOutput` for `PreToolUse`: `hookEventName`, `permissionDecision` (enum `allow` | `ask` | `deny` | `defer`), `permissionDecisionReason` (shown to the user).
  - `matcher`: `"*"` / `""` / omitted = match-all; a value of only `[a-zA-Z0-9_|]` is an exact name or `|`-list (`Bash`, `Edit|Write`); anything else is a JS regex.
  - `if:` adds a permission-rule filter (`Bash(git *)`, `Edit(*.ts)`) — evaluated only on `PreToolUse`/`PostToolUse`/`PostToolUseFailure`/`PermissionRequest`/`PermissionDenied`; on other events a hook with `if:` never runs. For Bash it matches each subcommand after stripping `VAR=value`, and always runs when the command is too complex to parse.
  - Permission wildcards: the space before `*` matters — `Bash(ls *)` matches `ls -la` not `lsof`; `Bash(ls*)` matches both; `Bash(ls:*)` ≡ `Bash(ls *)`. Compound commands split at `&&`/`||`/`;`/`|`/`|&`/`&`/newlines, each matched independently. Source: <https://code.claude.com/docs/en/permissions>.
  - `settings.json` locations: `~/.claude/` (user), `.claude/settings.json` (project, checked in), `.claude/settings.local.json` (project-local, not checked in).
  - "No decision" = exit 0 with no output → normal permission flow.
- **Gotchas:**
  - The upstream hooks example uses `jq -n '{hookSpecificOutput:{…}}'`; this repo's hooks use hand-built escaped JSON strings (`echo "{\"hookSpecificOutput\":…}"`). Quoting JSON-in-Bash-in-JSON is fragile; whether `jq -n` is preferred is not stated upstream. Source: empirical (this repo's `settings.json` contract; upstream silent).
  - A `matcher` with any char outside `[a-zA-Z0-9_|]` is a regex, not a literal (`Bash *` would be a regex).
  - `if:` on a non-tool event (`SessionStart`, `UserPromptSubmit`, `Stop`, …) means the hook never runs.
- **Last reviewed:** 2026-05-30

---

### Markdown frontmatter (YAML in agent files)

- **Role:** every `.claude/agents/*.md` persona opens with YAML frontmatter declaring `name`, `description`, `model`; Claude Code reads it at session start to register each subagent. (The eight `pm-*` personas are listed in `doc/architecture.md` `## File layout`.)
- **Canonical docs:** <https://code.claude.com/docs/en/sub-agents>; YAML 1.2.2 §2.2 <https://yaml.org/spec/1.2.2/#22-structures>.
- **Required validators:** none native; `/agents` reports a parse failure, otherwise loading is silent.
- **Idioms:**
  - Frontmatter (YAML) then a Markdown body that becomes the system prompt; `---` brackets the YAML document. Sources: <https://code.claude.com/docs/en/sub-agents>, <https://yaml.org/spec/1.2.2/#22-structures>.
  - Only `name` and `description` are required. `name` = lowercase + hyphens, surfaced to hooks as `agent_type` (filename need not match). `description` drives delegation.
  - `model` ∈ `sonnet` | `opus` | `haiku` | full model ID | `inherit` (default `inherit`). Resolution order: `CLAUDE_CODE_SUBAGENT_MODEL` env → per-invocation `model` param → frontmatter `model` → main conversation model.
  - Identity is the `name` field, not the filename; a duplicate `name` in one scope → one is kept, the other discarded without warning. Agent files load at session start (restart to pick up disk edits; `/agents` edits take effect immediately).
- **Gotchas:**
  - Silent collision on duplicate `name` — a typo colliding with a built-in (`Explore`, `Plan`, `general-purpose`) can silently replace or be replaced.
  - The Markdown body is the system prompt verbatim (subagents get only this, not the full Claude Code prompt) — stray comments count as instructions.
  - Plugin subagents silently ignore `hooks`, `mcpServers`, `permissionMode`.
- **Last reviewed:** 2026-05-30

---

### Claude Code context-loading model

Load-bearing for any "split a big instruction file" design (the `WORKFLOW.md` thin-core + on-demand topic-files split). Its correctness depends entirely on what enters context at session start, what loads lazily, and what reaches subagents. Read by `/pm-plan` and `pm-architect` before designing such a split, and by the reviewer to block a design that assumes `@`-splitting reduces context (it does not) or that a subagent inherits skills/history it does not.

- **Canonical docs:** <https://code.claude.com/docs/en/memory>, <https://code.claude.com/docs/en/skills>, <https://code.claude.com/docs/en/sub-agents>.
- **Required validators:** none native (knowledge component). Observability: the `InstructionsLoaded` hook logs which instruction files load when/why; `/memory` lists every loaded CLAUDE.md / rules file. Source: <https://code.claude.com/docs/en/memory>.
- **Idioms:**
  - **CLAUDE.md size:** target < 200 lines (longer files reduce adherence) but **loaded in full regardless of length** — the 200-line / 25KB hard cap is the **auto-memory** (`MEMORY.md`) limit, not a CLAUDE.md truncation. CLAUDE.md is delivered as context (a user message after the system prompt), not enforced config — to block an action use a `PreToolUse` hook. Source: <https://code.claude.com/docs/en/memory>.
  - **`@`-import is EAGER, not lazy.** Imported files expand into context at launch (max depth four hops; relative paths resolve against the importing file, not the cwd). Splitting a monolith into `@a @b @c` reduces nothing — every byte still enters the window at start. Source: <https://code.claude.com/docs/en/memory>.
  - **The only built-in lazy surfaces:** a subdirectory CLAUDE.md (loads when Claude reads a file there), a path-scoped `.claude/rules/*.md` (loads when a matching file is touched; rules without `paths` load at launch), a Skill body (loads on invocation), and any non-imported file pulled in on demand via Read. A thin always-loaded core that *points at* topic files (not `@`-imports them) is the documented way to defer cost. Source: <https://code.claude.com/docs/en/memory>, <https://code.claude.com/docs/en/skills>.
  - **Skills progressive disclosure:** only the `description` (+`when_to_use`, truncated at 1,536 chars in the listing) sits in context at start; the body loads on invocation and then **persists for the rest of the session** (a recurring per-turn cost). `disable-model-invocation: true` keeps even the description out of context (manual `/name` only) and prevents subagent preload. Skills are the official pattern for a CLAUDE.md section that grew into a procedure. Source: <https://code.claude.com/docs/en/skills>.
  - **Subagents** get a fresh, isolated context window: they do NOT see conversation history, already-invoked skills, or already-read files (except a **fork**, which inherits the whole conversation). They DO load the project CLAUDE.md + memory hierarchy — **except built-in Explore and Plan**, which skip CLAUDE.md + git status (not configurable). A subagent does NOT auto-inherit skills — a skill must be named in `skills:` to be preloaded (full content injected, losing the description-only economy); others are reachable only via the Skill tool. Source: <https://code.claude.com/docs/en/sub-agents>.
- **Gotchas:**
  - `@`-splitting cannot make a spec lazy — load-on-demand requires the Read tool against non-imported files (see lazy surfaces above).
  - A skill invoked early in a long session is no cheaper than CLAUDE.md content for the rest of it. After `/compact`, re-attached skills keep only the first 5,000 tokens each, sharing a 25,000-token budget — older invoked skills can be dropped.
  - The "~60 tokens per skill at startup" figure is **NOT** in the docs — cite the 1,536-character listing cap, not a token count.
  - Project-root CLAUDE.md survives `/compact` (re-read from disk); nested-subdir CLAUDE.md and one-off instructions may not — a topic-file design on a subdir CLAUDE.md is weaker across compaction than one on the project-root CLAUDE.md + skills/rules.
  - Block-level HTML comments in CLAUDE.md are stripped before injection (cost no context); comments inside code blocks are preserved and do cost context.
- **Last reviewed:** 2026-06-05

---

### Semgrep

- **Role:** Step-5 Pass-2 deterministic pre-check before AI `code-review` — runs community rulesets over the touched files to surface mechanical issues cheaply; findings append to `.ai-pm/reviews/<topic>_review.md`. Supersedes the former local idioms library (`doc/_templates/stack-idioms/python.md`).
- **Canonical docs:** <https://docs.semgrep.dev/getting-started/>.
- **Invocation:** `semgrep --config p/<lang> --json <files>` (downloads the named registry ruleset at runtime; needs Semgrep installed + internet). Config map: Python→`p/python`, JS→`p/javascript`, TS→`p/typescript`, Go→`p/go`, Java→`p/java`.
- **Contract:** exit 0 = success (findings or none), non-zero = error. **Silent-fallback rule:** any non-zero exit / missing binary / config-download failure / no known config for the language → skip, proceed to AI review (so Semgrep is not a blocking dependency). Findings in the JSON `results` array (`check_id`, `path`, `start`/`end`, `extra.message`).
- **Known constraint:** requires internet at review time (community rules are not bundled); the silent-fallback keeps the pipeline graceful when unavailable.
- **Last reviewed:** 2026-06-05

---

### OpenCode (anomalyco/opencode) — second harness adapter target

**Role:** the protocol's **second supported harness** alongside Claude Code (one source, two adapters, no downstream build). This entry is the documented platform contract the `.opencode/` adapter is built against — what maps 1:1 to Claude Code primitives, what is a different-shaped near-equivalent, and what is an outright gap.

- **Canonical docs:** <https://opencode.ai/docs/> (Rules, Config, Agents, Commands, Plugins, Permissions, Tools, Skills). Repo/issues: <https://github.com/anomalyco/opencode> (the former `sst/opencode` redirects here; both orgs' `#N` resolve to the same items).
- **Verification baseline:** items tagged `execution-verified (OpenCode 1.16.2, …)` were exercised live on **OpenCode 1.16.2** across spikes A (instruction/agent/command/plugin sourcing), B (subagent containment), a tool-registry/agent-roster sweep, and an enforcement smoke. Behaviour can change across versions — **re-verify on upgrade**, especially the `#5894` containment pin.
- **Required validators:** none native (no `opencode validate-config`). The end-to-end validator is an actual `opencode run` — `opencode debug config`/`debug startup` do NOT catch a malformed plugin module; only a real run surfaces a `Plugin export is not a function` load failure. `confidence: execution-verified (OpenCode 1.16.2, 2026-06-07)`

**(1) Instruction loading.** Primary entry file is **`AGENTS.md`** (not `CLAUDE.md`). `opencode.json` has an **`instructions` array** of paths/globs, and it **accepts a submodule-relative path** (e.g. `.ai-pm/tooling/WORKFLOW.md`), config-validated — so instruction delivery via the submodule works through it. All instruction files are concatenated with `AGENTS.md`. **GAP — no in-file `@`-import:** OpenCode does not parse `@path` references inside an instruction file; the only mechanism to pull in a file is the config `instructions` array, so the thin-core + on-demand split is re-expressed as (a) the `instructions` array for the always-on core + (b) the harness-agnostic Read-tool-on-demand pattern for topic files. **Agent/command/plugin files are NOT auto-discovered under a submodule subdir** — the loaders scan only the project's own `.opencode/<kind>/`; sourcing them from the submodule requires a **symlink** (`.opencode/agent → ../.ai-pm/tooling/.opencode/agent`), mirroring the Claude symlink install. Sources: <https://opencode.ai/docs/rules/>, <https://opencode.ai/docs/config/>, <https://opencode.ai/docs/agents/>. `confidence: execution-verified (OpenCode 1.16.2, 2026-06-07)` (the `instructions` submodule-path + the symlink-required findings); the no-`@`-import / concatenation / precedence facts are `doc-cited (unverified)`.

**(2) Subagents — `.opencode/agent/*.md`.** Project `.opencode/agent/` + global `~/.config/opencode/agent/`; filename = agent id. Frontmatter: `description` (required), `mode` (`primary`|`subagent`|`all`), `model` (provider/model id), `temperature`, `top_p`, `prompt`, `permission` (tool→action map), `disable`, `tools`, `color`. **`tools` is an OBJECT map of booleans** (`{ "write": true, "edit": false }`), not Claude's comma-list, and is flagged deprecated in favour of `permission` — so translate Claude `tools: Read, Edit, Bash` → an OpenCode `permission`/`tools` object. Invocation: a primary agent spawns a subagent via the **`task` tool, which carries a `subagent_type` arg** (default `"general"`) selecting which subagent runs. **Model resolution:** subagent frontmatter `model` wins, else the subagent uses the invoking primary's model; **no per-invocation `model` override in mainline** (see (6)). Built-in roster: primaries `build`/`plan` (+ hidden `compaction`/`summary`/`title`), subagents `explore`/`general` — **no built-in `code-review`/`review`/`deep-research`** (see (7)). Source: <https://opencode.ai/docs/agents/>. `confidence: execution-verified (OpenCode 1.16.2, 2026-06-07)` (agent-load + `tools`-object + `subagent_type` arg + built-in roster, via `opencode agent list`/sweep); model-resolution chain `doc-cited (unverified)`.

**(3) Commands — `.opencode/command/*.md`.** Project/global dirs; filename = `/command`. Frontmatter: `description`, `agent`, `model`, `subtask` (force-subagent). Body args: `$ARGUMENTS`, `$1`/`$2`/…, `` !`<shell>` `` injects shell output, `@<path>` inlines a file. A command is the closest analogue to a Claude slash command/skill; note `@<path>` inlining works **inside a command body** (unlike instruction files in (1)). Source: <https://opencode.ai/docs/commands/>. `confidence: doc-cited (unverified)`

**(4) Plugins & hooks — `.opencode/plugin/` (TypeScript).** A plugin is an async function `(ctx) => hooks`, ctx `{ project, client, $, directory, worktree }`. **Module format: ESM with a SINGLE plugin-function export** — OpenCode iterates every export as a plugin function, so a CJS `module.exports` or any non-function export fails with `Plugin export is not a function` (caught only by a live run). **Tool-gating hook `tool.execute.before`** — throwing blocks the call (`if (input.tool === "read" && output.args.filePath.includes(".env")) throw …`); mutating `output.args` rewrites it. This is the OpenCode analogue of Claude's `PreToolUse` deny — **JS-throw-to-block**, not a JSON `permissionDecision` contract. Reactive `event` hooks (`session.*`, `file.edited`, `command.executed`, `message.updated`, …) fire post-fact. Source: <https://opencode.ai/docs/plugins/>. `confidence: execution-verified (OpenCode 1.16.2, 2026-06-07)` (ESM-single-export + `tool.execute.before` deny smoke); event-hook surface `doc-cited (unverified)`.
- **(4a) No `UserPromptSubmit`-equivalent event hook** — the reactive message hooks fire after a state change, not as a pre-submission interceptor. Synchronous chat-pipeline hooks DO exist (see (10)) but their model-reach is contested.
- **(4b) Subagent tool-hook containment — `#5894`, verified in our favour on 1.16.2 (version-pinned).** A plugin `tool.execute.before` hook DID fire for and deny a `task`-spawned subagent's native tool call: the subagent runs in its own child session and the per-instance plugin intercepts its native `bash`/`task`/`read`/`write` calls (confirmed twice; denied side-effect never occurred). A subagent that shells out via `bash` is gated at the `bash` tool level. **Caveat:** the broader subagent-permission cluster stays caveated — fix PR `#7473` is CLOSED-not-merged, and `#6361`/`#6396`/`#6527`/`#7474`/`#11324` were not exercised. Sources: <https://github.com/anomalyco/opencode/issues/5894>, <https://github.com/anomalyco/opencode/pull/7473>. `confidence: execution-verified (OpenCode 1.16.2, 2026-06-07)`, pinned; the broader cluster `doc-cited (unverified)`.

**(5) Tool vocabulary.** Built-in tools: `bash`, `edit`, `write`, `read`, `grep`, `glob`, `lsp` (experimental), `apply_patch`, `skill`, `todowrite`, `webfetch`, `websearch`, `question`; plus `task` and the `external_directory`/`doom_loop` permission keys. **`question` = the AskUserQuestion equivalent** (header + question + options; gateable via the `question` permission) — the structured-question tool EXISTS. **`skill` = the model-invoked Skill tool** (`skill({ name })`; OpenCode also reads `.claude/skills/` + `.agents/skills/`). Sources: <https://opencode.ai/docs/tools/>, <https://opencode.ai/docs/skills/>, <https://opencode.ai/docs/permissions/>. `confidence: execution-verified (OpenCode 1.16.2, 2026-06-07)` (`question`/`skill`/`task` present in the runtime registry).

**(6) Runtime model override for subagents — NOT in mainline.** The `task` tool carries no per-invocation `model` param; a spawned subagent's model comes from frontmatter or inheritance. The implementing PR `#17577` ("model override for task tool subagents", with a default-deny `model_override` permission) is **CLOSED-not-merged**; feature requests `#17595`/`#6651` are OPEN. **Adapter consequence:** cross-model review on OpenCode cannot use a runtime per-`task` override — it pins the model in **agent frontmatter** per file (and there is no `model_override` permission to set). Sources: <https://github.com/anomalyco/opencode/pull/17577>, `…/issues/17595`, `…/issues/6651`. `confidence: execution-verified (OpenCode 1.16.2, 2026-06-07)` (no `model` arg on `task`); PR contents `doc-cited (unverified)`.

**(7) Built-ins gap — no `code-review`/`deep-research` engine.** OpenCode ships no built-in equivalent of Claude's `code-review`/`deep-research`, and no built-in skill provides review/research. **Adapter consequence:** the protocol's delegation points must be re-bound to project-shipped agents/skills on the OpenCode side (this is the `.opencode/` `code-review`/`deep-research`/`ai-pm` harness-local engines). Sources: <https://opencode.ai/docs/agents/>, <https://opencode.ai/docs/skills/>. `confidence: execution-verified (OpenCode 1.16.2, 2026-06-07)`.

**(8) Install / packaging.** Config: `opencode.json`/`.jsonc` at the project root (or global `~/.config/opencode/`, or `OPENCODE_CONFIG`); configs **merge, not replace**. Project-scoped defs under `.opencode/{agent,command,plugin,skill}`. **Submodule wiring** = the OpenCode analogue of "symlink `settings.json` + `@`-import `WORKFLOW.md`": (a) add the submodule; (b) set `opencode.json` `instructions` to the submodule's core file(s); (c) **symlink** `.opencode/{agent,command,plugin}` into the submodule (config-alone does NOT source them). Heavier than Claude's single `@`-import line. Sources: <https://opencode.ai/docs/config/>, <https://opencode.ai/docs/rules/>, <https://opencode.ai/docs/agents/>. `confidence: execution-verified (OpenCode 1.16.2, 2026-06-07)`.

**(9) Control-layer model — no native cross-agent inheritance; a personal-config `agent.<id>` override is the bump-surviving path.** Verified on 1.16.2: `agent.<id>.disable: true` hides a built-in/agent (e.g. `agent.build.disable` + `agent.plan.disable` so the picker shows only the protocol's `pm-*`/`ai-pm`); a config-level `agent.<id>.{model,variant}` override in `opencode.json` IS applied to that agent; an unpinned `mode: all`/subagent inherits the session model. OpenCode has **no construct to point one model at a SET of agents** (the per-`task` override, PR `#17577`, is closed-not-merged), so the control-layer rule ("the four checking agents — `code-review`, `pm-auditor`, `pm-plan-checker`, `pm-product-advocate` — run on the reviewer model when set, else session") has **no one-line knob**. The canonical override is a **four-line block in the PM's OWN `opencode.json`** (one `agent.<id>.model` entry per checking agent) — the protocol bakes no per-agent model pin, every agent inherits session; the block survives a bump (the generator never touches keys it does not own):
  ```jsonc
  // in YOUR opencode.json — survives a protocol bump.
  "agent": {
    "code-review":         { "model": "<your-reviewer-model>" },
    "pm-auditor":          { "model": "<your-reviewer-model>" },
    "pm-plan-checker":     { "model": "<your-reviewer-model>" },
    "pm-product-advocate": { "model": "<your-reviewer-model>" }
  }
  ```
  It is **four lines, not one** — the closest-to-one-knob native + bump-surviving option; absent it, all four inherit the session. Sources: <https://opencode.ai/docs/agents/>, <https://opencode.ai/docs/config/>, <https://github.com/anomalyco/opencode/pull/17577>. `confidence: execution-verified (OpenCode 1.16.2, 2026-06-08)` (disable / config-override-applied / unpinned-inherits-session); the absence of a cross-agent knob is `doc-cited (unverified)`.
- **Residual to-verify:** that a checking agent **spawned as a `task` by the orchestrator** resolves to the personal-config `agent.<id>.model` (vs the orchestrator's or session model) is NOT yet end-to-end verified (the in-tree spike was inconclusive on parent-`.opencode` bleed). Until confirmed, any claim is "the config key is applied to the agent id", never a blanket "all four on the reviewer model". `confidence: to-verify`
- **Default-model trap:** OpenCode's model priority is `--model` flag → `opencode.json` `model` key → last-used (`~/.local/state/opencode/model.json` `recent[0]`) → internal first. If `recent[0]` names an unauthed provider, any **unpinned** run fails `ProviderModelNotFoundError`. The project `opencode.json` `"model"` pin (priority above last-used) is the durable guard — it makes the protocol run on the authed model regardless of a stale personal default. Sources: <https://opencode.ai/docs/models/>, <https://opencode.ai/docs/config/>; the `model.json` storage path + the unauthed-default failure rest on the in-tree probe. `confidence: execution-verified (OpenCode 1.16.2, 2026-06-08)`.

**(10) Per-prompt protocol-reminder injection — the `UserPromptSubmit` analogue (UNVERIFIED, fallback in force).** Signatures are SDK-typed in `@opencode-ai/plugin` `Hooks` but NOT on the docs page — treat the SDK type as the contract and the doc absence as a stability warning. Source: <https://github.com/anomalyco/opencode/blob/dev/packages/plugin/src/index.ts>. The four candidate chat-pipeline hooks and their fit:
- **`chat.message`** — fires per message, input carries `agent?` (**per-agent targetable**); output `parts: Part[]` is mutable (a plugin can append a `{ type: "text", text }` part). **But model-reach is contested** — two community reports show injected parts not even rendering, and neither confirms the part reaches the LLM context. Sources: SDK type; <https://github.com/code-yeongyu/oh-my-openagent/issues/885>, <https://github.com/keybrdist/opencode-breadcrumb/issues/2>.
- **`chat.params`** — per-agent targetable (input `agent`), but output is sampling params only (no `system`/`messages`/`parts`) — **cannot inject text**.
- **`experimental.chat.system.transform`** — mutates the system prompt (`output.system: string[]`), but **input has no `agent`** (not targetable; only `sessionID`), no user-message text, and carries a **runtime-discard bug (`#17100`, closed not-planned)** — mutations execute in-plugin but the delivered system prompt is unchanged. The single strongest reason not to assume it works without a live spike.
- **`experimental.chat.messages.transform`** — transforms the full message history before the API call (**best model-reach**), but input is **empty `{}`** (no `agent`/`sessionID`, not targetable from input).
- **Fit + likely shape:** no single hook gives BOTH confirmed model-reach AND per-agent targeting. The candidate adapter shape (to confirm by spike, not asserted): use `chat.message` (carries `agent`) to learn the active agent and stash `sessionID→agent`, then inject via `experimental.chat.messages.transform`, consulting the map to skip non-`ai-pm` sessions.
- **Status — spike BLOCKED, model-reach unproven (NOT refuted); fallback stands.** The marker-echo spike (inject a unique marker for `agent === "ai-pm"`, prompt the model to echo it, confirm subagent containment, pin the version) could not reach the model-reach step: `opencode run` would not complete a turn — the (11) session-insert issue surfacing as a startup HANG, recurring even on a clean DB (root cause = (12)(B), the server-connect race, not event-bloat). The bump-surviving fallback remains the always-on `instructions`/`AGENTS.md` surface (no per-prompt freshness, but guaranteed to reach the model). Re-run on an environment where `opencode run` completes a turn (a long-lived `opencode serve` + client session is the suggested harness — untested). Cross-harness decision context: `doc/decisions/dual-harness.md` `### Orchestrator anti-corner-cutting…` piece 3. `confidence: to-verify` on all of (10).

**(11) Harness limitation — session-insert long-session crash (NOT ours; handle gracefully).** After a long session a `task`-spawned subagent dies with a SQLite `insert into "session" … on conflict do nothing returning "id"` error, and every subsequent spawn crashes the same way until OpenCode is restarted; it can also manifest as a deterministic silent **startup hang** (`opencode run` not completing a turn). Root cause = the unbounded `event` table (see (12)); restart clears the crash, and clearing the event log fixes both crash and hang. This is an **OpenCode-internal bug, not a protocol defect** — the protocol's duty is to fail GRACEFULLY: on a subagent crash the orchestrator retries the SAME subagent up to N=2, then STOPS the pipeline and reports to the PM (which gate could not run + the error + the restart remedy) and NEVER self-substitutes the failed gate's verdict/code/stamp/merge (a failed gate = a missing gate). Implemented by the persona failure-path rule (`workflow/enforcement.md` + the `ai-pm` body) + the deny-side pre-ship merge gate in the enforcement plugin. Source: live observation (nula). `confidence: execution-observed (OpenCode 1.16.2, 2026-06-08)`.

**(12) Event-store unbounded growth — the (11) root + how to bound it.**
- **Source:** OpenCode persists every state change in the append-only `event` table of `~/.local/share/opencode/opencode.db`, which is **never pruned** (event types `message.updated.1`, `message.part.updated.1`, `session.*`). Live on 1.16.2 the `event` table reached **241 MB / 24,812 rows** (`message.updated.1` alone 216.7 MB — each event embeds a full message snapshot incl. file patches) of a 293 MB DB whose materialized session/message/part projections were only ~22 MB. Sources: <https://github.com/anomalyco/opencode/issues/4659> (event-sourcing architecture), in-tree observation. `confidence: execution-observed (OpenCode 1.16.2, 2026-06-08)` on bloat+remedy; architecture statement `doc-cited (unverified)`.
- **The startup hang has TWO distinct root causes; the `DELETE FROM event` remedy fixes only one.** **(A) event-bloat** — the 241 MB table; cleared by lever (a) below (a turn completes post-prune). **(B) a one-shot `opencode run` server-connect RACE [NOT fixed by the prune]** — with a clean pruned DB the hang STILL recurs: `opencode run` spawns an internal server and the client-to-server connect freezes (exit 124) at varying early points (plugin load / `service=format init` / `server event connected` / share-next subscriber), threads parked in `futex`. Intermittent/timing-sensitive (~1/35 runs completed; `strace` perturbs it) and **plugin-independent** (0/8 with no custom plugin). Suggested mitigation: a long-lived `opencode serve` + client session — untested. `confidence: execution-observed (OpenCode 1.16.2, 2026-06-08)` on the (A)/(B) split; `to-verify` on the `serve` mitigation.
- **No config/command to bound the event store in 1.16.2.** The config page documents NO event-store retention/size/auto-prune/disable key (the resolved config exposes none); `compaction.{auto,prune,reserved}` clears tool OUTPUT for token economy, not the `event` table; `snapshot` is file-rollback, not the event log. PR `#16730` (`retention.days` + auto_vacuum/WAL, merged to `dev`) targets archived sessions + tool-output, **not** the `event` table, and is not in force on 1.16.2 (`PRAGMA auto_vacuum` = 0, no `retention` key resolves). Upstream issues `#16777`/`#16697`/`#22110`/`#4980` all closed/not-planned and none scopes the `event` table — that linkage is our in-tree finding. CLI surface is `opencode db "<SQL>"` / `opencode db path` + `opencode session list|delete` — **no `session prune`, no `db vacuum/prune`**. Sources: <https://opencode.ai/docs/config/>, `…/pull/16730`, `…/issues/16777`, `…/issues/22110`, live probes. `confidence: execution-verified (OpenCode 1.16.2, 2026-06-08)` on the live absences; PR/issue contents `doc-cited (unverified)`.
- **Working levers (no config/command exists):** **(a) manual event-log clear (recommended — keeps history projections):** with OpenCode stopped, back up (`cp …/opencode.db …/opencode.db.bak`) then `opencode db "DELETE FROM event;"` + `opencode db "VACUUM;"` — took the DB 291 MB → 28 MB and cleared the (11) hang. **(b) fresh-start nuke (loses history):** delete `opencode.db` (+ `-wal`/`-shm`); recreated empty on next start. **(c) upstream fix/fork:** none prunes the `event` table as of 2026-06-08. **Operational note:** this is a host-maintenance action on a runtime-state DB (allowed under the remote-system boundary — runtime state, not a repo file), run with OpenCode stopped + a backup. The in-pipeline duty stays (11)'s graceful-failure handling; (12) is the preventive maintenance. `confidence: execution-verified (OpenCode 1.16.2, 2026-06-08)` on lever (a).

- **Last reviewed:** 2026-06-08

---

## Validators wired into pipeline

This template ships as a documentation-and-config repo consumed via git submodule — no traditional build/test pipeline. The continuous-validation surface is CI: `.github/workflows/lint-hooks.yml` (`tests/hooks.sh`) and `.github/workflows/generator.yml` (the generator byte-equivalence + neutral-prose guards). No native *stack* validator is wired in; candidates (`actionlint`, `git check-ref-format`) are tracked separately and out of scope here.

For downstream projects, this is where `pm-stack-researcher` lists each project's mandatory validators (`tsc --noEmit`, `cargo check`, `helm lint`, `kubectl apply --dry-run=server`, …); bootstrap copies them into the project's `CLAUDE.md` Pipeline block. **AI-minimums→linter-rule mapping:** for a downstream stack, `pm-stack-researcher` also maps each AI-specific minimum (max source-file / function / cyclomatic cap / no file-level suppressions / new-code coverage floor — the numbers single-sourced in the downstream `docs/architecture.md` `### AI-specific minimums`) to the concrete linter rule that encodes it (referencing the numbers, never restating them); a minimum the stack's linter cannot express is recorded convention-only.

---

## Integration contracts

| External system | Local artifact | Delivery | Validator |
|---|---|---|---|
| GitHub Releases | `CHANGELOG.md` (top entry) + the tag derived from it | `.github/workflows/auto-tag.yml` reads `CHANGELOG.md`, creates `v<VERSION>` if missing, calls `gh release create` with extracted notes | the workflow run; `gh release view v<VERSION>` post-release. No pre-deploy validator — validated only at release time. |

No other external system receives a delivered artefact from this repo. Downstream consumers ingest the repo as a git submodule (a consumption pattern, not a delivery contract this repo executes); downstream feature plans that introduce real integration contracts (Prometheus scrape config, systemd unit, K8s CRD, …) get entries filled by `pm-stack-researcher` at that time.

---

## How to extend this document

Only `pm-stack-researcher` edits this file; other agents read it. A coder/reviewer who notices a missing or stale entry surfaces it to the orchestrator, which spawns `pm-stack-researcher`.

Each rule cites a source URL — unsourced claims are guesses dressed as docs and do not belong here. Where a rule is only observable from this repo's behaviour and the upstream docs are silent, it is marked `Source: empirical …` (honest, and flags the item for a future researcher once upstream catches up). A load-bearing idiom carries a `confidence:` tag — `doc-cited (unverified)` until a spike exercises it, then `execution-verified (<harness> <version>, <date>)`; only the orchestrator promotes a rule to `execution-verified` (relaying a confirmed spike), and only a `doc-cited (unverified)` hinge idiom triggers the `/pm-plan` integration-risk spike gate.
