# Product Contract: plan-fidelity

User-facing contract for the guarantee that **the code that lands matches the plan that was approved** — every plan scenario has both an implementation and a test before the change passes, and scope cannot silently drift. The *user* is the AI agent (which must build exactly the approved plan) and the PM (who approved a plan in plain language and trusts that what ships is that plan, no more, no less).

---

## User value

When the PM approves a plan, they are approving a promise: this is what will be built. Plan-fidelity makes that promise mechanical — an independent checker confirms that every scenario in the approved plan is actually implemented *and* tested before the change is allowed to pass, and that the change did not quietly grow beyond or shrink below what was agreed. The PM never has to read code to know the plan was honored; the agent cannot pass a half-built or scope-crept change.

## Who uses it

The plan-compliance checker (which verifies the diff against the plan), the AI coder (which must satisfy every scenario), and the PM (who approved the plan and relies on fidelity to it).

## Must work

- Every scenario in the approved plan is verified to have both an implementation and a test before the change passes plan-compliance review.
- The plan-compliance verdict ends in an explicit Definition-of-Done block whose checks must all hold: scope respected, stack expectations honored, Product Contract honored, pipeline green, state updated, the impact report present when a contract was touched, and the plan's named doc updates landed.
- A plan that mentions a categorical concept (type, mode, role, state, operation, category) must explicitly choose the whole set or one element; a chosen element's siblings are listed out of scope, and the coder cannot stretch the chosen element to cover a sibling.
- A failed Definition of Done forces request-changes even when no individual blocking item was raised.

## Must not break

- A plan-compliance pass with any unchecked Definition-of-Done box is a contradiction and is rejected — the verdict cannot claim pass while a box is empty.
- Scope cannot silently deform: an implementation that covers a sibling case the plan excluded is blocked.
- A scenario with an implementation but no test (or a test but no implementation) does not pass.
- The Definition-of-Done block always ends in an explicit `DoD: pass | fail` token — never an implied or absent verdict.

## Acceptance checks

- The Definition-of-Done subsection in `.claude/agents/pm-plan-checker.md` § "Verdict format" — verifies the 7 hard checks and the explicit `DoD: pass | fail`.
- `doc/architecture.md` § "Definition of Done as an explicit pm-plan-checker subsection" — verifies the pass-with-unchecked-box contradiction rule.
- `doc/architecture.md` § "Categorical scope check at plan-feature stage" — verifies scope cannot drift to a sibling case.

## Out of scope

- Judging whether the plan itself was a good idea — fidelity checks faithfulness to the approved plan, not its merit (that is the planning conversation and the product-readiness gate).
- Technical bug-hunting — that is Pass 2 (the disciplined-pipeline / regression-protection guarantees), a separate pass from plan-compliance.

## Last reviewed

2026-06-07 — by pm-architect, against current main

## Built/changed by

- integrate-consultancy — 2026-05-30 — the Definition-of-Done subsection with its hard checks and explicit verdict token.
- protocol-integrity-and-stack-literacy — 2026-05-30 — the categorical scope check that blocks silent scope deformation.
- optimize-without-losing-rigor — 2026-05-30 — the dimension consolidation and change-type matrix the DoD scopes against.

---

## Behavioral contract

The plan-fidelity rules are single-sourced, not restated here: the Definition-of-Done verdict shape in `.claude/agents/pm-plan-checker.md` § "Verdict format" and `doc/architecture.md` § "Definition of Done as an explicit pm-plan-checker subsection"; the categorical-scope rule in `doc/architecture.md` § "Categorical scope check at plan-feature stage"; the Pass-1 plan-compliance step in `workflow/pipeline.md` Step 5.
