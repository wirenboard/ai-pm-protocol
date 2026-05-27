---
status: maintained
artifact: template-evolution-cheatsheet
audience: AI agent driving template-sync для downstream продукта
---

# Template evolution cheat sheet

**Назначение:** навигационная карта для agent'а, выполняющего `template-sync` в downstream продукте. Per-version резюме breaking changes / fold'ов / split'ов / renames. **Не дублирует** CHANGELOG.md — указывает куда смотреть и что искать.

**Как использовать (agent):**
1. Прочитай `.ai-pm/.bootstrap-state.md` → `template_version_applied` (pinned)
2. Прочитай ниже секции **после** pinned версии до target (HEAD main)
3. Для каждой версии — детали в `CHANGELOG.md` (ссылки в каждой секции)
4. Применяй inspection-before-regenerate discipline (не blindly копируй scripts/templates — могут быть silent break'и)

---

## v0.2.0 (2026-05-25)

**Renames в product:**
- `Mode 1` / `Mode 2` / `Mode 3` → `new-product` / `feature` / `rework` (named modes во всех doc / CLAUDE.md / state)
- `new-feature` / `rework-feature` aliases → `feature` / `rework`

**State schema additions:**
- (none критичных — additions в Phase 3 docs only)

**Spec frontmatter additions** в `_templates/feature-spec.md.tmpl`:
- 7 impact полей: `legal_impact`, `validation_required`, `incident_impact`, `journey_impact`, `threat_impact`, `scope_impact`, `topology_impact`
- Plus `topic`, `mode`, `lite-mode`, `created`, `spec_approved`, `plan_approved`, `acceptance`, `merged`, `review_url`, `pr_ordering`, `template_version_applied`

**Sections additions** в spec:
- `## Regression coverage plan` (обязательно при `topology_impact: yes`)

**New AP:**
- AP-23 (test assertion weakened без declared change) — `[test-modify-override:]` marker
- AP-24 (architectural decisions buried in spec без ADR) — auto-extraction CI check

**Removed:** ничего

**Подробнее:** CHANGELOG.md § 0.2.0

---

## v0.3.0 (2026-05-25)

**Stage structure:** 6 → 5 stages. Stage C («Solution shape» — topology + foundational ADRs) **упразднён**, content fold в Stage D `tech-stack.md` § 2.

**4 same-axis merges:**
- `competitive-analysis.md` → `positioning.md` § 1
- `brand-voice.md` → `ui-style-guide-base.md` § 2
- `dependency-policy.md` + `refactor-playbook.md` → `maintenance-playbook.md` (Part A + Part B)
- `legal-frame.md` + `legal-brief.md` → `legal.md` (§ 1 + § 2)

**Renames:**
- `topology.md` → `tech-stack.md § 2` (cross-refs обновить)

**New artifacts:**
- `tech-stack.md.tmpl` (umbrella — stack + topology + db + deployment)
- `maintenance-playbook.md.tmpl` (umbrella — dep policy + refactor)
- `legal.md.tmpl` (umbrella — legal-frame + legal-brief)
- `bootstrap-verify.sh.tmpl` (Stage E health-check)

**Stage E checkpoint reduction:** 12 granular checkboxes → 1 (`bootstrap-verify.sh passed`)

**Lazy loading** в Stage F subagents — read minimum baseline + conditional per impact flags

**Подробнее:** CHANGELOG.md § 0.3.0

---

## v0.4.0 (2026-05-25)

**MINOR-additive, no breaking changes.**

**State schema additions** в `.ai-pm/.bootstrap-state.md` frontmatter:
- `advisor_preset: full | standard | minimal` (default `full`)
- `skip_decisions: []`
- `advisor_log: []`

**New subagent:** `discipline-advisor.md` (read-only 5-axis quality challenger) — **DEPRECATED / retired в v0.7.0** (agent-consolidation feature): hard floor functionality перенесена в `scripts/check-security-floor.sh`, reprompt — в `scripts/check-skip-reprompts.sh`, soft 5-axis recommendations dropped as never-validated (accuracy gate ≥80% per axis никогда не measured).

**`skip_eligibility` metadata** в 31 templates (`default` / `skip_if` / `hard_floor`)

**Sensible defaults preserve existing behavior** — no migration mandatory.

**Подробнее:** CHANGELOG.md § 0.4.0

---

## v0.5.0 (2026-05-25)

**PATCH (docs only).** README + personas + user-journeys refresh. Никаких template content / agent / script changes.

**Per-product impact:** минимальный — bump submodule, version pin → `v0.5.0`. Никаких rewrites.

**Подробнее:** CHANGELOG.md § 0.5.0

---

## Post-v0.5 (unreleased, в main HEAD — будет v0.6 при release)

### Stage rename (PR #44)

**Continuous A-E** (Stage F больше не существует):
- Old C («Solution shape») + Old D («Process») → New C («Process»)
- Old E («Bootstrap») → New D
- Old F («Production») → New E

**Action:** rewrite Stage references во всех doc / CLAUDE.md / state. Grep `\bStage F\b` → должно быть пусто.

### meta/ removal (PR #46)

Template убрал `meta/` целиком (был sandbox для audits / reviews / design / experiments / research). Product's `meta/` — **не** трогается (operator's материал).

