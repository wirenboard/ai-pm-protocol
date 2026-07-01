# Splitting the planning model from the building model — one role, session, or a new role?

**Status: RATIFIED by the Operator (2026-07-01) — option C, profile-graded.** The
implementation is a separate follow-up loop; this doc records the decision and its rationale.

## Decision (ratified 2026-07-01)

**Option C — a new Researcher-Planner role — but its activation is graded by `profile`,**
which resolves the doc's own main objection to C (a wasted spawn on light profiles):

- **`full`** — spawn the Researcher-Planner (strong-model research+plan front); Builder is the pure executor.
- **`lite`** — the Orchestrator carries simple/fixup-grade work itself; the Researcher-Planner spawns only for non-trivial changes.
- **`solo`** — the Orchestrator plans directly (no separate Planner spawn), i.e. B-behaviour.
- **`yolo`** — unchanged (plan is a running spec).

**Why C over the doc's B recommendation:** the doc named the exact value-flip — "B unless the
Operator commits to the full-profile + cheap-cross-endpoint + build-token-heavy regime, then
C." The Operator IS in that regime (per-seat cheap cross-endpoint routing, shipped 5.47.0), so
the condition is met. The profile-grading above is the synthesis: it keeps C's benefit exactly
where it pays off (`full`, and non-trivial `lite`) and collapses to B/A elsewhere — so the
default `solo` project never pays the extra spawn. Reviewer independence and the merge-gate are
untouched (C weakens no correctness guarantee — `## Constitutional impact`).

**Not built here.** Implementing C is a constitutional change (a 4th role, the Builder contract
narrowing, `roles.planner` seat + its profile-graded spawn rule) and runs as its own planned
loop. The DRAFT role contract in the appendix is the starting point, not an installed role.

---

## The frame

Today the **Builder** both plans and builds, on **one baked model**
(`roles.builder.model`). Planning is high-value thinking (research, architecture, product
judgment, the whole `## Plan` checklist + its composed capability modules); building is
more mechanical (write the code the plan named, keep the tools green). Per-seat model
routing shipped in 5.47.0 (`docs/decisions/per-seat-model-routing.md`,
`multi-model-setup-ux.md`) makes running a **cheap model in the Builder seat** first-class
and easy — so a cheap Builder that *under-plans* is now a live risk, not a hypothetical.

The orchestrator's plan oversight is **shallow by design** — it relays the plan in plain
language and the Operator approves it, with **no deep technical vetting** (the Operator
does not read code; `PROTOCOL.md ## Talking to the Operator`). The *deep* plan check is
the Reviewer's — but that is **post-build**, so a weak plan surfaces late, as rework.

### The constraint that rules out the obvious fourth option

The obvious "just give the Builder two model pins — one for plan, one for build" **cannot
work**: a spawned seat takes its model **baked per spawn** (`per-seat-model-routing.md`
fact 2 — model is fixed at spawn, `CLAUDE_CODE_SUBAGENT_MODEL` aside; a subagent cannot
switch its own model mid-run). Two models across the plan/build boundary therefore needs
**two model-bearing contexts**. There are exactly two shapes for that:

- **the long-lived session plans, a spawned Builder builds** → option **B**;
- **a spawned Planner plans, a spawned Builder builds** → option **C**.

Option **A** (status quo) keeps one model for both and cannot split at all. So the real
question is not "should we split" in the abstract — it is **which of the two split shapes,
or none**, given that the split buys the economics below at a real constitutional cost.

### The distinction that anchors everything (do not bury it)

