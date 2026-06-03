# Architecture

This document describes the architecture of the **ai-pm-protocol template repository itself** — not a downstream project that consumes the template. It is a meta-case: the template documents itself in the same shape (`doc/_templates/architecture.md.tmpl`) it expects downstream projects to use. Sections that do not apply to a documentation-and-config repo are kept as headers and marked `N/A — <one-line reason>` so a downstream reader can see the template walked its own structure honestly.

**Last full review:** 2026-05-30

---

## Project

A template for product managers building their product solo or with AI assistance. The PM describes what they want; a fixed set of Markdown-defined agents (`architect`, `coder`, `reviewer`, `pr-prep`, `docs-extractor`, `stack-researcher`, `auditor`) plan, implement, and verify changes against the PM's plan, the downstream project's `docs/architecture.md` constraints, and `docs/stack-notes.md` stack literacy. The PM makes product decisions and does not read code. Marketing-level claims and the natural-language workflow walkthrough live in `README.md` — this document does not duplicate them; it describes the underlying structure.

---

## Tech stack

The template's stack is the small set of CLI tools, file formats, and APIs that the agents, commands, hooks, and release workflow rely on. Each component has a full entry in `doc/stack-notes.md` (role, canonical docs, idioms, gotchas, last-reviewed date); this table is a directory, not a duplicate.

| Component | Role in the template | Reference |
|---|---|---|
| Markdown frontmatter (YAML 1.2.2) | Persona declaration on every `.claude/agents/*.md` (`name`, `description`, `model`). Read by Claude Code at session start to register each subagent. | `doc/stack-notes.md` § "Markdown frontmatter (YAML in Claude Code agent files)" |
| Claude Code hooks API | `.claude/settings.json` registers `PreToolUse` hooks that gate Read / Bash boundary violations, ssh-driven content edits, ssh-driven mutating actions, `git push --force`, `git commit --no-verify`. | `doc/stack-notes.md` § "Claude Code hooks API" |
| jq | JSON processor used inside hook command strings to parse the `PreToolUse` stdin contract and emit `hookSpecificOutput` JSON on stdout. | `doc/stack-notes.md` § "jq" |
| git | Branch / commit conventions, `git rev-parse --show-toplevel` (project-root boundary in every hook), submodule semantics (the template ships as `.ai-pm/tooling/` submodule in downstream). | `doc/stack-notes.md` § "git" |
| gh (GitHub CLI) | Used by `.claude/agents/pr-prep.md` (PR open / edit) and by `.github/workflows/auto-tag.yml` (`gh release view`, `gh release create`). | `doc/stack-notes.md` § "gh (GitHub CLI)" |
| GitHub Actions | `.github/workflows/auto-tag.yml` runs on every push to `main`, reads the top version from `CHANGELOG.md`, creates the tag and GitHub Release if missing. | `doc/stack-notes.md` § "GitHub Actions" |

Components not in the list (Conventional Commits, SemVer, Keep a Changelog) are conventions used by `CHANGELOG.md` and `pr-prep`, not external systems whose idioms or validators the template integrates with — they are intentionally out of scope of stack-notes (see `doc/features/audit-fixup-self-stack-notes_plan.md` scope decision). They are not listed here either, to keep this directory consistent with stack-notes.

---

## Architectural decisions

Each subsection records a decision the template made, with one-line rationale and the document / PR / commit where the decision was actually taken. No "we just did it" claims.

### Agents are plain Markdown files, not compiled artefacts

Persona files at `.claude/agents/*.md` are Markdown documents with YAML frontmatter. There is no compiled runtime, no plugin manifest, no build step — Claude Code loads them at session start by reading the directory. **Source:** `doc/features/template-v2_plan.md` ("Template repo structure" + "What's removed vs current protocol", v2 full rewrite, commit `eba8ab5 feat: template v2 — full rewrite`).

### Commands are Markdown procedures

Slash commands at `.claude/commands/*.md` (`bootstrap`, `plan-feature`, `audit`, `research`, `fixup`) are Markdown procedure documents — the same loading mechanism as agents. They are developer-operator shortcuts, not the PM interface. **Source:** `doc/features/template-v2_plan.md` ("Key design decisions" section: "Slash commands are developer shortcuts, not PM interface").

### WORKFLOW.md imported into downstream `CLAUDE.md` via `@.ai-pm/tooling/WORKFLOW.md`

