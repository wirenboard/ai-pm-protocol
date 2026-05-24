---
pr: TBD
branch: docs/readme-operator-neutral
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-24
trail_type: committed-review
spawned_agents: N/A (docs-only README rewrite; AP-19 docs PR exception)
---

**Verdict:** approve

Docs-only README rewrite. Закрывает PM-feedback «в ридми шаблона опять один PM везде» + «стадии непонятно расписаны» + «дублировать не надо, но надо понятно чтобы прочитал ридми и было ясно что как и зачем».

# Cross-cutting findings

## Structural consistency (AP-14)

N/A — docs PR в template repo, не product feature. Никаких journey / threat / scope / topology updates не требуется.

## Spec coverage

Spec не оформлен формальным `<topic>_spec.md` — это lite-mode docs PR. Scope formalized через PM chat directives:

1. «в ридми шаблона опять один PM везде, анализ и переписать под реальность» — заменить PM-only терминологию на operator-aware
2. «ещё стадии непонятно расписаны расписать» — расписать шесть стадий
3. «дублировать не надо, но надо понятно» — консолидировать дубликаты

Все три закрыты:

- ✅ PM→оператор где роль абстрактная (10 мест), сохранено в convention из `anti-patterns.md` AP-16 («PM на Trust A / developer на B/C — далее оператор»)
- ✅ Добавлена единая таблица стадий с колонками: Что закрываем / Ключевые артефакты / Mode 1 / Mode 2-3
- ✅ Добавлен раздел «Порядок не произвольный» с обоснованием A→F
- ✅ Composition matrices (ui_kind / db_kind multi-value) сохранены как notes под таблицей
- ✅ Удалены три дубликата: «Идея в одном абзаце», «Как использовать (v0 vision)», «Foundational artefacts (Stage A-D)»

## Plan adherence

Plan formal не оформлен (docs lite-mode). Реализация соответствует PM directives.

## Test discipline

N/A — README, не код.

## Security / architecture

- ✅ Никаких изменений в hooks / scripts / settings
- ✅ AP-17 (product-name leak): grep clean — нет упоминаний HeartVault / Vault / product-specific терминов
- ✅ Backwards compat: secret URLs, anchors не поломаны (нет внешних страниц на старые секции; статус v0 draft означает README ещё не cited извне)

## Code hygiene

- ✅ 230 строк (было 270 до правок, прирост таблицы стадий компенсирован удалением дубликатов)
- ✅ Сохранены все unique секции: Setup, Multi-layer, Anti-patterns, Subagents, Contributing, License
- ✅ Cross-refs работают (anti-patterns.md AP-1/AP-2/AP-3, development-protocol.md § 4-5, reviewer.md)

# Specialized findings

## Protocol compliance (sub-review self-check)

- ✅ AP-1 (ADR reactive only) — N/A docs PR
- ✅ AP-3 (operator-gate) — этот PR — docs-only, не требует Stage gate
- ✅ AP-6 (no silent deviation) — PM directives отражены 1:1
- ✅ AP-12 (anglicism discipline) — grep на untranslated англицизмы в prose показал только установленные техтермины (frontmatter, scope, fork, review, persona, journey, threat, deployment, rollback) — все из белого списка либо backtick-wrapped
- ✅ AP-13/14 — N/A docs PR
- ✅ AP-16 (review trail) — этот файл = trail
- ✅ AP-17 (product-name leak) — clean grep
- ✅ AP-18 — N/A docs PR
- ✅ AP-19 (per-PR atomicity) — docs PR exception (§ Допустимые исключения «docs/<topic>»)
- ✅ AP-20 — N/A docs PR

## Documentation findings (informal — design-reviewer аспект)

- ✅ Таблица стадий читается слева направо, колонки orthogonal
- ✅ «Что делает оператор» encapsulated в одном параграфе (не разбросано)
- ✅ «Порядок не произвольный» — выделен как отдельный paragraph, аргументирует каждый stage→stage переход
- ✅ Composition matrices — мини-secция с примерами для ui_kind / db_kind
- ✅ Anti-patterns section обновлён (AP-3 «operator-gate», добавлены AP-15..AP-20 уже были)
- ✅ Subagents section отражает текущую architecture (primary router + protocol-compliance + 4 domain reviewers)

## Architectural soundness

- ✅ README теперь reflects PM+Developer balance из task #44 (без откатов к старой PM-only терминологии)
- ✅ README теперь reflects specialized reviewers architecture из task #43 (primary router + protocol-compliance + 4 domain)
- ✅ README теперь reflects new foundational artefacts из tasks #41, #42, #44 (ui_kind, db_kind, dev-environment, refactor-playbook, dependency-policy)

# Consolidated severity summary

- Blocking: 0
- Question: 0
- Nit: 0

# Recommendations / backlog

После merge:
- **Task #47** (template logic audit) — проверить, что README claims действительно соответствуют состоянию подсистем (например, что `reviewer.md` действительно primary router; что `protocol-compliance-reviewer.md` действительно always-spawn в reviewer.md routine).
- **Task #48** (template-apply mode) — может потребовать дополнительной строки в README про «как обновлять template в downstream продукте, который отстал» (сейчас есть про submodule bump, но без слова про foundational artefacts diff).

## Что НЕ покрыто (deferred)

- Visual rendering на GitHub UI — local Markdown linter недоступен на template repo; check визуально после push'а PR
- README на английском — пока v0 русский primary, инвестиция в перевод преждевременна
