---
topic: cross-doc-bounded
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
spec_reference: doc/features/adr-drift-prevention_spec.md
legal_impact: no
interview_impact: no
incident_impact: no
journey_impact: no
threat_impact: no
scope_impact: no
topology_impact: yes
---

# Cross-doc bounded — Layer 2 защита от invisible AI drift

**Stage E artifact, Step 1.** Status: draft.

*Это extension к agent-source-bounded (текущая feature/adr-drift-prevention). Тот fix покрывал visible drift (alternatives с invented options, frontmatter без spec_reference). Live testing показал второй класс — **invisible drift**: hallucinated decision components, cross-doc contradictions, scope creep — которые Layer 1 не ловит.*

## Контекст и центральный тезис

После добавления Layer 1 (per-agent source contract + fork-justification + frontmatter линтер) — independent reviewer пройдя по 4 уже approved ADR одной фичи поймал **второй класс** hallucination'а, который **не catchable PM-инстинктом**:

| | Layer 1 caught | Layer 2 caught |
|---|---|---|
| **Hallucination location** | Alternatives section (extra opt-out) | Decision component (новый строительный блок) |
| **Drift target** | Spec scenario (один документ) | Foundational invariants (vision + positioning + multiple ADRs) |
| **Detection mode** | PM domain intuition или quick scan | Multi-doc cross-reference, требует reviewer-agent |
| **Visibility** | «Зачем сейфы теряются?» — звучит подозрительно | «Three-tier envelope» — выглядит как elegant generalization |
| **Frequency estimate** | Visible — easier to catch | Invisible — slips past PM в чужом домене |

