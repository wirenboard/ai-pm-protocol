# architecture-doc-coherence — design notes

## Context

The plan batches three own-repo doc findings (#2/#3/#5). The PM wants the central
structural question settled **before the coder runs**: the agent prose (`pm-architect.md`
A4, `pm-bootstrap.md:120`) cross-checks / lists sections — *File layout, Integration
contract, Release flow* and the names *Architectural decisions / Architectural
constraints* — that the actual template `doc/_templates/architecture.md.tmpl` does **not**
contain (template has: External standards, Tech stack, **Key** decisions, **Constraints**,
Security constraints, Code conventions, Dependencies). Which side is source of truth, and
how does the plan's new "Module map" section relate to the agents' "File layout"
expectation?

This is a protocol-self change (template + agents in this repo), so the structural choice
is "which section-set is canonical and how do the four touched files line up", not where
to put runtime code.

## Git-history finding (decisive)

1. **`architecture.md.tmpl` has exactly one commit**: `eba8ab5 feat: template v2 — full
   rewrite` (2026-05-28). It was *born* in v2 with its current thin section-set. The
   pre-v2 world had a different file, `architecture-conventions.md.tmpl`, which was
   removed in the same commit.

2. **The strings "File layout" and "Release flow" never existed in any `.tmpl` file** in
   the entire repo history (`git log --all -S … -- '*.tmpl'` returns nothing for either).
   "Integration contract" appears in template history only in an unrelated spec template
   (`6e1bf14`), never in the architecture template. → These three sections were **never
   added to the architecture template and then removed**. They were **never there**.

3. **The agent prose acquired them later, independently of the template.** "File layout"
   entered the agents via `fdc6a82 feat(architect): own canonical docs/architecture.md
   (v1.10.0) (#150)` — i.e. when `pm-architect` became the *owner* of the canonical doc,
   its prose grew the richer expectation (cross-check layout against `ls`, release flow
   against CI, integration contract against README) without the template being updated to
   match. The name drift (`Architectural decisions` vs template `Key decisions`,
   `Architectural constraints` vs template `Constraints`) is from the same divergence.

4. **The reference instance proves the rich set is the intended one.** This repo's *own*
   `doc/architecture.md` — authored to this very template by this very protocol — actually
   uses, today, all of: `## Architectural decisions`, `## Architectural constraints`,
   `## File layout` (a coarse `path → one-line purpose` table, cross-checked against `ls` /
   `git ls-tree`), `## Integration contract (template ↔ downstream)`, `## Release flow`.
   The author needed those sections, wrote them, and they carry real content. The template
   is the impoverished side; the agent prose and the lived doc agree.

**Direction of reconciliation: bring the template UP to the agent prose + the lived doc,
not the reverse.** Do not drop File layout / Integration contract / Release flow — A4's
cross-checks against `ls` / `auto-tag.yml` / README catch real architecture drift, the
own-doc relies on all three, and git history shows they were never deliberately retired
(the "don't drop a section A4 relies on unless history shows retirement" guard resolves to:
*keep them, add them to the template*).

## Adjacent implementations (the lived section-set this repo already uses)

1. **This repo's `doc/architecture.md`** — the canonical reference instance. Header set:
   Project, Tech stack, **Architectural decisions**, **Architectural constraints**,
   **File layout** (coarse `path → purpose` table, explicitly cross-checked vs `ls` +
   `git ls-tree`), **Integration contract (template ↔ downstream)**, **Release flow**,
   External standards, Dependencies, Security constraints, Code conventions, Deploy/runtime,
   Database/state, UI guide. This is the de-facto template the agents target.
2. **`doc/_templates/architecture.md.tmpl`** — the nominal template, thinner: External
   standards, Tech stack, Key decisions, Constraints, Security constraints, Code
   conventions, Dependencies. Missing the three sections + uses the bare names.
3. **`.claude/commands/pm-bootstrap.md:120`** — spawn prose that enumerates the sections
   the architect "walks": Tech stack, Architectural decisions, Architectural constraints,
   File layout, Integration contract, Release flow. Matches the lived doc, not the template.
4. **`.claude/agents/pm-auditor.md:104`** — the docs-currency check: "does
   `docs/architecture.md` list the major components visible in the codebase?" This is a
   *components/layout* check with no named anchor — exactly what the Module map / File
   layout section should anchor.

## Behavioral risks in this area

Not event-driven code, but there is a real coherence risk: **three files must stay in lock-
step** (template section-set ↔ architect A2/A4/A5 + bootstrap:120 spawn prose ↔ auditor:104
check). A partial fix that updates the template but not bootstrap:120 (or vice-versa) just
relocates the contradiction. The coder must touch all of {template, pm-architect,
pm-bootstrap, pm-auditor} in one change, or the "phantom section" finding reappears under a
different file.

Second risk: **duplication between the developer-facing module/layout section and the new
authored `docs/product.md` "## Документы"** (PM-facing docs navigation). The plan calls this
out. The two are genuinely different (see decision below) — the coder must word the template
guidance so the module map stays `src/ → responsibility` and never becomes a `docs/` index.

## The Module-map vs File-layout decision (the structural question)

The plan's #2 proposes a coarse **"Module map / Source module layout"** =
`directory/module → one-line responsibility`. The agents already expect **"File layout"**.
Are they one section or two?

- In **this repo's own doc**, `## File layout` already IS a coarse `path → one-line purpose`
  table cross-checked against `ls`/`git ls-tree`. For a docs-only protocol repo, "where
  things are laid out" and "what each module is responsible for" collapse into the same
  table — there is no separate deploy topology.
- In a **typical downstream app**, they can diverge: "File layout" can drift toward
  *deployment/disk topology* (where artefacts land, what's gitignored, where state lives),
  whereas a "Module map" is specifically `src/<module> → responsibility`. The auditor:104
  "major components" check wants the *responsibility* axis, not the disk axis.

**Recommendation: unify into one section, named `## File layout (module map)`, defined as
the coarse `directory/module → one-line responsibility` table — and make *responsibility*
the explicit axis.** Reasons:

- Two near-identical coarse path tables in one doc is the drift trap the plan is trying to
  remove; splitting reintroduces the very "which section does the auditor key on?" ambiguity
  #3 fixes.
- The lived reference doc already merges them, successfully, and the auditor:104 check maps
  cleanly onto that single table.
- A4's cross-check value is preserved: the unified section is still the thing checked against
  `ls` + `git ls-tree`. (Integration contract → README and Release flow → CI stay their own
  sections; only Module-map and File-layout merge.)

Template guidance for the merged section must state, verbatim-ish: *coarse — one row per
directory/top-level module, one-line responsibility; NOT per-function; this is the
developer/agent-facing `src/` structure, distinct from `docs/product.md` "## Документы"
which is PM-facing navigation over `docs/`.*

If the PM prefers to keep the agents' existing word "File layout" untouched, name it exactly
`## File layout` and fold the module-map guidance into it — same single-section outcome, one
fewer rename. Either label works; the load-bearing call is **one section, not two**.

## Recommended corrected template section-set

For `doc/_templates/architecture.md.tmpl`, the canonical ordered set (rename + add):

1. External standards *(keep)*
2. Tech stack *(keep)*
3. **Architectural decisions** *(rename from "Key decisions" — match agents + own-doc)*
4. **Architectural constraints** *(rename from "Constraints" — match agents + own-doc)*
5. **File layout (module map)** *(ADD — coarse `directory/module → responsibility`,
   cross-checked vs `ls`/`git ls-tree`; satisfies auditor:104 and A4)*
6. **Integration contract** *(ADD — how downstream consumes the project; cross-checked vs
   README install; mark `N/A` for projects with no integration surface)*
7. **Release flow** *(ADD — cross-checked vs `auto-tag.yml`/CI; mark `N/A` if no CI release)*
8. Security constraints *(keep)*
9. Code conventions *(keep)*
10. Dependencies *(keep)*

Each ADD section ships with template guidance that names its A4 cross-check source, so the
architect's "diverging description is a self-inflicted finding" rule has a concrete anchor.

## Per-agent prose changes for the coder

- **`doc/_templates/architecture.md.tmpl`** — rename `Key decisions`→`Architectural
  decisions`, `Constraints`→`Architectural constraints`; add the three sections (File layout
  (module map) / Integration contract / Release flow) with coarse guidance + the "distinct
  from product.md ## Документы" note on the module-map section.
- **`.claude/agents/pm-architect.md`** — A4 already names the three cross-checks correctly;
  align the section *name* it uses for the layout check to the template's final name (File
  layout (module map)). A2/A5 ("walk every template section", "do not introduce sections not
  in the template") now hold without phantom-walking, because the template gains the
  sections. No content change to A4's cross-check logic — it was right all along.
- **`.claude/commands/pm-bootstrap.md:120`** — the spawn-prose section list
  (`Tech stack, Architectural decisions, Architectural constraints, File layout, Integration
  contract, Release flow`) becomes literally true once the template is updated; align the
  layout section name to the chosen template label and otherwise leave it.
- **`.claude/agents/pm-auditor.md:104`** — change the docs-currency component check to key on
  the named section: "does the **File layout (module map)** section in `docs/architecture.md`
  list the major modules/components visible in the codebase? Significant component missing →
  note." No new check, just a concrete anchor (closes #3's "manufactured soft requirement").
- **`doc/architecture.md` (own doc, #5)** — done by `pm-architect` *after* the coder (per
  plan's "Docs to update"). Fix the line-115 self-contradiction (see below).

## #5 — own-doc hook contradiction (independent, confirmed)

Confirmed and **independent of the template section-set** — it's a fact-coherence fix inside
this repo's `doc/architecture.md`, with no bearing on which sections the template should have:

- Line 100 (Architectural decisions) correctly describes a shipped `UserPromptSubmit` hook
  that "reasserts the route on change-intent prompts" — consistent with
  `.claude/settings.json`.
- Line 115 (Architectural constraints) asserts **"Hooks are `PreToolUse`-only … No …
  `UserPromptSubmit` … are used"** — directly contradicting line 100 and the shipped settings.

Fix is to line 115 only: replace the absolute "PreToolUse-only" claim with the real surface
(`PreToolUse` gates + one `UserPromptSubmit` route-reassertion hook). The many other
`PreToolUse` mentions (lines 22/23/132/135/136) are about the *gating* hooks and are
correct — do not touch them. This is `pm-architect`'s own-doc maintenance job, post-coder.

## Recommendation

**Reconcile toward the agent prose + lived doc: enrich the template** (rename two sections,
add the three), **unify Module-map with File-layout into one coarse section** named
`## File layout (module map)` on the *responsibility* axis, **point auditor:104 at that named
section**, and **fix the own-doc line-115 contradiction separately**. Git history is decisive
— the three sections were never retired from the template, they were never added; the
template is the stale side. Forced single-variant: there is no viable "trim the agents to the
thin template" alternative, because A4's `ls`/CI/README cross-checks have proven value and the
reference instance already depends on all three sections.

### Plan refinement to surface to the PM
- The plan frames #2 as *adding* a Module-map section; reframe as **unify the existing
  (agent-expected, own-doc-present) File layout with the proposed Module map into one coarse
  section**, rather than adding a parallel one — otherwise two coarse path tables coexist.
- The plan's section-list reconciliation (#2/#3) should explicitly include the **two
  renames** (`Key decisions`→`Architectural decisions`, `Constraints`→`Architectural
  constraints`) and the **two other ADDs** (Integration contract, Release flow), not just the
  module-map section — all four files drift on these together, and a module-map-only fix
  leaves the rename + the other two phantoms unresolved.
