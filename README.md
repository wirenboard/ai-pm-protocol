# ai-pm-protocol

Шаблон для тех, кто пилит свой продукт один или в паре с AI.

PM описывает что хочет — агенты планируют, пишут код, проверяют. PM принимает решения по продукту и не читает код.

## Как это работает

> Краткий обзор для PM. Точные правила оркестрации и обязанности агентов — в [`WORKFLOW.md`](WORKFLOW.md) (canonical orchestration spec, на английском).

**Новая фича:**

```
PM: "хочу добавить групповые чаты"
        ↓
Claude читает docs/ проекта. Если накопилось ≥5 фич с последнего аудита —
предлагает сначала запустить проверку. PM решает.
        ↓
Claude задаёт уточняющие вопросы. Если фича касается стек-компонента,
которого ещё нет в stack-notes — pm-stack-researcher читает канон стека
(без вопросов к PM). Если фича касается разделяемого состояния или
асинхронных операций — добавляются interaction scenarios (конкурентные сценарии).
        ↓
Вместе с PM фиксируется план: сценарии, контракты, правила стека,
тест-план включая interaction scenarios.
PM: "ок"
        ↓
Если фича пользовательская — оформляется Product Contract
(.ai-pm/contracts/<feature>.md: что должно работать, что не должно сломаться).
Backend-only фичи пропускают этот шаг.
        ↓
pm-architect решает структурный вопрос (если есть): где живёт новый код?
Объясняет PM решение — PM может возразить.
        ↓
pm-coder реализует, запускает pipeline.
        ↓
Review loop (PM не видит итерации):
  Pass 1 — pm-plan-checker: все сценарии реализованы? контракт? DoD?
           замечания → pm-coder правит → повтор до чистоты
  Pass 2 — code-review: баги, безопасность, dead code
           замечания → pm-coder правит → повтор до чистоты
        ↓
PM слышит: "готово — вот что изменилось, вот как попробовать"
+ product notes если есть (scope, видимое поведение) — PM решает: сейчас / backlog / игнорировать
        ↓
PM: "открывай PR" / "сначала проверю на проде" / "шипуй"
```

**Не работает на проде:**

```
PM: "оплата корзины зависает на втором шаге"
        ↓
Claude диагностирует read-only: логи, статусы, конфиги на проде
(никаких правок на проде — даже если фикс очевиден)
        ↓
Объясняет PM находку на продуктовом языке
        ↓
Открывает hotfix-план через /pm-plan,
секция "Incident facts" фиксирует симптомы и evidence
        ↓
Дальше — обычный pipeline: pm-coder → review loop → PR → merge
```

**Проверка проекта:**

```
PM: "проверь проект" — или — автоматически после N фич
        ↓
Claude сам решает: быстрая проверка (протокол, diff) или полная (протокол + code-review)
— по дате последнего аудита и количеству фич
        ↓
pm-auditor: артефакты есть? планы совпадают с реализацией? контракты актуальны?
        ↓
PM слышит: N нарушений — по каждому: исправить сейчас / в следующий спринт / принять
        ↓
Если полный аудит: "запустить техническое ревью тоже?" → PM решает
```

PM не знает про агентов, команды и пайплайн — только разговор и продуктовые решения.

## Установка

```bash
git submodule add git@github.com:aadegtyarev/ai-pm-protocol.git .ai-pm/tooling
mkdir -p .claude
ln -s ../.ai-pm/tooling/.claude/agents .claude/agents
ln -s ../.ai-pm/tooling/.claude/commands .claude/commands
ln -s ../.ai-pm/tooling/.claude/settings.json .claude/settings.json
```

Первый запуск — скажи Claude: **«начни проект»**.

- **Новый проект** — Claude задаёт вопросы и создаёт документацию
- **Существующий проект (legacy)** — два режима:
  - *Быстрый старт* — читает минимум, создаёт черновую документацию с пробелами `[?]`, можно сразу работать
  - *Полное документирование* — читает весь код сам, восстанавливает архитектуру и пользовательские сценарии, PM только валидирует результат. После этого можно портировать на новый стек.

## Обновление шаблона

```bash
git submodule update --remote .ai-pm/tooling
git add .ai-pm/tooling
git commit -m "chore: bump ai-pm-protocol"
```

Агенты, команды и `WORKFLOW.md` обновляются автоматически — они symlinks внутри submodule. `CLAUDE.md` и `docs/` проекта остаются нетронутыми.

## Миграция с v1.x на v2.0

v2.0 переносит операционные артефакты из `docs/` в `.ai-pm/`. Документация проекта (`docs/architecture.md`, `docs/stack-notes.md`, `docs/features/*_plan.md`) остаётся на месте.

**Шаг 1 — обновить submodule:**

```bash
git submodule update --remote .ai-pm/tooling
git add .ai-pm/tooling
git commit -m "chore: bump ai-pm-protocol to v2.0"
```

**Шаг 2 — создать новые директории:**

```bash
mkdir -p .ai-pm/audits .ai-pm/reviews .ai-pm/arch .ai-pm/research .ai-pm/contracts
```

**Шаг 3 — перенести артефакты:**

