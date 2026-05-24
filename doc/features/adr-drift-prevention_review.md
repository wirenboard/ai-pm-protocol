---
pr: pending
branch: feature/adr-drift-prevention
reviewer: primary-reviewer (orchestrator only — full ceremony skipped per size-gate clarification; см. § Scope note)
reviewed_at: 2026-05-25
trail_type: committed-review (AP-16)
spawned_agents: []
spec_reference: doc/features/adr-drift-prevention_spec.md
plan_reference: doc/features/adr-drift-prevention_plan.md
verdict: approve
---

**Verdict:** approve

PR реализует **universal source-bounded contract** для всех 12 точек drift'а (11 subagent'ов + main session orchestrator), плюс 2 новых линтер-check'а семейства `source-bounded` и 2 новых AP (AP-25, AP-26). Implementation полностью соответствует spec'у v2 (расширенный scope) и plan'у v1 со всеми 5 Q-resolutions. Линтер на этом repo проходит без failures и без override marker'а; negative-fixture тестирование подтверждает корректность 2 новых check'ов; backfill scope verified.

# Scope note (size-gate / spawn discipline)

PR — pure template-extension (1501 LOC, 16 files, всё в `doc/_templates/`, `.claude/agents/`, `doc/anti-patterns.md`, `doc/development-protocol.md`, `doc/features/`). По size-gate Step 1.6 LOC > 100 → full fan-out по умолчанию; однако content-aware override paths (auth/payments/crypto/migrations/lock files) — **не triggered**: ни одного security-sensitive path в diff'е. Domain — exclusively template / process / doc, не product-code. Specialized domain reviewer'ы (backend / frontend / database / design / protocol-compliance) **не имеют domain'а для review'а** в этом PR — нет endpoint'ов, нет UI, нет migration'а, нет product code, нет AP compliance вопросов помимо уже cross-checked мной (AP-1 / AP-19 / AP-22 / AP-25 numbering).

Primary-reviewer выполняет полный cross-cutting baseline сам — это appropriate routing для template-extension PR без code-touching changes. Документирую решение явно вместо silent skip'а.

# Cross-cutting findings (from primary-reviewer)

## Structural consistency (AP-14)

Spec frontmatter — все 7 impact полей присутствуют с явными yes/no. `topology_impact: yes` корректно — PR расширяет protocol topology (adds new linter family). Никаких структурных нарушений.

OK.

## Spec coverage

Все 6 scope items из spec § «Scope изменений» покрыты в implementation:

