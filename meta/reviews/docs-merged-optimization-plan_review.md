# Review — `2026-05-25_merged-optimization-plan.md` (v3)

**Reviewer:** independent pass against source audits.  
**Branch:** `docs/merged-optimization-plan`  
**File reviewed:** `meta/design/2026-05-25_merged-optimization-plan.md` (540 LOC)  
**Sources cross-checked:** `complexity-honesty.md`, `competitive-landscape.md`, `critique-and-blindspots.md`, `silent-break-gaps.md`, `first-prod-run-feedback.md`.

---

## Verdict

**Approve with required changes.** Структура plan'а правильная, traceability отличная, priorities обоснованные. **2 blocking** findings (confidentiality + AP collision), несколько concerning'ов про scope/measurement tightening.

После закрытия blocking'ов и переоценки v0.2.0 scope — готов к execution.

---

## Findings

### [blocking-1] Confidentiality leak — downstream project mentioned by name

**Где:** plan содержит explicit упоминания имени downstream продукта (см. разделы «After v0.5.0», «Acceptance criteria», и др.).

**Проблема:** downstream project — closed/private. Plan — публично shareable artifact в template repo. Утечка имени = breach confidentiality.

**Required:**
- Sanitize все упоминания downstream project по имени → заменить на нейтральные термины («downstream prod-run», «first real prod-run target»).
- Тот же sanitization apply к acceptance criteria и migration script references.
- Cross-check `first-prod-run-feedback.md` audit (commit 4d27782) на возможные residual references.

**Reference standard:** `first-prod-run-feedback.md` audit уже sanitized correctly (см. commit message «Sanitized feedback»). Тот же стандарт apply к plan'у.

---

### [blocking-2] AP-24 vs AP-1 — relationship not specified

**Где:** Scope C (раздел «AP-1 enforcement (new P0 от live test)»).

**Проблема:**
- AP-1 = **reactive ADR** при architectural fork detection (proactive trigger в planner-agent).
- AP-24 = **retroactive ADR extraction** когда spec section > 30/50 LOC architectural content.

Это **два разных enforcement mechanism'а** для одной цели (decision capture). Plan не показывает:
- Как они работают **вместе** (что если AP-1 fired, ADR создан, но spec всё ещё содержит детали? AP-24 ругается на legitimate spec content?).
- Где **boundary** — какие decisions через AP-1 (early), какие через AP-24 (late catch).
- Какой precedence — если AP-1 уже создал ADR с reference, AP-24 должен принимать spec section как OK даже если > 50 LOC.

**Required:**
- В `anti-patterns.md` для AP-24 явно прописать relationship с AP-1.
- Heuristic для разграничения: AP-1 для **architectural forks** (выбор между альтернативами), AP-24 для **decision documentation** (фиксация constraints).
- Test fixture, который проверяет оба сценария: (a) AP-1 fired → AP-24 quiet, (b) AP-1 missed → AP-24 catches.

---

### [concerning-1] v0.2.0 scope под-оценён

**Где:** «Estimate: 2-3 PR» для v0.2.0.

**Проблема:** scope содержит:
- B-1..B-4 + High-1..5 (post-refactor defects)
- 3 silent-break gaps (каждый — semgrep / linter / new AP / template changes)
- AP-24 (new AP + new linter check + test fixtures)
- Size gate + content-aware override

Реалистично это **5-7 PR**, не 2-3. Gap 2 alone (semgrep weakening detection + AP-23) — не trivial.

**Required:**
- Пересмотреть estimate до 5-7 PR.
- Или explicitly split v0.2.0 на v0.2.0 (defects + 1-2 gaps) и v0.2.1 (remaining gaps + AP-24).
- Decision: lump together or split?

---

### [concerning-2] PoC accuracy gate ≥80% — не measurable как сформулировано

**Где:** v0.4.0 «PoC accuracy gate (Дыра 5 critique)».

**Проблема:** «**Минимальный bar: ≥80% accuracy per axis**» — но не определено:
- **Test set source:** synthetic? 3-5 реальных проектов? Откуда «ground truth»?
- **Что = correct/incorrect classification:** advisor recommends skip = correct если артефакт реально не нужен, но **по чьему мнению**? Operator-judged? Pre-labelled?
- **Measurement protocol:** оценка blind или с context? Кто labels?