The orchestration rules (agent roster, edit-ownership rule, remote-system boundary, git workflow, PM communication style) live in `WORKFLOW.md` at the template root. Downstream projects import it from their own `CLAUDE.md` via the `@.ai-pm/tooling/WORKFLOW.md` import directive, so an update to the template's WORKFLOW.md reaches every downstream project at the next `git submodule update --remote`. **Source:** `README.md` § "Структура downstream-проекта" — "`CLAUDE.md` … (автоматически импортирует `.ai-pm/tooling/WORKFLOW.md`)"; original split decision in commit `dec55b4 feat: split CLAUDE.md into static project part + dynamic WORKFLOW.md`.

### Settings.json delivered via symlink, not copy

Downstream installation creates `.claude/settings.json` as a symlink to `../.ai-pm/tooling/.claude/settings.json`, not a copy. A `git submodule update --remote` therefore picks up new hooks immediately without a per-project re-install. **Source:** `README.md` § "Установка" — the `ln -s ../.ai-pm/tooling/.claude/settings.json .claude/settings.json` line, added in commit `2626106 docs: add settings.json symlink to install instructions (#141)`.

### Hooks layer for cross-session enforcement of WORKFLOW rules

`WORKFLOW.md` documents the remote-edit boundary and the force-push / no-verify gates as prose rules. The same rules are also wired as Claude Code `PreToolUse` hooks in `.claude/settings.json`, so they hold even when a future session does not re-read WORKFLOW.md. The hooks gate Read/Bash path boundaries, `find` outside root, ssh + content edit, ssh + mutating action, `git push --force / -f / --force-with-lease`, `git commit --no-verify / --no-gpg-sign`. **Source:** PR #145, commit `ac5827a feat(hooks): enforce remote-edit boundary + force-push + no-verify gates`. Cross-referenced in `WORKFLOW.md` § "Hook-level enforcement".

### Auditor / stack-researcher / docs-extractor as read-only subagents

Read-only project-wide work (audit sweep, stack research, legacy codebase extraction) runs in subagents with explicit read-only constraints, not in the main session. This keeps the main orchestrator focused on PM conversation while large reads happen in isolation. **Source for auditor:** PR #143, commit `cf889c6 feat(audit): make /audit spawn auditor subagent instead of reading in main`. **Source for docs-extractor:** commit `f767531 Extract docs-extractor subagent for modular codebase reading`. **Source for stack-researcher:** PR #142, commit `6e1bf14 Protocol integrity + stack literacy: close 5 structural gaps`.

### Edit-ownership split: content artefacts vs orchestration artefacts

The orchestrator does not edit content artefacts (source code, schemas, manifests, `docs/architecture.md`, `docs/user-journeys.md`, `docs/stack-notes.md`, plan / arch / review files under `docs/features/`) directly — it respawns the responsible agent. Orchestration artefacts (`docs/backlog.md` entries, PM decision logs, git operations, deployment script invocations) are normal orchestrator work. The line: design / canon → agent writes it; PM conversation log / pipeline movement → orchestrator writes it. **Source:** PR #144, commit `9f81f64 Post-cycle lessons: notes split, edit ownership, pr-prep flexibility`; rule text in `WORKFLOW.md` § "Edit-ownership rule".

### Categorical scope check at plan-feature stage

Every feature plan that mentions a categorical concept (type, mode, role, state, operation, category) must explicitly choose: take the whole set or one element. If one element — siblings are listed in "Out of scope" with one-line reason each. Coder cannot extend semantics of the chosen element to cover a sibling case; reviewer blocks. This catches scope drift before code. **Source:** PR #142, commit `6e1bf14 Protocol integrity + stack literacy: close 5 structural gaps`; rule text in `README.md` § "Что гарантирует шаблон" — "Scope без тихой деформации"; full plan in `doc/features/protocol-integrity-and-stack-literacy_plan.md`.

### Release flow: CHANGELOG entry → auto-tag → tag + GitHub Release

`.github/workflows/auto-tag.yml` runs on every push to `main`, reads the top `## [<VERSION>]` entry from `CHANGELOG.md`, creates the matching `v<VERSION>` tag if missing, extracts the section as release notes, and calls `gh release create`. No release branch, no manual tagging, no confirmation gates. **Source:** `.github/workflows/auto-tag.yml` (current shape); decision sequence: `3f1ef5b Streamline release workflow: auto-tag + no confirmation gates`, `e14b720 fix: auto-tag reads CHANGELOG instead of commit message`, `ad3d30f fix: merge auto-tag and create-github-release into one workflow`, `c240181 fix: release workflow checks GitHub Release, not tag`.

