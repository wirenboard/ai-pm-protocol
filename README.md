# ai-pm-protocol

Шаблон для тех, кто пилит свой продукт один, в паре с AI.

Идея простая: AI пишет код быстро, но проверять его некому — вы один. Шаблон даёт трёх «коллег» в виде AI-агентов: планировщик, кодер и ревьюер. И немного автоматики, чтобы не пропустить важное.

## Для кого

**В v0** — для **одного типа пользователя**: solo PM, не читает AI-код.

| Кто | Что мешает | Чем помогает |
|---|---|---|
| **PM** (не код) | Знаю, что хочу — не могу собрать сам в нужном темпе и качестве | AI-планировщик + AI-кодер + AI-ревьюер. Вы остаётесь главным по «что делаем» |

Шаблон не делает работу за вас. Он не позволит AI сделать что-то глупое за вашей спиной.

**Developer-кейс** (умеешь кодить, но не уверен что фича нужна пользователю) — **в backlog**, добавится после empirical validation PM-кейса. Сейчас focus на одну нишу, чтобы она **заработала**, а не двусторонний маркетинг.

**Это не:** методология для команд, не code generator, не «vibecoding».

## Установка

Шаблон подключается submodule'ом — не копируется:

```bash
cd ~/dev/my-product
git submodule add git@github.com:aadegtyarev/ai-pm-protocol.git .ai-pm/tooling
.ai-pm/tooling/init.sh
git add .claude/agents CLAUDE.md .ai-pm/tooling .gitmodules
git commit -m "chore: подключён ai-pm-protocol"
```

Первый запуск:

```bash
claude
```

**Что именно делает `init.sh` и зачем он нужен.** Без него цикл «`submodule add` → `claude` → bootstrap» не запускается, потому что:

1. **Claude Code сканит `<root>/.claude/agents/`**, а submodule приносит агентов в `.ai-pm/tooling/.claude/agents/`. Без симлинка subagents протокола (включая `project-bootstrap`) невидимы.
2. **Без `CLAUDE.md` в корне** Claude не знает про существование протокола и не позовёт bootstrap-агента. Bootstrap сам пишет полный `CLAUDE.md` из шаблона на Stage D — но только когда его уже позвали. Замкнуто.

