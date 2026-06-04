# doc-migration-on-template-bump — plan

*(the "user" of the protocol is the orchestrator / agents; the human in the loop is the PM. Scenario subjects below are the audit process / `pm-auditor` / the orchestrator — non-human — so the product-readiness gate is exempt and this repo's no-contract exception applies.)*

## Context

When a downstream project bumps the template version (`git submodule update --remote`), the
**mechanical** half of doc migration is already covered: `MIGRATIONS.md`
`### Pending-migration detection` lists structural detect-conditions (a stale `_index.md`, a
frozen signature line, `Guarantees:` labels, Russian funnel headers, a `## What it does`
list, wire-token contracts, an unstamped review trail), and `/pm-audit` already detects them
and offers the matching mechanical migration. What is **missing** is the **semantic** half:
a new template version introduces a *discipline* that needs **PM-authored content** —
populated threat-model assets (v2.13), foundational user-journeys, a value-first product
story — and these are not "a stale artifact is present" (greppable, mechanical) but
"an expected discipline is absent/under-filled, and filling it needs product knowledge."

PM decision 2026-06-04 (via AskUserQuestion, after `/pm-research` →
`.ai-pm/research/doc-migration-on-template-bump_research.md`): build v1 by **extending
`/pm-audit`** (maximum reuse), not a new command or agent. The research's cross-ecosystem
findings map cleanly onto existing protocol machinery:

- **Template-update model (Copier)** — reconcile a scaffolded project against a newer
  template version. Our analogue: the auditor re-derives the project's state from source and
  compares it against the version's expected disciplines.
- **dpkg three-way proportionality** — prompt only when *both* the new version changed a
  discipline *and* the project doesn't already satisfy it; already-adequate docs are never
  re-flagged. Our analogue: the auditor's satisfied-check is silent when satisfied.
- **Load-bearing marker + escape hatch** (Next.js `@next-codemod-error` /
  `@next-codemod-ignore`) — surface the residue so it can't be silently skipped, but let the
  human consciously defer. Our analogue: the existing `/pm-audit` finding loop —
  fix-now / next-sprint / **accept-with-context** (the descope-with-rationale escape hatch,
  recorded in `.ai-pm/backlog.md`).
- **terraform plan→apply / doctor** — analyze → present a reviewable per-item report → human
  approves → apply. Our analogue: the existing `/pm-audit` PM-facing finding walk-through.

So v1 is genuinely small: a **version-keyed expectations manifest** + **one new `pm-auditor`
dimension** + **one new `/pm-audit` remediation type** (the semantic-content fill) +
**"run `/pm-audit` after a bump"** wired into `WORKFLOW.md` § Maintenance. No new command, no
new agent, no hook.

**This dimension generalizes the epic's "product story fell behind" note** — "N substrate
features shipped while `user-journeys.md` is still skeletal" is simply *one manifest entry*
(the journeys discipline unsatisfied). That backlog item is subsumed here.

## Key design decisions

> **DESIGN CORRECTION (post-code-review, 2026-06-04, PM-approved).** The first build added a
> **parallel detection** sub-check that duplicated existing `pm-auditor` dimension-5 findings
> (the skeleton-threat-model check is verbatim the existing one; the journeys / product.md
> checks overlap the existing "missing journey for an implemented user-facing feature" /
> "product.md missing/empty" notes) → double-flagging. **The only genuinely-new value is the
> PM-collaborative remediation** (relay the discipline's foundational questions →
> `pm-architect` authors). Corrected shape:
>
> 1. **No parallel detector.** The **existing** dimension-5 doc findings (missing journey,
>    missing/empty `product.md` funnel, skeleton `threat-model`) already detect these gaps and
>    are **unchanged**. The added "Expected-discipline gap" sub-check is **removed**.
> 2. **`### Expected-discipline manifest` is reframed as a question-source + introduced-in
>    registry** — per discipline: `Introduced in: vX.Y`, the **existing dimension-5 finding**
>    that detects it, and the **question source** for remediation. It carries **no
>    satisfied-checks** (detection lives in dimension 5); it is referenced by the remediation,
>    not by a detector.
> 3. **The net-new value lands on the existing findings' remediation** in `pm-audit.md`: when a
>    dimension-5 doc finding maps to a manifest discipline, the remediation **relays that
>    discipline's foundational questions in one `AskUserQuestion`** (the manifest's
>    question-source) → spawns `pm-architect` to author — instead of the old bare "spawn
>    pm-architect to refresh."
> 4. "Run `/pm-audit` after a bump" (WORKFLOW Maintenance) and the README line are unchanged.
>
> Everything below is read **through this correction** — where it says "new dimension /
> sub-check / detector," substitute "enhanced remediation on the existing dimension-5
> findings + the manifest-as-registry."