### Execution State as the single source of progress

One file — `.ai-pm/state/current.md` (per downstream project) — holds the active task's Status / Done / Remaining / Touched files / Next step / Validation. Every coder run reads it first and writes it last. plan-feature initializes it. Completed tasks are archived to `.ai-pm/state/archive/`. The intent is that any future session — same model, different model, same agent, different agent — can resume from this file alone, without scrolling chat history. **Source:** `doc/features/integrate-consultancy_plan.md` § "Scenarios"; `doc/_templates/state.md.tmpl`.

### Product Contracts as the product-side complement to stack-notes

Stack-notes describes technical idioms cited from upstream docs. Product Contracts describe user-visible behavior in the project's own words: User value / Who uses it / Must work / Must not break / Acceptance checks / Out of scope. One contract per user-facing feature, in `.ai-pm/contracts/<feature>.md`. Coder reads before implementing; reviewer verifies the diff against the contract (dimension 1, Plan & Contract compliance); auditor flags missing or stale contracts. Backend-only changes (refactor, infra) skip contract checks explicitly. **Source:** `doc/features/integrate-consultancy_plan.md` § "Key design decisions"; `doc/_templates/contract.md.tmpl`.

### Definition of Done as an explicit reviewer subsection

Reviewer verdict now contains a "Definition of Done" subsection with 7 hard checks: scope respected; stack expectations honored; Product Contract honored; pipeline green; state updated; Product Impact Report present (when contract touched); plan's docs updates landed. The subsection ends with `DoD: pass | fail`. A pass with any unchecked box is a contradiction; reviewer must re-read its own findings. A fail forces `request-changes` even when Blocking is empty. **Source:** `doc/features/integrate-consultancy_plan.md` § "Key design decisions" point 4; `.claude/agents/reviewer.md` § "Verdict format".

---

### Eight review dimensions, decision matrix, trivial fast path, audit scope

Four orthogonal optimizations applied together:
1. **Reviewer / auditor dimensions reduced from 11 to 8** by merging three overlapping pairs (Plan + Product Contract → Plan & Contract compliance; Security + Stability → Correctness; Docs drift + Stack expectations → Documentation and canon compliance). No defect class lost; only the heading collapses.
2. **Decision matrix in WORKFLOW.md** (`## What is mandatory when`) — single table covering Execution State, Product Contract, DoD scope, Stack expectations by change type (user-facing / backend / docs-only / trivial). Replaces scattered inline conditions in coder.md and reviewer.md.
3. **`/fixup` command** for changes meeting four conditions (≤ 50 LOC, no user-visible behavior change, no stack-notes touch, no new source file). Skips plan-feature; reviewer runs in trivial mode (re-validates the four conditions; only escape hatch).
4. **Auditor `--scope=diff`** mode reads only files changed since the most recent `docs/audit-*.md` + their cross-references. `full` remains default and is explicitly recommended quarterly.

**Source:** `doc/features/optimize-without-losing-rigor_plan.md`; commits d09ac14, e441949, d563b02, 310695d.

---

### Realignment around best-in-class built-in skills/tools

The protocol predates the maturation of Claude Code's built-in skills. It now delegates *engines* to them and keeps only its protocol-specific frame: technical review → built-in `code-review` (already Pass 2); research → `deep-research` (driven by `/pm-research` and `pm-stack-researcher`); real-run verification → `verify` / `run` (WORKFLOW Step 5.5). Discipline is made mechanical rather than prose-only: every `pm-*` agent has an explicit `tools:` frontmatter (read-only reviewers cannot edit code; Web is confined to `pm-stack-researcher`); judgment agents drop pinned `model:` to inherit the orchestrator model (only `pm-pr-prep` stays `haiku`); a `PreToolUse` guard denies the named `wb-*` role duplicators while letting `code-review` / `deep-research` / `wb-*` knowledge skills through; a `UserPromptSubmit` hook reasserts the route on change-intent prompts. The protocol also grew its own PR-review-response path (WORKFLOW Step 7), closing the gap that made the model reach for `wb-git:pr-author`. **Source:** `doc/protocol-vs-builtins-analysis.md`, `doc/features/protocol-builtins-realignment_plan.md`.