**Action:** очистить refs на `meta/audits/` / `meta/reviews/` / `meta/design/` / `meta/experiments/` в product doc (если были).

### README compression + advisor-driven skip flow (PR #47)

Документация template'а сжата на ~30%. Новый § «Skip ненужного шага — advisor-driven flow» (advisor → AskUserQuestion → skip_decisions). Override markers ('[review-override:]' / '[skip-review]') framed как secondary mechanism.

**Per-product impact:** нет direct'ного (только template's README).

### AP-16 enforcement → pre-push + CI (PR #48)

**Breaking change в Layer 2 vs Layer 4/5:**

| Old (v0.1-v0.5) | New (post-v0.5) |
|---|---|
| `scripts/check-pr-has-review.sh` (PreToolUse Bash hook, перехватывал `gh pr create`/`gh pr merge`) | **Удалён** |
| Layer 2 enforcement | Layer 4 git pre-push hook + Layer 5 CI workflow |

**New files в template:**
- `_templates/scripts/check-review-trail.sh.tmpl` (argv interface, не Claude Code hook)
- `_templates/.github/workflows/check-review-trail.yml.tmpl` (CI gate)
- Pre-push hook block в `_templates/scripts/install-git-hooks.sh.tmpl` (расширен beyond just main/master block)

**Action в product:**
- Удалить `scripts/check-pr-has-review.sh` (если был)
- Регенерировать `scripts/install-git-hooks.sh` из template (получит расширенный pre-push)
- Скопировать `_templates/scripts/check-review-trail.sh.tmpl` → `scripts/check-review-trail.sh`
- Скопировать `_templates/.github/workflows/check-review-trail.yml.tmpl` → `.github/workflows/check-review-trail.yml`
- Убрать из `.claude/settings.json` PreToolUse Bash hook на `check-pr-has-review.sh` (оставить только `check-git-safety.sh`)
- Запустить `scripts/install-git-hooks.sh` (переустановит pre-push hook с review-trail check)

### Hook scripts JSON stdin fix (PR #50, closes #49)

**Bug fix — silent enforcement break.** 3 hook scripts читали несуществующие env vars `CLAUDE_TOOL_PARAM_*` вместо JSON stdin (Claude Code hook API). Layer 2 защиты не было.

**Затронуто:**
- `_templates/scripts/check-spec-precondition.sh.tmpl`
- `_templates/scripts/check-git-safety.sh.tmpl`
- `_templates/scripts/update-bootstrap-state.sh.tmpl`

**Action в product:**
- Регенерировать эти 3 скрипта из template (теперь корректные)
- При наличии в product custom-написанных версий с JSON stdin parsing — оставить (они уже корректные)
- **Inspection-before-regenerate discipline:** перед regen — сравни новый .tmpl со старым в product. Если product использует JSON stdin + jq pattern (правильный) — keep. Если env vars (broken) — regenerate.

