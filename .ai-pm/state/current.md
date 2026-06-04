# Execution State

- **Task:** `protocol-process-flavor` (v1 slice) — make the protocol usable for process/documentation projects (no code) via a `kind = software | process` conditional split: `/pm-bootstrap` project-kind question + a new `process.md.tmpl` SOP artefact + no-code validation (dry-run/tabletop stamped gate + markdownlint pre-gate + DoD sign-off) + advocate process-tier gap-finding. Whole-project kind; absent ⇒ software (back-compat). Full artifact-kind axis + automation-scanner deferred (backlog).
- **Status:** review
- **Branch:** `feature/protocol-process-flavor` (from `main`)
- **Done:**
  - `/pm-research` → `.ai-pm/research/protocol-process-flavor_research.md`.
  - Plan approved → `doc/features/protocol-process-flavor_plan.md` (9 key decisions, 8 scenarios, Architecture-outcomes section).
  - Arch review → `.ai-pm/arch/protocol-process-flavor_arch.md` (Variant A ×6; kind in CLAUDE.md + rule in WORKFLOW `### Project kind`; mandatory-table RIDER not column; pm-coder remit "author the plan's deliverable artefact"; dry-run stamp triad cloned from review-stamp; advocate `process` tier; process.md.tmpl skeleton). Plan synced.
  - PM decisions (2026-06-04): v1 = slice (project-kind at bootstrap); SOP may be terminal (composition optional); advocate reused as SOP gap-finder.
  - **pm-coder implemented all 8 items (2026-06-04), 6 atomic commits:**
    1. `WORKFLOW.md`: `### Project kind` single-source subsection (enum + `absent⇒software`); Project-kind RIDER (process: tests/Pass-2-code-review/build inert; plan/journeys/contracts/threat-model/audit/state apply); no-code validation discipline (dry-run/tabletop = Step 5.5 load-bearing stamped gate + markdownlint pre-gate + DoD sign-off); Pass-2 routes on kind (Step 5 prose updated); optional composition note; new `process` tier in `### Foundational product questions`. Existing software table rows byte-unchanged (verified).
    2. `doc/_templates/process.md.tmpl` (new) — SOP skeleton (purpose · scope · roles/RACI · SIPOC · procedure · decision points · exceptions+recovery · references · revision history); confirm-against-methodology note; additive to journeys + contracts.
    3. `.claude/commands/pm-bootstrap.md`: project-kind Q0 (references `### Project kind` by name) + process-kind scaffolding branch; legacy adoption = software. `CLAUDE.md.tmpl`: `## Project kind: software` line + `process.md` Docs-table row.
    4. `.claude/agents/pm-coder.md`: remit generalized ("author the plan's deliverable artefact"; process.md in process mode); `docs/` ban preserved verbatim.
    5. `.claude/agents/pm-plan-checker.md`: process-kind born-loud `## Dry-run: NOT YET RUN` + `## Dry-run findings`; kind-conditioned DoD line; Pass-2 reinterpretation; software-kind unchanged.
    6. `.claude/agents/pm-pr-prep.md` (step 0) + `.claude/agents/pm-auditor.md` (dim 1): presence-keyed stamp checks extended to also gate `## Dry-run` — no new gate; section-absence exemption keeps software features unflagged.
    7. `README.md`: one-line capability mention (Russian, "что гарантирует" style).
- **Touched files:** `WORKFLOW.md`, `doc/_templates/process.md.tmpl` (new), `doc/_templates/CLAUDE.md.tmpl`, `.claude/commands/pm-bootstrap.md`, `.claude/agents/pm-coder.md`, `.claude/agents/pm-plan-checker.md`, `.claude/agents/pm-pr-prep.md`, `.claude/agents/pm-auditor.md`, `README.md`, `.ai-pm/state/current.md`.
- **Verified:** `grep "### Project kind" WORKFLOW.md` → single rule; consumers reference by name. Software mandatory-table rows byte-unchanged. `## Dry-run:` gated by BOTH pm-pr-prep step 0 and pm-auditor dim 1 (extended, presence-keyed). `.claude/settings.json` not touched; `doc/architecture.md` not touched. `bash tests/hooks.sh` → 71/71 green.
- **Next step:** review. Spawn `pm-architect` for the `doc/architecture.md` decision (process flavor as kind-conditioned split; no-code validation; new SOP artefact; back-compat default) — POST-coding handoff — then the review loop (`pm-plan-checker` Pass 1 + `code-review` Pass 2; this meta-feature is software-kind itself, so Pass 2 = `code-review`).
- **Validation:** no executable tests (repo constraint); `tests/hooks.sh` green; scenario coverage editorial; optional post-land dogfood = throwaway process-kind project for the device-integration SOP.
