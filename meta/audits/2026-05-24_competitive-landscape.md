# Competitive landscape — где `ai-pm-protocol` стоит на карте SDD-инструментов (2026-05-24)

**Scope:** позиционирование шаблона относительно публичных аналогов категории Spec-Driven Development (SDD). Нужно для positioning'а в README / для решения, какие фичи стоит позаимствовать.

**Method:** web-survey по основным игрокам, выделение differentiators, поиск feature gaps.

---

## Карта категории (2026)

Категория SDD сформировалась в late 2025 — early 2026. Основные игроки:

| Тул | Тип | Размер | Близость к нам |
|---|---|---|---|
| **BMAD-METHOD** | Multi-agent framework | 46.7k★, v6 | ★★★★☆ — ближайший |
| **GitHub Spec Kit** | CLI + slash-commands | first-party | ★★★☆☆ — constitution ≈ foundational docs |
| **AWS Kiro** | IDE (VS Code fork) | enterprise | ★★☆☆☆ — IDE формат |
| **OpenSpec** | Markdown-only | minimal | ★★★☆☆ — brownfield-first ≈ Mode 2/3 |
| **Anthropic SDD skills** | Claude Code skills | first-party | ★★☆☆☆ — feature-level only |
| **Agent OS, Tessl, PromptX, Cursor SDD** | вариации | — | ★★☆☆☆ |
| **AgentMesh** (arXiv) | академический | 4 агента | ★★☆☆☆ — Planner/Coder/Debugger/Reviewer |
| **Ryan Carson 3-step** | PRD → tasks → iterate | playbook | ★☆☆☆☆ |

---

## Differentiators `ai-pm-protocol` (нет ни у кого из аналогов)

1. **Symmetric PM ↔ Developer thesis** через trust profiles A/B/C. Все аналоги предполагают, что user = developer.
2. **Stages A-E (Discovery / Constraints / Solution shape / Process / Bootstrap) до Stage F** как обязательный foundational layer. Все аналоги стартуют на уровне spec/PRD конкретной фичи.
3. **AP discipline** (AP-1 reactive ADR / AP-2 derived infra / AP-3 operator-gate / AP-19 per-PR atomicity / AP-20 reviewer routing) как операционные инварианты. У других — implicit или отсутствует.
4. **Composition matrices** (`ui_kind`, `db_kind` как multi-value) для composite продуктов. BMAD решает это через expansion packs, остальные — никак.
5. **Specialized reviewer routing** (backend / frontend / db / design / protocol-compliance) с обязательным baseline. У всех остальных — один code-review agent.
6. **Brand voice + per-kind UI style guides** как обязательные foundational artifacts. У других — один UX-док максимум.
7. **Constraints layer (Stage B)** с threat-model / legal-frame / mvp-scope как отдельная фаза. Аналоги сваливают в PRD.

---

## Сравнение с BMAD (ближайший)

| Измерение | BMAD | мы |
|---|---|---|
| Discovery | Phase 1 optional, lightweight | Stage A mandatory, 7+ artifacts |
| Constraints (SLO/threats/legal) | implicit в PRD | Stage B explicit |
| ADR философия | проактивно в Phase 3 (BDUF) | реактивно при fork (AP-1) |
| Infra creation | в Phase 3 architecture | derived from A-D (AP-2) |
| Multi-domain | expansion packs | composition matrices |
| Code review | single skill (Quinn) | orchestrator + 5 specialized |
| PR granularity | sprint/story | per-PR atomic (AP-19) |
| Operator authority | collaborator, Party Mode | hard gate (AP-3) |
| Persona стиль | named (Mary/Preston/Winston/...) | functional roles |
| Brand/UI | один UX skill | brand-voice + per-kind |
| Brownfield | Phase 0 document-project | Mode 2/3 READ-pass |

**Философское различие:** BMAD — «AI-driven agile team simulator» с BDUF. Мы — «solo-operator discipline framework» с reactive architecture и hard operator-gate.

---

## Feature gaps — что можно позаимствовать

Кандидаты на backlog (не commit, оценка ценности отдельно):

