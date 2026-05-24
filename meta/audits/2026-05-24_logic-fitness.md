# Template logic audit — fitness for real-world dev (2026-05-24)

**Scope:** «полезен для реальной разработки + нет незакрытых дыр + нет вечных циклов + нет бесполезной работы не на том этапе».

**Context:** за неделю 22-24 мая в `ai-pm-protocol` merged 6 PR'ов с cross-cutting изменениями (UI split, DB split, subagent audit, specialized reviewers, dev coverage, README rewrite). Audit нужен убедиться, что cross-links не сломаны и шаблон годен для real-world запуска (HeartVault, ожидает apply).

**Method:** read-only анализ subagent prompts, `.tmpl` шаблонов, anti-patterns.md, development-protocol.md, README.md.

---

## Findings

### Blocking (мешает использовать шаблон)

#### [B-1] AP-14 структурный read-pass не enforced в CI

**Файлы:** `doc/development-protocol.md` § 11 (Step 0), `doc/_templates/feature-spec.md.tmpl`, `.claude/agents/protocol-compliance-reviewer.md` (Frontmatter completeness), `doc/_templates/scripts/check-spec-discipline.sh.tmpl`

**Описание:** AP-14 требует read-pass по `user-journeys.md` / `threat-model.md` / `mvp-scope.md` / `topology.md` перед feature spec'ом. Impact flags (`journey_impact` / `threat_impact` / `scope_impact` / `topology_impact`) должны быть в frontmatter spec'а. Но:

1. `check-spec-discipline.sh.tmpl` **не проверяет** наличие этих флагов в frontmatter (есть check на `spec-structure`, но не на impact полях).
2. `reviewer.md` § 3.5 «Structural impact verification» проверяет cross-references только когда флаг = yes; не проверяет, что флаги **вообще заполнены** (не пусто).
3. AI может пропустить read-pass и заполнить «no» во все 7 флагов автоматически.

**Следствие:** Spec PR может пройти без реального structural read-pass'а. Reviewer заметит только если explicitly ищет.

**Предлагаемая правка:** В `check-spec-discipline.sh.tmpl` добавить hard check: все 7 impact полей присутствуют в frontmatter и не пусты. Если какое-то «no» — reviewer в Step 7 должен через AskUserQuestion подтвердить осознанность.

---

#### [B-2] Trust profile дифференциация не читается автоматически из `.bootstrap-state.md`

**Файлы:** `.claude/agents/planner.md` (§ Trust profile awareness), `.claude/agents/coder.md` (§ Trust profile awareness), `.claude/agents/reviewer.md` (Step 1.5)

**Status (post-verification): INVALID — false positive.**

Audit заявил, что agents не читают state file. Verification grep'ом показал обратное:

- `.claude/agents/planner.md:90` — «Читай `.ai-pm/.bootstrap-state.md` → `trust_profile` setting (A/B/C, default A)» + concrete dual templates verbose A / mixed B / terse C.
- `.claude/agents/coder.md:111` — «Читай `.ai-pm/.bootstrap-state.md` → `trust_profile` setting» + concrete differentiation full ceremony / mixed / terse.
- `.claude/agents/reviewer.md:51` — «Читай `.ai-pm/.bootstrap-state.md` → `trust_profile`. Adapts: …» + lite-mode adaptation.

**Корень ошибки:** audit делал Explore-agent с inline-сканом без deep verification. Inline-finding не подтвердился фактами.

**Действие:** finding отменён. Trust profile auto-read **уже работает корректно**. CLAUDE.md.tmpl session-start reminder можно рассмотреть как опциональный Low-finding для лишней страховки, но не Blocking.

---

### High (логическая дыра / реальный риск)

#### [H-1] AP-19 `pr_ordering` может быть пропущен без валидации

**Файлы:** `.claude/agents/planner.md` (§ PR ordering), `doc/_templates/feature-spec.md.tmpl`, `.claude/agents/coder.md` (§ Per-PR atomicity), `.claude/agents/protocol-compliance-reviewer.md` (Frontmatter completeness)

**Описание:** AP-19 требует: multi-domain фича (schema + backend + frontend) должна иметь `pr_ordering: [schema, backend, frontend]` в frontmatter spec'а. Planner пишет рекомендацию в plan'е. Но:

1. Нет enforced check, что planner **обязан** заполнить `pr_ordering` для multi-domain фичи.
2. `feature-spec.md.tmpl` показывает `pr_ordering: null | [...]` как опциональное.
3. Coder останавливается и эскалирует PM'у, если plan не задал — **это очень поздно** (Step 4, spec уже merged).

