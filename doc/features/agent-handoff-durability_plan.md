# agent-handoff-durability — plan

Decision authority: autonomous

Source: selected autonomously per ### Decision authority; source: `.ai-pm/backlog.md` § "Agent-handoff durability when 'continue the same agent' is unavailable" (2026-06-04).

## Scenarios

1. **`workflow/state.md` states the durable-handoff principle.** A new paragraph in "How state is kept" makes explicit: the durable hand-off between agents is what is on disk — `state/current.md`, the review file, any scratch note — not what is in agent memory. `continue-the-same-agent` is an optional optimization: it saves tokens when available, and breaks nothing when it is not. The protocol must never depend on it.

2. **`pm-coder` flushes its analysis before stopping.** The existing "## When to stop and ask" section gains a preamble rule: before yielding control on any stop condition, write the work-so-far to `.ai-pm/state/current.md` (or the feature's review file) — what was checked, what conflict was found, what remains. Then report the stop reason to the orchestrator. "Hand-off = a file, not a lost context." This extends the existing stop-and-report path from *report-the-conflict* to *also-flush-the-analysis*, so the successor/orchestrator does not have to re-derive the analysis from scratch.

3. **`workflow/pipeline.md` Step 4 names the fresh-agent-with-brief path as the standard.** When a coder stops at a blocking question and cannot be continued, the orchestrator spawns a fresh agent with a brief that explicitly quotes the stopped agent's conclusions from disk (the flushed `state/current.md` or review file). This is not an emergency workaround — it is the protocol's designed fault-tolerance path, made explicit so the orchestrator does not treat it as a special case.

## Existing behaviors this feature touches

- `workflow/state.md` § "How state is kept" — gains the durable-handoff paragraph. The three-channels-to-PM section and the contract / state-archive descriptions are unchanged.
- `.claude/agents/pm-coder.md` § "## When to stop and ask" — the existing stop conditions are unchanged; the new flush-before-stop preamble is additive.
- `workflow/pipeline.md` Step 4 — the coder-implements step gains one sentence naming the fresh-agent-with-brief path. The rest of Step 4 is unchanged.

## Contracts

(No Product Contract — protocol orchestration discipline; not user-facing product behavior. No human-role subject.)

## Stack expectations touched

(None — Markdown prose additions to three protocol files. No library, format, or external-system idiom touched.)

## Interaction scenarios

Provably isolated: prose additions to three protocol files. No shared mutable state, no concurrency, no I/O. No adjacent feature interference — these are orchestrator-discipline rules, additive to existing stop rules.

## Test plan

- Existing tests that must pass: all `tests/hooks.sh` — untouched (no hook touched); confirm 73/73.
- New tests: **none** — Markdown protocol-discipline change in a markdown-prose repo with no runtime to host a test for "did the agent flush its analysis before stopping." Verification is editorial: Pass-1 plan-compliance (three files updated, the flush-before-stop rule is in pm-coder, the durable-handoff principle is in state.md, the fresh-agent path is in pipeline.md) + Pass-2 `code-review` over the diff.

## Docs to update

- `doc/architecture.md`: a short decision record — "Agent-handoff durability: durable hand-off = files (state/current.md + review file), not agent memory; `continue-the-same-agent` is an optional optimization; `pm-coder` flushes analysis before any stop; orchestrator spawns a fresh agent with a disk-sourced brief when the same agent cannot be continued. Single-source discipline: principle in `workflow/state.md`, flush rule in `pm-coder.md`, orchestrator path in `workflow/pipeline.md` Step 4." Authored by `pm-architect` post-coding.

(README not touched — no install/quickstart/architecture-one-liner/doc-pointer change.)

## Key design decisions

- **Flush to `state/current.md`, not a new scratch file.** The state file is already the established durable artifact every agent reads on resume. Writing analysis there (under `## Work in progress` or updating `## Remaining`) requires no new file and is immediately available to the orchestrator and the replacement agent. A separate scratch note is an option for long analyses but the default is the state file.
- **"Flush before stop" as a preamble, not a new stop condition.** The flush is a *how-to-stop* rule, not an additional *when-to-stop* trigger. It is placed as a preamble to the existing stop conditions so it reads "before any stop: flush, then report" rather than as a 10th bullet in a list.
- **Only pm-coder in scope.** The flush rule goes to `pm-coder` because it is the agent most likely to accumulate valuable mid-task analysis before a blocking stop (130k-token code analysis, found conflict, must report). Other agents (`pm-plan-checker`, `pm-architect`, `pm-stack-researcher`) have shorter, more bounded tasks; they are not changed here. If the pattern recurs for other agents it can be promoted to the shared guidance in a future feature.
- **Fresh-agent-with-brief is the standard, not an emergency.** Naming it explicitly in `workflow/pipeline.md` Step 4 removes ambiguity: the orchestrator does not need to improvise. The brief template is: "Stopped agent flushed its analysis to `state/current.md`. Read it first, then continue from where it left off."

## Out of scope

- **A hook to enforce flush-before-stop** — not feasible; "did the agent flush before stopping?" is a semantic judgement (the no-hook-for-semantic-judgement family).
- **Other pm-* agents** — deferred; pm-coder is the primary case. Generalized guidance can be a future feature.
- **Changing what agents are allowed to write** — only `state/current.md` (already writable by all agents) and the review file (pm-plan-checker and pm-coder already write it) are the flush targets; no new file-ownership changes.
- **State-archive home** — separate feature (shipped); this feature is about mid-task analysis flush, not post-task archive.
