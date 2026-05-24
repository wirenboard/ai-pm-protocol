# ai-pm-protocol

Универсальный protocol для разработки в связке **соло-оператор + AI-агент**, оформленный как репо-шаблон + init-агент. Оператор — это PM (Trust profile A) или developer (Trust profile B/C), который ведёт продукт один, а AI выступает второй парой рук.

## Кому это и зачем

**Core product thesis:** есть два архетипа solo-builder'ов с симметричной болью:

- **PM боль:** «знаю что нужно (продукт / users / business), не могу писать код в нужном темпе/качестве».
- **Developer боль:** «умею писать код — но как сделать его максимально полезным и удобным для реальных пользователей?» (не «что делать» — задачу всегда можно найти; а **как** сделать ценно).

Template **симметрично закрывает обе** через cross-substitution:

| Сторона | Что получает | Pain закрывается |
|---|---|---|
| **PM** (Trust profile A) | AI как personal developer + automation/reviewer = peer-review team | «писать код в нужном темпе и качестве» |
| **Developer** (Trust profile B/C) | Template как PM-discipline (Stage A discovery → personas, journeys, competitive UX scan, brand voice; Stage B constraints → SLO, threats, validation script; enforced spec linkage; formalized review) | «делать полезно и удобно для пользователей» |

**Bidirectional learning:** PM по ходу осваивает архитектуру (через learning-oriented review-выходы, см. `reviewer.md`), developer — **продуктовое мышление и UX-интуицию** (через Stage A discovery, journeys, competitive UX scan в `positioning.md` § 1, brand voice в `ui-style-guide-base.md` § 2) и соседние стеки (через Stage D `tech-stack.md` + Trust profile B). Template — **усилитель компетенций**, не **замена навыков**.

**Чем это не является:** не методология для команд > 1 человека. Не code generator. Не AI hype. Не vibecoding tool.

## Как это работает: пять стадий

Любой продуктовый проект проходит пять стадий — **последовательность layered constraints**, где каждая следующая опирается на предыдущую и **не может** начаться, пока предыдущая не закрыта оператором («operator-gate», AP-3). Возврат назад допустим, если обнаружили пробел — фиксируется в `.bootstrap-state.md`. На каждой стадии **AI драфтит** артефакты, **оператор маркирует** «ОК / поменять X»; в неоднозначных местах AI задаёт вопросы через `AskUserQuestion`. Оператор владеет **решением**, AI — **исполнением**: оператор не пишет ни кода, ни artifact'ов руками.

| # | Stage | Что закрываем | Ключевые артефакты | new-product mode | feature/rework modes |
|---|---|---|---|---|---|
| **A** | **Discovery** | Кто / для кого / в каких сценариях / как звучим / как выглядим | vision, personas, user-journeys, `positioning.md` (включает competitive landscape § 1), `ui-style-guide-base.md` (включает brand voice § 2) + per-kind ui-style-guide-<kind> | WRITE | READ + WRITE дельт |
| **B** | **Constraints** | Что должно работать (SLO), что не должно сломаться (threats / legal / incidents), что отрезаем (scope) | strategic-frame, threat-model, `legal.md` (§ 1 legal frame + § 2 brief), customer-interview-script, incident-runbook-draft, mvp-scope | WRITE | READ + WRITE дельт |
| **D** | **Process** | На чём строим / как храним данные / как ведём разработку | `tech-stack.md` (§ 1 stack + § 2 topology + § 3 db_kind references + § 4 deployment), `database-design-base.md` + per-kind, `dev-environment.md`, optional `maintenance-playbook.md` (Part A dep-policy + Part B refactor-playbook), `development-protocol-overlay.md`, ai-linting-rules, subagent configs | WRITE | SKIP |
| **E** | **Bootstrap** | Concrete infrastructure — **выводится** из A/B/D, не упреждающе (AP-2). 1 checkpoint в state: `bootstrap-verify.sh passed` (script проверяет 12 granular items) | `.github/workflows/ci.yml`, configs линтеров, semgrep rulesets, git hooks, branch protection, `Makefile` / `.editorconfig` / `.vscode/`, `scripts/bootstrap-verify.sh` | WRITE | SKIP (verify) |
| **F** | **Production** | Реальные фичи. Каждая фича — микро-цикл `spec → plan → operator-review → tests-first code → CI gates → acceptance → reviewer-agent`. ADR пишутся **реактивно** при архитектурном fork'е (AP-1) | `doc/features/<topic>_{spec,plan,review}.md` + код + тесты | WRITE | WRITE |