**Следствие:** Multi-domain фича может пройти Step 2 (plan approval) без `pr_ordering`. AP-3 (operator-gate) нарушается: решение должно быть на Step 1-2, не Step 4.

**Предлагаемая правка:**
1. В `check-spec-discipline.sh.tmpl` добавить heuristic: если scenarios spec'а касаются ≥2 domain'ов (есть слова `schema`/`migration` И `API`/`endpoint` И `UI`/`view`), то `pr_ordering` обязателен.
2. Planner checklist: «Multi-domain? → `pr_ordering` задан → ok».

---

#### [H-2] Mode 3 rework — нет exit condition на количество версий spec'а

**Файлы:** `doc/development-protocol.md` § 3.3 (Mode rework-feature), `doc/_templates/feature-spec.md.tmpl`, `doc/_templates/feature-plan.md.tmpl`, `.claude/agents/reviewer.md`

**Описание:** Mode 3 требует `<topic>_spec.v<N>.md` с Diff-секцией и `_plan.v<N>.md` с Migration-секцией. Reviewer проверяет наличие. Но если PM в Step 6 (acceptance) скажет «нет, не то», AI спрашивает «переделать?» → PM «да» → spec.v2 → plan.v2 → review.v2 → PM снова не одобряет → spec.v3 → …

**Следствие:** Нет явного exit condition на количество rework-версий. AI не отклоняется (AP-6), ждёт PM ок — но цикл может быть бесконечным.

**Предлагаемая правка:** В `feature-spec.md.tmpl` frontmatter: `version: 1` (auto-increment). Reviewer check: если version ≥ 3, AskUserQuestion: «3-й iteration этой фичи. Адресует ли spec.v3 findings spec.v2? Если нет → recommend split на отдельное упражнение или abort фичу». Решение PM — продолжать или остановить.

---

#### [H-3] Competitive UX scan в feature-spec пересекается с Stage A competitive-analysis

**Файлы:** `doc/_templates/feature-spec.md.tmpl` (§ Competitive UX scan), `doc/development-protocol.md` § 11.0 (Stage F readiness), `doc/_templates/competitive-analysis.md.tmpl`

**Описание:** Stage A требует `competitive-analysis.md` (landscape-уровень, once per продукт). Feature spec требует per-feature UX scan. Описание в feature-spec уточняет «узкая: как другие реализовали этот **тип** фичи, не landscape». Но:

1. `development-protocol.md` говорит Stage A анализ — **once per продукт**.
2. Feature-spec recommend'ит per-feature scan для **каждой** значимой фичи Mode 2.
3. Нет ясно defined: когда одного Stage A анализа достаточно, когда нужен per-feature слой.

**Следствие:** Риск дубля бесполезной работы. Mode 1 продукт с 50 фичами — каждая своя UX scan, повторяющий Stage A?

**Предлагаемая правка:** В `feature-spec.md.tmpl` § Competitive UX scan уточнить критерии «когда обязательно»: (a) Mode 1 значимая UX фича (>10% flow) и Stage A landscape был ≥60 дней назад; (b) Mode 2 добавляет UX паттерн, не покрытый Stage A competitors-list; (c) Mode 3 редизайн UI. Иначе — опционально.

---

#### [H-4] README не объясняет режимы разработки (Mode 1 / 2 / 3 / bug-fix)

**Файлы:** `README.md` (вся страница)

**Описание:** Modes упомянуты в README в 4 местах: колонка таблицы стадий (Mode 1 greenfield / Mode 2/3 existing) — без раскрытия что это; строка про doc/ layout (Mode 1 top-level / Mode 2/3 .ai-pm/doc) — implicit context; `coder` lite-mode hierarchy (это совсем другое — lite-mode ≠ main mode). Никакого объяснения **что такое** Mode 1 vs Mode 2 vs Mode 3 vs bug-fix, **когда какой выбирать**, **как они отличаются** в README нет. Полное описание — в `development-protocol.md` § 3, но README на это не отсылает.

**Следствие:** Оператор читает README, видит «Mode 1 / 2/3» в таблице — не понимает, какой выбрать для своего случая. Bootstrap-agent спросит при init, но без контекста PM ответит наугад.

**Предлагаемая правка:** В README после «Шесть стадий» добавить короткую секцию «Четыре режима» с одноабзацной таблицей:
- **Mode `new-product`** — greenfield, нет существующего кода/docs. Полный Stage A→F.
- **Mode `new-feature`** — существующий проект, добавляем фичу. READ Stage A-C, WRITE дельт; Stage F per фича.
- **Mode `rework-feature`** — переписываем существующую фичу, поведение меняется. Spec.v2 с Diff-секцией.
- **Mode `bug-fix`** — лёгкий вариант Mode 2 для багфиксов: lite-mode spec + terser plan + failing test first.

