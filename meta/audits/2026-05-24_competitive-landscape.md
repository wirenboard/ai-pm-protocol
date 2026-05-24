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

## Differentiators `ai-pm-protocol` (нет ни у кого из конкурентов)

1. **Symmetric PM ↔ Developer thesis** через trust profiles A/B/C. Все конкуренты предполагают, что user = developer.
2. **Stages A-E (Discovery / Constraints / Solution shape / Process / Bootstrap) до Stage F** как обязательный foundational layer. Все конкуренты стартуют на уровне spec/PRD конкретной фичи.
3. **AP discipline** (AP-1 reactive ADR / AP-2 derived infra / AP-3 operator-gate / AP-19 per-PR atomicity / AP-20 reviewer routing) как операционные инварианты. У других — implicit или отсутствует.
4. **Composition matrices** (`ui_kind`, `db_kind` как multi-value) для composite продуктов. BMAD решает это через expansion packs, остальные — никак.
5. **Specialized reviewer routing** (backend / frontend / db / design / protocol-compliance) с обязательным baseline. У всех остальных — один code-review agent.
6. **Brand voice + per-kind UI style guides** как обязательные foundational artifacts. У других — один UX-док максимум.
7. **Constraints layer (Stage B)** с threat-model / legal-frame / mvp-scope как отдельная фаза. Конкуренты сваливают в PRD.

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

## Risks (где конкуренты могут нас обогнать)

- **Ecosystem effect.** BMAD: 46.7k★, expansion packs, community. У нас single-author репо.
- **Onboarding friction.** Stages A-E mandatory — выше барьер для нового пользователя; BMAD позволяет проскочить в `quick-dev`.
- **First-party tooling.** Spec Kit / Anthropic SDD skills встроены в Claude Code natively. У нас — внешний шаблон.

---

## Recommendation

1. **Не пытаться конкурировать на ecosystem.** Позиционировать как opinionated, узкий, дисциплинированный шаблон для solo-builder'ов, не как general-purpose SDD framework.
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

В эту нишу никто из пяти разобранных конкурентов не целится. Все они assume `user = developer` (BMAD моделирует это team-simulation'ом, Agent OS — context layer'ом, Kiro — IDE wrap'ом).

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
- Не пытаться conkурировать на ecosystem (★, expansion packs) — нам не выиграть и не нужно.
- Не делать `change=folder` à la OpenSpec — migration cost > выигрыш, наш per-PR atomicity (AP-19) решает ту же задачу на уровне PR'а.
