# workflow-extract-to-refs — plan

> **SUPERSEDED 2026-06-05 by `workflow-progressive-disclosure_plan.md`.** This examples-only companion was a band-aid; the PM reframed the problem as the eager-`@`-load architecture, and this extraction became one slice of the broader decomposition (the `examples` topic file). Kept for the record; not implemented as a standalone feature.

Source: PM-directed 2026-06-05 — "уменьшить WORKFLOW.md … с выносом в refs" (approach B, chosen via the planning scoping question). Follow-up housekeeping on the canonical orchestration spec, which has grown to 564 lines and is loaded by every agent + every downstream `CLAUDE.md` via `@.ai-pm/tooling/WORKFLOW.md`.

*Slim `WORKFLOW.md` by **relocating its purely-illustrative content** — the `## How to talk to the PM` ✓/✗ example pairs and ASCII diagram, the Blast-radius-preflight Matter worked example, and the Step A.5 probe-proposal template — into a new illustrative companion `WORKFLOW-examples.md` (a root-level sibling, the same shape as `MIGRATIONS.md`), leaving in `WORKFLOW.md` every **rule, gate, named anchor, and single-source statement** plus a one-line pointer at each section the examples left. A secondary, bounded **lossless prose-tightening** pass on the most verbose rule paragraphs deepens the reduction without removing any rule, anchor, gate, or deliberate single-source redundancy. **No rule changes — content is relocated or compressed, never dropped in meaning.***

Meta-feature on the template repo: **software-kind**, non-user-facing (subjects = `WORKFLOW.md` / the new companion file / the agents that read them / the File-layout doc). No Product Contract, no advocate gate, no `## Validation` gate. Verification = editorial + clean-grep of the anchor inventory; `tests/hooks.sh` stays green (no hook touched).

## Scenarios

