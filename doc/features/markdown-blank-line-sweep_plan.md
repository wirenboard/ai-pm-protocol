# Markdown blank-line sweep (PM-facing rendered surfaces) — plan

Backlog "Markdown soft-break sweep — 2026-06-03", broadened by PM to all PM-facing
**rendered** documentation. Found live on a downstream product-map: a `### contract
heading` immediately followed by `- **User value:**` bullets with no blank line —
renders on GitHub but violates markdownlint MD022/MD032 and breaks/looks-bad in
non-CommonMark renderers (python-markdown default, some wiki/SSG/PDF paths).

**Approach (PM 2026-06-03): a durable rule + the static cleanup it cannot reach.**
The primary fix is a single **markdown-authoring convention in `WORKFLOW.md`** — one
paragraph, read by every doc-writing agent — so all agent-authored / generated markdown
is blank-line-correct **going forward** (prevention, not symptom-chasing). The rule
alone cannot retroactively fix two kinds of already-shipped content, which therefore
get a one-time fix: (a) the **static templates** (`doc/_templates/*.tmpl`) — copied
as-is, no agent re-authors them; and (b) the **product-map generation Output format**
in `pm-bootstrap.md` — the generator's spec, where the headline bug lives. The rule
*does* remove the need to sweep agent-authored docs (architecture.md, user-journeys.md,
reviews, product.md prose — already clean and kept clean by the rule).

**Scope of the cleanup: PM-facing rendered surfaces only.** The static fixes touch the
templates + the product-map output (what a downstream human reads **rendered**).
`.claude/commands/*.md` / `.claude/agents/*.md` / `MIGRATIONS.md` bodies are model-read
source — out of scope (low value, large churn); whole-repo lint-clean was declined.

**This is mechanical correctness — never a content rewrite.** Add blank lines around
block elements (lists / tables) and convert any adjacent soft-break lines to a list;
do not change wording or meaning.

## Scenarios

1. **The durable rule.** `WORKFLOW.md` carries a one-paragraph markdown-authoring
   convention (read by every doc-writing agent and inherited downstream): when you
   write or generate markdown a human will render, surround lists / tables / headings
   with blank lines, and never put two non-blank lines that should render on separate
   lines adjacent (use a list or a blank line). From then on, agent-authored and
   generated markdown is blank-line-correct without per-file sweeps.
2. A newly scaffolded downstream project gets templates whose lists/tables are
   surrounded by blank lines — they render cleanly in every renderer (GitHub,
   python-markdown, wikis, PDF) and pass markdownlint MD022/MD032.
