# Personas — ai-pm-protocol

**Stage A artifact.** Кто пользуется этим template'ом.

В v0 — **одна persona**: solo PM, который не читает AI-код. Остальные кейсы (cross-stack senior dev, full-stack pro) — backlog, добавим **после empirical validation** PM-кейса (см. § «Что НЕ persona в v0»).

Эта persona — **пользователь template'а**, не пользователь продуктов, которые с его помощью строятся.

**Контекст:** текущий первый пользователь template'а и есть эта persona; он же — builder/dogfooder template'а.

---

## Persona A: PM-manager, AI как personal developer

**Краткий портрет.** Solo PM или одиночный builder. Имеет **небольшой опыт в разработке** (читал чужой код в прошлом, понимает базовые концепции), **технически подкован**: понимает CI/CD, ADR, threat-modeling, ориентируется в назначении semgrep / dependency-cruiser / linter-конфигов на уровне «знаю зачем эти инструменты нужны, могу обсуждать high-level архитектурные решения».

**Принципиально не читает AI-generated код** — это **выбор**, не нехватка способности. Persona A — **не vibecoder**, а **технический manager**, который **руководит AI как personal developer'ом**. В обычной команде разработчик пишет код, не показывая manager'у каждую строчку; manager доверяет, потому что есть peer-review + CI + acceptance testing. Здесь то же самое: **peer-review команда состоит из automation + reviewer-agent'а**, не из людей. Это **продуманная замена** team-dynamics для solo workflow.

**Trust model:**
- Specs → PM проверяет, что описывают желаемое поведение исчерпывающе.
- Tests + CI gates → автоматически проверяют, что код = spec.
- Линтеры (Code + Architecture + Spec discipline + Security) → автоматически проверяют качество, discipline, security.
- Reviewer-agent → независимо ревьюит код от имени PM'а.
- Acceptance testing (Step 6) → PM руками проверяет behavior в running app, но НЕ читает код для этого.

**Learning layer (важно для дизайна subagent-prompts):**

Persona A **не читает код**, но **хочет понимать архитектуру и обоснования принятых решений на уровень выше**. Это значит:
- Subagent-output'ы (reviewer-findings, planner-разбор архитектурного подхода, ADR обоснования) **должны содержать architectural-level explanations** — почему такой подход, какие альтернативы рассматривались, какие trade-offs.
- Это требует чуть больше работы от AI (объяснять, не только делать), но даёт PM'у **growth + reinforcement** — он становится сильнее как технический PM через project.
- Format: меньше «вот код такой-то / вот finding», больше «архитектурно мы делаем X, потому что Y; альтернатива Z отвергнута потому что W». Code-level details — в фоне, под cut-off, доступны если PM спросит.
- В spec'ах/plan'ах **секции «Архитектурный подход» и «Risks» — substantive**, не one-liner'ы.
- В reviewer-report'ах **«Findings»** имеют контекстный объяснительный wrap: не только «нарушено правило X», но «нарушено правило X, потому что в этой архитектуре critical чтобы Y не утекало в Z».

**Что хочет от template'а:**
- Discipline для AI, потому что **не может** ловить ошибки visual inspection of code'а.
- Чёткие сигналы (CI fails с понятным сообщением), когда что-то нарушено.
- AI, который объясняет рассуждение в терминах spec'а / behavior'а, не в терминах модулей / функций.
- Универсальность: один и тот же protocol для multiple продуктов, без re-learning'а.

**Что НЕ хочет:**
- Видеть diff'ы кода в чате — это слепое место.
- AI hype.
- Сложность template'а сама по себе становится cost'ом.

**Технологический фон.** Знаком с разными стеками (TypeScript, Python, и т.д.) на уровне «понимаю, какие у них сильные стороны». Не пишет на них сам и не ревьюит код.

