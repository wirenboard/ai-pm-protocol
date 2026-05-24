---
pr: TBD
branch: fix/feature-spec-frontmatter
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-25
trail_type: committed-review
spawned_agents: N/A (template defect fix PR)
---

**Verdict:** approve

v0.2.0 Scope A combo (B-2 + B-3 из post-refactor audit). Закрывает два связанных defect'а в `_templates/`:
- **B-2:** `feature-spec.md.tmpl` не имел YAML frontmatter примера в head. Spec template'ы downstream проектов копировались без structured frontmatter, что ломало AP-13/14 impact gates и template-sync.
- **B-3:** `feature-review.md.tmpl` не имел mandatory `**Verdict:**` line (AP-16 hook парсит её!). Также references orphan `security-reviewer` (нет такого агента в roster v0.1.0).

# Coverage

## B-2 — feature-spec frontmatter

Добавлен полный YAML frontmatter block в head template'а с:
- `topic` — kebab-case slug
- `mode` — один из 5 modes (new-product / feature / rework / bug-fix; template-sync обычно не имеет feature spec'а)
- `lite-mode` — no / yes / bugfix / small-fix
- `created`, `spec_approved`, `plan_approved` — PM-markers
- `acceptance: pending` (default)
- `merged: no` (default)
- `review_url` — ссылка на committed review trail
- `pr_ordering` — null или explicit list (AP-19)
- `template_version_applied` — для template-sync diff
- **7 impact полей** (3 operational AP-13 + 4 structural AP-14):
  - `legal_impact`, `interview_impact`, `incident_impact` (operational)
  - `journey_impact`, `threat_impact`, `scope_impact`, `topology_impact` (structural)

Дефолтные значения safe (`no`, `pending`, `null`) — операторы explicitly выставляют `yes` где надо.

## B-3 — feature-review verdict line + roster fix

Изменения в `feature-review.md.tmpl`:
- Добавлена YAML frontmatter (pr / branch / reviewer / reviewed_at / trail_type / spawned_agents) — единая convention с существующими review trails в `meta/reviews/`
- **Mandatory `**Verdict:** approve | request-changes | block` line** под frontmatter — AP-16 hook парсит её
- Removed orphan `security-reviewer` references (нет в v0.1.0 roster)
- Updated **Reviewer agent** section на актуальный roster v0.1.0: `reviewer` (primary orchestrator) + `protocol-compliance-reviewer` (always-spawned) + ONE-of {`backend-reviewer` / `frontend-reviewer` / `database-reviewer` / `design-reviewer`} per AP-20 domain routing
- Added Test discipline checks для silent-break gaps 1-3 (spec→test mapping / test fudging / regression coverage) — forward reference на subsequent PRs (gap 1/2/3 enforcement)
- Added ADR auto-extraction check для AP-24 — forward reference на subsequent PR

# Cross-cutting findings

## Spec coverage

Этот PR — **B-2 + B-3 из post-refactor audit** (`meta/audits/2026-05-25_post-refactor-second-pass.md`). Audit findings служат spec'ом.

## Plan adherence

Соответствует v0.2.0 Scope A из плана v3 (`meta/design/2026-05-25_merged-optimization-plan.md`). Logical change: «restore structured contract в feature artifact templates».

## Test discipline

N/A — это template content addition, не code change. Verification — semantic preservation.

## Security / architecture

- AP-12: техтермины wrapped в `backticks`, общие слова на русском
- AP-16: review trail обязательно для feature PRs (этот файл закрывает требование)
- AP-17: clean

## Code hygiene

- 52 строк изменено в 2 файлах (22 added в feature-spec, 34 added в feature-review)
- Frontmatter — standard YAML, parseable AP-16 hook'ом и template-sync-doc-migrate.py

# Protocol compliance

- ✅ AP-1: нет архитектурных решений (template defect fix)
- ✅ AP-3: scope утверждён через утверждённый план v3
- ✅ AP-4: spec coverage — audit doc + plan doc
- ✅ AP-6: scope без deviation
- ✅ AP-12: anglicism check passed
- ✅ AP-14: нет foundational doc updates required (template-internal fix)
- ✅ AP-16: этот trail; ALSO **B-3 непосредственно reinstates AP-16 hook compatibility** в downstream review templates
- ✅ AP-17: clean
- ✅ AP-19: B-2 + B-3 — один логический change (feature-artifact templates frontmatter discipline)
- ✅ AP-20: roster обновлён на актуальный

# Severity summary

- Blocking: 0
- Question: 0
- Nit: 0

# Out of scope

- B-1 (mode renaming sweep) — separate PR #28
- B-4 (scripts location) — next PR
- High findings — отдельный PR batch
- Silent-break gaps 1-3 + AP-24 + size gate — отдельные PR'ы
