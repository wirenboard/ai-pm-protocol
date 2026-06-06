# cross-model-review — Pass-1 plan-compliance review

Base for this review: feature commits `e030eb2..a46dffd` (diffed from `0516636`, the commit
before the plan landed) — isolates this feature from the stacked `agent-reporting-discipline`
and `stack-idioms-library` work below it on the branch.

## Plan compliance

- ✓ **Scenario 1 (four settings, single-source)** — `### Cross-model review` in `workflow/review-typology.md` is the single home: the three model settings `review-diff-model` / `review-full-model` / `audit-model` ∈ `session | auto | opus | sonnet`, default `session`, absent/unrecognized ⇒ `session`, `auto` = a review-capable model different from the session; plus `review-scope` ∈ `auto | high-risk`, default `auto`. `.ai-pm/review-config.md` exists (dogfood: all three `session`, `review-scope: auto`).
- ✓ **Scenario 2 (Haiku blacklisted)** — rule omits `haiku` from the enum, `auto` "selects only among review-capable models (Opus / Sonnet), never Haiku" even on a Haiku session, explicit `haiku` "refused with a warning and treated as `session`." Present in the rule.
- ✓ **Scenario 3 (diff review)** — `workflow/pipeline.md` Step 5 Pass 2 resolves `review-diff-model` (read fresh, absent ⇒ session), runs the built-in `code-review` in a model-pinned subagent when ≠ session, gated by `review-scope`; "the engine, the `## Code review` trail, the stamp, and the `pm-pr-prep` gate are unchanged — only the model changes."
- ✓ **Scenario 4 (full sweep)** — `.claude/commands/pm-audit.md` `## Technical quality` gains `review-full-model` over the existing engine chain, model-pinned where the engine is ours (orchestrator-skill / built-in), `ultra` the explicit cloud exception ("ultra picks its own models"); engine-selection + depth preserved; orchestrator-fan-out inheritance recorded as verify-before-rely, not asserted.
- ✓ **Scenario 5 (audit)** — `pm-audit.md` Execution step 1 resolves `audit-model` and pins the `pm-auditor` spawn via the Agent model override.
- ✓ **Scenario 6 (fallback)** — rule + every consumer: resolved model == session / unavailable → run on session + announce "no cross-model this run", never an error; review/audit always still runs.
- ✓ **UX flow** — bootstrap Q9 in `pm-bootstrap.md` (asks once, writes `.ai-pm/review-config.md`); read-fresh-per-review + per-review announce (rule + pipeline + pm-audit); no restart (explicit in rule + arch record); command-scoped dialog (both-named → no dialog; which-named/value-missing → one question on that setting; unspecified → multi-select then values). Full dialog spec single-sourced in the rule; `workflow/pm-comms.md` references it by name, re-encodes nothing.
- ✓ **Migration** — `MIGRATIONS.md` `### Pending-migration detection` entry + setup-offer procedure: absent `.ai-pm/review-config.md` ⇒ session (non-disruptive), offered by `/pm-audit`/`/pm-plan`, never forced, idempotent.
- ✓ **Single-source (critical)** — grep confirms the enum literal `session | auto | opus | sonnet` appears only in the rule home + the architecture decision record (a doc restating the design, not a routing consumer). Every routing consumer (pipeline, pm-audit, pm-bootstrap, MIGRATIONS, WORKFLOW nav row, pm-comms, README) references `### Cross-model review` by name and carries an explicit "do not re-encode the enum/default/Haiku-blacklist/fallback." Bootstrap Q9's `auto / opus / sonnet` is the user-facing question wording (the exact analogue of decision-authority Q8), with a "do not re-state" disclaimer — not a re-encoding.
- ✓ **Docs landed** — `doc/architecture.md` `### Cross-model review` decision record (placed after `### Review-engine selection` as the orthogonal model axis, with `Source:` provenance) + `README.md` cross-model note (Russian, sibling of the engine-selection subsection, points at the rule). WORKFLOW.md nav-map row updated.
- ✓ **Coder's `doc/_templates/` judgment** — coherent, not a gap: confirmed `CLAUDE.md.tmpl` carries no pointer to `decision-authority.md` and there is no `decision-authority.md.tmpl`; the decision-authority value file is written inline by `/pm-bootstrap`. Not creating a `review-config.md.tmpl`/pointer mirrors that pattern exactly and honors single-source. (Surfaced as a product note: it diverges from the literal "Docs to update" plan line, by design.)
- ✓ **Test plan** — no automated test is the correct call (orchestration-prose + a config file in a markdown-prose repo with no runtime/linter to host a "did review run on the configured model" test); mechanism is spike-verified per the spike-gate discipline. `bash tests/hooks.sh` ran this turn: **73/73 passed, 0 failed** — no hook/`settings.json`/`tests/` file is in this feature's diff.
- ✓ **Scope / Out-of-scope** — Pass-1 (`pm-plan-checker`) stays session-model (no Pass-1 cross-model wiring added); no custom reviewer (built-in `/code-review` reused, only the model changes); no forcing the session model; no `PreToolUse` hook (settings.json untouched). All four out-of-scope siblings honored.
- ✓ **Categorical coverage** — the three pinnable activities (per-diff / full-sweep / audit) all covered; `ultra` (the one non-pinnable cloud path) explicitly carved with a reason; `haiku` (the excluded enum sibling) explicitly excluded with a reason; Pass-1 (the excluded review type) listed under Out of scope with a reason. No silent sibling.
- ✓ **Interaction scenario** — plan declares prose-level isolation with one runtime interaction (pinned-subagent output must land in the normal trail/stamp); the built-in path is spike-confirmed and the rule + pipeline state the trail/stamp/gate are unchanged. No concurrent-state test is owed (no automated test surface in this repo; spike is the verification of record).
- ✓ **Changeset hygiene (dogfood)** — diff is clean and purely additive: 11 files, +164/−15, every hunk traceable to a plan scenario or a listed doc update; the only deletions are in-place rewrites of two prose paragraphs (review-typology boundary line, pm-audit sweep paragraph) that the feature edits. No whitespace-only / reformatting / reordering noise observed.

