# Session handoff 2026-05-27

Снимок состояния после закрытия всей очереди из handoff'а 2026-05-26.

## TL;DR

Все pending из прошлой сессии — закрыты. 4 PR замёрджено сегодня (#71-#74). Все три layer'а anti-drift полностью реализованы. AP catalogue вырос с 26 до 33. Operator interface редизайн (3-level + 6 rules + 6 triggers) и brownfield routine — в шаблоне.

## Merged PRs сегодня (4)

| PR | Что |
|---|---|
| #71 | cross-doc-bounded — Layer 2 anti-drift (AP-27/28/29/30 + mandatory reviewer Step 2.5 + linter family + regression fixture) |
| #72 | prompt-economy F — Trust profile A verbosity audit (terse default + 5 verbose triggers, 9 agent files) |
| #73 | operator-as-idea-provider — Three-level architecture (Strategic/Tactical/Implementation), AP-32 jargon-first, § 16 protocol section, 5 terse/verbose pairs, linter family |
| #74 | spec-lifecycle-and-brownfield — Layer 3 anti-drift (AP-31 staleness, AP-33 cross-feature contradiction), brownfield Full retrofit (bootstrap-legacy 4-choice), § 9.6/§ 9.7, 5 regression fixtures, frontmatter `affects_features:` |

## Anti-drift layers (полностью реализованы)

| Layer | AP | Catch point |
|---|---|---|
| **Layer 1** (PR #60) — source-bounded contract | AP-25/26 | per-agent контракт; spec не extend'ит beyond source |
| **Layer 2** (PR #71) — cross-doc-bounded | AP-27/28/29/30 | reviewer Step 2.5; hallucinated component / inter-ADR contradiction / scope creep / plausibility bias |
| **Layer 3** (PR #74) — cross-feature anti-drift | AP-31/33 | spec staleness + cross-feature invariant contradiction |
| **Plus** (PR #73) — operator communication | AP-32 | soft-warn в operator-facing блоках `_review.md`/`_plan.md` |

## AP catalogue (33 файла под `doc/anti-patterns/`)

- AP-1..AP-24 — base catalogue (granularized в PR #68)
- AP-25/26 — source-bounded contract
- AP-27 hallucinated decision component
- AP-28 inter-ADR contradiction
- AP-29 ADR scope creep
- AP-30 plausibility / structure bias
- **AP-31 spec staleness** (warning)
- **AP-32 jargon-first operator communication** (soft-warn)
- **AP-33 cross-feature contradiction** (critical)

Следующий свободный — **AP-34**.

## Operator interface model (зафиксировано в `development-protocol.md § 16`)

**Three-level architecture:**
- Strategic — Operator (PM): стек, архитектура, бизнес-логика, security floor
- Tactical — AI silent: план, ADR alternatives, decomposition, tests strategy
- Implementation — AI silent: код, тесты, модули, refactoring choices

**6 escalation triggers** (когда AI обязан спросить):
1. Business-logic hole
2. Business-affecting fork
3. Stack-affecting decision
4. Security floor triggered
5. Cross-feature contradiction (Layer 3)
6. Cost / time threshold exceeded

**6 plain-language rules** (применяются ко всем operator-facing message'ам):
1. Concrete first, abstract second
2. No jargon без immediate definition
3. Tables followed by «что специфично»
4. Verification question в конце
5. Никаких abstract names
6. Internal IDs (F-NN, AP-NN) — никогда

**Verbosity** (PR #72) — terse default, verbose только при architectural decision / new AP / cross-domain finding / source-bounded fork / escalation trigger.

## Brownfield adoption (зафиксировано в § 9.7)

5 сценариев covered:

| Сценарий | Routine |
|---|---|
| А — новый продукт | bootstrap-greenfield Stage A-D → F-01 silent build |
| Б1 — активный проект + новая фича | spec draft → Layer 3 cross-check → silent build |
| Б2 — активный проект + bug fix | failing test first → inline `last_modified:` edit |
| **В1 — brownfield + новая фича** | `bootstrap-legacy --full-retrofit`: audit → review → extract spec'и всех features → operator approval |
| **В2 — brownfield + bug fix** | targeted extract только affected feature → bug-fix flow |

AP-31 staleness applies ко **всем** spec'ам включая retrofit'нутые.

## Architectural decisions (зафиксировано в этой сессии)

- **Self-refactor pattern proved out:** все 4 fix/feature PR'а сегодня прошли через `general-purpose` + inline role spec (не project-level coder/reviewer). Recursive instability избегнута. Trail honesty: `agent_type: general-purpose-with-role-spec`, `inline_roles: [...]`, `spawned_agents: []`.
- **Linter family pattern:** новые проверки идут family-member'ами внутри `check-spec-discipline.sh.tmpl`, не отдельными скриптами. Wrapper-скрипты допускаются для backward-compat (`check-cross-feature-invariants.sh.tmpl` — thin wrapper).
- **Worktree isolation:** до 3 parallel coder'ов в `.claude/worktrees/agent-<id>/` без файловых конфликтов; rebase ад только при touching общих файлов (e.g., `check-spec-discipline.sh.tmpl`) — fixable post-merge rebase.
- **Section renumbering:** § 11/12 plan → § 9.6/9.7 реализация (avoidance конфликта с existing § 11 «Feature workflow»). Deviation properly surfaced reviewer'ом.
- **FP narrowing:** invariant extraction regex tightened pre-emptively (требует `## Invariants extracted` section ИЛИ list-item с hard absolutes). Acceptable trade-off — recall drops на greenfield prose без structured invariants.

## A/B test plan (на потом — empirical validation)

Не запущен в этой сессии. Цель:
1. Branch from clean HeartVault initial state
2. Wipe template artifacts
3. Re-do F-01 c new template (4 layers + § 16 + brownfield)
4. Measure: time до first commit, operator-touches, drift incidents, token cost
5. Target: 2-4 часа (vs original 3 days), ≤ 5 operator-touches, 0 drift incidents

## Что НЕ делать в следующей сессии

- Не запускать ВСЕ pending в параллель — 3-4 worktree'а max
- Не использовать project-level coder для template self-refactor → general-purpose с inline role
- Не лить в main без trail (`_review.md` или `.ai-pm/.reviews/*.json`)
- Override marker `[review-override:]` только для legitimate WIP commits — не злоупотреблять
- При conflicting рабочих файлах между параллельными PR'ами — сначала merge меньший, потом rebase больший

## Pending / open

Empty queue. Все из handoff'а 2026-05-26 закрыто. Backlog (`doc/architectural-backlog.md`) остаётся с 10 ARCH issues, но они не critical-path.

## Next session opener

Прочитай этот файл, проверь `.ai-pm/.bootstrap-state.md` (не должно быть active worktree'ев), и спроси оператора что приоритетней:
1. A/B test на HeartVault (empirical validation)
2. Backlog ARCH issues
3. Новая фича шаблона (operator-driven)

Не запускай агентов до явного выбора оператора.