---

## v0.7.0 (unreleased, в main HEAD — будет v0.7 при release) — `agent-consolidation`

**Agent count reduction 11 → 5.** MINOR-additive (no schema breaks; legacy review trail values accepted backward-compat).

**Deleted agent files** (6):
- `.claude/agents/protocol-compliance-reviewer.md`
- `.claude/agents/backend-reviewer.md`
- `.claude/agents/frontend-reviewer.md`
- `.claude/agents/design-reviewer.md`
- `.claude/agents/database-reviewer.md`
- `.claude/agents/discipline-advisor.md`

**Consolidated в `.claude/agents/reviewer.md`** как inline sections:
- «## Mandatory baseline» (always applied; was protocol-compliance-reviewer)
- «### Backend domain» / «### Frontend domain» / «### Design domain» / «### Database domain» (applied per detected PR scope; was 4 specialized reviewer files)

**Reviewer behavior change:** sequentially applies relevant sections inline (no nested spawn). Output frontmatter: `agent_type: inline-sections` + `applied_sections: [mandatory-baseline, <domain>]`. Legacy `agent_type: specialized-reviewer` / `general-purpose-with-role-spec` / `inline-roleplay` values accepted в existing committed `_review.md` files (backward-compat).

**Discipline-advisor retired:** functionality перенесена в deterministic scripts:
- Hard floor → `scripts/check-security-floor.sh` (была уже в v0.6.0)
- Skip reprompt → `scripts/check-skip-reprompts.sh` (была уже в v0.6.0)
- Soft 5-axis recommendations — dropped (never validated через required PoC accuracy gate ≥80% per axis)

**State schema:** `advisor_preset:` / `advisor_log:` поля сохранены, marked DEPRECATED в template. Existing values принимаются без break'а; agents игнорируют. `skip_decisions:` остаётся authoritative — works через scripts.

**Action в product (template-sync):**
- Удалить product-side `.claude/agents/{protocol-compliance,backend,frontend,design,database}-reviewer.md` и `discipline-advisor.md` (если эти файлы были скопированы из template)
- Регенерировать `.claude/agents/reviewer.md` из template (содержит inline sections)
- Регенерировать `CLAUDE.md` из template (subagents list 9 → 5 entries)
- Updated cross-refs: `feature-review.md.tmpl` / `maintenance-playbook.md.tmpl` / `tech-stack.md.tmpl` / `database-design-base.md.tmpl` / scripts comments
- Bootstrap-state.md.tmpl — `advisor_preset:` / `advisor_log:` marked DEPRECATED, можно оставить existing values

**Подробнее:** CHANGELOG.md § Unreleased / 0.7.0.

### v0.7.0 follow-ups — prompt-economy wave (PR #63/#65/#67/#68/#69/#72)

**Прыжок токенов вниз без потери дисциплины.** MINOR-additive (file moves + new agents files; legacy paths backward-compat через cross-refs).

**Что изменилось:**