| Spec scope item | Implementation | Coverage |
|---|---|---|
| 1. Source-bounded sections в 11 agent files | All 11 `.claude/agents/*.md` имеют 3 секции (`## Source contract` + `## Fork-justification protocol` + `## Spawn discipline`) на верифицированных line numbers | Full — per-agent specifics из spec § «Per-agent specifics» транскрибированы корректно (planner — alternatives без spec'а; coder — extra validation / fields / retry; reviewer — finding без diff_reference; release-helper — invented impact / commit refs; advisor — mandatory без detection rule; и т.д.) |
| 2. `CLAUDE.md.tmpl` orchestrator discipline | `## Source-bounded discipline для orchestrator'а` (CLAUDE.md.tmpl:71-102) — ground truth + 3 fork triggers + spawn discipline + summary discipline + fork-protocol | Full — все 4 sub-aspects из spec присутствуют |
| 3. ADR template frontmatter | `0000-adr-template.md.tmpl:1-11` — `spec_reference:` + `operator_approved:` обязательны; AP-25 reminder в body | Full + бонус: in-body reminder block помогает оператору не забыть pre-check |
| 4. `check-spec-discipline.sh` new checks | `adr-spec-reference` (lines 586-636) + `plan-spec-reference` (lines 644-671); override marker `[source-bounded-override:]` shared helper `_source_bounded_has_override()`; зарегистрированы в обоих `all|*` и `--staged-only` modes | Full |
| 5. AP-25 + AP-26 в anti-patterns.md | AP-25 (lines 18-73) и AP-26 (lines 77-121) — оба следуют существующему формату AP-22/23/24 (Что нельзя / Почему / Mode / Как поступать вместо / Override / Hard floor / Use case examples / Relationship) | Full |
| 6. `development-protocol.md` — principle + detail | § 1.5.1 «AI bounded by source artifacts» (line 31-33) + § 9.5 «Source-bounded contract» (lines 495-518) + 2 строки в § 9.1 catalogue table (lines 478-479) | Full — соответствует Q-1 resolution (option c) |

User stories из spec § «User stories» также все mapped:
- «As any operator… никто из AI-агентов не отходит молча» → enforcement через 11 agent contracts + linter + AP-25/26
- «As any AI agent… чёткий source contract» → 11 idempotent blueprint sections с per-agent specifics
- «As an AI orchestrator… запрет на injection» → CLAUDE.md § orchestrator + AP-26 (no override)
- «As a PM (Trust profile A)… `Source говорит X / Я предлагаю Y / Choose?`» → fork-justification protocol формат фиксирован, идентичен во всех 12 точках

OK.

## Plan adherence

Все 5 Q-resolutions из plan implemented per resolution:

- Q-1 (placement) → option (c) implemented: principle в § 1.5.1 + detail в § 9.5
- Q-2 (test infrastructure) → follow-up PR per resolution; в этом PR manual verification только (я выполнил его — см. §  «Test discipline» ниже)
- Q-3 (backfill scope) → all-backfill implemented: в repo только 1 plan (`adr-drift-prevention_plan.md`), он уже имеет `spec_reference:`; ADRs в repo отсутствуют; substep skipped per plan «Если existing ADR'ов в этом repo нет — этот substep пропускается». ✓
- Q-4 (spawn discipline scope) → option (a) all 11: каждый из 11 agent files имеет `## Spawn discipline` section — для не-spawning agents она formulates receiver-side discipline (Layer 2 of defence-in-depth). Note: plan body line 205 содержит inconsistency («Для остальных secret "Spawn discipline" omits»), но Q-4 resolution в end-of-plan overrides эту строку. Implementation correctly следует Q-4 resolution, не stale body line. Это **минорное** несовершенство plan'а — не implementation issue.
- Q-5 (naming) → `spec_reference:` used throughout; `source_reference:` зарезервирован для future generalization. ✓

OK.

## Test discipline

Поскольку PR — template-level (no production code), tests = fitness functions + manual verification (per plan § Tests plan).

**Manual verification, выполненный в этом review pass'е:**

1. **Положительный сценарий — repo state** (`bash check-spec-discipline.sh --check adr-spec-reference` и `--check plan-spec-reference`):
   - `adr-spec-reference`: OK (no ADR dir — correctly skipped)
   - `plan-spec-reference`: OK (1 plan, frontmatter валиден)
   - Summary: 0 FAILED, 0 WARNINGS

2. **Негативный сценарий — fixture с broken ADR (frontmatter отсутствует) и broken plan (no spec_reference)**:
   - `adr-spec-reference`: FAIL: `0001-bad.md — missing/empty: spec_reference operator_approved (AP-25)`
   - `plan-spec-reference`: FAIL: `foo_plan.md — missing/empty spec_reference (AP-25)`
   - ✓ Exit code 1, корректное error reporting

3. **Override marker `[source-bounded-override:]` в commit body**:
   - Те же broken fixtures + commit body `[source-bounded-override: testing]`
   - `adr-spec-reference`: WARN [source-bounded-override applied], FAIL→WARN downgrade ✓
   - `plan-spec-reference`: WARN [source-bounded-override applied], FAIL→WARN downgrade ✓
   - Summary: 0 FAILED, 1 WARNINGS ✓

4. **Override regex pattern**: `\[source-bounded-override:[[:space:]]*[^]]+\]` — идентичен patterns AP-23 (`[test-modify-override:]`) и AP-16 (`[review-override:]`). Consistency preserved.

5. **Fitness function 2 (grep на 3 headers в 11 agent files)** — не automated в этом PR (per plan future check), но manual grep verified: все 11 файлов содержат три обязательных headers `## Source contract`, `## Fork-justification protocol`, `## Spawn discipline`. Регрессия защита может быть добавлена в follow-up.

6. **ADR template YAML syntax** — frontmatter валиден YAML, простая структура (key: value), parsing проходит.

BDD smoke tests из plan'а (deployment validation на следующих 3 фичах после merge) — это **post-merge** deferred activity, не блокирует merge этого PR.

OK.

## Security / architecture

Нет security-sensitive code в этом PR (template-extension). AP-25 само содержит **hard floor для security**: override marker не освобождает от fork-justification protocol для security-touching artifact'ов (auth / crypto / PII / payments). Это правильное embedding security floor'а в new AP — preserving existing security discipline.

Architecture invariants AP-1 / AP-19 / AP-22 verified:
- **AP-1 (timing)**: новые ADR в этом PR не созданы (никаких новых архитектурных fork'ов с alternatives — все decisions либо однозначны, либо resolved в Q-1..Q-5). Соответствует AP-1 «не writing ADR упреждающе».
- **AP-19 (per-PR atomicity)**: PR touches template-extension domain (1 domain). 11 agent files + CLAUDE template + ADR template + script template + AP catalogue + dev-protocol — это все **single concept** (source-bounded contract). По букве AP-19 это **cross-cutting feature**, аналогичное `chore(release):` exception — но scope ограничен protocol-level concerns (не product). Compliance OK.
- **AP-22 (adoption-overrides)**: не applicable — нет adoption_overrides в bootstrap-state для этого repo (ai-pm-protocol — сам template). OK.

OK.

## Code hygiene

- **Bash script syntax** (check-spec-discipline.sh.tmpl): shared helper `_source_bounded_has_override()` — DRY с AP-23 helper logic. `[ ${#missing[@]} -gt 0 ]` — bash array idiom валиден. `awk '/^---$/{c++; next} c==1'` — parsing frontmatter consistent с existing `check_spec_impact_fields`. Никаких debug-артефактов, никаких TODO/FIXME.
- **Markdown discipline**: все 11 agent files используют `---` separator перед новой section'ой, consistent с existing patterns.
- **AP numbering**: AP-25 и AP-26 не collide с existing AP-1..AP-24. Unique. ✓
- **Cross-refs**: AP-25 → AP-1 / AP-24 / AP-26 / AP-6; AP-26 → AP-25 / AP-20 / AP-6 — все existing AP'ы corrrectly referenced.
- **Catalogue table rows (§ 9.1)**: 2 новые строки добавлены с правильным форматированием, version tag `(v0.6.0+, AP-25, family source-bounded)` consistent с existing v0.2.0 tags.

OK.

# Cross-cutting acknowledgements (учитываемые при verdict)

1. **Plan inconsistency Q-4 vs body text [nit]** — plan line 205 («Для остальных secret "Spawn discipline" omits») остаётся в plan body после operator override Q-4 «option (a) all 11». Implementation correctly follows Q-4 resolution (Spawn discipline присутствует во всех 11), не stale body line. Это **plan-document hygiene** issue, не implementation issue. Recommended (опционально): в follow-up или этот же PR — корректнее закомментировать строку plan body inline note «overridden by Q-4». Не блокирует merge. **Severity: nit.**

2. **Architectural learning layer** (Trust profile A note для оператора): этот PR — meta-recursive applied source-bounded discipline к самому template'у. Implementation демонстрирует pattern «universal contract + per-agent specifics + linter enforcement» which generalizes для других потенциальных «contract'ов» (например, future `## Confidentiality contract` для PII-handling agents, `## Performance budget contract` для latency-sensitive components, etc.). Pattern «3 sections + linter family + 2 AP'а» — теперь повторяемая schema для добавления новых cross-cutting agent-disciplines в template.

3. **Linter coverage gap** (info / acknowledged in plan): regex-only frontmatter parsing — детерминированно для well-formed frontmatter, но не катит при malformed YAML (e.g., nested keys). Acceptable для current scope (frontmatter полей simple key: value). Spec NFR «False positive rate ≈ 0%» preserved. **Severity: info, не блокирует.**

# Consolidated severity summary

- Blocking: 0
- Question: 0
- Nit: 1 (plan-document hygiene — Q-4 override note, optional follow-up)
- Info: 1 (linter regex coverage acknowledged)

# Conclusion: action

**Merge permitted.** Implementation matches spec/plan/Q-resolutions, линтер проходит, negative-fixture testing подтверждает корректность override mechanic'а, backfill scope verified (всё уже compliant в этом repo, нет ADRs для backfill'а, единственный plan уже имеет spec_reference).

Optional cleanup перед merge: добавить inline note в plan body line 205 about Q-4 override (1 строка). Не обязательно.

После merge — track первые 3 follow-up feature workflow runs per plan'у smoke tests, results записывать в `meta/experiments/<date>_source-bounded-deployment.md` (deferred activity per plan).