**Какой mode преимущественно использует.** `new-product` (первый продукт через template) → `feature` (фичи в собственных продуктах) → реже `rework`. Периодически — `template-sync` (bump версии template'а в существующих своих проектах). `bug-fix` — для мелких правок.

**Уникальные template-нужды:**
- Reviewer-agent output должен быть **verbose и behavior-centric**, не code-centric.
- Spec-discipline линтеры — **строжайшая категория**; без них PM слепнет.
- Acceptance testing scenarios в spec'е — exhaustive, потому что PM идёт по ним руками.

---

## Shared pain (с будущими personas, не закрытыми в v0)

Главный insight (см. [[project-template-shared-pain]]):

- **PM боль (закрыта в v0):** «знаю что нужно пользователю, не могу писать код в нужном темпе/качестве».
- **Developer боль (будущая persona, не v0):** «умею писать код, не знаю что именно полезно делать пользователю».

Template **симметрично закроет обе** через cross-substitution, но **в v0 поддерживается только PM-сторона**:

| Сторона | Что получает | Pain закрывается | Статус v0 |
|---|---|---|---|
| PM | AI как personal developer + automation/reviewer = peer-review team | «писать код» | Supported |
| Developer | Template как PM-discipline (Stages A-C, enforced spec linkage) | «что делать полезного» | Backlog, after PM case validates |

Это **core product thesis** — обе стороны solo workflow должны быть покрыты без человеческих коллег. Но **focus** — сначала PM-сторона работает empirically, потом расширяем.

### Learning layer

Использование template — это **growth path** для PM:

Через работу с template PM постепенно осваивает **архитектуру**: читает substantive «Архитектурный подход» секции в plan'ах, ADR rationale, reviewer architectural-context findings. Через месяцы становится сильнее технически — но всё ещё **не пишет код сам**. Это **архитектурное мышление как растущая компетенция**, не как замена coding-навыков.

Template — **не инструмент-замена-навыков**, а **инструмент-усилитель-навыков** в направлении, противоположном native strength'у пользователя.

---

## Что НЕ persona в v0

- **Developer-as-operator (cross-stack senior / full-stack pro).** Это **планируется**, но добавляется после empirical validation PM-кейса. Сейчас вместо двусторонней ниши — focus на одну, чтобы кейс **заработал**. Кода уровня «template для developer» сейчас не оптимизирован: prompts agents'ов assume PM (не читает код), learning layer всегда on, lite-mode не имеет `c-fast` variant'а под terse output. Когда PM-кейс empirically work'ает — добавится developer-aware behaviour (новой фичей, не молча).

- **Tech lead команды.** Template ориентирован на solo workflow; team-mode (несколько PM-ов, AI как shared resource) — отдельный продукт, Phase 2+.

- **Open-source maintainer крупного проекта.** Discipline OSS-проектов — другой жанр (decentralized review, no single PM control).

- **AI engineer строящий LLM apps.** Они уже глубоко знают AI-workflow patterns; template для них может быть useful, но не primary audience.

- **Студент / hobbyist в обучении кодить.** Trust model нестабильна (учится решать что доверять); template assumes settled trust model.

---

## Resolved decisions

1. **Trust profile** — auto-set `A` на init (PM-only ЦА в v0). Bootstrap-agent не спрашивает Trust profile. Поле `trust_profile:` остаётся в `.ai-pm/.bootstrap-state.md` для backward-compat (existing проекты с B/C accepted as A) и future расширения. Когда developer-кейс добавится — это будет explicit migration с migration script'ом, не silent default change.

2. **Lite-mode для small changes** — реализуется через **PM-driven self-declaration**, не через автоматику. PM в spec'е добавляет `lite-mode: small-fix` (или `lite-mode: bugfix`) в frontmatter spec'а. При lite-mode:
   - Step 2 plan — упрощённый (только секции «Соответствие spec'у» + «Tests plan»; без architectural deep-dive и risk analysis).
   - Step 7 reviewer — всё равно обязателен, но output может быть terser.
   - Размер изменений не enforce'ится автоматически, но spec-discipline linter warns при > 200 lines diff в lite-mode (heuristic).
   - **Запрещён** lite-mode для security-touching фич (auth/crypto/PII/billing/sessions) — даже маленькая правка в этих областях требует full ceremony.
   - **Deprecated:** lite-mode `c-fast` (был для Trust profile C) удалён в v0.7.0. Existing spec'и с `lite-mode: c-fast` — treat as `small-fix`.

3. **Ai-linting-rules tier-метки** (`tier: enforce` / `warn` / `pm-reviews` / `skip`) — preserved для future flexibility. В v0 PM почти не использует `tier: pm-reviews` (он не читает код). Bootstrap-agent на Stage D генерирует defaults — все `tier: enforce`.
