# ai-pm-protocol

Универсальный protocol для разработки в связке **соло-оператор + AI-агент**, оформленный как репо-шаблон + init-агент. Оператор — PM (Trust profile A) или developer (Trust profile B/C), ведущий продукт один.

## Кому это и зачем

Два архетипа соло-разработчиков с симметричной болью:

| Сторона | Боль | Что закрывает шаблон |
|---|---|---|
| **PM** (Trust profile A) | «знаю что нужно (продукт / users / business), не могу писать код в темпе/качестве» | AI как личный разработчик + автоматика и ревьюер = команда взаимного ревью |
| **Developer** (Trust profile B/C) | «умею писать код — но как сделать его полезно и удобно для реальных пользователей?» | PM-дисциплина (Stage A discovery → personas, journeys, brand voice; Stage B constraints → SLO, threats; принудительная связка спеки и кода; формализованное ревью) |

**Двунаправленное обучение:** PM осваивает архитектуру через обучающие отчёты ревьюера (см. `reviewer.md`); developer — продуктовое мышление и соседние стеки через Stage A discovery + Stage C `tech-stack.md`. Шаблон — усилитель компетенций, не замена навыков.

**Чем не является:** не методология для команд > 1. Не code generator. Не AI hype. Не vibecoding tool.

## Setup для product repo

Template **не копируется** в продукт — подключается git submodule.

```bash
cd ~/dev/my-product
git submodule add git@github.com:aadegtyarev/ai-pm-protocol.git .ai-pm/tooling
git commit -m "chore: подключён ai-pm-protocol как submodule"
```

После clone'а другие разработчики:

```bash
git clone --recurse-submodules <product-url>
# или, если уже clone'нули без --recurse:
git submodule update --init --recursive
```

Обновление template'а до новой версии:

```bash
cd .ai-pm/tooling && git fetch && git checkout <tag-or-commit>
cd ../.. && git add .ai-pm/tooling && git commit -m "chore: bump ai-pm-protocol до <ver>"
```

### Запуск bootstrap-agent

```bash
cd my-product
claude   # запустит bootstrap-agent при первой сессии
```

Bootstrap-agent **сам** скопирует bootstrap-state skeleton + CLAUDE.md + `.claude/settings.json`; спросит Mode + Trust profile + Advisor preset (детали — в соответствующих разделах ниже); поведёт через Stage A-D.

## Как это работает: пять стадий

