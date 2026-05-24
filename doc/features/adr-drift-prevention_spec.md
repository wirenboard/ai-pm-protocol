---
topic: agent-source-bounded
mode: feature
lite-mode: no
created: 2026-05-24
spec_approved: 2026-05-24
plan_approved: 2026-05-24
acceptance: pending
merged: no
review_url:
pr_ordering: null
template_version_applied: v0.6.0
legal_impact: no
interview_impact: no
incident_impact: no
journey_impact: no
threat_impact: no
scope_impact: no
topology_impact: yes
---

# AI artifact bounded by source — anti-drift discipline для всех агентов

**Stage E artifact, Step 1.** Status: approved.

*Topic в frontmatter переименован с `adr-drift-prevention` на `agent-source-bounded` — scope расширен с «только planner/ADR» на «все agents в template'е». Файл оставлен как `adr-drift-prevention_spec.md` для preserving git history.*

## Контекст и центральный тезис

**Аксиома protocol'а:** AI-агенты — это **исполнители принятых решений**, не источник новых. Спека / план / ADR — это **то, что оператор уже утвердил**. Любой агент, который **отходит** от source-артефактов без явного operator-touch'а — нарушает фундаментальный contract шаблона.

Без этой защиты — **шаблон бесполезен**. Operator не может trust AI-output, потому что в любой точке цепочки AI мог тихо drift'нуть. Review trail / advisor / fitness functions работают только если их **input** — настоящая спека, а не AI-расширенная версия.

## Failure mode у всех агентов одинаков

