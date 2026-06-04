# whole-codebase-quality-review — plan

Source: PM-directed 2026-06-05 — "есть кодревью всего проекта периодически? … по диффу мы смотрим постоянно или всегда?" Recorded as `.ai-pm/backlog.md` "Periodic whole-codebase code-quality review" (PR #218). PM picked it 2026-06-05.

*The protocol reviews every change **by diff** (`pm-plan-checker` + `code-review` per feature) and audits **compliance** periodically (`/pm-audit`), but "is the whole codebase clean overall" rests on the leaky assumption "sum of reviewed diffs = clean whole" — it misses legacy code never diff-reviewed, cross-cutting/emergent issues, and bad interactions a per-diff window can't see. `/pm-audit` already carries a thin hook — `## Technical quality (full scope only)` — that, on a full audit, **offers** a `code-review ultra` whole-project scan. But it is offer-only, has **no memory** (it would re-review the whole tree every time — which is exactly why it stays an expensive optional offer), defines **no findings-triage**, and has no autonomous-mode behavior. This slice turns that thin hook into a real, **proportional, findings-routed, autonomous-aware whole-codebase code-quality review** — the protocol's actual answer to "is the codebase clean overall", distinct from compliance and from per-diff review.*

Meta-feature on the template repo: **software-kind**, non-user-facing (subjects = `/pm-audit` / the orchestrator / the `code-review` skill / the auditor). No Product Contract, no advocate gate, no `## Validation` gate. Verification = editorial + clean-grep; `tests/hooks.sh` 74/74 (no hook touched).

## Scenarios

1. **Proportional scope — never re-review the same clean code (the missing memory).** The whole-codebase quality sweep records a **last-quality-sweep marker** (date + commit SHA, in the audit metadata home — exact home decided in arch-review). On a run, it scopes the `code-review` pass to **(a) code changed since the last sweep** (`git diff <last-sweep-sha>..HEAD` paths) **plus (b) never-swept areas** (legacy code onboarded via `/pm-bootstrap` full mode that was documented but never diff-reviewed, and anything no prior sweep covered), with a **periodic full re-sweep** (first sweep, legacy-onboarded project, or a cadence). So a tree already swept-clean since the last sweep is **not** re-reviewed end-to-end every audit — the cost is proportional to un-swept / changed surface, which is what makes a *periodic* sweep viable rather than a rare expensive offer.

2. **Findings are triaged, not lost.** The sweep's `code-review` findings are walked through the **same fix-now / next-sprint(backlog) / accept-with-context** triage `/pm-audit` already uses for protocol findings — each recorded in `.ai-pm/backlog.md` (with an `accepted (quality-sweep-<date>): <reason>` marker for accepts, mirroring the auditor's `accepted (auditor-<date>)`). Nothing the sweep finds vanishes; the PM triages it like any other finding.

3. **Legacy-onboarded code gets its first quality review.** On a project onboarded via `/pm-bootstrap` legacy full mode (code reverse-documented but never diff-reviewed), the first whole-codebase quality sweep covers that never-reviewed code — closing gap (a) the PM named. After it, that code is marked swept; later sweeps only re-cover it on a full re-sweep.

4. **Cadence — offered/run at the right moments, proportional.** The sweep fires: on a **full `/pm-audit`** (strengthening the existing offer), **once on a legacy-onboarded project** (first sweep), and on **PM request** ("review the whole codebase"). It does **not** run on a fast `diff` audit. Proportionality gate: if nothing changed since the last sweep and no never-swept area remains, the sweep is **silent / skipped** (announces "codebase swept-clean since <date>, nothing new to review").

5. **Autonomous-mode behavior (procedural gate, proportionally bounded).** In `autonomous` mode the "run the quality sweep?" offer is a **procedural checkpoint** per `### Decision authority` (procedural-gate progression, v2.24.0): the orchestrator **auto-decides + announces** instead of asking — but **bounded by the proportionality gate** (it runs the sweep only when there is un-swept / changed surface; it does not auto-launch a full-tree 10–15-min review on every audit). In interactive mode the existing yes/no offer is unchanged. **Merge/ship stays manual; findings still go to PM triage.**

