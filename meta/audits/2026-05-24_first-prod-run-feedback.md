# First prod-run feedback — фреймворк на реальном проекте (2026-05-24)

**Scope:** анализ первого live test'а ai-pm-protocol на реальном downstream продукте после ~3 дней работы. Что хорошо, что плохо, что слишком сложно, что validate из теоретических audit'ов.

**Method:** прямое чтение foundational docs + first feature spec, cross-reference findings против `competitive-landscape.md`, `complexity-honesty.md`, `silent-break-gaps.md`, `critique-and-blindspots.md`.

**Sanitization:** оригинал содержал product-specific детали (имена, persona/threat/journey IDs, архитектурные invariants) — здесь только general framework lessons. Оригинал хранится в downstream repo'е (private).

---

## Context downstream продукта

- E2E-encrypted приложение со сложной security boundary (масштабный security-sensitive product).
- Bootstrapped на template v0.1, ~3 дня работы.
- Mode: new-product (Mode 1), полный Stage A-E.
- Output: ~5500 строк foundational docs, 1 feature spec (~548 строк), 0 строк production кода.

### Footprint (для понимания scale)

| Категория | Approx LOC |
|---|---|
| Stage A artifacts | ~1600 |
| Stage B artifacts | ~1300 |
| Stage C artifacts | ~440 |
| Stage D artifacts | ~340 |
| Stage E + UI | ~950 |
| Stage F (Step 1) — single feature spec | ~550 |
| **Total foundation до first feature** | **~5500** |

---

## Что хорошо (validate value)

### 1. Foundation реально работает как grounding

First feature spec ссылается на personas, threat-model, user-journeys, OWASP/CWE. **Без Stages A-B такой spec был бы невозможен.** Был бы generic «как в industry leader X». Здесь — product-specific и security-grounded.

### 2. Security invariants в spec'е — production-grade

Конкретные testable invariants на уровне крипто-протокола, которые linter/SAST может enforce'ить. Именно то, для чего фреймворк строится.

### 3. AP-13/14 impact assessment работает

Feature spec frontmatter содержит impact flags. Multiple `yes` flags автоматически triggers cascading doc PRs. Это discipline против silent drift в действии — observed, не теоретическая.

### 4. mvp-scope.md имеет конкретные numbers

Falsifiable acceptance criteria («N paying customers, M active users, 0 critical failures в P дней»), не «улучшим engagement».

### 5. Trace-ability сквозная

Из mvp-scope → personas → journeys → threat-model → security invariants в spec. Это **6-axis quality coverage** (включая learning) в действии:
- Понятность: vision + scope explicit.
- Поддерживаемость: invariants extractable as rules.
- Технические качество: OWASP/CWE references.
- UI: ui-style-guide present.
- UX: user-journeys.
- Learning: operator формализовал intuition через формальные artifacts.

---

## Что плохо (validate critique)

### 1. Token/context cost — РЕАЛЬНЫЙ, не теоретический

На ~3-й день session подошла к лимиту context'а. Operator вынужден был создать ad-hoc resume note для pickup'а на следующий день. Это **не теоретический риск** из `complexity-honesty.md` — это **факт за 3 дня работы**. 5500 LOC foundation постоянно in-context — слишком много.

### 2. ADR mechanism НЕ triggering (proven gap в AP-1) — ★★★★★

`architecture-decisions/` папка содержала только template (0000-template.md).

Но feature spec содержал **130+ строк архитектурных решений** (password architecture, E2E boundary trade-offs, KDF design, PII encryption strategy, ~5 architectural invariants).

Это **очевидно ADR-grade decisions**, но они **похоронены в spec'е**.

**AP-1 (reactive ADR при architectural fork) — proven gap.** Либо AP-1 плохо сформулирован, либо planner-agent не triggering его правильно. На первой же фиче живого проекта.

### 3. ui-style-guide.md = monolith ~950 строк

На старой версии template'а (до per-kind split). После split — лучше. Но даже после split, для single-`ui_kind` продукта это всё равно 1 big file. Глубокая проблема монолитности артефакта.

