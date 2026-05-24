---
pr: TBD
branch: feat/check-pr-ordering
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-24
trail_type: committed-review
spawned_agents: N/A (lite-mode docs/script PR)
---

**Verdict:** approve

Addresses audit finding [H-1]. Conflict prone с PR #14 (оба меняют `check-spec-discipline.sh.tmpl` + § 9.1 catalogue) — rebase после merge #14.

# Cross-cutting findings

## Spec coverage

Scope formalized через audit [H-1] и proposed правка:

- ✅ `check_pr_ordering_for_multi_domain()` функция добавлена в скрипт
- ✅ Multi-domain detection через regex по indicator'ам: schema / API / UI
- ✅ Catalogue entry `pr-ordering-for-multi-domain` добавлен в § 9.1
- ✅ Planner.md «Multi-domain checklist» добавлен с явным «stop + AskUserQuestion» behavior
- ✅ feature-spec.md.tmpl уточнён: `pr_ordering` обязателен для multi-domain (было «опционально»)

## Plan adherence

Plan formal не оформлен. Изменения соответствуют finding [H-1]: enforce pr_ordering на Step 2, не Step 4.

## Test discipline

Edge cases manually reviewed:
- ✅ Single-domain spec (только UI компонент) → 1 domain, skip check
- ✅ Schema-only spec (миграция) → 1 domain, skip check
- ✅ Schema + API spec (backend feature) → 2 domains, требует pr_ordering
- ✅ Full-stack (schema + API + UI) → 3 domains, требует pr_ordering
- ✅ `lite-mode: bugfix` / `small-fix` → skip (обычно single-domain)
- ✅ Frontmatter content включается в indicator regex'ы? — NO, awk извлекает body после второго `---`. Корректно.

## Security / architecture

- ✅ Backwards compat: existing multi-domain spec'и без `pr_ordering` начнут fail'ить — сознательное breaking change (как B-1). Стыкуется с G-1 template-apply mode (нужен update existing specs при template bump).

## Code hygiene

- ✅ Function structure consistent с existing checks
- ✅ Detection regex'ы покрывают russian + english (схема / schema, API / endpoint / контракт, UI / форм)
- ✅ Catalogue table entry follows established format

# Protocol compliance

- ✅ AP-1: нет ADR
- ✅ AP-3: scope от audit finding, явно
- ✅ AP-6: scope formalized
- ✅ AP-12: русские термы используются вместе с established techterms
- ✅ AP-16: этот файл — trail
- ✅ AP-17: clean
- ✅ AP-19: PR atomic (один scope = enforce pr_ordering)
- ✅ AP-20: N/A

# Severity summary

- Blocking: 0
- Question: 0
- Nit: 0

# Backlog после merge

- Rebase после PR #14 merge (общий файл `check-spec-discipline.sh.tmpl`)
- Task #59 — comprehensive operator-neutralize sweep (PM raised: «весь проект на запахи PM-центричности»)
- Task #53 H-2 — spec versioning (next)
- Task #54 H-3 — Competitive UX criteria (next)
