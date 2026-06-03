# Changelog

Формат — [Keep a Changelog 1.1.0](https://keepachangelog.com/ru/1.1.0/), versioning по [SemVer 2.0](https://semver.org/lang/ru/).

**SemVer для template:**
- **MAJOR** — breaking changes: несовместимые изменения структуры проекта, удалённые агенты/команды
- **MINOR** — новые агенты, команды, шаблонные документы
- **PATCH** — fixes, уточнения, нефункциональные изменения

---

## [Unreleased]

---

## [2.8.0] — 2026-06-03

Adds a new home for technical taxonomies and invariants (`## Behavioral contract` in `architecture.md`) and rewrites journey-step guidance into human language, eliminating protocol identifiers and format tables from step bodies and journeys' Invariants fields. Journeys now reference the Behavioral contract section move-not-copy, establishing single-source-of-truth for all format/taxonomy invariants.

### Added
- **Behavioral contract section** (`doc/_templates/architecture.md.tmpl:65`): new top-level `## Behavioral contract (taxonomies & invariants)` section, distinct from `## Integration contract`, serves as the single owner for status enums, topic/ID grammars, QoS levels, reachability rules, and other domain invariants. Includes guidance for `N/A — <reason>` when projects have no taxonomies.
- **Human-language journey guidance** (`doc/_templates/user-journeys.md.tmpl:13–28`): step guidance rewritten to demand human-language text ("what the user does / expects / can go wrong") with **no** protocol identifiers, field names, QoS, or retain flags in step bodies. The `**Invariants:**` field now routes all format/taxonomy invariants to `## Behavioral contract` by reference (move-not-copy), eliminating duplication and drift.
- **Agent walk-list sync** (`pm-architect.md:18`, `pm-bootstrap.md:141`): both now include `Behavioral contract (taxonomies & invariants)` in their lists; `pm-architect` A4 cross-check set explicitly kept unchanged (File layout / Release flow / Integration contract only — Behavioral contract is authored content, not auto-checked).
- **Legacy-reader routing** (`pm-legacy-reader.md:70`): new guidance routes observed identifiers (status enums, topic/ID names, QoS, retain, reachability rules) into the architecture draft's `## Behavioral contract` section, never into journey step bodies.

### Changed
- **Architecture record** (`doc/architecture.md` §5): recorded that technical taxonomies and invariants are owned by a single Behavioral contract section; journeys are human-language and reference it move-not-copy. Owner: `pm-architect`.

---

## [2.7.0] — 2026-06-03

README front-gate (two-layer-docs slice 2): the scaffolded README no longer owns a capability list. `## What it does` is removed from the template and replaced with a single pointer to `docs/product.md`, so `docs/product.md` `## Что умеет сегодня` is the single owner of "what it does / for whom / limits" — eliminating the cause of README↔product.md drift. For existing downstream projects (README is authored, not regenerated), a move-not-copy migration is offered.

### Added
- **README template front-gate** (`doc/_templates/README.md.tmpl`): the `## What it does` capability list is removed and replaced with a one-line pointer to `docs/product.md`; Quick start / Architecture / Development / License unchanged. New scaffolds carry no capability list. No status line.
- **Old-template README migration** (`pm-bootstrap.md` → `### Pending-migration detection` + the README front-gate migration procedure): an existing `README.md` carrying a `## What it does` list is detected (positive presence of the heading; new-structure READMEs not flagged) and offered a **move-not-copy** migration — `pm-architect` reconciles the README's capabilities into `docs/product.md` `## Что умеет сегодня` first, then removes the README list and inserts the pointer. Install / Quick start preserved (pm-architect A4 cross-check stays valid). Precondition: an authored `docs/product.md` must exist (run the v2.3 migration first if absent).
- **Detection surfaces** (`pm-auditor.md`, `pm-plan.md`, `pm-audit.md`): a non-blocking structure-only note and migration nudge for the old-template README, each referencing `### Pending-migration detection` by name (the condition is not re-encoded).

### Changed
- **Architecture record** (`doc/architecture.md`): documented that the README owns no capability statements, `docs/product.md` is the single owner, and existing projects are migrated move-not-copy. Owner: `pm-architect`.

---

## [2.6.0] — 2026-06-03

Reorders product contract blocks to lead with user value and boundary statements, demoting the technical build table to a secondary position, addressing real-project feedback on contract readability and facilitating format-refresh detection for maps still using deprecated `Guarantees:` labels.

### Added
- **Value-first contract layout** (`pm-bootstrap.md` §2): product-map contract blocks now lead each feature/non-infra bucket with `Что даёт:` (from `## User value`) and `Границы:` (from `## Out of scope`), placing the technical build table under a plain `Чем построено:` label below. Worked example updated.
- **Old-format detection** (`pm-bootstrap.md` §2.1 `### Pending-migration detection`): condition for maps using deprecated `Guarantees:` label added (distinguishes content-stale audit finding from format-upgrade offer). Auditor, `/pm-audit`, `/pm-plan` surfaced as non-blocking reminders.

### Changed
- **Contract block structure** (`pm-bootstrap.md` step 2): technical table moved under `Чем построено:` heading; `Границы:` now omitted when `## Out of scope` is empty per existing rule.
- **Architecture record** (`doc/architecture.md` §3): documented the value-first rendering pattern (markup-only projection, no HTML `<details>`) and old-format detection route. Owner `pm-architect`.

---

## [2.5.0] — 2026-06-02

Makes detection of an un-migrated template structure reliable and turns the passive "map missing" note into an active offer to run the pending migration (backlog #4).

### Added
- **Single-sourced detection** (`pm-bootstrap.md` § `Pending-migration detection`): new named subsection consolidates both un-migrated conditions (lingering `docs/features/_index.md`; or generated `docs/product.md` + frozen v2.3 signature with no `docs/product-map.md`) and the frozen signature string in exactly one place. Cited by name from `pm-auditor`, `pm-audit`, `pm-plan` — no re-encoding.
- **Auditor reliability** (`pm-auditor.md`): inventory sourced from `git log` only (lingering `_index.md` flagged as un-migrated structure, never an inventory source); `product-map.md`-exists check moved to hard early gate (line 110) before re-derivation; greenfield/feature-less exemption made stricter (precondition: no `_index.md` + no contracts + no plans).
- **Active offer path** (`/pm-audit`): when un-migrated structure is found, auditor flags it read-only; orchestrator offers a remediation branch ("The auditor only flagged it; run `/pm-bootstrap` to migrate"). `/pm-plan` adds a sibling retrospective-check nudge (cloned from 5+-features block), PM-authorized, never auto-runs.

### Changed
- `pm-bootstrap.md`: migration procedures (v2.2/v2.3 steps) unchanged; detection prose moved to named subsection, procedures now reference by name.
- `pm-auditor.md`, `pm-audit.md`, `pm-plan.md` — route detection to named subsection; auditor retains read-only, offer/action lives in orchestrator commands.

---

## [2.4.0] — 2026-06-02

Aligns `architecture.md` template and agents with drifted coherence, addressing backlog findings #2, #3, #5: template enriched with coarse module-map section, integration-contract clarification, and release-flow guidance; agent/auditor prose aligned to match; one self-contradiction in the protocol's own `doc/architecture.md` fixed.

### Added
- **Template enrichment** (`doc/_templates/architecture.md.tmpl`): new sections `File layout (module map)` (coarse directory/module → responsibility map, not per-function; distinct from PM-facing `docs/product.md` "## Документы"), `Integration contract`, and `Release flow`. Renamed `Key decisions → Architectural decisions` and `Constraints → Architectural constraints` for clarity.
- **Agent prose alignment**: `pm-architect.md` A4 cross-check section lists, `pm-bootstrap.md` section enumeration now literally match enriched template (no phantom sections, no skips).
- **Auditor anchor refinement** (`pm-auditor.md` §5 Docs currency): check keys on named `File layout (module map)` section, stopping phantom "components must be listed" soft-requirement the template couldn't satisfy.

### Fixed
- **`doc/architecture.md:115`**: self-contradiction — absolute claim "hooks are `PreToolUse`-only" replaced with "`PreToolUse` guards plus one `UserPromptSubmit` route reminder", consistent with line 100 and `.claude/settings.json` configuration (which ships both routes).

---

## [2.3.0] — 2026-06-02

Splits the product documentation into two layers, addressing real-project feedback from wb-mqtt-matter: an authored PM front door (funnel) and a generated contract-to-features map.

### Added
- **`docs/product.md` as authored PM front door** (owned by `pm-architect`) — a funnel scaffolding why the product exists / what it does today / key documents / functions. Never regenerated by the auditor. Includes the "что пока НЕ умеет" boundary example. Validated one-pass by PM from bootstrap product Q&A.
- **`docs/product-map.md` as generated contract→features map** (rebuilt by `pm-auditor` / Product map generation) — clickable contract links, user-value guarantees from the contract's `## User value` section, status legend, and collapsing for multi-contract features (`↑ та же работа`).
- **Invariants for each writer** (`pm-architect` / `pm-auditor` / product map procedure): "writes only X, never Y" — enforced in procedures and arch notes to prevent concurrent regeneration of the same layer.
- **Migration (v2.3, idempotent, Variant A):** `/pm-bootstrap` detects pre-split state (signature line present in `product.md` AND `product-map.md` absent), `git mv`s to the generated file, and scaffolds fresh authored `product.md` from template. Signature coupling (frozen detection string) preserved to ensure two-guard idempotency.

### Changed
- `pm-bootstrap.md`, `pm-auditor.md`, `pm-architect.md`, `pm-plan.md` — retargeted to split ownership (map generation / front-door authoring).
- `doc/_templates/product.md.tmpl` — new authored template, includes "что пока НЕ умеет" boundary example, marked as not-generated.
- `doc/_templates/CLAUDE.md.tmpl` — added `docs/product-map.md` row; noted `product.md` as authored funnel.
- `doc/architecture.md` — documented authored/generated split; "deliberate exception" note covers both files.
- `README.md` — v2.3 migration section, capability descriptions reflect split.
- `tests/hooks.sh` — unchanged; 65/65 pass.

### Migration (downstream projects)
After `git submodule update --remote`, run the v2.3 migration: tell the agent **«мигрируй на v2.3»** (or re-run `/pm-bootstrap`, which detects it) — if the old merged-document structure is present (signature line found), the agent splits `docs/product.md` into authored funnel + `docs/product-map.md`, scaffolds the new front door, and removes the signature line. One run, idempotent, safe on greenfield projects. See README § "Миграция на v2.3.0".

---

## [2.2.3] — 2026-06-02

### Fixed
- `pm-pr-prep`: in release commit step 4, now stages feature review artifacts from `.ai-pm/reviews/` and `.ai-pm/arch/` alongside CHANGELOG + metadata. Root-cause fix: PR #158's review file (`fixup-orchestrator-no-external-state_review.md`) was committed in the feature branch but not re-staged into the release commit, leaving it orphaned on merge. Recovers the artifact.

### Changed / Docs
- `.ai-pm/backlog.md`: recorded four protocol findings from downstream wb-mqtt-matter feature review (PR #158): edit-ownership enforcement gap, `architecture.md` module-map section, template/tooling desync, product-map migration trigger + auditor detection bug. Deferred to `/pm-plan` cycle.

---

## [2.2.2] — 2026-06-02

### Changed
- `.claude/settings.json`: added top-level `"autoMemoryEnabled": false` to disable orchestrator auto-memory (private state store outside project root). All protocol state lives in project artifacts (`.ai-pm/`, `doc/`, plans, reviews).
- `.gitignore`: added `.claude/tmp/` as sanctioned project-local scratch directory (git-ignored, passes path-boundary hooks).
- `WORKFLOW.md`: documented `.claude/tmp/` as throwaway/diagnostic scratch dir inside project root (not `/tmp`).
- `README.md`: noted orchestrator auto-memory is off and `.claude/tmp/` is the scratch directory.

---

## [2.2.1] — 2026-06-02

### Changed
- Docs: updating the template can be requested in plain language ("обнови шаблон" / "bump ai-pm-protocol to vX.Y") — documented in README and WORKFLOW.md as orchestrator chore work (submodule bump on a branch + any pending migration), no `/pm-plan` needed.

---

## [2.2.0] — 2026-06-02

Realignment of the protocol around best-in-class built-in skills/tools, a contract-centric product map, and a PM-authorized diagnostic-probe mode.

### Added
- **Agent/skill routing guard** (`PreToolUse`): denies `wb-*` role duplicators (`coder`, `code-reviewer`, `design-review`, `plan-feature`, `pr-prep`, `wb-git:workflow`, `wb-git:pr-author`) with a pointer to the `pm-*` equivalent. Named deny-list — `code-review`, `deep-research`, and `wb-*` knowledge skills stay available.
- **UserPromptSubmit route reminder**: reasserts the protocol route on change-intent prompts (RU + EN), silent on chit-chat; exempts PM-authorized diagnostic probes.
- **Explicit `tools:` frontmatter** on all seven `pm-*` agents (read-only reviewers can no longer edit code; Web confined to `pm-stack-researcher`; `Skill` kept for `pm-coder`/`pm-stack-researcher`).
- **PR-review-response path** (WORKFLOW Step 7): orchestrator-driven loop for review comments on an open PR — fetch, triage, fix via `pm-coder`, reply, resolve.
- **`verify`/`run` adoption** (WORKFLOW Step 5.5): optionally exercise a feature for real before ship.
- **`docs/product.md`** — contract-centric product map (group → contract → features + reviews + Infrastructure bucket), generated and audit-verified; **Product map generation procedure**.
- **`Built/changed by`** section in `contract.md.tmpl`.
- **`pm-plan-checker` DoD** artifact-completeness item (the per-feature gate that replaced the index).
- **PM-authorized diagnostic-probe mode** (WORKFLOW Step A.5): a throwaway, runtime/local probe to confirm a hypothesis, proposed to the PM in plain language with before→after, never editing a repo-owned file in place.
- Design/plan docs: `doc/protocol-vs-builtins-analysis.md` and feature plans for the realignment, product map, and probe mode.

### Changed
- `pm-*` judgment agents drop pinned `model:` to inherit the orchestrator model; `pm-pr-prep` stays `haiku`.
- `/pm-research` and `pm-stack-researcher` delegate search + adversarial verification to the built-in `deep-research` engine, keeping only their frame.
- `pm-coder` may load `wb-*` knowledge skills (codestyle, packaging, platform); WebSearch is tool-locked out.
- `pm-auditor` dimension 5 checks `docs/product.md` currency instead of the feature index.
- `pm-bootstrap` / `pm-plan` generate and maintain `docs/product.md`.
- `README.md` synced to v2.2.0 (product map, diagnostic-probe mode, mechanical route discipline, built-in delegation).

### Removed
- `docs/features/_index.md` (feature index) — replaced by the contract-centric `docs/product.md`.

### Migration (downstream projects)
- After `git submodule update --remote`, run the v2.2 migration: tell the agent **«мигрируй на v2.2»** (or re-run `/pm-bootstrap`, which detects it) — it generates `docs/product.md` from your existing contracts / plans / reviews and removes the orphaned `docs/features/_index.md`. One command, nothing else changes. See README § "Миграция на v2.2.0".
- The agent/skill guard now denies `wb-*` role agents — switch to the `pm-*` equivalents. `wb-*` knowledge skills are unaffected and encouraged.

---

## [2.1.7] — 2026-06-01

### Fixed

- `pm-auditor` халтурил, читая предыдущие аудиты как источник истины. Два корневых бага:
  1. Таблица contract-check перемещена на шаг 3 (до применения любых dimension), чтобы экстракция субъектов происходила до формирования выводов.
  2. Предыдущие аудит-файлы явно запрещены как источник доказательств. При загрузке контекста читается только дата последнего аудита, не содержимое. Добавлено hard rule.

---

## [2.1.6] — 2026-06-01

### Fixed

- `pm-auditor` всё ещё пропускал отсутствующие контракты — модель применяла суждение о категории фичи поверх правила извлечения субъекта. Таблица contract-check добавлена как обязательная секция в формат выходного файла: аудитор вынужден заполнить строку для каждой фичи до написания Blocking/Notes.

---

## [2.1.5] — 2026-06-01

### Fixed

- `pm-auditor` пропускал контракты для packaging-фич несмотря на правило из v2.1.2. Корень: «identify the role» — это суждение, которое модель переопределяла категорией фичи («packaging = infrastructure»). Заменено на обязательный шаг механического извлечения: аудитор выписывает подлежащее первого предложения каждого сценария ДО вынесения вердикта. Категория фичи при этом игнорируется.

---

## [2.1.4] — 2026-06-01

### Added

- После diff-аудита оркестратор явно сообщает что проверка была частичной и предлагает полный аудит через `AskUserQuestion`. Предотвращает ситуацию когда pre-existing пробелы (например, старые фичи без контрактов) остаются незамеченными.

---

## [2.1.3] — 2026-06-01

### Fixed

- `pm-audit` не триггерился на русскоязычные команды ("проверь проект", "аудит" и т.п.) — оркестратор делал ручную inline-проверку вместо вызова скилла. Добавлены русские триггеры и явный запрет на inline-проверки.

---

## [2.1.2] — 2026-06-01

### Fixed

- `pm-auditor` пропускал отсутствующие контракты у packaging/deployment фич — критерий «user-observable» интерпретировался как «видно в UI». Теперь аудитор явно выводит роль пользователя (end-user, integrator, operator) и use case из каждого сценария плана. Если роль называется → контракт обязателен.

---

## [2.1.1] — 2026-06-01

### Changed

- `docs/features/_index.md` — обогащён формат индекса: добавлены колонки `Planned`/`Done` (из git), `Review` и `Contract` (ссылки на артефакты). Авто-группировка по компонентам из `docs/architecture.md`. Процедура генерации вынесена в `pm-bootstrap.md` и переиспользуется из `pm-plan`. `pm-auditor` проверяет корректность ссылок и актуальность группировки.

---

## [2.1.0] — 2026-06-01

### Added

- `docs/features/_index.md` — автоматически поддерживаемый индекс фич. Статус выводится из артефактов: `done` (есть `.ai-pm/reviews/<topic>_review.md`), `active` (текущая задача), `planned` (план без ревью). Создаётся при `pm-bootstrap`, обновляется после каждого `/pm-plan` и при approve от `pm-plan-checker`. `pm-auditor` проверяет полноту и актуальность статусов в dimension 5.

---

## [2.0.2] — 2026-06-01

### Fixed

- Оркестратор мог выбрать неверный агент при spawn (например, `wb-development:code-reviewer` вместо `pm-auditor`) — все 4 командных файла дополнены dispatch-таблицами и явными `subagent_type` в каждой spawn-инструкции.
- Имена планов при ремедиации назывались `audit-fixup-<area>` вместо `<area>` — исправлено в `pm-audit.md`.

### Changed

- Собственные артефакты протокола перенесены из `docs/` в `.ai-pm/`; обновлён README.

---

## [2.0.1] — 2026-06-01

### Fixed

- Устранены 19 проблем по результатам полного ревью шаблона:
  - **Blocker:** `pm-bootstrap` ссылался на несуществующий `.claude/agents/docs-extractor.md` — legacy full mode падал при попытке spawn агента. Исправлено на `pm-legacy-reader.md`.
  - **Blocker:** hard rule в `pm-legacy-reader` запрещал запись в `.ai-pm/contracts/` — самопротиворечие с основными инструкциями агента. Правило расширено.
  - **Blocker:** greenfield и shallow bootstrap не создавали `.ai-pm/research/` и `.ai-pm/audits/` — `/pm-research` падал при первом запуске.
  - **Deadlock:** DoD item 8 требовал doc updates в ветке, но никто не был назначен их выполнять (pm-coder не трогает `docs/`). `pm-plan` и WORKFLOW теперь явно routing-ят doc updates: после pm-coder оркестратор spawning pm-architect (для `architecture.md`) или pm-legacy-reader (для `user-journeys.md`).
  - **Gap:** hotfix mode упоминался в WORKFLOW, но `pm-plan` ничего не знал о нём. Добавлена секция hotfix mode: topic `hotfix-<area>` требует раздел `## Incident facts` в плане; pm-plan-checker блокирует при его отсутствии.
  - **Naming sweep (13 мест):** `plan-feature` → `/pm-plan`, `reviewer` → `pm-plan-checker` / `code-review`, `docs-extractor` → `pm-legacy-reader`, `commands/fixup.md` → `commands/pm-fixup.md`, `Reviewer dim 1/2` → `pm-plan-checker`, `/bootstrap` → `/pm-bootstrap` во всех файлах включая шаблоны `contract.md.tmpl`, `stack-notes.md.tmpl`, `CLAUDE.md.tmpl`.
  - **Overcomplication:** таблица агентов WORKFLOW разделена на Agents (`.claude/agents/`) и Commands (`.claude/commands/`) — добавлены пропущенные `/pm-bootstrap` и `/pm-plan`; описание `/pm-audit` исправлено (scope решает оркестратор, а не PM).
  - **Overcomplication:** `pm-pr-prep` step 2 больше не блокирует на подтверждении при наличии других PR — информирует в отчёте.
  - **Overcomplication:** критерии Architect check в `pm-plan` стали domain-neutral (`new entity type` вместо `new device type`).

---

## [2.0.0] — 2026-06-01

### Breaking changes

- Все агенты и команды переименованы с префиксом `pm-`: `auditor` → `pm-auditor`, `reviewer` → `pm-plan-checker`, `coder` → `pm-coder`, `architect` → `pm-architect`, `stack-researcher` → `pm-stack-researcher`, `docs-extractor` → `pm-legacy-reader`, `pr-prep` → `pm-pr-prep`. Команды: `plan-feature` → `pm-plan`, `audit` → `pm-audit`, `bootstrap` → `pm-bootstrap`, `fixup` → `pm-fixup`, `research` → `pm-research`. Устраняет коллизии с другими тулсетами.
- `docs-extractor` переименован в `pm-legacy-reader` — отражает реальную роль (читает легаси-кодовую базу). Роль разделена: pm-legacy-reader пишет черновик `architecture.md`, pm-architect финализирует до канонического формата и владеет файлом.
- `plan-feature` переименован в `pm-plan` — команда планирует не только фичи, но и хотфиксы и рефакторы.
- Все операционные артефакты протокола перенесены из `docs/` в `.ai-pm/`: `docs/audits/` → `.ai-pm/audits/`, `docs/backlog.md` → `.ai-pm/backlog.md`, `docs/research.md` → `.ai-pm/research/`, `docs/features/*_review.md` → `.ai-pm/reviews/`, `docs/features/*_arch.md` → `.ai-pm/arch/`. `docs/` теперь содержит только документацию проекта: `architecture.md`, `stack-notes.md`, `user-journeys.md`, `features/*_plan.md`.

### Changed

- **Аудит переработан** — из 9-мерного технического code review в 5-мерную проверку соответствия протоколу: артефакты есть (план, ревью, контракт)? план совпадает с реализацией? реализация покрыта планом? контракты актуальны? docs свежи? Технический код-ревью — работа pm-plan-checker + встроенного `code-review` per feature.
- **`pm-plan-checker`** (бывший `reviewer`) урезан до единственной ответственности — соответствие плану: сценарии реализованы, контракт соблюдён, interaction scenarios покрыты тестами, DoD выполнен. Технические dims 2–9 убраны — их делает встроенный `code-review` skill.
- **Review loop** перестроен: два последовательных прохода полностью скрыты от PM. Pass 1 — pm-plan-checker (plan compliance), замечания → pm-coder → повтор. Pass 2 — `code-review` (technical quality), оркестратор записывает findings в `.ai-pm/reviews/<topic>_review.md`, pm-coder читает и правит → повтор. PM слышит только финальное "готово" + product notes.
- **`pm-audit`** автоматически выбирает scope (diff/full) по дате последнего аудита и количеству фич — PM не выбирает параметры. При full scope предлагает запустить `code-review ultra` — PM решает. Pre-protocol-migration артефакты группируются в одно finding, принимаются массово.
- **`pm-plan`** добавил обязательный раздел **Interaction scenarios**: фичи с разделяемым состоянием, async-операциями или внешним I/O обязаны описать конкурентные и постусловные сценарии и покрыть их тестами. pm-plan-checker блокирует при отсутствии. Триггеры универсальные (не привязаны к конкретному стеку).
- **Retrospective check** в `pm-plan` теперь считает фичи с последнего аудита и предлагает `/pm-audit` — вместо подсчёта фич с последнего обновления `architecture.md`.
- **pm-architect (Section A)** — явное разделение greenfield vs legacy finalization режимов. В legacy режиме черновик pm-legacy-reader является источником правды о фактах; pm-architect не изобретает, не перезаписывает, ставит `[?]` там где нет данных без кода.

### Added

- **Interaction scenarios** — новый обязательный раздел плана для фич с разделяемым состоянием. Включает тесты конкурентных сценариев в test plan. pm-plan-checker и pm-auditor проверяют наличие.

---

## [1.13.0] — 2026-05-31

### Added

- `.claude/commands/plan-feature.md` — new "Before every PM question — product vs technical check" block before AskUserQuestion. Surfaces the WORKFLOW.md notes-routing rule (product = PM decides, technical = orchestrator decides) into plan-feature's clarifying-question loop. Product trade-offs (user-visible alternatives, scope, deferral) surface to PM; technical details (file layout, naming, library specifics, unit file shape) the orchestrator decides and documents in Key design decisions. Concrete re-framing example: "PM chooses between systemd / Docker / k8s" → wrong question; "integrator experience: single canonical install or component-by-component setup?" → right question. Closes a real recurring pattern observed in the downstream `audit-fixup-confed-schema-delivery` cycle. (9d71a0d)

### Notes

- Shipped via `/fixup` fast path (+7 LOC, edit-only, no stack-notes touch, no new source file — all four conditions met). Trivial-mode review trail at `doc/features/fixup-plan-feature-product-vs-technical_review.md`: approve, DoD pass, no notes. (612f7f8)

---

## [1.12.0] — 2026-05-30

### Added

- `.claude/commands/fixup.md` — new `/fixup` slash-command: fast path for changes meeting all four conditions (≤50 LOC, no user-visible behavior change, no stack-notes touch, no new source file). Skips `plan-feature`; coder runs with compact prompt; reviewer runs in `--mode=trivial`. Mutually exclusive with `/plan-feature` on a single PR. Third of four optimizations in `optimize-without-losing-rigor` plan. (d563b02)
- `reviewer` agent — new `--mode=trivial`: re-validates the four `/fixup` conditions against the actual diff (only escape hatch), applies trivial DoD (scope + pipeline + docs), skips all other dimensions, writes a short verdict file at `docs/features/fixup-<topic>_review.md`. No Notes — if it is worth noting, it is not trivial. (d563b02)
- `auditor` agent — new `--scope=diff` mode for routine in-progress audits: reads only files changed since the most recent `docs/audit-*.md` plus their direct cross-references (imports / requires / file paths). Output filename unchanged; heading prefixed with `(diff scope)`. Full sweep remains default and is explicitly recommended quarterly. (310695d)
- `/audit` command — exposes `scope` parameter and routes the choice to the auditor. (310695d)
- `WORKFLOW.md` — new "What is mandatory when" decision matrix: 4-row table (User-facing feature / Backend / Docs-only / Trivial) collapsing scattered conditions from `coder.md`, `reviewer.md`, and `plan-feature.md` into one reference. Each row specifies state required, contract required, DoD scope, stack expectations. Introduces the "Skip with one-line reason" convention: `Skips Product Contract: <reason>` in commit message; reviewer accepts when present, blocks when absent on a backend change. Second of four optimizations. (e441949)

### Changed

- `reviewer` and `auditor` agents — 11 dimensions merged into 8 without coverage loss. Three overlapping pairs collapsed: dim 1 (Plan compliance + Plan completeness + Categorical coverage) + dim 11 (Product Contract compliance) → new dim 1 "Plan & Contract compliance"; dim 3 (Security) + dim 4 (Stability) → new dim 3 "Correctness (security + stability)" — same defect class, two reading modes (attacker / operator-on-call); dim 8 (Docs vs code) + dim 10 (Stack expectations) → new dim 7 "Documentation and canon compliance" — both compare code against a documented source of truth. Renumbered to 1..8. All defect classes still caught; only the heading collapses. DoD checklist in reviewer unchanged (items reference behavioral checks, not dimension numbers). Cross-references in `coder.md` / `auditor.md` updated to new dim numbers and full names. First of four optimizations. (d09ac14)
- `README.md` — flow diagram updated: "11 измерениям" → "8 измерениям". Three stale `dim 11` references at lines 108 and 122 updated to `dim 1 (Plan & Contract compliance)`. (d09ac14, b176c1c)
- `doc/architecture.md` — `dimension 11` reference at line 78 updated to `dimension 1`. File layout updated: "Four slash-commands" → "Five (adding fixup)". New "Architectural decisions" entry for the four optimizations (dim merge + matrix + fixup + audit scope) citing all four feature commits and the plan path. (b176c1c, 44a180d)
- `WORKFLOW.md` — agent table extended with `/fixup` and `/audit` (with scope explanation) rows; decision matrix backend row typo fixed: "items 1, 2, 4, 6, 7" → "1, 2, 4, 5, 7" (item 6 is Product Impact Report which is N/A for backend; item 5 is state updated which IS required). (b176c1c, d563b02, 310695d)
- `doc/_templates/contract.md.tmpl` — stale `dimension 11` reference updated to `dimension 1`. Template that downstream projects copy, so this matters more than a cosmetic doc fix. (87070d9, 362bc99)

### Notes

- Four orthogonal optimizations shipped as one PR per PM directive: reviewer/auditor 11 → 8 dimensions, decision matrix in WORKFLOW.md, `/fixup` fast path, auditor `--scope=diff` mode. No gate removed. Every defect class previously caught is still caught; only the form changes. Categorical scope: chose text consolidation + new fast path + new parameter; siblings (gate removal, modes redesign, content migration) explicitly Out of scope. Plan + review trail in `doc/features/optimize-without-losing-rigor_plan.md`. Review v1 surfaced three stale dim-11 references + matrix typo + missing architecture decisions entry; fix-pass closed all (b176c1c, 44a180d). Review v2 approved with one trivial note (contract.md.tmpl dim-11), also fixed (87070d9, 362bc99). Reviewer ran the new 8-dim form on itself during review v1 — dogfooding held.

---

## [1.11.0] — 2026-05-30

### Changed

- `README.md` — three inline blockquote cross-references added to sections "Как это работает", "Какие риски шаблон снижает", "Что остаётся за PM". Each cross-ref points to `WORKFLOW.md` as the canonical orchestration spec (rules detail / PM communication reference). No content migration; the README stays a Russian marketing/quickstart overview. (7f180c6)
- `WORKFLOW.md` — one-line header note above "Workflow agents" declaring it the canonical orchestration spec read by agents and downstream `CLAUDE.md` via `@.ai-pm/tooling/WORKFLOW.md`, with `README.md` as the friendlier Russian overview. Tie-breaker rule made explicit: when the two documents disagree, `WORKFLOW.md` wins. (7f180c6)

### Notes

- Closes task #24 (audit-fixup-readme-workflow-split). Drift between README and WORKFLOW now surfaces at review time because the cross-references are explicit. Plan + review trail in `doc/features/readme-workflow-split_plan.md` and the review-trail commit (8dbe74e, 42c60e9).

---

## [1.10.1] — 2026-05-30

### Fixed

- `CHANGELOG.md` — backfilled missing `## [1.6.0]` entry for the orphan tag (released without a CHANGELOG entry or GitHub Release at the time) and added a `## [1.6.0 → 1.7.0 intermediate work]` aggregate block for PRs #142–#145 that landed on `main` between the two tags without their own intermediate version tags. v1.6.0 entry covers 9 commits (Added / Fixed / Changed split per actual ranges from `git log v1.5.1..v1.6.0`). No existing entry mutated. Closes task #26 (audit-fixup-changelog-backfill). Plan + review trail (v1 request-changes → v2 approve after attribution fix) in `doc/features/changelog-backfill_plan.md`, `doc/features/changelog-backfill_review.md`, `doc/features/changelog-backfill_review.v2.md`. (aecf82f, 8f5eddf, e85e82d)

### Notes

- Surfaced by `pr-prep` on PR #146. GitHub Release for v1.6.0 not backfilled retroactively — out of scope; release notes live in CHANGELOG.

---

## [1.10.0] — 2026-05-30

### Added

- `architect` agent — second responsibility: owns canonical `docs/architecture.md` (in template: `doc/architecture.md`) in addition to existing per-feature arch notes. New Section A workflow: read `docs/stack-notes.md` + `CLAUDE.md` + architecture.md template, walk every template section (mark N/A with one-line reason), cite every decision (commit SHA / PR / doc / bootstrap conversation), cross-check file layout / release flow / integration contract against repo state, then write. Section B (per-feature arch notes) unchanged. Allowed writes tightened to `docs/architecture.md` and `docs/features/<topic>_arch.md` only. (e0fc4c9)
- `bootstrap` command (greenfield) — spawns `architect` Section A after `stack-researcher` returns, instead of orchestrator writing `docs/architecture.md` inline. The architect now owns the file end-to-end on the greenfield path. (e0fc4c9)
- `WORKFLOW.md` — agent table row for `architect` extended to mention canonical `docs/architecture.md` ownership alongside per-feature structural review. (e0fc4c9)
- `doc/backlog.md` — new file for observations recorded during reviews/audits. First entry: bootstrap full-mode (legacy adoption path) still has orchestrator writing `docs/architecture.md` inline after docs-extractor — greenfield/legacy asymmetry to reconcile in a future plan. (0f88a49)

### Notes

- Closes task #27 (template gap: architecture.md ownership, surfaced in meta-audit). Removes the workaround language used in `audit-fixup-self-docs-architecture` where orchestrator invoked architect with an extended prompt. Plan + review trail in `doc/features/architect-owns-architecture-md_plan.md` and `doc/features/architect-owns-architecture-md_review.md`. (c28d5fa, 0f88a49)

---

## [1.9.0] — 2026-05-30

### Added

- `doc/_templates/state.md.tmpl` — Execution State Protocol artefact: Status (idle | in-progress | blocked) / Done / Remaining / Touched files / Next step / Validation. Single source of truth for the active task; overwritten as progress lands, archived on completion. Agent step 1 reads it; agent step last updates it. (b599700)
- `doc/_templates/contract.md.tmpl` — Product Contract artefact (one per user-facing feature): User value / Who uses it / Must work / Must not break / Acceptance checks / Out of scope / Last reviewed. Backend-only changes don't need a contract; user-facing features must have one. (b599700)
- `coder` agent: reads `.ai-pm/state/current.md` as step 1; reads Product Contract for touched user-facing features as step 4; updates state at end (step 9); new Product Impact Report section in the closing report when contracts are touched. (49d83c1)
- `reviewer` agent: new dimension 11 'Product Contract compliance' — silent behavior change blocks merge; missing contract for touched user-facing feature blocks; failing Acceptance check blocks. New 'Definition of Done' section in verdict format with 7 explicit checks; pass requires all checked, fail requires request-changes regardless of Blocking count. (49d83c1)
- `auditor` agent: load context now includes `.ai-pm/contracts/` and `.ai-pm/state/current.md`; new dimension 11 'Product Contract integrity' mirrors reviewer dim 11 project-wide — missing contracts, stale contracts, drift between contract and code, phantom Acceptance checks. (49d83c1)
- `docs-extractor` agent: legacy bootstrap full mode now drafts initial Product Contracts from discovered journeys, mapped one-to-one. Drafts marked '(extracted from legacy — needs PM validation)' on Last reviewed. Cap of 8 contracts per extraction; remaining journeys surfaced as 'Pending contracts'. (49d83c1, d60612a)
- `bootstrap` command (greenfield, legacy-shallow, legacy-full): creates `.ai-pm/state/current.md` from `state.md.tmpl` with Status: idle, plus `.ai-pm/state/archive/` and `.ai-pm/contracts/` directories. Surfaces draft contract count in the PM brief. (18dc48c)
- `plan-feature` command: reads `.ai-pm/state/current.md` first (warns PM if active task exists); reads `.ai-pm/contracts/` in read-list. After plan approval: initialises Execution State; runs Product Contract check (asks PM one product question — drafts contract from plan Scenarios + Existing behaviors + Test plan if user-facing, notes 'no contract' if backend-only). Names explicit template path `.ai-pm/tooling/doc/_templates/contract.md.tmpl`. (18dc48c, d60612a)
- `WORKFLOW.md` — new 'How state is kept' section between release and prod-incident: `.ai-pm/state/current.md` as resume-from-pause artefact; `.ai-pm/contracts/` as user-facing feature contracts; PM read-only on both. New 'Three channels surface to PM, not one' subsection: Coder's Product Impact Report, Reviewer's product Notes, Reviewer's DoD line. The DoD rule (pass with unchecked box is contradiction) lives here. (1803b4c, d60612a)
- `doc/architecture.md` — three new architectural decisions cited from the integrate-consultancy plan: Execution State as single source of progress, Product Contracts as product-side complement to stack-notes, Definition of Done as explicit reviewer subsection. File layout updated with `state.md.tmpl` + `contract.md.tmpl` and a note about downstream `.ai-pm/state/` and `.ai-pm/contracts/` created at bootstrap. (1803b4c)

### Changed

- `README.md` — 'Что гарантирует' renamed to 'Что снижает риск'; guarantees reworded from absolutes (гарантирует) to risk reductions (реже). Three new entries: state persistence (context loss reduced), silent behavior change (Product Impact Report + dim 11), Definition of Done (objective 'done'). Section header grammar fixed; flow diagram updated with contract-draft step between plan approval and architect; reviewer dimension count 10 → 11; DoD pass | fail line added. (1803b4c, d60612a)
- `.gitignore` — dropped v0.x leftovers: `.bootstrap-state.local.md` (bootstrap state machine removed in v1.0.0 template-v2 rewrite); AP-16 local-trace mode (AP-N anti-patterns system removed in same rewrite); `.ai-pm/.reviews/release-*.json` exception (release-PR tracing model retired with auto-tag workflow). What remains: editor swp files, `.DS_Store`, `.reviews/`, Claude Code worktree scratch dir. Closes audit-fixup #23 in-line. (3f96a2b)
- `architect` agent — `design-review` reference (planned but never shipped in template-v2) rewritten as 'architecture review'. (3f96a2b)

### Notes

- Integrates external consultancy parts 1, 2, 7, 10. Rejects part 3 (modes-vs-agents, conflicts with subagent isolation), part 4 (strict One Logical Step, kept as guidance), part 6 (additional doc fragmentation). Plan and review trail in `doc/features/integrate-consultancy_plan.md`, `doc/features/integrate-consultancy_review.md`, `doc/features/integrate-consultancy_review.v2.md`. (277a90b, e7f0d9b)

---

## [1.8.1] — 2026-05-30

### Fixed

- `.claude/settings.json` hook regexes: ssh content-edit and ssh mutating-action gates now match the quoted form (`ssh host "sed -i ..."`, `ssh host 'rm /etc/foo'`, `ssh host "systemctl restart x"`), closing blocking #3 of `doc/features/audit-2026-05-30.md`; find boundary gate now blocks bare-root `find / -name x` / `find / -type f`, closing blocking #4. (7012c4d)

### Added

- `tests/hooks.sh` — 44 POSIX-shell unit cases over all 5 PreToolUse hooks (Read boundary, find boundary, ssh content-edit, ssh mutating, git force-push, git no-verify), with positive (deny/ask) and negative (pass) coverage and full `hookSpecificOutput` shape assertion (`hookEventName`, `permissionDecision`, `permissionDecisionReason`) on every positive case. (b3cca9c, 28e763c)
- `.github/workflows/lint-hooks.yml` — CI gate runs `tests/hooks.sh` on every PR/push that touches `.claude/settings.json`, `tests/hooks.sh`, or the workflow itself; failing tests block merge. Closes note #6 of `doc/features/audit-2026-05-30.md`. (dfac399)

### Changed

- `doc/architecture.md` — `tests/` directory and `.github/workflows/lint-hooks.yml` added to File layout; "no automated tests by design" constraint refined: tests on meta-infrastructure (hook regexes) are allowed, runtime/feature tests still are not. (6dd28dd)
- `WORKFLOW.md` — Hook-level enforcement section notes the new test-gate so PM sees rules are now verified, not only declared. (6dd28dd)

---

## [1.8.0] — 2026-05-30

### Added

- `doc/architecture.md` for the template itself: 7 in-scope sections (Project, Tech stack pointer into `doc/stack-notes.md`, 9 architectural decisions each citing commit SHA / PR / doc path, constraints, file layout, integration contract, release flow) + 5 explicit N/A sections (Security, Code conventions, Deploy, Database, UI) — every line of the template's own `architecture.md.tmpl` walked through. Closes finding #1 of `doc/features/audit-2026-05-30.md`. Second of 7 self-* audit-fixup plans in meta-audit priority order. (7bb6e05)

---

## [1.7.0] — 2026-05-30

### Added

- `doc/stack-notes.md` for 6 self-* components (architect, planner, coder, reviewer, pr-prep, auditor): documents the protocol's own stack — markdown spec, agent persona conventions, hook scripts, install layout. Closes finding #2 of `doc/features/audit-2026-05-30.md`. First of 7 self-* audit-fixup plans in meta-audit priority order. (4f71ab0)

---

## [1.6.0] — 2026-05-29

### Added

- Require `AskUserQuestion` tool for all PM decisions; plain-text questions no longer allowed in the orchestrator dialog (b94b1d2)
- Pre-PR checkpoint — ask PM how to proceed after approve (manual testing / open PR test before merge / ship now) (c86fb00)
- After-deploy checklist for option A — give PM short list of what to verify (7b1a05f)

### Fixed

- PM reports findings after testing, no longer forced to say 'ready' (bf84440)
- Deploy in option A follows `docs/architecture.md` deploy section (596939f)
- Offer deployment help in manual-testing option A (b642b4c)
- Pre-PR checkpoint wording made generic — any project, not hardware-specific (1352ed7)
- `architect` agent — do not search filesystem for external reference projects (#140, 14dcd0d)

### Changed

- Install instructions: explicit `settings.json` symlink line added (#141, 2626106)

### Note

This release was tagged at the time but never had a CHANGELOG entry or
GitHub Release published. Backfilled in v1.10.1 — see audit-fixup-changelog-backfill plan.

---

## [1.6.0 → 1.7.0 intermediate work] — 2026-05-29 to 2026-05-30

The following PRs landed on `main` between the `v1.6.0` tag and the
`v1.7.0` release without their own intermediate version tags. Their
changes are part of the v1.7.0 baseline; recorded here for traceability.

- Protocol integrity + stack literacy — close 5 structural gaps (#142, 6e1bf14)
- /audit spawns auditor subagent instead of reading in main (#143, cf889c6)
- Post-cycle lessons: notes split, edit ownership, pr-prep flexibility (#144, 9f81f64)
- Hook-level enforcement: ssh-edit boundary + force-push + no-verify (#145, ac5827a)

---

## [1.5.1] — 2026-05-29

### Fixed

- Enforce project root boundary in all agents: hard rule prevents navigation above git toplevel, architect establishes boundary before any file search (d72da4e)

---

## [1.5.0] — 2026-05-29

### Added

- Bootstrap docs-extractor subagent: dedicated agent for deep legacy codebase reading, extracts patterns and conventions before bootstrap planning (14726cf)

---

## [1.4.1] — 2026-05-29

### Fixed

- Bootstrap full-mode gaps: self-resolve doubts without PM escalation, add coverage checklist (forms, DB procedures, exports, backups, settings screens), inline optional docs list for legacy bootstrap (13a01e0)

---

## [1.4.0] — 2026-05-29

### Added

- Two-tier findings and backlog mechanism: structured backlog for findings with PM approval gate to promote items to the main queue (6dd6c42)

---

## [1.3.0] — 2026-05-29

### Added

- Structured reviewer dimensions: distilled 8 review dimensions (security, stability, test coverage, regressions, conventions, simplification, docs drift, infrastructure) with severity levels and explicit "what NOT to flag" rules (5645844)
- Audit command: new optional /audit command for full-project health check using same review dimensions, generates PM-facing report in docs/audit-<date>.md (5645844)

---

## [1.2.0] — 2026-05-29

### Added

- Legacy bootstrap modes for agents and compatibility: two-mode bootstrap procedure, documentation gap handling, porting guidelines (8510e35)

### Fixed

- Release workflow: checks for GitHub Release existence instead of git tag (c240181)
- Release workflow: merge auto-tag and create-github-release into single workflow (ad3d30f)

---

## [1.1.0] — 2026-05-29

### Added

- Set model per agent: haiku for pr-prep/release-helper, sonnet for coder/reviewer/architect (870679a)

### Fixed

- Release workflow: release-helper runs on feature branch, auto-tag on merge to main (5bb8e24)
- Release-helper: remove confirmation gate before commit, report after execution (2ffb6ef)
- Pr-prep: no confirmation gate, execute and report PR URL to orchestrator (ac809b8)

---

## [1.0.7] — 2026-05-29

### Added

- auto-open release PR workflow on branch push — no gh CLI needed locally (eca5b45)

### Fixed

- 9 protocol gaps: bootstrap detection, coder frontmatter, research output path, reviewer cycle, architect trigger, bugfix branch naming, --no-verify in bootstrap, retrospective artifact, submodule command placement (6f74a4d)
- git workflow gaps: atomic commits, feature/fix branch naming, manual release steps (34414c0)

### Changed

- release model: tag main directly instead of release/vX.Y.Z branch + PR ceremony (ba5f613)
- WORKFLOW.md: full reviewer verdict cycle + Maintenance section for submodule update (6f74a4d)

---

## [1.0.6] — 2026-05-28

### Added

- Split CLAUDE.md into static project part + dynamic WORKFLOW.md — separates project config from orchestration workflow (dec55b4)

### Fixed

- orchestration flow: show PM what was built at each step (234cfe2)
- reviewer: checks hardcoded config values and missing infrastructure (acdee68)


## [1.0.5] — 2026-05-28

### Fixed

- coder: must not create directories outside project root — no /tmp/probe dirs. Library API research via WebSearch or project node_modules/ (88449ea)


## [1.0.4] — 2026-05-28

### Fixed

- research command: output path — feature research beside plan in `docs/features/<topic>_research.md`, project-level research in `docs/research.md` (2558671)


## [1.0.3] — 2026-05-28

### Added

- `/research` command: WebSearch-based analysis of existing solutions and analogues. PM-readable output with pros/cons/fit. Saves to `docs/research/<topic>_research.md`. (bc93ba6)
- bootstrap: asks PM about research at project start
- plan-feature: suggests research when feature area might benefit from existing libraries

### Fixed

- architect: reverted WebSearch (wrong place); scope strictly current repo only (1403b92)


## [1.0.2] — 2026-05-28

### Fixed

- Renamed architect agent output from `_design.md` to `_arch.md` — consistent with agent name, no confusion with UI/UX design artifacts (df2935b)

---

## [1.0.1] — 2026-05-28

### Fixed

- CLAUDE.md.tmpl: added explicit "Workflow agents" table so orchestrator uses template agents instead of similarly-named agents from other toolsets (5d9254d)

---

## [1.0.0] — 2026-05-28

### Breaking Changes

- **Full template rewrite (v2).** Downstream projects using v0.x cannot adopt v1.0.0 without a full re-bootstrap. Removed: development-protocol.md, bootstrap state machine (stages A-D), AP-1..AP-33 checklist, domain-*.md files, spec.md format with frontmatter, all bootstrap agents (greenfield/legacy/resume/template-sync), planner agent, shell scripts, regression test cases, review trail mechanism — 120+ files, ~22 000 lines. (#121)

### Added

- CLAUDE.md.tmpl as primary orchestration artifact — contains PM communication protocol, orchestration logic, and project context (#121)
- `architect` agent — optional structural pass between planning and coding (#121)
- `pr-prep` agent — squash and PR creation (#121)
- `/bootstrap` command — project initialization with hook detection, no-code state handling, platform UI vs custom UI distinction (#121, c800851, 4f1e0b9, c0225cd)
- `/plan-feature` command — interactive planning with PM, stale doc detection, retrospective trigger (#121)
- Templates: `README.md.tmpl`, `architecture.md.tmpl`, `ui-guide.md.tmpl`, `user-journeys.md.tmpl`, `threat-model.md.tmpl` (#121)
- PM communication protocol in CLAUDE.md.tmpl — plain language rules for all agents (#121)
- Architectural retrospective trigger in plan-feature — suggested every 5 features (#121)
- Company/team standards support in architecture.md.tmpl and bootstrap (#121)

### Changed

- `coder.md` rewritten — compact, declarative, reads CLAUDE.md for pipeline and conventions (#121)
- `reviewer.md` rewritten — broad mandate, test quality check (verifies tests encode scenarios from plan), security adversarial thinking (#121)
- `release-helper.md` rewritten — removed all v0.x references (#121)