### 4. First feature spec ≈ 548 строк, 47 секций

Верхняя граница читаемости одного spec'а. Для E2E crypto first feature appropriate; для большинства фич — overkill. Если такой weight на ВСЕ specs — context cost будет catastrophic.

### 5. 6 cascading PRs на одну фичу

5 impact=yes → 5 doc PRs + main spec PR. **Operator cognitive load на координацию высокий.** Хорошо что не silent drift; плохо что overhead большой.

---

## Что слишком сложно (можно проще)

### 1. Stage A-E «всё-или-ничего» проявилось

Project выполнил **полный** Stage A-E прежде, чем написать первую строку кода. Для security-sensitive продукта justified. Но: значительная часть артефактов (brand-voice ≈ 363 LOC, competitive-analysis ≈ 364 LOC) могла быть отложена / lite-version до first ship.

### 2. customer-interview-script.md написан upfront

Но проект ещё не имеет первых customers (alpha-когорта — несколько знакомых). Скрипт может оказаться irrelevant после реальных интервью. **Conditional artifact, который framework заставил написать раньше времени.**

Идеальный case для conditional-skip механизма из revised proposals.

### 3. RESUME note pattern = sign emergent overload

Не bug, а **emergent property**: foundation слишком много для одной session'и. Решения:
- Lazy-load foundational docs per session (грузить только relevant к active feature).
- Per-feature context isolation (subagent читает только что нужно).

---

## Validation таблица (наши audits ↔ live evidence)

| Утверждение из audits | Live evidence | Severity confirmed |
|---|---|---|
| Token cost real | RESUME note за 3 дня | ★★★★★ |
| Multi-dimensional quality work | First spec depth impossible без foundation | ★★★★★ |
| AP-14 impact discipline работает | Cascading PRs triggered properly | ★★★★☆ |
| **AP-1 reactive ADR fragile** | **130+ LOC arch decisions без ADR — PROVEN gap** | **★★★★★** |
| Stage A-E «всё-сразу» heavy | ~5500 LOC doc до first feature | ★★★★☆ |
| Per-feature spec может быть слишком heavy | ~550 LOC, верх читаемости | ★★★☆☆ |
| Conditional skip нужен | customer-interview написан до first customer | ★★★★☆ |
| 6 dimensions покрыты | UI / UX / security / scope / understandability / learning — all present | ★★★★☆ |
| 6 PRs на feature = operator overhead | 5 doc PRs + 1 spec PR observed | ★★★☆☆ |

---

## Concrete actionable findings (приоритизированные)

### P0 — proven gaps требуют немедленного fix'а

#### A. ADR auto-extraction enforcement (NEW PRIORITY)

**Что:** spec section с keywords `инвариант`, `архитектура`, `trade-off`, `decision` длиной > 30 LOC должна **trigger advisor suggestion** на extraction в отдельный ADR файл.

**Почему urgent:** уже на первой фиче live проекта 130+ LOC architectural decisions buried в spec'е. Через 6 месяцев новый developer / agent не найдёт «почему так решили» без чтения всего spec'а. AP-1 (reactive ADR) declared, but not enforced — **proven dead letter on first feature**.

**Concrete fix:** новый spec-linter check в `.ai-pm/tooling/scripts/check-spec-discipline`:
- Detect sections с architectural keywords + LOC threshold.
- Suggest ADR extraction в reviewer findings.
- Optionally: hard-block если spec section > 50 LOC architectural content без ADR reference.

Это новый AP-24: **«Architectural decisions buried in spec без ADR»**.

**Sequencing:** добавляется в v0.2.0 P0 wave вместе с silent-break gaps 1-3.

### P1 — overhead reductions без потери coverage

#### B. Lazy foundational loading в Stage F (NEW PRIORITY)

**Что:** Stage F session (planner / coder / reviewer) сейчас читает **всё** foundation. Должно читать **только** artifacts, на которые ссылается active spec (по impact flags).