Подробности — `development-protocol.md` § 3.

---

### Medium (smell / неполнота)

#### [M-1] Specialized reviewers документированы неравномерно

**Файлы:** `.claude/agents/{backend-reviewer, frontend-reviewer, design-reviewer, database-reviewer, protocol-compliance-reviewer}.md`

**Описание:** Глубина документации неравномерна: `reviewer.md` (primary) ≈ 280 строк, `protocol-compliance-reviewer.md` ≈ 100, `backend-reviewer.md` ≈ 150. Не все имеют структуру: «Когда зовут / Чистый контекст / Что проверяешь / Output format / Severity tags».

**Следствие:** Primary reviewer может invoke specialized без полного контекста; specialized может пропустить check, если в его prompt'е этого нет.

**Предлагаемая правка:** Выровнять все 5 specialized reviewer'ов по единому template.

---

#### [M-2] AP-13 операционные docs — нет explicit лёгкого режима для Mode 2

**Файлы:** `doc/anti-patterns.md` § AP-13, `doc/development-protocol.md` § 11.0, `doc/_templates/feature-spec.md.tmpl`

**Описание:** AP-13 таблица Mode-aware: Mode 1 обязательно, Mode 2/3 условно. В feature-spec frontmatter поля `legal_impact / validation_required / incident_impact` — всегда требуются. Но нет ясного ответа: если `legal_impact: no` и Mode 2, может AI **пропустить** обновление legal-brief?

**Предлагаемая правка:** В feature-spec inline clarification: «yes → обновить соответствующий artifact PR; no → skip (пусто до next change)».

---

#### [M-3] `lite-mode: c-fast` может пропустить protocol-compliance check

**Файлы:** `.claude/agents/coder.md` (§ Lite-mode), `.claude/agents/reviewer.md` (§ Lite-mode adaptation)

**Описание:** Lite-mode `c-fast` (Trust profile C + small changes) пропускает specialized reviewers. Но: нет explicit check, что spec существует/approved; нет check AP-6 (silent deviation).

**Следствие:** Small backend fix может пройти без spec↔code consistency check, AP-6 violation проскользнёт.

**Предлагаемая правка:** Даже для `c-fast` обязателен protocol-compliance-reviewer (spec/plan existence + AP-6). Остальные skipped OK.

---

#### [M-4] Frontmatter feature-spec ↔ feature-plan propagation не определена

**Файлы:** `doc/_templates/feature-spec.md.tmpl`, `doc/_templates/feature-plan.md.tmpl`, `.claude/agents/protocol-compliance-reviewer.md`

**Описание:** Spec frontmatter: 10+ полей (topic / mode / lite-mode / created / spec_approved / plan_approved / acceptance / merged / review_url / 7 impact / pr_ordering). Plan frontmatter «те же fields propagate + plan-specific» — но какие plan-specific, не определено. Нет routine'ы как propagate.

**Предлагаемая правка:** В `feature-plan.md.tmpl` явно: какие поля копируются из spec'а, какие override'ятся (acceptance = pending на start; plan_approved заполняется в Step 3). Planner routine: copy frontmatter spec'а, update plan-specific.

---

### Low / Nit

#### [L-1] AP-12 grep-список англицизмов — manually maintained в тексте

**Файлы:** `doc/anti-patterns.md` § AP-12

**Описание:** Правило требует grep перед каждым commit'ом doc-файла. Список англицизмов — manually maintained в тексте AP-12. AI может пропустить, если не помнит весь список.

**Предлагаемая правка:** `.ai-pm/.anglicism-check.txt` (один терм на строку), использовать в pre-commit hook. Либо генерировать из AP-12 автоматически.

---

#### [L-2] `.bootstrap-state.md` revisit closed stage — нет formal routine

**Файлы:** `doc/_templates/bootstrap-state.md.tmpl`, `.claude/agents/project-bootstrap.md`

**Описание:** Если PM хочет revisit закрытый Stage (например, новая persona после Stage A closed), нет ясного пути. State говорит A-E closed, PM хочет обновить — bootstrap-agent confused.

**Предлагаемая правка:** В `project-bootstrap.md` routine: если PM хочет revisit Stage X (закрытый), AskUserQuestion «Stage X closed YYYY-MM-DD. Обновляем? → docs/<stage>-update branch». После «да» — re-open stage, продолжить.

