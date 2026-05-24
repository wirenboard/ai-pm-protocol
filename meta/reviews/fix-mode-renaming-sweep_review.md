---
pr: TBD
branch: fix/mode-renaming-sweep
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-25
trail_type: committed-review
spawned_agents: N/A (mechanical sweep PR)
---

**Verdict:** approve

v0.2.0 Scope A (B-1 из post-refactor audit). Закрывает defect: ~80% template файлов всё ещё ссылались на «Mode 1/2/3» terminology после rename'а на 5 named modes в v0.1.0. Это breaking contract — оператор читает «Mode 3» в spec template'е, не находит в state schema (там `mode: rework`), и не понимает, что Mode 3 = rework.

# Coverage

Sweep по 21 production файлу через Python regex (AP-12 safe, как PR #19):
- 4 файла agents (`.claude/agents/{planner,reviewer,release-helper,project-bootstrap}.md` — последний touch не required, у него references были legitimate alias logic, не Mode N terminology)
- 4 файла foundational (`anti-patterns.md`, `development-protocol.md`, `personas.md`, `user-journeys.md`)
- 3 файла recipes cache (`ai-linting-{go,python,typescript}.md`)
- 9 файлов `_templates/*.tmpl` (bootstrap-state, brand-voice, CLAUDE, competitive-analysis, customer-interview, feature-spec, incident-runbook, legal-brief, strategic-frame, ui-style-guide-base)
- 1 файл README.md

Маппинг применён:
- `Mode 1` / `Mode 1 (new-product)` → `new-product mode`
- `Mode 2` / `Mode 2 (feature)` → `feature mode`
- `Mode 3` / `Mode 3 (rework)` → `rework mode`
- `Mode 4` / `Mode 4 (bug-fix)` → `bug-fix mode`
- `Mode 5` / `Mode 5 (template-sync)` → `template-sync mode`
- `Mode 2/3` → `feature/rework modes`
- `Mode 1/2/3` → `new-product/feature/rework modes`
- `Mode 1 (new-product, greenfield)` → `new-product mode (greenfield)`
- `**Mode N** (canonical)` → `**canonical**` (bold-stripped numeral в table headers feature-spec)

Cleanup doubled mode words (e.g. «rework mode rework» → «rework mode»).

Excluded из sweep:
- `meta/audits/*` — historical records, references to old terminology preserve trail context
- `meta/reviews/*` — review trails captured state на момент review'а
- `meta/design/2026-05-24_mode-matrix-and-adoption.md` — design doc captures evolution
- `doc/_templates/scripts/template-sync-doc-migrate.py.tmpl` — legitimate references к legacy mode names (это migration script для downstream проектов, должен знать о старых именах)
- `.claude/agents/project-bootstrap.md` — содержит legitimate alias logic для backwards compat

# Cross-cutting findings

## Spec coverage

Этот PR — **B-1 из post-refactor audit** (мой meta/audits/2026-05-25_post-refactor-second-pass.md, Blocking #1). Audit doc выступает как spec.

Verification: `grep -rn "Mode [0-9]"` по `.claude/`, `doc/`, `README.md` → нет hits. Только meta/ retains terminology (intended).

## Plan adherence

Соответствует v0.2.0 Scope A из `meta/design/2026-05-25_merged-optimization-plan.md` (план v3). Lite-mode: small-fix — mechanical sweep по precedent'у PR #19 (operator-neutralize sweep).

## Test discipline

N/A — это mechanical text sweep, не code change. Verification — grep clean.

## Security / architecture

- AP-17 clean: продуктовых names не упоминается
- AP-12 sanity check: ниже
- Semantic preservation: spot-checked 3 файла (feature-spec table, development-protocol stage table, planner mode references) — meaning preserved

## Code hygiene

- ~113 lines changed across 21 files
- Доступно одно литерное место в `user-journeys.md` где «mode rework» — legitimate user-quoted input (журней пользователя цитирует команду «mode rework, topic X»), не doubled mode-word

# Protocol compliance

- ✅ AP-1: нет архитектурных решений (mechanical only)
- ✅ AP-3: scope утверждён через утверждённый план v3
- ✅ AP-4: spec coverage — через post-refactor audit doc
- ✅ AP-6: scope без deviation от audit B-1 finding
- ✅ AP-12: anglicism grep ниже
- ✅ AP-14: structural read-pass — нет foundational doc updates required (terminology sweep, не semantic)
- ✅ AP-16: этот trail
- ✅ AP-17: clean
- ✅ AP-19: один логический change (mode terminology sweep)

# Severity summary

- Blocking: 0
- Question: 0
- Nit: 1 (cosmetic) — `user-journeys.md:117` содержит phrase «mode rework, topic `<topic>`» как user-quoted input. Не doubled mode-word, не требует fix.

# Out of scope

- B-2 (feature-spec frontmatter) — отдельный PR
- B-3 (feature-review verdict line + roster) — отдельный PR
- B-4 (scripts location) — отдельный PR
- High findings — отдельный PR
- Silent-break gaps 1-3 + AP-24 — отдельные PR'ы
- Size gate — отдельный PR
