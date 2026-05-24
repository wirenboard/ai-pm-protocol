# Merged optimization plan: silent-break gaps + complexity reduction + post-refactor fixes

**Дата:** 2026-05-25
**Scope:** интервенции в template `ai-pm-protocol` от v0.2.0 до v0.5.0
**Версия плана:** v2 (после получения silent-break-gaps audit + расширенного complexity-honesty)

**Входы (по порядку появления):**
- `meta/audits/2026-05-25_post-refactor-second-pass.md` — defect findings (мой audit)
- `meta/audits/2026-05-24_complexity-honesty.md` — архитектурный refactor + revised section после калибровок (внешний audit)
- `meta/audits/2026-05-24_competitive-landscape.md` — supporting input для Path A
- `meta/audits/2026-05-24_critique-and-blindspots.md` — devil's-advocate против двух выше
- `meta/audits/2026-05-24_silent-break-gaps.md` — NEW: проверка mental model оператора «спека→авто-проверка→не читать код» против фактической реализации
- `meta/design/2026-05-24_mode-matrix-and-adoption.md` — baseline текущей architecture (v0.1.0)

---

## Mental model оператора и центральная metaphor

Оператор-PM описал mental model: «**PM пишет спеку → автоматика проверяет код → линтеры enforce качество → не читать код, не должно быть ситуации когда фичи втихую ломаются**».

`silent-break-gaps.md` верифицировал что **80% этой mental model уже реализовано** во фреймворке. Это больше, чем у любого аналога. **20% — конкретные дыры**, которые подлежат закрытию, а не reshape.

**Новый value prop** (заменяет «discipline framework»):

> **Framework, который делает AI-shipping survivable:** код переживает свою вторую, пятую, десятую фичу. Без silent breakage. С автоматической проверкой spec ↔ code. С тестами, которые нельзя подкрутить под выдумки агента. С поддерживаемостью через квартал.

Outcome-based, falsifiable, симметрично покрывает обе аудитории (PM-без-кода + dev).

## 5 dimensions of quality — hard constraint

Любое изменение фреймворка должно сохранять покрытие всех пяти осей:

| Dimension | Что значит | Failure mode без покрытия |
|---|---|---|
| Понятность | Vision / scope / boundaries — что строим, для кого, что НЕ строим | Calculator-with-backend (over-engineering без grounding) |
| Поддерживаемость | AP invariants (AP-3/4/5/19/20) + maintenance playbooks | Tech debt на 2-й фиче |
| Технические качество | CI gates / per-diff coverage / spec→test mapping / test-fudging prevention / regression coverage | Silent break |
| UI | UI style guide + per-kind guides + brand voice | Inconsistent UX |
| UX | MVP scope + user journeys + interaction flow | Unfocused product |
| Learning | Substantive subagent outputs / explained decisions / formalized intuition | Vibecoding (AI делает, оператор не растёт; через год оператор без AI как без рук) |

**Acceptance gate для всех изменений:** каждое уменьшение сложности должно показать, что dimensional coverage не теряется.

---

## Новый приоритет работ

Старый порядок был **C → B → A**. Новый: **gaps → C → B → advisor → A**.

Закрытие silent-break gaps — наивысший приоритет, потому что это **починка обещанной функциональности**, а не improvement. Любая консолидация без закрытых дыр — косметика.

| Приоритет | Что | Версия |
|---|---|---|
| P0 (срочно) | Silent-break gaps 1-3 + post-refactor defects (B-1..B-4) + size gate quick win | **v0.2.0** |
| P0.5 | Validation gate — self-experiment (проверить что gap closure действительно prevents silent breaks); no-framework baseline в competitive-landscape | between v0.2.0 и v0.3.0 |
| P1 | Path C careful consolidation (same-axis only, ~25→~18) | **v0.3.0** |
| P2 | Path B conditional skip + advisor presets (заменяет Layer model) | **v0.4.0** part 1 |
| P3 | discipline-advisor 5-axis quality challenger | **v0.4.0** part 2 |
| P4 | Path A outcome-based positioning | **v0.5.0** |

---

## Roadmap

### v0.2.0 — Fix wave + silent-break gaps closure

