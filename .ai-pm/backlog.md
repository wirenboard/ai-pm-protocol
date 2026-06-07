# Backlog

Observations and follow-ups recorded during reviews/audits.

## OpenCode harness support — PARKED unapproved plan (design + groundwork slice) — 2026-06-07 (this repo)

**Plan written but NOT approved — PM will finish later.** Add OpenCode as a second supported harness alongside Claude Code: one repo, no build step, identical install. Scope = **design + groundwork slice** (OpenCode adapter as a labeled preview), not full certification.

- **Artifacts (committed on branch `feature/opencode-harness-support`):** plan `doc/features/opencode-harness-support_plan.md`; stack-notes `doc/stack-notes.md` § "OpenCode (sst/opencode → anomalyco/opencode)" (8 areas, every datum sourced, `doc/cited (unverified)`).
- **Four PM forks resolved (AskUserQuestion 2026-06-07):** (1) scope = design + groundwork; (2) dogfood = **Claude Code stays self-host**, OpenCode = downstream-supported; (3) sync = **dual-native + equivalence test** (preserves the "no build step" decision; generator rejected); (4) install = **auto-detect harness**.
- **Two upstream blockers gate full certification (we do NOT close them):** runtime per-`task` model override (PR `anomalyco/opencode#17577` — **closed-not-merged** → cross-model via static frontmatter model pins on OpenCode) and subagent hook containment (`#5894` — **closed-disputed** → OpenCode enforcement labeled "best-effort, not subagent-proof"; spike candidate). Good news from research: `question` (AskUserQuestion-equiv) + `skill` tools exist and OpenCode reads `.claude/skills/`; the `instructions` array can point at a submodule path (no in-file `@`-import).
- **Resume next (no production code until PM greenlights):** `pm-architect` arch note (dual-harness layout, neutral-core carve, equivalence-test shape, harness-vocabulary home) → two gated integration-risk spikes (A: submodule-path sourcing for install; B: does plugin `tool.execute.before` constrain a `task`-spawned subagent — the #5894 dispute) → `pm-coder` builds the groundwork.
- *Path:* checkout `feature/opencode-harness-support`, approve/amend the parked plan, then arch note → spikes → coder. PM-parked 2026-06-07.
- **Refined in conversation 2026-06-07 (pass 2 + pass 3) — see the plan for the current text; the four forks above are pass-1 and partly superseded.** Pass-2 (folded into the plan): symmetric / no cross-read (rejected reading `.claude/skills/`); single source of truth, **no duplicated bodies** (duplication+drift-check fallback rejected); explicit declarative harness marker in README+AGENTS.md; `@`-inline confirmed unavailable for agent bodies on both harnesses (no longer a spike). Pass-3 (recorded in the plan as an OPEN, undecided fork pending the `pm-architect` arch note): the *form* of single-source is reopened — **A** runtime symlink+pointer (no build) vs **B** build-time generation from a metalanguage, CI builds-and-commits, shipped via submodule vs **C** two-repo split (dev-as-source repo + separate built-dist repo consumed as submodule, build on server). The central trade-off across B/C is the **dog-food / self-host loop** (this repo develops itself under its own protocol; a build breaks edit=run immediacy). Nothing decided, nothing built.

## Downstream→upstream protocol-feedback loop: downstream model emits problem reports, the protocol-side model maps them onto structure + essence — 2026-06-07 (this repo, conversation idea)

PM idea captured 2026-06-07 (OpenCode dual-harness conversation). **Automate/formalize the existing protocol-gap channel.** Today a protocol-gap report is **PM-relayed by hand** (see `workflow/protocol-gap.md`, and the "Ideation-phase elicitation gap" entry below — explicitly "PM-relayed protocol-gap report from … nula"). The idea: a downstream project's model emits a **raw problem report** about the protocol as it experienced it (what was confusing/missing/wrong while running the pipeline), and the **protocol-side model maps that raw report onto the protocol's structure and essence** — root-cause, which `workflow/*.md` / agent / command it touches, the minimal fix, dedup against existing backlog — turning unstructured downstream signal into a structured protocol-improvement item (exactly the hand-mapping the nula entry shows, but as a defined channel rather than ad-hoc PM forwarding).

- **Relation to existing mechanism:** extends `workflow/protocol-gap.md` (the protocol-feedback report) from a manual PM-relay into a defined downstream→upstream loop with an upstream triage/mapping step. Not a new concept — a formalization + the upstream-mapping half.
- **Open questions (unexplored — parked):** transport (how a downstream report reaches upstream without violating the project-boundary / no-cross-repo-read invariants — a report is *authored* downstream and *carried* by the PM or a channel, never the upstream model reading into a downstream repo); privacy (downstream reports must not leak downstream project content); structure of the raw report vs the mapped item; how the upstream mapping dedups against backlog; whether this is opt-in per downstream.
- *Likely path:* its own `/pm-plan` later (touches `workflow/protocol-gap.md`, possibly a new report template in `doc/_templates/`, and the boundary/privacy invariants). Independent of the OpenCode harness work. PM-parked 2026-06-07.

## Ideation-phase elicitation gap: product-shaping before `/pm-plan` is unscaffolded; bootstrap tier is shallow + one-shot; accessibility absent — 2026-06-06 (downstream: nula → this repo)

PM-relayed protocol-gap report from the `nula` greenfield bootstrap + extended-ideation session (written for upstream, forwarded by the PM). **This is a new facet of the EPIC "technical-over-product bias" below** — same root (the product axis is demand-driven, lazily-filled, weakly-gated) but at an earlier point on the timeline: the *ideation / product-shaping* phase **before** any feature enters `/pm-plan`. Sequence it with the EPIC's `pm-product-advocate` (✓shipped, the per-feature/bootstrap product referee) and its "Bootstrap product/journey asymmetry" item — they compose, they don't collide; this one extends the same machinery backward into the brainstorm phase.

- **Symptom.** In a long bootstrap+ideation session for a privacy-first, multi-party, deniable-messaging product, a large amount of *product-defining* requirement surfaced **only because the PM volunteered it from memory** — the orchestrator captured reactively; the protocol drew nothing out proactively. The PM (not the protocol) caught the messaging feature's addressing/identity model ("я чувствую тут логическую дыру"), the symmetric-deniability/decoy surface, accessibility (screen-reader / WCAG contrast), and palette-as-a-researched-decision. Expected: for a product whose signature feature is a multi-party deniable channel, the protocol should have driven interrogation of actors / addressing / isolation / loss-modes / a11y / privacy surface. Actual: the only protocol-driven elicitation was the one-time generic *presence* checklist at bootstrap; all depth depended on PM recall. **Risk — the gap is silent:** the session *feels* productive while design holes accumulate in free-text backlog; the PM forgetting a load-bearing requirement has no backstop in the ideation phase.
- **Root cause (three connected spec facts):** (1) **the bootstrap foundational set is generic, shallow, one-shot** — `workflow/foundational-questions.md` Tier:bootstrap is a fixed 7-question *presence* check with no depth-scaling for the product's signature/most-complex feature and no design-space interrogation (actor↔actor addressing, identity model, multi-party isolation, failure/loss modes, deniability surface), and **no accessibility question at all**; (2) **no defined ideation/product-shaping phase** — `pm-bootstrap` runs the foundational pass once then ends with "describe a feature"; the deep elicitation (per-feature questions + scenarios + Product Contract + `pm-product-advocate`) fires only **inside `/pm-plan` for a specific feature**, so a vision shaped in conversation *before* any feature is planned gets zero structured elicitation; (3) **the backlog has no elicitation discipline** — `.ai-pm/backlog.md` accretes free-text ideas with nothing prompting the orchestrator to interrogate an idea's design space at capture time, so parked ideas carry deep holes indefinitely, invisible until (if ever) planned. Net: the protocol front-loads elicitation into a shallow one-shot checklist and defers all depth to per-feature planning, leaving the high-value ideation phase unscaffolded — completeness falls on PM memory.
- **Minimal fixes:** **(1, RECOMMENDED) add a Tier:ideation checklist** to `workflow/foundational-questions.md` — a short cross-domain probe set the orchestrator runs when a non-trivial idea is captured: *actors & their addressing/identity model; multi-party isolation; loss/failure/recovery modes; accessibility incl. assistive tech; privacy/deniability surface; aesthetic/brand* — single-sourced like the other tiers, referenced from `pm-bootstrap` "After initialization" and a new backlog-capture discipline; cheap, reuses the existing advocate/relay machinery. **(2) depth-scale the bootstrap tier** — a rider so the product's *signature / most structurally-complex* feature runs the **per-feature** question set even pre-plan, not just the 7 generic questions. **(3) make backlog capture an elicitation act, not just a record** — a line in `pm-bootstrap` "After initialization" + `workflow/state.md` (or a new `workflow/ideation.md`): capturing an idea means probing its design space first. **(4) add accessibility as a first-class dimension** — absent today; add an a11y question to the UI-bearing tiers and seed `doc/_templates/ui-guide.md.tmpl` with explicit WCAG-contrast / assistive-tech / color-not-sole-signal requirements so a UI project starts with the slot filled, not discovered late.
- **Files a fix would touch:** `workflow/foundational-questions.md` (new ideation tier + bootstrap depth-scaling rider + accessibility question), `.claude/commands/pm-bootstrap.md` (invoke the ideation elicitation; proactive-interrogation line in "After initialization"), `workflow/state.md` or a new `workflow/ideation.md` (capture-time discipline), `doc/_templates/ui-guide.md.tmpl` (seed a11y), possibly `workflow/pipeline.md` (name the ideation phase between bootstrap and per-feature planning). **Keep proportional** — the ideation probe must stay a suggestion-only, non-blocking nudge (a trivial idea does not need a six-axis interrogation), same `clean`-is-silent discipline as the advocate, or it becomes ceremony that strangles quick capture.
- **Honest caveat (recorded, not a spec fault):** even absent a scaffold, the orchestrator could have applied first-principles interrogation to each captured idea instead of reacting — part of this was under-proactivity, not only missing spec. The scaffold (fixes 1/3) makes the right behaviour the default rather than depending on orchestrator initiative.
- *Likely path:* `/pm-plan` (mostly `workflow/*.md` + `pm-bootstrap.md` + template wording; a small `/pm-research` only if the ideation-phase elicitation pattern wants a prior-art pass — toil-light idea-interrogation / "design-space checklists"). Sequence after the EPIC anchor, with which it shares machinery. PM-relayed from nula 2026-06-06.

## Diagnostic-flow gap (2): no anti-thrash brake — stack-research is a mid-debug escalation, not only an up-front step — 2026-06-05 (this repo)

## Drain the local stack into main as 11 layered PRs — 2026-06-06 (this repo)

While `origin` was down, work accumulated locally as one linear branch (`feature/severity-triage-deployment-context`, ~75 commits off main). Remote is back (confirmed 2026-06-06). Plan: land the stack **bottom-up as 11 per-feature PRs**, not as one giant PR and not by pushing the single branch.

**Merge order (bottom → top — each upper layer includes the lower ones, so strictly in this order):**
1. `agent-reporting-discipline`
2. `cross-model-review`
3. `integration-risk-spike-gate`
4. `stack-idioms-library`
5. `seam-completeness`
6. `comment-restraint`
7. `state-archive-home`
8. `agent-handoff-durability`
9. `template-dev-artifacts-inert` (boundary submodule exclusion)
10. `severity-triage-deployment-context`
11. `semgrep-pre-review-linter`

**Per layer (protocol git-flow ×11):** `git checkout main && git pull` → cut `feature/<layer>` with only that feature's commits (`rebase --onto` / cherry-pick the contiguous block) → `pr-prep` → PR → squash-merge on GitHub → back to main, **rebase the remaining stack onto the rewritten main** (merged layer drops out when content matches).

**Watch-outs:** (a) GitHub squash rewrites main history every merge → must rebase the remainder each round; (b) editorial-markdown overlap — most layers touch the same files (`architecture.md`, `review-typology.md`), so rebase conflicts are likely; on conflict **do not commit "resolve conflicts"**, re-cut the remainder fresh from main; (c) merge stays manual. PM-decided 2026-06-06: 11 PRs (not fewer/larger).

## Pre-review self-review hygiene — legibility discipline for human-facing text — 2026-06-05 (this repo)

PM-relayed colleague's checklist point 4 (points 1–3 are covered by per-diff `code-review`): **read the text the AI writes for humans — don't copy it unread; read it twice, thoughtfully; rewrite if it's unclear or hard to read.**

The protocol's answer to 1–3 is structural independence (pm-plan-checker + code-review), not self-review. Point 4 is about **prose the protocol emits**: CHANGELOG entries, PR bodies, doc records, contracts — not code logic. Risk: AI-authored text pasted into a durable artifact without the orchestrator actually reading it for legibility, so machine-texture / unclear prose ships.

*Where a fix could land:* a **"read-before-ship the human-facing text" discipline** for the orchestrator — read AI-authored CHANGELOG/PR prose for legibility and rewrite-if-unclear before it lands, rather than copy-pasting agent output verbatim. Pairs with comment-restraint (shipped). *Path:* small `/pm-plan` (pm-comms rule + a pm-auditor legibility note). PM-relayed 2026-06-05.

## Consider expressing the protocol pipeline as a Claude Code dynamic Workflow — 2026-06-05 (this repo)

The multi-agent pipeline (plan → coder → review-loop → pr-prep) is driven by prose-discipline today. The Claude Code dynamic Workflows tool (announced 28 May 2026) could express it as a deterministic orchestration script (fan-out, pipelines, loop-until-clean). *Why potentially valuable:* determinism, parallelism, resumability. *Why NOT obvious:* the protocol is deliberately PM-in-the-loop at every fork; Workflows are opt-in/billed/can spawn many agents; the orchestrator-as-conversation is itself load-bearing (translates to/from PM, owns backlog, drives triage). *Path:* `/pm-research` first (does deterministic Workflow orchestration fit a human-gated, proportional pipeline). PM idea 2026-06-05.

## TO THINK ABOUT — pain-coverage map: AI-coding pains vs the protocol — 2026-06-04 (strategy / not a planned feature)

Sanity-check of "do we close the real pains people feel coding with AI?" against a 9-vote community poll. Not a planned feature — a re-aiming lens for prioritizing the backlog.

**Pain → protocol mechanism → coverage (honest):**
- **"Прогает не то, что хочу" (22%)** → plan→PM-approved scenarios + contract + pm-plan-checker + pm-product-advocate. **Strong.**
- **"Иногда ломает то, что работало" (33%)** → contract `Must not break` + interaction-scenarios + never-touch-existing-tests + removed-behavior angle. **Strong.**
- **"Бросается делать кучу, забывает половину" (33%)** → Execution State + plan-as-scope-boundary + categorical scope check + DoD + agent-handoff-durability. **Strong.**
- **"Макароны, трудно поддерживать" (33%)** → plan + contracts + code-review Pass-2 + architecture + /pm-audit. **Strong per-PR, PARTIAL long-term** — no accumulated-entropy tracking. → candidate future feature.
- **"Тесты проверяют не то" (11%) + "плохо проверяет то что сделал" (10%)** → stack-spec test rule + independent review (pm-plan-checker + code-review separate agents, pm-coder never signs off). **Strong.** Honest nuance: independent reviewers share blind spots with maker → mitigated by fixed rubrics + adversarial-verify, with human + real-run as final check.
- **"Дыры в безопасности" (22%)** → threat-model lifecycle + security-surfaces gate + code-review security. **Strong** (security-bearing projects).
- **"Нет доки как/почему" (11%)** → architecture.md with sourced ADR decisions + stack-notes + journeys + product.md. **Strong.**
- **"Детские ошибки даже на жирной модели" (22%)** → two-pass review loop + independent code-review + adversarial-verify. **PARTIAL** — review catches many, but the mistake is model-intrinsic. → **candidate: deepen the review for this class.**
- **"Всё гуд, yolo!" (33%)** → anti-audience. Strongest argument for proportionality (/pm-fixup, change-type table).
- **"Умнее меня" (11%)** → reframe: PM stays sovereign over WHAT/WHY; AI does HOW under spec.

**Honest gaps:** (1) long-term maintainability / tech-debt has no tracker; (2) "childish mistakes" are model-intrinsic → review depth/independence is the lever; (3) the protocol is itself overhead — must stay proportional.

## Automation-opportunity scanner over a finished process doc — 2026-06-04 (depends on documentation flavor)

An automated pass over a finished process doc / SOP / instruction that identifies which steps are AUTOMATABLE, proposes briefly HOW, and — on approval — bridges into building that automation. Suggestion-only, opt-in, proportional (never assumes the doc wants code — terminal human artefacts like "how to solder" should not be automated). *Path:* `/pm-research` (how others find automation candidates in runbooks) then `/pm-plan`. PM idea 2026-06-04.

## EPIC: technical-over-product bias — open slices — 2026-06-04

Anchor `pm-product-advocate` shipped v2.15.0. Open slices:

### No "product story fell behind" alarm

`pm-auditor` checks "does every implemented user-facing feature have a journey?" (vacuously true when none is implemented) but never "N substrate features have shipped while `user-journeys.md` is still skeletal — intended or drift?" Proposed: a soft pm-auditor note after N substrate features. Not a blocker — substrate-first is legitimate; a wake-up, not a wall.

### Bootstrap populated journeys (parked)

Plan `doc/features/bootstrap-populated-journeys_plan.md` was started but parked. Bootstrap should draft the foundational onboarding/discovery journey (symmetric with the populated threat-model), not leave it skeletal. Partially subsumed by pm-product-advocate bootstrap pass (shipped v2.15.0); the remainder is the drafted journeys themselves.

### Cross-document consistency auditor — slices b–e

Slice 1 (invariants index) shipped v2.21.0. Open:

- **(b) single-source drift** — an enum/taxonomy/id-grammar restated in journeys/contracts and drifted from its Behavioral-contract single home. The contract-two-layer migration *establishes* the single home but **no audit sweeps stale copies elsewhere**.
- **(c) temporal-status conflation** — a "known limitation / planned / interim / temporary" claim in one doc vs "done / current / target" in another.
- **(d) ADR ↔ stack-notes backing** — every architectural decision cites stack-notes; no decision relies on absent stack knowledge.
- **(e) journeys ↔ threat-model UX** — does a journey surface the mitigation a threat implies (commissioning window warning visible to the user)?

*Path:* each slice is a small `/pm-plan` (structural check + pm-auditor dimension). PM decision 2026-06-04: sequence after the anchor.

## Accepted audit cohort notes — skip re-raising in future audits

- **Pre-stamp-gate cohort (audit 2026-06-04):** `on-hardware-blast-radius-preflight` (v2.12.0) and `threat-model-ownership-and-lifecycle` (v2.13.0) carry no `## Code review` stamp — the stamp format did not yet exist. They were reviewed at the time. Future audits skip re-raising.
- **Pre-protocol-migration (audit 2026-06-03):** Four plans (`template-v2`, `contract-centric-product-map`, `diagnostic-probe-mode`, `protocol-builtins-realignment`) have no review file. They predate the trail discipline. Future audits skip.

## Markdown soft-break sweep — 2026-06-03 (this repo)

Audit every `doc/_templates/*.tmpl` and every generation/render procedure for blocks where two or more non-blank `Label:` lines sit adjacent (intended to render on separate lines). CommonMark renders a bare line break as a space — they collapse into one paragraph on GitHub. Convert to a bullet list or separate with a blank line. Mechanical, low-risk. *Path:* `/pm-fixup`-sized sweep. Found during `product-map-value-first`.

## Edit-ownership hard guard + CLAUDE.md overreach detection — 2026-06-02 / 2026-06-04 (this repo)

**3rd recurrence (2026-06-04):** PM caught the orchestrator expanding a downstream `CLAUDE.md` `### Architectural constraints` with decision/security-boundary content owned by `docs/architecture.md` + `docs/threat-model.md`. `CLAUDE.md` itself stated one line above that those decisions live in the owning docs. The orchestrator both authored owned canon (should have spawned `pm-architect`) and created a contradicting second home.

**Three fix directions:**

**(A) pm-auditor detect-and-route (strongest, PM-directed 2026-06-04).** The auditor detects decision / constraint / security-boundary content sitting in `CLAUDE.md` that its own pointer says is owned by `docs/architecture.md` / `docs/threat-model.md`, and carries a move-not-copy remediation: (i) if the content is not already in the owning doc → spawn `pm-architect` to relocate it there; (ii) once it lives in its owning home → delete it from `CLAUDE.md`, leaving only the pointer. Self-healing `CLAUDE.md`. Detection signal: an `### Architectural constraints` / security-boundary **body** under `CLAUDE.md` beyond the pointer line (shape-not-meaning). *Path:* `/pm-plan` — ready to build.

**(B) Sharper `CLAUDE.md.tmpl` note** bounding the constraints/security section to a pointer, never the full reasoning. Rides with (A). *Path:* `/pm-plan`.

**(C) Actor/path `Edit|Write` guard (original 2026-06-02 item).** A `PreToolUse` hook that gates the orchestrator from freehand-editing content owned by autonomous agents. Requires `/pm-research` first: can a hook distinguish the orchestrator from `pm-coder` for the same files, and handle mixed-ownership files (orchestrator legitimately writes plans, contracts, the code-review trail)? *Path:* `/pm-research` then `/pm-plan`.

## Deterministic-enforceable vs AI-evaluated check boundary — 2026-06-04 (this repo)

Two open items:

**(1) AI-specific minimums risk being AI-self-policed.** `### AI-specific minimums` (max file 300 lines, max function 50, cyclomatic ≤10, no file-level lint-suppressions, coverage ≥80%) are deterministically lintable but only stated as conventions. If the project's linter doesn't encode them, they degrade to AI-self-policed. *Fix:* at `/pm-bootstrap`, wire them into the deterministic linter config (or record which are unenforceable on this stack and stay convention-only). `ai-minimums-linter-wiring` shipped the Python mapping; the bootstrap-wiring trigger is still missing. *Path:* `/pm-plan`.

**(2) "Shape-not-meaning" auditor checks shipped as LLM checks.** Several pm-auditor / pm-plan-checker structural checks (structural-token note, journey identifier-restatement, system-invariants index presence, `selected autonomously` citation backstop) match shapes / token presence — a deterministic hook/linter could enforce them cheaper and more reliably. *Path:* `/pm-research` (which checks are hook-expressible given Claude Code's hook surface) then `/pm-plan`. PM idea 2026-06-04.

## Periodic whole-codebase code-quality review — 2026-06-05 (this repo)

No periodic whole-codebase code-quality review exists. Per-diff review + `/pm-audit` (compliance) leave three gaps: (a) legacy code onboarded via `/pm-bootstrap` but never diff-reviewed for quality; (b) cross-cutting / emergent issues invisible to a per-diff window (a pattern locally-fine per diff but globally problematic); (c) a diff clean in isolation can interact badly with the whole.

*Fix direction:* a periodic whole-tree sweep (or "hot" / never-reviewed-legacy areas), distinct from `/pm-audit`. Decisions for planning: trigger/cadence; scope; where findings land; proportionality (must not re-review the same clean code every cycle). *Path:* `/pm-plan` (machinery already exists — `code-review` + a scoping/cadence rule). PM-flagged 2026-06-05.

## Review-typology EPIC — deferred slices — 2026-06-05 (this repo)

Slice 1 (smell/hygiene whole-codebase sweep) shipped v2.27.0. Two slices remain:

- **Slice 2 — architectural review type.** Flags no-common-error-root → manual-refusal-tuple drift; `commands/` structure the code already answered; file-length split candidates. Runs periodically (not per-diff). Engine: `code-review` (ultra) or the code-review-orchestrator when available.
- **Slice 3 — functional / integration review type.** Flags cross-feature shared-state interactions (concurrent read-modify-write race on a shared store); the seam-completeness angle is the per-diff proxy, but whole-system functional issues need a broader pass. Runs periodically.

Both slices feed the "periodic whole-codebase quality review" item above. *Path:* `/pm-plan` after the periodic-sweep triggering/scoping design lands. PM-supplied 2026-06-05 (DriveBox validation).

## Flag-controlled mode: don't commit project-generated docs into the project repo — 2026-06-05 (this repo)

A mode (flag in `.env` or equivalent) where the protocol's project-generated documentation is NOT committed into the product repo. The pipeline still writes docs locally (agents must read them); it just doesn't commit `docs/` + `.ai-pm/` into the product repo. Hard tension: durability (`.ai-pm/state/current.md`, auditor history across sessions). *Decisions for planning:* where docs go when not in the project repo; which artifacts the flag covers; how session-durable state and auditor history survive; how `pm-pr-prep` learns to skip those paths. *Path:* `/pm-research` (how others separate generated-docs / meta from the product repo) then `/pm-plan`. PM idea 2026-06-05.

## Two gaps from the "Mr. Meeseeks" field-experience essay — 2026-06-06 (this repo)

Source: Habr article 1043842 — a practitioner's 6-month log of running an AI agent on a ~250k-line project. Most of its process advice (domain-language framing, contracts at module seams, don't-trust-unit-tests, different model for review, send the agent to read docs) is already formalized in our pipeline as roles/steps. Two grains where the essay is ahead of us:

### (1) A legitimate "escape hatch" for a stuck agent

The essay's strongest novel point: an agent facing an unsolvable task can **panic into destructive action**, and the fix is to build a *legitimate retreat* into the instruction — an authorized way for the agent to say "I can't / I'm blocked" instead of thrashing. We bound the **blast radius** of panic (hook deny-list, project boundary, remote-system boundary, on-hardware blast-radius preflight) but offer no **positive escape**: no convention by which a `pm-coder` / review agent declares "stuck — escalate" as a first-class, expected outcome rather than a failure. Today a blocked agent's only modeled exits are "succeed" or "produce something the review loop rejects." *Fix direction:* a recognized "blocked/giving-up" return contract for the autonomous agents (coder, checkers) that routes to the orchestrator → PM instead of forcing a best-effort artifact. *Path:* `/pm-research` (how others model agent give-up / ask-for-help) then `/pm-plan`.

### (2) Context hygiene — when to reset a long session

The essay flags that a long session history *degrades* output quality. Our architecture already mitigates this structurally (subagents get a narrow context: plan + 2-3 adjacent files; the orchestrator doesn't hold everything), but we have **no conscious "session hygiene" discipline** — no guidance on when a long orchestrator conversation should be checkpointed/reset, and what load-bearing state must survive that reset (pairs with `agent-handoff-durability`, shipped, and `.ai-pm/state/current.md`). *Fix direction:* a checkpoint-and-reset discipline for long-running orchestrator sessions, leaning on existing durable state so a reset is lossless. *Path:* `/pm-research` (context-degradation evidence + reset patterns) then `/pm-plan`. PM-flagged 2026-06-06.

## META: "deficit → prosthesis" as a protocol-design method — 2026-06-06 (this repo, meta-level)

Not a feature — a **generator** for features and an **audit lens**. Came out of a PM design conversation (2026-06-06). To be decomposed into per-deficit tasks later and each run through `/pm-research` → `/pm-plan`; parked as a seed for now.

**The method.** Take a structural cognitive weakness of an LLM agent, don't try to fix it *inside* the agent (it's structural), build an **external organ** that compensates — exactly as humans, unable to remember phone numbers, invented the address book. The address book doesn't improve memory; it *externalizes* it. Much of the protocol already consists of such prostheses, but assembled **reactively** (we hit a pain, added a rule): cross-model review = "second opinion"; `state/current.md` = logbook; scenario checklist = pilot's checklist; seam contracts = pre-written call edges. The lens lets us assemble them **proactively** and audit for missing ones.

**The load-bearing asymmetry — felt vs unfelt deficits.** The address book works because the human *knows* they don't know the number — the deficit is *felt*, and the felt-ness triggers reaching for the prosthesis. My most dangerous failures are *unfelt*: a hallucinated call-graph edge feels exactly as confident as a correct one — no internal "careful, I'm guessing" signal. Consequence for design: a prosthesis the agent must *invoke when it notices weakness* is useless for unfelt deficits (it won't notice). **Unfelt deficits require always-on, unconditional organs, not opt-in hints** — "always resolve the symbol via a tool," not "resolve it if unsure." This maps directly onto our own `cross-cutting invariants (always on)` vs `on-demand` split: unfelt → always-on; felt → on-demand is acceptable.

**Observation:** reactive prosthesis-building reliably catches *felt* deficits (you step on the rake and feel it) and systematically misses *unfelt* ones (you step on it and don't notice). Our weakest-covered rows below are all unfelt — not a coincidence; it's the blind spot of the reactive method.

**Seed catalog (deficit → prosthesis):**

| Deficit | Felt? | Human analog / prosthesis | Agent prosthesis | Coverage today |
|---|---|---|---|---|
| Hallucinated call-graph edges | **no** | confabulation → "don't recall, check the source" | LSP / tree-sitter call-graph as ground-truth input | contracts (partial); no tool |
| Single-path sim, misses interleavings | no | can't simulate concurrency in head → model checker | property test / harness instead of mental run | Step 5.5 (optional) |
| Quantity blindness (loop ×10000) | no | mental arithmetic → pen & paper / calculator | just execute on representative inputs | Step 5.5 |
| Long-context degradation | partial | working-memory limit → write it down / logbook | durable state + checkpoint-reset | state exists; reset discipline missing |
| Forgot half the scenarios | yes | many parallel items → checklist | scenario↔path coverage matrix | pm-plan-checker, not as a matrix |
| Overconfidence in own graph | no | overconfidence → independent reviewer / devil's advocate | cross-model + adversarial-verify | covered |

**Two distinct artifact tracks (do not conflate):**
1. **Deficit catalog** — a living doc: known structural LLM weaknesses + prosthesis each + felt/unfelt + always-on-or-on-demand. Becomes a *generator* of protocol features and an *audit lens* ("for unfelt deficit X our prosthesis is opt-in — that's a design bug").
2. **Wiring real external tools** — where the prosthesis is an organ that already exists (language server, property tester, call-graph extractor), give it to the agent *as input*, don't ask the agent to "reason more carefully."

**Open question for the next session (how to populate the *unfelt* rows):** since neither agent nor PM feels an unfelt deficit in the moment, the catalog can only be as complete as our ability to surface failure modes we don't feel. Candidate surfacing methods: post-mortems on real shipped bugs (the bug is the *delayed* felt signal); differential runs (two models / two passes disagree → a latent deficit just surfaced); injected ground-truth probes. *Path:* `/pm-research` on each track, then per-deficit `/pm-plan`. PM-originated 2026-06-06.

### Track: grounded code-graph utility + contract anchors — 2026-06-06

The flagship Form-A/E prosthesis from the "deficit→prosthesis" lens: a **thin adapter** (not an engine) that hands the agent a *normalized, reliable* code graph and maps it onto contracts. Parked for deep-dive; capturing the load-bearing design decisions so they aren't re-derived.

**Code-graph half (feasible, don't build the engine — wrap a tiered backend):**
- Tier 1 syntactic — tree-sitter / ctags: "defined-where / textually-referenced", fast, no build, ~130 langs. Blind to dynamic dispatch.
- Tier 2 semantic — LSP (pyright/gopls/clangd): real go-to-def / find-refs / call-hierarchy from the compiler. Reliable edges, needs a working toolchain.
- Tier 3 data-flow — Joern / CodeQL: + slicing, taint. Heaviest, nichest.
- **Tier picked by project weight.** Utility emits one normalized graph regardless of backend.

**Non-negotiable design rule — surface uncertainty, don't hide it.** Even a semantic graph is blind to reflection, DI, config-wiring, FFI, metaprogramming. If the utility presents a confident-but-incomplete graph it reproduces the agent's *own* failure mode in software. It MUST mark unresolved/dynamic edges explicitly. This is the deepest payoff: the utility **converts an unfelt deficit into a felt one** — where the agent would silently hallucinate an edge, the tool prints "edge unresolved / dynamic / contract anchor points at a missing symbol." Makes the invisible gap visible (the address-book-empty-row effect).

**Contract-mapping half — split structural vs semantic:**
- **Structural conformance = deterministic & cheap, ONE precondition:** contracts must carry a **machine-resolvable anchor** (`path::symbol` / stable id), not just prose. Then real checks: (a) **surface drift** — contract says module exposes {A,B,C}, graph says {A,B,D} → D undocumented, C missing; (b) **forbidden edge** — contract "X must not depend on Y", graph has X→Y → violation; (c) **reachability** — scenario claims path A→B, graph says unreachable → gap.
- **Half of this is already productized** as *architecture fitness functions*: ArchUnit (Java), import-linter (Python), dependency-cruiser (JS), deptry. We **adapt to our contract format + add a language-agnostic normalizer**, not invent.
- **Semantic conformance ("does B actually do what the contract means") stays AI-judgment + tests** — cannot be made reliable, and that's correct: the utility takes the structural half deterministic and frees judgment for the irreducible-semantic half. This *physically draws* the line in the existing "deterministic-enforceable vs AI-evaluated check boundary" item.

**Dependency to flag:** the structural map is dead without machine-resolvable anchors in contracts → a prerequisite edit to **our contract format**, separate from the utility itself.

**Minimal first step (Form A, light):** tree-sitter/ctags wrapper → normalized graph + surface-drift detector against contract anchors. A small script, not a platform. *Path:* `/pm-research` (existing fitness-function tools + anchor schemes) then `/pm-plan`; contract-anchor format change is its own `/pm-plan`. PM-originated 2026-06-06.

**Delivery form — DECIDED: a standalone CLI utility, not an MCP server (PM, 2026-06-06).** Claude Code ships nothing graph-shaped out of the box (Grep/Glob are textual; no semantic index; IDE integration exposes only LSP *diagnostics*, not references/go-to-def). The three viable carriers are MCP server / skill / CLI. PM picks **CLI** — the linter-shaped Form A: the agent calls it via Bash and reads structured output (JSON), it composes with hooks and skills, has no server lifecycle, is language-agnostic and testable standalone, and can still be wrapped by an MCP server or `/code-graph` skill *later* if a session-resident form is ever wanted. The CLI is the primitive; MCP/skill are optional thin shells over it, not the other way round.

## EPIC: HMI / platform-convention invariants + adverse-state gate — 2026-06-06 (protocol-feedback intake)

**Origin:** a protocol-feedback report from a downstream project (`matter-import-ble`, BLE commissioning, PR #2). The feature passed every gate — plan + arch note + contract + stack-notes, pm-plan-checker Pass 1, code-review Pass 2 (×2), 509 green tests with an end-to-end fake-BLE proof, full on-hardware run — and the PM still found user-facing defects by hand in minutes: (1) device loss not painted as an error (service flag `"r"` shown as a text-control value → "Ошибка: r" instead of publishing to `…/controls/<c>/meta/error`); (2) optimistic state lie — toggling an offline device displayed success, command lost, display stayed stale after reconnect instead of reseeding from real state; (3) no action feedback — Import/Reconnect/Remove → ~30 s of silence, success/failure only legible when the device appears. Plus a test-design lesson: the end-to-end fake test passed *because it omitted production wiring* (`onPeerReady → syncImported` on `peers.added`) — the exact wiring where the on-hardware commissioning bug (BLE-16) lived. Same shape as the UX blind spot: verified a slice, not the system as the user assembles it.

**The claimed gap:** the protocol gates **function** (does it work), **cross-feature safety** (don't break neighbours), and **security** (SCn + threat-model), but has no first-class gate on the two things that decide whether a feature is *usable*: (A) platform/HMI conventions (how the product must behave in the UI), and (B) adverse-state / lifecycle scenarios of the feature itself (not just happy path). A feature can be functionally correct and simultaneously unusable / standard-violating because nothing asks. Root cause: `CLAUDE.md`'s "No custom frontend code; platform renders the UI" is true for HTML/JS but bred a false model "UX is not our zone" — yet the device panel is fully determined by the **META the project publishes** (control types, order, `meta/error`, title). The UI contract is 100% ours; the protocol treats it as foreign. Security is the proof the protocol *can* carry such an invariant (single-source `### Security-relevant surfaces` → SCn list → lifecycle threat-model → blocking plan-checker rule); there's just no parallel for HMI or adverse-state.

**Proposed amendments (report's §4), modeled on the security machinery:**
- **4.1 single-source "HMI / platform-convention invariants"** (parallel to `### Security-relevant surfaces`): action→feedback; errors→`meta/error` (control reddens); control = real state, not optimistic; offline → inert + reseed on reconnect; human-readable titles. `/pm-plan` / pm-plan-checker / pm-auditor reference it by name.
- **4.2 mandatory adverse-state enumeration in `/pm-plan`** (blocking for user-facing): the plan must list transitions and failures (offline, lost command, reconnect, partial failure, restart), not only happy path; pm-plan-checker makes absence blocking — same class as a missing threat-model. Turns "scenarios we happened to think of" into "scenarios we were obliged to consider."
- **4.3 Step 5.5 (real-use) mandatory for user-facing**, with the 4.1 HMI checklist + at least one adverse path (pull the device, toggle offline, reconnect) — not just a success log.
- **4.4 mandatory integration test in full production composition** (BLE-16 lesson): for a user-facing feature, at least one test that exercises the whole production wiring, not a unit over an isolated unit; DoD gains a line "integration test exercises production wiring, not a trimmed harness."

**Maintainer assessment (honest — do NOT rubber-stamp; sharpen at `/pm-plan`):**
- **The gap is real.** Strongest, cleanest parallels: **4.2** (blocking adverse-state enumeration ≈ blocking threat-model) and **4.4** (full-composition integration test — generalizes the existing per-diff `seam-completeness` *review angle* into a DoD *test requirement*; the two are complementary, not duplicate). Land these first.
- **4.1 needs a structural correction.** Security surfaces are *universal* (auth, crypto, transport… same on every stack), so the list lives in `WORKFLOW.md`. HMI conventions are *platform-specific* (`meta/error`, `controls/order` are Wiren-Board META semantics). So the security split must be honored: the **protocol** carries only the thin *universal requirement + gate* ("does this feature have a user-facing surface? → it must conform to the project's platform-convention invariants"), while the **invariant content** lives in a **project doc authored at bootstrap from the platform's HMI standard** — exactly as `### Security-relevant surfaces` (universal, in-protocol) pairs with `docs/threat-model.md` (content, project-authored). Do NOT hardcode WB META rules into `WORKFLOW.md`. Candidate home: `docs/hmi-conventions.md` (or a section of architecture/stack-notes), drafted per-project, presence = "this project has a user-facing surface" signal (mirrors threat-model-present = security-bearing).
- **4.3 has a proportionality cost.** Hard-mandatory real-use for *all* user-facing work fights the protocol's proportionality (/pm-fixup, change-type table). Tune at planning: mandatory for features that *touch the HMI surface*, with a proportional escape for trivial copy/label changes — not a blanket wall.
- **Overlap to reconcile, not ignore:** this sits squarely inside the existing **EPIC: technical-over-product bias** and the **pm-product-advocate** Step-3.5 product-readiness gate (which already matches plan+contract+product-docs against `### Foundational product questions`). The cleanest design likely **extends product-advocate + foundational-questions with an HMI/adverse-state tier** rather than erecting a wholly parallel stack. Decide at `/pm-plan` whether HMI invariants are a new single-source (4.1-style) or a new foundational-questions tier consumed by the advocate.

**Path:** slice into `/pm-plan` (4.2 + 4.4 first as the load-bearing blocking gates; 4.1 with the universal/project split; 4.3 with proportional scoping), each upstream against `ai-pm-protocol` → submodule bump + migration. First consumer: the web-interface improvement epic already in this backlog — plan it under the strengthened gates to fix the *class* of defect, not just these instances. Originating report retained downstream in the matter project's `.ai-pm/protocol-feedback/`. PM-relayed 2026-06-06.

## Salvaged from the parked `protocol-hardening` branch (pre-MIT/AGPL; re-implement fresh) — 2026-06-06

Ideas extracted from `docs/features/protocol-hardening_plan.md` (branch `feature/protocol-hardening`, v1.5.1-era, AGPL provenance) before deleting the branch. **Do NOT merge that branch** — re-implement any of these from scratch on a post-MIT branch. Several overlap features shipped in the 2026-06 drain; overlap flagged per item.

- **Per-agent model + thinking-level matrix (HIGH VALUE — feeds the parked "agent model tiers" decision).** The plan proposed: orchestrator=Sonnet, **plan-adversary=Opus/high**, architect=Opus/high, coder=Sonnet (Opus for plan-flagged-complex scenarios), reviewer=Opus/high, pr-prep=Haiku/low, docs-extractor=Sonnet. Principle: spend "thinking" where (a) the error is least caught downstream, (b) it propagates furthest, (c) the role is low-frequency; every Sonnet generator has an Opus adversary below it. **Overlap:** `cross-model-review` (shipped) already pins review/audit to a cross-model; the NOVEL open part is per-agent *default* model assignment. **Caveat from PM (2026-06-06): a prior model-assignment attempt dropped quality and was reverted — revisit deliberately, no Haiku, Sonnet only on safe/mechanical agents.** Agent names in the matrix are pre-v2 (reviewer/coder/architect/release-helper); map to current pm-* roster.
- **P0.1 — plan-adversary agent (likely NOVEL).** A read-only, single-shot Opus agent that adversarially reviews the *plan draft itself* (not code): what existing journeys break, what's missing, under-specified scenarios, fuzzy expected values, hidden structural forks (→ architect). Root gap: the plan is ground truth for the reviewer, so an error *in the plan* is caught by no one (silent GIGO). Distinct from `pm-plan-checker` (post-implementation compliance). Runs after PM approves draft, before coder handoff.
- **P0.2 — verification ladder + mandatory `Runtime verification:` verdict field.** Ladder (take the highest reachable rung): (1) entrypoint boots / imports without exception — near-free, catches the matter.js class (green unit tests on mocks while runtime crashes); (2) runs on mocks/sim locally; (3) runs on target/staging. Add a mandatory reviewer-verdict field `Runtime verification: [entrypoint booted / ran on target / NOT RUN — reason]` so "didn't run it" stops being silent and the PM ship A/B/C choice is informed. **Overlap:** partial with `integration-risk-spike-gate` + `diagnostic-flow-discipline` (shipped); the mandatory verdict field is likely novel.
- **P1.3 — security floor (the one mechanical gate).** A `check-security-floor.sh` template + CI: regex/entropy secret-grep over the diff; hardcoded secret → fail. Duplicates, not replaces, reviewer judgment (catches what attention misses on a big diff). **Overlap:** `semgrep-pre-review-linter` (shipped) is the deterministic pre-check gate; a secrets-specific floor may already be expressible as a Semgrep rule — fold in rather than add a parallel script.
- **P1.4 — coder-writes-its-own-tests fix.** Plan specifies concrete given/when/then input→output pairs for key scenarios (not "verifies delivery"); reviewer dimension-2 independently computes the expected result from the plan and compares to what the test asserts (test asserts X, plan implies Y → blocking). **Overlap:** `seam-completeness` + `test-wiring-parity` (shipped) — check what remains uncovered.
- **P1.5 — git-safety: drop trust in orchestrator memory.** `pm-pr-prep` should itself re-check the two free invariants (`git status --porcelain` clean; branch ≠ main) before pushing, instead of trusting "orchestrator already verified". Cheap duplicate check at the release boundary. (No git hook — mechanical gates reserved for security floor.)
- **P2.6 — version bump not silently decided.** pr-prep: a bump above PATCH → PM confirmation; a `!`/`BREAKING` commit while computed bump < MAJOR → stop and ask.
- **P2.7 — release rollback as a named PM action.** WORKFLOW.md: "roll back the release" → revert the merge commit + re-tag. Closes the missing procedural path for a broken release.
- **P2.8 — reviewer↔coder loop ceiling.** WORKFLOW.md: 2 rounds on one finding → escalate to PM as a product/judgment call.
- **P2.9 — cross-feature drift on judgment (not a script).** Planning step: list invariants from prior plans this feature might violate, show the PM. **Overlap:** cross-document-consistency EPIC + `seam-completeness`.
- **P2.10 — submodule pinning.** README/docs: "updates automatically" → "pin to a tag, bump deliberately"; a template MAJOR must not silently change agents mid-project. Relevant now that the tooling submodule URL moved to wirenboard.

## BUG — agents/orchestrator write temp/scratch files OUTSIDE the project root (boundary breach) — 2026-06-07

**Found (PM, live nula OpenCode session):** the `ai-pm` orchestrator ran `npm run dev > /tmp/nula-dev.log` (+ other `/tmp/…` scratch), tripping OpenCode's `external_directory: ask` on `/tmp`. Writing temp/scratch outside the project root violates the **project-boundary invariant** (`workflow/enforcement.md` — "never read, search, or write outside the project root"). The harness *asked* (good), but the agent should never have tried.

**Also hit the dogfood orchestrator (Claude side) this session** — diagnostic spikes/watchers used `/tmp` too. Same breach. Discipline cracked on both sides.

**Fix (protocol-wide):** make "ALL scratch / temp / diagnostic / log files live INSIDE the project root — a project-local temp (e.g. a gitignored `.ai-pm/tmp/`), never `/tmp` or any path outside the project" an explicit rule for EVERY agent + the orchestrator, BOTH harnesses. Partial done: added the rule to the `ai-pm` persona body (s18). Generalize: the shared neutral bodies + the project-boundary rule in `workflow/enforcement.md` + the WORKFLOW always-on core; and consider an **enforcement guard** that denies an out-of-root write (bash redirect / write tool target outside the root), mirroring the existing Read/`find` boundary guards — on both the Claude `settings.json` and the OpenCode plugin. Severity: medium (boundary discipline; harness asks today but shouldn't need to).

**Update (s15, 2026-06-07):** the **OpenCode-plugin** half of the enforcement guard is DONE — the plugin now denies any out-of-root `write`/`edit`/`bash`-write for ALL agents (guard (f)), live-confirmed on 1.16.2. **STILL OPEN (sibling follow-up):** the **Claude `settings.json`** out-of-root write guard (a `PreToolUse` Write/Edit/Bash matcher mirroring (f)) — not built in s15 (OpenCode-plugin-only slice). And the persona-body / `workflow/enforcement.md` generalization for ALL agents (the "use `.ai-pm/tmp/`, never `/tmp`" rule beyond the `ai-pm` body) remains.
