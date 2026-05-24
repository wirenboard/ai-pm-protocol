# Personas — ai-pm-protocol

**Stage A artifact.** Кто пользуется этим template'ом. **3 архетипа** в v0, различающихся **trust model к AI-generated коду** — это определяющий фактор того, как template сервит своего пользователя.

Эти personas — **пользователи template'а**, не пользователи продуктов, которые с его помощью строятся.

**Контекст:** текущий первый пользователь template'а соответствует Persona A; он же — builder/dogfooder template'а.

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

**Какой mode преимущественно использует.** `new-product` (первый продукт через template) → `feature` (фичи в собственных продуктах) → реже `rework`.

**Уникальные template-нужды:**
- Reviewer-agent output должен быть **verbose и behavior-centric**, не code-centric.
- Spec-discipline линтеры — **строжайшая категория**; без них PM слепнет.
- Acceptance testing scenarios в spec'е — exhaustive, потому что PM идёт по ним руками.

---

## Persona B: Cross-stack senior dev (вынужденный из своего домена)

**Краткий портрет.** Senior разработчик 5-15+ лет опыта в **одном стеке** (например, backend Python/Go/Java, или frontend React/Vue). Сейчас вынужден писать в **другом стеке** — backend developer строит frontend для своего solo-продукта, или frontend dev делает backend / infra / DB. **AI используется как expertise gap-filler** в незнакомом стеке.

**Shared pain (см. project framing):** «умею писать код, но не всегда уверен, что делаю **полезную** фичу, а не technically correct unnecessary». Template даёт **PM-discipline** (Stages A-D, persona/journey/scope linkage) как product-mindset coach, не только code-discipline.

**Trust model — гибридная:**
- В **родном** стеке: читает AI-generated код легко и критически. Replyer-agent — extra safety net, не primary control.
- В **чужом** стеке: trust model как у Persona A — полагается на reviewer + линтеры + security catalogue. Может прочитать diff с трудом, но не может уверенно ревьюить best-practices.
- Architecture-level: уверен везде.
- Security в чужом стеке: **боится больше всего** — знает, что AI на неродном стеке может сделать subtle security bugs, которые он не поймает.

**Что хочет от template'а:**
- Particularly strong **security catalogue** (OWASP/CWE), потому что в чужом стеке security — самый риск.
- Architecture linting (он понимает архитектуру глобально, но AI может локально нарушать boundaries).
- Не мешать ему ревьюить код в родном стеке — template не должен «over-explain» обвязку, которую он понимает быстрее, чем читает её документацию.

**Что НЕ хочет:**
- Patronizing объяснений в области, где он сам эксперт.
- Слишком много церемоний — у него ограниченное окно работы поверх daily job'а.
- Template, который требует понимать обвязку, которую он не выбирал.

**Технологический фон.** Глубокая экспертиза в одном стеке + знание базовых принципов в смежных. Использует AI как productivity multiplier в родном стеке, как expertise multiplier в чужом.

**Какой mode преимущественно использует.** Зависит от ситуации: новый side-project (`new-product`) или фичи в существующем (`feature`).

**Уникальные template-нужды:**
- Recipe per stack (`doc/_recipes/cache/`) — критично, потому что в чужом стеке он не выберет правильные tools сам.
- Reviewer-agent **усиленный в out-of-domain коде**: больше findings, больше context, явные ссылки на стандарты.
- Возможность tag'нуть в `ai-linting-rules.md`: «эту категорию я ревьюю сам» vs «эту делегирую template'у».

---

## Persona C: Full-stack/specialist профи, читает AI-код

**Краткий портрет.** Опытный разработчик (full-stack или специалист), уверенно работает в своём диапазоне, использует **AI как productivity multiplier**. Treats AI как overconfident junior: «вроде правильно, но проверю». **Читает весь AI-generated код**, иногда правит руками то, что AI «уже почти сделал».

**Shared pain (см. project framing):** «code-skills are not the bottleneck — useful feature design is». Template даёт **enforce'нную PM-discipline** (Spec-discipline catalogue § 9 не даст залить «технически правильную, но ненужную» фичу без persona/journey/mvp-scope linkage). Это **coaching через process**, не через people.

**Trust model:**
- PM сам — **primary reviewer**, читает каждый diff.
- Reviewer-agent — **secondary safety net** (вторая пара глаз).
- Линтеры — **third safety net** (catch-all).
- Не верит AI слепо, не верит и template'у слепо; верит своему code-review.

**Что хочет от template'а:**
- **Дисциплина процесса**, не дисциплина кода. Хочет, чтобы AI **писал в правильном порядке**: spec → plan → tests → code, не наоборот.
- Архитектурные правила — но скорее как backup, не как primary control.
- CI gates — да, но **flexible**: иногда `// eslint-disable-next-line` имеет смысл, и template должен не мешать (но требовать reason-комментарий).

