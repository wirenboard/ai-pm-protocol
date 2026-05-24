# Review: соответствие обещаний (README + personas + user-journeys) реальности template'а

**Дата:** 2026-05-24
**Scope:** проверка, делает ли проект то, что обещает оператору в operator-facing документах.
**Источники проверки:** `README.md`, `doc/personas.md`, `doc/user-journeys.md` vs `.claude/agents/project-bootstrap.md`, `doc/_templates/bootstrap-state.md.tmpl`, `doc/_templates/scripts/*`, `.claude/agents/discipline-advisor.md`, `doc/_templates/positioning.md.tmpl`, `doc/_templates/ui-style-guide-base.md.tmpl`.
**Methodology:** read-only сверка; ни один файл не модифицирован.

---

## Findings

### F-1 — Init-вопросы не сходятся между документами и реальным агентом

Три operator-facing документа описывают три **разных** набора init-вопросов, и ни один не совпадает с тем, что задаёт `project-bootstrap`.

| Источник | Заявленные вопросы |
|---|---|
| `README.md:271` | Mode + Trust profile + **Advisor preset** (integration auto-detected) |
| `doc/personas.md:181` | Mode + **Integration** + **Advisor preset** |
| `doc/user-journeys.md:24-26` (шаги 5-8) | Mode + **Integration** + Trust profile + **Advisor preset** |
| **Реально в `.claude/agents/project-bootstrap.md:42, 113, 144, 161`** | Mode + **primary_language** + Trust profile |

Детали:

- **`advisor_preset` нигде не запрашивается.** Поле есть в `bootstrap-state.md.tmpl:97`, preset упоминается в `discipline-advisor.md` как факт — но `project-bootstrap.md` ни разу не содержит слова "advisor". Значение остаётся как pipe-separated options = unfilled (нарушает AP-9).
- **`primary_language`** реально спрашивается (`project-bootstrap.md:42, 60-66`) и важен (определяет язык артефактов, AP-12 переводы), но в README / personas / user-journeys не упомянут вообще.
- **`integration`** в `personas.md:181` и `user-journeys.md:25` (шаг 6) подан как операторский вопрос, но `project-bootstrap.md:44-51` явно говорит "Integration mode НЕ спрашивается" — детектируется через `[ -L .ai-pm/tooling ]` heuristic. README здесь корректен.

**Эффект на personas:**
- Persona A (PM, доверяет процессу) сталкивается с фантомным вопросом advisor_preset / неожиданным primary_language → подрыв первого впечатления — самый дорогой dropout (см. critical drop-off п. 4 в user-journeys.md:58 «agent задаёт > 3 вопроса per artifact → cognitive load»).
- Persona B / C получают «не такой» onboarding относительно ожидаемого по docs.

**Что делать:**
- Переписать `personas.md:181` resolved decision 1: убрать "Integration" и "Advisor preset" из списка init-вопросов, добавить "primary_language".
- Переписать `user-journeys.md` шаги 5-8 Journey 1 на реальный набор: Mode → primary_language → Trust profile. Убрать step 6 (Integration question) и step 8 (Advisor preset).
- `README.md:271` — убрать "Advisor preset" из init-вопросов; добавить "primary_language".
- ИЛИ альтернатива: реально подключить `advisor_preset` вопрос в `project-bootstrap.md` (если решение — оставить advisor opt-in via init).

---

### F-2 — Значения `integration` рассинхронизированы между схемой state, агентом и README

| Источник | Значения |
|---|---|
| `doc/_templates/bootstrap-state.md.tmpl:23` | `gitignore \| submodule \| vendor` |
| `.claude/agents/project-bootstrap.md:47-50` (detection) | `symlink \| submodule \| vendor` |
| `README.md` Setup (Варианты A/B/C) | `submodule \| symlink \| vendor` |
| `doc/user-journeys.md:25` (шаг 6) | `gitignore / submodule / vendor` |

`gitignore` ≠ `symlink` — это разные сущности. Если оператор реально подключил template как symlink, agent запишет `integration: symlink`, но enum в template state'а это значение не предусматривает → schema violation либо тихая интерпретация «gitignore».

**Что делать:**
- Решить single source of truth (рекомендация: `symlink | submodule | vendor` per agent detection logic — наиболее точное отражение реальности).
- Привести `bootstrap-state.md.tmpl:23` и `user-journeys.md:25` к этому набору.
- ИЛИ если `gitignore` — это реально отдельная категория (например, «vendored но в .gitignore»), формализовать её в agent detection и описать в README.

---

### F-3 — `discipline-advisor` существует, но не invoke'ится из bootstrap-agent

