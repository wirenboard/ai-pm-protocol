# Complexity honesty — не слишком ли сложно решение, есть ли путь проще (2026-05-24)

**Scope:** честный разбор сложности `ai-pm-protocol` относительно альтернатив. Каждая «уникальная фишка» проверяется на marginal value vs marginal cost. Цель — понять, что является pay-for-what-you-use, что conditional value, что sunk overhead.

**Method:** сравнение surface area с аналогами (см. `2026-05-24_competitive-landscape.md`), декомпозиция уникальных опор, тест на user-profile fit.

---

## Объективный замер сложности

| Тул | Минимум команд для фичи | Mandatory artifacts | Stages до Stage F |
|---|---|---|---|
| Ryan Carson 3-step | 3 | 2 (PRD, tasks) | — |
| OpenSpec | 1 (`/opsx:propose`) | 4 (proposal, specs, design, tasks) | — |
| Spec Kit | 4 (`/constitution`, `/specify`, `/plan`, `/implement`) | 4 + constitution | constitution |
| Agent OS | 4 (Install/Discover/Inject/Shape) | standards + product + specs | standards setup |
| BMAD | 6 phases | разное per phase | Phase 1-2 |
| **мы** | **~10+ artifacts через Stages A-F** | **15+ mandatory в полном Mode 1** | **5 stages (A-E)** |

Мы на дальнем конце spectrum'а. Это объективный факт, не оценка.

---

## Декомпозиция уникальных опор: что pay-for-use, что overhead

### 1. Tier framework — **pure win**

Auto-extract / mini-research / promote / override. Артефакт может быть skip'нут на низком Tier'е, без церемонии.

**Тест:** на простом проекте Tier 0/1 коллапсирует большинство артефактов. Сложность исчезает там, где она не нужна.

**Вердикт:** ✅ Pay-for-what-you-use. Оставлять.

### 2. 5 modes (new-product / feature / rework / bug-fix / template-sync) — **pure win**

Разный workflow shape: bug-fix не идёт через Stages A-E.

**Тест:** mode переключает surface area. Сложность не платится за каждый change-type.

**Вердикт:** ✅ Pay-for-what-you-use. Оставлять.

### 3. Specialized reviewer routing — **modest win**

Backend / frontend / db / design / protocol-compliance. Routing automatic.

**Тест:** на маленькой фиче протокольный baseline всё равно запускается → marginal cost = 0. На большой — найдёт то, что один reviewer пропустит.

**Вердикт:** ✅ Pay-for-what-you-use. Оставлять.

### 4. Constraints layer (Stage B) — **conditional value**

Threats / legal / SLO / MVP scope.

**Тест:**
- Banking / healthcare / любой compliance-sensitive → invaluable, save'ит позже от incident'а.
- Solo personal project, no users → пустые артефакты, чистый overhead.

**Вердикт:** ⚠️ Conditional. Должен быть **opt-in**, не mandatory. Сейчас mandatory → wasted time для 60-80% потенциальных пользователей.

### 5. Composition matrices (`ui_kind` × `db_kind`) — **conditional value**

Multi-domain продукт через one template + decomposition.

**Тест:**
- ≥2 UI kinds или ≥2 DB kinds → высокая ценность, иначе пришлось бы дублировать spec'и.
- Single web app + single Postgres → matrix вырождена в скаляр, чистый overhead вокруг.

**Вердикт:** ⚠️ Conditional. Должен быть **opt-in**, активируется когда `ui_kind` / `db_kind` действительно множественны.

### 6. Per-kind UI style guides — **conditional value**

ui-style-guide-web / native-mobile / native-desktop / tui / cli / embedded + brand voice.

**Тест:**
- ≥2 UI kinds → invaluable для consistency.
- Один kind → нужен **один** UI guide, остальные mandatory шаблоны — overhead.

**Вердикт:** ⚠️ Conditional. Должен быть scoped к используемым kind'ам, не all-or-nothing.

### 7. Trust profiles A/B/C — **conditional value**

Симметричный PM/dev workflow.

**Тест:**
- Оператор — PM со слабой tech-intuition → invaluable, без этого framework не работает для него.
- Оператор — developer (≈80% потенциальной аудитории) → profile A везде, ничего не меняется. Концепт читается, но в работе invisible.

**Вердикт:** ⚠️ Conditional. Для developer-only пользователей — концептуальный overhead в документации, не операционная нагрузка. Реальная цена низкая, ценность только для целевой ниши.

### 8. AP discipline как numbered invariants — **discipline overhead**

AP-1 reactive ADR / AP-2 derived infra / AP-3 operator-gate / AP-19 per-PR atomicity / AP-20 reviewer routing. Numbering позволяет citing в reviews / plans / ADR.

**Тест:**
- Команда multi-person / audit-driven → numbering = шарiable language, окупается.
- Solo session 1 час → «не делай AP-19» проще говорить, чем «один логический change на PR». Цитирование = ритуал.

**Вердикт:** ⚠️ Discipline overhead для solo, win для команды / audit-trail кейсов. Самы invariants полезны всегда; **их numbering** — это вес, который окупается только на дистанции.

---

## Итоговая раскладка

| Категория | Опор | Что делать |
|---|---|---|
| Pure win (pay-for-use) | 3 (Tier, Modes, Reviewer routing) | Оставлять как есть. |
| Conditional value | 4 (Constraints, Composition, Per-kind UI, Trust profiles) | Делать **opt-in**, не mandatory. |
| Discipline overhead | 1 (AP numbering) | Принимаем сознательно как trade-off (без этого нет «discipline framework» бренда). |

**Брутальный вывод:** ~половина наших уникальных опор сейчас **навязывается** там, где не нужна. Это создаёт впечатление «огромной сложности», хотя реальная нагрузка распределена неравномерно.

---

## Что показывает сравнение с аналогами

- **OpenSpec / Ryan Carson** — single-purpose, минимум surface area. Покрывают solo-dev case. **Если ваш проект — это их кейс, наш фреймворк overengineering.**
- **BMAD** — сложнее их, но имеет `quick-dev` escape hatch для простых случаев. У нас аналога нет.
- **Spec Kit / Agent OS / Kiro** — заточены под команды; layered, но без escape hatch для solo-mode.
- **Только BMAD** среди разобранных имеет explicit «light path». Мы — нет.

---

## Можно ли решить ту же задачу проще

Зависит от формулировки «задачи»:

- **Задача = «ship a small feature in a personal project»** → да, OpenSpec / Ryan Carson достаточно. Наш фреймворк wasted time.
- **Задача = «PM с weak tech-intuition сотрудничает с AI на multi-stack продукте, где compliance + UX consistency + reviewer trust имеют значение»** → нет, простые альтернативы дырявят критически.

Сложность оправдана **тогда и только тогда**, когда у пользователя реально есть проблема, которую она решает. У 60-80% потенциальных читателей README такой проблемы нет.

---

## Два пути

### Path A — агрессивно сузить аудиторию в README

Перепозиционировать как «**discipline framework для асимметричного PM/dev сотрудничества на compliance-sensitive multi-stack продуктах**». Люди вне ниши self-select out по заголовку.

**+** Фреймворк остаётся idea-pure, ничего ломать не надо.  
**−** Терять users, которым достаточно minimal mode — они могли бы вырасти в нашу нишу через 6 месяцев.

### Path B — добавить minimal mode (рекомендую)