`init.sh` закрывает обе дыры:
- симлинк `.claude/agents → .ai-pm/tooling/.claude/agents/` (через `ln -sfn`, идемпотентно);
- копия `CLAUDE.seed.md` → `CLAUDE.md` в корне (только если корневого ещё нет — не перезатирает bootstrap'нутый).

Скрипт идемпотентный — повторный запуск ничего не сломает. Если Claude Code уже был открыт во время `init.sh` — **перезапусти сессию** (`/exit` + `claude` снова), Claude Code сканит `.claude/agents/` только на старте.

Bootstrap-агент дальше сам подготовит файлы, спросит пару вопросов (новый проект или legacy? режим? язык артефактов?), запустит security-floor скрипт и поведёт через начальные шаги. Trust profile auto-set `A` (PM-only ЦА в v0) — не спрашивается. На Stage D bootstrap заменит seed `CLAUDE.md` на полную project-specific версию.

Обновление шаблона:

```bash
cd .ai-pm/tooling && git fetch && git checkout <tag>
cd ../.. && git add .ai-pm/tooling && git commit -m "chore: bump ai-pm-protocol"
```

После bump'а submodule'а симлинк `.claude/agents` продолжает работать (target — относительный путь). Если в новой версии шаблона добавились/переименовались агенты — перезапусти Claude Code сессию, чтобы они подтянулись.

## Как это работает в двух словах

Каждая фича проходит маленький цикл:

```
спека  →  planner пишет план  →  coder пишет код+тесты  →  reviewer проверяет  →  acceptance  →  merge
  ↑ваш ок       ↑ваш ок                                        автоматически      ↑ваши руки   ↑ваш merge
```

Два ключевых gate'а до того как AI пишет: вы утверждаете спеку, потом план. После этого coder и reviewer идут сами. Последнее слово за вами — acceptance testing и merge.

Четыре вещи делают это надёжным:

### 1. Ревью до push'а

Когда coder-агент закончил, следующий шаг — reviewer-агент. Отдельный, со своим промптом.

Reviewer сначала смотрит что именно изменилось (50 токенов), и только потом решает насколько глубоко копать:

- **CHANGELOG / README / .gitignore** — reviewer не запускается, `[skip-review]` по конвенции
- **Scripts, CI-воркфлоу, agent prompts** — baseline pass + adversarial test cases для скриптов
- **Feature code** — полный проход: spec → plan → code alignment, domain section (backend / frontend / design / database)

Pre-condition: CI и линтеры должны быть зелёными до reviewer. Стандарты (форматирование, типы, синтаксис) — зона линтеров; reviewer проверяет отклонение от спеки и architectural conventions.

Reviewer пишет файл `_review.md` с вердиктом: `approve` / `approve-with-comments` / `request-changes`. Дальше две проверки:

- **Локально:** pre-push hook читает вердикт. Нет файла или `request-changes` — push не уходит.
- **На сервере:** тот же скрипт в CI. Если локально как-то проскочило — merge заблокирован.

Никаких «AI сказал, что всё ок» — есть машинно-читаемый вердикт и две независимые проверки.

Обойти можно — но честно: маркером `[review-override: <причина>]` в коммите (review был, trace не committed) или `[skip-review]` (review не нужен для этого типа изменений). Остаётся в истории.

Подробности — `doc/anti-patterns.md` § AP-16.

### 2. Не делать лишнего

Шаблон строгий, но не тупой. У вас нет фронтенда — зачем требовать `ui-style-guide.md`? Нет платежей и логина — зачем `threat-model.md`?

Защита — в два слоя:

**Жёсткий слой — скрипт `scripts/check-security-floor.sh`.** Детерминированно grep'ает `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` и т.д. на конкретные триггеры:

- `stripe`/`paypal`/`braintree` → нужны `threat-model.md` + `legal.md`
- `bcrypt`/`argon2`/`passport`/`jsonwebtoken`/`next-auth` → нужен `threat-model.md`
- `crypto.createCipheriv`/`AES-GCM`/`libsodium`/`cryptography` → нужен `threat-model.md`
- Колонки `email VARCHAR`/`phone`/`dob`/`ssn` в schema-файлах → `threat-model.md` + `legal.md` + `database-design-base.md`

Это **не LLM-решение**. Найдено `stripe` в зависимостях — skip недоступен, точка. Можно только явно override'ить через `adoption_overrides:` с указанной причиной (AP-22), это попадёт в state-файл и в git log.

**Мягкий слой** — ваш выбор при bootstrap'е. Вы решаете `[Skip]` / `[Keep]` для не-hard-floor артефактов прямо в диалоге с bootstrap-агентом. Решение записывается с причиной и датой в `.ai-pm/.bootstrap-state.md`. Через 90 дней `check-skip-reprompts.sh` (вызывается на старте каждой сессии + перед commit'ом) напомнит: «next_reprompt истёк, пересмотри». Hard floor от security-floor.sh — не override'ится без `adoption_overrides:` с явной причиной.

### 3. Защита от AI-дрейфа (3 слоя)

AI любит «улучшать» план — придумать лишний компонент, протащить элегантную симметрию, нарушить инвариант из соседней фичи. Когда вы не читаете код, поймать это глазами невозможно. Шаблон ловит это автоматически на трёх уровнях:

| Слой | Что ловит | Где срабатывает |
|---|---|---|
| **Layer 1** (AP-25/26) | Spec extends beyond source — агент выходит за границы своего ground truth | per-agent контракт (planner / coder / reviewer молча обязаны trace'ить каждое решение к spec'у) |
| **Layer 2** (AP-27..30) | Hallucinated component в ADR / inter-ADR contradiction / scope creep / plausibility bias («звучит логично — пишу») | mandatory reviewer Step 2.5 + linter family `cross-doc-bounded` |
| **Layer 3** (AP-31, AP-33) | Cross-feature contradiction — F-N нарушает invariant установленный F-M; spec staleness — код drift'нул от spec'а > порога | linter family `cross-feature-bounded` (extract'ит «всегда/никогда/обязательно/запрещено» из спек, cross-check'ает новую фичу) |