(settled; recorded so coder/reviewer don't re-litigate — the manifest's exact representation
goes to the arch review)

1. **Extend `/pm-audit`, no new command/agent** (PM decision). The protocol resists new
   surfaces; `/pm-audit` already owns the whole loop this needs — gap detection
   (`pm-auditor`), PM decision (fix-now / next-sprint / accept-with-context), remediation
   (spawn the owning agent), idempotence (re-derive from source each run). We add only the
   manifest + one dimension + one remediation type + the bump nudge.
2. **The escape hatch already exists.** `accept-with-context` (→ `.ai-pm/backlog.md`, marked
   `accepted (auditor-<date>): <reason>`) is the load-bearing-marker's
   conscious-defer-with-rationale analogue. A deferred discipline gap is recorded, not lost,
   and `pm-auditor` already does not re-raise accepted items. **No new marker mechanism.**
3. **Presence, not prose quality.** The dimension checks whether a discipline's required
   structure / content is **present** (e.g. threat-model `Assets`/`Threats` filled, not
   `<placeholder>`; a foundational journey exists for the zero-to-working story), **never**
   whether the prose is *good* — the PM owns meaning. Same "shape, not meaning" rule as the
   structural-token-lint, `pm-auditor`'s no-prose-policing, and the advocate's
   presence-not-quality discipline.
4. **Proportional + idempotent without a new state file (v1).** Proportionality comes from
   the **applicability test + satisfied-check**, not a version stamp: a discipline is flagged
   only when it **applies** to the project (e.g. threat-model only on a security-bearing
   project; journeys only when user-facing features exist) **and** is **not already
   satisfied**. A re-run on a project that already satisfies the disciplines yields **zero**
   new findings (the auditor re-derives from source — the terraform "no changes" property).
   A committed "last-migrated-to version" stamp (the `.copier-answers.yml` analogue) is an
   optimization **deferred** to a follow-up — not needed for correctness in v1.
5. **Mechanical and semantic halves stay disjoint.** The new dimension covers **semantic
   content disciplines** only; the existing `### Pending-migration detection` structural
   conditions + their procedures are **untouched** and must not be double-flagged. The
   manifest lists only disciplines whose remediation needs PM-authored content, never the
   structural detect-conditions already handled mechanically.
6. **Remediation reuses existing owners + the advocate's question set.** On "fix now" for a
   semantic gap, the orchestrator relays the discipline's foundational question(s) in **one**
   `AskUserQuestion` pass — reusing `### Foundational product questions` in `WORKFLOW.md`
   (the journeys/value disciplines) or the bootstrap threat-model Q-set (the threat-model
   discipline) — then spawns **`pm-architect`** (the owner of `architecture.md`,
   `user-journeys.md`, `threat-model.md`, `product.md`) to author the content from the
   answers. No new authoring agent.

## Scenarios

1. **Version-keyed expectations manifest exists.** A single-source list — `### Expected-discipline manifest` in
   `MIGRATIONS.md` (sibling to `### Pending-migration detection`) — enumerates, per template
   version, the **semantic disciplines** that version introduced which may need PM-authored
   content (e.g. populated threat-model lifecycle, foundational user-journeys, value-first
   product story). Each entry carries: which version introduced it, an **applicability test**
   (when it applies to a project), a **satisfied-check** (presence-based), and a **question
   source** for remediation. `pm-auditor` references it **by name**; it is never re-encoded.
