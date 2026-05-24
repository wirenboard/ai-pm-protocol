# ai-pm-protocol

Шаблон для тех, кто пилит свой продукт один, в паре с AI.

Идея простая: AI пишет код быстро, но проверять его некому — вы один. Шаблон даёт двух «коллег» в виде AI-агентов: один пишет, второй проверяет. И ещё немного автоматики, чтобы не пропустить важное.

## Для кого

| Кто | Что мешает | Чем помогает |
|---|---|---|
| **PM** (не код) | Знаю, что хочу — не могу собрать сам в нужном темпе и качестве | AI-разработчик + AI-ревьюер. Вы остаётесь главным по «что делаем» |
| **Developer** | Кодить умею — но как сделать так, чтобы продукт реально был кому-то нужен? | Помогает с продуктовой частью: персоны, сценарии, SLO, threat model. Дисциплина «спека → план → код → ревью» |

Шаблон не делает работу за вас. Он не позволит AI сделать что-то глупое за вашей спиной.

**Это не:** методология для команд, не code generator, не «vibecoding».

## Как это работает в двух словах

Каждая фича проходит маленький цикл:

```
спека → план → код (с тестами) → ревью → merge
```

Между шагами вы говорите «ок, дальше». AI не идёт вперёд сам.

Две вещи делают это надёжным:

### 1. Ревью до push'а

Когда coder-агент закончил, в той же сессии вы запускаете reviewer-агента — отдельного, со своим промптом. Он читает diff и пишет файл `_review.md` с вердиктом: `approve` / `approve-with-comments` / `request-changes`.

Файл коммитится в ветку. Дальше две проверки:

- **Локально:** pre-push hook читает вердикт. Нет файла или `request-changes` — push не уходит.
- **На сервере:** тот же скрипт в CI. Если локально как-то проскочило — merge заблокирован branch protection'ом.

Никаких «AI сказал, что всё ок» — есть машинно-читаемый вердикт и две независимые проверки.

Обойти можно — но честно: маркером `[review-override: <причина>]` в коммите. Останется в истории.

Подробности — `doc/anti-patterns.md` § AP-16.

### 2. Не делать лишнего

Шаблон строгий, но не тупой. У вас нет фронтенда — зачем требовать `ui-style-guide.md`? Нет платежей и логина — зачем `threat-model.md`?

Защита — в два слоя:

**Жёсткий слой — скрипт `scripts/check-security-floor.sh`.** Детерминированно grep'ает `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` и т.д. на конкретные триггеры:

- `stripe`/`paypal`/`braintree` → нужны `threat-model.md` + `legal.md`
- `bcrypt`/`argon2`/`passport`/`jsonwebtoken`/`next-auth` → нужен `threat-model.md`
- `crypto.createCipheriv`/`AES-GCM`/`libsodium`/`cryptography` → нужен `threat-model.md`
- Колонки `email VARCHAR`/`phone`/`dob`/`ssn` в schema-файлах → `threat-model.md` + `legal.md` + `database-design-base.md`

Это **не LLM-решение**. Найдено `stripe` в зависимостях — skip недоступен, точка. Можно только явно overridе'ить через `adoption_overrides:` с указанной причиной (AP-22), это попадёт в state-файл и в git log.

**Мягкий слой — `discipline-advisor`.** На bootstrap'е читает output жёсткого скрипта как факт, плюс смотрит сам на остальное (что не покрыто статикой) и предлагает: `mandatory` / `recommended` / `skip-safe`. Может только **усилить** жёсткий слой (добавить mandatory), не **ослабить** его.

Вы выбираете через `[Skip]` / `[Keep]` для рекомендаций advisor'а. Решение записывается с причиной и датой в `.ai-pm/.bootstrap-state.md`. Через 90 дней `scripts/check-skip-reprompts.sh` (вызывается на старте каждой сессии + перед commit'ом) напомнит: «next_reprompt истёк, пересмотри». Не зависит от того что advisor вспомнит.

