# protocol-process-flavor — plan (v1 slice)

*(this is a protocol change to the ai-pm-protocol template repo itself; its own scenario subjects are the bootstrap process / agents — non-human — so the product-readiness gate is exempt and the repo is the no-contract exception)*

## Context

Make the protocol usable for **process / documentation** projects (no executable code) — e.g.
an SOP for "integrating a new device into the company ecosystem", or a human runbook ("how to
diagnose a crashed server", "how to solder components onto a board"). Research is done
(`.ai-pm/research/protocol-process-flavor_research.md`): the protocol's core (plan → author →
review → audit, artifacts-as-source-of-truth, the four pillars) transfers; only the
code-specific machinery (Pass-2 `code-review`, build/test pipeline) is inert in no-code mode.
This repo is already a docs-as-code project ("no automated tests by design — validation by
use"), so the no-code mode is partly dogfooded.

**PM decisions 2026-06-04 (via AskUserQuestion + conversation):**

- **v1 = the slice** (not the full artifact-kind axis, not the thin template-only): a
  `/pm-bootstrap` **project-kind question** (`software | process`) that selects a process
  template set + the no-code validation wiring; **whole project = one kind**; the per-feature /
  mixed-project artifact-kind axis is the deferred generalization.
- **A process doc is often a TERMINAL human artefact** (solder/diagnose) — v1 must **not**
  assume downstream consumption. The "process project's SOP → consumed by another project" path
  is **optional**, documented, not central.
- **Out of scope, recorded in backlog:** the automation-opportunity scanner (process→code
  bridge) and the full artifact-kind axis (mixed projects).

## Key design decisions

(settled by research + PM; the structural HOW goes to the arch review — see Architecture forks)

1. **Conditional split on kind, not a fork** — one protocol, a declared `kind` consumed by the
   existing `WORKFLOW.md` "What is mandatory when" table (extended with a kind dimension) and by
   the agents. Validated by Bazel/Gradle/CI-matrix practice (shared defaults + per-kind
   overrides). `software` is the default; an absent kind = `software`, so existing projects are
   unaffected.
2. **`kind` is declared once** (single-source) — most likely a `## Project kind: software |
   process` line in the downstream `CLAUDE.md` (every agent already reads `CLAUDE.md`); exact
   home confirmed in the arch review.
3. **No-code validation is layered** (research ranking): the **load-bearing gate** is an
   **artifact-based dry-run / tabletop** (the real "tests pass" for a process) mapped onto the
   existing **Step 5.5 "run it for real"** (human-driven pilot/tabletop); a cheap **structural/
   prose lint** pre-gate (markdownlint already in the repo; Vale optional); a **DoD / expert
   sign-off** checklist gate (never a lone rubber-stamp). The dry-run result is recorded as a
   **load-bearing artifact** (mirror the review-stamp loud-marker + gate so a skipped dry-run is
   non-silent, not by discipline).
4. **Pass-2 `code-review` is inert in process mode** (no bug/security/dead-code analogue) →
   replaced by **editorial review + the dry-run gate**. The build/test pipeline + git-PR release
   apply only insofar as the process docs live in git (they do, in this model).
5. **A dedicated process/SOP artefact is added** (research medium-conf) — a new
   `doc/_templates/process.md.tmpl` with canonical sections, **alongside** `user-journeys.md`
   (operator experience flow), not instead. Shared pillars still apply: product/why,
   `stack-notes` = the company systems & standards the process must respect, constraints,
   threat-model where relevant.
6. **Canonical SOP sections** (research design-guidance; confirm against primary BPMN/ISO-9001/
   standard-work in the arch review): purpose • scope • roles (RACI) • inputs/outputs (SIPOC) •
   step-by-step procedure • decision points • exceptions / failure handling • references •
   revision history.
7. **Proportionality** (research failure-modes): scale ceremony to the artefact's stakes — a
   high-stakes/repeated/multi-role process gets the full discipline; a low-stakes one-off
   doesn't (the protocol's existing proportionality instinct, here applied to process docs).
8. **Composition is optional, documented:** a process project's SOP output **can** be consumed
   by another project as a **cited `stack-notes` standard** (same shape as software respecting a
   spec; and its versioning rides the v2.17.0 doc-migration staleness machinery) — but a process
   doc may equally be a terminal human artefact. v1 documents the path; it does not require it.
9. **Gap-finding in the SOP reuses `pm-product-advocate` (no new agent).** A process project is
   inherently **human-facing** (the operator is a human role), so the existing product-readiness
   gate **fires** on process-kind features — the advocate is the natural independent referee that
   finds **holes in the instruction** before it ships: does the SOP cover roles/RACI,
   prerequisites/inputs, decision points, **exception / failure handling and recovery**, and the
   operator's zero-to-done story? This is exactly the advocate's existing job (independent,
   presence-of-an-answer not prose-quality, block-but-sovereign, relayed in one
   `AskUserQuestion`). The `### Foundational product questions` checklist gains a **process tier**
   (or the per-feature tier is reinterpreted for an SOP — the exact shape is the arch review's
   call), mapping to the SOP's canonical sections (a missing roles/RACI, missing failure-handling,
   or missing decision-points block = a gap the advocate surfaces). **Note the exemption boundary:**
   the gate is exempt for *this* meta-feature (the protocol change itself, whose scenario subjects
   are agents/process), but it **applies to downstream process-kind features** (the operator is a
   human role) — these are different things.

