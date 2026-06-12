# Contract: plan-fidelity

**The code that lands matches the plan that was approved** — every plan scenario has both an implementation and a test, and scope cannot silently drift.

When the Operator approves a plan they approve a promise: this is what will be built. An independent checker confirms every scenario in the approved plan is implemented *and* tested, and that the change did not grow beyond or shrink below what was agreed. The Operator never reads code to know the plan was honoured; the agent cannot pass a half-built or scope-crept change.

## Must work

- Every scenario in the approved plan has both an implementation and a test before the change passes review.
- A plan that names a categorical concept (type, mode, role, state, operation) explicitly chooses the whole set or one element; a chosen element's siblings are listed out of scope and cannot be stretched to cover a sibling.
- The review verdict ends in an explicit pass/fail token — never implied or absent.

## Must not break

- Scope cannot silently deform: an implementation that covers a sibling case the plan excluded is blocked.
- A scenario with an implementation but no test (or a test but no implementation) does not pass.
- Judging the plan's *merit* is out of scope — fidelity checks faithfulness to the approved plan, not whether it was a good idea.
