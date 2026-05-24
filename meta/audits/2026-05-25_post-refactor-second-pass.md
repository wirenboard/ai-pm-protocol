# Second audit pass — duplicates / logic / clutter / orphans (2026-05-25)

## Scope: post-refactor verification после v0.1.0

Read-only audit финального состояния template (`/home/adegtyarev/dev/ai-pm-protocol/`)
после серии major refactor PR'ов #21-#26 (mode matrix redesign + legacy adoption +
template versioning + Tier 0-3 framework + state-aware checks). Tag `v0.1.0`.

Цель — найти дубли / нарушения логики / запутанность / избыточность / потерю связей,
аккумулированные за серию PR'ов. Не grammar / spell-check / performance.

---

## Findings

### Blocking (cross-ref violations, broken contracts)

- **[B-1] Mode-numbering terminology drift в anti-patterns.md и templates** —
  `doc/anti-patterns.md` (AP-13 table line 130-132, AP-14 line 549-553, AP-15 line 504-509),
  `doc/development-protocol.md` § 2.0 line 47-49, § 4 stages-table line 273, § 5.2 line 301,
  § 6 lines 376-377, § 11.0 lines 542-546, § 11 line 579, `doc/_templates/bootstrap-state.md.tmpl`
  lines 101, 106, 109-111, 122-123, `doc/_templates/customer-interview-script.md.tmpl`,
  `doc/_templates/incident-runbook-draft.md.tmpl`, `doc/_templates/ui-style-guide-base.md.tmpl`,
  `doc/_templates/strategic-frame.md.tmpl`, `doc/_templates/competitive-analysis.md.tmpl`,
  `doc/_templates/brand-voice.md.tmpl`, `.claude/agents/reviewer.md` line 272+298,
  `.claude/agents/release-helper.md` line 141 — **до PR2 (#22)** mode'ы были `new-product` / `new-feature` / `rework-feature` / `bug-fix`,
  поэтому положительные числа Mode 1 / Mode 2 / Mode 3 однозначно мапились
  (1=new-product, 2=new-feature, 3=rework-feature). После rename'а (`new-feature` →
  `feature`, `rework-feature` → `rework`) **и** добавления 5-го mode (`template-sync`)
  positional numbering сломан: Mode 2 и Mode 3 теперь неоднозначны (Mode 2 = `feature` или
  `rework`?), bug-fix и template-sync не существуют в этих таблицах вообще.
  Семантический gap: development-protocol.md § 3.1 определяет 5 modes by name, а § 4
  Stages таблица показывает только 3 columns «Mode 1 | Mode 2 | Mode 3». —
  **Suggested fix:** заменить все «Mode N» (где N — число) на «Mode `new-product` / `feature` / `rework`»
  по тексту; в Stages таблице расширить до 5 columns or использовать «WRITE / READ + delta / READ / SKIP»
  с разделением по name'ам. Без этого fix'а оператор / coder / reviewer при чтении
  templates получает противоречивый сигнал — старая нумерация vs новая naming convention.

- **[B-2] Spec template не показывает требуемый YAML frontmatter в head'е файла** —
  `doc/_templates/feature-spec.md.tmpl` (заголовок line 1-5) — нет YAML frontmatter
  блока в head'е (`---\n<fields>\n---`); фронтматтер фигурирует только внутри
  `## Impact assessment` секции (line 169) как YAML code-block. Но:
  - `CLAUDE.md.tmpl` lines 21-25 говорит «по frontmatter каждого `_spec.md`» —
    подразумевает реальный frontmatter в head'е.
  - `reviewer.md` line 18 читает «frontmatter + scenarios».
  - `planner.md` line 26 ожидает frontmatter в spec.
  - `coder.md` line 14 reads `<topic>_plan.md` который тоже должен иметь frontmatter.
  - AP-21 (rework exit) + reviewer.md Step 7 lines 282-298 требуют `version: N` field —
    но template не показывает это поле в example.
  - 7 impact флагов (AP-13 + AP-14) + `pr_ordering` (AP-19) + `lite-mode` + `version`
    + lifecycle markers (`spec_approved`, `plan_approved`, `acceptance`, `merged`,
    `review_url`) — все требуются разными частями системы (CLAUDE.md, reviewer.md,
    planner.md, check-spec-discipline.sh), но nowhere consolidated в example frontmatter
    блоке. —
  **Suggested fix:** добавить полный YAML frontmatter блок в head'е feature-spec.md.tmpl
  (lines 1-30 area) со всеми required полями и комментариями про их семантику.
  Раздел `## Impact assessment` оставить как explanation секцию, но frontmatter
  должен жить в head'е файла.

