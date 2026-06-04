# automode-procedural-gates — plan

*Extends the shipped `automode` (v2.20.0, PR #199) — the `### Decision authority` engine in `WORKFLOW.md`. PM-directed 2026-06-04 after hitting the gap repeatedly across two distinct surfaces: the orchestrator kept relaying **"which feature next?"** on an idle autonomous project AND **"do you approve the plan?"** after drafting a plan — both on a project already in `autonomous` mode. Source: `.ai-pm/backlog.md:80` — the automode vision: "the PM front-loads everything at bootstrap, then the orchestrator + agents carry the feature/product to the end with **NO further questions**." The shipped slice redirects only the product-readiness **advocate gaps within a feature**; it never relaxed the pipeline's **routine procedural gates** — feature-selection, plan-approval, the architect-review offer, the retrospective/migration nudges, the contract-existence question — so an autonomous project still blocks on each of them, contradicting the vision.*

Close the general gap, not one instance of it. In `autonomous` mode, a PM-touch that is a **routine procedural checkpoint** (not a genuine product fork) becomes **announce-and-proceed** instead of a blocking ask; a **genuine product fork** still uses the derivability test (auto-resolve from cited canon or escalate — exactly as the shipped automode already does for advocate gaps); and **merge/ship stays manual** (the load-bearing safety). The PM keeps: authorship of the backlog and the bootstrap mandate (what is even a candidate / what the product is), interrupt-at-every-announce, full plan + PR review, and **merge authority**.

Meta-feature on the template repo: **software-kind**, the no-user-facing-contract exception; dev-docs in `doc/` (singular). Every scenario subject is the orchestrator / the `### Decision authority` engine / `WORKFLOW.md` / `/pm-plan` / `/pm-bootstrap` (non-human) → not user-facing → no Product Contract, no product-readiness advocate gate, no `## Validation` gate (Pass-2 is `code-review`). Verification = editorial + clean-grep.

## Scenarios

1. **The general rule — procedural checkpoint vs product fork (the single new rule).** In `autonomous` mode the orchestrator classifies each PM-touch in the pipeline:
   - **Procedural checkpoint** — a gate that asks *"ok to proceed? / which order? / want this optional step?"* and does **not** decide what the user gets (feature-selection, plan-approval, the architect-review offer, the retrospective/audit + migration nudges, the contract-existence question) → **announce-and-proceed**: state the decision + brief cited rationale on the existing announce-before-act console line (`… (proceeding — interrupt to override)`), then proceed. No `AskUserQuestion`.
   - **Genuine product fork** — a choice that shapes what the user gets (the advocate `### Foundational product questions` gaps; an irreversible / high-stakes / security-surface fork) → the **derivability test** unchanged: auto-resolve from cited canon, or **escalate**. The shipped automode already does this; this feature does not touch it.
   - **Merge / ship** → always **manual**, both scopes (unchanged).

2. **Feature-selection (idle + bootstrap) → announce-and-proceed.** When `.ai-pm/state/current.md` is `idle`/`done` — **no feature in flight** (the prior one shipped + merged, or none yet) — autonomous, and `.ai-pm/backlog.md` carries open items, the orchestrator **selects** the next feature (the open candidate most aligned with the bootstrap mandate + recorded priorities), **announces** it (fork · chosen feature · cited rationale (backlog item / mandate passage) · invariants · `(proceeding — interrupt to override)`), and **proceeds into `/pm-plan`**. Same at the `/pm-bootstrap` "before the first feature" transition (one fork, two entry points). Because the trigger is the **idle-after-merge** transition, the PM's manual merge of each feature naturally **paces** successive selections — no numeric "max N features" cap needed. Selection **sequences PM-authored candidates**, never invents direction.

3. **Plan-approval → announce-and-proceed (the surface the PM just hit).** After a plan is drafted, autonomous mode replaces the blocking "do you approve the plan? / iterate until PM says ok" with **announce the plan summary + proceed** to the next pipeline step. This does **not** bypass the genuine-fork checks that follow: the **product-readiness advocate gate still runs** (user-facing features — derive-or-escalate per shipped automode), and `pm-plan-checker` + `code-review` still validate the plan/implementation. The PM can interrupt the announce to steer or stop; otherwise the plan proceeds. Safe because the plan is committed, independently reviewed, and the **PR is reviewed before the manual merge**.

4. **The optional/offer gates → auto-decided, announced.** The **architect-review offer** ("worth an arch review?"), the **retrospective/audit nudge** ("run an audit first?"), the **pending-migration nudges**, and the **contract-existence question** ("does this change what the user sees?") are procedural — in autonomous mode the orchestrator **decides them itself** (arch-review: run it when the architect criteria match; audit: run when the 5-since-last threshold trips; migrations: run the detected pending migration; contract: derive user-facing from the existing human-role-subject extraction) and **announces** the decision, instead of asking. None of these decides product direction, so none escalates by itself.

5. **Canon-DERIVED, never confabulated; escalate only when genuinely undecidable.** Every announce-and-proceed decision carries a **cited rationale** (the backlog item / mandate passage / the rule that fired); the orchestrator never invents a direction the PM's canon never implied. Reusing the existing **escalate-regardless cap**, a procedural decision **escalates** (one `AskUserQuestion`) only when it is **not derivable** — e.g. feature-selection with an empty backlog or **≥2 candidates with no derivable tiebreak** (absence of a citable tiebreak, **not** absence of a formal rank — a backlog the mandate disambiguates is not ambiguous; a formal priority-ranking model is out of scope), or any procedural decision that **collides with a high-stakes / irreversible / security-surface** concern. An empty escalation set ⇒ fully silent (announce + proceed).

6. **Recorded — no new artifact, with a presence backstop.** Decisions made before a feature exists (feature-selection) have no advocate `## Resolutions` trail to ride, so they record on the **selected plan's existing `Source:` provenance line** (extended in place — not a parallel field — to `selected autonomously per ### Decision authority; source: <backlog item / mandate passage>`) plus the announce line + a note in `.ai-pm/state/current.md`. **Backstop (mirrors automode's `auto`-entry citation guard):** `pm-plan-checker` carries one greppable assertion — a plan whose provenance says `selected autonomously` **must** carry a `source:` token (shape-not-meaning presence check; the PM owns whether the source justifies the pick, at PR review). In-feature procedural decisions (plan-approval, arch-offer, audit/migration, contract) are recorded by the **announce line + their normal pipeline artifacts** (the committed plan, the review trail, the audit report) — no new artifact, no new gate.