`README.md:320` описывает advisor как «opt-in пока PoC accuracy gate ≥80% per axis не достигнут — после validation mandatory в Stage F triggers». Commit `434d08c` (feat(v0.4.0): advisor invocation hooks + PoC accuracy protocol + CHANGELOG (PR2)) обещает invocation hooks.

Реальность:
- `.claude/agents/project-bootstrap.md` не содержит ни одного упоминания «advisor» / «discipline-advisor» → bootstrap-agent advisor не вызывает.
- `doc/user-journeys.md:85` (Journey 2 шаг 7), `:129` (Journey 3 шаг 6) описывают invocation как «Опционально (v0.4.0+): invoke `discipline-advisor`» — но это описание возможности, не trigger в planner / coder prompt'ах.

Promise vs reality: advisor агент **присутствует физически** (файл `.claude/agents/discipline-advisor.md`), но **никакой subagent его не зовёт автоматически**. «Opt-in» в текущем виде = «доступен по имени, оператор сам вспоминает позвать».

**Operator directive:** advisor должен работать **без вариантов opt-in/opt-out**. «Описать как manual invocation only» — отвергнуто как деградация обещания, а не fix.

**Что делать (mandatory, не вариант):**
1. Подключить advisor invocation hook'и в `project-bootstrap.md`:
   - На Init (Greenfield + все 3 legacy choices) — advisor сканирует capabilities и **сам устанавливает** `advisor_preset` в state (см. `discipline-advisor.md:65` — переписать «Suggest advisor_preset value» → «Set advisor_preset based on detected complexity»).
   - На каждый mode switch / новую фичу — advisor проверяет skip_eligibility per artifact.
2. Подключить advisor в `planner.md` (Step 2 plan): scope-proportionality check **mandatory**, не optional.
3. Подключить advisor в `coder.md` (Step 4 implementation gate): regression risk check **mandatory**.
4. Переписать `doc/user-journeys.md:85, 129`: «Опционально (v0.4.0+)» → «Mandatory: invoke `discipline-advisor`».
5. Переписать `README.md:320`: убрать «Opt-in пока PoC accuracy gate ≥80% per axis не достигнут — после validation mandatory» → «Mandatory во всех modes; PoC accuracy protocol работает параллельно как continuous validation, не как gating opt-in».
6. PoC accuracy protocol (`meta/experiments/2026-05-25_advisor-poc-accuracy-protocol.md`) **не блокирует** wiring — protocol измеряет точность, advisor работает.

**Связь с F-1:** при mandatory advisor `advisor_preset` устанавливается агентом без operator question → этот вопрос **не нужно** добавлять в init flow. F-1 fix-направление: Mode + primary_language + Trust profile (без advisor_preset как user-facing вопроса).

---

### F-4 — Отношение standalone-файлов и folded-секций не задокументировано

`README.md:29` Stage A список упоминает только `positioning.md` и `ui-style-guide-base.md`, описывая их как содержащие competitive landscape (§ 1) и brand voice (§ 2). `doc/user-journeys.md:28` шаг 10 — то же самое.

Реальность: в `doc/_templates/` существуют **standalone** артефакты:
- `brand-voice.md.tmpl` — на него **явно ссылается** `ui-style-guide-base.md.tmpl:69` («Текст в UI / API messages / CLI output соответствует `doc/brand-voice.md`»). § 2 в ui-style-guide-base — это **правила применения** brand voice к UI-копии, не сам brand voice.
- `competitive-analysis.md.tmpl` — отдельный артефакт. `positioning.md.tmpl:35` упоминает «Competitive UX scan на Stage F per-feature» как **отдельную** секцию в spec'ах, и `§ 1 competitive landscape` в positioning — это lighter snapshot, не глубокий анализ.

Эти standalone-файлы **нужны проекту** — это не stale leftovers. Проблема: README + user-journeys их **не упоминают**, поэтому:
- Оператор по README не поймёт, что Stage A артефактов больше двух.
- Bootstrap-agent (если копирует все `_templates/*.tmpl`) сгенерирует файлы, которые оператор не ожидал.
- Непонятна workflow последовательность: что пишется первым — `brand-voice.md` или § 2 ui-style-guide-base, ссылающаяся на него? Что между `competitive-analysis.md` (deep) / `positioning.md` § 1 (light snapshot) / per-feature Stage F competitive UX scan?

