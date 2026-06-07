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
> upgrade**. The adapter is still **not fully certified**: the "ask"-class guards
> are not yet ported (see the divergence below) and full cross-model review
> wiring is a later slice. Treat OpenCode as a preview harness, **never** as
> fully-supported, until certification lands. "Preview" must never be read as
> "certified".

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

1. **Runtime per-task model override is unavailable (still a gap).** OpenCode's
   `task` tool has no per-invocation `model` parameter. The implementing PR
   **[anomalyco/opencode#17577](https://github.com/anomalyco/opencode/pull/17577)**
   ("add model override for task tool subagents") is **CLOSED, NOT MERGED**.
   Consequence: the protocol's cross-model review/audit mechanism cannot rely
   on a runtime model override on OpenCode — a reviewer/auditor model must be
   pinned in agent frontmatter instead (a later slice).

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
OpenCode adapter enforces the CORE clear-DENY guards (role-duplicator spawn/skill
deny, read-outside-root, destructive truncating write) but **not** the "ask"-class
ones. Do not read the CORE plugin as full parity with the Claude `settings.json`.

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
  Claude `settings.json` (one authored copy, no drift). It enforces the CORE
  clear-DENY guards only — see the "ask" divergence above.

The cross-model **model pins** are intentionally **not** shipped in this preview
— see upstream gap #17577.