```bash
# ревью-файлы
for f in docs/features/*_review.md; do git mv "$f" .ai-pm/reviews/; done

# архитектурные заметки по фичам
for f in docs/features/*_arch.md; do git mv "$f" .ai-pm/arch/; done

# файл аудита (если был в docs/ или docs/features/)
for f in docs/features/audit-*.md docs/audit-*.md; do
  [ -f "$f" ] && git mv "$f" .ai-pm/audits/
done

# backlog
[ -f docs/backlog.md ] && git mv docs/backlog.md .ai-pm/backlog.md

# research
[ -f docs/research.md ] && git mv docs/research.md .ai-pm/research/research.md
```

**Шаг 4 — проверить `CLAUDE.md`:** убедиться что есть строка `@.ai-pm/tooling/WORKFLOW.md`.

**Шаг 5 — запустить аудит:** скажи Claude «проверь проект» — он сгруппирует все pre-migration артефакты в одно finding и предложит принять массово.

## Какие риски шаблон снижает

> Перечень рисков на продуктовом уровне. Точные формулировки правил — в [`WORKFLOW.md`](WORKFLOW.md) и в `.claude/agents/*.md`.

**Код расходится с планом — реже.** pm-plan-checker проверяет каждый сценарий из плана: есть реализация, есть тест. Замечания идут к pm-coder автоматически — PM не видит итераций.

**Конкурентные баги проходят незамеченными — реже.** Фичи с разделяемым состоянием или async-операциями обязаны иметь interaction scenarios в плане и тесты для них. pm-plan-checker блокирует, если тест не покрывает конкурентный сценарий.

**Технические баги проходят через review — реже.** После plan compliance проходит code-review (multi-agent, ultra уровень). Найденные баги, уязвимости и dead code идут к pm-coder автоматически.

**Существующее поведение ломается — реже.** Product Contracts (`.ai-pm/contracts/`) фиксируют что должно работать и что не должно сломаться. pm-plan-checker блокирует PR если контракт нарушен или поведение изменилось без обновления контракта.

**Архитектурные ограничения нарушаются — реже.** Агенты читают `docs/architecture.md` — не добавят SQLite в Postgres-проект без явного решения PM.

**Уязвимости проходят незамеченными — реже.** code-review проверяет каждый diff: injection, hardcoded secrets, auth bypass, утечки данных.

**Документация расходится с кодом — реже.** Если изменилось поведение — pm-plan-checker блокирует PR пока docs не обновлены. pm-auditor периодически проверяет что контракты актуальны и docs свежи.

**Протокол не соблюдался — видно.** pm-auditor проверяет историю: есть ли план на каждую фичу, было ли ревью, есть ли контракт. Нарушения — PM решает: исправить, отложить, принять.

**Тихие правки на проде — реже.** PreToolUse hook блокирует `ssh ... sed/vi/tee` против repo-owned файлов. Read-only диагностика и деплоймент не страдают.

**Контекст между сессиями теряется — реже.** `.ai-pm/state/current.md` хранит снимок активной задачи. Coder читает его первым шагом. После паузы — открыл файл и продолжил.

**Backlog не теряется.** Незначительные находки PM явно решает что отложить. Отложенное попадает в `.ai-pm/backlog.md` и предлагается при планировании подходящей фичи.

## Что остаётся за PM

> Правила общения PM ↔ агенты — в [`WORKFLOW.md` § "How to talk to the PM"](WORKFLOW.md).

- Описать фичу или баг
- Ответить на уточняющие вопросы при планировании
- Принять архитектурное решение если есть развилка
- Решить что делать с product notes: починить сейчас, в backlog, или игнорировать
- Сказать «выпускай» когда фич накопилось на релиз

Всё остальное — агенты.

## Структура шаблона

```
WORKFLOW.md           — правила работы агентов (импортируется в CLAUDE.md проекта)
.claude/agents/       — pm-architect, pm-coder, pm-plan-checker, pm-pr-prep,
                        pm-legacy-reader, pm-stack-researcher, pm-auditor
.claude/commands/     — pm-bootstrap, pm-plan, pm-research, pm-audit, pm-fixup
doc/_templates/       — шаблоны документов проекта
```

## Структура downstream-проекта

**Документация проекта** — в git, редактируется агентами через plan:

```
README.md
CLAUDE.md                          — импортирует @.ai-pm/tooling/WORKFLOW.md
docs/
  architecture.md
  stack-notes.md
  user-journeys.md
  features/
    <topic>_plan.md
```

**Операционные артефакты** — в git, пишутся агентами автоматически:

```
.ai-pm/
  tooling/                         ← сам шаблон (submodule, read-only)
  state/
    current.md                     ← снимок активной задачи
    archive/<topic>-<date>.md      ← завершённые задачи
  contracts/
    <feature>.md                   ← Product Contract на каждую user-facing фичу
  reviews/
    <topic>_review.md              ← план compliance + code-review findings
    fixup-<topic>_review.md        ← ревью тривиальных правок
  arch/
    <topic>_arch.md                ← архитектурный анализ по фиче
  audits/
    audit-<YYYY-MM-DD>.md          ← отчёт аудита протокола
  research/
    <topic>_research.md            ← исследования перед планированием
    research.md                    ← project-level research (bootstrap)
  backlog.md                       ← отложенные заметки (создаётся по первому use)
```

`.ai-pm/tooling/` — единственная часть `.ai-pm/`, которую PM не трогает и которая обновляется через `git submodule update`. Всё остальное в `.ai-pm/` — артефакты конкретного проекта.

## Лицензия

AGPL v3. Коммерческое использование — да. Модификации возвращаются в open source.
