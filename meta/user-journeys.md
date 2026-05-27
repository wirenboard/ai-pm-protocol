# User Journeys — ai-pm-protocol

**Stage A artifact.** Что делает оператор (PM, ЦА в v0 — см. personas.md) по шагам, проходя через template. Журнализированы по **mode'у** (5 в v0.4.0+) + по **точке входа** (greenfield / legacy adoption / architecture overview).

Без UI-деталей; только последовательность точек принятия решения и эмоциональный регистр.

**Контекст:** v0.4.0 framework state baseline. После v0.3.0 — 5 stages (Stage C упразднён, fold в Stage C). После v0.4.0 — conditional skip framework + discipline-advisor (opt-in до PoC validation). С v0.7.0 (`agent-consolidation`) — `discipline-advisor` retired (никогда не validated через required accuracy gate ≥80% per axis); 5 specialized reviewer файлов inlined в `reviewer.md` как sections (Mandatory baseline + 4 Domain subsections). Conditional skip framework работает через deterministic scripts (`check-security-floor.sh` + `check-skip-reprompts.sh`).

**Persona aspect:** v0 supports одна persona — PM, не читает AI-код (Trust profile A auto-set). Developer-as-operator (cross-stack senior / full-stack pro) — backlog после empirical validation PM-кейса. Это значит «friction per persona» секции в каждом journey содержат **только PM aspect**; old B/C friction notes удалены до возрождения developer-кейса.

---

## Journey 1: Mode `new-product` — от пустого репо до первой фичи

**Контекст входа.** Оператор (любой из 3 personas) начинает новый продукт. Нет ни строки кода, нет foundational docs.

### Шаги

| Шаг | Что делает | Что чувствует |
|---|---|---|
| 1 | Узнаёт про ai-pm-protocol | Любопытство, скепсис |
| 2 | Читает README template'а (30 сек — 2 мин) | Решает: имеет смысл попробовать или нет |
| 3 | Клонирует/устанавливает template в новый репо проекта | Деловой режим |
| 4 | Запускает `claude` в новом репо; bootstrap-agent активируется | Ожидание |
| 5 | Bootstrap-agent: «Mode? `new-product` / `feature` / `rework` / `bug-fix` / `template-sync`» (через AskUserQuestion) | Понимает что сам выбирает направление |
| 6 | Bootstrap-agent: «Primary language?» (default ru). **Trust profile auto-set `A`** (PM-only ЦА в v0) — не спрашивается. Integration auto-detected. | — |
| 7 | Bootstrap-agent: «Advisor preset? full / standard / minimal» (v0.4.0+, default standard для new-product) | — |
| 8 | Bootstrap-agent создаёт `.ai-pm/doc/` skeleton с placeholder'ами | Втягивается |
| 9 | **Stage A — Discovery.** vision → personas → user-journeys → positioning (включает competitive landscape § 1) → ui-style-guide-base (включает brand voice § 2) + per-kind ui-style-guide-<kind>. По 2-3 вопроса per artifact, draft → operator-marker → ОК | Растёт ощущение «эта штука думает за меня правильно» |
| 10 | Закрывает Stage A. **Сессия 1 done** (60-90 минут). | Усталость + удовлетворённость |
| 11 | **Stage B — Constraints.** strategic-frame → threat-model → mvp-scope → legal (если applicable) → customer-interview-script → incident-runbook-draft (если runtime). Сессия 2 (60-90 минут). | — |
| 12 | **Stage C — Process.** tech-stack (включает topology § 2 + stack § 1 + db_kind references § 3 + deployment § 4) → dev-environment → ai-linting-rules → subagent configs verified → maintenance-playbook (опц.) → development-protocol-overlay. **Stage C упразднён в v0.3.0** — topology fold в tech-stack. | — |
| 13 | **Stage D — Bootstrap.** Bootstrap-agent генерирует CI workflow, конфиги линтеров, security tools, pre-commit, branch protection rules — всё из catalogue + стек. Output: 1 checkpoint `bootstrap-verify.sh passed` (script внутри проверяет 12 granular items). | Радость: «я ничего не настраивал руками» |
| 14 | Initial CI run проходит (foundational docs готовы). | Validation |
| 15 | **Stage E — Production.** Первая `<topic>_spec.md`. Бутстрап завершён. | Standard mode |