---

#### [L-3] Competitive UX scan — формат не определён

**Файлы:** `doc/_templates/feature-spec.md.tmpl` § Competitive UX scan

**Описание:** Template показывает 2-5 компаний в примере, но без minimum/maximum, без criteria выбора.

**Предлагаемая правка:** Guidance: «2-5 прямых конкурентов + 1-2 adjacent если применимо. Фокус — UX паттерн, не размер компании».

---

## Gaps (отсутствующие mode'ы / возможности)

#### [G-1] Template-apply mode — полностью отсутствует

**Описание:** Шаблон покрывает Mode 1 (greenfield) / Mode 2 (new-feature existing) / Mode 3 (rework) / bug-fix. **Не покрывает:** «проект bootstrap'ed 3 месяца назад на template v0.0, template обновился до v0.1, нужно apply изменения в продукт без ломки существующего bootstrap state». **HeartVault находится точно в этой точке** — bootstrap done (Stage E closed), template обновился (6 PR за неделю с cross-cutting изменениями).

**Признаки missing mode:**
- Нет subagent'а для diff template version → apply
- В `bootstrap-state.md.tmpl` нет поля `template_version_last_applied`
- В `project-bootstrap.md` routing matrix нет «template обновился, apply»
- В README нет про обновление foundation при template bump

**Предлагаемая правка:** Спроектировать Mode 4 (`template-apply` / `template-sync`) — отдельный PR / design doc. Routine:
1. Detect template version mismatch в `.bootstrap-state.md` (`template_version` vs current submodule HEAD).
2. Читать CHANGELOG template'а / git diff между versions.
3. Mapping: какие template changes требуют какого apply в продукт (per-kind file added → write per-kind file; AP added → list в anti-patterns reference; subagent added → list в CLAUDE.md briefing).
4. Открывать дельта PR'ы в продукте (по AP-19 — атомарные, по типу изменения).
5. После apply — `template_version` обновляется в state.

Это **критический gap** для multi-month projects. HeartVault — first test case.

---

#### [G-2] Backlog / Tech debt tracking — отсутствует formal artifact