**Stage C упразднён в v0.3.0** — topology + foundational ADRs тематически близки stack / db choice, fold в Stage D `tech-stack.md`. Reactive ADRs остаются (AP-1) — создаются в Step 2 plan'ов фич, не как stage artifact.

**Порядок не произвольный.** A до B — нельзя сформулировать SLO / threats без понимания пользователя. B до D — нельзя выбрать стек / topology, не зная границ MVP и threat surface'а. D до E — infrastructure выводится из стека и capabilities, упреждающе создавать запрещено (AP-2). E до F — без CI / hooks / branch protection первая фича лишена защитной сетки.

**Composition matrices** (multi-value capabilities для composite продуктов):
- `ui_kind` — например `web, backend` для full-stack web; `cli, backend` для CLI с server-side. Для каждого значения — отдельный `ui-style-guide-<kind>.md`.
- `db_kind` — например `embedded, external` для mobile с local cache + central API; `none` для stateless services. Для каждого — отдельный `database-design-<kind>.md`.

Подробности — `doc/development-protocol.md` § 4-5.

## Пять режимов — какой когда выбирать

Bootstrap-agent на init спрашивает **режим** (`mode`) — это определяет тип работы. Режимы **не взаимоисключающие во времени**: проект стартует в `new-product`, потом живёт в `feature` (фича за фичей), периодически уходит в `rework`, `bug-fix`, и `template-sync` (для bump'ов версии шаблона). Mode фиксируется per-feature во frontmatter `<topic>_spec.md`.

| Mode | Когда выбирать | Что делает | Stage A/B/D | Stage F particulars |
|---|---|---|---|---|
| **`new-product`** | Greenfield: новый продукт, нет ни кода ни docs | Полный путь Stage A→E с нуля, затем feature work | WRITE всё | Standard `_spec.md` + `_plan.md` |
| **`feature`** | Новая фича. Любое состояние проекта (template-native, после legacy adoption) | READ-pass по Stage A/B/D (или mini-research per feature, если foundation incomplete), потом Stage F | READ + WRITE дельт | Standard `_spec.md` + `_plan.md` |
| **`rework`** | Переписываем существующую фичу — поведение меняется | Как `feature`, плюс обязательное чтение existing `_spec` / `_plan` / кода / тестов | READ | `_spec.v<N>.md` с **Diff** + `_plan.v<N>.md` с **Migration** |
| **`bug-fix`** | Lite вариация `feature` для багфикса | Краткий spec (Context / Expected / Fix scope / Test), упрощённый plan, **failing test first**, terser review | READ | `_spec.md` с `lite-mode: bugfix` |
| **`template-sync`** | Bump template version в template-native проекте | Diff applied vs latest, apply safe changes auto, flag manual review items | N/A | `chore/template-sync-v0.X.Y` PR |

**Важно про bug-fix:**

- **Security bugs — full ceremony, no lite-mode.** Если bug в auth / crypto / PII / payments / sessions — полный workflow + threat-model cross-check.
- **Lite-mode hierarchy:** `bugfix` (bugs) → `small-fix` (мелкая дельта без bug) → `c-fast` (Trust profile C + small + non-security). См. `coder.md`.

**Lifecycle continuum:** project-bootstrap agent ведёт оператора через все режимы по мере того, как меняются intent'ы (новая фича / bug / rework / release / template-sync). Session resume — bootstrap читает `.bootstrap-state.md` и scans `doc/features/` на in-progress topic'и.

## Legacy adoption — для проектов без `.ai-pm/`

Что если у вас legacy продукт (код работает, шаблона никогда не было)? При первой session AI detect'ит legacy и явно предлагает **3 варианта** с trade-off explanations:

| Choice | Time | Что делает | Trade-off |
|---|---|---|---|
| **Quick auto** (recommended) | 5-10 min | Tier 0 auto-extract: stack / `ui_kind` / `db_kind` / topology / ui-style / database-design + Stage E hooks | Быстро, но первая фича каждого нового domain'а требует Tier 1 mini-research (10-30 min) |
| **Manual staged** | часы-дни | Operator multi-selects какие Stage A/B/D/E artifacts адаптировать сейчас, AI ведёт через formal process | Больше времени upfront, потом standard workflow без per-feature overhead |
| **Skip adoption** | sub-minute | Только `trust_profile` + `stack` auto-detected + Stage E hooks (hard floor) | Zero upfront, AP-14/15/18 enforce'ы limited, каждая фича требует mini-research |

После adoption проект становится **template-native** (с possibly incomplete foundation), дальше использует standard 5 modes выше. **Foundation completeness** растёт incrementally — `minimal` → `partial` → `complete` через operator-initiated promotion.

**Tier framework — что обрабатывается на каком уровне:**

| Tier | Что | Когда |
|---|---|---|
| **Tier 0 — auto-extract** | AI extracts без вопросов: stack / ui_kind / db_kind / topology / ui-style / database-design | Quick adoption + standalone keyword routing «составь архитектуру проекта» |
| **Tier 1 — mini-research** | Per-feature mini-persona / journey-step / threat-list (5-30 min AskUserQuestion) | При `foundation_completeness: minimal/none` и фича требует context |
| **Tier 2 — promotion** | Consolidation mini-* sections → project-wide artifacts | Operator-initiated «адаптируй полностью» |
| **Tier 3 — declared overrides** | `[adopt-override: skip-X, reason, accepted-risk]` для declared trade-offs | Когда что-то нельзя/не нужно делать. Reviewer downgrades affected checks |

Подробное описание — `doc/development-protocol.md` § 3 + design doc `meta/design/2026-05-24_mode-matrix-and-adoption.md`.

## Какие механики защищают качество

Шаблон **не полагается на code review человека** — это противоречит core thesis (оператор при Trust profile A не читает код). Защита строится на **automated fitness functions** в 4 категориях + **independent AI reviewer** + **5-layer enforcement**. Все 4 catalogue'а живут в шаблоне и адаптируются под стек продукта на Stage E.

### 4 категории fitness functions

| Категория | Что enforce | Source | Примеры |
|---|---|---|---|
| **Code linting** (§ 7) | AI-specific code smells, которые статичный анализ ловит лучше человека | Per-stack mapping (ESLint / ruff / golangci / clippy + custom AI catalogue) | Anti-cargo-cult patterns, cyclic complexity, dead code, long functions, magic numbers, недокументированные suppression'ы |
| **Architecture linting** (§ 8) | Архитектурные инварианты как fitness functions, не review-by-eye | dependency-cruiser / import-linter / depguard + custom semgrep rules | Module boundaries, layered architecture, no-cyclic-deps, crypto isolation, PII isolation |
| **Spec / use-case linting** (§ 9) | Дисциплина foundational docs + feature spec'ов | `scripts/check-spec-discipline.sh` (catalogue из 14 checks) | personas-exist, journeys-reference-personas, mvp-scope-no-orphans, spec-references-persona, spec-impact-fields-present (AP-14), pr-ordering-for-multi-domain (AP-19), rework-has-diff-section, **spec-test-mapping** (v0.2.0+, каждый Gherkin Scenario — matching test), **test-assertion-weakening** (v0.2.0+, AP-23, нельзя ослаблять existing assertions без ADR ref), **regression-coverage-for-shared-modules** (v0.2.0+, AP-14 ext.), **adr-auto-extraction** (v0.2.0+, AP-24, > 50 LOC arch content в spec без ADR ref → fail) |
| **Security scanning** (§ 10) | Anchored в индустриальные стандарты (OWASP / CWE / NIST / CIS / SLSA), не «список хороших идей» | semgrep `p/owasp-top-ten`, gitleaks, codeQL, dependency-audit | Crypto failures (CWE-321/522), injection (CWE-89/79), secrets in code, vulnerable dependencies |

**Conditional rulesets:** catalogue фильтруется по capabilities из `.bootstrap-state.md`. Продукт без crypto → не включаем CWE-321; без public web → не включаем CSP rules. Прицельно, не «1000 правил из набора».

### Offline-first review enforcement (AP-16)

Главная защита от drift — **independent reviewer**, не код-ревью человеком. Цикл «открыть PR → дождаться комментариев → fix → дождаться» устранён by design:

1. Coder завершает Step 4 → reviewer **обязательно** запускается локально **до** `gh pr create`
2. Reviewer пишет `<topic>_review.md` (или `.ai-pm/.reviews/<branch>.json` для chore/docs) с **verdict-gate** в первых 50 строках: `**Verdict:** approve | approve-with-comments | request-changes`
3. Layer 2 hook `scripts/check-pr-has-review.sh` блокирует `gh pr create` / `gh pr merge` если (a) trail отсутствует **или** (b) verdict = `request-changes`
4. Для override (зафиксить часть, остальное deferred) — `[review-override: <reason>]` в HEAD commit body. **Только** с явного instruction оператора, AI ничего не решает сам
5. `[skip-review]` marker — для trivial chore (typo / dep bump)

См. AP-16 в `doc/anti-patterns.md`.

### Specialized reviewers + primary router (AP-19 + AP-20)

Naive подход «один agent читает всё» страдает от prompt-разрастания. Naive «spawn 5 specialized всегда» — overhead × 5. Шаблон делает **smart router**:

```
primary reviewer (orchestrator)
├─ detect PR domain через Conventional Commits scope + paths
├─ Always spawn → protocol-compliance-reviewer (spec↔plan↔code, frontmatter, AP discipline)
└─ Plus ONE domain reviewer:
    ├─ backend-reviewer (API / endpoints / server)
    ├─ frontend-reviewer (UI / web / mobile / desktop / tui / cli)
    ├─ design-reviewer (UX / copy / visual)
    └─ database-reviewer (schema / migrations / indexing)
```

**Worst case — 2 spawn'а per atomic PR** (protocol-compliance + 1 domain), vs naive 5. Mixed-domain PRs flag'ятся как `request-changes` с recommend «split per AP-19 atomicity» — каждый PR должен touchать **один** domain.

### Composition matrices (ui_kind / db_kind)

Реальные продукты редко one-shape: backend + web, mobile + central API, CLI + server-side. Шаблон поддерживает **multi-value capabilities**:

- **`ui_kind`** — что за UI у продукта: `web` / `native-mobile` / `native-desktop` / `tui` / `cli` / `embedded` / `backend`. Для каждого значения пишется отдельный `ui-style-guide-<kind>.md` (latency SLO для backend, accessibility WCAG для web, touch targets для mobile, etc.).
- **`db_kind`** — что за БД: `embedded` (SQLite/IndexedDB) / `external` (PostgreSQL/MySQL) / `none` (stateless). Для каждого — отдельный `database-design-<kind>.md` (lock-aware migrations, identifier strategy, backup discipline).

Пример: `ui_kind: web, backend` + `db_kind: external` → пишутся `ui-style-guide-base.md` + `ui-style-guide-web.md` + `ui-style-guide-backend.md` + `database-design-base.md` + `database-design-external.md`. AP-15 / AP-18 enforce'ят их наличие до feature work.

### Trust profile A / B / C

`trust_profile` в `.bootstrap-state.md` определяет **output template** subagents:

| Profile | Кто | Что меняется в output |
|---|---|---|
| **A** | PM, не читает код | **Verbose** plans / coder comments / reviews + learning layer (explain non-trivial architectural principles inline) |
| **B** | Cross-stack senior dev | **Mixed** — verbose для out-of-domain stack, terser для native (читает diff fluent) |
| **C** | Full-stack pro | **Terse** — no learning layer, cross-refs к ADRs вместо exposition. Plus `lite-mode: c-fast` для small features |

Hard floor для всех profile'ов: security path (auth / crypto / PII / payments) — **full ceremony**, lite-mode игнорируется.

## Структура репо template'а

```
ai-pm-protocol/
├── README.md                          ← эта страница
├── LICENSE                             ← AGPL-3.0
├── doc/
│   ├── development-protocol.md        ← полный generic protocol (копируется в продукт как overlay)
│   ├── anti-patterns.md               ← правила «никогда так не делай» (копируется как overlay)
│   ├── personas.md, user-journeys.md  ← Stage A artifacts template'а самого (не копируются)
│   ├── _templates/                    ← skeleton'ы для каждого artifact'а (копируются в продукт)
│   │   ├── personas.md.tmpl, user-journeys.md.tmpl
│   │   ├── feature-spec.md.tmpl, feature-plan.md.tmpl, feature-review.md.tmpl
│   │   ├── ui-style-guide-base.md.tmpl + per-kind (web / mobile / desktop / tui / cli / embedded / backend)
│   │   ├── database-design-base.md.tmpl + per-kind (embedded / external)
│   │   ├── bootstrap-state.md.tmpl, CLAUDE.md.tmpl, settings.json.tmpl
│   │   └── scripts/*.tmpl (check-spec-discipline / check-pr-has-review / git hooks)
│   └── _recipes/cache/                ← stack-specific recipe cache (ESLint/ruff/etc. mapping)
├── meta/                              ← template-internal, НЕ копируется в продукт
│   ├── README.md                      ← объяснение что здесь
│   ├── audits/                        ← internal audit'ы логики самого шаблона
│   └── reviews/                       ← review trails для PR'ов в template repo (AP-16)
└── .claude/
    └── agents/                        ← все subagents (копируются в продукт на Stage E)
        ├── project-bootstrap.md, planner.md, coder.md, release-helper.md
        └── reviewer.md, protocol-compliance-reviewer.md, backend-reviewer.md,
            frontend-reviewer.md, design-reviewer.md, database-reviewer.md
```

## Структура продукта, который использует template

```
<product-repo>/
├── doc/                              ← committed product content (new-product mode, top-level)
│   ├── personas.md, user-journeys.md, threat-model.md, ...
│   ├── ai-linting-rules.md, development-protocol.md
│   ├── architecture-decisions/
│   └── features/
├── .ai-pm/
│   ├── .bootstrap-state.md           ← committed
│   ├── version                       ← committed (template version pin)
│   └── tooling/                      ← submodule / symlink / vendor (см. Setup ниже)
├── CLAUDE.md, .claude/settings.json, .gitignore
└── (rest of product code)
```

`doc/` для new-product mode — top-level. Для feature/rework modes с existing top-level `doc/` — content в `.ai-pm/doc/` (см. development-protocol.md § 2 для retrofit layout'а).

## Setup для product repo

Template **не копируется** в продукт. Поддерживаются три варианта подключения; bootstrap-agent определяет тип автоматически (submodule / symlink / vendor) и записывает в state.

### Вариант A. Git submodule (рекомендуется)

Подходит для большинства случаев — version-pinned, voспроизводимо на CI / у других разработчиков, один clone тащит всё.

```bash
cd ~/dev/my-product
git submodule add git@github.com:aadegtyarev/ai-pm-protocol.git .ai-pm/tooling
git commit -m "chore: подключён ai-pm-protocol как submodule"
```

После clone'а продукта другие разработчики делают:

```bash
git clone --recurse-submodules <product-url>
# или, если уже clone'нули без --recurse:
git submodule update --init --recursive
```

Обновление template'а до новой версии:

```bash
cd .ai-pm/tooling
git fetch && git checkout <tag-or-commit>
cd ../..
git add .ai-pm/tooling && git commit -m "chore: bump ai-pm-protocol до <ver>"
```

### Вариант B. Symlink

Подходит, если разрабатываешь template и продукт параллельно — изменения в template сразу видны в продукте без commit'а / submodule update.

```bash
cd ~/dev
git clone git@github.com:aadegtyarev/ai-pm-protocol.git
cd my-product
mkdir -p .ai-pm
ln -s ../../ai-pm-protocol .ai-pm/tooling
echo ".ai-pm/tooling/" >> .gitignore
```

Windows: `mklink /D .ai-pm\tooling ..\..\ai-pm-protocol` (cmd) или `New-Item -ItemType SymbolicLink ...` (PowerShell).

Минусы: каждый разработчик клонит template сам, CI требует отдельного шага клонирования template'а перед запуском линтеров.

### Вариант C. Vendor (copy)

Подходит для air-gapped окружений или когда нужно freeze состояние без зависимости от внешнего репо.

```bash
cp -r ~/dev/ai-pm-protocol my-product/.ai-pm/tooling
rm -rf my-product/.ai-pm/tooling/.git
cd my-product && git add .ai-pm/tooling
```

Минусы: template дублируется в каждом продукте, обновление — ручной merge.

### Запуск bootstrap-agent

После подключения template'а любым из вариантов:

```bash
cd my-product
claude  # запустит bootstrap-agent при первой сессии
```

Bootstrap-agent **сам**:
1. Скопирует bootstrap-state.md skeleton (с unfilled options) в `.ai-pm/`.
2. Скопирует CLAUDE.md (root) и `.claude/settings.json`.
3. Спросит Mode + Trust profile + Advisor preset (v0.4.0+: `full` / `standard` / `minimal` — определяет how aggressive `discipline-advisor` рекомендует skip артефактов per `skip_eligibility` framework). Integration mode — детектируется automatically.
4. Поведёт через Stage A/B/D/E.

## Multi-layer enforcement (5 слоёв)

Template enforce'ит протокол через 5 защитных слоёв (см. `doc/development-protocol.md` § 5.5):

| Layer | Что | Hard / Soft |
|---|---|---|
| 1 | `CLAUDE.md` briefing — каждая Claude session читает | Soft |
| 2 | `.claude/settings.json` PreToolUse hooks — блокируют Write/Edit/Bash | **Hard** |
| 3 | Subagent routine (planner, coder, reviewer, …) | Soft |
| 4 | Git hooks (pre-commit, commit-msg, pre-push) | **Hard** |
| 5 | CI gates + branch protection | **Hardest** |

Слои 2, 4, 5 **физически блокируют** нарушения протокола (например, попытку Write в `apps/` без spec'а). Оператор может игнорировать Layer 1 (briefing), но Layer 2 hook не пропустит tool call.

## Anti-patterns, явно запрещённые

См. `doc/anti-patterns.md`. Краткий список:

- **AP-1:** ADR upfront (без plan'а фичи, который этого требует)
- **AP-2:** Premature Stage E (`apps/`, `packages/` до первого `<topic>_spec.md`)
- **AP-3:** Документы без operator-gate между стадиями
- **AP-6:** AI отклоняется от plan'а без объявления и без обсуждения
- **AP-13:** Пропуск operational / legal / validation артефактов
- **AP-14:** Пропуск структурного read-pass'а перед feature spec
- **AP-15:** UI-фичи без Stage A `ui-style-guide-base.md` + per-kind foundation
- **AP-16:** PR создан / merged без зелёного review-trail
- **AP-17:** Утечка product-specific имён в template
- **AP-18:** Unsafe deploys / migrations без rollback guarantee (cross-cutting)
- **AP-19:** Mixed-domain PR (нарушает per-PR atomicity)
- **AP-20:** Naive «all-specialized-always» reviewer spawn (overhead)
- **AP-21:** Бесконечный rework без exit condition (spec.v3+ requires AskUserQuestion confirmation)
- **AP-22:** Adoption-override без declared trade-off (legacy adoption discipline)

## Subagents

В `.claude/agents/`:

- **`project-bootstrap`** — Stage A/B/D/E setup + resume + lifecycle routing
- **`planner`** — Step 2 plan writer. Read-only по коду. Trust-profile-aware с concrete dual templates (A/B/C)
- **`coder`** — Step 4 implementation. Tests-first. Lite-mode hierarchy (bugfix / small-fix / c-fast)
- **`reviewer`** — Step 7 primary router. Detect PR domain → spawn `protocol-compliance-reviewer` (always) + ONE domain reviewer
- **`protocol-compliance-reviewer`** — always spawned. Spec↔plan↔code, frontmatter, AP discipline
- **`backend-reviewer`** — API contracts, idempotency, RFC 7807, latency SLO
- **`frontend-reviewer`** — tokens, accessibility per-kind, frameworks-first, i18n
- **`design-reviewer`** — 8 принципов, brand voice, эффективность пути
- **`database-reviewer`** — schema, expand-contract migrations, indexing, identifier strategy
- **`discipline-advisor`** (v0.4.0+) — read-only 5-axis quality challenger. Hybrid floor (deterministic hard rules: PII/auth/crypto/payments detection) + smart layer (bounded scan, <10k tokens, cached per session). Opt-in до PoC accuracy gate ≥80% per axis достигнут — после validation mandatory в Stage F triggers
- **`release-helper`** — release PR при накоплении merged feature-PRs. SemVer + CHANGELOG

Worst-case 2 spawns per atomic PR (protocol-compliance + 1 domain). См. AP-19 + AP-20.

## Статус

v0 draft. Шаблон обкатывается параллельно с первым реальным prod-run'ом (private); правила и templates уточняются по мере того, как реальный проект сталкивается с реальностью.

## Contributing

Если ты contribute'ишь изменения **в сам шаблон** (а не используешь его в своём продукте) — после клона активируй внутренние git hooks:

```bash
git config core.hooksPath .githooks
```

Это включит pre-push hard-block на прямой push в `main` (development-protocol.md § 14.6). Без этого `.githooks/pre-push` лежит в репке, но git его не видит. Активация идемпотентна и нужна один раз на клон.

Все изменения в шаблоне идут через PR в feature/<topic>, docs/<topic> или chore/<topic> ветки. Direct-push в `main` запрещён § 14.

## Лицензия

**AGPL v3** — см. `LICENSE`. Коммерческое использование разрешено; модификации (включая SaaS-deployment) должны возвращаться в open source под той же лицензией.

SPDX-License-Identifier: `AGPL-3.0-only`