### Friction points (PM persona — единственная ЦА в v0)

- Шаги 6-7, 12: developer-specific термины (integration mode, advisor preset, capabilities) могут потребовать дополнительных объяснений. Bootstrap-agent должен пояснять на уровне «что это значит для тебя как PM», не на уровне «как это работает».
- Шаг 14: если CI fail'ит на чём-то, что PM не понимает — нужно понятное error message, не stack trace.
- Шаг 15: spec template требует Security invariants для security-touching фич. PM нужны guided questions от bootstrap-agent'а («твоя фича трогает auth? PII? Crypto?»), чтобы не пропустить.

### Критические точки оттока

- Шаг 2: если README пафосный или абстрактный — закроет все personas.
- Шаги 10-12: если Stage A суммарно > 90 минут одна сессия → flow ломается. Spaced sessions через `.bootstrap-state.md` — критичный механизм.
- Шаг 15: если initial CI fail'ит без понятной diagnostics → frustration для всех.
- Любой шаг: если agent задаёт > 3 вопроса per artifact → cognitive load, drop-off.

### Что должно быть выполнено к концу journey'я

- Все Stage A-C artifacts заполнены в `doc/`, отмечены `[x]` в `.bootstrap-state.md` (или в `.ai-pm/doc/` для Mode 2/3 retrofit layout).
- `.ai-pm/tooling/` подключено по выбранному integration mode.
- В существующем `ci.yml` добавлены `ai-pm:*` jobs.
- Branch protection rules для `main` настроены.
- `bootstrap-verify.sh passed` — Stage D checkpoint закрыт.
- Repo готов к первой `<topic>_spec.md` в Stage E.

---

## Journey 2: Mode `feature` — добавление фичи в template-native проект

**Контекст входа.** Существующий продукт, где `.ai-pm/` уже set up (через `new-product` mode ранее или через legacy adoption — см. Journey 6). Foundational docs filled (`foundation_completeness: complete | partial | minimal`). Оператор хочет добавить новую фичу.

### Шаги

| Шаг | Что делает | Что чувствует |
|---|---|---|
| 1 | Открывает Claude в existing template-native проекте | Деловой режим |
| 2 | Bootstrap-agent читает `.bootstrap-state.md`, видит mature project, переходит к `feature` mode workflow | — |
| 3 | Оператор: «хочу добавить фичу X» | — |
| 4 | Bootstrap-agent: «Draft spec? Or PM пишет?» | Дилемма time-cost vs ownership |
| 5 | Создаётся `<doc_root>/features/<topic>_spec.md` с frontmatter (mode: feature, 7 impact полей, lite-mode, etc.) | — |
| 6 | Step 1 (spec draft): planner-agent проверяет lazy foundational loading — читает только relevant к impact flags artifacts. Operator маркирует ОК | — |
| 7 | Step 2 (plan): planner draft'ит `<topic>_plan.md`. **С v0.7.0:** discipline-advisor retired — scope-proportionality / ADR extraction checks через deterministic scripts (`check-spec-discipline.sh adr-auto-extraction`). Operator approve | — |
| 8 | Step 3-4 (tests + code): coder-agent. AP-5 tests first; AP-23 — нельзя ослаблять existing assertions без ADR ref; AP-24 — > 50 LOC arch decisions в spec → fail | Standard implementation |
| 9 | CI gates: spec-test-mapping (gap 1), test-assertion-weakening (gap 2), regression-coverage-for-shared-modules (gap 3), adr-auto-extraction (AP-24), per-diff coverage ≥ 80% | Validation |
| 10 | Step 7: reviewer-agent **mandatory all modes**. Size gate (PR < 100 LOC → baseline only). Content-aware override для auth/payments/crypto paths → full domain fan-out независимо от LOC | — |
| 11 | Verdict-gate (AP-16): committed `_review.md` с `**Verdict:**` line. Hook парсит. Без зелёного verdict — PR не merge'ится | — |
| 12 | Operator acceptance (Step 6) | Sanity check |
| 13 | PR squash & merge в main | — |

