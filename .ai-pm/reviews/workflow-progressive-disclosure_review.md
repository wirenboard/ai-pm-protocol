# workflow-progressive-disclosure — Pass-1 plan-compliance review

Feature: `workflow-progressive-disclosure` (branch `feature/workflow-extract-to-refs`).
Class: software-kind, non-user-facing meta-feature (subjects = `WORKFLOW.md` / `workflow/*.md` / the agents+commands that read them). No Product Contract, no product-readiness advocate gate (human-role-subject exemption). Verification = editorial + clean-grep; `tests/hooks.sh` is the only harness.

## Plan compliance

- ✓ **Scenario 1 — `WORKFLOW.md` becomes a thin constitution + router at the same path.** `WORKFLOW.md` is now 79 lines (well under the ~150 target). It carries exactly the always-on invariants the plan/arch Decision-2 list requires: the banner + tie-breaker, `pm-*`-not-`wb-*` one-liner, project-boundary one-liner, edit-ownership one-liner (with carve-out pointer), remote-system one-liner, language canon, the git-flow skeleton (never-commit-to-main), the Step 0–7 skeleton-as-router, the PM-comms core one-liners, and the full navigation map. No `### X` enum-home heading lives in it (verified — all six `### ` subsection anchors resolve only in `workflow/*.md`).
- ✓ **Scenario 2 — bulk decomposed into on-demand `workflow/*.md` topic files.** 15 files present at the arch-note seams (`roster`, `enforcement`, `pipeline`, `mandatory-matrix`, `project-kind`, `decision-authority`, `review-typology`, `security-surfaces` (merges surfaces + threat-model lifecycle as designed), `foundational-questions`, `state`, `incident`, `protocol-gap`, `maintenance`, `pm-comms`, `examples`). Each carries the standard "topic file … read on demand" header and preserves its source section name as the heading anchor. Each `### ` anchor + each `## ` named section resolves to exactly one home (clean-grep below).
- ✓ **Scenario 3 — live by-name references repointed + procedural Read steps where the consumer acts.** ~40 live refs repointed across `.claude/agents/*` (7), `.claude/commands/*` (3 touched), `MIGRATIONS.md`, and the templates; every `` `### X` in `WORKFLOW.md` `` → `` `### X` in `workflow/<topic>.md` ``. Every referenced topic file exists. Read steps added at the act-points for foundational-questions, security-surfaces (×2 consumers + pm-architect), review-typology, **and now the autonomous decision-authority machinery (Blocking #1 resolved — see below).**
- ✓ **Scenario 4 — reliability preserved by construction.** (a) Cross-cutting invariants stay eager in the thin core; (b) the router/Step-0–7 skeleton is eager → every topic file is reachable by name; (c) procedural Read steps present for the enumerated act-points; (d) subagent personas (pm-product-advocate, pm-plan-checker, pm-architect) carry their own Read steps.. Hooks remain the independent hard floor (untouched).
- ✓ **Scenario 5 — additive, no migration.** `@.ai-pm/tooling/WORKFLOW.md` import line byte-unchanged; banner line 1 byte-unchanged; `workflow/*.md` ride the submodule (relative path, dual-context). **No `MIGRATIONS.md` migration *entry* added** — the MIGRATIONS.md diff is pure repointing of existing *content references* (verified line-by-line). `CLAUDE.md.tmpl` Project-kind comment repointed.

## Verification floors

**Anchor-inventory clean-grep (objective floor): PASS.**
- All six named `### ` subsection anchors resolve to exactly ONE `workflow/*.md` home, none duplicated, none left as a heading in `WORKFLOW.md`: Project kind → `project-kind.md`; Decision authority → `decision-authority.md`; Review typology → `review-typology.md`; Security-relevant surfaces + Threat-model lifecycle → `security-surfaces.md`; Foundational product questions → `foundational-questions.md`.
- Every `## ` named section (`## How I work`, `## What is mandatory when`, `## How to talk to the PM`, `## How state is kept`, the incident / protocol-gap / maintenance / roster / hook-enforcement sections) resolves to exactly one topic file.
- Every `workflow/<topic>.md` reference in a live consumer points to an existing file (zero orphans).
- Zero live anchor references still point at `WORKFLOW.md`. The only two remaining `WORKFLOW.md` mentions in live consumers are both legitimate: `pm-fixup.md` ("Fix a typo in `WORKFLOW.md`" — a literal worked example), and `pm-architect.md` ("language canon in `WORKFLOW.md`" — correct, language canon is an always-on invariant that lives in the thin core). Frozen `doc/features/*_plan.md` audit-trail refs left intact (expected, not findings).

**Read-step checklist (reliability floor): PASS (Blocking #1 resolved in commit `9116848`).** Present and correctly placed for: pm-product-advocate→`foundational-questions` ("before checking any input"); pm-plan + pm-plan-checker→`security-surfaces` ("before deciding"); pm-architect→`security-surfaces` ("before drafting the threat-model"); pm-audit→`review-typology` ("before running the sweep"); **and now decision-authority at all three executing consumers — `pm-bootstrap.md:398` ("before deriving the first feature"), `pm-plan.md:248` ("before applying any of the autonomous branches below"), `pipeline.md:28` ("before running the derivability test below").** The always-on one-liners (edit-ownership, remote-system, language canon, `pm-*`/`wb-*`, project-boundary) correctly carry NO Read step — they are eager in the core; that distinction is applied correctly, not as a blanket excuse.

**Thin-core completeness: PASS.** Nothing cross-cutting was demoted to a lazy file; every Decision-2 "must stay" item is present in the 79-line core; every topic file is reachable from the router table.

**Single-source preserved: PASS.** No enum/default re-encoded in the router (verified: zero matches for the enum/default patterns in `WORKFLOW.md`). The "never re-encode the enum/default" clauses survive verbatim in `project-kind.md`, `decision-authority.md`, `review-typology.md`. The deliberately-repeated invariant "merge/ship stays manual in BOTH scopes" is canonical in `decision-authority.md` and correctly echoed (not re-encoded as a competing rule) in `pipeline.md`, `pm-comms.md`, and the WORKFLOW.md router. **The three new Read steps are pointer-only** — verified the commit `9116848` diff adds only the "Read `workflow/decision-authority.md` before X" clause at each site (each original sentence preserved verbatim); the enum, the `absent file OR unrecognized ⇒ interactive` default, and the resolution order were NOT re-encoded at any insert site.

**Constraints honored: PASS.** `tests/hooks.sh` green (74/74 — superset of the plan's stated 17, all pass); `.claude/settings.json`, `tests/hooks.sh`, frozen `doc/features/*_plan.md`, `doc/architecture.md`, `doc/stack-notes.md` all untouched. `@`-import line byte-unchanged. No MIGRATIONS migration entry. markdownlint spot-check clean per state file. The fix commit `9116848` touched only the three intended consumer files + `.ai-pm/state/current.md` bookkeeping — nothing out of scope.

**examples.md judgment-call: COMPLIANT (no PM sign-off needed) — see Notes (product) #1.**

## Definition of Done

- [x] All plan scenarios implemented and tested (editorial + clean-grep; the one scoped Read-step gap is now resolved)
- [x] Interaction scenarios have concurrent-state tests (none — provably isolated, correctly declared)
- [x] Stack expectations respected; stack-spec tests pass (the cited `@`-eager rule is satisfied — bulk reached via Read, not re-`@`-imported; `WORKFLOW.md` is the only `@`-imported spec and is now thin)
- [n/a] Product Contract honored — no Product Contract touched (non-user-facing meta-feature)
- [x] Pipeline green (`tests/hooks.sh` 74/74)
- [x] State file updated (`.ai-pm/state/current.md` reflects the slice accurately)
- [n/a] Product Impact Report present — no contract touched
- [x] Docs updates landed — all plan "Docs to update" items that are coder-owned have landed. The one remaining item (`doc/architecture.md` `## File layout` + `## Integration contract` note) is **architect-owned canon, deferred by design to the post-coding `pm-architect` handoff** (pipeline Step 4 / before `pm-pr-prep`) — see the handoff note below. Tracked as a required remaining step, not a Pass-1 compliance failure.
- [x] Expected artifacts exist (plan, this review; no contract — non-user-facing)
- [n/a] Product-readiness gate resolved — non-user-facing (human-role-subject exemption)
- [n/a] Validation gate resolved — software-kind project

**DoD: pass** — the single blocking Read-step gap is resolved; the pending `pm-architect` docs handoff is a by-design post-review step (orchestrator-fired at Step 4), not a Pass-1 failure.

## Blocking

1. ✓ **RESOLVED in commit `9116848`.** *(was: the autonomous decision-authority machinery was acted on with no explicit "Read `workflow/decision-authority.md`" procedural step anywhere in the consumer set.)* The coder added one well-placed Read step at each executing consumer's autonomous-branch entry point: `pm-bootstrap.md:398` ("**Read `workflow/decision-authority.md` before deriving the first feature**"), `pm-plan.md:248` ("**Read `workflow/decision-authority.md` before applying any of the autonomous branches below**"), `workflow/pipeline.md:28` ("**Read `workflow/decision-authority.md` before running the derivability test below**"). Re-verification confirms: (a) all three steps are present and placed at the start of the autonomous logic; (b) the single `pm-plan.md:248` step is reached before ALL FIVE downstream autonomous branches — audit nudge (L271), pending-migration (L298), architect-review offer (L331), plan-approval (L337), contract-existence (L369) — because it sits in the plan-format region, ahead of every section that hosts a branch, so no branch can execute without first encountering it (the "one well-placed step covers them" claim holds); (c) pointer-only — the enum/default/resolution-order were not re-encoded at any insert site (diff is a pure prepend of the Read clause); (d) no rule meaning changed, nothing out of scope touched, `tests/hooks.sh` 74/74. This closes failure-shape B (silent-rule-skip) on the highest-stakes lazy rule in the set.

## Notes (product)

1. **examples.md judgment call — COMPLIANT, no PM sign-off required.** Scenario 2 literally says `examples.md` "absorbs" the ✓/✗ pairs, ASCII diagram, Matter worked example, and probe template. The coder instead kept each illustration **co-located with the rule it demonstrates** (✓/✗ pairs inline in `pm-comms.md`, the Matter blast-radius case + probe template inline in `incident.md`) and made `examples.md` a **catalog that points to each home + reproduces the one free-standing ASCII flow diagram**. Verdict: this **honors the plan's load-bearing intent better than physical extraction would**, and violates no stated constraint. The plan's binding rules are (a) "relocate, don't weaken" and "meaning preserved 1:1" (Out of scope), (b) "each topic file stands alone" (Test plan), and (c) the navigation entry for examples must exist (router). Physically detaching an example from its rule would make a rule *less* self-contained for an agent that Reads only that one topic file — directly cutting against (b). No rule was weakened or fragmented; every illustration still resolves; the router's "Worked examples → `workflow/examples.md`" line is present and the catalog dispatches to each home. The arch note itself left the exact home flexible ("fold into the relevant topic files" — Decision 3). This is faithful to the design's intent, not a scope deviation. No product decision needed; recording it only so the PM sees the coordinate-vs-extract choice was made deliberately.

## Pending handoff (required remaining step — not a Pass-1 failure)

- **`pm-architect` post-coding Docs-to-update handoff is still PENDING** (scheduled after this review per the plan). Required before ship: `doc/architecture.md` `## File layout` must gain the `workflow/` directory + files (A4: File layout ↔ `git ls-tree`), and `## Integration contract` item 3 should gain the one-sentence note that the `workflow/*.md` siblings ride the same submodule (the `@`-line stays unchanged). This is correctly deferred to the architect (it is architect-owned canon, not a coder edit) and is the only outstanding "Docs to update" item. It is the orchestrator's next action (pipeline Step 4 / before `pm-pr-prep`), not a coder fix and not a re-review trigger.

## Verdict

approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See the "Edit-ownership rule" in `workflow/enforcement.md` — the Pass-2 code-review
     trail is the single carve-out to "orchestrator does not edit content artefacts". -->
## Code review findings

Pass 2 ran `code-review` (high effort) over the full branch diff via 3 restructure-correctness finder angles: pointer/cross-reference integrity, relocation fidelity / removed-behavior, single-source integrity + markdown. **Zero findings** — every router-map entry resolves to an existing topic file and section; all ~40 by-name references repointed correctly with no stale `in WORKFLOW.md`; every rule/gate/carve-out and the high-risk lists (7 security surfaces, 5 review types, 3 foundational-question tiers) survive 1:1; no enum/default re-encoded (router carries names only); deliberate-repeat invariants preserved; markdown MD022/MD032 clean.

## Code review: 2026-06-05 — passed
</content>
</invoke>