**Что делать:**
1. Дополнить `README.md:29` Stage A список: явно перечислить `brand-voice.md`, `competitive-analysis.md`. Описать роль каждого vs folded-секций в positioning / ui-style-guide-base.
2. Обновить `doc/user-journeys.md:28` шаг 10 Journey 1: показать порядок создания — competitive-analysis → positioning § 1 (derived snapshot) → brand-voice → ui-style-guide-base § 2 (applies brand voice к UI rules) → per-kind ui-style-guide.
3. В `positioning.md.tmpl:9-20` явно сослаться на `competitive-analysis.md` как source для § 1 (сейчас § 1 «делается один раз при bootstrap'е» — не сказано, что это extract из competitive-analysis.md).
4. В `ui-style-guide-base.md.tmpl:83` (начало § 2) явно сослаться на `brand-voice.md` как source.
5. В `personas.md` ничего менять не надо (там этот axis не обсуждается).

---

### F-5 — Journey 1 шаг 8 (Advisor preset question) — фантомный

`doc/user-journeys.md:26` шаг 8: «Bootstrap-agent: "Advisor preset? full / standard / minimal" (v0.4.0+, default standard для new-product)».

В `project-bootstrap.md` это вопрос не задаётся (см. F-1). Оператор по journey ждёт четвёртого вопроса, который не приходит.

**Что делать:**
- Удалить шаг 8 из Journey 1 (если решено advisor preset не спрашивать на init — F-1 option A).
- Или добавить вопрос в `project-bootstrap.md` (F-1 option B).

---

### F-6 — Journey 1 шаг 6 (Integration question) — фантомный

`doc/user-journeys.md:25` шаг 6: «Bootstrap-agent: "Integration mode? gitignore / submodule / vendor" (default gitignore)».

`project-bootstrap.md:44` явно: "Integration mode НЕ спрашивается. К моменту запуска bootstrap-agent'а template уже подключён в `.ai-pm/tooling/` (symlink / submodule / vendor — выбрано в pre-bootstrap setup). Bootstrap-agent detects."

**Что делать:**
- Удалить шаг 6 из Journey 1.
- Или (если decision такой) сделать integration реально operator-facing question; но это противоречит README setup-секции, где integration выбирается оператором **до** запуска `claude` (через выбор `git submodule add` / `ln -s` / `cp -r`).

---

### F-7 — Journey 1 не упоминает primary_language question (реально задаваемый)

`project-bootstrap.md:42` задаёт 3 вопроса, второй из которых — primary_language (`project-bootstrap.md:60-66`). Влияет на язык всех artifact'ов (AP-12: AI переводит общие англицизмы, established техтермины оставляет).

`doc/user-journeys.md` Journey 1 шаги 5-8 этот вопрос не упоминают. Оператор сталкивается с «дополнительным» вопросом, который не описан в expectation-документе.

**Что делать:**
- Добавить шаг в Journey 1 между Mode и Trust profile: «Primary language? ru / en / other (default ru)».
- Аналогично — в Journey 6 (legacy adoption) для каждого из 3 choices (`project-bootstrap.md:113, 144, 161` — все три choices задают primary_language).

---

### F-8 — `personas.md:181` resolved decision 1 содержит фактическую ошибку

Текст: «Trust profile устанавливается explicitly на init через bootstrap-agent (один из init-вопросов вместе с **Mode + Integration + Advisor preset (v0.4.0+)**).»

Ошибки:
1. Integration не спрашивается (см. F-6).
2. Advisor preset не спрашивается (см. F-5).
3. Не упомянут primary_language, который реально задаётся (см. F-7).

**Что делать:**
- Переписать: «один из init-вопросов вместе с Mode + primary_language».
- Если решено возвращать advisor_preset как init-вопрос (F-1 option B / F-3 option 1) — упомянуть здесь же.

---

### F-9 — `README.md:271` — частичная ошибка в init-вопросах

Текст: «Спросит Mode + Trust profile + Advisor preset … Integration mode — детектируется automatically.»

- Integration auto-detected — **верно**.
- Advisor preset — **не спрашивается** (см. F-5).
- primary_language — **не упомянут**, хотя реально задаётся (см. F-7).

**Что делать:**
- Заменить "Advisor preset" на "primary_language" (если F-1 option A).
- Или добавить advisor preset реально в `project-bootstrap.md` (если F-1 option B).

---

### F-10 — `user-journeys.md` Journey 6 (legacy adoption) — несколько фактических точек проверки

`project-bootstrap.md:113, 144, 161` показывает: все 3 legacy choices задают как минимум trust_profile + primary_language; Quick / Manual также задают Mode (default `feature`).

`user-journeys.md` Journey 6 не упоминает ни primary_language, ни конкретный набор задаваемых вопросов в каждом choice. Шаги 5a/5b/5c описывают только outcome, не вопросы.

**Что делать:**
- Добавить в каждый choice (5a/5b/5c) явный список реально задаваемых вопросов.
- Привязать к F-7 (primary_language везде должен присутствовать).

---

### F-11 — Несовпадение схемы integration в state с реальностью бьёт по `template-sync` mode

Journey 5 (`template-sync`) шаг 4 описывает «Schema migration … add fields с defaults preserve old behavior». Если current state file у legacy operator'а содержит `integration: symlink` (что agent **реально пишет** по detection logic), но template schema говорит `gitignore | submodule | vendor` — script `template-sync-doc-migrate.py` либо упадёт на validation, либо перепишет `symlink` на default `gitignore`, что некорректно отразит реальность.

**Что делать:**
- Привести schema (`bootstrap-state.md.tmpl:23`) к реальному enum (см. F-2).
- Добавить в `template-sync-doc-migrate.py.tmpl` миграцию для legacy `integration: gitignore` → `integration: symlink` (или naming clarification).
- Документировать в Journey 5 (template-sync), как обрабатывается schema mismatch на existing state файлах.

---

## Сводная таблица

| ID | Тип | Где обещано | Где сломано / отсутствует |
|---|---|---|---|
| F-1 | Inconsistency | README:271, personas:181, user-journeys:24-26 | project-bootstrap.md asks Mode+primary_language+Trust profile |
| F-2 | Schema mismatch | bootstrap-state.md.tmpl:23 | agent detection (project-bootstrap.md:47-50) + README setup section |
| F-3 | Missing implementation | README:320, commit 434d08c, user-journeys:85, 129 | project-bootstrap.md не invoke'ит advisor |
| F-4 | Stale artifacts | README:29, user-journeys:28 | brand-voice.md.tmpl + competitive-analysis.md.tmpl как standalone |
| F-5 | Phantom journey step | user-journeys:26 (шаг 8) | вопрос не задаётся |
| F-6 | Phantom journey step | user-journeys:25 (шаг 6) | вопрос не задаётся |
| F-7 | Missing journey step | user-journeys Journey 1 | primary_language реально задаётся, в journey его нет |
| F-8 | Factual error | personas:181 | 3 фактические ошибки в одном предложении |
| F-9 | Factual error | README:271 | advisor preset не спрашивается + primary_language пропущен |
| F-10 | Missing detail | user-journeys Journey 6 | 3 legacy choices без явного списка задаваемых вопросов |
| F-11 | Migration risk | user-journeys Journey 5 | template-sync встретит schema mismatch на real state файлах |

---

## Что соответствует обещаниям (для контекста)

Чтобы review не звучал как «всё сломано» — основная архитектура реализована:

- Stage A→F flow, 5 modes, 3 personas, Trust profiles A/B/C, lite-mode hierarchy, AP catalogue (AP-1..AP-24), 5-layer enforcement — все описания в README / personas соответствуют файлам в `.claude/agents/` и `doc/_templates/`.
- Scripts существуют в `doc/_templates/scripts/`: `bootstrap-verify.sh.tmpl`, `check-spec-discipline.sh.tmpl`, `check-pr-has-review.sh.tmpl`, `check-spec-precondition.sh.tmpl`, `check-git-safety.sh.tmpl`, `install-git-hooks.sh.tmpl`, `template-sync-doc-migrate.py.tmpl`, `promote-foundation.py.tmpl`, `update-bootstrap-state.sh.tmpl`, + `auto-extract/*` (stack, ui-kind, db-kind, topology, database-design, ui-style, extract-all).
- 6 reviewer-agents (primary + protocol-compliance + backend + frontend + design + database) — все в `.claude/agents/`.
- Stage E «1 checkpoint = bootstrap-verify.sh passed» (README:32) — `bootstrap-verify.sh.tmpl` существует.
- Legacy 3-choice (Quick / Staged / Skip) — описание в README и реальная routine в `project-bootstrap.md:99-176` совпадают.
- Tier framework (0..3): README таблица соответствует agent routines (`project-bootstrap.md` § Tier 0 routine, mini-research integration, promote-foundation.py).
- Composition matrices (ui_kind / db_kind) — реально enforced через скрипты и state schema (`bootstrap-state.md.tmpl:73-86`).

---

## Замечание о scope

Это review **operator-facing промисов vs реализация субагентов и шаблонов**. Не покрыто:
- Качество самих subagent prompt'ов (длина, ясность, edge cases) — отдельный axis.
- Соответствие AP-каталога реальному CI gate coverage — проверяется отдельно через `silent-break-gaps` audit pattern.
- Tier 0 auto-extract — точность heuristics против реальных репо (требует empirical testing).
- discipline-advisor PoC accuracy — отдельный validation (см. `meta/experiments/2026-05-25_advisor-poc-accuracy-protocol.md`).
