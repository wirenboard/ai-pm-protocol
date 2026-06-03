# Behavioral contract + human journey steps — plan

Slice 3 of the two-layer-docs backlog item (`.ai-pm/backlog.md` → "From two-layer-docs
proposal", decomposition item 3). Two coupled template changes that give technical
taxonomies/invariants a single home and make the PM-facing journeys readable:

(a) Add a new `## Behavioral contract (taxonomies & invariants)` section to
`architecture.md.tmpl` — the single owner for technical taxonomies and invariants
(status enums, topic/ID grammars, QoS levels, reachability rules) that today have no
home and scatter across `user-journeys` and contracts, then drift (downstream
symptom: "6 statuses in docs, 7 in code").

(b) Rewrite the `user-journeys.md.tmpl` *step* guidance into human language — "what
the user does / expects / can go wrong" with **no** protocol identifiers (no
`serialNumber`, `matter_export_<…>`, `fabric`, `retain`, `QoS` in step bodies) — and
push every format/taxonomy invariant down to the new Behavioral-contract section,
which the journey **references** (MOVE, not copy).

**The drowning was in the step bodies, not just the Invariants field.** Framing this
as "move the Invariants field down" alone is insufficient — the primary fix is
human-language steps. The Invariants move rides along.

**Move-not-copy guard.** The machine content must *move* out of the PM docs, not be
copied beside a new link. A copy-plus-link brings the drift back, just quieter. The
template guidance must instruct "state it once in `## Behavioral contract`, reference
it from the journey", never "restate it here and also link".

**Render decision (carried from v2.6.0):** both edits stay soft-break-safe — no
adjacent non-blank label lines that collapse on GitHub render.

## Scenarios

1. A PM reading a downstream `docs/user-journeys.md` sees journey **steps** in plain
   human language — what the user does, expects, and what can go wrong — with no
   topic names, field names, QoS, or retain flags in the step bodies. The template
   guidance now demands this explicitly.
2. `docs/architecture.md` has a single `## Behavioral contract (taxonomies &
   invariants)` section that owns the status enums / topic & ID grammars / QoS /
   reachability rules. It is a **distinct** top-level `##` section, separate from
   `## Integration contract` (which stays "how external consumers integrate" —
   install / entry points / API).
3. A journey that needs a format or taxonomy invariant **references** the Behavioral
   contract section by name instead of restating the identifiers; the `**Invariants:**`
   field carries only human-level invariants, with format/taxonomy invariants moved
   to (and owned by) the Behavioral contract section — moved, not duplicated.
4. `pm-architect` walking the template (A2) now includes the new section: it fills it
   for projects that have taxonomies/invariants, or marks it `N/A — <reason>` for
   projects that have none. The architect's A4 cross-checks (File layout ↔ tree,
   Release flow ↔ CI, Integration contract ↔ README install) are **unchanged** — the
   Behavioral contract is authored domain content with no external artifact to diverge
   from, so it gains no cross-check and a status table in it never trips A4.
5. `pm-legacy-reader` drafting a legacy project's docs writes journey steps in human
   language and routes the machine identifiers it observes into the architecture
   draft's Behavioral contract section, not into the journey step bodies.

## Existing behaviors this feature touches

