# Development Protocol — Generic

Универсальный protocol разработки в связке **соло-оператор + AI-агент**. В v0 оператор — это PM (не читает AI-код), который ведёт продукт один; convention из anti-patterns.md AP-16. Developer-as-operator кейс — backlog item после empirical validation PM-кейса (см. personas.md «Что НЕ persona в v0»). Описывает **процесс**, не технологию: стек и инструменты выбираются на Stage C и генерируются на Stage D под конкретный проект.

**Статус:** v0. Source-of-truth — `../ai-pm-protocol/`. Project-specific overlays могут добавлять правила (см. § 13), но **не отменять** generic.

---

## 1. Принципы

### 1.1. Content First, Infrastructure Generated

Оператор **сначала** наполняет foundational docs (personas, journeys, threat-model, scope, …), и **только потом** init-agent генерирует конкретную инфраструктуру (CI, линтеры, архитектурные правила, spec/use-case checks, pre-commit) — потому что без стека, scope, security profile, set of capabilities нельзя выбрать правильные tools. Создавать infrastructure упреждающе — это анти-паттерн (см. § AP-2: premature Stage D).

### 1.2. Specification First (для каждой фичи)

Каждая фича начинается со spec'а на естественном языке. AI пишет код только после operator-approval spec'а и plan'а. См. `anti-patterns.md` § AP-4.

### 1.3. Tests First

AI пишет тесты до имплементации: property-based → BDD → unit → integration. См. § AP-5.

### 1.4. Architecture as Code

Архитектурные инварианты enforce'ятся **автоматическими fitness functions**, не через code review. PR не merge'ится, если правило нарушено. Категории — § 7 (code), § 8 (architecture), § 9 (spec/use-case).

### 1.5. AI Provides Transparency

AI не молча отклоняется от plan'а. См. § AP-6. Оператор — высший контроль.

### 1.5.1. AI bounded by source artifacts

AI-агенты — исполнители принятых решений; любой output bounded by source artifacts agent'а, любое расширение beyond source требует operator-touch через fork-justification protocol (см. § 9.5 + AP-25 + AP-26). Без этого contract'а template'а нет смысла: PM (не читает код) не может trust AI-output, потому что в любой точке цепочки AI мог тихо расширить scope.

### 1.6. Boring Tech Where Possible

На Stage C предпочтение — зрелым, скучным, хорошо документированным инструментам.

### 1.7. operator-gates between stages

См. § AP-3. Stage-to-stage переход — только по явному operator-approval.

---

## 2. File structure в product repo

Структура зависит от `doc_root` setting, который bootstrap-agent определяет на Stage 0 init.

### 2.0. Convention для product content location

- **new-product mode (greenfield):** product content (personas / journeys / threat-model / specs / etc.) в **top-level `doc/`**. Это стандартная конвенция, привычная разработчикам, легко discoverable.
- **feature/rework modes (existing project с уже занятым top-level `doc/`):** product content в **`.ai-pm/doc/`** для conflict avoidance.
- **feature/rework modes без existing `doc/`:** top-level `doc/` OK, как в new-product mode.

`doc_root` записывается в frontmatter `.ai-pm/.bootstrap-state.md` и читается всеми subagents + scripts. **Не hardcode'ить пути** в template artifacts'ах.

### 2.1. Greenfield layout (new-product mode, `doc_root: doc`)

```
<product-repo>/
├── doc/                              ← product content (committed, top-level)
│   ├── personas.md
│   ├── user-journeys.md
│   ├── threat-model.md
│   ├── strategic-frame.md
│   ├── mvp-scope.md
│   ├── tech-stack.md
│   ├── positioning.md
│   ├── ui-style-guide-base.md      ← + per-kind ui-style-guide-<kind>.md
│   ├── legal.md
│   ├── maintenance-playbook.md    ← optional (Stage C)
│   ├── ai-linting-rules.md            ← project-specific stack mapping
│   ├── development-protocol.md        ← project overlay
│   ├── anti-patterns.md               ← project additions (опц.)
│   ├── architecture-decisions/
│   └── features/
├── .ai-pm/
│   ├── .bootstrap-state.md            ← committed (state + resume)
│   ├── version                        ← committed (template version pin)
│   └── tooling/                       ← integration-mode-dependent
│       ├── _templates/, recipes-cache/, agents/, scripts/
│       └── development-protocol.md    ← generic (template-level)
├── CLAUDE.md                          ← briefing для Claude sessions
├── .claude/settings.json              ← Layer 2 enforcement hooks
├── .gitignore
└── (product code + standard project files)
```

### 2.2. Retrofit layout (feature/rework modes с existing `doc/`, `doc_root: .ai-pm/doc`)

```
<product-repo>/
├── doc/                              ← user's own doc/, нетронуто
├── .ai-pm/
│   ├── doc/                          ← ai-pm product content (committed)
│   │   ├── personas.md, ...
│   │   ├── ai-linting-rules.md
│   │   ├── architecture-decisions/
│   │   └── features/
│   ├── .bootstrap-state.md
│   ├── version
│   └── tooling/
├── CLAUDE.md, .claude/settings.json, .gitignore
└── (rest of user project — нетронуто)
```

### 2.1. Three integration modes для `.ai-pm/tooling/`

Bootstrap-agent при инициализации спрашивает оператора, как интегрировать tooling:

- **`gitignore` (default).** `.ai-pm/tooling/` в `.gitignore`, dev клонит template отдельно и symlink'ает. Минимальный footprint в repo.
- **`submodule`.** `git submodule add` template-repo как `.ai-pm/tooling`. Version-pinned, чище для team-проектов.
- **`vendor`.** Full copy commit'ится. Full ownership, можно local modifications.

`.ai-pm/doc/` всегда commit'ится независимо от integration mode — это product content.

### 2.2. CI integration

ai-pm-specific jobs (spec discipline, security catalogue, AI-linting catalogue) добавляются в **существующий** `ci.yml` пользователя, не отдельный workflow. Job names префиксуются `ai-pm:` чтобы было ясно, что от template'а. Существующие user jobs не трогаются.

---

## 3. Five modes + foundation state

Шаблон поддерживает **5 mode'ов** (linear) + **foundation_completeness** как orthogonal state. Mode определяет **тип работы**; foundation state определяет **глубину foundational artifacts** и triggers per-feature mini-research vs full Stage A-C read-pass.

### 3.1. Modes (5)

| Mode | Когда |
|---|---|
| `new-product` | Greenfield: новый продукт, нет ни кода ни docs. Stage A-D formal с нуля |
| `feature` | Новая фича — любое состояние проекта (template-native / legacy после adoption) |
| `rework` | Modify existing feature — поведение меняется. Spec.v<N> с Diff + Migration |
| `bug-fix` | Lite variant of `feature` для bugs. `lite-mode: bugfix` в frontmatter |
| `template-sync` | Bump template version в template-native проекте. Manual-only invocation |