**Concrete fix:** router в каждом Stage F subagent prompt'е:
- Parse spec frontmatter impact flags.
- Read только корреспондирующие docs (если `threat_impact: yes` → threat-model; else skip).
- Read базовый minimum всегда (vision, scope) — без них нет context.

**Estimated savings:** для heavy security-sensitive spec (5 impact yes) — load ~80% docs. Для типичной фичи (2-3 impact yes) — load 40-60%. Экономия context: **2-3×**.

**Sequencing:** v0.3.0 или v0.4.0 — параллельно с Path C / Path B (advisor scope расширяется на impact-driven loading).

#### C. Conditional skip mechanism — concrete pilot validation

`customer-interview-script.md` upfront — concrete proof что нужен conditional skip mechanism (Path B revised). Confirms ценность того, что conditional skip per-artifact > Layer model.

### P2 — long-term improvements

#### D. Per-feature spec splitting at threshold

**Что:** spec > 400 LOC → reviewer suggestion «consider feature split». Если > 600 LOC → block с required justification.

#### E. UI style guide per-kind split (уже сделано в PR #6)

Subsequent template apply (`template-sync`) распространит на downstream проекты.

---

## Что live test validate'ует concretely

Это **первый live datapoint** против многих наших теоретических утверждений:

1. **Phantom user concern (`critique-and-blindspots.md` дыра 3) — closed.** Operator — реальный user с реальным pain. n=1 confirmed.
2. **Token cost concern (`complexity-honesty.md`) — confirmed.** RESUME note за 3 дня = эмпирическое доказательство.
3. **AP-1 reactive ADR — proven fragile.** Не теоретический gap, а воспроизводимая failure mode.
4. **Conditional skip — confirmed need.** customer-interview-script — concrete example.
5. **Lazy loading — confirmed need.** Whole-foundation load не масштабируется.
6. **Path C consolidation — value lower than thought.** Каждый артефакт имеет место в trace-ability. Merge'ить близкие — рискованно.
7. **Path B layered minimal mode — value higher than thought.** Project не использовал бы половину artifacts на первой фиче, мог бы skip с reason.
8. **discipline-advisor — would have caught customer-interview-script overhead.** Concrete use case найден.

---

## Net verdict

**Framework работает по назначению на сложном продукте.** Output — production-grade specs, которые не сделаешь vanilla Claude'ом. Multi-dimensional quality реальна, не маркетинг.

**Но overhead уже на границе боли:**
- 3 дня → context limit.
- 1 фича → 5500 LOC foundation context.
- ADR mechanism под нагрузкой даёт сбой.

**Live test validate'ует основную thesis:** framework делает обещанное, но **ADR auto-extraction + lazy loading + conditional skip** — критичны для жизнеспособности. Без них рост проекта = рост cognitive collapse.

**Reprioritization on basis of live evidence:**

Old приоритет (gaps → C → B → advisor → A) меняется на:
**gaps + ADR-extraction → lazy loading + conditional skip → C (careful) + B → advisor → A**.

1. **P0 — Silent-break gaps 1-3** (см. `silent-break-gaps.md`) + **ADR auto-extraction enforcement** (AP-24) — параллельно в v0.2.0.
2. **P1 — Lazy foundational loading** + **Conditional skip mechanism** — v0.3.0/v0.4.0.
3. **P2 — Path C consolidation** (revised: only same-axis merges, не aggressive).
4. **P2 — Path B layered minimal mode**.
5. **P3 — discipline-advisor** as smart layer.
6. **P4 — Path A repositioning.**

---

## Updated open questions для оператора

- **Retroactive ADR extraction в downstream проекте** — pilot для validation AP-24 хорошим ли получился? Outcome: 3-4 ADR на основе текущего spec'а, spec сжимается на 100-150 LOC.
- **Lazy loading — pilot на downstream проекте?** Самый сильный live test для intervention.
- **customer-interview-script — оставить или mark deprecated** до first real interview? Concrete case для conditional-skip pilot.