### Friction points (PM persona)

- Mature workflow — без сюрпризов. PM учится из verbose reviewer findings (learning layer on by default — единственный mode в v0).
- Lite-mode (`bugfix` / `small-fix`) — PM-driven self-declaration в spec frontmatter. Не для security path.

### Критические точки оттока

- Шаг 7: если planner выдаёт plan без architecturalного обоснования (learning layer broken) — оператор теряет ownership.
- Шаг 9: если CI gates fail'ят без actionable error message — frustration.
- Шаг 10: если reviewer пропускает critical finding — PM не видит проблему (не читает код).

### Success metric

≤ 2 сессии до first merged feature в template-native проекте.

---

## Journey 3: Mode `rework` — переработка существующей фичи

**Контекст входа.** Существующий продукт с написанной фичей. Поведение / API / схема меняется (breaking change или significant rework). Оператор хочет, чтобы AI сделал rework без накапливания технического долга.

### Шаги

| Шаг | Что делает | Что чувствует |
|---|---|---|
| 1 | Identifying фичу для rework, говорит bootstrap-agent'у: «mode rework, topic <topic>» | Готовность к работе |
| 2 | Agent читает существующие `<topic>_spec.md`, `_plan.md`, код, тесты. Даёт summary: «Текущее поведение — X. Текущий plan — Y. Что меняется?» | — |
| 3 | Agent ведёт через Stage A-C read-pass (lazy, по impact flags), плюс: «Rework меняет persona / journey / threats / positioning?» | — |
| 4 | Draft'ит `<topic>_spec.v<N>.md` с обязательной секцией **Diff**: «было / становится / мигрирует / deprecated / breaking yes-no» (enforce'ится через CI gate `rework-has-diff-section`) | — |
| 5 | Operator ревьюит spec.v<N>, маркирует ОК | — |
| 6 | Draft'ит `<topic>_plan.v<N>.md` с обязательной секцией **Migration**: backward compatibility / data migration / deprecation timeline / rollback strategy (CI gate `rework-has-migration-section`). **Опционально (v0.4.0+):** advisor invocation для scope-proportionality | — |
| 7 | Operator ревьюит plan.v<N>, маркирует «поехали» | — |
| 8 | Implementation в branch `feature/<topic>-rework` | Standard implementation |
| 9 | CI: spec discipline (v0.2.0+ gates включая spec-test-mapping для new scenarios), code linting, **mandatory `<topic>_review.v<N>.md`** | — |
| 10 | Operator acceptance: проходит сценарии в running app, сравнивает с поведением до rework'а | Sanity check |
| 11 | PR с squash & merge в main | — |

**AP-21 (бесконечный rework exit condition):** version count > 3 — required explicit «final version» marker в spec frontmatter, либо declared adoption_override per AP-22.

### Friction points (PM persona)

Rework mode особенно стрессовый, потому что migration-related ошибки PM не поймает inspection'ом — полагается на тесты + reviewer + acceptance. Spec.v<N> Diff-секция должна быть исчерпывающей. Обязательность reviewer-agent в rework mode — разумная цена за migration risk. Friction только если reviewer findings противоречивы и блокируют (что нормально, надо разрешить, не bypass).

### Success metric

≤ 3 сессии до merged rework (spec.v<N> + plan.v<N> + implementation).

---

## Journey 4: Mode `bug-fix` — quick fix без full ceremony

**Контекст входа.** Existing template-native проект. Bug в существующей фиче (или в shared module). Оператор хочет fix без full Stage E ceremony.

### Шаги

