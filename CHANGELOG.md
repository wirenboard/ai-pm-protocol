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

[Unreleased]: https://github.com/aadegtyarev/ai-pm-protocol/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/aadegtyarev/ai-pm-protocol/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/aadegtyarev/ai-pm-protocol/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/aadegtyarev/ai-pm-protocol/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/aadegtyarev/ai-pm-protocol/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/aadegtyarev/ai-pm-protocol/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/aadegtyarev/ai-pm-protocol/releases/tag/v0.1.0