### 3.2. Foundation completeness — orthogonal state

В `.bootstrap-state.md` поле `foundation_completeness`:

| Value | Что значит | AP-14 read-pass |
|---|---|---|
| `complete` | Full Stage A-C filled (greenfield closed Stage D или legacy-staged completed) | Standard full read-pass |
| `partial` | Некоторые Stage A-C artifacts есть, не все | Read-pass на existing, mini-research для missing |
| `minimal` | Только Tier 0 auto-extract artifacts (legacy-quick adoption) | Per-feature mini-research для каждой фичи |
| `none` | Только trust_profile + stack + Stage D hooks (legacy-skip adoption) | Mini-research для всего; hard floors enforce'ятся |

### 3.3. Adoption path — как проект попал в текущее foundation state

Поле `adoption_path` в state:

| Value | Когда |
|---|---|
| `greenfield` | Stage A-D formal с нуля (через `new-product` mode) |
| `legacy-quick` | Tier 0 auto-extract при legacy adoption (5-10 min) |
| `legacy-staged` | Operator multi-selected Stage A-D artifacts (часы-дни) |
| `legacy-skip` | Только minimum + Stage D hooks (sub-minute) |
| `null` | Для greenfield projects пока Stage D не closed |

### 3.4. Mode `new-product` (greenfield)

Init-agent ведёт оператора через Stage A-C (контент: personas, journeys, threat-model, scope, topology, выбор стека), потом делает Stage D (генерирует infrastructure из catalogue + стек), потом Stage E (фичи). После Stage D closed:
- `foundation_completeness: complete`
- `adoption_path: greenfield`

### 3.5. Mode `feature`

Новая фича. Работает для **любого** состояния проекта:
- `foundation_completeness: complete` → standard READ-pass Stage A-C, потом Stage E
- `partial` / `minimal` / `none` → AP-14 read-pass triggers per-feature mini-research где нужно (см. § 3.10)

Init-agent проверяет соответствие infrastructure ожиданиям (Stage D consistency), переходит к Stage E.

### 3.6. Mode `rework`

Modify existing feature — поведение меняется. Как `feature`, плюс обязательное чтение существующих `<topic>_spec.md`, `_plan.md`, кода, тестов. На Stage E — `_spec.v<N>.md` с обязательной секцией Diff и `_plan.v<N>.md` с обязательной секцией Migration. Step 7 (reviewer) обязателен (но он и так обязателен для всех modes — см. § 11). Spec version exit condition при v3+ (AP-21).

### 3.7. Mode `bug-fix` (variant)

Lite variant of `feature` для bugs. Workflow тот же, но lite-mode разрешён по умолчанию:

- `<topic>_spec.md` с frontmatter `lite-mode: bugfix` (см. CLAUDE.md):
  - Краткая структура: **Context** (что баг, как воспроизвести), **Expected behavior**, **Fix scope**, **Test** (failing test, который должен начать проходить).
  - User stories / Сценарии / NFR могут быть пропущены если не релевантны.
- `<topic>_plan.md` упрощённый: только «Соответствие spec'у» + «Tests plan».
- Step 4: coder сначала пишет **failing test reproducing bug**, потом fix, тест проходит.
- Step 7: reviewer всё равно обязателен, но output может быть terser.

**Исключение — security bugs:** если bug в security path (auth/crypto/PII/payments/sessions) — full ceremony, **no lite-mode**. Security bugs требуют полного review + threat-model-cross-check.

### 3.8. Mode `template-sync`

Bump template version в template-native проекте. **Manual-only** invocation — оператор пишет «обнови template» / «template-sync» / «bump template». AI **не предлагает** sync proactively (respect AP-3 operator-gate).

**Agent-driven routine** (не scripted): LLM holistically сравнивает project с template, опираясь на `doc/template-evolution.md` cheat sheet + CHANGELOG. Per-decision operator approval. Split на logical PR'ы, не один мега-PR.

Полное описание routine — `.claude/agents/project-bootstrap.md` § Template-sync workflow.

**Template-side maintenance discipline:** при добавлении в template breaking change / rename / new artifact / removal — **обновляй `doc/template-evolution.md`** синхронно с CHANGELOG entry. Шпаргалка — navigation map для downstream template-sync; без своевременных updates routine становится partial.

См. release-helper.md для template-side SemVer release process.

### 3.9. Lifecycle continuum

Жизненный цикл проекта — **не одноразовый bootstrap**, а **постоянная последовательность циклов Stage E**:

```
Init bootstrap → first feature → another feature → bug-fix →
                                 → rework existing feature → release →
                                 → template-sync (periodic) →
                                 → new feature wave → ...
```

`project-bootstrap` agent — orchestrator всего жизненного цикла. На каждый новый operator-intent (новая фича / bug / rework / release / template-sync / docs update / architecture overview) он определяет правильное routing.

**Session resume:** если оператор прервал работу в середине фичи (session crashed / next day), на новой сессии `project-bootstrap`:
1. Reads `.ai-pm/.bootstrap-state.md`.
2. Scans `.ai-pm/doc/features/` на in-progress фичи (по frontmatter каждого `_spec.md` / `_plan.md`).
3. Proactively сообщает оператору: «вижу in-progress topic X, state Y, продолжаем?».

См. CLAUDE.md.tmpl «Session start routine» и project-bootstrap.md «Lifecycle routing» для деталей.

### 3.10. Legacy adoption — 3-choice entry

При first session в проекте **без `.ai-pm/`**, project-bootstrap detect'ит legacy и явно представляет оператору **3 варианта** через AskUserQuestion (Quick первым, **recommended**):

**Choice 1: Quick auto** (5-10 min, recommended)
- AI auto-extracts: stack / `ui_kind` / `db_kind` / `tech-stack.md` topology sketch / `ui-style-guide-base.md` extract / `database-design-*.md` extract (Tier 0, см. § 3.11)
- Stage D infrastructure setup (CI hooks Layer 2, git hooks Layer 4, branch protection Layer 5)
- State: `foundation_completeness: minimal`, `adoption_path: legacy-quick`
- Trade-off: «быстрый старт, но первая фича каждого нового domain'а потребует Tier 1 mini-research (10-30 min)»

**Choice 2: Manual staged** (часы-дни)
- AskUserQuestion multi-select: «Какие Stage A-D artifacts адаптировать сейчас?»
- AI extracts baseline + ведёт через formal Stage process для выбранных
- State: `foundation_completeness: partial`/`complete`, `adoption_path: legacy-staged`
- Trade-off: «больше времени upfront, потом standard workflow без per-feature overhead»

