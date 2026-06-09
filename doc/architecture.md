# Architecture

This document describes the architecture of the **ai-pm-protocol template repository itself** — not a downstream project that consumes the template. It is a meta-case: the template documents itself in the same shape (`doc/_templates/architecture.md.tmpl`) it expects downstream projects to use. Sections that do not apply to a documentation-and-config repo are kept as headers and marked `N/A — <one-line reason>` so a downstream reader can see the template walked its own structure honestly.

**Last full review:** 2026-06-08

---

## Project

A template for product managers building their product solo or with AI assistance. The PM describes what they want; a fixed set of Markdown-defined agents (`pm-architect`, `pm-coder`, `pm-plan-checker`, `pm-pr-prep`, `pm-codebase-reader`, `pm-stack-researcher`, `pm-auditor`, `pm-product-advocate`) plan, implement, and verify changes against the PM's plan, the downstream project's `docs/architecture.md` constraints, and `docs/stack-notes.md` stack literacy. The PM makes product decisions and does not read code. Marketing-level claims and the natural-language workflow walkthrough live in `README.md` — this document does not duplicate them; it describes the underlying structure.

---

## Tech stack

The template's stack is the small set of CLI tools, file formats, and APIs that the agents, commands, hooks, and release workflow rely on. Each component has a full entry in `doc/stack-notes.md` (role, canonical docs, idioms, gotchas, last-reviewed date); this table is a directory, not a duplicate.

| Component | Role in the template | Reference |
|---|---|---|
| Markdown frontmatter (YAML 1.2.2) | Persona declaration on every `.claude/agents/*.md` (`name`, `description`, `model`). Read by Claude Code at session start to register each subagent. | `doc/stack-notes.md` § "Markdown frontmatter (YAML in Claude Code agent files)" |
| Claude Code hooks API | `.claude/settings.json` registers `PreToolUse` hooks that gate Read / Bash boundary violations, ssh-driven content edits, ssh-driven mutating actions, `git push --force`, `git commit --no-verify`. | `doc/stack-notes.md` § "Claude Code hooks API" |
| jq | JSON processor used inside hook command strings to parse the `PreToolUse` stdin contract and emit `hookSpecificOutput` JSON on stdout. | `doc/stack-notes.md` § "jq" |
| git | Branch / commit conventions, `git rev-parse --show-toplevel` (project-root boundary in every hook), submodule semantics (the template ships as `.ai-pm/tooling/` submodule in downstream). | `doc/stack-notes.md` § "git" |
| gh (GitHub CLI) | Used by `.claude/agents/pm-pr-prep.md` (PR open / edit) and by `.github/workflows/auto-tag.yml` (`gh release view`, `gh release create`). | `doc/stack-notes.md` § "gh (GitHub CLI)" |
| GitHub Actions | `.github/workflows/auto-tag.yml` runs on every push to `main`, reads the top version from `CHANGELOG.md`, creates the tag and GitHub Release if missing. | `doc/stack-notes.md` § "GitHub Actions" |

Components not in the list (Conventional Commits, SemVer, Keep a Changelog) are conventions used by `CHANGELOG.md` and `pm-pr-prep`, not external systems whose idioms or validators the template integrates with — they are intentionally out of scope of stack-notes (see `doc/features/audit-fixup-self-stack-notes_plan.md` scope decision). They are not listed here either, to keep this directory consistent with stack-notes.

---

## Architectural decisions

This section is a **thin index**, sharded for readability. Each record below is one decision the template made, kept as a one-line gist with a pointer to its full body in `doc/decisions/<file>.md` (the bodies carry the rationale and the document / PR / commit where the decision was taken — no "we just did it" claims). **The `### <heading>` anchor is stable:** a reference of the form `doc/architecture.md` `### <heading>` resolves to the index entry here, which points onward to the body. Records are grouped by theme; within a group they keep their original chronological order.

> Sharded out of a single 45-record section that tripped the doc-frugality scale-guard — see `### Keep only what's actually used; throw the rest away` for the distillation model. The on-demand decision files are the same progressive-disclosure pattern the protocol ships downstream (`WORKFLOW.md` → `workflow/*.md`).

**Template foundation — how the protocol ships and loads** — full bodies in `doc/decisions/template-foundation.md`:

### Agents are plain Markdown files, not compiled artefacts

Persona files are plain Markdown with YAML frontmatter — no compiled runtime; a dev-side build now generates the adapters from one neutral source, but downstream still gets plain files with no build. → `doc/decisions/template-foundation.md`

### Commands are Markdown procedures

Slash commands are Markdown procedure docs and developer-operator shortcuts, not the PM interface. → `doc/decisions/template-foundation.md`