**Честно про текущее состояние advisor'а:** soft 5-axis анализ (понятность / поддерживаемость / технические качество / UI / UX / learning) пока **opt-in PoC** — требует accuracy gate ≥80% per axis на 10-15 синтетических проектах перед тем как станет mandatory. Жёсткий слой работает всегда независимо от этого.

## Установка

Шаблон подключается submodule'ом — не копируется:

```bash
cd ~/dev/my-product
git submodule add git@github.com:aadegtyarev/ai-pm-protocol.git .ai-pm/tooling
git commit -m "chore: подключён ai-pm-protocol"
```

Первый запуск:

```bash
cd my-product
claude
```

Bootstrap-агент сам подготовит файлы, спросит пару вопросов (новый проект или legacy? PM или dev?), запустит advisor и поведёт через начальные шаги.

Обновление шаблона:

```bash
cd .ai-pm/tooling && git fetch && git checkout <tag>
cd ../.. && git add .ai-pm/tooling && git commit -m "chore: bump ai-pm-protocol"
```

## Пять стадий

Проект проходит пять стадий по порядку — каждая опирается на предыдущую:

| Стадия | О чём | Когда писать |
|---|---|---|
| **A. Discovery** | Кто пользователь, какие сценарии, как звучим и выглядим | Новый продукт — пишем; фича — читаем |
| **B. Constraints** | Что должно работать (SLO), что не сломать (security, legal) | Новый продукт — пишем; фича — читаем |
| **C. Process** | Стек, БД, dev-environment | Только на старте |
| **D. Bootstrap** | CI, линтеры, hooks — выводится из A/B/C | Только на старте |
| **E. Production** | Сами фичи | Всегда |

Порядок не случайный. SLO без понимания пользователя — гадание. Стек без знания нагрузки — карго-культ. CI без выбранного стека — нечего настраивать.

## Режимы

| Режим | Когда |
|---|---|
| `new-product` | Нет ни кода, ни доков |
| `feature` | Новая фича в существующий проект |
| `rework` | Переписываем фичу — поведение меняется |
| `bug-fix` | Lite-режим, тест-репродукция первой строкой. Security — без lite |
| `template-sync` | Обновляем шаблон до новой версии |

## Если у вас уже есть код (legacy)

При первой сессии AI поймёт, что проект существующий, и предложит три варианта:

- **Quick auto** (5-10 мин) — автоматически вытаскивает что может (стек, тип UI, тип БД), ставит hooks. Дальше первая фича каждого нового домена потребует короткого ресёрча
- **Manual staged** (часы) — вы выбираете какие артефакты делать сейчас, AI ведёт через процесс
- **Skip** (минута) — только trust profile, стек и Stage D hooks. Дальше каждая фича — отдельный ресёрч

Foundation растёт постепенно: `minimal → partial → complete`.

## Trust profile

Подстраивает многословность отчётов агентов:

- **A** — PM, код не читает. Отчёты подробные, с объяснением «почему так»
- **B** — full-stack senior. Подробно вне своего домена, кратко внутри
- **C** — full-stack pro. Кратко, только ссылки на ADR. Доступен `c-fast` lite-режим

Для security-кода (auth / crypto / PII / платежи) — режим всегда полный, даже на profile C.

## Что под капотом (коротко)