Onion-структура:
- **Layer 0 (default):** Stage F only. Spec → plan → coder → reviewer. AP-3, AP-19, AP-20 enabled. 4 artifacts per feature. Сопоставимо с BMAD `quick-dev` / OpenSpec.
- **Layer 1 (opt-in):** + Stage A (audience, problem). Когда нужна продуктовая ясность.
- **Layer 2 (opt-in):** + Stage B (Constraints). Когда появляются compliance / threats / SLO.
- **Layer 3 (opt-in):** + Stage C-D (Solution shape, Process). Когда продукт растёт.
- **Layer 4 (opt-in):** + composition matrices, per-kind UI, trust profiles B/C. Когда multi-stack / PM-asymmetric.

**+** Discipline brand сохраняется (AP-3/19/20 enabled с Layer 0); сложность opt-in; framework растёт с проектом.  
**−** Требует рефакторинга `project-bootstrap` агента и templates'ов; documentation effort.

### Риск Path B и mitigation

Риск — бренд «дисциплинированный фреймворк» размывается, если пользователь видит «опционально, опционально, опционально».

Mitigation: **AP invariants (operator-gate, per-PR atomicity, reviewer routing) обязательны со Layer 0**. Опциональные части — это **content layers** (Constraints, Composition, Trust profiles), а не **discipline layers**. Discipline остаётся monolith'ом, foundation становится layered.

---

## Рекомендация

1. **Path B** — добавить minimal/layered mode. Это структурное изменение, требующее отдельного plan'а; не делать в одной сессии.
2. **В README (когда переработка случится)** явно сказать: «по умолчанию минимально; включать слои по мере того, как они нужны». Это снимает 80% «too complex» возражений.
3. **Эту переработку не путать с README repositioning** из `2026-05-24_competitive-landscape.md` — там про позиционирование, здесь про feature reshape.
4. **AP invariants не диверсифицировать.** Их вес — это и есть «дисциплина», ради которой framework существует.

---

## Open questions для оператора

- **Какой % реальных пользователей попадает в conditional-value категории (Constraints / Composition / Per-kind UI / Trust profiles)?** Если ≥50% — текущий mandatory подход оправдан. Если <30% — Path B критичен.
- **Готов ли разделить «discipline layer» и «content layer»** концептуально? Это меняет mental model фреймворка.
- **Готов ли смириться** с тем, что Layer 0 пользователи не увидят differentiator'ов, и часть из них уйдёт к OpenSpec? Это плата за growth funnel.

---

## Token/money cost — операционная половина complexity

Complexity = не только cognitive load оператора, но и **расход контекста + денег** на каждую сессию. Вторая половина оценки.

### Где деньги протекают

1. **Subagent fan-out** — самая большая статья. Primary reviewer спавнит до 5 sub-reviewers на каждый PR. Каждый загружает независимый context (protocol docs + foundational + plan + diff). Для PR на 50 строк это **≈5× overhead** относительно одного reviewer'а.
2. **Mandatory foundational load** — Stage A-E artifacts грузятся в каждую Stage F сессию, даже когда фича их семантику не задевает. Для personal-project, где Stage B пустой, это **wasted tokens каждый раз**.
3. **Per-PR atomicity (AP-19)** — мелкие PR'ы хороши для review quality, но **каждый новый PR = новая Stage F сессия = повторная загрузка protocol context**. На длинной фиче из 10 PR'ов это **10× re-load** одного и того же.
4. **Subagent invocations не batched** — planner → coder → reviewer спавнятся последовательно, каждый с независимым context budget'ом, без передачи прогретого кэша.

### Где это оправдано

- На больших / complex PR'ах специализированные reviewer'ы находят domain issues, которые fix позже стоит дороже. ROI положительный.
- На фундаментальных решениях ADR через operator-gate (AP-3) дешевле, чем rollback agent-driven фейла. Operator-gate платит за себя на длинной дистанции.
- Per-PR atomicity делает revert дешёвым; экономия на rollback'е иногда перевешивает re-load overhead.

### Где это чистая трата

- PR < 100 строк (specialized routing спавнится впустую — baseline нашёл бы то же сам).
- bug-fix workflow (Stage A-E грузятся, но не нужны — Mode 4 эту часть уже частично решает).
- typo / dep-bump / docs-only (full Stage F cycle на 1-2 строки кода — **10×+ waste**).

### Rough estimate

| Размер фичи | Token ratio (мы / OpenSpec) | Где |
|---|---|---|
| Trivial (typo, dep bump) | **10×+** | Subagent fan-out + foundational load |
| Small (< 100 LOC) | **3-5×** | Specialized routing впустую |
| Medium (100-500 LOC) | **1.5-2×** | Reviewer ROI начинает оправдывать routing |
| Large / complex / multi-domain | **1-1.5×** | Routing находит реальные issues; компенсирует overhead |

Большинство реальных PR'ов — в zone small-to-medium. Значит большинство сессий — **в zone 1.5-5× overhead**.

### Исправления, доступные без переработки фреймворка

