---
topic: remove-developer-from-template
mode: feature
lite-mode: no
created: 2026-05-26
spec_approved: 2026-05-26
plan_approved: 2026-05-26
acceptance: pending
merged: no
review_url:
pr_ordering: null
template_version_applied: v0.6.0
spec_reference: doc/development-protocol.md
legal_impact: no
interview_impact: no
incident_impact: no
journey_impact: no
threat_impact: no
scope_impact: yes
topology_impact: yes
---

# Сузить ЦА до PM-only (developer убирается до validation)

**Stage E artifact, Step 1.** Status: draft.

## Контекст

Real-world signal: «ЦА — ТОЛЬКО PM не смотрящий код. Developer'а добавим позже когда заработает кейс с PM-мом.»

Шаблон сейчас обслуживает 2 personas (Trust profile A — PM, B — cross-stack dev, C — full-stack pro). Это **рассеивает фокус**:
- Prompts'ы агентов содержат «if Trust profile A then verbose with learning layer; if B then mixed; if C then terse» — overhead
- README продаёт «двунаправленное обучение PM↔Developer» — это маркетинг который дилютирует core message
- Lite-mode `c-fast` — для Trust profile C, который теперь out of scope
- Bootstrap-agent спрашивает Trust profile — лишний вопрос
- Spec template включает scenarios для разных профилей

**Решение:** убрать Developer-related complexity из шаблона **полностью**. PM (Trust profile A) — единственная supported persona. Trust profile B/C / lite-mode c-fast — deprecated.

Developer добавится **позже**, когда PM-кейс empirically работает. Это не отказ — это **focus**.

## Что меняется

### In scope (комплексный сlean-up)

1. **`.claude/agents/*.md`** (все 11 файлов):
   - Удалить условные ветки «if Trust profile B... if Trust profile C...»
   - Default verbose with learning layer (Trust profile A) — единственный mode
   - Удалить lite-mode `c-fast` references

2. **`doc/_templates/CLAUDE.md.tmpl`**:
   - Trust profile секция убирается
   - Lite-mode иерархия упрощается: `bugfix` / `small-fix` (без `c-fast`)
   - Brand voice: «PM-first protocol»

3. **`doc/_templates/feature-spec.md.tmpl`**:
   - Trust profile selector в frontmatter убирается
   - Lite-mode value `c-fast` removed

4. **`doc/_templates/bootstrap-state.md.tmpl`**:
   - Trust profile field удаляется (или фиксируется `trust_profile: A` default)
   - `advisor_preset` теперь default `standard` (вместо varies by profile)

5. **`doc/_templates/CLAUDE.md.tmpl`** + **bootstrap-agent**:
   - Bootstrap interview не спрашивает Trust profile (auto-set A)

6. **`README.md`**:
   - «Двусторонняя ниша PM↔dev» секция убирается
   - «PM/Developer table» упрощается до «PM (не код) — единственная supported persona»
   - Honest disclaimer «Developer support coming after PM case validates»
   - Drop «twoway learning» messaging

7. **`doc/development-protocol.md`**:
   - § Trust profile упрощается до «A — единственный mode»
   - § Lite-mode иерархия пересмотрена
   - § Personas (если есть) — single PM persona

8. **`doc/anti-patterns.md`**:
   - AP'ы которые ссылаются на multiple Trust profiles обновляются
   - Removed: AP'ы которые specifically про Trust profile B/C edge cases (если есть)

9. **`doc/personas.md`** (Stage A own):
   - Drop developer persona
   - PM persona expanded

10. **`doc/user-journeys.md`**:
    - Drop developer journey
    - PM journey стандарт

11. **Scripts**:
    - `check-spec-discipline.sh.tmpl` — remove Trust profile-conditional checks
    - Other scripts — review for Trust profile references

12. **Templates под per-kind**:
    - `ui-style-guide-*` — review for «developer-facing» content (нет, эти про end-user UX)
    - `database-design-*` — review for Trust profile assumptions

### Out of scope

- Auto-migration для existing product repos с Trust profile B/C — leave as-is, не breaking
- Developer persona spec для future re-add — не пишем сейчас (когда добавим, новой фичей)
- Воссоздание lite-mode иерархии — оставляем `bugfix` / `small-fix`, `c-fast` просто гасится

## Что НЕ меняется

- **Operator-gate discipline** (AP-3) — остаётся
- **Source-bounded contract** — остаётся
- **5-layer enforcement** — остаётся
- **AP catalogue** — структурно та же
- **5 stages workflow** — те же
- **Spec/plan/review files** — те же

Это **focus simplification**, не functional removal.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Existing product repos в Trust profile B/C сломаются на template-sync | Medium | Medium | Backward compat: Trust profile B/C value в frontmatter accepted as A. Honest deprecation note в CHANGELOG. |
| README rewrite loses something important from Developer narrative | Low | Low | Branch preserves git history, can revisit |
| Developer audience feels rejected | N/A | Marketing | Honest «coming after PM case validates» disclaimer. We're not abandoning — we're focusing. |

## NFR

- **No functional regression** для PM workflow
- **README readability** improves (single ЦА clearer)
- **Agent prompts** уменьшаются в LOC (no conditional branches) — этот winn aligns с prompt-economy
- **Bootstrap interview** короче (один меньше вопрос)

## User stories

- **As solo PM**, я хочу что шаблон **обращается ко мне** напрямую, не через split persona маркетинг, so that я понимаю что он для меня
- **As template maintainer**, я хочу focused codebase где нет conditional branches на разные personas, so that maintenance простой
- **As future developer-user** (re-adding позже), я хочу clear path как добавить мою persona без ломки PM workflow

## Open questions

1. **Trust profile frontmatter field** — оставить с auto-default `A` или удалить полностью? Recommend оставить с auto-default — позволит позже re-add B/C без schema break.
2. **`c-fast` lite-mode** — graceful deprecation (warning) или hard removal? Recommend hard removal — никаких existing legit users в нашей знании.
3. **README rewrite scope** — full rewrite или incremental edit? Recommend incremental — preserve audit trail of what changed.
4. **Personas.md** в template'е (Stage A own) — оставить developer persona historical / переписать всё? Recommend переписать — это **наш собственный** Stage A документ, должен reflect actual ЦА.

## Recommendation

**Делать сразу, перед operator-as-idea-provider** — то is interface redesign требующий **clean** baseline. Если interface redesign делать на codebase с Trust profile B/C scaffolding — двойная работа.

Effort medium — touches много файлов, но каждое изменение мелкое (delete conditional branches, simplify single-persona).

Связь с queue:
- **prompt-economy D** (в работе сейчас) — independent, может merge
- **prompt-economy A** (extract source-bounded) — после remove-developer (один меньше conditional)
- **prompt-economy F** (Trust profile verbosity audit) — **может быть absorbed** этой фичей (Trust profile A always verbose-by-trigger remains, но удаляется conditional logic для B/C)
- **solo-pm-fast-track** — после remove-developer (узким focus'ом проще)
- **operator-as-idea-provider** — после remove-developer (clean PM-only baseline)
- **cross-doc-bounded** — independent

После merge — empirical validate на новой starter session: «PM запускает в новом продукте, видит ясный onboarding без Developer noise».