- **[B-3] Feature-review template не соответствует reviewer.md Step 5 spec'у** —
  `doc/_templates/feature-review.md.tmpl` (всего 58 строк) vs `reviewer.md` § Step 5
  (lines 159-209) — выходной формат reviewer'а не совпадает с template'ом:
  - **Нет YAML frontmatter** (template starts с `# <Feature> — Review Report` без `---`).
    reviewer.md output template (lines 162-170) требует frontmatter: `pr`, `branch`,
    `reviewer`, `reviewed_at`, `trail_type`, `spawned_agents`.
  - **Нет `**Verdict:** approve | approve-with-comments | request-changes` line** в первых
    50 строках. AP-16 (line 420) делает эту line **mandatory** (verdict-gate hook
    parsит её для блокирования `gh pr create` / `gh pr merge`).
  - **Описание устаревшее** — template line 12 говорит «Reviewer agent: protocol-compliance-reviewer
    / security-reviewer» — но `security-reviewer` отсутствует в .claude/agents/
    (есть protocol-compliance / backend / frontend / design / database — AP-20 routing).
    «security-reviewer» — orphan agent name, никогда не существовал в этой версии.
  - **Sections структура** в template (Spec coverage / Plan adherence / Test discipline /
    Security architecture / Findings / Conclusion) не совпадает с reviewer.md output
    template (Cross-cutting / Specialized findings split). — **Suggested fix:**
    переписать `feature-review.md.tmpl` под reviewer.md Step 5 output format,
    добавить frontmatter и `**Verdict:** ...` placeholder, убрать ссылку на
    несуществующий security-reviewer.

- **[B-4] Scripts location inconsistency в development-protocol.md** —
  `doc/development-protocol.md` § 5.2 line 316 говорит: «все скрипты живут в **product**
  репозитории (`scripts/`), не в submodule `.ai-pm/tooling/`».
  Но **§ 9.2 line 477** + **§ 9.1 line 453** ссылаются на «`.ai-pm/tooling/scripts/check-spec-discipline`».
  Также шапки `.tmpl` файлов (`check-spec-discipline.sh.tmpl` line 2,
  `check-git-safety.sh.tmpl` line 2, `update-bootstrap-state.sh.tmpl` line 2, etc.)
  все говорят `# .ai-pm/tooling/scripts/<name>` — old path в комментариях шапки.
  `install-git-hooks.sh.tmpl` line 56-57 hard-code'ит `.ai-pm/tooling/scripts/check-spec-discipline`
  как execution path. **При генерации scripts на Stage E** (bootstrap-agent) этот путь
  заведомо invalid если scripts генерятся в product `scripts/`. — **Suggested fix:**
  (1) обновить все `.tmpl` шапки commentary к `scripts/<name>` (product path),
  (2) install-git-hooks.sh.tmpl должен вызывать `scripts/check-spec-discipline` (не
  `.ai-pm/tooling/scripts/check-spec-discipline`),
  (3) развернуть § 9.2 + § 9.1 references на `scripts/check-spec-discipline`.

### High (logic gaps, missing references)

- **[H-1] CLAUDE.md.tmpl session start не упоминает foundation_completeness check** —
  `doc/_templates/CLAUDE.md.tmpl` Session start routine (lines 11-29) описывает только
  Шаг 1 (read state) + Шаг 2 (scan features) + Шаг 3 (listen). Но новая schema PR1
  ввела `foundation_completeness` + `adoption_path` поля и они determine'ят behavior
  reviewer / planner / coder. PM при first session не получает явное routing для
  `foundation_completeness: minimal/none` cases (там нужен Tier 1 mini-research per
  feature). Project-bootstrap.md уже handle'ит это (§ Lifecycle routing), но CLAUDE.md.tmpl
  briefing не дает hint. — **Suggested fix:** в Session start routine добавить
  «Шаг 1.5: проверь foundation_completeness, если minimal/none — предупреди PM что
  per-feature mini-research потребуется».

