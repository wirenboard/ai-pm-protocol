# Product Contract: product-readiness-gate

User-facing contract for the guarantee that **a user-facing feature cannot proceed to code while still under-specified** — an independent product advocate matches the plan against the foundational product questions and blocks the coder handoff until each gap is answered or consciously descoped. The *user* is the PM (who is protected from shipping a half-defined product) and the AI agent (which cannot start coding a feature with unanswered foundational holes).

---

## User value

The orchestrator both elicits product detail from the PM and pushes toward coding — player and referee at once — so an under-specified product could otherwise sail straight into implementation. This guarantee inserts an *independent* product referee between planning and coding: on every user-facing feature it checks the plan against a fixed set of foundational product questions and holds the handoff to the coder until each gap is either answered or deliberately descoped with a recorded reason. The PM gets a structural safeguard against building the wrong or half-defined thing, and the answer always stays the PM's — the referee judges presence of an answer, never its quality.

## Who uses it

The product advocate (the independent referee that finds the gaps), the orchestrating AI agent (whose coder handoff is blocked until gaps resolve), and the PM (who answers or descopes each gap and owns the meaning).

## Must work

- On a user-facing feature, an independent advocate matches the plan, contract, and product docs against the foundational product questions before the coder is handed the work.
- The advocate emits a positive, greppable verdict: `clean` (zero gaps, silent pass) or `gaps: N` (blocking until resolved).
- A `gaps: N` verdict holds the coder handoff until every gap is answered or consciously descoped with a recorded rationale — never a silent skip, never a permanent veto.
- The gate also runs once at bootstrap (the zero-to-working tier) before the project is ready for its first feature.
- Backend / infrastructure / docs-only / trivial / diagnostic changes are exempt — the gate does not run and requires no artifact.

## Must not break

- The advocate judges presence of a recorded answer, never answer quality — the PM owns meaning; this guarantee never overrides the PM.
- A blocking gate is dismissible by answering or descoping, never a permanent veto.
- The two post-coding backstops (the plan-checker DoD and the auditor dimension-1 check) both stay in place — neither is "redundant with the pre-coding gate", because dropping them lets a skipped gate land silently.
- The verdict stays a positive-presence signal (`clean` or `gaps: N` with N matching resolutions), never an empty absence that reads as "passed".

## Acceptance checks

- `.claude/agents/pm-product-advocate.md` + `workflow/pipeline.md` Step 3.5 — verifies the pre-coding gate, the `clean` / `gaps: N` verdict, and the blocked handoff.
- `workflow/foundational-questions.md` § "Foundational product questions" — verifies the single-sourced, named, tiered checklist.
- `doc/architecture.md` § "pm-product-advocate" (the two backstops) — verifies the plan-checker DoD and auditor dimension-1 backstops stay load-bearing.

## Out of scope

- Grading the quality of the PM's answers — the gate checks that each foundational gap has a recorded answer or descope, not whether the answer is good.
- Running on non-user-facing work — substrate, infra, docs-only, trivial, and diagnostic changes are exempt by design (a blanket gate would strangle legitimate substrate work).
- Deciding the answer itself in interactive mode — the gate surfaces gaps to the PM; autonomous resolution of a derivable gap is the decision-authority contract's concern.

## Last reviewed

2026-06-07 — by pm-architect, against current main

## Built/changed by

- pm-product-advocate — 2026-06-04 — the independent product referee, the Step 3.5 gate, the `gaps: N` / `clean` verdict, the owner-split-with-gate, and the two backstops.
- integrate-consultancy — 2026-05-30 — the foundational-questions and contract groundwork the gate matches against.

---

## Behavioral contract

The product-readiness-gate rules are single-sourced, not restated here: the gate flow and the blocked-handoff in `workflow/pipeline.md` Step 3.5; the single-sourced checklist in `workflow/foundational-questions.md` § "Foundational product questions"; the family framing, verdict shape, owner-split-with-gate, and the two backstops in `doc/architecture.md` § "pm-product-advocate".