**Тип SemVer:** PATCH (defects) + MINOR (silent-break gaps — new CI gates / new linting rules / new AP)

#### Scope A: Post-refactor defects (мой audit)

1. **B-1 mode renaming sweep** — закрыть rename `new-feature`/`rework-feature` → `feature`/`rework` во всех ~80% оставшихся template файлах. Python regex script.
2. **B-2 feature-spec.md.tmpl frontmatter** — добавить YAML head с topic/mode/lite-mode/created/spec_approved/plan_approved/acceptance/merged/review_url/pr_ordering/template_version_applied/impact-блок.
3. **B-3 feature-review.md.tmpl restore** — восстановить `**Verdict:** approve|request-changes|block` line (AP-16 hook парсит её!), заменить orphan `security-reviewer` references на актуальную roster.
4. **B-4 scripts location** — `_templates/scripts/*.tmpl` шапки и protocol § 5.2/9.2 к единой конвенции `scripts/` в product.
5. **High-1..5** из post-refactor audit.

#### Scope B: Silent-break gaps 1-3 (P0 из complexity-honesty)

6. **Gap 1 — Spec→test mapping CI gate:**
   - Новый check в `.ai-pm/tooling/scripts/check-spec-discipline`
   - Парсит Gherkin блоки из `<topic>_spec.md`, извлекает scenario names
   - Grep'ит test files на matching scenario names (по convention: `describe('Scenario: ...')`, `def test_scenario_*`, `func TestScenario*`)
   - Fail если не 1:1 mapping
   - Stack-specific mapping rules в `ai-linting-rules.md` (Stage E генерирует на основе stack choice)
   - JS/TS / Python / Go baseline; остальные стеки добавляются incrementally
7. **Gap 2 — Test fudging prevention:**
   - Новая категория в §7.1 catalogue: **«Test assertion weakening»**
   - Custom semgrep rule в `ci/lint-rules/` детектит:
     - Удалённые `expect()` / `assert*` в существующих тестах через git diff
     - Замены `toBe(X)` → `toBeGreaterThan(Y<X)`, `toEqual(obj)` → `toMatchObject({})`, реальных implementation на mocks
   - Новый **AP-23: Test assertion weakened без declared behaviour change** (anti-patterns.md)
   - Требование: ADR ref в commit message ИЛИ block
8. **Gap 3 — Regression coverage для shared modules:**
   - Расширение AP-14 impact assessment: если `topology_impact: yes` ИЛИ diff path overlap с другими feature spec'ами → **requires regression test plan**
   - Новая секция в `feature-spec.md.tmpl`: **«Regression coverage plan»** (shared modules, existing tests covering affected behaviour, new tests если gap)
   - Новый CI gate `regression-coverage-for-shared-modules`: detect'ит touched shared modules, fail если coverage не увеличился (или не остался 100%)
   - Mode legacy: первый раз touched module → minimum 60% coverage growth

#### Scope C: Operational quick win

9. **Size gate на reviewer fan-out:**
   - PR < 100 LOC → только protocol-compliance baseline без specialized fan-out
   - **Content-aware override** (Mitigation 4): diff трогает `auth/`, `payments/`, `db/migrations/`, `crypto/`, `*.lock`, security-sensitive paths → fan-out независимо от размера
   - 50-100 LOC правило в `reviewer.md` primary prompt + override-paths config

**Definition of done:**
- Все Blocking findings (B-1..B-4) закрыты с verification в `meta/reviews/`
- Gaps 1-3 закрыты: CI gates passing на test fixtures (deliberately broken spec→test mapping и weakened assertions должны fail)
- AP-23 добавлен в anti-patterns.md
- Size gate test'ован на ≥2 PR'ах разного размера/содержания
- Feature-spec template instantiation на test'овой фиче проходит CI end-to-end

**Estimate:** 2-3 PR (B-1..B-4 + High в один comprehensive fix PR, gap 1+2+3 в один P0 PR, size gate отдельный PR).

---

### Validation gate (между v0.2.0 и v0.3.0) — pragmatic scope

**Pre-condition для v0.3.0+ переформулирован** после reframing (оператор — known real user, не phantom; not selling, building for self).