Без этого gate декоративен — можно объявить «80% passed» без verifiable evidence.

**Required:**
- Перед v0.4.0 PoC: **define test set** (синтетические + реальные кейсы, ~10-15 проектов разной size/domain).
- **Define labelling rubric** (что считается correct skip/keep recommendation per axis).
- **Define measurement protocol** (operator-judged blind comparison vs advisor output).
- Output: `meta/experiments/<date>_advisor-accuracy-protocol.md` ДО запуска PoC.

---

### [concerning-3] Test fudging detection через semgrep — possibly fragile

**Где:** v0.2.0 Scope B, Gap 2.

**Проблема:** semgrep custom rule для detection `toBe(X)` → `toBeGreaterThan(Y<X)` требует:
- Metavariable comparison с numeric resolution.
- Сравнение **before/after** в diff context.

Semgrep это может, но fragile к синтаксическим вариациям (`expect`, `assertEquals`, `assert.equal`, и др. per стек). False negative rate потенциально высокий.

**Alternative простой:** «tests changed в одном PR с production-кодом без declared ADR» — easier detection через git diff overlap analysis. Менее precise (не ловит weakening если только тесты меняются), но more robust и easier multi-stack.

**Required:**
- Decision: semgrep-based fine-grained detection (точно, fragile) или git-diff-based coarse detection (robust, упускает test-only weakening)?
- Recommendation: **start with coarse (git diff) для baseline coverage**, добавить semgrep для specific patterns позже как enhancement.

---

### [concerning-4] Validation gate как PR-gate — soft/hard не определён

**Где:** «Validation gate (между v0.2.0 и v0.3.0)».

**Проблема:** «Pre-condition для v0.3.0+» — но **что блокирует** merge v0.3.0 если gap closure не verified?
- Soft gate: «должно быть сделано» — но v0.3.0 PR'ы могут merge'иться без блокировки.
- Hard gate: «без passing validation document — block v0.3.0 PR'ы».

Plan не указывает. Это влияет на dispute resolution.

**Required:** specify gate-type. Recommendation: **hard gate** — `meta/experiments/<date>_silent-break-prevention.md` должен существовать в main перед merge первого v0.3.0 PR'а.

---

### [concerning-5] v0.4.0 MAJOR — оправдан или MINOR достаточно?

**Где:** v0.4.0 SemVer designation.

**Проблема:** plan говорит MAJOR, но большинство изменений additive:
- `skip_eligibility` metadata — новый field, default `required` сохраняет old behaviour.
- Advisor agent — новый opt-in subagent.
- Presets — `full` default = текущее поведение.

State schema additions с sensible defaults обычно MINOR (additive). MAJOR требуется только если что-то **breaks** существующий workflow.

**Required:**
- Identify **specific breaking changes** в v0.4.0 (не «schema additions» в общем — конкретно что ломается без operator intervention).
- Если ничего реально не breaks → MINOR с migration guide.
- Если что-то breaks → list explicitly в plan.

---

### [concerning-6] Skip eligibility table содержит post-merge артефакты

**Где:** v0.4.0 Skip eligibility table.

**Проблема:** table mixes pre-merge (`competitive-analysis`, `brand-voice`) и post-merge (`positioning.md`, `legal.md`, `tech-stack.md`, `maintenance-playbook.md`) имена. Confusing для reader, который reads pre-v0.3.0.

**Required:**
- Note в начале table: «After v0.3.0 merges — pre-merge артефакты резолвятся в post-merge через redirect».
- Или две колонки: «pre-v0.3.0 name» / «post-v0.3.0 name».

---

### [missing-1] AP-23 detailed spec отсутствует

**Где:** v0.2.0 Scope B mentions «Новый AP-23: Test assertion weakened без declared behaviour change».

**Проблема:** другие AP в `anti-patterns.md` написаны как ~50-100 LOC секции с **Что нельзя / Почему / Как поступать вместо**. AP-23 упомянут только заголовком.

**Required:** в v0.2.0 PR — full AP-23 section в `anti-patterns.md` следуя формату existing AP'ов. Draft в plan'е или ссылка на template.

