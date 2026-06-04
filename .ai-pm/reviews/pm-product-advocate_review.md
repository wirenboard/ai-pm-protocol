# pm-product-advocate — plan-compliance review (Pass 1)

Editorial verification per the plan's Test plan (`review-stamp-gate` precedent; repo has
no runtime and no executable tests by design — `doc/architecture.md` § Architectural
constraints). "Missing tests" is not a finding for this feature.

## Plan compliance

**Scenario 1 — per-feature gate fires on user-facing plans.** ✓ `.claude/commands/pm-plan.md`
`## Product-readiness gate (user-facing features only)`: spawns `pm-product-advocate`
(tier `per-feature`) after the contract draft, before coder handoff, with plan + contract +
`docs/product.md` + `docs/user-journeys.md`; reach decided by the human-role-subject
extraction (reused from `pm-auditor`, not re-encoded). Mirrored as WORKFLOW.md Step 3.5.

**Scenario 2 — gaps relayed in one pass; PM resolves each.** ✓ `pm-plan.md` step 3:
one `AskUserQuestion` pass, answer-or-descope-with-rationale recorded as numbered
`## Resolutions` entries; step 4 holds the coder handoff until every gap resolved — never a
silent skip, never a permanent veto (block overridable by a recorded descope).

**Scenario 3 — complete plan is a silent pass.** ✓ `clean` verdict → record artifact and
proceed, no `AskUserQuestion`, no ceremony. Stated in the agent, `pm-plan.md`, and WORKFLOW
Step 3.5. `clean` needs no `## Resolutions` trail.

**Scenario 4 — non-user-facing changes un-gated.** ✓ `pm-plan.md` Reach paragraph: every
non-human subject → exempt, no advocate spawn, no artifact, skip silently; `/pm-fixup`
never reaches the step. WORKFLOW Step 3.5 + the "What is mandatory when" product-readiness
rider both state the exemption with no feature-category special-casing.

**Scenario 5 — bootstrap foundational-question pass.** ✓ `.claude/commands/pm-bootstrap.md`
`## Foundational-question pass`: tier `bootstrap`, after the product Q&A, wired into all
three bootstrap modes (greenfield, legacy shallow, legacy full); one relay pass; owners
record answers into the bootstrap docs. Explicitly forces questions only, no auto-drafted
`docs/user-journeys.md` (scenario 8).

**Scenario 6 — advocate generates, orchestrator relays, human decides.** ✓ Agent file Hard
rules: "Never address the PM", "Never judge answer quality" (presence-only), output goes to
the orchestrator. Agent owns through `## Verdict`; does NOT write `## Resolutions`.