**Currency note (2026-06-03):** Two points in the paragraph above have since moved. (1) `pm-pr-prep` no longer stays `haiku` — *no agent pins a `model:` now*; `pm-pr-prep` inherits the session model like every other `pm-*` agent (pinned Haiku produced repeated factual errors in PM-facing CHANGELOG entries — CHANGELOG authoring is PM-facing, not pure mechanics). (2) The `UserPromptSubmit` route reminder's trigger vocabulary was broadened beyond the original change-intent words to also cover removal/edit verbs (e.g. убери/удали/переименуй/обнови, remove/delete/rename/update), keeping the keyword gate. **Source:** `doc/features/route-reminder-coverage-and-prprep-model_plan.md`.

### Contract-centric product map replaces the feature index

`docs/features/_index.md` (component → feature) was a write-only output, useful to no reader. It is replaced by `docs/product-map.md` (component → contract → the features + reviews that built it, plus an `Infrastructure` bucket for contract-less work) — contracts are the source of truth for behaviour, so the PM-facing view is inverted to lead with them. This map is **generated** from contracts/plans/reviews/git, never hand-filled, rebuilt wholesale by `pm-auditor` from source (Product map generation procedure). Each per-contract block is **value-first**: it leads with `User value` (projected from the contract's `## User value`) + `Out of scope` (from `## Out of scope`), with the build-history table demoted below under a `Built by:` label — a render-only projection of fields that already exist (no new contract field or generator input), pure markdown with no HTML, and old-format maps (literal `Guarantees:` label) are detected and offered a regenerate at `/pm-plan` and `/pm-audit`. Alongside it, an **authored** `docs/product.md` front door now exists — owned by `pm-architect`, hand-written (not generated), funnelling the PM from Why this exists → What it does today → Documents → Features. The per-feature "did all artefacts appear" checklist the index implicitly served moves to an explicit `pm-plan-checker` DoD item, with `pm-auditor` dimension 1 as the project-wide backstop. The scaffolded downstream project README now owns **no** capability list — it carries a one-paragraph intro plus a single pointer link to `docs/product.md`, which is the single owner of "what it does / for whom / current limits"; existing downstream projects are migrated **move-not-copy** (their `## What it does` capabilities are first reconciled into `docs/product.md` `## What it does today` by `pm-architect`, then the README list is dropped — never a blind rewrite). **This template repo is a deliberate exception** — it has no user-facing Product Contracts (its "product" is the protocol itself), so neither the generated `docs/product-map.md` nor an authored `docs/product.md` is produced here; the protocol's capabilities are documented in this `architecture.md` and in `doc/features/` instead. **Source:** `doc/features/contract-centric-product-map_plan.md`; `doc/features/product-md-front-door_plan.md`; `doc/features/product-map-value-first_plan.md`; `doc/features/readme-front-gate_plan.md`; self-audit 2026-06-02.

### Behavioral contract owns technical taxonomies; journeys stay human-language

Technical taxonomies and invariants (status enums, topic/ID grammars, QoS levels, reachability rules) now have a single owner — a `## Behavioral contract (taxonomies & invariants)` section in the project `architecture.md` template — distinct from `## Integration contract`, which stays "how external consumers integrate" (install / entry points / API). User-journey steps are rewritten to human language ("what the user does / expects / can go wrong") and **reference** the Behavioral contract move-not-copy: the identifier lives in one place and the journey points to it, never restating it beside a link. This is slice 3 of the two-layer-docs sequence (slices 1–2 already shipped: product-map value-first, README front-gate). **Source:** `doc/features/behavioral-contract-and-human-journeys_plan.md`.

### On-disk artifacts are English-canonical; the conversation stays in the PM's language

Everything written to disk — files, source code, commits, and agent-authored docs/reports/reviews — is authored in **English**. The **conversation** with the PM stays in the PM's own language: agents translate artifacts on read (relay findings to the PM in the PM's language) and write only English to disk. This is a two-axis rule — *artifact language = English* is orthogonal to *conversation language = the PM's* — and it is recorded once (in `WORKFLOW.md`, which every agent reads, and `CLAUDE.md.tmpl` for the downstream record) so it is stable across sessions and for subagents. It supersedes the earlier **rejected** "language-as-a-parameter" design (a single configurable artifact language threaded through templates and generators); the canon is a written instruction agents follow, with no enforcement hook (consistent with how other conversation-language guidance lives in `WORKFLOW.md`). Concretely, the `product.md` funnel headers (`Why this exists` / `What it does today` / `Documents` / `Features`), the product-map value-first labels (`User value` / `Out of scope` / `Built by:`), and the `↑ same work` repeat marker are all English; an un-migrated downstream `product.md` carrying the prior Russian headers is treated as a **migration trigger** (header-only rewrite, authored prose preserved verbatim), never machine-translated. **Source:** `doc/features/english-canonical-artifacts_plan.md` (PM decision 2026-06-03).