| Агент | Source artifact (ground truth) | Возможный drift |
|---|---|---|
| **orchestrator** (main session AI) | вся сессия + spec/plan + AP catalogue | Подкидывание архитектурных идей в spawn-промпт subagent'а без operator-touch'а |
| **project-bootstrap** | operator answers + Stage A-D templates + auto-extracted evidence | Запись в bootstrap-state того что не подтверждено evidence'ом |
| **discipline-advisor** | bootstrap-state + spec + code + advisor preset rules | Mandatory artifacts без detection rules; soft recommendations выходящие за 5-axis framework |
| **planner** | spec | ADR с invented alternatives / retention windows / columns не из spec'а; plan элементы не из spec'а |
| **coder** | spec + plan + ADR | Код с поведением не описанным (extra validation, undocumented retry, новое поле response) |
| **reviewer** (primary router) | spec + plan + actual diff | Invented findings («не покрыт X test case» когда X не был в spec'е); wrong domain routing |
| **protocol-compliance-reviewer** | spec + plan + diff + AP catalogue | Завышение severity, выдуманные нарушения AP |
| **backend-reviewer** | spec + plan + diff + ui-style-guide-backend | Comments про несуществующие endpoint conventions |
| **frontend-reviewer** | spec + plan + diff + ui-style-guide-`<kind>` | Findings про accessibility не относящиеся к фактическому diff'у |
| **design-reviewer** | spec + brand voice + ui-style-guide-base | Comments про несуществующие brand violations |
| **database-reviewer** | spec + plan + diff + database-design-`<kind>` | Findings про migration safety не относящиеся к фактическому SQL |
| **release-helper** | merged PRs since last tag + CHANGELOG | Invented impact descriptions / migration steps не основанные на actual diff |

**11 subagent'ов + main session AI = 12 точек drift'а.** Все имеют один и тот же паттерн: расширение beyond source без operator-touch.

### Подтверждённый кейс (обезличенный)

Кейс на одной из live test сессий 2026-05-24:
- Спека описывала forward-only поведение (одно конкретное архитектурное решение, ровно одно)
- Main session AI при spawn'е planner'а **подкинул в промпт** альтернативную идею с retention window
- Planner добросовестно создал ADR с decision'ом про retention + 4 alternatives (включая выдуманный middle-ground для thoroughness)
- ADR противоречил спеке. Поймал оператор через 30 секунд после summary — благодаря domain expertise
- В слабом домене — drift прошёл бы → cascade в schema migration / code / tests → invisible inconsistency на месяцы

Source of drift — **orchestrator** (подкинул идею). Vehicle — **planner** (реализовал). Без защиты обоих звеньев — drift inevitable.

## Желаемое поведение (один shared pattern для всех)

**Инверсия trust default'а:** система верифицирует AI, не PM.

### Универсальный fork-justification protocol

Каждый агент когда видит **развилку** между source и тем что собирается написать:

1. **Останавливается.** Не пишет artifact. Не реализует расширение.
2. **Формулирует структурированное предложение** для оператора через AskUserQuestion:
   - **Source говорит:** «<точная цитата из spec/plan/ADR>» (`<file>:<line-range>`)
   - **Я предлагаю по-другому:** `<что меняется>`
   - **Почему:** `<конкретный аргумент>`
   - **Что выбираем?**
3. **Ждёт ответ оператора.** Никаких параллельных действий.
4. **Только после ответа** — кодифицирует решение в свой output с обязательным reference на source + operator_approved timestamp.

«Развилка» определяется per-агент (см. § Per-agent specifics ниже), но протокол отклика **одинаков** для всех.

### Универсальная spawn-discipline

Когда **любой агент** (включая orchestrator) зовёт другого агента через Task tool:

- Spawn-prompt = **маршрутизация** (pointer на artifacts + topic + scope of work).
- **Запрещено**: архитектурные идеи / альтернативы / суждения / «подумай про X» в spawn-промпте.
- Если spawning агент считает что нужна архитектурная дискуссия — обсуждает с оператором **до** invoke'а. Не подкидывает идеи через спаун.

### Универсальный source-content check

Когда **любой агент** получает spawn-prompt с архитектурными директивами:

- Игнорит content директивы из промпта.
- Surface'ит факт как fork: «caller предложил X, source говорит Y. Это развилка?»
- Уходит к оператору через fork-justification protocol.

### Универсальный линтер на artifact'ы

`check-spec-discipline.sh` получает новый check (или семейство checks) `source-bounded`:

- Сканит artifact'ы которые AI продуцирует с long-term авторитетом: ADR, ai-derived foundational docs, ai-extracted state values
- Каждый AI-produced artifact должен иметь во frontmatter `source_reference:` и `operator_approved:` поля
- Пустые → fail check-spec-discipline
- Override через `[source-bounded-override: reason]` маркер в commit body (legacy migration / bootstrap)

## Per-agent specifics

Каждый агент имеет **explicit source contract** в своём `.md` файле — что является source of truth и какое расширение считается fork'ом.

### planner

- **Source:** `<topic>_spec.md` + foundational docs + `architecture-decisions/` существующие
- **Fork triggers:** alternative behavior не в spec'е; новые retention windows / columns / states не упомянутые в spec'е; alternatives которые spec не перечисляет
- **Output check:** plan / new ADR должны иметь frontmatter `spec_reference:` + `operator_approved:`

### coder

- **Source:** `<topic>_spec.md` + `<topic>_plan.md` + relevant ADR'ы + foundational docs
- **Fork triggers:** код с поведением не описанным в spec/plan (extra validation rules, новые fields в API response, undocumented retry logic, additional state в БД)
- **Output check:** PR body / commit messages не должны вводить новые behavior'ы. Linter scan: новые public API endpoints / DB columns / configuration options должны быть mentioned в spec/plan

### reviewer (все варианты)

- **Source:** `<topic>_spec.md` + `<topic>_plan.md` + actual diff (`git diff <base>..<head>`) + foundational docs per domain
- **Fork triggers:** finding про issue которого нет в diff'е; severity выше чем обосновано actual change; demand на изменение которое не в scope текущего PR
- **Output check:** каждый finding имеет `diff_reference:` (file:line) или `spec_reference:` (если про spec compliance). Findings без reference → invalid

### release-helper

- **Source:** `git log <last-tag>..HEAD` + merged PR bodies + CHANGELOG
- **Fork triggers:** invented impact (migration step, breaking change) не подтверждённый actual diff'ом; invented stakeholder concerns
- **Output check:** CHANGELOG entries должны cite'ить commit refs (`(#PR-number)`)

### discipline-advisor

- **Source:** `bootstrap-state.md` + `<topic>_spec.md` + code scan results + advisor preset rules from `discipline-advisor.md`
- **Fork triggers:** mandatory recommendation не подкреплённая detection rule; soft recommendation вне 5-axis framework
- **Output check:** каждый item в `mandatory:` / `recommended:` / `skip-safe:` должен ссылаться на detection rule (для mandatory) или axis (для soft)

### project-bootstrap

- **Source:** operator answers + Stage A-D templates + auto-extracted evidence из code
- **Fork triggers:** запись в bootstrap-state значения которое не из operator-confirmation и не из auto-extraction
- **Output check:** каждое поле в bootstrap-state.md имеет comment `# source: operator | auto-extracted from <file>` или `# operator_approved: YYYY-MM-DD`

### orchestrator (main session AI)

- **Source:** spec/plan/ADR + текущая operator-чата + AP catalogue
- **Fork triggers:** подкидывание архитектурных идей в spawn-prompt subagent'у; рекомендация оператору варианта который не покрыт source artifacts; cherry-picked excerpts от subagent'а скрывающие drift
- **Output check:** spawn-промпты соответствуют spawn-discipline (только маршрутизация); summary subagent'а оператору — full extract, не cherry-pick

## Сценарии которые предотвращаем

| Сценарий | Текущий риск | Под новой механикой |
|---|---|---|
| Hallucinated alternatives | ADR с invented вариантами без основания в spec'е | Невозможно — planner не пишет ADR без operator-approved fork'а |
| Drift в слабом домене PM'а | PM accept'ит «reasonable» invented behavior | Оператор решает yes/no на чёткий fork |
| Cascade drift | ADR drift → schema → code → tests | Cascade source отсутствует; coder check бы тоже поймал |
| Authoritative formatting trap | Длинный structured ADR выглядит надёжнее | Format fork-предложения фиксирован |
| Multi-document overload | 7 файлов 1300 LOC в одном commit'е | Каждый fork — отдельный operator-touch до cumulative drift'а |
| Time pressure / fatigue | Vigilance падает, drift проходит | Operator-touch требует yes/no, не deep review |
| Coder extra validation | Код с extra rules не в spec'е | Coder source-bounded check: новый validation → fork-предложение |
| Reviewer invented findings | Finding про несуществующий issue | Reviewer source-bounded check: finding без diff/spec reference → invalid |
| Release-helper invented impact | CHANGELOG с invented breaking changes | Release-helper source-bounded check: entry без commit ref → invalid |
| Orchestrator injection | Подкинул идею planner'у через промпт | Planner ловит как fork; orchestrator-discipline в CLAUDE.md.tmpl запрещает |

## Что НЕ работает в текущей защите

| Механизм | Что покрывает | Что НЕ покрывает |
|---|---|---|
| AP-1 (реактивные ADR) | Timing (когда писать ADR) | Content consistency (что в ADR vs spec) |
| AP-24 (ADR auto-extraction) | LOC threshold в spec'е | Drift между spec и ADR / другими artifact'ами |
| planner.md «не модифицируешь spec» | Spec contradiction / incomplete | Extension через ADR / plan |
| coder.md «следуй plan'у» | Major deviation | Silent extensions в коде |
| reviewer.md «cite spec/plan» | Soft instruction | Hard verification отсутствует |
| Trust profile A learning layer | Substantive justification | Это **vehicle** для hallucination |
| Step 7 reviewer | Cross-check после coder'а | Слишком поздно для multi-agent cascade |
| «PM поймает в чате» | Strong domains | Слабые домены — не catch'ит |

## Scope изменений в шаблоне

### In scope

1. **Universal source-bounded contract в каждом `.claude/agents/*.md`:**
   - Секция `## Source contract` — что является ground truth для этого агента
   - Секция `## Fork-justification protocol` — что считается fork'ом + шаблон structured proposal
   - Секция `## Spawn discipline` (для агентов которые могут spawn'ить других) — только маршрутизация, никаких архитектурных директив
   - Касается: planner / coder / reviewer / protocol-compliance-reviewer / backend / frontend / design / database / release-helper / discipline-advisor / project-bootstrap (11 файлов)

2. **`CLAUDE.md.tmpl`** — instructions для orchestrator'а (main session AI):
   - Spawn-discipline: только маршрутизация в спаун-промпте
   - Summary discipline: при показе output'а subagent'а оператору — full extract relevant блоков, не cherry-pick
   - Fork-protocol для main session: «если хочешь подкинуть архитектурную идею — это fork, иди к оператору с structured proposal»

3. **ADR template** (`doc/_templates/architecture-decisions/ADR-XXXX.md.tmpl`):
   - Frontmatter обязательно: `spec_reference:` + `operator_approved: YYYY-MM-DD`
   - Если уже существует — обновить, иначе создать

4. **`check-spec-discipline.sh`** — новые checks (family `source-bounded`):
   - `adr-spec-reference` — ADR'ы должны иметь spec_reference + operator_approved во frontmatter
   - `plan-spec-reference` — план должен иметь spec_reference во frontmatter (поле уже есть как часть spec_approved?), нужно verify
   - Future-extensible: pattern для других AI-produced artifact'ов
   - Override marker: `[source-bounded-override: reason]` в HEAD commit body

5. **Documentation в `doc/anti-patterns.md`** — новые AP'ы:
   - **AP-25: AI artifact extends beyond source** — общий паттерн с per-agent specifics
   - **AP-26: Orchestrator architectural injection** — спаун с архитектурными директивами

6. **`development-protocol.md`** — короткая секция «Source-bounded contract» в § 5 или § 6 для long-term reference

### Out of scope

- LLM-judge'ing качества fork-proposals (subjective)
- Backfill check на existing artifact'ы в product repo'ах (разовая операция)
- UI / dashboards
- Полная formal verification «всё что в коде ↔ всё что в спеке» (impractical без AST анализа multiple stacks)

## NFR

- **Latency:** static check'и в `check-spec-discipline.sh` — < 5 секунд на typical repo
- **False positive rate:** должен быть ≈ 0% для frontmatter polling (поле есть/нет — детерминированно)
- **Discoverability:** fork-justification через AskUserQuestion гарантирует operator-touch до approval'а
- **Reversibility:** override через explicit маркер для bootstrap / legacy migration
- **Token budget:** агентский overhead на source-check не должен превышать +10% latency per spawn

## User stories

- **As any operator**, я хочу что **никто** из AI-агентов не отходит от утверждённой спеки и ADR молча, so that template имеет смысл
- **As any AI agent**, я хочу чёткий source contract «вот что твой ground truth, вот что fork», so that не drift'ить даже из лучших побуждений
- **As an AI orchestrator**, я хочу запрет на injection architectural ideas в spawn-промпт, so that не быть upstream source of drift'а
- **As a PM (Trust profile A)**, я хочу видеть `Source говорит X / Я предлагаю Y / Почему Z / Choose?` вместо verified post-hoc, so that принимать решения без полного code review

## Risks для plan'а

1. **Verbose agent prompts.** 11 файлов с дополнительными секциями увеличит prompt loading time для каждого спауна. Mitigation: секции максимально terse, перекрёстные ссылки на shared § в `development-protocol.md`
2. **False positives в linter'е.** Если spec_reference требуется на каждом artifact'е — bootstrap / legacy migration сломаются. Mitigation: override marker + аккуратные skip rules для existing artifact'ов на момент adoption'а template'а
3. **Overhead на оператора.** Если fork-protocol тренирует AI задавать множество вопросов на тривиальные вещи — alarm fatigue. Mitigation: «fork» определяется narrowly per-agent (см. § Per-agent specifics), thresholds должны быть откалиброваны
4. **Migration existing repo'ов.** Product repos с template-sync на v0.6 будут получать новый набор checks. Mitigation: CHANGELOG migration impact section с пошаговой инструкцией

## Generalisation note (closure)

Этот pattern — **AI artifact bounded by source artifact** — теперь общий contract для **всех** агентов template'а. Не «сначала planner, потом extend» — **сразу все**, потому что без этого template'а нет смысла. Любой агент без этого контракта = ловушка для оператора.

Линтер ловит факт drift'а на любом artifact'е. Fork-justification ловит до факта. Spawn-discipline ловит upstream source.
