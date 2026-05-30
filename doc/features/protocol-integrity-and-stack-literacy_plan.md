# Protocol integrity and stack literacy — plan

## Context

Реальный кейс выявил три структурных пробела в шаблоне, которые вместе делают гарантии из README неисполнимыми:

1. **Stack literacy gap.** Маппинги/handler'ы пишутся «по памяти модели» против реальной документации стека. Pipeline зелёный, тесты (включая property-based) закрепляют спецификационно-запрещённые значения как часть контракта. Ни архитектура, ни план, ни coder, ни reviewer не отвечают за «соответствует ли использование стека его документации».

2. **Orchestrator discipline gap.** Когда фича на проде «не заработала», оркестратор лезет править файлы напрямую на устройстве. Это разрушает три гарантии шаблона разом: «код соответствует плану», «поведение не ломается», «docs не расходятся с кодом» — изменения происходят в обход git, без плана, без тестов, без review. PM не должен и не может это заметить.

3. **Categorical scope gap.** Когда фича упоминает категориальное понятие (тип, режим, роль, состояние, операция, категория), план тихо выбирает один элемент множества и игнорирует братьев — либо coder в ходе реализации деформирует semantics выбранного элемента, чтобы покрыть братский случай (разрешающий enum, опциональное поле «по умолчанию» переключающее поведение). Это категориальная ошибка: scope-решение принадлежит PM, а сделано молча агентом.

Все три пробела решаются связно: orchestrator discipline без stack literacy просто переносит ту же проблему в pipeline, stack literacy без orchestrator discipline обходится через прямую правку на проде, и оба не помогают если scope изначально молчаливо деформирован.

## Scenarios

1. **PM описывает интеграцию со сторонним стеком** (новая интеграция, новый протокол, новая внешняя платформа) → агенты автоматически собирают canonical sources, spec citations и native validators для затронутых компонентов → план учитывает требования стека → код проходит stack-specific gate в pipeline → reviewer ловит расхождения со спецификацией. **PM в этом не участвует — никаких вопросов про validation tools, схемы, идиомы.**

2. **PM говорит «на проде не работает X»** → оркестратор диагностирует read-only (ssh для логов, статусов, чтения файлов разрешено) → формулирует находки как продуктовое сообщение PM → возвращает исправление в pipeline под флагом hotfix → стандартный цикл plan → coder → reviewer → PR. **Прямые правки на устройстве запрещены для всего, что должно жить в git.**

3. **Через несколько фич в проекте появляются накопленные знания про стек** (квирки matter.js, особенности wb-mqtt-confed, MQTT topic conventions). Эти знания живут в `docs/stack-notes.md` и **обязательно** читаются plan-feature, coder и reviewer на каждой следующей фиче. Знания не теряются между сессиями.

4. **На новом проекте после ответов PM про стек** оркестратор автоматически запускает stack literacy onboarding для каждого компонента (язык, runtime, фреймворк, target platform, ключевые библиотеки). PM в этом тоже не участвует — он отвечает только продуктовые вопросы из `bootstrap.md`.

5. **PM запрашивает релиз** → если в pipeline происходило что-то нестандартное (попытка обхода, отвергнутый план), pr-prep это покажет PM продуктовым языком, не «merge всё подряд».

6. **PM описывает фичу с категориальным понятием** (упоминая один тип / режим / роль / состояние / операцию из домена) → plan-feature перед составлением плана задаёт PM один продуктовый вопрос: «упомянутое X — это один из <братьев>; включаем всех в этот план или фокусируемся на X а братьев — отдельно?». PM выбирает scope. План содержит явный Out of scope с перечислением братьев и причиной. Coder при встрече с братским кейсом останавливается и поднимает scope-вопрос, не растягивает выбранный элемент.

## Existing behaviors this feature touches

Существующие гарантии из README — каждая должна перестать быть маркетинговым обещанием и стать проверяемым свойством pipeline. Плюс две новые.

