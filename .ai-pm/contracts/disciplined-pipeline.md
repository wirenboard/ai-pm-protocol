# Product Contract: disciplined-pipeline

User-facing contract for one guarantee of the ai-pm-protocol product. The *user* here is the AI agent driving the pipeline and the PM steering it: the protocol's product is its enforced behavioral guarantees, and this is the guarantee that **every change is carried through a fixed plan → implement → review → ship pipeline, and nothing reaches a release without a load-bearing review stamp**. (Per the 2026-06-07 PM reframing: the protocol's primary consumer is the LLM/AI agent, plus the PM.)

---

## User value

Whoever drives a change — an AI agent or the PM behind it — gets a single, predictable path from idea to shipped release, with independent checks wired into the path so that quality does not depend on anyone remembering to be careful. A change cannot quietly skip planning, skip review, or land half-finished: the pipeline makes the disciplined route the only route. The PM watches a plain-language conversation; the structure runs underneath it.

## Who uses it

The orchestrating AI agent (which must move every change through the named steps) and the PM (who relies on "if it shipped, it went through the full pipeline" without reading code).

## Must work

- Every change runs through the ordered pipeline: check git state, read project context, plan together, decide the structural question when one exists, run the product-readiness gate on user-facing changes, implement on a feature branch, run the two-pass review loop, optionally run it for real, and ship via a PR the PM merges.
- The review loop is two sequential passes: Pass 1 plan-compliance, then Pass 2 technical-quality, and Pass 2 starts only after Pass 1 is clean.
- The review/validation result is recorded as a positive, greppable stamp — a "passed" marker is written only after the review actually clears, never an empty heading that reads as "passed".
- A trivial change has a proportionate fast path (`/pm-fixup`) that still re-validates the conditions that make it trivial.

## Must not break

- No change reaches a release with an unstamped review/validation trail — the ship step refuses an unstamped feature, and the audit sweep blocks one too.
- The two backstops (the pre-ship ship-gate check and the project-wide audit check) both stay in place — neither is "simplified away" as redundant, because a manual step with no gate degrades silently.
- A born-loud marker (`NOT YET RUN`) is never absent or empty; an empty review section never silently reads as "passed".
- The pipeline order holds even when a future session has no memory of it — the route is reasserted on change-intent and enforced at the gate, not by recollection.

## Acceptance checks

- The Step 0–7 skeleton in `WORKFLOW.md` `## The pipeline` and its full body in `workflow/pipeline.md` — verifies the ordered pipeline and the two-pass review loop.
- The ship-gate stamp check (`pm-pr-prep` step 0) and the audit stamp check (`pm-auditor` dimension 1) — verify an unstamped trail blocks release and audit.
- `workflow/pipeline.md` Step 5 born-loud-marker wording (`## Code review: NOT YET RUN` / `## Validation: NOT YET RUN`) — verifies the positive-presence stamp discipline.

## Out of scope

- Deciding *what* a change should do — that is the planning conversation, not the pipeline's structural guarantee.
- Forcing the full pipeline onto a trivial change — the fast path exists for that, and substrate/backend work is proportioned by change type.
- Merging or shipping automatically — the ship gate stays manual (see the decision-authority contract).

## Last reviewed

2026-06-07 — by pm-architect, against current main

## Built/changed by

- template-v2 — 2026-05-28 — the v2 rewrite that established the agent/command pipeline shape.
- integrate-consultancy — 2026-05-30 — Execution State, Product Contracts, and the explicit Definition of Done subsection.
- review-stamp-gate — 2026-06-04 — the load-bearing, gate-not-discipline review stamp.
- optimize-without-losing-rigor — 2026-05-30 — the change-type matrix and the `/pm-fixup` trivial fast path.

---

## Behavioral contract

The pipeline's canonical behavior is single-sourced, not restated here: the Step 0–7 skeleton in `WORKFLOW.md` `## The pipeline` with full bodies in `workflow/pipeline.md`; the load-bearing review-stamp discipline in `doc/architecture.md` § "Edit-ownership split" + § "Eight review dimensions" and `workflow/pipeline.md` Step 5; the two-pass review loop and its stamp gates in `workflow/pipeline.md` Step 5 / `workflow/enforcement.md` § "Hook-level enforcement" (stamp gates at `pm-pr-prep` / `pm-auditor`).