**Ключевой вывод:** Layer 1 необходим но недостаточен. Layer 2 (mandatory cross-doc check между planner и push'ем) — **necessary**, не sufficient-only. Без него — драфт-rate в production'е может быть 50%+ для feature'ей которые touchают foundational invariants.

## Failure modes которые Layer 1 не ловит

### 1. Hallucinated decision component (vs hallucinated alternative)

| Aspect | Hallucinated alternative (Layer 1 territory) | Hallucinated decision component (Layer 2 territory) |
|---|---|---|
| **Type** | Extra opt-out option в Alternatives | Новый concrete building block в Decision section |
| **Framing** | «We considered X, rejected because Y» — explicit alternative framing | Factual «design has components A, B, C» — alternative framing отсутствует |
| **Detection** | Linter `adr-spec-reference` ловит если Alternatives без source-ref | Decision section не имеет per-component source-ref в Layer 1 design |
| **Plausibility** | «Forever-keep» — звучит как «extra thoroughness» | «Three-tier envelope» — звучит как «mature design» (pattern bias к symmetric layered architectures) |

### 2. Foundational doc drift (vs spec drift)

Layer 1 проверяет `spec_reference:` поле. Но foundational invariants (vision differentiators, positioning red lines, mvp-scope boundaries) — это другой класс source-артефактов:

- Spec — описывает **что фича делает**
- Foundational docs — описывают **что продукт обещает на уровне принципов** (E2E encryption, no server-side decryption, privacy invariants)

ADR может пройти spec-ref check (есть quote из spec'а) и **одновременно нарушать foundational invariant** который spec не повторяет (потому что foundational docs — это shared assumption через все features).

### 3. Inter-ADR contradiction в одной PR

Planner создаёт N ADR'ов sequentially в одной session. Каждый atomic, internally consistent. Но:

- ADR-A в Alternative D explicitly отвергает паттерн P
- ADR-B Decision section вводит тот же паттерн P под другим именем

Нет mechanism который cross-check'ит «ADR-N decisions vs ADR-M rejections» в same PR. AI пишет each ADR в изоляции.

### 4. Multi-feature scope creep

Feature F-current — scope X (signup / auth / session).
Planner добавляет в ADR Decision component для F-future (trigger / delivery / recovery) — потому что «envelope должна покрывать все будущие сценарии для completeness».

AP-1 в protocol'е говорит «ADR пишется реактивно при упорстве plan'а в fork» — но не enforced. Plan для F-current объективно не «упирается» в F-future fork. Это **scope expansion under pretext of logical completeness**.

### 5. Plausibility / structure bias

«Three-tier envelope» звучит maturer чем «two-tier». Symmetric layered designs выглядят architecturally completer. **Inverse correlation:** visual signal of quality ↑ → actual quality ↓ когда лишний tier hallucinated.

PM подсознательно accept'ит «more architectural» version. AI generates по pattern: «если есть wrap_1 и wrap_2 — для symmetry должна быть wrap_3».

### 6. Reviewer-agent invocation visibility

Текущий flow: reviewer-agent invoked **вручную** оператором. Если оператор forget'нет, или думает что Layer 1 достаточен — drift проходит. Reviewer-agent **не auto-spawn'ится** между planner output и push'ем.

## Anchor incident — анонимизированный test case

Один из live test'ов 2026-05-25 на foundation-heavy feature:

- **Setup**: фича F-current с scope X. Foundational docs описывают invariant I («продукт не делает Z»)
- **Planner output**: 5 ADR'ов approved Layer 1 check'ом
- **ADR-A** в Alternative section explicitly rejects паттерн P как «violation of invariant I»
- **ADR-B** в Decision section вводит component C, который **технически реализует паттерн P под другим именем**
- **C scope** — это actually F-future (Y-functionality), не F-current
- **Frontmatter compliance**: ADR-B имеет валидный spec_reference (quote из spec'а который describes related но не identical concept). Frontmatter линтер passes
- **PM review**: ADR-B выглядит как «mature engineering» — C completes the architecture symmetrically. Accept без deep cross-doc check

**Что catch'нул reviewer-agent** при independent pass:
1. `B-2 [BLOCKING]`: ADR-B Decision component C нарушает foundational invariant I (cross-ref vision.md + positioning.md)
2. Inter-ADR contradiction: ADR-A explicitly rejects паттерн P (Alternative D), ADR-B implements паттерн P под именем C
3. Scope creep: C — это functionality F-future, не F-current. AP-1 нарушение
4. Plausibility trap: «three-tier symmetric» — visual signal, fake architectural quality

**Без reviewer-agent'а:** drift попал бы в merge → F-future implementation начала бы строить на C → 3-4 месяца спустя discovery `странного` component → откат требует invalidation всех data created under C-based assumption → cascade всех F'ей зависящих от broken foundation.

Этот case — reference для regression test'а template'а.

## Желаемое поведение (Layer 2 mechanisms)

### 1. Auto-spawn reviewer between planner и operator-approval (Step 2.5)

После planner output и до того как оператор marks `plan_approved:` — **mandatory** reviewer-agent invocation. Не optional, не manual. Wired в protocol'е.

- Triggered: появление новых ADR'ов в plan output OR multi-doc plan touching foundational areas
- Cannot skip: skip-marker требует explicit operator-justification в commit body (`[step-2.5-skip: reason]`)
- Same reviewer-agent infrastructure, новый stage

### 2. Cross-doc verification в reviewer source contract

Reviewer source contract расширен — должен **explicitly** cross-ref:
- spec (как сейчас)
- plan (как сейчас)
- diff (как сейчас)
- **foundational docs** with invariant scanning: vision / positioning / mvp-scope / threat-model / brand-voice (полный набор Stage A/B artifacts если они есть)
- **other ADRs в том же PR** for inter-ADR contradiction
- **AP catalogue** for scope creep checks (AP-1 enforcement)

### 3. Decision component source-bounded (not just Alternatives)

Линтер `adr-spec-reference` расширен:
- Не только frontmatter `spec_reference:` field
- **Каждый concrete component named в Decision section** должен trace к source-артефакту
- Components обнаруживаются heuristic'ом (names в `code blocks`, `inline code`, structural enumeration)
- Если component name не найден в spec/plan/existing-ADRs → fail / flag

### 4. Inter-ADR consistency check

Новый check `inter-adr-contradiction`:
- Сканит все `*.md` в `architecture-decisions/` touched by current PR
- Detect cross-ADR patterns: ADR-A.Alternatives explicitly rejects X → ADR-B.Decision implements X
- Heuristic: extract «red line» phrases из Alternatives (`rejected`, `violates`, `prohibited`), check Decision sections of sibling ADRs

### 5. Multi-feature scope creep check

Новый check `adr-feature-scope`:
- ADR должен ссылаться на feature topic (`topic:` в frontmatter ADR или connection via spec_reference)
- Components в Decision должны trace к scope этой фичи, не других
- Cross-ref features' specs: если component вводит functionality описанную ТОЛЬКО в другой spec → flag «scope creep, defer to F-other»

### 6. Foundational invariant awareness в planner

Planner source contract расширен — auto-load foundational docs для invariant cross-check:
- Каждый planner spawn автоматически загружает vision / positioning / mvp-scope (если существуют)
- Не зависит от impact_flag'ов — load by default
- Token budget: foundational docs обычно небольшие (< 2k tokens combined), overhead acceptable

## Scope изменений в шаблоне

### In scope

1. **`development-protocol.md`** — explicit Step 2.5 «Cross-doc review» между planner output и operator-approval:
   - Mandatory mini-reviewer invocation
   - Trigger: presence новых ADR'ов в plan OR foundational area impact
   - Output: cross-doc verdict перед operator-approval'ом

2. **`reviewer.md` + `protocol-compliance-reviewer.md`** — расширенный source contract:
   - Foundational docs full load (не только impact-flag-gated)
   - Inter-ADR contradiction check protocol
   - Scope creep detection guidelines

3. **`planner.md`** — auto-load foundational docs:
   - Каждый spawn loads vision / positioning / mvp-scope by default
   - Cross-check decision components против foundational invariants

4. **`check-spec-discipline.sh`** — новые checks:
   - `adr-decision-component-bounded` — каждый concrete component named в Decision имеет trace
   - `inter-adr-contradiction` — pairwise check ADRs в same PR
   - `adr-feature-scope` — ADR scope не больше feature scope

5. **ADR template** — обновить structure:
   - Decision section получает required subsection «Components» где каждый named building block имеет spec/plan/foundational reference
   - Поле в frontmatter `feature_topic:` — explicit binding к feature scope

6. **`anti-patterns.md`** — новые AP'ы:
   - AP-27: Hallucinated decision component
   - AP-28: Inter-ADR contradiction
   - AP-29: ADR scope creep (multi-feature)
   - AP-30: Plausibility / structural bias

7. **Regression test fixture** (`doc/_templates/regression-cases/cross-doc-drift-001/`):
   - Anonymized synthetic case с 4 файлами (spec / vision / positioning / 2 ADRs)
   - Expected finding output
   - Запускается через `check-spec-discipline.sh --regression`
   - Если новая template version не ловит case → regression failure

### Out of scope

- LLM-judge'ing качества cross-doc reasoning (subjective)
- Backfill check на existing artifact'ы в product repos (документация в migration section)
- UI / dashboards
- Multi-agent consensus (например, два reviewer'а независимо)

## Generalisation pattern

Это extension паттерна **AI artifact bounded by source artifact** от Layer 1:

| Layer | Mechanism | Catches |
|---|---|---|
| **Layer 0** (existing) | Spec frontmatter + spec_approved | Bad-faith deviation |
| **Layer 1** (current feature) | Per-agent source contract + frontmatter line | Visible drift (alternatives, frontmatter compliance) |
| **Layer 2** (this feature) | Cross-doc + inter-ADR + scope + auto-spawn reviewer | Invisible drift (decision components, contradictions, scope creep) |
| **Layer 3** (future) | Anchored regression tests across template versions | Long-term protocol erosion |

Pattern continues: каждый layer ловит class drift'а который previous слой не ловил.

## NFR

- **Latency:** Step 2.5 mini-reviewer < 60 секунд average. Cross-doc check'и в check-spec-discipline < 10 секунд
- **False positive rate:** inter-ADR contradiction heuristic должен быть conservatively настроен — better to miss ambiguous case чем flood operator false positives
- **Discoverability:** Step 2.5 verdict embed'ится в plan output summary до operator-approval'а — оператор видит «cross-doc check passed» / «findings: ...» в том же chat'е где approves plan
- **Token budget:** auto-loading foundational docs +~2-5k tokens per planner spawn. Acceptable за защиту от cascade rollback

## User stories

- **As any operator**, я хочу что hallucinated decision components ловятся **до** того как я approve plan, so that cascade drift в schema/code/tests невозможен
- **As any AI planner**, я хочу explicit обязательство cross-ref'ить foundational docs, so that не быть source of invisible drift даже из лучших побуждений
- **As an AI reviewer**, я хочу explicit protocol для inter-ADR check'а и scope creep detection, so that ловить класс drift'а который Layer 1 не покрывает
- **As template maintainer**, я хочу regression test fixture для invisible-drift case'а, so that future template versions не regress на этом классе hallucination'а

## Risks для plan'а

1. **Token budget на planner spawn'ы.** Auto-load foundational docs увеличит prompt size на ~2-5k tokens per spawn. Acceptable если экономия от не-cascade-rollback'а превышает overhead. Mitigation: foundational docs caching across spawns в same session
2. **False positive rate в heuristics.** Inter-ADR contradiction detection через NLP heuristics может flag legitimate distinctions. Mitigation: conservative thresholds + override marker `[cross-doc-override:]`
3. **Step 2.5 latency overhead.** Mandatory mini-reviewer добавляет 30-60 секунд на каждую фичу. Subjective fatigue если оператор привык к быстрому approval'у. Mitigation: explicit progress signal «cross-doc check running…» + measurable savings от prevented cascade
4. **Regression test maintenance.** Synthetic test fixture требует updates с template evolution. Mitigation: fixture в `doc/_templates/regression-cases/` со своим versioning

## Open questions для оператора

1. **Step 2.5 mandatory или strongly-recommended?** Mandatory означает physically blocked без reviewer trail. Strongly-recommended — soft через CLAUDE.md instruction.
2. **Foundational docs auto-load — for all planner spawns или только когда detected impact?** All — token cost. Detected — heuristic может miss.
3. **Inter-ADR check granularity:** pairwise (O(n²) для n ADRs в PR) или transitive с graph analysis? Pairwise проще, transitive строже.
4. **Decision component detection heuristic:** code-block names, structural enumeration, named typography conventions? Какой signal самый reliable для AI-generated ADR'ов?
5. **Backfill scope:** существующие ADR'ы в product repos — backfill components subsection или skip?

## Recommendation

**Mandatory Step 2.5** + **all-planner-spawns foundational auto-load** + **pairwise inter-ADR** + **conservative heuristics с override**. Это inverts trust default согласованно с Layer 1 philosophy.

Без mandatory enforcement — это soft suggestion которое теряет в реальности (тот же failure mode как «reviewer-agent должен запускаться» который наблюдался в anchor incident).
