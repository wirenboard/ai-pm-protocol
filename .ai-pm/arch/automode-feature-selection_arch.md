# automode-feature-selection — design notes

> Arch-review BEFORE coding (the `doc/architecture.md` decision record is a post-coding handoff,
> not this note). The feature extends the shipped `automode` (`### Decision authority`, `WORKFLOW.md`)
> so that in `autonomous` mode the orchestrator **selects** the next feature (idle) / first feature
> (bootstrap) from the PM's canon — backlog + bootstrap mandate + recorded priorities — **announces**
> it (announce-before-act), and **proceeds** into `/pm-plan`, instead of relaying a "which feature?"
> `AskUserQuestion`. Merge/ship stays manual. Sibling note: `.ai-pm/arch/automode_arch.md`.

## Context

`automode` (v2.20.0, PR #199) taught the `### Decision authority` engine to resolve product forks
**within** a feature: derive-from-cited-canon-or-escalate, announce-before-act, escalate-regardless
cap, merge-stays-manual. It never covered **which feature to build next** — so an idle autonomous
project still relays "which feature?" and bootstrap still relays "describe the first feature,"
contradicting the automode vision the backlog records (`.ai-pm/backlog.md:80`).

This feature adds **feature-selection** as a new in-scope autonomous fork. The structural shape is
*not* a new engine — it is a **scope extension of the existing one**, exactly as `automode` framed
the per-feature-vs-project-wide split as "two scopes, one engine." The genuine design content is
narrow and the spawn names it precisely: (1) where the selection *record* lives given selection
**precedes** the feature, (2) whether the escalation triggers are non-confabulating against an
**un-ordered** backlog, (3) whether bootstrap-first and idle-next are truly one fork, (4) whether
"merge stays manual" is sufficient safety altitude for auto-selecting *which work to do*.

This is a protocol-spec change in the template repo (no-user-facing-contract exception; dev-docs in
`doc/`). No runtime, no shared mutable state, no concurrency — so the Section-B event-subscription /
feedback-loop analysis is N/A; in its place the relevant analysis is *which existing single-source +
announce + cap precedents this extension must structurally match, and where (if anywhere) auto-**selecting**
work differs in kind from auto-**resolving** a fork within already-chosen work.* That last clause is the
one place this feature is genuinely new and not a mechanical clone of `automode`, and it is where the
variant work below is spent.

## Adjacent patterns

1. **The `### Decision authority` engine** (`WORKFLOW.md` L250–299) — the engine being scope-extended.
   It already owns, once: the enum + `absent ⇒ interactive` default; the effective-authority resolution
   order; the **derivability test** ("derivable from cited canon ⇒ auto-resolve + announce; not
   derivable ⇒ escalate; no canon passage ⇒ no auto-decision"); the **escalate-regardless cap** (not-derivable
   / security-surface / PM-marked-irreversible); **announce-before-act** (the `fork · chosen · rationale ·
   invariants · (proceeding — interrupt to override)` console line); and **merge/ship stays manual in BOTH
   scopes**. Feature-selection reuses every one of these by name. The single new thing it must supply is the
   *input set* the derivability test reads (backlog + mandate + recorded priorities) and the *record home*
   for a decision that has no advocate trail to ride.

2. **automode's `auto`-entry citation guard** (`pm-plan-checker` DoD + `pm-auditor` dimension 1) — the
   precedent the spawn asks me to weigh question 1 against. Every `auto` `## Resolutions` entry must carry a
   cited canon token; the two backstops **presence-check** that token (shape, not meaning). This is the
   anti-confabulation backstop for in-feature auto-decisions. The question is whether auto-**selection**
   needs an analogous greppable backstop or whether plan-provenance + manual-merge already supply one.

3. **automode's "two scopes, one engine"** (`.ai-pm/arch/automode_arch.md`, "Two scopes, one engine") —
   the exact structural template for spawn question 3. There, project-wide and per-feature were *two reads
   of one value* feeding *one* downstream path; the only scope-dependent step was *computing the effective
   authority*, everything after was scope-agnostic. The test for bootstrap-vs-idle is the same: is the only
   scope-dependent step *computing the candidate set*, with an identical select→announce→proceed path after?

4. **The plan-provenance / `Source:` line** (`pm-plan.md` L199–200 establishes the `Source:` convention for
   stack rules; the plan reuses the same shape for selection provenance) and **`.ai-pm/state/current.md`**
   (`WORKFLOW.md` L360 — Status / Done / Remaining / Touched / Next step / Validation; note: **no provenance
   field exists today**, so a selection note is an *addition* to the snapshot, not a fill of an existing slot).
   These two plus the announce console line are the plan's proposed three-place record.

## Structural questions settled by precedent (no variant needed)

- **No new engine, no new enum value, no migration** (plan Scenarios 1, 7). Feature-selection is a graded
  scope-extension that reuses the derivability test, announce-before-act, the escalate-regardless cap, and
  the merge-manual invariant by name. Interactive mode is byte-unchanged; the behaviour is gated to
  `autonomous` effective authority. This is settled by the `automode` precedent and the consumer-reference
  single-source rule (L299) — the selection rule lives **once** in `### Decision authority`; the Step-6 idle
  transition, the autonomous rider, and `/pm-bootstrap` reference it by name. **Settled.**

- **Canon-derived-or-escalate, never confabulate** (plan Scenario 3). The chosen feature must be an existing
  backlog item or a mandate-implied need carried into the new plan with a cited reference; no derivable
  candidate ⇒ escalate. This is the derivability test applied to a new input set — the same anti-confabulation
  discipline, not a new mechanism. **Settled** (but its *backstop shape* is a real fork — see Variant A/B).

- **Bootstrap-first and idle-next are one fork, two entry points** (plan Scenario 2). Confirmed sound by the
  "two scopes, one engine" precedent: the only scope-dependent step is *computing the candidate set* (idle:
  open backlog items ranked by mandate-alignment + recorded priorities; bootstrap: the mandate plus any
  seeded backlog, with no backlog *history* yet). Everything after — derivability test → announce → proceed
  into `/pm-plan`, or escalate — is identical. **The bootstrap difference the spawn flags (mandate is the
  only signal, no history) is a difference in the candidate-set computation, not in the downstream engine,**
  so it does not warrant separate handling; it warrants one explicit sentence in `### Decision authority`
  that the bootstrap candidate set is mandate-(+-seeded-backlog)-derived. **Settled — unify, with that note.**

## Variant work: the two real forks

### Fork 1 — the selection record's home and its backstop (spawn question 1)

The plan's choice — **no new artifact**; record in (a) the announce console line, (b) the selected plan's
`Source:` provenance line, (c) a one-line note in `current.md` — is **correct on the home** and the reasoning
is sound: selection *precedes* the feature, so the advocate `## Resolutions` trail (where automode records
`auto` decisions) literally cannot host it — there is no feature, no plan, no trail yet at selection time.
Inventing a feature *just* to host its own selection record is circular. So the home is settled: ride the
artifact selection *produces* (the plan) plus the always-present state file. The live fork is **whether
auto-selection needs a greppable backstop analogous to automode's citation guard.**

#### Variant A — provenance line + manual-merge is the backstop (plan's position)

- **Backstop:** the selected plan's `Source: selected autonomously per ### Decision authority; source: <backlog
  item / mandate passage>` line is the auditable record; the load-bearing safety is that the PM reviews **every
  plan and every PR** before anything ships (merge-manual). A mis-selection cannot reach `main` un-reviewed.
- **Relation to adjacent:** asymmetric with automode's citation guard *on purpose* — automode's `auto` entries
  accumulate in a trail the PM reviews in **batch, after the fact**, so they need a presence-keyed gate to
  guarantee the citation is even there. A selection's citation, by contrast, sits in a plan the PM reads
  **front-to-back before coding even starts** — the review is synchronous, not batch, so a missing citation is
  caught by the human reading the plan, not by a grep.
- **Pros:** strictly additive — no new file, no new gate, no new enum value (the plan's whole minimal-surface
  thesis). The plan is the natural home because selection *creates* it. Matches the "auditable through the
  plan" framing the plan and the architecture decision record both want.
- **Cons:** the provenance line is **free-text prose**, not a presence-keyed token. If a future autonomous run
  omits it (or writes a non-cited "selected autonomously" with no `source:`), nothing greps for its absence —
  the silent-confabulation hazard automode's dim-1 guard exists to prevent reappears here, one level up.
- **Risks:** an un-backstopped provenance convention drifts the way a re-encoded default drifts: it holds until
  someone forgets it, and the failure is silent.

#### Variant B — provenance line + a presence-keyed selection backstop (the citation-guard analogue)

- **Backstop:** Variant A's three-place record **plus** a greppable assertion, riding the gate the plan already
  passes through — `pm-plan-checker` (and/or `pm-auditor` dimension 1): *if a plan's `Source:` declares
  `selected autonomously`, it must carry a `source: <token>` canon reference* (a backlog line / `### section`
  token). Shape-not-meaning, exactly like automode's `auto`-entry citation check — the PM still owns whether the
  cited backlog item truly justified the pick.
