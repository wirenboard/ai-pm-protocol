---
topic: spec-lifecycle-and-brownfield
mode: feature
lite-mode: no
created: 2026-05-27
spec_reference: doc/features/spec-lifecycle-and-brownfield_spec.md
plan_version: 1
plan_approved: 2026-05-27
operator_approved:
---

# Spec lifecycle + brownfield adoption — implementation plan

**Stage E artifact, Step 2.** Status: draft.

Файл реализует spec'у `spec-lifecycle-and-brownfield_spec.md` (approved 2026-05-27) — Layer 3 cross-feature anti-drift + brownfield routine. Source-bounded: каждая секция traces к spec scope/acceptance.

---

## Operator decisions (2026-05-27) — pre-coder resolutions

| # | Question | Decision |
|---|---|---|
| Q1 | `check-cross-feature-invariants.sh` standalone vs family inside `check-spec-discipline.sh` | **Family inside `check-spec-discipline.sh`** + thin wrapper `doc/_templates/scripts/check-cross-feature-invariants.sh.tmpl` который инвоучит `check-spec-discipline.sh --check cross-feature-invariants`. Acceptance criterion satisfied (файл существует) + family pattern сохранён (consistency с PR #71 Layer 2). |
| Q2 | Retrofit'нутые spec'и → code refactor → staleness loop | **Feature, не bug.** AP-31 staleness применяется ко ВСЕМ spec'ам включая retrofit'нутые. Fires как warning, operator решает per-case (update spec / mark deprecated / explicit acknowledgement через commit marker). Incentive держать spec'и in sync с code. |

---

## Plan summary

- Расширяем существующий linter family pattern (PR #71 `check-spec-discipline.sh` cross-doc-bounded) новым family `cross-feature-bounded` с двумя checks (`spec-staleness` / `cross-feature-invariant`) — а **не** standalone скриптом. Consistency с Layer 1/Layer 2 enforcement, переиспользование `--regression` infrastructure + override marker pattern.
- `bootstrap-legacy.md` получает **4-й** menu item «Full retrofit» (audit → review → extract → approve) поверх existing 3-choice (Quick / Manual staged / Skip). Existing Tier framework сохраняется; retrofit — это новый extract-driven sub-routine, не replacement.
- AP-31 (staleness) + AP-33 (cross-feature contradiction) добавляются как per-AP файлы по pattern AP-25/AP-27 — uniform structure, severity `critical`, domain `cross-feature-bounded`.
- Regression fixture — **5 отдельных директорий** `cross-feature-drift-001..005` (по pattern PR #71 `cross-doc-drift-001`), каждая под один scenario. Trade-off обоснован в Decision 2.
- AP-31 staleness threshold — `staleness_days:` config field в `.ai-pm/.bootstrap-state.md` с default `30`. Per-product tuning без code edit.

---

## Implementation steps

Каждый step предполагает в среднем 1-3 файла; PR ordering — § «PR ordering» ниже.

### Step 1. Spec template extension (optional sections)

**What:**
- В `doc/_templates/feature-spec.md.tmpl` добавить два **optional** template блока с placeholder-комментариями:
  - `## Behaviour observed` — для brownfield extract'нутых spec'ов; для greenfield обычно отсутствует.
  - `## Invariants extracted` — список assertions / type constraints / error handling discovered. Используется как input для AP-33 linter.
- Optional `affects_features: [topic1, topic2]` поле во frontmatter convention.
- В `_claude/frontmatter-convention.md` (или эквивалентный файл — verify в Step 0 reconnaissance) добавить описание `affects_features:` + опциональные секции.

**Why:** Spec § Scope item 5 + item 6. Без `affects_features:` linter не сможет efficiently scope cross-feature checks (full O(N²) pairwise по всем specs vs targeted O(N) по declared affects). Optional чтобы не ломать существующие spec'и.

**Tests/verification:**
- `bash scripts/check-spec-discipline.sh` на текущем worktree (где этих секций нет) — должен pass'ить (т.к. optional).
- Создать sample spec с обеими секциями + `affects_features: [foo, bar]` — linter parses без error'а.

### Step 2. AP-31 + AP-33 anti-pattern files

**What:**
- `doc/anti-patterns/AP-31.md` — Spec staleness. Структура: frontmatter (`id: AP-31`, `status: active`, `severity: warning`, `domain: cross-feature-bounded`) + Что нельзя / Почему / Failure mode / Mode (`requires-operator-touch — staleness window expired`) / Как поступать вместо / Override (`[staleness-override: <reason>]`) / Use case examples / Relationship (cross-ref AP-21 rework, AP-33).
- `doc/anti-patterns/AP-33.md` — Cross-feature contradiction. Структура аналогична. Severity `critical`. Linkage с AP-27/AP-28/AP-29 (Layer 2) + AP-25/AP-26 (Layer 1) — это Layer 3, выше по uncertainty.
- AP-32 — НЕ trogaem, занят PR #73 (jargon-first).

**Why:** Spec § Scope items 7-8 + acceptance criteria.

**Tests/verification:**
- Manual readability scan.
- Если в `anti-patterns.md` index file есть (verify), добавить entry; иначе skip.

### Step 3. Linter — extend `check-spec-discipline.sh.tmpl` (`cross-feature-bounded` family)

**What:**
- В `doc/_templates/scripts/check-spec-discipline.sh.tmpl` добавить две функции, рядом с existing Layer 2 family (`check_adr_decision_component_bounded` и т.д.):

  - **`check_cross_feature_invariant`** (AP-33):
    1. Enumerate `$DOC_ROOT/features/*_spec.md` (исключая `*.v*.md` rework'и — match только `_spec.md`).
    2. Extract invariant statements via regex baseline: `(всегда|never|никогда|ни при каких|обязательно|запрещено|must not|MUST NOT|MUST)\b.*$` — line-level grep на spec body после `## Invariants extracted` секции (если есть) ИЛИ глобально в body если frontmatter `topology_impact: yes`.
    3. Для текущего spec'а (последний modified или указанный через `--target`) — cross-check каждого invariant statement: substring match с проверкой что новая spec не вводит directly contradicting term (e.g. invariant «server не имеет plaintext» → новая spec упоминает «server-side storage of <data>»).
    4. Pairwise scope: всё × всё ИЛИ только specs из `affects_features:` если поле populated (optimization).
    5. Output: `cross-feature-invariant: <spec-A>:<line>` ↔ `<spec-B>:<line>` — потенциальная contradiction.
    6. Mode: warn (требует operator review) **не** fail by default — regex baseline FP rate >0% per spec NFR; override marker `[cross-feature-override: <reason>]` downgrade'ит до log_ok.

  - **`check_spec_staleness`** (AP-31):
    1. Read `staleness_days:` из `.ai-pm/.bootstrap-state.md` (default 30).
    2. Для каждого `_spec.md` — extract frontmatter `merged: yes` + `last_modified:` (если есть) ИЛИ `spec_approved:` если `last_modified:` отсутствует.
    3. `git log --since=<spec-date> -- <implied-code-paths>` — implied paths из `affects_features:` или эвристика «search files matching topic name».
    4. Если code touched после spec date > `staleness_days` AND spec не updated → warn `spec-staleness: <spec>:<topic> — code touched <commit-sha> > threshold days, no spec update`.
    5. Hard fail (не warn) если behaviour-changing detected — **out of scope для v0** (не имеем reliable heuristic). v0 — только warn.

- Register обе функции в `case "${1:-all}"` block (раздел `all|*`) + в `--staged-only` block.
- Register в `--regression` mode automatically (existing `run_regression_mode` итерирует по fixture directories).
- Catalogue table в `development-protocol.md` § 9.1 — добавить 2 строки.

**Why:** Spec § Scope items 3 + 9 + AP-31 detection mechanism. Decision 1: extension family (см. ниже) — не standalone скрипт.

**Tests/verification:**
- Manual: создать минимальную fixture с 2 spec'ами contradicting на «server не decrypt» / «server-side decrypt» → check_cross_feature_invariant flag'ает обоих.
- `--regression` mode: каждый из 5 fixtures (Step 4) даёт expected keyword.
- `[cross-feature-override: test]` в HEAD commit body → fail → warn downgrade verified.

### Step 4. Regression fixtures — 5 cases

**What:** Создать `doc/_templates/regression-cases/cross-feature-drift-001/..005/` каждая mirroring `cross-doc-drift-001` structure:

- `README.md` — class описание + expected keyword list.
- `expected_finding.md` — `expected_keyword: <keyword>` lines.
- `features/<topic-A>_spec.md` + `features/<topic-B>_spec.md` (минимум 2 specs для cross-feature contradiction).
- При необходимости `vision.md` / `positioning.md` (если invariant установлен в foundational, не в spec'е).

5 классов (по spec § Scenarios + NFR):
- **001** — Encryption invariant violation. F-01 «server не decrypts plaintext» (foundational) ↔ F-07 export adds server-side temp storage. Anchor incident: spec § Scenario А1.
- **002** — Per-device key rotation invariant ↔ feature вводит shared master key. Cross-feature scope creep на crypto.
- **003** — Persona scope. F-01 для Persona PM-A only ↔ новый F-N расширяет на Persona Dev-B без update F-01 personas. Topology cross-feature.
- **004** — Stale spec. Spec `merged: yes` 2026-01-01, `last_modified: 2026-01-01`, fixture git log имитирует touched code на topic files в 2026-04-01 → 90 days > 30 default → `spec-staleness` keyword. Реализуется через `expected_keyword: spec-staleness` без real git history (linter принимает override env var для test purposes ИЛИ читает synthetic timestamps из fixture metadata file).
- **005** — `affects_features:` scoping. Two specs with intersecting `affects_features: [auth]` declare conflicting invariants — должен flag'нуть pairwise.

**Why:** Spec NFR — «>= 5 cases в fixture suite перед merge».

**Tests/verification:** `bash scripts/check-spec-discipline.sh --regression` — должен `5/5 passed`.

**Honest caveat:** fixture 004 (staleness) требует solve'нуть «как тестировать git-log-based check без real git history». Decision: linter поддерживает env var `STALENESS_FIXTURE_OVERRIDE=<days>` для regression mode — fixture-only behavior, не production path. Surface'у как risk (R-4).

### Step 5. `development-protocol.md` — § 11 + § 12

**What:**
- **§ 11 — Cross-feature invariants (Layer 3):** обзор слойной модели (Layer 1 / 2 / 3), trigger conditions (`topology_impact: yes`, foundational change, invariant overlap >= 2), reviewer Step 2.5 расширение (existing reviewer pass получает Layer 3 sub-step при new feature spec creation), linter cross-ref на check `cross-feature-invariant`, override marker semantics, hard cross-feature triggers (operator-gate, см. spec § Layer 3 mechanism item 4).
- **§ 12 — Brownfield adoption (В1/В2 flow):** таблица 5 сценариев (А / Б1 / Б2 / В1 / В2) из spec § Сценарии, full retrofit flow detail для В1 (4 steps), targeted extract flow для В2, trade-off notes («В2 leaves rest of repo без spec'ов»), cross-ref на `.claude/agents/bootstrap-legacy.md` § Choice 4.
- § 9.1 catalogue table — 2 новые строки (`cross-feature-invariant` / `spec-staleness`).

**Why:** Spec § Scope items 1 + 2 + acceptance criteria.

**Tests/verification:** Markdown lint + cross-link check (если есть в CI). Manual readability.

### Step 6. `bootstrap-legacy.md` — 4-й menu item «Full retrofit»

**What:** В `.claude/agents/bootstrap-legacy.md`:

- AskUserQuestion meta-text обновить: «4 варианта с разными trade-offs» (вместо «3 варианта»).
- Добавить новую секцию `## Choice 4: Full retrofit (часы-1 день, для disciplined adoption)` после Choice 3. Содержимое:
  - **Description:** «AI извлекает feature topology + spec skeleton для каждой existing feature. Foundation полностью включена; Layer 3 cross-feature checks работают сразу. Trade-off: 30 min — несколько часов оператор-работы (review extracted spec'и + fill open questions).»
  - **Routine** (4 steps mirrors spec § В1 Full retrofit flow):
    1. **Audit:** scan `**/*.{ts,py,sql,...}` heuristic-based grouping (directory structure, route groupings, module boundaries). Output: predicted feature list.
    2. **Operator review:** AskUserQuestion «обнаружены features F-A/F-B/F-C — confirm / rename / split / merge».
    3. **Spec extraction:** per approved feature — generate `<topic>_spec.md` skeleton с frontmatter (impacts inferred from affected files) + `## Behaviour observed` + `## Invariants extracted` + `## Open questions` секциями. Existing optional template sections (Step 1) — обязательны для retrofit'нутых spec'ов.
    4. **Operator approval:** PM fills Open questions per spec, помечает `spec_approved:`. После — F-N+1 идёт по standard Б1.
  - **State:**
    ```yaml
    adoption_path: legacy-retrofit
    foundation_completeness: complete
    retrofit_extracted_features: [<list>]
    ```
  - **Hard floor:** retrofit'нутые spec'и **не имеют** `acceptance: ok` автоматически — operator approval mandatory. Spec'и помечены `extracted: yes` для аудит trail.

- Source-bounded contract section (existing) — добавить bullet «Retrofit extraction = best-effort descriptive из code/tests, **не** business intent inference. Operator approval required per spec.»

**Why:** Spec § Scope item 4 + acceptance criteria.

**Tests/verification:** Manual flow rehearsal (cannot automate AI behavior).

### Step 7. State file extension — `staleness_days`

**What:**
- В `doc/_templates/.bootstrap-state.md.tmpl` (verify exact path) добавить optional field `staleness_days: 30` с inline comment `# AP-31 threshold; default 30 days. Tune per-product if drift cadence different.`
- В bootstrap-legacy.md (Choice 1/2/3/4 state blocks) — добавить `staleness_days: 30` в auto-populated state.
- Linter Step 3 reads через existing awk-pattern `awk -F': ' '/^staleness_days:/ {print $2}'`.

**Why:** Decision 4 (staleness threshold config). Spec § Open questions ответ.

**Tests/verification:** `check_spec_staleness` honors override via env var (regression) + state file value (production).

---

## ADR candidates

Surfacing — **не пишем ADR в этом PR** (per AP-1 — ADR только при реальном fork'е с реальными alternatives). Candidates:

1. **ADR-candidate: Cross-feature linter scope strategy.** Pairwise O(N²) vs `affects_features:`-scoped O(N). Trade-off completeness vs performance. На v0 — гибрид (pairwise если поле отсутствует, scoped если populated). При >20 specs в product repo может стать concerning — recall в future PR.
2. **ADR-candidate: Brownfield extract responsibility.** Code-only (descriptive what-is) vs code+tests (closer to business intent) vs code+tests+commit-history (best inference). v0 — code-only per spec out-of-scope. Если FP rate в Layer 3 на retrofit'нутых spec'ах окажется >10% — пересмотр.
3. **ADR-candidate: Regression fixture format для git-history-dependent checks.** Synthetic timestamps file vs env var override vs real fixture-local git repo. v0 — env var override (simplest). Если staleness check gain'ает sophistication — пересмотр.

Эти кандидаты записываются в `architectural-backlog.md` если он существует (verify в Step 0); иначе surface'у в PR body.

---

## PR ordering

Один PR (per spec: «one-PR implementable»). Внутренний ordering steps:

1. Step 1 (template extension — additive, не breaks existing).
2. Step 2 (AP files — additive).
3. Step 7 (state field — backwards compat default 30).
4. Step 3 (linter — depends on Steps 1, 7 для field reads).
5. Step 4 (regression fixtures — depends on Step 3).
6. Step 5 (protocol doc updates — depends on Steps 3-4 cross-refs).
7. Step 6 (bootstrap-legacy — depends on Step 1 template sections).

Single commit per step (7 commits) для review hygiene. Squash при merge.

**Не split'аем на multi-PR:** Steps tightly coupled (linter без fixture'ов не verify'ится; protocol doc cross-ref'ит linter check names). PR size estimate: ~600-800 LOC across templates + scripts + docs + fixtures. Fixtures dominate (5 × ~80 LOC).

---

## Risks / open questions for operator

### Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-1 | **Regex-based invariant extraction FP/FN rate высокий.** Phrasing variation на русско-английском mix («never» / «никогда» / «ни при каких» / «обязательно» / «MUST NOT»). Слова в running prose != actual invariants. | High | Medium (operator alarm fatigue → rubber-stamp) | (a) Mode = warn, не fail by default. (b) FP rate measured against 5 regression fixtures — must быть <=10% per spec NFR. (c) Scope ограничен `## Invariants extracted` section ИЛИ `topology_impact: yes` spec'ов — не весь spec body. (d) LLM-based extraction отложен в out-of-scope spec'ом — приемлемо. |
| R-2 | **Brownfield extract accuracy.** Behaviour observed легко (code descriptive); invariants — harder (нужно отделить assertions от incidental code). Operator review mandatory mitigates, но если skeleton noise высокий — operator fatigue. | High | High | Skeleton template terse; `## Open questions` секция explicit'но invites operator вход; spec § «better miss than wrong» policy для invariants (0% FP). |
| R-3 | **Layer 3 reviewer trigger ambiguity.** Spec говорит: «при новой F-N spec creation — reviewer **дополнительно** делает cross-feature pass». Mandatory всегда или conditional (`topology_impact: yes`)? Plan trade-off: mandatory cheap (linter sub-second on small repos), conditional spares operator time на foundation-cold features. **Plan choice: mandatory linter pass всегда, escalation в operator question только если check flag'ает + `topology_impact: yes`.** Verify с operator. |
| R-4 | **Staleness fixture testability.** Linter use git-log — fixture не имеет real git history. Mitigation via env var override `STALENESS_FIXTURE_OVERRIDE=<days>` — adds fixture-only branch в production code. Smelly. Alternative — pure file-based timestamp comparison (mtime). Decision deferred к Step 3 implementation. |
| R-5 | **`affects_features:` adoption inertia.** Поле optional → operator не fills → linter falls back to pairwise mode → slower runtime + noisier output. NFR `<=5 sec на 20 specs` достижимо при pairwise; при 50+ specs может breach. Concern для product repos после года usage. |
| R-6 | **Retrofit В1 «hard floor» friction.** Spec § В1 говорит «extract ВСЕХ features before F-N+1». Operator с 10+ existing features faces ~hours of review. Если operator skips → reverts к В2 targeted, но Layer 3 work partial. Plan не enforce'ит hard floor программно (advisory only в bootstrap-legacy Choice 4 description) — surface to operator as conscious trade-off. |

### Open questions for operator

- **Q-1:** Plan choice по R-3 — mandatory linter pass всегда vs conditional на `topology_impact: yes`. **Plan recommendation: mandatory.** Approve / change?
- **Q-2:** Linter mode — `cross-feature-invariant` warn-by-default vs fail-by-default. **Plan recommendation: warn (regex baseline FP rate >0% per spec NFR — fail'ить нельзя без LLM upgrade).** Approve?
- **Q-3:** Fixture count — 5 separate vs 1 fixture × 5 cases. **Plan recommendation: 5 separate** (per Decision 2). Approve?
- **Q-4:** `staleness_days` default — 30 (per spec recommendation) vs другой baseline. **Plan recommendation: 30 days default, config-overridable per Decision 4.** Approve?
- **Q-5:** Spec acceptance § говорит «regression fixture `cross-feature-drift-001`» (single). Plan extends до 5 fixtures. Spec NFR says «>= 5 cases». Naming convention `cross-feature-drift-001..005` consistent с PR #71 `cross-doc-drift-001` (single fixture, single class). Approve naming?
- **Q-6:** Retrofit В1 hard floor — advisory only (plan default) или programmatic enforcement (`check-feature-coverage.sh` blocking F-N+1 если не все features extract'нуты)? **Plan recommendation: advisory только для v0.** Approve?

Anything missing from spec:
- **Spec doesn't specify** what happens когда retrofit'нутый spec → бывший code refactor'ится. AP-31 staleness covers это, но retrofit'нутые spec'и могут начать жизнь stale (extracted from old code). Plan не addresses — surface to operator.

---

## Acceptance mapping

Mapping spec § Acceptance criteria → plan steps.

| Spec acceptance criterion | Plan step(s) |
|---|---|
| `development-protocol.md` § 11 + § 12 разделы добавлены | Step 5 |
| `check-cross-feature-invariants.sh` существует, ловит regression fixture | Step 3 (как extension family, **не** standalone script — Decision 1; spec acceptance проинтерпретирован как «check existence» не «standalone file existence») |
| `bootstrap-legacy.md` имеет «Full retrofit» branch с 4-step flow | Step 6 |
| AP-31 + AP-33 файлы под `doc/anti-patterns/` | Step 2 |
| Spec template поддерживает optional `## Behaviour observed` + `## Invariants extracted` секции | Step 1 |
| Regression fixture `cross-feature-drift-001` под `doc/_templates/regression-cases/` с expected_keyword'ами | Step 4 (5 fixtures total: 001-005; criterion satisfied by 001 + 4 additional per NFR) |
| NFR: cross-feature check runtime <= 5 sec на repo с 20 specs | Step 3 (verify post-merge; instrumented log в первом use) |
| NFR: Layer 3 linter FP rate <= 10% на regression fixture set | Step 3 + Step 4 (measured, документируется в PR body) |
| NFR: Invariant extraction — regex baseline, LLM в out-of-scope | Step 3 (regex-only) |
| NFR: Brownfield extract точность — invariants 0% FP (better miss than wrong) | Step 6 + AP-31 file (Step 2) — design constraint |

---

## Plan-level decisions

Surface'у 4 plan-level decisions с rationale (per task brief):

### Decision 1. Linter family — extend `check-spec-discipline.sh` (NOT standalone)

**Choice:** Extend existing `check-spec-discipline.sh.tmpl` с new family `cross-feature-bounded` (functions `check_cross_feature_invariant` + `check_spec_staleness`).

**Rationale:**
- Consistency с PR #71 pattern (Layer 2 cross-doc-bounded family lives там же).
- Reuse: `--regression` mode infrastructure (auto-iteration over fixture dirs), override marker pattern (`[<family>-override: <reason>]`), staged-only mode, log_fail/log_warn/log_ok shared.
- Single CI invocation вместо двух — operator UX.
- Pre-commit hook integration через existing `install-git-hooks.sh.tmpl` без edit.

**Trade-off:** Script растёт (~1500 → ~1700 LOC). При v0.8 потенциально split на per-family files (out of scope this PR).

**Acceptance spec wording (`check-cross-feature-invariants.sh существует`)** interpreted as «check exists» — verify с operator (Q-3 above), but per consistency precedent с PR #71 это правильная интерпретация.

### Decision 2. Fixture count — 5 separate directories (NOT 1 × 5 cases)

**Choice:** 5 directories `cross-feature-drift-001..005` per spec NFR.

**Rationale:**
- Mirror PR #71 `cross-doc-drift-001` precedent.
- Easier diff: regression failure points к конкретному case directory.
- Each fixture self-contained (own `README.md` + `expected_finding.md` + minimal `features/*.md`) — readable in isolation.
- `run_regression_mode` уже итерирует по directories (line ~1005 — `for case_dir in "$cases_dir"/*/`) — zero infra change.

**Trade-off:** ~5 × 80 LOC = ~400 LOC of fixture files (file noise). Acceptable per Layer 2 precedent.

### Decision 3. Layer 3 trigger — `topology_impact: yes` frontmatter-driven (NOT mandatory linter on every spec)

**Choice:** Linter runs всегда (cheap), но **operator escalation** триггерится только если check flag'ает invariant overlap >= 2 AND new spec has `topology_impact: yes`.

**Rationale:** Spec § Layer 3 mechanism item 1-4. Per spec wording «при новой F-N spec creation — reviewer **дополнительно** делает cross-feature pass» (always) — linter always runs. «**Hard cross-feature triggers** (operator-gate)» — gated by topology_impact OR foundational change OR overlap. Plan honors both.

**Trade-off:** Operator может miss subtle cross-feature contradictions если `topology_impact:` mis-classified. Mitigation — линтер warn'ит даже без operator-gate trigger, surface через PR check status.

### Decision 4. AP-31 staleness threshold — config (`staleness_days:` в state file), default 30

**Choice:** Configurable per-product через `.ai-pm/.bootstrap-state.md` field `staleness_days:`, default 30. Hardcoded fallback 30 если поле missing.

**Rationale:**
- Spec § Open questions explicit asks «empirical or config?».
- 30 days reasonable default (Toggl team experience cited в WB skill ecosystem; недели — слишком noisy, кварталы — слишком permissive).
- Product repos с slower cadence (annual planning) могут tune до 90+; daily-deploy repos — до 7.
- Code cost: trivial (3 lines awk read + default fallback).

**Trade-off:** Hidden config field — operator может не знать про tuning option. Mitigation: bootstrap-legacy adds field with inline comment автоматически.

---

## Honest complexity notes

- **Invariant extraction regex fragility (R-1)** — primary correctness risk. Regex baseline is honestly weak; relies на discipline operator-PM писать invariants в structured `## Invariants extracted` section. Brownfield retrofit'нутые spec'и помогают (extract'ит invariants в правильную секцию), но greenfield spec'и где operator пишет invariants в running prose — miss. Plan accepts это; LLM upgrade в out-of-scope per spec.
- **Brownfield extract accuracy (R-2)** — second correctness risk. AI extract'ит «what code does», не «what code should do». Operator approval mandatory closes loop, но operator review time non-trivial (R-6).
- **Cross-feature reviewer pass — где живёт?** Inline в reviewer.md prompt (Step 5 § 11 cross-ref) или separate sub-agent? Plan recommendation: inline (PR #66 consolidated 11→5 agents, не множим). Verify в Step 5.
- **Fixture 004 (staleness) testability (R-4)** — env var override smell. Alternative: file mtime instead of git log. Decision deferred к Step 3 implementation; surface'у при Step 3 commit'е если smell stays.

---

## Out of scope (verbatim from spec, repeated for clarity)

- Auto-fix mode для stale spec'ов.
- Reverse engineering business logic из tests.
- Multi-repo spec sync.
- Spec versioning beyond AP-21 rework.
- LLM-based invariant extraction (regex baseline only v0).

Plan не extends out-of-scope; surface'у к operator only через ADR candidates если invariant FP rate >10% measured post-merge.

---

## Approval gate

После operator marker «поехали» — этот файл commit'ится; coder (Step 4 Stage E) приступает к реализации steps 1-7 в одном PR.

**Status:** draft. Open questions Q-1 .. Q-6 + acceptance interpretation re Decision 1 (single check vs standalone script) require operator approval перед Step 4.
