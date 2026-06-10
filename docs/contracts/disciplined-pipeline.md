# Contract: disciplined-pipeline

**Every change is carried through the fixed plan → build → review → ship loop, and nothing reaches a release without a review stamp.**

Whoever drives a change — an AI agent or the PM behind it — gets one predictable path from idea to release, with independent review wired into the path so quality does not depend on anyone remembering to be careful. A change cannot quietly skip planning, skip review, or land half-finished. The PM watches a plain-language conversation; the structure runs underneath.

## Must work

- Every change runs the ordered loop: check git state, read context, plan (PM approves), build on a feature branch, independent review, ship via a PR the PM merges.
- Review is a fresh spawn this turn, separate from the Builder; its result is a positive, greppable stamp written only after review actually clears.
- A trivial change has a proportionate fast path (`fixup`) that still runs a real, shortened review.

## Must not break

- No change reaches a release with an unstamped review — the ship gate refuses an unstamped feature (the merge-gate floor, fail-closed on stamp presence).
- The order holds even when a session has no memory of it — the route is reasserted on change-intent and enforced at the gate, not by recollection.
- Merge and ship stay manual in both authority modes (see `decision-authority`).
