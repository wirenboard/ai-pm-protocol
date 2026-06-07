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

> **PREVIEW — not yet enforcement-certified.** The OpenCode adapter is shipped
> as a **labeled preview**. It builds the protocol's agents, commands, and
> always-on instruction surface from the same harness-neutral source as the
> Claude Code adapter, but it is **not** certified for enforcement parity: the
> deny-list enforcement plugin and full cross-model review wiring are later
> slices, and two upstream OpenCode gaps (named below) remain open. Treat
> OpenCode as a preview harness, **never** as fully-supported, until those gaps
> close and certification lands. "Preview" must never be read as "certified".

## Supported harnesses

This protocol explicitly supports the following harnesses. The supported set is
declared here — it is **not** to be inferred from which adapter folder happens
to be present:

- **Claude Code** — fully supported (the self-host harness).
- **OpenCode** — **preview** (this adapter; not yet enforcement-certified —
  see the preview label above and the upstream gaps below).

## Named upstream gaps (why OpenCode is preview, not certified)

The OpenCode adapter waits on two named upstream gaps before it can be
certified for enforcement and cross-model parity:

1. **Runtime per-task model override is unavailable.** OpenCode's `task` tool
   has no per-invocation `model` parameter. The implementing PR
   **[anomalyco/opencode#17577](https://github.com/anomalyco/opencode/pull/17577)**
   ("add model override for task tool subagents") is **CLOSED, NOT MERGED**.
   Consequence: the protocol's cross-model review/audit mechanism cannot rely
   on a runtime model override on OpenCode — a reviewer/auditor model must be
   pinned in agent frontmatter instead (a later slice).

2. **Subagent tool-hook containment is unsettled.** Whether a plugin's
   `tool.execute.before` hook reliably constrains every action a `task`-spawned
   subagent takes is disputed upstream — issue
   **[anomalyco/opencode#5894](https://github.com/anomalyco/opencode/issues/5894)**
   ("Plugin hooks don't intercept subagent tool calls — security policy
   bypass") is **CLOSED as DISPUTED**, not fixed by a merge. Consequence: the
   deny-list enforcement plugin is a later slice, gated on a spike that
   verifies subagent containment; until then OpenCode enforcement is
   best-effort, not subagent-proof, and is not shipped in this preview.

## What this adapter ships (preview scope)

- The `pm-*` **subagents** under `.opencode/agent/` (built from the neutral
  bodies; OpenCode frontmatter shape per
  <https://opencode.ai/docs/agents/>).
- The `/pm-*` **commands** under `.opencode/command/` (the neutral command
  bodies).
- The always-on core wiring via the `instructions` array in
  `.opencode/opencode.json` (the OpenCode analogue of the Claude `@`-import;
  <https://opencode.ai/docs/config/>).

The deny-list **enforcement plugin** and the cross-model **model pins** are
intentionally **not** shipped in this preview — see the named upstream gaps.
