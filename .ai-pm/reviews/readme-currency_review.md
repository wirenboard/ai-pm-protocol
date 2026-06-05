# readme-currency — Pass 1 plan-compliance review

Feature: `readme-currency` (software-kind, non-user-facing meta-feature; subjects = `/pm-plan`, `pm-auditor`, `pm-architect`).
Branch: `feature/readme-currency`. Commits: f340e49, 4561adb, ec62a32, 4d98a0d (+ plan 924c3f5).
Verification: editorial + clean-grep (repo discipline — no automated tests by design).

## Plan completeness
- ✓ No "Stack expectations touched" needed — plan declares None; no stack component touched (correct).
- ✓ Interaction scenarios — plan carries `Provably isolated:` declaration (static change to two instruction files, no runtime / shared state / concurrency / I/O). Valid.
- ✓ No `docs/threat-model.md` in repo → not a security-bearing project → security-surface plan-omission block does not fire.
- ✓ Topic is not `hotfix-*` → no Incident-facts requirement.
- ✓ Categorical coverage — README-bearing surface set (install / packaging / quick-start / architecture-one-liner / doc-pointer) is covered as a whole by the check; siblings explicitly addressed under Out of scope ("no element is singled out"). Out of scope lists each excluded refinement (bidirectional A4, prose-policing, force-migration, capability section, ownership change) with a one-line reason.

## Plan compliance (Scenarios)

- ✓ **Scenario 1 — per-feature README-currency check** — implemented at `.claude/commands/pm-plan.md:160-173`. Matches the NFR / state-model shape: judgment-triggered ("a semantic judgement a regex cannot make — so there is **no hook** and no mandatory plan section"), names the full trigger set (install/packaging, quick-start, architecture one-liner, doc pointer), requires `README.md` in "Docs to update" only when fired, **silent otherwise** ("If the feature touches **none** of those surfaces — the check is **silent**"). Routes through the **existing** post-coding "Docs to update" handoff ("Do **not** invent a new handoff"). No new mechanism.

- ✓ **Scenario 2 — pm-auditor README-conformance dimension** — implemented at `.claude/agents/pm-auditor.md:130-135`. Structure-only **note** ("emit a **note** per missing beat"). Asserts install/quick-start + `## License` + `→ … docs/product.md` pointer present, and install ↔ `Integration contract` match (skipped silently when `## Integration contract` is N/A/absent). Explicitly **no prose-policing** ("Detect structure only — never prose-police the README's wording, quality, completeness, or currency-of-content"). Explicitly **complements (inverse), does not contradict** the old-`## What it does` check ("The two are **inverses, both valid** — they never contradict").

- ✓ **Scenario 3 — single-source** — neither the check nor the dimension re-encodes the canonical beat list. Grep confirms the only `что→зачем→install→details→license` restatement lives at `.claude/agents/pm-architect.md:90` — the **canonical source** (pre-existing authoring rule, unchanged except an appended handoff sentence). Both new sites reference it **by name** ("readme-template-canonical-shape" / "Canonical-README-shape authoring rule" / front-gate discipline / `doc/_templates/README.md.tmpl`) and carry the explicit "never re-encoded here" instruction (`pm-plan.md:173`, `pm-auditor.md:135`).

- ✓ **Scenario 4 — no contradiction** — A4 pairing (`pm-architect.md:66`, `Integration contract ↔ README install`) unchanged. New dimension states it "**generalizes** the A4 pairing into the periodic audit — same pairing, reused at audit time, not a replacement; it never contradicts A4". README ownership unchanged — `pm-architect` stays front-door owner (`pm-architect.md:90` handoff note; `pipeline.md:41` lists `README.md` under pm-architect's owned set). No capability/value section introduced (the "why" beat stays the `docs/product.md` pointer).

## Constraints
- ✓ No hook / `.claude/settings.json` / `tests/hooks.sh` change — `tests/hooks.sh` 74/74 green.
- ✓ No `MIGRATIONS.md` entry.
- ✓ No new `workflow/*.md` file (none added).
- ✓ No `doc/architecture.md` decision record (correct — enforcement, not a new decision).
- ✓ All `workflow/*.md` Read-steps/pointers in the four edited files resolve to existing topic files (live validation of v2.29.0 confirmed — 7 distinct targets, all OK). The pm-architect + pipeline edits added no new pointer (additive prose only).

## Proportionality
- ✓ Per-feature check is genuinely silent when no README surface is touched (this very feature touches none → README.md correctly not edited).
- ✓ Audit dimension emits notes only (non-blocking).
- ✓ install ↔ contract sub-check skipped when `## Integration contract` is N/A.

## Definition of Done
- [x] All plan scenarios implemented and tested (verification = editorial + clean-grep, per repo discipline)
- [x] Interaction scenarios have concurrent-state tests — n/a (`Provably isolated:` declared)
- [x] Stack expectations respected; stack-spec tests pass — n/a (None touched)
- [x] Product Contract honored — n/a (no Product Contract touched; non-user-facing meta-feature)
- [x] Pipeline green (`tests/hooks.sh` 74/74)
- [x] State file updated (`.ai-pm/state/current.md` → `review (readme-currency)`)
- [x] Product Impact Report present — n/a (no contract touched)
- [x] Docs updates landed (`pm-plan.md`, `pm-auditor.md`, `pm-architect.md`, `pipeline.md` — all conditional Docs-to-update items present; no architecture.md/threat-model handoff pending for this feature)
- [x] Expected artifacts exist (plan, this review; no contract — non-user-facing)
- [n/a] Product-readiness gate (user-facing only — exempt: all scenario subjects are the system/command/agents)
- [n/a] Validation gate (documentation-kind only — this is software-kind)

**DoD: pass**

## Blocking
None.

## Notes (product)
None. Scope matches the plan exactly; (c) bidirectional A4 explicitly deferred under Out of scope. No scope expansion.

## Verdict
approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker. -->
## Code review findings

Pass 2 ran `code-review` (medium effort) over the 4-hunk diff (`pm-plan.md` check, `pm-auditor.md` dimension, `pm-architect.md` + `workflow/pipeline.md` one-liners). **Zero findings** — single-source intact (no beat-list re-encoded; the only canonical-shape restatement is the pre-existing `pm-architect.md` authoring rule, referenced by name elsewhere); the new auditor dimension is the declared inverse-complement of the old-`## What it does` check and generalizes the A4 install↔Integration-contract pairing without contradicting it; both mechanisms are proportional, structure-only, no-prose-policing, no-hook; `workflow/*.md` pointers in the edited files unbroken; markdown well-formed. `tests/hooks.sh` 74/74.

## Code review: 2026-06-05 — passed
