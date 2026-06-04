# review-typology-framework — plan

Source: PM-directed 2026-06-05 — the multi-type review vision ("несколько уровней ревью … разбить на типы и сделать разную периодичность … самое тяжёлое пореже или вручную, что смелл чек почаще"). Research-backed: `.ai-pm/research/review-typology_research.md` (deep-research `wf_aa28c5c0-435`). **Slice 1 of the EPIC review-typology** — the framework + the first concrete type (smell/hygiene). Earlier draft folded from `.ai-pm/research/review-typology_slice1-draft.md`.

*The protocol reviews every change **by diff** and audits **compliance** periodically, but has no layered **review typology** — distinct review TYPES, each with its own cadence, depth, and scope. Research validated a layered model and the dominant cadence rule **"review new/changed code, not already-clean code"** (Clean-as-You-Code), plus the clean split **structural→deterministic tool / semantic→LLM** (our backlog #211). This slice lays the **framework** — a single-sourced review-type registry with shared proportional machinery — and implements the **first, lightest type: smell / hygiene**, operationalized via `/pm-audit`'s existing `## Technical quality` hook. The heavier types (architectural, functional/integration, criticality-prioritization) are **registered as later slices**, not built here.*

Meta-feature on the template repo: **software-kind**, non-user-facing (subjects = the review-typology discipline / `/pm-audit` / the orchestrator / the `code-review` skill). No Product Contract, no advocate gate, no `## Validation` gate. Verification = editorial + clean-grep; `tests/hooks.sh` 74/74 (no hook touched in this slice — deterministic smell-detection hooks are a named later step, not built here).

## Scenarios

1. **The review-typology registry (the framework, single-sourced).** A canonical `### Review typology` discipline (home — WORKFLOW.md vs `/pm-audit` — decided in arch-review) names the review **types**, each with **cadence · depth · scope · deterministic-half · AI-half**:
   - **per-diff** (exists) — every change; lint(det) + low/med AI semantic;
   - **smell / hygiene** (this slice) — frequent; detection(det, future hook) + prioritization(AI);
   - **architectural** (later slice) — periodic, scoped to changed+hotspot; layering/cycle/dependency rules(det) + convention/approach judgement(AI, high depth);
   - **functional / integration** (later slice) — rare/manual; contract/integration/e2e **tests**(det) + seam reasoning(AI, ultra) — *more testable than reviewable*;
   - **criticality-prioritization** (later slice) — a lens over all types, ordering critical→cosmetic from Contracts + threat-model + churn.
   Consumers reference this registry by name; the enum/cadence lives once here (the single-source discipline, mirroring `### Decision authority`).

2. **Smell / hygiene type — the first concrete review, run from `/pm-audit`.** `/pm-audit`'s `## Technical quality (full scope only)` hook is strengthened into the **smell/hygiene sweep**: it runs the `code-review` skill over the **proportional scope** (Scenario 3) to surface functionality-preserving hygiene issues (dead code, duplication, high cognitive complexity, over-complexity, simplification) — distinct from a per-diff bug. Its **detection** is the kind of check a deterministic hook/linter *should* eventually own (named in Scenario 7, not built here); its **prioritization / root-cause** is the AI's job, at the selected depth.

3. **Proportional scope — new-code gating (research-validated; the missing memory).** The sweep records a **last-sweep marker** (date + commit SHA — home decided in arch-review) and scopes the review to **(a) changed since the last sweep** (`git diff <last-sweep-sha>..HEAD` paths) **+ (b) never-swept areas** (legacy code onboarded via `/pm-bootstrap` full mode, documented but never diff-reviewed) **+ (c) a periodic full re-sweep** (first sweep / legacy / cadence). A tree already swept-clean since the last sweep is **not** re-reviewed end-to-end — cost is proportional to un-swept/changed surface, exactly the Clean-as-You-Code pattern. **Silent/skip** when nothing un-swept remains ("swept-clean since <date>").

4. **Selectable depth — economy (PM-flagged).** The sweep does not hard-wire `code-review ultra`. The **depth is selectable** (low/medium/high/max/ultra): interactive presents the cost/depth trade-off and the PM picks; autonomous picks a **proportionate** depth + announces (lighter for a small routine sweep, deeper for a first/legacy/PM-requested sweep), never silently the costliest, PM can override.

5. **Findings triaged, not lost.** Sweep findings run through `/pm-audit`'s existing **fix-now / next-sprint(backlog) / accept-with-context** triage, recorded in `.ai-pm/backlog.md` with an `accepted (quality-sweep-<date>): <reason>` marker mirroring `accepted (auditor-<date>)`.

6. **Autonomous-mode procedural gate, proportionally bounded.** In `autonomous` mode the "run the sweep?" offer is a **procedural checkpoint** per `### Decision authority` (v2.24.0): auto-decide + announce, **bounded by the proportionality gate** (runs only when there is un-swept/changed surface; never auto-launches a full-tree ultra sweep every audit). Interactive yes/no offer unchanged. Merge/ship stays manual; findings still go to PM triage.

7. **Deterministic-vs-AI split, named per type (ties to backlog #211).** The registry names, for the **smell type**, its **deterministic half** (smell *detection* — an enumerable catalog a hook/linter should run every time, cheap/reliable) and its **AI half** (prioritization / root-cause — the `code-review` skill). This slice **names** the deterministic half as the path for a later step (a smell-detection hook), and **does not build the hook** — the AI sweep is the slice-1 deliverable. This makes the EPIC the place where the #211 boundary is applied concretely.

8. **The heavier types are registered, not built.** Architectural, functional/integration, and criticality-prioritization appear in the registry as **named later slices** (with their cadence/depth/det-vs-AI sketched), so the framework is complete but only the smell type is implemented here. No partial half-built heavy type.

9. **Additive, no migration.** Existing projects gain the proportional smell sweep at their next full `/pm-audit` (or PM request); the first run records the baseline marker. No new mandatory artifact beyond the small last-sweep marker; the existing `## Technical quality` offer is strengthened, not removed for interactive projects; no template structural change.

## Existing behaviors this feature touches

(what must not break)

- **`/pm-audit` `## Technical quality (full scope only)`** — strengthened into the smell-sweep (proportional scope + depth-selectable + findings-triage + autonomous + registry reference); the interactive yes/no offer wording is preserved for interactive mode.
- **`/pm-audit`'s finding-triage loop** (fix-now / next-sprint / accept-with-context → `.ai-pm/backlog.md`) — reused verbatim; `accepted (quality-sweep-<date>)` mirrors `accepted (auditor-<date>)`.
- **The `code-review` skill** (low→ultra ladder) — the engine, invoked over the proportional scope at the selected depth; unchanged (this slice stops hard-wiring `ultra`).
- **`### Decision authority` procedural-gate progression** (v2.24.0) — reused for the autonomous sweep offer; merge/ship stays manual.
- **The compliance audit + per-diff `code-review`** — untouched; the registry states the boundary keeping the types distinct (and distinct from the cross-model-review backlog item).
- **Proportionality + no-prose-policing disciplines** — the sweep never re-reviews swept-clean code; the deterministic-half naming is shape-not-meaning (a future hook), not prose-policing here.

## Contracts

None. Process/tooling change. The last-sweep marker is internal audit metadata, not a downstream-consumed API.

## Stack expectations touched

(from `doc/stack-notes.md`)

- **Claude Code hooks API** — only *referenced* (the smell type's deterministic half is named as a future hook); **no hook is added in this slice**, so no new `permissionDecision` surface. Source: <https://code.claude.com/docs/en/hooks>.
- **git** — the proportional scope uses `git diff <last-sweep-sha>..HEAD` and the marker stores a commit SHA. Source: <https://git-scm.com/docs/git-diff>.

## Interaction scenarios

Provably isolated: a prose-spec change to the review-typology discipline + `/pm-audit` (+ a small marker the orchestrator reads/writes during an audit). No runtime, no shared mutable state across concurrent operations (an audit is one sequential pass), no I/O beyond reading git + writing the marker / backlog. Covered by Scenarios 1–9 and clean-grep.

## Test plan

*Repo discipline: no automated tests by design — verification editorial + clean-grep; `tests/hooks.sh` 74/74 (no hook touched).*

- Existing tests that must pass: `tests/hooks.sh` (74/74 — unchanged).
- New tests: none (prose-spec). Verification instead:
  - **Editorial walkthrough** — the registry names the 5 types with cadence/depth/scope/det-half/AI-half; only the smell type is implemented (others registered as later slices); the smell sweep is proportional (last-sweep marker → changed + never-swept + periodic full), depth-selectable, findings-triaged, autonomous-bounded, with the det-vs-AI split named.
  - **Clean-grep — single-source:** the typology enum/cadence lives once in the registry home; `/pm-audit` references it by name, not re-encoding.
  - **Clean-grep — proportionality:** scoped to changed + never-swept, never blanket full-tree every audit; silent when nothing un-swept remains.
  - **Clean-grep — no hook added:** no change to `.claude/settings.json`; the smell-detection deterministic half is *named* as a later step, not built; `tests/hooks.sh` untouched.
  - **Clean-grep — reuse not re-encode:** the autonomous behavior references `### Decision authority`; the `code-review` skill + the triage loop are named, not reimplemented.
  - **Clean-grep — boundary:** the registry states smell-type's distinction from per-diff / compliance / architectural(later) / cross-model-review.
  - **Proportionality check:** on this already-per-diff-reviewed repo with the marker current, a sweep announces "swept-clean since <date>" and does nothing.
- Interaction scenario tests: none (provably isolated).
- Stack-spec tests: none new (no stack component's behavior changed; git/hooks only referenced).

## Docs to update

- **`WORKFLOW.md` `### Review typology` (the registry — arch-decided home).** A new single-sourced subsection mirroring `### Decision authority` / `### Project kind`: the 5 types with cadence/depth/scope/deterministic-half/AI-half; the proportional new-code-gating + last-sweep-marker concept; the per-type det-vs-AI naming (ties to #211); the heavier types (architectural / functional-integration / criticality) each a row **visibly marked "later slice — not built"**. The enum/cadence lives **once** here; consumers reference it by name and re-encode nothing. (The `/pm-audit`-section-as-registry alternative is **rejected** per the arch note — `/pm-audit` is only the runner of one type.)
- `.claude/commands/pm-audit.md` — strengthen `## Technical quality (full scope only)` into the **smell/hygiene sweep**, referencing `### Review typology` by name: proportional scope via the **last-sweep marker** (below), silent/skip gate, depth-selectable (drop hard-wired `ultra`), findings via the existing triage with `accepted (quality-sweep-<date>)`, autonomous procedural-gate bounded by proportionality. Keep the interactive yes/no offer.
- **Last-sweep marker — a line in the audit report, NO new file (arch-decided).** The smell sweep writes a `## Quality sweep: <date> — swept <sha>..HEAD at depth <d>` line into the `.ai-pm/audits/audit-<date>.md` report it already produces; the next sweep finds the **latest `audit-*.md` containing a `## Quality sweep` line** and scopes `git diff <that sha>..HEAD` + never-swept. This extends the auditor's existing "derive the diff cutoff from the latest audit report" pattern (`pm-auditor.md` step 2) — **no dedicated `.ai-pm/` file**. **Reuse the auditor's existing "first run = full" fallback verbatim** (no parallel one): if no `audit-*.md` carries a `## Quality sweep` line, the sweep is a full re-sweep. Note the coupling: the marker exists only where an `audit-*.md` does (safe while the `/pm-audit` full-scope hook is the sole trigger).
- `doc/architecture.md` — a short decision record: the review-typology framework as a new whole-system discipline (layered review, new-code gating, det-vs-AI split), EPIC slice 1; registry home = `WORKFLOW.md` `### Review typology`, marker = audit-report line (with the **marker↔audit-report coupling** noted — a future standalone sweep trigger would need a dedicated marker home); heavier types deferred. (pm-architect post-coding handoff.)
- *(No `.claude/settings.json` / hook / template / `MIGRATIONS.md` change — additive; the deterministic smell-detection hook is a named later step.)*

## Out of scope

- **The heavier review types** — architectural (slice 2), functional/integration (slice 3), criticality-prioritization lens (slice 4) — registered in the typology but **not built** here; each its own later plan.
- **Building the deterministic smell-detection hook/linter** — this slice ships the **AI** smell sweep + *names* the deterministic half as the path; the hook itself is a later step (and may be only partially hook-able per #211).
- **Replacing per-diff `code-review` or the compliance audit** — both stay; the typology states the boundary.
- **Cross-model review for high-risk changes** (separate backlog item) — a different model on individual high-risk diffs; orthogonal to this whole-tree single-model sweep.
- **Auto-fixing sweep findings** — out; the sweep flags + triages (fix-now spawns the normal `/pm-plan` → coder path; never auto-edits).
- **A new standalone command** — rejected; the smell sweep strengthens the existing `/pm-audit` `## Technical quality` hook (existing cadence + triage), the registry is a discipline, not a command.
- **The exact registry home, marker home, and periodic-full-re-sweep cadence number** — settled in arch-review.