- **Relation to adjacent:** **symmetric** with automode's citation guard — same presence-key discipline, same
  two backstops, applied to the selection provenance instead of the `## Resolutions` `auto` marker. It reuses
  the gate the selected plan already crosses; it adds **no new gate**, only one assertion to an existing one.
- **Pros:** closes the silent-confabulation hole at the same altitude automode closed it for in-feature
  decisions. An auto-selected feature whose plan lacks a cited source is non-silent. Costs one greppable rule
  on an existing gate.
- **Cons:** slightly more surface than the plan's pure "no new artifact" (though still no new *file* or
  *gate* — only a clause on `pm-plan-checker`'s DoD). Arguably redundant *given* synchronous plan review —
  the PM reads the plan before coding, so a missing citation is visible without a grep.
- **Risks:** marginal over-engineering if the synchronous review is genuinely reliable; the counter-risk is that
  "the PM will notice" is exactly the assumption automode declined to rely on for its `auto` trail.

**Recommendation on Fork 1:** **Variant B.** The home is settled (plan-provenance + announce + `current.md`,
no new artifact — the plan is right that selection precedes the feature). But on the *backstop*, the symmetry
with automode is load-bearing, not cosmetic: automode itself decided that "the PM reviews it later" was **not**
a sufficient guarantee that an `auto` decision carries its citation, and added a presence-key precisely so the
omission is non-silent. Auto-**selection** is the *higher-stakes* cousin (it picks the work, not just resolves a
fork within chosen work), reviewed one step *earlier* — but the same silent-omission failure mode applies. So
add the one greppable assertion on the existing `pm-plan-checker` gate ("a `selected autonomously` provenance
line must carry a `source:` token"); keep the plan's no-new-file, no-new-gate stance otherwise. This is the
cheapest backstop that makes a mis-recorded selection **non-silent** at the same gate automode already uses.

### Fork 2 — the escalation boundary against an un-ordered backlog (spawn question 2)

The plan reuses the escalate-regardless cap with three selection-specific instances: **empty backlog** /
**genuinely-ambiguous top priority** / **high-stakes candidate**. Empty-backlog and high-stakes are clean
(empty is a hard fact; high-stakes is the existing PM-marked-irreversible trigger applied to a candidate).
The **only** genuinely contestable trigger is *"ambiguous priority"* — because, as the spawn notes, the backlog
is **not formally priority-ordered** (the plan explicitly defers a ranking model to a later plan, Out-of-scope).

The tension to name precisely:

- **Over-auto risk:** with no formal ordering, the orchestrator can *always manufacture* a "most-aligned"
  candidate from soft signals (mandate phrasing, recent priorities) and proceed — picking a low-value or
  PM-unintended item under a veneer of derivation, never escalating. This is **selection confabulation**: the
  same hazard as fork-confabulation, but the baseline it confabulates against (a priority order) **does not
  exist**, so the derivability test has *weaker ground to stand on* than it does for in-feature forks (which
  cite a concrete `docs/` passage or contract).
- **Over-escalate risk:** if "ambiguous" is read as "≥2 open items with no formal rank," then *every* multi-item
  backlog is ambiguous and the orchestrator escalates every time — **defeating the feature entirely** (it
  collapses back to "which feature?").

This is a single variant with two boundary formulations; the soundness turns on how "ambiguous" is worded.

#### Formulation X — "ambiguous = ≥2 candidates with no derivable tiebreak" (plan's wording)

- The plan already says exactly this: escalate when "≥2 candidates with no derivable tiebreak from the mandate
  or recorded priorities." This is the **right** formulation precisely because it does **not** require a formal
  order — it requires only a *derivable tiebreak from cited canon*. If the mandate or a recorded priority makes
  one candidate clearly most-aligned, that **is** the cited derivation (and it gets recorded as the `source:`).
  If two candidates are genuinely indistinguishable from the canon, there is **no canon passage to cite** ⇒ the
  derivability test's own rule ("no canon passage ⇒ no auto-decision") fires ⇒ escalate. So "ambiguous priority"
  is **not** a new, fuzzy, confabulation-prone trigger — it is the *existing* derivability test restated for the
  selection input set, and it is non-confabulating **for the same reason** the in-feature test is: it escalates
  exactly when it cannot cite.
- **Why it avoids over-escalate:** a multi-item backlog is *not* automatically ambiguous — it is ambiguous only
  when **no** candidate is derivably most-aligned. A mandate that says "ship the device-pairing flow first" or a
  recorded priority disambiguates a 10-item backlog down to one citable pick. The feature still functions on
  every backlog where the canon implies an order, and only escalates where the canon is genuinely silent on
  order — which is the correct, honest escalation.
- **Why it avoids over-auto:** it forbids the manufacture of a soft "most-aligned" with **no** citable canon
  passage. The anti-confabulation requirement (carry a cited `source:`) is what stops the orchestrator from
  proceeding on a vibe — if it cannot name the backlog line *or* the mandate passage that makes this pick
  derivable, it must escalate. **This is exactly why Fork-1 Variant B's `source:` presence-check matters:** it
  is the mechanical floor that makes "must cite to proceed" enforceable, which is what keeps this trigger honest.

**Recommendation on Fork 2:** keep the plan's Formulation X **verbatim**, with one tightening I'd flag to the
PM: state in `### Decision authority` that the selection derivability test's citable canon is specifically *the
backlog item + the bootstrap mandate + recorded priorities*, and that **absence of a derivable tiebreak — not
absence of a formal rank — is the escalation trigger.** That one sentence forecloses both the "no formal order ⇒
always escalate" misread (over-escalate) and the "no formal order ⇒ I may freely pick" misread (over-auto). The
trigger is sound *because* it inherits the derivability test's cite-or-escalate floor; it does **not** invent a
ranking judgement, which is correctly out of scope.

## Recommendation

The plan's structure is sound and minimal; adopt it with **two refinements**, both small and both at the single
source (`### Decision authority`):

1. **Fork 1 — add the one presence-keyed backstop (Variant B).** Keep "no new artifact" (plan-provenance +
   announce + `current.md` is the right home — selection precedes the feature). But add one greppable assertion
   on the **existing** `pm-plan-checker` gate: a `selected autonomously` provenance line must carry a `source:`
   canon token (shape, not meaning), mirroring automode's `auto`-entry citation guard. This makes a mis-recorded
   selection **non-silent** at the same altitude automode chose, at the cost of one clause and zero new files/gates.

2. **Fork 2 — keep the plan's "no derivable tiebreak" escalation wording (Formulation X), add one
   clarifying sentence** that *absence of a derivable tiebreak from cited canon* (not absence of a formal rank)
   is the trigger. This makes "ambiguous priority" non-confabulating by inheritance from the derivability test,
   and forecloses both the over-escalate and over-auto misreads against the deliberately un-ordered backlog.

Bootstrap-vs-idle unification (one fork, two entry points) and "no new engine / enum / migration" are settled by
precedent — adopt as written. On **safety altitude (spawn question 4): merge-manual is sufficient as the floor,
but I recommend one additional cap** — see Risks.

## Risks for the PM

- **Safety altitude — auto-selecting *which* work crosses a softer line than auto-resolving a fork within chosen
  work; recommend a chaining cap (spawn question 4).** Merge-manual genuinely keeps the highest-stakes gate human:
  nothing ships without a PM-reviewed PR, so a single mis-selected feature is caught at its plan and its PR. That
  is sufficient *per feature*. The residual gap is **sequencing**: nothing in "merge stays manual" stops the
  orchestrator, after a manual merge, from immediately auto-selecting the *next* feature and the *next* — so a PM
  who merges a few PRs without re-checking the backlog could find the pipeline has silently walked several steps
  down a direction they did not intend, each step individually "reviewed" but the *trajectory* never chosen. The
  announce line is the interrupt point, but it relies on the PM being present at each announce. **I recommend the
  spec state explicitly that selection re-derives from the *current* canon each time (it does, since it re-reads
  the backlog) and consider a soft cap** — e.g. selection announces and proceeds, but after a merge the idle-next
  selection is the natural PM-contact point (the PM just reviewed a PR), so the cap may be as light as "announce
  the *next* selection at the moment of the prior merge's idle transition, where the PM is already looking." This
  is lighter than automode's veto-window debate; it costs nothing and closes the unattended-trajectory gap. Flag
  to PM as a **judgement call**, not a blocker — the plan's position (merge-manual suffices) is defensible if the
  PM accepts that an autonomous project may chain features between PM check-ins by design.

- **Selection confabulation has weaker baseline than fork confabulation.** In-feature auto-decisions cite a
  concrete `docs/` passage or contract; selection cites a *backlog item or mandate passage* against a backlog
  with **no formal order**. The derivability-test floor (cite-or-escalate) holds only as strongly as the
  `source:` presence-check is enforced — which is exactly why I'd treat Fork-1 Variant B as the cheap insurance
  rather than optional. Without it, "selected autonomously" with a vague/absent source is a silent direction the
  PM's canon never implied.

- **Bootstrap candidate set is thinner than idle.** At bootstrap there is no backlog history — only the mandate
  (+ any seeded backlog). The unification is still correct (one engine, candidate-set is the only scope-dependent
  step), but the bootstrap escalation rate will be *higher* by nature (the mandate alone more often yields no
  single derivable first feature), and that is the **correct** behaviour, not a bug — bootstrap should escalate
  "describe the first feature" whenever the mandate does not derivably imply one. Make sure the spec frames a
  bootstrap escalation as expected-and-healthy, so it is not later "fixed" by loosening the derivability floor.

- **Provenance is free-text until backstopped.** The `Source: selected autonomously per ### Decision authority;
  source: <…>` line is prose. Until the Fork-1 backstop lands, its presence is a convention, not a guarantee —
  the standard single-source drift risk. (This is the same class of risk automode's note flagged for a
  re-encoded default: a load-bearing fact stated only where a reader/grep can miss it.)

- **Plan should reuse the existing `Source:` line, not add a parallel field.** Minor structural note for the
  coder: the plan provenance already has a `Source:` convention (`pm-plan.md` L199–200); the selection record
  should extend that line's vocabulary, not introduce a second "Selected-by:" field — keep it one provenance
  line so the Fork-1 grep has a single token to key on. **Plan should be updated to** name the exact line it
  extends (no second field) so the backstop has an unambiguous grep target.