---

## Architectural constraints

Hard constraints — agents and the orchestrator treat these as non-negotiable without an explicit PM decision.

- **No automated tests in the protocol repo by design — validation by use, with a narrow meta-infrastructure exception.** The template ships as documentation + config; it has no runtime to assert against. Validation of feature behaviour is whether the next feature on the template (or on a downstream project) flows through the workflow correctly. **Exception:** tests that cover the template's own meta-infrastructure — specifically, the regexes inside `.claude/settings.json` `PreToolUse` hooks — *are* allowed and live in `tests/hooks.sh`, gated by `.github/workflows/lint-hooks.yml`. The reasoning: hook regexes are the gate behind several `WORKFLOW.md` guarantees (no silent remote edits, no unsupervised force-push); a silent regression there is not caught by "validation by use" because the user only notices when the gate fails to fire. Runtime / feature-behaviour tests for downstream projects are still out — the exception is for protocol gates inside this repo, not for product behaviour anywhere. **Source:** `doc/features/template-v2_plan.md` § "Test plan" (the original constraint) and `doc/features/audit-fixup-hooks-quoted-form_plan.md` (the decision point that introduced the exception, after audit-2026-05-30 findings #3 / #4 / #6).
- **Template stays application-agnostic.** No domain-specific content in agents, commands, or templates. Examples must be cross-domain (checkout flow, ajv / kubectl / terraform as validators) so the template fits any project type. **Source:** commit `b10a9fa chore(template): degeneralize examples — remove WB/Matter project bias` — first pass leaked wb-mqtt-matter specifics; the cleanup pass replaced them with neutral examples.
- **Settings.json delivered as symlink, not copy.** Downstream `.claude/settings.json` must point at the submodule's copy so a `git submodule update --remote` immediately propagates new hooks without per-project re-install. Documented install path is `ln -s ../.ai-pm/tooling/.claude/settings.json .claude/settings.json`. **Source:** `README.md` § "Установка".
- **Hooks are `PreToolUse` guards plus one `UserPromptSubmit` route reminder.** No `PostToolUse`, `PostToolUseFailure`, `Stop`, `SessionStart`, or other hook events are used — the surface is intentionally minimal: gate at decision time with `PreToolUse`, and add a single soft `UserPromptSubmit` reminder that re-asserts the protocol route on change-intent prompts (the every-turn counterpart to the `PreToolUse` guards), but never react after the fact. **Source:** `.claude/settings.json` shape — the `hooks` object contains a `PreToolUse` key and one `UserPromptSubmit` key.

---

## File layout

Real top-level paths in this repo (cross-checked against `ls` and `git ls-tree -r --name-only HEAD`):