### WORKFLOW.md imported into downstream `CLAUDE.md` via `@.ai-pm/tooling/WORKFLOW.md`

Orchestration rules live in `WORKFLOW.md` and reach downstream via the `@.ai-pm/tooling/WORKFLOW.md` import, so a template update propagates on submodule update. → `doc/decisions/template-foundation.md`

### Settings.json delivered via symlink, not copy

Downstream `.claude/settings.json` is a symlink into the submodule, so new hooks propagate without a per-project re-install. → `doc/decisions/template-foundation.md`

### Hooks layer for cross-session enforcement of WORKFLOW rules

The remote-edit / force-push / no-verify boundary rules are wired as `PreToolUse` hooks, not only prose, so they hold even when a session does not re-read `WORKFLOW.md`. → `doc/decisions/template-foundation.md`

### Release flow: CHANGELOG entry → auto-tag → tag + GitHub Release

A push to `main` triggers `auto-tag.yml`, which reads the top `CHANGELOG.md` entry and creates the tag + GitHub Release — no release branch, no manual tagging. → `doc/decisions/template-foundation.md`

**Pipeline roles & ownership** — full bodies in `doc/decisions/pipeline-roles.md`:

### pm-auditor / pm-stack-researcher / pm-codebase-reader as read-only subagents

`pm-auditor` / `pm-stack-researcher` / `pm-codebase-reader` run read-only project-wide work in isolated subagents (reader renamed + journeys ownership consolidated under `pm-architect`). → `doc/decisions/pipeline-roles.md`

### Edit-ownership split: content artefacts vs orchestration artefacts

The orchestrator writes the outputs of processes it drives but never freehand-edits agent-owned canon; the one carve-out is the gated Pass-2 `## Code review` trail. → `doc/decisions/pipeline-roles.md`

### Categorical scope check at plan-feature stage

Every plan that mentions a categorical concept must explicitly take the whole set or one element, listing siblings in Out of scope — `pm-plan-checker` blocks scope drift. → `doc/decisions/pipeline-roles.md`

### Execution State as the single source of progress

`.ai-pm/state/current.md` is the single source of task progress; every `pm-coder` run reads it first, writes it last; on finish it resets to idle (facts already graduated). → `doc/decisions/pipeline-roles.md`

### Definition of Done as an explicit pm-plan-checker subsection

The `pm-plan-checker` verdict carries an explicit Definition of Done subsection with 7 hard checks ending in `DoD: pass | fail`. → `doc/decisions/pipeline-roles.md`

### Eight review dimensions, decision matrix, trivial fast path, audit scope

Review dimensions reduced 11→8, a single mandatory-when decision matrix, a `/pm-fixup` trivial fast path, and `pm-auditor --scope=diff` (with the audit-scope menu refinement). → `doc/decisions/pipeline-roles.md`

**Contracts & the product layer** — full bodies in `doc/decisions/contracts-and-product.md`:

### Product Contracts as the product-side complement to stack-notes

Product Contracts describe user-visible behavior in the project's own words — the product-side complement to stack-notes; one per user-facing feature. → `doc/decisions/contracts-and-product.md`

### Realignment around best-in-class built-in skills/tools

The protocol delegates review/research/run engines to built-in skills (`code-review`, `deep-research`, `verify`/`run`) and keeps only its protocol-specific frame. → `doc/decisions/contracts-and-product.md`

### Contract-centric product map replaces the feature index

`docs/product-map.md` (generated, contract-centric, value-first) replaces the write-only feature index; an authored `docs/product.md` front door funnels the PM over it. This repo carries contracts with the LLM/agent + PM as consumer. → `doc/decisions/contracts-and-product.md`

### Behavioral contract owns technical taxonomies; journeys stay human-language

Technical taxonomies/invariants are single-owned in `## Behavioral contract`; user-journey steps are human-language and reference it move-not-copy. → `doc/decisions/contracts-and-product.md`

### Contracts are two-layer; wire-tokens are single-owned in the Behavioral contract and referenced

Contracts are two-layer — token-free PM sections; wire-grammars single-owned in the Behavioral contract and referenced — with a structural wire-token lint. → `doc/decisions/contracts-and-product.md`

### On-disk artifacts are English-canonical; the conversation stays in the PM's language

Everything on disk is authored in English; the conversation stays in the PM's language (translate-on-read). Supersedes the rejected language-as-a-parameter design. → `doc/decisions/contracts-and-product.md`

**Migrations, doc-frugality & whole-system-property sections** — full bodies in `doc/decisions/migrations-and-docs.md`:

### Migration catalogue is a single protocol-root reference `MIGRATIONS.md`, sibling to `WORKFLOW.md`

