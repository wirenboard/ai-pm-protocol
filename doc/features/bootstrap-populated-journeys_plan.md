# bootstrap-populated-journeys — plan

*(the "user" of the protocol is the orchestrator / agents; the human in the loop is the PM)*

> **STATUS: PARKED (2026-06-04).** Drafted, then deliberately sequenced **after**
> `legacy-reader-role-split` (PM decision 2026-06-04). This draft was written **before** that
> rename/ownership move, so it still names the pre-rename `pm-legacy-reader` and the pre-
> consolidation journeys ownership. **It will be revised before implementation** to point journeys
> authoring at `pm-architect` and use the `pm-codebase-reader` name. Committed for history (not yet
> a live task) — do not implement as-is.

## Context

Fast-follow to `pm-product-advocate` (v2.15.0) and the second half of the EPIC
"technical-over-product bias" item **"Bootstrap product/journey asymmetry"**
(`.ai-pm/backlog.md`). The asymmetry: `/pm-bootstrap` already drafts a **populated**
`docs/architecture.md` and — on security projects — a **populated** `docs/threat-model.md`
(both authored by `pm-architect` from the PM's bootstrap answers), but leaves
`docs/user-journeys.md` a **skeleton** in every mode. Yet the foundational journeys
(zero-to-working: discovery / onboarding / invite / recovery & key-loss / device-change)
are **product decisions knowable at bootstrap**, not implementation detail.

The just-shipped advocate already closed the first half: its **bootstrap foundational-question
pass** (`pm-bootstrap.md` § "Foundational-question pass") now *forces* those zero-to-working
questions and records the PM's answers in `.ai-pm/reviews/bootstrap_advocate.md` `## Resolutions`.
That section ends with the explicit deferral this feature delivers:

> "This pass forces the **questions** only. It does **not** auto-draft a populated
> `docs/user-journeys.md` from the answers — that is a separate deferred feature; keep it out
> of scope here."

This feature takes the recorded answers and **drafts the foundational journeys** into
`docs/user-journeys.md` — making the journeys layer symmetric with the threat-model: bootstrap
no longer hands the project a deep architecture/threat-model beside an empty journeys file.

Settled constraints (from the epic + the advocate work, not re-litigated here):

1. **This is the "draft from the answers" half** the advocate plan explicitly deferred
   (`doc/features/pm-product-advocate_plan.md` Out of scope item 1).
2. **Human-language journey steps, move-not-copy on identifiers.** Journey steps stay plain
   human language; machine identifiers (status enums, topic/ID grammars, QoS, retention) are
   **not restated** in the steps — they live in `docs/architecture.md` `## Behavioral contract
   (taxonomies & invariants)` and are *referenced*. This is the existing journeys-format rule
   already encoded in `user-journeys.md.tmpl` (steps 13, 24-27); the draft must obey it.
3. **Proportional — foundational journeys only.** Draft only the journeys knowable at bootstrap
   (the zero-to-working story). Speculative per-feature journeys are **not** drafted here — they
   are still pulled per user-facing feature, unchanged.

## Key design decisions

(settled; recorded so the coder/reviewer do not re-litigate — except the one flagged for the
arch review)

1. **Symmetry with the threat-model precedent.** The threat-model is the exact template: a
   populated doc authored at bootstrap from the PM's recorded answers, conditional, finalized by
   the same owner that authors `architecture.md` / `product.md`. The foundational journeys are
   its journeys-layer twin — same shape, same owner-at-bootstrap, same "draft populated, mark
   un-fillable gaps `[?]`" discipline.
2. **Source of the draft = the resolved `bootstrap_advocate.md` answers** (the foundational-
   question pass output), plus `docs/product.md` and `docs/architecture.md`. The journeys are
   drafted *after* the foundational-question pass resolves (the answers must exist first).
3. **Bootstrap author = `pm-architect`** (RECOMMENDED — to confirm in the arch review). It is
   already the bootstrap "author populated docs from the PM's answers" agent (product.md +
   threat-model), already spawned with the PM's answers, and already the doc that holds the
   referenced `## Behavioral contract` identifiers. Drafting journeys there keeps all bootstrap
   populated-doc authoring under one owner and avoids stretching `pm-legacy-reader` (a
   code-reading agent) into authoring-from-PM-answers on a greenfield project with no code.
   **Open for the arch review:** the ongoing per-feature `docs/user-journeys.md` updates are
   `pm-legacy-reader`'s (the gap-fill / `/pm-plan` "Docs to update" owner). A bootstrap-author
   (`pm-architect`) ≠ ongoing-updater (`pm-legacy-reader`) split is a potential two-writer drift
   hazard — the arch note resolves whether to (a) accept the split (bootstrap-draft vs
   per-feature-update are distinct lifecycle phases, like architecture.md's bootstrap-draft by
   architect vs nothing-else-writes-it), or (b) consolidate journeys ownership.
4. **Applies to all three bootstrap modes** (the full set — see categorical note):
   - **Greenfield / legacy-shallow** — journeys drafted from the foundational-question answers
     (there is no code, or only shallow signal, so the PM answers are the source).
   - **Legacy-full** — `pm-legacy-reader` already drafts journeys *from code*; `pm-architect`
     **enriches/finalizes** those with the foundational-question answers in the same finalize
     spawn it already does for the architecture/threat-model drafts — **augment, never
     overwrite** the code-derived journeys.
5. **Conditionality.** Foundational journeys are drafted whenever the foundational-question pass
   ran (i.e. always, post-advocate) and produced answers. Where the PM descoped a foundational
   question, that journey is **not** invented — it is left as a `[?]` placeholder or omitted with
   a one-line note, mirroring the threat-model `[?]`-for-ungiven-answers discipline. Never
   confabulate a journey the PM did not describe (the advocate's presence-not-quality sibling
   rule).
6. **No new agent, no hook.** Reuses `pm-architect`; the change is command + agent-prompt prose
   (`pm-bootstrap.md`, `pm-architect.md`) + the flipped deferral note. Consistent with the
   advocate's soft-enforcement family.

## Scenarios

*(scenario subjects are the bootstrap process / `pm-architect` / the docs — non-human; this is a
protocol-mechanism change, exempt from the product-readiness gate by the human-role-subject
extraction, same as the `pm-product-advocate` feature itself)*

1. **Greenfield bootstrap ends with populated foundational journeys.** After the
   foundational-question pass resolves, `/pm-bootstrap` drafts `docs/user-journeys.md` with the
   foundational zero-to-working journeys (onboarding / discovery / invite / recovery / device-
   change as applicable to the product), authored from the recorded `bootstrap_advocate.md`
   answers — not left a skeleton.
2. **Legacy-full bootstrap enriches, never overwrites.** Where `pm-legacy-reader` already
   drafted journeys from code, `pm-architect` augments them with the foundational-question
   answers in its finalize spawn; existing code-derived journeys are preserved.
3. **Human-language, move-not-copy.** Drafted journey steps are plain human language; no machine
   identifier is restated in a step — any taxonomy/format invariant is referenced to
   `docs/architecture.md` `## Behavioral contract`, per `user-journeys.md.tmpl`.
4. **Descoped / unanswered foundational questions are not confabulated.** A foundational question
   the PM descoped or did not answer yields a `[?]` placeholder (or a one-line "deferred by PM"
   note), never an invented journey — the threat-model `[?]` discipline.
5. **Proportional.** Only foundational journeys are drafted; no speculative per-feature journey is
   created at bootstrap. Per-feature journeys continue to be pulled per user-facing feature,
   unchanged.
6. **The deferral note is flipped.** `pm-bootstrap.md` § "Foundational-question pass" no longer
   says "does NOT auto-draft user-journeys.md (deferred feature)"; it now drafts them (this
   feature) and the deferral text is removed.

## Existing behaviors this feature touches

(what must not break)

- **The foundational-question pass** (`pm-bootstrap.md`, shipped in v2.15.0) — unchanged in its
  question-forcing behavior; this feature consumes its recorded answers as the draft source. The
  `bootstrap_advocate.md` artifact + `## Resolutions` trail format is unchanged.
- **`pm-architect`'s existing bootstrap authoring** (architecture.md, product.md, threat-model)
  — unchanged; journeys authoring is added alongside, not in place of.
- **`pm-legacy-reader`'s code-derived journeys** (legacy-full) — must be preserved and enriched,
  never overwritten.
- **Per-feature journey pulling** — a user-facing feature still gets its journey drafted/updated
  per `/pm-plan` "Docs to update" via `pm-legacy-reader`; this feature does not touch that path.
- **`user-journeys.md.tmpl`** — stays the format the draft follows (human-language steps,
  identifiers referenced not restated); not rewritten.
- **The three bootstrap modes' existing steps** — greenfield / legacy-shallow / legacy-full flows
  are unchanged except for the added journeys-draft step.
- **`tests/hooks.sh`** — stays green; no hook added.
- **Application-agnostic constraint** — journey examples/vocabulary stay cross-domain.

## Contracts

(protocol-internal — this repo has no user-facing Product Contracts, the documented exception)

- **Bootstrap journeys-draft step.** Input: the resolved `bootstrap_advocate.md` foundational-
  question answers + `docs/product.md` + `docs/architecture.md`. Output: a populated
  `docs/user-journeys.md` (foundational journeys only, human-language, identifiers referenced),
  authored by `pm-architect`; un-answered/descoped questions → `[?]` / omission, never invented.
- **`pm-architect.md` responsibility extension.** `pm-architect` gains "draft the foundational
  user-journeys from the foundational-question answers at bootstrap" as a bootstrap
  responsibility, parallel to its existing threat-model drafting (conditional, populated, `[?]`
  for gaps, finalize-not-overwrite on legacy drafts).

## Stack expectations touched

None. No new agent file, no frontmatter change, no library, hook, schema, or external artefact —
the change is command prose (`pm-bootstrap.md`), agent-prompt prose (`pm-architect.md`), and a
WORKFLOW.md note. No `docs/stack-notes.md` component is touched, so no stack-spec test applies.
(The `Markdown frontmatter` component is **not** touched — `pm-architect.md`'s frontmatter is
unchanged; only its body/instructions are extended.)

## Interaction scenarios

Protocol-spec / agent-prompt change — **no runtime, no shared mutable state, no concurrency**.
The relevant interactions are with adjacent **bootstrap mechanisms**:

- When the foundational-question pass returns `clean` (zero gaps — the PM's product.md/
  architecture.md already answered every foundational question): journeys are still drafted from
  those already-recorded answers (a `clean` verdict means *answered*, not *absent*) — verify the
  draft step reads the answers wherever they landed (product.md / architecture.md / the
  resolutions), not only from a `gaps`-style trail.
- When a foundational question was **descoped** in the pass: the corresponding journey is `[?]` /
  omitted, not invented (scenario 4).
- When bootstrap is **legacy-full** and `pm-legacy-reader` already wrote journeys: the
  `pm-architect` enrich step augments, the diff preserves the code-derived journeys (scenario 2).
- When a later **user-facing feature** is planned: its per-feature journey is pulled by
  `pm-legacy-reader` as today — the bootstrap-draft does not pre-empt or block it.

## Test plan

- **Existing tests that must pass:** `tests/hooks.sh` (green) — unaffected by a prose change with
  no new hook; run to confirm.
- **New executable tests:** none — repo "no automated tests by design" constraint
  (`doc/architecture.md` § Architectural constraints); validation is by use + editorial review,
  the `pm-product-advocate` / `review-stamp-gate` precedent.
- **Editorial verification** (`pm-plan-checker` + `code-review` read the diff against this plan),
  confirming:
  - the foundational-question pass deferral note is **flipped** (no lingering "does NOT
    auto-draft user-journeys.md" text), and the new draft step is wired into **all three**
    bootstrap modes;
  - the draft is sourced from the recorded foundational-question answers and authored by
    `pm-architect` (symmetry with threat-model), with the ongoing-ownership split resolved per
    the arch note;
  - legacy-full **enriches, never overwrites** the code-derived journeys;
  - un-answered/descoped questions become `[?]` / omission, never invented journeys;
  - drafted steps are human-language with identifiers referenced (move-not-copy), per
    `user-journeys.md.tmpl`;
  - only foundational journeys are drafted (no speculative per-feature journeys);
  - no new agent, no hook (`.claude/settings.json` unchanged).
- **Mandatory-table classification:** protocol/agent-prompt change, no Product Contract, no
  executable tests; scenario coverage verified editorially.

## Docs to update

- `.claude/commands/pm-bootstrap.md` — the primary change: (a) **flip** the § "Foundational-
  question pass" deferral note into the journeys-draft behavior; (b) add the journeys-draft step
  after the foundational-question pass resolves in **greenfield**, **legacy-shallow**, and
  **legacy-full** modes (legacy-full = enrich via the `pm-architect` finalize spawn); (c) update
  the "What's left open" / skeleton wording (greenfield § currently says "`docs/user-journeys.md`
  is a skeleton; user scenarios will be filled in as features are planned" — change to reflect
  that the foundational journeys are now drafted, with per-feature journeys still pulled later).
  *Implemented by `pm-coder`.*
- `.claude/agents/pm-architect.md` — extend its bootstrap responsibilities with foundational
  user-journeys authoring (parallel to threat-model drafting: populated, `[?]` for gaps,
  finalize-not-overwrite on legacy drafts, human-language + identifiers-referenced). *Implemented
  by `pm-coder`.*
- `WORKFLOW.md` — note in the journeys/bootstrap area (and/or the roster) that `/pm-bootstrap`
  now drafts populated foundational journeys (symmetric with the threat-model lifecycle), and
  record the bootstrap-author vs per-feature-updater ownership per the arch note. *Implemented by
  `pm-coder`.*
- `doc/architecture.md` — add the architectural decision: bootstrap drafts populated foundational
  user-journeys from the foundational-question answers, authored by `pm-architect`, symmetric with
  the threat-model lifecycle; member of the bootstrap populated-doc-authoring family. Owner:
  `pm-architect` — spawned post-coding (standard handoff).
- `README.md` — consider a one-line capability mention (bootstrap now drafts the foundational
  journeys, not just a skeleton). Dogfoods the README-currency backlog item; keep it one line.

## Out of scope

- **Speculative per-feature journeys at bootstrap** — only foundational (zero-to-working)
  journeys are drafted; per-feature journeys are still pulled per user-facing feature (the
  proportionality constraint).
- **Changing the per-feature journey-update path** (`/pm-plan` "Docs to update" →
  `pm-legacy-reader`) — unchanged.
- **Rewriting `user-journeys.md.tmpl`** — the template stays the format the draft follows.
- **The other epic items** — product-lag `pm-auditor` note, cross-document consistency auditor,
  and the `automode` idea — separate features.
- **Sibling elements of categorical choices:**
  - **Bootstrap modes** — the plan covers the **full set** (greenfield, legacy-shallow,
    legacy-full); none excluded.
  - **Journey kinds** — the plan focuses on **foundational** journeys; the sibling
    **per-feature journeys** is excluded (drafted per user-facing feature later, not at
    bootstrap) — PM specified foundational-only in the feature request.