2. **`pm-auditor` gains a semantic-discipline-gap dimension.** For each manifest discipline
   that **applies** to the project and is **not satisfied**, the auditor emits a finding
   (severity per discipline — note by default, escalate to blocking on the same
   two-consecutive-audits rule as other doc-currency notes). Applicable-and-satisfied, or
   not-applicable, → **silent** (no finding).
3. **Presence-only, no prose-policing.** The satisfied-check tests for the discipline's
   required structure/content (filled vs `<placeholder>` / skeletal), never the quality of
   the prose. A populated-but-"weak" threat-model is **not** a finding (the PM owns meaning).
4. **`/pm-audit` remediation handles the semantic gap via the existing loop.** The gap is
   walked through like any finding: **fix-now / next-sprint / accept-with-context**. On
   **fix-now**, the orchestrator relays the discipline's foundational questions in one
   `AskUserQuestion` pass and spawns `pm-architect` to author the content from the answers.
   On **accept-with-context**, it is recorded in `.ai-pm/backlog.md` and not re-raised — the
   conscious-defer escape hatch.
5. **Run `/pm-audit` after a template bump.** `WORKFLOW.md` § Maintenance gains a step: after
   `git submodule update --remote .ai-pm/tooling`, run `/pm-audit` so the disciplines the new
   version introduced surface (the same sweep that already runs the mechanical
   pending-migration detection now also runs the semantic dimension).
6. **Idempotent + proportional.** Re-running `/pm-audit` on a project that already satisfies
   the applicable disciplines surfaces **zero** semantic-gap findings; a non-applicable
   discipline never fires. No re-nagging of adequate docs.
7. **Subsumes "product story fell behind."** The epic's proposed soft note ("N substrate
   features shipped while journeys are skeletal") is realized as the **journeys** manifest
   entry (applicability: ≥1 user-facing feature exists; satisfied-check: a foundational
   journey is present) — not a separate one-off check.

## Existing behaviors this feature touches

(what must not break)

- **`/pm-audit` finding loop** (auto-scope, per-finding fix-now/next-sprint/accept-with-
  context, remediation in priority order) — unchanged; gains one finding type + one
  remediation type.
- **`pm-auditor`'s existing 5 dimensions** — unchanged; gains one dimension. The
  human-role-subject extraction (dimension 1) is reused for the journeys-discipline
  applicability test, not duplicated.
- **`MIGRATIONS.md` `### Pending-migration detection`** + its per-version procedures —
  untouched; the new manifest is a **sibling** section, disjoint from the structural
  conditions.
- **`pm-architect`'s ownership** (architecture.md / user-journeys.md / threat-model.md /
  product.md) — unchanged; audit-driven discipline-fill is one more trigger for its existing
  authoring, via the existing audit remediation handoff.
- **`### Foundational product questions` in `WORKFLOW.md`** + the bootstrap threat-model
  Q-set — **referenced** as remediation question sources, not modified.
- **`WORKFLOW.md` § Maintenance** bump flow — gains a "then run `/pm-audit`" step; the
  mechanical migration run is unchanged.
- **`accept-with-context` → `.ai-pm/backlog.md`** — unchanged; it is the escape hatch, reused.
- **`tests/hooks.sh`** — stays green; no hook added, `.claude/settings.json` untouched.
- **Application-agnostic constraint** — manifest disciplines + their checks use cross-domain
  language; no project-specific example baked in.

## Contracts

(protocol-internal — this repo has no user-facing Product Contracts, the documented exception)

