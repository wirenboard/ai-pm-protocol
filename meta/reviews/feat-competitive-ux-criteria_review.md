---
pr: TBD
branch: feat/competitive-ux-criteria
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-24
trail_type: committed-review
spawned_agents: N/A (docs-only PR)
---

**Verdict:** approve

Addresses audit finding [H-3] — Competitive UX scan criteria размытые, риск дубля Stage A landscape.

# Coverage

- ✅ Section «Когда обязателен» расширен в «explicit gate criteria» с 3 gate'ами
- ✅ Mode-aware table: 6 rows (Mode 1 / 2 / 3 / bug-fix) с явными условиями
- ✅ Heuristic «UX-significant» — scenarios visible/done/read пользователем
- ✅ Stage A reference path: если landscape < 60 дней + покрывает pattern → опционально (избегаем дубля)
- ✅ Edge case «No comparable feature found» с zero-evidence требованием
- ✅ Escape hatch «спросить оператора через AskUserQuestion» когда unclear

# Protocol compliance

- ✅ AP-1/3/6/13/14/16/17/19/20: N/A или soft compliance docs PR
- ✅ AP-12 anglicism check: техтермы (UX, scan, gate, heuristic, scenarios, pattern) в established белом списке
- ✅ Cross-ref на Stage A competitive-analysis.md preserved

# Severity summary

- Blocking: 0
- Question: 0
- Nit: 0

# Backlog

- Возможно в будущем — explicit cross-ref в `frontend-reviewer.md` / `design-reviewer.md` чтобы они verify'или UX scan compliance на review stage. Out of scope для этого PR.