**Choice 3: Skip adoption** (sub-minute)
- Только: `trust_profile`, `stack` auto-detected, Stage D hooks
- State: `foundation_completeness: none`, `adoption_path: legacy-skip`
- Trade-off: «zero upfront, AP-14/15/18 enforce'ы limited, каждая фича требует mini-research»

**Hard floor** — что нельзя skip даже в Choice 3:
- Stage D infrastructure hooks (без них AP-16 enforcement soft)
- `trust_profile` (без него agents не знают как общаться)
- `stack` (без него нельзя ai-linting-rules или security catalogue)

Если оператор настаивает на skip даже этих — explicit `adoption_overrides` с reason + accepted-risk (см. AP-22).

### 3.11. Tier framework (для legacy + per-feature)

| Tier | Что | Когда |
|---|---|---|
| **Tier 0 — auto-extract** | AI extracts без вопросов: stack / ui_kind / db_kind / topology / ui-style / database-design | Quick adoption + architecture-overview keyword routing |
| **Tier 1 — mini-research** | Per-feature mini-persona / journey-step / threat-list (5-30 min AskUserQuestion) | При `foundation_completeness: minimal/none` и фича требует context |
| **Tier 2 — promotion** | Operator-initiated consolidation mini-* sections → project-wide artifacts | Когда оператор готов «адаптируй полностью» |
| **Tier 3 — declared overrides** | Operator declares trade-off в `adoption_overrides` с reason + accepted-risk | Когда что-то нельзя/не нужно делать |

### 3.12. Дискриминаторы (если оператор не уверен)

1. Существует `.ai-pm/`? Нет → проект **legacy** → 3-choice entry.
2. Существует `.ai-pm/`, никогда не было кода? → `new-product` (если bootstrap ещё не done).
3. `.ai-pm/` есть, Stage A-D closed, новая работа? Mode по характеру:
   - Меняется поведение/API/схема существующей фичи → `rework`
   - Bug в existing feature → `bug-fix`
   - Template отстал от latest → `template-sync`
   - Иначе → `feature`

---

## 4. Пять stages

