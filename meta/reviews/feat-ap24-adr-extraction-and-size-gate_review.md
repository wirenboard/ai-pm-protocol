---
pr: TBD
branch: feat/ap24-adr-extraction-and-size-gate
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-25
trail_type: committed-review
spawned_agents: N/A
---

**Verdict:** approve

v0.2.0 P0 (AP-24 — proven gap от first prod-run feedback) + operational quick win (reviewer size gate per complexity-honesty Mitigation 4). Combined PR — similar surface (both reviewer/linter changes), independent scope per AP-19 (combined acceptable как «v0.2.0 reviewer/linter additions» logical batch).

# Coverage

## AP-24 — ADR auto-extraction

1. **Anti-pattern** в `doc/anti-patterns.md`. Структура: Что нельзя / Почему (proven on first live test — 130+ LOC arch decisions buried) / Relationship table с AP-1 (proactive vs retroactive, fork vs documentation) / Precedence (ADR ref в spec'е → > 50 LOC OK) / Решение (`adr-auto-extraction` check) / Как поступать вместо.
2. **Check** `adr-auto-extraction` в `check-spec-discipline.sh.tmpl`. Awk-based section LOC counter, detect architectural keywords (`инвариант`/`архитектура`/`trade-off`/`decision`), threshold 30 (warn) / 50 (fail). Skip lite-mode:bugfix. Section с ADR ref в spec'е (regex `ADR-NNNN` или `architecture-decisions/`) → fail bypass.
3. **Catalogue row** в `development-protocol.md` § 9.1.

## Size gate

`.claude/agents/reviewer.md` Step 1.6 (после Step 1.5 trust profile detection, до Step 2 spawn):
- Compute LOC + paths via `git diff main...HEAD`
- Default: < 100 LOC → spawn только `protocol-compliance-reviewer`, skip domain
- **Content-aware override:** patterns `auth/` / `payments/` / `db/migrations/` / `crypto/` / `*.lock` etc. → full domain fan-out независимо от LOC (security-sensitive 30-LOC PR более рискован чем 500-LOC styling)
- Configurable per-project через `.claude/settings.json` или overlay

# Cross-cutting

- AP-1: AP-24 closes AP-1 dead letter — relationship explicit
- AP-3: scope утверждён через утверждённый план v3
- AP-4: spec coverage — first-prod-run-feedback audit + complexity-honesty Mitigation 4
- AP-12 / AP-17 clean
- AP-19: один логический batch (reviewer/linter additions), не cross-concern

# Severity

- Blocking: 0 / Question: 0 / Nit: 0
