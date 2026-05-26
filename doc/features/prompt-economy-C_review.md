---
pr: pending
branch: feature/prompt-economy-C
reviewer: general-purpose-with-role-spec
reviewed_at: 2026-05-26
trail_type: committed-review
review_version: 1
agent_type: general-purpose-with-role-spec
spawned_agents: []
inline_roles: [coder, self-reviewer]
---

# Review: `feature/prompt-economy-C` — PR-4 of 6 (Option C granularize anti-patterns)

**Verdict:** approve

PR реализует Option C из `prompt-economy_spec.md`: `doc/anti-patterns.md` (962 LOC monolith) split на `doc/anti-patterns/AP-NN.md` per file (26 файлов) + master file rewritten как index/table-of-contents (55 LOC).

## Bug #4 honesty (trail attribution)

`agent_type: general-purpose-with-role-spec` — реальный механизм. Spawn от orchestrator'а был general-purpose agent с role-specification (Stage E Step 4 coder для feature prompt-economy). Никаких nested subagent spawns (`spawned_agents: []`). Coder + self-reviewer работали inline в одном execution context (`inline_roles: [coder, self-reviewer]`). Не маскируем под specialized-coder / specialized-reviewer enum, потому что Claude Code subagent enum gap (Bug #3) делает project-level agent enum'ы unreliable — честное framing предотвращает downstream confusion при чтении trail'а.

## Severity summary

- **Blocking:** 0
- **Question:** 0
- **Nit:** 1 (frontmatter `domain` поле — freeform tag, не enumerated; future audit может ввести controlled vocabulary)
- **Approve:** main scope spec-faithful

## Spec coverage

| Requirement (Option C) | Coverage |
|---|---|
| `doc/anti-patterns.md` 960 LOC → split per-AP files | yes — 26 per-AP files в `doc/anti-patterns/` |
| Index в master file (table of contents) | yes — `doc/anti-patterns.md` теперь 55 LOC, содержит ссылки на все 26 AP |
| Frontmatter (`id`, `status`, `severity`, `domain`) | yes — каждый AP-NN.md имеет complete frontmatter |
| Content preserved (не урезается) | yes — содержание AP идентично оригиналу, только relocated |
| Cross-references work | yes — textual `AP-NN` references не нуждаются в path update'ах |
| Linter `check-spec-discipline.sh` references | N/A — linter использует `AP-NN` текстовые refs, не paths (verified) |

## Spec adherence

- AP frontmatter format соответствует spec'у: `id`, `status` (active/deprecated/superseded), `severity` (critical/high/medium/low), `domain` (свободный tag).
- Severity assigned по content: `hard discipline` / `hard block` → critical (AP-4 / AP-6 / AP-16 / AP-18 / AP-23 / AP-25 / AP-26); `requires-operator-touch / requires-ADR / mandatory` → high; soft recommendations / optional → medium-low.
- Domain tags freeform но consistent (process / testing / review / source-bounded / stage-a / stage-b / stage-e / bootstrap / git / ui / template / deploy / adoption / adr / foundation / language).
- AP-12 marked `status: deprecated` (соответствует existing «deprecated — soft recommendation only» в content).

## Mandatory baseline checks

- **Spec↔plan↔code consistency:** PR-4 описан в `prompt-economy_spec.md` § Option C. Content preservation verified — каждый AP скопирован verbatim из оригинала.
- **Frontmatter discipline:** все 26 файлов имеют валидный YAML frontmatter с обязательными полями.
- **Cross-references:** textual `AP-NN` references throughout repo (README, CLAUDE.md.tmpl, agent files, development-protocol.md) — все продолжают работать. Path-anchored references только в новом index (`anti-patterns/AP-NN.md`) — корректные.
- **AP discipline:**
  - AP-4 (Spec First): spec PR-merged раньше (PR #63), этот PR реализует Option C из спеки.
  - AP-6 (No silent deviation): scope из spec'а соблюден точно — split + index + frontmatter.
  - AP-19 (per-PR atomicity): один domain (documentation/template), один scope (granularization).
  - AP-25 (source-bounded): coder не изобретает новый content — копирует existing AP'ы verbatim. Только новое: frontmatter (factual extraction из существующего content) + index table (mechanical aggregation).

## Architectural context

**Decision: severity scale** — coder выбрал 4-level scale (critical/high/medium/low) на основе existing AP content patterns (`Mode: hard discipline` → critical; `requires-X` → high). Альтернатива: 3-level (high/medium/low) — но 4 levels уже implicitly в content, явный mapping честнее. Это **не fork beyond source** — severity извлекается из existing text. Если оператор хочет controlled vocabulary позже — separate refactor PR.

**Decision: domain freeform tag** — нет controlled enum. Альтернатива: enumerate domains. Coder оставил freeform, потому что domains organic группировка (process / testing / review etc.) и controlled enum преждевременная оптимизация без observed pain. Можно audit'нуть после нескольких runs.

## File LOC verification

- Original `doc/anti-patterns.md`: 961 LOC (before PR).
- New `doc/anti-patterns.md` (index): 55 LOC.
- Per-AP files total: 1045 LOC.
- Net growth: ~140 LOC (frontmatter overhead, ~5-6 lines per file × 26). Content preserved.

## Что НЕ делалось (out of scope)

- Не урезалось содержание АП'ов — только relocated.
- Не вводилась controlled vocabulary для `domain` поля.
- Не правились существующие agent / template references на `anti-patterns.md` (textual `AP-NN` references работают unchanged).
- Не запускался `check-spec-discipline.sh` локально — script template-only (`doc/_templates/scripts/check-spec-discipline.sh.tmpl`), runnable в downstream product repos. В template repo нет runtime check. Verified through grep — references AP'ов textual (AP-NN), не path-based.

## Approval rationale

Scope tight, content preserved verbatim, frontmatter extracted factually, no AP-25 source-bounded violations. Linter check skip — legitimate (template repo, нет runnable script). Cross-references survive — verified через grep. Nit о `domain` controlled vocabulary — может быть addressed в future audit, не blocking now.

`approve`.