**Product Contract:** no Product Contract touched — protocol-configuration feature (operational knobs, documented, not a product API).

**Product-readiness (advocate) gate:** n/a — non-user-facing. Every scenario subject is the system (the orchestrator / the review / the config / the migration), not a human role; the advocate gate is exempt with no special-casing.

## Definition of Done

- [x] All plan scenarios implemented and tested — all six scenarios implemented; "tested" satisfied by the recorded spike + editorial verification, the plan's stated (and correct) test strategy for a markdown-prose repo
- [x] Interaction scenarios have concurrent-state tests — no automated test surface; the one runtime interaction is spike-confirmed and the trail/stamp/gate are stated unchanged
- [x] Stack expectations respected; stack-spec tests pass — the Agent/subagent model-override idiom is execution-verified by the spike (no `docs/stack-notes.md` in this repo; spike is the verification of record); orchestrator-fan-out inheritance correctly recorded as verify-before-rely
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change — no Product Contract touched; default `session` = today's behavior, cross-model is explicit opt-in, no silent change
- [x] Pipeline green — `bash tests/hooks.sh` 73/73; editorial (this Pass-1) clean; no stack linter in this markdown-prose repo
- [x] State file updated — `.ai-pm/state/current.md` reflects coding done + docs landed + next-step review loop
- [x] Product Impact Report present (when contract touched) — n/a, no contract touched
- [x] Docs updates landed — `doc/architecture.md` decision record + `README.md` note + `WORKFLOW.md` nav row, all on this branch
- [x] Expected artifacts exist — plan (`doc/features/cross-model-review_plan.md`), this review; no contract (non-user-facing)
- [n/a] Product-readiness gate resolved — non-user-facing (system-subject scenarios); advocate gate exempt
- [n/a] Validation gate resolved — `software`-kind project; the `## Code review` stamp is the load-bearing Pass-2 marker, not a `## Validation` stamp

**DoD: pass**

## Blocking

(none)

## Notes (product)