- **Expectations manifest** — `### Expected-discipline manifest` in `MIGRATIONS.md`,
  single-source, referenced by name by `pm-auditor`. **Encoding (arch note §1): a
  `####`-per-discipline subsection** (not a uniform table — the satisfied-checks need prose
  room for false-positive guards, like the `### Pending-migration detection` entries). Per
  discipline: `Introduced in: vX.Y` (use `[?]` for any version not confirmable from
  `CHANGELOG.md`, never a guess), `applicability test`, `satisfied-check` phrased as a
  **positive-presence-of-a-gap** test (structure absent / `<placeholder>` / skeletal — never a
  quality judgment), `question source` (by-name reference to `### Foundational product
  questions` or the bootstrap threat-model Q-set). Seed with three real disciplines: populated
  threat-model lifecycle, foundational user-journeys (the epic's "product story fell behind"
  generalization), value-first product story. Drop-in shape in
  `.ai-pm/arch/doc-migration-on-template-bump_arch.md` §1; disjoint from
  `### Pending-migration detection`.
- **`pm-auditor` semantic-discipline-gap check** — placed as a **sub-check inside dimension 5
  (Docs currency)**, not a sixth dimension (arch note §3): it is the same presence-based,
  applicability-gated, note-vs-blocking, spawn-`pm-architect` shape, and inherits the
  two-consecutive-audits→blocking escalation and the full-scope / skip-in-diff binding for
  free. Input: project docs + the manifest; output: a finding per applicable-and-unsatisfied
  discipline.
- **`/pm-audit` remediation type** — semantic-discipline gap as **remediation entry #7** in
  `pm-audit.md` (arch note §4): on fix-now the **orchestrator relays directly** the
  discipline's foundational questions (one `AskUserQuestion`, by-name question source) →
  spawns `pm-architect` to author from the answers. **No `pm-product-advocate` spawn** — the
  gap is already identified and the question source is a fixed named list, so there is nothing
  for the advocate to discover. `accept-with-context` is the escape-hatch.

## Stack expectations touched

None. No new agent file, no frontmatter structure change, no library, hook, schema, or
external artefact — the change is prose in `MIGRATIONS.md`, `pm-auditor.md`, `pm-audit.md`,
`WORKFLOW.md`, and `doc/architecture.md`. No `docs/stack-notes.md` component is touched, so no
stack-spec test applies. (The `Markdown frontmatter` component is untouched — no agent
frontmatter changes.)

## Interaction scenarios

Protocol-spec / agent-prompt change — **no runtime, no shared mutable state, no concurrency**.
Relevant interactions are with adjacent **protocol mechanisms** sharing the audit sweep:

- When `/pm-audit` runs and a discipline is both a structural `### Pending-migration
  detection` condition AND in the new manifest: it must **not** be double-flagged — the
  manifest carries only semantic disciplines, disjoint from the structural conditions
  (verify no overlap when authoring the manifest).
- When a discipline is **not applicable** (non-security project + threat-model discipline; no
  user-facing features + journeys discipline): the dimension is silent — no finding.
- When a discipline is **already satisfied**: silent — no finding (idempotence).
- When the PM picks **accept-with-context** on a semantic gap: it lands in
  `.ai-pm/backlog.md` and is not re-raised next audit (reusing the existing accepted-item
  suppression).
- When `/pm-audit` runs in **`diff` scope** vs **`full` scope**: the semantic dimension
  behaves like the other doc-currency dimensions (it is a project-state check, so it belongs
  to `full`; in `diff` it may be skipped — settle the scope binding in the arch review /
  implementation, consistent with how dimension 5 doc-currency is scoped).

## Test plan

- **Existing tests that must pass:** `tests/hooks.sh` (green) — unaffected by a prose change
  with no hook; run to confirm.
- **New executable tests:** none — repo "no automated tests by design" constraint
  (`doc/architecture.md` § Architectural constraints); validation by use + editorial review
  (the `pm-product-advocate` / `legacy-reader-role-split` precedent).