Плюс **AP-32** (jargon-first operator communication, soft-warn) — поверх ваших operator-facing блоков ревьюер чек'ает что AI не общается с вами на внутреннем жаргоне (Stage X, Step N, AP-NN, `[override]` markers).

### 4. Acceptance testing (Step 6) — ваша личная проверка

Reviewer подтвердил корректность кода. Но кто проверяет, что фича делает то, что вы хотели?

Это делаете вы — вручную, в запущенном приложении, по сценариям из спеки. Не читая код. Именно для этого сценарии в spec'е пишутся исчерпывающе: «Given / When / Then» — это ваш чеклист при acceptance.

Что проверяете:
- Каждый сценарий из spec'а проходит в live app
- Edge cases из spec'а (пустые данные, ошибки, граничные значения) — тоже
- Ничего нового, чего нет в spec'е, не появилось

Если что-то не так — говорите «request-changes», coder чинит. Reviewer снова. Это нормально: цена ошибки при acceptance несравнимо ниже, чем после merge'а в production.

После acceptance вы merge'ите. Только тогда.

### Operator interface model (`development-protocol.md § 16`)

PM — **дирижёр верхнего уровня**, утверждает только:

- **Стек** (новая зависимость / migration)
- **Архитектуру** (business-affecting fork)
- **Бизнес-логику** (что фича делает / не делает)

Всё остальное — план реализации, ADR alternatives, decomposition, refactoring choices — AI делает silently. Голову поднимает только при одном из **6 escalation triggers** (business-logic hole / business-affecting fork / stack-affecting decision / security floor / cross-feature contradiction / cost-time threshold).

При escalation AI обязан задать вопрос по **6 plain-language rules**: concrete-first, no jargon без определения, никаких F-NN / AP-NN / Step X в формулировке. Если нарушит — AP-32 fire'нет.

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

При первой сессии AI поймёт, что проект существующий, и предложит четыре варианта:

- **Quick auto** (5-10 мин) — автоматически вытаскивает что может (стек, тип UI, тип БД), ставит hooks. Дальше первая фича каждого нового домена потребует короткого ресёрча
- **Manual staged** (часы) — вы выбираете какие артефакты делать сейчас, AI ведёт через процесс
- **Skip** (минута) — только стек и Stage D hooks. Дальше каждая фича — отдельный ресёрч
- **Full retrofit** (30-60 мин) — AI scan'ит код, группирует файлы по фичам, extract'ит spec skeleton per feature (`## Behaviour observed` + `## Invariants extracted` + `## Open questions`). Оператор fills open questions, approves. Дальше Layer 3 (cross-feature anti-drift) работает полноценно

Foundation растёт постепенно: `minimal → partial → complete`.

## Trust profile

В v0 — **один profile, A** (PM, не читает код). Отчёты агентов подробные, с объяснением «почему так», ADR rationale, learning layer (раскрывают архитектурные принципы при первом упоминании).

Profile auto-set на init — bootstrap-agent не спрашивает. Поле `trust_profile:` в `.ai-pm/.bootstrap-state.md` сохранено для future расширения, когда добавится developer-кейс.

## Что под капотом (коротко)