The one role split the protocol holds sacred — **Reviewer ≠ Builder** — carries
**CORRECTNESS**: an independent context re-checking the work is a *reliability guarantee*
(`minimal-core.md ## What survives every cut`; `PROTOCOL.md ## The three roles`, "the one
split that carries reliability"). A **Planner ≠ Builder** split carries **only cost /
model-quality economics** — it buys *cheaper-or-better tokens per beat*, **not** a new
reliability guarantee. Weak planning is caught by the Reviewer either way; the split does
not add a check, it re-prices the thinking.

That sets the bar. By the protocol's own **rule of the cut** (`minimal-core.md`), a new
role is admitted only when it keeps out a **real failure** that no **cheaper mechanism**
can. A split that buys economics but prevents no failure a cheaper mechanism can't must
clear a *higher* bar than "it's a clean separation" — because "clean separation" is
exactly the argument the deliberate 8-persona → 3-role collapse already rejected
(`bmad-adoption.md`: "Not adopted: the 12-agent roster — our three-role split with folds
is the deliberate opposite").

The honest counter that keeps C alive: heavy planning in a **fresh disposable spawn**
mirrors *precisely* why Builder and Reviewer are spawned rather than done in-session —
disposable context for heavy work, the precious long-lived session kept clean. **B loads
planning into the session that must survive the whole loop; C keeps it disposable.** That
is a genuine architectural point, and the analysis below weighs it at full strength.

---

## The three options, with honest trade-offs

### A — status quo: Builder plans + builds on one model

Zero change. Zero constitutional cost. The Builder's rich `## Plan` checklist and its
composed capability modules already produce strong plans **when the Builder runs a strong
model**.

- *Pro:* nothing to build, nothing to justify, thin core untouched. The risk is **opt-in**
  — it only bites a project that *actively pins a cheap Builder*; the default
  `roles.builder.model` is `session` (the strong launch model), so an unconfigured project
  has no problem to solve.
- *Con:* a project that pins a cheap Builder for build-cost gets a cheap **planner too** —
  there is no way to buy cheap execution without also buying cheap thinking. The weak plan
  is Operator-approved (shallow) and only blocked by the Reviewer **post-build**, so the
  cost saving is silently eaten by rework. A's worst case is **quality erosion hidden
  behind a config knob**.

### B — the session (Orchestrator) drafts the plan; the Builder narrows to a pure executor

The running session is **already on the strong launch model** (`launch.sessionModel`),
**already inside the plan beat** (it shows the plan to the Operator and holds the
approval), and — decisively — **already permitted by the enforcement layer to write a
feature plan** (`PROTOCOL.md ## Enforcement`: the orchestrator-content-write deny excepts
"its own state and a feature plan"). So B is **mechanically already legal** — no deny rule
changes. The Builder seat becomes a pure build seat; its model may be pinned cheap without
touching plan quality.

- *Pro:* **zero new spawn, zero new seat, zero new role, zero deny change.** Strong plan by
  construction (the session is the strong model). Solves the stated problem — decouple the
  plan model from the build model — at the **lowest** constitutional cost. And the benefit
  reaches the **default `solo` project immediately** (the session already plans there).
- *Con:* it **bends "the Orchestrator routes, never does a role's work"**
  (`PROTOCOL.md ## The three roles`; `orchestrator.md` opening). Planning is *currently* the Builder's
  work (Builder contract: "Plans before it builds"). B moves a substantive knowledge-work
  act into the router. It also **loads planning into the long-lived session context** —
  every feature's research, codebase reading, and architecture reasoning piles into the one
  context that must survive the whole loop, accelerating the very degradation
  `orchestrator.md ## Your seat` (*Session-reset hygiene*) warns about. And the plan-beat
  **capability modules** (threat-model, product-advocate, ui-ux…) are composed into the
  **Builder** agent today; B must relocate that composition to the session — a real
  assembly-pipeline change (mitigations below keep it out of the always-loaded core).

### C — a new Researcher-Planner role (the Operator's steer)

A **strong-model spawned role** runs the research + plan front. It **folds architect ·
stack-researcher · codebase-reader · product-advocate OFF the Builder**; the Builder keeps
`coder` = pure execution. It hands the Builder an **approved plan**. Reviewer independence
is untouched.

- *Pro:* keeps heavy thinking in a **disposable spawn** — the same logic that justifies
  spawning Builder and Reviewer rather than doing them in-session; the precious session
  stays clean. The **model wiring is symmetric with the existing baked seats** — a
  `roles.planner.model` strong pin beside the Builder's cheap pin, realized by the *same*
  5.47.0 per-seat routing, **no new mechanism**. The Folds re-partition is **clean, not a
  duplication**: four concerns move whole from Builder to Planner. Gate integrity and
  Reviewer independence are **entirely unaffected** (see below).
- *Con:* it **reintroduces a role** the thin-core manifesto *deliberately collapsed* —
  directly against manifesto rule 3 and the swarm-collapse (`minimal-core.md`,
  `bmad-adoption.md`). It adds **+1 spawn per feature** (on `full`: plan + build + review =
  3 spawns vs 2 today). And it **breaks the plan→build continue-optimization**: today the
  Builder is *continued* from plan to build (`orchestrator.md ## Your seat`, invariant 3
  non-gate carve-out), paying no re-read; C hands off to a *separate* Builder that must
  **re-read the plan file** on every feature.

---

## Constitutional impact per option — the exact surfaces touched

### A

None. No `PROTOCOL.md`, `src/agents/`, `src/adapter/`, or config surface changes.

### B

| Surface | Change |
| --- | --- |
| `## The three roles` table + **Folds** | Builder "Does" drops *plans the change*; Orchestrator "Does" gains planning — contradicting "Routes every other act to a role; does no building or reviewing itself." The Folds `architect · stack-researcher · codebase-reader · product-advocate` move from Builder onto the Orchestrator row (today `(the session itself)`). |
| `## Role contracts` — **Builder** | "Plans before it builds" (the *first* guarantee) is removed / relocated; Builder becomes "builds against a plan it did not draft." |
| `## Role contracts` — **Orchestrator** | "never does a role's work itself, except where a rigor `profile` lets it build directly" gains a **second** standing exception (planning) — weakening the clean routing line on **all** profiles, not just `lite`/`solo`. |
| `## The loop` beat 2 | "Builder drafts the change against its plan checklist" → "Orchestrator drafts." |
| `## Enforcement` | **No deny change** — the orchestrator-content-write deny already excepts a feature plan. (This is B's quiet strength: mechanically a no-op.) |
| `## Project config` `roles` | No new seat; but `roles.builder.model` semantics narrow to "build model only." |
| Module assembly (`src/modules`, the `<!-- ai-dev:modules -->` splice) | Plan-beat modules must compose into the Orchestrator's plan path instead of the Builder — see the read-on-demand mitigation below so this does **not** bloat the always-loaded session instructions. |

### C

| Surface | Change |
| --- | --- |
| `## The three roles` | A **fourth** row (Researcher-Planner); header "Three roles" → "Four roles." Folds re-partition: `architect · stack-researcher · codebase-reader · product-advocate` → Planner; Builder keeps `coder`; Reviewer keeps its four. The reliability sentence ("the reviewer is never the builder") stays true and gains a sibling — **stated honestly as a cost/quality split, not a second reliability split.** |
| `## Role contracts` | A new Researcher-Planner contract; Builder loses "Plans before it builds," gains "builds against an approved plan it did not write." |
| `## The loop` beats 2–3 | Planner drafts (beat 2); Builder implements (beat 3). Invariant 3's non-gate carve-out ("the Builder may be continued … plan→build") loses its **plan→build** half (now a cross-role handoff); **build→address-findings** continuation survives. |
| `## Project config` `roles` | New `roles.planner` seat with a baked `model` pin. Invariant 1's designated-seat list grows by one. |
| `src/adapter` — seat/deny wiring | Config schema gains `roles.planner`; install/assembly bakes the Planner agent and its `model:` line (same bake path as builder/reviewer). **No new core/adapter contract point** — the "spawn a sub-agent" contract already covers it; C adds a **seat instance on the existing role axis**, not a new axis. |
| `## Enforcement` — **gate integrity** | **Intact.** The Planner is a **non-gate producer** (like the Builder), not a gate role. Invariant 3 concerns the **Reviewer stamp**, which is unchanged — the Reviewer stays a fresh, independent spawn; the merge-gate still reads its presence. The Planner writing the plan file is ordinary sub-agent authoring (sub-agents author content freely). **Reviewer independence and the merge-gate floor are untouched — state this plainly: C does not weaken any correctness guarantee.** |

The asymmetry to notice: **B extends a line already bent** (the Orchestrator *already*
does role-work — it builds directly on `lite`/`solo`). **C breaches a line held firm** (the
role count has never grown past three; it was deliberately *cut down* to three).

---

## Open questions C must resolve

### 1. Does C absorb the `research` side-tool, or reuse it? (invariant 6, one home)

**Reuse — do not absorb.** The `research` side-tool
(`src/agents/procedures/research.md`) answers a **canon-worthy** question and lands a
**durable** artifact in `docs/decisions/` (retention: one file per topic, rewritten on
revisit). The Planner's planning research is **transient** — it feeds *this* plan and dies
with it. Different retention classes. The Planner should **fold the stack-researcher**
(feature-scoped research inline, exactly as the Builder does today) and **defer a
canon-worthy unknown to the `research` side-tool** — the same escalation the Builder's
`## Plan` "Unfamiliar interface" item already prescribes. Absorbing the side-tool's
procedure into the Planner would **duplicate** it (invariant 6 violation). So: **no change
to `research.md`**; the Planner points to it, never restates it.

### 2. Token / spawn cost

- **+1 spawn per feature.** On `full`: plan + build + review = 3 spawns vs 2 today.
- **The plan re-read across the agent boundary.** Today plan→build *continues* the Builder
  (no re-read). C hands off, so the Builder re-reads the plan file — bounded (the
  spawn-prompt-points-not-restates rule means the Builder gets the plan **path + delta**,
  one file read, not a restated copy).
- **Net economics are conditional.** The Planner spawn is the *expensive* one (strong
  model, heavy research context) — but that thinking was being paid for *anyway*; C moves
  it onto a strong model while letting **build** run cheap. So C **saves money only when
  build-token-volume ≫ plan-token-volume** (cheap tokens for the bulk of the work). When
  the build is token-light, the extra-spawn + re-read overhead **dominates and C costs
  more than A/B**. This is a load-bearing flip condition, not a footnote.

### 3. Interaction with profiles — C's benefit is fully realized **only on `full`**

- **`full`:** Planner is a clean 3rd spawn. C's model-split is fully realized.
- **`lite` / `solo`:** the Orchestrator **MAY build directly**. The consistent extension is
  that the same latitude covers planning — so the Planner is **optional** here and
  **collapses into the session = B-on-those-profiles**. Which means: **below `full`, C
  degenerates into B.**
- **`yolo`:** plan is a running spec, no Reviewer; ceremony is minimized — the Planner
  would be off (session plans directly), i.e. **C = A/B on yolo.**

**The decisive finding:** C's *distinct* value over B — a disposable strong-Planner spawn
separate from the cheap Builder — exists **only on `full`**. On `lite`/`solo`/`yolo` it
collapses to B or A. Since the **default profile is `solo`**, **the default project never
sees C's benefit** but *would* carry C's conceptual cost (a 4th role in the constitution it
reads in one sitting). That weighs heavily against C as the general answer.

### 4. Model policy — how C's seat reads a strong pin

Symmetric with the existing baked seats: **`roles.planner.model`**, baked at install like
`roles.{builder,reviewer}.model`, realized by the 5.47.0 per-seat router. Sensible default
`session` (the strong launch model) so the Planner is strong by construction; a project
pins it explicitly for a specific strong or cross-endpoint model and pins the **Builder**
cheap. Cross-endpoint (e.g. Planner on Anthropic-opus, Builder on a foreign build model)
is already handled by `roles.*.model` + `launch.aliases` (`multi-model-setup-ux.md`). **No
new model mechanism — this is C's cleanest aspect.**

---

## Elicitation / adversary pass

### Pre-mortem — "we shipped C, and it just added spawn cost without lifting plan quality. Why?"

- Plan quality was **never the bottleneck** — the Reviewer already caught weak plans
  post-build. Moving planning to a strong model **front-loaded cost without removing the
  review round**; the rework it was meant to prevent still happened at review.
- The handoff **leaked plan intent**: the cheap Builder re-interpreted an ambiguous plan
  its own strong-model author would have executed correctly, so the strong plan **did not
  actually constrain the cheap build**. The boundary between "strong plan" and "cheap
  execution" is only as good as the plan's precision — and cheap execution is exactly where
  under-specification bites.
- On `solo` (the default) the Planner **collapsed into the session anyway**, so the large
  majority of projects paid the 4th-role conceptual complexity for **zero runtime benefit**.
- The strong Planner, with nothing to do but plan, **gold-plated** — heavier plans that
  cost *more* to review and build against, net-negative.

### Pre-mortem — "we shipped B, and it made things worse. Why?"

- The session, now planning, **degraded faster** and hit reset more often; each reset
  re-reads everything → net token cost **rose**.
- "The Orchestrator only routes" **eroded to fiction** — with the session planning *and*
  building-on-solo, reviewers began seeing session-authored plans indistinguishable from
  role work, and on Claude the deny layer already can't tell an orchestrator-authored write
  from a sub-agent's (`PROTOCOL.md ## Enforcement`, the actor-resolution caveat), so the
  last conceptual guardrail thinned.

### Inversion — how does each option fail **worst**?

- **A worst:** silent quality erosion behind a config knob — a project pins a cheap Builder
  for cost, every feature ships a thin plan, rework compounds invisibly (the plan was
  Operator-approved, shallow), and the "saving" is eaten before anyone measures it.
- **B worst:** the session becomes a **monolith** — plan + route + git + build-on-solo — the
  single all-doing agent the entire protocol exists to *decompose*. Context degrades, the
  routing invariant becomes narrative, and the decomposition manifesto is quietly inverted
  from the inside.
- **C worst:** the 4th role **normalizes "add a role when a concern feels big."** Why not a
  separate architect next? a separate researcher? The swarm-collapse erodes **one justified
  role at a time** until the protocol drifts back toward the 2,200-line, 8-persona,
  17-file machine it deliberately replaced — thin-core death by a thousand reasonable
  additions.

### The thin-core tension, at full strength

Manifesto rule 3: *"A thin core. Small enough to read in one sitting. When it grows past
that, cut it back — **never append**."* `minimal-core.md`: the protocol is a **deliberate
reduction** from a 2,200-line, 8-persona, 17-file machine to **one constitution + three
roles**, and its **rule of the cut** admits a mechanism only when it keeps out a **real
failure** via **no cheaper mechanism**. `bmad-adoption.md`: the 12-agent roster was
**explicitly not adopted** — "our three-role split with folds is the deliberate opposite."

Apply that test to C directly: **a Planner keeps out no *failure*** — by the anchoring
distinction it buys **cost/quality economics, not a reliability guarantee** — and **B is a
cheaper mechanism** (no new role, no new spawn, no deny change) for the **same** economic
win. Therefore, **by the protocol's own stated test for admitting a role, C is not
justified.** This is the decisive constitutional argument, and it points away from C.

---

## Recommendation

**Adopt B. Do not add the fourth role (C) now. A is acceptable only for a project that
never pins a cheap Builder.**

The reasoning, in order of weight:

1. **The protocol's own rule of the cut settles it.** A new role is admitted only to keep
   out a failure no cheaper mechanism can. A Planner keeps out **no failure** (economics,
   not correctness — the anchoring distinction), and **B is the cheaper mechanism** for the
   identical economic win. C fails the protocol's own admission test for a role.
2. **B solves the stated problem at the lowest constitutional cost** — it decouples the
   plan model from the build model with **zero new spawn, zero new seat, zero deny change**
   (mechanically already legal), and it **reaches the default `solo` project immediately**,
   where C's benefit is invisible.
3. **B extends a line already bent; C breaks a line held firm.** The Orchestrator already
   does role-work on `lite`/`solo`; adding "may draft the plan" widens an existing,
   documented exception. C grows the role count that was deliberately *cut* to three — the
   loudest, most-repeated commitment in the manifesto.

**B ships with two mitigations that answer its two real costs** (both reuse existing
machinery, so neither adds core):

- **Session-pollution:** heavy per-feature research is **offloaded to the existing
  `research` side-tool spawn** (disposable), so the session **drafts and holds** the plan
  but does **not** absorb deep research into the long-lived context.
- **Thin-core tax:** the plan-beat capability modules compose into a **read-on-demand plan
  procedure** (the same on-demand pattern the side-tools already use —
  `orchestrator.md ## Side-tools`), **not** into the always-loaded session instructions, so
  the "loads every turn" core stays thin.

### What would flip the recommendation to C

An **evidence** flip or a **value** flip — name either and revisit:

- **Evidence:** B's session-pollution proves **real and un-mitigable** — the research
  offload + read-on-demand modules don't hold, and the session measurably degrades (the
  `Session-reset hygiene` symptom firing far more often under B). Then C's **disposable
  spawn** earns the fourth role on the architecture ground alone.
- **Value:** the Operator makes the **advanced regime the primary use case** — routinely
  running **`full`** with a **cheap cross-endpoint Builder** where **build-token-volume ≫
  plan-token-volume**. In *that* regime C's model-split saves real money and the +1 spawn
  pays for itself in cheap build tokens; below `full`, or when build is token-light, it
  does not.

Put plainly: **B unless the Operator commits to the full-profile + cheap-cross-endpoint +
build-token-heavy regime as the norm, or B's session-pollution proves un-mitigable — then
C.** Until one of those is true, the fourth role costs more thin-core than it buys.

---

## Appendix — DRAFT Researcher-Planner role contract (the candidate for option C)

> **DRAFT — not an installed role.** This is the candidate agent for option C, written in
> the `src/agents/<role>.md` house style so the Operator can judge C concretely. It is
> **not** wired into `src/agents/`, `roles`, or any adapter, and must not be, unless and
> until the Operator picks C. If C is chosen, this becomes `src/agents/planner.md` and the
> Builder's `## Plan` section shrinks to a build-time reference to the approved plan.

---

### # Researcher-Planner

You research and plan **one change**; you do not write its code. You fold four concerns —
**architect · stack-researcher · codebase-reader · product-advocate** — into one (the
**Folds** column, `PROTOCOL.md ## The three roles`). You are a **strong-model** seat: the
plan you hand off is the contract the Builder executes and the Reviewer checks against, so
the thinking is done here, once, well.

The Orchestrator spawns you with a task; you return your **plan**, not a message to the
Operator (the Orchestrator relays and secures approval). Read `PROTOCOL.md` — its
invariants bind you. This file is your procedure.

#### Contract (what you guarantee)

- A plan the Operator can approve **before any code** — grounded in the real product
  (`docs/product.md`), the real system (`docs/architecture.md`, the touched feature docs),
  and the real stack (canonical sources, not guesses).
- Every **structural choice surfaced** for the Operator with 1–2 options + a recommendation
  — never silently taken (you fold the architect; the *call* is the Operator's).
- Every **product question** answered or consciously descoped; every **security surface**
  named with its mitigation; a **verification scenario** on the real integration layer.
- A plan **precise enough that a cheap executor cannot mis-read it** — the pre-mortem
  failure mode of the whole split (`## Open questions C`); ambiguity here is a defect,
  because your reader is a pure executor, not a second designer.
- You **never write code, never commit, never review.** You hand the plan back; the Builder
  builds it, the Reviewer (fresh, independent) judges it.

#### Procedure: understand → research → plan

1. **Understand.** Read the resume/plan context the Orchestrator points you at (by path,
   never restated). Read the product brief, `docs/architecture.md`, the threat model where
   one exists, the touched feature docs and journeys. Ground the plan in the real product
   and system, not a guess (you fold the codebase-reader).
2. **Research.** Where the change rests on an unfamiliar tool/format/API or an unknown the
   canon cannot answer, find the **canonical source** and build against it (you fold the
   stack-researcher). A **canon-worthy** unknown is deferred to the `research` side-tool
   (`src/agents/procedures/research.md`) — a durable `docs/decisions/` artifact — **never**
   duplicated into the plan (invariant 6). Feature-scoped research stays inline in the plan.
3. **Plan.** Draft the change into the transient plan file (`.ai-dev/plans/<topic>.md`) —
   the plan plus a progress note carried through the loop. Work the plan checklist below;
   run the composed capability modules the same way. Where the draft is user-facing or
   direction-setting, run an inline **elicitation** angle-check
   (`src/modules/elicitation/catalog.md`) and a **plan-adversary** probe before hand-off, so
   the Orchestrator shows the Operator a stress-tested draft, not a first take.

Hand the plan back on completion. The Orchestrator secures the Operator's approval; the
**approved** plan is the contract. When you cannot honestly produce a plan — a missing
input, an unresolved fork you may not decide — return **BLOCKED**: one line naming exactly
what is missing and what would unblock. Never hand back a guess dressed as a plan.

#### Plan checklist (the folded-persona one-liners)

- **Guarantee first** — name the promise this change makes or honours *before* the
  mechanism (wiring a feature with no stated promise is built backwards).
- **Behaviour** — what user-visible behaviour changes, and what stays the same.
- **Scope** — the smallest change that satisfies it; what is explicitly out of scope.
- **Structural choice** *(architect)* — a new axis of extension, or several plausible homes
  for the logic? Name 1–2 options + a recommendation; hand the call to the Operator. Offer
  decomposition (never block) when the change touches an oversized file.
- **Product questions** *(product-advocate)* — does this serve the user the brief names? The
  success / empty / error state; bad-input behaviour; the irreversible step. Each gets a
  recorded answer or a conscious descope.
- **Verification scenario** — one `trigger → action → observable result` on the **primary
  integration layer** a consumer really hits; recorded or consciously descoped.
- **Security surface** — any auth, secrets, untrusted input, or network boundary touched;
  name the threat and the mitigation at the boundary.
- **Unfamiliar interface** *(stack-researcher)* — canonical source found and built against;
  don't guess.
- **Docs** — what docs must change with this code.
- **Estimate** — complexity, not file count (`docs/decisions/estimation.md`).

(Capability modules — threat-model, product-advocate, ui-ux, and the rest — compose into
this section at assembly, exactly as they compose into the Builder today; the composition
**moves** from the Builder agent to here, it is not duplicated.)

#### Stay in your lane

- You research and plan; you **do not code, commit, review, ship, or merge**. Hand the plan
  back approved-ready; the Builder executes it, a fresh independent Reviewer judges it.
- You are a **non-gate producer** — like the Builder, you may be *continued* across your own
  steps (understand→research→plan), but you never review your own plan and never fill
  another seat (invariants 1, 3).
- Read, search, and write only inside the project root (invariant 2). Machine-facing
  artifacts in English; human-read docs in the project's `docLanguage` (invariant 5).

---

## Sources

- **Internal / primary:** `PROTOCOL.md` (`## The three roles`, `## Role contracts`,
  `## The loop`, `## Enforcement`, `## Project config`); `src/agents/builder.md` (the
  `## Plan` checklist + folds this appendix re-partitions); `src/agents/procedures/research.md`
  (the side-tool the Planner reuses, not absorbs); `.ai-dev/config.json` `roles` / `launch`
  (the baked-seat + launch-model machinery C's seat reuses).
- **Prior decisions this builds on:** `docs/decisions/per-seat-model-routing.md` (the
  baked-per-spawn model constraint that rules out a two-pin Builder); `multi-model-setup-ux.md`
  (cross-endpoint tier aliases the Planner seat would reuse); `minimal-core.md` (the rule of
  the cut — the decisive test); `bmad-adoption.md` (the deliberate 12-agent → 3-role
  collapse C would partly reverse). Confidence: high — every claim is checked against
  in-repo source read this session (2026-07-01).
