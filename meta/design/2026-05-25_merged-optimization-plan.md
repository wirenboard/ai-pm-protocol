# Merged optimization plan: complexity reduction + post-refactor fixes

**Дата:** 2026-05-25
**Scope:** интервенции в template `ai-pm-protocol` от v0.2.0 до v0.5.0
**Входы:**
- `meta/audits/2026-05-25_post-refactor-second-pass.md` — defect findings (мой audit)
- `meta/audits/2026-05-24_complexity-honesty.md` — архитектурный refactor (внешний audit)
- `meta/audits/2026-05-24_competitive-landscape.md` — supporting input для Path A
- `meta/audits/2026-05-24_critique-and-blindspots.md` — devil's-advocate против двух выше; meta-audit, заставляет добавить validation gate перед архитектурным рефактором
- `meta/design/2026-05-24_mode-matrix-and-adoption.md` — baseline текущей architecture (v0.1.0)

**Принцип:** не рефакторить broken baseline → не рефакторить unvalidated baseline. Сначала фиксы (v0.2.0), затем **validation gate** (дыры 1+3 из critique audit), затем consolidation (v0.3.0), затем layered minimal mode (v0.4.0), затем repositioning (v0.5.0). After v0.5.0 — first prod-run на HeartVault.

---

## Резюме входов

### Post-refactor audit (мой)

- **4 Blocking:** B-1 mode renaming sweep incomplete (~80% template), B-2 feature-spec.md.tmpl нет frontmatter example, B-3 feature-review.md.tmpl сломан (нет `**Verdict:**` line — AP-16 hook парсит её!), B-4 scripts location inconsistency
- **5 High:** orphan `trail_type` field, `meta/` references в product workflow, CLAUDE.md.tmpl missing Step 1.5, mini-foundation friction в complete state, остальные см. audit doc
- **5 Medium:** концептуальные дубли (3-choice / Tier framework / hard floor / lite-mode / mode-aware tables) в 3-4 местах

### Complexity-honesty audit (внешний)

- **Раскладка опор:**
  - ✅ Pure win: Tier framework / 5 modes / reviewer routing
  - ⚠️ Conditional (должно быть opt-in): Constraints (Stage B) / Composition matrices / Per-kind UI / Trust profiles
  - Discipline overhead (keep): AP numbering
- **Token cost matrix:** на trivial PR'ах 10×+ overhead, на small 3-5×, на medium 1.5-2×, на large 1-1.5× относительно minimal альтернатив. Большинство сессий — в zone 1.5-5× overhead.
- **Три комплементарных Path'а:**
  - **Path C — Stage consolidation:** 9 merges, упразднение Stage C (fold в D), Stage E 12 checkpoints → 1 checkpoint. Total: ~25 items → ~12 (≈−50%)
  - **Path B — Layered minimal mode:** onion Layer 0..4
  - **Path A — README repositioning:** «discipline framework для асимметричного PM/dev сотрудничества на compliance-sensitive multi-stack продуктах»
