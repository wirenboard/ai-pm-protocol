# Product Contract: cross-model-review

User-facing contract for the guarantee that **review and audit run on a different model than the session that wrote the plan and code** — by default, named transparently at launch, and degrading gracefully when no other model is available. The *user* is the PM (who gets review by a second, independent brain without configuring anything) and the AI agent (which routes review/audit to a model with different blind spots than the one that produced the work).

---

## User value

A model reviewing its own work shares its own blind spots — it tends to miss exactly what it got wrong, and to over-rate its own output. This guarantee makes the reviewer a *different brain* by default: review and audit run on a model different from the session that planned and coded, so a second set of blind spots catches what the first missed. The PM gets this diversity out of the box, is always told which model is reviewing (never left guessing), and is never blocked by it — when no other model is available, the activity still runs on the session model and says so.

## Who uses it

The orchestrating AI agent (which resolves and pins the review/audit model), and the PM (who benefits from independent review and sees which model ran it).

## Must work

- Review and audit run on a model different from the session by default — an opinionated `auto` default, applied even to a project that never configured it (absent or unrecognized config resolves to `auto`).
- The model about to be used is announced at the moment of invocation on every review/audit path — per-diff review, whole-codebase sweep, and compliance audit — never run silently with respect to its model.
- The review/audit runs in a subagent pinned to the resolved model, independent of the session model and read fresh per run (no session restart needed for a config change).
- `auto` selects only among review-capable models, never Haiku — an explicit Haiku value is refused with a warning and treated as the session model.

## Must not break

- The cross-model path never blocks review/audit — if the resolved model equals the session or is unavailable, the activity runs on the session model and announces the fallback; a config value never stops a review from running.
- The announce is a hard, every-path requirement — the cross-model case names the exact model, the fallback case says "no cross-model this run", and the cloud case says it picks its own models.
- `auto` never resolves to the same brain twice — it is a review-capable model genuinely different from the session, so the diversity is real.
- The engine, the review trail, the stamp, and the ship gate are unchanged by the model pin — only the model changes.

## Acceptance checks

- `workflow/review-typology.md` § "Cross-model review" — verifies the four settings, the opinionated `auto` default, the Haiku blacklist, the model-pinned subagent, and the mandatory per-review announce.
- `workflow/pipeline.md` Step 5 (cross-model resolution) — verifies per-diff review pins the resolved model and announces it, with the session fallback.
- `doc/architecture.md` § "Cross-model review" (decision record) — verifies the spike-verified mechanism and graceful degradation.

## Out of scope

- Choosing *which reviewer engine* runs — that is engine-selection (a different axis: engine = which reviewer, model = which brain); both coexist.
- Forcing a cross-model run when no other model exists — the path degrades to the session model rather than failing.
- Pinning the *session* model — that is a harness relaunch, unrelated to this config.

## Last reviewed

2026-06-07 — by pm-architect, against current main

## Built/changed by

- cross-model-review — 2026-06-06 — the cross-model model settings, the opinionated default, the Haiku blacklist, the model-pinned subagent, the per-review announce, and graceful fallback.
- review-typology-framework — 2026-06-05 — the review-type registry the cross-model axis is orthogonal to and named beside.
- review-engine-selection — 2026-06-05 — the which-engine axis distinguished from the which-model axis.

---

## Behavioral contract

The cross-model-review rules are single-sourced, not restated here: the four settings, the `auto` default, the Haiku blacklist, the model-pinned-subagent mechanism, the fallback, and the mandatory announce in `workflow/review-typology.md` § "Cross-model review"; its application at the per-diff review in `workflow/pipeline.md` Step 5; the decision rationale in `doc/architecture.md` § "Cross-model review".
