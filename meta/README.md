# meta/

Template-internal артефакты. **Не копируется в product** при bootstrap'е, не релевантны оператору в реальном проекте.

## Что здесь

- **`audits/`** — internal audit'ы логики самого шаблона (fitness for real-world dev, дубли, drift). Делаются периодически после крупных изменений. Историческая ценность — понимать evolution шаблона.
- **`reviews/`** — review trails для PR'ов в template repo (AP-16 compliance для self-development). Полезны как **примеры** правильно оформленного reviewer-trail — оператор может посмотреть, как это выглядит в реальности.

## Почему не в `doc/`

`doc/` в template repo содержит: (a) `_templates/*.tmpl` — копируется в продукт; (b) `development-protocol.md` / `anti-patterns.md` — копируется как project overlay; (c) `personas.md` / `user-journeys.md` — Stage A артефакты template'а **как продукта** (PM Persona A / Developer B/C).

`meta/` ясно отделяет **template-development meta** от **template content**. Если оператор смотрит в `.ai-pm/tooling/` (submodule mode), он сразу видит, что `meta/` — про template, а `doc/` — про шаблонные артефакты.

## Convention

При создании нового audit / review trail для PR'а в template repo:
- Audit doc → `meta/audits/YYYY-MM-DD_<topic>.md`
- Review trail → `meta/reviews/<branch>_review.md`

См. AP-16 в `doc/anti-patterns.md`.
