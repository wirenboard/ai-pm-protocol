# Fork primitive adoption for orchestrator direct-work (solo/lite)

**Status: adopted (2026-07-08) — recommendation "adopt with guards"; implemented as `tool-map.json` `fork-for-direct-work` entry + orchestrator prose (`## Your seat` profile ladder).**

**Question (2026-07-08, issue #376).** Should the protocol adopt the Claude Code `fork`
agent primitive for the Orchestrator's own direct work in `solo`/`lite` profiles, where
the Orchestrator plans or builds in-session and every tool call (file reads, searches,
test runs) floods the main context window?

**Recommendation: adopt with guards** — optional adapter entry in `tool-map.json`,
fail-safe fallback to today's in-session-direct behavior, with four conditions that must
hold before any OpenCode adoption. Zero core edit, zero deny-rule change. Fork is
explicitly prohibited from the Reviewer seat by its own definition. Details below.

---

## What fork is

`fork` is a Claude Code `Task`-tool invocation with `subagent_type: "fork"`. It differs
from a regular `Task` (the Builder/Reviewer spawn) in one critical way: **a fork inherits
the parent session's full rendered context** — system prompt, tool definitions, conversation
history, and model — byte-for-byte. The fork's own tool calls stay in the fork's context
window; only the final result surfaces to the parent. The parent session's context stays
clean.

Key properties (sourced — see `## Sources`):

| Property | Fork | Task (regular spawn) |
| --- | --- | --- |
| Context | Inherits full parent context | Fresh, starts blank |
| System prompt | Parent's rendered system prompt | The spawned agent's own |
| Model | Parent's session model | Baked per-seat pin or `session` |
| Cross-model | No — always the parent model | Yes — a different baked pin is possible |
| Tool output in parent | No — stays in fork's window | No (same) |
| Prompt-cache reuse | Yes — byte-identical prefix | No |
| Independence | None — full shared context | High — blank-slate context |
| Can spawn further forks | No | Yes (Task can re-fork) |
| Rollout | Default from CC v2.1.161; opt-in (`CLAUDE_CODE_FORK_SUBAGENT=1`) before | Always available |

---

## 1. Fit — where fork helps and where it must not be used

### Where fork genuinely helps

In `solo`/`lite`, the Orchestrator plans or builds directly in the main session. Without
fork, every tool call — reading files to understand the codebase, running tests, checking
outputs — writes its result into the main session's context window. Over a multi-step build
beat this is the primary driver of the context degradation `orchestrator.md ## Your seat`
warns about ("Session-reset hygiene — reset on felt context degradation"). A reset is
expensive: the session re-reads everything from the resume pointer.

Fork addresses this directly: the Orchestrator delegates the execution work to a fork. The
fork has the full context it needs (inherited), does the heavy lifting (file reads, writes,
tool calls), and returns only the result. The parent's context window stays at the
pre-fork mark. Resets are less frequent; the "precious long-lived session kept clean"
argument (the same one that justified the Builder/Reviewer being spawned rather than
done in-session — `docs/decisions/planning-model-split.md` `## The three options`) applies
here too, at the sub-role level.

The benefit is real and non-trivial. It maps cleanly to an existing, documented pain point
in the protocol's own orchestrator procedure, without any new role, new model, or core
edit.

### Where fork must NOT be used

**The Reviewer seat — never.** The single most important reliability invariant is that the
Reviewer has a fresh, independent context (invariant 3, `PROTOCOL.md ## Invariants`: "a
gate is satisfied only by a fresh spawn this turn"). A fork inherits the full parent
context, including everything the Builder produced. A Reviewer running as a fork would be
checking its own footprints — the independence guarantee is destroyed. The `Task`
cold-spawn is required for the Reviewer, full stop.

**The Planner seat (full profile) — never.** The Planner's plan-adversary and elicitation
modules derive their value from not having seen the solution yet. A fork of the session
that just read the codebase and drafted a plan would have the same bias as the session.
Spawn a fresh `Task` for the Planner.

**Summary of the invariant:** fork is a **context-preserving efficiency tool for the
Orchestrator's own direct work**. It must never fill a protocol seat that requires a
fresh, independent context. The distinction the architecture file draws — "separation is
load-bearing, not cosmetic" (`docs/architecture.md ## Actor model`) — applies here at full
strength.

---

## 2. The crux — enforcement and actor interaction

This is the load-bearing question: does adding fork create a hole in the mechanical
deny layer?

### On Claude (the only platform where fork currently exists)

The Claude shim (`src/adapter/claude/shim.mjs`) explicitly leaves `isOrchestrator`
undefined for every hook payload:

> "`isOrchestrator` is intentionally left undefined: a Claude hook payload carries
> no session-role signal, so the actor-dependent rules (orchestrator-authors-content,
> stamp-write) fall back to persona by the engine's fail-open-on-actor contract. This is
> the documented Claude capability gap, not an omission."

The two actor-dependent rules — `orchestratorWritingContent` and
`orchestratorWritesReviewStamp` — both check `if (!input.isOrchestrator) return false`
first (`src/adapter/engine.mjs` lines 149, 169). On Claude, `isOrchestrator` is always
undefined → always returns false → always allows. These rules are already persona-only on
Claude, for the Orchestrator itself today.

**Fork changes nothing on Claude.** A fork of the Orchestrator has the exact same
enforcement posture as the Orchestrator itself: actor-dependent rules fail open (persona),
boundary/truncation/merge-gate/self-patch denies apply mechanically. No new risk from fork
on Claude.

**Profile-relaxed writes — no flip.** The `orchestratorWritingContent` predicate already
returns `false` on `lite`/`solo`/`yolo` (the profile check at `engine.mjs` line 155–156)
regardless of the actor signal. On the profiles where the Orchestrator builds directly,
the deny was already relaxed. Fork on those profiles is not a new widening.

**Stamp-write deny — no new hole on Claude.** `orchestratorWritesReviewStamp` was already
persona-only on Claude. A fork of the Orchestrator doesn't weaken it further; both the
Orchestrator and any fork run under the same persona discipline (the Orchestrator's own
instruction set, which says never write a stamp).

### On OpenCode (fork not yet available)

OpenCode resolves the actor (the stamp-write deny and orchestrator-content deny are
mechanical there). If/when OpenCode gains a fork-equivalent, the critical question becomes:
**does OpenCode's actor resolver classify a forked orchestrator session as the Orchestrator
or as a sub-agent?**

- **If classified as Orchestrator** (actor signal survives into the fork): the stamp-write deny
  fires correctly — a fork cannot write a stamp. Safe.
- **If classified as sub-agent** (the fork creates a new session context OpenCode treats as
  a child): `orchestratorWritesReviewStamp` short-circuits on the `!isOrchestrator` guard →
  the fork could write review stamps → the merge-gate stamp-presence check is defeated on
  OpenCode.

**The concrete risk:** on OpenCode, a fork of the Orchestrator might be misclassified as
a sub-agent, letting it write review stamps that the merge-gate then reads as valid. This
is not merely theoretical — the stamp-write deny's OpenCode-mechanical guarantee rests on
actor resolution, and fork adds a new session shape that resolution code was not designed
for.

**Practical status today:** fork is a Claude-only primitive. OpenCode's tool-map entry
would be `null` (see `## 4 below`), so this risk is currently academic. **It must be
verified before any OpenCode adoption** — that is one of the four conditions.

---

## 3. Crash-resume contract

Fork's tool output is hidden from the parent during execution. If the fork crashes
mid-work, the parent received no result, and the work is lost unless the fork
self-checkpointed.

The crash-resume checkpoint discipline already exists and applies to the Orchestrator:
`orchestrator.md ## Your seat` "Continuous crash-resume checkpoint" — after each
significant step, refresh the active plan's progress note. A fork inherits this instruction
(it inherits the Orchestrator's full system prompt). So the fork already carries the
obligation.

**The checkpoint protocol:**

1. The fork writes to the plan progress note (`.ai-dev/plans/<topic>.md`) at each
   significant step — same "goal · current progress · next step · open findings" format,
   superseding not appending (invariant 6). This is not a new discipline: the fork inherits
   it from the Orchestrator's instruction set.
2. On fork success: the parent writes a fresh checkpoint as it would after any spawned-role
   handback.
3. On fork crash: the parent reads the plan progress note, sees the last checkpoint the fork
   wrote, and either re-forks from that point or falls back to in-session direct work.

**Who ticks the progress note during fork execution:** the fork, not the parent. The parent
cannot tick it (it doesn't see the fork's intermediate tool calls). The fork can (it has
write access to the project root, which contains the plans directory). The discipline
follows from the inherited checkpoint instruction — no new mechanism required.

**Maximum loss on a crash:** at most one significant step (the gap between the fork's last
checkpoint write and the crash). Same ceiling as the main session's checkpoint discipline.
No regression from today's in-session-direct behavior (today, a session crash between any
two tool calls also loses at most the last significant step before a checkpoint).

---

## 4. Core/adapter shape

Following the `continue-a-sub-agent` precedent in `tool-map.json` (an optional capability
with a documented fallback and a `null` on platforms that lack it):

```json
"fork-for-direct-work": {
  "claude":   "Task(subagent_type='fork')",
  "opencode": null,
  "_fallback": "in-session-direct",
  "_doc": "Optional — fork the orchestrator session to perform direct plan/build work (solo/lite) without polluting the parent context window. A fork inherits full parent context (system prompt, model, history); its tool output stays in the fork's context, only the result surfaces. Fail-safe: absent or null => in-session-direct (today's behavior — the orchestrator works in the main session, no fork). NEVER use for the Reviewer or Planner seat: those require a fresh, non-inheriting Task spawn (invariant 3). OpenCode null: no fork-equivalent primitive available; re-check when OpenCode gains a background-inheriting subagent with verified actor classification."
}
```

**Why this is fail-safe:**

- `null` on OpenCode → in-session-direct fallback → byte-identical to today for OpenCode projects.
- No new entry in `deny-rules.json` — "fork" is not a role duplicator or generic builtin;
  the existing `spawnTargetInDenySet` predicate correctly allows it (the deny set in
  `deny-rules.json` `role_deny_set` does not list "fork").
- Zero edit to `PROTOCOL.md`, `src/adapter/engine.mjs`, `claude/shim.mjs`, or
  `deny-rules.json` (the deny floor and the constitution are untouched). The only prose
  change is a one-bullet `[persona]` guard in `src/agents/orchestrator.md` (`## Your seat`):
  when the Orchestrator may fork its own direct work + the hard Reviewer/full-Planner
  prohibition. That is the orchestrator agent (the role adapter), not the neutral core;
  the adapter-shape guarantee ("a new platform is supported by writing only its adapter,
  zero core edit" — `docs/architecture.md ## Extension points`) holds. A `parity.test.mjs`
  case pins that a `fork` spawn is not in the deny set.
- Orchestrators on platforms that choose not to implement fork simply use in-session-direct.
  No capability degrades.

---

## 5. Recommendation

**Adopt with guards** — the benefit is genuine (context protection in solo/lite), the
mechanism is clean (optional tool-map entry, fail-safe fallback), and the risk is bounded
and named. The four conditions that must hold before any broader adoption:

1. **Adapter + orchestrator-prose only, no neutral-core edit.** The fork capability is an
   adapter-layer entry in `tool-map.json` plus a one-bullet `[persona]` guard in the
   orchestrator agent (`src/agents/orchestrator.md`). No change to `PROTOCOL.md`, no new
   deny rule, no new protocol seat, no engine/shim change.

2. **Reviewer prohibition explicit.** The tool-map entry's `_doc` names the prohibition
   clearly. The rationale (invariant 3: fresh-context independence) is stated. Any
   implementation that queries the tool-map for "what does fork mean" encounters this
   prohibition immediately.

3. **Self-checkpoint obligation inherited.** The fork inherits the crash-resume checkpoint
   discipline from the Orchestrator's instruction set. No new mechanism. Record this once
   in the `_doc` so the obligation is traceable.

4. **Actor-classification pre-condition for OpenCode.** Before enabling any fork-equivalent
   on OpenCode (if/when one exists), verify that the OpenCode actor resolver classifies a
   forked orchestrator session as the Orchestrator (not as a sub-agent). The stamp-write
   deny's mechanical guarantee depends on correct actor resolution. Until verified: OpenCode
   entry stays `null`.

**What this does NOT change:**

- The Reviewer seat: always a cold `Task` spawn, never a fork. Invariant 3 is untouched.
- The full-profile Planner seat: same.
- Any existing deny rule.
- Any part of `PROTOCOL.md`.

---

## Honest limitations of this research

**Fork is a newer primitive.** Fork became default from CC v2.1.161; before that it was
opt-in via `CLAUDE_CODE_FORK_SUBAGENT=1`. Official Anthropic documentation for fork is
sparse; the behavioral details (context inheritance byte-for-byte, tool-output isolation,
prompt-cache reuse) are sourced from community reverse-engineering and third-party guides
— not from a first-party API reference as of 2026-07-08. Confidence: MEDIUM — claims are
consistent across multiple community sources but should be re-verified against official
docs before implementation.

**Hook payload for fork spawns is undocumented.** Official hook documentation treats all
subagents uniformly (SubagentStart / SubagentStop) and does not specify whether a fork
spawn (`subagent_type: "fork"`) appears distinctly in the `PreToolUse` payload. The shim's
normalisation (`case "Task": ... spawnTarget: ti.subagent_type`) would map it to
`{ act: "spawn", spawnTarget: "fork" }` if fork uses the `Task` tool name. This is
consistent with community reports (`subagent_type: "fork"` as the mechanism) but not
confirmed from a primary Anthropic source.

**Actor classification in fork is unverified.** Whether a forked session inherits the
parent's actor signal (Orchestrator vs. sub-agent) in the hook payload is not documented
in any source consulted. The Claude analysis above (`## 2`) holds because Claude never
resolves the actor anyway; the OpenCode analysis names the specific risk this gap creates.

---

## Sources

**Primary / authoritative:**

- `src/adapter/claude/shim.mjs` — the normalise() function; `isOrchestrator` is
  explicitly left undefined on Claude (the actor-resolution gap, documented inline).
- `src/adapter/engine.mjs` lines 148–178 — `orchestratorWritingContent` and
  `orchestratorWritesReviewStamp` predicates; the `!isOrchestrator → return false` pattern.
- `src/adapter/deny-rules.json` — `role_deny_set.generic_builtins` does not contain
  "fork"; `review_stamps` prefix and `orchestrator_writable` allow-set.
- `src/adapter/tool-map.json` — `continue-a-sub-agent` as the precedent for an
  optional-capability entry with null + fallback.
- `docs/architecture.md ## Actor model` — "That separation is load-bearing, not cosmetic."
- `PROTOCOL.md ## Invariants` (invariant 3) — the gate-integrity rule; the non-gate
  carve-out (Builder may be continued; Reviewer never).
- `orchestrator.md ## Your seat` — "Continuous crash-resume checkpoint"; "Session-reset
  hygiene"; the `continue-a-sub-agent` guidance the fork use-case mirrors.
- `docs/decisions/planning-model-split.md` — "disposable spawn" rationale; "disposable
  context for heavy work, the precious long-lived session kept clean."
- Claude Code sub-agents official documentation, code.claude.com/docs/en/sub-agents
  (retrieved 2026-07-08) — confirms fork mode via `subagent_type: "fork"`, limitation
  (cannot spawn further forks, incompatible with coordinator mode).

**Community / triangulated (MEDIUM confidence — consistent across multiple sources,
not a first-party API reference):**

- buildthisnow.com "Fork Subagents in Claude Code" (retrieved 2026-07-08) — fork inherits
  `renderedSystemPrompt` byte-for-byte, `useExactTools: true`, full parent message history;
  fork requires opt-in (`CLAUDE_CODE_FORK_SUBAGENT=1`); cannot spawn further forks.
- Piebald-AI/claude-code-system-prompts (CC v2.1.202, retrieved 2026-07-08) — confirms
  "calling Agent with `subagent_type 'fork'`"; "Inherited context for worktree sub-agent"
  prompt confirms context-inheritance design; fork becomes default from v2.1.161.
- Web search aggregation (2026-07-08) — "fork only triggers when subagent_type is omitted"
  (earlier behavior) vs. explicit `subagent_type: "fork"` (current behavior from
  v2.1.161+); CLAUDE_CODE_FORK_SUBAGENT=1 to enable explicitly in CI.
- official hook schema gist (FrancisBourre, retrieved 2026-07-08) — hook event types
  (PreToolUse, PostToolUse, SubagentStart, SubagentStop, etc.) treat all subagents
  uniformly; no fork-specific payload field documented.

**Negative results (recorded):**

- No first-party Anthropic documentation (as of 2026-07-08) explicitly documents the
  `PreToolUse` hook payload structure for a fork spawn, nor whether a fork session carries
  a distinct actor signal. This gap is the source of the OpenCode actor-classification
  risk (`## 2`).
- `ANTHROPIC_SMALL_FAST_MODEL` (`guardModel`) does not cover the fork mechanism (it covers
  background/small-fast calls; fork is a full-context subagent spawn — the same reasoning
  as `subagent-safety-classifier.md` applies).