Pending-migration detection and every per-version migration procedure live in one protocol-root `MIGRATIONS.md`, sibling to `WORKFLOW.md`, referenced by bare filename. → `doc/decisions/migrations-and-docs.md`

### Semantic doc-migration on template bump: an expected-discipline registry + an enhanced remediation, no new detection

A version-keyed expected-discipline registry in `MIGRATIONS.md` plus an enhanced `/pm-audit` remediation — no new detector (dimension 5 already detects), no new command/agent/hook. → `doc/decisions/migrations-and-docs.md`

### Project kind: a `software | documentation` conditional split lets the protocol develop documentation projects, not only code (v1 slice; generalizes the v2.18 `process` flavor)

A declared `software | documentation` project kind conditions the pipeline (rider, not fork); `absent OR unrecognized ⇒ software`. Generalizes the v2.18 `process` flavor. → `doc/decisions/migrations-and-docs.md`

### System invariants get a single index in the Behavioral contract, by-reference like threat → constraint

`## Behavioral contract` gains a `### System invariants` index — one entry point listing each invariant by reference to its single home (inline / `SCn` ID / journey name). → `doc/decisions/migrations-and-docs.md`

### Journey taxonomy-drift sweep: pm-auditor dimension 5 backstops the journeys move-not-copy discipline

`pm-auditor` dimension 5 gains a journey identifier-restatement check backstopping the journeys move-not-copy discipline (gated to backticked tokens; note-not-blocking). → `doc/decisions/migrations-and-docs.md`

### Conditional NFR / operational-limits prompt: scale/resource budgets get a home, split by audience

A conditional `/pm-plan` NFR check routes a declared budget by audience: user-facing limit → contract `## Must not break`; resource budget → a new `## Operational limits & budgets` section. → `doc/decisions/migrations-and-docs.md`

### Conditional State-model section: a state machine / protocol gets a single referenceable home, by transitions-not-states reference

A conditional `## State model` section (states×transitions table + triggers) gives a state machine / protocol a single home; the enum owns the nodes, the table adds the edges. → `doc/decisions/migrations-and-docs.md`

### Keep only what's actually used; throw the rest away

A finished feature's lasting facts move into one of four permanent homes; the working notes are thrown away (git keeps the bytes) — the distillation-engine doc model. → `doc/decisions/migrations-and-docs.md`

**Safety, security & diagnostics** — full bodies in `doc/decisions/safety-and-diagnostics.md`:

### Blast-radius preflight is soft prose, single-sourced, referenced from Step 5.5 and Step A.5

Before any on-hardware run or a structurally-mutating probe, the orchestrator checks coupling to a live external stateful peer — soft prose single-sourced in `WORKFLOW.md`, referenced from Step 5.5 and Step A.5. → `doc/decisions/safety-and-diagnostics.md`

### Threat-model gains a full lifecycle owned by pm-architect, gated on security-bearing projects

`docs/threat-model.md` gains a full lifecycle owned by `pm-architect`, gated on security-bearing projects; threat → constraint wiring is one-way and `SCn`-ID-keyed. → `doc/decisions/safety-and-diagnostics.md`

### Integration-risk spike gate: a conditional /pm-plan gate that fires when the design hinges on a doc-cited (unverified) load-bearing SDK idiom

A conditional `/pm-plan` spike gate fires when the design hinges on a `doc-cited (unverified)` load-bearing SDK idiom — verify-before-rely with a minimal throwaway run. → `doc/decisions/safety-and-diagnostics.md`

### Changeset hygiene: the diff carries only feature-serving hunks, the reviewer notes diff-noise, and authored human-facing text is read-before-ship (feature A of the reviewability track)

The diff carries only feature-serving hunks (no cosmetic churn), `pm-plan-checker` notes diff-noise, and authored human-facing text is read-before-ship — feature A of the reviewability track. → `doc/decisions/safety-and-diagnostics.md`

### Test-wiring-parity: a wiring-dependent feature must test the production registration path, enforced by pm-plan-checker

A wiring-dependent feature must carry ≥1 test that drives the production registration path, not a hand-rolled equivalent; `pm-plan-checker` blocks. → `doc/decisions/safety-and-diagnostics.md`

### Diagnostic-flow discipline: passive observation is read-only, bisect-before-hypothesize, an anti-thrash tripwire, and mid-debug stack-research

Four additive diagnostic disciplines: passive observation is read-only-grade, bisect-before-hypothesize, a two-failed-fixes anti-thrash tripwire, and mid-debug stack-research. → `doc/decisions/safety-and-diagnostics.md`

### Bootstrap write-loss guards: a destructive-Write deny plus a bootstrap doc-snapshot, the prevent-and-recover pair against doc truncation

