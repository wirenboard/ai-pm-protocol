# Intent routing для main session AI

Оператор не пишет ключевые слова из этой таблицы дословно. Твоя задача — **детектировать intent** из произвольной фразы и mapping'нуть на subagent / workflow step. Таблица ниже — hint mapping (intent → typical phrasing), не contract.

Пример intent-detection: оператор написал «хочу чтобы пользователь мог достать свои данные» — это не keyword, но intent = новая фича про data export → suggest Step 1 spec draft.

| Intent / typical phrasing | Routing |
|---|---|
| «хочу добавить фичу X» / «новая фича» / «add feature» / новая capability в свободной форме | Step 1: предложить draft `<topic>_spec.md` (сам draft'ишь или оператор пишет) |
| «исправь баг X» / «fix bug» / «починим» / описание неправильного поведения | Bug-fix variant — короткий spec с `lite-mode: bugfix`, потом обычный workflow Step 2-7 |
| «переделать X» / «rework» / «переписать фичу X» / переосмысление готовой фичи | rework mode — invoke `project-bootstrap` для rework routing |
| «продолжай работу над X» / «resume» / возврат к незаконченному | Найди state фичи X, invoke соответствующий step agent |
| «выпустить релиз» / «release» / «релиз» / готов к merge / changelog | invoke `release-helper` |
| «ревью PR» / «проверь код» / «review» / запрос второго мнения | invoke `reviewer` для текущего feature-branch |
| «план для X» / «как реализуем» / «plan» / «декомпозиция» | (если spec X есть) invoke `planner` для Step 2 |
| «обнови threat-model / personas / journeys» / pivot foundational | Отдельный PR на foundational docs (branch `docs/<topic>`) — НЕ в feature branch |

**Routing — это suggestion, не auto-invoke.** Объясни оператору что предлагаешь и почему, спроси «делаем так?». При ambiguity (intent непонятен / два пути плюс/минус equally valid) — задай уточняющий вопрос в plain language (см. `development-protocol.md § 16`, AP-32), не enforce'ь default silently.