- **[H-2] `trail_type` field в reviewer.md output frontmatter — orphan** —
  `.claude/agents/reviewer.md` line 168 (Step 5 output example) показывает frontmatter
  field `trail_type: committed-review (AP-16)`. Нигде больше не declared / consumed:
  no script parses it, no schema declares allowed values, AP-16 prose не mentions
  field name. Поле — рудимент / aspiration не доведённая до implementation. — **Suggested
  fix:** либо declared в AP-16 как mandatory field с enum значениями (`committed-review` /
  `local-trace` / `skip-marker`) и check-pr-has-review.sh парсит → use it; либо удалить
  из reviewer.md output template.

- **[H-3] Template-sync workflow ссылается на `meta/template-sync-doc-migration-<date>.md` без spec'а
  где это file lives в product** — `.claude/agents/project-bootstrap.md` § Template-sync
  Phase 3 line 366 пишет «writes report в `meta/template-sync-doc-migration-<date>.md`».
  Но `meta/` в template repo — internal directory (README.md line 156-157 говорит «meta/ —
  template-internal, не копируется в продукт»). В product repo `meta/` не существует
  по default'у. Workflow для product сломан без явного создания `meta/` или alternative
  location (e.g. `.ai-pm/migrations/`). — **Suggested fix:** specify где artifact живёт
  в product repo — рекомендуется `.ai-pm/migrations/` или `doc/template-sync/`.

- **[H-4] Architecture overview routing сохраняет в `meta/architecture-extract-<date>.md`
  по той же причине** — `.claude/agents/project-bootstrap.md` line 187 (extract-all.sh
  --read-only invocation) пишет «writes в `meta/architecture-extract-<date>.md`»;
  line 483 говорит «Save → `meta/architecture-extract-<YYYY-MM-DD>.md` (template repo) или
  `doc/architecture-extract-<YYYY-MM-DD>.md` (product)». Inconsistent vs Phase 3
  выше. — **Suggested fix:** унифицировать convention — например, всё что extract'но
  in product → `doc/_extracts/<name>-<date>.md`.

- **[H-5] feature-spec.md.tmpl `## Mini-foundation sections` — потенциально
  избыточная секция в `complete` state** — template line 13-58 описывает Mini-persona /
  Journey context / Mini-threat-list секции **с условием** «только при
  `foundation_completeness: minimal | none | partial`». Но **template — это skeleton**,
  и operator/AI при использовании в `complete` state будет видеть эти секции и должен
  явно их удалять. Это adds friction для greenfield projects, где 95% spec'ов будут
  в `complete` state (greenfield bootstrap → foundation_completeness=complete). —
  **Suggested fix:** переместить mini-foundation sections в отдельный
  `_templates/feature-spec-legacy-supplement.md.tmpl`, который bootstrap-agent на
  Stage F (для projects with minimal/none) добавляет inline. Или явно маркировать
  как `<!-- DELETE если foundation_completeness=complete -->` HTML comment.

- **[H-6] AP-16 review-trail discipline: `.ai-pm/.reviews/` location vs current
  template** — AP-16 line 461 + line 222 reviewer.md говорит «`.ai-pm/.reviews/` в `.gitignore`
  (local-only)». Но bootstrap-state.md.tmpl Stage E checklist (line 137) говорит
  «.gitignore: `.ai-pm/.reviews/` добавлено». Это хорошо. Однако
  install-git-hooks.sh.tmpl, settings.json.tmpl, и project-bootstrap.md **не**
  generate-ят `.ai-pm/.reviews/` directory automatically (что normal — это local-trace),
  но `check-pr-has-review.sh.tmpl` нужен и **он не виден в `_templates/scripts/`** —
  let me check. Файл существует. — **Confirmed clean** (не finding).

### Medium (duplicates с potential drift, clutter)

- **[M-1] 3-choice legacy adoption описан в 3 местах** —
  - `README.md` lines 65-72 (table format с trade-off column),
  - `doc/development-protocol.md` § 3.10 lines 222-248 (text + hard floor explanation),
  - `.claude/agents/project-bootstrap.md` § Legacy adoption lines 93-176 (полный routine),
  - `meta/design/2026-05-24_mode-matrix-and-adoption.md` § D lines 80-145 (canonical source).
  Все четыре описания **в текущий момент** согласованы, но при будущих изменениях
  (например, добавлении 4-го choice) дрифт почти неизбежен. — **Suggested fix:**
  держать design doc как canonical source-of-truth + остальные 3 должны быть короче
  с явным ссылкой «See design doc §D for full trade-off framework». Реструктурировать
  не критично сейчас, но fix перед v0.2.0.