1. **`doc/_templates/` plan line consciously superseded.** The plan's "Docs to update" listed a downstream `review-config.md.tmpl` + a `CLAUDE.md.tmpl` pointer. The coder shipped neither — instead the config is created inline by `/pm-bootstrap` Q9, mirroring exactly how `decision-authority.md` is handled (no `.tmpl`, no pointer). This is the more coherent, single-source choice and I'm satisfied it is not a gap. Surfaced only because it diverges from the literal plan text — the divergence is documented in the state file (coder note), so the contract and the implementation are reconciled. No action needed unless the PM specifically wanted a downstream template scaffold.

2. **Migration is offer-only and could be missed in practice.** A downstream project that bumps the template gets cross-model purely as a non-blocking *offer* from the next `/pm-audit`/`/pm-plan` (absent ⇒ session, nothing changes). That is the intended non-disruptive design, but it means an existing project never gains cross-model review unless someone notices the offer and opts in. Worth a one-time mention to downstream PMs that the knob now exists. Why it matters: the feature's value (independent blind spots) only lands for projects that actively opt in; the safe default is also a silent-stay-on-default.

## Verdict

approve

## Code review findings

**Pass-2 run cross-model — built-in `code-review` (high effort) in a subagent pinned to `claude-sonnet-4-6`, session on Opus.** A live dogfood of this very feature: a different model reviewing the cross-model-review change. It surfaced **5 real consistency/single-source findings** the Opus authoring + Opus Pass-1 missed — the clearest possible validation of the feature.

1. **(confirmed) Dangling `/pm-plan` offer.** `MIGRATIONS.md` + `doc/architecture.md` said "`/pm-audit` or `/pm-plan` offers the setup," but `pm-plan.md` has no such nudge. → **Resolved by the auto-default decision (PM, 2026-06-05):** default flips to `auto`/absent⇒auto, so there is **no setup-offer at all** — the migration is a documented default-change, not an interactive offer. The dangling `/pm-plan` reference is removed.
2. **(plausible) `review-scope` boundary unstated.** The rule didn't say `review-scope` governs **only** the per-diff path (`review-diff-model`), risking misapplication to the full sweep. → **Fix:** state explicitly in `### Cross-model review` that `review-scope` gates the per-diff review only; the full sweep uses `review-full-model` regardless of scope.
3. **(confirmed) Consumer-list divergence.** `doc/architecture.md` omitted `/pm-plan` while `MIGRATIONS.md` named it. → **Resolved with #1** (no `/pm-plan` consumer; lists reconciled to the no-offer reality).
4. **(plausible) Unverified fan-out claim leaked into an operational instruction.** `pm-audit.md` instructed running the sweep pinned **unconditionally**, while the rule marks orchestrator fan-out inheritance "to-verify" — risk of announcing "on Sonnet" while the fan-out runs on session. → **Fix:** `pm-audit.md` carries the verify-before-rely caveat by reference; the announce reflects only what is actually pinned, never a blanket claim.
5. **(confirmed) Opt-out idempotency unsupported.** The offer promised "won't re-nag" but declining wrote nothing, so absent-detection re-fired every run. → **Resolved by the auto-default decision:** no offer ⇒ no re-nag ⇒ no opt-out-state to record. (Opt-out is the one-line `session` config.)

**Net:** the auto-default decision dissolves #1/#3/#5 (all the interactive-offer machinery); the real code fixes are **#2** (scope boundary) and **#4** (fan-out caveat), folded into the same fix round as the auto-default flip and the no-orchestrator full-model offer refinement, plus the mandatory-announce strengthening.

**Re-verification (second cross-model pass, Sonnet):** a targeted Sonnet re-check over the fixed feature diff confirmed all 7 consistency axes PASS — no leftover `session`-default, no leftover offer/re-nag/`/pm-plan`, `review-scope` per-diff-only, fan-out caveat present, mandatory every-path announce, no new contradiction from the auto-flip, single-source intact. Findings #1–#5 resolved; nothing residual.

(Dogfood note: this feature — cross-model review — was itself reviewed cross-model on Sonnet, which caught 5 real issues an Opus authoring + Opus Pass-1 missed, then re-verified cross-model after the fix. The clearest possible validation of the feature, on the feature.)

## Code review: 2026-06-05 — cross-model (Sonnet) built-in code-review (high effort) + targeted re-verify; 5 findings resolved (2 fixed, 3 dissolved by the auto-default design), re-verified clean — passed