| # | Гарантия | Что нужно для исполнения после этого плана |
|---|---|---|
| 1 | Код соответствует плану | План обязан учитывать spec затронутого стека (новая секция «Stack expectations touched»). План без этой секции для фичи с external system — некомплектный. |
| 2 | Существующее поведение не ломается | Тесты, закрепляющие нарушение spec стека, считаются дефектом, а не контрактом. Reviewer dim «Stack expectations» это ловит. |
| 3 | Архитектурные ограничения соблюдаются | Ограничения = архитектура проекта **плюс** канон стека из `stack-notes.md`. Архитектор и coder обязаны проверять оба. |
| 4 | Безопасность | Без изменений. |
| 5 | Нет хардкода | Без изменений. |
| 6 | Код чистый | Без изменений. |
| 7 | Docs не расходятся с кодом | `stack-notes.md` рассматривается как docs. Рассинхрон кода и stack-notes — blocking. |
| 8 | Инфра соответствует архитектуре | Расширяется: не только «файл существует», но «доставляется к целевой платформе через её канонический канал и валидируется её native tool». |
| 9 | Backlog не теряется | Без изменений. |
| **10** (новая) | Все изменения проходят через pipeline | Оркестратор никогда не правит prod-файлы. Любое изменение кода / схемы / конфиг-шаблона / инфраструктуры — через plan-feature → coder → reviewer → pr-prep. |
| **11** (новая) | Код соответствует требованиям стека | Stack literacy фиксируется в `docs/stack-notes.md`, поддерживается, читается всеми агентами на каждом шаге. |
| **12** (новая) | Scope без тихой деформации | Категориальные понятия в плане явно выбраны как полное множество или один элемент. Coder не расширяет semantics выбранного элемента под братский случай. Reviewer блокирует маскировку братьев под выбранный элемент. |

## Key design decisions

**1. PM остаётся продуктовым.** Никаких новых вопросов про validation tools, конвенции платформы, schema конструкции. Всё это — забота агентов.

**2. Stack literacy живёт в репо как артефакт.** Файл `docs/stack-notes.md` — словарь по компонентам стека: canonical docs URL, цитаты spec, native validators, idioms / gotchas, дата последней ревизии. Артефакт версионируется в git, доезжает на прод вместе с кодом.

**3. Новый агент `stack-researcher`.** Read-only, WebSearch/WebFetch — единственный канал outward research. Запускается из `bootstrap` (после ответов PM про стек) и из `plan-feature` (когда фича касается компонента, которого ещё нет в stack-notes). Пишет / расширяет `stack-notes.md`. PM эту работу не видит.

**4. Orchestrator boundary.** На удалённых системах оркестратор только читает: ssh для логов, статусов, файлов. Любая mutating операция (edit, restart, install) на проде запрещена для всего, что должно быть в git. Исключение — runtime state (pairing keys, fabric credentials, кэши), но даже его трогать только с явной командой PM продуктовым языком, не молча.

**5. Incident flow как первоклассная ветка протокола.** Раздел WORKFLOW.md «When PM says it doesn't work» — описывает что оркестратор делает (read-only диагностика → formulate PM update → spawn plan-feature с флагом hotfix → стандартный pipeline → PR). До этого момента ни один артефакт не пишется на проде.

**6. Pipeline в CLAUDE.md расширяется.** Сегодня `<test command>` + `<lint command>`. После этого плана — ещё секция «Validators», которую заполняет `stack-researcher` при bootstrap (например, `wb-mqtt-confed-validate schemas/*.schema.json conf.example`, `matter.js init-warn-check`). Эти команды становятся mandatory gate, как и тесты.

**7. Reviewer получает 10-ю dimension.** «Stack expectations compliance»: каждое касание external system проверяется против stack-notes. Расхождение с задокументированным каноном → blocking, с цитатой из stack-notes.

## Contracts

Здесь описаны меняемые артефакты на уровне «что меняется и зачем», без построчного кода — это решает coder.

### Новый агент `.claude/agents/stack-researcher.md`

- Frontmatter: read-only model (sonnet)
- Инструменты: WebFetch, WebSearch, Read, Grep, Glob, Bash (только чтение)
- Запуск: из `bootstrap` после стека; из `plan-feature` для нового external system
- Вход: список компонентов (язык, framework, библиотека, target platform) + опционально existing `stack-notes.md`
- Что делает: для каждого компонента находит canonical docs URL, важные spec citations (особенно constraints, idioms, native validators), known gotchas из real-world обсуждений (issue trackers, не stack overflow)
- Выход: пишет / расширяет `docs/stack-notes.md` в формате из шаблона
- Hard rule: source URL обязателен для каждого утверждения

### Новый шаблон `doc/_templates/stack-notes.md.tmpl`

Структура:

