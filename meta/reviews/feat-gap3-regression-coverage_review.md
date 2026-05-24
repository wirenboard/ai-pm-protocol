---
pr: TBD
branch: feat/gap3-regression-coverage
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-25
trail_type: committed-review
spawned_agents: N/A
---

**Verdict:** approve

v0.2.0 P0 (silent-break gap 3 / AP-14 extension). Закрывает proven gap: Feature B трогает shared module, Feature A его использует, broken часть Feature A не имеет existing test, ломается silent'но (per-diff coverage видит только новый код).

# Coverage

1. **AP-14 extended** в `doc/anti-patterns.md` — новый параграф «Regression coverage discipline» (требование Regression coverage plan для `topology_impact: yes`; legacy mode — 60% growth minimum).
2. **Feature-spec.md.tmpl** — новая секция `## Regression coverage plan` после Impact assessment (shared modules / existing tests / new regression tests / coverage delta verification + skip conditions).
3. **Check `regression-coverage-for-shared-modules`** в `check-spec-discipline.sh.tmpl` — detect frontmatter `topology_impact: yes` → require секция в spec body.
4. **Catalogue** в `development-protocol.md` § 9.1 row после `pr-ordering-for-multi-domain`.

# Cross-cutting

- AP-1: нет архитектурных решений
- AP-4: spec coverage — silent-break-gaps audit gap 3
- AP-12 / AP-17 clean
- AP-19: один логический change (gap 3 + AP-14 extension — same axis)

# Severity

- Blocking: 0 / Question: 0 / Nit: 0