**Описание:** MVP scope часто имеет deferred features («Этап 1.5+», см. tasks #20, #24, #29, #31, #32). Но нет artifact'а для управления backlog'ом. Где живут будущие фичи? Как не забыть?

**Предлагаемая правка:** Опциональный artifact в Stage B: `backlog.md` (Mode 1 или планируется 1.5+). Per item: F-ID / название / rough effort / blocked-by.

---

#### [G-3] Legacy project без bootstrap — нет lightweight adoption-mode

**Описание:** Текущие modes (Mode 1 new-product / Mode 2 new-feature / Mode 3 rework-feature / bug-fix вариация Mode 2) **все** предполагают что Stage A-E bootstrap уже сделан. Mode 1 — bootstrap делается **сейчас**. Mode 2/3/bug-fix — bootstrap **сделан раньше**.

Что НЕ покрыто:
- **Legacy product без bootstrap:** реальный продукт работает, есть код, возможно есть docs, но **никогда не делался через ai-pm-protocol**. Оператор хочет добавить фичу или починить bug по дисциплине шаблона, но не готов потратить недели на полный Stage A-E retrofit.

Сейчас оператор оказывается в bind:
- Mode 1 не подходит (продукт не greenfield)
- Mode 2 требует «Stage A-D наполнены» (наполнены не по шаблону, в произвольной форме; шаблон не имеет инструкции «прочти legacy docs и map'и в свои поля»)
- Mode 3 же требует existing `_spec.md` / `_plan.md` (которых нет, потому что фича не была сделана через шаблон)
- bug-fix lite-mode требует hint что bug в Mode 2 stack, но всё равно ожидает foundation

**Что нужно:** lightweight mode — **«local-only adoption»** — для atomic per-feature/per-bug адаптации шаблона на legacy проекте, без full bootstrap. Предлагаемый shape:

- **Mode 5: `legacy-feature` / `legacy-bugfix`** (или один `legacy-partial` с lite-mode маркером).
- Setup:
  - `.ai-pm/.bootstrap-state.md` создаётся с `mode: legacy-partial`, frontmatter большинства Stage A-E полей `n/a (legacy)`.
  - `trust_profile` — обязателен.
  - `stack` — обязателен (детектируется или operator answers).
  - Foundational artifacts (`personas.md`, `journeys`, `threat-model`, `mvp-scope`, `topology`) — **lazy**: создаются только если impact flag фичи = yes. Если фича не trogает journeys → personas.md не нужен.
- Workflow per фичу/bug:
  - Минимум: `<topic>_spec.md` + `_plan.md` + tests + review.
  - AP-14 read-pass: только existing project docs (README, ADRs если есть, OpenAPI / schema), не template foundational docs.
  - Reviewer: protocol-compliance + domain reviewer; checks adapted на «mode=legacy-partial» (не require foundational cross-refs где их нет).
- Когда переходить на full Mode 2: когда количество lazy artifacts ≥ 3 → operator получает recommendation «promote to full Mode 2 (require Stage A-D backfill)».

**Отличие от [G-1]:** G-1 = existing project **с** bootstrap done, template ушёл вперёд → apply diff. G-3 = existing project **без** bootstrap, нужно local atomic application. Это **разные mental models**:
- G-1 — version mismatch, sync
- G-3 — partial adoption, lazy foundation

**Предлагаемая правка:** Отдельный design doc на Mode 5 `legacy-partial`. См. также task на G-3 implementation.

---

## Trust profile дифференциация — реальная или cargo cult?

**Наблюдение:** Trust profile A/B/C определены в 4 местах (project-bootstrap / planner / coder / reviewer) с дифференцированным dual templates (verbose A / mixed B / terse C). Дифференциация **реальна** — output ощутимо разный. Но:

1. Profile B/C assume'ит «developer читает diff» — это верно только если developer постоянный (знает стек). Не работает для dynamic teams.
2. Profile A (PM не читает код) — основной differentiator; B/C — variations.
3. Default profile = A (default из bootstrap state).

**Вердикт:** Дифференциация **нужна, реальна и работает**. Audit изначально заявил недостаток ([B-2]), но verification показал — это false positive. Реализация полная.

---

## Summary (post-verification)

**Полезность:** Шаблон **полезен для real-world разработки**. Покрывает lifecycle greenfield → multi-feature production. Cross-cutting изменения недели logically sound и интегрированы.

**Дыры:** **1 blocking** (AP-14 CI enforcement), **4 high** (pr_ordering validation, Mode 3 infinite loop, Competitive UX redundancy, **README не объясняет modes**). [B-2] отменён как false positive. Остальное — medium/low.

**Циклы:** Infinite loop не обнаружено, кроме потенциального Mode 3 rework v1→v2→v3→… без exit — высокий риск, fixable ([H-2]).

**Бесполезная работа:** Competitive UX scan может дублировать Stage A ([H-3], нужны criteria). Остальное хорошо распределено по stages.

**Критические gap'ы для real-world adoption (3 mode'а отсутствует):**
- **[G-1]** Template-apply mode — existing project **с** bootstrap, template ушёл вперёд (HeartVault).
- **[G-3]** Legacy partial mode — existing project **без** bootstrap, atomic adoption на фичу/bug (тяжёлый retrofit неоправдан).
- [G-2] Backlog tracking — отсутствует formal artifact для deferred features.

G-1 и G-3 — **разные mental models** (sync vs partial adoption), требуют отдельных design'ов.

---

## Рекомендация на immediate action — status (post-merge 2026-05-24)

| # | Finding | Status | PR |
|---|---|---|---|
| 1 | **[H-4]** README mode discoverability | **closed** | #13 (merged) |
| 2 | **[B-1]** AP-14 CI enforcement | **closed** | #14 (merged; mega-PR с operator-neutralize development-protocol.md task #58) |
| 3 | **[H-1]** pr_ordering validation | **closed** | #15 (merged) |
| 4 | **[H-2]** Spec versioning + exit condition (AP-21) | **closed** | #16 (merged) |
| 5 | **[H-3]** Competitive UX scan criteria refinement | **closed** | #17 (merged) |
| 6 | **[B-2]** Trust profile auto-read | **INVALID** | false positive — agents уже читают state |
| 7 | **[G-1]** Template-apply mode | open | task #48 (отдельный major цикл, HeartVault use case) |
| 8 | **[G-3]** Legacy partial mode | open | task #56 (отдельный major цикл, idea pending operator discussion) |

[M-1..4] и [L-1..3] — пока deferred, могут попасть в second audit pass (task #55).

**Verdict (post-fix):** все blocking + high findings закрыты. Шаблон **production-ready** для multi-week real-world projects на основе шаблона. [G-1] и [G-3] — отдельные major pieces для существующих продуктов (HeartVault test case для G-1; любой legacy adoption для G-3) — не блокирует use as-is.

Сам audit doc остаётся как **исторический артефакт** в `doc/audits/` — analogously `doc/reviews/`. Полезен для понимания evolution шаблона.
