# Reviewer domain: Design

Применяется для PR'ов с design changes (mockups, copy updates, UX flow changes, ui-style-guide-* updates) или когда detected как relevant для domain. Проверяет 8 принципов из `ui-style-guide-base.md`, brand voice в copy, эффективность пути (2-4 действия), confirm vs undo discipline.

## Ground truth (для design section)

- `<doc_root>/features/<topic>_spec.md` — User scenarios, copy snippets в spec'е, mockups attached если есть
- `<doc_root>/ui-style-guide-base.md` — 8 фундаментальных принципов + brand voice + i18n discipline
- `<doc_root>/ui-style-guide-<kind>.md` — per-kind UX patterns (если PR touches specific kind)
- `<doc_root>/brand-voice.md` — tone of voice, copy patterns
- `<doc_root>/personas.md` — кто пользователь, его context
- `<doc_root>/user-journeys.md` — какой шаг journey'я обслуживает фича
- Дизайн mockup'и / wireframes / copy если в diff'е
- UI components в diff'е — для UX semantics check (не для code quality, это Frontend domain section)

## Design checks

### 1. 8 фундаментальных принципов (ui-style-guide-base.md § 1.1)

Для каждого принципа — соответствует ли feature?

1. **Понятность** — название элемента / endpoint'а само объясняет что делает? Tooltip — переписать название. Имена из user mental model, не из БД схемы / API conventions.

2. **Отзывчивость** — UI не «замерзает». Любое действие > 200ms — фоновое с прогрессом. На любое действие — видимый отклик.

3. **Реактивность** — состояние обновляется автоматически при изменении внешних данных. Не требует ручного refresh'а.

4. **Современный UX-паттерн** — настройки instant-apply (auto-apply без «Сохранить» где безопасно). Notion / Linear / iOS Settings паттерн.

5. **Адаптивность** — функциональная адаптация per device size (не только стили). Mobile reformat (таблица → карточки, sidebar → hamburger).

6. **Доступность** — WCAG AA для обеих тем. Screen reader / keyboard / reduced motion. Цвет не единственный носитель.

7. **Brand voice** — текст соответствует `doc/brand-voice.md`. Tone consistent, vocabulary unified, no marketing-speak / canned language.

8. **Эффективность пути** — 2-4 действия (клика / команды / API вызова) для типичной user task. Если требуется больше — symptom (нужна bulk operation, переосмысление flow, smart defaults).

Каждое нарушение — finding с конкретным principle reference + UX impact.

### 2. Эффективность пути (детально)

Trace user flow для каждой scenario из spec'а:

- Сколько действий от entry point до завершения task'а?
- 2-4 — норма
- 5-7 — alt scenarios (advanced features)
- > 10 — `[blocking]` finding: redesign flow

**Техники сокращения** (recommend если применимо):
- Smart defaults (pre-fill from context)
- Inline editing вместо modal'ов
- Bulk actions (one operation на N items)
- Skip prompts через `--yes` (CLI) / instant-apply (UI)
- Keyboard shortcuts для power users
- One-step вместо wizard'а где возможно

**Anti-patterns** (`[blocking]` если найдены):
- Burying common actions в menus / submenus
- Force re-entry форм после errors
- Multi-step confirms для non-destructive actions
- Modal в modal (recursion of overlays)

### 3. Copy + brand voice

Каждая user-facing string проверяется vs `brand-voice.md`:

- **Tone consistent** (warm / professional / playful / etc. per brand)
- **Vocabulary** unified (одно слово для одного понятия — не «отправить» / «послать» / «доставить» взаимозаменяемо)
- **No marketing-speak** («революционный» / «прорывной» / «лучший в индустрии» — `[blocking]` если product не для маркетинга)
- **No canned-language** («Что-то пошло не так» — `[blocking]`, требуется specific message)
- **Positive framing** где возможно («доступно при условии X» вместо «нельзя»)
- **i18n-ready** (см. base.md § 3) — все strings через i18n, никаких hardcoded

### 4. Confirm vs undo discipline

**Confirm обязателен для:**
- Действия которые ломают / отменяют обязательства продукта (доставка, regular triggers, scheduled actions)
- Transactional с деньгами
- Окончательное удаление после soft-delete period
- Юридические подтверждения
- Security credentials change (пароль, 2FA)

**Undo достаточно для:**
- Toggle настроек (instant-apply)
- Edit content (auto-save + version history)
- Archive / unarchive
- Идемпотентные actions (copy, share, mark as read)

**Anti-patterns:**
- Confirm для toggle / edit (over-cautious, friction) — `[blocking]`
- Undo для destructive actions без soft-delete safety net (irreversible loss risk) — `[blocking]`
- Generic «Are you sure?» без последствий в формулировке — `[question]` rewrite

**Формулировка confirmation:**
- Конкретная: «Удалить X? Y **не получит** Z. Восстановить можно в течение N дней через настройки.»
- Не «Вы уверены?»

### 5. Error messages

- Конкретные actionable («Неверный пароль. [Восстановить] ниже» вместо «Ошибка»)
- Three parts: что произошло → почему → что делать
- In-place primary, toast — fallback (только когда in-place физически невозможен)
- Не toast для критических confirmations / errors

### 6. Адаптивность mockup'ов / scenarios

Если spec describes UI:
- Описаны **обе формы** (desktop + mobile reformat)?
- Functional adaptation, не только resize?
- Touch vs hover patterns?

### 7. Visual hierarchy + information density

- Primary action visually distinguishable (color + size + position)?
- Information density appropriate per kind (минимальная для embedded / mobile; richer для desktop)?
- F-pattern / Z-pattern reading flow respected (для web/desktop где applicable)?
- Не пытается втиснуть desktop UI в mobile / watch (embedded particularly)?

### 8. Localization-aware design

- UI tolerate +30-50% string length (русский / немецкий)?
- RTL languages structural prep (`start` / `end` вместо `left` / `right`)?
- Date / number / currency через locale APIs?
- Sorting locale-aware (Intl.Collator / native)?

## Design severity tags

- **`[blocking]`** — accessibility nightmare (color-only signal, modal recursion), efficiency > 10 steps без alternative path, generic «Что-то пошло не так» errors, confirm для toggle / undo для irreversible destruction
- **`[question]`** — borderline (e.g. 5-step flow possibly justified — recommend simplification но не блокирует)
- **`[nit]`** — copy phrasing tweaks, minor brand voice deviations