(from the protocol's own agent/template behavior — what must not break)

- **`pm-architect` A2 "walk every template section"** (`pm-architect.md:50`) — the new
  section is walked like any other; an empty-taxonomy project gets `N/A — <reason>`,
  never an invented taxonomy.
- **`pm-architect` A4 cross-checks** (`pm-architect.md:54`) — the list of cross-checked
  sections (File layout, Release flow, Integration contract) is **not** extended. The
  Behavioral contract is not cross-checked against README or code. Must stay that way
  so A4 does not trip on status tables.
- **`pm-architect` A5 "no sections not in the template"** (`pm-architect.md:56`) —
  adding the section *to the template* is what gives the architect license to write it;
  without this template change the architect could not introduce it.
- **`pm-bootstrap.md:141`** lists the sections the architect walks at greenfield
  bootstrap — must include the new section so bootstrap stays in sync with the template.
- **`pm-auditor` "major components listed?"** (`pm-auditor.md:106`) keys on `File
  layout (module map)`, and **"does it cover user-facing flows?"** (`:107`) on
  user-journeys coverage — neither is changed. **No new auditor taxonomy/anti-drift
  check is added here** (that is backlog slice 4, deliberately deferred).
- **The journeys table shape** (`Step | What the user does | What they expect | What
  can go wrong` + `**Invariants:**` + `**Drop-off points:**`) is preserved — only the
  *guidance* in the cells/fields changes (human language, identifiers moved out).

## Contracts

(changed data shape — two template structures)

- **`architecture.md.tmpl`**: new top-level section `## Behavioral contract
  (taxonomies & invariants)` with authoring guidance (what it owns: status enums,
  topic/ID grammars, QoS, reachability and similar domain invariants; `N/A` when the
  project has none). Distinct from `## Integration contract`.
- **`user-journeys.md.tmpl`**: step-guidance and `**Invariants:**`-guidance rewritten —
  human-language steps, no protocol identifiers in step bodies, a one-line pointer to
  `docs/architecture.md` `## Behavioral contract` for format/taxonomy invariants
  (move-not-copy). No new Product Contract is created (template/meta change; this repo
  produces no project `architecture.md`/`user-journeys.md` of its own beyond the
  template-exception note).

## Stack expectations touched

None. The change is to human-facing markdown templates and agent-prompt guidance;
`doc/stack-notes.md` does not track document-body markdown as a stack component
(consistent with slices 1-2). No new markdown construct is introduced. Nothing
stack-level to respect or test.

## Interaction scenarios

This feature is **not** provably isolated: the two templates are coupled (journeys
reference the new architecture section), and three agents author these files
(`pm-architect`, `pm-legacy-reader`, and the journeys author).

- **When an author moves a format/taxonomy invariant out of a journey (move-not-copy):**
  the invariant lands in `architecture.md` `## Behavioral contract` and the journey
  *references* it; the journey must not keep a restated copy beside the link. The
  template guidance must make the move-not-copy ordering explicit (state once in
  Behavioral contract, reference from journey).
- **When `pm-architect` A4 runs after this change:** it still cross-checks only File
  layout / Release flow / Integration contract; the new Behavioral contract section is
  not in the A4 set, so a status enum table inside it never produces a self-inflicted
  finding.
- **When `pm-legacy-reader` drafts a legacy project:** it writes human-language journey
  steps and routes observed identifiers into the architecture draft's Behavioral
  contract section — not the journey step bodies — keeping the two layers separated
  from first draft.
- **When `pm-auditor` audits a project using the new sections:** its existing checks
  (File layout components, journey coverage) behave unchanged; it does **not** validate
  the Behavioral contract's taxonomy content (no slice-4 anti-drift check here).

## Test plan

- Existing tests that must pass: `bash tests/hooks.sh` — hooks untouched; confirms
  nothing broke.
- **There is no automated harness for the templates/agent prose** (meta-infrastructure
  exception, recorded in `doc/architecture.md`); `tests/hooks.sh` is the only test
  artifact. Verification is by review against concrete checks:
  - **New tests (review checks):**
    - `arch-template-has-behavioral-contract`: `architecture.md.tmpl` has a distinct
      top-level `## Behavioral contract (taxonomies & invariants)` section, separate
      from `## Integration contract`, with guidance naming what it owns (status enums,
      topic/ID grammars, QoS, reachability) and an `N/A — <reason>` instruction for
      projects with no taxonomies (given the template, when read, then the two
      contract sections are distinct and the Behavioral one is clearly the taxonomy/
      invariant home).
    - `journeys-template-human-steps`: `user-journeys.md.tmpl` step guidance instructs
      human-language steps with **no** protocol identifiers in step bodies, and the
      `**Invariants:**` guidance routes format/taxonomy invariants to
      `architecture.md` `## Behavioral contract` (move-not-copy), with a one-line
      pointer present.
    - `move-not-copy-guidance`: both templates' guidance phrase the rule as "state once
      in Behavioral contract, reference from the journey" — never "restate plus link".
      No guidance text invites a copy-beside-a-link.
    - `soft-break-safe`: the new section and rewritten guidance have no two adjacent
      non-blank label lines that collapse on GitHub render (blank-line-separated
      paragraphs / proper lists / tables).
    - `a4-not-extended`: `pm-architect.md` A4's cross-check set still lists only File
      layout / Release flow / Integration contract — the Behavioral contract is NOT
      added to it; the walk list (A2 / `:18` / `pm-bootstrap.md:141`) DOES include it.
    - `no-auditor-taxonomy-check`: `pm-auditor.md` gains no taxonomy/anti-drift check —
      its map/component/journey checks are unchanged (slice 4 stays out).
  - **Interaction scenario tests (review checks):**
    - `legacy-reader-routes-identifiers`: `pm-legacy-reader.md` journeys guidance
      instructs human-language steps and routing of observed identifiers into the
      architecture draft's Behavioral contract section (not the journey step bodies).
    - `bootstrap-walk-list-synced`: `pm-bootstrap.md:141` (architect walk list) and
      `pm-architect.md:18` include the Behavioral contract section, so bootstrap and
      the template stay in sync.
- **Stack-spec tests:** none — no tracked stack component is touched.

## Docs to update

- `doc/_templates/architecture.md.tmpl` — add the `## Behavioral contract (taxonomies
  & invariants)` section.
- `doc/_templates/user-journeys.md.tmpl` — rewrite step + `**Invariants:**` guidance to
  human language; add the move-not-copy pointer to `## Behavioral contract`.
- `.claude/agents/pm-architect.md` — add the new section to the walk list (`:18`, A2
  context) and state explicitly that A4 does **not** cross-check it (it is authored
  domain content, no external artifact).
- `.claude/commands/pm-bootstrap.md` — line ~141: add `Behavioral contract` to the list
  of sections the architect walks at greenfield bootstrap.
- `.claude/agents/pm-legacy-reader.md` — user-journeys guidance: human-language steps;
  route observed machine identifiers into the architecture draft's Behavioral contract
  section, not the journey step bodies.
- `doc/architecture.md` — record the decision: technical taxonomies/invariants have a
  single owner (`## Behavioral contract`), distinct from Integration contract; journeys
  are human-language and reference it move-not-copy. Owner: `pm-architect` (post-coder).

## Out of scope

- **Auditor structural anti-drift check** (a "taxonomy not duplicated" / "statuses in
  docs match code" check) — this is backlog decomposition item 4, deliberately deferred
  behind the live validation point; adding it here would widen scope and the backlog
  marks it "structural only, later". The plan adds the *home* for taxonomies, not a
  checker over them.
- **The full 4-field product-map model** (item 4's "logic" field) — unrelated, separate
  plan.
- **Rewriting any real downstream `user-journeys.md` content** — this slice changes the
  *template guidance*; existing authored journeys are migrated as their projects touch
  them (and `pm-legacy-reader` / `pm-architect` apply the new guidance going forward).
  A dedicated downstream-journeys migration is not part of the template slice.
- **English-canonical** (separate backlog decision) — section/field language is left
  as-is here; the language canon is its own plan.
- **Contracts' own invariant wording** — the contested backlog point "contracts
  reference a central taxonomy = coupling" is not resolved here: this slice centralizes
  the *source enumerations* in architecture.md; it does **not** force every contract to
  link there instead of naming its invariant in its own words.
