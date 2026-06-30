# Contract: cross-model-review

**In the VANILLA state, review runs on a model different from the session that wrote the plan and code** — by default, named transparently, degrading gracefully when no other model is available. The moment the Operator makes an explicit model decision, the reviewer is whatever they chose — never an automatic guess that a proxy could make a fiction.

A model reviewing its own work shares its own blind spots — it misses what it got wrong and over-rates its output. So out of the box (a config with no explicit model decision) the reviewer is a *different brain* by default: a second set of blind spots catches what the first missed. The Operator gets this for free, is always told which model is reviewing, and is never blocked by it. Once the Operator pins any seat or sets a launch model, the cross-model choice becomes theirs to make explicitly — the automatic `auto` guess (opus↔sonnet) is honest only on stock Claude Code where that pair is guaranteed.

## Vanilla vs customized

- **Vanilla state** — no explicit model decision anywhere: no concrete pin on the builder, reviewer, or orchestrator seat (each `model` absent / `session` / `auto`), AND `launch.sessionModel` + `launch.guardModel` both empty/whitespace. (Single home for the predicate: `src/adapter/claude/install-agents.mjs` `isVanilla`.)
- **Customized state** — any concrete pin on a seat OR any non-empty launch model.

## Must work

- **Vanilla:** review runs on a model different from the session by default — an opinionated `auto`, applied even to a project that never configured it (an absent/`auto` reviewer ⇒ the cross-model opposite, opus↔sonnet, else sonnet).
- **Customized:** the reviewer is whatever the Operator chose. A concrete reviewer pin bakes that model. An unset (`auto`/absent) reviewer in a customized config rides the **session** model — no baked line, no cross-model — because the opus↔sonnet guess is no longer trustworthy once a pin or proxy can hide what a string resolves to; an honest inherit beats a false cross-model claim.
- The model about to be used is announced at the moment of invocation — never run silently with respect to its model.
- The review runs in a subagent pinned to the resolved model, read fresh per run.
- `auto` selects only among review-capable models — opus↔sonnet, never haiku (a non-review-grade slot, allow-listed for the cheap guard / explicit pins, not for `auto`); a model unfit to review is refused and treated as the session model.

## Must not break

- The cross-model path never blocks review — if the resolved model equals the session or is unavailable, review runs on the session model and announces the fallback; a config value never stops a review from running.
- Vanilla `auto` never resolves to the same brain twice — the diversity is real.
- A customized config never claims a cross-model reviewer it did not actually configure — an unset reviewer there honestly inherits the session.
- The engine, the review trail, the stamp, and the ship gate are unchanged by the model pin — only the model changes.
