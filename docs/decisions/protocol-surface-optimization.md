# Reducing the always-loaded protocol context surface

**Status: RATIFIED (Orchestrator, autonomously — per the Operator's autonomy + auto-merge
grant, 2026-06-30).** Decision: **build levers 1 + 4 now** (decompose `## Your seat`'s
rarely-fired bodies behind triggers, and the opportunistic `## When something is off`
invariant-6 dedup) — low risk, the bulk of the win. **Resolved fork (build-time):** the
`team:false`-inert team bullets move to the on-demand procedure (gated `team:true`), NOT
into the `team-collaboration` module — lever 2 proves the module mechanism composes only
into `builder`/`reviewer`, never the orchestrator router, so a module-fold was
architecturally impossible; the procedure achieves identical `team:false`-inert
conditionality with no new assembler axis. **Lever 2 is closed** (a phantom — capability
modules already compose only into builder/reviewer, never the orchestrator router; no
saving was ever available). **Lever 3 (constitution density pass) is DESCOPED to the
backlog** — higher risk against `PROTOCOL.md`, marginal gain over levers 1+4; revisit only
if more window budget is needed (the research's own "only if" condition). The autonomous
call: the recommendation is derivable from this evidence-based research, the built part is
low-risk and reversible, and the risky part (lever 3) is the one deferred — escalation
unnecessary.

**Question (2026-06-30).** The protocol surface loads on **every** session, on top of
Claude Code's own base system prompt (~10k tokens). Together they consume roughly a
tenth of the context window before any work begins. The constitution and the assembled
orchestrator are re-injected each turn, so every k reclaimed is room returned to the
task itself and to later compaction. **How do we shrink the always-loaded surface
without losing a rule?** The win to frame the answer against is the **context window**,
not the dollar bill — a smaller, higher-signal surface both costs less and reasons
better (the external evidence below quantifies the second half).

---

## The measured surface (this session, real bytes)

Always-loaded = `PROTOCOL.md` (35,791 chars) + the assembled `.claude/ai-dev.md`
(25,711 chars) = **61,502 chars ≈ ~15.4k tokens/session**. Inside each half, by section:

**Assembled orchestrator (`.claude/ai-dev.md`, 25,711):**

| Section | chars | note |
| --- | ---: | --- |
| `## Your seat` | 13,006 | **half the file** — per-turn essentials mixed with rarely-fired sub-procedures |
| `## Side-tools` | 2,891 | already thin pointers |
| `## When something is off` | 2,201 | escalation discipline |
| `## Setup` | 1,517 | already a thin pointer (5.42.0 decompose) |
| `## Audit` | 1,341 | already thin |
| `## Multi-component coordination` | 1,063 | already thin |
| `## Backlog` | 904 | already thin |
| `## Product discovery` | 842 | already thin |
| `## Fixup` | 706 | already thin |
| `## Safeguards` | 582 | already thin |

The source `src/agents/orchestrator.md` is 26,335 chars; the assembled artifact is
25,711 — the **624-char difference** is the platform filter dropping the two
`platform:opencode` blocks (`src/adapter/modules.mjs` `filterPlatform`). So the
single-platform install is already shedding the other adapter's guidance.

**`PROTOCOL.md` (35,791):**

| Section | chars |
| --- | ---: |
| `## The loop` | 7,413 |
| `## Enforcement` | 7,249 |
| `## Invariants` | 5,986 |
| `## Project config` | 4,673 |
| `## Core and adapter` | 1,749 |
| `## Git flow` | 1,463 |
| `## Quality tools` | 1,531 |
| `## Role contracts` | 1,443 |
| `## The three roles` | 1,423 |
| `## Manifesto` | 995 |
| `## Talking to the Operator` | 962 |

The two giants — `## The loop` and `## Enforcement` — are 41% of the constitution
between them.

---

## External principles (cited)

The agent-framework field has converged on one answer to the always-loaded-surface
problem: **don't load it always.** The highest-rung sources name the mechanism and the
reason.

- **Just-in-time over pre-loading** (Anthropic, *Effective context engineering for AI
  agents*). The recommended pattern: "agents built with the 'just in time' approach
  maintain lightweight identifiers (file paths, stored queries, web links, etc.) and
  use these references to dynamically load data into context at runtime using tools."
  This is exactly the protocol's existing **side-tool pointer** pattern — a trigger
  in-core, the body in `.ai-dev/procedures/<name>.md`, read on demand.

- **Context rot — a smaller surface reasons better, not just cheaper** (same source).
  "As the number of tokens in the context window increases, the model's ability to
  accurately recall information from that context decreases." LLMs have a finite
  "attention budget"; the guiding principle is "the smallest possible set of
  high-signal tokens that maximize the likelihood of some desired outcome." This is the
  load-bearing motivation: reclaiming surface is a **quality** win, not only a budget
  one — a rarely-fired sub-procedure sitting in-core every turn dilutes attention on the
  per-turn rules that fire every turn.

- **Progressive disclosure / tiered loading** (Anthropic, *Equipping agents for the
  real world with Agent Skills*; Microsoft `agent-skills`). The Skills model loads only
  a skill's **name + description (~100 tokens)** into the system prompt at startup, then
  reads the full body (recommended < 5,000 tokens) **only when the task matches**, then
  optionally deeper files. A 133-skill install pays ~7–13k tokens of metadata instead of
  hundreds of thousands of bodies. Reported per-session saving across the pattern:
  **40–60%** of the disclosed surface.

- **Hierarchical / tiered memory** (MemGPT/Letta, surveyed in *Agent Memory
  Architectures*). Core memory stays always-in-context (RAM); recall and archival tiers
  are fetched on demand (disk / cold store). The protocol already mirrors this: the
  constitution + per-turn orchestrator essentials are "core memory"; the procedure files
  are "recall."

**The principle that applies to a protocol-as-system-prompt:** keep in the
always-loaded core only what fires on (nearly) every turn, plus the **trigger** for
everything else; move every rarely-fired body behind a pointer that is read when it
fires. The protocol already does this for side-tools — the levers below extend the same
discipline to the surface that has not yet had it.

Sources: [Anthropic — Effective context engineering for AI
agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents);
[Anthropic — Equipping agents for the real world with Agent
Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills);
[Microsoft agent-skills — Progressive Disclosure
Pattern](https://deepwiki.com/microsoft/agent-skills/5.3-progressive-disclosure-pattern);
[Lazy Skills: A Token-Efficient Approach to Dynamic Agent
Capabilities](https://boliv.substack.com/p/lazy-skills-a-token-efficient-approach);
[Agent Memory Architectures: Patterns and
Trade-offs](https://atlan.com/know/agent-memory-architectures/).

---

## The levers

### Lever 1 — move `## Your seat`'s rarely-fired sub-procedures on-demand

**This is the biggest single in-core lever** — `## Your seat` is 13,006 chars, half the
assembled orchestrator, and it mixes two populations:

- **Per-turn essentials** (stay in-core): spawn/model resolution, the
  point-don't-restate spawn rule, commit/push/PR ownership, the CI-green-before-merge
  gate, stage-named-paths, the resume-pointer read-FIRST rule, decide-by-invariant-7,
  the profile routing/firefight block. These fire on the common loop.
- **Rarely-fired sub-procedure bodies** (candidates to move behind a trigger, the
  Skills pattern): **release rollback** (`## Your seat` line 30 — fires only when a
  shipped version is wrong); **stacked-queue merge ordering** (line 23 — only with a
  stacked PR queue); **cross-component N-repo ship** mechanics woven through lines
  19/23/31 (only on a declared component set — and `## Multi-component coordination`
  already owns this procedure, so the in-`Your seat` restatements are partly
  duplication, invariant 6); **team-mode branch-sync** (line 21) and **team-mode
  PR-verdict-surface** (line 25 — both `team:false`-inert, i.e. dead weight on the
  common single-user project); **parallel-features** (line 35 — already a pointer, a
  good model for the rest).

**Method.** Extract the rarely-fired bodies into a procedure file (e.g.
`src/agents/procedures/ship-edge-cases.md` for rollback + stacked-queue +
cross-component-ship git, and fold the two team-mode bullets into the existing
`team-collaboration` capability module so they compose into the orchestrator *only when
`collaboration.team` is on* — today they are always-loaded prose that is inert on every
single-user project). Leave a one-line trigger in-core for each (the side-tool pattern
the protocol already trusts). This is the **5.42.0 decompose pattern**, re-applied to the
one section it has not yet reached.

**Estimated saving.** Conservatively **~3,500–4,500 chars (~0.9–1.1k tokens)** off the
always-loaded surface — the rollback + stacked-queue + cross-component-ship git + the
two team bullets, net of the ~5 trigger lines left behind. The team-mode bullets alone
(~2k chars) are pure dead weight on the default single-user project.

**Risk: LOW.** Behaviour-preserving by construction — same rule, moved behind a trigger
that fires exactly when the rule applies. The one care point: each moved body needs a
discoverable trigger in-core so a session never misses that the procedure exists (the
same contract `## Side-tools` already honours). Cross-component and team-mode moves
*also reduce duplication* (their canonical homes are `## Multi-component coordination`
and the `team-collaboration` module), so this lever pays an invariant-6 dividend on top
of the surface saving.

### Lever 2 — capability-module fragments in the orchestrator surface

**Investigated — the premise does not hold; the saving is already realised by design.**
The brief asked whether the orchestrator (a router that never builds or reviews) carries
always-loaded module reasoning fragments that belong only in the spawned worker roles.
It does not:

- The `<!-- ai-dev:modules -->` marker exists **only** in `src/agents/builder.md` and
  `src/agents/reviewer.md` — never in `src/agents/orchestrator.md`.
- **No** `src/modules/<id>/orchestrator.md` fragment exists for any module.
- Every module row in `src/modules/registry.json` targets `builder` and/or `reviewer`
  only (`targets: [{role: builder|reviewer, beat: plan|review}]`).
- Grepping the assembled `.claude/ai-dev.md` for threat-model fragment phrasing returns
  **0 hits** — the enabled `threat-model:rich` module composes into the Builder and
  Reviewer agents (spawned on demand), never into the always-loaded orchestrator.

So the desirable end-state lever 2 imagined — "module reasoning lands where the work
happens, spawned on demand, not in the always-loaded router" — is **already the design**
(`docs/architecture.md` `## Capability modules` + `src/modules/registry.json` are the
one home for the mechanism). **No saving available; no change to make.** Recording it as
a closed question is the value here — it removes a phantom from the optimization
backlog.

### Lever 3 — `PROTOCOL.md` editorial density (the larger 35.8k half)

A lose-no-rule tightening pass over the constitution: the two giants (`## The loop`
7,413, `## Enforcement` 7,249) carry long compound sentences and repeated framing
("`[persona]`: this sharpens X, denies nothing" recurs; the loop's prose restates the
same fail-safe direction several times). A density pass keeps every rule and pointer,
trims connective prose and repeated qualifiers.

**Estimated saving.** Realistically **~5–10%** of `PROTOCOL.md` — **~1,800–3,600
chars (~0.5–0.9k tokens)** — without dropping a rule. Aggressive cuts risk the rule
itself, so the honest ceiling is the lower half of that range if done safely.

**Risk: HIGHER — it is the constitution.** Every sentence is potentially load-bearing
and the manifesto's third rule ("a thin core, small enough to read in one sitting")
already pushes against bloat, so the easy wins may be few. A density edit must go through
the full loop with a careful Reviewer diff, because a trimmed qualifier can silently
change a rule's scope (e.g. dropping a fail-safe direction). **Lower value per unit
risk than lever 1.**

### Lever 4 (surfaced) — `## When something is off` partial move + dedup sweep

`## When something is off` (2,201) is mostly per-turn-relevant escalation discipline,
but the **8D-offer mechanics** and the detailed repeated-failed-attempt ceiling prose
could compress against `.ai-dev/procedures/8d.md` (which already owns the 8D body). A
light dedup sweep here plus the cross-component/team dedup folded into lever 1 is a
**~300–600 char** opportunistic add-on, **LOW risk**, best done *as part of* lever 1
rather than as its own feature.

---

## Recommended, sequenced plan

Safest-highest-value first. Each step is a normal loop feature (Builder + Reviewer),
behaviour-preserving, with the green quality suite as the floor.

1. **Lever 1 — decompose `## Your seat`** (the 5.42.0 pattern, one more section). Move
   rollback + stacked-queue + cross-component-ship git into a procedure file with
   in-core triggers; fold the two team-mode bullets into the `team-collaboration` module
   so they load only when `collaboration.team` is on. **Target: ~0.9–1.1k tokens
   reclaimed, LOW risk, plus an invariant-6 dedup dividend.** This is the single best
   move and should ship first.

2. **Lever 4 — opportunistic dedup** of `## When something is off` against
   `.ai-dev/procedures/8d.md`, ideally **bundled into step 1's branch** (same decompose
   discipline, same Reviewer pass). **~0.1–0.15k tokens, LOW risk.**

3. **Lever 3 — a careful, lose-no-rule density pass on `## The loop` and
   `## Enforcement`** — *only if* the reclaimed budget after steps 1–2 is judged
   insufficient. **Target: ~0.5–0.9k tokens, HIGHER risk**, gated on a meticulous
   Reviewer diff confirming no rule's scope moved. Treat as a separate, later feature —
   never bundled with the low-risk steps, so a constitution edit gets its own scrutiny.

**Combined realistic target: ~1.5–2.1k tokens reclaimed** from a ~15.4k-token surface
(roughly **10–14%**), the bulk of it from the low-risk lever 1. Against the combined
~25k-token always-loaded floor (protocol + Claude Code base), that is ~6–8% of the
pre-work surface returned to the task and to compaction headroom.

**Explicitly out of scope / too risky:**

- **Lever 2** — closed: no orchestrator module fragments exist; nothing to move.
- A structural rewrite of `PROTOCOL.md` (re-chaptering the constitution) — the manifesto
  already constrains its size; a re-architecture is a far larger bet than this
  surface-optimization question warrants, and would risk the "read in one sitting"
  guarantee it is meant to serve.
- Moving any **per-turn essential** out of core to chase bytes — it would trade a tiny
  saving for a missed rule on the common path; the whole point of the just-in-time
  principle is that only the *rarely-fired* belongs behind a trigger.
- Any change to the capability-module assembler or registry — they are the one home for
  the module mechanism (`docs/architecture.md` `## Capability modules` +
  `src/modules/registry.json`) and lever 1's team-mode fold uses them as-is, adding no
  new axis.