A destructive-`Write` `PreToolUse` deny (P1) plus bootstrap doc-snapshots (P2) — the prevent-and-recover pair against doc truncation. → `doc/decisions/safety-and-diagnostics.md`

**Product-advocacy & decision authority (automode)** — full bodies in `doc/decisions/decision-authority.md`:

### pm-product-advocate: an independent product-axis referee with a soft, single-sourced, owner-split-with-gate mechanism

`pm-product-advocate` is the independent product-axis referee — soft-enforced, single-sourced foundational questions, owner-split-with-gate, block-but-sovereign. → `doc/decisions/decision-authority.md`

### Automode: a decision-authority mode (graded, capped autonomy) — one engine, two scopes, riding the pm-product-advocate gate

Automode is a `autonomous | interactive` decision-authority mode (default interactive) — one engine, two scopes, riding the advocate gate; derive-from-cited-canon-or-escalate; merge stays manual. → `doc/decisions/decision-authority.md`

### Autonomous procedural-gate progression: announce-and-proceed through routine pipeline gates, derive-or-escalate only at genuine product forks

In autonomous mode a routine procedural checkpoint becomes announce-and-proceed; a genuine product fork still derives-or-escalates — a graded extension of the one Decision-authority engine. → `doc/decisions/decision-authority.md`

**Review system — typology, engines, models** — full bodies in `doc/decisions/review-system.md`:

### Review typology: a single-sourced, layered review-type registry with proportional new-code gating (EPIC slice 1 — smell/hygiene built, three types registered)

A single-sourced `### Review typology` registry names the review types (per-diff / smell / architectural / functional / criticality) with proportional new-code gating; slice 1 ships the smell sweep. → `doc/decisions/review-system.md`

### AI-specific minimums are deterministically linter-enforced, not AI-self-policed (the #211 deterministic half, made real)

AI-specific minimums are deterministically enforced by the downstream project's real linter (numbers single-sourced; `pm-stack-researcher` maps each to a linter rule), not AI-self-policed. → `doc/decisions/review-system.md`

### WORKFLOW.md progressive-disclosure boundary: a freeform-reasoning rule keeps its kernel in the always-on core

The progressive-disclosure boundary criterion: a rule the orchestrator applies in freeform reasoning keeps its decision-critical kernel in the always-on core; procedure/step-scoped rules go on-demand. → `doc/decisions/review-system.md`

### Review-engine selection: the orchestrator becomes a legitimate engine; per-diff stays built-in by routing, not by a hook deny (supersedes deny-review-orchestrator)

The review-orchestrator skill becomes a legitimate engine; per-diff stays on built-in `code-review` by routing not a hook deny; the full sweep prefers the orchestrator. Supersedes `deny-review-orchestrator`. → `doc/decisions/review-system.md`

### Cross-model review: review and audit run on a different model than the session by default, for independent blind spots (the model axis, orthogonal to engine-selection)

Review and audit run on a different model from the session by default (`auto`) for independent blind spots — the model axis, four settings, Haiku-blacklisted, model-pinned subagent, always-announced. → `doc/decisions/review-system.md`

**Dual-harness architecture & enforcement integrity** — full bodies in `doc/decisions/dual-harness.md`:

### Symmetric dual-harness adapter architecture via build-time single-source, two-repo source/dist split (form C); OpenCode ships as a preview

A second supported harness (OpenCode `.opencode/`) via a harness-neutral source + generator emitting two symmetric adapters; form C two-repo source/dist split; OpenCode ships as a preview. → `doc/decisions/dual-harness.md`

### Harness-neutral instruction prose: neutral nouns in the shared corpus + one harness-reference table (form A)

Shared instruction prose names every harness-specific concept with a neutral noun + one harness-reference table (form A); enforced by `tests/neutral-prose.sh`. → `doc/decisions/dual-harness.md`

### OpenCode compact one-pass reviewer + control-layer model + single session default + ultra retired; the enforcement plugin is the OpenCode structural backstop

Five OpenCode-side review/enforcement decisions plus the cross-harness `ultra` retirement: a compact one-pass reviewer, control-layer model knob, single session default, and the enforcement plugin as the structural backstop. → `doc/decisions/dual-harness.md`

### Orchestrator anti-corner-cutting: the enforcement-point split, then the core hoist to one Delegation & gate integrity invariant

The enforcement-point split (plugin-deniable vs persona-only) plus a graceful subagent-failure path and a pre-ship merge gate, then the core hoist to one `Delegation & gate integrity` invariant. → `doc/decisions/dual-harness.md`

### Role-delegation integrity: a generic harness built-in is never a stand-in for a protocol role

