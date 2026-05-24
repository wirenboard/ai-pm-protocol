---
pr: TBD
branch: feat/operator-neutralize-sweep
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-24
trail_type: committed-review
spawned_agents: N/A (docs-only sweep)
---

**Verdict:** approve

PM-feedback: «шаблоны тоже PM-центричны. в общем весь проект на запахи PM-центричности». Closes task #59 (comprehensive operator-neutralize sweep).

# Coverage

Sweep по всем production файлам template'а — 34 файла, ~200+ PM mentions заменены на «оператор» где роль абстрактная. Сохранены mentions где PM literal = Persona A (README thesis matrix, definition anchors).

## Scope

**Touched (operator-neutralized):**
- Все 10 subagents в `.claude/agents/` (planner, coder, reviewer, project-bootstrap, release-helper, protocol-compliance, backend, frontend, design, database)
- Все 14 `_templates/*.tmpl` (CLAUDE.md, feature-spec/plan/review, ADR, bootstrap-state, all ui-style-guides, database-design, dev-environment, legal-brief, customer-interview, incident-runbook, strategic-frame, refactor-playbook, settings.json, development-protocol-overlay)
- Все 4 `_templates/scripts/*.sh.tmpl` (check-pr-has-review, check-spec-discipline, check-spec-precondition, check-git-safety)
- `doc/anti-patterns.md`
- `doc/_recipes/cache/README.md`, `doc/_recipes/cache/ai-linting-typescript.md`

**Skipped (intentional):**
- `meta/` — историч artifacts (audit + review trails template development'а)
- `doc/personas.md`, `doc/user-journeys.md` — template's own Stage A artifacts (PM = literal Persona A name)
- `README.md` — PM mentions correct (thesis matrix, definition anchor)
- `doc/development-protocol.md` — уже operator-neutralized в PR #14
- `doc/_templates/ui-style-guide-native-desktop.md.tmpl` L180 — `<dpiAware>True/PM</dpiAware>` Windows API (Per-Monitor DPI), не PM-роль

# Convention applied (AP-16)

- «PM при Trust profile A, developer при Trust profile B/C — далее оператор»
- PM сохранён в discoverability anchors (definition lines в anti-patterns.md AP-16, README thesis matrix)
- Trust profile A-specific behavior expressed как «оператор при Trust profile A» где надо различать (например «не читает код»)

# Method

Mass replacements через Python regex (AP-12 безопасно: literal PM → оператор/оператора/оператору с учётом падежа). Sed запрещён для русских grammar, Python обрабатывает Unicode корректно.

Patterns:
- `PM-gate` / `PM-approval` / `PM-marker` / `PM-intent` / `PM acceptance` → `operator-*`
- `соло-PM` → `соло-оператор`
- `PM` subject + verb → грамматически правильное «оператор + verb»
- `PM-у` / `PM'а` / `PM'ом` → правильные падежные формы

# Protocol compliance

- ✅ AP-12: каждый replacement грамматически корректен по-русски; не использовался sed
- ✅ AP-16: этот trail
- ✅ AP-17: clean (нет product-name leak)
- ✅ AP-19: docs PR, atomic scope (operator-neutralize)

# Severity summary

- Blocking: 0
- Question: 0
- Nit: 0

# Backlog

- Task #60: README dev-pain rewording (отдельный scope — не language, semantic)
- Task #57: README modes section update (когда G-1/G-3 спроектированы)
- Task #56: G-3 legacy-partial mode design
- Task #48: G-1 template-apply mode design