| Stage | Что | new-product mode | feature mode | rework mode |
|---|---|---|---|---|
| **A. Discovery** | vision → personas → user-journeys → positioning (включает competitive landscape § 1) → ui-style-guide-base (включает brand voice § 2) | WRITE | READ + WRITE дельт | READ + WRITE дельт |
| **B. Constraints** | strategic-frame, threat-model, mvp-scope, legal (если применимо), customer-interview-script, incident-runbook-draft | WRITE | READ + WRITE дельт | READ + WRITE дельт |
| **C. Process** | tech-stack (включает topology + stack + db_kind references), dev-environment, ai-linting-rules, subagent configs verified, maintenance-playbook (опц.), development-protocol-overlay | WRITE | READ + reuse | READ + reuse |
| **D. Bootstrap** | концретная infrastructure: CI, линтеры, security tools, pre-commit, branch protection (генерируется из catalogue + стек). 1 checkpoint + `bootstrap-verify.sh` health-check | WRITE | SKIP (verify consistency) | SKIP |
| **E. Production** | `.ai-pm/doc/features/<topic>_{spec,plan,review}.md`, код, тесты | WRITE | WRITE | WRITE (с rework spec'/plan-структурой) |

Stage D идёт **после** Stage A-C, не до — потому что infrastructure (какие линтеры включить, какие security rulesets, какой CI workflow) **выводится** из стека + project capabilities, зафиксированных в A/B/D. Создавать infrastructure упреждающе — анти-паттерн § AP-2. ADR-папка стартует **пустой**; первые ADR появляются в Step 2 plan'ов фич (§ AP-1) либо при foundational forks в Stage C `tech-stack.md` choice.

---

## 5. Stage D: Bootstrap в деталях

Когда Stage A-C пройдены и зафиксированы, init-agent делает Stage D.

### 5.1. Что есть на руках к Stage D

- Стек выбран (Stage C).
- Project capabilities выяснены (Stage A-C content): uses-crypto / uses-auth / uses-payments / processes-PII / uses-containers / uses-i18n / multi-tenant / etc.
- Catalogue § 7/8/9/10 фильтруется по этим capabilities — известно, какие категории включаются.
- Recipe-cache (`doc/_recipes/cache/<aspect>-<stack>.md`) либо есть, либо драфтим с оператором.

### 5.2. Что Stage D генерирует

**Code / security / CI infrastructure:**

- `.github/workflows/ci.yml` (или эквивалент CI) — все блокирующие gate'ы (§ 6), без `continue-on-error`. Для feature/rework modes — jobs добавляются в существующий `ci.yml`.
- Конфиги линтеров (eslint / ruff / golangci / clippy / …) — собранные из catalogue § 7 с включёнными категориями.
- Архитектурные конфиги (dependency-cruiser / import-linter / depguard / …) — из catalogue § 8.
- Security rulesets (semgrep, dependency-audit, gitleaks, и т.д.) — из catalogue § 10 с conditional'ами по capabilities.

**Multi-layer enforcement (см. § 5.5):**

- `CLAUDE.md` в product root — Layer 1 (briefing для каждой Claude session). Из `_templates/CLAUDE.md.tmpl`.
- `.claude/settings.json` — Layer 2 (hooks). Из `_templates/settings.json.tmpl`.
- `scripts/check-spec-precondition.sh` — PreToolUse hook (блокирует code edits без spec'а). Реальный скрипт в **product** репозитории, не в submodule (`.ai-pm/tooling/` read-only). Bootstrap-agent на Stage D генерирует из `_templates/scripts/check-spec-precondition.sh.tmpl`.
- `scripts/check-git-safety.sh` — PreToolUse hook (блокирует опасные git операции). Источник — `_templates/scripts/check-git-safety.sh.tmpl`.
- `scripts/update-bootstrap-state.sh` — PostToolUse hook (audit trail). Источник — `_templates/scripts/update-bootstrap-state.sh.tmpl`.
- `scripts/check-spec-discipline.<lang>` — spec/use-case linting (catalogue § 9).
- Git hooks через `scripts/install-git-hooks.sh` — Layer 4 (pre-commit, commit-msg, pre-push). Источник — `_templates/scripts/install-git-hooks.sh.tmpl`.

**Важно:** все скрипты живут в **product** репозитории (`scripts/` или эквивалент по convention'у продукта), не в submodule `.ai-pm/tooling/`. Submodule — read-only, predназначен для шаблонных файлов. Bootstrap-agent на Stage D читает `.tmpl` из submodule, адаптирует под layout продукта (например, `doc_root` из state) и создаёт реальные скрипты в `scripts/`.

**Foundational artifacts:**

- `.ai-pm/doc/architecture-decisions/0000-template.md` (если ещё нет).
- `.ai-pm/doc/features/` (пустая директория с `.gitkeep`).

**Branch protection (Layer 5):**

- Branch protection rules для `main` через `gh api` или эквивалент: require PR, require status checks, no direct push, no force push, require linear history (enforces squash & merge).

### 5.3. Initial-infrastructure commit + первый CI run

После scaffold'а — initial commit на ветке `bootstrap/infrastructure`. PR в `main` через стандартный workflow (см. § 14). CI на этом коммите **должен пройти**, потому что Stage A-C content уже наполнен; если что-то fail'ит — это сигнал неполноты Stage A-C, возврат.

### 5.4. Recipe cache update

Если recipe для стека отсутствовал — драфтился совместно с оператором на Stage C. После успешного Stage D result commit'ится в `doc/_recipes/cache/<aspect>-<stack>.md` для следующих проектов.

### 5.5. Multi-layer enforcement (5 слоёв)

Template enforce'ит протокол через **5 защитных слоёв**:

| Layer | Что | Когда срабатывает | Hard / Soft |
|---|---|---|---|
| 1 | `CLAUDE.md` briefing | Каждый старт Claude session | Soft (Claude может игнорировать, оператор напомнит) |
| 2 | `.claude/settings.json` PreToolUse hooks | Перед Write/Edit/Bash | **Hard** — blocks tool call |
| 3 | Subagent invocation routine | Через CLAUDE.md + explicit `claude --agent <name>` | Soft |
| 4 | Git hooks (pre-commit, commit-msg, pre-push) | На git operations | **Hard** — `--no-verify` запрещён AP-6 |
| 5 | CI gates + branch protection | На PR | **Hardest** — нельзя обойти без admin override'а |

Оператор может проигнорировать Layer 1 и 3 (soft), но 2, 4, 5 — hard блокировки. Layer 5 — branch protection — единственный, который **физически невозможно** обойти без admin override'а.

**Рекомендация соло-оператору:** не отключать hooks даже когда «торопишься». Frustration в моменте < damage от пропущенной security issue или drift'а от plan'а.

### 5.6. Что Stage D **не делает**

- Не пишет код фич (это Stage E).
- Не создаёт `apps/`, `packages/` со скелетом implementation'а. Производственный код появляется только когда есть spec в Stage E.
- Не пишет ADR.
- Не меняет foundational docs из Stage A-C.

---

## 6. CI gates

На Stage D определяется конкретный список (на основе catalogue § 7/8/9/10 + capabilities проекта). **Generic baseline:**

| Gate | Что проверяет | Категория |
|---|---|---|
| Code linter | code style, AI-specific patterns (§ 7) | code |
| Type checker | static types | code |
| Architecture linter | import boundaries, layer constraints, encapsulation (§ 8) | architecture |
| Security scanner | known-bad patterns | code/security |
| Test runner | все тесты проходят | code |
| Per-diff coverage | новый код >= 80% | code |
| Secret scanner | gitleaks или эквивалент | security |
| Dependency audit | known CVE | security |
| Spec discipline | каждая spec ссылается на persona/journey; structure соблюдена (§ 9) | spec |
| Foundational docs filled | personas/journeys/threat-model не placeholder'ы (§ 9) | spec |
| Spec/plan precondition | для rework mode: spec.v<N> и plan.v<N> существуют до commits с кодом | spec |
| Reviewer artifact | для rework mode и security-critical paths: `_review.md` присутствует | spec |

**Все gate'ы блокируют merge.** Никаких `continue-on-error: true`.

---

## 7. AI-specific code linting

Стандартные linter defaults писались под human developers. AI имеет свой «акцент» — catalogue из 17 категорий. На Stage C каждая обязательно замаппена на конкретное правило стека, на Stage D конфиги генерируются.

### 7.1. Catalogue (language-agnostic)

| Категория | Почему AI делает | Что enforce'ить |
|---|---|---|
| Debug-артефакты | Добавляет для «тестирования», забывает удалить | Запрет `console.log`/`print`/`debugger`/`breakpoint()` |
| TODO/FIXME без issue-ref | Откладывает работу, должную быть в scope | Требовать `TODO(#NNN)` формат |
| Закомментированный код | Хеджирует вместо удалить | Запрет блоков комментариев длиннее N строк рядом с кодом |
| Длинные функции / глубокая вложенность | Не рефакторит по мере роста | `complexity ≤ 10`, `max-lines-per-function ≤ 60`, `max-depth ≤ 4` |
| Слишком много параметров | Adds optional args вместо структурирования | `max-params ≤ 5` |
| Magic numbers/strings | Хардкодит тестовые значения | `no-magic-numbers` с whitelist `[0, 1, -1]` |
| Unchecked types / `any` | Escape'ит type system | Запрет `any`, `interface{}`, и т.п. |
| Mutable defaults / bare catch | Языковые gotchas | Запрет mutable default args, bare catch |
| Inconsistent naming | Меняет паттерны в середине файла | Naming convention rule на весь проект |
| Dead code / unused imports | Не убирает после рефакторинга | `no-unused-vars`, dead-code-elimination |
| Floating promises / unhandled async | Не думает про async correctness | `no-floating-promises`, `no-misused-promises` |
| Naïve datetime | `new Date()` без timezone | Запрет конструкторов без timezone arg |
| Sync I/O в async handlers | Смешивает sync/async | `no-sync-in-async`, запрет `fs.*Sync` |
| Relative imports вне workspace | Не уважает module boundary'и | `import/no-relative-packages` |
| Magic comments без объяснения | Заглушает линтер вместо fix'а | Запрет `eslint-disable` без `// reason: …` |
| Hardcoded user-facing strings | Не интернационализирует | Запрет string literals вне i18n-функций |
| Inline secrets / API keys | Test values остаются в коде | gitleaks + custom semgrep |

### 7.2. Stack-specific mapping

В recipe `doc/_recipes/ai-linting-<stack>.md`. На Stage D mapping копируется в проект и записывается в `.ai-pm/doc/ai-linting-rules.md`.

### 7.3. Что делать, если категория не покрыта tooling'ом

Custom rule (semgrep custom, eslint plugin, golangci-lint custom analyzer). Создаётся в `ci/lint-rules/` с fixture-тестами.

---

## 8. Architecture linting

Архитектурные правила **отдельная категория** от code-linting. Это инварианты модуля «откуда что импортирует / что от чего зависит / какие границы пересекаются».

### 8.1. Generic catalogue (language-agnostic)

| Правило | Зачем |
|---|---|
| No circular dependencies | Циркулярные зависимости — признак плохой декомпозиции |
| Layered architecture enforced | Routes → services → repositories → models (или эквивалент); запрет обратных направлений |
| Crypto isolation | Crypto-код не импортируется из UI / API напрямую (только через crypto facade) |
| Plugin boundaries | Core не импортирует impl плагинов, только их protocols |
| Encapsulation via index | Импорты пакета только через `index`, не глубоко внутрь |
| Regional/multi-tenant boundaries | Региональные сервисы не зависят от orchestrator (если применимо) |
| No dead modules | Module не имеет ни одного импортёра → orphan → удалить |
| No god modules | Module имеет > N импортёров → выделить facade или разделить |
| External deps justified | Каждая production dep в `package.json` оправдана usecase'ом |

### 8.2. Stack-specific tools

- **TypeScript:** dependency-cruiser
- **Python:** import-linter
- **Go:** depguard (golangci-lint plugin), go-arch-lint
- **Rust:** cargo-deny, custom clippy lints
- **Java/Kotlin:** ArchUnit

### 8.3. Custom semgrep architecture rules

Для cross-language правил (например, «handlers не возвращают raw bytes», «JWT не содержит PII») — semgrep custom rules в `ci/semgrep-rules/architecture/`.

---

## 9. Spec / use-case linting

**Новая категория линтеров** — проверяет дисциплину foundational docs и feature spec'ов. Реализована как single script в `scripts/check-spec-discipline` (Python или Node, по стеку проекта) — в **product** репозитории, генерируется на Stage D из `_templates/scripts/check-spec-discipline.{sh,py,ts}.tmpl`. Запускается как CI gate.

### 9.1. Catalogue checks

| Check | Что проверяет | Когда fail |
|---|---|---|
| `personas-exist` | `.ai-pm/doc/personas.md` существует, имеет ≥ 1 persona с заполненными required fields | Stage A открыт но personas — placeholder |
| `journeys-reference-personas` | Каждый journey в `user-journeys.md` ссылается на persona, существующую в `personas.md` | Journey ссылается на удалённую persona |
| `mvp-scope-no-orphans` | Каждый F-ID в `mvp-scope.md` либо имеет matching `.ai-pm/doc/features/<topic>_spec.md`, либо помечен `deferred` | F-ID без spec'а и без deferred-маркера |
| `spec-references-persona` | Каждый `<topic>_spec.md` в секции User stories ссылается на ≥ 1 persona по имени из `personas.md` | Spec описывает фичу без указания, для кого |
| `spec-references-journey` | Каждый spec в секции Контекст ссылается на journey-шаг (по convention `journey-X step Y`) | Spec не объясняет, какой шаг journey'я обслуживает |
| `spec-structure` | Каждый spec имеет required sections: Контекст / User stories / Сценарии / NFR / Не в scope / Open questions | Spec без обязательной секции |
| `plan-exists-for-spec` | Если есть `<topic>_spec.md` с operator-approval-маркером, существует и `<topic>_plan.md` | Spec одобрен, plan забыт |
| `plan-scenarios-cover-spec` | Section «Соответствие spec'у» в plan'е перечисляет все scenarios из spec'а | Plan забыл scenario |
| `adr-only-from-plan` | Каждый ADR в `architecture-decisions/` создаётся в commit'е, который также содержит `<topic>_plan.md` (или в Stage C bootstrap commit для foundational ADRs) | ADR появился вне правила § AP-1 |
| `foundational-docs-filled` | Personas/journeys/threat-model/positioning/mvp-scope не содержат placeholder-маркеров `<…>` | Stage A/B не пройдены |
| `bootstrap-state-fresh` | `.bootstrap-state.md` обновлён в течение разумного окна (default 90 дней) | Stage abandoned mid-flow |
| `rework-has-diff-section` | Если spec — `<topic>_spec.v<N>.md` (N > 1), он обязан содержать секцию `## Diff` | rework mode spec без diff |
| `rework-has-migration-section` | Если plan — `<topic>_plan.v<N>.md` (N > 1), он обязан содержать секцию `## Migration` | rework mode plan без migration |
| `spec-impact-fields-present` | Каждый `<topic>_spec.md` (кроме `lite-mode: bugfix`) содержит в frontmatter все 7 impact-полей с явным `yes`/`no`: 3 AP-13 (legal/validation/incident) + 4 AP-14 (journey/threat/scope/topology) | Spec без явных impact-полей — структурный read-pass пропущен (см. AP-14) |
| `pr-ordering-for-multi-domain` | Если spec body содержит indicator'ы ≥ 2 domains (schema / API / UI), frontmatter обязан иметь `pr_ordering: [...]` с явным списком | Multi-domain фича без атомарного split'а (нарушает AP-19) |
| `spec-test-mapping` (v0.2.0+, gap 1) | Каждый Gherkin `Scenario:` из spec'а имеет matching test (case-insensitive substring match в test files: `*_test.{go,py}`, `test_*.py`, `*.{test,spec}.{js,jsx,ts,tsx}`, `*_spec.rb`, `*Test.{java,kt}`, `*Tests.cs`, `*.feature`). Per-stack mapping convention'ы — в `ai-linting-rules.md`. Skip: `lite-mode: bugfix` | Coder agent написал spec scenario но не implement'нул matching test — silent break risk |
| `test-assertion-weakening` *(v0.2.0+, gap 2)* | Detect модифицированные test-файлы в commit'е без `ADR-NNNN` reference или `[test-modify-override: <reason>]` marker. Pure additions и новые test-файлы — пропускаются | AP-23 violation — agent ослабляет существующий assertion под свои выдумки (test было `toBe(100)` → стало `toBeGreaterThan(50)` без declared behaviour change) |
| `regression-coverage-for-shared-modules` (v0.2.0+, gap 3 / AP-14 ext.) | Spec с `topology_impact: yes` обязан содержать секцию `## Regression coverage plan` с shared modules list + existing tests check + new regression tests. Skip: `lite-mode: bugfix`, явная пометка `N/A — standalone` | Shared module modification без regression planning — silent break existing features |
| `adr-auto-extraction` (v0.2.0+, AP-24) | Detect spec sections с keywords `инвариант`/`архитектура`/`trade-off`/`decision`. > 30 LOC → warn (suggest ADR extraction). > 50 LOC без ADR ref в spec'е → fail. Closes AP-1 dead letter pattern observed на live test'е | Architectural decisions buried в spec без ADR — invisible knowledge cost, через 6 месяцев новый dev не найдёт «почему так решили» |
| `adr-spec-reference` (v0.6.0+, AP-25, family `source-bounded`) | Каждый ADR в `architecture-decisions/` (кроме `0000-*` templates) имеет во frontmatter `spec_reference:` (path к source spec'у) + `operator_approved: YYYY-MM-DD` (timestamp operator-touch'а через fork-justification protocol). Override: `[source-bounded-override: <reason>]` в HEAD commit body → fail → warn | ADR создан без traceable source spec'а или без operator-touch — потенциальный hallucination, не подкреплённый ground truth (см. AP-25) |
| `plan-spec-reference` (v0.6.0+, AP-25, family `source-bounded`) | Каждый `<topic>_plan.md` / `_plan.v<N>.md` имеет во frontmatter `spec_reference:` (path к источнику-spec'у). Различение от `plan_approved`: spec_reference про content provenance, plan_approved — про timing operator-touch'а. Override: тот же `[source-bounded-override: <reason>]` marker | Plan создан без traceable spec'а — risk drift'а от утверждённого scope (AP-25) |

### 9.2. Реализация

Script `scripts/check-spec-discipline.{py,ts}` (в product репозитории) парсит `doc/` через markdown AST или regex, выполняет checks из catalogue, выдаёт fail с указанием конкретных нарушений. Bootstrap-agent на Stage D генерирует его из `_templates/scripts/check-spec-discipline.{py,ts}.tmpl`, адаптируя под `doc_root` из state.

### 9.3. Когда что-то fail'ит при первом запуске после Stage D

**Не нормально.** На момент Stage D (когда infrastructure генерируется) Stage A-C **должны быть закрыты**, и foundational docs — наполнены. Если spec/use-case linter fail'ит на initial CI — это сигнал неполноты Stage A-C, возврат к соответствующему stage'у. Это **отличается** от Stage E, где CI fail'ит из-за конкретного нарушения в новом spec/plan/code (нормально, фиксится в PR).

### 9.4. Дополнительный check для security-touching фич

- **`security-spec-cites-standard`** *(conditional: фича трогает auth/crypto/PII/payments/sessions/public endpoint)* — spec обязан в секции `## Security invariants` ссылаться на конкретные пункты OWASP / CWE / ASVS. Без этого spec невалиден.

Это **отдельная от threat-model linkage** проверка. Threat-model говорит, *чего мы боимся*. OWASP/CWE/ASVS говорят, *какими стандартами мы это закрываем*. Должны быть оба.

### 9.5. Source-bounded contract (AP-25, AP-26)

Принцип одной строкой из § 1.5.1 — здесь его detail. Закрывает gap, который остаётся после AP-1 / AP-24 / AP-6 / learning layer'а: **content** drift в AI-produced artifact'ах (не только timing, не только LOC threshold, не только substantive justification).

**Source contract** для каждого AI-агента — explicit list ground truth artifact'ов и определение fork'а — фиксирован в `.claude/agents/<agent>.md` секциях `## Source contract` / `## Fork-justification protocol` / `## Spawn discipline`. Идентичный blueprint в 11 файлах + `CLAUDE.md.tmpl § Source-bounded discipline для orchestrator'а` для main session AI — итого 12 точек drift'а закрыты универсальным contract'ом.

**Универсальный fork-justification protocol** (формат фиксирован — PM-оператор reliable yes/no без code review):

1. **Останавливаюсь.** Не пишу artifact, не реализую расширение.
2. **Формулирую structured proposal** через AskUserQuestion:
   - **Source говорит:** «<точная цитата>» (`<file>:<line-range>`)
   - **Я предлагаю по-другому:** `<что меняется>`
   - **Почему:** `<конкретный аргумент>`
   - **Что выбираем?**
3. **Жду ответ оператора.** Никаких параллельных действий.
4. **Только после ответа** — кодифицирую решение с reference на source + `operator_approved:` timestamp.

**Enforcement** через § 9.1 catalogue: `adr-spec-reference` + `plan-spec-reference` family `source-bounded`. Future-extensible — добавление source-bounded check для new artifact type = новая функция `check_source_bounded_<artifact>` с тем же override marker.

**Override mechanism** для legacy / bootstrap edge cases: `[source-bounded-override: <reason>]` в HEAD commit body downgrade'ит fail → warn. Pattern identical AP-23 (`[test-modify-override:]`) и AP-16 (`[review-override:]`) — оператор знаком с механикой.

**Hard floor** — override не освобождает от fork-justification protocol для security-touching artifact'ов (auth / crypto / PII / payments). Operator-touch обязателен даже при override marker'е, потому что silent security extension критичны.

**Cross-refs:** AP-25 (AI artifact extends beyond source — generic discipline), AP-26 (Orchestrator architectural injection — upstream defence через spawn-discipline), AP-1 (timing companion), AP-24 (LOC threshold companion), AP-6 (silent deviation generic principle).

---

## 10. Security scanning catalogue

Четвёртая категория линтеров (после Code / Architecture / Spec). **Особенно критично для PM-оператора**, который не читает AI-generated код: security-уязвимости должны ловиться tools'ом, а не human review.

Каждая категория **анкорится в стандарт** (OWASP / CWE / NIST / CIS / SLSA), а не в «список хороших идей». Init-agent на Stage D включает соответствующие готовые rulesets (semgrep `p/owasp-top-ten`, CodeQL security queries и т.п.) — не выбирает «10 rules из 1000» вручную.

### 10.1. Catalogue

| # | Категория | Стандарт | Tools (примеры) |
|---|---|---|---|
| 1 | **SAST: OWASP Top 10 (web)** `[универсально]` | OWASP Top 10 2021 | semgrep `p/owasp-top-ten`, CodeQL security queries, Snyk Code |
| 2 | **SAST: CWE Top 25** `[универсально]` | CWE Top 25 | semgrep `p/cwe-top-25`, Snyk Code, GitHub Advanced Security |
| 3 | **Dependency vulnerabilities** `[универсально]` | NIST NVD / GHSA / OSV-DB | pnpm/npm audit, pip-audit, govulncheck, cargo-audit, Dependabot, Snyk |
| 4 | **Secret scanning** `[универсально]` | CWE-798 + entropy | gitleaks, TruffleHog, GitHub Secret Scanning |
| 5 | **SAST: OWASP API Top 10** `[conditional: backend API]` | OWASP API Security Top 10 2023 | semgrep API ruleset, 42Crunch |
| 6 | **SAST: Crypto-specific** `[conditional: uses-crypto]` | CWE-321/322/327/328/329/338, OWASP ASVS V6 | semgrep crypto-pack, bandit B5xx (Py), gosec G401-G505 |
| 7 | **SAST: Auth/Session-specific** `[conditional: uses-auth]` | OWASP ASVS V2/V3/V7 | semgrep auth-pack, custom rules |
| 8 | **License compliance** `[conditional: 3rd-party deps]` | SPDX license list + project policy | license-checker, pip-licenses, cargo-deny, FOSSA |
| 9 | **SBOM generation** `[conditional: published artifacts]` | SPDX / CycloneDX | syft, cyclonedx-cli |
| 10 | **Container scanning** `[conditional: containerized]` | CVE DB + base-image best practices | trivy, grype, Docker Scout |
| 11 | **IaC scanning** `[conditional: IaC в проекте]` | CIS Benchmarks, provider best practices | checkov, tfsec, kubesec, kube-linter |
| 12 | **Supply chain integrity** `[conditional: published artifacts]` | SLSA framework, in-toto, sigstore | cosign, sigstore CLI |
| 13 | **Logging hygiene** `[conditional: processes-PII]` | OWASP ASVS V9, custom no-PII-in-logs | semgrep custom rules + log-sink linters |

### 10.2. Преимущество стандартного якоря

Оператору не нужно держать в голове CWE-321 или OWASP A02. Init-agent активирует ruleset, и:

- Аудит / compliance: можно сказать «мы покрываем OWASP Top 10 + CWE Top 25», это профессиональный язык.
- Обновления стандарта (OWASP Top 10 2025) — автоматически дотягивают через обновление ruleset.
- AI, который пишет код, знает что эти правила активны и **подстраивает поведение** — это самозащита через линтер.

### 10.3. Stage D integration

На Stage D (после того как Stage A-C content готов):

1. Init-agent читает project capabilities из foundational docs (`threat-model.md`: есть auth/crypto/PII? `tech-stack.md`: containers/IaC?).
2. Включает все 4 must-have (#1-4) + conditional подкатегории по capabilities.
3. Из recipe (`doc/_recipes/cache/security-<stack>.md`) берёт concrete tool list + конфиги.
4. Если recipe нет — драфтит mapping с оператором (один раз per стек), committs cache.

---

## 11. Feature workflow (Stage E)

### 11.0. Stage E readiness — что должно быть на руках

Перед началом первой фичи проверить (оператор сам или через bootstrap-агент):

**Foundational артефакты (deliverables Stage A-D):**

- [ ] `vision.md` / `personas.md` / `user-journeys.md` / `positioning.md` / `ui-style-guide-base.md` + `ui-style-guide-<kind>.md` per каждому `ui_kind` (Stage A) — последние обязательны для new-product mode с UI / API; per-kind split по форме UI (web / native-mobile / native-desktop / tui / cli / embedded / backend), см. AP-15
- [ ] `strategic-frame.md` (включая SLO + метод валидации) / `threat-model.md` / `mvp-scope.md` (Stage B)
- [ ] `legal.md` (new-product mode — обязательно; feature/rework modes — условно по AP-13)
- [ ] `customer-interview-script.md` (new-product mode — обязательно; feature/rework modes — условно по AP-13)
- [ ] `incident-runbook-draft.md` (new-product mode с runtime — обязательно; feature/rework modes — условно по AP-13)
- [ ] `tech-stack.md` (включает topology / stack / db references) (Stage C)
- [ ] `development-protocol.md` overlay + `ai-linting-rules.md` (Stage C)

**Infrastructure:**

- [ ] CI workflow готов (`.github/workflows/ci.yml` или эквивалент)
- [ ] `.husky/pre-commit` или эквивалент готов
- [ ] `.claude/settings.json` + hooks активны
- [ ] `CLAUDE.md` адаптирован
- [ ] GitHub repo создан + первый push сделан
- [ ] Branch protection включён на main (require PR / require reviews / no force push)
- [ ] Initial CI run прошёл успешно (даже на пустом репо)

**Bootstrap state file** должен показывать все Stage A-D как `[x]` с датами. Если есть `[ ]` — Stage E не начинается.

---



| Step | Кто | Артефакт | Условие перехода |
|---|---|---|---|
| 0. Структурный read-pass | AI (project-bootstrap) | объявление в чате оператору | Оператор подтвердил список структурных документов на обновление |
| 1. Specification | Оператор (или AI draft → оператор edit) | `<topic>_spec.md` + frontmatter с 7 impact flags | Оператор: «спека ок» + соответствующие docs PR'ы открыты или merged |
| 2. Plan | AI | `<topic>_plan.md` | — |
| 3. Plan review | Оператор | (комменты) | Оператор: «поехали» |
| 4. Implementation | AI | код + тесты | tests-first порядок + операционные docs PR'ы merged (AP-13) |
| 5. CI verification | автоматика | CI gates | все gate'ы pass |
| 6. Acceptance | Оператор | мерч PR | Оператор прошёл scenarios в live-приложении |
| 7. Reviewer | AI subagent | `<topic>_review.md` | обязателен для всех modes (см. ниже + AP-14 structural check) |

**Step 0 (структурный read-pass) — обязателен для каждой Stage E фичи (AP-14).** Перед Step 1 AI читает 4 структурных Stage A-C документа (`user-journeys.md` / `threat-model.md` / `mvp-scope.md` / `tech-stack.md`), определяет impact фичи, объявляет оператору списком ожидаемых обновлений и получает подтверждение. Результат фиксируется в frontmatter spec'и через флаги `journey_impact` / `threat_impact` / `scope_impact` / `topology_impact`. Для каждого `yes` — отдельный docs PR до merge feature spec'а. Подробнее: project-bootstrap.md subagent → «Stage E handoff».

**rework mode специфика:** spec — `<topic>_spec.v<N>.md` с секцией Diff; plan — `<topic>_plan.v<N>.md` с секцией Migration. Step 7 обязателен.

**Step 7 (reviewer) — обязателен для всех modes**, не только rework mode. Причина: оператор (PM, ЦА в v0) не читает код, и без независимого review нет никакой human-level гарантии, что код = plan'у. Reviewer-agent работает в чистом контексте, не знает деталей implementation'а до review, выдаёт `<topic>_review.md` с severity-tagged findings. Оператор читает только review (формализованный markdown), не код.

---

## 12. Subagents

- **project-bootstrap** — orchestrates Stage A-D (content → infrastructure generation) + handoff в Stage E. Mode-aware + integration-mode-aware + trust-profile-aware.
- **planner** — читает spec + foundational docs, пишет plan. Trust-profile-aware (substantive для A, terser для C).
- **coder** — реализует plan; не отклоняется без объявления; tests-first.
- **reviewer** — независимый review (security/architecture + protocol-compliance в одной session). Mandatory all modes. Architectural-context + learning-oriented findings.
- **release-helper** — changelog, version bump (SemVer), release PR. Не делает release сам.

Конфиги — `.claude/agents/<role>.md`.

---

## 13. Error protocol

Когда AI ошибается на любом уровне (CI, operator acceptance, reviewer, production, customer):

1. Воспроизвести (failing test).
2. Понять (какой инвариант нарушен).
3. Исправить (fix code).
4. Усилить (fitness function / test). Если pattern AI-specific — добавить категорию в § 7.1 / § 8.1 / § 9.1 / § 10.1.
5. Документировать (architectural → ADR; процессный → новый anti-pattern).

Цель: **каждый bug оставляет regression-protection после себя**.

---

## 14. Git workflow & versioning

Обязательно для всех проектов по template'у. Эти правила enforce'ятся CI и branch protection rules; никакого manual override'а.

### 14.1. Branch model

- **`main` — святое.** Никаких direct-коммитов в `main`. Никогда. Никто (ни оператор, ни AI, ни release-helper) не коммитит в `main` напрямую.
- **Feature work — в branch'ах** с именем `feature/<topic>`, где `<topic>` совпадает с `<topic>` в `.ai-pm/doc/features/<topic>_spec.md`.
- **Fix branches** — `fix/<topic>` или `fix/<issue-id>`. Доки-only PR — `docs/<topic>`.
- **Release-please / release-helper branches** — управляются автоматически, не трогаем руками.

### 14.2. Pull Request flow

- **Каждое** изменение идёт через PR. Без exception.
- PR description должен содержать: ссылку на spec/plan, summary, test plan (что было ручно проверено в acceptance step).
- **CI gates** (см. § 6) **обязательно** проходят перед merge — все, без `continue-on-error`.
- **Step 7 reviewer-agent** (`<topic>_review.md`) commit'ится в ту же ветку до merge; reviewer findings severity ≥ `blocking` → merge заблокирован.
- **operator acceptance** (Step 6) — оператор прошёл сценарии в running app, отметил `acceptance: ok` в PR.

### 14.3. Merge strategy

- **Squash and merge** — единственная разрешённая стратегия для feature PR.
- Squash commit message: Conventional Commits 1.0 формат (`feat:`, `fix:`, `chore:`, `docs:`, и т.п.) с BREAKING CHANGE отметкой если применимо.
- Squash сохраняет один читаемый commit в `main` per фича; история работы в branch'е остаётся в git до удаления ветки.
- **Не используются:** merge commits (создают шум), rebase merge (теряется flat-history view).

### 14.4. SemVer для releases

- **Semantic Versioning 2.0** для всех публикуемых артефактов (`MAJOR.MINOR.PATCH`).
- `MAJOR` — breaking change в любом publicly observable contract (API, схема данных, CLI args, конфиг-формат).
- `MINOR` — backward-compatible additions.
- `PATCH` — bug fixes без поведенческих изменений.
- Bump происходит **автоматически** через `release-please` (или эквивалент): анализирует conventional commits с момента последнего тэга, определяет уровень bump'а, создаёт release PR с CHANGELOG.

### 14.5. CHANGELOG

- Формат Keep a Changelog 1.1.0.
- Генерируется автоматически из conventional commits.
- Оператор не пишет CHANGELOG руками.

### 14.6. Branch protection enforcement

На Stage D init-agent **обязательно** настраивает branch protection rules для `main`:
- Require PR before merge.
- Require status checks: все CI gates (§ 6).
- Disallow direct push.
- Disallow force push.
- Require linear history (enforces squash, не merge commits).

Если оператор использует GitHub — это настраивается через `gh api` в Stage D. Если другой SCM — overlay указывает эквивалент.

#### Особый случай: приватный репозиторий на бесплатном тарифе GitHub

Серверная branch protection на private repo требует **GitHub Pro / Team / Enterprise**. На free plan API возвращает `403 Upgrade to GitHub Pro or make this repository public to enable this feature`. То же ограничение действует для rulesets API.

**Детекция (init-agent на Stage D):** попробовать `gh api repos/<owner>/<repo>/branches/main/protection`; если ответ `403` с сообщением `Upgrade to GitHub Pro…` — мы в free + private. (Для других SCM — аналогичная проверка по их API; если серверная защита недоступна на текущем тарифе, логика та же.)

В этом случае init-agent **обязан** включить клиентский эквивалент через pre-push git hook (входит в `install-git-hooks.sh` по умолчанию — hard block на push в `main` / `master`). § 14.7 запрещает `--no-verify`-обход.

Минусы клиентской защиты — её **физически возможно** обойти (новый разработчик без hook'ов; намеренный обход). Поэтому для команды > 1 оператора это **не замена** серверной branch protection, а только промежуточное решение. План перехода фиксируется в `.bootstrap-state.md` `Notes` секции:

- Когда добавится платный тариф / public repo / org — переключиться на серверную branch protection через `gh api`. Клиентский pre-push hook **остаётся** как defense-in-depth, не удаляется.
- До перехода — pre-push hook + reviewer-agent + ручная дисциплина.

См. также `bootstrap-state.md` Stage D checklist (пункт «branch protection / pre-push hook»).

### 14.7. Никакого `--no-verify`, `--force` в main, `--amend` чужих коммитов

- Pre-commit hooks никогда не skip'аются через `--no-verify`. Если hook fail'ит — фиксим причину, не обходим.
- `git push --force` в `main` запрещён (branch protection это enforce'ит).
- `git commit --amend` — только в своих локальных коммитах до push'а.

---

## 15. Document hygiene

Foundational docs — living artifacts, но с разной review-cadence:

- **personas / journeys** — quarterly review или после сильного user insight'а.
- **threat-model** — quarterly или после security incident'а.
- **positioning / `ui-style-guide-base.md` § brand voice** — quarterly или после market change.
- **mvp-scope** — monthly review.
- **topology** — при крупных архитектурных изменениях (которые рождают ADR).
- **ADRs** — append-only; existing ADRs не редактируются, только supersede через новый ADR.
- **Feature specs** — once approved + merged, frozen; для крупных изменений — отдельный rework spec (`<topic>_spec.v<N>.md`).

**Изменения foundational docs идут отдельным PR** (branch `docs/<topic>`) с явным «revisit X because Y» в title. Не смешиваются с feature PR'ами.

См. `anti-patterns.md § AP-7`.

---

## 16. Что overlay может добавить, но не отменить

Overlay (`doc/development-protocol.md` в конкретном проекте) **может**:

- Добавить project-specific правила.
- Уточнить generic-правила (например, «property-based — fast-check»).
- Заполнить AI-linting и security mapping для стека (mandatory).
- Перечислить subagent'ы проекта.
- Зафиксировать stack-specific anti-patterns.
- Указать конкретные `gh` или CI команды для branch protection enforcement (§ 14.6).

Overlay **не может**:

- Отменить Specification First, Tests First, operator-gate, ADR-реактивно, operator-never-reads-code.
- Снять блокирующий характер CI gate'ов.
- Пропустить § 7/8/9/10 mapping для своего стека.
- Разрешить direct-commits в `main` или другие стратегии merge кроме squash.
- Снять SemVer / Conventional Commits / branch protection.
- Сделать Step 7 reviewer-agent опциональным.
- Разрешить AI override'нуть оператора technical-аргументом.

Если что-то из generic'а явно мешает — это сигнал обновлять generic, не overlay.