3. A regenerated `docs/product-map.md` has a blank line between each `### contract`
   heading and its `- **User value:**` bullets (and the build table stays properly
   spaced) — the headline instance, fixing the render of **every** downstream map on
   its next regeneration (the generator's Output-format spec now embeds the rule).
4. No wording or meaning changes anywhere — only blank lines added / adjacent lines
   listified, and the WORKFLOW.md rule paragraph added.

## Existing behaviors this feature touches

(from the protocol's own templates/generators — what must not break)

- **The product-map generation procedure** (`pm-bootstrap.md` Output format + Worked
  example): the only change is a blank line after the contract heading; the value
  bullets, `Built by:` label, table, status legend, `↑ same work`, sort order, and
  every other element are unchanged. The map still regenerates from source.
- **The templates** (`CLAUDE.md.tmpl`, `threat-model.md.tmpl`, `ui-guide.md.tmpl`):
  only blank lines added around lists/tables; all placeholder text and section
  structure unchanged.
- **Already-clean templates** (`product.md.tmpl`, `architecture.md.tmpl`,
  `user-journeys.md.tmpl`, `contract.md.tmpl`, `stack-notes.md.tmpl`, `state.md.tmpl`,
  `README.md.tmpl`) — verified clean by the inventory (recent slices were made
  soft-break-safe); they are **not** touched.
- **`WORKFLOW.md`** gains one paragraph; the canonical spec is read by all agents and
  imported downstream, so the rule reaches every doc-writing agent (pm-architect,
  pm-legacy-reader, the generation procedures, reviewers) without per-agent edits. The
  rest of `WORKFLOW.md` is unchanged.
- `tests/hooks.sh` — hooks untouched; stays 71/71.

## Contracts

(changed rendering structure — blank lines only)

- **`WORKFLOW.md` markdown-authoring rule** — a one-paragraph convention near the
  existing PM-communication / render guidance: doc-writing agents surround
  lists/tables/headings with blank lines and avoid adjacent soft-break lines in any
  markdown a human renders. One home, read by all agents.
- **In-scope inventory (the exact spots to fix):**
  - `doc/_templates/CLAUDE.md.tmpl` — `### Tech stack` → table (≈:17); `### Security
    constraints` → list (≈:32); `### Code conventions` "AI-specific minimums" intro →
    list (≈:38). Add a blank line before each block.
  - `doc/_templates/threat-model.md.tmpl` — "Revisit this document when:" → list
    (≈:65). Blank line before the list.
  - `doc/_templates/ui-guide.md.tmpl` — `**Adaptivity decision:**` → list (≈:13).
    Blank line before the list.
  - `.claude/commands/pm-bootstrap.md` — Product map **Output format** `### [<Contract
    name>]` → `- **User value:**` (≈:303); **Worked example** `### [dimmer-control]`
    (≈:331) and `### [scene-recall]` (≈:342). Add a blank line after each contract
    heading before the value bullets.
  - The coder re-runs the inventory scan to catch any spot these line numbers miss
    (line numbers drift) and any adjacent soft-break line in the in-scope files.
- No Product Contract (template/meta change; this repo has no `.ai-pm/contracts/`).

## Stack expectations touched

None. Human-facing markdown; `doc/stack-notes.md` does not track document-body markdown
as a stack component. The fix adds whitespace only. Nothing stack-level to respect or
test.

## Interaction scenarios

This feature is **not** provably isolated: the product-map fix changes a **generated**
output format read by humans and re-derived by `pm-auditor`.

- **When `pm-auditor` re-derives a regenerated (fixed-spacing) product-map:** it
  compares by content (contracts / features / Review links), not byte spacing, so the
  added blank line is not a stale-map finding; the map self-heals to the fixed spacing
  on its next `/pm-plan` regeneration. No data migration.
- **When a downstream project re-scaffolds a template (`CLAUDE.md` etc.):** the new
  scaffold has the corrected spacing; existing authored docs from old templates keep
  the old spacing (cosmetic, renderer-dependent) until re-scaffolded — acceptable, no
  forced migration.

## Test plan

- Existing tests that must pass: `bash tests/hooks.sh` — hooks untouched (71/71).
- **New tests (grep/scan checks; no executable harness for markdown structure):**
  - `workflow-rule-present`: `WORKFLOW.md` carries the one-paragraph markdown-authoring
    rule (surround lists/tables/headings with blank lines; no adjacent soft-break lines
    in rendered markdown), near the PM-communication / render guidance.
  - `inventory-clean-after-fix`: the in-scope scan (heading/label/text immediately
    followed by a list `- `/`* ` or table `|` with no intervening blank line) over
    `doc/_templates/*.tmpl` and the product-map Output format + Worked example returns
    **zero** hits after the change.
  - `product-map-heading-blank`: the Output format and both worked-example contract
    blocks have a blank line between the `### [contract]` heading and the first
    `- **User value:**` bullet; the build table stays blank-line-separated from
    `Built by:`.
  - `no-content-change`: a word-level diff shows only blank lines added (and any
    adjacent lines listified) — no wording/meaning changed in any edited file.
  - `out-of-scope-untouched`: `.claude/commands/*.md` (except the product-map output in
    `pm-bootstrap.md`), `.claude/agents/*.md`, `WORKFLOW.md`, `MIGRATIONS.md`, and the
    already-clean templates are not modified.
- **Interaction scenario tests:**
  - `auditor-map-spacing-not-stale`: the `pm-auditor` map re-derivation compares by
    content not byte spacing, so a fixed-spacing map is not flagged (review the auditor
    map section — already content-based; confirm no spacing assertion exists).
- **Stack-spec tests:** none — no tracked stack component touched.

## Docs to update

- `WORKFLOW.md` — add the one-paragraph markdown-authoring rule (the primary,
  durable fix) near the PM-communication / render guidance.
- `doc/_templates/CLAUDE.md.tmpl`, `doc/_templates/threat-model.md.tmpl`,
  `doc/_templates/ui-guide.md.tmpl` — blank lines around the flagged lists/tables.
- `.claude/commands/pm-bootstrap.md` — Product map Output format + Worked example:
  blank line after each contract heading.
- `doc/architecture.md` — a one-line note recording the markdown-rendering convention
  (PM-facing rendered docs keep lists/tables/headings blank-line-separated for
  cross-renderer + lint correctness; the rule lives in `WORKFLOW.md`), only if it fits
  the doc's existing render-decision notes; owner `pm-architect` (skip if no natural
  home).

## Out of scope

- **Whole-repo lint-clean** — the sibling scope. `.claude/commands/*.md`,
  `.claude/agents/*.md`, `WORKFLOW.md`, `MIGRATIONS.md` are read by the model as source
  (not rendered for humans), so blank-line/lint correctness there is low-value, large
  churn; PM declined (2026-06-03). A separate decision if ever wanted.
- **A markdownlint check wired into CI / the auditor** — flagged for backlog: a
  structural MD022/MD032 check could prevent regressions, but adding a lint validator
  (tooling, CI) is its own plan; not bundled here.
- **Migrating existing downstream authored docs** to the new spacing — not done; the
  product-map self-heals on regeneration, and authored docs are corrected on
  re-scaffold; no forced migration for a cosmetic, renderer-dependent issue.
- **Any wording / content change** — strictly blank lines + listification only.
