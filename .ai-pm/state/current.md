# Execution State

> Resume pointer — READ FIRST, by this exact path. Deferred detail: `.ai-pm/backlog.md`. History: commits + CHANGELOG.

**Status (2026-06-11).** `main` = `uni/main` = `a1225fe` (**4.8.1**). PRs #25–#28 merged. Ветка чистая.

## What was just shipped
- 4.8.0 (#27) — kind axis redesign: `code | docs | mixed`; estimation methodology decision
- 4.8.1 (#28) — README: spectrum + 2×2 matrix [who × speed/quality]; 8D closed

## Up next (приоритет — pre-release)
1. **PROTOCOL.md rewrite** — переписанная версия на ветке `protocol-de-water` (cc239d8), не проревьювирована. Первый шаг.
2. **agents readability** — orchestrator.md, builder.md, reviewer.md (`Readability is systemic` в бэклоге).
3. **Unified install** — `src/adapter/install.mjs` довести до одной команды (`Bootstrap is fragmented` в бэклоге).
4. **Stamp format fixup** — `stampOK()` или `reviewer.md` (`Review stamp format mismatch` в бэклоге).

## Conventions
Russian chat; English artifacts. `interactive` mode. `kind: mixed`, `profile: solo`, `threat-model: rich`. **Remotes:** `uni` (`aadegtyarev/ai-pm-protocol-uni`) — live fork; `origin` OLD. After squash-merge: `git fetch uni && git reset --hard uni/main`.