**Scope (collapsed):**

1. **Pain mapping self-interview + closure validation:**
   - Через AskUserQuestion + design doc — детальный профиль pain'а оператора (PM при компании ~100 человек, типичные pain'ы от обычного Claude: переусложнение / необходимость code review / ошибки / утечки данных / etc.)
   - Что именно от обычного Claude бесило / что компенсируется фреймворком / что НЕ закрывается / какие новые pain'ы вводит сам фреймворк (например, 25 артефактов)
   - **Pain → mitigation mapping table:** для каждого pain — конкретный механизм фреймворка, который его закрывает (gap 1 fix / AP-23 / advisor / etc.). Если pain без mitigation — это backlog item для следующих версий
   - **Closure validation:** каждый pain в таблице проверяется на self-experiment (см. п. 2) — действительно ли механизм работает
   - Output: `meta/research/2026-XX-XX_operator-pain-mapping.md`
   - Это input для v0.5.0 Path A README — таблица переезжает прямо в README как «pain → как фреймворк его закрывает»

2. **Self-experiment — verify gap closure efficacy:**
   - 1-2 micro-фичи через полный Stage F с фреймворком (после v0.2.0 merge) с включёнными gap 1-2-3 CI gates
   - Тот же scope — голым чатом с Claude Code
   - Замерить **именно**: воспроизводится ли silent break? Спека→тесты coverage? Weakened assertions ловятся? Regression в shared modules?
   - Не market shipping speed comparison — **verification что gap closure действительно prevents pain'ы**
   - Output: `meta/experiments/2026-XX-XX_silent-break-prevention.md`

3. **No-framework baseline в competitive-landscape (Дыра 2 critique):**
   - Дополнить `meta/audits/2026-05-24_competitive-landscape.md` секцией «No-framework baseline — chat с Claude»
   - Honest delta: Layer 0 (после v0.4.0) vs голый чат — что добавляет, что отнимает
   - Input для v0.5.0 README

**Что НЕ делаем:**
- ~~Market research 5-10 PM-ов~~ — оператор не продаёт, building for self + sharing
- ~~Phantom user validation~~ — оператор сам verified user, n=1 но не phantom

**Definition of done:**
- Pain mapping document зафиксирован
- Self-experiment проведён, gap closure verified или escalated
- No-framework baseline в competitive-landscape добавлен

**Estimate:** 2-3 дня после v0.2.0 merge.

---

### v0.3.0 — Path C: Stage consolidation (revised — same-axis only)

**Pre-condition:** validation gate passed.

**Тип SemVer:** MINOR (additive merges с backwards-compat aliases).

**Старый критерий** (отвергнут): «близкие темы → merge».
**Новый критерий:** merge only if both artifacts target the **same axis of quality**.

#### Merges to perform (5 из 9 старых)

| Сейчас | Reassessment | Действие |
|---|---|---|
| `competitive-analysis` (A) + `positioning` (A) | Одна ось — product framing. Positioning = вывод из competitive-analysis | **Merge** → `positioning.md` |
| `brand-voice` (A) + `ui-style-guide-base` (A) | Одна ось — UI/UX consistency. Brand voice = tone of UI copy | **Merge** → `ui-style-guide-base.md` с brand-voice секцией |
| `legal-frame` (B) + `legal-brief` (B) | Одна ось — legal/compliance. Brief = actionable distillation | **Merge** → `legal.md` (frame + current brief) |
| `dependency-policy` (D) + `refactor-playbook` (D) | Одна ось — maintainability | **Merge** → `maintenance-playbook.md` |
| `stack` + `db_kind` + `database-design-*` (D) | Одна ось — technical foundation, tight coupling | **Merge** → `tech-stack.md` |
| `ai-linting-rules` + `subagent configs` + `protocol overlay` (D) | Одна ось — AI/agent infrastructure | **Merge** → `development-protocol-overlay.md` |

#### НЕ merge'им (старые предложения отвергнуты)

