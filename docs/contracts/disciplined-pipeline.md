# Contract: disciplined-pipeline

**Every change on a guarantee profile (`full`, `lite`, `solo`) is carried through the fixed plan → build → review → ship loop, and nothing reaches a release without a review stamp.**

The `yolo` profile is explicitly outside this contract — it names no Reviewer and turns the merge-gate off by design, under the Operator's informed consent; see `PROTOCOL.md ## Project config`.

Every change follows one predictable path — plan → build → independent review → ship — so nothing ships by the Operator forgetting to ask for a review.

## Must work

- Every change runs the ordered loop: check git state, read context, plan (the Operator approves), build on a feature branch, independent review, ship via a PR the Operator merges.
- Review is a fresh spawn this turn, separate from the Builder; its result is a positive, greppable stamp written only after review actually clears — the accepted stamp forms are pinned by `src/adapter/merge-gate.test.mjs`; anything else blocks.
- The verdict carries its runtime-verification rung — the highest execution the review actually performed, or `NOT RUN — <reason>`; never silent on whether anything ran.
- A trivial change has a proportionate fast path (`fixup`) that still runs a real, shortened review.

## Must not break

- No change on a guarantee profile reaches a release with an unstamped review — the ship gate refuses an unstamped feature (the merge-gate floor, fail-closed on stamp presence).
- The order holds even when a session has no memory of it — the route is reasserted on change-intent and enforced at the gate, not by recollection.
- Merge and ship need the Operator's explicit authorization in both authority modes — the loop may execute a merge only once it is given, never on its own (see `decision-authority`).