- **[M-2] Tier framework описан в 4 местах** —
  - `README.md` Legacy adoption tier таблица lines 75-82,
  - `doc/development-protocol.md` § 3.11 lines 250-258,
  - `.claude/agents/project-bootstrap.md` § Tier 0/1/2/3 routines (4 separate sections),
  - `meta/design/2026-05-24_mode-matrix-and-adoption.md` § F (canonical).
  Similar дубль как M-1. — Same suggested fix.

- **[M-3] Hard floor list (что нельзя skip даже в Choice 3) описан в 3 местах** —
  - `doc/development-protocol.md` § 3.10 lines 243-247 («Hard floor — что нельзя skip»),
  - `.claude/agents/project-bootstrap.md` lines 171-176 («Hard floor — что нельзя skip даже в Choice 3»),
  - AP-22 lines 179-184 («Hard floor — override не разрешён для»),
  - design doc § D Choice 3 paragraph.
  Списки **в текущий момент совпадают** (stage-e-hooks / trust_profile / stack), но
  drift risk при изменениях. — **Suggested fix:** consolidate в AP-22 как canonical,
  остальные ссылаются.

- **[M-4] `lite-mode` variants описаны в 3 местах с разной полнотой** —
  - `coder.md` § Lite-mode таблица lines 154-159 (4 variants: no / bugfix / small-fix /
    c-fast + Trust profile eligibility),
  - `reviewer.md` § Step 1.5 lines 77-80 (3 variants only: c-fast / bugfix / small-fix —
    нет `no`),
  - `README.md` Bug-fix section line 59 (упоминается hierarchy без детали),
  - `doc/development-protocol.md` § 3.7 lines 174-183 (только `bugfix`, не упоминает
    small-fix / c-fast).
  development-protocol.md как «source of truth» **не упоминает** small-fix / c-fast.
  Это discrepancy — agent prompts расширили vocabulary без обновления protocol. —
  **Suggested fix:** обновить § 3.7 для полного списка lite-mode variants.