**Что НЕ хочет:**
- Reviewer-agent, который выдаёт обширные findings там, где PM уже проверил code'у руками — это шум.
- Slow CI gates, которые блокируют его flow.
- Sсhalfile excessive ceremony (например, отдельные _spec/_plan/_review файлы для каждой мелкой правки — он не хочет писать всю эту обвязку для bug-fix'а в 3 строки).

**Технологический фон.** Comfortable c множеством стеков, custom linter rules может написать сам. Использует Claude Code как daily инструмент.

**Какой mode преимущественно использует.** Зависит от проекта; чаще всего `feature` и `rework` в собственных или поддерживаемых проектах.

**Уникальные template-нужды:**
- **Lighter ceremony для small changes** — не каждый bug-fix требует full spec/plan. Template должен предлагать «mini-mode» для quick fixes (но не заменяющий fullmode для значимых изменений).
- Кастомизируемые reviewer-agent rules: «не комментируй такие-то паттерны, я их сам ловлю».
- Strong **architecture linting**, потому что AI subtly ломает архитектуру там, где Persona C может пропустить при ревью.

---

## Что НЕ persona в v0

- **Tech lead команды.** Template ориентирован на solo workflow; team-mode (несколько PMов, AI как shared resource) — отдельный продукт, Phase 2+.
- **Open-source maintainer крупного проекта.** Discipline OSS-проектов — другой жанр (decentralized review, no single PM control).
- **AI engineer строящий LLM apps.** Они уже глубоко знают AI-workflow patterns; template для них может быть useful, но не primary audience.
- **Студент / hobbyist в обучении кодить.** Trust model нестабильна (учится решать что доверять); template assumes settled trust model.

---

## Shared pain across all personas

Главный insight (см. [[project-template-shared-pain]]):

- **PM (Persona A) боль:** «знаю что нужно, не могу писать код в нужном темпе/качестве».
- **Developer (B/C) боль:** «умею писать код, не знаю что именно полезно делать».

Template **симметрично закрывает обе** через cross-substitution:

| Сторона | Что получает | Pain закрывается |
|---|---|---|
| PM (A) | AI как personal developer + automation/reviewer = peer-review team | «писать код» |
| Developer (B/C) | Template как PM-discipline (Stages A-D, enforced spec linkage) | «что делать полезного» |

Это **core product thesis** — обе стороны solo workflow покрыты без человеческих коллег.

### Bidirectional learning by usage

Использование template — это **growth path** в обе стороны:

- **PM (Persona A)** через работу с template постепенно осваивает **архитектуру**: читает substantive «Архитектурный подход» секции в plan'ах, ADR rationale, reviewer architectural-context findings. Через месяцы становится сильнее технически — но всё ещё **не пишет код сам**. Это **архитектурное мышление как растущая компетенция**, не как замена coding-навыков.

- **Developer (B)** в чужом стеке постепенно осваивает **соседний стек** — через AI-партнёра как expertise-bridge + reviewer-agent как coach. Через рабочий проект learns ту экосистему, к которой пришёл.

- **Developer (B/C)** через PM-discipline (Stages A-D, persona/journey/threat-model thinking) постепенно осваивает **продуктовое мышление** — почему фича нужна именно так, как она привязана к persona, какие edge cases важны.

Template — **не инструмент-замена-навыков**, а **инструмент-усилитель-навыков**. Каждая persona растёт в сторону, противоположную их native strength'у.

---

## Cross-persona observations

| Категория template-фичи | Persona A | Persona B | Persona C |
|---|---|---|---|
| Reviewer-agent | CRITICAL (only code-level safeguard) | Critical out-of-domain, useful in-domain | Useful (second pair of eyes) |
| Spec/use-case linting | CRITICAL | Important | Important |
| Code linting catalogue | CRITICAL | Critical out-of-domain | Useful |
| Security catalogue | CRITICAL | CRITICAL out-of-domain | Important |
| Architecture linting | Critical | Critical | Critical |
| Reviewer output verbosity | Verbose, behavior-centric | Verbose out-of-domain, terse in-domain | Terse |
| Spec ceremony per feature | Full (always) | Full | Lighter для small fixes |

Template должен **support всех трёх** без принуждения к одной trust model. Это значит:
- Reviewer prompts параметризуются по trust profile (можно задать в overlay'е).
- Architecture and security catalogues — обязательны для всех.
- Spec ceremony — настраиваемая (full / lite), но не отключаемая полностью.

---

## Resolved decisions

1. **Trust profile** — устанавливается **explicitly на init** через bootstrap-agent (3-й вопрос вместе с Mode + Integration). Хранится в `.ai-pm/.bootstrap-state.md` и read'ится subagent'ами. Default — A (PM-manager, самый строгий профиль; B/C получат немного больше context'а, но это информативно). PM может изменить позже edit'ом state файла.

2. **Lite-mode для small changes (Persona C)** — реализуется через **PM-driven self-declaration**, не через автоматику. PM в spec'е добавляет `## Lite-mode: yes` (или `lite-mode: small-fix` в frontmatter spec'а). При lite-mode:
   - Step 2 plan — упрощённый (только секции «Соответствие spec'у» + «Tests plan»; без architectural deep-dive и risk analysis).
   - Step 7 reviewer — всё равно обязателен, но output может быть terser.
   - Размер изменений не enforce'ится автоматически, но spec-discipline linter warns при > 200 lines diff в lite-mode (heuristic).
   - **Запрещён** lite-mode для security-touching фич (auth/crypto/PII/billing/sessions) — даже маленькая правка в этих областях требует full ceremony.

3. **Tagging «эту категорию я ревьюю сам» (Persona B)** — реализуется в `.ai-pm/doc/ai-linting-rules.md` через **tier-метки** per категория:
   - `tier: enforce` (default) — CI fail при нарушении.
   - `tier: warn` — CI warning, не block.
   - `tier: pm-reviews` — категория не проверяется CI; PM (или Persona B в native стеке) проверяет руками.
   - `tier: skip` — категория явно отключена с обоснованием в комментарии.

   Bootstrap-agent на Stage E генерирует defaults — все `tier: enforce`. PM редактирует ручно после первой new-product mode итерации.