- **`doc/anti-patterns.md`** (962 LOC monolith) → **`doc/anti-patterns/AP-NN.md` per-file** (PR #68). Master file → index с table-of-contents. Cross-refs `AP-NN` работают через текст, не path. AP-NN file structure: frontmatter (id / status / severity / domain), unified шаблон.
- **`.claude/agents/project-bootstrap.md`** (733 LOC) → **router (~180 LOC) + 4 mode subagents** (PR #69):
  - `bootstrap-greenfield.md` (Stage A-D для нового продукта)
  - `bootstrap-legacy.md` (3-choice adoption + Tier framework)
  - `bootstrap-resume.md` (Stage A-D не closed)
  - `bootstrap-template-sync.md` (version bump + architecture overview)
- **`CLAUDE.md.tmpl`** (229 LOC) → **core (~92 LOC) + on-demand `_claude/<concept>.md` refs** (PR #67). Agent читает CLAUDE.md всегда, остальное по pointer'ам.
- **All 11 agent prompts** — cache-friendly ordering (PR #63): static blocks first (contract, AP discipline, output format), per-invocation context в tail.
- **All 9 agent prompts** — `## Operator-facing tone` + `## Verbosity discipline` секции (PR #72): terse default, verbose только при architectural decision / new AP / cross-domain finding / source-bounded fork / escalation trigger.
- **`development-protocol.md` § 9.5**: «Source-bounded contract» extract (PR #65) — universal blueprint для всех 12 agent files; per-agent contract section теперь pointer на § 9.5.

**Action в product (template-sync):**
- Регенерировать `doc/anti-patterns.md` → index format; добавить `doc/anti-patterns/` directory с per-AP files
- Регенерировать `.claude/agents/project-bootstrap.md` + 4 новых `bootstrap-*.md`
- Регенерировать `CLAUDE.md` (тонкий core)
- Добавить `_claude/` directory из template: `keyword-routing.md`, `frontmatter-convention.md`, `subagent-context.md`, `lifecycle-scenarios.md`, etc.
- Регенерировать все 9 agent prompts (cache ordering + tone/verbosity sections)
- Регенерировать `development-protocol.md` (§ 9.5 source-bounded blueprint)

### v0.7.0 follow-ups — anti-drift layers + brownfield (PR #71/#73/#74)

**Три layer'а anti-drift complete.** MINOR-additive (new APs, new linter families, new template artifacts).

**AP catalogue extension:**
- **Layer 2 (PR #71):** AP-27 hallucinated decision component, AP-28 inter-ADR contradiction, AP-29 ADR scope creep, AP-30 plausibility / structure bias
- **Layer 3 (PR #74):** AP-31 spec staleness (warning), AP-33 cross-feature contradiction (critical)
- **Operator communication (PR #73):** AP-32 jargon-first communication (soft-warn)
- **`affects_features:` frontmatter** (PR #74) — optional list field, описан в `_claude/frontmatter-convention.md`. Используется Layer 3 linter для cross-feature traceability.

**Protocol additions:**
- **`development-protocol.md § 9.6`** (PR #74) — Cross-feature invariants (Layer 3) — invariant extraction regex, hard cross-feature triggers, override marker `[cross-feature-override:]`
- **`development-protocol.md § 9.7`** (PR #74) — Brownfield adoption (В1/В2 flow) — Full retrofit routine (audit/review/extract/approve)
- **`development-protocol.md § 16`** (PR #73) — Operator interface model — three-level architecture (Strategic/Tactical/Implementation), 6 escalation triggers, 6 plain-language rules. Old § 16 «Что overlay может добавить» renumbered → § 17.

**Linter additions** (all family-members в `check-spec-discipline.sh.tmpl`):
- `adr-decision-component-bounded` / `inter-adr-contradiction` / `adr-feature-scope` (PR #71, family `cross-doc-bounded`)
- `spec-staleness` / `cross-feature-invariant` (PR #74, family `cross-feature-bounded`)
- `operator-facing-jargon` (PR #73, family `operator-communication`, soft-warn only)
- **New wrapper script** `scripts/check-cross-feature-invariants.sh.tmpl` (PR #74) — thin alias к `check-spec-discipline.sh --check cross-feature-invariant`. Backward-compat для acceptance criterion literal naming.
- **Mandatory `--regression` runner** — все 3 new families добавляют fixtures в `doc/_templates/regression-cases/`:
  - `cross-doc-drift-001/` (PR #71)
  - `cross-feature-drift-001..005/` (PR #74)
  - `operator-facing-jargon-001/` (PR #73)

**Reviewer extension** (PR #71): mandatory **Step 2.5** cross-doc check между planner и push'ем. Reviewer auto-loads foundational docs (vision / positioning / mvp-scope / threat-model) при `topology_impact: yes` / `threat_impact: yes`. Inline в `.claude/agents/reviewer.md`.

**Bootstrap-legacy 4-choice menu** (PR #74): добавлен 4-й item «Full retrofit» поверх existing 3 (Quick auto / Manual staged / Skip). Flow: audit code → operator confirms grouped features → AI extracts spec skeletons → operator approves. Existing 3-choice сохранён без break'а.

**Spec template extension** (PR #74): `_templates/feature-spec.md.tmpl` получает OPTIONAL секции `## Behaviour observed` + `## Invariants extracted` (HTML-comment wrapped — existing specs без break'а; используются brownfield extract'ом).

**`bootstrap-state.md.tmpl` extension** (PR #74): новое поле `staleness_days: <integer>` (default 30) — threshold для AP-31 staleness check.

**Action в product (template-sync):**
- Регенерировать `doc/anti-patterns/AP-{27..33}.md` из template (7 новых files)
- Регенерировать `doc/anti-patterns.md` index — обновить table-of-contents
- Регенерировать `doc/development-protocol.md` (§ 9.5 layer table updated; § 9.6 / 9.7 / 16 / 17 added; old § 16 renumbered)
- Регенерировать `doc/_templates/scripts/check-spec-discipline.sh.tmpl` — 3 new families + `--regression` runner
- Добавить `doc/_templates/scripts/check-cross-feature-invariants.sh.tmpl` wrapper
- Добавить `doc/_templates/regression-cases/` — 7 fixture directories
- Регенерировать `.claude/agents/reviewer.md` — mandatory Step 2.5
- Регенерировать `.claude/agents/planner.md` — auto-load foundational docs
- Регенерировать `.claude/agents/bootstrap-legacy.md` — 4-choice menu
- Регенерировать `.claude/agents/{coder,reviewer,release-helper,project-bootstrap,bootstrap-*}.md` — `## Operator-facing tone` extensions
- Регенерировать `doc/_templates/CLAUDE.md.tmpl` — pointer line для plain-language rules
- Регенерировать `doc/_templates/0000-adr-template.md.tmpl` — `### Components` subsection + `feature_topic:` frontmatter
- Регенерировать `doc/_templates/feature-spec.md.tmpl` — optional `## Behaviour observed` + `## Invariants extracted`
- Регенерировать `doc/_templates/bootstrap-state.md.tmpl` — `staleness_days:` field
- Добавить `doc/_claude/operator-facing-examples.md` (5 terse/verbose pairs)
- Обновить `doc/_claude/frontmatter-convention.md` — `affects_features:` field documented
- Обновить `doc/_claude/keyword-routing.md` — intent-detection preamble

**Inspection-before-regenerate discipline (особенно важно):** `check-spec-discipline.sh.tmpl` теперь contains 3 параллельных families (cross-doc / cross-feature / operator-communication). Если product кастомизировал какую-то family — manual merge при regenerate.

---

## Inspection-before-regenerate discipline (general)

**Lesson from heartvault first prod-run (issue #49):**

Перед blindly копированием `_templates/scripts/*.tmpl` → `product scripts/`:
1. Сравни interface — какой input ожидает script (env vars / argv / JSON stdin)
2. Проверь exit codes — exit 0/1/2 semantics
3. Сделай smoke-test — вызови с sample input, убедись что block/allow корректные
4. Только потом replace

Особенно важно для **hook scripts** — silent break == молча выключенная защита.

---

## Multi-version jump strategy

Если product pinned на v0.X, target — current main (post-v0.5):
1. Apply v0.X+1 changes — commit
2. Apply v0.X+2 changes — commit
3. ...
4. Apply post-v0.5 unreleased changes — commit

**Логические PR'ы:** split по concern'ам (e.g., infrastructure → schema → docs → Stage A artifacts), не один мега-PR. Easier review, easier rollback при проблеме.

**Adoption_overrides (AP-22)** — если какие-то changes intentionally skip'аются (e.g., product без UI → skip ui-style-guide-* split) — задекларируй в `.bootstrap-state.md` `adoption_overrides:` с `reason` + `accepted-risk`.
