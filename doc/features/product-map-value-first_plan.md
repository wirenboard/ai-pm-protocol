# Product-map value-first — plan

The generated `docs/product-map.md` is the screen a PM lands on from the authored
`product.md` `## Функции` link. Today each contract block shows one thin
`Guarantees:` line and then a prominent 3-column feature table (plan links, Done
dates, review links). The PM opens the map to *understand the features* and lands
in a technical build-history list instead. This is the **cheap slice** of the
two-layer-docs backlog item (`.ai-pm/backlog.md` → "From two-layer-docs proposal",
decomposition item 1): lead each contract block with two product-language lines
already present in the contract — `Что даёт:` (`## User value`) and
`Границы:` (`## Out of scope`) — and demote the build-history table below them,
under a `Чем построено:` label. **Not** the full 4-field model: no new "logic"
field, no new generator inputs — only a change to *what is shown first* from fields
that already exist (v2.3).

**Render decision (PM, 2026-06-03): pure markdown, no HTML.** `<details>`/`<summary>`
collapsing was rejected because it is HTML, not markdown — it only collapses on
GitHub and shows literal tags in a terminal / IDE / plain markdown viewer. The
build-history table is demoted by **reading order and a label** (`Чем построено:`
above it), so the map renders identically everywhere (GitHub, IDE, terminal).

## Scenarios

1. A PM opens `docs/product-map.md`. For each contract block, the first thing
   under the heading is two product-language lines: `Что даёт:` (projected from the
   contract's `## User value`) and `Границы:` (projected from the contract's
   `## Out of scope`) — before any plan link, review link, or Done date.
2. Below the value lines, the build-history table (Фича / Готово / Ревью) is
   rendered under a plain `Чем построено:` label line — pure markdown, no HTML. It
   comes after the value lines in reading order; its audit columns are preserved.
3. A contract whose `## Out of scope` section is empty or absent renders only the
   `Что даёт:` line — no empty `Границы:` line is emitted.
4. The `## Infrastructure (no user-facing contract)` bucket is unchanged: it has no
   contract, therefore no `Что даёт` / `Границы` lines and no `Чем построено:`
   label; it keeps its existing plain feature table.
5. `pm-auditor` re-derives the map from source and reads the feature rows from the
   table under `Чем построено:`; it does **not** treat the layout change as
   content-stale, and it does **not** require the value lines to exist as a
   re-derivation/content check (no prose-policing).
