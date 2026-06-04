# protocol-process-flavor (v1 slice) — Pass-1 plan-compliance review

*Protocol-spec / agent-prompt change to the ai-pm-protocol template repo. No runtime, no executable tests by design (repo's "validation by use" constraint). This meta-feature is itself software-kind (scenario subjects = agents/process, non-human) → product-readiness gate N/A, dry-run gate N/A to this feature; repo is the no-contract exception. Verification is editorial.*

## Plan compliance

### Scenarios

- ✓ **S1 Bootstrap asks the project kind** — `/pm-bootstrap` Q0 added early (alongside product/stack Q&A), references `### Project kind` by name, stores single-source in `CLAUDE.md`, defaults absent ⇒ software. `.claude/commands/pm-bootstrap.md:50` + the `CLAUDE.md` creation step (`including the ## Project kind: line from Q0`).
- ✓ **S2 Process-kind scaffolds the process template set** — "Process-kind scaffolding (only when Q0 = process)" block scaffolds `process.md` from `process.md.tmpl`, keeps shared pillars (product, stack-notes, architecture, journeys, threat-model if security), skips software-only scaffolding (no test/build pipeline; markdownlint as validator). `.claude/commands/pm-bootstrap.md:91`.
- ✓ **S3 The mandatory-table branches on kind** — Project-kind **rider** below the table (process: tests + Pass-2 code-review + build inert; plan/journeys/contracts/threat-model/audit/state apply). Existing software rows **byte-unchanged** (verified: no `^-` removal of any change-type row in the WORKFLOW.md diff). `WORKFLOW.md` `### Project kind`.
- ✓ **S4 No-code validation runs in place of code Pass-2** — "No-code validation discipline" section: dry-run/tabletop on Step 5.5 as the load-bearing stamped gate, markdownlint structural pre-gate, kind-conditioned DoD line, Pass-2 routes on kind. `WORKFLOW.md` `### Project kind` + Step 5 Pass-2 prose.
- ✓ **S5 pm-coder authors the process document** — remit generalized to "Author the plan's deliverable artefact" (source in software, `process.md` in process); `docs/` canon ban preserved (architecture/journeys/product/stack-notes/threat-model stay pm-architect-owned, "never touch `docs/`"). `.claude/agents/pm-coder.md:50`.
- ✓ **S6 A process doc can be terminal** — composition (SOP → another project's cited stack-notes) documented as **optional** ("Composition is optional" in WORKFLOW.md `### Project kind`; "optional and documented, not required" in architecture.md). No v1 requirement of downstream consumption.
- ✓ **S7 Software projects are unchanged** — `absent ⇒ software` default named once; software/kind-absent path: table rows byte-unchanged, Pass-2 default branch = code-review byte-for-byte, no `## Dry-run` section emitted (section-absence exemption), `per-feature`/`bootstrap` tiers unchanged. Legacy adoption = software.
- ✓ **S8 The advocate finds holes in the instruction** — new `process` tier in `### Foundational product questions` (roles/RACI, prerequisites/inputs, decision points, exception/failure-handling+recovery, zero-to-done) mapped to SOP sections; advocate/relay/DoD/auditor backstops reused verbatim; fires on process-kind features (operator = human role); this meta-feature exempt. `WORKFLOW.md` `### Foundational product questions` (tier enum now `per-feature | bootstrap | process`).

### Architecture outcomes (Variant A ×6)

- ✓ **A1 kind home + single-source** — `## Project kind` in downstream `CLAUDE.md` (carried by `CLAUDE.md.tmpl` defaulting `software`); the rule (enum + `absent ⇒ software`) single-sourced in new `### Project kind` WORKFLOW.md subsection; all consumers reference it by name (verified: pm-bootstrap, pm-coder, pm-plan-checker, pm-pr-prep, pm-auditor, CLAUDE.md.tmpl, process.md.tmpl all contain the by-name reference; no consumer re-encodes the default — grep for `absent…software` outside WORKFLOW.md returns nothing). Table extended by rider, not column.
- ✓ **A2 SOP author = pm-coder** — one-word remit generalization; `docs/` ban verbatim.
- ✓ **A3 dry-run stamp triad cloned** — pm-plan-checker writes born-loud `## Dry-run: NOT YET RUN` + `## Dry-run findings` (process-kind only; software emits none); orchestrator stamps `## Dry-run: <date> — passed`; gated by BOTH pm-pr-prep step 0 (loop over `Code review` + `Dry-run`, presence-keyed, section-absence exempt) AND pm-auditor dim 1 (extended to `## Code review` **or** `## Dry-run`). markdownlint pre-gate; kind-conditioned DoD line added (template + DoD list). Pass-2 routes on kind; software branch untouched.
- ✓ **A4 advocate process tier** — single-source tier added; advocate/relay/backstops reused verbatim.
- ✓ **A5 process.md.tmpl sections** — drop-in skeleton present with all 9 canonical sections in methodology order (purpose · scope · roles/RACI · inputs+outputs/SIPOC · procedure · decision points · exceptions+recovery · references · revision history); additive to journeys (experience flow) + contracts (good-outcome bar); behavioral-contract move-not-copy rule referenced; "confirm against methodology" caveat carried. Blank-line-correct (MD022/MD032). `doc/_templates/process.md.tmpl`.
- ✓ **A6 back-compat airtight** — one named `absent ⇒ software` rule every consumer defaults to; proportionality scales through existing change-type matrix + per-section `N/A` (no new mechanism).

### Categorical coverage

- ✓ The feature adds the `process` kind; the sibling `software` kind is the existing default and is unchanged (kind-absent = software) — recorded under Out of scope and demonstrated by the byte-unchanged software rows / untouched Pass-2 software branch. Full set covered.

### No new surface (decision 9)

- ✓ No new command, agent, or hook file in the diff (only modifications to existing agents + the bootstrap command). `.claude/settings.json` not in the diff → `tests/hooks.sh` unaffected (ran: 71/71 green). `doc/architecture.md` records the decision and adds `process.md.tmpl` to the File-layout `doc/_templates/` row.

### Stack expectations

- ✓ **markdownlint** (MD022/MD032) — the new `process.md.tmpl` is blank-line-correct; markdownlint named as the structural pre-gate, no new validator added; Vale noted optional/future, not added. No `docs/stack-notes.md` component change. No agent frontmatter-structure change.

### Product Contract

- No Product Contract touched — protocol-internal change, repo's no-contract exception (stated in plan § Contracts). N/A.

### Interaction scenarios

- ✓ Spec change, no runtime/shared mutable state. The four mechanism interactions (kind-absent defaults to software; software machinery dormant; process-kind Pass-2 routes to editorial+dry-run with the stamp gate firing; composition rides existing staleness machinery) are each editorially verified above (S3/S4/S6/S7, A3, A6).

## Definition of Done

- [x] All plan scenarios implemented and tested (editorial — no executable tests by design; 8/8 scenarios + 6/6 arch outcomes verified)
- [x] Interaction scenarios have concurrent-state tests (n/a — spec change, no runtime; mechanism interactions editorially verified)
- [x] Stack expectations respected; stack-spec tests pass (`tests/hooks.sh` 71/71 green; markdownlint discipline honored)
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change (n/a — no-contract exception; software/kind-absent behavior provably unchanged)
- [x] Pipeline green (`tests/hooks.sh` 71/71)
- [x] State file updated (`.ai-pm/state/current.md` — status review, full done-list, touched files)
- [x] Product Impact Report present (n/a — no contract touched)
- [x] Docs updates landed (process.md.tmpl, pm-bootstrap, WORKFLOW.md, pm-coder, plan-checker, pr-prep, auditor, CLAUDE.md.tmpl, README.md, doc/architecture.md, backlog — every "Docs to update" entry present)
- [x] Expected artifacts exist (plan, this review; no contract — software-kind meta-feature, no-contract exception)
- [n/a] Product-readiness gate resolved (this meta-feature's scenario subjects are agents/process, non-human → exempt by the standing human-role-subject extraction; the gate it ships fires on downstream process-kind features)
- [n/a] Dry-run gate resolved (this meta-feature is software-kind → no `## Dry-run` section; the gate it ships fires on downstream process-kind features)

**DoD: pass**

## Blocking

None.

## Notes (product)

None. (Scope matches the plan's v1 slice exactly — whole-project kind, bootstrap question, process template set, no-code validation wiring; the full per-feature artifact-kind axis and the automation-opportunity scanner are explicitly deferred to backlog, both recorded in `.ai-pm/backlog.md`. No scope expansion observed.)

## Verdict

approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See WORKFLOW.md "Edit-ownership rule" — the Pass-2 code-review trail is the single
     carve-out to "orchestrator does not edit content artefacts". -->
## Code review findings

Pass 2 (`code-review`, high effort, prose-protocol: 2 targeted finders — back-compat/gate
coherence + template/consistency). Template/consistency finder: **all pass**. Back-compat:
**airtight** (`absent ⇒ software` defaults correctly across every consumer; no consumer
re-encodes the enum/default; software mandatory-table rows byte-unchanged). One small fix; the
gate-coherence points are refuted as load-bearing.

1. **(fix) Legacy-adoption doesn't explicitly write the `## Project kind:` line.** `pm-bootstrap.md`
   legacy-adoption (line ~159) says "the `## Project kind:` line is `software` (the default)" —
   ambiguous on whether to *write* it, whereas greenfield (line ~73) explicitly fills it. For
   consistency (every freshly-bootstrapped project carries the line; the `absent ⇒ software`
   default is for pre-existing/older projects), legacy adoption should also **write
   `## Project kind: software`** explicitly. *Fix:* one-line wording in `pm-bootstrap.md`.

**Considered, refuted as load-bearing** (recorded for the trail): the pr-prep step-0 /
pm-auditor dimension-1 stamp gate is **kind-agnostic / presence-keyed** (a present
`## Code review` *or* `## Dry-run` section must be stamped; an absent section is exempt). A
finder flagged that it can't enforce "the *right* stamp for the kind" without reading
`CLAUDE.md`. Refuted: this is the **same presence-keyed design as the original review-stamp gate
(v2.14.0)** and is correct for the normal flow — `pm-plan-checker` is the single, kind-aware
writer that emits the kind-appropriate stamp section (`## Dry-run` for a process feature
*instead of* `## Code review`), and the gate enforces "present section must be stamped." The
"wrong stamp present" case requires an upstream `pm-plan-checker` bug, which is not the gate's
responsibility. A **kind-aware gate** (read `## Project kind`, require that kind's stamp) is a
reasonable future *defense-in-depth* enhancement, not a v1 defect — noted, not blocking.

## Code review: 2026-06-04 — passed

Pass 2 clean. Finding 1 (legacy-adoption writes `## Project kind: software` explicitly) fixed in
`88f7f83`; the gate-coherence points were refuted as load-bearing (presence-keyed by design,
matching the v2.14.0 review-stamp gate). Template/consistency + back-compat finders passed.
`tests/hooks.sh` 71/71.
<!-- The orchestrator replaces THIS WHOLE LINE with `## Code review: <date> — passed`
     only when code-review clears. Until then the section is UNSTAMPED: `pm-pr-prep`
     refuses to release it (step 0) and `pm-auditor` blocks on it (dimension 1).
     Never ship an empty `## Code review` heading — an empty section reads as
     "no findings / passed" to a quick eye or grep; `NOT YET RUN` reads as "not done".
     This meta-feature is software-kind, so its Pass-2 stamp is `## Code review`,
     not `## Dry-run`. -->