7. **Interactive mode byte-unchanged; graded extension, additive.** An `interactive` project keeps relaying **every** procedural gate to the PM exactly as today (the default, every existing project). This is a **graded extension of the one engine** — it reuses the derivability test, announce-before-act, the escalate-regardless cap, and the merge-manual invariant; **no new engine, no new enum value, no migration**. Existing projects are unaffected unless their effective authority is already `autonomous`.

## Existing behaviors this feature touches

(from the protocol spec — what must not break)

- **The `### Decision authority` engine** — extended in **scope** (a procedural-gate-progression rule added beside the product-fork resolution it already encodes), reusing the derivability test, announce-before-act, the escalate-regardless cap, and the merge-manual invariant. No new engine, no new enum value.
- **The shipped product-readiness advocate flow** (Step 3.5 + the autonomous rider) — **untouched**: the advocate gaps are *product forks*, still resolved by derive-or-escalate. Plan-approval auto-proceed (sc3) runs the advocate gate as part of proceeding — it does not skip it.
- **The `/pm-plan` Handoff "Show the draft to PM. Iterate until PM says ok."** — gains an autonomous branch (announce-and-proceed); the interactive wording is unchanged.
- **The `/pm-plan` Architect check, Retrospective check, pending-migration nudges, and Product Contract check** — each gains an autonomous branch (auto-decide + announce); interactive wording unchanged.
- **`/pm-bootstrap`'s first-feature transition** — gains the autonomous selection branch (sc2); the Q8 decision-authority question that *sets* the mode is unchanged.
- **The Step 6 ship gate + "after you merge … ready for the next feature" transition** — the A/B/C ship gate is unchanged; the autonomous selection slots at the idle-after-merge point, never inside the ship gate.
- **The consumer-reference single-source rule** (every consumer references `### Decision authority` by name, never re-encodes the enum/default) — preserved: the procedural-gate rule lives **once** in `### Decision authority`; every consumer references it.
- **"Merge/ship stays manual in BOTH scopes"** — preserved exactly; the load-bearing safety that makes announce-and-proceed safe (the PM reviews plan + PR).
- **Interactive mode** — byte-unchanged.
- **Anti-confabulation** — preserved and extended to every procedural decision (cite a source; no signal ⇒ escalate, never invent).

