# Changelog

Все значимые изменения template'а ai-pm-protocol будут документироваться здесь.

Формат — [Keep a Changelog 1.1.0](https://keepachangelog.com/ru/1.1.0/), versioning по [SemVer 2.0](https://semver.org/lang/ru/).

**SemVer для template:**
- **MAJOR** — breaking changes: bootstrap-state.md.tmpl schema incompatible, removed APs с consumers в downstream products, breaking subagent prompt format, removed/renamed `_templates/` files.
- **MINOR** — additive features: new subagent, new AP additive only, new `ui_kind`/`db_kind` support, new template file, new mode value.
- **PATCH** — fixes / refinements: typo fixes, clarifications, bug fixes в scripts, non-functional formatting changes.

См. release-helper.md § 7 для template self-release process.

---

## [Unreleased]

---

## [0.10.9] — 2026-05-28

### Fixed

- **bootstrap-template-sync: no-op guard — sole criterion is `pinned == target`.** Запрещён вывод «нет контента» по commit messages или количеству коммитов (squash-merge ненадёжен). Если `pinned ≠ target` — шаги 5–12 выполняются всегда без исключений. (3f1dce8)
- **bootstrap-template-sync: mandatory step 4.5 — explicit CLAUDE.md check.** Добавлено обязательное сравнение `CLAUDE.md` проекта с `CLAUDE.md.tmpl` из обновлённого tooling. Выполняется всегда (и при no-op, и при full migration) — `CLAUDE.md` генерируется единожды при bootstrap'е и не обновляется автоматически. (3f1dce8)

---


## [0.10.8] — 2026-05-28

### Fixed

- **coder: pre-handoff spec-drift gate.** Перед объявлением Step 4 done coder проверяет соответствие кода текущему spec'у (если spec менялся в ходе реализации). Расхождение → эскалация оператору с перечнем. Handoff-сообщение сведено к одной строке без open-ended вопросов.
- **CLAUDE.md.tmpl: post-coder spec-drift gate и handoff discipline.** В секцию «Source-bounded discipline для orchestrator'а» добавлены: обязательная сверка spec ↔ код перед передачей управления + запрет chatty handoff («Возвращаемся к PR?», «Или ещё что-то обсудить?»).
- **project-bootstrap + bootstrap-template-sync: alias «обнови шаблон».** Добавлен routing trigger «обнови шаблон» в routing table project-bootstrap.md и в description frontmatter/invocation секцию bootstrap-template-sync.md — рядом с существующими «обнови template» / «template-sync».

---

## [0.10.7] — 2026-05-27

### Fixed

- **bootstrap-template-sync: handle dirty submodule before checkout.** Перед `git checkout <target>` выполняется `git update-index --refresh` (устраняет false-dirty от NFS/FUSE/timestamp), затем проверка реального diff'а: пустой diff → безопасный restore; реальный diff → стоп с объяснением оператору. Покрыты все три integration mode: submodule, gitignore (symlink), vendor. (a0753c4)

---

## [0.10.6] — 2026-05-27

### Fixed

- **bootstrap-template-sync: bump tooling submodule before reading any template files.** Шаг 3 (bump tooling to target version) теперь явно помечен как обязательный до любого чтения из `.ai-pm/tooling/`. Добавлена per-integration-mode логика: submodule (`git checkout`), gitignore (follow symlink + `git checkout`), vendor (manual copy + предложение мигрировать на submodule). (1baa3c2)

---

## [0.10.5] — 2026-05-27

### Fixed

- **bootstrap-greenfield + development-protocol: replace `.ai-pm/doc/` hardcodes with `<doc_root>/`.** В new-product mode `doc_root` равен `doc/` (top-level), а не `.ai-pm/doc/`. Добавлен `doc_root: doc` в YAML-сниппет инициализации state, явное правило «читай doc_root перед каждым Write», исправлены два hardcoded пути в handoff-сообщении. В `development-protocol.md` исправлены соответствующие hardcodes в checks personas-exist, mvp-scope-no-orphans, Stage E таблице, lifecycle scan, Stage D bootstrap list, branch-model. (82bb5ea)

---

## [0.10.4] — 2026-05-27

### Documentation

- **README: fix Structure section** — убрана несуществующая директория `scripts/`; уточнено что `_templates/` содержит `scripts/*.tmpl`; добавлены заметки «Генерируется на Stage D» к `check-*.sh` bullets. (de2bbb4, #102)

---

## [0.10.3] — 2026-05-27

### Fixed

- **bootstrap-greenfield: autonomous competitor research for positioning.md.** Agent теперь самостоятельно исследует конкурентов через WebSearch (читает vision.md → ищет конкурентов → черновик landscape → PM review), вместо вопроса «кто ваши конкуренты?». (815328b, #100)

---

## [0.10.2] — 2026-05-27

### Fixed

- **release-helper: AskUserQuestion enforcement for bump conflict.** Operator-proposed bump level, противоречащий Conventional Commits в log'е, теперь требует явного AskUserQuestion перед созданием release PR. (#98)

---

## [0.10.1] — 2026-05-27

### Fixed

- **bootstrap-greenfield: AskUserQuestion enforcement + question context + stage reuse.** (#96)

### Changed

- **auto-bootstrap on resume + 4-choice adoption consistency.** (#95)

### Documentation

- **README: full accuracy rewrite — three agents, correct gates, structure.** (#94)
- **README: accurate PM gate description — spec+plan approval, then AI runs, then acceptance+merge.** (#93)
- **README: fix flow diagram — show planner/coder/reviewer agents explicitly.** (#92)

---

## [0.10.0] — 2026-05-27

### Added

- **`doc/_templates/architecture-conventions.md.tmpl`** — опциональный foundational артефакт для project-wide coding conventions (OOP vs functional, module structure, naming, dependency rules, approved/forbidden patterns). Reviewer читает в Tier 3 auto-load: нарушение задокументированной конвенции → `[blocking]` finding (architectural drift). Planner читает при написании плана: deviation от конвенции → ADR. (#85)
- **reviewer.md Step 0: pre-conditions + diff triage.** Reviewer теперь читает только `git diff --name-only` (~50 токенов) перед любым другим чтением и определяет tier (0/1/2/3). Tier 0 (CHANGELOG/README/gitignore) → reviewer не запускается, сообщает оркестратору что `[skip-review]` корректен. Tier 1/2 → baseline без foundational docs auto-load (~5-10k токенов сэкономлено per review). Tier 3 (feature code) → полный проход как раньше. Pre-condition: CI/линтеры должны быть green перед запуском reviewer; если нет — reviewer не запускается. (#84)
- **reviewer.md: adversarial cases для Tier 1 scripts.** Для изменённых `.sh`/`.awk`/`.py` reviewer формулирует 3-5 граничных input cases (строка содержит паттерн поиска, пустой input, спецсимволы) и просит оркестратора прогнать их. (#84)
- **reviewer.md: scope boundary в «Что ты НЕ делаешь».** Явно задокументировано что не входит в зону reviewer'а: стандарты кода (зона линтеров), полнота бизнес-логики в spec'е (зона planner + operator). (#84)
- **feat(reviewer): lazy-load domain sections — 1358 → 787 строк.** 4 domain-секции (backend / frontend / design / database, 590 строк) вынесены в `doc/_claude/reviewer-domain-*.md`. Reviewer читает только нужный файл по Tier 3 routing. Экономия ~400–475 строк per review (68–80% domain-секций не загружаются). (#88)

### Changed

- **README: acceptance testing (Step 6) вынесен в отдельный раздел.** Явно объяснено что PM делает на Step 6 — проходит сценарии из spec'а в live app, не читая код. Flow diagram обновлён: `спека → план → код (с тестами) → ревью → acceptance → merge`. (#90)
- **meta/ directory** — dogfooding-артефакты шаблона (`personas.md`, `user-journeys.md`, `architectural-backlog.md`) переехали из `doc/` в `meta/`. `doc/` теперь содержит только protocol tooling. (#87)
- **Agent prompts cleanup** — убраны исторические version labels (`v0.X.0+` в заголовках), Bug # tracking labels, legacy agent_type compatibility блоки из `reviewer.md`, `project-bootstrap.md`, `bootstrap-resume.md`, `planner.md`, `coder.md`. (#88, #89)

### Fixed

- **GitHub Releases не создавались при merge release/* PR.** auto-tag workflow создавал только annotated git tag, но не GitHub Release с release notes. Теперь после push tag'а workflow запускает `gh release create` с CHANGELOG-контентом для этой версии. (#85)
- **`doc/template-evolution.md` очищен.** Исторические записи v0.2.0–v0.7.0 удалены (pre-baseline history). Tracking стартует с v0.9.0. (#85)
- **README.md: reviewer section обновлён** под Tier 0/1/2/3 triage и content-based review decision. (#85)
- **CI review-trail: `[skip-review]` vs `[review-override:]` semantics.** Error messages разделены семантически: `[skip-review]` = review не проводился / не нужен; `[review-override:]` = review был, trace не committed. (#84)
- **CLAUDE.md.tmpl: content-based review decision rule.** Явное правило когда `[skip-review]` корректен: инспектируй `git diff --name-only`; agent prompts / AP-*.md / CI+hooks → reviewer обязателен; только CHANGELOG / README-formatting / version bumps → `[skip-review]` уместен. (#84)
- **release-helper.md: orchestrator fallback при blocked agent.** (#84)

---

## [0.9.0] — 2026-05-27

### Added

- **`adoption_overrides[].expires_at:` — schema-level enforcer (раньше — optional comment).** Раньше adoption_overrides expires_at был в commented example без enforcer; override объявлен → забыт навсегда (product эволюционировал, нужен ui-style-guide — но override hidden). Теперь field promoted to first-class schema + bootstrap-legacy Tier 3 routine prompts `expires_at` (default 180 days, не позволяет «never»). `scripts/check-skip-reprompts.sh.tmpl` extended вторым scan block — adoption_overrides parallel skip_decisions, surface'ит expired на SessionStart hook / pre-commit / CI strict mode. Closes ARCH-9 + audit-finding #3.
- **`staged_progress:` — new optional schema field в bootstrap-state.md.tmpl.** Раньше при Choice 2 (Manual staged adoption) operator выбирал подмножество Stage A-D artifacts, но порядок (sequence) этой выборки не записывался — session interrupted → AI не знал «что дальше». Greenfield имеет implicit Stage A→B→C→D sequence; manual staged не имел никакого. Теперь field `staged_progress.selected_artifacts:` (ordered list) + `declared_at:` populated в Choice 2 routine. Resume: scan Stage checkboxes для completed → next uncompleted в этом list'е. Empty/absent для greenfield/quick/skip adoption paths. Closes audit-finding #4.
- **`bootstrap-legacy.md` Choice 2 + Tier 3 routines — populate new fields.** Choice 2 step 2: persist `staged_progress.selected_artifacts:` ПЕРЕД началом extraction (resume marker). Tier 3 step 4 (NEW): expiry prompt c default 180 days, `never` запрещён.
- **`.github/workflows/auto-tag-release.yml` — auto-tag на merge release/v* PR.** Trigger: pull_request closed + merged=true + head branch matches `release/v*`. Extract version from branch name, idempotent check (existing tag → skip + warning, не error), annotated tag на merge commit + push. Закрывает gap: раньше release-helper § 7 требовал manual `git tag -a vX.Y.Z` после merge'а — manual step = легко забыть, silent потеря release (template merged, downstream template-sync не видит новую версию).
- **release-helper.md § 4 + § 7 — обновлены под auto-tag.** § 7 tagging discipline: auto-tag покрывает default case, manual fallback для workflow failures. § 4 release PR body требует включать post-merge note чтобы operator знал что auto-tag сработает.
- **CLAUDE.md.tmpl Step 2 — explicit state-marker→step mapping table.** Закрывает gap: раньше Step 2 имел compressed paragraph «`_spec.md` без `_plan.md` → Step 2 pending; ...» — orchestrator восстанавливал lifecycle state по неявным паттернам, мог промахнуться. Теперь tabular mapping 8 rows покрывает все markers (spec/plan/branch/PR/review/acceptance/rework), explicit resume action per row, caveat про gitignored trace на fresh checkout для chore/docs branches.
- **CLAUDE.md.tmpl — subagent-killed mid-flight recovery contract.** Закрывает gap: orchestrator не имел документированного contract'а что делать если subagent killed (user Ctrl-C / context truncation / sam orchestrator ошибся). Новая секция формализует 5-step recovery: git как ground truth (не agent's last message) → diff с expected work → relaunch с explicit context.
- **bootstrap-template-sync.md step 1 — Pre-v0.8.0 baseline policy.** Закрывает gap: template schema эволюционировала между v0.x и v0.8.0 без migration tool'инга. Если downstream product на pinned < v0.8.0 пытается incremental sync — router может тихо использовать defaults или сломаться. Теперь agent offers 3 options оператору (fresh re-bootstrap / manual cherry-pick / abort) с recommendation criteria.
- **bootstrap-template-sync.md step 10 — explicit Migration ORDER requirement для MAJOR bumps.** Закрывает gap: на MAJOR bump conformance report показывал discrepancies grouped by concern, но не диктовал ORDER применения PR'ов — operator не мог safely interleave product feature PR'ы между migration PR'ами. Теперь MAJOR (target major > pinned major) обязывает agent написать `## Migration order` section с rationale per inter-PR dependency.

### Fixed

- **CI review-trail visibility для release/* branches.** Closes gap discovered live in PR #79 review-trail handling: PR #77 сделал `.ai-pm/.reviews/*.json` полностью gitignored (local-trace mode), но CI workflow check-review-trail.yml для не-Stage-E branches требовал committed trace либо `[skip-review]` / `[review-override:]` marker. Release PR'ы могли пройти только через override marker, semantically стрейчя «override» beyond intent (review был сделан и approve'нул, но trace не visible CI). Исправление: gitignore exception `!.ai-pm/.reviews/release-*.json` + CI workflow читает JSON trace для `release/*` branches как third option (Layer 5-only check, pre-push hook release/* не покрывает). Feature/chore/docs/fix branches — local-only режим preserved, marker'ы по-прежнему требуются.

---

## [0.8.0] — 2026-05-27

v0.8.0 — onboarding init routine закрывает chicken-and-egg между `git submodule add` и первой `claude`-сессией. **MINOR-additive** — новая template capability (root-level `init.sh` + seed CLAUDE), zero impact на existing downstream products до template-sync.

### Added

- `init.sh` (root, +x) — idempotent onboarding скрипт. Создаёт symlink `.claude/agents` → `.ai-pm/tooling/.claude/agents` (subagents видимы Claude Code) + копирует `CLAUDE.seed.md` → `./CLAUDE.md` если корневого нет (#79).
- `CLAUDE.seed.md` — минимальный pre-bootstrap briefing. Инструктирует Claude invoke `project-bootstrap` при отсутствии `.ai-pm/.bootstrap-state.md`. Перезаписывается на Stage D bootstrap полной project-specific версией (#79).

### Changed

- `README.md` секция «Установка» — добавлен шаг `init.sh` между `submodule add` и `claude` + explicit rationale «зачем нужен» (anti-regression комментарий для будущих правок) (#79).

### Documentation migration impact (для downstream template-sync)

Downstream projects при template-sync v0.7.0 → v0.8.0:

- [Root-level files] Optionally run `bash .ai-pm/tooling/init.sh` after sync — refreshes `.claude/agents` symlink. Не destructive если файлы уже на месте.
- [Spec frontmatter / sections / mode renames / AP introductions] None.

---

## [0.7.0] — 2026-05-27

v0.7.0 — anti-drift layers complete + agent consolidation + prompt-economy wave + operator interface model. **MINOR-additive** — все additions backward-compat (legacy state values accepted, legacy review trail values parsed, deprecated fields marked но preserved).

Major themes:
- **3 layers anti-drift complete** (Layer 1 в v0.6.0, Layer 2 + Layer 3 в этом релизе)
- **Operator interface model** formalized (3-level architecture, 6 triggers, 6 rules)
- **Agent count 11 → 5** (5 inline reviewer sections)
- **Prompt-economy wave** (cache ordering, granularization, fragmentation — измеренный output token reduction)
- **Brownfield Full retrofit routine**

### Added

- **Cross-doc-bounded — Layer 2 anti-drift** (feature `cross-doc-bounded`, PR #71):
  - **Failure modes closed:** Layer 1 (AP-25/26 source-bounded) ловит spec-level drift в одном артефакте; live testing 2026-05-25 показал второй класс — **invisible** drift через ADR Decision components (hallucinated building blocks), cross-ADR contradictions в одной PR, scope creep между F-N и F-future. PM с Trust profile A не имеет mechanism это поймать post-hoc.
  - **4 new AP** (`doc/anti-patterns/AP-{27,28,29,30}.md`):
    - **AP-27** — Hallucinated decision component (ADR с новым building block без trace к source artifact)
    - **AP-28** — Inter-ADR contradiction в одной PR (ADR-A rejects pattern, ADR-B implements same под другим именем)
    - **AP-29** — ADR scope creep (component из F-future в ADR F-current под предлогом «logical completeness»)
    - **AP-30** — Plausibility / structure bias (elegant symmetric naming triggers acceptance — `wrap_session` к `wrap_master`/`wrap_device`)
  - **Reviewer mandatory Step 2.5** (`.claude/agents/reviewer.md`) — cross-doc check между planner и push'ем. Auto-loads foundational docs (`vision.md` / `positioning.md` / `mvp-scope.md` / `threat-model.md`) при `topology_impact: yes` / `threat_impact: yes`.
  - **Linter family `cross-doc-bounded`** в `scripts/check-spec-discipline.sh.tmpl`:
    - `adr-decision-component-bounded` (AP-27) — каждая entry в Components subsection требует structured reference indicator (`.md\b`, `ADR-NNNN\b`, citation marker)
    - `inter-adr-contradiction` (AP-28) — pairwise scan ADRs в одной PR на rejected-pattern vs implemented mismatch
    - `adr-feature-scope` (AP-29) — components в ADR должны быть в `feature_topic:` спеке, не в чужой
  - **ADR template extension** (`doc/_templates/0000-adr-template.md.tmpl`):
    - Mandatory `### Components` subsection (per-component source-ref)
    - `feature_topic:` frontmatter field — binding к feature scope
  - **Spec-structure backward-compat** (linter): legacy specs (created < 2026-05-27) — WARN, не FAIL. Avoid breaking historical artifacts.
  - **Override marker** `[source-bounded-override: <reason>]` — fail → warn downgrade, identical pattern AP-25/26.
  - **Regression fixture** `doc/_templates/regression-cases/cross-doc-drift-001/` — synthetic case с ADR-0014 (Three-tier envelope hallucinated component) + ADR-0013 (contradicting alternative). All 3 new checks fire as expected.

- **Trust profile A verbosity audit — Option F** (feature `prompt-economy`, PR #72, last of 6):
  - **What:** Trust profile A учил агентов писать verbose с learning layer на ВСЁ. Output tokens дороже input — compress learning layer для confirmation-only tasks, verbose остаётся для substantial findings.
  - **9 agent files** получили unified `## Verbosity discipline` section (planner / coder / reviewer / release-helper / project-bootstrap + 4 bootstrap-mode):
    - **Terse default** — confirmation acks, status updates, decision results без rationale rehash
    - **5 verbose triggers** — architectural decision (fork в plan / new ADR draft), new AP detected, cross-domain finding, source-bounded fork (AP-25/26), escalation trigger fired
    - **Anti-pattern** — rehashing plan/spec content в status updates; explaining что next step IS когда это просто executing approved plan
    - **1 verbose + 1 terse example** per agent, role-specific (Idempotency-Key для coder, `Math.random()` crypto path для reviewer, MAJOR `feat!` для release-helper, etc.)
  - **Reviewer exception:** findings body stays verbose для substantial issues (это primary operator output); trivial `[nit]`, no-issues approve verdicts, chat-output around persisted review get terse format.
  - **Planner exception:** plan body verbose (operator contract); chat around plan compresses.
  - +276 LOC across 9 files (~30 per agent).

- **Operator-as-idea-provider — interface redesign под PM-only** (feature `operator-as-idea-provider`, PR #73):
  - **Three-level architecture** в `development-protocol.md § 16`:
    - **Strategic** (Operator/PM): стек, архитектура, бизнес-логика, security floor
    - **Tactical** (AI silent): план, ADR alternatives, decomposition, tests strategy
    - **Implementation** (AI silent): код, тесты, модули, refactoring choices
    - PM видит только Strategic. Tactical/Implementation на operator-request only.
  - **6 escalation triggers** (когда AI обязан спросить): business-logic hole / business-affecting fork / stack-affecting decision / security floor / cross-feature contradiction / cost-time threshold.
  - **6 plain-language rules** (operator-facing communication): concrete-first / no-jargon без definition / tables+specifics / verification question / никаких abstract names / никаких internal IDs (F-NN, AP-NN).
  - **AP-32** (`doc/anti-patterns/AP-32.md`) — Jargon-first operator communication (soft-warn). AI открывает диалог с PM терминами протокола — PM выключается на третьем термине; gate degeneration через approve-наугад.
  - **`doc/_claude/operator-facing-examples.md`** — 5 terse/verbose pairs (one per logical agent). Examples role-specific (retention для planner, case-sensitivity для coder, assertion weakening для reviewer, MAJOR `feat!` для release-helper, ambiguous adoption signal для project-bootstrap router).
  - **Linter family `operator-communication`** в `scripts/check-spec-discipline.sh.tmpl`:
    - `check_operator_facing_jargon` (AP-32) — heuristic block detection на known headers (`## Summary для оператора`, `## Output handoff`, `## Краткое резюме`); grep на `\bAP-[0-9]+\b`, `\bF-[0-9]+\b`, `\[[a-z-]+-override:`, `\bStep [0-9]+\b`, `\bStage [A-E]\b`, `\bAskUserQuestion\b`. Soft-warn only (никогда `log_fail`).
  - **`_claude/keyword-routing.md`** — preamble переписан с keyword exact-match на intent-detection; column renamed «Оператор пишет / keyword» → «Intent / typical phrasing».
  - **`CLAUDE.md.tmpl`** — single bullet pointer на § 16 + AP-32 + examples.md.
  - **Regression fixture** `regression-cases/operator-facing-jargon-001/` — synthetic `_review.md` с jargon violations.
  - **Verbosity (PR #72) +18 agent extensions** — `### Operator escalation triggers (6)` + `### Plain-language rules` sub-sections в каждом из 9 agent prompts (5-15 LOC extension, pointer'ы на § 16, no content duplication).

- **Spec-lifecycle + brownfield — Layer 3 anti-drift + retrofit routine** (feature `spec-lifecycle-and-brownfield`, PR #74):
  - **Failure modes closed:** Layer 1+2 fokus'ятся на ОДНОЙ фиче за раз; Layer 3 ловит cross-feature contradiction (F-N нарушает invariant F-M через 3 месяца, PM не помнит). Brownfield adoption — натягивание шаблона на existing repo с features F-1..F-N БЕЗ specs.
  - **5 сценариев матрица** (`development-protocol.md § 9.7`): А (новый продукт) / Б1 (active + new feature) / Б2 (active + bug fix) / **В1 (brownfield + new feature)** / **В2 (brownfield + bug fix)**.
  - **Layer 3 cross-feature anti-drift** (`development-protocol.md § 9.6`):
    - Reviewer-agent **дополнительно** делает cross-feature pass: читает `topology_impact:` / `threat_impact:` / `journey_impact:` / `scope_impact:` всех existing specs.
    - Invariant extraction (regex baseline на `всегда / never / ни при каких / обязательно / запрещено`) — narrowed pre-emptively to require `## Invariants extracted` section ИЛИ list-item с hard absolutes (avoid greenfield prose false-positives).
    - Hard cross-feature triggers (operator-gate): F-N меняет foundational doc / shared component / invariant overlap >= 2 between F-N spec и foundational + другие spec'и.
  - **2 new AP**:
    - **AP-31** (`doc/anti-patterns/AP-31.md`) — Spec staleness (warning). Detection: git log на code files vs `last_modified:` в spec'е. Threshold configurable через `staleness_days:` в `.bootstrap-state.md` (default 30). Hard fail при behaviour-changing code change без spec update. **Applies ко всем спекам включая retrofit'нутые** — incentive держать sync.
    - **AP-33** (`doc/anti-patterns/AP-33.md`) — Cross-feature contradiction (critical). F-N implements pattern явно rejected F-M's invariants. Override marker `[cross-feature-override: <reason>]`.
  - **Brownfield Full retrofit flow** (`.claude/agents/bootstrap-legacy.md`) — 4-й menu item поверх existing 3-choice:
    - Step 1 (audit): scan repo, group files by feature (heuristic: directory structure, route groupings, module boundaries)
    - Step 2 (operator review): «обнаружены features: F-A (auth), F-B (billing), F-C (export). Подтверди / split / merge»
    - Step 3 (spec extraction): per approved feature — generate `<topic>_spec.md` skeleton с `## Behaviour observed` + `## Invariants extracted` + `## Open questions`
    - Step 4 (operator approval): PM passes through spec'и, fills Open questions, marks `spec_approved:`
  - **Spec template extension** (`_templates/feature-spec.md.tmpl`) — OPTIONAL `## Behaviour observed` + `## Invariants extracted` sections (HTML-comment wrapped — existing specs без break'а).
  - **`affects_features: [topic1, topic2]`** frontmatter field — optional list для cross-feature link tracking. Documented в `_claude/frontmatter-convention.md`.
  - **Linter family `cross-feature-bounded`** в `scripts/check-spec-discipline.sh.tmpl`:
    - `check_spec_staleness` (AP-31) — git log dates vs spec `last_modified:`, threshold от `staleness_days:`
    - `check_cross_feature_invariant` (AP-33) — pairwise scan invariants vs new F-N decisions
    - `--regression` runner + 5 new fixtures (`cross-feature-drift-001..005`) — invariant overlap / foundational drift / staleness / affects_features chain violation / scope expansion
  - **`check-cross-feature-invariants.sh.tmpl`** wrapper script — thin (5 LOC) alias к `check-spec-discipline.sh --check cross-feature-invariant`. Acceptance criterion satisfied (файл exists) + family pattern preserved.
  - **§ 9.6/9.7 numbering note:** plan original predicted § 11/12, но existing § 11 «Feature workflow» был занят. Coder relocated на § 9.6/9.7 (thematic continuation после § 9.5 source-bounded). Layer architecture table в § 9.5 updated с Layer 3 row.

### Changed

- **Anti-patterns granularization — Option C** (feature `prompt-economy`, PR-4):
  - **Decision:** `doc/anti-patterns.md` (962 LOC) split на per-AP files в `doc/anti-patterns/AP-NN.md` (NN = 01..26). Master `doc/anti-patterns.md` → index/table-of-contents (~55 LOC).
  - **Rationale:** агенты раньше Read'али весь 962-LOC файл если нужен был один AP (например AP-25). Теперь Read'ают только релевантный AP (~50-150 LOC). Экономия read scope variable, но существенная для frequent AP lookups.
  - **Content preserved:** содержание каждого AP не урезано — только relocated в per-file structure. Cross-references между AP'ами (текстовые `AP-NN`) работают без изменений.
  - **Frontmatter:** каждый AP-NN.md имеет `id`, `status` (active/deprecated/superseded), `severity` (critical/high/medium/low), `domain` (свободный tag).
  - **References updated:** `README.md` — обновлена tree structure и каталог AP-1..AP-26.
  - **No linter changes required:** `check-spec-discipline.sh` references AP'ы текстово (`AP-25`), не path-based.

- **Agent consolidation 11 → 5** (feature `agent-consolidation`):
  - **Decision:** template сужает количество agent файлов с 11 до 5. Definite keepers: `project-bootstrap` / `planner` / `coder` / `reviewer` / `release-helper`.
  - **Rationale (Bug #3 — Claude Code subagent enum gap):** project-level agent'ы из `.claude/agents/*.md` не появляются reliably в Agent tool's `subagent_type` enum в running session. Primary reviewer'у было нужно spawn'ить 5 specialized reviewer'ов (protocol-compliance + 4 domains), но фактически делал sequential self-pass (с фейковым `agent_type: specialized-reviewer` в frontmatter). Отдельные файлы только маскировали это как «patterns reviewer reads». Inline sections — honest и одинаково функциональны.
  - **Consolidated в `reviewer.md`** как inline sections (5 файлов deleted):
    - `protocol-compliance-reviewer.md` → «## Mandatory baseline» section (always applied, process check — spec↔plan↔code consistency, frontmatter, AP discipline)
    - `backend-reviewer.md` → «### Backend domain» subsection
    - `frontend-reviewer.md` → «### Frontend domain» subsection
    - `design-reviewer.md` → «### Design domain» subsection
    - `database-reviewer.md` → «### Database domain» subsection
  - **Reviewer behaviour:** detect PR scope → apply Mandatory baseline + ONE Domain section sequentially in self-pass. Output frontmatter: `agent_type: inline-sections` + `applied_sections: [mandatory-baseline, <domain>]`. Legacy `agent_type: specialized-reviewer` / `general-purpose-with-role-spec` / `inline-roleplay` values accepted в existing committed `_review.md` files (backward-compat).
  - **AP-20 rewritten** под honest pattern «inline sequential pass with explicit domain labels» (closes ARCH-1 в architectural-backlog).
  - **`discipline-advisor.md` retired** (1 файл deleted): opt-in PoC with required accuracy gate ≥80% per axis **never validated**. Hard floor functionality перенесена в `scripts/check-security-floor.sh` (deterministic detector — не LLM heuristic). Skip reprompt mechanism — в `scripts/check-skip-reprompts.sh`. Soft 5-axis recommendations dropped as never-validated speculation (closes ARCH-8).
  - **Backward compat:**
    - `bootstrap-state.md` `advisor_preset:` / `advisor_log:` поля сохранены (marked DEPRECATED v0.7.0) — existing state files читаются без break'а; новые projects могут оставить defaults; agents игнорируют эти поля.
    - `skip_decisions:` mechanism preserved — operator-driven с deterministic reprompt через `check-skip-reprompts.sh`.
    - Legacy review trail frontmatter values accepted в `check-review-trail.sh` (parser agnostic to `agent_type:`, парсит только `**Verdict:**`).
  - **Estimated savings:** ~1200 LOC removed (5 reviewer files × ~220 each + discipline-advisor ~220), `reviewer.md` grew ~700 LOC. Net: ~500 LOC reduction + 6 fewer agent files. CLAUDE.md.tmpl subagents list 9 entries → 5 entries.
  - **References updated:** `CLAUDE.md.tmpl`, `bootstrap-state.md.tmpl`, `development-protocol.md`, `anti-patterns.md` (AP-19 / AP-20 / AP-25), `architectural-backlog.md` (ARCH-1 / ARCH-4 / ARCH-8 marked resolved or updated), `README.md`, `feature-review.md.tmpl`, `maintenance-playbook.md.tmpl`, `tech-stack.md.tmpl`, `database-design-base.md.tmpl`, `check-review-trail-smoke.sh.tmpl`, `check-security-floor.sh.tmpl`, `check-skip-reprompts.sh.tmpl`.

- **PM-only ЦА в v0** (feature `remove-developer-from-template`):
  - **Decision:** template сужает поддерживаемую ЦА с 3 personas (PM Trust profile A, cross-stack senior B, full-stack pro C) до **одной** (PM Trust profile A, не читает AI-код). Developer-as-operator кейс — backlog item после empirical validation PM-кейса.
  - **Rationale:** real-world signal — «двусторонняя ниша PM↔dev» дилютирует focus. Conditional branches «if Trust profile B... if Trust profile C...» в agent prompts увеличивают maintenance overhead без proven value (никаких empirical users в B/C на момент refactor'а).
  - **Removed conditional branches** в 4 agent files (`coder.md`, `planner.md`, `reviewer.md`, `project-bootstrap.md`): «if Trust profile A then verbose with learning layer; if B then mixed; if C then terse» свернуто до verbose-only (A default).
  - **`lite-mode: c-fast` deprecated** — был для Trust profile C, удалён из templates / agent prompts. Existing spec'и с `lite-mode: c-fast` accepted as `small-fix` (backward compat).
  - **Bootstrap interview сократился** — bootstrap-agent больше не спрашивает Trust profile (auto-set `A`). Greenfield Init: 3 questions → 2 questions. Legacy adoption Quick/Staged/Skip — то же.
  - **`personas.md`** rewritten: single PM persona expanded с explicit «Что НЕ persona в v0» секцией (developer-as-operator в backlog).
  - **`user-journeys.md`** — «Friction points per persona» секции сжаты до PM aspect; B/C friction notes удалены.
  - **`README.md`** — single «PM (не код) — единственная supported persona» с honest «Developer support coming after PM case validates» disclaimer; убрана «двусторонняя ниша PM↔dev» messaging.
  - **`development-protocol.md`** + **`anti-patterns.md`** — формулировки «оператор при Trust profile A» → «PM-оператор» / «оператор (PM, не читает код)».
  - **Backward compat (`.bootstrap-state.md` schema):** поле `trust_profile:` сохранено в template (значение `A` default; existing values `B`/`C` принимаются agents as `A` без normalization чужого state). Это позволит позже re-add B/C без schema break.
  - **No functional regression** для PM workflow — все CI gates / AP catalogue / 5-layer enforcement / 5 stages workflow / spec/plan/review files остаются те же.

### Fixed

- **Protocol minor fixes — accumulated session 2026-05-25** (feature `protocol-minors-2026-05-25`, lite-mode bugfix bundle):
  - **Bug #1 — `check-review-trail.sh` smart fallback.** Скрипт сначала ищет `<branch-suffix>_review.md` (current behavior, primary path), затем при miss читает `topic:` из spec frontmatter `<branch-suffix>_spec.md` и пробует `<spec-topic>_review.md`. Покрывает случай переименования topic'а без переименования feature-branch'а. Branch-suffix takes precedence — invariant сохранён. 9 smoke tests в `scripts/tests/check-review-trail-smoke.sh.tmpl` (branch-suffix match / topic fallback / precedence / no-review / Verdict format / request-changes blocking).
  - **Bug #2 — Verdict marker strict format prescribed.** `reviewer.md` Step 5.1 теперь явно запрещает суффиксы (`**Verdict v2:**`, `**Verdict (round 2):**`, `### Verdict:` и т.д.) — только литеральный `**Verdict:** approve|approve-with-comments|request-changes` в первых 50 строках. Versioning итераций — через frontmatter field `review_version: <N>` (integer). Parser в `check-review-trail.sh` уже strict — этот fix prescribes prompt'у соответствие parser'у.
  - **Bug #3 — workaround documentation.** `CLAUDE.md.tmpl` и `reviewer.md` (Step 5.3) описывают workaround для Claude Code limitation: project-level agent'ы из `.claude/agents/*.md` могут не появляться в Agent tool's `subagent_type` enum. Workaround — `subagent_type: general-purpose` с inline role spec; в audit-артефактах честный `agent_type: general-purpose-with-role-spec`. Reproduce / file issue — отдельная operator-task.
  - **Bug #4 — trail integrity для general-purpose workaround.** `reviewer.md` Step 5.2 prescribes frontmatter fields: `agent_type:` (`specialized-reviewer` | `general-purpose-with-role-spec` | `inline-roleplay`), `spawned_agents:` (пусто `[]` если реального spawn'а не было), optional `inline_roles:` (список ролей, которые один agent играл). Запрещено ложно заполнять `spawned_agents:` именами specialized reviewers — audit reads трейл буквально.

### Added

- **`scripts/update-session-state.sh.tmpl` + `scripts/print-session-state.sh.tmpl` — session resume hint** (feature `session-resume-state`):
  - PostToolUse hook эвристически определяет step по file_path (spec/plan/review/code/ADR/rework) и перезаписывает mechanical поля (`current_topic` / `current_branch` / `current_step` / `last_update`) в `.ai-pm/.session-state.md` через atomic temp+mv.
  - Semantic поля (`pending_agents` / `blocker` / `active_pr_series`) preserved — hook их не трогает, только operator/main-agent fill.
  - SessionStart hook `cat`'ает state в stderr → Claude видит «где мы» в первые секунды без скана веток / PR / features/. Missing file → fallback message с git/gh recovery инструкцией.
  - Gitignore wiring в `install-git-hooks.sh.tmpl` — `.ai-pm/.session-state.md` local-only, никогда не commit'ится.
  - 9 smoke tests в `scripts/tests/session-state-smoke.sh.tmpl`.
  - Параллельная регистрация с existing `update-bootstrap-state.sh` / `check-skip-reprompts.sh` в `settings.json.tmpl` массивах — независимость failure mode.
  - `CLAUDE.md.tmpl` шаг 1.1 в session start routine — Claude читает state-файл если SessionStart hook output был скипнут оператором.

---

## [0.6.0] — 2026-05-24

v0.6.0 advisor hardening + hook reliability wave. **MINOR-additive** — две новые
deterministic script (security-floor detector + skip-reprompts checker) backing
advisor promises ранее жившие только в LLM-prompt; AP-16 enforcement переехал
на pre-push hook + CI workflow; silent enforcement break в hook scripts закрыт.
Никаких breaking changes: AP-12 mandatory grep softened до recommendation (опция,
не required behavior); template-sync routine переписан, но backward-compatible
по entry points; existing state files / spec frontmatter без изменений.

### Added

- **`scripts/check-security-floor.sh.tmpl` — deterministic security-capability detector** (PR #55):
  - Multi-stack manifest grep (npm / pypi / go / cargo / gem / composer)
  - Code scan для crypto API (aes-gcm / createCipheriv / libsodium / etc.)
  - Schema scan для PII column names (email / phone / dob / ssn)
  - 4 capability categories: payments / auth / crypto / pii
  - Output modes: JSON для advisor consumption, `--human` для оператора, `--enforce` для CI gate
  - `discipline-advisor.md` обновлён — на bootstrap entry invoke script, берёт output как ground truth; soft layer может escalate, но не downgrade hard floor
  - Backs advisor «не даёт пропустить security вещи» promise deterministically

- **`scripts/check-skip-reprompts.sh.tmpl` — deterministic skip-reprompts checker** (PR #56):
  - AWK parser `skip_decisions` block в `.ai-pm/.bootstrap-state.md`
  - Сверяет `next_reprompt` с today, выдаёт expired list
  - Modes: human (warning на stderr) / json / strict (exit 1 для CI)
  - Wired в `settings.json.tmpl` SessionStart hook — каждая новая Claude-сессия видит warning про expired skip decisions
  - Wired в `install-git-hooks.sh.tmpl` pre-commit — non-blocking warning при commit'е
  - `discipline-advisor.md` ссылается на script как ground truth
  - Backs «через 90 дней advisor напомнит» promise deterministically

- **AP-16 enforcement через pre-push hook + CI workflow** (PR #48):
  - Раньше — agent-internal discipline только
  - Теперь — `.githooks/pre-push` блокирует push без review trail в `.ai-pm/.reviews/`
  - CI workflow дублирует check на GitHub-стороне (защита от bypass'а локального hook)
  - `refactor/*` pattern добавлен в pre-push branch matcher (раньше только feature/feat/chore/docs/fix) — пришёл вместе с template-sync refactor PR'ом

### Changed

- **`template-sync` routine** переписан с heavy scripted (~150 LOC) на lightweight agent-driven flow (~85 LOC) (PR #51):
  - Old: 4-phase routine с `template-sync-doc-migrate.py` scripted detection
  - New: agent reads cheat sheet + CHANGELOG, holistically compares, outputs conformance report, operator approves PR plan, per-PR execution с decision-point approvals
  - 13 шагов, явный no-op exit path, явный operator approval gates, inspection-before-regenerate discipline закодифицирована
  - `scripts/template-sync-doc-migrate.py.tmpl` оставлен как optional helper (не удалён, не required)
  - **NEW** `doc/template-evolution.md` — per-version шпаргалка с breaking changes / renames / file moves / action items
  - **Template-side maintenance discipline** добавлен в `doc/development-protocol.md` § 3.8: при breaking change / rename / new artifact в template обязательно обновлять `template-evolution.md` синхронно с CHANGELOG entry

- **AP-12 anglicism discipline softened с mandatory на soft recommendation** (PR #52):
  - Decision оператора — overhead дисциплины не окупается; mandatory grep self-check + chat-filter requirement убраны
  - AP-12 § переписан под soft recommendation: предпочитай русские эквиваленты когда одинаково ясны; стандарт индустрии (MVP / KDF / AEAD / OWASP) оставляй; brand voice — приоритет
  - `_templates/CLAUDE.md.tmpl` — убрана инструкция «AI обязан запустить grep самопроверку»
  - Strict mode остаётся опцией product-level (operator может добавить pre-commit hook / CI gate в свой продукт)
  - `_templates/scripts/install-git-hooks.sh.tmpl` не трогается (там никогда не было anglicism check)

- **README.md — два rewrite pass'а** (PR #53, #57):
  - PR #53: сжатие 250 → 150 строк, убрана маркетинговая лексика («killer mechanic», «defense-in-depth»), AP-16 и advisor описаны через примеры, добавлена таблица «Похожие проекты» (Spec Kit / BMAD / devCrew_s1 / каталоги агентов / ChatPRD)
  - PR #57: честный pass про advisor после v0.6.0 hard floor + reprompts фиксов — секция «Не делать лишнего» с явным разделением hard layer (`check-security-floor.sh` deterministic) vs soft layer (advisor opt-in PoC пока accuracy gate ≥80% per axis не валидирован); router ревьюеров уточнён («по дизайну 2 запуска, не статически вынуждено»)

- **README рерайт (расширенный):** см. PR #47 — advisor-driven skip flow + восстановление структуры (исторически в [Unreleased], merged до v0.6.0 cut)

### Fixed

- **`install-git-hooks.sh.tmpl` пробует 4 имени `check-spec-discipline`** (PR #54):
  - Раньше hook искал только extensionless `scripts/check-spec-discipline` — если bootstrap-agent генерировал `.sh` / `.py` / `.ts` вариант, hook silently skip'ал spec discipline линтер
  - Теперь пробует extensionless / `.sh` / `.py` / `.ts` в порядке
  - Закрывает silent enforcement gap для проектов с non-bash stack

- **Hook scripts читают JSON stdin вместо несуществующих env vars** (PR #50, изначально #49):
  - 3 PreToolUse / PostToolUse hook scripts использовали `CLAUDE_TOOL_PARAM_FILE` / `CLAUDE_TOOL_PARAM_COMMAND` — env vars не существуют в Claude Code hook API
  - Реальный API передаёт hook input через JSON stdin: `{"tool_name": "...", "tool_input": {"file_path": ...}}`
  - **Silent enforcement break** — hooks молча получали пустые значения, проваливались через проверки, exit 0 → Layer 2 защиты не было
  - Затронуто: `check-spec-precondition.sh.tmpl` / `check-git-safety.sh.tmpl` / `update-bootstrap-state.sh.tmpl`
  - JSON stdin parsing через `jq` (с grep+sed fallback для систем без jq)
  - Exit code: 1 → 2 для блокировок (API: exit 2 = block + stderr к AI; exit 1 = error к юзеру, НЕ блокирует)
  - `check-spec-precondition`: добавлен `feat/` prefix support; spec lookup в обоих layout'ах (top-level `doc/` для new-product, `.ai-pm/doc/` для retrofit)

### Architecture notes

**Advisor honesty milestone.** До v0.6.0 advisor продавал две вещи которые жили только в LLM prompt: «не пропустит security» и «напомнит через 90 дней». PR'ы #55 и #56 backed обе deterministic script'ами. Теперь README может честно говорить «hard layer прибит скриптом, soft layer — opt-in PoC пока accuracy не валидирована».

**Layer 2 enforcement restored.** PR #50 закрыл silent enforcement break где 3 hook scripts реально не работали из-за env var assumption. До этого Layer 2 (PreToolUse / PostToolUse hooks) был эффективно отключен для spec-precondition / git-safety / state-update gates.

**Template-sync now testable.** PR #51 пришёл из heartvault first prod-run learnings (multi-version jump v0.1 → v0.5+ не fit'ил в single-version routine). Lightweight agent-driven flow первый раз делает routine реально execut'абельной.

### Что НЕ сделано в v0.6.0 (deferred)

- Advisor PoC accuracy validation (≥80% per axis gate) — required перед mandatory rollout advisor invocations в planner / coder / reviewer (currently opt-in)
- Public endpoints без auth middleware → остаётся в advisor soft layer (требует AST detection, не grep-able)
- Per-AP «When NOT applies» trade-off filling для AP-1..21 — incremental backlog (AP-22/23/24 уже структурированы)
- First downstream prod-run в `template-sync` mode — task #65 (heartvault initial adoption was manual, не via formal routine; теперь routine готова к тесту)

### Documentation migration impact (для downstream template-sync)

Downstream projects при template-sync v0.5.0 → v0.6.0 должны:

- [Scripts] **Apply** `scripts/check-security-floor.sh` (new) — generate из `_templates/scripts/check-security-floor.sh.tmpl`. Optional `--enforce` mode в CI если оператор хочет hard gate.
- [Scripts] **Apply** `scripts/check-skip-reprompts.sh` (new) — generate из `_templates/scripts/check-skip-reprompts.sh.tmpl`. Wired через `.claude/settings.json` SessionStart hook + `install-git-hooks.sh` pre-commit. Перегенерировать settings.json + install-git-hooks если ранее customized.
- [Hooks] **Regenerate** 3 hook scripts из templates (PR #50 fix): `check-spec-precondition.sh` / `check-git-safety.sh` / `update-bootstrap-state.sh`. **Inspection-before-regenerate** — если product сильно кастомизировал scripts, manual merge needed.
- [Hooks] **Regenerate** `install-git-hooks.sh` (PR #54 fix) — пробует 4 имени check-spec-discipline. Если product использовал extensionless `.sh` / `.py` / `.ts` вариант — теперь автоматически подхватится.
- [Hooks] **Regenerate** `.githooks/pre-push` (PR #48) — AP-16 review trail enforcement. CI workflow `.github/workflows/review-trail-check.yml` дублирует check.
- [AP-12] No template-side action required — softening — это template-internal documentation change. Если product добавлял свой anglicism CI gate — он независим.
- [Template-sync routine] Operators using `template-sync` mode: routine flow изменился (4-phase scripted → agent-driven). См. `.claude/agents/project-bootstrap.md` § Template-sync workflow + `doc/template-evolution.md` (new) для cheat sheet.

Downstream template-sync Phase 3 routine handle'ит каждую category с explicit operator approval + verification preservation.

---

## [0.5.0] — 2026-05-25

v0.5.0 Path A: documentation refresh под v0.4.0 reality. PATCH (docs only — README + personas + user-journeys; no template content / agent / script changes).

**Note on Path A interpretation:** original plan v3 предполагал outcome-based hero positioning + central pain table. Этот подход был **rejected operator'ом** (feedback в session memory) — потерял PM/Developer symmetric pain framing, который является central differentiator. Revised approach: persona-language documentation refresh (per operator feedback `feedback_docs_reflect_persona_needs`) — preserve Core product thesis, обновить terminology под v0.4.0 reality.

### Changed

- **README.md** — minor sweep под v0.4.0:
  - «шесть стадий» → «пять стадий» (Stage C упразднён в v0.3.0)
  - Stage A artifacts: merged (`positioning.md` incl. competitive § 1, `ui-style-guide-base.md` incl. brand voice § 2)
  - Stage B artifacts: `legal.md` (§ 1 frame + § 2 brief)
  - Stage D artifacts: `tech-stack.md` (Stage C fold), `maintenance-playbook.md` (Part A dep + Part B refactor)
  - Stage E: 1 checkpoint `bootstrap-verify.sh passed`
  - Init flow добавлен Advisor preset (v0.4.0)
  - Subagents: добавлен `discipline-advisor` (v0.4.0)
  - Spec linting catalogue: добавлены v0.2.0+ gates (spec-test-mapping / test-assertion-weakening / regression-coverage / adr-auto-extraction)
  - PM/Developer pain framing **preserved** (Core product thesis — central differentiator)

- **doc/personas.md** — 3 minor touch-ups:
  - Persona A: добавлено `template-sync` mode mention
  - Persona C: добавлено `bug-fix` mode mention (primary user lite ceremony)
  - Resolved decision 1: init вопросы updated с Advisor preset

- **doc/user-journeys.md** — full rewrite:
  - 3 journeys → **7 journeys** под current 5 modes:
    - Journey 1: `new-product` (updated)
    - Journey 2: `feature` в template-native проекте (updated — теперь чётко framed, не «cold start в existing repo»)
    - Journey 3: `rework` (updated с advisor invocation)
    - **Journey 4 NEW: `bug-fix`** — lite ceremony
    - **Journey 5 NEW: `template-sync`** — 4 phases
    - **Journey 6 NEW: Legacy adoption 3-choice** (Quick auto / Manual staged / Skip) — точка входа для existing проектов
    - **Journey 7 NEW: Architecture overview keyword routing** — read-only Tier 0 scan
  - Success metrics updated per current modes
  - Resolved decisions updated:
    - decision 4 (Recipe staleness): **deferred в v0.X** per operator discussion 2026-05-25 (рецепты обновляем руками)
    - decision 5/6 added: 3-choice legacy entry + conditional skip per artifact

### Architecture: v0.5.0 = framework production-ready milestone

После v0.5.0 framework считается **готовым к first downstream prod-run**. Все pre-condition'ы closed:
- ✅ v0.2.0 (silent-break gaps + AP-23/24 + size gate)
- ✅ Validation gate (pain mapping + self-experiment + no-framework baseline)
- ✅ v0.3.0 (Path C consolidation + lazy loading + bootstrap-verify.sh)
- ✅ v0.4.0 (skip_eligibility + discipline-advisor opt-in + PoC accuracy protocol)
- ✅ v0.5.0 (documentation refresh — README/personas/user-journeys current с v0.4.0 reality)

Next milestone — task #65 «First downstream prod-run via `template-sync`». До этого — стратегическая беседа с оператором (memory `project-post-template-chat`).

### Persona validation results (2026-05-25)

Перед v0.5.0 проведена validation: персона needs из `personas.md` × template features в v0.4.0:

- Persona A (PM-manager): **11/11 needs covered**, no gaps
- Persona B (cross-stack senior): 7/9 covered, 2 partial (recipe coverage sparse — deferred, tier framework runtime — non-gap per personas.md decision 3 re-read)
- Persona C (full-stack pro): 8/9 covered, 1 partial (same tier framework — non-gap)

Net: validation **passes**. Recipe coverage sparseness — accepted scope для solo PM-AI workflow (community contributions or manual draft per stack).

### Что НЕ сделано в v0.5.0 (deferred)

- Outcome-based hero rewrite — rejected per operator feedback (preserve PM/Developer symmetric pain framing)
- Pain → mitigation table как central section — rejected (operator: «PM в компании 100 человек тоже так себе заявление»)
- Full per-AP trade-off filling — incremental backlog (AP-22/23/24 уже структурированы; AP-1..21 дополняются по мере real edge case'ов)
- Downstream feedback loop — будет в task #65 (first downstream prod-run)

---

## [0.4.0] — 2026-05-25

v0.4.0 Path B: conditional skip framework + discipline-advisor (5-axis quality challenger). **MINOR-additive** (revised от MAJOR per plan-review concerning-5): все additions с sensible defaults preserve existing behavior. Existing state files без новых полей → `advisor_preset: full` (current behavior) + empty `skip_decisions` / `advisor_log` = no advisor activity. No migration needed.

### Added

- **skip_eligibility metadata в 31 templates** — frontmatter секция с:
  - `default: required | recommended | optional | conditional`
  - `skip_if: <text condition>`
  - `hard_floor: <never-skip-if condition>` (optional, для security/PII/payments paths)
  - Per-artifact rules matched к plan v3 Skip eligibility table

- **State schema additions** в `bootstrap-state.md.tmpl`:
  - `advisor_preset: full | standard | minimal` — preset для advisor рекомендаций
  - `skip_decisions: []` — per-artifact decisions log с `state` / `reason` / `declared_at` / `next_reprompt` / `promoted_by`
  - `advisor_log: []` — append-only audit trail advisor sessions

- **discipline-advisor subagent** (`.claude/agents/discipline-advisor.md`):
  - **Hybrid architecture:** deterministic floor (irreducible hard rules) + smart layer (bounded scan)
  - **Hard detection rules:** PII / payments / crypto / auth → mandatory recommendations без opt-out
  - **5-axis quality challenger** на Stage F triggers (Step 1 spec / Step 2 plan / Step 4 coding / Step 7 review) + bootstrap entry / preset change
  - **Cost-bounded:** <10k tokens budget, sample scan (entry points + manifests + 5-10 heuristic files), cached per session
  - **Read-only** — не пишет файлы, returns structured advisory
  - **Output:** `mandatory: [...]` / `recommended: [...]` / `skip-safe: [...]` с reasons + pointer'ами на code

- **Advisor invocation hooks в Stage F subagents** (v0.4.0+ opt-in):
  - `planner.md` — Step 2 advisor invocation (scope-proportionality, ADR forks, test plan completeness)
  - `coder.md` — pre/post diff advisor (gap closure pre-check для CI gates)
  - `reviewer.md` Step 3.5 — multi-axis coverage check (findings address все 6 axes?)
  
  Все три — opt-in пока PoC accuracy gate не достигнут. После validation → mandatory.

- **PoC accuracy protocol document** (`meta/experiments/2026-05-25_advisor-poc-accuracy-protocol.md`):
  - 15 synthetic test projects covering different complexity axes
  - Pre-labelled expected outputs (skip / recommended / mandatory per artifact)
  - Measurement protocol: per-axis + per-trigger accuracy
  - Bar: ≥80% per axis для mandatory; <80% → static fallback
  - Closes plan-review concerning-2 (measurement protocol не defined as written)

- **Layer-climbing escalation mechanism** (closes critique audit дыра 4):
  - `skip_decisions[].next_reprompt` field — default 90 days from `declared_at`
  - На Stage F entry — check expired re-prompts: если `next_reprompt < today` для active skip → advisor «время re-validate skip <artifact>»
  - Severity escalation: 1st re-prompt friendly / 2nd warning / 3rd finding в review trail
  - Operator может extend через re-validation

### Architecture notes

**MAJOR vs MINOR decision** (plan-review concerning-5): revised на MINOR.
- `skip_eligibility` metadata defaults preserve existing (required / recommended)
- `advisor_preset` default = `full` (existing behavior — no skips recommended)
- New subagent opt-in, не invoked automatically
- Advisor invocation hooks opt-in в Stage F subagents
- No template file renames / removals breaking existing
- No state schema field renames

**Что requires explicit operator action** (не «breaking», но recommended):
- New projects starting в v0.4.0 — set `advisor_preset: standard` для leverage conditional skip
- Existing projects template-sync'нувшиеся — keep `advisor_preset: full` пока operator не decide otherwise

### Concerning items closure (plan review)

- ✅ concerning-2 (PoC accuracy measurement protocol) — `meta/experiments/2026-05-25_advisor-poc-accuracy-protocol.md` created
- ✅ concerning-5 (MAJOR vs MINOR) — downgraded на MINOR-additive
- ✅ concerning-6 (skip eligibility pre/post-merge) — redirect stubs preserve metadata pointing к merged target
- ✅ critique дыра 4 (layer-climbing) — `next_reprompt` mechanism + escalation severity
- ✅ critique дыра 5 (advisor vaporware) — PoC accuracy gate ≥80% per axis blocks mandatory rollout

### Deferred к v0.5.0+

- Full per-AP trade-off filling (AP-1..21 «When NOT applies» sections) — incremental backlog
- Advisor `mandatory` flagging в Stage F subagents — after PoC validation
- Downstream feedback loop в acceptance criteria (concerning missing-4) — будет в HeartVault first prod-run (task #65)

---

## [0.3.0] — 2026-05-25

v0.3.0 Path C: Stage consolidation (same-axis merges) + Stage E checkpoint reduction + lazy foundational loading. MINOR — additive merges + new artifacts, redirect stubs preserve backwards-compat для existing template-using проектов.

### Added

- **Tech-stack umbrella artifact** (`_templates/tech-stack.md.tmpl`) — Stage D consolidation:
  - § 1 Stack choice
  - § 2 Topology (Stage C fold)
  - § 3 Database (db_kind + per-kind references)
  - § 4 Deployment topology

- **Maintenance-playbook umbrella** (`_templates/maintenance-playbook.md.tmpl`) — Stage D opt., combines:
  - Part A: Dependency Update Policy
  - Part B: Refactor Playbook

- **Legal umbrella** (`_templates/legal.md.tmpl`) — Stage B, combines:
  - § 1 Legal frame (постоянное framing — jurisdiction / regulatory)
  - § 2 Brief для юриста (actionable distillation)

- **Bootstrap verification script** (`_templates/scripts/bootstrap-verify.sh.tmpl`) — Stage E health-check, 12 granular check functions, `--strict` mode для CI, separation validation (script) vs tracking (state).

- **Lazy foundational loading в Stage F subagents** (planner / coder / reviewer):
  - Always read minimum baseline (spec / plan / protocol / state)
  - Conditional read по impact flags из spec frontmatter
  - Estimated savings: 40-80% load reduction per session, 2-3× context savings

- **AP trade-off documentation note** (anti-patterns.md head) — honest признание что AP — opinionated defaults, не engineering laws (per дыра 6 critique audit). AP-22/23/24 уже структурированы; AP-1..21 incrementally дополняются через v0.4.0+.

### Changed

- **Stage table в development-protocol.md § 4:** 6 stages → 5 stages. Stage C **упразднён** (topology + foundational ADRs folded в Stage D `tech-stack.md`). Reactive ADRs preserved (AP-1).

- **Stage E section в bootstrap-state.md.tmpl:** 12 granular checkboxes → 1 checkpoint (`bootstrap-verify.sh passed`).

- **4 same-axis merges:**
  - `positioning.md` ← absorbs `competitive-analysis.md` as § 1 (product framing axis)
  - `ui-style-guide-base.md` § 2 Brand voice ← absorbs full `brand-voice.md` content (UI consistency axis)
  - `maintenance-playbook.md` ← combines `dependency-policy.md` + `refactor-playbook.md` (maintainability axis)
  - `legal.md` ← combines legal-frame + legal-brief (legal axis)

- **NOT merged** per plan v3 revised (different axes):
  - vision + strategic-frame (product intent vs SLO measurability)
  - personas + journeys (psychographics vs interaction flow)
  - threats + incident-runbook (identify vs respond)
  - per-kind database-design (conditional activation)

### Deprecated (redirect stubs)

Old standalone templates → redirect stubs с migration instructions:
- `competitive-analysis.md.tmpl` → `positioning.md` § 1
- `brand-voice.md.tmpl` → `ui-style-guide-base.md` § 2
- `dependency-policy.md.tmpl` → `maintenance-playbook.md` Part A
- `refactor-playbook.md.tmpl` → `maintenance-playbook.md` Part B
- `legal-brief.md.tmpl` → `legal.md` § 2
- `topology.md.tmpl` → `tech-stack.md` § 2

Removed в v0.4.0+ после downstream проектов пройдут `template-sync`.

### Architecture notes

**Result:** ~25 → ~20 artifacts (5 merges + Stage C упразднён) без потери dimensional coverage. Validates Path C revised criterion (same-axis merges only).

**Mitigation 2 implemented** в каждом merged artifact:
- TL;DR section с section checkboxes (prominence preservation)
- Bold prompts перед каждой бывшей-отдельной секцией
- Soft cap on document length

**Mitigation 3 implemented:** Stage E granular validation through script, coarse tracking through state.

6 quality dimensions preserved (понятность / поддерживаемость / технические качество / UI / UX / learning). См. dimensional coverage table в `meta/reviews/feat-v030-stage-merges-and-lazy_review.md`.

---

## [0.2.0] — 2026-05-25

v0.2.0 fix wave + silent-break gaps closure. PATCH defects + MINOR additive features (new CI gates / new APs).

### Added

- **2 new anti-patterns:**
  - **AP-23** — Test assertion weakened без declared behaviour change. Closes user pain «AI правит тесты под свои выдумки». Coarse `git diff` detection + ADR-NNNN reference или `[test-modify-override:]` marker required.
  - **AP-24** — Architectural decisions buried in spec без ADR. Closes AP-1 dead letter pattern (proven на live test'е). Explicit relationship table с AP-1 (proactive Step 2 vs retroactive Step 7), boundary heuristic (forks vs documentation), precedence (ADR ref в spec → > 50 LOC OK).

- **4 new CI gates** в `_templates/scripts/check-spec-discipline.sh.tmpl`:
  - `spec-test-mapping` (gap 1) — каждый Gherkin Scenario имеет matching test (multi-stack discovery: Go/Python/JS/TS/Ruby/Java/Kotlin/C#/Gherkin)
  - `test-assertion-weakening` (gap 2 / AP-23) — detect modified test files без ADR ref
  - `regression-coverage-for-shared-modules` (gap 3 / AP-14 ext.) — spec с `topology_impact: yes` обязан содержать `## Regression coverage plan`
  - `adr-auto-extraction` (AP-24) — section с architectural keywords > 30 LOC warn, > 50 LOC без ADR ref fail

- **Reviewer Step 1.6 size + content-aware fan-out gate** (`.claude/agents/reviewer.md`):
  - PR < 100 LOC → только protocol-compliance-reviewer (skip domain fan-out)
  - Content-aware override для security-sensitive paths (`auth/` / `payments/` / `db/migrations/` / `crypto/` / `*.lock`) → full fan-out независимо от LOC
  - Configurable per-project через `.claude/settings.json` или development-protocol-overlay

- **AP-14 extended** — Regression coverage discipline subsection (требование plan section для `topology_impact: yes`, 60% coverage growth для legacy adoption)

- **New `## Regression coverage plan` section** в `_templates/feature-spec.md.tmpl` (shared modules / existing tests / new regression tests / coverage delta verification)

- **YAML frontmatter** в `_templates/feature-spec.md.tmpl` head (topic / mode / lite-mode / created / spec_approved / plan_approved / acceptance / merged / review_url / pr_ordering / template_version_applied + 7 impact полей)

- **Verdict line restored** в `_templates/feature-review.md.tmpl` — `**Verdict:** approve | request-changes | block` (AP-16 hook парсит), reviewer roster обновлён на актуальный v0.1.0+

- **Session start Step 1.5** в `_templates/CLAUDE.md.tmpl` — foundation_completeness check (complete/partial/minimal/none routing)

- **Sanitized live-test feedback audit** (`meta/audits/2026-05-24_first-prod-run-feedback.md`) — general lessons из первого live test'а template'а

- **Validation gate artifacts** (`meta/research/`, `meta/experiments/`) — operator pain mapping + silent-break prevention verification

### Changed

- **«Mode 1/2/3» terminology sweep** → named modes (`new-product` / `feature` / `rework` / `bug-fix` / `template-sync`) во всех ~21 production файле. Mapping: Mode 1→new-product, Mode 2→feature, Mode 3→rework, Mode 4→bug-fix, Mode 5→template-sync.

- **Scripts location convention unified** — `.tmpl` headers + protocol § 9 ссылаются на product `scripts/` (генерируются на Stage E из `_templates/`), не `.ai-pm/tooling/scripts/`. Tooling submodule — read-only, scripts генерируются в product.

- **meta/ references в product workflow** → unified `.ai-pm/migrations/` и `.ai-pm/extracts/` convention'ы (`meta/` остаётся template-internal, не копируется в product).

- **AP-16 metadata documented** — `trail_type` field declared informational metadata с enum (`committed-review` / `local-trace` / `skip-marker`).

- **Mini-foundation section в feature-spec template** — добавлен HTML comment marker с explicit instruction УДАЛИТЬ при `foundation_completeness=complete` (~95% случаев в greenfield).

### Fixed

- 4 Blocking defects из post-refactor audit:
  - **B-1** Mode renaming sweep incomplete (~80% template still on old terminology)
  - **B-2** feature-spec.md.tmpl missing YAML frontmatter example
  - **B-3** feature-review.md.tmpl missing Verdict line + orphan security-reviewer references
  - **B-4** scripts location inconsistency в `.tmpl` headers vs protocol

- 5 High findings batch:
  - **H-1** CLAUDE.md.tmpl session start missing foundation_completeness check
  - **H-2** orphan `trail_type` field documented в AP-16
  - **H-3** meta/ references в template-sync workflow → `.ai-pm/migrations/`
  - **H-4** architecture-extract location consistency → `.ai-pm/extracts/`
  - **H-5** Mini-foundation section friction в complete state (HTML comment marker)

### Architecture notes

v0.2.0 закрывает proven gaps от first live test (через `meta/audits/2026-05-24_first-prod-run-feedback.md`) и silent-break audit. Mental model оператора («PM пишет хорошую спеку → автоматика проверяет код → линтеры enforce качество → не читать код») теперь работает на 100% для main feature flow — все 3 silent-break gaps closed + AP-1 dead letter pattern закрыт через AP-24.

8 axes мультироутинга (uplift с 7 в v0.1.0): + новая ось «size + content-aware reviewer routing» (AP-20 extension).

См. detailed план реализации v0.2.0..v0.5.0 в `meta/design/2026-05-25_merged-optimization-plan.md`.

---

## [0.1.0] — 2026-05-24

Initial public release. Foundation для template ai-pm-protocol с полной mode matrix, legacy adoption support и template versioning.

### Added

- **Five modes** (Stage F workflow): `new-product` / `feature` / `rework` / `bug-fix` / `template-sync`
- **Foundation state** orthogonal в `.bootstrap-state.md`:
  - `foundation_completeness: complete | partial | minimal | none`
  - `adoption_path: greenfield | legacy-quick | legacy-staged | legacy-skip | null`
  - `template_version_applied: vX.Y.Z`
  - `adoption_overrides: []`
- **Six stages** lifecycle: Discovery (A) → Constraints (B) → Solution shape (C) → Process (D) → Bootstrap (E) → Production (F)
- **Three integration modes** для `.ai-pm/tooling/`: gitignore / submodule / vendor
- **Three Trust profiles** A/B/C — operator behavior differentiation (PM-manager / cross-stack senior / full-stack pro)
- **Composition matrices**: multi-value `ui_kind` (web / native-mobile / native-desktop / tui / cli / embedded / backend) + multi-value `db_kind` (embedded / external / none)
- **Tier framework для legacy adoption**:
  - Tier 0 — auto-extract (stack / ui_kind / db_kind / topology / ui-style / database-design)
  - Tier 1 — per-feature mini-research (Mini-persona / Journey context / Mini-threat-list inline в feature spec)
  - Tier 2 — operator-initiated promotion (consolidation mini-* sections → project-wide)
  - Tier 3 — declared overrides (`adoption_overrides` с reason + accepted-risk)
- **Specialized reviewer routing** (primary + ONE domain reviewer + always protocol-compliance):
  - `reviewer.md` (primary / orchestrator)
  - `protocol-compliance-reviewer.md` (always-spawned)
  - `backend-reviewer.md` / `frontend-reviewer.md` / `design-reviewer.md` / `database-reviewer.md`
- **Eight foundational artifacts** Stage A: vision / personas / user-journeys / competitive-analysis / positioning / brand-voice / ui-style-guide-base + per-kind
- **Stage E developer ergonomics**: dev-environment.md, optional refactor-playbook.md, optional dependency-policy.md
- **22 Anti-patterns** (AP-1 .. AP-22) — discipline invariants:
  - AP-1: ADR reactive, не upfront
  - AP-2: No premature Stage E
  - AP-3: Operator-gate между stages
  - AP-4: Specification First
  - AP-5: Tests First
  - AP-6: No silent deviation from plan
  - AP-7: Foundational docs — separate PRs
  - AP-8: Useful, не technically-correct
  - AP-9: No state pre-fill
  - AP-10: No git config override
  - AP-11: Critical analysis before draft
  - AP-12: Anglicism discipline
  - AP-13: Operational/legal/validation artifacts
  - AP-14: Structural read-pass
  - AP-15: UI-style-guide foundation
  - AP-16: Offline review trail с verdict-gate
  - AP-17: No product-name leak в template
  - AP-18: Unsafe deploys (expand-contract)
  - AP-19: Per-PR atomicity
  - AP-20: Specialized reviewer routing
  - AP-21: Бесконечный rework без exit condition
  - AP-22: Adoption-override без declared trade-off
- **Auto-extract scripts** (Tier 0): `extract-stack.sh` / `extract-ui-kind.sh` / `extract-db-kind.sh` / `extract-topology.py` / `extract-ui-style.py` / `extract-database-design.py` / `extract-all.sh` (orchestrator с `--read-only` mode для architecture-overview keyword)
- **Foundation maintenance scripts**:
  - `promote-foundation.py` (Tier 2 consolidation)
  - `template-sync-doc-migrate.py` (template-sync Phase 3 documentation migration helper)
- **State-aware CI** (`check-spec-discipline.sh.tmpl`) — reads `foundation_completeness` + `adoption_overrides`, downgrades affected checks с tag «adoption-trade-off accepted by operator»
- **Template-sync workflow** (4 phases): template files apply → schema migration → documentation migration → PR. Manual-only invocation, AI не auto-suggests.
- **Architecture overview** keyword routing — read-only Tier 0 pass, output в `meta/architecture-extract-<date>.md`, не trigger adoption
- **5-layer enforcement**: CLAUDE.md briefing → settings.json hooks → subagent routine → git hooks → CI gates
- **AI-specific linting catalogue** (§ 6 protocol)
- **Architecture linting catalogue** (§ 7 protocol)
- **Spec/use-case linting catalogue** (§ 9 protocol)
- **Security scanning catalogue** (§ 10 protocol, anchored в OWASP / CWE / NIST / CIS / SLSA standards)

### Architecture

- Operator-aware terminology (PM при Trust profile A / developer при Trust profile B/C — далее «оператор»; convention из AP-16)
- README symmetric thesis (PM ↔ Developer) + bidirectional learning
- Template-internal artifacts в `meta/` (audits / reviews / design) — НЕ копируется в product
- Product-side artifacts в `doc/_templates/*.tmpl` — копируется на Stage E с slot fill
- 10 subagents в `.claude/agents/` (project-bootstrap, planner, coder, reviewer, protocol-compliance-reviewer, backend-reviewer, frontend-reviewer, design-reviewer, database-reviewer, release-helper)

### Notes

Это **initial release**. Шаблон обкатывается на реальных prod-run'ах; правила и templates уточняются по мере того, как реальный проект сталкивается с реальностью.

[Unreleased]: https://github.com/aadegtyarev/ai-pm-protocol/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/aadegtyarev/ai-pm-protocol/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/aadegtyarev/ai-pm-protocol/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/aadegtyarev/ai-pm-protocol/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/aadegtyarev/ai-pm-protocol/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/aadegtyarev/ai-pm-protocol/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/aadegtyarev/ai-pm-protocol/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/aadegtyarev/ai-pm-protocol/releases/tag/v0.1.0