A generic harness built-in (`general`/`build`/`plan`) is never a stand-in for a protocol role — added to the same named deny-list as the `wb-*` role duplicators (engines stay allowed). → `doc/decisions/dual-harness.md`

---

## Architectural constraints

Hard constraints — agents and the orchestrator treat these as non-negotiable without an explicit PM decision.

- **No automated tests in the protocol repo by design — validation by use, with a narrow meta-infrastructure exception.** The template ships as documentation + config; it has no runtime to assert against. Validation of feature behaviour is whether the next feature on the template (or on a downstream project) flows through the workflow correctly. **Exception:** tests that cover the template's own meta-infrastructure — specifically, the regexes inside `.claude/settings.json` `PreToolUse` hooks — *are* allowed and live in `tests/hooks.sh`, gated by `.github/workflows/lint-hooks.yml`. The reasoning: hook regexes are the gate behind several `WORKFLOW.md` guarantees (no silent remote edits, no unsupervised force-push); a silent regression there is not caught by "validation by use" because the user only notices when the gate fails to fire. Runtime / feature-behaviour tests for downstream projects are still out — the exception is for protocol gates inside this repo, not for product behaviour anywhere. **Source:** `doc/features/template-v2_plan.md` § "Test plan" (the original constraint) and `doc/features/audit-fixup-hooks-quoted-form_plan.md` (the decision point that introduced the exception, after audit-2026-05-30 findings #3 / #4 / #6). **Extended test set (2026-06-08).** The dual-harness effort grew the meta-infrastructure test suite well beyond `tests/hooks.sh`: verification now runs a multi-suite set — `tests/hooks.sh` (hook deny-list regexes), `tests/generator.sh` (generated-Claude-adapter byte-equivalence + `single-source-diff-clean`), `tests/opencode.sh` (OpenCode adapter shape), `tests/oc-plugin-unit.js` (enforcement-plugin unit tests), `tests/neutral-prose.sh` (no Claude-isms in the neutral source + reference-table/capabilities drift), `tests/targeted-reading.sh` (targeted-reading discipline), and `tests/ultra-absent.sh` (retired-`ultra` absence). All of these fall under the **same meta-infrastructure exception**: they cover the template's own gates and single-source integrity (the generator, the enforcement plugin, the neutral-prose corpus), not product behaviour anywhere — so the "no automated tests by design" constraint and its narrow exception are unchanged in principle; only the surface the exception covers has grown. They are gated by `.github/workflows/lint-hooks.yml` (`tests/hooks.sh`) and `.github/workflows/generator.yml` (the generator + neutral-prose guards). **Source:** the OpenCode dual-harness work on `feature/opencode-harness-support` (generator + neutral-prose slices).
- **Template stays application-agnostic.** No domain-specific content in agents, commands, or templates. Examples must be cross-domain (checkout flow, ajv / kubectl / terraform as validators) so the template fits any project type. **Source:** commit `b10a9fa chore(template): degeneralize examples — remove WB/Matter project bias` — first pass leaked wb-mqtt-matter specifics; the cleanup pass replaced them with neutral examples.
- **Settings.json delivered as symlink, not copy.** Downstream `.claude/settings.json` must point at the submodule's copy so a `git submodule update --remote` immediately propagates new hooks without per-project re-install. Documented install path is `ln -s ../.ai-pm/tooling/.claude/settings.json .claude/settings.json`. **Source:** `README.md` § "Установка".
- **Hooks are `PreToolUse` guards plus one `UserPromptSubmit` route reminder.** No `PostToolUse`, `PostToolUseFailure`, `Stop`, `SessionStart`, or other hook events are used — the surface is intentionally minimal: gate at decision time with `PreToolUse`, and add a single soft `UserPromptSubmit` reminder that re-asserts the protocol route on change-intent prompts (the every-turn counterpart to the `PreToolUse` guards), but never react after the fact. **Source:** `.claude/settings.json` shape — the `hooks` object contains a `PreToolUse` key and one `UserPromptSubmit` key.

---

## Operational limits & budgets

N/A — the ai-pm-protocol template is documentation + config, not a resource-constrained runtime: it has no RAM ceiling, boot-time budget, CPU headroom, or system-level max-N to bound, and no scale-bearing feature whose core scales with a count the system must hold. (The section is born `N/A` here exactly as it is for any project with no quantified budget; this repo carries it to stay self-consistent with the `## Operational limits & budgets` section the shipped `doc/_templates/architecture.md.tmpl` now defines — sibling to `## Architectural constraints`, A2-walked, A4-excluded.)

---

## State model

