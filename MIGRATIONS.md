> **This file is the canonical migration catalogue** — read by the orchestrator and agents; the single source of pending-migration conditions and per-version migration procedures for moving a project between protocol template versions. The `/pm-bootstrap` re-bootstrap flow detects and runs these; `pm-plan`, `pm-audit`, `pm-auditor`, and `pm-plan-checker` reference the conditions here by name. When a scenario is detected, follow the matching procedure below. For how the protocol behaves day-to-day see `WORKFLOW.md`; this file is its migration sibling.

### Pending template-upgrade migrations

On an already-initialized project, before confirming-and-exiting, check whether a template upgrade (`git submodule update --remote`) left a migration to run. Trigger on PM request ("migrate", "обнови шаблон", "мигрируй на v2.2") or proactively when detected.

### Pending-migration detection

**Single source for "this project is on an older template structure."** These are the only conditions that define an un-migrated state. `pm-auditor`, `pm-audit`, and `pm-plan` reference this subsection **by name** ("`### Pending-migration detection` in `MIGRATIONS.md`") and must never re-encode the conditions — the migration procedures below consume them too.

- **v2.2 not run:** `docs/features/_index.md` is present (the pre-v2.2 index that the v2.2 migration replaces).
- **v2.3 not run:** a generated `docs/product.md` exists AND carries the frozen pre-split generator signature line — and `docs/product-map.md` does **not** exist:

  > `> Source of truth = contracts. One contract, many features. Generated, not hand-filled.`

  **This literal string is a frozen historical artifact** — it is the exact header the pre-split generator emitted. Do NOT "tidy" or normalize it; the detection of already-deployed projects depends on this exact pre-split text. (The new generator no longer emits it; that is intentional and what makes the two states distinguishable.) An authored `docs/product.md` never carries the signature line, so a greenfield-before-first-feature project with a hand-authored funnel is correctly **not** detected as un-migrated.

- **Old-format (pre-value-first) generated map:** an existing `docs/product-map.md` that has at least one contract block carrying the literal old-format `Guarantees:` label **or** the pre-English-canonical `Что даёт:` label (either is the positive anchor — a current value-first block leads with `- **User value:**` / `- **Out of scope:**` bullets and never emits `Guarantees:` or `Что даёт:`). This is a generated map produced before the current value-first English block format. **A contract-less / infra-only map is NOT old-format:** a backend/infra-only project's map has only the `## Infrastructure (no user-facing contract)` table — no contract blocks, hence no `Guarantees:` / `Что даёт:` label and no value lines — and must not be flagged (regenerating it produces an identical infra-only map). Its remediation is **trivial and not a structural migration**: regenerate `docs/product-map.md` via the **Product map generation procedure** in `pm-bootstrap.md` (idempotent, overwrite-from-source — a no-op on an already-new-format map). There is **no** `git mv` / `git rm` step here — the map is rebuilt wholesale from source, so the new format simply replaces the old one.

- **Pre-English-canonical `product.md` (Russian funnel headers):** an existing downstream `docs/product.md` whose authored funnel still carries the Russian headers (`## Зачем это нужно` / `## Что умеет сегодня` / `## Документы` / `## Функции`) instead of the English canon (`## Why this exists` / `## What it does today` / `## Documents` / `## Features`). Detect by the **positive presence** of any one of the four Russian headers. A `docs/product.md` already on the English headers is **not** flagged; a truly missing/empty `docs/product.md` is the auditor's existing missing-funnel note, not this condition. Remediation is the **product.md header-migration procedure** below — performed by `pm-architect` (owner of `docs/product.md`): rewrite the four headers to English, **prose preserved verbatim**. There is **no** machine-translation of the authored body.