```markdown
# Stack notes

Living document. Updated by stack-researcher.
Last full review: <YYYY-MM-DD>

## How this is used
- plan-feature reads this before drafting a plan that touches external systems
- coder reads this before writing mappings / handlers / schemas
- reviewer checks code against this as dimension «Stack expectations»

## Components

### <component name>
- **Canonical docs:** <URL>
- **Spec / reference:** <URL with anchor when possible>
- **Required validators:** <command + when to run>
- **Idioms and constraints:**
  - <constraint>. Source: <URL>
  - <constraint>. Source: <URL>
- **Known gotchas:**
  - <gotcha>. Source: <URL>
- **Last reviewed:** <YYYY-MM-DD>

## Validators wired into pipeline
| Validator | Command | What it gates |
|---|---|---|
| <name> | `<command>` | <which guarantee it enforces> |

## Integration contracts
| External system | Local artifact | Delivery mechanism | Validator |
|---|---|---|---|
| <e.g., wb-mqtt-confed> | `schemas/*.schema.json` | `<how it gets to /usr/share/...>` | `<command>` |
```

### `.claude/commands/bootstrap.md`

- Greenfield path: после блока «Then create from templates» — обязательный шаг spawn `stack-researcher` для каждого компонента из ответов PM. Результат — `docs/stack-notes.md`. PM сообщение про research: «изучаю требования стека» (одна строка), не вопросы.
- Legacy path (both modes): после `docs-extractor` — spawn `stack-researcher` по компонентам, которые extractor зафиксировал в `architecture.md`.
- CLAUDE.md.tmpl pipeline-секция заполняется не только `<test>` и `<lint>`, но и validators из stack-notes (генерирует stack-researcher).
- Greenfield questions list **не расширяется** — PM не должен отвечать про validators.

### `.claude/commands/plan-feature.md`

- В «Before asking anything» read-list добавляется `docs/stack-notes.md`.
- Новый шаг между чтением docs и planning conversation: «Identify touched stack components». Если фича касается компонента, которого нет в stack-notes — обязательный spawn `stack-researcher` перед continue. Без вопроса PM.
- В шаблон плана добавляется секция **«Stack expectations touched»** перед «Test plan»: для каждого касающегося компонента — цитаты из stack-notes о constraints / idioms, которые фича обязана соблюсти. Эту секцию читает coder перед тем как писать код.
- Test plan расширяется: для каждой stack expectation, которую фича задевает — конкретный тест против spec (не просто self-consistency).

### `.claude/agents/coder.md`

- Hard rules расширяются:
  - **«Never edit files on remote / production systems»** (ssh, scp, docker exec edit, kubectl edit, и т.п.). Read-only ssh для diagnostics допустимо. Любое изменение — через локальный репо.
  - **«Never run mutating commands on production»** (systemctl restart, docker compose up, apt install, и т.п. на удалённой системе). Mutating-команды выполняются только по deployment скрипту в репо, никогда «по месту».
  - **«Read `docs/stack-notes.md` before writing code for any component listed there»**. При расхождении task-plan с stack-notes — stop & escalate, не fallback в WebSearch.
- Шаг «Implement» получает sub-step: при касании external system сверить mapping/handler/schema со spec из stack-notes, цитаты в commit message.

### `.claude/agents/reviewer.md`

- Новая dimension (10): **«Stack expectations compliance»**. Для каждого касающегося external system изменения — соответствует ли код пунктам из stack-notes? Расхождение → blocking с цитатой из stack-notes. Если stack-notes для этого компонента отсутствует — это тоже blocking (план должен был spawn'ить stack-researcher).
- Dimension 8 (Infrastructure) расширяется: не только «файл существует, если архитектура говорит Docker», но «доставка integration artifacts (schemas, unit files, CRDs) к целевой платформе через её канонический канал; валидация — её native tool; команда валидации в pipeline». Reviewer проверяет, что Dockerfile / deployment script покрывает все integration artifacts.
- Dimension 1 (Plan compliance) расширяется: если в плане отсутствует «Stack expectations touched» для затронутого external system — blocking.

### `.claude/agents/architect.md`

- В шаг 2 («Find adjacent implementations») добавляется sub-step: прочитать `docs/stack-notes.md` для компонентов в plan'е. Учесть constraints стека при оценке variants.
- Hard rule «scope: current repository only» не меняется — stack-notes уже внутри репо.

### `WORKFLOW.md`

Новый раздел **«When PM says it doesn't work in production»** (между «How I work» и «Maintenance»):

- Read-only diagnostics allowed: ssh для логов (`journalctl`, `docker logs`), статусов (`systemctl status`, `wb-cli audit`), чтения файлов (`cat`, `ls`).
- Mutating actions on production forbidden: edit конфигов, schemas, кода; `systemctl restart`, `docker compose restart`, `apt install`; запись в MQTT controls без явной PM команды.
- Findings формулируются продуктовым языком, не journalctl-dump'ом.
- Spawn plan-feature с hotfix-flag: план включает «Incident facts» секцию (symptoms, evidence, что точно сломано) — становится частью plan.md.
- Дальше — стандартный pipeline: coder → reviewer → pr-prep → PR. PM merge'ит.

Существующий раздел «How I work» получает явное правило для всех агентов: **«No writes on remote systems via ssh / scp / docker exec / kubectl. All changes live in git.»**

### `README.md`

- Раздел «Что гарантирует шаблон» расширяется двумя новыми гарантиями (10 и 11 из таблицы выше)
- Раздел «Как это работает» получает второй мини-flow для prod incident (read-only diagnose → hotfix plan → стандартный pipeline)
- В «Структура шаблона» появляется stack-researcher и `stack-notes.md.tmpl`

## Test plan

Это репо шаблона; автотестов в традиционном смысле нет. Validation by use — выполнить серию smoke-сценариев против обновлённого шаблона. Каждый сценарий = выполнить protocol на тестовом downstream проекте и проверить outcome.

**Existing tests / smoke checks that must pass:**
- Все сценарии из `template-v2_plan.md` § «Test plan» продолжают работать.

**New smoke checks:**

1. **stack-notes bootstrapping.** Greenfield bootstrap на тестовом проекте «TypeScript MQTT bridge для Matter» → после ответов PM на 7 стандартных вопросов оркестратор автоматически spawn'ит `stack-researcher` → создаётся непустой `docs/stack-notes.md` с компонентами typescript, matter.js, mqtt, wb-mqtt-confed; каждый имеет canonical URL и хотя бы одну spec citation.

2. **plan-feature reads stack-notes.** На том же тестовом проекте: «добавить DimmableLight в Matter bridge» → план включает секцию «Stack expectations touched» с цитатой про `currentLevel MUST NOT be 0` и off-state в OnOff cluster.

3. **reviewer catches stack expectation violation.** Тестовый diff с `currentLevel: 0` в инициализации Matter endpoint → reviewer возвращает blocking, цитата из stack-notes, ссылка на Matter spec.

4. **reviewer catches missing integration delivery.** Тестовый diff: добавлен `schemas/foo.schema.json` для wb-mqtt-confed, но Dockerfile не доставляет его в `/usr/share/wb-mqtt-confed/schemas/` → reviewer dim 8 возвращает blocking.

5. **orchestrator refuses remote edit.** Сценарий: PM говорит «не работает». Оркестратор диагностирует, видит проблему в schema. Попытка spawn coder с inline-prompt «исправь schema на /mnt/data/...» → coder отвечает «hard rule запрещает; план?». Оркестратор открывает hotfix-plan, не идёт в ssh.

6. **stack-notes update on new component.** Plan-feature на фиче, которая касается нового external system (например, добавить InfluxDB) → автоматически spawn stack-researcher → stack-notes расширяется → план получает свежие expectations.

**Property-style check (для отслеживания регрессии в шаблоне):**

- Любой агент в `.claude/agents/` после правок этого плана содержит правило про remote-edit запрет, либо явно объясняет почему оно ему не нужно (reviewer и stack-researcher — read-only, поэтому правило implicit).

## Docs to update

- `README.md` — расширение раздела гарантий (2 новые), обновление flow и structure
- `WORKFLOW.md` — новый раздел про incident response + общее правило no-remote-writes
- `CHANGELOG.md` — после merge: MINOR bump (новые агент + команды + гарантии, breaking changes нет; downstream проекты могут принять обновление через `git submodule update --remote` и spawn stack-researcher из bootstrap-resume или вручную)
- `doc/_templates/CLAUDE.md.tmpl` — pipeline секция расширяется на «Validators», добавляется упоминание `docs/stack-notes.md`

## Out of scope

- Конкретные stack-specific skills (matter.js, wb-mqtt-confed, и т.п.) — это можно делать как WB-specific extension в отдельных репо. Шаблон даёт **механизм**, не **содержание**.
- Автоматизация запуска stack-validators в CI шаблонного репо — это per-project ответственность. Шаблон только описывает, что pipeline должен включать validators.
- Миграция существующих downstream проектов на новые гарантии — отдельная routine, требует отдельного плана.
- **Исправление `wb-mqtt-matter`.** Этот план даёт инструменты, чтобы исправление было правильным, но сам wb-mqtt-matter живёт в отдельном репо и должен быть исправлен через стандартный pipeline уже обновлённого шаблона.
- Замена PM на технического оператора в любом виде. PM остаётся продуктовым.
- Изменения в существующих гарантиях (4, 5, 6, 9) — они уже работают, не трогаем.