N/A — the ai-pm-protocol template is documentation + config, not a state machine / protocol: it has no status ladder with defined transitions, no named-state lifecycle, and no wire / connection protocol with message / connection states to model. (The section is born `N/A` here exactly as it is for any project whose core is not a state machine; this repo carries it among the conditional engineering sections — clustered after `## Operational limits & budgets`, sibling to `## Architectural constraints` — to stay self-consistent with the `## State model` section the shipped `doc/_templates/architecture.md.tmpl` now defines (the template places it after `## Behavioral contract`, a section this repo has no top-level instance of). A2-walked, A4-excluded.)

---

## File layout

Real top-level paths in this repo (cross-checked against `ls` and `git ls-tree -r --name-only HEAD`). The repo now carries a **single-source dual-harness layout**: harness-neutral source in `src/`, a thin generator in `gen/`, and two generated adapter trees (`.claude/` for Claude Code, `.opencode/` for OpenCode) — see the "Agents are plain Markdown files" decision's 2026-06-07 amendment.

| Path | Purpose |
|---|---|
| `README.md` | PM-facing marketing + natural-language workflow walkthrough + install instructions (Russian prose, English canonical section headers). |
| `CLAUDE.md` | Dogfood entry point for Claude Code — the template repo's own `CLAUDE.md`; `@`-imports the thin `WORKFLOW.md` core (`@WORKFLOW.md`, root-relative) so the orchestrator developing the protocol auto-loads the core + router + cross-cutting invariants, exactly as a downstream project does. Declares `## Project kind: software`. (Downstream projects get their own `CLAUDE.md` from `doc/_templates/CLAUDE.md.tmpl`; this one is the template repo's self-dogfood.) |
| `AGENTS.md` | Dogfood entry point for OpenCode — the OpenCode always-on instruction surface (per the harness's `AGENTS.md` convention). The protocol core (`WORKFLOW.md`) is loaded via the `instructions` array in `opencode.json`, not an in-file `@`-import (OpenCode does not parse `@`-references inside an instruction file). A **build product**: authored once in `src/manifests/opencode/AGENTS.md` and emitted verbatim to the repo root by the generator; do not hand-edit the generated copy. |
| `WORKFLOW.md` | Thin constitution + router: the always-loaded core rules plus explicit "Read `workflow/<topic>.md` before X" pointers. Imported into downstream Claude `CLAUDE.md` via `@` and loaded into OpenCode via `opencode.json` `instructions`. The former monolithic bulk now lives in `workflow/`. |
| `workflow/` | On-demand orchestration topic files (15) — the decomposed `WORKFLOW.md` bulk (`roster`, `enforcement`, `pipeline`, `mandatory-matrix`, `project-kind`, `decision-authority`, `review-typology`, `security-surfaces`, `foundational-questions`, `state`, `incident`, `protocol-gap`, `maintenance`, `pm-comms`, `examples`). Each is read just-in-time via the Read tool, not `@`-imported. One single-source rule-home per file. |
| `MIGRATIONS.md` | Canonical migration catalogue — pending-migration detection conditions + per-version migration procedures for moving a project between protocol template versions. Sibling to `WORKFLOW.md`; referenced by bare filename from `pm-plan`, `pm-audit`, `pm-auditor`, `pm-plan-checker`, and the `pm-bootstrap.md` pointer. |
| `CHANGELOG.md` | Release log in Keep-a-Changelog 1.1.0 format; top `## [<VERSION>]` entry drives `auto-tag.yml`. |
| `LICENSE` | MIT. |
| `.gitignore` | Excludes `.reviews/`, `.claude/worktrees/`, local-only files. |
| `src/` | **Harness-neutral source — the single source of truth** for both adapters. `src/agents/<name>.body.md` and `src/commands/<name>.body.md` hold the harness-neutral agent / command bodies (no frontmatter, neutral nouns only). `src/manifests/` holds the per-harness build inputs: `capabilities.json` (neutral-noun → per-harness concrete map, rendered into the reference table), `deny-list.json` (the shared `wb-*` deny-list), and one subdir per harness — `claude/` (`adapter.json`, `frontmatter/<name>.fm`, `settings.json`) and `opencode/` (`adapter.json`, `frontmatter/<name>.fm`, `opencode.json`, `AGENTS.md`, a `plugin/ai-pm-enforcement.js.tmpl` enforcement-plugin template, and a `harness_local/` subtree holding the OpenCode-only protocol-owned engines `ai-pm` / `code-review` / `deep-research` as body+frontmatter — the engines Claude has as native built-ins). |
| `gen/` | The **generator** (development-side build, never shipped to downstream as a build step). `generate.py` is the thin deterministic generator: neutral body + per-harness manifest → a full adapter file, for both `.claude/` and `.opencode/`. `carve.py` is a one-shot lossless carve that bootstrapped the neutral source from the frozen Claude golden (source ← adapter direction; not the generator). `harness-reference.md` is the rendered neutral-noun → per-harness-concrete reference table (a drift-free render of `src/manifests/capabilities.json`). |
| `.claude/agents/` | Generated Claude adapter — eight persona files (`pm-architect`, `pm-auditor`, `pm-codebase-reader`, `pm-coder`, `pm-pr-prep`, `pm-plan-checker`, `pm-product-advocate`, `pm-stack-researcher`). Byte-identical to the frozen golden (guarded by `tests/generator.sh`). |
| `.claude/commands/` | Generated Claude adapter — five slash-command procedures (`pm-audit`, `pm-bootstrap`, `pm-fixup`, `pm-plan`, `pm-research`). |
| `.claude/settings.json` | Generated Claude adapter — `PreToolUse` hooks for path boundary, ssh content-edit, ssh mutating action, force-push, no-verify, plus the `UserPromptSubmit` route reminder and the `wb-*` deny-list. |
| `.claude/settings.local.json` | Local-only settings overlay; not part of the delivered surface. |
| `.opencode/agent/` | Generated OpenCode adapter — the eight `pm-*` personas plus three harness-local protocol-owned engines (`ai-pm`, `code-review`, `deep-research`) that Claude gets as native built-ins. |
| `.opencode/command/` | Generated OpenCode adapter — the five slash-command procedures. |
| `.opencode/plugin/ai-pm-enforcement.js` | Generated OpenCode adapter — the enforcement plugin (the OpenCode realization of the `PreToolUse` deny-list / boundary guards that `.claude/settings.json` hooks realize on Claude), generated from `src/manifests/opencode/plugin/ai-pm-enforcement.js.tmpl`. |
| `.opencode/opencode.json` | Generated OpenCode adapter — config: the `instructions` array loading `WORKFLOW.md`, `autoMemoryEnabled: false`, the single session model, and the plugin wiring. |
| `.golden/claude/` | The **frozen golden reference** for the Claude adapter — the pre-dual-harness hand-authored `.claude/` tree (`agents/`, `commands/`, `settings.json`) plus `SHA256SUMS`. `tests/generator.sh` regenerates `.claude/` from source and asserts byte-for-byte equality against this golden, proving the build did not change what a Claude session loads. `.golden/README.md` documents the golden's role. |
| `.github/workflows/auto-tag.yml` | The release CI workflow — runs on push to `main`. |
| `.github/workflows/lint-hooks.yml` | Runs `tests/hooks.sh` on every PR or push that touches `.claude/settings.json`, `tests/hooks.sh`, or the workflow itself. |
| `.github/workflows/generator.yml` | Runs `tests/generator.sh` on PRs / pushes that touch the single-source surface (`src/`, `gen/`, `.claude/`, `.golden/`, the gating tests) — the byte-equivalence + `single-source-diff-clean` guards plus the harness-neutral-prose guards. |
| `tests/` | The meta-infrastructure test suite (see Architectural constraints — meta-infrastructure exception, extended-test-set note). `hooks.sh` (POSIX-shell unit tests for the `PreToolUse` hook regexes, simulating the `{tool_name, tool_input}` stdin contract and verifying the `permissionDecision`); `generator.sh` (generated-Claude byte-equivalence + `single-source-diff-clean`); `opencode.sh` (OpenCode adapter shape); `oc-plugin-unit.js` (enforcement-plugin unit tests); `neutral-prose.sh` (no Claude-isms in `src/` bodies + reference-table/capabilities drift); `targeted-reading.sh` (targeted-reading discipline); `ultra-absent.sh` (retired-`ultra` absence). |
| `doc/_templates/` | Templates copied / referenced by `/pm-bootstrap` to populate downstream `docs/` (`CLAUDE.md.tmpl`, `README.md.tmpl`, `architecture.md.tmpl`, `stack-notes.md.tmpl`, `state.md.tmpl`, `contract.md.tmpl`, `product.md.tmpl`, `threat-model.md.tmpl`, `ui-guide.md.tmpl`, `user-journeys.md.tmpl`), plus a `starters/` subdir of **optional** documentation-kind deliverable starters (`starters/sop.md.tmpl`, `starters/guide.md.tmpl`) — opt-in seeds, not mandated scaffolds (see the Project kind decision). |
| `doc/features/` | Plans, reviews, audits for the template's own development. |
| `doc/stack-notes.md` | Template's own stack-notes — citations + idioms for the components above. |
| `doc/product.md` | Authored PM-facing front door (owned by `pm-architect`). |
| `doc/product-map.md` | Generated contract → features view (regenerated by `pm-auditor`). |
| `doc/user-journeys.md` | The template's own user-journeys document. |
| `doc/protocol-vs-builtins-analysis.md` | The realign-around-built-ins analysis the realignment decision cites. |
| `doc/architecture.md` | This document. |

**In downstream projects only** (not present in this repo): `.ai-pm/state/current.md` holds the live Execution State and `.ai-pm/features/<topic>.md` holds the in-flight transient dossier (no archive dir — see `### Keep only what's actually used; throw the rest away`); `.ai-pm/contracts/<feature>.md` files hold one Product Contract per user-facing feature; `.ai-pm/reviews/<topic>_advocate.md` / `bootstrap_advocate.md` hold the `pm-product-advocate` product-readiness gap reports + the orchestrator-owned `## Resolutions` trail.

**Note on adapter trees vs source:** `.claude/` and `.opencode/` are **generated** from `src/` + `gen/`; they are committed (shipped pre-built so downstream needs no build) but are not the authored source — edits go to `src/` + the per-harness manifest and are regenerated, and the `single-source-diff-clean` guard fails on a hand-edit of a generated file.

Local-only and ignored paths (`.reviews/`, `.claude/worktrees/`) are not part of the delivered surface.

---

## Integration contract (template ↔ downstream)

How a downstream project consumes the template, and what it commits to in return.

**Consumption:**

1. **Submodule at `.ai-pm/tooling/`.** Downstream runs `git submodule add git@github.com:aadegtyarev/ai-pm-protocol-uni.git .ai-pm/tooling`. The template's `git` semantics (the submodule lives at `$GIT_DIR/modules/ai-pm/tooling/` in the superproject's git directory; see `doc/stack-notes.md` § "git" submodule data model) apply. Default `git clone` of the downstream does not check out the submodule — `--recurse-submodules` or `git submodule update --init` is required (gotcha documented in `doc/stack-notes.md` § "git").
2. **Symlinks for agents, commands, settings.** Downstream creates three symlinks pointing into the submodule:
    - `.claude/agents` → `../.ai-pm/tooling/.claude/agents`
    - `.claude/commands` → `../.ai-pm/tooling/.claude/commands`
    - `.claude/settings.json` → `../.ai-pm/tooling/.claude/settings.json`

    Submodule update therefore propagates new agent personas, command procedures, and hooks without any downstream merge.