- **Old-template README (front-gate not applied):** an existing downstream `README.md` that still contains a `## What it does` capability list (the pre-front-gate template structure — the README owned a second, drift-prone capability statement parallel to `docs/product.md`'s `## What it does today`). The current template carries no `## What it does` section; instead the README has a one-paragraph intro plus a single `docs/product.md` pointer line. Detect by the **positive presence** of a `## What it does` heading in `README.md`. A project already on the new structure (no `## What it does` heading) is **not** flagged. The remediation is the **README front-gate migration procedure** below — a **move-not-copy** reconcile-then-remove, never a blind delete of the authored README.

- **Token-laden contract (two-layer not applied):** an existing downstream `.ai-pm/contracts/<feature>.md` whose **PM-facing sections** (`## User value` / `## Out of scope`) carry **wire-tokens**, OR whose `## Must work` / `## Must not break` **inline machine grammars** that belong in `docs/architecture.md` `## Behavioral contract`. Wire-tokens are: topic paths (a leading-slash MQTT-style topic like `/devices/.../on` — **not** a relative documentation reference like `docs/architecture.md` `## Behavioral contract`, which is the intended token-free form and never triggers this condition), `<x>_<y>` / `<…>_<…>` id/format grammars (`matter_export_<…>`), dotted config keys (`bridge.*`, `mqtt.socketPath`), protocol flags (`retain`, `QoS`), raw wire value-ranges (`0..254`). Domain vocabulary the PM uses as product language (`DimmableLight`, `Matter`, `fabric`) is **not** a wire-token and does **not** trigger this condition. Detect by the **positive presence** of a wire-token shape in a PM-facing section, or an inlined grammar in a Must-work / Must-not-break item. A contract whose PM sections are token-free and whose guarantees reference (not restate) the Behavioral contract is **not** flagged. The remediation is the **contract two-layer migration procedure** below — a **move-not-copy** performed by `pm-architect` that preserves every guarantee.

The migration procedures themselves are below; they are unchanged.

- **v2.2 — feature index → product map.** Detection: see `### Pending-migration detection` above (`docs/features/_index.md` present). When it applies:
  1. **Backfill `Built/changed by` from the index first.** Pre-v2.2 contracts have no `Built/changed by` list, so a naive generation would drop every feature into the Infrastructure bucket. The mapping already exists in the index's `Contract` column: read `docs/features/_index.md`, and for each feature row that links a contract, append `- [<topic>](../../docs/features/<topic>_plan.md)` to that contract's `Built/changed by` section. Features with no contract link correctly fall into the Infrastructure bucket.
  2. Generate `docs/product-map.md` from the contracts / plans / reviews using the **Product map generation procedure** in `pm-bootstrap.md`. (Pre-v2.3 the target was `docs/product.md`; the v2.3 migration below splits that into the authored front door plus this generated map. If you run both migrations on a project that still has a generated `docs/product.md`, run the v2.3 rename first.)
  3. `git rm docs/features/_index.md` — its content is now rendered, contract-centric, in `docs/product-map.md`.
  4. Tell the PM in plain language: "Updated the project map to the new format — `docs/product-map.md` now shows what the system does, organized by what each feature guarantees. The old feature list is gone; nothing else changed."

  If the project is backend-only (no user-facing contracts), `docs/product-map.md` renders with a single `## Infrastructure (no user-facing contract)` section — that is correct, not an error.

- **v2.3 — `product.md` split into authored front door + generated map.** The single generated `docs/product.md` is split into an **authored** `docs/product.md` (PM front door, owned by `pm-architect`) and a **generated** `docs/product-map.md` (the contract→features map). Detection: see `### Pending-migration detection` above (generated `docs/product.md` carrying the frozen signature line AND no `docs/product-map.md`).

  If either guard fails — do nothing (no-op). This makes the migration idempotent two ways: after a successful run `product-map.md` exists, and an authored `product.md` never carries the signature line — so the migration leaves both already-migrated and greenfield-before-first-feature projects untouched, no clobber.

  **Steps when pre-split:**
  1. `git mv docs/product.md docs/product-map.md` — the old generated content is preserved verbatim as the map; no data loss. (The next auditor/`/pm-plan` run rebuilds it wholesale in the new format, signature line included or not is irrelevant — it is overwritten.)
  2. Scaffold a fresh authored `docs/product.md` from `.ai-pm/tooling/doc/_templates/product.md.tmpl` (the funnel skeleton: Why this exists / What it does today / Documents / Features), written **without** any generator signature line. Then spawn `pm-architect` to fill the funnel (or leave the skeleton for the next `pm-architect` run if the PM is not ready).
  3. Tell the PM in plain language: "The capability map moved to `docs/product-map.md` (same content, now in the new format). `docs/product.md` is now your authored product front door — I scaffolded a skeleton for you to fill (why it exists, what it does today, where the docs are)."

- **README front-gate — capability list → `docs/product.md` pointer.** The downstream `README.md` is moved off the old template structure: the `## What it does` capability list is removed and replaced with a single `docs/product.md` pointer line, so the README owns **no** capability statement and `docs/product.md` `## What it does today` is the single owner of "what it does / for whom / limits". Detection: see `### Pending-migration detection` above (an existing `README.md` carrying a `## What it does` capability list). When it applies:

  **This is a move-not-copy migration, not a blind rewrite of the authored README.** `README.md` is hand-maintained, and its `## What it does` bullets may carry a capability not yet reflected in `docs/product.md`. Nothing may be lost in the gap between the two files. The reconcile-and-edit is performed **by `pm-architect`** (the sole owner of `docs/product.md`) — not by the orchestrator and not by a text-delete script.

  **Precondition — an authored `docs/product.md` must exist (the v2.3 split must have run).** The reconcile below targets `docs/product.md` `## What it does today`; if `docs/product.md` is absent (the project is still pre-v2.3), there is no valid target. Run the **v2.3 migration first** (it scaffolds the authored `docs/product.md`), then the README front-gate migration.

  1. **Reconcile first (pm-architect).** Spawn `pm-architect` (`subagent_type: "pm-architect"`) with the README's current `## What it does` bullets. It reconciles every bullet into `docs/product.md` `## What it does today`: any capability present in the README's list but absent from `## What it does today` is **added to `docs/product.md` first**. This step writes only `docs/product.md`; the README is not yet touched.
  2. **Then remove the README list (pm-architect, only after step 1).** Once every README capability is reflected in `docs/product.md`, `pm-architect` removes the `## What it does` list from `README.md` and inserts the single pointer line immediately after the intro paragraph: `→ What it does, for whom, and current limits: [\`docs/product.md\`](docs/product.md).` (blank line before and after — soft-break-safe). **Preserve the README's Quick start / install and every other section verbatim** — only the `## What it does` section is removed. This keeps `pm-architect` A4's `Integration contract ↔ README install` cross-check valid (the install instructions are untouched).
  3. Tell the PM in plain language: "Your README no longer keeps a separate 'what it does' list — that lived in two places (README and `docs/product.md`) and drifted. Any capability that was only in the README is now in `docs/product.md`, and the README points there. Install instructions and everything else are unchanged."

  No capability is ever dropped: step 1 (add-missing-to-`product.md`) always precedes step 2 (remove-from-README).

- **product.md header-migration — Russian funnel headers → English (headers only, prose preserved).** A downstream authored `docs/product.md` is brought onto the English-canonical funnel headers. Detection: see `### Pending-migration detection` above (an existing `docs/product.md` carrying any of the four Russian funnel headers). When it applies:

  **This is a headers-only rewrite, never a content rewrite.** The PM authored the funnel prose; that body text is preserved **verbatim** — no machine-translation, no content loss. Only the four header lines change. The rewrite is performed **by `pm-architect`** (the sole owner of `docs/product.md`) — not by the orchestrator and not by a text-replace script run outside the owner.

  1. **Rewrite the four headers (pm-architect).** Spawn `pm-architect` (`subagent_type: "pm-architect"`). It rewrites only the four funnel headers in place: `## Зачем это нужно` → `## Why this exists`, `## Что умеет сегодня` → `## What it does today`, `## Документы` → `## Documents`, `## Функции` → `## Features`. The authored prose under each header is left exactly as written (the PM's content, in whatever language). Soft-break-safe (headers stay blank-line-separated). New prose `pm-architect` authors afterward is English (per the language canon).
  2. Tell the PM in plain language: "Updated your product front door's section titles to the canonical English names — the text you wrote underneath is untouched. Nothing else changed."

- **Contract two-layer migration — wire grammars relocated to `## Behavioral contract`, PM sections rephrased token-free.** A downstream contract carrying wire-tokens in its PM sections, or inline machine grammars in Must-work / Must-not-break, is brought onto the two-layer structure. Detection: see `### Pending-migration detection` above (token-laden contract). When it applies:

  **This is a move-not-copy migration, performed by `pm-architect`** (the sole owner of `docs/architecture.md` `## Behavioral contract`) — not by the orchestrator and not by a text-replace script. The technical detail (the grammar's exact shape) **moves** to the Behavioral contract; the contract keeps a reference. **Every Must-work / Must-not-break guarantee is preserved** — the set of promises is unchanged; only the location and phrasing of the technical detail moves. Nothing user-visible changes.

  **Precondition — `docs/architecture.md` `## Behavioral contract (taxonomies & invariants)` must exist** (slice 3 / v2.8.0). It is the relocation target. If absent, the project is pre-v2.8.0 and the contract two-layer migration cannot run until that section exists.

  1. **Relocate + rephrase (pm-architect).** Spawn `pm-architect` (`subagent_type: "pm-architect"`). It:
     - **Moves** each wire grammar/taxonomy out of the contract and into `docs/architecture.md` `## Behavioral contract` as a **single owner**. A grammar shared by several contracts converges on **one** Behavioral-contract entry referenced by all — **not** N copies (single-owner; avoids re-introducing drift).
     - **Replaces** the grammar in the contract's `## Must work` / `## Must not break` with a reference to that Behavioral-contract entry.
     - **Rephrases** `## User value` / `## Out of scope` into token-free product language.
     - **Preserves every guarantee** — each original Must-work / Must-not-break promise maps to a surviving promise in the migrated contract; the migration relocates technical detail, it never removes or weakens a promise.

     This step writes `docs/architecture.md` and the contract; it does not touch code.

  2. **Verify nothing broke (3-part).**
     - The contract's **Acceptance-check tests still pass** — code is untouched, only contract prose moved.
     - **`pm-plan-checker` confirms no guarantee was dropped or weakened** — it compares the migrated contract against the original and emits **blocking** if any guarantee is missing or softened (the migration guarantee-preservation block in `pm-plan-checker.md`).
     - The **regenerated product-map's PM layer is token-free** — regenerate `docs/product-map.md` via the **Product map generation procedure** in `pm-bootstrap.md`; once the contract's PM sections are token-free, the map's `- **User value:**` / `- **Out of scope:**` lines carry no wire-tokens (no generator change needed).

  3. Tell the PM in plain language: "Your feature contract kept exactly the same promises — the technical detail (topic formats, value ranges) moved into the single architecture reference, and the user-facing parts are now in plain product language. Nothing the user sees changed."

  **Worked before/after example** (a wire-token in `## Out of scope` relocated to `## Behavioral contract` and referenced):

  *Before* — contract `matter-export.md`:
  ```markdown
  ## Out of scope
  - export ids outside the `matter_export_<type_slug>_<endpoint_id>` grammar are not produced
  ```

  *After* — the grammar moves to `docs/architecture.md` `## Behavioral contract` (single owner):
  ```markdown
  ## Behavioral contract (taxonomies & invariants)
  - **Matter export id grammar:** `matter_export_<type_slug>_<endpoint_id>` — `<type_slug>` is the device type, `<endpoint_id>` the Matter endpoint.
  ```
  and the contract references it in product language:
  ```markdown
  ## Out of scope
  - export ids outside the documented export-id grammar (see `docs/architecture.md` `## Behavioral contract`) are not produced
  ```

  The guarantee ("ids outside the grammar are not produced") is unchanged; only the grammar's exact shape moved to its single owner.
