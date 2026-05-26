# Architectural backlog

Накопленные architectural issues которые требуют отдельного рассмотрения. Каждый — потенциальная feature/fix. Размещены здесь чтобы не плодить draft-ветки на каждый, и чтобы было visible during planning sessions «что у нас в долгу».

**Status legend:**
- 🔴 critical — нарушение fundamental promise шаблона
- 🟡 important — реальная боль operator'а
- 🟢 nice-to-have — incremental improvement

**Lifecycle:** entry создаётся → если поднят на priority → отдельная feature spec → merge → entry retire'ится.

---

## ✅ ARCH-1: AP-20 описывает routing pattern которого Claude Code не поддерживает — RESOLVED v0.7.0

**Resolution:** `agent-consolidation` feature (v0.7.0) — 5 specialized reviewer файлов inlined в `reviewer.md` как sections («## Mandatory baseline» + 4 «### Domain» subsections). AP-20 text rewritten под honest «inline sequential pass with explicit domain labels» pattern. Никакого nested spawn'а не требуется — single agent applies relevant sections inline.

**Closed by:** PR feature/agent-consolidation, 2026-05-26.

---

## 🟡 ARCH-2: AP retirement / consolidation mechanism

**Симптом:** 26 active APs, catalogue grows monotonically. Layer 2 cross-doc-bounded добавит ещё 4 (AP-27..AP-30). Через год — 50+ APs. Catalogue становится unmanageable для cognitive load и для bedroom maintenance.

**Что нужно:** lifecycle state в каждом AP entry:
- `status: active` (default)
- `status: superseded-by-AP-N` (more general AP replaces)
- `status: historical` (kept для context, не enforce'ится)
- `status: promoted-to-protocol` (moved в development-protocol как principle)

Линтер показывает only `active` в default view. Раз в N итераций — operator-touched review «эти APs не fired 10+ features, retire?».

**Effort:** small (status field + linter update + review ritual doc).
**Priority:** до того как catalogue превысит 30 entries.

---

## 🟡 ARCH-3: Vision-as-living-doc

**Симптом:** `vision.md` пишется в Stage A, дальше не обновляется. Real product vision эволюционирует от feature к feature. Текущий шаблон — waterfall замаскированный под iterative.

**Что нужно:** ритуал «after each Stage E merge → operator reads vision.md → 1-sentence update if anything shifted». Frontmatter поле `last_iteration: YYYY-MM-DD`. Reviewer flagирует если vision не trogан 30+ дней при active development.

**Effort:** small. Ритуал + reminder в reviewer trail format.
**Priority:** не блокирует ничего, но накапливается tech debt от vision drift'а.

---

## 🟡 ARCH-4: Operator-touch reduction (selective)

**Симптом:** Operator-gate at every transition → operator = critical path bottleneck. Если PM unavailable — workflow stalls. Multiplied burden vs «PM doesn't read code» promise.

**Что нужно:** auto-promotion paths для specific cases:
- Stage A → B: если deterministic scripts (security-floor + spec-discipline) confirm all artifacts pass quality threshold → auto-promote (operator can revert). Раньше предлагался discipline-advisor для этого checkpoint'а, но advisor retired в v0.7.0.
- spec → plan: если `lite-mode: small-fix` + spec passes linter → planner auto-invoke
- merge non-critical: docs/chore PR с green CI → auto-merge (opt-in per domain)

**Risk:** теряем control в edge cases. Mitigation — explicit opt-in flag в bootstrap-state, default off, granular per stage.

**Effort:** medium. Update bootstrap-agent + linter + CI workflow.
**Priority:** delicate — нужны empirical data сначала (ARCH-5 helps).

---

## 🟢 ARCH-5: Honest measurement / metrics

**Симптом:** нет empirical data «куда уходит operator-time». Все discussions про bottleneck — speculative. Без metrics — не знаем что реально оптимизировать.

**Что нужно:** automatic session metrics в frontmatter:
- `feature_started: <timestamp>` (когда spec.md создан)
- `feature_merged: <timestamp>` (когда PR merged)
- `operator_touches: <count>` (approve markers + AskUserQuestion responses)
- `wait_for_operator_hours: <number>` (estimated)
- `ai_active_hours: <number>` (estimated)

Через 10-20 features → visible patterns где bottleneck. Информирует ARCH-4 (где safe auto-promote'ить).

**Effort:** medium. Bootstrap-agent + reviewer-agent track + summary report при release-helper'е.
**Priority:** prerequisite для evidence-based ARCH-4 decisions.

---

## 🟢 ARCH-6: Prompt economy F (Trust profile verbosity audit) — уточнение направления

Уже captured в `feature/prompt-economy` (PR-6 of 6). Дополнительная заметка после live observations:

**Текущее поведение:** Trust profile A learning layer ON by default → reviewer пишет 138 LOC review markdown для скромного PR.

**Желаемое:** verbose-by-trigger, не verbose-by-default. Triggers:
- New AP detected (architectural finding worth teaching)
- Cross-domain finding (PM учится новой области)
- New foundational invariant impacted
- Substantial architectural decision (ADR-level)

**Default terse:** для confirmation tasks, routine review pass'ов, regression checks.

**Effort:** medium (behavioral rule в каждом agent prompt'е).
**Priority:** часть prompt-economy queue.

---

## Прочее (TODO captured here)

- **ARCH-7:** Spec template lite-mode разные уровни — для bugfix / small-fix / new-foundational-feature должны быть **разные** spec skeletons, не один на все. Сейчас feature-spec.md.tmpl универсальный → overhead для маленьких fix'ов. (Note: `c-fast` lite-mode variant removed в v0.7.0 — был для Trust profile C, теперь deprecated.)

- ~~**ARCH-8:** `discipline-advisor` opt-in PoC promotion → mandatory.~~ **RESOLVED v0.7.0:** advisor retired в `agent-consolidation` feature. Accuracy gate ≥80% per axis never measured (никаких empirical data). Hard floor функциональность перенесена в `scripts/check-security-floor.sh` (deterministic, не LLM heuristic); reprompt mechanism — в `scripts/check-skip-reprompts.sh`. Soft 5-axis recommendations dropped as never-validated speculation.

- **ARCH-9:** Adoption_overrides expiry mechanism. Operator declares trade-off (AP-22), но override никогда не reviewed после. Аналогично skip_decisions — 90 day reprompt, но для overrides.

- **ARCH-10:** Cross-stack hybrid product complexity (ui_kind multi-value) — composition matrices работают, но real testing на complex hybrid'е (web+backend+native-mobile одного продукта) не проводился. Edge cases в template-sync для multi-kind не покрыты.

---

## Текущий queue (ordered by priority)

| Branch / PR | Status | Effort |
|---|---|---|
| `fix/protocol-minors-2026-05-25` | reviewer running | small |
| `feature/prompt-economy` (D first) | approved, awaiting planner | medium per PR × 6 |
| `feature/cross-doc-bounded` | approved, awaiting planner | medium |
| `feature/solo-pm-fast-track` | draft, awaiting approve | medium |
| **ARCH-1** AP-20 honest rewrite | TODO, blocks ARCH-2 | small |
| **ARCH-2** AP retirement | TODO | small |
| **ARCH-3** Vision-as-living | TODO | small |
| **ARCH-4** Operator-touch reduction | TODO (after ARCH-5) | medium |
| **ARCH-5** Metrics tracking | TODO | medium |
| **ARCH-6** Verbosity audit (= prompt-economy F) | already in queue | medium |
| **ARCH-7..10** | captured, not prioritized | varies |
