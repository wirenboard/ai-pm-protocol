# product-map-migration-detection — plan

Backlog #4 (last open item). Make detection of an un-migrated template structure
reliable, and turn the passive "map missing" note into an active offer to run the
pending migration. The migration procedures themselves (v2.2/v2.3 in
`pm-bootstrap.md`) are NOT touched — only detection + trigger/offer.

## Scenarios
1. When `pm-auditor` runs on a project that still has `docs/features/_index.md` (un-migrated v2.2 structure), it flags that as a **note** ("un-migrated template structure — `docs/features/_index.md` should have been replaced by `docs/product-map.md`; run the `/pm-bootstrap` migration") and does **not** silently treat `_index.md` as a valid feature inventory. The "`docs/product-map.md` exists" check is a hard, early step that does not depend on a fallback inventory.
2. When un-migrated structure or a missing generated map is detected during `/pm-audit`, the orchestrator **offers to run the pending `/pm-bootstrap` migration now** (plain-language prompt, PM decides) — the note is no longer a dead end. The auditor stays read-only; the orchestrator acts on the finding with PM consent.
3. When the PM starts `/pm-plan` on a project with un-migrated structure, a lightweight retrospective check (alongside the existing "5+ features → offer audit" check) surfaces the pending migration: "this project is on an older template structure — run the migration first?". PM decides.
4. On a legitimately greenfield / feature-less project (no `_index.md`, no contracts, no plans), a missing `docs/product-map.md` is still **not** a finding and no migration is offered (existing `pm-auditor` line-107 behavior preserved).

## Existing behaviors this feature touches
- `pm-auditor` step 2 "Build the feature inventory" — must not silently consume `_index.md` as the canonical inventory.
- `pm-auditor` docs-currency product-map check — stays; made reliable/early. The greenfield/feature-less exemption is preserved.
- `pm-bootstrap.md` "Pending template-upgrade migrations" — gains a named `### Pending-migration detection` subsection (the single source for the conditions, extracted from the existing migration entries); the migration procedures themselves are unchanged.
- `pm-plan` retrospective check (the existing audit-suggestion block) — gains a sibling "pending migration" check.
- `pm-audit` command — gains the follow-through offer.

## Contracts
None (no config keys / APIs). The "un-migrated" detection conditions are: `docs/features/_index.md` present (v2.2 not run), OR a generated `docs/product.md` carrying the frozen signature line with no `docs/product-map.md` (v2.3 not run) — these are single-sourced in a new named `### Pending-migration detection` subsection of `pm-bootstrap.md` (extracted from the prose currently inside the v2.2/v2.3 migration entries) and referenced by name, never by line number.

## Stack expectations touched
None — no external stack component. `doc/stack-notes.md` untouched; no `pm-stack-researcher`.

## Interaction scenarios
`Provably isolated`: an agent/command prose change, no runtime state. The only conceptual "intersection" (captured in Key design decisions): the offer must reuse `pm-bootstrap`'s detection conditions, not fork them.

## Test plan
- Existing that must pass: `bash tests/hooks.sh` (65/65) — hooks untouched.
- No automated test for prose (`tests/hooks.sh` is the only harness — meta-infrastructure exception, recorded in `doc/architecture.md`). Verification by review:
  - `pm-auditor` flags a lingering `_index.md` as a note and does not use it as the canonical inventory;
  - the "`product-map.md` exists" check is positioned as a hard, early step independent of an inventory fallback;
  - the greenfield/feature-less exemption is preserved (no false finding);
  - `/pm-audit` offers to run the migration when un-migrated structure is found (orchestrator acts; auditor stays read-only);
  - `/pm-plan` retrospective surfaces the pending migration;
  - the detection conditions reference `pm-bootstrap.md` and are not duplicated.

## Docs to update
- None under `docs/` (this is agent/command prose). `CHANGELOG.md` + version bump (**MINOR** — protocol behavior change, downstream-affecting) at `pm-pr-prep`.

## Key design decisions
- **Detection conditions are single-sourced** in a new named `### Pending-migration detection` subsection of `pm-bootstrap.md` (under `## Pending template-upgrade migrations`), holding both conditions (`_index.md` present; generated `product.md` + frozen signature & no `product-map.md`). `pm-auditor` / `pm-audit` / `pm-plan` reference it **by name**, never by line number (which rots) and never re-encode — otherwise they drift (the exact class of bug this feature fixes). The frozen v2.3 signature string then lives in exactly one place.
- **Auditor stays read-only:** it FLAGS (note, flag/remediation grammar, no action verbs); the ORCHESTRATOR offers/runs the migration with PM consent.
- **Where the offer lives (decided — arch review, Variant B):** both `/pm-audit` (primary — detection is the auditor's job) and a `/pm-plan` retrospective nudge cloned from the existing "5+ features → offer audit" block. A shared detect+offer procedure was rejected as over-engineered (conditions are single-sourced, but each offer is a context-specific PM prompt in its own command voice). See `.ai-pm/arch/product-map-migration-detection_arch.md`.
- **Auditor reliability fix sits in two places:** inventory step 2 (inventory comes from `git log` only; `_index.md` is never an inventory source and a lingering one routes to a note) and the docs-currency dimension (greenfield exemption evaluated first with `_index.md`-absent added to its preconditions, then a hard early `product-map.md` existence check independent of the contract re-derivation).
- Greenfield exemption preserved.

## Out of scope
- Rewriting the migration procedures (v2.2/v2.3 in `pm-bootstrap.md`) — they work; only detection + offer.
- Auto-RUNNING the migration without PM consent — it is always an offer.
- A git-hook / session-start auto-trigger on submodule bump — the protocol has no such hook surface; detection happens at the next `/pm-audit` or `/pm-plan`. (Possible future item.)
- backlog #1 (rejected), #2/#3/#5 (resolved in v2.4.0).
