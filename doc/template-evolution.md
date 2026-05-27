---
status: maintained
artifact: template-evolution-cheatsheet
audience: AI agent driving template-sync для downstream продукта
---

# Template evolution cheat sheet

**Назначение:** навигационная карта для agent'а, выполняющего `template-sync` в downstream продукте. Per-version резюме breaking changes / fold'ов / split'ов / renames. **Не дублирует** CHANGELOG.md — указывает куда смотреть и что искать.

**Как использовать (agent):**
1. Прочитай `.ai-pm/.bootstrap-state.md` → `template_version_applied` (pinned)
2. Прочитай ниже секции **после** pinned версии до target (HEAD main)
3. Для каждой версии — детали в `CHANGELOG.md` (ссылки в каждой секции)
4. Применяй inspection-before-regenerate discipline (не blindly копируй scripts/templates — могут быть silent break'и)

**Baseline:** история до v0.9.0 не отслеживается. Downstream products, pinned < v0.9.0 — запусти fresh bootstrap (bootstrap-template-sync предложит re-bootstrap как опцию для pre-v0.8.0 baseline).

---

<!-- Версии появятся здесь по мере выхода breaking changes -->

---

## Inspection-before-regenerate discipline (general)

Перед копированием `_templates/scripts/*.tmpl` → `product scripts/`:
1. Сравни interface — какой input ожидает script (env vars / argv / JSON stdin)
2. Проверь exit codes — exit 0/1/2 semantics
3. Сделай smoke-test — вызови с sample input, убедись что block/allow корректные
4. Только потом replace

Особенно важно для **hook scripts** — silent break == молча выключенная защита.

---

## Multi-version jump strategy

Если product pinned на vX.Y, target — current HEAD main:
1. Apply vX.Y+1 changes — commit
2. Apply vX.Y+2 changes — commit
3. ...до target

**Логические PR'ы:** split по concern'ам (infrastructure → schema → docs → Stage A artifacts), не один мега-PR.

**`adoption_overrides` (AP-22):** если изменения intentionally skip'аются — задекларируй в `.bootstrap-state.md` `adoption_overrides:` с `reason` + `accepted-risk` + `expires_at` (default 180 days).