| Откуда | Что | Зачем |
|---|---|---|
| BMAD | `prfaq` skill | Amazon-style press-release как часть Stage A |
| BMAD | `correct-course` skill | Explicit «мы сбились, пересобираем plan» (сейчас implicit через rework) |
| BMAD | `retrospective` skill | Post-feature reflection как явный artifact |
| BMAD | PASS / CONCERNS / FAIL verdict | Агрегированный verdict у reviewer'а (сейчас только severity-tagged findings) |
| BMAD | `investigate` (forensic mode) | Отдельный mode для разбора инцидентов |
| Spec Kit | Executable spec validation | Spec как machine-checkable contract, не только prose |

---

## Risks (где аналоги могут нас обогнать)

- **Ecosystem effect.** BMAD: 46.7k★, expansion packs, community. У нас single-author репо.
- **Onboarding friction.** Stages A-E mandatory — выше барьер для нового пользователя; BMAD позволяет проскочить в `quick-dev`.
- **First-party tooling.** Spec Kit / Anthropic SDD skills встроены в Claude Code natively. У нас — внешний шаблон.

---

## Recommendation

1. **Не пытаться выигрывать на ecosystem.** Позиционировать как opinionated, узкий, дисциплинированный шаблон для solo-builder'ов, не как general-purpose SDD framework.
2. **README должен явно ссылаться на категорию** (SDD) и **называть ближайшие альтернативы** (BMAD, Spec Kit) с честным сравнением — это снижает «not invented here» подозрение и помогает self-selection правильной аудитории.
3. **Рассмотреть** добавление `retrospective` artifact'а после Stage F micro-cycle (low cost, high value) — единственный явный gap по сравнению с BMAD, который укладывается в нашу философию.
4. **Не добавлять** named personas и Party Mode — это против AP-3 operator-gate философии.

---

## Sources

См. сообщения от 2026-05-24 в чате; основные:

- `docs.bmad-method.org/reference/workflow-map/`
- `redreamality.com/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/`
- `medium.com/@tim_wang/spec-kit-bmad-and-agent-os-e8536f6bf8a4`
- `github.com/cameronsjo/spec-compare`
- `thebcms.com/blog/spec-driven-development`
- `arxiv.org/pdf/2507.19902` (AgentMesh)
- `github.com/github/spec-kit` (fetched 2026-05-24)
- `github.com/Fission-AI/OpenSpec` (fetched 2026-05-24)
- `buildermethods.com/agent-os` (fetched 2026-05-24)
- `kiro.dev` (fetched 2026-05-24)

---

## TODO: пожелания к переработке README (для будущего pass'а)

Не редактировать сейчас, чтобы не мешать параллельной работе над проектом. Зафиксированы выводы из доп. deep-dive'ов (Spec Kit / OpenSpec / Agent OS / Kiro) от 2026-05-24, дополнивших исходный аудит.

### Главный вывод позиционирования

Сейчас README читается как «yet another SDD framework» — это создаёт ложное сравнение с Spec Kit / BMAD / OpenSpec на их поле (workflow shape). Более честная и **более узкая** формулировка:

> **Discipline framework для асимметричного PM/dev сотрудничества с AI**, где оператор может быть PM'ом со слабой tech intuition, а не developer'ом.