| Path | Purpose |
|---|---|
| `README.md` | PM-facing marketing + natural-language workflow walkthrough + install instructions. |
| `WORKFLOW.md` | Orchestration rules imported into downstream `CLAUDE.md`. Agent roster, edit-ownership rule, remote-system boundary, git workflow, PM communication style. |
| `CHANGELOG.md` | Release log in Keep-a-Changelog 1.1.0 format; top `## [<VERSION>]` entry drives `auto-tag.yml`. |
| `LICENSE` | AGPL v3. |
| `.gitignore` | Excludes `.reviews/`, `.claude/worktrees/`, local-only files. |
| `.claude/agents/` | Seven persona files (`architect`, `auditor`, `coder`, `docs-extractor`, `pr-prep`, `reviewer`, `stack-researcher`). |
| `.claude/commands/` | Five slash-command procedures (`audit`, `bootstrap`, `fixup`, `plan-feature`, `research`). |
| `.claude/settings.json` | `PreToolUse` hooks for path boundary, ssh content-edit, ssh mutating action, force-push, no-verify. |
| `.claude/settings.local.json` | Local-only settings overlay; not part of the delivered surface. |
| `.github/workflows/auto-tag.yml` | The release CI workflow — runs on push to `main`. |
| `.github/workflows/lint-hooks.yml` | The hook-config CI workflow — runs `tests/hooks.sh` on every PR or push that touches `.claude/settings.json`, `tests/hooks.sh`, or the workflow itself. |
| `tests/hooks.sh` | POSIX-shell unit tests for the `PreToolUse` hook regexes in `.claude/settings.json`. Simulates the documented `{tool_name, tool_input}` stdin contract for each hook and verifies the produced `permissionDecision`. The only test artefact in the repo (see Architectural constraints — meta-infrastructure exception). |
| `doc/_templates/` | Templates copied / referenced by `/bootstrap` to populate downstream `docs/` (`CLAUDE.md.tmpl`, `README.md.tmpl`, `architecture.md.tmpl`, `stack-notes.md.tmpl`, `state.md.tmpl`, `contract.md.tmpl`, `threat-model.md.tmpl`, `ui-guide.md.tmpl`, `user-journeys.md.tmpl`). |
| `doc/features/` | Plans, reviews, audits for the template's own development. |
| `doc/stack-notes.md` | Template's own stack-notes — citations + idioms for the six components above. |
| `doc/architecture.md` | This document. |

**In downstream projects only** (not present in this repo): `.ai-pm/state/current.md` and `.ai-pm/state/archive/` hold the live and archived Execution States; `.ai-pm/contracts/<feature>.md` files hold one Product Contract per user-facing feature.

Local-only and ignored paths (`.reviews/`, `.claude/worktrees/`) are not part of the delivered surface.

---

## Integration contract (template ↔ downstream)

How a downstream project consumes the template, and what it commits to in return.

**Consumption:**

1. **Submodule at `.ai-pm/tooling/`.** Downstream runs `git submodule add git@github.com:aadegtyarev/ai-pm-protocol.git .ai-pm/tooling`. The template's `git` semantics (the submodule lives at `$GIT_DIR/modules/ai-pm/tooling/` in the superproject's git directory; see `doc/stack-notes.md` § "git" submodule data model) apply. Default `git clone` of the downstream does not check out the submodule — `--recurse-submodules` or `git submodule update --init` is required (gotcha documented in `doc/stack-notes.md` § "git").
2. **Symlinks for agents, commands, settings.** Downstream creates three symlinks pointing into the submodule:
    - `.claude/agents` → `../.ai-pm/tooling/.claude/agents`
    - `.claude/commands` → `../.ai-pm/tooling/.claude/commands`
    - `.claude/settings.json` → `../.ai-pm/tooling/.claude/settings.json`

    Submodule update therefore propagates new agent personas, command procedures, and hooks without any downstream merge.
3. **WORKFLOW.md imported via `@`-directive.** Downstream `CLAUDE.md` contains the line `@.ai-pm/tooling/WORKFLOW.md` — Claude Code expands it inline at session start. Orchestration rules update with the submodule pointer.
4. **Templates consumed by `/bootstrap`.** On first `/bootstrap` in a downstream, the command reads `.ai-pm/tooling/doc/_templates/*.tmpl` and writes filled-in counterparts into the downstream's `docs/` (e.g., `docs/architecture.md`, `docs/user-journeys.md`, `docs/stack-notes.md`). After bootstrap the downstream owns those files — they are not symlinked, they live in the downstream's own history.

**Version bumping:** When downstream wants a newer template version, it runs `git submodule update --remote .ai-pm/tooling`, stages the new submodule pointer, and commits with a `chore: bump ai-pm-protocol to <sha>` message. The submodule pointer is the only thing in the downstream's diff — agent / command / WORKFLOW changes are transparent. **Source:** `README.md` § "Установка" (the inline `git submodule update --remote .ai-pm/tooling` line at the end of the install block) + `WORKFLOW.md` § "Maintenance".

---

## Release flow

How a feature commit in this template becomes a published GitHub Release. Cross-checked against `.github/workflows/auto-tag.yml`.