---

### [missing-2] Risk register / rollback strategy для v0.4.0 MAJOR

**Где:** v0.4.0.

**Проблема:** breaking change без explicit risk register и rollback plan. Если downstream consumer'ы упрутся в migration pain — нет structured response.

**Required:**
- Risk register: топ-5 потенциальных проблем в v0.4.0 + mitigation.
- Rollback strategy: что делать, если downstream apply v0.4.0 → broken state. Минимум: `git revert template-sync PR` и описанный fallback workflow.

---

### [missing-3] Communication plan для MAJOR bump

**Где:** v0.4.0 release.

**Проблема:** plan упоминает CHANGELOG (стандартный поток), но MAJOR-bump требует:
- Migration guide для downstream consumers.
- Deprecation timeline (если что-то deprecating).
- Announcement / notice (если есть subscriber'ы).

**Required:** короткий communication plan section в v0.4.0 deliverables.

---

### [missing-4] Downstream re-test feedback loop после v0.4.0

**Где:** «After v0.5.0 — first prod-run».

**Проблема:** downstream `template-sync` PR применяется **после** v0.5.0. Но v0.4.0 — MAJOR с advisor + skip_eligibility — biggest risk. Что если template-sync применился, downstream стало хуже (advisor неправильно рекомендовал skip critical)?

No checkpoint mentioned для **rollback или iterate**.

**Required:** feedback loop в acceptance criteria — после template-sync PR в downstream, **2-week observation period** с metrics (сколько advisor recommendations operator overridе'нул, сколько skip'ов later reactivated, что не сработало). Output в `meta/audits/<date>_post-sync-feedback.md`.

---

## Strong points

Эти решения в plan'е — правильные, оставлять как есть:

- **AP-24 introduction** — addresses proven gap, не теория. Right call.
- **Lazy foundational loading в v0.3.0** — direct fix observed context-overflow pattern.
- **Same-axis merge criterion** — prevents dimensional collapse trap from earlier critique.
- **Layer model → conditional skip + presets** — соответствует «любой шаг можно skip с комментарием» feedback.
- **6 dimensions including Learning** — захватывает «PM растёт» theme, отличает от vibecoding'а.
- **Pain mapping table в README (центральная часть)** — operator-facing формат symmetric value prop'а.
- **PoC accuracy gate** before advisor mandatory — closes vaporware risk (concept correct, measurement protocol требует определения).
- **Validation gate с self-experiment**, не market research — pragmatic для solo-builder context.
- **Trust profiles как symmetric pair** — accurate framing, не asymmetric.
- **Что НЕ делаем list** — saves future arguments about scope creep.
- **Timeless vs AI-state-specific** section — addresses long-term obsolescence risk.

---

## Concrete actions для plan author'а

**Перед merge plan'а в main:**

1. **Sanitize all downstream project references** (blocking-1).
2. **Specify AP-24 ↔ AP-1 relationship** в plan body (blocking-2).
3. **Re-estimate v0.2.0** до 5-7 PR или split (concerning-1).
4. **Specify validation gate как hard или soft** (concerning-4).
5. **Decision на v0.4.0 MAJOR vs MINOR** (concerning-5) — list specific breaking changes или downgrade.

**Перед v0.2.0 execution:**

6. AP-23 detailed spec draft (missing-1).
7. Decision Gap 2: semgrep-fine vs git-diff-coarse (concerning-3).

**Перед v0.4.0 execution:**

8. Advisor accuracy protocol document (concerning-2).
9. Risk register + rollback strategy (missing-2).
10. Communication plan (missing-3).
11. Post-sync feedback loop в acceptance criteria (missing-4).
12. Skip eligibility table reformatted с pre/post merge clarity (concerning-6).

---

## Net call

Plan **soundly traceable** к audits, **priorities верные** (gaps → C → advisor → A), **frameworks правильные** (same-axis merges, conditional skip, 6 dimensions).

**Главные риски:** under-scoped v0.2.0, vague measurement в PoC accuracy gate, confidentiality leak — все исправимы tightening'ом, не дизайн-проблемы.

**Approve after blocking findings closed.** Concerning findings — fix перед execution соответствующих версий, не блокируют merge plan'а как design.