- **4 mandatory mitigations** для Path B/C (non-skippable в plan'ах реализации):
  1. Path B opt-in trap → pre-skip quiz (PII/payments/GDPR/HIPAA — если yes, Stage B mandatory)
  2. Merged docs prominence loss → TL;DR + checkbox + section soft-cap
  3. Stage E silent baseline holes → `bootstrap-verify.sh` health-check
  4. Reviewer size gate blind spots → size + content-aware override (auth/payments/migrations/crypto)
- **Hybrid evolution:** `discipline-advisor` subagent поверх deterministic floor

### Critique-and-blindspots audit (devil's-advocate)

Третий audit оспаривает обоснование предыдущих двух. Ключевые holes:

| # | Дыра | Severity | Тип |
|---|---|---|---|
| 1 | Меряем feature count, а не outcomes — нет evidence что фреймворк ускоряет shipping | ★★★★★ | Methodology |
| 2 | No-framework baseline (просто чат с Claude) проигнорирован — это реальный «конкурент» большинства | ★★★★☆ | Methodology |
| 3 | Phantom user — целевая ниша «PM без tech intuition + AI» не верифицирована, возможно выборка из 1-2 человек | ★★★★★ | Validation |
| 4 | Layer-climbing assumption — operators остаются где начали, advisor сигналы игнорируются | ★★★☆☆ | Implementation |
| 5 | discipline-advisor — vaporware, проецируем выгоды на не-built tool | ★★★★☆ | Implementation |
| 6 | AP-инварианты prescribe values под видом engineering laws (dogma) | ★★★☆☆ | Philosophy |
| 7 | Оптимизируем под late-2025 AI; через 12-18 мес context/memory/grounding обесценят базовые assumptions | ★★★☆☆ | Strategy |

**Грубый вывод аудита:** «Мы построили внутренне согласованную систему, но не валидировали её против реального мира».

### Critical complementarity (трёх аудитов)

- **Мой аудит** — defect-level: исправить заявленное поведение
- **Complexity-honesty аудит** — architecture-level: пересмотреть, что мы заявляем
- **Critique аудит** — meta-level: пересмотреть, основано ли всё это на verified premises

**Sequencing:** нельзя рефакторить broken baseline (мой аудит → v0.2.0 fixes). Нельзя architectural refactor на unvalidated premise'ах (critique аудит → validation gate перед v0.3.0). И только после этого Paths C → B → A могут быть выполнены **с обоснованием** или **с repositioning'ом, если validation показал phantom user / no shipping speed advantage**.

---

## Roadmap: v0.2.0 → validation gate → v0.3.0 → v0.5.0

### v0.2.0 — Post-refactor fix wave + quick wins

**Тип SemVer:** PATCH (фиксы) + 1 MINOR-additive (size gate)

**Scope:**

1. **B-1 mode renaming sweep** — закрыть rename `new-feature`/`rework-feature` → `feature`/`rework` во всех ~80% оставшихся template файлах. Python regex script (как в PR #19, AP-12 safe).
2. **B-2 feature-spec.md.tmpl frontmatter** — добавить YAML head с topic / mode / lite-mode / created / spec_approved / plan_approved / acceptance / merged / review_url / pr_ordering / `template_version_applied` / impact-блок.
3. **B-3 feature-review.md.tmpl restore** — восстановить `**Verdict:** approve|request-changes|block` line, заменить orphan `security-reviewer` references на актуальную roster.
4. **B-4 scripts location** — privедение `_templates/scripts/*.tmpl` шапок и protocol § 5.2 / 9.2 к единой конвенции `scripts/` в product (а не `.ai-pm/tooling/scripts/`).
5. **High-1..5** из post-refactor audit (orphan field, meta/ refs, CLAUDE.md Step 1.5, mini-foundation friction).
6. **Size gate на reviewer fan-out** — quick win из complexity-honesty:
   - PR < 100 LOC → только protocol-compliance baseline, без specialized fan-out
   - **Content-aware override:** diff трогает `auth/` / `payments/` / `db/migrations/` / `crypto/` / `*.lock` / security-sensitive paths → fan-out **независимо от размера** (это уже Mitigation 4 из complexity-honesty, реализуется тут как independent quick win)
   - 50-100 LOC правило в `reviewer.md` primary prompt'е + override-paths config

**Out of scope для v0.2.0:**
- Medium findings (concept duplicates) — переезжают в v0.3.0 Path C
- Lazy loading foundational docs — отдельный research-driven PR

**Definition of done:**
- Все Blocking findings закрыты с verification в `meta/reviews/<branch>_review.md`
- Size gate test'ован на ≥2 PR'ах разного размера/содержания
- AP-16 trail verdict line парсится hook'ом без crash'а
- Feature-spec template instantiation на test'овой фиче проходит CI

**Estimate:** 1-2 PR (можно объединить B-1..B-4 в один comprehensive fix PR + отдельный PR для size gate).

**Note:** v0.2.0 fix wave может идти parallel с validation gate ниже — defect fixes correct regardless of framework positioning.

---

### Validation gate — закрытие дыр 1 и 3 (BLOCKING для v0.3.0+)

**Без этого** все architectural решения в v0.3.0..v0.5.0 — теоретические выводы на unvalidated premise'ах. Critique audit Дыры 1 и 3 рейтинга ★★★★★ — подрывают обоснование существования фреймворка как такового.

**Scope:**

1. **Дыра 1 — Outcome data via self-experiment:**
   - Взять 2 одинаковые micro-фичи (например, два simple endpoint'а или два UI компонента — оба сравнимой сложности)
   - Одну реализовать через полный Stage F с фреймворком (spec → plan → coder → reviewer → merge)
   - Вторую — голым чатом с Claude Code без `.ai-pm/` (просто instruction → код → review → commit)
   - Замерить: time to first PR, time to merge, число iteration'ов, quality (bugs caught later в ходе использования), token cost
   - **Decision gate:** если фреймворк не даёт ≥20% improvement на одной из outcome metrics (time / quality / cost) — **repositioning required**. Path A становится «recovery from chat-driven chaos», не «smart SDD»
   - Output: `meta/experiments/2026-XX-XX_framework-vs-bare-chat.md` с numbers + qualitative observations

2. **Дыра 3 — User research validation:**
   - Опросить 5-10 реальных PM-ов (не друзей-разработчиков) из разных компаний
   - Вопрос: «как вы сейчас работаете с AI на технических задачах?»
   - Если доминирующий ответ «прошу разработчика» — phantom user confirmed, asymmetry-pillar irrelevant
   - Если ≥2/10 говорят «хотел бы делать сам, но боюсь» — ниша реальна, может быть узкой
   - **Alternative if PM access ограничен:** honest self-assessment — какие PM-ы реально захотят? Какие признаки в наблюдаемом behaviour'е? Какова вероятность ошибки в premise'е?
   - Output: `meta/research/2026-XX-XX_pm-asymmetry-validation.md`

3. **Дыра 2 — No-framework baseline в competitive-landscape:**
   - Дополнить `meta/audits/2026-05-24_competitive-landscape.md` секцией «No-framework baseline» — самый частый «конкурент» большинства builder'ов
   - Honest delta: наш Layer 0 vs goly chat — что добавляет, что отнимает
   - Это input для Path A repositioning

**Definition of done:**
- Self-experiment проведён, outcome data зафиксирован
- User research проведён или явно honest-assessed как «не возможен сейчас, premise остаётся conditional»
- No-framework baseline в competitive-landscape добавлен
- **Decision:** идём в v0.3.0 как планировалось / repositioning требуется / pivot полностью

**Что меняется в зависимости от outcome:**

| Validation result | Что делать |
|---|---|
| Outcome ≥20% improvement + ≥2/10 PM-ниша подтверждена | v0.3.0 → v0.5.0 как планировалось |
| Outcome <20% improvement | v0.5.0 Path A repositioning меняется радикально — «recovery from chat-driven chaos» или «discipline framework для команд», не «smart SDD» |
| Phantom user confirmed | Asymmetry pillar drop'ается, trust profiles B/C deprecate'ятся, repositioning под «opinionated discipline для solo dev + AI» |
| Оба false | Pivot полностью — возможно фреймворк не нужен в текущем виде |

**Estimate:** 2-3 дня для self-experiment + variable для user research (зависит от доступа к PM-ам).

---

### v0.3.0 — Path C: Stage consolidation

**Pre-condition:** validation gate passed (или явно accepted decision продолжать на conditional premise'ах). Иначе v0.3.0 заблокирован.

**Тип SemVer:** MINOR (additive merges с backwards-compat aliases) или MAJOR (если совсем ломаем существующие имена). Решение зависит от migration cost.

**Scope — 9 merges:**

| Сейчас | После |
|---|---|
| `vision` (A) + `strategic-frame` (B) | `strategic-frame.md` с vision секцией |
| `competitive-analysis` (A) + `positioning` (A) | `positioning.md` с competitive секцией |
| `personas` (A) + `user-journeys` (A) | `audience.md` |
| `brand-voice` (A) + `ui-style-guide-base` (A) | `ui-style-guide-base.md` с brand-voice секцией |
| `legal-frame` (B) + `legal-brief` (B) | `legal.md` (frame + current brief) |
| `threat-model` (B) + `incident-runbook-draft` (B) | `risk-and-response.md` |
| `dependency-policy` (D) + `refactor-playbook` (D) | `maintenance-playbook.md` |
| `stack` + `db_kind` + `database-design-*` (D) | `tech-stack.md` |
| `ai-linting-rules` + `subagent configs` + `protocol overlay` (D) | `development-protocol-overlay.md` |

**Stage reshape:**
- Stage A: 7+ → 3 (`audience` / `positioning` / `ui-style-guide-base`)
- Stage B: 7 → 4 (`strategic-frame` / `risk-and-response` / `legal` / `customer-interview-script`)
- Stage C: **упразднён** (topology fold'ится в Stage D `tech-stack.md`, ADRs остаются reactive AP-1)
- Stage D: 6-8 → 4 (`tech-stack` / `dev-environment` / `maintenance-playbook` / `development-protocol-overlay`)
- Stage E: 12+ checkboxes → **1 checkpoint** (`bootstrap-verify.sh passed`) + granular health-check script

**Total:** ~25 items → ~12 (≈−50% cognitive load + foundational token load).

**Mandatory mitigations (non-skippable per complexity-honesty):**
- **Mitigation 2 — Merged docs prominence:** template'ы для merged docs обязательно содержат TL;DR блок в начале + section-checkboxes в шапке + bold-prompt'ы перед каждой бывшей-отдельной секцией + soft-cap on section length (warning при exceed)
- **Mitigation 3 — Stage E baseline holes:** `bootstrap-verify.sh` (~100 LOC bash) проверяет все 12 текущих пунктов как health-check; в state остаётся 1 tracking checkpoint; verify запускается из `make setup` и CI

**Backwards compat:**
- Migration script для existing template-using проектов (HeartVault, и т.д.) — copy old content в новые merged docs, оставить old files с redirect comment одну MINOR-версию, удалить в следующем MAJOR
- `template-sync` workflow purpose-built для этого migration (Phase 3 documentation migration с verification preserving content — уже реализовано в v0.1.0)

**What NOT to merge (явно):**
- `mvp-scope.md` — независимый lifecycle, часто обновляется при validation
- `customer-interview-script.md` — executable artifact, не reference doc
- `per-kind ui-style-guide-*.md` — conditional activation по `ui_kind`
- ADR files — atomic decisions, AP-1 reactive
- feature-spec / feature-plan / feature-review — per-feature lifecycle

**Definition of done:**
- 9 merges выполнены, old files с redirect comments
- `bootstrap-verify.sh` написан, в CI, на failed verify явно показывает какой пункт упал
- Template instantiation на synthetic test проекте проходит end-to-end Stage A-F
- Migration script test'ован на копии HeartVault state без потерь content (verification report как в template-sync Phase 3)

**Estimate:** 3-5 PR (по группам merge'ев — Stage A merges, Stage B merges, Stage D merges, Stage E checkpoint reduction + verify script, migration script).

---

### v0.4.0 — Path B: Layered minimal mode

**Pre-condition:** v0.3.0 merged + discipline-advisor PoC прошёл accuracy gate (см. ниже Дыра 5 mitigation). Без PoC validation — advisor реализация заблокирована, можно делать только static-quiz floor без smart layer.

**Тип SemVer:** MAJOR (breaking — Stage B становится opt-in, mandatory_foundational_completeness меняется)

**Scope — onion структура:**

| Layer | Что включает | Когда активируется |
|---|---|---|
| **Layer 0 (default)** | Stage F (spec → plan → coder → reviewer), AP-3 / AP-19 / AP-20 enabled, 4 artifacts per feature, protocol-compliance baseline mandatory | Любой новый проект; сопоставимо с BMAD `quick-dev` / OpenSpec |
| **Layer 1 (opt-in)** | + Stage A (`audience.md` + `positioning.md`) | Когда нужна продуктовая ясность |
| **Layer 2 (opt-in)** | + Stage B (Constraints — `strategic-frame` / `risk-and-response` / `legal`) | Когда compliance / threats / SLO становятся релевантны |
| **Layer 3 (opt-in)** | + Stage D полностью (`maintenance-playbook` / расширенный `tech-stack`) | Когда продукт растёт, требуется maintenance discipline |
| **Layer 4 (opt-in)** | + composition matrices, per-kind UI, trust profiles B/C | Когда multi-stack / PM-asymmetric workflow |

**Discipline-core инвариант (irreducible floor):** AP-3 / AP-19 / AP-20 / protocol-compliance baseline / Stage F discipline **всегда mandatory**, независимо от Layer. Это «бренд».

**Mandatory mitigations:**

- **Mitigation 1 — Opt-in trap:** pre-skip quiz перед Layer 2 opt-out:
  - Processes PII?
  - Handles payments / financial data?
  - Stores user-generated content?
  - Subject to GDPR / HIPAA / SOC 2 / иной compliance?
  - Public-facing (internet-reachable)?
  - Multi-tenant?
  - Любой `yes` → Layer 2 becomes mandatory, opt-out недоступен
  - Ответы фиксируются в `bootstrap-state.md` (audit-trail)

- **Hybrid evolution — `discipline-advisor` subagent** (с PoC accuracy gate per Дыра 5):
  - Read-only subagent в `.claude/agents/discipline-advisor.md`
  - **Floor (irreducible deterministic):** hard detection PII / payments / crypto / auth в коде → Layer 2 mandatory без opt-out
  - **Smart layer:** scan кода / deps / manifests / sample файлов → structured advisory с pointer'ами на файл:строка
  - **Bounded scan:** sample (entry points + manifests + 5-10 файлов по эвристике), cached per session, trigger-based (bootstrap entry / layer change / Stage F entry с empty foundations), hard token budget < 10k
  - **Output:** `mandatory: [layer-2]` / `recommended: [...]` / `skip-safe: [...]` — с обоснованием через конкретные pointer'ы
  - Decisions log'аются в `bootstrap-state.md` (advisory-log section)
  - Тесты на false-negative: НЕ должен пропускать `stripe.charges`, sequelize raw queries, hardcoded JWT secrets, ENV `*_SECRET`
  - **PoC accuracy gate (Дыра 5 mitigation):** перед тем как advisor станет mandatory, прогон на 3-5 реальных проектах с известным «correct» Layer selection. Если accuracy < 80% — отказаться от smart layer, оставить static quiz only. Bad advisor recommendations хуже, чем no advisor (false confidence)

- **Layer-climbing mitigation (Дыра 4):**
  - Advisor должен **escalate**, не просто recommend — с увеличивающейся severity со временем
  - Skip'ы имеют **deadline-driven re-prompts** (operator подтвердил skip Stage B 3 месяца назад → заново валидируй; в state file `layer_decisions[].next_reprompt: <date>`)
  - Без этого operators остаются на Layer 0 навсегда, Stages A-E становятся декоративными

**State schema additions:**
```yaml
active_layer: 0 | 1 | 2 | 3 | 4
layer_decisions:
  - layer: 2
    state: skipped | active | mandatory-promoted
    reason: <text>
    advisor_advisory: <ref to advisory-log entry>
    promoted_by: quiz | advisor | operator
advisor_log:
  - timestamp: <iso>
    trigger: bootstrap-entry | layer-change | stage-f-entry
    findings: [...]
```

**Definition of done:**
- 5 layers документированы в protocol § 3
- Pre-skip quiz реализован в `project-bootstrap` agent
- `discipline-advisor` subagent написан и протестирован на false-negative cases
- Layer migration script для existing v0.3.0 state (default `active_layer: 4` — full backwards compat)
- End-to-end test scenarios passed:
  - Solo dev PoC → Layer 0 → ship feature → no quiz triggered, no advisor mandatory finding
  - Payments app → Layer 0 attempted → advisor detects `stripe.charges` → Layer 2 mandatory
  - Legacy adoption Quick auto → advisor scans → recommends Layer 1+2 based on evidence

**Estimate:** 5-8 PR (layers definition / state schema / quiz / advisor agent / advisor floor rules / advisor smart scan / migration script / e2e validation).

---

### v0.5.0 — Path A: README repositioning

**Pre-condition:** validation gate outcome известен. Само repositioning radically зависит от результата — см. таблицу в validation gate.

**Тип SemVer:** PATCH (copy-only)

**Scope (default — если validation passed):**
- README перепозиционирование на «discipline framework для асимметричного PM/dev сотрудничества на compliance-sensitive multi-stack продуктах»
- Self-select аудитории через явный заголовок и opening sections
- Сравнительная таблица с **no-framework baseline + OpenSpec / Ryan Carson / BMAD / Spec Kit** (input из `competitive-landscape.md` + Дыра 2 дополнение)
- Раздел «Когда наш фреймворк — overengineering» (явно говорим, кому идти к OpenSpec / просто чату с Claude)
- Раздел «Когда стоит платить эту complexity» (compliance / multi-stack / PM-asymmetric / audit-trail)
- Layered minimal mode explainer (после v0.4.0 уже на бумаге)
- Token cost transparency (rough estimates per PR size, ссылка на complexity-honesty)

**Scope (alt — если validation showed repositioning needed):**
Перепозиционирование может быть радикально другим (см. таблицу в validation gate). Возможные направления:
- «Recovery from chat-driven chaos» — для тех, кто уже страдает от chaos в bare-chat workflow
- «Opinionated discipline для solo dev + AI» — без PM-asymmetric pillar, если phantom user confirmed
- «Discipline framework для команд» — если validation показала, что для solo тулинг overengineering, но для команд работает

**Definition of done:**
- README прошёл AP-12 grep
- Operator-neutral (AP-17, нет product names)
- Сравнение с альтернативами не маркетинговое — реалистичное self-positioning
- Layered mode объяснён в 3 параграфа максимум

**Estimate:** 1 PR.

---

## Cross-cutting work — дыры 6 и 7 из critique audit

Не отдельный version bump, но должно быть incorporated через все версии.

### Дыра 6 — AP-инварианты как trade-off, не dogma

**Действие:** в `doc/anti-patterns.md` для каждого AP добавить три секции:
- **Зачем введён** — incident / observation, который привёл к нему
- **Когда применим** — default scope
- **Когда НЕ применим** — explicit exceptions с reasoning (e.g. AP-19 не нужен на throwaway prototype'ах; AP-3 add'ит friction на personal weekend project'ах)

**Когда:** инкрементально, parallel с v0.3.0 (Path C затрагивает много AP-aware кода — удобно одновременно).

**Эффект:** brand меняется с «discipline framework» на «opinionated defaults с reasoning». Reduces dogma'тический attack surface. Сохраняет ту же floor для default scope, но явно признаёт contexts, где он лишний.

### Дыра 7 — Timeless vs AI-state-specific decisions

**Действие:** добавить в `doc/development-protocol.md` новый раздел «Timeless invariants vs AI-state-specific decisions»:

**Timeless** (выдержат AI-evolution):
- Operator authority (operator decides, AI recommends)
- Atomicity (one logical change per PR)
- Review discipline (independent verdict-gate before merge)
- PM-asymmetric framing (если validation подтвердит нишу)
- Composition decomposition (multi-stack via matrices)

**AI-state-specific** (deprecate-candidates через 12-18 мес):
- Foundational doc loading per session
- Multi-subagent fan-out architecture
- `.ai-pm/` persistent state files
- Prompt templates с structured artifacts

**Когда:** инкрементально, один section update в `development-protocol.md` parallel с v0.3.0 или v0.4.0.

**Эффект:** framework стратегически защищён — те части, что обесценятся при долгом context'е или memory tool'е, явно маркированы. Когда time'll come — гранулярный rewrite, не полный pivot.

---

## After v0.5.0 — HeartVault first prod-run

После v0.5.0 template считается **готовым к real prod-run'у**. HeartVault получает `template-sync` PR:
- Apply v0.5.0 schema migration (`active_layer` field, merged docs structure)
- Apply documentation migration (template-sync-doc-migrate.py — 5 detection categories)
- Re-run discipline-advisor на HeartVault codebase — sanity check Layer recommendation
- Operator выбирает active_layer based on advisory + own judgment

**HeartVault — first prod-run рефинированной системы.** До этого момента template `ai-pm-protocol` self-applied (development on itself), не на downstream product.

---

## Definition of «framework done»

Framework считается **done для first prod-run'а на HeartVault**, когда:

- [ ] v0.2.0 merged: все Blocking findings закрыты, baseline корректен
- [ ] **Validation gate passed** (или явно accepted решение продолжать на conditional premise'ах): self-experiment проведён, PM-research проведён или honest-assessed, no-framework baseline зафиксирован
- [ ] v0.3.0 merged: Stage consolidation, Stage E checkpoint reduction, mitigation 2/3 реализованы; AP trade-off documentation начата (дыра 6)
- [ ] v0.4.0 merged: 5 layers, pre-skip quiz, discipline-advisor PoC прошёл accuracy gate ≥80% (или fallback static-quiz only), state schema additions, layer-climbing escalation (дыра 4)
- [ ] v0.5.0 merged: README repositioning (default или alt в зависимости от validation outcome); no-framework baseline в comparison (дыра 2)
- [ ] Timeless vs AI-state-specific section в development-protocol.md (дыра 7)
- [ ] HeartVault `template-sync` PR проходит без потери content (verification report green)

После того как все 5 пунктов закрыты — task #16 (HeartVault wipe-and-rebootstrap) считается **реально done** (на текущий момент marked completed, но это было до текущей mode matrix).

---

## Что НЕ делаем в этом roadmap'е

- **AP invariants не трогаем** (AP-1..AP-22 numbering, AP-3 operator-gate, AP-19 atomicity). Это бренд discipline.
- **Per-PR atomicity не релакcируем ради token экономии.** Re-load overhead — это симптом missing caching, не аргумент против атомарности.
- **Protocol-compliance baseline не убираем.** Дешёвый и ловит то, что больше никто не ловит.
- **Tier framework не трогаем.** Pay-for-what-you-use, уже работает корректно.
- **5 modes не трогаем.** Pay-for-what-you-use, работает корректно (после v0.2.0 fix B-1).

---

## Open questions (требуют PM decision до старта реализации)

1. **v0.2.0 size gate** — quick win сейчас, или ждёт Mitigation 4 в v0.3.0? Рекомендация: **сейчас**, token bill bleeding now.

2. **v0.3.0 SemVer** — MINOR с backwards-compat aliases (старые file names redirect на новые), или MAJOR с hard break? Рекомендация: **MINOR с redirect одну версию**, MAJOR при v0.4.0 hard break.

3. **v0.4.0 default `active_layer`** — Layer 0 (minimal default, новые проекты в minimum) или Layer 4 (current behavior preserved)? Рекомендация: **Layer 0 для новых проектов**, Layer 4 backwards-compat для existing state без `active_layer` поля.

4. **discipline-advisor cost ceiling** — < 10k tokens per advisory session приемлемо, или нужен tighter? Рекомендация: 10k начальный budget, после первых prod-run'ов калибровать.

5. **HeartVault timing** — apply на v0.4.0 (раньше = больше bleed effect, layered mode validated раньше) или ждём v0.5.0 (full polish)? Рекомендация: **v0.4.0** (architecture validated там, v0.5.0 — только copy).

---

## Stale tasks cleanup (отдельный PR до v0.2.0)

Перед стартом v0.2.0:
- Close #48 (template-apply mode) — done в PR #22-#25
- Close #56 (Mode 5 legacy-partial) — done в PR #22-#25
- Close #57 (README modes section) — done в PR #21+
- Close #55 (second audit pass) — done, отчёт в `meta/audits/2026-05-25_post-refactor-second-pass.md`

---

## Versioning summary

| Version | Тип | Scope | Estimate |
|---|---|---|---|
| **v0.1.0** | initial | current state | — |
| **v0.2.0** | PATCH + MINOR | Fix wave B-1..B-4 + High findings + size gate quick win | 1-2 PR |
| **Validation gate** | — | Self-experiment + PM research + no-framework baseline; BLOCKING для v0.3.0+ | 2-3 дня + variable |
| **v0.3.0** | MINOR | Path C: Stage consolidation + bootstrap-verify.sh + merged docs templates; AP trade-off docs (дыра 6) | 3-5 PR |
| **v0.4.0** | MAJOR | Path B: 5 layers + pre-skip quiz + discipline-advisor (с PoC accuracy gate) + layer-climbing escalation (дыра 4) | 5-8 PR + PoC validation |
| **v0.5.0** | PATCH | Path A: README repositioning (default / alt в зависимости от validation outcome); no-framework baseline (дыра 2); timeless vs AI-state-specific (дыра 7) | 1-2 PR |
| **HeartVault** | — | First prod-run рефинированной системы через template-sync | 1 PR (downstream) |
