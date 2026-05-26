# Session handoff 2026-05-26

Снимок состояния перед context truncation. Следующая сессия — старт отсюда.

## Core paradigm (зафиксировано в этой сессии)

**Защита от AI-дрейфа + гарантированное выполнение бизнес-обещаний.** Всё остальное — инструменты.

## ЦА (узили)

**Только PM не смотрящий код** (Trust profile A). Developer-кейс отложен до empirical validation PM-кейса.

## Operator model (зафиксировано)

PM — **дирижёр верхнего уровня**, утверждает только:
- Стек
- Архитектура
- Бизнес-логика

AI делает **silently** всё ниже:
- План / ADRs (Tactical)
- Код / тесты / модули (Implementation)

**Operator escalation triggers** (когда AI обязан спросить):
1. Дыра в business-logic
2. Business-affecting architectural fork
3. Stack-affecting decision (new dep / migration)
4. Security floor triggered (check-security-floor.sh)
5. Cross-feature contradiction (Layer 3)
6. Cost/time threshold exceeded

## 6 plain-language rules (зафиксировано)

Все agent'ы при operator-facing communication:

1. Concrete first, abstract second
2. No jargon без immediate definition
3. Tables followed by «что специфично в каждом»
4. Verification question в конце
5. Никаких abstract names (Q1/Q2/Q3)
6. Internal IDs (F-04, AP-25) — никогда. Только user-recognizable descriptions

Новый **AP-29 «Jargon-first operator communication»** — capture pattern (когда merge'нётся).

## Сценарии (5 cases)

| Сценарий | Решение |
|---|---|
| (А) Новый продукт | bootstrap-greenfield → operator-brief → F-01 silent build |
| (Б1) Активный проект + новая фича | spec → Layer 3 cross-check → silent build |
| (Б2) Активный проект + bug fix | failing test first → inline spec edit `last_modified:` |
| (В1) Brownfield + новая фича | **Hard floor**: extract spec'и всех features перед F-N+1 |
| (В2) Brownfield + bug fix | Targeted extract spec affected feature → bug-fix flow |

## Merged PRs сегодня (8)

| PR | Что |
|---|---|
| #61 | protocol-minors (4 bugs: trail fallback, Verdict format, subagent gap, audit honesty) |
| #62 | architectural-backlog (10 ARCH issues) |
| #63 | prompt-economy D (cache-friendly ordering 11 agent prompts) |
| #64 | remove-developer (ЦА PM-only) |
| #65 | prompt-economy A (extract source-bounded blueprint) |
| #66 | agent-consolidation (11 → 5 agents, ~−500 LOC) |
| #67 | prompt-economy E (CLAUDE.md.tmpl 229 → 92 LOC always-on, refs in doc/_claude/) |
| #68 | prompt-economy C (anti-patterns.md granularize → doc/anti-patterns/AP-NN.md per file) |
| #69 | prompt-economy B (project-bootstrap split → router + 4 subagents) |

## В работе (background coders)

- **cross-doc-bounded** (Layer 2 anti-drift) — worktree `agent-af2308fc9f0d8f122` на ветке `feature/cross-doc-bounded`
  - Spec: doc/features/cross-doc-bounded_spec.md (252 LOC, spec_approved 2026-05-26)
  - Scope: mandatory Step 2.5 reviewer, foundational docs auto-load, inter-ADR check, scope creep, regression fixture
  - 3 новых linter check'а + 4 новых AP (AP-27..30)

## Pending в очереди

1. **prompt-economy F** (Trust profile verbosity audit, остался последний из 6)
2. **operator-as-idea-provider** — interface redesign под new model (idea→brief→business-logic→silent)
3. **spec-lifecycle-and-brownfield** — Layer 3 anti-drift + brownfield routine

## Specs в /tmp (нужно перенести в branches)

- `/tmp/operator-as-idea-provider-spec.md` — updated с three-level architecture + 6 plain-language rules + AP-29
- `/tmp/spec-lifecycle-and-brownfield-spec.md` — updated с 4-сценарной матрицей

**Action для следующей сессии:** перенести оба в `feature/<topic>` branches, mark `spec_approved: 2026-05-26`, запустить planner/coder.

## Architectural decisions (зафиксировано)

**Self-refactor pattern:** project-level coder читает свой собственный `.claude/agents/coder.md`. При template self-refactor — recursive instability. Solution: использовать `general-purpose` agent (Claude Code built-in) с inline role spec для всех template-self работ. Project-level coder — только для product code.

**Уже применено:** PR #67 (E), #68 (C), #69 (B), cross-doc-bounded — все через general-purpose с inline role spec. Bug #4 honesty applied: trail имеет `agent_type: general-purpose-with-role-spec`, `spawned_agents: []`, `inline_roles: [coder, self-reviewer]`.

## A/B test plan (на потом)

После завершения queue + полной merge:
1. Branch from heartvault initial state (или clean folder)
2. Wipe template artifacts
3. Re-do F-01 с new template
4. Measure: time до first commit, operator-touches, drift incidents, token cost
5. Target: 2-4 часа (vs original 3 days), ≤5 operator-touches, 0 drift incidents

## Tasks status (для resume)

| ID | Task | Status |
|---|---|---|
| 9 | protocol-minors | ✅ completed |
| 10 | prompt-economy D | ✅ completed |
| 11 | prompt-economy A | ✅ completed |
| 12 | prompt-economy E | ✅ completed |
| 13 | prompt-economy B | ✅ completed |
| 14 | prompt-economy C | ✅ completed |
| 15 | prompt-economy F | ⏳ pending |
| 16 | cross-doc-bounded | 🟡 in_progress (coder running) |
| 17 | remove-developer | ✅ completed |
| 18 | operator-as-idea-provider | ⏳ pending (spec в /tmp) |
| 19 | spec-lifecycle-and-brownfield | ⏳ pending (spec в /tmp) |
| 20 | agent-consolidation | ✅ completed |

## Что НЕ делать в следующей сессии

- Не использовать project-level coder для template self-refactor → general-purpose с role spec
- Не запускать ВСЕ pending в параллель — 3-4 worktree'а max, иначе rebase ад
- Не лить в main без trail (review_md или .ai-pm/.reviews/*.json)
- Не забывать override marker `[review-override:]` для CI когда trail только JSON
