# Merged optimization plan: complexity reduction + post-refactor fixes

**Дата:** 2026-05-25
**Scope:** интервенции в template `ai-pm-protocol` от v0.2.0 до v0.5.0
**Входы:**
- `meta/audits/2026-05-25_post-refactor-second-pass.md` — defect findings (мой audit)
- `meta/audits/2026-05-24_complexity-honesty.md` — архитектурный refactor (внешний audit)
- `meta/audits/2026-05-24_competitive-landscape.md` — supporting input для Path A
- `meta/design/2026-05-24_mode-matrix-and-adoption.md` — baseline текущей architecture (v0.1.0)

**Принцип:** не рефакторить broken baseline. Сначала фиксы (v0.2.0), затем consolidation (v0.3.0), затем layered minimal mode (v0.4.0), затем repositioning (v0.5.0). After v0.5.0 — first prod-run на HeartVault.

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

### Critical complementarity

- Мой аудит — defect-level: исправить заявленное поведение
- Внешний аудит — architecture-level: пересмотреть, что мы заявляем

**Нельзя рефакторить broken baseline.** Поэтому фиксы сначала.

---

## Roadmap: v0.2.0 → v0.5.0

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

---

### v0.3.0 — Path C: Stage consolidation

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

- **Hybrid evolution — `discipline-advisor` subagent:**
  - Read-only subagent в `.claude/agents/discipline-advisor.md`
  - **Floor (irreducible deterministic):** hard detection PII / payments / crypto / auth в коде → Layer 2 mandatory без opt-out
  - **Smart layer:** scan кода / deps / manifests / sample файлов → structured advisory с pointer'ами на файл:строка
  - **Bounded scan:** sample (entry points + manifests + 5-10 файлов по эвристике), cached per session, trigger-based (bootstrap entry / layer change / Stage F entry с empty foundations), hard token budget < 10k
  - **Output:** `mandatory: [layer-2]` / `recommended: [...]` / `skip-safe: [...]` — с обоснованием через конкретные pointer'ы
  - Decisions log'аются в `bootstrap-state.md` (advisory-log section)
  - Тесты на false-negative: НЕ должен пропускать `stripe.charges`, sequelize raw queries, hardcoded JWT secrets, ENV `*_SECRET`

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

**Тип SemVer:** PATCH (copy-only)

**Scope:**
- README перепозиционирование на «discipline framework для асимметричного PM/dev сотрудничества на compliance-sensitive multi-stack продуктах»
- Self-select аудитории через явный заголовок и opening sections
- Сравнительная таблица с OpenSpec / Ryan Carson / BMAD / Spec Kit (input из `competitive-landscape.md`)
- Раздел «Когда наш фреймворк — overengineering» (явно говорим, кому идти к OpenSpec)
- Раздел «Когда стоит платить эту complexity» (compliance / multi-stack / PM-asymmetric / audit-trail)
- Layered minimal mode explainer (после v0.4.0 уже на бумаге)
- Token cost transparency (rough estimates per PR size, ссылка на complexity-honesty)

**Definition of done:**
- README прошёл AP-12 grep
- Operator-neutral (AP-17, нет product names)
- Сравнение с альтернативами не маркетинговое — реалистичное self-positioning
- Layered mode объяснён в 3 параграфа максимум

**Estimate:** 1 PR.

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
- [ ] v0.3.0 merged: Stage consolidation, Stage E checkpoint reduction, mitigation 2/3 реализованы
- [ ] v0.4.0 merged: 5 layers, pre-skip quiz, discipline-advisor (floor + smart), state schema additions
- [ ] v0.5.0 merged: README repositioning
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
| **v0.3.0** | MINOR | Path C: Stage consolidation + bootstrap-verify.sh + merged docs templates | 3-5 PR |
| **v0.4.0** | MAJOR | Path B: 5 layers + pre-skip quiz + discipline-advisor | 5-8 PR |
| **v0.5.0** | PATCH | Path A: README repositioning | 1 PR |
| **HeartVault** | — | First prod-run рефинированной системы через template-sync | 1 PR (downstream) |
