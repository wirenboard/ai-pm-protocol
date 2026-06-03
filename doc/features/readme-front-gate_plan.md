# README front-gate — plan

Slice 2 of the two-layer-docs backlog item (`.ai-pm/backlog.md` → "From
two-layer-docs proposal", decomposition item 2). The scaffolded downstream
`README.md` ships a `## What it does` capability list (`README.md.tmpl:11-13`) —
the exact surface that drifted against `product.md`'s `## Что умеет сегодня`
downstream (two parallel capability lists, no single owner). This slice removes the
capability list from the template so the README owns **no** capability statements:
it keeps a one-paragraph intro and a single pointer link into `product.md` (the PM
funnel front door), which is the single owner of "what it does / for whom / limits".
Fixes the *cause* of the README↔product.md drift, not the symptom.

**Critical scope note — README is authored, not generated.** Unlike
`docs/product-map.md` (regenerated from source every run), `README.md` is
**scaffolded once** from the template at bootstrap (`pm-bootstrap.md:104`) and then
hand-maintained. So changing `README.md.tmpl` only affects **new** projects;
existing downstream projects keep their old `## What it does` list and stay drifted.
This plan therefore ships **both** the template change **and** a migration for
existing projects — and the migration is **move-not-copy**, never a blind rewrite of
an authored file.

**Render decision (carried from v2.6.0):** the new skeleton uses only blank-line-
separated paragraphs — no adjacent label lines that would collapse on GitHub render
(the markdown soft-break gotcha from the product-map-value-first review).

**PM decision (2026-06-03): no status line.** The backlog floated "one paragraph +
a status line + a link"; the PM chose to drop the status line — README carries the
intro paragraph and the `product.md` link only, so maturity/limits live in exactly
one place (`product.md` `## Что умеет сегодня`). Zero new drift surfaces.

## Scenarios

1. A maintainer scaffolds a new project. The generated `README.md` has a
   one-paragraph intro, then a single pointer line — "What it does, for whom, and
   current limits: [`docs/product.md`](docs/product.md)" — and **no** `## What it
   does` capability list. Quick start, Architecture, Development, License sections
   are unchanged.
2. A PM (or anyone) reading the README is funnelled to `product.md` for the
   capability/maturity picture instead of reading a second, drift-prone list.
3. **Existing-project migration (offer).** A downstream project whose `README.md`
   still contains a `## What it does` capability list is detected as on the older
   template structure. The migration is offered before new work at `/pm-plan` and as
   a non-blocking `/pm-audit` note. On accept, the capability bullets are reconciled
   into `product.md` first (move-not-copy — any capability not already in
   `## Что умеет сегодня` is added), then the `## What it does` list is removed from
   the README and replaced with the pointer line. Nothing about install / Quick
   start is touched.
4. A project already on the new structure (README has no `## What it does` list) is
   **not** flagged and gets no nudge.

## Existing behaviors this feature touches

(from the protocol's own agent/template behavior — what must not break)

- **`pm-architect` A4 cross-check** (`pm-architect.md:54`, `architecture.md.tmpl:60`)
  — "The `Integration contract` section must match README install instructions."
  The front-gate keeps the README's **Quick start / install** content; it only drops
  the capability list. So A4's install cross-check is unaffected, and it must stay
  unaffected.
- **Bootstrap README scaffolding** (`pm-bootstrap.md:104`) — greenfield still
  scaffolds `README.md` from `README.md.tmpl`; only the template content changes.
- **`### Pending-migration detection`** (`pm-bootstrap.md`, the single-source-of-
  conditions from PR #165, extended in v2.6.0) — gains one new condition (old-
  template README). The existing v2.2 / v2.3 / old-format-map conditions and their
  procedures are untouched; the nudge surfaces (`pm-plan.md`, `pm-audit.md`) and the
  auditor reference that section by name, so they pick up the new condition by
  reference.
- **`product.md` ownership** (`pm-architect`) — the migration writes `product.md`
  (`## Что умеет сегодня`); that file is owned by `pm-architect`, so the migration
  remediation is performed **by** `pm-architect`, not by the orchestrator or a blind
  script.

## Contracts

(changed data shape — the scaffolded README structure)

- **`README.md.tmpl`**: the `## What it does` section (capability bullet list) is
  removed. In its place, immediately after the intro paragraph, a single pointer
  line links to `docs/product.md`. No capability statement remains anywhere in the
  README template. No Product Contract is created — this is a template/meta change,
  and this repo produces no scaffolded project README of its own (its own `README.md`
  is the hand-authored protocol marketing doc, out of scope).

## Stack expectations touched

None tracked. `README.md` is a human-facing markdown document; the repo's
`doc/stack-notes.md` does not track document-body markdown as a stack component
(consistent with the product-map slice). The new skeleton introduces no new markdown
construct — plain paragraphs, an existing heading set, and a link. Nothing
stack-level to respect or test.

## Interaction scenarios

This feature is **not** provably isolated: the migration reads and writes a second
authored file (`product.md`), and existing downstream READMEs exist in the old
structure until migrated.

- **When the README front-gate migration runs (move-not-copy):** the capability
  bullets currently in the README's `## What it does` must be reconciled into
  `product.md` `## Что умеет сегодня` **before** the README list is removed. If a
  capability is present in the README but absent from `product.md`, it is added to
  `product.md` first; only then is the README list dropped. A capability must never
  be lost in the gap between the two files. (This is why the remediation is
  `pm-architect`'s coverage judgment, not a text-delete script.)
- **When `pm-architect` A4 runs after the front-gate change:** it still finds the
  README's install/Quick start content for the `Integration contract` cross-check;
  removing the capability list does not remove install instructions, so A4 does not
  trip.
- **When a project on the new structure (no `## What it does`) is audited or
  planned:** the old-template-README detection does not fire — no false migration
  nudge.

## Test plan

- Existing tests that must pass: `bash tests/hooks.sh` — hooks untouched; confirms
  nothing broke.
- **There is no automated harness for the templates/procedures** (meta-infrastructure
  exception, recorded in `doc/architecture.md`); `tests/hooks.sh` is the only test
  artifact. Verification is by review against concrete checks:
  - **New tests (review checks):**
    - `template-no-capability-list`: `README.md.tmpl` has no `## What it does`
      section and no capability bullet list; it has the intro paragraph followed by a
      single `docs/product.md` pointer line; Quick start / Architecture / Development
      / License sections are intact.
    - `template-soft-break-safe`: the new skeleton has no two adjacent non-blank
      label/content lines that would collapse on GitHub render — paragraphs are
      blank-line-separated (given the new template, when rendered on GitHub, then
      intro, pointer, and each section read on their own lines).
    - `no-status-line`: per the PM decision, the template carries no maturity/status
      line — only the intro paragraph and the `product.md` link.
    - `old-template-readme-detection`: `### Pending-migration detection` in
      `pm-bootstrap.md` gains exactly one condition — an existing `README.md`
      containing a `## What it does` capability list — with a **move-not-copy**
      remediation (reconcile capabilities into `product.md`, then drop the README
      list) performed by `pm-architect`. The v2.2 / v2.3 / old-format-map conditions
      are byte-unchanged.
  - **Interaction scenario tests (review checks):**
    - `migration-move-not-copy`: the migration procedure text requires reconciling
      README capabilities into `product.md` `## Что умеет сегодня` **before** removing
      the README list (no capability dropped in the gap), and assigns the step to
      `pm-architect`.
    - `a4-cross-check-intact`: the procedure/template leave the README install /
      Quick start content in place, so `pm-architect` A4's `Integration contract ↔
      README install` cross-check is unaffected.
    - `plan-and-audit-nudge`: the `/pm-plan` Pending-migration nudge and the
      `/pm-audit` + auditor note both surface the old-template-README case,
      referencing `### Pending-migration detection` by name (not re-encoding the
      condition).
- **Stack-spec tests:** none — no tracked stack component is touched.

## Docs to update

- `.claude/commands/pm-bootstrap.md` — two edits:
  - `### Pending-migration detection`: add the old-template-README condition (an
    existing `README.md` carrying a `## What it does` capability list).
  - add a **README front-gate migration procedure** (alongside the existing v2.2 /
    v2.3 / old-format-map procedures): move-not-copy remediation — spawn
    `pm-architect` to reconcile the README's capability bullets into `product.md`
    `## Что умеет сегодня`, then remove the `## What it does` list from the README and
    insert the `product.md` pointer line. Explicitly **not** a blind rewrite; the
    install / Quick start content is preserved.
- `.claude/agents/pm-auditor.md` — emit a **non-blocking note** when a downstream
  `README.md` still carries a `## What it does` capability list (old-template
  structure), remediation = run the README front-gate migration; detected per
  `### Pending-migration detection`. (The auditor has no existing README check, so
  this is a new, additive, non-blocking note — not prose-policing the README's
  wording, only detecting the structural capability-list section.)
- `.claude/commands/pm-plan.md` — Pending-migration nudge: add the old-template-
  README case (offer the front-gate migration before planning), referencing
  `### Pending-migration detection` by name.
- `.claude/commands/pm-audit.md` — surface the old-template-README note as a non-
  blocking finding with the migration offer, mirroring the other migration nudges.
- `doc/architecture.md` — record the doc-ownership decision: the README owns no
  capability statements; `product.md` is the single owner of "what it does / for
  whom / limits"; the README links to it. Note the move-not-copy migration for
  existing projects. Owner: `pm-architect`.

## Out of scope

- **This repo's own `README.md`** — it is the hand-authored protocol marketing doc
  (RU, per `WORKFLOW.md:1`), not a template-scaffolded project README. The template
  change and the downstream migration do not touch it. (If it duplicates capability
  prose, that is a separate, this-repo-only cleanup, not part of the template slice.)
- **The `product.md` funnel prose / `## Что умеет сегодня` format** — owned by
  `pm-architect`; this slice only ensures the migration *moves* capabilities into it,
  it does not redesign that section.
- **Slice 3 (`## Behavioral contract` + human journey steps)** and **slice 4 (4-field
  model + auditor structural anti-drift)** — each its own plan.
- **A status line in the README** — the deferred sibling of the layout choice
  (`README.md.tmpl` could carry a one-line maturity status). Excluded per PM decision
  to avoid any second capability/maturity surface; maturity lives only in
  `product.md` `## Что умеет сегодня`.
- **English-canonical migration** (separate backlog decision) — the new pointer line
  text language and the `## Что умеет сегодня` header language are left as-is here;
  the language canon is its own plan.
