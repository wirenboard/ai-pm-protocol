# Contract: cross-model-review

**In the vanilla state (config AND runtime env both uncustomized), review runs on a model different from the session that wrote the plan and code** — by default, named transparently, degrading gracefully when no other model is available. The moment the Operator makes an explicit model decision — or the runtime env carries a proxy / foreign alias — the reviewer is whatever they chose (or the session model), never an automatic guess that a proxy could make a fiction or an unverified route that 400s.

A model reviewing its own work shares its own blind spots — it misses what it got wrong and over-rates its output. So out of the box (a config with no explicit model decision) the reviewer is a *different brain* by default: a second set of blind spots catches what the first missed. The Operator gets this for free, is always told which model is reviewing, and is never blocked by it. Once the Operator pins any seat or sets a launch model, the cross-model choice becomes theirs to make explicitly — the automatic `auto` guess (opus↔sonnet) is honest only on stock Claude Code where that pair is guaranteed.

## Vanilla vs customized

- **Vanilla state (config)** — no explicit model decision in the config: no concrete pin on the builder, reviewer, or orchestrator seat (each `model` absent / `session` / `auto`), AND every `launch` model setting empty/whitespace — `launch.sessionModel`, `launch.guardModel`, AND every `launch.aliases` tier binding. Config-vanilla is necessary but no longer sufficient — the runtime-env dimension below is the other half. (Single home for the config predicate: `src/adapter/claude/install-agents.mjs` `isVanilla`.)
- **Customized state** — any concrete pin on a seat OR any non-empty launch model OR any `launch.aliases` tier binding (a cross-endpoint decision — a proxy can then hide what a tier resolves to, so `auto` is no longer honest).
- **Runtime-env dimension (#356)** — the config is only half the picture. A project can route foreign through the **shell env** with a config that still *looks* vanilla: `ANTHROPIC_BASE_URL` (the proxy) or `ANTHROPIC_DEFAULT_{FABLE,OPUS,SONNET,HAIKU}_MODEL` (a tier→foreign binding — the env form of `launch.aliases`, set by the launcher). There the `auto` opposite would bake a **concrete** id that bypasses the alias env, so on a foreign-only proxy it is **routeless** and the spawn 400s. `auto` is honored only when the config is vanilla **AND** the runtime env carries no proxy / foreign alias. (Single home for the join: `src/adapter/claude/install-agents.mjs` `autoHonored` = `isVanilla(config) && !runtimeModelEnvSet(env)`.)

## Must work

- **Vanilla:** review runs on a model different from the session by default — an opinionated `auto`, applied even to a project that never configured it (an absent/`auto` reviewer ⇒ the cross-model opposite, opus↔sonnet, else sonnet).
- **Customized:** the reviewer is whatever the Operator chose. A concrete reviewer pin bakes that model. An unset (`auto`/absent) reviewer in a customized config rides the **session** model — no baked line, no cross-model — because the opus↔sonnet guess is no longer trustworthy once a pin or proxy can hide what a string resolves to; an honest inherit beats a false cross-model claim.
- **Env-customized (#356):** a config-vanilla project routing foreign via the shell env (proxy or `ANTHROPIC_DEFAULT_*_MODEL`) treats an unset/`auto` reviewer exactly like the customized case — it rides the **session** model, no baked line. The opus↔sonnet opposite is not baked because its concrete id would be routeless on a foreign-only proxy; an honest inherit beats a 400 that stops the review. Cross-model there still comes from an explicit reviewer pin (which bakes the bare alias and routes foreign) — unchanged.
- The model about to be used is announced at the moment of invocation — never run silently with respect to its model.
- The review runs in a subagent pinned to the resolved model, read fresh per run.
- `auto` selects only among review-capable models — opus↔sonnet, never haiku (a non-review-grade slot, allow-listed for the cheap guard / explicit pins, not for `auto`); a model unfit to review is refused and treated as the session model.

## Must not break

- The cross-model path never blocks review — if the resolved model equals the session or is unavailable (or, for `auto`, its baked concrete id is routeless through a foreign-only proxy — #356), review runs on the session model and announces the fallback; a config OR env value never stops a review from running.
- Vanilla `auto` never resolves to the same brain twice — the diversity is real.
- A customized config never claims a cross-model reviewer it did not actually configure — an unset reviewer there honestly inherits the session.
- The engine, the review trail, the stamp, and the ship gate are unchanged by the model pin — only the model changes.
