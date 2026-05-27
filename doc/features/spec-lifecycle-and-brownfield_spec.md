---
topic: spec-lifecycle-and-brownfield
mode: feature
lite-mode: no
created: 2026-05-26
spec_approved:
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
scope_impact: yes
topology_impact: yes
---

# Spec lifecycle + brownfield adoption — Layer 3 cross-feature anti-drift

**Stage E artifact, Step 1.** Status: draft (реконструкция после потери `/tmp` spec'а).

## Контекст

Layer 1 (PR #60, source-bounded contract) ловит spec-level drift на уровне ОДНОГО artifact'а. Layer 2 (PR #71, cross-doc-bounded) ловит cross-doc drift внутри ОДНОЙ feature'ы. Остаётся третий класс:

| Layer | Что ловит | Catch point |
|---|---|---|
| Layer 1 (AP-25/26) | Spec extends beyond source | Per-agent contract |
| Layer 2 (AP-27/28/29) | Hallucinated component / inter-ADR contradiction / scope creep | Reviewer Step 2.5 в одной фиче |
| **Layer 3 (этот спек)** | F-N нарушает invariant F-M | Cross-feature reviewer pass + spec lifecycle gates |

**Failure mode:** F-01 устанавливает invariant («все user-data зашифрованы на клиенте»). Через 3 месяца F-07 (export to CSV) добавляет server-side temporary storage для async export. F-07 spec не упоминает F-01 — независимый feature. Тихо нарушено. PM не помнит инвариант F-01.

**Параллельная боль:** **Brownfield adoption** — натягивание шаблона на existing проект. Текущий шаблон работает только для greenfield (Stage A-D = bootstrap). Для existing repo с фичами F-01..F-N БЕЗ spec'ов — нет routine'а. PM попадает в catch-22: spec lifecycle требует spec'ов, спецов нет, восстанавливать вручную долго.

## 5 сценариев — матрица

| Сценарий | Стартовое состояние | Что делаем |
|---|---|---|
| **А** Новый продукт | Pustoy repo | bootstrap-greenfield Stage A-D → F-01 silent build |
| **Б1** Активный проект + новая фича | Все existing F-N имеют spec'и | `<topic>_spec.md` draft → Layer 3 cross-check всех existing spec'ов → silent build |
| **Б2** Активный проект + bug fix | Все existing F-N имеют spec'и | failing test first → inline edit `last_modified:` в affected spec'е → fix |
| **В1** Brownfield + новая фича | Existing F-1..F-N БЕЗ спец'ов | **Hard floor**: extract spec'и всех features перед F-N+1 (audit-driven retrofit) |
| **В2** Brownfield + bug fix | Existing F-N БЕЗ спец'ов | Targeted extract spec ТОЛЬКО affected feature → bug-fix flow Б2 |

## Layer 3 — cross-feature contradiction check

**Mechanism:**

1. При новой F-N spec creation — reviewer-agent **дополнительно** делает cross-feature pass: читает frontmatter `topology_impact:` / `threat_impact:` / `journey_impact:` / `scope_impact:` всех existing specs.
2. Если новая F-N имеет `topology_impact: yes` — reviewer проверяет invariants foundational docs + флагает specs где invariant был установлен (cross-ref candidates).
3. Linter `check-cross-feature-invariants.sh` — extracts «invariant statements» (regex patterns: «всегда / never / ни при каких / обязательно / запрещено» в spec'ах) → cross-check новой F-N не нарушает.
4. **Hard cross-feature triggers** (operator-gate):
   - F-N меняет foundational doc (vision / positioning / mvp-scope / threat-model).
   - F-N имеет component shared с другим F-M (отслеживается через `affects_features:` frontmatter list).
   - Invariant overlap >= 2 between F-N spec и foundational + другие spec'и.

## Brownfield routine — детальный flow

### В1: brownfield + новая фича

1. **Detect:** bootstrap-legacy ловит «не пустой repo, нет `.ai-pm/`». Operator выбирает «Quick adoption» (см. existing routine) ИЛИ «Full adoption with retrofit» (новый flow).
2. **Full retrofit flow:**
   - Step 1 (audit): scan `**/*.{ts,py,sql,...}` → group by feature (heuristic: directory structure, route groupings, module boundaries).
   - Step 2 (operator review): «обнаружены features: F-A (auth), F-B (billing), F-C (export). Подтверди / переименуй / split / merge».
   - Step 3 (spec extraction): на каждый approved feature — generate `<topic>_spec.md` skeleton с:
     - Frontmatter (impacts inferred из affected files).
     - `## Behaviour observed` — what the code does (extracted, not invented).
     - `## Invariants extracted` — assertions / type constraints / error handling discovered.
     - `## Open questions` — что AI не смог сам определить (rationale за design choices).
   - Step 4 (operator approval): PM проходит по spec'ам, fills `Open questions`, помечает `spec_approved:`.
3. **После retrofit** — F-N+1 идёт стандартным flow Б1.

### В2: brownfield + bug fix

1. **Detect bug area:** failing test или operator description → AI mapping на existing files.
2. **Targeted extract:** generate spec только для **affected feature** (один файл `<topic>_spec.md`). Не extract всю topology.
3. **Bug-fix flow:** failing test first → fix → spec gets `last_modified: <date>` + bug-fix note section.

**Trade-off:** В2 leaves остальной repo без spec'ов. Layer 3 не работает полноценно для не-extracted features. Acceptable для urgency.

## Spec lifecycle — invariants и mutation rules

Существующий шаблон fokus'нут на spec creation (Stage E Step 1). Lifecycle после approval размыт. Этот спек codifies:

| Event | Что меняется в spec'е |
|---|---|
| Spec approve | `spec_approved: <date>` |
| Plan approve | `plan_approved: <date>` |
| Implementation complete | `acceptance: ok` |
| Merge to main | `merged: yes`, `review_url: <PR>` |
| Bug fix в feature | `last_modified: <date>` + `## Bug fixes` log entry |
| Rework | новая `<topic>_spec.v<N>.md`, AP-21 versioning |
| Deprecation | `deprecated: <date>` + reason + replacement reference |

**AP-31 (новый): Spec staleness** — feature spec не обновлён после implementation changes. Detection: git log на code files vs `last_modified:` в spec'е. Если code touched после spec last_modified > 30 days — warning. Hard fail если behaviour-changing.

## Scope изменений

**In scope:**

- Новый раздел `development-protocol.md § 11 — Cross-feature invariants (Layer 3)`.
- Новый раздел `§ 12 — Brownfield adoption (В1/В2 flow)`.
- Linter `check-cross-feature-invariants.sh` — extracts invariant statements, cross-checks.
- `bootstrap-legacy.md` agent — добавить «Full retrofit» branch к существующему 3-choice menu (Quick auto / Manual staged / Skip adoption).
- Spec template `<topic>_spec.md.tmpl` — добавить optional `## Behaviour observed` + `## Invariants extracted` (для brownfield).
- Update `.ai-pm/tooling/_claude/frontmatter-convention.md` — добавить optional `affects_features: [topic1, topic2]` field для cross-feature link tracking.
- AP-31 в `doc/anti-patterns/AP-31.md` (staleness).
- AP-33 в `doc/anti-patterns/AP-33.md` (cross-feature contradiction — Layer 3 territory).
- Regression fixture `cross-feature-drift-001` под `--regression` mode.

**Out of scope:**

- Auto-fix mode для stale spec'ов.
- Reverse engineering business logic из tests (extract — descriptive only, не inference business intent).
- Multi-repo spec sync (моно-repo assumption).
- Spec versioning beyond AP-21 (rework — existing).
- LLM-based invariant extraction (regex baseline only v0; LLM upgrade — future iteration if FP rate >10%).

## NFR

- Cross-feature check runtime: <= 5 sec на repo с 20 specs.
- Brownfield extract точность: invariants — 0% false positives (better miss than wrong); behaviour — best-effort с operator review.
- Layer 3 linter — false-positive rate <= 10% измеряется на regression fixture set (cross-feature-drift-001..N), >= 5 cases в fixture suite перед merge.
- Invariant extraction — regex baseline (regex patterns на «всегда / never / ни при каких / обязательно / запрещено») + measured false-positive rate против regression fixture set. LLM-call как fallback вынесен в out-of-scope.

## Сценарии (detailed)

**Сценарий А1 (Layer 3 catch):**
1. F-01 spec: «все user-data encrypted на клиенте, server не имеет plaintext access».
2. F-07 (через 3 месяца) — export to CSV, добавляет server-side temp storage для async.
3. F-07 spec drafted. Reviewer Step 2.5 + Layer 3 pass — extract'нул invariant из F-01: «server не имеет plaintext access». Match: «server-side storage» в F-07.
4. Reviewer escalation в business terms: «F-07 export добавляет хранение plaintext данных на сервере на 15 минут. F-01 обещает что server не видит plaintext. Это change of promise — оставить F-01 invariant и переделать F-07 client-side, или обновить F-01 invariant с допущением?»
5. PM решает. Если update F-01 — `<F-01>_spec.v2.md` создаётся (AP-21 rework).

**Сценарий В1.1 (brownfield retrofit):**
1. Operator: «у меня existing проект, хочу adopt'нуть полностью».
2. bootstrap-legacy spawned: scans repo, groups files, predicts 4 features.
3. Operator confirms 3 of 4, splits 1, names them: `auth`, `billing`, `export`, `account-mgmt`.
4. AI extracts 4 spec skeletons (each ~150 LOC: behaviour + invariants + open questions).
5. Operator reviews, fills 2-3 open questions per spec, approves всех. ~30 min работы.
6. From here — standard Б1 для новой feature.

**Сценарий В2.1 (brownfield targeted):**
1. Operator: «баг в auth flow, expired session не logout'ит юзера».
2. AI maps bug to `src/auth/session.{ts,test.ts}`. Heuristic mapping → predicted feature topic `auth`.
3. AI extract'нет ТОЛЬКО `auth_spec.md` (один файл, ~100 LOC).
4. Operator approves spec (`spec_approved:`), failing test written, bug fixed, `last_modified:` updated.
5. Остальные features (billing, export) остаются без spec'ов — будут extract'нуты когда нужно их touch'нуть.

## User stories

- Как PM existing проекта, я хочу подключить шаблон без переписывания всего проекта.
- Как PM, я хочу что Layer 3 ловил cross-feature contradiction'ы которые я не помню.
- Как PM на bug fix в brownfield repo, я хочу не extract'ить spec'и для несвязанных feature'ей.
- Как PM, я хочу видеть staleness warning когда code drift'нул от spec'а.

## Не в scope

- Replacing AP-25/AP-26 source-bounded contract (Layer 1 stays).
- Replacing AP-27/AP-28/AP-29 cross-doc-bounded (Layer 2 stays).
- Auto-update spec'ов при code change (semi-auto в будущем, не сейчас).

## Open questions

- Hard floor В1 (extract всех specs перед feature) vs soft (extract только overlapping) — что меньше friction'а даёт?
- AP-31 staleness threshold (30 days?) — empirical или config-настраиваемый?

## Acceptance criteria

- [ ] `development-protocol.md` § 11 + § 12 разделы добавлены.
- [ ] `check-cross-feature-invariants.sh` существует, ловит regression fixture.
- [ ] `bootstrap-legacy.md` имеет «Full retrofit» branch с 4-step flow (audit → review → extract → approve).
- [ ] AP-31 + AP-33 файлы под `doc/anti-patterns/`.
- [ ] Spec template поддерживает optional `## Behaviour observed` + `## Invariants extracted` секции.
- [ ] Regression fixture `cross-feature-drift-001` под `doc/_templates/regression-cases/` с expected_keyword'ами.
