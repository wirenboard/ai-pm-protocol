# orchestrator-read-discipline — design notes

## Context

`workflow-progressive-disclosure` (v2.29.0, `.ai-pm/arch/workflow-progressive-disclosure_arch.md`)
shrank `WORKFLOW.md` to an ~80-line eager-loaded thin core + router, and moved every detailed rule
into on-demand `workflow/*.md` topic files. The reliability story for that move (its Decision 5)
rested on **procedural Read steps**: a consumer that *reaches a step* carries an explicit
"Read `workflow/<topic>.md` before X" instruction, so the rule is pulled before use. That closes
failure shapes B and C (a command/agent forgets the Read) — but it has a structural blind spot it
named only as residual risk 1: **"Read-discipline is by-instruction, not platform-enforced."**

The blind spot is **the orchestrator's own freeform conversational reasoning**. A command or agent
runs an *injected procedure* (it carries its own Read steps); the orchestrator, between pipeline
steps, applies cross-cutting rules in free reasoning with **no procedure to attach a Read step to**.
When such a rule was demoted to an on-demand topic file, the orchestrator can apply a half-remembered
version from stale memory of the pre-shrink `WORKFLOW.md`. This happened live: the orchestrator
applied the `### Decision authority` escalate-regardless cap from memory, **without** reading
`workflow/decision-authority.md`, and mis-escalated on a fabricated "high-stakes" premise.

The first-attempt fix on the current branch is a **band-aid**, and the PM rejected it as such: it
added an always-on one-liner (`WORKFLOW.md:16`, "Read before apply") to the thin core — i.e. it
"fixes" a by-instruction reliability gap *with another instruction*. The same recall-vs-presence
failure mode that demoted the rule applies to the instruction that says to go re-read it.

**The structural choice.** This note evaluates a SYSTEMIC fix: re-draw the always-on / on-demand
**boundary** of Decision 2 by a principled criterion, so the decision-critical kernel of a
freeform-applied cross-cutting rule is *present in context* (authoritative over memory) rather than
relying on a please-read instruction. There are several plausible homes for "the kernel" and a real
single-source hazard (double-encoding the enum/default → drift), so the structural decision is
genuine — and it is a **refinement of `workflow-progressive-disclosure`'s Decision 2**, not a new
axis.

## Adjacent implementations

The boundary already in force is the right reference set — the question is which side of it
decision-authority belongs on.

1. **The cross-cutting one-liners already in the thin core** — `WORKFLOW.md:11–16`
   (`pm-*`-not-`wb-*`, project-boundary, edit-ownership, remote-system, language-canon, and the
   band-aid read-before-apply). Each is an invariant that **holds on every action regardless of
   step**, stated as an always-true one-liner in the eager-loaded core, with its **full detail**
   on-demand in a topic file (`workflow/enforcement.md`, `workflow/pm-comms.md`). Dispatch model:
   *the one-liner is the always-true subset present in context; the topic file is the elaboration,
   pulled when the carve-outs/lists are needed.* This is exactly the kernel ↔ elaboration split this
   feature needs — decision-authority's kernel belongs **in this list**, its elaboration stays in
   the topic file. The relevant property: these one-liners are **not** double-encodings of a topic
   enum/default — they are a *different granularity of the same single source* (Decision 7 of
   progressive-disclosure), the core carrying the always-true subset, the topic file canonical for
   the full rule. No enum or default is restated in the core today.

2. **`### Project kind` — the deliberate counter-example (stays fully on-demand).** `### Project
   kind` (`workflow/project-kind.md`) carries an enum + an `absent OR unrecognized ⇒ software`
   default and is referenced by name from ~20 consumers, with the same "never re-encode" prohibition
   as decision-authority. Yet its **kernel stays entirely in the topic file** — and correctly so.
   Project-kind is **set-once and applied only *inside* procedures**: every branch on it
   (the mandatory-table rider, Step 5 Pass-2 routing, the `## Validation` gate, the
   `documentation` foundational-questions tier) lives *within* a command/agent that carries its own
   Read step (`pm-plan.md` reads it at Pass-2 routing, etc.). The orchestrator never branches on
   project-kind in *freeform* reasoning between steps — it is read at a known pipeline position. So
   project-kind has no kernel that needs to be present-in-context outside a procedure. This is the
   load-bearing contrast: **the criterion is not "has an enum/default" (project-kind has one and
   stays on-demand); it is "applied in orchestrator freeform reasoning, outside any procedure."**