- **5 защитных слоёв:** CLAUDE.md (soft) → settings.json hooks физически блокируют Write/Edit (hard) → subagent промпты (soft) → git hooks (hard) → CI + branch protection (hardest)
- **Router ревьюеров (по дизайну):** всегда запускается `protocol-compliance` (спека vs план vs код) + один профильный (backend / frontend / design / database). По дизайну — 2 запуска на PR, не 5. На уровне промпта reviewer-агента, не статически вынуждено
- **Composition matrices:** для гибридов вроде «web + backend + external БД» правила фильтруются по реальным capabilities, не копипастятся
- **Реактивные ADR:** пишутся, когда planner находит развилку в плане. Не upfront, не «для галочки»
- **Линтер дисциплины:** `check-spec-discipline.sh` — 15 проверок на типичные AI-косяки (ослабление assertion'ов, забытый regression test, fork без ADR)
- **Статический security floor:** `check-security-floor.sh` — детерминированный grep по манифестам/коду/схемам на stripe/bcrypt/aes-gcm/PII. Output — ground truth для advisor'а
- **Reprompt auto-trigger:** `check-skip-reprompts.sh` парсит state-файл на старте каждой сессии и перед commit'ом, печатает истёкшие skip-решения

Подробности по каждому — `doc/development-protocol.md` и `doc/anti-patterns.md` (AP-1..AP-24).

## Структура

```
ai-pm-protocol/
├── doc/
│   ├── development-protocol.md   ← основной протокол
│   ├── anti-patterns.md          ← AP-1..AP-24
│   ├── _templates/               ← скелеты артефактов
│   └── _recipes/cache/           ← конфиги под разные стеки
├── .claude/agents/               ← все агенты
└── .githooks/                    ← защита от прямого push в main
```

## Агенты

| Агент | Что делает |
|---|---|
| `project-bootstrap` | Запуск, resume сессии, routing между режимами |
| `planner` | Пишет план фичи. Код не трогает |
| `coder` | Пишет код. Тесты впереди реализации |
| `reviewer` | Главный ревьюер. Определяет домен, зовёт нужных |
| `protocol-compliance-reviewer` | Запускается всегда. Спека↔план↔код |
| `backend-/frontend-/design-/database-reviewer` | Профильные. Один на PR |
| `discipline-advisor` | Сканирует стек, советует что писать / пропустить |
| `release-helper` | Релизный PR с CHANGELOG и bump'ом версии |

## Если вы контрибьютите в сам шаблон

После клона:

```bash
git config core.hooksPath .githooks
```

Это включит блокировку прямого push в `main`. Изменения — через PR в `feature/<topic>`, `docs/<topic>` или `chore/<topic>`.

## Похожие проекты

В этой нише уже есть несколько штук — никто не делает ровно то же, но пересечения есть.

| Проект | Что общего | Чем отличается |
|---|---|---|
| [GitHub Spec Kit](https://github.com/github/spec-kit) | Спека → план → задачи → код, для Claude Code / Copilot / Gemini | Тулкит, а не протокол. Нет ревью-агента, прибитого к pre-push, нет advisor'а, нет ролей PM/dev |
| [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | «Виртуальная команда» из 9 ролей (Analyst, PM, Architect, Dev…), agile-цикл | Метафора — команда внутри AI. Здесь — наоборот, оператор + усилитель. Нет advisor-skip и hard-блокировок |
| [GSA-TTS devCrew_s1](https://github.com/GSA-TTS/devCrew_s1) | Использует те же термины «operator gates», halt-and-escalate | Это спецификация для других платформ, не готовый submodule с hooks / CI / агентами |
| [wshobson/agents](https://github.com/wshobson/agents), [awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) | Каталоги специализированных агентов | Просто наборы агентов, без обвязки протоколом. Ортогонально — можно встроить как источник |
| [claude-sub-agent](https://github.com/zhsama/claude-sub-agent) | Workflow на subagents Claude Code | Меньше масштаб, без stage-gates и advisor-skip |
| [ChatPRD](https://www.chatprd.ai/) | AI-помощник для PM (PRD, ревью) | Закрывает Stage A/B для PM, но без кодовой части и без enforcement'а |

Что почти не встречается у других: ревью, прибитое и к pre-push, и к CI; статический детектор security-зависимостей, который AI не может «убедить» не сработать; автоматический напоминатель через 90 дней про пропущенное; хуки, физически не позволяющие AI писать код в обход спеки; гибкая настройка под продукты, у которых одновременно и web, и backend, и mobile.

## Лицензия

AGPL v3. Коммерческое использование — да. Модификации (включая SaaS) возвращаются в open source.

SPDX: `AGPL-3.0-only`