## Scenarios

1. **Bootstrap asks the project kind.** `/pm-bootstrap` asks early (alongside the product/stack
   Q&A) whether the project is `software` or `process`; the answer is stored single-source in
   the downstream `CLAUDE.md`. An existing project with no kind declared is treated as
   `software` (back-compatible).
2. **Process-kind scaffolds the process template set.** On `kind = process`, bootstrap scaffolds
   the process/SOP artefact (`process.md` from the new template) + the shared pillars (product,
   stack-notes, constraints, journeys, threat-model if security is in play); the software-only
   scaffolding that has no process meaning is skipped.
3. **The mandatory-table branches on kind.** `WORKFLOW.md` "What is mandatory when" gains a kind
   dimension: in `process` mode, tests + Pass-2 `code-review` + build pipeline are **inert**;
   plan + journeys + contracts (as "good-outcome" definition) + threat-model + audit + state
   **apply** (shared). In `software` mode nothing changes.
4. **No-code validation runs in place of code Pass-2.** For a process-kind feature, the review
   loop's Pass-2 becomes **editorial review + a structural/prose lint** pre-gate, and Step 5.5
   becomes a **dry-run / tabletop** (the load-bearing gate); the dry-run outcome is stamped as a
   load-bearing artifact (a skipped dry-run is non-silent, mirroring the review-stamp gate).