**Scenario 7 — load-bearing, not by-discipline.** ✓ `pm-plan-checker.md` gains exactly one
DoD item (#10, user-facing only; existing 9 intact); `pm-auditor.md` dimension-1 gains one
user-facing-only check reusing the existing human-role-subject extraction. Both keyed on the
greppable token; both treat `clean` and `gaps: N`-with-N-resolutions as the two resolved
states; both exempt non-user-facing with no special-casing.

**Scenario 8 — bootstrap forces questions only.** ✓ See scenario 5.

### Arch-note structural shapes (the concrete contract)
- ✓ Step 3.5 placement between Step 3 (architecture) and Step 4 (coder), after contract draft.
- ✓ Two-tier `### Foundational product questions` (5 per-feature, 7 bootstrap), fixed order,
  presence-only, cross-domain vocabulary, lives once in WORKFLOW.md.
- ✓ Greppable `gaps: N` / `clean` verdict + stably-numbered gaps; `## Resolutions` owner-split.
- ✓ Second edit-ownership carve-out in WORKFLOW.md, worded by analogy to the code-review-trail
  carve-out, + agent-owned-artefact list entry + owner-list entry on both sides.
- ✓ No hook — `.claude/settings.json` absent from the diff.

### Categorical coverage (user-facing focus)
✓ The plan focuses on "user-facing"; each sibling change-type (backend/infra/CI, docs-only,
trivial fixup, diagnostic probe) is listed under Out of scope with a reason, and the
implementation gates on the human-role-subject extraction only — no silent widening to a
sibling. The "What is mandatory when" rider explicitly exempts the other rows.

### Single-source (decision 8) — verified by grep
✓ The checklist question text (`why this, and not the way they do it today`,
`the zero-to-working step`, `the No-Gos`, `Recovery & key-loss`, `who runs it, who funds it`)
appears **only** in WORKFLOW.md. `### Foundational product questions` is referenced by name
from `pm-product-advocate`, `/pm-plan`, `/pm-bootstrap` (+ architecture/plan as docs) — never
re-encoded.

### Stack expectations (frontmatter)
✓ `.claude/agents/pm-product-advocate.md` opens with valid YAML frontmatter: `name`
(lowercase-hyphen) + `description` present, `tools: Read, Grep, Glob, Bash, Write`, **no
`model:`** field (inherits session model). Matches the cited rule
(`doc/stack-notes.md` § "Markdown frontmatter") — no contradiction, the read-only-referee
shape verbatim.

### Existing behaviors preserved
✓ `tests/hooks.sh` green (71/71, unchanged — no hook added). Non-user-facing `/pm-plan` flow
unchanged. "Only the orchestrator talks to the PM" preserved (relay via `AskUserQuestion`).
One structured pass, no per-question tool-spam. `/pm-fixup` does not reach the gate.
`pm-plan-checker` DoD gains exactly one item. `pm-auditor` reuses, not duplicates, the
extraction. Bootstrap product Q&A unchanged, pass runs after it additively.

## Definition of Done
- [x] All plan scenarios implemented and tested — implemented; "tested" = editorial per the
      no-automated-tests-by-design constraint (Test plan: none).
- [x] Interaction scenarios have concurrent-state tests — N/A: protocol-spec change, no
      runtime / shared state / concurrency (plan §Interaction scenarios); the adjacent-mechanism
      interactions (fixup, backend, absent/unresolved at plan-checker/auditor, zero-gap) are
      all realized in the prose gates.
- [x] Stack expectations respected; stack-spec tests pass — frontmatter rule honored;
      `tests/hooks.sh` green.
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change — N/A: no
      Product Contract touched (template repo is the documented no-contract exception).
- [x] Pipeline green — `tests/hooks.sh` 71/71.
- [x] State file updated — `.ai-pm/state/current.md` reflects the task, done items, touched
      files, next step.
- [x] Product Impact Report present — N/A: no contract touched.
- [x] Docs updates landed — `doc/architecture.md` decision + roster 7→8 + file-layout
      "Eight persona files" (pm-architect, commit `1de6b55`); WORKFLOW.md; `/pm-plan`;
      `/pm-bootstrap`; `pm-plan-checker`; `pm-auditor`; README one-line mention. All "Docs to
      update" entries present.
- [x] Expected artifacts exist — plan (`doc/features/pm-product-advocate_plan.md`), this
      review, no Product Contract required (repo exception). The advocate report artifact is the
      *feature being built*, not an artifact of this feature's own delivery.

**DoD: pass**

## Blocking
(none)

## Notes (product)
(none — the gate's reach, override mechanism, and exemptions all match the PM decisions
recorded in the plan; no scope expansion observed.)

## Verdict
approve

## Code review findings

Pass 2 (`code-review`, high effort, prose-protocol adaptation: 3 targeted finders —
cross-ref/single-source, contradiction, gate-logic coherence). Two finders clean; the
third surfaced one load-bearing finding (the rest refuted or minor prose-clarity, listed
under "Considered, not surfaced").

1. **Count-match wording ambiguity in the gate steps.** `.claude/commands/pm-plan.md`
   step 3 (and the parallel `.claude/commands/pm-bootstrap.md` step 3) say "Record **each**
   as a numbered entry in the `## Resolutions` trail." Both backstops do a **strict
   count-match** — `pm-plan-checker` (`gaps: N` with **N** numbered entries) and
   `pm-auditor` (same), where "fewer than N entries → unresolved → blocking". The advocate
   spec is precise ("the orchestrator … appends … **one numbered entry per gap**"), but the
   command wording's "each" is ambiguous (each gap vs each PM answer). *Failure scenario:*
   the PM answers 3 relayed gaps in one `AskUserQuestion` sentence; an operator reads
   "record each [answer]" and writes **one** `## Resolutions` entry; the backstop greps
   `gaps: 3` vs 1 entry → false "unresolved" block of a genuinely-resolved gate. *Fix:*
   align both command steps with the advocate spec — "Record **each gap** as a numbered
   entry (one per gap, in gap order, matching the gap's number)" — so the N↔N count-match is
   unambiguously mechanical.

**Considered, not surfaced** (verified refuted or minor, recorded for the trail): bootstrap
`clean`-artifact existence (refuted — the advocate always writes the file incl. `clean`;
`pm-auditor` checks per-feature artifacts, not the bootstrap one); `/pm-plan` silent-pass
explicitness (refuted — "No `AskUserQuestion`, no ceremony" is already explicit); bootstrap
answer→`user-journeys.md` scope and "when an answer should land in a doc" (minor — the
`user-journeys.md` population is explicitly deferred; the doc-landing judgement is inherent).

## Code review: 2026-06-04 — passed
