# Contract: cross-model-review

**Review runs on a model different from the session that wrote the plan and code** — by default, named transparently, degrading gracefully when no other model is available.

A model reviewing its own work shares its own blind spots — it misses what it got wrong and over-rates its output. This makes the reviewer a *different brain* by default: a second set of blind spots catches what the first missed. The Operator gets this out of the box, is always told which model is reviewing, and is never blocked by it.

## Must work

- Review runs on a model different from the session by default — an opinionated `auto`, applied even to a project that never configured it (absent/unrecognised ⇒ `auto`).
- The model about to be used is announced at the moment of invocation — never run silently with respect to its model.
- The review runs in a subagent pinned to the resolved model, read fresh per run.
- `auto` selects only among review-capable models; a model unfit to review is refused and treated as the session model.

## Must not break

- The cross-model path never blocks review — if the resolved model equals the session or is unavailable, review runs on the session model and announces the fallback; a config value never stops a review from running.
- `auto` never resolves to the same brain twice — the diversity is real.
- The engine, the review trail, the stamp, and the ship gate are unchanged by the model pin — only the model changes.