5. **pm-coder authors the process document.** In process mode the plan's deliverable is the
   process/SOP document; the authoring agent produces it (which agent + how its "never edit
   source code" remit reads in this mode → arch review). Editorial/structure gates apply, not
   code-quality gates.
6. **A process doc can be terminal.** Nothing in v1 requires a process project's output to be
   consumed elsewhere; the SOP stands alone as a human artefact. The composition path
   (SOP → another project's cited `stack-notes`) is documented as **optional**.
7. **Software projects are unchanged.** A `software`-kind (or kind-absent) project behaves
   exactly as today — every code-only step still applies; the process machinery is dormant.
8. **The advocate finds holes in the instruction.** On a process-kind feature, `pm-product-advocate`
   runs as the pre-coding gate (the operator is a human role) and generates SOP-completeness gaps
   from the **process tier** of `### Foundational product questions` (roles, prerequisites,
   decision points, failure/exception handling + recovery, the operator's zero-to-done story);
   the orchestrator relays them in one `AskUserQuestion`; the coder handoff is blocked until each
   gap is answered or consciously descoped — the existing block-but-sovereign mechanism, reused
   verbatim, now pointed at the SOP.

## Existing behaviors this feature touches

(what must not break)

- **`/pm-bootstrap` greenfield/legacy flows + product/stack Q&A** — gain one early kind
  question + a process scaffolding branch; the software path is unchanged.
- **`WORKFLOW.md` "What is mandatory when" table** — gains a kind dimension; the existing
  change-type rows (user-facing / backend / docs-only / trivial) are unchanged for software.
- **Step 5.5 "run it for real" + the review loop** — process mode reinterprets Pass-2 as
  editorial + dry-run; software mode unchanged.
- **The agents** (pm-coder, pm-plan-checker, pm-architect, pm-stack-researcher) — gain
  process-mode behavior; their software behavior is unchanged. (pm-coder's deliverable in
  process mode is a document — the remit-wording change is the delicate bit → arch review.)
- **The template set** (`doc/_templates/*`) — gains `process.md.tmpl`; existing templates
  unchanged.
- **Existing downstream projects** — kind-absent = software = no behavior change.
- **`tests/hooks.sh`** — stays green; no hook added.
- **Application-agnostic constraint** — process examples cross-domain (device-integration,
  server-diagnosis, board-soldering), never one baked in as vocabulary.

## Contracts

(protocol-internal — repo's no-contract exception)

- **`kind` declaration** — single-source `## Project kind: software | process` in downstream
  `CLAUDE.md` (home confirmed in arch review); absent = `software`. Read by `/pm-bootstrap`,
  the mandatory-table consumers, and the authoring/review agents.
- **`doc/_templates/process.md.tmpl`** — the SOP artefact: canonical sections (decision 6).
- **No-code validation gate** — dry-run/tabletop recorded as a load-bearing stamped artifact
  (greppable done/not-done marker, mirroring the review-stamp `## Code review: …` pattern);
  structural-lint pre-gate; DoD/sign-off checklist.
- **Mandatory-table kind dimension** — which steps are inert vs apply per kind.

## Stack expectations touched

- **markdownlint** (already in the repo's authoring discipline) — the process artefact must be
  blank-line-correct markdown (MD022/MD032), the cheap structural pre-gate. No new validator
  required for v1; **Vale** is noted as an optional future prose-lint, not added now.
  (No `docs/stack-notes.md` component changes; if the arch review decides to add Vale as a
  pipeline validator, that becomes a stack-notes entry then.)
- **Markdown frontmatter** — only touched if v1 adds/edits an agent's frontmatter; the process
  behavior is prompt-body, so likely no frontmatter-structure change (confirm in implementation).

## Interaction scenarios

Protocol-spec / agent-prompt change — **no runtime, no shared mutable state**. Mechanism
interactions:

- A **kind-absent** existing project: every consumer must default to `software` → no behavior
  change (the load-bearing back-compat guarantee).
- A **software-kind** project: the process machinery (process template, dry-run-instead-of-
  code-review, kind branches) is fully dormant.
- A **process-kind** feature reaching the review loop: Pass-2 routes to editorial + dry-run, not
  `code-review`; the dry-run stamp gate must fire (a skipped dry-run is blocked downstream).
- The **composition** path: a process project's SOP cited in another project's `stack-notes`
  rides the existing stack-staleness + doc-migration machinery on a new SOP version (no new
  wiring needed; documented only).

## Test plan

- **Existing tests that must pass:** `tests/hooks.sh` (green) — unaffected; run to confirm.
- **New executable tests:** none — repo "no automated tests by design" constraint; validation
  editorial + by use. (Aptly, this feature *is* the generalization of that very constraint.)
- **Editorial verification** (`pm-plan-checker` + review): the kind question + single-source
  storage + back-compat default (absent = software); the process template's canonical sections;
  the mandatory-table kind dimension (code-only steps inert in process, software unchanged); the
  no-code validation gate is load-bearing (dry-run stamp, non-silent on skip); pm-coder's
  process-mode authoring remit is coherent; composition documented as optional; no new
  hook/`.claude/settings.json` change.
- **Dry-run of the flavor itself (validation by use):** after landing, bootstrap a throwaway
  `process`-kind project for the device-integration SOP and confirm the flow produces a sound
  SOP with the dry-run gate — the protocol's own "run it for real".
- **Mandatory-table classification:** protocol/agent-prompt change; scenario coverage editorial.

## Docs to update

- `doc/_templates/process.md.tmpl` (new) — the SOP artefact with canonical sections.
  *Implemented by `pm-coder`.*
- `.claude/commands/pm-bootstrap.md` — the project-kind question + the `process`-kind scaffolding
  branch (which templates to write, which software-only scaffolding to skip). *`pm-coder`.*
- `WORKFLOW.md` — the "What is mandatory when" kind dimension; the no-code validation discipline
  (dry-run/tabletop as the Step 5.5 load-bearing gate + structural-lint pre-gate + DoD sign-off);
  the `## Project kind` single-source declaration; the optional composition note (SOP →
  another project's `stack-notes`). *`pm-coder`.*
- Agent prompts as the arch review directs — at minimum `pm-coder` (authors the process doc in
  process mode), and the review-loop reinterpretation (Pass-2 → editorial + dry-run). *`pm-coder`.*
- `WORKFLOW.md` `### Foundational product questions` — add a **process tier** (or reinterpret the
  per-feature tier for an SOP) so `pm-product-advocate` finds holes in the instruction (roles,
  prerequisites, decision points, failure/exception handling + recovery, zero-to-done) — the
  exact shape is the arch review's call. The advocate, its relay, and its DoD/auditor backstops
  are **reused unchanged**; only the question source gains the process tier. *`pm-coder`.*
- `CLAUDE.md.tmpl` — carry the `## Project kind` line (default software). *`pm-coder`.*
- `doc/architecture.md` — the architectural decision (process flavor as a kind-conditioned
  split; no-code validation; new SOP artefact; back-compat default). Owner `pm-architect`,
  post-coding handoff.
- `README.md` — one-line capability mention (the protocol now also develops process/
  documentation projects, not only software). *`pm-coder`.*

## Out of scope

- **The full artifact-kind axis / mixed projects** (per-feature kind) — deferred generalization
  (backlog: process-flavor item, "full axis" option).
- **The automation-opportunity scanner** (process→code bridge) — separate backlog item; depends
  on this flavor landing.
- **Required downstream consumption of a process doc** — composition is optional; a process doc
  may be terminal (solder/diagnose).
- **Vale / OSCAL-structured artefacts** — optional future tooling; v1 uses markdownlint + dry-run
  + editorial + sign-off.
- **Sibling of the categorical choice:** the feature adds the **`process`** project kind; the
  sibling **`software`** kind is the existing default and is unchanged (kind-absent = software).