| Шаг | Что делает | Что чувствует |
|---|---|---|
| 1 | Identifying баг, говорит bootstrap-agent'у: «mode bug-fix» | Готовность |
| 2 | Создаётся `<topic>-bugfix_spec.md` с `mode: bug-fix` и `lite-mode: bugfix` в frontmatter | — |
| 3 | Spec lite: 1-2 Gherkin Scenario reproducing bug + acceptance criteria. Без full personas / journey context (для bugfix не нужно) | Быстро |
| 4 | Step 4 directly (skip Step 2 plan для lite): coder-agent failing-test-first per AP-5. Reproducing test fail'ит → fix → test pass | — |
| 5 | CI: spec-test-mapping (новый scenario имеет matching test), regression-coverage если topology_impact:yes | — |
| 6 | Reviewer-agent **всё равно обязателен** (mandatory all modes per AP-16). Но terse: только spec↔code consistency + AP-6 silent deviation check | — |
| 7 | PR squash & merge | — |

**Hard floor:** lite-mode `bugfix` **запрещён** для security-touching фич (auth/crypto/PII/payments/sessions). Bug в security path → full ceremony.

### Friction points (PM persona)

Comfortable — minimal ceremony, mandatory reviewer всё ещё guarantees correctness. Bug-fix mode — primary lite-flow для PM на мелких правках.

### Success metric

≤ 1 сессия (от detect bug до merged fix).

---

## Journey 5: Mode `template-sync` — bump версии template'а

**Контекст входа.** Existing template-native проект использующий `template_version_applied: v0.X.Y` (например v0.3.0). Template ушёл вперёд (v0.4.0+). Operator хочет обновиться.

### Шаги

| Шаг | Что делает | Что чувствует |
|---|---|---|
| 1 | Manual invocation: «template-sync, target v0.4.0» (bootstrap-agent **не** auto-suggest при session start) | — |
| 2 | Agent compare `template_version_applied` vs target version. Reads CHANGELOG между versions | — |
| 3 | **Phase 1: Template files apply.** Diff `_templates/`, scripts, agents files. Apply safe additive changes auto, flag conflicts для review | — |
| 4 | **Phase 2: Schema migration.** Если state schema additions (advisor_preset / skip_decisions / advisor_log в v0.4.0) — add fields с defaults preserve old behavior. Backwards compat | — |
| 5 | **Phase 3: Documentation migration.** Script `template-sync-doc-migrate.py` detect'ит 5 categories: spec frontmatter additions, missing required sections, foundational artifact splits (merge'и v0.3.0), mode aliases (legacy `new-feature`/`rework-feature`), state field additions. Reports в `.ai-pm/migrations/<date>-template-sync-doc-migration.md` | — |
| 6 | Operator reviews report → AskUserQuestion per category → apply через project-bootstrap interactive routine | Decision |
| 7 | **Phase 4: PR.** Generated `chore/template-sync-v0.X.Y` branch с CHANGELOG entry для product. Reviewer-agent — terse focus on migration correctness | — |
| 8 | Verification report: содержимое preserved? (через verification baseline table из migrate.py) | Sanity check |
| 9 | PR squash & merge | — |

### Friction points (PM persona)

Template-sync — стресс, потому что меняется foundation. Verification report (Phase 4 step 8) — critical для доверия.

### Критические точки оттока

- Шаг 5: если documentation migration теряет content без verification — оператор уйдёт. Mitigation: verification report с content integrity check; STOP/rollback если detected loss.
- Шаг 6: если AskUserQuestion per category слишком много (>5 categories) — fatigue. Mitigation: batch related decisions.

### Success metric

≤ 1-2 сессии в зависимости от migration scope (минимум — additive с defaults; максимум — major doc restructure).

---

## Journey 6: Legacy adoption — для проектов без `.ai-pm/`

**Контекст входа.** Existing product с своим кодом, своим CI, своим `doc/` (если есть). Оператор решает adopt'ить protocol для будущих фич, не переписывая прошлое.

### Шаги

