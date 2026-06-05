# audit-scope-menu — Pass-1 plan-compliance review

Branch: `feature/periodic-codebase-review` (shared with the already-reviewed `review-engine-selection`; this review scopes **only** the `audit-scope-menu` changes — the `## Scope decision` rename/restructure + `## PM-facing flow` no-double-prompt guard + Hard-rules line + the `## Technical quality` internal cross-ref fix in `.claude/commands/pm-audit.md`, plus the `doc/architecture.md` currency note).

## Plan completeness
- No `docs/stack-notes.md` component touched (markdown-prose repo, no stack linter) → no "Stack expectations touched" section required; the plan states `(none)` with rationale. ✓
- Non-security project (no `docs/threat-model.md`) → security-surface plan check does not fire. ✓
- Plan carries a `Provably isolated:` declaration under Interaction scenarios (single-command PM-facing decision flow, no shared mutable state / concurrency / I/O; the one adjacent-flow interaction — no-double-prompt — is named as scenario 3 and covered editorially). ✓
- Topic is not `hotfix-<area>` → no "Incident facts" section required. ✓

## Categorical coverage
The categorical element the plan focuses on is the **initiator × scope-named** matrix: {system-initiated} vs {PM-initiated × scope-named, PM-initiated × scope-not-named}. All three branches are covered in `## Scope decision` steps 2–4 (system → announce-and-proceed; PM-initiated + explicit → honor directly; PM-initiated + unnamed → upfront menu). No sibling case silently implemented. ✓

## Plan compliance
- ✓ **Scenario 1 — PM-initiated, no scope named → one upfront `AskUserQuestion` menu (Quick `diff` / Full = whole project + quality sweep) before running; threshold logic preserved as recommended default.** Implemented in `.claude/commands/pm-audit.md` `## Scope decision` step 4 (one `AskUserQuestion`, two options, step-1 judgement marked as the pre-selected recommendation). The 60-day / 15-commit / first-audit threshold logic is preserved verbatim in step 1 (renamed "Auto-decide" → "Judgement", values unchanged) and routed to as the menu default. Editorial verification only (no automated test — see Test plan note below).
- ✓ **Scenario 2 — explicit scope skips the menu; explicit Full still surfaces sweep depth.** `## Scope decision` step 3: "полный анализ"/"go deep"/"everything"/"comprehensive" → `full`; "быстрая проверка"/"just a quick one"/"quick check" → `diff`; for explicit Full, "still surface the review-sweep **depth** choice (the `## Technical quality` depth offer applies — do not ask scope, only depth)"; explicit `diff` proceeds straight to audit.
- ✓ **Scenario 3 — safety nets preserved (thresholds as default, post-diff "run full?" offer, /pm-plan nudge) AND no-double-prompt guard.** Thresholds preserved (step 1). Post-`diff` "run a full audit now?" offer retained in `## PM-facing flow` step 3. `/pm-plan` 5-feature retrospective nudge untouched (not in this diff). No-double-prompt guard added: the post-diff offer "fires **only when a Quick / `diff` audit actually ran**" and explicitly does not fire when the upfront menu or explicit choice already picked Full. Matches the plan's `Provably isolated:` interaction declaration (covered editorially).
- ✓ **Scenario 4 — PM-initiated → menu in both authority modes; system-initiated → announce-and-proceed preserved.** Step 2 PM-initiated branch: "the menu is shown **regardless of authority mode** (autonomous mode does not suppress it)". System-initiated branch: "**announce-and-proceed** with the computed judgement, regardless of authority mode" with the one-sentence announcement preserved verbatim. Hard-rules line updated consistently.

## Interaction scenario coverage
The plan declares `Provably isolated:` (no concurrency / shared state / I/O) and routes the single adjacent-flow interaction (no-double-prompt) to scenario 3, to be "covered editorially in the procedure text". The procedure text carries the explicit guard (`## PM-facing flow` step 3). No concurrent-state test is required because there is no concurrent state — the isolation declaration is sound and matches the change. ✓

## Regression checks (Existing behaviors / Out of scope)
- ✓ **`## Technical quality` engine-selection reference (just-shipped `review-engine-selection`) intact.** The `## Scope decision` restructure renamed the internal cross-ref from `Auto-scope` → `Scope decision, step 1` in the first-run-precedence bullet (line ~154) — the reference now resolves correctly to the renamed section; the engine-selection intro/step-3 text and the `### Review typology` reference are unchanged by this diff. No dangling `Auto-scope` reference remains.
- ✓ **Auto-scope threshold semantics unchanged.** Step 1 keeps "empty or does not exist → first audit → `full`", "> 60 days OR > 15 feature commits → full, otherwise → diff", and the `git log … grep -cE "^[a-f0-9]+ (feat|fix):"` count verbatim. Threshold values not retuned.
- ✓ **Out of scope intact.** No new `/analysis` or `/review` slash command; threshold values (60/15/5) not retuned; sweep machinery (proportional gating, engine selection, depth mechanics, findings triage) untouched; system-initiated autonomous behavior unchanged (announce-and-proceed preserved both modes).

