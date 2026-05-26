---
topic: prompt-economy
mode: feature
lite-mode: no
created: 2026-05-25
spec_approved: 2026-05-26
plan_approved:
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
scope_impact: no
topology_impact: yes
---

# Prompt economy — оптимизация token-расхода без потери контроля

**Stage E artifact, Step 1.** Status: draft.

## Контекст

После Layer 1 add (feature/adr-drift-prevention → PR #60) — 11 agent files выросли. Source contract + Fork-justification protocol + Spawn discipline появились в каждом, ~30-50 LOC дополнительно × 11 = 330-550 LOC duplication. Plus existing inflation: `project-bootstrap.md` 733 LOC (22% всех agents), `reviewer.md` 438 LOC.

**Замеры:**

| Файл | LOC | ~Tokens | Loading model |
|---|---|---|---|
| 11 агентов суммарно | 3319 | ~54k | On-demand при spawn'е (не все одновременно) |
| `project-bootstrap.md` (биггест) | 733 | ~12k | На каждом bootstrap spawn'е |
| `reviewer.md` | 438 | ~7k | На каждом review spawn'е |
| `coder.md` | 294 | ~5k | На каждом code spawn'е |
| `CLAUDE.md.tmpl` | 226 | ~3.5k | **Каждая сессия** (всегда loaded) |
| `development-protocol.md` | 755 | ~12k | Read on demand агентами |
| `anti-patterns.md` | 960 | ~15k | Read on demand агентами |

**Source-bounded blueprint duplication:** 3 секции (Source contract / Fork-justification / Spawn discipline) × 11 agents = 33 duplicate блока. Каждый ~30-50 LOC.

**Repeated reads в одной сессии:** spec / plan / foundation docs читаются N раз разными агентами в течение workflow'а. Сейчас каждый Read платит full cost.

## Failure mode который НЕ должен случиться

«Оптимизация ради оптимизации» — урезаем discipline ради экономии:
- AP catalogue размывается → AI drift проходит
- Source-bounded contract weakens → инверсия trust default'а ломается
- 5-layer enforcement урезается → physically blocked actions становятся soft

**Все эти gates сохраняются.** Меняется **как** prompt'ы структурированы, не **что** они enforce'ят.

## Approach options

### Option D: Prompt caching ordering (Recommended first)

**Что:** Restructure всех agent files и CLAUDE.md так чтобы статическая часть была наверху, динамическая — внизу. Anthropic API кэширует prompts по точкам обрыва (до 4). Структура каждого spawn'а:

```
[Block 1, cacheable] agent definition (role, contract, output format)
[Block 2, cacheable] protocol fragment relevant to stage (AP refs, source contract)
[Block 3, cacheable] session-level foundation (spec / plan loaded in session)
[Block 4, dynamic]   current question / current file
```

- **Выигрыш:** 50-80% **cost reduction** на повторных spawn'ах в одной сессии. Cached input ≈ 10% от full input price.
- **Token count** при этом тот же. Меняется только cost.
- **Effort:** низкий — rewrite ordering в agent files. Без content changes.
- **Risk:** низкий — content discipline сохраняется полностью.
- **Когда не работает:** если sessions короткие (1-2 spawn'а) — cache не успевает amortize'ться.

### Option A: Extract Source-bounded blueprint в shared section

**Что:** Layer 1 duplicated 30-50 LOC × 11 в agent files. Уже есть в `development-protocol.md § 9.5`. В agent files оставить ~5-10 LOC per-agent specifics + cross-reference на § 9.5.

- **Выигрыш:** ~330-550 LOC экономии **в каждом agent prompt'е после spawn'а**. ~1.5-2k токенов per spawn.
- **Effort:** низкий — 1 PR.
- **Risk:** средний — агент должен **дисциплинированно** читать § 9.5. Если AI «скипнет» reading в маленькой задаче → теряет discipline.
- **Mitigation:** mandatory pre-spawn read через инструкцию «перед output'ом любого artifact'а — прочитай development-protocol.md § 9.5». Plus linter проверяет что agent referenced правильный AP по факту работы.

### Option B: Stage-aware fragmentation для project-bootstrap

**Что:** `project-bootstrap.md` 733 LOC покрывает greenfield + legacy adoption + Tier framework + resume + 5 modes. Split:
- `bootstrap-router.md` (~80 LOC) — minimal router, определяет какой подагент spawn'ить
- `bootstrap-greenfield.md` (~200 LOC) — только Stage A-D для нового проекта
- `bootstrap-legacy.md` (~250 LOC) — invoked только при detected legacy
- `bootstrap-resume.md` (~100 LOC) — только session resume

То же возможно для `reviewer.md` (438 LOC) — выделить router (~80 LOC) + per-domain агенты уже есть отдельно.

- **Выигрыш:** для bootstrap'а — 500+ LOC per spawn (~8-10k токенов). Никто не платит за legacy adoption code если работаем с greenfield.
- **Effort:** средний — 1-2 PR'а, требует чёткой routing logic.
- **Risk:** средний — routing logic должна быть deterministic. Mistake → wrong subagent spawn → broken workflow.
- **Mitigation:** routing — pure function от `mode` + `foundation_completeness` в `.bootstrap-state.md`. Tested fixtures.

### Option C: Granularize anti-patterns.md → per-AP files

**Что:** `anti-patterns.md` 960 LOC. Агенты сейчас Read'ают весь файл если им нужен AP-25. Split на `doc/anti-patterns/AP-XX.md` per file. Index в `anti-patterns.md` остаётся (table of contents).

- **Выигрыш:** агент читает только AP'ы которые ему нужны (~50-100 LOC each instead of 960 LOC).
- **Effort:** средний — split file, обновить cross-refs.
- **Risk:** низкий — content semantically тот же.
- **Cost:** больше файлов в репе.

### Option E: Trim CLAUDE.md.tmpl до core + on-demand references

**Что:** `CLAUDE.md.tmpl` 226 LOC грузится в КАЖДОЙ сессии. Split:
- Core (~80-100 LOC) — minimal mandatory rules для AI orchestrator'а
- `doc/_claude/<concept>.md` — on-demand references (например, source-bounded discipline detail, advisor preset detail)

- **Выигрыш:** ~1.5-2k токенов **per session** (always-on saving).
- **Effort:** низкий — split + update references.
- **Risk:** низкий — discipline сохраняется через mandatory references.

### Option F: Trust profile A verbosity audit (output side)

**Что:** Trust profile A учит агентов писать verbose с learning layer. Это раздувает **output tokens**, не prompt. Output дороже input. Compress learning layer для confirmation-only tasks. Verbose остаётся для substantial findings / new architectural patterns.

- **Выигрыш:** 20-30% output tokens на простых tasks.
- **Effort:** средний — behavioural rule в каждом агенте + примеры «verbose когда / terse когда».
- **Risk:** средний — Trust profile A user может потерять обучающий слой.
- **Mitigation:** explicit triggers для verbose (architectural decision / new AP detected / cross-domain finding).

## Priority order и rationale

| # | Option | Cost impact | Risk | Effort | Когда делать |
|---|---|---|---|---|---|
| **1** | **D** Prompt caching ordering | **50-80% cost on repeats** | Низкий | Низкий | Первым — zero risk, max impact |
| **2** | **A** Extract source-bounded blueprint | ~2k tokens/spawn | Средний | Низкий | После D — fixes Layer 1 inflation |
| **3** | **E** Trim CLAUDE.md.tmpl | ~2k tokens/session | Низкий | Низкий | Параллельно с A |
| **4** | **B** Bootstrap fragmentation | ~10k tokens/bootstrap | Средний | Средний | После A/E — singular biggest win |
| **5** | **C** Granularize anti-patterns | Variable (read scope) | Низкий | Средний | Можно отложить — Read pattern works сейчас |
| **6** | **F** Trust profile A verbosity | 20-30% output | Средний | Средний | Последним — поведенческое изменение, нужны empirical baseline |

## Что НЕ делаем (предохраняем control)

- **AP catalogue как concept** — не урезаем количество AP'ов. Только структуру (granular files в Option C).
- **5 stages с operator-gate'ами** — не трогаем.
- **Source-bounded contract semantics** — не ослабляем. Option A только extract'ит inline duplication в shared reference; enforcement сохраняется.
- **5-layer enforcement** — все layer'ы сохраняются.
- **Independent reviewer pattern** — не сокращаем review depth.
- **Trust profile A learning layer concept** — Option F compress'ит conditional, не убирает. Substantial findings всё равно учат.

## Scope изменений — все 6 directions

Operator-direction: framework пока не доказывает работоспособность, optimization окно сейчас. Все 6 в скоупе. PR'ы отдельно для атомарности (AP-19), но все запланированы.

**PR-1 (Option D): Prompt caching ordering** — фундамент, все последующие splits не теряют выигрыш если структура cache-friendly. Restructure всех agent files + CLAUDE.md.tmpl. Только ordering, no content changes.

**PR-2 (Option A): Extract source-bounded blueprint** — fixes Layer 1 inflation. 11 agent files получают per-agent specifics + cross-reference на `development-protocol.md § 9.5`. Mandatory pre-spawn read enforcement через linter.

**PR-3 (Option E): Trim CLAUDE.md.tmpl** — core (~80-100 LOC) + `doc/_claude/<concept>.md` references. Снижает per-session always-on load.

**PR-4 (Option B): Bootstrap fragmentation** — `project-bootstrap.md` 733 LOC → router (~80) + 3 mode-specific subagents. Аналогично `reviewer.md` — extract router. Routing logic — pure function от `mode` + `foundation_completeness`.

**PR-5 (Option C): Granularize anti-patterns** — `anti-patterns.md` 960 LOC → `doc/anti-patterns/AP-XX.md` per file, index в master. Agents Read'ают только релевантные.

**PR-6 (Option F): Trust profile A verbosity audit** — output-side compression. Verbose triggers для substantial findings, terse default для confirmation tasks. Behavioural rule + примеры в каждом agent prompt'е.

**Порядок PR'ов важен:** D первый (architectural foundation для каждого spawn'а). После D — A/E параллельно (independent). После A — B (splits agents которые уже cache-friendly structured). C и F — независимые, могут идти параллельно с любым моментом после D.

## NFR

- **Token count preservation:** Option D не должен **увеличить** total tokens в любом agent file. Только reorder.
- **Discipline preservation:** все existing checks в `check-spec-discipline.sh` continue to pass.
- **Cache effectiveness:** structure должна позволять Anthropic API кэшировать 70%+ от input в repeat spawn'е.
- **No semantic regression:** behaviour агентов unchanged. Verified через manual smoke на 2-3 typical workflow'ах после restructure'а.

## User stories

- **As any operator**, я хочу что token cost репеатных операций в сессии заметно ниже, so that long workflows не тратят бюджет линейно.
- **As template maintainer**, я хочу структуру promtt'а которая **по умолчанию** делает каждый агент cache-friendly, so that не теряется выигрыш при будущих изменениях.
- **As AI agent**, я хочу stable static prefix в моём промпте, so that cache hits были предсказуемы.

## Open questions

1. **Caching breakpoint count:** Anthropic API даёт до 4 cache breakpoints. Сколько использовать в default structure агента? 2 (agent + foundation) / 3 (agent + protocol + foundation) / 4 (agent + protocol + foundation + per-stage)?
2. **Foundation docs auto-cache:** spec/plan читаются разными агентами одной сессии. Должны ли все агенты иметь explicit «read spec/plan first» как первый static block для shared caching? Или это и так работает через session-level caching без structural изменений?
3. **CLAUDE.md.tmpl ordering:** там есть user-specific и project-specific. Какие куски — cacheable static, какие dynamic?
4. **Measurement:** как verify'ить cache effectiveness после реализации? Manual cost analysis с фиксированной session-fixture'ой?

## Recommendation

Сделать **все 6 PR'ов** последовательно по plan'у выше. Framework пока не доказывает работоспособность — optimization окно сейчас, пока inflation Layer 1 свежий и не разлился по downstream-репам.

После каждого PR — measure empirically на 1-2 typical workflow'ах. Если в каком-то месте discipline degrade'ится — backout PR, revisit подход.