- **5 защитных слоёв:** CLAUDE.md (soft) → settings.json hooks физически блокируют Write/Edit (hard) → subagent промпты (soft) → git hooks (hard) → CI + branch protection (hardest)
- **Inline-sections ревьюер:** один `reviewer.md` файл с Mandatory baseline section (always-on — спека vs план vs код) + 4 Domain sections (backend / frontend / design / database). Reviewer определяет scope PR'а и применяет baseline + одну domain section sequentially. Никакого spawn'а nested subagent'ов
- **Composition matrices:** для гибридов вроде «web + backend + external БД» правила фильтруются по реальным capabilities, не копипастятся
- **Реактивные ADR:** пишутся, когда planner находит развилку в плане. Не upfront, не «для галочки»
- **Линтер дисциплины:** `check-spec-discipline.sh` — 23 проверки на типичные AI-косяки (ослабление assertion'ов, забытый regression test, fork без ADR, hallucinated decision component, cross-feature contradiction, jargon в operator-facing блоках) в 4 families (base / cross-doc-bounded / cross-feature-bounded / operator-communication)
- **Статический security floor:** `check-security-floor.sh` — детерминированный grep по манифестам/коду/схемам на stripe/bcrypt/aes-gcm/PII
- **Reprompt auto-trigger:** `check-skip-reprompts.sh` парсит state-файл на старте каждой сессии и перед commit'ом, печатает истёкшие skip-решения

Подробности по каждому — `doc/development-protocol.md` и `doc/anti-patterns.md` (AP-1..AP-33, granular per-AP files в `doc/anti-patterns/`).

## Структура

```
ai-pm-protocol/
├── doc/
│   ├── development-protocol.md   ← основной протокол
│   ├── anti-patterns.md          ← index AP-1..AP-33
│   ├── anti-patterns/            ← per-AP files (AP-01.md..AP-33.md)
│   ├── _templates/               ← скелеты артефактов для downstream проектов
│   ├── _claude/                  ← lazy-loaded reviewer domain sections
│   └── _recipes/cache/           ← конфиги под разные стеки
├── meta/                         ← догфудинг-артефакты самого шаблона
├── scripts/                      ← check-*.sh, update-*.sh, auto-extract/
├── .claude/agents/               ← все агенты
├── .githooks/                    ← защита от прямого push в main
├── init.sh                       ← one-shot onboarding для downstream проекта
└── CLAUDE.seed.md                ← минимальный briefing до Stage D bootstrap'а
```

## Агенты

| Агент | Что делает |
|---|---|
| `project-bootstrap` | Router. Определяет ситуацию (greenfield / legacy / resume / template-sync / lifecycle) по state + git, делегирует подходящему specialized subagent'у |
| `bootstrap-greenfield` | Stage A-D для нового продукта (`new-product` mode) |
| `bootstrap-legacy` | 4-choice adoption (Quick / Manual staged / Skip / Full retrofit) + Tier 0 auto-extract + Tier 2 promotion + Tier 3 overrides |
| `bootstrap-resume` | Session resume когда Stage A-D не closed |
| `bootstrap-template-sync` | Template version bump workflow + architecture overview read-only extract |
| `planner` | Пишет план фичи. Код не трогает |
| `coder` | Пишет код. Тесты впереди реализации |
| `reviewer` | Главный ревьюер. Определяет домен, применяет Mandatory baseline + одну Domain section (backend / frontend / design / database) inline. Sequential self-pass в одном файле |
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
| [GitHub Spec Kit](https://github.com/github/spec-kit) | Спека → план → задачи → код, для Claude Code / Copilot / Gemini | Тулкит, а не протокол. Нет ревью-агента, прибитого к pre-push, нет ролей PM/dev |
| [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | «Виртуальная команда» из 9 ролей (Analyst, PM, Architect, Dev…), agile-цикл | Метафора — команда внутри AI. Здесь — наоборот, оператор + усилитель. Нет hard-блокировок на уровне git hooks / CI |
| [GSA-TTS devCrew_s1](https://github.com/GSA-TTS/devCrew_s1) | Использует те же термины «operator gates», halt-and-escalate | Это спецификация для других платформ, не готовый submodule с hooks / CI / агентами |
| [wshobson/agents](https://github.com/wshobson/agents), [awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) | Каталоги специализированных агентов | Просто наборы агентов, без обвязки протоколом. Ортогонально — можно встроить как источник |
| [claude-sub-agent](https://github.com/zhsama/claude-sub-agent) | Workflow на subagents Claude Code | Меньше масштаб, без stage-gates и conditional skip framework |
| [ChatPRD](https://www.chatprd.ai/) | AI-помощник для PM (PRD, ревью) | Закрывает Stage A/B для PM, но без кодовой части и без enforcement'а |

Что почти не встречается у других: ревью, прибитое и к pre-push, и к CI; статический детектор security-зависимостей, который AI не может «убедить» не сработать; автоматический напоминатель через 90 дней про пропущенное; хуки, физически не позволяющие AI писать код в обход спеки; гибкая настройка под продукты, у которых одновременно и web, и backend, и mobile.

## Лицензия

AGPL v3. Коммерческое использование — да. Модификации (включая SaaS) возвращаются в open source.

SPDX: `AGPL-3.0-only`
