---
pr: 7
branch: feature/template-database-split
reviewer: general-purpose-agent
reviewed_at: 2026-05-24
trail_type: committed-review (AP-16)
fixes_applied: 2026-05-24
---

# Review report — PR #7 (feature/template-database-split)

**Verdict:** approve-with-comments (initially) → **approve** после applied fixes

## 1. Leak audit (BLOCKING gate)

Grep over `doc/`, `.claude/`, `README.md` for `heartvault|сейф|письм|HV-|wrap_key|обёртка #|content_key` — **0 matches**. AP-17 clean.

## 2. Internal consistency

- **Composition matrix `db_kind`** consistent across base.md (§ intro table), `bootstrap-state.md.tmpl` (capability line), and `project-bootstrap.md` (Stage D sample defaults). Multi-value `embedded, external` и `none` examples align в трёх местах.
- **db_kind на Stage D** (not Stage A like `ui_kind`) — explicitly stated в `project-bootstrap.md` («это техническое решение наравне с языком/фреймворком») и Stage D checklist line в `bootstrap-state.md.tmpl`. Архитектурный contrast с PR #6 (`ui_kind` at Stage A после vision) consistent.
- **AP-18 cross-refs** target real sections: `database-design-base.md` § 7 (migrations) и § 14 (backups) exist; backend guide § 10 «Schema evolution — backwards compat» exists на `feature/template-ui-split` (PR #6); AP-3 / AP-6 / AP-13 all exist в `doc/anti-patterns.md`.

## 3. Architectural soundness

- **Pragmatism scaling triggers** (§ 2.1) align с industry consensus (Citus / Heroku / Crunchy guidance): partitioning > 100M rows reasonable; sharding < 1B rows / < 100k QPS as anti-trigger и explicit «not for multi-tenancy alone» — well-targeted advice.
- **Expand-contract canonical example** (§ 7.2) — six stages каждый independently deployable и rollback'able: stage 1 trivial DROP COLUMN; stage 2 dual-write tolerates revert; stages 3-4-5 stand alone. Correct.
- **AP-18 prohibitions** — все 6 reasonable; ORM `auto-migrate` prohibition особенно important.
- **AP-18 coverage table** — пять level'ей каждый имеет sensible mechanism; PITR для data level explicit.
- **Backups + restore drills** § 14 — RTO/RPO matrix sensible; quarterly DR drills industry standard; «untested backup = no backup» mantra correct.

## 4. Content quality samples

- **base.md** UUID v7 reasoning (sequential B-tree vs v4 random page splits) accurate; Argon2id current OWASP recommendation; 3-2-1 backup rule correct; PITR concept (archive_command + base backup + WAL replay) accurate.
- **embedded.md** SQLite PRAGMA values all accurate: `journal_mode=WAL`, `synchronous=NORMAL`, `foreign_keys=ON` (correctly noted off-by-default), `busy_timeout=5000`, `cache_size=-64000` (negative = KB), `mmap_size=268435456`. STRICT tables 3.37+ correct. DROP COLUMN 3.35+ correct. RENAME COLUMN 3.25+ correct. FTS5 syntax accurate. Litestream — real product (MIT licensed). DuckDB `ATTACH ... TYPE SQLITE` via sqlite extension — real.
- **external.md** types matrix correct (`text` vs `varchar` perf parity в PG correct; `numeric(18,4)` для money fine; `jsonb` binary indexable). `CONCURRENTLY` для index ops correct. `scram-sha-256` since PG 10 correct. Все listed extensions real (`pg_stat_statements`, `pg_trgm`, `pg_partman`, `pg_repack`, `pgvector`, `PostGIS`, `TimescaleDB`).

## 5. Findings + fixes applied

| Finding | Severity | Status | Fix |
|---|---|---|---|
| Typo `«insted of being»` → `«instead of being»` в embedded.md § 3.6 | NIT | ✅ Fixed | Заменено |
| Wording «Standard solution» → «Стандартное решение» в embedded.md § 8 | NIT | ✅ Fixed | Заменено |
| «Для polish PII» → «Для чувствительных PII» в base.md § 9.4 (leftover edit artefact) | NIT | ✅ Fixed | Заменено |
| «Standard solutions» в base.md § 13.3 (англицизм) | NIT (additional) | ✅ Fixed | «Стандартные решения» |
| Cross-link `pg_uuidv7` extension из external.md § 4.1 для PG ≤ 16 | LOW | ✅ Fixed | Добавлен ref на extension § 13 |
| Coverage gap: online schema-change tools (`pg_repack` / `pgroll` / `reshape`) | MEDIUM | ✅ Fixed | Добавлена § 6.5 «Online schema-change tools — для очень больших таблиц» с tool matrix + when-to-use guidance + AP-18 cross-ref |
| AP-18 крупный (~65 строк, самый длинный AP) | MEDIUM | ⚠ Acceptable | Reviewer noted «acceptable» — рекомендация defer; PR не блокирует |
| task #43 references в template (стале risk) | LOW | ⚠ Deferred | Acceptable forward ref; рекомендация extract в TODO.md — backlog item |

## 6. Cross-cutting AP-18 value assessment

AP-18 reads well как cross-cutting: prohibitions cover code / config / API / schema / data symmetrically; coverage table generalises beyond DB; references работают для frontend (feature flags) и backend (API schema evolution) — не DB-only. Keeping AP-18 separate от `database-design-base.md` § 7 justified — § 7 — DB-specific «how», AP-18 — product-wide «discipline that must hold».

## 7. Coverage gaps explicitly OK

NoSQL / cache / distributed SQL out-of-scope (documented в PR). Database-reviewer subagent (task #43) deferred. PM-mentioned concerns («разделение и шифрование данных, идентификаторы, что принято сегодня, дисциплина бэкапов») — все covered в §§ 3, 9, 14.

## 8. Files reviewed

- `doc/_templates/database-design-base.md.tmpl`
- `doc/_templates/database-design-embedded.md.tmpl`
- `doc/_templates/database-design-external.md.tmpl`
- `doc/_templates/bootstrap-state.md.tmpl`
- `.claude/agents/project-bootstrap.md`
- `doc/anti-patterns.md`

---

**Recommendation: PR #7 готов к merge** после применения fixes (3 NITs + 1 LOW + 1 MEDIUM). 2 deferred findings (AP-18 length, task #43 ref) — acceptable, не блокируют merge.