3. **`### Decision authority` — the mis-classified case** (`workflow/decision-authority.md`).
   Read closely, it is two things welded together:
   - A **cross-cutting kernel** the orchestrator applies in freeform reasoning *on every fork, at
     any moment*: the escalate-regardless cap and its three triggers (lines 34–40), the derivability
     test "derivable-from-cited-canon-or-escalate" (29–32), announce-before-act (42),
     merge-always-manual in both scopes (46), and the enum + `absent ⇒ interactive` default
     (5–8, 12). This governs *escalate-or-proceed* and the announce-and-proceed interaction style —
     it fires the same way project-boundary or edit-ownership fires: independent of which step you
     are in. **This is the same tier as the core one-liners in #1.**
   - A **procedural elaboration** applied *inside* known procedures (each of which already carries a
     Read step): the three named procedural-gate instances (feature-selection / plan-approval /
     the optional-offer gates, 48–68 — wired into `pm-plan.md` and `pm-audit.md` with explicit
     "Read `workflow/decision-authority.md` before…" steps), the `## Resolutions` `auto|escalated`
     recording mechanics (72), the per-feature override + effective-authority resolution order
     (23–27), the veto-window caveat (44), and the consumer list (74).

   The mis-classification: progressive-disclosure's Decision 2 filed **the whole subsection**
   on-demand, treating it like project-kind (#2). But unlike project-kind, decision-authority's
   *kernel* is freeform-applied — so demoting it stranded a cross-cutting invariant behind a Read
   the orchestrator's free reasoning has no procedure to trigger. The fix is to split it along the
   #1 line, not to add a please-read for it.

## Behavioral risks in this area

Not event-driven code — no subscription/emit feedback loops. The risks are single-source and
boundary-discipline:

- **Double-encoding → drift (the hard constraint).** If the kernel's enum/default lands in the core
  *and* stays verbatim in the topic file, the protocol now has two homes for the same rule — the
  exact back-compat drift the "never re-encode the default" prohibition exists to prevent
  (progressive-disclosure Decision 7; the prohibition text at `decision-authority.md:74`). The
  resolution must give the kernel **exactly one home**.
- **Over-correction → undoing progressive-disclosure.** If "freeform-applied" is read loosely, every
  topic rule floods back into the core and the ~74% always-loaded win is lost. The criterion must be
  *narrow* (only genuinely-cross-cutting kernels return) and the growth quantified.
- **Orphaned by-name references.** 16 live `### Decision authority` references resolve by finding the
  `### Decision authority` heading "in `workflow/decision-authority.md`". If the heading moves or the
  kernel splits, a reference could dangle. The resolution must keep every reference resolving.
- **Recall masquerading as presence.** The honest ceiling (Q4): even with the kernel in the core, no
  platform gate can detect "the orchestrator is *about to apply* a workflow rule" — it is a semantic
  judgement. Presence-in-context is the structural ceiling; a Read-before-apply instruction is only a
  by-instruction backstop and cannot be the primary mechanism (that is what the band-aid got wrong).

## Variant A: Move the kernel to the core as a cross-cutting invariant; topic file keeps only elaboration and references the kernel

- **Where:** A new always-on bullet in `WORKFLOW.md` `## Cross-cutting invariants (always on)`
  (alongside the #1 one-liners), carrying the decision-authority **kernel**.
  `workflow/decision-authority.md` keeps **only the elaboration** and **references** the core kernel
  instead of restating it. The `### Decision authority` **heading stays in the topic file** (the
  by-name anchor is preserved); the core bullet is the always-true subset, the topic file remains the
  reference target for the 16 consumers.
- **The kernel ↔ elaboration line (Q1), validated and refined:**
  - **Kernel → core (the always-true subset, single-home in core):** the escalate-regardless cap
    with its three triggers (not-derivable-from-canon / security-surface-on-security-bearing-project /
    PM-marked-irreversible-or-high-stakes); the derivability test (*derivable-from-cited-canon ⇒
    auto-resolve; else escalate*); announce-before-act; merge-always-manual-in-both-scopes; and the
    enum (`autonomous | interactive`) + the `absent OR unrecognized ⇒ interactive` default. These are
    the data points the orchestrator needs *present* to resolve any fork without recall.
  - **Refinement to the proposed line — keep the enum/default *statement* in the core kernel, and
    DELETE it from the topic file (do not leave it in both).** The proposal listed the enum+default
    under the kernel; this is correct, but the hard constraint forces the consequence: the topic file
    must **stop stating** the enum and the `absent ⇒ interactive` default and instead say
    "the enum and load-bearing default are the core's `### Decision authority` kernel — not restated
    here," mirroring how `workflow/enforcement.md` does not restate the edit-ownership one-liner.
    Single home = core. (The *value home* — the dedicated `.ai-pm/decision-authority.md` file and
    *why a dedicated file*, lines 14–21 — is elaboration about *where the per-project value lives*,
    not the semantic kernel; it **stays in the topic file**.)
  - **Elaboration → topic file (references the kernel, restates nothing):** the three named
    procedural-gate instances (feature-selection / plan-approval / optional-offer gates); the
    feature-selection specifics (candidate set, the `Source:` provenance line, the pm-plan-checker
    backstop); the `## Resolutions` `auto|escalated` recording mechanics; the value-home file +
    rationale; the per-feature override + effective-authority resolution order; the veto-window
    caveat; the consumer list and the "never re-encode" prohibition (the prohibition itself stays —
    it now points at the core as the single home).
- **Core-growth quantification (Q1).** Core today: 80 lines / ~1.23k words (the plan's "~2.5k tokens"
  is the generous ceiling; raw is ~1.6k). The kernel as a tight always-on bullet — modeled on the
  existing edit-ownership bullet (`WORKFLOW.md:13`, one dense sentence + a "full detail: <topic>"
  pointer) but slightly longer because the cap has three named triggers — is **~5–7 lines / ~120–160
  words**, i.e. **+6–9% lines, ~+0.2–0.3k tokens**. It also **replaces** the band-aid bullet at
  `WORKFLOW.md:16` (−1 line), so net core growth is **~+4–6 lines**. This is proportional: one
  genuinely-cross-cutting kernel returns, paid once on every load — far smaller than the ~12.5k saved
  by the original move, and it does not pull any *procedural* detail back. The win is preserved.
- **Relation to adjacent:** *Symmetric* with #1 — it makes decision-authority's kernel a peer of the
  edit-ownership / remote-system / project-boundary / language-canon one-liners, which are already
  core for the identical reason (freeform-applied on every action). It is *asymmetric* with #2
  (project-kind) **by design and correctly** — project-kind is set-once and procedure-applied, so its
  kernel stays on-demand; decision-authority is freeform-applied, so its kernel comes to the core.
  The asymmetry is the *point*: the criterion discriminates between them.
- **Pros:**
  - **Structural, not by-instruction.** The decision-critical rule is *present in context*,
    authoritative over memory via the core banner's existing "when the two documents disagree, this
    one wins" (`WORKFLOW.md:1`). The orchestrator cannot apply a stale cap because the live cap is in
    front of it. This is the systemic fix the PM asked for.
  - **Single-source preserved.** Exactly one home for the kernel (core); the topic file references it
    and restates nothing. No double-encoding.
  - **By-name references survive unmoved.** The `### Decision authority` heading stays in
    `workflow/decision-authority.md`; all 16 references resolve unchanged (Q-resolution below).
  - **Proportional.** Only the kernel returns; the procedural bulk (the larger share of the 16k-byte
    topic file) stays on-demand. progressive-disclosure is not undone.
- **Cons:**
  - The core grows ~4–6 lines net. Mitigated: it is a genuinely cross-cutting kernel and replaces the
    band-aid line; the boundary criterion (Q2) prevents this from being a precedent for non-kernels.
  - The kernel and its elaboration now live in two files — a maintainer editing the cap must edit the
    core, not the topic file. Mitigated: the topic file explicitly says the kernel is the core's and
    is not restated here (so there is nothing to wrongly edit in the topic file), exactly the
    discipline `workflow/enforcement.md` already follows for the edit-ownership one-liner.
- **Risks:** the drift risk is closed by the delete-from-topic-file refinement; the orphan risk is
  closed by keeping the heading + anchor in place; the over-correction risk is bounded by Q2's
  criterion.

## Variant B: Leave the kernel in the topic file; add a one-line *summary* of the cap to the core (summary + full, both present)

- **Where:** keep `workflow/decision-authority.md` exactly as-is (kernel intact); add a core bullet
  that *summarizes* the cap/derivability test for orientation.
- **Relation to adjacent:** superficially like #1, but it **double-encodes**: the cap's triggers and
  the enum/default would be stated in both the core summary and the topic file.
- **Pros:** the topic file is untouched, so no consumer reference or elaboration moves.
- **Cons (decisive against):** this **violates the hard constraint** — a core summary *and* a full
  topic file that both encode the cap/enum/default is exactly the drift surface the single-source
  discipline forbids (the "never re-encode the default" prohibition exists to prevent precisely
  this). It is also barely distinguishable from the rejected band-aid: a partial restatement the
  orchestrator might apply from the *summary* while the authoritative triggers diverge in the topic
  file. Rejected.
- **Risks:** silent drift between summary and source — the worst outcome, because the orchestrator
  would apply a *confidently-present* but stale summary.

## Recommendation

**Variant A.** It is the only option that is simultaneously systemic (kernel present-in-context,
authoritative over memory) and single-source (exactly one home — the core — with the topic file
referencing and restating nothing); it makes decision-authority's kernel a peer of the
already-core cross-cutting one-liners it actually belongs with, keeps every by-name reference
resolving (heading unmoved), and grows the thin core by only ~4–6 net lines (one genuinely
cross-cutting kernel, the band-aid bullet replaced), so progressive-disclosure is refined, not
undone. Variant B is rejected outright: it double-encodes the cap/enum/default, the precise drift
the single-source discipline forbids.

---

## Decision — where the boundary PRINCIPLE lives (Q2)

For the fix to be **systemic** (prevent recurrence), the *criterion* that put decision-authority's
kernel in the core must itself be recorded — otherwise the next freeform-applied rule gets
mis-filed the same way. The criterion:

> **A rule the orchestrator applies in its own freeform reasoning, outside any injected
> command/skill procedure (potentially on every action), keeps its decision-critical kernel in the
> always-on core.** On-demand carries only what is applied *inside* a procedure (which carries its
> own Read step) or *at a specific pipeline step*.

**Recommendation: (a) + (c), not (b).**

- **(a) A one-line criterion in the thin core's intro.** The core's intro (`WORKFLOW.md:7–9`) already
  describes the always-on set as "invariants that must hold on *every* action." Sharpen that one
  sentence to state the discriminator explicitly: *cross-cutting = applied in freeform reasoning on
  every action; on-demand = applied inside a procedure or at a specific step.* This is where a future
  maintainer deciding "core or topic file?" actually looks, it costs ~1 line, and it makes the
  boundary self-documenting at the point of use. **This is the load-bearing home for the principle.**
- **(c) Record it as a Decision in this arch note** (this section) **and as a one-line refinement to
  `workflow-progressive-disclosure`'s Decision 2** — Decision 2 partitioned sections as
  "invariant on every action vs consulted at a step" but lacked the *freeform-vs-procedure*
  sharpening that distinguishes decision-authority's kernel from project-kind's. That refinement
  belongs in the architecture decision record (`doc/architecture.md`), owned by `pm-architect`, since
  it amends a recorded boundary decision. (Arch notes are frozen historical records — this note
  *records* the refinement; the *live* statement lands in (a) and in `doc/architecture.md`.)
- **(b) A standalone `workflow/` decomposition/maintenance note is rejected** — it would be a *new
  on-demand file for the rule that says when rules may be on-demand*, i.e. the maintainer applying the
  decomposition criterion (a freeform judgement) would have to *remember to Read it*: the same
  recall-vs-presence trap this whole feature exists to close. The criterion is itself a cross-cutting
  judgement, so by its own logic it belongs in the always-on core intro (a), not behind a Read.

This split keeps the principle present where it is applied (a), and recorded where decisions live
(c), without creating a new on-demand surface that reintroduces the bug (rejected b).

---

## Decision — sweep of the other on-demand files against the new criterion (Q3)

Read against the criterion: `workflow/decision-authority.md`, `workflow/enforcement.md`,
`workflow/project-kind.md`, `workflow/pipeline.md`, `workflow/review-typology.md`, and scanned the
remaining `workflow/*.md` (roster, mandatory-matrix, security-surfaces, foundational-questions,
state, incident, protocol-gap, maintenance, pm-comms, examples). The question for each: **is there a
kernel the orchestrator applies in freeform reasoning, currently pointer-only behind a Read?**

**Finding: decision-authority is the only mis-placed file. The expectation holds — verified, not
assumed.**

- **`workflow/enforcement.md`** — its freeform-applied kernels (edit-ownership, remote-system,
  project-boundary, `pm-*`-not-`wb-*`) are **already in the core as one-liners** (`WORKFLOW.md:11–14`);
  the topic file correctly holds only the *elaboration* (carve-outs, forbidden/allowed lists, hook
  mechanics, the audit-to-fix transition rule). This is the exact target shape Variant A creates for
  decision-authority. The audit-to-fix transition (enforcement.md:32–36) is applied *inside* the
  `/pm-audit` → `/pm-plan` procedure (and `pm-audit.md` carries its Read), not in unattached freeform
  reasoning — correctly on-demand. **No change.**
- **`workflow/project-kind.md`** — has an enum + load-bearing default, but is **set-once and
  applied only inside procedures** (Pass-2 routing, the mandatory-table rider, the `## Validation`
  gate, the foundational-questions tier), each with its own Read step in the owning command/agent.
  The orchestrator does not branch on project-kind in unattached freeform reasoning. **Correctly
  on-demand — no change.** (This is the decisive contrast that proves the criterion is "freeform-
  applied," not "has an enum/default.")
- **`workflow/review-typology.md`** — the five review types / det-vs-AI split / new-code-gating are
  applied *at* Step 5 and inside `/pm-audit` (2 live consumers, both carrying Read steps). Step-
  specific, procedure-applied. **Correctly on-demand — no change.**
- **`workflow/pipeline.md`** — the Step 0–7 *skeleton* is already eager-loaded as the core router
  (`WORKFLOW.md:45–54`); the file holds the full step *bodies*, applied when driving a feature
  through the pipeline (the command/agent procedures carry the Read). **Correctly on-demand — no
  change.**
- **`workflow/security-surfaces.md`, `foundational-questions.md`, `mandatory-matrix.md`,
  `roster.md`, `state.md`, `incident.md`, `protocol-gap.md`, `maintenance.md`, `pm-comms.md`,
  `examples.md`** — each is consulted *at a specific step / condition* inside a procedure that
  carries its own Read step (security surfaces at plan/plan-checker/audit; foundational questions in
  the advocate flow; the mandatory matrix at planning; pm-comms one-liners already in the core with
  the full list on-demand; etc.). None carries a kernel the orchestrator applies in unattached
  freeform reasoning. **All correctly on-demand — no change.**

**Sweep conclusion:** the criterion reclassifies **exactly one** kernel (decision-authority's). The
already-core cross-cutting one-liners (edit-ownership / remote-system / project-boundary /
language-canon / `pm-*`-not-`wb-*`) confirm the criterion was *already* applied correctly for every
rule **except** decision-authority — which slipped through because, unlike the others, its kernel was
buried inside a large subsection that also contained heavy procedural elaboration, so the whole
subsection was filed on-demand by section-shape rather than by kernel-altitude. No other file needs
to move. progressive-disclosure's boundary was 14/15-correct; this feature fixes the one miss.

---

## Decision — the honest residual (Q4)

**A platform hard-gate is impossible here, and the systemic ceiling is "present in context," not
"forced to re-read."** The trigger that would need detecting — *"the orchestrator is about to apply a
`workflow/*.md` rule in its reasoning"* — is a **semantic judgement no regex / PreToolUse /
UserPromptSubmit hook can make**: applying a rule in free reasoning touches no tool call, no file
path, no command — there is nothing for a hook to fire on. (The plan's Out-of-scope already records
this; this note confirms it as the structural ceiling, not merely a scoping choice.)

Therefore the systemic ceiling is exactly: **the decision-critical kernel is *present in context*
(eager-loaded in the core, authoritative over memory via "when the two documents disagree, this one
wins"), not relying on recall.** Variant A reaches that ceiling for the one kernel that was below it.
Recurrence prevention is the criterion (Q2 (a)+(c)), which keeps future cross-cutting kernels above
the line in the first place.

**The call on "Read before apply": DEMOTE to a secondary backstop, do not keep it as the primary
one-liner — and trim it.** The band-aid bullet (`WORKFLOW.md:16`) was rejected as the *primary*
mechanism precisely because it is by-instruction. Two sub-questions:

- **Keep it at all?** Keep a *trimmed* form, as a genuine secondary backstop for the **procedural
  elaboration** that legitimately *stays* on-demand (the named procedural gates, the `## Resolutions`
  mechanics, the value-home file). Once the *kernel* is in the core, the read-before-apply instruction
  no longer carries the kernel's weight — but it still usefully reminds the orchestrator to pull the
  *elaboration* topic file before acting on a procedural detail. It is now a true backstop (covers the
  long tail), not a load-bearing-by-instruction primary (which is what the PM rejected).
- **Revised wording.** Replace the current standalone "Read before apply" bullet with one that (1) no
  longer pretends to carry decision-critical kernels (they are now core invariants, present already),
  and (2) frames itself explicitly as the secondary pull-the-detail reminder for on-demand
  *elaboration*. This removes the "fix an instruction-gap with an instruction" smell: the
  *decision-critical* rules are present; the instruction only covers the *non-critical detail* whose
  on-demand placement is correct.

So the residual is honest and bounded: structural mechanism (kernel present in context) for the
decision-critical layer; by-instruction backstop (trimmed read-before-apply) only for the procedural
detail that *should* be on-demand; and the criterion (Q2) to keep the line correct going forward. No
hook is possible and none is proposed.

---

## Decision — by-name reference resolution (single-source / no orphan) (Q5)

The 16 live `### Decision authority` references (in `pm-plan.md` ×7, `pm-bootstrap.md` ×3,
`pm-plan-checker.md` ×2, `pm-auditor.md` ×1, `pm-audit.md` ×1, plus `doc/architecture.md` decision
records ×3 which are frozen history) resolve by finding the `### Decision authority` heading
**in `workflow/decision-authority.md`**. Resolution under Variant A:

- **Keep the `### Decision authority` heading in `workflow/decision-authority.md`** — the anchor does
  **not** move. All 16 references stay byte-identical and keep resolving. The topic file remains the
  named target; it now *references* the core kernel for the enum/cap/default and holds the
  elaboration. **No reference is repointed, no consumer is touched for the anchor.** (This is the
  cheapest, lowest-orphan-risk choice and preserves the proven "section name is the anchor"
  discipline from progressive-disclosure Decision 4.)
- **Why not repoint references to the core kernel:** the consumers reference the *whole* rule (enum +
  cap + procedural mechanics) — the topic file is still the correct one-stop target that *contains*
  (by reference) the kernel and (verbatim) the elaboration. Repointing 16 references would be churn
  with no benefit and would split a single by-name target into two. **Stay-as-is is correct.**
- **The two consumers that already carry an explicit "Read `workflow/decision-authority.md`
  before…" step** (`pm-plan.md` Step 3.5 / per-feature override branch, `pm-bootstrap.md` first-
  feature branch) are **unaffected** — they read the topic file, which still carries everything they
  need (the kernel by reference + the elaboration verbatim). Those Read steps stay.
- **The topic file's own internal references to the kernel** become "see the `### Decision authority`
  kernel in `WORKFLOW.md`" where it previously stated the enum/cap/default inline — this is the one
  *new* by-name link, and it points *into* the core (which is always loaded, so it always resolves).
- **`doc/architecture.md` decision records (×3, lines 190–206)** say "single-sourced in
  `### Decision authority` in `WORKFLOW.md`" — historical narrative; **do not rewrite** (progressive-
  disclosure Decision 4's frozen-record rule). Note: line 192 already reads "`WORKFLOW.md`" (pre-
  shrink phrasing) and line 318's File-layout row reads `workflow/`-current — the narrative is
  intentionally not chased. No change.

**Orphan check:** the `### Decision authority` heading remains the single resolving target for every
live reference; the new core kernel adds one inbound link from the topic file (resolving into the
always-loaded core). No reference is left dangling; no second target is created for the existing
anchor. Single-source holds — one home for the kernel (core), one home for the anchor + elaboration
(topic file), and the topic file references the core rather than re-encoding it.

---

## Decision — keep / change / drop for the in-flight branch

The current `feature/orchestrator-read-discipline` branch carries the band-aid attempt. Revised
implementation:

- **KEEP — the root `CLAUDE.md`** (Scenario 1, the `@WORKFLOW.md` dogfood import + `## Project kind:
  software` line + dogfood note). This is **structural and correct**: it is the prerequisite that
  makes *any* core change reach the orchestrator-as-dogfooder (without it, nothing auto-loads in this
  repo, so even the kernel-in-core fix would not reach the live dogfooding orchestrator). It is the
  load-bearing half of the systemic fix — the kernel must be *present*, and `CLAUDE.md` is what makes
  the core present in this repo. Keep verbatim.
- **KEEP — the `doc/architecture.md` File-layout row for the new root `CLAUDE.md`** (the A4
  File-layout ↔ tree cross-check). Still valid; the root `CLAUDE.md` is still being added. Owned by
  `pm-architect` on the post-coding handoff.
- **CHANGE — Scenario 2.** Replace "add an always-on *Read-before-apply* one-liner" with **"move the
  decision-authority *kernel* into the core as a cross-cutting invariant"** (Variant A): add the
  kernel bullet to `## Cross-cutting invariants`, delete the enum/cap/default *statement* from
  `workflow/decision-authority.md` and replace it with a reference to the core kernel, and sharpen the
  core intro with the boundary criterion (Q2 (a)). This is the band-aid → systemic swap.
- **CHANGE → DEMOTE — the band-aid bullet (`WORKFLOW.md:16`).** Do not keep it as the primary
  one-liner. Replace it with the trimmed secondary-backstop form (Q4): a pull-the-*elaboration*
  reminder for on-demand procedural detail, explicitly *not* the carrier of decision-critical
  kernels (those are now core invariants).
- **ADD — the `doc/architecture.md` Decision-2 refinement** (Q2 (c)): a one-line amendment recording
  the freeform-vs-procedure sharpening of the boundary criterion. Owned by `pm-architect`, same
  post-coding Docs-to-update handoff.
- **ADD — `workflow/decision-authority.md` to "Docs to update"** as a `pm-architect`/`pm-coder` edit
  (it is template-repo source, not an agent-owned `docs/` artifact — `pm-coder` owns it, the same as
  `WORKFLOW.md`): delete the inline enum/cap/default, insert the by-name reference to the core kernel.
- **DROP — nothing else.** Scenario 3 (additive, no migration) still holds: the kernel rides the thin
  core, the `@.ai-pm/tooling/WORKFLOW.md` import path is byte-unchanged, no `MIGRATIONS.md` entry, no
  hook touched, `tests/hooks.sh` stays 74/74.

**Plan should be updated to** reflect the band-aid → kernel-move swap in Scenario 2, add the
`workflow/decision-authority.md` edit and the `doc/architecture.md` Decision-2 refinement to "Docs to
update," carry forward the anchor-inventory clean-grep (every `### Decision authority` reference still
resolves; the new core kernel bullet exists; the topic file no longer states the enum/default) and
add a **no-double-encoding check** (the enum/cap/default appears in the core kernel and **nowhere
else**, including the topic file) as the verification floor that enforces the single-source hard
constraint.

## Net assessment

The feature's *direction* (a forcing function so the orchestrator does not apply a half-remembered
rule) is right, and Scenario 1 (the dogfood `CLAUDE.md`) is the correct, structural, keep-as-is half.
The Scenario-2 mechanism must change from band-aid (an instruction to re-read) to systemic (the
decision-critical kernel present in context as a cross-cutting core invariant, the topic file
referencing it, the boundary criterion recorded so it recurs correctly). The sweep confirms
decision-authority is the only mis-placed kernel — progressive-disclosure's boundary was right
everywhere else. The honest ceiling is "present in context," no hook is possible, and the
read-before-apply instruction survives only as a trimmed secondary backstop for the on-demand
elaboration.