| Сейчас | Старое предложение | Почему отвергнуто |
|---|---|---|
| `vision` + `strategic-frame` | merge | **Разные оси:** vision = product intent (понятность), strategic-frame = measurability (поддерживаемость — SLO + validation) |
| `personas` + `user-journeys` | merge → `audience.md` | **Разные failure modes:** psychographics vs interaction flow. Journey без personas — академический, но это разные дисциплины |
| `threat-model` + `incident-runbook-draft` | merge | **Разные timeframes / disciplines:** identify (риски) vs respond (incident) |

#### Структурные изменения остаются

- Stage C **упразднён** — `topology.md` fold'ится в Stage D `tech-stack.md`, ADRs остаются reactive AP-1
- Stage E 12 checkboxes → **1 checkpoint** (`bootstrap-verify.sh passed`) + granular health-check script
- `mvp-scope.md` остаётся отдельным (независимый lifecycle)
- `customer-interview-script.md` остаётся отдельным (executable artifact)
- `per-kind ui-style-guide-*.md` остаются (conditional activation по `ui_kind`)
- ADR files — atomic, AP-1 reactive

**Result:** ~25 → **~18** artifacts (вместо ~12). Меньше экономия, **без dimensional loss**.

#### Mandatory mitigations

- **Mitigation 2 — Merged docs prominence loss:** template'ы для merged docs обязательно содержат TL;DR блок в начале + section-checkboxes в шапке + bold-prompt'ы перед каждой бывшей-отдельной секцией + soft-cap on section length
- **Mitigation 3 — Stage E baseline holes:** `bootstrap-verify.sh` (~100 LOC bash) проверяет все 12 текущих пунктов как health-check; в state остаётся 1 tracking checkpoint; verify запускается из `make setup` и CI

#### Backwards compat

- Migration script для existing template-using проектов — copy old content в merged docs, old files с redirect comment одну MINOR-версию
- `template-sync` Phase 3 workflow покрывает это (уже реализовано в v0.1.0)

**Definition of done:**
- 6 merges выполнены, old files с redirect comments
- `bootstrap-verify.sh` написан, в CI, явно показывает какой пункт упал
- **Dimensional coverage verified:** каждый из 5 axes имеет ≥1 dedicated artifact на default scope
- Template instantiation на synthetic test проекте проходит end-to-end Stage A-F
- Migration script test'ован на копии HeartVault state без потерь content (verification report green)

**Estimate:** 3-4 PR (Stage A/B/D merges группами + Stage E checkpoint reduction + verify script + migration script).

---

### v0.4.0 — Path B (revised) + discipline-advisor

**Pre-condition:** v0.3.0 merged + advisor PoC прошёл accuracy gate ≥80% (см. ниже).

**Тип SemVer:** MAJOR (breaking — state schema additions, conditional skip как first-class).

#### Layer model заменяется conditional skip + advisor presets

**Старое предложение** (отвергнуто): монотонная последовательность Layer 0 ⊂ Layer 1 ⊂ ... ⊂ Layer 4.
**Новое:** **conditional skip per-artifact** на основе `skip_eligibility` metadata + **advisor presets** (minimal/standard/full).

##### Skip eligibility metadata per artifact

В template каждого артефакта добавить frontmatter секцию:

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

##### Skip eligibility table (default rules)