| Шаг | Что делает | Что чувствует |
|---|---|---|
| 1 | Создаёт `.ai-pm/` в existing repo, активирует bootstrap-agent | — |
| 2 | Agent: «Mode? Integration?» — отвечает (`feature` или другой) + gitignore | — |
| 3 | Agent сканит репу: пытается определить стек по manifests | Любопытство |
| 4 | **3-choice entry** (AskUserQuestion): «Foundation completeness? Quick auto / Manual staged / Skip» | Дилемма time-cost |
| 5a | **Quick auto (5-10 min, recommended):** Tier 0 auto-extract scripts → stack / ui_kind / db_kind / topology sketch / ui-style-guide-base extract / database-design extract. `foundation_completeness: minimal`, `adoption_path: legacy-quick`. Trade-off: «первая фича каждого нового domain'а потребует Tier 1 mini-research» | Облегчение |
| 5b | **Manual staged (часы-дни):** AskUserQuestion multi-select какие Stage A-C artifacts адаптировать сейчас. AI extracts baseline + ведёт через formal stage process. `foundation_completeness: partial` или `complete`, `adoption_path: legacy-staged` | Investment |
| 5c | **Skip adoption (sub-minute):** только trust_profile + stack auto-detected + Stage D hooks. `foundation_completeness: none`, `adoption_path: legacy-skip`. **Hard floors** (security path) enforce'ятся mandatory даже в legacy-skip | Pragmatism |
| 6 | Stage D (упрощённый): не генерирует новый CI from scratch, а **дополняет** существующий `ci.yml` jobs'ами `ai-pm:*`. Линтеры которые user уже имеет — отмечает «covered, skip». Добавляет только missing категории | Облегчение: incremental adoption |
| 7 | **`skip_eligibility` framework (v0.4.0+) activated.** Per-artifact decisions: разрешено skip'ать optional / conditional артефакты при detected capabilities. `skip_decisions[]` в state. Hard floors (PII / payments / crypto) → mandatory без opt-out | — |
| 8 | Stage E: первая `<topic>_spec.md` в feature/<topic> branch. Для `foundation_completeness: minimal/none` — spec включает Tier 1 mini sections (Mini-persona / Journey context / Mini-threat-list) inline | Standard workflow |
| 9 | После 2-3 фич: возможно Tier 2 promotion routine — consolidate Mini-* sections в project-wide foundational docs (`promote-foundation.py`) | Растёт ощущение control'а |

### Friction points (PM persona)

Legacy adoption — менее frequent кейс для PM (PM обычно строит новые продукты с нуля). Но возможен — например PM подключается к existing продукту, который раньше вёл developer без template'а. В этом случае:
- Шаг 3: agent определяет стек автоматически — критично, PM не знает manifest details.
- Шаг 4: 3-choice — нужен default recommendation (Quick auto) с явным trade-off explanation.
- Шаг 7: hard floors (security path) enforce'ятся mandatory даже в legacy-skip — PM полагается на это, не может catch security gaps сам.

### Критические точки оттока

- Шаг 4: если 3-choice не поддерживает Skip — отвалится use case quick adoption.
- Шаг 6: если template переписывает существующий `ci.yml` — отвалится сразу (existing CI invariants ломаются).
- Шаг 7: если hard floors не enforce'ятся в Quick auto — silent security risk.

### Success metrics

- Quick auto: ≤ 1 сессия (5-10 min до Stage E ready)
- Manual staged: ≤ 2-4 сессии (зависит от scope)
- Skip adoption: ≤ 5 минут (sub-minute до Stage E с hard floors only)

---

## Journey 7: Architecture overview keyword routing (read-only)

**Контекст входа.** Existing project (любого состояния — template-native или legacy). Оператор хочет получить architecture snapshot **без** изменения state / без adoption.

### Шаги

| Шаг | Что делает | Что чувствует |
|---|---|---|
| 1 | Operator: «составь архитектуру проекта» / «architecture overview» / «extract topology» | Запрос insight |
| 2 | project-bootstrap keyword routing detects intent | — |
| 3 | Invocation: `./scripts/auto-extract/extract-all.sh --read-only` | — |
| 4 | Tier 0 auto-extract: stack / ui_kind / db_kind / topology / ui-style / database-design extracts | — |
| 5 | Output: `.ai-pm/extracts/architecture-<date>.md` | — |
| 6 | Agent presents summary в чате (high-level overview без diff dump) | Insight |
| 7 | **State unchanged.** Не trigger'ит adoption. Operator может decide потом adopt template (Journey 6) или нет | — |

