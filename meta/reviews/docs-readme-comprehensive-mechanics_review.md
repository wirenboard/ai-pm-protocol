---
pr: TBD
branch: docs/readme-comprehensive-mechanics
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-24
trail_type: committed-review
spawned_agents: N/A (docs PR)
---

**Verdict:** approve

PM-feedback: «делаешь кусками, а надо сразу понятно и хорошо. зачем ридми? чтобы сразу понимать что за инструмент перед нами и какие механики есть». Плюс: «audits переедет в реальные проекты и будет там смущать».

# Coverage

## README — новая секция «Какие механики защищают качество»

- ✅ 4 категории fitness functions (code / architecture / spec / security) с примерами + source tools
- ✅ Conditional rulesets — фильтрация catalogue по capabilities
- ✅ Offline-first review enforcement (AP-16) — verdict-gate mechanic
- ✅ Specialized reviewers + primary router (AP-19 + AP-20) — ASCII diagram + worst case 2 spawns
- ✅ Composition matrices (ui_kind / db_kind) — multi-value example + AP-15/18 cross-ref
- ✅ Trust profile A/B/C — table с output template differences + hard floor

## README — обновлённая структура репо

- ✅ Уточнено что копируется в продукт (development-protocol / anti-patterns как overlay; _templates/ копируются)
- ✅ Уточнено что НЕ копируется (personas / user-journeys template'а самого)
- ✅ Добавлен `meta/` блок с пояснением
- ✅ Detailed listing _templates/ (ui-style-guide per kind, database-design per kind, scripts)
- ✅ Detailed listing .claude/agents/ (все 10 субагентов)

## Move audits + reviews → meta/

- ✅ `git mv doc/audits meta/audits` + `git mv doc/reviews meta/reviews`
- ✅ Создан `meta/README.md` с объяснением что это template-internal, не копируется в продукт
- ✅ Updated references:
  - `reviewer.md` 3 mentions → meta/reviews
  - `project-bootstrap.md` 1 mention → meta/reviews
  - `anti-patterns.md` 1 mention → meta/audits
- ✅ Final grep clean (нет refs на doc/reviews / doc/audits вне meta/)

# Protocol compliance

- ✅ AP-1: нет ADR
- ✅ AP-3: scope от PM directive
- ✅ AP-6: scope formalized
- ✅ AP-12: техтермы wrapped
- ✅ AP-16: этот trail в новом meta/reviews/
- ✅ AP-17: clean
- ✅ AP-19: mixed scope (README expansion + meta/ move) — оба часть «understanding template structure», semantically related
- ✅ AP-20: N/A

# Severity summary

- Blocking: 0
- Question: 0
- Nit: 0

# Backlog

- Comprehensive operator-neutralize sweep (task #59) — для agents prompts / tmpl файлов
- Update README modes (task #57) — после G-1/G-3 design'а добавить planned modes
