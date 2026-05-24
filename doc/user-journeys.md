# User Journeys — ai-pm-protocol

**Stage A artifact.** Что делает PM по шагам, проходя через template. Журнализированы по **mode'у** (`new-product` / `feature` / `rework`); внутри каждого journey — секция «Friction per persona», где отмечены различия для Persona A/B/C (см. `.ai-pm/doc/personas.md`).

Без UI-деталей; только последовательность точек принятия решения и эмоциональный регистр.

---

## Journey 1: Mode `new-product` — от пустого репо до первой фичи

**Контекст входа.** PM (любой из 3 personas) начинает новый продукт. Нет ни строки кода, нет foundational docs.

### Шаги

| Шаг | Что делает | Что чувствует |
|---|---|---|
| 1 | Узнаёт про ai-pm-protocol (Twitter, рекомендация коллеги, OSS поиск) | Любопытство, скепсис |
| 2 | Читает README template'а (30 сек — 2 мин) | Решает: имеет смысл попробовать или нет |
| 3 | Клонирует/устанавливает template в новый репо проекта | Деловой режим |
| 4 | Запускает `claude` в новом репо; bootstrap-agent активируется | Ожидание |
| 5 | Bootstrap-agent: «Mode? `new-product` / `feature` / `rework`» (через AskUserQuestion) | Понимает, что сейчас сам выбирает направление |
| 6 | Bootstrap-agent: «Integration mode? gitignore / submodule / vendor» (default gitignore) | — |
| 7 | Bootstrap-agent создаёт `.ai-pm/doc/` skeleton с placeholder'ами | Втягивается |
| 8 | **Stage A — Discovery.** Bootstrap-agent проходит: vision → personas → user-journeys → competitive-analysis → positioning → brand-voice. По 2-3 вопроса per artifact, draft → PM-marker → ОК | Растёт ощущение «эта штука думает за меня правильно» |
| 9 | Закрывает Stage A. **Сессия 1 done** (60-90 минут). | Усталость + удовлетворённость |
| 10 | **Stage B — Constraints.** strategic-frame → threat-model → mvp-scope. Сессия 2 (60-90 минут). | — |
| 11 | **Stage C — Solution shape.** topology + опционально 1-2 foundational ADR (если есть реальные forks). | — |
| 12 | **Stage D — Process.** Выбор стека, проектные capabilities (uses-crypto? uses-auth? uses-i18n?), draft AI-linting + security rules mapping. | Зависит от persona (см. friction ниже) |
| 13 | **Stage E — Bootstrap.** Bootstrap-agent генерирует CI workflow, конфиги линтеров, security tools, pre-commit, branch protection rules — всё из catalogue + стек. | Радость: «я ничего не настраивал руками» |
| 14 | Initial CI run проходит (foundational docs готовы). | Validation |
| 15 | **Stage F — Production.** Первая `<topic>_spec.md`. Бутстрап завершён. | Standard mode |

### Friction points per persona

**Persona A (lightly-technical, не читает код):**
- Шаги 6, 12: developer-specific термины (integration mode, capabilities) могут потребовать дополнительных объяснений. Bootstrap-agent должен пояснять на уровне «что это значит для тебя как PM», не на уровне «как это работает».
- Шаг 14: если CI fail'ит на чём-то, что Persona A не понимает (например, semgrep вылавливает паттерн в стеке, который Persona A не знает) — нужно понятное error message, не stack trace.
- Шаг 15: spec template требует Security invariants для security-touching фич. Persona A нужны guided questions от bootstrap-agent'а («твоя фича трогает auth? PII? Crypto?»), чтобы не пропустить.

**Persona B (cross-stack senior):**
- Шаги 8-11: проходит быстро, потому что понимает зачем нужны personas / threat-model / topology. Может frustration'иться, если agent over-explain'ит.
- Шаг 12: выбор стека прост в родном — proблематичен в чужом. Bootstrap-agent должен предложить recipe per stack или draft'ить с PM с extra guidance в out-of-domain.
- Шаг 14: security-related fails в out-of-domain stack'е воспринимаются как critical — Persona B доверяет template'у больше, чем себе в этом контексте.