| Что | Эффект | Стоимость реализации |
|---|---|---|
| **Size gate на specialized reviewer routing** (PR < N LOC → только protocol-compliance baseline, без fan-out) | Прямо убирает 3-5× overhead на маленьких PR'ах | Низкая: правило в primary reviewer agent prompt'е. |
| **Lazy loading foundational docs** (грузить только те, что релевантны file paths в diff'е) | Снижает context bloat на ~30-50% для большинства PR'ов | Средняя: нужен router-механизм перед каждым subagent'ом. |
| **Агрессивнее использовать Mode 4 (bug-fix) и Tier framework** | Уменьшает Stage A-E load на не-feature changes | Низкая: documentation + better defaults. |
| **Prompt caching / pinned foundational docs** (per-PR re-load → cached read) | Снижает повторные re-loads на длинных фичах | Средняя: зависит от того, как Claude Code обрабатывает cache_control. |

### Жёсткое наблюдение

**Discipline overhead и token overhead — это часто один и тот же overhead в разных одеждах.** AP-discipline numbering, mandatory foundational, per-PR atomicity, fan-out reviewers — всё это одновременно cognitive load для оператора **и** token bill для бюджета.

Path B из секции выше (layered minimal mode) — **одновременно решение для обоих**: меньше mandatory artifacts → меньше cognitive load **и** меньше context per session.

Size gate на reviewer routing — independent quick win, можно делать сейчас, не дожидаясь Path B.

### Что НЕ делать

- **Не убирать AP-3 (operator-gate)** ради экономии токенов. Operator-gate отлавливает дорогие ошибки, которые потом фиксить в 100× дороже. ROI положительный даже на маленьких PR'ах.
- **Не убирать per-PR atomicity (AP-19)** ради батчинга. Большие PR'ы дороже в review **и** в rollback'е. Re-load overhead — это симптом missing caching, не аргумент против атомарности.
- **Не убирать protocol-compliance baseline.** Он дешёвый и ловит то, что больше никто не ловит.

---

## Резюме обеих половин (complexity + cost)

| Опора | Cognitive overhead | Token overhead | Вердикт |
|---|---|---|---|
| Tier framework | низкий | низкий | ✅ keep |
| 5 modes | низкий | низкий (mode-skip) | ✅ keep |
| Reviewer routing | низкий | **высокий на маленьких PR** | ⚠️ add size gate |
| Constraints (Stage B) | высокий, если не нужен | высокий, если грузится впустую | ⚠️ opt-in (Path B) |
| Composition matrices | высокий, если single-stack | средний | ⚠️ opt-in (Path B) |
| Per-kind UI guides | высокий, если 1 kind | высокий | ⚠️ scoped к active kinds |
| Trust profiles A/B/C | низкий (мост invisible) | низкий | ✅ keep (concept-only weight) |
| AP numbered invariants | средний (ritual citation) | низкий | ✅ keep (бренд = discipline) |
| Mandatory Stage A-E load | высокий | **высокий, каждая сессия** | ⚠️ lazy load + Path B |
| Per-PR re-load | низкий | **высокий на длинных фичах** | ⚠️ caching (внешний от framework) |

**Главный вывод:** complexity и cost — это две проекции одной и той же проблемы. Path B (layered) + size gate на reviewer routing + lazy loading foundational — три rich интервенции, которые **режут одновременно и cognitive load, и token bill**, не трогая discipline-core.

---

## Stage consolidation — что можно объединить и сократить

Анализ текущей структуры по `bootstrap-state.md.tmpl`. Сейчас в Stages A-E **~25+ mandatory/optional artifacts**. Не вся сложность нужна — много duplication через искусственное разделение тесно связанных документов.

### Дубликации, которые видно невооружённым глазом

| Текущее | Дубликация | Предложение |
|---|---|---|
| `vision` (A) + `strategic-frame` (B) | Оба про продуктовое framing: vision = «что/для кого/границы»; strategic-frame = «SLO + метод валидации». Это две секции одного документа. | **Merge:** vision → раздел `strategic-frame.md`, либо удалить vision как отдельный артефакт. |
| `competitive-analysis` (A) + `positioning` (A) | Positioning **отвечает** на competitive analysis. Это upstream + downstream одного и того же. | **Merge:** competitive-analysis как секция `positioning.md`. |
| `personas` (A) + `user-journeys` (A) | Оба про аудиторию, всегда пишутся вместе. Journey без personas бессмысленен; personas без journey — академический. | **Merge:** `audience.md` с двумя секциями. |
| `brand-voice` (A) + `ui-style-guide-base` (A) | Brand voice логически — раздел UI guide (тон UI-copy). Сейчас два файла с сильным cross-ref. | **Merge:** brand-voice → раздел `ui-style-guide-base.md`. |
| `legal-frame` (B) + `legal-brief` (B) | Legal-brief — это actionable дистилляция frame'а. Frame пишется один раз, brief — за каждый этап. | **Merge:** один `legal.md` с разделами «frame» и «current brief». |
| `threat-model` (B) + `incident-runbook-draft` (B) | Threats определяют, какие incidents планировать. Жёсткая связь. | **Merge:** `risk-and-response.md` с двумя секциями (threat-model + initial runbook). |
| `dependency-policy` (D, opt) + `refactor-playbook` (D, opt) | Оба — playbook для maintenance flow. Оба optional. | **Merge:** `maintenance-playbook.md` с секциями. |
| `stack chosen` + `db_kind chosen` + `database-design-*` (D) | Все три tech-stack решения, взаимозависимы (db_kind вырастает из stack). | **Merge:** `tech-stack.md` с секциями stack/db/database-design. |
| `ai-linting-rules` + `subagent configs verified` + `development-protocol overlay` (D) | Все три про AI/agent infrastructure. | **Merge:** один `development-protocol-overlay.md` с секциями linting + subagents + overlay. |

### Stage E — отдельный случай

Stage E содержит **12+ checkbox'ов**, но фактически это **mechanical config generation** одним bootstrap script'ом. Tracking 12 пунктов вместо одного создаёт иллюзию работы, которой не было.

**Предложение:** заменить 12 checkbox'ов на **один checkpoint**:

```
- [ ] Repo scaffold generated + `make setup && make test` green + initial CI passed (YYYY-MM-DD)
```

Все 12 текущих items — это **output одного bootstrap-script'а**. Их granular tracking имеет смысл только если они выполняются вручную, что мы не делаем.

### Stage C — кандидат на упразднение

Stage C («Solution shape») содержит всего **2 artifacts** (topology + foundational ADRs), причём ADR-блок чаще всего «none needed yet». Это **тонкий stage без самостоятельной идентичности**.

Варианты:
- **Fold в Stage D (Process):** topology тесно связан со stack choice. `topology.md` становится секцией `tech-stack.md`.
- **Fold в Stage B (Constraints):** topology выражает архитектурные constraints; ADRs — explicit decisions about boundaries. Концептуально подходит.

Предпочтение: **fold в Stage D**, потому что topology + stack + db_kind решаются together.

### Stage B — overloaded mixed-concerns

Stage B сейчас содержит **bounds** (threats, legal, SLO) **и** **scope** (mvp-scope, validation script). Это разные категории.

`mvp-scope.md` — это **решение о shape продукта**, не constraint. Логичнее в Stage C/D рядом с topology.

### Сводная reshape таблица

| Сейчас | Предложение | Дельта |
|---|---|---|
| Stage A: 7+ artifacts (vision, personas, journeys, competitive, positioning, brand-voice, ui-style-base + per-kind) | Stage A: 3 artifacts (`audience.md`, `positioning.md`, `ui-style.md`) | −4 |
| Stage B: 7 artifacts | Stage B: 4 artifacts (`strategic-frame.md`, `risk-and-response.md`, `legal.md`, `customer-interview-script.md`) | −3 |
| Stage C: 2 artifacts | Stage C: упразднён (folded в D) | −2 |
| Stage D: 6-8 artifacts | Stage D: 4 artifacts (`tech-stack.md` [включает topology], `dev-environment.md`, `maintenance-playbook.md`, `development-protocol-overlay.md`) | −2-4 |
| Stage E: 12+ checkboxes | Stage E: 1 checkpoint | −11 |
| **Total: ~25+ items** | **Total: ~12 items** | **≈−13 (50%)** |

### Trade-offs

**Плюсы:**
- Cognitive load оператора падает вдвое.
- Token cost foundational load тоже падает — меньше файлов, более сжатые, проще lazy-load.
- Migration для template-sync дешевле: меньше template'ов, меньше точек drift'а.
- Документы становятся **более читаемыми**, когда связанные секции рядом (vision + SLO в одном файле — coherent narrative).

**Минусы:**
- **Merged docs длиннее** — каждый файл становится более weighty. Mitigation: жёсткая структура с anchors, чтобы можно было читать секциями.
- **Loss of granularity в tracking** — нельзя сказать «personas done, journeys not yet». Mitigation: внутри-doc checkboxes в начале файла.
- **Migration cost** для существующих template-using проектов. Mitigation: migration script + одна version bump'нутая major-версия template'а.
- **Risk «too much in one place»**: если `tech-stack.md` распухнет до 500+ строк, читать его как один документ тяжело. Mitigation: hard cap on section count, разнести при necessity.

### Что НЕ объединять

- `mvp-scope.md` — отдельный document с независимым lifecycle (часто обновляется при validation feedback). Merging в strategic-frame потеряет это.
- `customer-interview-script.md` — это **executable artifact** (используется оператором при интервью), не reference doc. Должен оставаться отдельно.
- `per-kind ui-style-guide-*.md` — нельзя merge'ить в base, потому что они активируются conditionally по `ui_kind`. Lazy-load logic держит их отдельно.
- `ADR-файлы` — каждый ADR это атомарное решение, mergng разрушает AP-1 (reactive ADR).
- `feature-spec / feature-plan / feature-review` — отдельные artifacts на feature, разные lifecycle.

### Рекомендация

**Path C: stage consolidation** — независимая интервенция от Path A (narrow audience) и Path B (layered minimal mode). Все три комплементарны:

- **Path C** уменьшает absolute number of artifacts на 50%.
- **Path B** делает оставшиеся artifacts opt-in по слоям.
- **Path A** позиционирует фреймворк так, чтобы Layer 0 пользователи выбирали нас осознанно.

Из трёх Path C — самая «безопасная» (не меняет философию discipline, только убирает duplication). Path B самая impactful. Path A — pure marketing/copy.

**Порядок выполнения, если делать все три:** C → B → A. Сначала сжать до core (C), потом сделать слоёным (B), потом написать README, который про получившееся (A).

---

## Quality preservation — обязательные mitigations при реализации Paths B/C

Без mitigations Paths B/C ускоряют и снижают нагрузку **за счёт реальной потери качества** в 4 предсказуемых failure mode'ах. Mitigations недорогие, но должны быть зафиксированы как **часть plan'ов реализации**, а не отложены на «потом».

### Risk 1 — Path B opt-in trap (самый серьёзный)

**Failure mode:** когда Stage B (Constraints) становится opt-in, часть пользователей пропустит его там, где не должны были. Не распознают, что у них есть threats / legal / compliance impact, пока не упрутся в инцидент. Редко, но иногда катастрофично (data leak, GDPR-fine, compliance failure).

**Mitigation:** **обязательный pre-skip quiz** перед opt-out из Stage B:
- Processes PII?
- Handles payments / financial data?
- Stores user-generated content?
- Subject to GDPR / HIPAA / SOC 2 / иной compliance?
- Public-facing (internet-reachable)?
- Multi-tenant?

Если хоть один **yes** → Stage B становится mandatory, opt-out недоступен. Quiz запускается bootstrap-agent'ом, ответы фиксируются в `bootstrap-state.md` (audit-trail).

**Стоимость:** 1 AskUserQuestion block в `project-bootstrap` agent'е, ~30 sec оператору на ответы.

### Risk 2 — Merged docs теряют cognitive prominence

**Failure mode:** когда `vision` + `strategic-frame` сливаются в один файл, SLO-секция (которая жила отдельным документом) получает меньше внимания. Читатель прочитает сверху, SLO в конце пропустит. Аналогично — для всех 9 merge'ев из Path C.

**Mitigation:** **жёсткая структура merged docs**:
- TL;DR-блок в начале каждого merged doc с явным перечнем секций.
- Checkbox-чеклист в шапке («все секции заполнены?»).
- Каждая бывшая отдельная секция начинается с **bold-prompt'а** («**Что это:** SLO — обещания продукта по uptime / latency / error rate. **Зачем читать:** если не заполнено, оператор не знает, что обещать пользователям»).
- В template'ах ставить **soft-cap on section length** (если секция > N строк — рекомендация split в отдельный artifact).

**Стоимость:** template-update'ы при выполнении Path C, дополнительные пол-часа на каждый merge.

### Risk 3 — Stage E single checkpoint скрывает тихие baseline-дыры

**Failure mode:** 12 текущих checkbox'ов ловили частные ошибки (branch protection не включён, settings.json hooks битые, .gitignore без `.ai-pm/.reviews/`). Если заменить на одну строку «make setup && make test green» — тесты пройдут, baseline-дыры останутся незамеченными до первого force-push в main или leak'а `.reviews/` в репу.

**Mitigation:** **separation of validation and tracking**:
- `bootstrap-verify.sh` script автоматически проверяет все 12 пунктов как **health-check** (запускается из `make setup` и в CI).
- В `bootstrap-state.md` остаётся **один tracking checkpoint** («Stage E verify passed»).
- Если verify падает — output script'а явно показывает, **какие именно** пункты failed.

Validation остаётся granular; tracking становится coarse. Лучшее из обоих миров.

**Стоимость:** написать `bootstrap-verify.sh` (~100 LOC bash), включить в CI workflow.

### Risk 4 — Reviewer size gate создаёт слепые зоны на маленьких PR'ах

**Failure mode:** 50-строчный PR может содержать реальный domain-bug (SQL injection, missing auth check, leaked credential, broken migration), который специализированный reviewer бы нашёл. Без fan-out — только protocol-compliance baseline, который не domain-aware.

**Mitigation:** **size gate + content-aware override**:
- Default: PR < N LOC (например, < 100) → только baseline, без fan-out.
- **Override:** если diff трогает `auth/`, `payments/`, `db/migrations/`, `crypto/`, `*.lock`, security-sensitive paths → fan-out **независимо от размера**.
- Override-paths конфигурируются в `.claude/settings.json` или в `development-protocol-overlay.md` per-project.

Альтернативно: размер не единственный триггер, можно добавить keyword scan по diff (`SELECT *`, `eval(`, `dangerouslySetInnerHTML`, etc.) для дополнительного override.

**Стоимость:** правило в primary reviewer agent prompt'е (50 LOC), конфиг override-paths в settings (10 LOC).

---

### Сводная таблица risk × mitigation × стоимость

| Risk | Mitigation | Стоимость реализации |
|---|---|---|
| Path B opt-in trap | Pre-skip quiz с автоматическим mandatory-промоушеном | Низкая (1 AskUserQuestion block) |
| Merged docs prominence loss | TL;DR + checkbox + section-soft-cap в templates | Средняя (template-updates × 9) |
| Stage E silent baseline holes | `bootstrap-verify.sh` script + один tracking checkpoint | Низкая (~100 LOC bash) |
| Reviewer size gate blind spots | Size + content-aware override (auth/payments/migrations/crypto) | Низкая (правило в agent prompt) |

### Жёсткая рекомендация

**Paths B и C без этих 4 mitigations реализовывать нельзя.** Иначе фактический trade-off: «cut'нули complexity, получили back fewer guardrails» — то есть продали discipline за convenience.

С mitigations: net win на трёх осях (скорость + cognitive load + token cost) **без статистически значимой потери качества**.

В plan'ах реализации Path B и Path C соответствующие mitigations должны быть **non-skippable checkboxes**, не «nice-to-have». Это часть definition of done для самих этих рефакторингов.

---

## Эволюция mitigations: `discipline-advisor` как smart layer поверх floor'а

Static mitigations выше (quiz, verify-script, content-aware override) — это **deterministic floor**: robust, дешёвые, но dumb. Они защищают от known failure mode'ов через жёсткие правила.

Качественно лучше — добавить **smart layer**: read-only subagent `discipline-advisor`, который **читает evidence** (код, артефакты, state, deps) и проактивно рекомендует стадии с обоснованием через концретные pointer'ы.

### Принцип: hybrid (floor + advisor), не замена

Advisor **дополняет** deterministic floor, а не заменяет его. Иначе получаем «smart quiz, который умеет тонко обходить сам себя» под operator pressure.

**Floor (irreducible):**
- AP-3 operator-gate всегда on.
- Protocol-compliance baseline всегда on.
- Hard detection rules для PII / payments / crypto / auth — если обнаружены, Stage B mandatory без opt-out.
- AP-19, AP-20 не отключаются никогда.

**Smart layer (advisor):**
- Все остальное — recommendation с обоснованием.
- Operator decides; решения логируются в `bootstrap-state.md` для audit-trail.

### Архитектура `discipline-advisor` subagent

```
Operator entry → discipline-advisor (read-only)
                 │
                 ├─ читает: bootstrap-state.md, package.json/Cargo.toml/go.mod,
                 │          existing artifacts, sample code (bounded scan),
                 │          vision artifact, ENV templates, project topology
                 │
                 ├─ применяет: hard rules (mandatory) + heuristics (recommended)
                 │
                 └─ выдает structured advisory:
                      mandatory: [stage-B]  reason: «vижу `stripe.charges.create`
                                            в src/payments/checkout.ts:42 → PCI
                                            scope, legal+threat обязательны»
                      recommended: [stage-D-maintenance-playbook]
                                            reason: «monorepo + 5 packages →
                                            dependency-policy окупится за квартал»
                      skip-safe: [stage-A-personas]
                                            reason: «single-developer PoC, no
                                            users yet — заполнить позже»

Operator confirms / overrides → logged → bootstrap proceeds with subset
```

### Применение к каждому из 4 risks

| Risk | Floor (deterministic) | Advisor (smart layer) |
|---|---|---|
| 1. Path B opt-in trap | Hard detection: PII / payments / crypto / auth → Stage B mandatory | Scan code / deps на `bcrypt`, `passport`, `stripe`, ENV `*_SECRET`, public URLs → говорит «вы ответили no, но вижу X — pointer на файл:строка» |
| 2. Merged docs prominence loss | TL;DR + checkbox в template'ах | На входе в Stage F видит пустую SLO-секцию → «без SLO acceptance тесты не определены, [конкретный сценарий риска]» |
| 3. Stage E silent baseline holes | `bootstrap-verify.sh` health-check | На failed verify **объясняет**: «branch protection off → AP-19 ломается, потому что [конкретный сценарий force-push в main]» вместо просто «verify failed» |
| 4. Reviewer size gate blind spots | Size + path override (auth/payments/migrations/crypto) | Scan **content** diff'а (`eval(`, raw SQL, secrets-like strings, hardcoded URLs) → routing по содержимому, не только по path |

### Где advisor сам по себе недостаточен (почему floor остаётся)

- **LLM может пропустить категорию**, которой не было в его training. Static rules всегда применяются.
- **LLM может over-recommend под operator pressure** («хочу быстрее») — рационализирует skip опасного. Hard floor этому сопротивляется.
- **Determinism для audit** — статический ответ в `bootstrap-state.md` — claim, который можно проверить. LLM-recommendation в session N может отличаться от session N+1 при том же коде.
- **Cost-bound** — если advisor читает весь codebase на каждый запуск, экономия от skip Stage B растворится в его token cost.

### Стоимость vs static-only mitigations

| Подход | Реализация | Token cost (за сессию) | Quality |
|---|---|---|---|
| Static quiz + script (только floor) | Низкая | ~0 (quiz tiny, script local) | Robust но dumb |
| Advisor (только smart, без floor) | Средняя (новый subagent) | Средняя (1 bounded code-scan на entry) | Smart но fragile под pressure |
| **Hybrid (floor + advisor)** | Средняя | Средняя | **Robust + smart** |

Гибрид — additional ~10-20% bootstrap token cost за **значительно лучший** experience: оператор получает обоснованные рекомендации с pointer'ами на конкретные строки кода, а не yes/no quiz.

### Cost-bounded design для advisor

Чтобы advisor не съел экономию от skip'ов:
- **Bounded scan**: читает не весь codebase, а sample (entry points + package manifests + 5-10 файлов по эвристике важности).
- **Cached на session**: на повторный entry в течение сессии не пере-сканирует, использует кэш.
- **Trigger-based, не always-on**: запускается на ключевых решениях (bootstrap entry, Path B layer change, Stage F entry с пустыми foundations), не на каждый message.
- **Hard token budget**: < 10k tokens на одну advisory session. Если scope превышает — degraded mode с warning «полный анализ требует X, делаю partial».

### Где advisor — уже существующий паттерн в системе

Это не новая концепция:
- **Tier framework** (auto-extract / mini-research / promote / override) уже работает по этому принципу для extraction'а stack'а — applied to artifact content. Advisor — **тот же паттерн, applied to stage selection**.
- **Specialized reviewer routing** — primary reviewer уже делает domain detection и routing. Advisor — **тот же паттерн на этапе bootstrap, не review**.
- **AP-3 operator-gate** уже разделяет «agent recommends» от «operator decides». Advisor работает в той же модели.

### Что добавить в plan'ы Path B / Path C

Помимо 4 static mitigations выше, в plan'е реализации фиксировать:
- [ ] `discipline-advisor` subagent определён в `.claude/agents/`.
- [ ] Hard detection rules (PII / payments / crypto / auth) реализованы как irreducible floor.
- [ ] Advisor триггеры: bootstrap entry, Path B layer change, Stage F entry с empty foundations.
- [ ] Advisor decisions логируются в `bootstrap-state.md` (advisory-log section).
- [ ] Bounded scan policy + cache + token budget зафиксированы в agent prompt.
- [ ] Тесты на тривиальные false-negative cases (advisor НЕ должен пропускать stripe.charges, sequelize raw queries, hardcoded JWT secrets).

### Финальная рекомендация

**Реализовывать Paths B/C не как «static mitigations only», а как «hybrid floor + advisor».**

Это качественный шаг — фреймворк становится **adaptive вместо checklist-based**. И это естественная эволюция: мы уже используем этот паттерн (Tier, reviewer routing) — просто распространяем на bootstrap.

**Стоимость:** +1 subagent определение, +10-20% bootstrap session cost, ~1-2 дня имплементации.  
**Выгода:** advisory с pointer'ами на код вместо checkbox-quiz; коллапсирует на простых проектах (advisor говорит «всё skip-safe»), активируется на сложных (advisor подсвечивает реальные риски, которые operator мог пропустить).

---

## Revised proposals (после multi-dimensional reframing + silent-break gaps)

Этот раздел **supersedes** Paths A/B/C формулировки выше. Изменения после нескольких итераций калибровки с оператором (см. `2026-05-24_critique-and-blindspots.md` + `2026-05-24_silent-break-gaps.md`).

### Что изменилось в понимании

1. **Value prop не «discipline framework»**, а **«AI-shipping that survives»** — код переживает 2-ю/3-ю/10-ю фичу. Без silent breakage, с captured decisions, с tests которые реально тестируют, с поддерживаемостью.
2. **5 dimensions качества** (а не 1 axis discipline): понятность, поддерживаемость, технические качество, UI, UX. Каждый артефакт фреймворка таргетит failure mode на одной из этих осей.
3. **Mental model оператора-PM:** «пишу хорошую спеку → автоматика проверяет код → линтеры enforce качество → не читаю код». **Framework на 80% уже это делает**; 20% — дыры из `silent-break-gaps.md`.
4. **Trust profiles A/B/C** = не «технический vs нетехнический», а «какую половину (product/tech) оператор приносит сам, какую compensates фреймворк». Симметричная пара, не asymmetric.
5. **«Не сломать» — hard constraint** на любую переработку. Любое сокращение / merge / opt-in должно сохранять coverage всех 5 dimensions.

### Новый приоритетный порядок работ

| Приоритет | Что делаем | Почему |
|---|---|---|
| **P0 (срочно)** | Закрыть silent-break gaps 1-3 (см. `silent-break-gaps.md`) | Не реализуют **уже обещанное**. Без них любая консолидация — косметика. |
| **P1** | Path C: careful consolidation (~25→18, не →12) | Снижает overhead без потери dimensional coverage. |
| **P2** | Path B: layered minimal (Layer 0 essentials by all axes) | Open-onboarding без потери discipline floor. |
| **P3** | discipline-advisor: 5-axis quality challenger | Smart layer поверх floor; advisor scope расширен с anti-overengineering на multi-axis. |
| **P4** | Path A: README repositioning через multi-dimensional framing | Маркетинговый сдвиг после того, как продукт фактически такой. |

**Старый порядок был C→B→A. Новый: gaps→C→B→advisor→A.** Закрытие дыр имеет наивысший приоритет, потому что они выходят за rамки «улучшение» — это **починка обещанной функциональности**.

### Path C revised: merge только по одной оси, не по тематической близости

Старый критерий: «близкие темы → merge». Это **неправильно** — приводит к потере dimensional coverage.

Новый критерий: **merge only if both artifacts target the same axis of quality**.

| Старое предложение | Reassessment | Решение |
|---|---|---|
| `vision` + `strategic-frame` | Разные оси: vision = product intent, strategic-frame = measurability (SLO + validation). | **Не merge.** Разные dimensions. |
| `competitive-analysis` + `positioning` | Одна ось — product framing. Positioning = вывод из competitive-analysis. | **Merge.** Sequence на одной оси. |
| `personas` + `user-journeys` | Разные дисциплины: psychographics vs interaction flow. | **Не merge.** Разные failure modes. |
| `brand-voice` + `ui-style-guide-base` | Одна ось — UI/UX consistency. Brand voice = tone of UI copy. | **Merge.** Одна ось. |
| `legal-frame` + `legal-brief` | Одна ось — legal/compliance. Brief = actionable distillation frame'а. | **Merge.** Одна ось. |
| `threat-model` + `incident-runbook-draft` | Разные timeframes / disciplines: identify vs respond. | **Не merge.** Разные failure modes. |
| `dependency-policy` + `refactor-playbook` | Одна ось — maintainability. Оба — maintenance playbooks. | **Merge.** Одна ось. |
| `stack` + `db_kind` + `database-design-*` | Одна ось — technical foundation. Tight coupling. | **Merge.** Одна ось. |
| `ai-linting-rules` + `subagent configs` + `dev-protocol-overlay` | Одна ось — AI/agent infrastructure. | **Merge.** Одна ось. |
| Stage E 12 checkboxes | One bootstrap script output. | **Collapse в 1 checkpoint + verify-script.** Не dimensional, просто tracking. |
| Stage C → fold в Stage D | Topology тесно связан со stack. | **Fold.** OK. |
| `mvp-scope` → перенести в Stage C/D | Это shape decision, не constraint. | **Move.** OK. |

**Новый result: ~25 → ~18 artifacts** (вместо ~12). Меньше экономия, но **без dimensional loss**. Это компромисс в сторону «не сломать».

### Path B revised: Layer 0 = essentials по всем 5 dimensions

Старая формулировка Layer 0: «только Stage F, no foundational». **Это ломало dimension grounding** — AI без grounding produces calculator-with-backend.

Новая формулировка:

**Layer 0 (default for new users) — minimum essentials по всем 5 dimensions:**

| Dimension | Layer 0 essential | Артефакт |
|---|---|---|
| Понятность | Vision: что строим, для кого, **что НЕ строим** | `vision.md` (5-10 строк) |
| Поддерживаемость | All AP invariants enabled (AP-3, AP-4, AP-5, AP-19, AP-20) | Protocol overlay |
| Технические качество | All CI gates + per-diff coverage + spec→test mapping (gap 1 fix) + test-fudging prevention (gap 2 fix) | `.ai-pm/tooling/` + CI workflow |
| UI | `ui-style-guide-base.md` если фича UI-touching, skip иначе | Conditional |
| UX | `scope.md`: MVP boundaries + hard exclusions | `scope.md` (5 строк) |

**Layer 1 (opt-in):** + personas + user-journeys (когда нужно глубже про user).  
**Layer 2 (opt-in):** + threat-model + legal (когда compliance входит).  
**Layer 3 (opt-in):** + competitive-analysis + positioning + brand-voice (когда продукт зреет).  
**Layer 4 (opt-in):** + composition matrices + per-kind UI guides (когда multi-stack).

**Ключевое отличие от старой формулировки:** Layer 0 — **не «skip foundational»**, а «минимально-достаточно по всем dimensions». Это **больше** артефактов, чем я предлагал ранее (3-4 вместо 0), но **значительно меньше** чем текущий Mode 1 (~25). И главное — **не теряет dimensional coverage**.

### discipline-advisor revised: 5-axis quality challenger

Старая роль: scope-proportionality challenge (предотвратить calculator-with-backend).

Новая роль (расширена): **continuous multi-axis quality challenger**.

| Trigger | Что advisor проверяет |
|---|---|
| Bootstrap entry | Какие Layer'ы нужны, на основе detected capabilities. Hard floor (PII/payments/crypto) → mandatory. |
| Path B layer change | Когда оператор хочет skip — challenge through evidence. |
| Stage F Step 1 (spec draft) | Spec scenarios покрывают user journey? Acceptance criteria measurable? Security invariants для security path? |
| Stage F Step 2 (plan draft) | Proposed архитектура **proportionate** к spec? Не over-engineered? Test plan covers all scenarios? |
| Stage F Step 4 (coding) | Spec→test mapping есть? (gap 1) Тесты не ослабляются в diff? (gap 2) Shared modules require regression coverage? (gap 3) |
| Stage F Step 7 (review) | Reviewer findings address all 5 axes? Не focus только на одной? |

**Accuracy bar:** ≥ 80% на test set из known-correct cases per axis. Если ниже на любой axis — отказаться от advisor для этой axis, оставить deterministic fallback (CI gates).

### Mitigations updated

Старые 4 mitigations + новые из gap analysis:

| # | Mitigation | Источник | Status |
|---|---|---|---|
| 1 | Path B opt-in quiz (PII/payments/crypto detection) | старое | unchanged |
| 2 | Merged docs TL;DR + checkbox + soft-cap | старое | applies только к merge'ам по новому критерию (меньше merges → меньше работы) |
| 3 | Stage E `bootstrap-verify.sh` + 1 checkpoint | старое | unchanged |
| 4 | Reviewer size + content-aware gate | старое | unchanged |
| **5** | **Spec→test mapping CI check** | **gap 1** | **NEW (P0)** |
| **6** | **Test fudging prevention (semgrep + AP-X)** | **gap 2** | **NEW (P0)** |
| **7** | **Regression coverage gate для topology_impact** | **gap 3** | **NEW (P0)** |
| **8** | **E2E spec scenarios suite** | **gap 4** | **NEW (P2-P3, требует tooling choice)** |
| **9** | **discipline-advisor 5-axis check** | **multi-dim reframing** | **расширение P3** |

### Path A revised: positioning через multi-dimensional outcome

Старая формулировка: «discipline framework для PM-asymmetry».  
Новая (после gaps закрыты):

> **Framework, который делает AI-shipping survivable:** код переживает свою вторую, пятую, десятую фичу. Без silent breakage. С автоматической проверкой spec ↔ code. С тестами, которые **нельзя подкрутить** под выдумки агента. С поддерживаемостью через quartal.
>
> **Для PM:** напишите хорошую спеку — автоматика проверит, что код соответствует, линтеры enforce качество. Можно не читать код.
>
> **Для dev:** PM-thinking embedded в workflow — фичи не превращаются в tech debt уже на втором ship'е. Cross-stack guides для зон, которые не ваши.

Это **outcome-based**, **falsifiable** (можно проверить, действительно ли код переживает 10 фич), **симметрично** покрывает обе аудитории.

### Acceptance criteria для всего refactor'а

Refactor (gaps + C + B + advisor + A) считается **успешным**, если:

- [ ] Все 3 silent-break gaps закрыты (1, 2, 3 из `silent-break-gaps.md`).
- [ ] Path C сократил artifacts с ~25 до ~18 **без потери dimensional coverage** (verifiable: каждый из 5 axes имеет ≥ 1 dedicated artifact на Layer 0).
- [ ] Path B Layer 0 проходит self-test на toy project: «calculator» → produces single-screen calculator (не fullstack).
- [ ] discipline-advisor accuracy ≥ 80% на test set per axis.
- [ ] Path A README не упоминает «discipline» в первой секции; **outcome** в первой строке.
- [ ] **«Не сломать» verified:** существующий project, прошедший Mode 1, остаётся valid after migration (template-sync produces working diff).

### Что НЕ делать (escalated после новых знаний)

- **Не merge'ить artifacts разных dimensions** — даже если тематически близки.
- **Не делать Layer 0 = no foundational** — это ломает grounding dimension и воспроизводит calculator-with-backend pain.
- **Не делать silent-break gap closes opt-in** — это hard floor, не Layer-dependent.
- **Не позиционировать через discipline** — это describes mechanism, не outcome.

---

### Финальный TL;DR (для второго Claude'а)

**До:** «cut complexity, layer the rest». Risk: ломали dimensional coverage.

**После:** «**сначала закрыть дыры в обещанной функциональности (gaps 1-3), потом careful consolidation (only same-axis merges), потом layered с floor по всем dimensions, потом 5-axis advisor, потом outcome-based positioning**».

**Hard constraint:** не сломать ни одной из 5 dimensions (понятность / поддерживаемость / технические качество / UI / UX). Это **acceptance gate** для всех изменений, не «nice to have».

---

## Conditional skip с комментарием — первоклассный механизм (не Layer'ы)

После дополнительной калибровки с оператором: **Layer model — слишком rigid**. Правильная модель — **conditional skip с declared reason для почти любого артефакта**.

### Почему Layer model недостаточно

- **Layer'ы предполагают монотонную последовательность** (Layer 0 ⊂ Layer 1 ⊂ ...). Но реальные проекты — **разные подмножества**, не нарастающие.
- **Пример оператора:** «странно думать сильно про угрозы на простом консольном калькуляторе — этот этап вполне можно скипнуть с комментарием». Калькулятор не нуждается в `threat-model.md` независимо от Layer'а. Layer model заставила бы его быть на Layer 2, но конкретно для этого проекта он N/A.
- **Любой шаг почти**, со слов оператора, имеет условия, при которых его можно skip'нуть.

### Mechanism уже есть, но buried

В `bootstrap-state.md.tmpl:50-61` есть `adoption_overrides`:

```yaml
adoption_overrides:
  - skip: stage-e-hooks
    reason: «legacy CI integration conflicts, hooks moved to separate PR»
    accepted-risk: «AP-16 enforcement soft, manual review-trail discipline»
    declared_at: YYYY-MM-DD
    expires_at: YYYY-MM-DD  # optional sunset
```

Это **правильный mechanism**, но позиционирован как exotic edge case (legacy adoption). На деле это **default-механизм** для conditional skip.

### Что меняется: каждый артефакт получает skip eligibility metadata

В template каждого артефакта добавить **frontmatter секцию**:

```yaml
skip_eligibility:
  default: required | recommended | optional | skip
  conditions_for_skip:
    - if: project_capabilities.uses-crypto = no
        AND project_capabilities.uses-auth = no
        AND project_capabilities.processes-pii = no
        AND project_capabilities.uses-payments = no
      auto_reason: "No security surface detected — threat-model N/A"
    - if: mode = bug-fix
      auto_reason: "Bug-fix doesn't introduce new threats"
  hard_floor:
    - never_skip_if: project_capabilities.processes-pii = yes
      reason: "PII processing requires explicit threat coverage (GDPR-driven)"
```

Это позволяет **advisor'у автоматически рекомендовать skip'ы** на основе project context, и **CI gate'у проверять**, что skip'ы корректны (имеют валидный reason или hard floor разрешает).

### Skip eligibility per artifact (по умолчанию)

| Артефакт | Default | Можно skip если | Hard floor |
|---|---|---|---|
| `vision.md` | required | mode = bug-fix | никогда (даже bug-fix реверится через что vision) — на самом деле **always required** |
| `scope.md` | required | mode = bug-fix | never |
| `personas.md` | recommended | mode = bug-fix; OR (no public users) | never if public-web=yes |
| `user-journeys.md` | recommended | mode = bug-fix; OR (no UI) | never if ui_kind has any value |
| `competitive-analysis.md` | optional | always skippable с reason | — |
| `positioning.md` | optional | если single-purpose tool без marketing | — |
| `brand-voice.md` | optional | если no user-facing copy | — |
| `ui-style-guide-base.md` | conditional | если ui_kind = empty (no UI) | never if ui_kind has any value |
| `strategic-frame.md` | recommended | если SLO не applicable (single-user tool) | never if multi-tenant=yes |
| `threat-model.md` | conditional | **если все security capabilities = no** (uses-crypto, uses-auth, processes-pii, uses-payments, public-web) | **never if any security capability = yes** |
| `legal-frame.md` | conditional | если processes-pii=no AND no payments AND no GDPR-jurisdiction | never if processes-pii=yes |
| `customer-interview-script.md` | recommended | если validation не нужна (internal tool) | — |
| `incident-runbook-draft.md` | conditional | если no runtime (build-time tool) | never if uses-containers=yes OR public-web=yes |
| `mvp-scope.md` | required | mode = bug-fix | never для new-product |
| `topology.md` | required | очень простой single-file tool | rarely skippable |
| `dev-environment.md` | required | template-sync mode | never |
| `dependency-policy.md` | optional | single-developer / weekend project | — |
| `refactor-playbook.md` | optional | greenfield без legacy | — |
| `ai-linting-rules.md` | required | none (всегда нужно) | never |
| Per-kind `ui-style-guide-<kind>.md` | conditional | per ui_kind selection | never для активных kinds |
| `database-design-<kind>.md` | conditional | per db_kind selection | never для активных kinds |

### Discipline-advisor revisited (после conditional-skip framing)

Advisor's role становится **сильнее и проще одновременно**:

**Сильнее:** advisor применяет skip eligibility rules **автоматически** на основе detected project context. Не «спрашивает оператора 6 вопросов», а **читает evidence** (package.json, ENV, code patterns, existing artifacts) и **сам делает initial proposal**:

```
Advisor recommendation для нового проекта «cli-calculator»:
  
  Detected: stack=python, no network, no auth, no DB, no public surface
  
  Required (no skip):
    ✓ vision.md
    ✓ scope.md
    ✓ topology.md (simplified)
    ✓ dev-environment.md
    ✓ ai-linting-rules.md
  
  Auto-skip recommendations (operator confirms):
    ✗ threat-model.md — reason: "No security surface (no auth/crypto/PII/payments)"
    ✗ legal-frame.md — reason: "Internal CLI tool, no user data processing"
    ✗ competitive-analysis.md — reason: "Utility tool, no positioning competition"
    ✗ incident-runbook-draft.md — reason: "Build-time tool, no runtime incidents"
    ✗ ui-style-guide-base.md — reason: "ui_kind=cli only, скоп для CLI в ui-style-guide-cli.md"
    ✗ customer-interview-script.md — reason: "Personal utility, no user validation needed"
  
  Conditional:
    • personas.md — recommended (5 строк, кто пользуется этим CLI)
    • brand-voice.md — optional (если планируется sharing → нужно)
  
  Required (conditional kept):
    ✓ ui-style-guide-cli.md (because ui_kind=cli)
    ✓ all CI gates incl. spec→test mapping, test-fudging prevention
```

**Проще:** advisor не нужно делать complex 5-axis quality judgment — он применяет deterministic rules из skip_eligibility metadata, плюс reads code для verification.

### Это меняет Path B (Layer model)

**Layer model переформулируется не как «уровни доступа», а как «advisor presets»:**

- **«Minimal» preset:** advisor агрессивно рекомендует skip всё, что не hard floor.
- **«Standard» preset:** advisor рекомендует skip только conditional-no.
- **«Full» preset:** advisor recommends keep all.

Operator выбирает preset на bootstrap, advisor применяет, потом per-artifact override возможен через `adoption_overrides`.

**Это лучше Layer model'a**, потому что:
- Не предполагает монотонности.
- Допускает любые подмножества.
- Auto-derived из project context (не оператор должен выбирать Layer).
- Каждое decision имеет audit-trail (reason + declared_at).

### Updated mitigations table

Mitigation 1 (Path B opt-in quiz) **заменяется** на advisor-driven auto-recommendation:

| # | Старое | Новое |
|---|---|---|
| 1 | Static quiz перед opt-out | Advisor auto-detects skip eligibility, operator confirms |
| 2-9 | unchanged | unchanged |

### «Не сломать» constraint sharpened

Hard floors теперь **явные и evidence-based**, не «всегда mandatory»:

- `threat-model.md` mandatory **тогда и только тогда**, когда detected security capability (auth / crypto / PII / payments / public-web).
- `legal-frame.md` mandatory **тогда и только тогда**, когда processes-pii=yes OR uses-payments=yes OR в GDPR-jurisdiction.
- `incident-runbook-draft.md` mandatory **тогда и только тогда**, когда uses-containers=yes OR public-web=yes (есть runtime).
- AP-инварианты (AP-3/4/5/19/20) **всегда mandatory** — это discipline floor, не conditional.
- Silent-break gaps fixes (spec→test mapping, test-fudging prevention) **всегда mandatory** — это quality floor.

**«Не сломать» = no skip allowed on hard floor + skip с reason allowed on conditional.**

### Acceptance criteria для conditional-skip mechanism

- [ ] Каждый template в `doc/_templates/` имеет `skip_eligibility` frontmatter.
- [ ] `discipline-advisor` reads skip_eligibility + project context → produces auto-recommendation.
- [ ] CI gate `skip-justification-valid`: для каждого N/A artifact в state — есть валидный reason в `adoption_overrides`.
- [ ] Calculator self-test: новый CLI calculator project → advisor рекомендует skip ≥ 6 artifacts → operator confirms → bootstrap completes за < 10 min с 4-5 actual artifacts.
- [ ] PII-processing project self-test: advisor НЕ рекомендует skip threat-model или legal-frame даже если operator пытается.

---

### Финальный TL;DR v2 (для второго Claude'а)

**Концептуальный shift:** не «Layer'ы как уровни сложности», а **«conditional skip с auto-recommendation на основе project context»**.

**Mechanism:** уже существует (`adoption_overrides` в bootstrap-state). Нужно сделать **первоклассным**: каждый template имеет skip_eligibility metadata, advisor применяет, CI проверяет валидность.

**Hard floor:** evidence-based, не universal. Калькулятор без сети не требует threat-model. PII-processing service требует threat-model независимо от operator preference.

**Discipline floor (AP-инварианты + silent-break fixes):** всегда mandatory, не conditional. Это **что делает фреймворк фреймворком**.

---

## Advisor как «страховка», operator как высшая власть (AP-3 уточнение)

Дополнительная калибровка: **operator всегда последнее слово**. Advisor — это **страховка**, не authority. И в обе стороны:
- Если advisor рекомендует skip — operator может оставить (хочет threat-model на калькуляторе — let them, делов то).
- Если advisor рекомендует keep — operator может skip, **но с явным acknowledged trade-off**.

«Hard floor» в предыдущей секции переформулирована: **не блокировка, а громкое предупреждение с обязательным обоснованием override'а**.

### Что advisor обязан давать (страховка оператора)

Каждая рекомендация — **обоснованная**, не yes/no:

```
Advisor recommendation: threat-model.md

  Detected context:
    - project_capabilities.processes-pii = yes (detected via src/users/profile.py:42)
    - project_capabilities.public-web = yes (detected via deploy/nginx.conf:8)
    - project_capabilities.uses-auth = yes (detected via passport import)
  
  Recommendation: KEEP (strong)
  
  Reasoning:
    - GDPR Article 32 требует documented security measures для PII processing.
    - Public-web surface создаёт attack vectors, которые без threat-model могут быть missed.
    - Audit-trail без threat-model = compliance gap при incident'е.
  
  What could go wrong if skipped:
    - SQL injection / XSS / IDOR на public endpoints — нет catalog'а защит.
    - Incident response: «почему мы не предусмотрели X?» — нет paper trail.
    - Cohort'ные риски (multi-tenant data leak) — не identified.
  
  If you still want to skip:
    - Declare in adoption_overrides with:
      - accepted-risk: "..."
      - sunset: YYYY-MM-DD (force re-evaluation)
      - operator_acknowledged: yes
    - Framework will log loudly, run anyway.
```

Это reasoning is **the insurance**: операtor не может потом сказать «не знал». Все trade-off'ы явные.

### Override mechanism (в обе стороны)

**Operator может keep при advisor-skip:**

```yaml
adoption_overrides:
  - keep: threat-model
    reason: "Educational exercise, хочу пройти полный flow"
    advisor_recommended: skip
    operator_chose: keep
    declared_at: 2026-05-24
```

Никакого вреда — лишний артефакт. Framework просто записывает intent.

**Operator может skip при advisor-keep (loud warning):**

```yaml
adoption_overrides:
  - skip: threat-model
    reason: "MVP demo на 2 недели, после демо переделаем properly"
    advisor_recommended: keep
    operator_chose: skip
    accepted_risk: "GDPR exposure если кто-то использует demo с реальным data"
    sunset: 2026-06-07  # 2 weeks, force re-evaluation
    operator_acknowledged: yes
    declared_at: 2026-05-24
```

CI gate `skip-justification-valid` проверяет:
- Если `advisor_recommended: keep`, override требует **accepted_risk + sunset + operator_acknowledged**.
- Если `advisor_recommended: skip`, override (keep direction) — only reason нужен.

### Hard floor пересмотрен: не блокировка, а escalation

| Старая формулировка | Новая формулировка |
|---|---|
| «threat-model never skip if processes-pii=yes» | «threat-model **strongly recommended** if processes-pii=yes; skip requires accepted_risk + sunset + acknowledgment» |
| «AP-3/19/20 never skippable» | **unchanged** — это discipline floor, не conditional artifact |
| «silent-break fixes always mandatory» | **unchanged** — это quality floor, не optional check |

**Разделение:**
- **Quality floor & discipline floor:** non-negotiable (это «то, что делает фреймворк фреймворком»).
- **Content recommendations:** advisor рекомендует с обоснованием, operator decides, override logged.

### Принцип: «framework не врёт оператору и не диктует, но обязан insure»

Три инвариант advisor:
1. **Прозрачность:** каждая рекомендация имеет evidence (file:line или artifact reference) + reasoning + what-could-go-wrong.
2. **Reversibility:** operator override always possible, logged loudly, sunset для high-risk skip'ов.
3. **No silent decisions:** advisor никогда не делает skip silently, оператор всегда видит рекомендацию + результат своего выбора.

Это **AP-3 operator-gate, доведённое до логического конца** на уровне советника: agent recommends thoroughly, operator decides freely, system logs honestly.

### Acceptance criteria для advisor insurance

- [ ] Каждая advisor recommendation имеет 3 секции: **detected context**, **recommendation + reasoning**, **what could go wrong if not followed**.
- [ ] Override mechanism работает в обе стороны (keep при skip-recommend, skip при keep-recommend).
- [ ] CI gate проверяет, что high-risk skip'ы (advisor recommended keep, operator chose skip) имеют accepted_risk + sunset.
- [ ] Sunset enforce'ится: после expires_at advisor снова поднимает вопрос при следующей session entry.
- [ ] Calculator self-test: operator может keep threat-model даже если advisor рекомендует skip — framework логирует, не блокирует.
- [ ] PII processor self-test: operator может skip threat-model **только** с accepted_risk + sunset + acknowledgment; без них CI fail.