### Friction points (PM persona)

PM rarely uses этот journey — она строит с нуля. Но useful когда PM приходит в existing продукт (например, наследует от выпавшего из проекта developer'а) и хочет получить snapshot before deciding на adoption path.

### Success metric

5-15 минут single session — от запроса до architecture extract file.

---

## Cross-journey общие паттерны

Все 7 journeys ломаются, если:

1. **Bootstrap не recover'ится через сессии.** `.bootstrap-state.md` поддерживает spaced sessions; agent при каждом запуске первым делом читает state и говорит «мы на Stage X, продолжаем?».
2. **Agent задаёт > 3 вопроса per artifact.** Cognitive load → drop-off для PM-оператора.
3. **Artifacts разрастаются.** Каждый > 2 страниц — риск для PM-оператора (нет attention budget). Soft cap warnings в merged docs (v0.3.0+) mitigate.
4. **Линтеры fail'ят без понятной diagnostics.** Universal kill switch.
5. **Template требует переписать существующий repo.** Особенно критично для feature / rework / legacy adoption journeys.
6. **CI gates не блокируют реальные риски** (например, миграция без rollback strategy не fails'ит). Подрывает доверие.

---

## Что эти journeys должны проверять

- **Каждая фича template'а** проходит через эти 7 journeys как acceptance tests. Если фича делает journey хуже (больше шагов, больше friction, больше времени) — она режется или переделывается.
- **Главные метрики успеха v0.4.0:**
  - `new-product` mode: до Stage E за ≤ 4 рабочих сессий
  - `feature` mode: первая фича в template-native проекте за ≤ 2 сессии
  - `rework` mode: rework spec + plan + acceptance за ≤ 3 сессии
  - `bug-fix` mode: ≤ 1 сессия
  - `template-sync` mode: ≤ 1-2 сессии (depending on migration scope)
  - Legacy Quick auto: ≤ 1 сессия (5-10 min)
  - Legacy Manual staged: ≤ 2-4 сессии
  - Architecture overview: 5-15 минут single session

---

## Resolved decisions

1. **Quick-draft Stage A для feature mode** — реализовано через `foundation_completeness: minimal` + Tier 1 mini sections в feature spec'е (Mini-persona / Journey context / Mini-threat-list). Promotion в full project-wide artifacts — через Tier 2 routine (`promote-foundation.py`).

2. **Lite-mode для small changes** — реализовано через `lite-mode: bugfix | small-fix` в feature-spec frontmatter (см. `personas.md` resolved decision 2 для деталей). `c-fast` variant deprecated в v0.7.0 (PM-only ЦА, был для Trust profile C).

3. **Spaced sessions: формат `.bootstrap-state.md`** — markdown с обязательным frontmatter (mode / integration / trust_profile / advisor_preset / started / last_update / template_version / stack / project_capabilities / foundation_completeness / adoption_path / adoption_overrides / skip_decisions / advisor_log). Update'ы через `update-bootstrap-state.sh` hook.

4. **Recipe staleness** — **deferred в v0.X**: рецепты (`doc/_recipes/cache/ai-linting-{go,python,typescript}.md`) обновляются вручную при необходимости. Frontmatter `last_reviewed` / `stack_versions` + bootstrap-agent staleness check — backlog item (decision 2026-05-25). Recipes для других стеков (Rust / Java / C# / etc.) — community contributions или manual draft.

5. **3-choice legacy entry** (v0.1.0+) — Quick auto (recommended, 5-10 min, Tier 0) / Manual staged (часы-дни, multi-select) / Skip (sub-minute, hard floors only).

6. **Conditional skip per artifact** (v0.4.0+) — `skip_eligibility` metadata в каждом `_templates/*.md.tmpl`. Advisor auto-detects from project capabilities. Layer-climbing escalation через `next_reprompt` field (default 90 days).