В эту нишу никто из пяти разобранных аналогов не целится. Все они assume `user = developer` (BMAD моделирует это team-simulation'ом, Agent OS — context layer'ом, Kiro — IDE wrap'ом).

### Что обязательно отразить в новом README

1. **Назвать категорию (SDD) и ближайших альтернатив** (BMAD, Spec Kit, OpenSpec, Agent OS, Kiro) с честным короткиим сравнением — снижает «not invented here» подозрение, помогает self-selection.
2. **Явно сказать «когда брать НЕ нас»**: solo-developer без PM-asymmetry → OpenSpec легче. Команда с enterprise compliance → Spec Kit стандартнее. AWS-shop → Kiro нативнее.
3. **Перечислить уникальные опоры** (trust profiles A/B/C, AP-discipline как numbered invariants, Constraints layer Stage B, composition matrices, per-kind UI guides, Tier framework, 5 modes) — эти семь пунктов реально не покрыты никем.
4. **Переформулировать Stages A-E из BDUF-стиля в iterative-стиль.** Сейчас «mandatory» читается как waterfall, хотя de facto Tier framework позволяет skip. OpenSpec явно отрицает «phase gates» — рынок этот нарратив подхватил.
5. **Позиционировать как complement, не replacement** к Claude Code (по аналогии с Agent OS «complement to Cursor / Claude Code») — это снижает switching cost восприятия.

### Кандидаты на feature-backlog (отдельная оценка)

Из доп. deep-dive'ов, не включённые в исходную таблицу Feature gaps:

- **Spec Kit** — `/analyze` как explicit oper-команда (ad-hoc protocol-compliance в середине Stage F); templates для `/checklist` в `doc/_templates/`.
- **OpenSpec** — brownfield как **дефолт** в onboarding (сейчас 3-choice, но default-greenfield); формулировка «iterative not waterfall».
- **Agent OS** — automated Discover для Mode 2 (code-scan'ит и драфтит standards для legacy); standards vs foundational как отдельные категории по lifecycle.
- **Kiro** — EARS notation (`WHEN ... the system SHALL ...`) в acceptance секции spec'а; hooks-style automation на git-events через settings.json.

### Risks для отражения в позиционировании

- **Vendor-neutral wave**: Spec Kit (30+ агентов) + OpenSpec (20+) задают ожидание agent-agnostic. Мы Claude-only — назвать это явно как осознанный trade-off, а не дыру.
- **«Complement, not replace» framing** (Agent OS) — снижает switching cost для пользователя; нам стоит явно занять ту же позицию.
- **IDE-bundled distribution** (Kiro): если pattern сработает у Cursor / Anthropic, CLI/template-based решения станут tier-2. Это долгосрочный repositioning risk, не immediate.

### Что НЕ делать

- Не добавлять named personas (Mary / Quinn) — против AP-3 operator-gate.
- Не добавлять Party Mode (multi-agent collaboration) — same reason.
- Не пытаться выигрывать на ecosystem (★, expansion packs) — нам не нужно и не выиграть.
- Не делать `change=folder` à la OpenSpec — migration cost > выигрыш, наш per-PR atomicity (AP-19) решает ту же задачу на уровне PR'а.

---

## Почему аналоги делают именно так (стратегические обоснования)

Компактная фиксация «почему» за каждым из 4 не-BMAD аналогов. Полные prose deep-dive'ы были раньше в этом файле, потом откатаны как избыточные — здесь оставлены только ключевые стратегические выводы.

### GitHub Spec Kit — почему линейный phase-gate + 30+ агентов

- **Линейная phase-gate модель** (constitution → specify → clarify → plan → tasks → implement → analyze) — для **команд** проще: каждый знает, в какой фазе фича.
- **Constitution отдельным шагом** — Microsoft compliance heritage: enterprise хочет видеть governance artifact для аудита. Sales-driven design, не философия.
- **`/clarify` как отдельная команда** — признание, что spec сразу полным не бывает; но они не делают это implicit (как мы через Stage A questions), а явным command'ом. Меньше доверия агенту самому распознать gap.
- **30+ агентов** требуют abstraction layer над командами — никаких subagents, никакого specialized routing → low-common-denominator подход. Отсюда отсутствие наших AP-19/AP-20.
- **Целевая ставка:** «стандарт для SDD как категории». Не лучший инструмент — **общий знаменатель**.

### OpenSpec — почему markdown-only + brownfield-first + change=folder

- **Change = folder** (а не linear phase) — потому что real software develops в нелинейных, часто параллельных изменениях. Folder-per-change даёт **change as atomic unit**, который можно отменить, отложить, переоткрыть. Их аналог нашего AP-19, но на уровне spec'а.
- **Brownfield-first** — explicit reaction на то, что Spec Kit / BMAD assume greenfield. «Реальный проект уже что-то имеет; spec должен впитывать этот факт». Близко нашему Mode 2, но **default'ом**, а не отдельным mode.
- **Markdown-only, no tooling** — anti-vendor-lock. Никакой CLI без markdown, никакой web-UI, никакой DB. Более радикальная версия нашего `.ai-pm/`.
- **Целевая ставка:** «легче чем Spec Kit, не залочены как Kiro». Solo / small teams, которые хотят дисциплину без heavyweight ceremony.

### Agent OS — почему complement, не replacement + три слоя

- **Standards отдельно от Specs** — главная боль не в spec-creation, а в re-teaching context каждой сессии. Spec можно написать; стандарты нужно дисциплинированно injected в каждый context. Решают **distribution problem**, не **authoring**.
- **Discover-шаг (extract patterns from existing code)** — automated reverse-engineering стандартов. У нас аналог — Mode 2 READ-pass, но **руками оператора**. Agent OS пытается **автоматизировать**.
- **Product layer** между Standards и Specs — признание, что технические стандарты не дают business-intent direction.
- **Lightweight, fits how you already build** — anti-prescription. Enterprise не хочет переучиваться.
- **Целевая ставка:** не end-to-end SDD-фреймворк, а **context layer над агентом**. Единственный из 5, кто отказался от категории «инструмент» в пользу категории «adapter».

### AWS Kiro — почему IDE fork + EARS + hooks

- **IDE fork (не extension)** — потому что extension не может перехватить full lifecycle (file-save events до изменений на disk), а native MCP integration требует control над runtime. Плюс migration VS Code settings/plugins убирает switching cost.
- **EARS notation** (Easy Approach to Requirements Syntax: «WHEN <trigger> the system SHALL <response>») — formal grammar для requirements. Снижает amplitude of LLM-interpretation. Альтернатива executable spec — через структуру языка, а не DSL.
- **Hooks как first-class** — automation поверх file-save events. Shift-left от reviewer'а к compiler-like fast feedback.
- **Глубже: почему IDE = right form factor для AWS.** Они уже владеют CodeWhisperer, CodeCatalyst, Q Developer. Kiro = «spec-driven IDE», который встаёт между разработчиком и AWS-cloud услугами. **Distribution play, не workflow play.**

---

## Uniqueness analysis: не велосипед ли это (что наше, что re-invention)

Контекст: фреймворк строится для собственной боли и боли коллег по цеху, не для общего рынка. Это меняет тест с «есть ли differentiator?» на «решают ли существующие тулы именно НАШУ боль?».

### Genuinely unique (нет ни у одного из 5)

1. **Symmetric PM ↔ Developer thesis через trust profiles A/B/C.** Все пятеро assume `user = developer`. Никто не моделирует ситуацию, когда оператор — PM со слабой tech intuition. Прямое следствие boli коллег.
2. **AP-discipline как named, numbered invariants.** У BMAD есть implicit principles, у Spec Kit — constitution, но **citable numbered invariants**, на которые можно ссылаться в reviews / plans / ADR — нет ни у кого.
3. **Constraints layer (Stage B: threats / legal / SLO / MVP scope)** как отдельная фаза. У остальных — implicit в PRD или steering files.
4. **Composition matrices** (`ui_kind`, `db_kind` как multi-value). BMAD решает через expansion packs (per stack); мы — декомпозицией одного шаблона.
5. **Per-kind UI style guides + brand voice** как foundational artifacts. У BMAD один UX-skill; у остальных — никак.
6. **Tier framework** (auto-extract / mini-research / promote / override) — explicit gradient operator-involvement per artifact.
7. **5 modes с разным workflow shape** (new-product / feature / rework / bug-fix / template-sync). У всех — один workflow для всех типов изменений.

### Есть у других, но мы покрываем сильнее

- **Specialized reviewer routing + always-on protocol-compliance baseline.** BMAD — Quinn (один), Spec Kit — `/analyze` (manual). У нас auto-routing + mandatory baseline + domain-aware specialists.
- **Brownfield**: OpenSpec — default, Agent OS — automated Discover, BMAD — document-project. У нас Mode 2/3 + 3-choice (Quick/Staged/Skip). Где-то посередине.
- **Operator-gate (AP-3)**: у BMAD Party Mode (collab), у Kiro «you stay in control». Hard-gate как инвариант — только у нас.

### Где это re-invention

- **Spec → plan → tasks → code → review progression**: универсально. Stage F = не differentiator.
- **Markdown-only, git-native**: OpenSpec сделал это радикальнее. Мы «как все».
- **Foundational docs / constitution / steering как persistent context**: концепт есть у Spec Kit, Agent OS, Kiro. Наша разница — content division, не сама идея.
- **Slash-commands + templates + subagents**: pattern из коробки Claude Code, не наш design.

### Вердикт

Не велосипед. Из ~10 опор протокола **~6-7 реально уникальные**, ~2 реализуемые сильнее среднего, ~3 универсальные. Уникальные опоры — это **наша formulation of the problem**, которую существующие тулы не формулируют (PM-asymmetry, hard operator-gate как инвариант, Constraints как фаза, composition over expansion-packs). Не велосипед — **другой вид транспорта**.

---

## After-implementation проекция (если реализовать Paths A+B+C+advisor)

Forward-looking: как выглядит наша позиция после реализации всех 3 paths + 4 mitigations + discipline-advisor. Используется как target-state для второго Claude'а / future planning.

### Сводная репозиция

| Ось | Сейчас | После реализации |
|---|---|---|
| Минимальный surface area | Самый тяжёлый (~25 artifacts) | Layer 0 ≈ OpenSpec (4 artifacts) |
| Максимальный surface area | Heaviest | Тот же (Layer 4 = текущий) |
| Mandatory scope | Всё | Floor only + advisor recommendations |
| Onboarding narrative | «Stage A-E mandatory» (читается как BDUF) | «Start Layer 0, advisor подскажет что добавить» |
| Adaptive intelligence | Нет | discipline-advisor (evidence-based) |
| Discipline floor | Все AP-инварианты always-on | То же (preserved) |
| Multi-agent support | Claude-only | Claude-only (не меняется) |
| Ecosystem | Single-author | Single-author |

### Где становимся уникально сильны

1. **Adaptive depth** — единственные с Layer 0 (OpenSpec-like) **и** Layer 4 (BMAD-like) **и** smart routing между ними. BMAD имеет `quick-dev`, но это discrete switch, не continuous layered.
2. **Discipline floor at Layer 0** — даже на минимуме AP-3/AP-19/AP-20 always-on. OpenSpec на минимуме = zero invariants; мы — invariants + nothing else.
3. **Evidence-based advisor** — Spec Kit `/analyze` rule-based, manual, after-the-fact. Agent OS Discover — для standards, не для stage selection. Наш advisor — proactive, evidence-pointered, для bootstrap-решений.
4. **PM/dev asymmetry** — остаётся уникальной, плюс advisor её усиливает (PM без tech-intuition получает обоснованные рекомендации с pointer'ами на код, не голый quiz).

### Где не выигрываем (структурные пределы)

- **Ecosystem (BMAD 46.7k★)** — не закроется реализацией, это adoption-curve.
- **Vendor-neutral (Spec Kit 30+ agents, OpenSpec 20+)** — мы Claude-only by design, осознанный trade-off.
- **IDE-native (Kiro)** — мы CLI/template, не IDE.
- **Чистая минималистичность (OpenSpec, Ryan Carson)** — даже на Layer 0 тяжелее, потому что несём discipline floor.

### Близость аналогов к новой позиции

| Тул | Old similarity | New similarity | Почему изменилось |
|---|---|---|---|
| BMAD | ★★★★☆ | ★★★☆☆ | Их `quick-dev` discrete; наш layering continuous + smart |
| OpenSpec | ★★★☆☆ | ★★★★☆ | Layer 0 близок к их default'у |
| Spec Kit | ★★★☆☆ | ★★★☆☆ | `/analyze` ≈ advisor по концепту, но разная имплементация |
| Agent OS | ★★☆☆☆ | ★★★☆☆ | Discover-flow концептуально близок advisor'у |
| Kiro | ★★☆☆☆ | ★★☆☆☆ | IDE-fork остаётся ортогональным |

### Net call

Repositioning из «heaviest disciplined framework with high friction» в **«only framework that auto-scales discipline to your actual code»**.

Это первая позиция, которая sellable широкой аудитории без compromise философии. Уникальные опоры **сохраняются**, но перестают быть entry-barrier'ом — они активируются advisor'ом тогда, когда нужны.

Остающиеся weaknesses (ecosystem, vendor-neutrality, IDE) — структурные, не решаются этой реализацией. Принимаем как осознанные trade-off'ы.

**Hot take:** при чистой реализации становимся **единственным фреймворком категории**, который честно отвечает «нужна ли мне эта сложность?» **за пользователя**, на основе его кода. Это сильнее, чем у всех пятерых.