1. **Feature branch + conventional commits.** Orchestrator branches from current `main` (`feature/<topic>`), commits atomically; `WORKFLOW.md` § "Git workflow — orchestrator owns this" documents the shape.
2. **PR opened by `pr-prep`.** Agent bumps the version, edits `CHANGELOG.md` (adds a `## [<VERSION>] — <DATE>` section under `## [Unreleased]`), pushes the branch, opens (or updates) the PR via `gh pr create` / `gh pr edit`.
3. **PM merges via squash on GitHub.** The squashed commit lands on `main`. Branch / commit message at this step do not matter for the release workflow — `auto-tag.yml` reads `CHANGELOG.md`, not the commit log.
4. **`auto-tag.yml` runs on push to `main`.**
    - `actions/checkout@v4` with `fetch-depth: 0` (full history — required so `git tag` can see all existing tags; default `fetch-depth: 1` would make tag-existence checks unreliable, gotcha documented in `doc/stack-notes.md` § "GitHub Actions").
    - "Detect new version" step: `grep -m1 '^## \[[0-9]' CHANGELOG.md` extracts the top entry; if a `v<VERSION>` GitHub Release already exists (`gh release view "$TAG"` succeeds) the step sets `is_release=false` and the workflow no-ops. This is the idempotency guarantee — pushing the same `main` twice does not double-tag.
    - "Create tag if missing" step (gated by `if: steps.detect.outputs.is_release == 'true'`): annotated tag `v<VERSION>` created and pushed to `origin`. Workflow-level `permissions: contents: write` grants the necessary token scope.
    - "Extract CHANGELOG notes" step: `awk "/^## \[${VERSION}\]/,/^## \[[0-9]/"` slices the section between the new version's header and the next version header; trailing line removed, separator + blank lines stripped, capped at 200 lines.
    - "Create GitHub Release" step: `gh release create "$TAG" --title "Release $TAG" --notes-file /tmp/release_notes.md` publishes the release. `GH_TOKEN` is `secrets.GITHUB_TOKEN`, which is the per-job installation access token (lifetime ≤ 6h on GitHub-hosted runners; documented in `doc/stack-notes.md` § "GitHub Actions").

**Why no tag-on-merge or release-branch model:** the decision was to read the CHANGELOG (single source of truth for what changed) instead of inferring versions from commit messages or branch names. Commits `e14b720 fix: auto-tag reads CHANGELOG instead of commit message`, `ad3d30f fix: merge auto-tag and create-github-release into one workflow`, `c240181 fix: release workflow checks GitHub Release, not tag`, `ba5f613 refactor: release model = tag main, not release branch` record the iterations that landed at the current shape.

---

## External standards

N/A — this is a downstream-projects concept. The template itself sets the standards that downstream projects adopt; it does not adopt company / team standards from anywhere upstream.

---

## Dependencies

N/A — the template has no runtime dependencies in the package-manifest sense (no `package.json`, no `requirements.txt`, no `go.mod`). The ambient CLI tools the agents and hooks rely on (`jq`, `gh`, `git`) are documented per-component in `doc/stack-notes.md` instead.

---

## Security constraints

N/A — this template does not run as a service, does not store data, does not process untrusted input. Persona files and hook scripts are plain Markdown / JSON checked at PR review; nothing here listens on a port, holds credentials, or executes user input. (Hook scripts run locally under the user's Claude Code session, gated by Claude Code's own permission flow.)

---

## Code conventions

Covered per-component in `doc/stack-notes.md`: frontmatter rules for agent files (§ "Markdown frontmatter"), hook command-string shape and the `permissionDecision` enum (§ "Claude Code hooks API"), jq idioms (`//`, `empty`, `-r`) used inside hook commands (§ "jq"), branch-naming and ref-format constraints (§ "git"), workflow-syntax rules for `auto-tag.yml` (§ "GitHub Actions"). Not duplicated here — `stack-notes` is the canonical reference and is reviewed component-by-component.

---

## Deploy / runtime

N/A — the template has no runtime. Distribution is via `git submodule` (see § "Integration contract"); there is no service to deploy, no container to build, no host to provision.

---

## Database / state

N/A — stateless. The template carries no database, no persistent state, no caches. Each Claude Code session reads the on-disk files fresh; the only "state" between sessions is the git history of this repo and of every downstream project.

---

## UI guide

N/A — no UI. The PM-facing surface is conversational (Claude Code chat); the developer-operator surface is slash commands (`/bootstrap`, `/plan-feature`, `/audit`, `/research`) and Markdown files. There is no graphical interface to design.