6. **Selectable `code-review` level — for economy (PM-flagged).** The sweep does **not** hard-wire the most expensive level. The existing hook always runs `code-review ultra`; this slice makes the **level selectable** across the `code-review` skill's ladder (low / medium / high / max / ultra — low/medium = fewer high-confidence findings, cheap; high→max = broader; ultra = deep multi-agent, costliest). **Interactive:** the offer presents the cost/depth trade-off ("quick & cheap" vs "deep & thorough") and the PM picks. **Autonomous:** the orchestrator picks a **proportionate** level + announces — a lighter level for a routine proportional sweep (small changed surface), a deeper level for a first/legacy full sweep or on PM request — never silently defaulting to the costliest. The PM can override the level any time. This is the economy knob the PM asked for: a whole-tree `ultra` is the expensive worst case, not the only option.

7. **Distinct from compliance and from per-diff review — boundary stated.** The sweep is **code-quality** (bugs / security / dead code / cross-cutting issues over the tree), explicitly distinct from: the rest of `/pm-audit` (protocol **compliance** — artifacts / plans-match-impl / contracts / docs); per-diff `code-review` (Pass-2, one change's window); and the backlog item "cross-model review for high-risk changes" (a *different model* on *individual high-risk diffs*, not a whole-tree sweep). The boundary is stated where the sweep is defined.

8. **Additive, no migration.** Existing projects gain the proportional sweep at their next `/pm-audit` full run (or PM request); the first run records the baseline marker. No new mandatory artifact beyond the small last-sweep marker; no template structural change; the existing `## Technical quality` offer is strengthened, not replaced for interactive projects.

## Existing behaviors this feature touches

(what must not break)

- **`/pm-audit` `## Technical quality (full scope only)`** — strengthened (proportional scope + findings-triage + autonomous behavior + the named guarantee), not removed; the interactive yes/no offer wording is preserved for interactive mode.
- **`/pm-audit`'s finding-triage loop** (fix-now / next-sprint / accept-with-context → `.ai-pm/backlog.md`) — reused verbatim for the sweep's findings; the `accepted (quality-sweep-<date>)` marker mirrors the existing `accepted (auditor-<date>)`.
- **The `code-review` skill** (low/medium/high/max/ultra ladder) — the engine, invoked over the proportional scope at the **selected level**; the skill itself is unchanged (this slice stops hard-wiring `ultra`).
- **`### Decision authority` procedural-gate progression** (v2.24.0) — reused: the sweep offer is a procedural gate in autonomous mode (announce-and-proceed), bounded by proportionality; merge/ship stays manual.
- **The compliance audit + per-diff `code-review`** — untouched; the boundary statement keeps the three distinct.
- **Proportionality discipline** — the sweep never re-reviews swept-clean code; silent when nothing un-swept remains.

## Contracts

None. Process/tooling change to `/pm-audit`. No API, data shape, or downstream-consumed runtime artifact (the last-sweep marker is internal audit metadata).

## Interaction scenarios

Provably isolated: a prose-spec change to `/pm-audit` (+ a small marker the orchestrator reads/writes during an audit). No runtime, no shared mutable state across concurrent operations (an audit is a single sequential pass), no I/O beyond reading git + writing the marker / backlog. Covered by Scenarios 1–6 and clean-grep.

## Test plan

*Repo discipline: no automated tests by design — verification is editorial + clean-grep; `tests/hooks.sh` 74/74 (no hook touched).*

- Existing tests that must pass: `tests/hooks.sh` (74/74 — unchanged).
- New tests: none (prose-spec). Verification instead:
  - **Editorial walkthrough** — the strengthened section matches Scenarios 1–8: proportional scope (last-sweep marker → changed + never-swept + periodic full), findings-triage into backlog, legacy first-sweep, cadence (full audit / legacy / PM request, not diff audit), autonomous procedural-gate bounded by proportionality, the distinct-from-compliance/per-diff/cross-model boundary.
  - **Clean-grep — proportionality:** the sweep is described as scoped to changed-since-last-sweep + never-swept, never a blanket full-tree re-review every audit; silent when nothing un-swept remains.
  - **Clean-grep — findings home:** findings reuse the existing fix-now/backlog/accept triage; the `accepted (quality-sweep-<date>)` marker mirrors `accepted (auditor-<date>)`.
  - **Clean-grep — reuse, not re-encode:** the autonomous behavior references `### Decision authority` by name (no re-encoding); the `code-review` skill is named, not reimplemented.
  - **Clean-grep — boundary:** the section states the sweep is distinct from compliance, per-diff `code-review`, and the cross-model-review backlog item.
  - **Proportionality check:** on this repo (already per-diff-reviewed, no legacy), a sweep with the marker current would announce "swept-clean since <date>" and do nothing — proportional.
- Interaction scenario tests: none (provably isolated).
- Stack-spec tests: none (no stack component touched).

## Docs to update

- `.claude/commands/pm-audit.md` — strengthen `## Technical quality (full scope only)` into the **whole-codebase code-quality review**: (a) proportional scope via a **last-quality-sweep marker** (date + commit SHA — home decided in arch-review) → review changed-since-last-sweep + never-swept (legacy) + periodic full re-sweep; (b) the silent/skip proportionality gate when nothing un-swept remains; (c) findings routed through the existing fix-now / backlog / accept triage with an `accepted (quality-sweep-<date>)` marker; (d) the autonomous-mode procedural-gate behavior (announce-and-proceed per `### Decision authority`, bounded by proportionality); (e) the boundary statement (distinct from compliance / per-diff `code-review` / cross-model-review); (f) **selectable `code-review` level for economy** — replace the hard-wired `code-review ultra` with a chosen level across the skill's ladder (low/medium/high/max/ultra): interactive offers the cost/depth trade-off and the PM picks; autonomous picks a proportionate level + announces (lighter for a small routine sweep, deeper for a first/legacy/PM-requested sweep), never silently the costliest, PM can override. Keep the interactive yes/no offer wording for interactive mode.
- `.claude/commands/pm-audit.md` `## Auto-scope decision` / the marker home — record/read the last-quality-sweep marker (the exact location — a line in the audit report vs a dedicated `.ai-pm/` file — is the arch-review's call; reference it, don't pre-bake).
- *(`doc/architecture.md` decision record — only if the arch note judges the marker-home + proportionality-scope design an architectural decision worth recording; pm-architect post-coding handoff. Likely a short record given it adds a new whole-system guarantee + a marker artifact.)*
- *(No template / hook / `MIGRATIONS.md` change — additive; the last-sweep marker is born on first sweep, no migration.)*

## Out of scope

- **Cross-model review for high-risk changes** (the separate backlog item) — a *different model* reviewing *individual high-risk diffs*; orthogonal to this whole-tree single-model sweep. Not folded in.
- **Replacing per-diff `code-review` or the compliance audit** — both stay; this is the third, distinct mechanism.
- **Auto-fixing the sweep's findings** — out; the sweep flags + triages (fix-now spawns the normal `/pm-plan` → coder path; it never auto-edits).
- **A new standalone command** (`/pm-review-codebase`) — rejected in favor of strengthening the existing `/pm-audit` `## Technical quality` hook (it already exists, runs on the full-audit cadence, and has the finding-triage machinery). A separate command would duplicate the cadence + triage.
- **Guaranteeing a full-tree sweep on a fixed clock** — rejected as disproportionate; the sweep is proportional (changed + never-swept + periodic full), not a blanket full-tree review every cycle.
- **The exact last-sweep-marker home + the periodic-full-re-sweep cadence number** — settled in arch-review (structural choice), not pre-baked here.