## Contracts

None. Meta-feature on the no-user-facing-contract template repo (the documented exception). No new API or data shape consumed by a downstream runtime.

## Interaction scenarios

Provably isolated: prose-spec change only — no runtime, no shared mutable state, no concurrent operations, no I/O. The coupling (the `### Decision authority` rule ↔ its consumers: the Step-6 idle transition, the autonomous rider, `/pm-plan`'s Handoff + Architect/Retrospective/Contract checks, `/pm-bootstrap`, `pm-plan-checker`) is read sequentially by the orchestrator within one turn and is covered by Scenarios 1–7 and the clean-grep verification.

## Test plan

*Repo discipline: "no automated tests by design — validation by use." Verification is editorial + clean-grep, the same shape as every prior meta-feature; `tests/hooks.sh` stays green — this feature touches no hook.*

- Existing tests that must pass: `tests/hooks.sh` (71/71 — unchanged).
- New tests: none (prose-spec feature). Verification instead:
  - **Editorial walkthrough** — the `### Decision authority` procedural-gate rule matches Scenarios 1–7: procedural→announce-and-proceed, product-fork→derive-or-escalate (untouched), merge-manual; the named instances (feature-selection, plan-approval, arch-offer, retrospective/migration, contract) each gain an autonomous branch that references the rule.
  - **Clean-grep — single-source:** the procedural-gate rule body lives **only** in `### Decision authority`; every consumer (Step-6 idle, the autonomous rider, `/pm-plan`'s Handoff + Architect/Retrospective/Contract checks, `/pm-bootstrap`) **references it by name** and does **not** re-encode the enum/default/rule.
  - **Clean-grep — reuse, not re-encode:** the extension names the existing derivability test / announce-before-act / escalate-regardless cap / merge-manual invariant by reference; no second copy, no new enum value.
  - **Clean-grep — advocate flow untouched:** the product-readiness advocate gate (Step 3.5 + rider) is byte-unchanged; plan-approval auto-proceed explicitly runs it, not skips it.
  - **Clean-grep — safety invariant intact:** "merge/ship stays manual in BOTH scopes" byte-unchanged; the new behaviour sits at procedural gates, never inside the ship gate.
  - **Clean-grep — interactive unchanged:** every interactive-path wording is intact; each new branch is gated to `autonomous` effective authority.
  - **Proportionality check:** this template repo's own state (currently `autonomous`, open backlog) is exactly the Scenario-2/3 case — the rule would have the orchestrator select-announce-proceed and plan-announce-proceed rather than ask, the corrected behaviour the PM asked for.
- Interaction scenario tests: none (provably isolated).
- Stack-spec tests: none (no stack component touched).

## Docs to update

- `WORKFLOW.md` `### Decision authority` (single source): generalize the autonomous-mode rule from feature-selection to a **procedural-gate-progression** rule — in `autonomous` mode a **procedural checkpoint** (feature-selection, plan-approval, the architect-review offer, the retrospective/audit + migration nudges, the contract-existence question) is **announce-and-proceed**; a **genuine product fork** (advocate gap, irreversible/high-stakes/security-surface) uses the **derivability test** (unchanged); **merge/ship stays manual**. Keep the feature-selection specifics (idle-after-merge + bootstrap, two entry points; canon-derived-or-escalate with the three escalation conditions; recorded in the plan `Source:` line; idle-after-merge pacing). State explicitly: announce-and-proceed **sequences/advances PM-authored work**, never invents product direction; the line between procedural and product-fork is **"does it decide what the user gets?"**. Reuse — do not re-encode — the derivability test, announce-before-act, the cap, and the merge-manual invariant.
- `WORKFLOW.md` Step 6 / the "after you merge … ready for the next feature" idle transition: the autonomous select-announce-proceed branch (one line, by reference) — already present from the feature-selection slice; confirm it reads as an instance of the general rule.
- `WORKFLOW.md` "How to talk to the PM" **Autonomous-mode rider**: generalize from "feature-selection is derived-and-announced" to "**routine procedural gates** are derived/auto-decided and announced, not relayed; only genuine product forks escalate" (reference `### Decision authority`).
- `.claude/commands/pm-plan.md`:
  - **Handoff "Show the draft to PM. Iterate until PM says ok."** → add the autonomous branch: announce the plan summary + proceed (the advocate gate + plan-checker still run); reference `### Decision authority`.
  - **Architect check / Retrospective check / pending-migration nudges / Product Contract check** → each gains a one-line autonomous branch: auto-decide + announce instead of ask; reference `### Decision authority`.
  - The existing `Source:` provenance line stays extended in place (`selected autonomously per ### Decision authority; source: <…>`) — from the feature-selection slice.
- `.claude/commands/pm-bootstrap.md`: the autonomous first-feature branch (derive + announce + proceed; escalate only if the mandate yields no derivable first feature) — already present from the feature-selection slice; confirm it reads as an instance of the general rule.
- `.claude/agents/pm-plan-checker.md`: the **selection-citation backstop** (a `selected autonomously` provenance line must carry a `source:` token → finding; shape-not-meaning presence check; mirrors the `auto`-entry citation guard) — already present from the feature-selection slice.
- `doc/architecture.md`: a short decision record — autonomous **procedural-gate progression** as a graded extension of the `### Decision authority` engine; the procedural-vs-product-fork line ("does it decide what the user gets?"); the named instances (feature-selection, plan-approval, arch-offer, retrospective/migration, contract); announce-and-proceed + cited rationale; merge-manual the load-bearing safety; advocate product-fork flow untouched. (Owned by `pm-architect`, post-coding handoff.)
- *(No `MIGRATIONS.md` / template structural / hook change — additive, no migration, no new enum value.)*

## Out of scope

- **Interactive mode** — the sibling of the `autonomous | interactive` set: byte-unchanged. An interactive project keeps relaying every procedural gate.
- **Relaxing the merge/ship gate** — explicitly **not** touched. Autonomy extends to *advancing through procedural gates and resolving product forks from canon*, never to opening or merging a PR. Step 6 A/B/C stays manual in both scopes — the safety this feature depends on.
- **The product-readiness advocate flow** — untouched; advocate gaps are product forks, still derive-or-escalate (shipped automode). Plan-approval auto-proceed runs the gate, never bypasses it.
- **A formal backlog priority/ranking model** (scoring, dependency graphs, effort estimates) — out; selection uses the existing judgement and escalates on genuine ambiguity (absence of a citable tiebreak), not a ranking algorithm.
- **Auto-merging, or chaining feature-after-feature without the PM seeing each PR** — out; each selected feature stops at the manual ship gate; the idle-after-merge trigger paces selections one feature at a time.
- **Promoting auto-decisions into `docs/product.md` / `docs/architecture.md`** (the "accumulated-experience loop" the automode plan deferred) — out; decisions are recorded in plan provenance + state + the normal pipeline artifacts, not promoted into product canon.
- **A new artifact for any procedural decision** — deliberately avoided; the announce line + the plan `Source:` line + the normal pipeline artifacts are the record.
