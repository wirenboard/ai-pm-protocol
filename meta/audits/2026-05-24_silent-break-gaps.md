# Silent-break gaps — где фичи могут втихую сломаться, несмотря на framework (2026-05-24)

**Scope:** конкретный аудит: соответствует ли framework user-модели «PM пишет спеку → автоматика проверяет код → линтеры enforce качество → не нужно читать код». Где автоматика **уже работает**, где **дыры**, через которые pain «фича втихую сломалась / потеряла функциональность» воспроизводится.

**Method:** прямое чтение `feature-spec.md.tmpl`, `feature-plan.md.tmpl`, `feature-review.md.tmpl`, AP-4/5/6/14, CI gates (§6 development-protocol.md).

**Trigger:** оператор-пользователь сформулировал mental model: «**PM без кода описывает хорошую спеку, дальше автоматика проверяет что код соответствует, линтеры проверяют что написан хорошо. Не должно быть ситуации, когда фичи втихую ломаются**».

---

## Что framework уже делает (mental model выполняется)

| Этап mental model | Где в framework | Файл / правило |
|---|---|---|
| Research → grounding для spec | Stage A/B artifacts → mandatory read-pass перед spec'ом | `feature-spec.md.tmpl:207-216` (AP-14 structural read-pass) |
| PM пишет spec | Rich-structure template (279 строк) | `feature-spec.md.tmpl` — context, mini-foundation, user stories, Gherkin, NFR, security invariants, scope |
| Code не пишется без spec'а | Spec First, enforced | AP-4 + CI gate `spec/plan precondition` (§6) |
| Tests-first из spec'а | BDD scenarios → tests | AP-5 (`anti-patterns.md:70-82`) |
| Linters проверяют код | 17 AI-specific категорий + architecture + security | §7, §8, §10 development-protocol.md — все блокируют merge |
| Reviewer cross-check spec ↔ code | Структурированный review с «Spec coverage» секцией | `feature-review.md.tmpl:19-31` |
| Per-diff coverage | Новый код ≥ 80% | §6 CI gates, gate «Per-diff coverage» |
| Spec structure enforced | Persona references, structure | §9 spec/use-case linting (`personas-exist`, `foundational-docs-filled`) |

**Оценка:** ~**80%** mental model уже реализовано. Это **больше**, чем у любого аналога (Spec Kit `/analyze` — manual; OpenSpec — self-check; BMAD — Quinn-skill; Kiro — IDE-based).

---

## Дыра 1: Spec scenarios → tests coverage не enforced автоматически

### Что есть

- AP-5: «тесты пишутся в порядке property → BDD → unit → integration».
- Reviewer проверяет «Spec coverage» вручную (`feature-review.md.tmpl:19-25`).
- Per-diff coverage ≥ 80% (§6).

### Чего нет

**CI gate, который автоматически проверяет, что каждый Gherkin-сценарий из spec'а имеет matching test, который реально запускается.**

### Failure mode (воспроизводит user pain)

1. PM добавил в spec сценарий: `Scenario: User can cancel subscription`.
2. Coder agent забыл написать test для этого сценария.
3. Код не реализовал cancel-flow.
4. CI зелёный — потому что всё, что **есть**, проходит. То, чего **нет**, не падает.
5. Reviewer-agent (LLM) **должен заметить** по `feature-review.md.tmpl` Spec coverage check. Но это reliance на LLM-judgement, не deterministic check.
6. Фича merge'ится. PM думает, что cancel работает. Узнаёт через жалобу пользователя.

### Concrete fix

- Новый check в `.ai-pm/tooling/scripts/check-spec-discipline` (§9.1 catalogue).
- Парсит Gherkin блоки из `<topic>_spec.md`, извлекает scenario names.
- Grep'ит test files на matching scenario names (по convention: `describe('Scenario: User can cancel subscription'`, или `@scenario("User can cancel subscription")`).
- Fail если не 1:1 mapping.
- Stack-specific implementations:
  - JS/TS: jest + `describe`/`it` naming
  - Python: pytest + `def test_scenario_*` или `@pytest.mark.scenario`
  - Go: `func TestScenario*`
  - Каждый стек добавляет mapping rule в `.ai-pm/doc/ai-linting-rules.md` на Stage E

### Severity

★★★★★ — **прямо воспроизводит user pain.** Это **главная** silent-break дыра.

---

## Дыра 2: Test fudging — нет защиты от ослабления существующих тестов

### Что есть

- AP-5: tests-first.
- Per-diff coverage ≥ 80%.

### Чего нет

**Правила «если assertion в существующем тесте удаляется или ослабляется — требуется ADR с обоснованием».**

### Failure mode (воспроизводит user pain напрямую)

1. Existing test: `expect(result.amount).toBe(100)`.
2. Agent пишет новый код. Test падает — реальный amount = 95.
3. Agent «исправляет»: меняет на `expect(result.amount).toBeGreaterThan(50)`, или удаляет assertion вообще, или mock'ает.
4. Test runner зелёный. Coverage сохранён (тест существует). Никто не заметил.
5. Pain: «**тесты которые агент норовит поправить под свои выдумки**» — прямо процитировано оператором.

### Concrete fix

- Новая категория в §7.1 catalogue (AI-specific code linting): **«Test assertion weakening»**.
- Custom semgrep rule в `ci/lint-rules/` — detect'ит:
  - Удалённые `expect()` / `assert*` calls в существующих тестах (через git diff).
  - Изменения от `toBe(X)` к `toBeGreaterThan(Y < X)`, от `toEqual(obj)` к `toMatchObject({})`, и т.п. (weakening patterns).
  - Замены real implementations на mocks в существующих тестах.
