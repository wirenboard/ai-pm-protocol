# review-engine-selection — Pass-1 plan-compliance review

Branch: `feature/periodic-codebase-review` · Plan: `doc/features/review-engine-selection_plan.md` · Reviewed against `git diff main...HEAD`.

## Plan completeness (pre-checks)
- ✓ Stack expectations touched — present, both entries cite sources (`doc/stack-notes.md` § Claude Code hooks API, § jq).
- ✓ Interaction scenarios — present: `Provably isolated` declared for the stateless-hook half + one stated interaction for the engine-selection half. Async/event/shared-state surface addressed.
- ✓ Threat-model gate — does NOT fire: no `docs/threat-model.md` in this repo (non-security-bearing per protocol definition; `doc/architecture.md` `## Security constraints` is N/A). The security relevance of `.claude/settings.json` is handled as review discipline, recorded in the architecture decision.
- ✓ Topic is not `hotfix-*` — Incident-facts gate n/a.
- ✓ Categorical coverage — the "review type" set is fully accounted: per-diff (covered, stays built-in), whole-codebase smell/hygiene (covered, engine-selected), architectural/functional/criticality-prioritization siblings each listed under Out of scope with a one-line reason (registered-later; rule stated once so they inherit it).

## Plan compliance (scenarios 1–4)
- ✓ Scenario 1 (orchestrator no longer blocked) — `.claude/settings.json`: the `wb-development:code-review-orchestrator)` `case` arm AND the `WB_ALLOW_REVIEW_ORCHESTRATOR=1` escape guard are removed; the skill now falls through to the trailing `exit 0`. Verified the 7 role-duplicator denies are **byte-identical** to `main` (jq-diff of all other hook commands: identical; only the one routing command changed). Test at `tests/hooks.sh:419` (`code-review-orchestrator is NOT denied (let-through)`).
- ✓ Scenario 2 (per-diff Pass-2 stays built-in by routing) — stated as protocol routing discipline in `workflow/review-typology.md:18` (per-diff → built-in, never auto-routed to orchestrator) and the `doc/architecture.md` record; not a hook change. This is a prose/routing guarantee — verified editorially, the documented boundary for this markdown-prose repo.
- ✓ Scenario 3 (whole-codebase sweep prefers orchestrator, built-in fallback) — `workflow/review-typology.md:20` (single source) + `.claude/commands/pm-audit.md:114,127` (consumer, by-reference). Proportional new-code-gating (step 1/2), depth selection (step 3), `## Quality sweep` marker, and findings→backlog triage are **untouched** (only 2 lines changed in pm-audit, both adding engine selection). Existing sweep behavior preserved.
- ✓ Scenario 4 (off-switch forces built-in) — `WB_REVIEW_ORCHESTRATOR=off` stated in `workflow/review-typology.md:20` and consumed by `pm-audit.md`; documented as sweep-prose preference, not a hook, blocks nothing. README documents it.

## Existing behaviors honored
- ✓ 7 `wb-*` role-duplicator denies — byte-identical to `main` (verified). Role-skill deny functionally re-confirmed: feeding `wb-development:coder` to the live routing command returns `deny`. Test at `tests/hooks.sh:423`.
- ✓ All other `PreToolUse`/`UserPromptSubmit` hooks — byte-identical (8 hook commands on both main and HEAD; the 7 non-routing commands diff-clean).
- ✓ Per-diff loop still built-in `/code-review` — engine unchanged; the change is routing-explicitness only.
- ✓ Sweep proportional gating / depth / triage — unchanged.
- ✓ `tests/hooks.sh` — all prior role-skill / boundary / push cases still pass.

## Interaction scenario coverage
- ✓ Hook half — `Provably isolated` (stateless hook); the let-through and the role-deny-still-fires conditions are both covered by `tests/hooks.sh`.
- ✓ Engine-selection-half interaction (sweep + orchestrator-unavailable / `=off` → built-in fallback, marker/scope/triage unchanged) — lives in prose (`review-typology.md` + `pm-audit.md`); no runtime host in this markdown-prose repo. Documented-not-built boundary per the plan and `### Review typology`; verified editorially. Not a missing test.

## Stack expectations compliance
- ✓ Claude Code hooks API — removing the orchestrator from the `case` makes it fall through to the trailing `exit 0` = "no decision; normal permission flow applies". Code matches the cited rule; stack-spec test (`tests/hooks.sh:419`) verifies the let-through against the cited source (comment cites `doc/stack-notes.md` § Claude Code hooks API + `https://code.claude.com/docs/en/hooks`).
- ✓ jq — the remaining role-skill arm parses correctly after the orchestrator arm + guard were excised (functionally re-confirmed: live invocation emits valid `deny` JSON). The implementation uses the `--arg n` interpolation form, which carries no literal `'\''` apostrophe-escape; the cited rule ("escaping must stay intact / the arm must still parse") is satisfied — the arm works.