1. **Illustrative blocks move to a new companion `WORKFLOW-examples.md`.** A new root-level file `WORKFLOW-examples.md` is created (sibling to `MIGRATIONS.md`), opening with a banner: *"Illustrative companion to `WORKFLOW.md` — worked examples, message templates, and diagrams the canonical spec points to. `WORKFLOW.md` holds the rules; this file holds the examples. When the two disagree, `WORKFLOW.md` wins."* It receives, verbatim (content unchanged, only relocated), exactly this set:
   - **From `## How to talk to the PM`** — the multi-line ✓/✗ example pairs under *Lead with user impact*, *Explain decisions as trade-offs*, *Ask one question at a time*, *No jargon*, *Report problems without panic*; and the ASCII diagram under *Draw a diagram*.
   - **From `## When you say it doesn't work in production` → Blast-radius preflight** — the *"The worked example is a Wiren Board Matter bridge…"* worked-example paragraph.
   - **From Step A.5** — the probe-proposal blockquote template (Problem / My hypothesis / Probe / What we'll watch / After / Authorize this probe?).
   It ships downstream automatically inside the `.ai-pm/tooling/` submodule (no downstream-owned copy exists), so it needs **no** migration.

2. **Every rule, gate, and named anchor stays in `WORKFLOW.md`, each emptied spot gains a pointer.** In `## How to talk to the PM` every **bold rule label + its one-line normative statement** is kept (Language canon, Lead with user impact, Explain decisions as trade-offs, Ask one question at a time, Surface substantive decisions via AskUserQuestion, Autonomous-mode rider, Draw a diagram, Never show code, Write blank-line-correct markdown, No jargon, "Want to go deeper?", Report problems without panic) — only the multi-line examples leave, each rule keeping a terse inline pointer (e.g. *"(examples: `WORKFLOW-examples.md`)"*). The Blast-radius preflight keeps its full rule + bullet list and gains a *"(worked example: `WORKFLOW-examples.md`)"* pointer; Step A.5 keeps its rules and gains a pointer to the probe template. **No `###` subsection, named rule, gate, step label, or single-source statement is moved, renamed, or weakened.**

3. **Bounded lossless prose-tightening (secondary lever).** The most verbose rule paragraphs may be compressed for density **only** where it removes redundancy of *wording*, never of *meaning*: no rule deleted, no `###` anchor touched, no gate removed, and the **deliberate single-source repetition of invariants** (e.g. "merge/ship stays manual in BOTH scopes", the "references this subsection by name … never re-encode the default" clauses) is **preserved intact** — that repetition is load-bearing by design, not accidental bloat. If a paragraph cannot be tightened without risking a dropped clause, it is left as-is. This lever is conservative by construction; the anchor inventory (Test plan) is the objective floor it must clear.

4. **`doc/architecture.md` File layout lists the new file.** The `## File layout` module-map table gains a `WORKFLOW-examples.md` row (A4 cross-check: File layout ↔ `git ls-tree`). The existing `WORKFLOW.md` row description is unchanged. `pm-architect` (owner of `doc/architecture.md`) makes this edit on the post-coding Docs-to-update handoff.

5. **Additive, ships downstream via the submodule, no migration.** Downstream projects consume `WORKFLOW.md` through `@.ai-pm/tooling/WORKFLOW.md` and own no copy of it; the companion lives in the same submodule, delivered by the next `git submodule update --remote`. No downstream-owned artifact changes, so there is **no** `MIGRATIONS.md` pending-migration entry and no template structural migration.

## Existing behaviors this feature touches

(what must not break)

- **Every by-name reference into `WORKFLOW.md` from agents / commands / `MIGRATIONS.md` / templates.** Confirmed live references that MUST keep resolving: the `###` subsections (`### Project kind`, `### Decision authority`, `### Review typology`, `### Security-relevant surfaces`, `### Foundational product questions`, `### Threat-model lifecycle`); the named rules/sections (`Edit-ownership rule` + its two carve-outs, `remote-system boundary`, `Hook-level enforcement` §, `language canon`, **PM communication rules** = the `## How to talk to the PM` section, `Blast-radius preflight`, `Maintenance`); the step labels (`Step 0`, `Step 3.5`, `Step 5`, `Step 5.5`, `Step 6`, `Step 7`, `Step A`, `Step A.5`, `Step B`/`C`/`D`). The extraction keeps all of these — only example bodies move.
- **The orchestrator's PM-communication discipline at runtime.** The *rules* (bold labels + one-line statements) stay in the auto-loaded `WORKFLOW.md`; only the reinforcing examples become reference-on-demand in the companion. Honest tradeoff the PM accepted by choosing "вынос в refs": examples are no longer auto-loaded, but every normative rule still is.
- **`tests/hooks.sh` (17 hook tests).** No hook regex or `.claude/settings.json` is touched; tests stay green. The one WORKFLOW.md mention in `tests/hooks.sh` is a comment ("Step 7"), not a content assertion — unaffected.
- **A4 File-layout ↔ tree cross-check.** Adding the new root file makes the module map diverge until updated — Scenario 4 keeps them in sync (the divergence is fixed before `pm-architect` writes, per A4).
- **The `WORKFLOW.md` top banner** ("canonical orchestration spec … When the two documents disagree, this one wins") — unchanged; the companion's banner mirrors it, deferring to `WORKFLOW.md`.

## Contracts

None. A documentation restructure (relocate illustrative prose + conservative compression) + a new illustrative companion file. No API, data shape, schema, or downstream-consumed runtime artifact.

## Interaction scenarios

Provably isolated: a Markdown content move between two files in the same submodule + a one-row table edit in `doc/architecture.md`. No runtime, no shared mutable state, no concurrency, no I/O, no adjacent-feature state. The only coupling — the by-name references into `WORKFLOW.md` and the A4 File-layout pairing — is covered by Scenarios 2 & 4 and the anchor-inventory clean-grep.

## Test plan

*Repo discipline: no automated tests by design — verification is editorial + clean-grep, the same as every prior meta-feature; `tests/hooks.sh` stays green (no hook touched).*

- Existing tests that must pass: `tests/hooks.sh` (17/17 — unchanged).
- New tests: none (prose/structure change). Verification instead:
  - **Anchor-inventory clean-grep (the objective floor).** Every anchor in "Existing behaviors this feature touches" still grep-resolves in `WORKFLOW.md` after the change — each `### ` subsection heading, each named rule/section label, each step label. A single missing anchor is a blocking finding.
  - **Relocation-completeness check.** Each moved block (the enumerated ✓/✗ pairs, the ASCII diagram, the Matter worked-example paragraph, the probe-proposal template) is present in `WORKFLOW-examples.md` and absent from `WORKFLOW.md`; each emptied spot in `WORKFLOW.md` carries a pointer to the companion. Content of each moved block is byte-identical to what left (relocation, not rewrite).
  - **Rule-preservation check (How to talk to the PM).** Every bold rule label + its one-line statement is still present inline in `WORKFLOW.md`; only example bodies left.
  - **Single-source-redundancy check.** The deliberately-repeated invariants are still present at each site (spot-check: "merge/ship stays manual in BOTH scopes" appears in `### Decision authority` and the autonomous riders; the "references … by name … never re-encode the default" clauses are intact in `### Project kind` / `### Decision authority` / `### Review typology`).
  - **Editorial walkthrough.** `WORKFLOW.md` reads coherently end-to-end after extraction + tightening; pointers land naturally; no dangling reference to a moved example; the companion banner defers to `WORKFLOW.md`.
  - **A4 cross-check.** `doc/architecture.md` `## File layout` lists `WORKFLOW-examples.md`; the table still matches `git ls-tree -r --name-only HEAD`.
  - **No-migration check.** No `MIGRATIONS.md` entry added, no template structural-migration trigger introduced (downstream owns no copy of `WORKFLOW.md`).
- Interaction scenario tests: none (provably isolated).
- Stack-spec tests: none (no stack component touched).

## Docs to update

- `WORKFLOW.md` — **the deliverable**: remove the enumerated illustrative blocks (Scenario 1), keep every rule/gate/anchor + add per-section pointers (Scenario 2), apply the bounded lossless tightening (Scenario 3). Authored by `pm-coder` (in the template repo `WORKFLOW.md` is source, not consumed `.ai-pm/tooling` canon — the downstream edit-ownership prohibition does not apply to the template's own copy).
- `WORKFLOW-examples.md` — **new file**, the illustrative companion (Scenario 1). Authored by `pm-coder`.
- `doc/architecture.md` `## File layout` — add the `WORKFLOW-examples.md` row (Scenario 4). Owned by `pm-architect`; spawned on the post-coding Docs-to-update handoff.
- *(No `MIGRATIONS.md` change — additive, no downstream-owned copy, no migration — Scenario 5.)*
- *(No `CLAUDE.md` Pipeline change — no stack component or validator touched.)*

## Out of scope

- **Removing, renaming, or weakening any rule, gate, `###` subsection, named anchor, step label, or single-source statement** — explicitly forbidden; only example bodies relocate and only wording (never meaning) compresses. This is the lossless-meaning constraint that keeps the change from drifting into the rejected "aggressive content cut" (option C).
- **Auto-loading the companion** — `WORKFLOW-examples.md` is reference-on-demand (pointed to from `WORKFLOW.md`), not added to any `@`-import; the rules stay in the auto-loaded `WORKFLOW.md`.
- **Touching `tests/hooks.sh` or `.claude/settings.json`** — no hook changes; this is purely a doc restructure.
- **Splitting `WORKFLOW.md` into multiple rule files / extracting rules** — only *illustrative* material leaves; the rules stay in one canonical spec. A deeper structural split is a separate, larger decision the PM has not asked for.
- **The README-currency gap** the PM raised in the same conversation — recorded separately in `.ai-pm/backlog.md`; it is a distinct protocol-gap item, not part of this restructure.
