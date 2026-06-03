# README front-gate — plan compliance review

Branch: `feature/readme-front-gate` (`e09a830`, `1aa0df0`) vs `main`.
Plan: `doc/features/readme-front-gate_plan.md` (read in full).
Meta/template repo — no automated harness for templates/procedures (recorded in `doc/architecture.md`); `tests/hooks.sh` is the only executable test. Verification by review against the plan's named checks.

## Plan completeness
- Stack expectations: plan declares "None tracked" with rationale (markdown body not a tracked stack component) — consistent with `doc/stack-notes.md`. OK.
- Interaction scenarios: plan declares **not** provably isolated and lists three interaction scenarios (move-not-copy ordering, A4 intact, no false nudge). Section present. OK.
- Not a hotfix topic. OK.

## Plan compliance
- ✓ **Scenario 1** (new scaffold: intro + single pointer, no `## What it does`, other sections unchanged) — `doc/_templates/README.md.tmpl`. `## What it does` section removed; pointer line `→ What it does, for whom, and current limits: [\`docs/product.md\`](docs/product.md).` at line 5; Quick start / Architecture / Development / License intact and unchanged.
- ✓ **Scenario 2** (reader funnelled to `product.md`) — the pointer line is the only capability surface in the template; satisfied by the same diff.
- ✓ **Scenario 3** (existing-project migration as an offer: detection + nudge + non-blocking audit note) — detection condition `pm-bootstrap.md:56`; migration procedure `pm-bootstrap.md:77-86`; `/pm-plan` nudge `pm-plan.md:232-236`; `/pm-audit` offer `pm-audit.md:92-95`; `pm-auditor` non-blocking note `pm-auditor.md:122`.
- ✓ **Scenario 4** (new-structure README not flagged) — detection is by *positive presence* of a `## What it does` heading; "A project already on the new structure (no `## What it does` heading) is not flagged" stated at `pm-bootstrap.md:56`, echoed in `pm-auditor.md:122`, `pm-plan.md:232`, `pm-audit.md:92`.

### Test plan checks (review checks — no harness)
- ✓ `template-no-capability-list` — `README.md.tmpl` has no `## What it does` heading and no capability bullet list; intro paragraph then single `docs/product.md` pointer line; Quick start / Architecture / Development / License intact.
- ✓ `template-soft-break-safe` — pointer line (`README.md.tmpl:5`) has a blank line before (4) and after (6); no two adjacent non-blank lines. No GitHub soft-break collapse.
- ✓ `no-status-line` — template carries only the intro paragraph and the `docs/product.md` link; no maturity/status line present.
- ✓ `old-template-readme-detection` — `### Pending-migration detection` gained **exactly one** new condition (`pm-bootstrap.md:56`). The v2.2 (line 47), v2.3 (lines 48-52), and old-format-map (line 54) conditions are byte-unchanged — branch diff shows zero deleted lines in `pm-bootstrap.md`, additions only. New condition carries a move-not-copy remediation performed by `pm-architect`.

### Interaction scenario checks (review checks)
- ✓ `migration-move-not-copy` — `pm-bootstrap.md:79-85`: step 1 reconciles README bullets into `docs/product.md` `## Что умеет сегодня` (writes only product.md), step 2 removes the README list *only after* step 1; explicit "No capability is ever dropped: step 1 always precedes step 2." Step assigned to `pm-architect`.
- ✓ `a4-cross-check-intact` — procedure preserves Quick start / install verbatim (`pm-bootstrap.md:82`: "Preserve the README's Quick start / install and every other section verbatim — only the `## What it does` section is removed. This keeps `pm-architect` A4's `Integration contract ↔ README install` cross-check valid"). Template change drops only the capability list, leaving Quick start.
- ✓ `plan-and-audit-nudge` — `/pm-plan` nudge (`pm-plan.md:232`) and `/pm-audit` + `pm-auditor` note (`pm-audit.md:92`, `pm-auditor.md:122`) all reference `### Pending-migration detection` by name and do not re-encode the condition.

### Contracts / scope intent
- ✓ README owns no capability statement (template drops `## What it does`; only the pointer remains).
- ✓ Migration is move-not-copy, explicitly NOT a blind rewrite — stated at `pm-bootstrap.md:79` and the architecture note.
- ✓ Nudge surfaces reference the detection section by name rather than re-encoding.
- ✓ Auditor note is structure-only (detects the `## What it does` section), not prose-policing — `pm-auditor.md:122`: "Detect the structural capability-list section only — never prose-police the README's wording."
- No Product Contract: this template repo produces no scaffolded README of its own; per plan Contracts section no Product Contract is created. No Product Contract touched.

### Scope boundaries
- ✓ This repo's own `README.md` untouched (not in diff).
- ✓ `product.md` funnel `## Что умеет сегодня` format not redesigned (migration only moves capabilities in).
- ✓ English-canonical not pulled in (pointer line / header language left as-is).
- ✓ Status line excluded per PM decision (`no-status-line` confirmed).
- ✓ `doc/architecture.md:104` updated to record the ownership decision (README owns no capability list; product.md single owner; move-not-copy migration) and adds the plan to Source.

## Definition of Done
- [x] All plan scenarios implemented and tested (review checks, per meta-repo exception)
- [x] Interaction scenarios have concurrent-state tests (review checks: move-not-copy ordering, A4 intact, no false nudge)
- [x] Stack expectations respected; stack-spec tests pass (none tracked — N/A)
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change (no Product Contract touched)
- [x] Pipeline green (`bash tests/hooks.sh` → 65/65 passed)
- [x] State file updated — see note below; not in plan's Docs-to-update, treated as non-blocking
- [x] Product Impact Report present (no contract touched — N/A)
- [x] Docs updates landed — README.md.tmpl, pm-bootstrap.md, pm-auditor.md, pm-plan.md, pm-audit.md, architecture.md all in branch
- [x] Expected artifacts exist (plan present; this review present; no contract required — not user-facing)

**DoD: pass**

## Blocking
None.

## Notes (product)
1. The migration relies on `pm-architect`'s coverage judgment to decide whether a README bullet is "already reflected" in `docs/product.md` `## Что умеет сегодня`. Across language (README pointer text is English, the product header is Russian) and wording differences, this is a judgment call with no mechanical check. Why it matters: if `pm-architect` under-matches it duplicates, if it over-matches a capability could silently be dropped in the gap — the very failure the move-not-copy ordering guards against. The ordering is correct; the residual risk is the human/agent reconcile step. PM may want a downstream spot-check on the first real migration.
2. The plan's Docs-to-update list does not include `.ai-pm/state/current.md`; this branch does not update it. Not blocking per the plan's own scope, but flagging since the generic DoD lists a state-file update. Why it matters: PM should confirm the state file is intentionally out of scope for a template-only slice.

## Verdict
approve

<!-- orchestrator appends after code-review pass: -->
## Code review findings

## Code review