6. **Proactive format-refresh nudge.** A downstream project whose existing
   `docs/product-map.md` is still in the old format (a contract block carrying the
   literal `Guarantees:` label / lacking `Что даёт:`) is detected as on an older
   template structure. The PM is offered a one-click regeneration before new work:
   at `/pm-plan` ("your product map is in the old format — regenerate to value-first
   now?") and as a non-blocking `/pm-audit` note. On yes → the map is rebuilt via the
   Product map generation procedure (idempotent — it overwrites the generated file
   from source; a no-op on an already-new-format map). This is a regeneration, **not**
   a structural migration (no `git mv`/`git rm`, no scaffolding).

## Existing behaviors this feature touches

(from `doc/architecture.md` and the Product map generation procedure — what must not break)

- The map stays **generated, never hand-filled** — rebuilt wholesale from
  `.ai-pm/contracts/`, `docs/features/`, `.ai-pm/reviews/`, git on every run.
- **One feature, many contracts** — the `↑ та же работа` single-line marker for a
  feature that appears under a second contract still works; it now lives in the
  table under that contract's `Чем построено:` label.
- **Status legend**, component grouping (`## <Component>` from `architecture.md`),
  alphabetical contract sort, and feature-row sort by Done — all unchanged.
- The status label on the heading (`### [name](path) — live|deprecated`) is
  unchanged.
- **Auditor re-derivation & compare** (`pm-auditor.md:108-116`) must still locate
  every contract, every feature row, and every Review link — the feature rows are
  the same table, now under the `Чем построено:` label; the auditor's description of
  where to read them is updated accordingly.
- **This template repo is the deliberate exception** (`doc/architecture.md:104`):
  it generates no `product-map.md` of its own. This change edits the *procedure and
  its worked example*, not a live map in this repo.
- **Pending-migration detection** (`pm-bootstrap.md` → `### Pending-migration
  detection`, the single-source-of-conditions established by PR #165) gains one new
  condition (old-format map). The existing v2.2 / v2.3 conditions and their
  structural migration procedures are untouched; the nudge surfaces in `pm-plan.md`
  and `pm-audit.md` already reference that section by name, so they pick up the new
  condition by reference.

## Contracts

(changed data shape — the generated map's per-contract block format)

- **Per-contract block in `docs/product-map.md`** changes from
  `Guarantees: <User value>` + table → two lead lines `Что даёт: <User value>` and
  `Границы: <Out of scope>` (the latter omitted when the contract has no Out of
  scope), then the same table under a plain `Чем построено:` label line (no HTML).
  `Границы` is a compact projection of the contract's `## Out of scope` bullets
  (joined into a short line; the generator may keep up to the first couple of
  bullets if long). No new field is authored anywhere — both sources already exist
  in `contract.md.tmpl` (`## User value`, `## Out of scope`).
- No Product Contract is created — this is a protocol/template change, and this repo
  produces no `product-map.md` (template-repo exception).

## Stack expectations touched

None. The change uses no new markdown construct at all — only label lines and the
existing table form (the same GFM tables/links/blockquotes the map already uses).
HTML (`<details>`) was explicitly rejected (see Render decision). The repo's
`doc/stack-notes.md` tracks jq, gh, git, GitHub Actions, the hooks API, and
agent-file YAML frontmatter — not the markdown body of generated docs; document-body
markdown is, by the repo's established practice, not a tracked stack component. So
there is nothing stack-level to respect or test here.

## Interaction scenarios

This feature is **not** provably isolated: the generated map is re-read and compared
by a second agent (`pm-auditor`), and live downstream maps exist in the old format
until their next regeneration.

- **When `pm-auditor` re-derives the map after this format change:** it reads the
  feature rows from the table under the `Чем построено:` label and compares them
  against source; it must not emit a "stale map" note merely because the layout
  changed, and must not require the `Что даёт` / `Границы` lines to exist (no prose
  check). Expected: a new-format map that matches source by content passes the audit
  clean.
- **When a downstream project still has an old-format map (pre-regeneration) and an
  audit runs:** the auditor compares content (contracts present, features present,
  Review links valid) by content, not byte format, so the old-format map is **not**
  flagged as a content-stale finding. Separately — and non-blocking — the auditor
  emits a **format-refresh note** ("map is in the pre-value-first format; regenerate
  via the Product map generation procedure"), detected by the literal `Guarantees:`
  label per `### Pending-migration detection`. The two are distinct: content drift =
  the existing stale-map note; old presentation format = this new regenerate note.
- **When the PM opens `/pm-plan` on a project with an old-format map:** the
  Pending-migration nudge offers regeneration before planning. If the PM declines,
  planning proceeds and the next `/pm-plan` handoff regenerates the map anyway; if
  the PM accepts, the map is regenerated immediately. Idempotent either way.

## Test plan

- Existing tests that must pass: `bash tests/hooks.sh` — hooks are untouched;
  confirms nothing broke.
- **There is no automated test harness for prose-generation procedures** —
  `tests/hooks.sh` is the only test artifact (meta-infrastructure exception, recorded
  in `doc/architecture.md`). Verification is by review against concrete checks:
  - **New tests (review checks):**
    - `worked-example-value-first`: the Worked example in `pm-bootstrap.md` renders
      the new block — `Что даёт:` + `Границы:` first, then the Фича/Готово/Ревью
      table under a `Чем построено:` label (pure markdown, no HTML) — and
      round-trips with the Output format spec (given the two-contract +
      one-infra-feature fixture, when generated, then value lines precede the
      labeled table and `↑ та же работа` still appears under the second contract's
      `Чем построено:`).
    - `empty-out-of-scope`: given a contract with no `## Out of scope` content, when
      the block is generated, then only `Что даёт:` is emitted and no empty
      `Границы:` line appears.
    - `infra-bucket-unchanged`: given a contract-less feature, when the map is
      generated, then it appears in `## Infrastructure (no user-facing contract)` as
      a plain table with no value lines and no `Чем построено:` label.
    - `output-emits-value-lines`: in the generation procedure's Output format and
      Worked example, the per-contract block **emits** `Что даёт:` + `Границы:` +
      `Чем построено:` and no longer **emits** a `Guarantees:` output line. (Note:
      `Guarantees:` legitimately remains as a *detection signal* in the
      old-format-map condition and the nudge/note text — so a blanket
      `grep -rn "Guarantees:"` is expected to match those; the check is that no
      *output template* still produces it.)
    - `old-format-detection`: `### Pending-migration detection` in `pm-bootstrap.md`
      gains exactly one condition — an existing `docs/product-map.md` whose contract
      block carries the literal `Guarantees:` label (no `Что даёт:`) — with a
      remediation that is "regenerate via the Product map generation procedure"
      (idempotent, overwrite-from-source), not a `git mv`/`git rm` migration. The
      v2.2 / v2.3 conditions and procedures are byte-unchanged.
  - **Interaction scenario tests (review checks):**
    - `auditor-reads-labeled-table`: the `pm-auditor.md` map section explicitly
      states feature rows live in the table under the `Чем построено:` label and
      that the value lines are not a required-presence check; reviewing the worked
      example through the auditor's re-derivation steps yields no "stale map" note.
    - `old-format-refresh-note`: the auditor section states that content comparison
      is by content (contracts / features / Review links), not byte format — so a
      pre-migration old-format map is **not** a content-stale finding — and that the
      auditor additionally emits a **non-blocking** format-refresh note when it
      detects the `Guarantees:` old-format signal. The two are kept distinct.
    - `plan-nudge-old-format`: the Pending-migration nudge in `pm-plan.md` offers
      regeneration when an old-format map is detected (referencing `### Pending-
      migration detection` by name), and on PM-yes regenerates via the Product map
      generation procedure before planning.
- **Stack-spec tests:** none — no tracked stack component is touched (see Stack
  expectations touched).

## Docs to update

- `.claude/commands/pm-bootstrap.md` — two edits:
  - the **Product map generation procedure**: Structure step 2 (replace the
    `Guarantees:` instruction with the `Что даёт:` + `Границы:` projection rule and
    the `Чем построено:` labeled-table instruction, including the empty-Out-of-scope
    rule), the Output format block, and the Worked example.
  - `### Pending-migration detection`: add one condition — an existing
    `docs/product-map.md` carrying the literal old-format `Guarantees:` label (no
    `Что даёт:`) — with the trivial remediation "regenerate via the Product map
    generation procedure" (idempotent, overwrite-from-source; **not** a structural
    `git mv`/`git rm` migration). Do not touch the v2.2 / v2.3 conditions.
- `.claude/agents/pm-auditor.md` — the map re-derivation section (around lines
  108-116): note that feature rows are read from the table under `Чем построено:`,
  that the value lines are not a required-presence content check (no prose-policing),
  and add a **non-blocking format-refresh note** when the old-format `Guarantees:`
  signal is present (distinct from the content-stale note; remediation = regenerate).
- `.claude/commands/pm-plan.md` — the **Pending-migration nudge** subsection: add the
  old-format-map case to the offer (regenerate to value-first before planning),
  referencing `### Pending-migration detection` by name (do not re-encode conditions).
- `.claude/commands/pm-audit.md` — surface the format-refresh note as a non-blocking
  finding with the regenerate offer (mirrors how the missing-map note is surfaced).
- `doc/architecture.md` — add one line to the product-map description recording the
  value-first block format (`Что даёт` + `Границы` lead, build history demoted under
  `Чем построено:`, pure markdown — no HTML) and that it is a render-only projection
  of existing contract fields. Owner: `pm-architect`.
- No `CLAUDE.md` Pipeline change (no new validator).

## Out of scope

- **Full 4-field description model** — the deferred sibling of this categorical
  choice. The map could surface more description fields; the contract currently
  exposes `## User value`, `## Who uses it`, `## Must work`, `## Must not break`,
  `## Out of scope`. This slice projects exactly two (`User value`, `Out of scope`).
  The notable excluded sibling is the proposed **"По какой логике" (logic) field**:
  it has no existing contract source, so it needs a new contract field or generator
  inference — a separate plan, deferred behind this slice's live validation point
  (backlog decomposition item 4). `Who uses it` / `Must work` / `Must not break` are
  likewise left to the technical/contract layer, not promoted to the PM-facing map.
- **README front-gate** (backlog item 2), **`## Behavioral contract` section +
  human journey steps** (item 3), **auditor structural anti-drift** (item 4) — each
  is its own plan.
- **The authored `docs/product.md` front door** — owned by `pm-architect`, a
  separate file; this plan touches only the generated `product-map.md` and the
  procedure that builds it.
- **A structural data migration** (`git mv`/`git rm`, scaffolding, backfill) — not
  needed and explicitly not added; there is no data to transform (the map is
  generated wholesale from source). What *is* in scope is the lighter
  **format-refresh nudge** above: detect an old-format map and offer regeneration at
  `/pm-plan` and `/pm-audit`. The new format also still lands automatically on the
  next natural regeneration (`/pm-plan` handoff or re-bootstrap) for projects that
  never see the nudge.