Любой продуктовый проект проходит пять стадий — **layered constraints**, где каждая следующая опирается на предыдущую и **не может** начаться, пока предыдущая не закрыта оператором («operator-gate», AP-3). Возврат назад допустим при обнаружении пробела — фиксируется в `.bootstrap-state.md`. AI драфтит, оператор маркирует «ОК / поменять X»; в неоднозначных местах AI задаёт вопросы через `AskUserQuestion`. Оператор владеет **решением**, AI — **исполнением** (оператор не пишет ни кода, ни artifact'ов руками).

| # | Stage | Что закрываем | Ключевые артефакты | new-product | feature/rework |
|---|---|---|---|---|---|
| **A** | Discovery | Кто / для кого / в каких сценариях / как звучим / выглядим | vision, personas, user-journeys, `positioning.md`, `ui-style-guide-base.md` + per-kind | WRITE | READ + дельты |
| **B** | Constraints | Что должно работать (SLO) / не сломаться (threats / legal / incidents) / отрезаем (scope) | strategic-frame, threat-model, `legal.md`, customer-interview-script, incident-runbook-draft, mvp-scope | WRITE | READ + дельты |
| **C** | Process | На чём строим / как храним данные / как ведём разработку | `tech-stack.md`, `database-design-base.md` + per-kind, `dev-environment.md`, `development-protocol-overlay.md`, ai-linting-rules, subagent configs | WRITE | SKIP |
| **D** | Bootstrap | Concrete infrastructure — **выводится** из A/B/C, не упреждающе (AP-2). Checkpoint: `bootstrap-verify.sh passed` | CI workflow, configs линтеров, semgrep, git hooks, branch protection, `Makefile`, `scripts/bootstrap-verify.sh` | WRITE | SKIP (verify) |
| **E** | Production | Реальные фичи. Каждая — микро-цикл `spec → plan → operator-review → tests-first code → CI gates → acceptance → reviewer-agent`. ADR пишутся **реактивно** при архитектурном fork'е (AP-1) | `doc/features/<topic>_{spec,plan,review}.md` + код + тесты | WRITE | WRITE |

**Порядок не произвольный:** A до B (SLO нельзя без понимания user), B до C (стек нельзя без MVP/threats), C до D (infra выводится из стека), D до E (без CI/hooks первая фича лишена защитной сетки). Подробности и composition matrices (`ui_kind` / `db_kind`) — `doc/development-protocol.md` § 4-5.

## Пять режимов

Bootstrap-agent на init спрашивает **режим** — это определяет тип работы. Режимы **не взаимоисключающие во времени**: проект стартует в `new-product`, живёт в `feature` (фича за фичей), периодически уходит в `rework` / `bug-fix` / `template-sync`. Mode фиксируется per-feature во frontmatter `<topic>_spec.md`.

| Mode | Когда | Особенности |
|---|---|---|
| `new-product` | Greenfield: нет кода / docs | Полный путь Stage A→E с нуля, потом feature work |
| `feature` | Новая фича (template-native или после legacy adoption) | READ-pass по Stage A-C (или mini-research при incomplete foundation), потом Stage E |
| `rework` | Переписываем фичу — поведение меняется | `_spec.v<N>.md` с **Diff** + `_plan.v<N>.md` с **Migration** |
| `bug-fix` | Lite вариация feature для багфикса | Failing test first, terser ceremony. **Security bugs — full ceremony, no lite-mode** |
| `template-sync` | Bump template version | Diff vs latest, apply safe auto, flag manual review → `chore/template-sync-v0.X.Y` PR |

**Иерархия lite-mode:** `bugfix` (bugs) → `small-fix` (мелкая дельта без bug) → `c-fast` (Trust profile C + small + non-security). См. `coder.md`.

**Жизненный цикл:** project-bootstrap agent ведёт через все режимы по мере смены намерения оператора. Восстановление сессии — bootstrap читает `.bootstrap-state.md` и сканирует `doc/features/` на темы в работе.

## Legacy adoption — для проектов без `.ai-pm/`

Что если legacy продукт (код работает, шаблона не было)? При первой сессии AI определяет legacy и предлагает **3 варианта** с trade-off:

| Choice | Time | Что делает | Trade-off |
|---|---|---|---|
| **Quick auto** (recommended) | 5-10 min | Tier 0 auto-extract: stack / `ui_kind` / `db_kind` / topology / ui-style / database-design + Stage D hooks | Первая фича каждого нового domain'а требует Tier 1 mini-research (10-30 min) |
| **Manual staged** | часы-дни | Operator multi-selects какие Stage A-D artifacts адаптировать сейчас; AI ведёт через formal process | Больше времени upfront, потом standard workflow без per-feature overhead |
| **Skip adoption** | sub-minute | Только `trust_profile` + `stack` auto-detected + Stage D hooks (hard floor) | AP-14/15/18 enforce'ы limited, каждая фича — mini-research |

После adoption проект становится **template-native** (с possibly incomplete foundation), использует стандартные 5 modes. **Foundation completeness** растёт incrementally: `minimal` → `partial` → `complete` через operator-initiated promotion.

**Tier framework** (Tier 0 auto-extract / 1 mini-research / 2 promotion / 3 declared overrides) — `doc/development-protocol.md` § 3.

## Какие механики защищают качество

Шаблон **не полагается на code review человека** — это противоречит основному тезису (оператор при Trust profile A не читает код). Защита через **автоматические fitness functions** + **независимый AI-ревьюер** + **5-слойный enforcement**.

### 4 категории fitness functions

Все 4 каталога живут в шаблоне и адаптируются под стек продукта на Stage D. **Условные наборы правил:** каталог фильтруется по capabilities из `.bootstrap-state.md` (продукт без crypto → не включаем CWE-321; без public web → не включаем CSP rules).

| Категория | Source | Что enforce |
|---|---|---|
| **Code linting** | Per-stack mapping (ESLint / ruff / golangci / clippy) + AI каталог | Anti-cargo-cult, dead code, long functions, magic numbers, недокументированные suppressions |
| **Architecture linting** | dependency-cruiser / import-linter / depguard + semgrep | Module boundaries, layered architecture, no-cyclic-deps, crypto / PII isolation |
| **Spec / use-case linting** | `scripts/check-spec-discipline.sh` (14 checks) | spec-test-mapping, test-assertion-weakening (AP-23), regression-coverage (AP-14), adr-auto-extraction (AP-24), pr-ordering (AP-19) и др. |
| **Security scanning** | semgrep `p/owasp-top-ten`, gitleaks, codeQL, dependency-audit | Crypto failures (CWE-321/522), injection (CWE-89/79), secrets, vulnerable deps. Опирается на OWASP / CWE / NIST / CIS / SLSA |

### Локальное ревью до PR (AP-16)

Главная защита от расхождения spec↔code — **независимый reviewer**, не код-ревью человеком. Цикл «открыть PR → ждать комментариев → fix → ждать» устранён изначально: reviewer запускается локально в той же сессии, что и coder, **до** `gh pr create`. Никакой зависимости от GitHub/GitLab API — hook читает только локальные файлы, работает одинаково в любых условиях.

1. Coder завершает Step 4 → reviewer **обязательно** запускается локально **до** `gh pr create`
2. Reviewer пишет `<topic>_review.md` (или `.ai-pm/.reviews/<branch>.json` для chore/docs) с **verdict-gate** в первых 50 строках: `**Verdict:** approve | approve-with-comments | request-changes`
3. Layer 2 hook `scripts/check-pr-has-review.sh` блокирует `gh pr create` / `gh pr merge` если trail отсутствует **или** verdict = `request-changes`
4. Обойти блок можно только через явный override-маркер в commit body (см. § Override-механики)

См. AP-16 в `doc/anti-patterns.md`.

### Специализированные ревьюеры + primary router (AP-19 + AP-20)

Подход «один агент читает всё» — раздутый prompt. Подход «всегда запускать 5 специализированных» — накладные расходы × 5. Шаблон использует **умный роутер**:

- **Primary reviewer** определяет PR domain (Conventional Commits scope + paths)
- **Запускается всегда:** `protocol-compliance-reviewer` (spec↔plan↔code, frontmatter, AP discipline)
- **Плюс ОДИН domain:** `backend-reviewer` / `frontend-reviewer` / `design-reviewer` / `database-reviewer`

**В худшем случае — 2 запуска на атомарный PR** (vs наивные 5). PR'ы с несколькими domain'ами помечаются `request-changes` с рекомендацией «split per AP-19 atomicity» — каждый PR должен затрагивать **один** domain.

### Composition matrices (`ui_kind` / `db_kind`)

Реальные продукты редко одной формы: backend + web, mobile + центральный API, CLI + серверная часть. Многозначные capabilities:

- **`ui_kind`** — `web` / `native-mobile` / `native-desktop` / `tui` / `cli` / `embedded` / `backend`. Для каждого — `ui-style-guide-<kind>.md` (latency SLO для backend, WCAG для web, touch targets для mobile)
- **`db_kind`** — `embedded` (SQLite/IndexedDB) / `external` (PostgreSQL/MySQL) / `none`. Для каждого — `database-design-<kind>.md` (lock-aware migrations, identifier strategy)

Пример: `ui_kind: web, backend` + `db_kind: external` → пишутся `ui-style-guide-{base,web,backend}.md` + `database-design-{base,external}.md`. AP-15 / AP-18 обеспечивают их наличие до feature work.

### Trust profile A / B / C

`trust_profile` определяет output template subagents:

| Profile | Кто | Output |
|---|---|---|
| **A** | PM, не читает код | **Многословный** + обучающий слой (нетривиальные архитектурные принципы объясняются по месту) |
| **B** | Cross-stack senior dev | **Смешанный** — многословный для вне-domain'а, лаконичнее для родного стека |
| **C** | Full-stack pro | **Лаконичный** — без обучающего слоя, перекрёстные ссылки на ADRs. Плюс `lite-mode: c-fast` |

**Жёсткий минимум** для всех: security-чувствительный путь (auth / crypto / PII / payments) — полная церемония, lite-mode игнорируется.

## Multi-layer enforcement (5 слоёв)

Шаблон обеспечивает протокол через 5 защитных слоёв (см. `doc/development-protocol.md` § 5.5):

| Layer | Что | Hard / Soft |
|---|---|---|
| 1 | `CLAUDE.md` briefing — каждая Claude session читает | Soft |
| 2 | `.claude/settings.json` PreToolUse hooks — блокируют Write/Edit/Bash | **Hard** |
| 3 | Subagent routine (planner, coder, reviewer, …) | Soft |
| 4 | Git hooks (pre-commit, commit-msg, pre-push) | **Hard** |
| 5 | CI gates + branch protection | **Hardest** |

Слои 2, 4, 5 **физически блокируют** нарушения (например, попытку Write в `apps/` без spec'а). Оператор может игнорировать Layer 1 briefing, но Layer 2 hook не пропустит вызов инструмента.

## Skip ненужного шага — advisor-driven flow

Шаблон строгий, но без лишней бюрократии — если артефакт не нужен (нет фронтенда → `ui-style-guide-*` не требуется; нет PII / auth / crypto / payments → `threat-model.md` overkill), он пропускается через advisor:

1. `discipline-advisor` сканирует стек на ключевых триггерах (bootstrap entry, каждый Stage E step), определяет capabilities (`stripe` SDK → payments=yes; `bcrypt` → auth=yes; `aes-gcm` → crypto=yes; и т.д.)
2. Возвращает: `mandatory: [...]` / `recommended: [...]` / `skip_safe: [...]` с reason'ом per артефакт
3. `project-bootstrap` (или `planner`) спрашивает оператора через `AskUserQuestion`:

   > **«`threat-model.md` можно skip — auth / crypto / PII / payments в стеке не найдены. Skip?»** `[Skip]` `[Keep]`

4. Оператор тыкает `Skip` → AI делает всю техническую работу сам: запись в `skip_decisions: []` в `.ai-pm/.bootstrap-state.md` с reason + `next_reprompt: +90d`
5. Reviewer понижает severity проверок для пропущенного артефакта с тегом «skip accepted per advisor recommendation»
6. Через 90 дней advisor напомнит: «пересмотри skip — ситуация изменилась?» Это **layer-climbing escalation** — защита от permanent skip навсегда

**AI не решает сам** — advisor только рекомендует, тык оператора — единственный способ skip засчитать (AP-3 operator-gate). **Жёсткий минимум irreducible:** если детектор поймал `stripe.charges.create` / `bcrypt` / `aes-gcm` / public endpoint без auth — advisor возвращает `mandatory: [...]` без opt-out.

### Другие механики

- **Legacy adoption** — declared trade-off через `adoption_overrides:` в state file (Tier 3, operator-initiated с `reason` + `accepted-risk`). См. AP-22.
- **PR-time escape hatches** — commit-маркеры `[review-override:]` / `[skip-review]` / `[test-modify-override:]` / `[rework-version-override:]` для специфических случаев (reviewer flagged → deferred; typo / dep bump; контракт изменился; rework v4). См. AP-16 / AP-21 / AP-23.

## Структура репо

```
ai-pm-protocol/
├── README.md, CHANGELOG.md, LICENSE
├── doc/
│   ├── development-protocol.md   ← generic protocol (копируется в продукт как overlay)
│   ├── anti-patterns.md          ← AP-1..AP-22
│   ├── personas.md, user-journeys.md   ← Stage A артефакты самого template'а
│   ├── _templates/               ← skeleton'ы (копируются в продукт): feature-spec/plan/review,
│   │                               ui-style-guide-* per-kind, database-design-* per-kind,
│   │                               bootstrap-state, CLAUDE.md, settings.json, scripts/
│   └── _recipes/cache/           ← stack-specific recipe cache (ESLint / ruff / etc.)
├── .claude/agents/               ← все subagents (см. § Subagents)
└── .githooks/                    ← pre-push hard-block direct push в main (для contributors)
```

В продукте создаётся `.ai-pm/` (committed: `.bootstrap-state.md`, `version`; submodule: `tooling/`) + top-level `doc/` (для new-product) или `.ai-pm/doc/` (для feature/rework с existing `doc/`). Детали layout'а — `doc/development-protocol.md` § 2.

## Anti-patterns

AP-1..AP-22 — см. `doc/anti-patterns.md`. Ключевые: AP-1 (proactive ADR), AP-2 (premature Stage D), AP-3 (operator-gate между стадиями), AP-14 (структурный read-pass), AP-15 (UI без `ui-style-guide-*`), AP-16 (локальное ревью до PR), AP-18 (safe migrations expand-contract), AP-19 (per-PR atomicity), AP-20 (наивный reviewer fan-out), AP-22 (adoption-override discipline).

## Subagents

В `.claude/agents/`. В худшем случае — 2 запуска на атомарный PR (`protocol-compliance` + 1 domain). См. AP-19 + AP-20.

| Agent | Роль |
|---|---|
| `project-bootstrap` | Stage A-D setup + resume + lifecycle routing |
| `planner` | Step 2 plan writer. Read-only по коду. Trust-profile-aware |
| `coder` | Step 4 implementation. Tests-first. Иерархия lite-mode |
| `reviewer` | Step 7 primary router. Определяет PR domain → запускает protocol-compliance + ОДИН domain |
| `protocol-compliance-reviewer` | Запускается всегда. Spec↔plan↔code, frontmatter, AP discipline |
| `backend-reviewer` | API contracts, idempotency, RFC 7807, latency SLO |
| `frontend-reviewer` | Tokens, accessibility per-kind, frameworks-first, i18n |
| `design-reviewer` | 8 принципов, brand voice, эффективность пути |
| `database-reviewer` | Schema, expand-contract migrations, indexing, identifier strategy |
| `discipline-advisor` | Read-only 5-axis quality challenger. Opt-in пока PoC accuracy gate ≥80% per axis не валидирован |
| `release-helper` | Release PR при накоплении merged feature-PRs. SemVer + CHANGELOG |

## Contributing

Если ты вносишь изменения **в сам шаблон** — после клона активируй внутренние git hooks:

```bash
git config core.hooksPath .githooks
```

Это включит pre-push hard-block на прямой push в `main` (`development-protocol.md` § 14.6). Без этого `.githooks/pre-push` лежит в репке, но git его не видит. Активация идемпотентна и нужна один раз на клон.

Все изменения в шаблоне идут через PR в `feature/<topic>`, `docs/<topic>` или `chore/<topic>` ветки. Прямой push в `main` запрещён § 14.

## Лицензия

**AGPL v3** — см. `LICENSE`. Коммерческое использование разрешено; модификации (включая SaaS-deployment) должны возвращаться в open source под той же лицензией.

SPDX-License-Identifier: `AGPL-3.0-only`
