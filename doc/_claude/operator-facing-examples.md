# Operator-facing examples — terse/verbose pairs per agent

Каждый agent при escalation использует эту форму. Полные правила — `development-protocol.md § 16`, AP-32.

5 pairs (по одной на logical agent: planner / coder / reviewer / release-helper / project-bootstrap). Pattern: **Jargon (запрещено)** → **Plain (правильно)** + краткое **Почему**.

---

### planner escalation example

**Jargon (запрещено):**

> AP-25 fork в `<topic>_spec.md`: рассматриваю alternative D (retention window), но в спеке этот fork не упомянут. Нужен `[source-bounded-override: <reason>]` или formal fork-justification через AskUserQuestion?

**Plain (правильно):**

> В плане появилось ограничение «храним export'ы 24 часа, потом удаляем» — спека этого не описывает, я это добавил исходя из логики (большие файлы = storage cost). Это допустимое решение, или хочешь обсудить срок хранения отдельно?

**Почему:** оператор не должен распарсивать AP-25 / spec_reference / override marker syntax. Вопрос реально про business-affecting decision (retention) — формулируется как business choice.

---

### coder escalation example

**Jargon (запрещено):**

> Step 4 implementation: spec говорит «email уникален», но Step 2 plan не определяет collation. Layer 1 source-bounded warn'ит. Применяю citext по умолчанию или нужен ADR?

**Plain (правильно):**

> Спека требует уникальный email. Хочу подтвердить — `Ivan@x.com` и `ivan@x.com` это **один и тот же** пользователь (case-insensitive), или **разные** (case-sensitive, как Linux)? От этого зависит будет ли пользователь с одной почтой регистрироваться дважды.

**Почему:** оператор не должен знать про citext / collation. Вопрос про observable behaviour — case-sensitivity email'а.

---

### reviewer escalation example

**Jargon (запрещено):**

> Step 7 review: coder violates AP-23 — modified existing test assertions (`toBe(100)` → `toBeGreaterThan(50)`). Нет ADR-NNNN ref и нет `[test-modify-override:]` marker. Request changes?

**Plain (правильно):**

> Coder ослабил один из тестов: раньше тест проверял «ровно 100 элементов в результате», теперь — «больше 50». Это значит фича стала более permissive. Это намеренно (тогда поправлю спеку чтобы зафиксировать новое поведение), или случайно (тогда возвращаем строгую проверку)?

**Почему:** оператор не должен знать про AP-23 / `[test-modify-override:]`. Описано через изменение поведения теста (что было / что стало) + предложение конкретных продолжений.

---

### release-helper escalation example

**Jargon (запрещено):**

> Release v0.7.0: changelog draft содержит F-04 + F-06, но F-06 spec frontmatter `merged: no`. AP-13 incident_impact: yes без CHANGELOG operational section. Bump до major?

**Plain (правильно):**

> Готовлю описание релиза. Одна из фич — «восстановление аккаунта через email» — формально ещё не закрыта (acceptance не подписан). Включаем её в этот релиз с пометкой «beta», или ждём подтверждения и выпускаем без неё?

**Почему:** оператор не должен распарсивать SemVer / AP-13 / merged frontmatter. Вопрос реально про business choice — релизим частично-готовое или нет.

---

### project-bootstrap escalation example (router-level)

**Jargon (запрещено):**

> Bootstrap routing: detected Stage A artifacts отсутствуют (`vision.md`, `positioning.md`). foundation_completeness=none. Запускать `bootstrap-greenfield` subagent или `bootstrap-legacy` (если existing code)?

**Plain (правильно):**

> Вижу что в проекте ещё нет описания «зачем продукт нужен пользователю» и «кому продаём». Это новый проект с нуля (тогда начнём с базовых документов: видение, целевая аудитория), или существующий проект, который мы обвешиваем шаблоном поверх (тогда базовые документы пишем по тому, что уже есть)?

**Почему:** оператор не должен знать про Stage A / foundation_completeness / subagent names. Вопрос про реальную ситуацию — новый проект vs adopting existing.

---

## Edge case: technical term ДЕЙСТВИТЕЛЬНО нужен

Иногда без термина нельзя (e.g. compliance / regulation). Правило: **definition в 1 предложении на месте, до использования.**

- **OK:** «Используем server-side encryption — данные шифруются на сервере перед записью в storage. Это даст GDPR-compliance.»
- **NOT OK:** «Применил SSE-KMS, нужен KMS-key-policy?» — оператор не знает AWS terminology.