- **Editorial verification** (`pm-plan-checker` + `code-review` against this plan), confirming:
  - the manifest is a **single source** in `MIGRATIONS.md`, referenced by name by
    `pm-auditor`, never re-encoded (grep the discipline names appear in one home);
  - the manifest lists **only semantic content disciplines**, disjoint from the structural
    `### Pending-migration detection` conditions (no double-flag);
  - the dimension is **presence-only** (no prose-policing) and **proportional** (applicable +
    unsatisfied only; satisfied/not-applicable → silent);
  - remediation reuses the existing audit loop (fix-now/next-sprint/accept-with-context) and
    spawns `pm-architect` with the discipline's foundational questions relayed in **one**
    `AskUserQuestion` pass — no new agent, no new command;
  - `WORKFLOW.md` § Maintenance instructs running `/pm-audit` after a bump;
  - **idempotence**: the plan asserts a re-run on a satisfied project yields zero semantic
    findings (verified editorially against the satisfied-check logic);
  - no `.claude/settings.json` change, no `MIGRATIONS.md ### Pending-migration detection`
    change.
- **Mandatory-table classification:** protocol/agent-prompt change, no Product Contract, no
  executable tests; scenario coverage verified editorially.

## Docs to update

- `MIGRATIONS.md` — add the new single-source **expectations manifest** section (sibling to
  `### Pending-migration detection`), enumerating the semantic disciplines per version with
  applicability test + satisfied-check + question source. *Implemented by `pm-coder`.*
- `.claude/agents/pm-auditor.md` — add the semantic-discipline-gap **dimension** (references
  the manifest by name; presence-only; applicable+unsatisfied → finding; reuses the
  human-role-subject extraction for the journeys applicability test). *Implemented by
  `pm-coder`.*
- `.claude/commands/pm-audit.md` — add the **remediation type** for a semantic-discipline gap
  (relay the discipline's foundational questions in one `AskUserQuestion` → spawn
  `pm-architect` to author), in the existing remediation list. *Implemented by `pm-coder`.*
- `WORKFLOW.md` — § Maintenance: after the submodule bump, **run `/pm-audit`** (now
  semantic-upgrade-aware); a one-line pointer that the audit sweep now also surfaces
  disciplines a new version introduced. *Implemented by `pm-coder`.*
- `doc/architecture.md` — record the architectural decision: semantic doc-migration on
  template bump realized as a `pm-auditor` dimension keyed on a `MIGRATIONS.md` expectations
  manifest, reusing the `/pm-audit` loop + `accept-with-context` escape hatch; framed as the
  semantic complement to the mechanical `### Pending-migration detection`, and as the
  generalization of the epic's "product story fell behind" note. Owner: `pm-architect` —
  spawned post-coding (standard handoff).
- `README.md` — consider a one-line capability mention (template bumps now surface, with the
  PM, the documentation disciplines a new version introduced). Keep it one line.

## Out of scope

- **A new `/pm-migrate-docs` command or a new agent** — rejected (PM decision: extend
  `/pm-audit`); the protocol resists new surfaces and the audit loop already owns this.
- **The mechanical structural migrations** — `### Pending-migration detection` + its
  procedures already exist and are unchanged; this feature is the **semantic** complement.
- **A committed "last-migrated-to version" state file** (the `.copier-answers.yml` analogue)
  — deferred; v1 gets proportionality/idempotence from the applicability + satisfied-check.
  Revisit only if re-deriving every audit proves costly.
- **Auto-apply without PM** — every semantic fill goes through the PM (fix-now answers /
  accept-with-context); the discipline content is product knowledge, never auto-authored.
- **Cross-document consistency auditor** (epic item — single-source drift, temporal-status
  conflation, etc.) — related ("analyze docs, find gaps") but a different gap class
  (cross-doc linkage vs missing-discipline-content); separate feature.
- **`bootstrap-populated-journeys`** (parked) — complementary (it drafts journeys at
  bootstrap; this surfaces the journeys-discipline gap on upgrade); sequence, don't merge.
- **Sibling elements of the categorical choice:** the feature covers the **semantic
  migration** kind; the sibling **mechanical/structural migration** kind already exists
  (`### Pending-migration detection`) and is out of scope here.
