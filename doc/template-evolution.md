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