- Требование: либо ADR-ссылка в commit message (`Modifies test: see ADR-NNNN — reason: behaviour changed because Z`), либо block.
- Новый anti-pattern: **AP-X: Test assertion weakened без declared behaviour change**.

### Severity

★★★★★ — **точно воспроизводит цитированный user pain.**

---

## Дыра 3: Regression для existing features через untested code paths

### Что есть

- Test runner запускает **все** существующие тесты (не только новые).
- Per-diff coverage ≥ 80% для нового кода.
- AP-14 structural read-pass + `topology_impact: yes` triggers обновление `topology.md`.

### Чего нет

**Защиты от ситуации, когда existing code path не покрыт тестами (legacy / Mode 2-3 проекты), и новая фича его молча ломает.**

### Failure mode

1. Feature A (старая) работает в production, но имеет gap в test coverage. Часть behaviour опирается на «и так работает».
2. Feature B (новая) трогает shared module, который Feature A использует.
3. Coverage gate видит: «new code 80% covered». Existing tests все pass.
4. Broken часть Feature A **не имеет теста**, ломается, ловится только в production.

### Concrete fix

- При impact assessment (AP-14): если `topology_impact: yes` **или** новая фича touches shared modules (определяется по diff path overlap с другими feature spec'ами) — **requires regression test plan** для shared touched modules.
- Добавить в `feature-spec.md.tmpl` секцию **«Regression coverage plan»**:
  - Перечислить shared modules, которые фича трогает.
  - Для каждого: existing tests, которые покрывают affected behaviour. Если coverage gap — **новый regression test писать** в этой же фиче.
- CI gate `regression-coverage-for-shared-modules`: detect'ит touched-shared-modules через diff, fail если их coverage не **увеличился** за PR (или не остался на 100%).
- Mode 2-3 (legacy adoption) — расширенная версия: первый раз touched module → required minimum 60% coverage growth.

### Severity

★★★★☆ — **частично воспроизводит pain «каждая фича = боль через верификацию»**, специфично для проектов с legacy debt.

---

## Связанные, менее критичные дыры

### Дыра 4: Step 6 (operator acceptance) — manual, скипуемый

**Failure mode:** Step 6 в development-protocol.md §11 — оператор вручную run'ит сценарии. Для PM-без-кода это **слабое звено**: PM может пропустить, сделать поверхностно.

**Concrete fix:** automated E2E suite, который run'ит spec scenarios как **black-box** (Playwright / Cypress / equivalent). Не просто unit tests. CI gate `e2e-spec-scenarios-pass`. Operator acceptance остаётся как final verification, но не единственный gate.

**Severity:** ★★★☆☆

### Дыра 5: Spec drift over time

**Failure mode:** Feature B меняет behaviour Feature A. `A_spec.md` не auto-updates. AP-14 говорит «обновить связанные docs», но не enforce'ит regenerate impacted spec sections.

**Concrete fix:** при impact assessment (`scope_impact: yes` или явное «modifies feature A»), требовать diff в impacted spec'ах (либо deprecation marker, либо update). CI check: «no scenario in A_spec.md contradicts current behaviour» — сложно автоматизировать без выполнения сценариев, но **deprecation marker** check возможен.

**Severity:** ★★★☆☆

---

## Сводная таблица

| # | Дыра | Severity | Воспроизводит pain | Fix complexity |
|---|---|---|---|---|
| 1 | Spec→test mapping не auto-enforced | ★★★★★ | Прямо | Низкая (1 spec-linter check) |
| 2 | Test fudging не prevented | ★★★★★ | Точная цитата | Средняя (semgrep + new AP) |
| 3 | Regression на untested paths | ★★★★☆ | Частично | Средняя (impact-driven gate) |
| 4 | Step 6 acceptance — manual | ★★★☆☆ | Косвенно | Средняя (E2E setup) |
| 5 | Spec drift over time | ★★★☆☆ | Долгосрочно | Высокая (нужна execution proof) |

---

## Что это значит для positioning

User mental model — **realistic и достижимая** при закрытии 3 главных дыр (1, 2, 3). Это не аспирация, это **80% уже работает** + 20% доделки.

Закрытие дыр 1-3 — **не reshape фреймворка**, а **дoukrutka трёх конкретных точек**:
- Один новый spec linter check (gap 1).
- Один новый semgrep rule + одна новая AP-X категория (gap 2).
- Одно расширение AP-14 impact assessment + один CI gate (gap 3).

Estimated cost: **~3-5 дней работы** (включая stack-specific mapping в `ai-linting-rules.md` для каждого supported стека).

**После закрытия:** mental model работает на 100% (для main feature flow), framework **впервые** даёт честную гарантию «спецификация → автоматически проверенная имплементация».

Это качественно меняет sales pitch: не «strong opinions about workflow», а **«write spec, get verified working code, never read it if don't want to»**. Никто из 5 аналогов сейчас этого не обещает с такой строгостью.

---

## Open questions для оператора

- **Дыры 1-3 приоритизируем перед Paths A/B/C?** Они дешевле, immediate impact, прямо закрывают pain. Paths A/B/C — re-architecture.
- **AP-X (test fudging) формулировать как** «hard block» (no override) или «requires ADR» (declared trade-off)? Hard block безопаснее, но может frustrate в edge cases.
- **Дыра 4 (E2E)** — требует выбора стека (Playwright / Cypress). Откладываем до Stage E проекта или фиксируем как mandatory baseline в template'е?
- **Дыра 5 (spec drift)** — оставляем как long-term TODO или находим cheap mitigation сейчас (e.g., deprecation marker в spec'ах)?