## Product Contract
No Product Contract touched — no-contract dogfood repo (`.ai-pm/contracts/` does not exist by design). Feature is a PM-facing internal-procedure refinement; all scenario subjects are non-human (request / system / menu). N/A.

## Docs to update
- ✓ `doc/architecture.md` — Currency note (2026-06-05) added to the existing eight-review-dimensions record (the record whose point 4 owned the auto-scope decision); describes the PM-initiated upfront menu, threshold-as-default, explicit-scope skip, system-initiated announce-and-proceed, and the no-double-prompt guard; cites `doc/features/audit-scope-menu_plan.md`. Landed in this diff.
- ✓ `.claude/commands/pm-audit.md` — the procedure change (scenarios 1–4). Landed in this diff.
- ✓ README correctly **not** touched — it carries no audit-scope-flow description, so the README-currency trigger does not fire (plan documents this).

## Test plan
- ✓ **NO new automated tests is correct.** This is a Markdown PM-facing procedure-flow change in a markdown-prose repo with no runtime/linter to host a "which question is asked when" assertion — a documented boundary (same one the engine-selection prose half recorded). Verification is editorial (this Pass-1) + Pass-2 `code-review` + validation-by-use. A runtime test is not demanded for prose.
- ✓ **`bash tests/hooks.sh` → 73/73** (re-run this turn). No hook touched by this feature.

## Definition of Done
- [x] All plan scenarios implemented and tested (editorial verification; no automated test by documented boundary)
- [x] Interaction scenarios have concurrent-state tests (`Provably isolated:` — no concurrent state; the one adjacent interaction covered editorially in the procedure text)
- [x] Stack expectations respected; stack-spec tests pass (none touched; `tests/hooks.sh` 73/73)
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change (no Product Contract touched — no-contract dogfood repo)
- [x] Pipeline green (`tests/hooks.sh` 73/73; no stack linter in this markdown-prose repo per `CLAUDE.md`)
- [x] State file updated (`.ai-pm/state/current.md` records coder-done + architect-done for `audit-scope-menu`)
- [x] Product Impact Report present (when contract touched) — n/a, no contract
- [x] Docs updates landed (`doc/architecture.md` currency note; `pm-audit.md` procedure; README correctly untouched)
- [x] Expected artifacts exist (plan `doc/features/audit-scope-menu_plan.md`; this review; no contract required — not user-facing)
- [x] Product-readiness gate resolved — **n/a** (non-user-facing: every scenario subject is the request / system / menu, not a human role; advocate gate exempt, no advocate artifact required)
- [x] Validation gate resolved — **n/a** (`software`-kind project per `CLAUDE.md` `## Project kind: software`; no `## Validation` section emitted)

**DoD: pass**

## Blocking
(none)

## Notes (product)
(none — scope respected, Out-of-scope intact, no scope expansion, no user-visible trade-off beyond the intended menu the PM directed.)

## Verdict
approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker. -->
## Code review findings
`code-review` (built-in, high effort) over the diff (`.claude/commands/pm-audit.md` + the `doc/architecture.md` currency note). **No defects (`[]`).**

This is a Markdown PM-facing procedure-flow change — no executable logic. Traced the prose for self-contradiction, dangling cross-refs, and logic gaps:
- **Hard-rules line:** the old absolute "never ask PM 'full or diff?'" was replaced with the initiator-split wording (PM-initiated intent → menu; explicit scope → skip; system-initiated → announce-and-proceed). Consistent with scenarios 1–4, no contradiction.
- **Cross-refs:** the `## Scope decision` rename was propagated — `## Technical quality` first-run precedence now cites "Scope decision, step 1" (no dangling "Auto-scope" reference); the engine-selection reference (just-shipped) is intact.
- **No-double-prompt guard:** added to `## PM-facing flow` step 3 — the post-`diff` "run full now?" offer fires only when a Quick/`diff` audit actually ran; an upfront/explicit Full sets `scope=full` so it does not double-fire. Logic sound.
- **Depth folding:** step 4 / `## Technical quality` step 3 resolve sweep depth in one pass with an explicit "do not double-ask depth" instruction; the orchestrator-vs-built-in depth distinction is consistent with `review-engine-selection`.

## Code review: 2026-06-05 — built-in code-review (high effort), no defects — passed
