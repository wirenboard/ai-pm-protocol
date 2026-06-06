> **Topic file of the orchestration spec** — read on demand from `WORKFLOW.md`'s navigation map. Read it when you need the full state-keeping rules.

## How state is kept

One file — `.ai-pm/state/current.md` — holds the live snapshot of the active task: Status, what's Done, what's Remaining, Touched files, Next step, Validation command. Every coder run reads it first and updates it last. Every `/pm-plan` run initializes it.

This means: if you pause for a week, come back, and re-enter Claude Code, my first move is to open that file and continue. You do not need to re-explain. You can open the file yourself to see where we are, but you don't write to it — agents do.

When a task finishes, the file is archived to `.ai-pm/state/archive/<topic>-<date>.md` and reset to `Status: idle`; the archive is committed on the feature branch as the final step before `pm-pr-prep`, so it merges with the feature it describes.

The durable hand-off between agents is what is on disk — `state/current.md`, the review file, any scratch note — not what is in agent memory. `continue-the-same-agent` is an optional optimization: it saves tokens when available and breaks nothing when it is not. The protocol must never depend on it.

For user-facing features, a parallel set of files lives in `.ai-pm/contracts/` — one Product Contract per feature, with what must work, what must not break, and the acceptance checks that prove it. Coder reads the contract before implementing; reviewer verifies the diff against it; auditor flags missing or stale contracts. The contract is how we keep a feature recognizable across many small changes — without it, the product slowly drifts.

PM never edits state or contracts. PM reads them when curious.

The PM-facing render of all contracts — what the system does, contract by contract, with the features and reviews behind each — is `docs/product-map.md`. It is generated (group → contract → features), never hand-filled, and regenerated as features land; the contracts and state stay the source of truth. This replaces the old feature index: the per-feature "did all artifacts appear" check now lives in `pm-plan-checker`'s DoD, and `pm-auditor` re-derives `product-map.md` from source on every audit.

### Three channels surface to PM, not one

After implementation, PM hears about results through three channels (not just the reviewer verdict):

- **Coder's Product Impact Report** — when a user-facing contract was touched: which Behavior changes happened, which Acceptance checks passed/failed, what risk surfaces were touched, whether a PM decision is required. This is the "what changed for the user" channel.
- **Reviewer's Notes (product)** — non-blocking observations the PM should weigh: scope choices, trade-offs, missing tests on meaningful paths. This is the "what to think about" channel.
- **Reviewer's Definition of Done line** — the binary signal: pass (everything is in order) or fail (something is missing, even if no Blocking finding). This is the "is it actually done" channel.

If any of the three contradicts the other (e.g., DoD says pass but Impact Report says PM decision required) — that is itself a finding to surface, not silently resolved.

**DoD rule:** a pass with any unchecked box is a contradiction; reviewer must re-read its own findings before signing off. A fail forces `request-changes` even when Blocking is empty. The DoD is binding; it is not a summary.