**Persona C (full-stack pro, читает всё):**
- Шаги 5-7: возможно раздражение от questions, которые «слишком elementary». Bootstrap-agent должен предлагать «advanced mode» с меньшим hand-holding'ом.
- Шаг 8-11: skipping темпа — Persona C хочет минимум вопросов per artifact (1-2, не 3).
- Шаг 15: проходит spec ceremony с лёгкой усталостью; в идеале — может tag'нуть фичу «lite-mode» для small changes (см. open question в personas.md).

### Критические точки оттока (cross-persona)

- Шаг 2: если README пафосный или абстрактный — закроет все personas.
- Шаги 8-11: если Stage A суммарно > 90 минут одна сессия → flow ломается. Spaced sessions через `.bootstrap-state.md` — критичный механизм.
- Шаг 14: если initial CI fail'ит без понятной diagnostics → frustration для всех, но особенно Persona A.
- Любой шаг: если agent задаёт > 3 вопроса per artifact → cognitive load, drop-off.

### Что должно быть выполнено к концу journey'я

- Все Stage A-D artifacts заполнены в `.ai-pm/doc/`, отмечены `[x]` в `.bootstrap-state.md`.
- `.ai-pm/tooling/` подключено по выбранному integration mode (gitignore + symlink / submodule / vendor).
- В существующем `ci.yml` добавлены `ai-pm:*` jobs.
- Branch protection rules для `main` настроены.
- Repo готов к первой `<topic>_spec.md` в Stage F.

---

## Journey 2: Mode `feature` — добавление фичи в существующий проект

**Контекст входа.** Существующий продукт со своим repo, package.json/pyproject.toml/etc., своим CI, своим `doc/` (если есть). PM решает adopt'ить protocol для будущих фич, не переписывая прошлое.

### Шаги