3. **WORKFLOW.md imported via `@`-directive.** Downstream `CLAUDE.md` contains the line `@.ai-pm/tooling/WORKFLOW.md` — Claude Code expands it inline at session start. Orchestration rules update with the submodule pointer. The `@`-line itself is byte-unchanged and now imports only the thin constitution + router core; its `workflow/*.md` topic siblings ride the same submodule and are pulled on demand by the consuming agents / commands (read just-in-time, not `@`-imported), so they update transparently with the submodule pointer exactly as the symlinked agents / commands do. **Source:** `WORKFLOW.md` (the `Read workflow/<topic>.md` router pointers) + `doc/features/workflow-progressive-disclosure_plan.md`.
4. **Templates consumed by `/pm-bootstrap`.** On first `/pm-bootstrap` in a downstream, the command reads `.ai-pm/tooling/doc/_templates/*.tmpl` and writes filled-in counterparts into the downstream's `docs/` (e.g., `docs/architecture.md`, `docs/user-journeys.md`, `docs/stack-notes.md`). After bootstrap the downstream owns those files — they are not symlinked, they live in the downstream's own history.

**Version bumping:** When downstream wants a newer template version, it runs `git submodule update --remote .ai-pm/tooling`, stages the new submodule pointer, and commits with a `chore: bump ai-pm-protocol to <sha>` message. The submodule pointer is the only thing in the downstream's diff — agent / command / WORKFLOW changes are transparent. **Source:** `README.md` § "Установка" (the inline `git submodule update --remote .ai-pm/tooling` line at the end of the install block) + `WORKFLOW.md` § "Maintenance".

---

## Release flow

How a feature commit in this template becomes a published GitHub Release. Cross-checked against `.github/workflows/auto-tag.yml`.

1. **Feature branch + conventional commits.** Orchestrator branches from current `main` (`feature/<topic>`), commits atomically; `WORKFLOW.md` § "Git workflow — orchestrator owns this" documents the shape.
2. **PR opened by `pm-pr-prep`.** Agent bumps the version, edits `CHANGELOG.md` (adds a `## [<VERSION>] — <DATE>` section under `## [Unreleased]`), pushes the branch, opens (or updates) the PR via `gh pr create` / `gh pr edit`.
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

N/A — no UI. The PM-facing surface is conversational (Claude Code chat); the developer-operator surface is slash commands (`/pm-bootstrap`, `/pm-plan`, `/pm-audit`, `/pm-research`) and Markdown files. There is no graphical interface to design.
