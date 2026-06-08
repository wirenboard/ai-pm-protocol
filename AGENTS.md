<!--
  AGENTS.md — OpenCode entry surface for the ai-pm protocol.

  Emitted verbatim by gen/generate.py (it is a build product, authored once
  here in src/manifests/opencode/AGENTS.md and copied to the repo root). Do not
  hand-edit the generated copy — edit this source and regenerate; the
  single-source-diff-clean guard fails on a hand-edit.

  OpenCode reads AGENTS.md as an always-on instruction surface
  (https://opencode.ai/docs/rules/). The protocol's always-on core
  (WORKFLOW.md) is loaded via the `instructions` array in opencode.json, not by
  an in-file import (OpenCode does not parse @-references inside an instruction
  file).
-->

# ai-pm protocol — OpenCode adapter

> **PREVIEW — CORE enforcement present (verified subagent-effective on OpenCode
> 1.16.2), full certification still pending.** The OpenCode adapter is shipped as
> a **labeled preview**. It builds the protocol's agents, commands, always-on
> instruction surface, and the **CORE enforcement plugin** from the same
> harness-neutral source as the Claude Code adapter. The CORE deny-list
> enforcement (`.opencode/plugin/ai-pm-enforcement.js`) is **verified
> subagent-effective on OpenCode 1.16.2** (Spike B, 2026-06-07): a plugin
> `tool.execute.before` hook **does** fire for — and deny — a tool call made by a
> `task`-spawned subagent (the subagent runs in its own child session; the
> per-instance hook intercepts it). This resolves the disputed upstream issue
> [#5894](https://github.com/anomalyco/opencode/issues/5894) **in our favor on
> 1.16.2**. **Version-pinned caveat:** this is verified on **1.16.2** only —
> #5894 is historically version-sensitive, so **re-verify on every OpenCode
> upgrade**. The plugin now enforces the **same clear-DENY set as the Claude
> adapter** — role-duplicator (`task`/`skill`), read-boundary, truncating-write,
> and the `find`-boundary guard (a `find` whose first absolute-path argument
> resolves outside the project root). The adapter is still **not fully
> certified**: only the **"ask"-class** guards remain not-yet-ported (see the
> divergence below — a permission-config follow-up). The control-layer model (the
> reviewer model governing the four checking agents) defaults to the session model
> with **no baked pins**; the override is a four-line personal-config block in the
> PM's own `opencode.json` (see the control-layer section below). Treat OpenCode as
> a preview harness, **never** as fully-supported, until certification lands.
> "Preview" must never be read as "certified".

## Always-on protocol route (no per-prompt hook on OpenCode)

OpenCode has **no `UserPromptSubmit`-equivalent hook** that can inject context
on each prompt (the Claude Code adapter uses one to fire a change-intent route
reminder per prompt). On OpenCode that reminder is therefore baked into this
**always-on** instruction surface instead of per-prompt injection — it applies
**at all times**, not only when a change-intent prompt is detected. Behavioural
difference to record: on Claude the reminder is **change-intent-triggered**
(fires when the prompt looks like a repo-change request); on OpenCode it is
**always-on** (this section, read every session). The guidance:

> **Repo-change requests follow the protocol.** For any request that changes the
> repository (implement / refactor / feature / fix / add / change / build /
> commit / merge / remove / rename / extract / update), follow `WORKFLOW.md`:
> Step 0 git/branch check, then `/pm-plan` (or `/pm-fixup` if trivial) →
> `pm-coder` → review loop → `pm-pr-prep`. The orchestrator does not edit content
> artifacts (code, schemas, `docs/architecture`, plans, contracts) directly —
> spawn the owning `pm-*` agent. Do **not** load `wb-*` role skills
> (coder / plan-feature / design-review / code-reviewer / pr-author / workflow)
> for code/PR/commit work; use the `pm-*` equivalents (this is also enforced —
> see the CORE enforcement plugin). `code-review`, `deep-research`, and `wb`
> knowledge skills (codestyle, packaging, platform) stay available and should be
> used when relevant. **Exception:** a PM-authorized diagnostic probe
> (runtime/local, to test a hypothesis) is a throwaway spike, not a feature — do
> not route it through `/pm-plan`; propose it in plain language with
> before→after and get an explicit yes first (`WORKFLOW.md` Step A.5). Surface
> substantive PM decision-forks (scope, accept-vs-fix, which-of-N,
> prioritization) via the structured-question tool, not plain prose; simple
> yes/no proceed-gates may stay prose.

## The orchestrator seat — the shipped `ai-pm` PRIMARY agent runs the protocol

On OpenCode the protocol **orchestrator** is a **first-class shipped PRIMARY
agent: `ai-pm`** (`.opencode/agent/ai-pm.md`) — **not** the default `build`
primary. `build` is a do-it-all coder whose persona and `write`/`edit` tools
dominate the layered protocol instructions, so it authors content itself instead
of delegating; the protocol therefore ships its own orchestrator primary whose
**identity is the orchestrator** (its body is the system prompt). The **persona is
the enforcement**: the orchestrator authors only its own artifacts and delegates
code + canonical docs — the structural mirror of how the Claude orchestrator is
held by its system prompt (full `write`, no tool block, simply doesn't author
content).

`ai-pm` is the seat that reads this `AGENTS.md` and the always-on core
(`WORKFLOW.md`, loaded via the `instructions` array — see below), drives the
Step 0–7 pipeline, **delegates** every code + canonical-doc artifact to the owning
`pm-*` subagent (code → `pm-coder`, architecture/canonical docs → `pm-architect`,
planning/checks → the matching `pm-*`) via `task`, and authors its **own**
artifacts itself — the feature plan during planning + `.ai-pm` bookkeeping. It owns
the three things subagents must not do, **plus** the scoped-authoring discipline:

- **scoped `write` / `edit`** — `ai-pm` **keeps** the `write`/`edit` tools because
  it legitimately authors its own artifacts: the **feature plan** during planning
  (`/pm-plan` is its own PM conversation, not a subagent) and the **`.ai-pm`
  bookkeeping** (state, backlog, contracts, decision/resolution trails), exactly as
  the Claude orchestrator does. It does **not** author source code or the canonical
  `docs` (architecture, product, journeys, …) — those route to `pm-coder` /
  `pm-architect`. The **persona is the primary enforcement** (proven live): the body
  states the orchestrator authors only its own artifacts and delegates code /
  canonical docs. An earlier slice carried a per-agent **path-`permission`** map
  (allow `.ai-pm/**` + `doc/features/**`, deny `**`) as a structural hint; it was
  **removed** because it was broken AND bypassable. Broken: OpenCode matches the
  globs against **absolute** paths, so the project-relative globs never matched and
  **every** orchestrator write fell through to `**: deny` — denying the legitimate
  `.ai-pm` writes the orchestrator must make. Bypassable: `bash` (needed for git +
  bookkeeping) routes around any tool/permission restriction, so the block gave zero
  real protection. **The real structural backstop now lives in the enforcement
  plugin** (the actor/path-aware write guards — see the plugin description below):
  it denies the orchestrator authoring content paths (source / canonical docs) via
  `write`/`edit` **or** `bash` redirect — the airtight backstop the removed
  permission map could not be — while leaving subagents (who author source
  legitimately) untouched and denying **any** out-of-root write for **every** actor.
- **`question`** — surface PM decision-forks via the structured-question tool.
  This grant is given to the **primary only**: `.opencode/opencode.json` carries a
  top-level `permission: { question: "allow" }`, which the OpenCode loader resolves
  to a `question: allow` rule on the primary (<https://opencode.ai/docs/permissions/>).
  The **`pm-*` subagents keep `question: deny`** — each subagent's frontmatter
  re-denies `question` so the top-level allow does **not** cascade onto it
  (last-match-wins). A subagent **returns findings to the orchestrator**; it never
  prompts the PM directly. Verified on OpenCode 1.16.2: the primary resolves
  `question` to `allow`, every `pm-*` subagent resolves it to `deny`.
- **`task`** — spawn the `pm-*` subagents (the protocol roles) and the
  review/research engines. Granted in `ai-pm`'s `tools` map.
- **`skill`** — run protocol skills. Granted in `ai-pm`'s `tools` map.

**Running the orchestrator.** `ai-pm` is wired as the **default primary** via the
top-level `default_agent: "ai-pm"` key in `.opencode/opencode.json`
(<https://opencode.ai/docs/config/>), so a plain `opencode` (or
`opencode run …`) in a downstream starts the orchestrator, **not** `build`. (To
reach a built-in primary deliberately, `opencode run --agent build …`.) Verified
on OpenCode 1.16.2: `opencode agent list` shows `ai-pm (primary)`, and the loader
accepts the config (`opencode debug config --pure`, exit 0).

The `pm-*` agents are **subagents**: the orchestrator spawns them with `task`, they
do their scoped work (read, write their artifact, run tests) and return findings.
They do not surface forks to the PM themselves — that is the orchestrator's seat.

## Review + research engines — OpenCode ships its own (no built-ins)

On Claude the protocol delegates technical-quality review to the **built-in
`code-review` engine** and deep research to the **built-in `deep-research`
engine**. **OpenCode has no built-in equivalents** (verified on 1.16.2: the
built-in agents are only `build` / `plan` / `general` / `explore` — no review or
research engine). So this adapter **ships its own** review and research
subagents, and the orchestrator delegates to them via the `task` tool:

- **`code-review`** (`.opencode/agent/code-review.md`) — reviews the current git
  diff for correctness bugs and reuse/simplification/efficiency cleanups, and
  returns a concise `file:line` findings list. This is what the protocol's review
  step (`WORKFLOW.md` Step 5, Pass 2) delegates to on OpenCode in place of the
  Claude built-in.
- **`deep-research`** (`.opencode/agent/deep-research.md`) — does multi-source
  web research and returns a cited synthesis. This is the OpenCode binding for any
  protocol delegation to the `deep-research` engine.

These are **OpenCode-only**: Claude keeps its built-ins, so the two files are
**not** added to the Claude adapter and are not shared neutral bodies. Their
agent ids stay `code-review` and `deep-research` (matching the protocol's
delegation points), and they are **allowed engines** — the enforcement plugin's
`wb-*` role deny-list does **not** include them (the same way `code-review` /
`deep-research` are not gated on Claude).

> **PREVIEW honesty.** These are solid **single-agent** engines — they are **not**
> a replica of Claude's **multi-agent** `code-review` / `deep-research`.
> `code-review` is a **compact one-pass reviewer** (one subagent reads the diff
> once and reports all aspects — security, stability, conventions, regressions,
> test-coverage, simplification, documentation, plan-compliance, architecture — in
> one structured report, with plan-compliance a hard blocker). Both engines run on
> the **session model by default**; `code-review` is one of the four checking
> agents, so a reviewer model can be pointed at it via the control-layer block (see
> the control-layer section below). Treat them as capable engines, not as a
> drop-in equal of the Claude built-ins.

## Control-layer model — a four-line personal-config block (not a template pin)

The protocol's control-layer rule is: the **four checking agents** —
`code-review`, `pm-auditor`, `pm-plan-checker`, `pm-product-advocate` — run on a
**reviewer model when the PM sets one, else the session model**. One choice
governs the whole checking layer; the adapter bakes **no** per-agent model pin.

**The default is the session model — with zero config.** The shipped
`.opencode/opencode.json` sets only the top-level `model`
(`deepseek/deepseek-v4-pro` in this preview); **every** generated agent —
producers, the orchestrator, the engines, and the four checking agents — inherits
it. There are **no baked per-agent `model:`/`variant:` pins** in any agent
frontmatter, so there is nothing to clobber on a protocol bump.

**The "reviewer model is set" half is a four-line block the PM pastes into their
OWN `opencode.json`.** OpenCode has **no native cross-agent model inheritance**
and **no runtime per-`task` model override** (PR
[anomalyco/opencode#17577](https://github.com/anomalyco/opencode/pull/17577) is
**closed, not merged**), so there is **no one-line knob**. The control-layer
override is therefore **four lines, not one** — one `agent.<id>.model` entry per
checking agent:

```jsonc
// in YOUR opencode.json (survives a protocol bump — the generator never touches
// keys it does not own). Point the four checking agents at one reviewer model:
"agent": {
  "code-review":         { "model": "<your-reviewer-model>" },
  "pm-auditor":          { "model": "<your-reviewer-model>" },
  "pm-plan-checker":     { "model": "<your-reviewer-model>" },
  "pm-product-advocate": { "model": "<your-reviewer-model>" }
}
```

It is the **closest-to-one-knob** option that is bump-surviving and native: one
model string, repeated across the four checking agents, living entirely in the
PM's config layer. Omit the block and all four inherit the session. The canonical
block + rationale + the spike-verified facts live in `doc/stack-notes.md`
(OpenCode § control-layer model). **Do not read this as "one line"** — OpenCode
has no cross-agent model set, so it is four `agent.<id>` entries.

> **PROVISIONAL preview default — change it for your provider.** DeepSeek is the
> **only authenticated provider** in this preview environment, so
> `deepseek/deepseek-v4-pro` (session) is a **preview default, not a
> recommendation**. The session model is **single-sourced** in the `models` block
> of `src/manifests/opencode/adapter.json` (one value); change it and regenerate —
> the model id is **never** hand-edited into individual agent files. The
> control-layer reviewer model is set separately in the PM's own `opencode.json`
> per the four-line block above.

## Supported harnesses

This protocol explicitly supports the following harnesses. The supported set is
declared here — it is **not** to be inferred from which adapter folder happens
to be present:

- **Claude Code** — fully supported (the self-host harness).
- **OpenCode** — **preview** (this adapter; not yet enforcement-certified —
  see the preview label above and the upstream gaps below).

## Named upstream gaps (why OpenCode is preview, not certified)

The OpenCode adapter tracks two named upstream gaps. One still blocks
certification; the other was **verified in our favor on 1.16.2** (so the CORE
enforcement plugin now ships), with a version-pinned caveat:

1. **Runtime per-task model override is unavailable (still a gap; control-layer
   model handled by personal config instead).** OpenCode's `task` tool has no
   per-invocation `model` parameter, and there is **no native cross-agent model
   inheritance**. The implementing PR
   **[anomalyco/opencode#17577](https://github.com/anomalyco/opencode/pull/17577)**
   ("add model override for task tool subagents") is **CLOSED, NOT MERGED**.
   Consequence: the protocol's control-layer-model rule (one reviewer model for
   the four checking agents) cannot be a runtime override or a one-line knob on
   OpenCode — so the reviewer model lives in a **four-line `agent.<id>.model`
   block in the PM's own `opencode.json`** (see the control-layer section above),
   and the adapter bakes **no** per-agent pins. This is a working approach, not a
   blocker: the default is the session model with zero config, and the override
   is bump-surviving because it lives in the PM's config, not the template.

2. **Subagent tool-hook containment — VERIFIED in our favor on 1.16.2
   (version-pinned).** Whether a plugin's `tool.execute.before` hook reliably
   constrains a `task`-spawned subagent's tool calls was disputed upstream —
   issue
   **[anomalyco/opencode#5894](https://github.com/anomalyco/opencode/issues/5894)**
   ("Plugin hooks don't intercept subagent tool calls — security policy
   bypass") is **CLOSED as DISPUTED**, not by a merged fix. **Spike B
   (2026-06-07) verified, on OpenCode 1.16.2, that the hook DOES fire for and
   deny a `task`-spawned subagent's tool call** — so the CORE enforcement plugin
   is **subagent-effective** here, and it **is** shipped in this preview.
   **Version-pinned caveat:** verified on **1.16.2** only; #5894 is historically
   version-sensitive, so **re-verify on every upgrade**. If a future version
   regresses, the plugin's subagent containment must be re-treated as
   best-effort until re-verified.

## Enforcement divergence — the "ask"-class guards are not ported

The Claude Code adapter's `settings.json` carries some guards whose decision is
**"ask"** (prompt the human to confirm) rather than a hard deny: force-push
(`git push --force`), `git commit --no-verify` / `--no-gpg-sign`, ssh + remote
content-edit, and ssh + remote mutating action. **OpenCode's
`tool.execute.before` hook can only throw (hard deny) or allow — it has no "ask"
return** — so these guards have **no faithful equivalent in this plugin** and are
**intentionally not ported**. Forcing them into hard throws would be wrong
(it would block legitimate, PM-confirmed actions). They map instead to OpenCode's
**permission** configuration (<https://opencode.ai/docs/permissions/>), a later
slice. Until then, the "ask"-class guards are a **documented divergence**: the
OpenCode adapter enforces the **same clear-DENY guards as the Claude adapter**
(role-duplicator spawn/skill deny, read-outside-root, destructive truncating
write, and the `find`-outside-root boundary deny) but **not** the "ask"-class
ones. The clear-DENY set is now at **parity**; only the "ask"-class guards
remain a divergence (a permission-config follow-up). Do not read the CORE plugin
as full parity with the Claude `settings.json` **for the "ask"-class guards**.

## What this adapter ships (preview scope)

- The `pm-*` **subagents** under `.opencode/agent/` (built from the neutral
  bodies; OpenCode frontmatter shape per
  <https://opencode.ai/docs/agents/>).
- The `/pm-*` **commands** under `.opencode/command/` (the neutral command
  bodies).
- The always-on core wiring via the `instructions` array in
  `.opencode/opencode.json` (the OpenCode analogue of the Claude `@`-import;
  <https://opencode.ai/docs/config/>).
- The **CORE enforcement plugin** `.opencode/plugin/ai-pm-enforcement.js`
  (`tool.execute.before` throws to deny — <https://opencode.ai/docs/plugins/>),
  which **auto-loads** from `.opencode/plugin/` (no `opencode.json` registration
  needed — and an explicit `plugin` entry would double-register it, so it is
  deliberately absent). Its wb-* role deny-list is **single-sourced** from the
  Claude `settings.json` (one authored copy, no drift). It enforces the **same
  clear-DENY guards as the Claude adapter** — role-duplicator (`task`/`skill`),
  read-outside-root, truncating write, and the `find`-outside-root boundary —
  only the "ask"-class guards remain not-yet-ported (see the divergence above).
  It **additionally** carries two actor/path-aware write guards that
  **structurally backstop the orchestrator persona** — the real backstop the
  removed path-`permission` could not be:
  - **Out-of-root write deny (ALL agents).** A `write`/`edit` whose target, or a
    `bash` command whose parsed write-target (redirect `>`/`>>`, `tee`, `sed -i`,
    `cp`/`mv` destination, `dd of=`), resolves **outside** the project root is
    denied for **every** actor — closing the live boundary breach where the
    orchestrator wrote `/tmp/nula-dev.log` (use a project-local temp, e.g. a
    gitignored `.ai-pm/tmp/`, never `/tmp`). Needs no actor lookup.
  - **Orchestrator content-authoring deny (subagents exempt).** In the
    **orchestrator (primary) session only**, a `write`/`edit`/`bash`-write that
    targets a **content path** — inside the root but **not** under `.ai-pm/` and
    **not** a `doc/features/**` plan (the orchestrator's own artifacts), and not a
    pure git op — is denied: the orchestrator authors only its plan + `.ai-pm`
    bookkeeping; code routes to `pm-coder`, canonical docs to `pm-architect`.
    **Subagents** (e.g. `pm-coder`) author source legitimately and are **not**
    subject to this. The actor is resolved via the plugin client
    (`ctx.client.session.get` — a primary session has **no** `parentID` / agent id
    `ai-pm`; a `task`-spawned subagent has `parentID` set); the lookup **fails open**
    on the actor (a lookup miss is treated as a subagent, never a false denial — the
    persona is the fail-safe). This closes the live bug where the orchestrator
    authored a source file via `bash cat > …`, routing around the old tool/permission
    restriction.

The **session model** is shipped as a **PROVISIONAL preview default**
(`deepseek/deepseek-v4-pro`), single-sourced in `adapter.json`'s `models` block —
every generated agent inherits it, with **no baked per-agent pins**. The
control-layer model (the reviewer model governing the four checking agents) is the
PM's own four-line `opencode.json` block, **not** a template pin — OpenCode has no
native cross-agent model inheritance and no runtime per-task model override
(#17577). See the control-layer section above + `doc/stack-notes.md`.
