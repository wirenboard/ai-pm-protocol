---
pr: TBD
branch: feature/subagent-coverage-audit
reviewer: general-purpose-agent + self-review
reviewed_at: 2026-05-24
trail_type: committed-review (AP-16)
---

# Review report — feature/subagent-coverage-audit

**Verdict:** approve

## Audit findings (read-only research)

Async reviewer-agent audit'нул 5 subagents (project-bootstrap / planner / coder / reviewer / release-helper) на awareness нововведений (AP-15 updated, AP-16, AP-17, AP-18, ui_kind, db_kind, identifier strategy, composition matrices).

### Per-subagent severity (before fixes)

| Subagent | Severity | Gaps |
|---|---|---|
| project-bootstrap.md | OK | Minor polish (cross-refs к AP-16/17/18 в routing matrix) |
| planner.md | **major-drift** | Нет ref ui-style-guide-* / database-design-* / AP-18 / AP-13 backend operational |
| coder.md | needs-update | Нет ui-style-guide / database-design / AP-18 cross-refs |
| reviewer.md | needs-update | Нет AP-15 UI consistency check / AP-17 product-name grep / AP-18 deploy safety |
| release-helper.md | needs-update | Нет AP-18 release safety pre-flight / AP-16 PR trail / template-version cascade |

### Cross-cutting gaps (across multiple subagents)

1. **ui-style-guide-* / database-design-*** cross-refs отсутствовали у planner / coder / reviewer.
2. **AP-18 expand-contract / deploy safety** упомянут только в bootstrap — 4/5 subagents blind.
3. **AP-13 backend operational rules** (idempotency / RFC 7807 / cursor pagination / latency SLO / observability) — отсутствовали.
4. **AP-17 product-name leak** — упомянут только в bootstrap implicit'ом.
5. **`project_capabilities.ui_kind` / `db_kind`** не читались downstream agents.
6. **Identifier strategy** (UUID v7) — не появлялась в planner / reviewer.

## Applied fixes

### planner.md (major-drift → OK)

- § «Что читаешь как input» расширен — добавлены items 9-11 (state file `ui_kind` / `db_kind`, ui-style-guide-base/per-kind, database-design-base/per-kind)
- § «Структура output'а» — Migration секция полностью переписана с **AP-18 expand-contract 5-step pattern** (Expand → Dual-write → Backfill → Switch → Contract), backup discipline, forward-only schema rollback
- Новая категория «Backend operational invariants» (latency SLO / idempotency / RFC 7807 / cursor pagination / bulk ops / live delivery / observability)
- Identifier strategy explicit (UUID v7 modern default + bigserial для internal)

### reviewer.md (needs-update → OK)

- Новая § 4.1 «UI / API foundation consistency (AP-15)» — blocking finding если UI-touching без cross-ref на `ui-style-guide-<kind>.md`; tokens vs hardcoded check; 8 принципов; per-kind checklist; backend rules для full-stack
- Новая § 4.2 «Deploy / migration safety (AP-18)» — 8-point check (expand-contract / backup / forward-only / feature flag / CI runs migrations / pre-flight staging / immutable applied / data preservation / ORM auto-migrate blocking)
- Новая § 4.3 «Product-name leak check (AP-17)» — grep на known product names в template repo; blocking finding если match

### coder.md (needs-update → OK)

- § «Что читаешь как input» — добавлены items 6-8 (state file, ui-style-guide-base/per-kind, database-design-base/per-kind)
- Новая § «Foundations-aware implementation discipline» с под-секциями:
  - UI / API (AP-15) — tokens not hardcoded / frameworks-first / accessibility / i18n
  - Backend / API (AP-15 / AP-13) — idempotency / RFC 7807 / cursor pagination / parameterized queries / no PII leak
  - DB / migrations (AP-18) — expand-contract / migration через framework / FK + NOT NULL + CHECK / CONCURRENTLY / audit columns / UUID v7 / no ORM auto-migrate

### release-helper.md (needs-update → OK)

- § «Release PR» — добавлен `[skip-review]` marker для chore release (AP-16 discipline); explicit exception для MAJOR (full reviewer pass required)
- Новая § 5 «Deployment safety pre-flight (AP-18) — для MAJOR / breaking releases» — 7-point checklist (expand-contract verified / feature flags state / migration order / rollback runbook / backups verified / staging pre-flight / communication plan)
- Новая § 6 «Template version cascade» — guidance для bump `.ai-pm/version` (downstream impact, MAJOR coordinated bootstrap re-run, AP-17 product-name grep)

### project-bootstrap.md (OK polish)

- Routing matrix «ревью PR» row — explicit AP-16 verdict-gate / human-override mechanics
- Routing matrix «релиз» row — AP-18 deployment safety pre-flight для MAJOR

## Что НЕ изменено (правильно)

- Existing AP-14 structural read-pass в project-bootstrap.md — already coherent
- planner.md Trust profile awareness — already coherent
- coder.md Tests First ordering — already coherent
- reviewer.md verdict format + persist trail + human-override discipline — already coherent
- release-helper.md SemVer + CHANGELOG + Conventional Commits — already coherent

## HeartVault leak grep

`grep -rniE "heartvault|сейф|письм|HV-|wrap_key|обёртка #|content_key" .claude/agents/` — **0 matches**. AP-17 clean.

## Cross-cutting impact assessment

После применения fixes:

- **AP-15 (per-ui-form split)** — теперь aware в planner / coder / reviewer (foundational input + blocking finding в review)
- **AP-18 (expand-contract / deploy safety)** — теперь aware в planner / coder / reviewer / release-helper (4/5 subagents fully covered; project-bootstrap минимально через routing matrix)
- **AP-17 (product-name leak)** — теперь aware в reviewer + release-helper (template-level work coverage)
- **AP-16 (review enforcement)** — было aware в reviewer; теперь усилено в release-helper (chore release skip-marker discipline) и в project-bootstrap routing matrix (operator-facing context)
- **ui_kind / db_kind capabilities** — теперь читаются в planner / coder для foundational input selection
- **Identifier strategy (UUID v7)** — добавлен в planner / coder DB discipline

## Backlog (deferred / out-of-scope)

- **#43 specialized reviewers** — после этого audit может быть переоценён scope: existing reviewer.md теперь имеет AP-15 / AP-17 / AP-18 checks. Возможно «sections-expanded» подход (расширить existing) выиграет над «spawn 5 new agents».
- **#44 PM + Developer coverage balance** — broader audit шаблона как whole, требует separate analysis.
- ai-linting-rules awareness coder.md — этот файл генерируется на Stage D, не template, не часть этого PR.

## Recommendation

PR готов к merge. Все 5 audit findings closed. Cross-cutting gaps adressed. Foundation для #43 design pass (specialized reviewers) теперь установлена — можно переоценить scope зная актуальный state каждого subagent'а.
