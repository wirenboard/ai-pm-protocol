---
pr: TBD
branch: feat/state-aware-checks-and-promotion
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-24
trail_type: committed-review
spawned_agents: N/A (scripts + agent prompts + template)
---

**Verdict:** approve

PR4 of 4-PR plan (last template PR). State-aware CI enforcement + Tier 2 promotion script + Documentation migration helper для template-sync Phase 3.

# Coverage

## A. `check-spec-discipline.sh.tmpl` state-aware logic

- ✅ Reads `foundation_completeness` from state (default `complete` для backwards compat)
- ✅ Reads `adoption_overrides` skip list через grep
- ✅ NEW helper `log_downgraded` — finding affected by override → warn с tag «adoption-trade-off accepted by operator»
- ✅ NEW helper `is_overridden` — checks если component в skip list
- ✅ **Check 1 (personas-exist)** state-aware:
  - `complete` → fail если missing
  - `partial/minimal/none` → warn (используются Tier 1 mini-personas)
  - Override → downgrade
- ✅ **Check 4 (foundational-docs-filled)** state-aware:
  - Same per-state behavior
  - Per-doc override check (personas / user-journeys / threat-model / mvp-scope)
- ✅ **Check 8 (spec-references-persona)** updated — accepts inline `## Mini-persona` section как valid persona source

## B. NEW `promote-foundation.py.tmpl` (Tier 2 routine)

Read-only Python (stdlib only):
- ✅ Find all `*_spec.md` + `*_spec.v*.md` files в features/
- ✅ Extract `## Mini-persona` / `## Journey context` / `## Mini-threat-list` sections via regex section parser
- ✅ Aggregate distinct entries across фич
- ✅ Generate consolidated `personas.md` / `user-journeys.md` / `threat-model.md` drafts с:
  - Operator marker «Consolidated YYYY-MM-DD via promote-foundation.py from N specs»
  - Source attribution per entry (which spec contributed it)
  - Inline operator review checklist (cleanup tasks: merge duplicates, refine descriptions, etc.)
- ✅ Backup existing files (`<name>.md.before-promote-<date>`) перед overwrite
- ✅ `--dry-run` mode для preview без writing
- ✅ Print next steps для operator (state update, mini-* cleanup, PR open)
- ✅ NOT done by script (operator responsibility):
  - State file update (`foundation_completeness`)
  - Removing mini-* sections from existing specs (после consolidation)
  - Approval workflow

## C. NEW `template-sync-doc-migrate.py.tmpl` (template-sync Phase 3 helper)

Read-only Python (stdlib only):
- ✅ 5 detection categories:
  1. Spec frontmatter additions (missing fields)
  2. Spec sections additions (missing required sections)
  3. Foundational artifact splits (e.g. ui-style-guide single → base + per-kind)
  4. Mode aliases (legacy `new-feature` / `rework-feature`)
  5. State field additions (missing new fields)
- ✅ Output report в `meta/template-sync-doc-migration-<date>.md` с:
  - Detected categories с counts
  - Sample examples (first 3-5 per category)
  - Recommended actions
  - Verification baseline table (для post-apply comparison)
- ✅ Read-only — analysis only, no writes к product docs
- ✅ Operator reviews report → AskUserQuestion per category → apply через project-bootstrap interactive routine

## D. `project-bootstrap.md` updates

- ✅ Tier 2 promotion routine — replaced inline pseudo-code references на actual script invocation
- ✅ Template-sync Phase 3 — added implementation reference на `template-sync-doc-migrate.py`

## E. `bootstrap-state.md.tmpl` Stage E checklist

- ✅ Added item: «foundation maintenance scripts generated» — Stage E генерирует `promote-foundation.py` + `template-sync-doc-migrate.py` из templates

# Cross-cutting findings

## Spec coverage

PR4 covers все PR4 scope items из plan file:
- check-spec-discipline.sh state-aware logic ✅
- Adoption overrides CI enforcement (через `log_downgraded` + `is_overridden`) ✅
- Tier 2 promotion script ✅
- Documentation migration helper ✅

NOT covered (out of scope template repo — PR5 на downstream):
- Real-world testing на downstream product
- Per-product customization documentation

## Plan adherence

Соответствует Phase 3 PR4 scope в plan file. Все остальные scope items (Phase 1 PR1, Phase 1 PR2, Phase 2 PR3) — уже merged.

## Test discipline

Manual verification (scripts):
- ✅ Shell script (`check-spec-discipline.sh.tmpl`) `set -e`, graceful fallbacks (`2>/dev/null || true`)
- ✅ Python scripts stdlib only — no pip install required (critical для works в any environment)
- ✅ Read-only где documented — `template-sync-doc-migrate.py` не пишет в product docs
- ✅ Backup existing files в `promote-foundation.py` (operator может rollback)
- ✅ Operator markers в auto-generated files

## Security / architecture

- ✅ Scripts не commit'ат сами — operator approval workflow preserved
- ✅ AP-22 enforcement: downgrade через `is_overridden`, не silent skip
- ✅ Backwards compat: default `foundation_completeness=complete` если field отсутствует в state
- ✅ Hard floor (security path) handling preserved в reviewer downgrade logic

## Code hygiene

- ✅ Scripts AP-12 safe (English variable names, Russian comments wrapped)
- ✅ Python scripts PEP 8, type hints где applicable
- ✅ Consistent output format (stdout = result, stderr = progress/diagnostics)

# Protocol compliance

- ✅ AP-1: нет ADR
- ✅ AP-3: scope утверждён operator
- ✅ AP-6: scope formalized в plan + design doc
- ✅ AP-12: AP-12 safe scripts
- ✅ AP-14: state-aware enforcement implemented
- ✅ AP-15: state-aware enforcement implemented (через is_overridden ui-style-guide)
- ✅ AP-16: этот trail
- ✅ AP-17: clean (нет product names)
- ✅ AP-19: mixed scope authorized per consolidation directive (script + agent updates + state template — all relate к state-aware enforcement implementation)
- ✅ AP-22: enforcement codified through downgrade mechanic + helper functions

# Severity summary

- Blocking: 0
- Question: 0
- Nit: 0

# Out of scope для PR4

- External research artifact `meta/audits/2026-05-24_complexity-honesty.md` — not part of this PR, untracked
- PR5 (downstream apply) — отдельный repo, separate workflow

# Plan completion summary

После merge PR4 — **все 4 template PR'а complete**:

| PR | Branch | Phase | Status |
|---|---|---|---|
| PR1 | `feat/foundation-state-schema` | 1 (foundation) | merged |
| PR2 | `feat/bootstrap-legacy-and-sync` | 1 (foundation) | merged |
| PR3 | `feat/tier0-scripts-and-tier1-integration` | 2 (legacy support) | merged |
| PR4 | `feat/state-aware-checks-and-promotion` | 3 (refinements) | pending merge |

После PR4 merge: closes #48 (template-apply mode), #56 (legacy-partial design), #57 (README modes section update).

PR5 — downstream product apply — будет в private repo, не в этом template.