- **[M-5] AP-13 / AP-14 mode-aware таблицы дублируются** —
  `doc/anti-patterns.md` AP-13 table lines 128-133 и AP-14 table lines 547-553 — обе
  таблицы перечисляют Mode 1 / Mode 2 / Mode 3 / lite-mode-bugfix с одной структурой.
  Полезный visual pattern, но при изменении modes (что **уже произошло** в PR2)
  таблицы должны были обновляться synchronously — они **не были**. — **Suggested fix:**
  объединить в одну таблицу «7 impact flags per mode» в одном месте (например
  `feature-spec.md.tmpl`'s Impact assessment section), остальные ссылаются.

### Low / Nit (consistency improvements)

- **[L-1] Mode 3 / Mode 1 mixed naming в reviewer.md** — `.claude/agents/reviewer.md`
  § Mode 3 (rework) специфика (line 272) использует numeric naming «Mode 3», но
  Step 1.4 (lines 49-67) использует name-based «foundation_completeness: complete |
  partial | minimal | none». Inconsistent vocabulary внутри одного agent prompt.
  Тоже AP-21 mentioning «3-я iteration» mixed с «Mode 3» в reviewer.md line 298.

- **[L-2] «security-reviewer» orphan name** — `doc/_templates/feature-review.md.tmpl`
  line 12 («security-reviewer») references non-existing agent. Удалить.

- **[L-3] `Tier 0` / `Tier 1` / `Tier 2` / `Tier 3` названия не унифицированы** —
  иногда «Tier 0 — auto-extract», иногда «Tier 0 routine», иногда «Tier 0 auto-extract
  pass». Минорно.

- **[L-4] In-progress detection on session start описано в 2 местах** —
  CLAUDE.md.tmpl lines 19-27 + project-bootstrap.md lines 310-315. Не drift, но
  duplication.

- **[L-5] AP-7 «Документы — living artifacts» содержание дублируется в
  development-protocol.md § 15 «Document hygiene»** — line 685-699 vs AP-7 description.
  Полезный cross-ref, но при изменении cadence (например, monthly → bi-weekly) нужно
  синхронизировать вручную.

## Verified clean (no issues found)

- **AP number sequence (1-22)** — все 22 AP existing, no orphaned references.
  Reverse-chronological order (newest AP-22 first, oldest AP-1 last after AP-7) —
  намеренный layout.
- **`.ai-pm/.reviews/` gitignore directive** — present в bootstrap-state.md.tmpl
  Stage E checklist (line 137); consistent с AP-16 + reviewer.md.
- **Mode aliases backwards-compat handling** — project-bootstrap.md § Backwards
  compatibility lines 544-560 + template-sync-doc-migrate.py.tmpl handle legacy
  `new-feature` / `rework-feature` → `feature` / `rework` aliases.
- **AP-18 expand-contract** — referenced consistently across planner.md /
  coder.md / reviewer.md / anti-patterns.md.
- **Worst-case spawn count (2 per atomic PR)** — claim consistent в reviewer.md +
  AP-19 + AP-20 + README.
- **5-layer enforcement table** — consistent между README + development-protocol.md
  § 5.5.
- **Tier 0 scripts** (auto-extract/*.sh.tmpl) — все 7 scripts referenced в
  project-bootstrap.md есть в `_templates/scripts/auto-extract/`. No orphans.
- **promote-foundation.py + template-sync-doc-migrate.py** — both referenced
  в project-bootstrap.md + bootstrap-state.md.tmpl Stage E checklist.

## Summary

- **Дубли (concept-level):** 5 (M-1 through M-5) — 3-choice / Tier framework /
  hard floor / lite-mode / mode-aware impact tables; drift risk medium при будущих
  изменениях.
- **Нарушения логики:** 4 (B-1 Mode numbering, B-2 spec frontmatter, B-3 review
  template, B-4 scripts location) — все blocking, ломают contract'ы между protocol /
  template / agents.
- **Запутанность:** 1 (H-5 mini-foundation в feature-spec template force'ит
  delete в `complete` state).
- **Избыточность артефактов:** 1 (H-2 `trail_type` field).
- **Потеря связей:** 2 (H-3 + H-4 — `meta/` directory не существует в product repo,
  но workflow туда пишет; L-2 — orphan «security-reviewer» reference).

## Recommendation

**Критично fix перед v0.2.0:**

1. **B-1 Mode numbering** — приоритет 1. После refactor PR2 5 modes, но 80% template'а
   всё ещё ссылается на «Mode 1 / Mode 2 / Mode 3». Когда оператор HeartVault
   (или другой prod-run) откроет template для feature work, он встретит этот gap
   немедленно. Sweep с replacement «Mode 1 → Mode `new-product`» и т.д.

2. **B-2 spec template frontmatter** — приоритет 1. Без явного frontmatter блока
   в head'е новые spec'ы будут создаваться inconsistently (часть через AP-13 + AP-14
   matrix, часть без impact flags). Reviewer тогда не сможет cross-check корректно.

3. **B-3 feature-review template** — приоритет 1. AP-16 verdict-gate parsит
   `**Verdict:** ...` line — template без неё генерирует review'ы, которые hook
   будет блокировать or skip'ать. Также orphan «security-reviewer» reference
   confuses оператора при first encounter'е.

4. **B-4 scripts location** — приоритет 2. `install-git-hooks.sh.tmpl` hard-code'ит
   неправильный path; на каждом Stage E это generation broken'ный hook. Уже
   зафиксировано как pending task #36 («completed»), но шапки `.tmpl` файлов всё ещё
   несут old path в comments — оставляет confusion future readers.

**Defer до v0.3.0 или позже:**

- M-1 — M-5 дубли — нужны consolidation refactor через canonical source-of-truth pattern,
  но не критичны для usage. Drift risk medium.
- H-5 mini-foundation в template — usability improvement, не correctness issue.
- H-1 CLAUDE.md.tmpl Шаг 1.5 — nice-to-have routing hint.

**Никаких изменений не нужно:**

- AP number ordering, integration mode detection, Tier 0 scripts inventory,
  AP-18 cross-refs, 5-layer enforcement table — все verified clean.

---

## Note on audit methodology

Audit полностью read-only. Не invoke'нул scripts, не сделал test-generation, не
запустил check-spec-discipline.sh. Findings основаны на cross-reference grep'е +
manual чтении ключевых файлов (project-bootstrap.md, reviewer.md, planner.md,
coder.md, development-protocol.md, anti-patterns.md, README.md, feature-spec.md.tmpl,
feature-review.md.tmpl, bootstrap-state.md.tmpl, settings.json.tmpl + scripts/*.tmpl).

Items, требующие dynamic verification (например, реальный flow template-sync через
Phase 1-4, или Tier 0 auto-extract на realistic legacy project) — out of scope для
этого audit'а.
