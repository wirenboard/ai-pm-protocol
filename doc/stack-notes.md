# Stack notes

Living document. Initialised at bootstrap, extended on every feature that touches a new external system.
Maintained by `stack-researcher`. Read by `plan-feature`, `architect`, `coder`, `reviewer`.

**Last full review:** 2026-05-30

---

## How this document is used

- **plan-feature** reads it before drafting a plan that touches any listed component. If the feature touches a component that is missing here, plan-feature spawns `stack-researcher` to extend this document **before** continuing.
- **architect** reads it when proposing variants — stack constraints are part of the trade-off space.
- **coder** reads it before writing a mapping, handler, schema, or any integration code for a listed component. On contradiction between task and stack-notes, coder stops and escalates — no fallback to WebSearch.
- **reviewer** checks every diff against the relevant entries. Code that contradicts an idiom or constraint listed here is **blocking** with a citation back to this file.

If this document is missing or empty for a component the feature touches — that is a protocol-level defect, not a content gap. Bootstrap or plan-feature should have caught it.

This document is for **this template repository itself**. The template documents its own stack (a meta-research case) so that the auditor / reviewer can apply dimension 10 of the audit on the template the same way it would apply on a downstream project.

---

## Components

### jq

- **Role in this project:** JSON processor used inside `.claude/settings.json` hook commands to parse the stdin contract supplied by Claude Code's `PreToolUse` event (extracting `tool_input.file_path`, `tool_input.command`, etc.) and to emit `hookSpecificOutput` JSON on stdout.
- **Canonical docs:** <https://jqlang.org/manual/>
- **Spec / reference:** jq 1.8 Manual, [Invoking jq](https://jqlang.org/manual/#invoking-jq), [Alternative operator //](https://jqlang.org/manual/#alternative-operator), [empty filter](https://jqlang.org/manual/#empty).
- **Required validators:**
  - None. jq is a runtime tool used inside hook command strings; the strings themselves are not statically validated by jq. The end-to-end validator is exercising the hook with a representative `tool_input` JSON on stdin (out of scope of this document — see `audit-fixup-hooks-tests`).
- **Idioms and constraints:**
  - A jq program is a "filter": it takes an input, and produces an output. Source: <https://jqlang.org/manual/> (opening section).
  - jq reads stdin by default as "a stream of JSON data … parsed as a sequence of whitespace-separated JSON values which are passed through the provided filter one at a time." Source: <https://jqlang.org/manual/#invoking-jq>.
  - `-r` / `--raw-output`: "if the filter's result is a string then it will be written directly to standard output rather than being formatted as a JSON string with quotes." Source: <https://jqlang.org/manual/#invoking-jq>.
  - The `//` alternative operator: "The `//` operator produces all the values of its left-hand side that are neither `false` nor `null`. If the left-hand side produces no values other than `false` or `null`, then `//` produces all the values of its right-hand side." Source: <https://jqlang.org/manual/#alternative-operator>.
  - `empty` filter: "returns no results. None at all. Not even `null`." Source: <https://jqlang.org/manual/#empty>. The `// empty` idiom is therefore equivalent to "produce nothing when the left side is null or false", which suppresses downstream `[ -z "$VAR" ] && exit 0` guard paths from firing on an explicit `null`.
  - Exit-code contract: "Normally jq exits with 2 if there was any usage problem or system error, 3 if there was a jq program compile error, or 0 if the jq program ran." With `--exit-status` (-e): "0 if the last output value was neither `false` nor `null`, 1 if … `false` or `null`, or 4 if no valid result was ever produced." Source: <https://jqlang.org/manual/#--exit-status-e>.
- **Known gotchas:**
  - `//` treats both `null` AND `false` as "missing on the left". A field whose value is literally `false` falls through to the right-hand default — this is intentional but surprising. A community proposal for a separate `??` nullish-coalescing operator (that triggers only on `null`) was discussed but not adopted. Source: <https://github.com/jqlang/jq/issues/3098>.
  - When stdin is invalid JSON jq does not silently produce empty output. The FAQ recommends `try fromjson catch …` patterns for robust handling rather than relying on default behaviour. Source: <https://github.com/jqlang/jq/wiki/FAQ> ("Handling broken JSON").
- **Last reviewed:** 2026-05-30

---

### gh (GitHub CLI)

- **Role in this project:** Used by `.claude/agents/pr-prep.md` (`gh pr list`, `gh pr create`, `gh pr edit`) and by `.github/workflows/auto-tag.yml` (`gh release view`, `gh release create`) to drive PR/release flow from CI and from agent-issued commands.
- **Canonical docs:** <https://cli.github.com/manual/>
- **Spec / reference:** [gh pr create](https://cli.github.com/manual/gh_pr_create), [gh pr edit](https://cli.github.com/manual/gh_pr_edit), [gh pr list](https://cli.github.com/manual/gh_pr_list), [environment variables](https://cli.github.com/manual/gh_help_environment).
- **Required validators:**
  - None native to gh. Authoring-side check is `gh pr create --dry-run`-style preview not provided by gh; the project uses `gh pr list --state open --head <branch>` as the pre-check (caller-side responsibility, not a validator under gh itself).
- **Idioms and constraints:**
  - Authentication precedence for github.com or ghe.com subdomains: "`GH_TOKEN`, `GITHUB_TOKEN` (in order of precedence): an authentication token that will be used when a command targets either `github.com` or a subdomain of `ghe.com`." Setting these env vars "avoids being prompted to authenticate and takes precedence over previously stored credentials." Source: <https://cli.github.com/manual/gh_help_environment>.
  - `--json <fields>` outputs structured JSON with the named fields; `--jq <expression>` (alias `-q`) filters that JSON with a jq expression — they compose, with `--jq` running on the JSON produced by `--json`. Source: <https://cli.github.com/manual/gh_pr_list> (Options: "Output JSON with the specified fields", "Filter JSON output using a jq expression").
  - `gh pr edit` without an argument: "the pull request that belongs to the current branch is selected." Source: <https://cli.github.com/manual/gh_pr_edit>.
  - `gh pr create` flags `--title`, `--body`, `--base`, `--draft`, `--head`. When the branch is not on the remote: "a prompt will ask where to push the branch and offer an option to fork the base repository." Source: <https://cli.github.com/manual/gh_pr_create>.
  - `gh pr list` default state filter: open; default page size: most recent 30 open items. Source: <https://cli.github.com/manual/gh_pr_list>.
- **Known gotchas:**
  - `gh auth status` exit-code bug: in certain releases it returned 0 even when authentication had failed (fixed in `cli/cli#9240`, merged 2024-07-26; behaviour pre-fix still affects older `gh` releases — downstream code should not depend on the exit code as the sole signal). Source: <https://github.com/cli/cli/issues/8845>, fix: <https://github.com/cli/cli/pull/9240>.
  - `gh auth login --with-token` in CI: reported exits with code 1 even on success when `GH_TOKEN` env var is also set. Source: <https://github.com/cli/cli/issues/7008>.
  - gh is GitHub-specific. The manual contains no documented behaviour for a non-GitHub remote — commands targeting a repo whose remote is not on github.com or a configured GHE host will fail. Source: <https://cli.github.com/manual/gh_help_environment> (only GitHub.com, ghe.com subdomain, and configured GHES are addressed).
- **Last reviewed:** 2026-05-30

---

### git

- **Role in this project:** Branches, commits, PR flow, conventional commit parsing (via `pr-prep`), `git rev-parse --show-toplevel` (the project-root boundary guard in every `.claude/settings.json` hook), `git describe --tags` (release flow), submodule semantics (the template ships as a submodule at `.ai-pm/tooling/` in downstream projects).
- **Canonical docs:** <https://git-scm.com/docs>
- **Spec / reference:** [git-rev-parse](https://git-scm.com/docs/git-rev-parse), [git-push](https://git-scm.com/docs/git-push), [git-describe](https://git-scm.com/docs/git-describe), [git-check-ref-format](https://git-scm.com/docs/git-check-ref-format), [gitsubmodules](https://git-scm.com/docs/gitsubmodules).
- **Required validators:**
  - `git check-ref-format --branch <name>` — validates branch names against the 10 rules in `git-check-ref-format`. Source: <https://git-scm.com/docs/git-check-ref-format>.
- **Idioms and constraints:**
  - `git rev-parse --show-toplevel`: "Show the (by default, absolute) path of the top-level directory of the working tree." Outside a working tree: "If there is no working tree, report an error." Source: <https://git-scm.com/docs/git-rev-parse>. Note: the documented behaviour is "report an error" → non-zero exit; the specific code `128` is the conventional git fatal-error exit but is not labelled with that number in this section of the manual. The hook idiom `ROOT=$(git rev-parse --show-toplevel 2>/dev/null); [ -z "$ROOT" ] && exit 0` relies on the empty-stdout-on-error contract, not a specific exit code.
  - Ref name rules (`git-check-ref-format`): slashes allowed for hierarchical grouping; at least one slash required (without `--allow-onelevel`); no two consecutive dots `..`, no ASCII control characters, no space, no `~`, `^`, `:`, `?`, `*`, `[`, no leading/trailing slash, no trailing `.`, no `@{` sequence, not the single character `@`, no backslash. Source: <https://git-scm.com/docs/git-check-ref-format> (the canonical 10-rule list).
  - `git describe`: "The command finds the most recent tag that is reachable from a commit. If the tag points to the commit, then only the tag is shown. Otherwise, it suffixes the tag name with the number of additional commits on top of the tagged object and the abbreviated object name of the most recent commit." Source: <https://git-scm.com/docs/git-describe>.
  - `git describe --tags`: "Instead of using only the annotated tags, use any tag found in `refs/tags` namespace. This option enables matching a lightweight (non-annotated) tag." Default (without `--tags`/`--all`) considers annotated tags only. Source: <https://git-scm.com/docs/git-describe>.
  - `git push` non-fast-forward: "Git did not try to send the ref at all, typically because it is not a fast-forward and you did not force the update." Source: <https://git-scm.com/docs/git-push> (OUTPUT section, `rejected`).
  - `git push` remote rejection: "Usually caused by a hook on the remote side, or because the remote repository has one of the following safety options in effect: `receive.denyCurrentBranch` (for pushes to the checked out branch), `receive.denyNonFastForwards` (for forced non-fast-forward updates), `receive.denyDeletes` or `receive.denyDeleteCurrent`." Source: <https://git-scm.com/docs/git-push> (OUTPUT section, `remote rejected`).
  - `--force` semantics: "This flag disables that check, the other safety checks in PUSH RULES below, and the checks in `--force-with-lease`. It can cause the remote repository to lose commits; use it with care." Source: <https://git-scm.com/docs/git-push>.
  - `--force-with-lease` semantics: overrides the fast-forward restriction "if the current value of the remote ref is the expected value … `git` `push` fails otherwise." Source: <https://git-scm.com/docs/git-push>.
  - Submodule data model: "A submodule is a repository embedded inside another repository. The submodule has its own history; the repository it is embedded in is called a superproject." A submodule consists of a Git directory under `$GIT_DIR/modules/`, a working directory inside the superproject, a `.git` file at the root of that working directory pointing to the Git directory, a "gitlink" tree entry in the superproject tracking the submodule path, and a `.gitmodules` entry mapping the submodule name and path. Source: <https://git-scm.com/docs/gitsubmodules>.
  - Submodule init/update: "The `init` and `update` subcommands of `git submodule` will maintain submodules checked out and at an appropriate revision in your working tree." By default, `git clone` does not check submodules out — `--recurse-submodules` or a separate `git submodule update --init` is required. Source: <https://git-scm.com/docs/gitsubmodules>.
- **Known gotchas:**
  - Default `git clone` does not check out submodules. Recurring confusion: the parent repo clones cleanly but the submodule path appears as an empty directory. Source: <https://git-scm.com/docs/gitsubmodules>.
  - Submodule configuration precedence (highest to lowest): command-line flags → submodule's `$GIT_DIR/config` → superproject's `$GIT_DIR/config` → `.gitmodules`. Misreading this leads to "I changed `.gitmodules` and nothing happened" reports. Source: <https://git-scm.com/docs/gitsubmodules>.
- **Last reviewed:** 2026-05-30

---

### GitHub Actions

- **Role in this project:** `.github/workflows/auto-tag.yml` runs on every push to `main`, reads the top version from `CHANGELOG.md`, and creates a tag + GitHub Release if it does not already exist.
- **Canonical docs:** <https://docs.github.com/en/actions>
- **Spec / reference:** [Workflow syntax for GitHub Actions](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions), [GITHUB_TOKEN concept page](https://docs.github.com/en/actions/concepts/security/github_token), [Expressions](https://docs.github.com/en/actions/concepts/workflows-and-actions/expressions), [actions/checkout README](https://github.com/actions/checkout).
- **Required validators:**
  - None native. `actionlint` and `yamllint` are community/external tools, not GitHub-provided; the only authoritative validator is the actual workflow run on push. Wiring such a static checker into CI is out of scope for this document — see `audit-fixup-hooks-tests`.
- **Idioms and constraints:**
  - Workflow `name`: "The name of the workflow. GitHub displays the names of your workflows under your repository's 'Actions' tab." Source: <https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions> (section `name`).
  - `on`: "To automatically trigger a workflow, use `on` to define which events can cause the workflow to run." Source: same page (section `on`).
  - `jobs`: "A workflow run is made up of one or more `jobs`, which run in parallel by default." Source: same page (section `jobs`).
  - Workflow-level `permissions`: "You can use `permissions` to modify the default permissions granted to the `GITHUB_TOKEN`, adding or removing access as required." Source: same page (section `permissions`).
  - Per-job `permissions`: "For a specific job, you can use `jobs.<job_id>.permissions` to modify the default permissions granted to the `GITHUB_TOKEN`." Source: same page.
  - `steps[*].run`: "Run commands on the runner as part of a step using the shell of the operating system." Source: same page.
  - `${{ <expression> }}` syntax: "You need to use specific syntax to tell GitHub to evaluate an expression rather than treat it as a string." Source: <https://docs.github.com/en/actions/concepts/workflows-and-actions/expressions>.
  - Implicit wrapping on `if:` keys: "The exception to this rule is when you are using expressions in an `if` clause, where, optionally, you can usually omit `${{` and `}}`." Source: <https://docs.github.com/en/actions/concepts/workflows-and-actions/expressions>. Note: GitHub's own bug tracker has acknowledged this rule is incomplete — expressions containing operators (e.g., `!`, `&&`, `||`) require explicit `${{ }}` wrapping or they fail to parse. Source: <https://github.com/github/docs/issues/3001>. **Treat as: simple reference expressions (e.g., `if: steps.x.outputs.is_release == 'true'`) work bare; anything with negation or a function-with-operators needs explicit `${{ }}`.**
  - Steps output context: "`steps.<step_id>.outputs.<output_name>` evaluates as a string." Source: <https://docs.github.com/en/actions/concepts/workflows-and-actions/expressions>.
  - `GITHUB_TOKEN` creation: "Before each job begins, GitHub fetches an installation access token for the job." The token "is a GitHub App installation access token" and "the token's permissions are limited to the repository that contains your workflow." Source: <https://docs.github.com/en/actions/concepts/security/github_token>.
  - `GITHUB_TOKEN` lifetime: on GitHub-hosted runners, "The maximum job execution time is 6 hours, so the GITHUB_TOKEN can live for a maximum of 6 hours"; on self-hosted runners the installation access token "can only be refreshed for up to 24 hours." Source: <https://docs.github.com/en/actions/concepts/security/github_token>.
  - `actions/checkout@v4`: "This action checks-out your repository under `$GITHUB_WORKSPACE`, so your workflow can access it." `fetch-depth` default is `1`. "Set `fetch-depth: 0` to fetch all history for all branches and tags." `persist-credentials` default is `true`. Source: <https://github.com/actions/checkout> (v4 README).
  - `gh` CLI is preinstalled on `ubuntu-latest` GitHub-hosted runners — calls to `gh release create`/`gh release view` work out of the box when `GH_TOKEN` is set to `secrets.GITHUB_TOKEN`. Source: <https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2204-Readme.md> (the runner image manifest lists `gh` under installed CLI tools).
- **Known gotchas:**
  - `if:` expressions with operators silently fail in surprising ways. The reporter in `github/docs#3001` provides `if: !startsWith(...)` (no `${{ }}`) as the canonical example that produces a syntax error. Source: <https://github.com/github/docs/issues/3001>.
  - `GITHUB_TOKEN` is per-job. Long-running self-hosted jobs that need access for more than 24 hours need a personal access token or GitHub App. Source: <https://docs.github.com/en/actions/concepts/security/github_token>.
  - `actions/checkout@v4` with default `fetch-depth: 1` makes `git describe --tags` (and any tag-based version detection) fail or return wrong results if recent tags are not on the fetched commit. Workflows that read version from tags need `fetch-depth: 0`. Source: <https://github.com/actions/checkout> ("0 indicates all history for all branches and tags. Default: 1").
- **Last reviewed:** 2026-05-30

---

### Claude Code hooks API

- **Role in this project:** `.claude/settings.json` registers `PreToolUse` hooks that gate Read/Edit/Bash operations against the project-root boundary, gate `find` against searching outside the root, gate ssh-driven content edits and ssh-driven mutating actions on remote systems, gate `git push --force`, and gate `git commit --no-verify`. The hook scripts read stdin JSON, parse with jq, and emit `hookSpecificOutput` JSON on stdout to deny / ask / let-through.
- **Canonical docs:** <https://code.claude.com/docs/en/hooks>
- **Spec / reference:** [Claude Code hooks reference](https://code.claude.com/docs/en/hooks), [Settings files](https://code.claude.com/docs/en/settings), [Permission rules](https://code.claude.com/docs/en/permissions).
- **Required validators:**
  - None native. Claude Code does not ship a hook-configuration validator. End-to-end validation is "run a representative `tool_input` JSON through the hook command in a shell and observe stdout" — wiring this as automated tests is the work of `audit-fixup-hooks-tests`.
- **Idioms and constraints:**
  - Hook events on the agentic-loop axis: `PreToolUse` (before a tool call executes — can block it), `PostToolUse` (after success), `PostToolUseFailure` (after failure), `PostToolBatch` (after a batch of parallel calls), `PermissionRequest`, `PermissionDenied`. Source: <https://code.claude.com/docs/en/hooks> (Hook events table).
  - PreToolUse stdin contract includes the common fields (`session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`) plus the tool-specific fields: `tool_name` (string) and `tool_input` (object). Example: `{"tool_name":"Bash","tool_input":{"command":"npm test"}}`. Source: <https://code.claude.com/docs/en/hooks>.
  - `hookSpecificOutput` for `PreToolUse` carries `hookEventName: "PreToolUse"`, `permissionDecision` (enum), `permissionDecisionReason` (string shown to the user). Source: <https://code.claude.com/docs/en/hooks>.
  - `permissionDecision` enum values: `"allow"` (let the call proceed), `"ask"` (escalate to user), `"deny"` (block), `"defer"` (no decision; normal permission flow applies). Source: <https://code.claude.com/docs/en/hooks>.
  - `matcher` field on a hook entry filters by tool name. Values: `"*"`, `""`, or omitted means "match all"; only letters/digits/`_`/`|` is interpreted as an exact name or `|`-separated list of exact names (e.g., `Bash`, `Edit|Write`); anything else is a JavaScript regular expression (e.g., `^Notebook`, `mcp__memory__.*`). Source: <https://code.claude.com/docs/en/hooks> (Matcher value table).
  - `if:` field on a hook entry adds a second filter using permission-rule syntax: "such as `Bash(git *)` or `Edit(*.ts)`. The hook only spawns if the tool call matches the pattern, or if a Bash command is too complex to parse. Only evaluated on tool events: `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, and `PermissionDenied`. On other events, a hook with `if` set never runs." Source: <https://code.claude.com/docs/en/hooks>.
  - Bash `if:` matching against subcommands: "For Bash, the rule is matched against each subcommand of the tool input after leading `VAR=value` assignments are stripped, so `if: \"Bash(git push *)\"` matches both `FOO=bar git push` and `npm test && git push`. The hook runs if any subcommand matches, and always runs when the command is too complex to parse." Source: <https://code.claude.com/docs/en/hooks>.
  - Permission rule wildcards for Bash: `*` can appear at any position. The space before `*` matters: `Bash(ls *)` matches `ls -la` but not `lsof`; `Bash(ls*)` matches both. `Bash(ls:*)` is equivalent to `Bash(ls *)`. Source: <https://code.claude.com/docs/en/permissions>.
  - Compound commands are split at recognised separators (`&&`, `||`, `;`, `|`, `|&`, `&`, newlines) and each subcommand is matched independently against rules. Source: <https://code.claude.com/docs/en/permissions> ("Compound commands").
  - `settings.json` locations: `~/.claude/settings.json` (user), `.claude/settings.json` (project — checked into source control and shared with the team), `.claude/settings.local.json` (project-local — NOT checked in; Claude Code configures git to ignore it on creation). Source: <https://code.claude.com/docs/en/settings>.
  - To produce "no decision" from a hook, exit 0 with no output — "normal permission flow applies." Source: <https://code.claude.com/docs/en/hooks> (the `rm -rf` example script: `else exit 0 # no decision; normal permission flow applies`).
- **Known gotchas:**
  - Source: empirical (this repo's settings.json contract, no upstream doc explicitly states this) — the `permissionDecisionReason` string is shown to the user verbatim and may include the offending path / command captured in shell variables. Quoting JSON inside Bash inside JSON inside `settings.json` is fragile; the project's existing hooks use the form `echo "{\"hookSpecificOutput\":...}"` with escaped inner quotes. Whether `jq -n '{hookSpecificOutput:{...}}'` is preferred over hand-built JSON strings is **not stated in the upstream docs**; the upstream example in the hooks reference uses `jq -n` (canonical example: `jq -n '{hookSpecificOutput: {...}}'`). Source: <https://code.claude.com/docs/en/hooks> (example block in the `rm -rf` walkthrough).
  - A `matcher` value that contains any character outside `[a-zA-Z0-9_|]` is parsed as a JavaScript regex, not a literal — a value like `Bash *` would be interpreted as a regex, not as "Bash followed by space-star". Source: <https://code.claude.com/docs/en/hooks> (Matcher value table — "Contains any other character → JavaScript regular expression").
  - `if:` is only evaluated on the five named tool events. Setting `if:` on a hook attached to `SessionStart`, `UserPromptSubmit`, `Stop`, etc. results in the hook never running. Source: <https://code.claude.com/docs/en/hooks> ("On other events, a hook with `if` set never runs").
- **Last reviewed:** 2026-05-30

---

### Markdown frontmatter (YAML in Claude Code agent files)

- **Role in this project:** Every file under `.claude/agents/*.md` (the seven agent personas: `architect`, `auditor`, `coder`, `docs-extractor`, `pr-prep`, `reviewer`, `stack-researcher`) opens with YAML frontmatter declaring `name`, `description`, `model`. Claude Code reads the frontmatter to register each subagent.
- **Canonical docs:** <https://code.claude.com/docs/en/sub-agents>
- **Spec / reference:** [Create custom subagents — Write subagent files](https://code.claude.com/docs/en/sub-agents#write-subagent-files), [Supported frontmatter fields](https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields), [YAML 1.2.2 specification §2.2 Structures](https://yaml.org/spec/1.2.2/#22-structures).
- **Required validators:**
  - None native. There is no `claude validate-agent` command. Loose validation is `/agents` opening the file and reporting parse failure; otherwise loading is silent.
- **Idioms and constraints:**
  - File format: "Subagent files use YAML frontmatter for configuration, followed by the system prompt in Markdown." Source: <https://code.claude.com/docs/en/sub-agents>.
  - `---` document delimiter: "YAML uses three dashes (`---`) to separate directives from document content. This also serves to signal the start of a document if no directives are present." Source: <https://yaml.org/spec/1.2.2/#22-structures>. In the frontmatter idiom the opening `---` and closing `---` bracket the YAML document; everything after the closing `---` is treated as the Markdown body / system prompt.
  - Required fields: only `name` and `description`. Source: <https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields> ("Only `name` and `description` are required.").
  - `name`: "Unique identifier using lowercase letters and hyphens. [Hooks](/en/hooks#subagentstart) receive this value as `agent_type`. The filename does not have to match." Source: <https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields>.
  - `description`: "When Claude should delegate to this subagent." Used by the orchestrator: "Claude uses each subagent's description to decide when to delegate tasks. When you create a subagent, write a clear description so Claude knows when to use it." Source: <https://code.claude.com/docs/en/sub-agents>.
  - `model` accepted values: `sonnet`, `opus`, `haiku`, a full model ID (for example `claude-opus-4-8`), or `inherit`. Defaults to `inherit`. Source: <https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields>.
  - Model resolution order at invocation: (1) `CLAUDE_CODE_SUBAGENT_MODEL` env var, (2) per-invocation `model` parameter, (3) the subagent definition's `model` frontmatter, (4) the main conversation's model. Source: <https://code.claude.com/docs/en/sub-agents> ("Choose a model" section).
  - Identity comes from the `name` field, not the filename. "If two files within one scope declare the same name, Claude Code keeps one and discards the other without warning." Source: <https://code.claude.com/docs/en/sub-agents> ("Choose the subagent scope").
  - Agent files are loaded at session start: "Subagents are loaded at session start. If you add or edit a subagent file directly on disk, restart your session to load it. Subagents created through the `/agents` interface take effect immediately without a restart." Source: <https://code.claude.com/docs/en/sub-agents>.
- **Known gotchas:**
  - Silent collision on duplicate `name`: "Claude Code keeps one and discards the other without warning." A typo in `name` that collides with a built-in (`Explore`, `Plan`, `general-purpose`) can silently replace or be replaced. Source: <https://code.claude.com/docs/en/sub-agents>.
  - The Markdown body becomes the system prompt verbatim — "Subagents receive only this system prompt (plus basic environment details like working directory), not the full Claude Code system prompt." Anything you write outside the frontmatter is part of the subagent's instructions, including stray comments. Source: <https://code.claude.com/docs/en/sub-agents>.
  - Plugin subagents silently ignore `hooks`, `mcpServers`, and `permissionMode` fields: "For security reasons, plugin subagents do not support the `hooks`, `mcpServers`, or `permissionMode` frontmatter fields. These fields are ignored when loading agents from a plugin." Source: <https://code.claude.com/docs/en/sub-agents>.
- **Last reviewed:** 2026-05-30

---

### Claude Code context-loading model

- **Role in this project:** Load-bearing for the feature that restructures the protocol's `WORKFLOW.md` from an eager, `@`-imported monolith into a thin always-loaded core plus on-demand topic files. The correctness of any such split depends entirely on these platform facts — what enters the context window at session start, what loads lazily, and what reaches subagents. Read by `plan-feature` and `architect` before designing any "split a big instruction file" change, and by `reviewer` to block a design that assumes `@`-splitting reduces context (it does not) or that a subagent inherits skills/history it does not.
- **Canonical docs:** <https://code.claude.com/docs/en/memory>, <https://code.claude.com/docs/en/skills>, <https://code.claude.com/docs/en/sub-agents>
- **Spec / reference:** [How Claude remembers your project (memory)](https://code.claude.com/docs/en/memory), [Import additional files](https://code.claude.com/docs/en/memory#import-additional-files), [Organize rules with `.claude/rules/`](https://code.claude.com/docs/en/memory#organize-rules-with-claude/rules/), [Extend Claude with skills](https://code.claude.com/docs/en/skills), [Skill content lifecycle](https://code.claude.com/docs/en/skills#skill-content-lifecycle), [Create custom subagents — What loads at startup](https://code.claude.com/docs/en/sub-agents#what-loads-at-startup).
- **Required validators:**
  - None native. This is a knowledge component, not a tool — there is no `claude` subcommand that statically proves a context-loading design is correct. The closest observability hook is the `InstructionsLoaded` hook: "Use the `InstructionsLoaded` hook to log exactly which instruction files are loaded, when they load, and why. This is useful for debugging path-specific rules or lazy-loaded files in subdirectories." Source: <https://code.claude.com/docs/en/memory> (Troubleshoot tip). The `/memory` command lists every CLAUDE.md, CLAUDE.local.md, and rules file loaded in the current session — the manual verification surface. Source: <https://code.claude.com/docs/en/memory> ("View and edit with `/memory`").
- **Idioms and constraints:**
  - **CLAUDE.md size guidance.** "Size: target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence." Source: <https://code.claude.com/docs/en/memory> ("Write effective instructions"). CLAUDE.md is loaded in full regardless of length: "This limit applies only to `MEMORY.md`. CLAUDE.md files are loaded in full regardless of length, though shorter files produce better adherence." Source: <https://code.claude.com/docs/en/memory> ("How it works"). The 200-line / 25KB hard cap is an **auto-memory** limit, not a CLAUDE.md limit: "The first 200 lines of `MEMORY.md`, or the first 25KB, whichever comes first, are loaded at the start of every conversation. Content beyond that threshold is not loaded at session start." Source: <https://code.claude.com/docs/en/memory> ("How it works"). The 200-line CLAUDE.md figure is therefore **guidance** (degrades adherence past it), not a truncation limit.
  - **CLAUDE.md is delivered as context, not enforced config.** "Both are loaded at the start of every conversation. Claude treats them as context, not enforced configuration. To block an action regardless of what Claude decides, use a PreToolUse hook instead." Source: <https://code.claude.com/docs/en/memory> ("CLAUDE.md vs auto memory"). And: "CLAUDE.md content is delivered as a user message after the system prompt, not as part of the system prompt itself." Source: <https://code.claude.com/docs/en/memory> ("Claude isn't following my CLAUDE.md").
  - **`@`-import is EAGER, not lazy.** "CLAUDE.md files can import additional files using `@path/to/import` syntax. Imported files are expanded and loaded into context at launch alongside the CLAUDE.md that references them." Source: <https://code.claude.com/docs/en/memory> ("Import additional files"). Splitting via `@` does NOT reduce context: "You can also split content into imports for organization, though imported files still load and enter the context window at launch." Source: <https://code.claude.com/docs/en/memory> ("Write effective instructions"). Reinforced in troubleshooting: "Splitting into `@path` imports helps organization but does not reduce context, since imported files load at launch." Source: <https://code.claude.com/docs/en/memory> ("My CLAUDE.md is too large").
  - **`@`-import depth and path resolution.** "Both relative and absolute paths are allowed. Relative paths resolve relative to the file containing the import, not the working directory. Imported files can recursively import other files, with a maximum depth of four hops." Source: <https://code.claude.com/docs/en/memory> ("Import additional files").
  - **CLAUDE.md directory-tree load semantics.** "CLAUDE.md and CLAUDE.local.md files in the directory hierarchy above the working directory are loaded in full at launch. Files in subdirectories load on demand when Claude reads files in those directories." Source: <https://code.claude.com/docs/en/memory> ("Choose where to put CLAUDE.md files"). So the only built-in lazy mechanisms in the memory system are (a) CLAUDE.md files in subdirectories below the working directory, (b) path-scoped rules, and (c) skills — NOT `@`-imports.
  - **Skills progressive disclosure.** Only the description (metadata) sits in context at start; the body loads on invocation. The lifecycle table states for a default skill: "Description always in context, full skill loads when invoked." Source: <https://code.claude.com/docs/en/skills> ("Control who invokes a skill" table). And: "In a regular session, skill descriptions are loaded into context so Claude knows what's available, but full skill content only loads when invoked." Source: <https://code.claude.com/docs/en/skills>. The combined `description` + `when_to_use` listing text "is truncated at 1,536 characters in the skill listing to reduce context usage." Source: <https://code.claude.com/docs/en/skills> ("Frontmatter reference"). Note: the official docs quantify the per-skill startup cost as the truncated-at-1,536-character listing entry, **not** a "~60 tokens" figure — see Known gotchas for the unsupported-claim flag.
  - **Skill body loads only when used.** "Unlike CLAUDE.md content, a skill's body loads only when it's used, so long reference material costs almost nothing until you need it." Source: <https://code.claude.com/docs/en/skills> (intro). Once loaded it persists: "When you or Claude invoke a skill, the rendered `SKILL.md` content enters the conversation as a single message and stays there for the rest of the session." Source: <https://code.claude.com/docs/en/skills> ("Skill content lifecycle").
  - **Skill reference / supporting files load on demand.** "Other files are optional … Reference these files from your `SKILL.md` so Claude knows what they contain and when to load them." Source: <https://code.claude.com/docs/en/skills>. And: "Reference supporting files from `SKILL.md` so Claude knows what each file contains and when to load it." Source: <https://code.claude.com/docs/en/skills> ("Add supporting files"). The on-demand load mechanism is Claude's standard file tools (the same mechanism by which `MEMORY.md` topic files load: "Claude reads them on demand using its standard file tools when it needs the information." Source: <https://code.claude.com/docs/en/memory>).
  - **`disable-model-invocation` keeps the description out of context.** "Set to `true` to prevent Claude from automatically loading this skill. Use for workflows you want to trigger manually with `/name`. Also prevents the skill from being preloaded into subagents. Default: `false`." Source: <https://code.claude.com/docs/en/skills> ("Frontmatter reference"). The lifecycle table makes the context effect explicit: for `disable-model-invocation: true`, "Description not in context, full skill loads when you invoke." Source: <https://code.claude.com/docs/en/skills> ("Control who invokes a skill" table).
  - **Skills are the official pattern for large instruction sets / a CLAUDE.md section that grew into a procedure.** "Create a skill when you keep pasting the same instructions, checklist, or multi-step procedure into chat, or when a section of CLAUDE.md has grown into a procedure rather than a fact." Source: <https://code.claude.com/docs/en/skills> (intro). The memory page makes the same call: "If an entry is a multi-step procedure or only matters for one part of the codebase, move it to a skill or a path-scoped rule instead." Source: <https://code.claude.com/docs/en/memory> ("When to add to CLAUDE.md").
  - **Path-scoped rules load only when matching files are touched.** "Rules can be scoped to specific files using YAML frontmatter with the `paths` field. These conditional rules only apply when Claude is working with files matching the specified patterns." Source: <https://code.claude.com/docs/en/memory> ("Path-specific rules"). And: "Path-scoped rules trigger when Claude reads files matching the pattern, not on every tool use." Source: same. Rules without `paths` load at launch: "Rules without `paths` frontmatter are loaded at launch with the same priority as `.claude/CLAUDE.md`." / "Rules without a `paths` field are loaded unconditionally and apply to all files." Source: <https://code.claude.com/docs/en/memory> ("Organize rules" / "Path-specific rules"). The `paths` field uses glob patterns (e.g. `src/api/**/*.ts`, `**/*.{ts,tsx}`). Source: same.
  - **Subagents get a fresh, isolated context window.** "Each subagent runs in its own context window with a custom system prompt, specific tool access, and independent permissions." Source: <https://code.claude.com/docs/en/sub-agents> (intro). And: "Each subagent starts with a fresh, isolated context window. It does not see your conversation history, the skills you've already invoked, or the files Claude has already read." Source: <https://code.claude.com/docs/en/sub-agents> ("What loads at startup").
  - **Subagents DO load the project CLAUDE.md — except Explore and Plan.** "CLAUDE.md and memory: every level of the memory hierarchy the main conversation loads, including `~/.claude/CLAUDE.md`, project rules, `CLAUDE.local.md`, and managed policy files. The built-in Explore and Plan agents skip this." Source: <https://code.claude.com/docs/en/sub-agents> ("What loads at startup"). And: "Explore and Plan skip your CLAUDE.md files and the parent session's git status to keep research fast and inexpensive. Every other built-in and custom subagent loads both." Source: <https://code.claude.com/docs/en/sub-agents> ("Built-in subagents"). This behaviour is not configurable: "Explore and Plan are the only subagents that omit CLAUDE.md and git status. There is no frontmatter field or per-agent setting to change which agents skip them." Source: same. Note the system-prompt nuance: a subagent's own system prompt replaces the default Claude Code system prompt, but "`CLAUDE.md` files and project memory still load through the normal message flow." Source: <https://code.claude.com/docs/en/sub-agents> ("Change the active subagent").
  - **Subagents do NOT auto-inherit skills — skills must be declared to be preloaded.** The `skills` frontmatter field lists "Skills to preload into the subagent's context at startup. The full skill content is injected, not just the description. Subagents can still invoke unlisted project, user, and plugin skills through the Skill tool." Source: <https://code.claude.com/docs/en/sub-agents> ("Supported frontmatter fields"). So a subagent does not start with any parent-invoked skill content in context unless it is named in `skills:`; it can only discover others via the Skill tool. "The full content of each listed skill is injected into the subagent's context at startup. This field controls which skills are preloaded, not which skills the subagent can access." Source: <https://code.claude.com/docs/en/sub-agents> ("Preload skills into subagents"). Preloaded-skill content "in subagents work differently: the full skill content is injected at startup" — i.e. a subagent loses the description-only progressive-disclosure economy for any skill it preloads. Source: <https://code.claude.com/docs/en/skills>.
  - **Subagents do NOT inherit parent conversation history (except a fork).** "It does not see your conversation history, the skills you've already invoked, or the files Claude has already read. Claude composes a delegation message that summarizes the task, and the subagent works from there. The exception is a fork, which inherits the parent conversation instead of starting fresh." Source: <https://code.claude.com/docs/en/sub-agents> ("What loads at startup"). A fork is the explicit opt-in to inheritance: "A fork is a subagent that inherits the entire conversation so far instead of starting fresh." Source: <https://code.claude.com/docs/en/sub-agents> ("Fork the current conversation").
- **Known gotchas:**
  - **An `@`-imported spec cannot be made lazy by `@`-splitting alone — load-on-demand requires the Read tool against non-imported files.** `@`-imports are eager (expanded into context at launch, all four hops), so breaking a monolith into `@a.md @b.md @c.md` reduces nothing — every byte still enters the window at session start. The only built-in lazy surfaces are: a Skill body (loads on invocation), a path-scoped `.claude/rules/*.md` file (loads when a matching file is touched), a subdirectory CLAUDE.md (loads when Claude reads a file there), and any non-imported file Claude pulls in on demand via the Read tool. A thin always-loaded core that *points at* topic files (not `@`-imports them) is the documented way to defer cost. Sources: <https://code.claude.com/docs/en/memory> ("Import additional files", "My CLAUDE.md is too large"), <https://code.claude.com/docs/en/skills> (intro, "Skill content lifecycle"), <https://code.claude.com/docs/en/memory> ("Path-specific rules").
  - **`@`-imports survive across the whole tree but path resolution is import-file-relative, not cwd-relative.** A relative `@docs/x.md` in a CLAUDE.md resolves against that CLAUDE.md's directory, not the launch directory — moving the CLAUDE.md without moving the target silently breaks the import. Source: <https://code.claude.com/docs/en/memory> ("Import additional files").
  - **A skill body, once invoked, is a recurring per-turn token cost.** "Once a skill loads, its content stays in context across turns, so every line is a recurring token cost." Source: <https://code.claude.com/docs/en/skills> ("Write the skill"). So progressive disclosure saves context only until the skill is invoked; a skill invoked early in a long session is no cheaper than CLAUDE.md content for the rest of that session. After `/compact`, re-attached skills keep only the first 5,000 tokens each, sharing a 25,000-token budget — older invoked skills can be dropped entirely. Source: <https://code.claude.com/docs/en/skills> ("Skill content lifecycle").
  - **The "~60 tokens per skill at startup" figure is NOT in the official docs.** What the docs DO state: only the `description` (+ `when_to_use`) is in context at start, and that listing text is "truncated at 1,536 characters in the skill listing to reduce context usage." Source: <https://code.claude.com/docs/en/skills> ("Frontmatter reference"). Any specific small-token-count claim ("~60 tokens") for the per-skill startup footprint is **unsupported by the canonical docs** — do not cite it as a platform guarantee; cite the 1,536-character listing cap instead.
  - **Project-root CLAUDE.md survives `/compact`; nested CLAUDE.md and one-off conversation instructions may not.** "Project-root CLAUDE.md survives compaction: after `/compact`, Claude re-reads it from disk and re-injects it into the session. Nested CLAUDE.md files in subdirectories are not re-injected automatically; they reload the next time Claude reads a file in that subdirectory." Source: <https://code.claude.com/docs/en/memory> ("Instructions seem lost after `/compact`"). A topic-file design that relies on a subdirectory CLAUDE.md is therefore weaker across compaction than one based on the project-root CLAUDE.md plus skills/rules.
  - **Block-level HTML comments in CLAUDE.md are stripped before injection** (so they cost no context) — but comments inside code blocks are preserved, and a maintainer note placed inside a fenced block still consumes context. Source: <https://code.claude.com/docs/en/memory> ("How CLAUDE.md files load").
- **Last reviewed:** 2026-06-05

---

### Semgrep

- **Role in this project:** Pipeline pre-check in Step 5 Pass-2 (before AI `code-review`). The orchestrator runs community Semgrep rulesets over the files touched by a change to surface deterministic mechanical issues cheaply before the AI review runs. Findings are appended to `.ai-pm/reviews/<topic>_review.md` so `pm-coder` receives all findings in one artifact. This component supersedes the former local idioms library (`doc/_templates/stack-idioms/python.md`).
- **Canonical docs:** <https://docs.semgrep.dev/getting-started/>
- **Community invocation:** `semgrep --config p/<lang> --json <files>` — downloads and runs the named ruleset from the Semgrep registry at runtime. Requires Semgrep installed (`pip install semgrep` or `brew install semgrep`) and internet access.
- **Language-to-config mapping:**
  - Python → `p/python`
  - JavaScript → `p/javascript`
  - TypeScript → `p/typescript`
  - Go → `p/go`
  - Java → `p/java`
- **Exit-code contract:** 0 = success (findings or none); non-zero = error. Silent-fallback rule: any non-zero exit, missing binary, config download failure, or no known community config for the detected language → skip, proceed to AI review. Source: <https://docs.semgrep.dev/getting-started/>.
- **JSON output:** findings in the `results` array of the JSON stdout. Each finding entry carries `check_id`, `path`, `start`/`end` (line/col), and `extra.message`. Source: <https://docs.semgrep.dev/getting-started/>.
- **Known constraint:** requires internet at review time (community rules are downloaded at runtime from the Semgrep registry — `p/<lang>` is not bundled). Not a blocking dependency: the silent-fallback rule ensures the pipeline degrades gracefully when Semgrep is unavailable or the network is down.
- **Last reviewed:** 2026-06-05

---

## Validators wired into pipeline

This template has no traditional build/test pipeline — it ships as a documentation-and-config repo consumed via git submodule. The only continuous-validation surface is the GitHub Actions release workflow.

| Validator | Command | Gates |
|---|---|---|
| (none — see note) | | The template does not currently wire any native stack validator into CI. Candidate validators (`actionlint` for the workflow YAML, `git check-ref-format` for branch-name policy on the PR side, scripted hook-script unit tests) are tracked under `audit-fixup-hooks-tests` (out of scope of this document). |

For downstream projects that use this template, this table is where `stack-researcher` lists the validators each project's stack documents as mandatory (e.g., `tsc --noEmit`, `cargo check`, `helm lint`, `kubectl apply --dry-run=server`). Bootstrap copies those into the project's `CLAUDE.md` Pipeline block.

---

## Integration contracts

For each external system the project integrates with — what local artifact carries the contract, how it gets delivered, and which tool validates the contract end-to-end.

| External system | Local artifact in repo | Delivery mechanism | Validator |
|---|---|---|---|
| GitHub Releases | `CHANGELOG.md` (top entry) + the implicit tag derived from it | Pushed by `.github/workflows/auto-tag.yml`: reads `CHANGELOG.md`, creates `v<VERSION>` tag if missing, calls `gh release create` with the extracted notes | The workflow run itself; `gh release view v<VERSION>` succeeds post-release. No pre-deploy validator — the contract is only validated at release time. |

No other external system receives a delivered artefact from this repo. The template's downstream consumers ingest the repo as a git submodule (`git submodule add <url> .ai-pm/tooling/`), but that is a consumption pattern, not a delivery contract this repo executes. Downstream projects whose feature plans introduce real integration contracts (Prometheus scrape config, systemd unit, K8s CRD, etc.) will see entries here filled by `stack-researcher` at that time.

---

## How to extend this document

Only `stack-researcher` edits this file. Other agents read it. If a coder or reviewer notices a missing rule or stale entry, they surface it to the orchestrator — orchestrator spawns `stack-researcher` to update.

Each rule must cite a source URL. Unsourced claims do not belong here — they are guesses dressed as docs.

For Claude Code hooks API specifically: where a rule is documented at <https://code.claude.com/docs/en/hooks> the source URL points there. Where a rule is only observable from `.claude/settings.json` behaviour in this repo and the upstream docs are silent, the rule is explicitly marked `Source: empirical (this repo's settings.json contract, no upstream doc)` — this is honest and flags an item for a future researcher to upgrade once the upstream docs catch up.