## Test plan satisfied
- ✓ `bash tests/hooks.sh` green — **73/73** (was 74/74; net -1 from deleting the obsolete flag-escape case, as planned).
- ✓ New `routing: code-review-orchestrator is NOT denied (let-through)` — present, replaces old "without flag → deny".
- ✓ Kept `routing: wb-development:coder still denied` — present, proves the role-duplicator denies didn't loosen.
- ✓ Obsolete `... with WB_ALLOW_REVIEW_ORCHESTRATOR=1 → pass` case + its `export`/`unset` — removed.
- ✓ Prose-half has no automated test — documented boundary (markdown-prose repo, validation-by-use), correctly not demanded.

## Docs to update — all landed
- ✓ `doc/architecture.md` — `### Review-engine selection` decision record present; states it supersedes `deny-review-orchestrator` (v2.25.1), keeps prior history intact.
- ✓ `README.md` — old `### Скилл code-review-orchestrator отключён по умолчанию` replaced by `### Выбор движка ревью: code-review-orchestrator доступен`; obsolete `WB_ALLOW_REVIEW_ORCHESTRATOR` launch instructions dropped.
- ✓ `workflow/review-typology.md` — single-source engine-selection rule added.
- ✓ `.claude/commands/pm-audit.md` `## Technical quality` — engine-selected by reference.
- ✓ `workflow/enforcement.md` — one-line note (orchestrator off the deny-list; named list is exactly the 7 role-duplicators).

## Single-source discipline
- ✓ The engine-selection rule is **stated once** in `workflow/review-typology.md` (labelled "the single source") and **referenced by name** from `pm-audit.md` ("selected per the engine-selection rule in `### Review typology`", read-first instruction), `enforcement.md`, and `doc/architecture.md`. The pm-audit consumer restates the operational condition at its use-site (prefer-when-available / `=off` fallback) under the by-name pointer — consumer application, not a competing second source. No re-encoding.

## Scope
- ✓ Out-of-scope items not violated: per-diff stays built-in (not routed to orchestrator); the 7 role skills keep their hard deny with no escape; no standalone scheduled sweep added; sibling review types untouched; no new hook/command/agent/flag-family (the off-switch reuses one env var read by prose).
- Residual `WB_ALLOW_REVIEW_ORCHESTRATOR` mentions exist only in honest history (prior plan/review/CHANGELOG/archive) + the state file + a pre-existing `.ai-pm/backlog.md` note — no active code or this feature's own docs carry the dead flag.

## Product Contract
No Product Contract touched — this repo has no user-facing contracts by design (backend/tooling; `doc/architecture.md` "Contract-centric product map"). The `WB_REVIEW_ORCHESTRATOR` env var is an operational knob, not a product API. Advocate gate **n/a**: all scenario subjects are non-human (orchestrator / protocol / sweep / hook).

## Definition of Done
- [x] All plan scenarios implemented and tested (prose-half scenarios verified editorially per the documented markdown-prose boundary)
- [x] Interaction scenarios have concurrent-state tests (hook half tested; engine half is documented-not-built boundary)
- [x] Stack expectations respected; stack-spec tests pass
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change — n/a (no Product Contract touched)
- [x] Pipeline green — `bash tests/hooks.sh` 73/73; JSON valid; no stack linter (markdown-prose repo)
- [x] State file updated (`.ai-pm/state/current.md` reflects coded + docs landed)
- [x] Product Impact Report present — n/a (no contract touched)
- [x] Docs updates landed (all 5)
- [x] Expected artifacts exist (plan present; this review created; no contract required — non-user-facing)
- [n/a] Product-readiness gate resolved — user-facing only; this feature is non-user-facing (all scenario subjects non-human), exempt
- [n/a] Validation gate resolved — documentation-kind only; this is a `software`-kind project

**DoD: pass**

## Blocking
(none)

## Notes (product)
(none)

## Verdict
approve

## Code review findings
`code-review` (built-in, high effort) over the diff — security-relevant hook (`.claude/settings.json` deny removal), reviewed accordingly. **No defects (`[]`).**

Traced all finder angles over the code-bearing diff (`.claude/settings.json` + `tests/hooks.sh`):
- **Line-by-line:** the new hook command `… [ -z "$NAME" ] && exit 0; case "$NAME" in <7 role-duplicators>) deny ;; esac` leaves the orchestrator matching no arm → falls through to the trailing implicit `exit 0` (the let-through form). Control flow correct, no dangling `;`, jq apostrophe-escaping intact (73/73 tests green confirm; JSON valid via `jq empty` in Pass-1).
- **Removed-behavior:** the deletions (orchestrator deny arm + `WB_ALLOW_REVIEW_ORCHESTRATOR=1` escape) are the feature's intent; the env var becomes a harmless no-op with docs updated and history kept honest. The per-diff guarantee it backed moves to protocol routing discipline + the existing soft route-reminder (PM-decided 2026-06-05, documented in `review-typology.md` + the architecture record) — a deliberate design choice, not a code defect.
- **Cross-file:** no live-source reference to the orchestrator or the flag survives outside honest history; the 7-role-duplicator arm is byte-identical to `main` (jq-diff, Pass-1) and the live `coder → deny` arm was functionally re-confirmed.
- **Cleanup/simplification/altitude:** the change is a net simplification (removes a guard + a case arm), adds no complexity, duplication, or special-casing.

## Code review: 2026-06-05 — built-in code-review (high effort) — no defects
