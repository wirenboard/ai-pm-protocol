---
topic: operator-as-idea-provider
mode: feature
lite-mode: no
created: 2026-05-27
spec_approved: 2026-05-27
plan_approved: 2026-05-27
acceptance: pending
merged: no
review_url:
pr_ordering: null
template_version_applied: v0.6.0
spec_reference: doc/features/operator-as-idea-provider_spec.md
legal_impact: no
interview_impact: no
incident_impact: no
journey_impact: no
threat_impact: no
scope_impact: yes
topology_impact: yes
---

# Operator-as-idea-provider — implementation plan

**Stage E artifact, Step 2.** Single-domain template changes — расширяем существующие prompts, добавляем один AP, один pointer файл, один linter check, одну regression fixture.

---

## Operator decisions (2026-05-27) — pre-coder resolutions

| # | Question | Decision |
|---|---|---|
| Q1 | 5 vs 6 pairs в `operator-facing-examples.md` | **5 pairs** финально (5 logical agents: planner / coder / reviewer / release-helper / project-bootstrap). Spec acceptance criterion 5 обновлён. |
| Q2 | `check-spec-discipline.sh --regression` runner существует? | **Exists** (добавлен в PR #71). Worktree rebased на main — false alarm снят. Step 8 использует существующий `--regression`. |
| Q3 | Verbose mode opt-out (PM хочет видеть Tactical) | **Defer** — не имплементируем в этом PR. |
| Q4 | Block detection convention (HTML marker vs heuristic) | **Heuristic на known headers** (`## Summary для оператора`, `## Output handoff`, `## Краткое резюме`). Warning-only, false-negative tolerable. |
| Q5 | Reviewer behaviour для AP-32 (passive vs active) | **Passive** — linter warning surfaces в `_review.md` как обычный finding. Reviewer не делает active jargon-hunt. |

---

## Plan summary

- В `development-protocol.md` добавляем единую секцию `## Operator interface model` — three-level architecture + 6 escalation triggers + 6 plain-language rules. Это **источник правды** для всех agent prompts (избегаем дублирования контента в 9 файлах).
- В каждом из **9 agent файлов** (`.claude/agents/*.md`) extend существующую секцию `## Verbosity discipline (Trust profile A — output-side compression)` — добавляем под-секции `### Operator escalation triggers` (6 пунктов с cross-ref на protocol) + `### Plain-language rules` (6 пунктов с cross-ref). Не дублируем full content — каждый agent имеет 5-15 LOC extension с pointer'ами.
- Создаём `doc/anti-patterns/AP-32.md` (jargon-first operator communication) по образцу AP-25/26/27/28/29/30; soft-warn severity (per spec NFR).
- Создаём `_claude/operator-facing-examples.md` (terse/verbose pairs per agent role — 5 pairs, project-bootstrap отдельная pair для router).
- Обновляем `_claude/keyword-routing.md` — переписываем preamble на intent-detection, drop keyword-typed assumption из вступительного текста (таблица остаётся как **hint** для intent-mapping, не как требование от PM).
- Добавляем check `operator-facing-jargon` в `check-spec-discipline.sh.tmpl` как family-member (новой family `operator-communication`) — warning level, grep'ит `_review.md` / `_plan.md` на internal IDs (AP-NN / F-NN / `[*-override:` / step references) в helpfully scoped блоках.
- Regression fixture `doc/_templates/regression-cases/operator-facing-jargon-001/` — minimal synthetic `_review.md` с AP-32 violation + `expected_finding.md`.
- Короткий pointer в `CLAUDE.md.tmpl` (одна строка в § «Жёсткие правила» или § «Pointers»).

---

## Implementation steps

### Step 1 — Source-of-truth section в `development-protocol.md`

**What:** добавить новую секцию `## 16. Operator interface model` (после § 15 «Document hygiene» / перед § 16 текущей «Что overlay может добавить») с:
- Three-level table (Strategic / Tactical / Implementation — копируем из spec § «Three-level architecture»).
- 6 escalation triggers (нумерованный список, копируем из spec § «Operator escalation triggers»).
- 6 plain-language rules (копируем из spec § «6 plain-language rules»).
- Cross-ref на AP-32 + Verbosity discipline в agent files.

Существующие numbered sections (§ 16, § 17, …) **renumber'ить**: spec touches only `development-protocol.md` (project overlay), нет concept'а «generic protocol» в этом repo. Verify numbering после insertion.

**Why:** spec § «Scope изменений» item 1 + acceptance criterion 3. Единая SOURCE OF TRUTH избегает 9-кратного дублирования.

**Tests/verification:** manual smoke — `grep -n "## 16. Operator interface model" doc/development-protocol.md` returns 1 hit. Section length ≤ 100 LOC (NFR median check).

---

### Step 2 — Extend `## Verbosity discipline` в 9 agent файлах

**What:** в каждом из 9 файлов (`.claude/agents/planner.md` / `coder.md` / `reviewer.md` / `release-helper.md` / `project-bootstrap.md` / `bootstrap-greenfield.md` / `bootstrap-legacy.md` / `bootstrap-resume.md` / `bootstrap-template-sync.md`) добавить **под существующую** секцию `## Verbosity discipline (Trust profile A — output-side compression)` две новые sub-section'ы:

```markdown
### Operator escalation triggers

Поднимаешь голову (выходишь из silent mode) только при одном из 6 triggers — full list в `development-protocol.md § 16 «Operator interface model»`. TL;DR: business-logic hole / business-affecting fork / stack-affecting decision / security floor / cross-feature contradiction / cost-time threshold. Все остальные decisions silent.

### Plain-language rules (operator-facing communication)

При escalation формулируешь вопрос по 6 правилам plain-language (concrete-first / no-jargon / table+specifics / verification question / no-abstract-names / no-internal-IDs). Full list — `development-protocol.md § 16`. См. также AP-32 (jargon-first communication — soft-warn в reviewer).
```

Где-то в agent **может уже быть** mini-tone hint — не дублируй, добавь под Verbosity discipline.

**Why:** spec § «Scope» item 2 (расширение существующей tone-секции, не дублировать baseline) + acceptance criterion 1.

**Tests/verification:** `grep -l "Operator escalation triggers" .claude/agents/*.md | wc -l` → `9`. Manual smoke — открыть planner.md, проверить что секция consistent с другими.

---

### Step 3 — `doc/anti-patterns/AP-32.md`

**What:** создать новый файл по образцу AP-25.md / AP-30.md. Frontmatter:

```yaml
---
id: AP-32
status: active
severity: warning
domain: operator-communication
---
```

Body sections (mirror AP-25 структуры):
- **Что нельзя** — agent открывает escalation/clarification с internal IDs / step references / override marker syntax / abstract option names.
- **Почему** — gate degeneration (PM approve'ит наугад, доверие к процессу падает). Cite spec § «AP-32» рассуждение.
- **Failure mode common pattern** — пример из spec («`adr-decision-component-bounded` fail на ADR-0013, нужен `[source-bounded-override]`?»).
- **Как поступать вместо** — formulate в business / behaviour terms (пример из spec).
- **Mode** — *soft-warn (reviewer flags, не CI-block)* — per spec NFR «Hard-fail задушит operator-facing communication».
- **Override** — не применимо (warning level, не fail).
- **Use case examples** — 2 pairs (jargon-violation vs plain-language reformulation) — terse/verbose из `_claude/operator-facing-examples.md` можно reuse.
- **Relationship** — AP-3 (operator-gate frequency) upstream cause; AP-25/26 (source-bounded) — отдельная axis (содержание vs форма); AP-32 — про форму escalation, AP-25/26 — про когда escalate.

**Why:** spec acceptance criterion 2 + § «Новый AP-32».

**Tests/verification:** file exists, frontmatter valid, length 40-80 LOC (mirror sibling AP-NN files). Sanity check `grep -c "^##" doc/anti-patterns/AP-32.md` ≥ 5.

---

### Step 4 — `_claude/operator-facing-examples.md`

**What:** создать новый pointer файл (не `.tmpl` — он уже sit'ит в `doc/_claude/` как existing pattern, см. `keyword-routing.md`). Содержит 5 terse/verbose **pairs**, по одной на каждый logical agent (planner / coder / reviewer / release-helper / project-bootstrap).

Каждая pair — minimal, реальные phrasing'и:
- **Jargon (запрещено):** «AP-25 fork в ADR-0014, нужен `[source-bounded-override]`?»
- **Plain (правильно):** «Plan предлагает компонент `recovery-coordinator`, но спека этого не описывает. Это новая идея, или я что-то упускаю в спеке?»

Header — короткий preamble «Каждый agent в escalation использует эту форму. Полные правила — protocol § 16, AP-32.» Дополнительная sub-section: edge cases (что делать когда technical term ДЕЙСТВИТЕЛЬНО нужен — explicit definition в 1 sentence).

**Why:** spec acceptance criterion 5.

**Tests/verification:** `wc -l doc/_claude/operator-facing-examples.md` 40-100 LOC. Manual review — 5 pairs accounted for, project-bootstrap pair работает для router-level escalation.

---

### Step 5 — Update `_claude/keyword-routing.md`

**What:** переписать preamble (line 1-3) с акцентом на intent-detection: agent читает intent оператора (не keyword exact match), таблица — hint mapping а не contract. Добавить пример: «оператор написал "хочу чтобы пользователь мог достать свои данные" — это не keyword, но intent = новая фича про data export → suggest Step 1 spec draft».

Сохранить таблицу (она useful для disambiguation), но переименовать колонку из «Оператор пишет / keyword» в «Intent / typical phrasing».

**Why:** spec § «Scope» item «Update keyword-routing.md».

**Tests/verification:** manual smoke — открыть файл, проверить что preamble отражает intent-based routing.

---

### Step 6 — Pointer в `CLAUDE.md.tmpl`

**What:** в § «Жёсткие правила без исключений» добавить одну bullet line после существующей «Оператор никогда не читает код»:

> - **Plain-language operator interface** — escalate только по 6 triggers, формулируй вопросы в business terms (правила — `{{doc_root}}/development-protocol.md § 16` + AP-32; примеры — `.ai-pm/tooling/_claude/operator-facing-examples.md`).

**Why:** spec § «Scope» item «Update CLAUDE.md.tmpl».

**Tests/verification:** grep подтверждает single insertion. Бэйслайн briefing length стает ≤ 100 LOC (текущий 96 + 1 = 97).

---

### Step 7 — Linter check `operator-facing-jargon` в `check-spec-discipline.sh.tmpl`

**What:** добавить новую функцию `check_operator_facing_jargon` (family `operator-communication`). Логика:
- Сканирует `$DOC_ROOT/features/*_review.md` и `*_plan.md`.
- Внутри файла ищет блоки, помеченные как operator-facing — конвенция: блок начинается с маркера `<!-- operator-facing -->` ИЛИ существующая convention `## Output handoff` / `## Summary для оператора` headers (TBD в Step 4 coder'ом — какая convention лучше; warning-only check'у достаточно).
- В таких блоках grep'ает на patterns: `\bAP-[0-9]+\b`, `\bF-[0-9]+\b`, `\[.*-override:`, `Step [0-9]+ (planner|reviewer|coder)`, `Stage [A-E]`, `AskUserQuestion`.
- Per finding — `log_warn` (warning level per spec NFR — никогда не fail).
- Wire в `all` case (run by default) + `--check operator-facing-jargon` (selective invocation).

**Why:** spec acceptance criterion 4.

**Tests/verification:** добавить bash smoke test в `doc/_templates/scripts/tests/operator-facing-jargon-smoke.sh.tmpl`:
- Test 1: synthetic `_review.md` с jargon → exit 0, stderr contains «WARN: operator-facing-jargon».
- Test 2: clean `_review.md` без jargon → no warning.
- Test 3: file без operator-facing markers → silently skip.

**ADR candidate** (см. ниже): должна ли это быть standalone `check-operator-communication.sh` или family-member внутри `check-spec-discipline.sh`. Текущая рекомендация: **family-member** — justification в § ADR candidates.

---

### Step 8 — Regression fixture `operator-facing-jargon-001`

**What:** создать `doc/_templates/regression-cases/operator-facing-jargon-001/` со структурой по образцу `cross-doc-drift-001`:
- `README.md` — описание class (AP-32 / jargon-first escalation).
- `features/dummy_review.md` — synthetic _review.md с явной AP-32 violation в `## Summary для оператора` блоке («AP-25 fork в ADR-0014, нужен override?»).
- `expected_finding.md` — `expected_keyword: operator-facing-jargon` строка.

**Why:** spec acceptance criterion 6.

**Tests/verification:** заглушка smoke test в `tests/operator-facing-jargon-smoke.sh.tmpl` — pointing `--regression` mode (если existing `--regression` flag отсутствует — defer, smoke runs directly на fixture path). См. § Open questions ниже.

**Note:** spec acceptance говорит «через `check-spec-discipline.sh --regression`» — этот flag сейчас **не существует** в скрипте. Это **gap в spec'е** — surface как risk / question для оператора. Workaround в этом PR: smoke-test инвоучит check напрямую с pointed path (не через global `--regression` runner). Если оператор хочет full `--regression` framework — отдельная фича.

---

## ADR candidates

Архитектурные fork'и, которые могут возникнуть в Step 3 (coder). НЕ драфтим ADR'ы здесь, только flag'ируем для coder'а:

1. **Standalone `check-operator-communication.sh` vs family inside `check-spec-discipline.sh`?**
   - Recommendation в этом плане: **family inside check-spec-discipline.sh**, новая family `operator-communication`.
   - Justification: (a) existing pattern — `check-spec-discipline.sh` уже содержит multiple families (source-bounded / scope / regression / ADR); добавление новой family — minor extension, не new architectural component. (b) Single CI entry-point (pre-commit / pre-push) — operators не должны wiring'ить отдельный hook. (c) Spec § NFR не требует standalone script (just «check-operator-communication.sh exists»; family-member тоже наименование check'а — реализован как функция).
   - **Verdict:** defer to Step 3 unless operator overrides. NOT an ADR — это implementation choice без long-term architectural lock-in (легко выделить в standalone позже если нужно).

2. **Operator-facing block detection convention в `_review.md` / `_plan.md`?**
   - Choices: (a) explicit HTML comment marker `<!-- operator-facing -->...<!-- /operator-facing -->`, (b) implicit — heuristic на specific headers (`## Summary для оператора` / `## Output handoff`), (c) frontmatter field.
   - **Verdict:** defer to Step 3 (coder picks). Warning-only check tolerant к false-negative (skipped blocks). False-positive worse — better implicit heuristic limited to known headers than aggressive default-include-all.

3. **AP-32 как hard-fail (CI block) vs soft-warn?**
   - Spec § NFR явно говорит **soft-warn** в reviewer-agent. Это resolved в спеке, не fork. Mention только для traceability.

**Нет ADR'ов на operator-decision сейчас.** Все три fork'а — implementation-level (NOT architectural commitments). Per AP-1: ADR пишется только когда есть real long-term consequence.

---

## PR ordering

`pr_ordering: null` — single-domain feature (только template files: protocol + agents + AP + pointers + linter). No DB / API / UI split. Один PR, atomic.

Spec frontmatter уже имеет `pr_ordering: null` — не меняем.

---

## Risks / open questions for operator

### Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **R-1: `check-spec-discipline.sh --regression` mode не существует** (spec acceptance assumes it) | High | Medium (acceptance criterion 6 dangles) | Step 8 implementuется через direct fixture invocation в smoke test. Surface to operator: «`--regression` runner — отдельная фича, не делаем в этом PR». |
| **R-2: Operator-facing block detection heuristic false-positives** (grep'ает internal IDs внутри code examples / quotes) | Medium | Low (warning только; operator может игнорировать) | Scope grep на specific headers (см. ADR candidate 2). Iteration в follow-up если noise. |
| **R-3: Plain-language rules conflict с technical depth когда оператор САМ просит verbose** | Low | Low | Spec § Open question — verbose mode opt-out. Defer — current scope assumes default behaviour. Surface to operator. |
| **R-4: 9-агент edit чреват inconsistency** (one agent forgotten / different wording) | Medium | Medium (one agent slips through, lints not catching tone-section presence) | Step 2 — exact text template, apply identically to 9 files. Future fitness function (out of scope этого PR): grep verify `### Operator escalation triggers` present in 9/9 agent files. |
| **R-5: AP-32 soft-warn легко ignore'ится reviewer'ом**, gate degeneration через другую axis | Medium | Medium | Per spec NFR — hard-fail задушит communication, soft-warn принят tradeoff. Mitigation: operator-facing-examples + reviewer prompt enhancement (Step 2 в reviewer.md). |

### Open questions for operator (нужны ДО Step 3 coder'а)

1. **Verbose mode opt-out** (spec § Open question) — defer? Текущий plan не imlementает. OK?
2. **`--regression` runner** (R-1) — defer? Smoke test инвоучит fixture напрямую.
3. **Block detection convention** (ADR candidate 2) — operator picks, или coder default'ит heuristic на known headers?
4. **Развести границу business-affecting vs Tactical fork** (spec § Open question) — judgement-based достаточно, или нужен explicit list? Текущий plan не extends spec — list остаётся 6 triggers, granularity by judgement. OK?
5. **Reviewer behaviour для AP-32** — должен reviewer **активно искать** jargon в operator-facing блоках, или это пассивный check через linter? План: пассивный (linter+warning), reviewer reads warning output как обычно. OK?

---

## Acceptance mapping

| Spec acceptance criterion | Реализуется в |
|---|---|
| All 5 logical agents (9 files) содержат tone-секцию с 6 rules + 6 escalation triggers | Step 2 |
| `doc/anti-patterns/AP-32.md` создан с failure mode + examples | Step 3 |
| `development-protocol.md § Operator interface model` раздел добавлен | Step 1 |
| `check-operator-communication.sh` существует и flag'ит internal IDs (warning-level) | Step 7 — реализован как family-check внутри `check-spec-discipline.sh`, не standalone script (см. ADR candidate 1) |
| `_claude/operator-facing-examples.md` с 6 pairs (terse/verbose per agent) | Step 4 — **5 pairs** (per spec scope: 5 logical agents, не 6; project-bootstrap = router pair). Если оператор требует 6 — добавляем bootstrap-mode pair (one of 4 bootstrap subagents) |
| Regression test fixture для AP-32 violation, проверяемый через `check-spec-discipline.sh --regression` | Step 8 — fixture создан; **`--regression` runner отсутствует в скрипте** (R-1) — smoke test инвоучит fixture напрямую. Surface to operator. |

---

## Что НЕ делаем (scope guard)

- НЕ создаём ADR'ы — нет real architectural fork'а с long-term lock-in (см. § ADR candidates).
- НЕ имплементируем `--regression` runner framework — отдельная фича (R-1).
- НЕ добавляем verbose-mode opt-out — spec Open question, defer.
- НЕ trimming existing tone-секции — extend, не rewrite (spec явно: «не дублировать prompt-economy F baseline»).
- НЕ trogaем generic protocol — он не существует в этом repo как separate file (только overlay).

---

## Approval

После «поехали» оператора — commit plan, push, обновить PR #73 body. Step 3 (coder) использует Tests First: сначала AP-32.md + operator-facing-examples.md + regression fixture; потом linter check; потом 9-agent edit (последним, чтобы текст в pointer'ах уже existed).