| Артефакт | Default | Skip если | Hard floor |
|---|---|---|---|
| `vision.md` | required | — | never |
| `scope.md` | required | mode = bug-fix | never для new-product |
| `personas.md` | recommended | mode = bug-fix; no public users | never if public-web = yes |
| `user-journeys.md` | recommended | mode = bug-fix; no UI | never if ui_kind has any value |
| `competitive-analysis` (после merge в positioning) | optional | always skippable с reason | — |
| `positioning.md` | optional | single-purpose tool без marketing | — |
| `brand-voice` (после merge в ui-style-guide) | optional | no user-facing copy | — |
| `ui-style-guide-base.md` | conditional | ui_kind = empty (no UI) | never if ui_kind has any value |
| `strategic-frame.md` | recommended | SLO не applicable (single-user tool) | never if multi-tenant = yes |
| `threat-model.md` | conditional | **все security capabilities = no** | **never if any security capability = yes** |
| `legal.md` | conditional | processes-pii=no AND no payments AND no GDPR-jurisdiction | never if processes-pii = yes |
| `customer-interview-script.md` | recommended | internal tool (no external validation) | — |
| `incident-runbook-draft.md` | conditional | no runtime (build-time tool) | never if uses-containers = yes OR public-web = yes |
| `mvp-scope.md` | required | mode = bug-fix | never для new-product |
| `topology.md` (fold'ится в tech-stack.md) | required | очень простой single-file tool | rarely skippable |
| `dev-environment.md` | required | template-sync mode | never |
| `maintenance-playbook.md` | optional | single-developer / weekend project | — |
| `development-protocol-overlay.md` (после merge) | required | none | never |
| Per-kind `ui-style-guide-<kind>.md` | conditional | per ui_kind selection | never для активных kinds |
| `database-design-<kind>.md` (после merge в tech-stack) | conditional | per db_kind selection | never для активных kinds |

##### Advisor presets

| Preset | Behaviour |
|---|---|
| **minimal** | Агрессивно рекомендует skip всё, что не hard floor |
| **standard** | Skip только conditional-no |
| **full** | Keep all |

Operator выбирает preset на bootstrap, advisor применяет, per-artifact override возможен через `adoption_overrides`.

**Это лучше Layer model'a**, потому что:
- Не предполагает монотонности
- Допускает любые подмножества (калькулятор без `threat-model.md` независимо от Layer'а)
- Auto-derived из project context (advisor не оператор выбирает)
- Каждое decision имеет audit-trail (reason + declared_at)

#### Mitigation 1 заменяется advisor-driven auto-recommendation

Старая формулировка: static quiz перед opt-out.
Новая: advisor auto-detects skip eligibility через evidence-based scan, operator confirms.

#### State schema additions

```yaml
advisor_preset: minimal | standard | full
skip_decisions:
  - artifact: threat-model.md
    state: skipped | active | mandatory-promoted
    reason: <auto-from-advisor or operator-provided>
    declared_at: <iso-date>
    next_reprompt: <iso-date>  # дыра 4 — escalation
    promoted_by: advisor-floor | quiz | operator
advisor_log:
  - timestamp: <iso>
    trigger: bootstrap-entry | preset-change | stage-f-entry | spec-draft | plan-draft | code-diff | review
    axis: понятность | поддерживаемость | технические качество | UI | UX
    findings: [...]
```

#### discipline-advisor — 5-axis quality challenger

**Trigger points** (расширены — не только bootstrap):

| Trigger | Что advisor проверяет | Axis |
|---|---|---|
| Bootstrap entry | Skip eligibility на основе detected capabilities; hard floor; preset auto-suggest | All 5 |
| Preset change | Когда оператор хочет skip — challenge через evidence | All 5 |
| Stage F Step 1 (spec draft) | Spec scenarios покрывают user journey? Acceptance criteria measurable? Security invariants для security path? | UX + технические качество |
| Stage F Step 2 (plan draft) | Proposed архитектура **proportionate** к spec? Не over-engineered? Test plan covers all scenarios? | Поддерживаемость + технические качество |
| Stage F Step 4 (coding) | Spec→test mapping есть (gap 1)? Тесты не ослабляются (gap 2)? Shared modules require regression coverage (gap 3)? | Технические качество |
| Stage F Step 7 (review) | Reviewer findings address all 5 axes или focus только на одной? | All 5 |

**PoC accuracy gate (Дыра 5 critique):** перед тем как advisor станет mandatory, прогон на 3-5 реальных проектах с известным «correct» preset selection. **Минимальный bar: ≥80% accuracy per axis**. Если ниже на любой axis — отказаться от advisor для этой axis, оставить deterministic fallback (CI gates).

**Bounded scan:** sample (entry points + manifests + 5-10 файлов по эвристике), cached per session, trigger-based, hard token budget <10k.

#### Layer-climbing mitigation (Дыра 4)

- Advisor должен **escalate**, не просто recommend — с увеличивающейся severity со временем
- Skip'ы имеют **deadline-driven re-prompts** (`skip_decisions[].next_reprompt`)
- Default reprompt period: 90 дней

**Definition of done:**
- `skip_eligibility` metadata добавлен ко всем артефактам в `_templates/`
- Advisor subagent в `.claude/agents/discipline-advisor.md`
- Advisor presets реализованы и protested на toy project ("calculator" → minimal preset auto-suggested → produces single-screen calculator, не fullstack)
- 5-axis trigger points реализованы и протестированы
- PoC accuracy gate ≥80% per axis passed (или fallback static-quiz only на failed axis'ах)
- Layer-climbing escalation работает (deadline-driven re-prompts)
- State schema migration для existing v0.3.0 state — default `advisor_preset: full` (full backwards compat)
- End-to-end test scenarios passed (см. Acceptance criteria ниже)

**Estimate:** 5-7 PR (skip_eligibility metadata / advisor agent / preset logic / 5-axis triggers / floor rules / smart scan / migration script / e2e validation).

---

### v0.5.0 — Path A: Outcome-based positioning

**Pre-condition:** v0.4.0 merged, pain mapping document available из validation gate.

**Тип SemVer:** PATCH (copy-only).

#### Новый positioning (заменяет «discipline framework для PM-asymmetric niche»)

README opening (первая строка):

> **Framework, который делает AI-shipping survivable:** код переживает свою вторую, пятую, десятую фичу. Без silent breakage. С автоматической проверкой spec ↔ code. С тестами, которые нельзя подкрутить под выдумки агента.

#### Trust profiles — symmetric pair, не asymmetric

Старая формулировка: «PM-manager (A) / cross-stack senior (B) / full-stack pro (C)» — predполагает asymmetry.
Новая: **«Какую половину каждый приносит сам, какую compensates фреймворк»** — symmetric pair.

| Profile | Что приносит сам | Что фреймворк compensates |
|---|---|---|
| A | Product thinking (что строить, для кого, что НЕТ) | Tech discipline + code verification |
| B | Cross-stack tech | Product structure + maintainability discipline |
| C | Full-stack + product | Multi-axis review + scale-out structure |

Каждая половина legit, ни одна не «слабее».

#### Sections в README

- **Hero section** — outcome (выше), 2-3 предложения
- **Pain → mitigation table (ЦЕНТРАЛЬНАЯ ЧАСТЬ):** перенесена из validation gate pain-mapping document. Каждая ЦА-боль и конкретный механизм фреймворка, который её закрывает. Примеры (финальный состав — после pain mapping document):

  | Pain (ЦА pain от обычного Claude) | Как фреймворк закрывает |
  |---|---|
  | «AI пишет код, который втихую ломает существующие фичи» | Gap 1 spec→test mapping + Gap 3 regression coverage CI gates |
  | «AI «правит» тесты под свои выдумки чтобы зелёная сборка» | Gap 2 + AP-23 test-fudging prevention |
  | «AI постоянно over-engineering, делает калькулятор с бэкендом» | Discipline-advisor scope-proportionality (Stage F Step 2) |
  | «Утечки данных, secrets в коде» | Protocol-compliance baseline + advisor floor hard detection (PII/auth/crypto) |
  | «Каждый раз когда меняется AI-модель — всё ломается» | Spec-as-contract: тесты от spec, не от implementation. Модель меняется — тесты остаются |
  | «Не хочу читать код, но боюсь что AI меня обманывает» | Verdict-gate (AP-16) + Spec→test deterministic mapping + 5-axis review |
  | «Compliance / GDPR / utечки PII — страшно» | Threat-model conditional на capability detection + legal-frame для PII/payments |

- **Mental model** — «PM пишет хорошую спеку → автоматика проверяет код → линтеры enforce качество → можно не читать код». Diagram.
- **Learning effect — качественное отличие от vibecoding:** фреймворк прокачивает оператора одновременно с shipping'ом, не подменяет thinking. Это первоклассный value, не побочный:
  - Subagent outputs **substantive, growth-oriented** — объясняют архитектурные решения уровнем выше, чтобы PM понимал «почему так», а не просто «что сделано»
  - Stage A-E artifacts — оператор формализует свою intuition (vision / threats / personas / journeys), фреймворк challenge'ит через advisor
  - Specs — PM учится формулировать поведение измеримо (Gherkin / acceptance criteria), это переносится между проектами
  - ADR — PM учится фиксировать architectural decisions с reasoning, а не impulsive
  - Reviewer findings — PM растёт через объяснение каждого finding'а («это нарушение AP-X потому что...»)
  - **Vibecoding** = «AI делает, я смотрю прокатило ли». **Этот фреймворк** = «я думаю архитектурно, AI помогает execute, я расту от каждого engagement».
- **Что фреймворк делает, чтобы это работало:**
  - Spec→test mapping CI gate (gap 1 fix)
  - Test-fudging prevention (gap 2 fix + AP-23)
  - Regression coverage для shared modules (gap 3 fix)
  - 5-axis advisor (preset-driven conditional skip)
  - AP invariants как maintainability floor
  - Learning-oriented subagent outputs (см. выше)
- **Authorship — honest framing:** «Built by one PM at a 100-person company for own pain (over-complication of bare Claude, code review burden, errors, data leaks). Shared as open source. Если у тебя похожая боль — может пригодиться. Если нет — иди к OpenSpec / голому чату.»
- **Когда это для тебя / когда нет:**
  - Для тебя: similar pain, want spec→verified code, don't want to read code line-by-line, **хочешь расти от каждой фичи**, а не «потом разберусь»
  - Не для тебя: weekend prototype (overkill), pure vibecoding mindset (мы об обратном — disciplined growth), formal verification (used together — мы про discipline, formal tools про proof)
- **Сравнительная таблица с no-framework baseline + OpenSpec + BMAD + Spec Kit + Kiro:**
  - Включает «chat с Claude без фреймворка» как первая колонка (Дыра 2 critique)
  - Honest delta — что добавляем vs голый чат, что отнимает
  - **Learning dimension** в таблице — у нас explicit, у других не central (или absent)
- **Token cost transparency** — rough estimates per PR size + ссылка на complexity-honesty

**Definition of done:**
- README не упоминает «discipline» в первой секции (outcome в первой строке)
- Trust profiles описаны как symmetric pair с примерами
- Сравнительная таблица включает no-framework baseline
- AP-12 grep clean (англицизмы wrapped или translated)
- AP-17 clean (нет product names)

**Estimate:** 1-2 PR.

---

## Cross-cutting work

### AP-инварианты как trade-off, не dogma (Дыра 6 critique)

**Действие:** в `doc/anti-patterns.md` для каждого AP добавить три секции:
- **Зачем введён** — incident / observation
- **Когда применим** — default scope
- **Когда НЕ применим** — explicit exceptions с reasoning

**Когда:** параллельно с v0.3.0 (Path C затрагивает много AP-aware кода).

**Эффект:** brand меняется с «discipline framework» на «opinionated defaults с reasoning». Sustained для long-term credibility.

### Timeless vs AI-state-specific decisions (Дыра 7 critique)

**Действие:** новый раздел в `doc/development-protocol.md`:

**Timeless** (выдержат AI-evolution):
- Operator authority
- Atomicity (AP-19)
- Review discipline (AP-16)
- Spec→test mapping (gap 1 fix)
- Test-fudging prevention (gap 2 fix)
- 5 dimensions of quality
- Composition decomposition

**AI-state-specific** (deprecate-candidates через 12-18 мес):
- Foundational doc loading per session
- Multi-subagent fan-out architecture
- `.ai-pm/` persistent state files
- Prompt templates с structured artifacts

**Когда:** один section update параллельно с v0.4.0 или v0.5.0.

---

## Acceptance criteria для всего refactor'а

Refactor считается успешным, если:

- [ ] Все 3 silent-break gaps закрыты (1, 2, 3 из `silent-break-gaps.md`)
- [ ] Path C сократил artifacts с ~25 до ~18 **без потери dimensional coverage** (verifiable: каждый из 5 axes имеет ≥1 dedicated artifact на default scope)
- [ ] Path B `skip_eligibility` metadata works on toy project: «calculator» → produces single-screen calculator (не fullstack)
- [ ] discipline-advisor accuracy ≥80% на test set per axis
- [ ] Path A README не упоминает «discipline» в первой секции; outcome в первой строке
- [ ] **«Не сломать» verified:** существующий project, прошедший Mode 1, остаётся valid after migration (template-sync produces working diff)
- [ ] HeartVault `template-sync` PR проходит без потери content

---

## After v0.5.0 — HeartVault first prod-run

После v0.5.0 template считается готовым к real prod-run'у. HeartVault получает `template-sync` PR:
- Apply v0.5.0 schema migration (`advisor_preset`, `skip_decisions`, merged docs structure)
- Apply documentation migration (`template-sync-doc-migrate.py`)
- Re-run discipline-advisor на HeartVault codebase — sanity check preset recommendation
- Operator выбирает preset based on advisory + own judgment

**HeartVault — first prod-run рефинированной системы.** Task #16 был closed до текущей mode matrix; реальный prod-run будет здесь.

---

## Что НЕ делаем

- **AP invariants numbering не трогаем** (AP-1..AP-23). Это бренд.
- **Per-PR atomicity не релакcируем ради token экономии.** Re-load overhead — симптом missing caching, не аргумент против атомарности.
- **Protocol-compliance baseline не убираем.** Дешёвый, ловит то что больше никто не ловит.
- **Tier framework не трогаем.** Pay-for-what-you-use, работает.
- **5 modes не трогаем.** Pay-for-what-you-use, работает (после v0.2.0 fix B-1).
- **Не merge'ить artifacts разных dimensions** — даже если тематически близки.
- **Не делать Layer 0 = no foundational** — ломает grounding dimension.
- **Не делать silent-break gap closures opt-in** — это hard floor, не conditional.
- **Не позиционировать через discipline** в README — это describes mechanism, не outcome.

---

## Open questions для PM до старта реализации

1. **Gap 2 AP-23 — hard block или requires ADR?** Hard block безопаснее, может frustrate в edge cases. **Рекомендация:** requires ADR (declared trade-off — операторский паттерн совместим с AP-22).
2. **Gap 4 (E2E suite) — fix сейчас или Phase 1.5+?** Требует выбора стека (Playwright / Cypress). **Рекомендация:** defer, фиксировать в Stage E template per stack.
3. **Gap 5 (spec drift) — cheap mitigation сейчас или long-term TODO?** **Рекомендация:** deprecation marker check (cheap), full execution proof — long-term.
4. **v0.3.0 SemVer — MINOR с aliases или MAJOR hard break?** **Рекомендация:** MINOR с redirect одну версию (consistent с safe migration).
5. **v0.4.0 default `advisor_preset`** для existing проектов без поля — `full` (backwards compat) или `standard` (более agressive auto-skip)? **Рекомендация:** `full` для existing, `standard` для новых.
6. **HeartVault timing — после v0.4.0 или ждём v0.5.0?** **Рекомендация:** v0.4.0 (architecture validated там, v0.5.0 — только copy).

---

## Versioning summary

| Version | Тип | Scope | Estimate |
|---|---|---|---|
| **v0.1.0** | initial | current state | — |
| **v0.2.0** | PATCH + MINOR | Fix wave B-1..B-4 + High findings + **silent-break gaps 1-3 (P0)** + size gate | 2-3 PR |
| **Validation gate** | — | Pain mapping self-interview + self-experiment verifying gap closure + no-framework baseline | 2-3 дня |
| **v0.3.0** | MINOR | Path C: 6 same-axis merges (~25→~18) + bootstrap-verify.sh + merged docs templates; AP trade-off docs (дыра 6) | 3-4 PR |
| **v0.4.0** | MAJOR | Path B: `skip_eligibility` per-artifact + advisor presets (minimal/standard/full) + discipline-advisor 5-axis (PoC ≥80%) + layer-climbing escalation (дыра 4) | 5-7 PR + PoC validation |
| **v0.5.0** | PATCH | Path A: outcome-based positioning + trust profiles symmetric pair + no-framework baseline (дыра 2) + timeless vs AI-state-specific (дыра 7) | 1-2 PR |
| **HeartVault** | — | First prod-run рефинированной системы через template-sync | 1 PR (downstream) |