| Шаг | Что делает | Что чувствует |
|---|---|---|
| 1 | Открывает template'а README, видит секцию modes | Узнаёт себя в Mode 2 |
| 2 | Решает: НЕ клонировать template целиком в проект, использовать через `.ai-pm/` namespace | Прагматизм |
| 3 | Создаёт `.ai-pm/` в existing repo, активирует bootstrap-agent | — |
| 4 | Agent: «Mode? Integration?» — отвечает feature + gitignore | Деловой режим |
| 5 | Agent сканит репу: пытается определить стек по `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml`. Сообщает результат | Любопытство |
| 6 | Agent: «У тебя нет `.ai-pm/doc/personas.md`. Stage A не пройден. Хочешь quick-draft (1 persona + 1 journey, 5-10 минут) или full Stage A (60-90 минут)?» | Дилемма time-cost vs full discipline |
| 7 | PM соглашается на quick-draft или full. Bootstrap-agent проходит соответствующий путь. | — |
| 8 | Agent: «Stage B / C: есть ли существующие threat-model / topology / ADR в проекте?» PM указывает или говорит «нет, надо draft'ить» | — |
| 9 | Agent сравнивает существующий стек с recipe в `_recipes/cache/`. Если recipe нет — драфтит mapping с PM. | — |
| 10 | Stage E (упрощённый): не генерирует новый CI from scratch, а **дополняет** существующий `ci.yml` jobs'ами `ai-pm:*`. Линтеры, которые user уже имеет — отмечает «covered, skip». Добавляет только missing категории. | Облегчение: incremental adoption |
| 11 | Stage F: PM пишет первую `<topic>_spec.md` в `.ai-pm/doc/features/`, дальше standard workflow. | Standard |
| 12 | После 2-3 фич: возможно возвращается дополнить foundational docs (full Stage A после quick-draft'а). | Растёт ощущение control'а |

### Friction points per persona

**Persona A:** уже описан в personas.md как primary user template'а; в Mode 2 — реже встречается (Persona A обычно строит новые продукты с нуля).

**Persona B (cross-stack senior):**
- Шаг 5: agent определяет стек автоматически — критично для Persona B в out-of-domain контексте.
- Шаг 9: если recipe нет для нужного стека — Persona B может draft'ить его, но это extra cost; recipe-cache в template'е очень helpful.

**Persona C (full-stack pro):**
- Шаг 6: quick-draft — exactly то, что нужно. Не хочет писать full Stage A для существующего проекта.
- Шаг 10: incremental adoption — minimal disruption. Если template требует переписать существующий ci.yml — Persona C просто не adoptит template.

### Критические точки оттока

- Шаг 2: если template не поддерживает `.ai-pm/`-namespace adoption (все personas пострадают).
- Шаг 6: если только full Stage A доступен — отвалится; quick-draft необходим.
- Шаг 9: если recipe устарел или для стека нет — friction для Persona B (она ожидала готовый mapping).
- Шаг 10: если template переписывает существующий ci.yml — отвалится сразу.

---

## Journey 3: Mode `rework` — переработка существующей фичи

**Контекст входа.** Существующий продукт с написанной фичей. Поведение / API / схема меняется (breaking change или significant rework). PM хочет, чтобы AI сделал rework без накапливания технического долга.

### Шаги

| Шаг | Что делает | Что чувствует |
|---|---|---|
| 1 | Identifying фичу для rework, говорит bootstrap-agent'у: «mode rework, topic `<topic>`» | Готовность к работе |
| 2 | Agent читает существующие `<topic>_spec.md`, `_plan.md`, код, тесты. Даёт PM summary: «Текущее поведение — X. Текущий plan — Y. Что меняется?» | — |
| 3 | Agent ведёт через Stage A-C read-pass (как Mode 2), плюс задаёт: «Rework меняет persona / journey / threats / mvp-positioning?» | — |
| 4 | Draft'ит `<topic>_spec.v<N>.md` с обязательной секцией **Diff**: «было / становится / мигрирует / deprecated / breaking yes-no» | — |
| 5 | PM ревьюит spec.v<N>, маркирует ОК | — |
| 6 | Draft'ит `<topic>_plan.v<N>.md` с обязательной секцией **Migration**: backward compatibility / data migration / deprecation timeline / rollback strategy | — |
| 7 | PM ревьюит plan.v<N>, маркирует «поехали» | — |
| 8 | Implementation в branch `feature/<topic>-rework` | Standard implementation |
| 9 | CI: spec discipline, code linting, **mandatory `<topic>_review.v<N>.md`** (Step 7 не опциональный в Mode 3) | — |
| 10 | PM acceptance: проходит сценарии в running app, сравнивает с поведением до rework'а | Sanity check |
| 11 | PR с squash & merge в main | — |

### Friction points per persona

**Все personas:** обязательность reviewer-agent в Mode 3 — это **разумная** цена за migration risk. Friction только если reviewer findings противоречивы и блокируют (что нормально, надо разрешить, не bypass'ить).

**Persona A (не читает код):** для неё Mode 3 особенно стрессовый, потому что migration-related ошибки PM не поймает inspection'ом. **Полагается на тесты + reviewer + acceptance**. Spec.v<N> Diff-секция должна быть исчерпывающей.

**Persona B (cross-stack):** если rework в родном стеке — comfortable; в чужом — boost'и reviewer-агенту, аналогично Mode 1.

**Persona C (full-stack pro):** ревьюит и spec.v<N> diff и migration plan, и затем код. Reviewer-agent — secondary check. Может frustration'иться, если reviewer выдаёт обширные findings для мелкого rework'а (см. open question про lite-mode).

### Критические точки оттока

- Шаг 4: если Diff-секция не enforce'ится spec-linter'ом — rework просто становится «обычный spec», migration risk не учитывается.
- Шаг 6: если Migration-секция тоже не enforce'ится — backward-compat проблемы попадут в prod.
- Шаг 9: если reviewer-agent не обязателен — нет защиты от regression'ов.

---

## Cross-journey общие паттерны

Все 3 journeys ломаются, если:

1. **Bootstrap не recover'ится через сессии.** `.bootstrap-state.md` должен поддерживать spaced sessions; agent при каждом запуске первым делом читает state и говорит «мы на Stage X, продолжаем?».
2. **Agent задаёт > 3 вопроса per artifact.** Cognitive load → drop-off для всех personas (особенно Persona C).
3. **Artifacts разрастаются.** Каждый > 2 страниц — риск для Persona A и Persona C. Persona B толерантнее, но и она бросит на 5+ страницах.
4. **Линтеры fail'ят без понятной diagnostics.** Universal kill switch.
5. **Template требует переписать существующий repo.** Особенно критично для Mode 2/3.
6. **CI gates не блокируют реальные риски** (например, миграция без rollback strategy не fails'ит). Подрывает доверие.

---

## Что эти journeys должны проверять

- **Каждая фича template'а** должна проходить через эти 3 journeys как acceptance tests. Если фича делает journey хуже (больше шагов, больше friction, больше времени) — она режется или переделывается.
- **Главная метрика успеха v0:**
  - Mode 1 (new-product): PM добирается до Stage F за ≤ 4 рабочих сессий.
  - Mode 2 (feature): первая фича в existing repo через template за ≤ 2 сессии.
  - Mode 3 (rework): rework spec + plan + acceptance за ≤ 3 сессии.

---

## Resolved decisions

1. **Quick-draft Stage A для Mode 2** — отличается от full так:
   - **1 persona** (главный/типичный user, без cross-persona analysis).
   - **1 journey** (главный happy path, без edge cases / cross-journey).
   - **mvp-scope: один абзац** «что в проекте есть, что нет» без F-IDs.
   - **threat-model: один абзац** «главные угрозы и mitigations» без T-IDs.
   - Остальные foundational docs (positioning / brand-voice / strategic-frame / competitive-analysis) — **optional**, можно skip с маркером «not applicable for retrofit».
   - Spec-discipline линтеры check'ают только наличие, не depth (e.g., `personas-exist` passes если файл не placeholder; `nfr-completeness` опционально).
   - PM может «promote» quick-draft в full Stage A позже (отдельным PR).

2. **Lite-mode для small changes** — resolved в personas.md (PM self-declares через `## Lite-mode: yes` в spec).

3. **Spaced sessions: формат `.bootstrap-state.md`** — **markdown с обязательным frontmatter**:

   ```markdown
   ---
   mode: new-product | feature | rework | bug-fix | template-sync
   integration: gitignore | submodule | vendor
   trust_profile: A | B | C
   started: YYYY-MM-DD
   last_update: YYYY-MM-DD
   template_version: v0.1
   stack: typescript | python | go | rust | ...
   ---

   # Bootstrap state

   ## Stage A
   - [x] vision (YYYY-MM-DD)
   - [x] personas (YYYY-MM-DD)
   - [ ] user-journeys (in progress)
   - ...

   ## Stage B / C / D / E
   ...

   ## Notes
   - Возвраты / dependencies / quirks per session.
   ```

   Frontmatter — для agent'а (быстрый programmatic read). Markdown checklist — для PM (human-readable progress). Update'ы через `update-bootstrap-state.sh` hook.

4. **Recipe staleness** — frontmatter в recipe файле имеет `last_reviewed: YYYY-MM-DD` и `stack_versions:` block. Bootstrap-agent на Stage E:
   - Reads frontmatter.
   - Сравнивает `last_reviewed` с текущей датой; если > 180 дней — warn.
   - Сравнивает `stack_versions` с обнаруженными в проекте (через `package.json`/`pyproject.toml`); если major mismatch — warn.
   - Warn → PM решает: использовать as-is / refresh recipe (draft с PM) / skip.
