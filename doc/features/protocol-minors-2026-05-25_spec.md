---
topic: protocol-minors-2026-05-25
mode: bug-fix
lite-mode: small-fix
created: 2026-05-25
spec_approved: 2026-05-26
plan_approved:
acceptance: pending
merged: no
review_url:
pr_ordering: null
template_version_applied: v0.6.0
spec_reference: doc/development-protocol.md
legal_impact: no
interview_impact: no
incident_impact: no
journey_impact: no
threat_impact: no
scope_impact: no
topology_impact: no
---

# Protocol minor fixes (накоплено за session 2026-05-25)

**Stage E artifact, Step 1.** Status: draft, lite-mode bugfix.

Четыре minor protocol gaps зафиксированы во время работы Claude session по template'у. Не блокирующие, но мешают workflow и audit honesty.

## Bug #1: Branch naming convention mismatch

**Симптом:** `check-review-trail.sh` ищет `<branch-suffix>_review.md` файл. Если `feature/<topic>` имеет `<topic>` отличный от `topic:` в spec frontmatter — линкер не находит review file даже если он закоммичен.

**Пример:** branch `feature/adr-drift-prevention` но spec'овый topic уже `agent-source-bounded` (рефакторинг переименования). Script ищет `adr-drift-prevention_review.md` — это работает потому что файл оставлен под старым именем. Но если бы переименовали — script бы upstream'ил.

**Что починить:**
- Либо `check-review-trail.sh` сначала читать `topic:` из spec frontmatter и искать `<topic>_review.md`
- Либо документировать invariant «branch suffix = spec topic, переименование = новая ветка»
- Либо смешанный: fallback search — сначала branch-suffix, потом topic-based

**Recommended:** smart fallback — branch-suffix first (current behavior), потом topic-based если первое не нашло.

## Bug #2: Verdict marker format brittleness

**Симптом:** reviewer-agent написал `**Verdict v2:**` (semantic versioning review version'ы) — `check-review-trail.sh` parsing требует литерального `**Verdict:**`, не парсит.

**Текущая защита от bypass:**
- Override-маркер `[review-override:]` в commit body. Работает, но это hack для legitimate cases.
- Альтернатива: переписать review file под литеральный `Verdict:`.

**Что починить:** либо
- (a) Обновить `reviewer.md` prescribe формат — только `**Verdict:** approve|approve-with-comments|request-changes` в первых 50 строках. Никакого `v2`/`vN`. Если reviewer хочет version'ить — это revision metadata в frontmatter.
- (b) Расширить `check-review-trail.sh` regex чтобы matchил `**Verdict( v?\d+)?:**`.

**Recommended:** (a) prescribe — формат должен быть predictable и stable. Versioning через separate field `review_version:` в frontmatter.

## Bug #4: Audit trail integrity при general-purpose workaround

**Симптом:** Когда main session использует `general-purpose` + role spec inline (workaround для Bug #3), сгенерированный `_review.md` пишет `spawned_agents: [protocol-compliance, ...]` — выглядит как real subagent spawn хотя им не является. Это **trail integrity violation** — будущий audit читает trail как «invoked specialized reviewers», на деле — inline role-play через general-purpose.

**Что починить:**
- `reviewer.md` prescribe честный frontmatter field в `_review.md`: `agent_type: general-purpose-with-role-spec | specialized-reviewer`
- Frontmatter `spawned_agents:` должен быть пустым (или omitted) если spawn не происходил
- Optional field `inline_roles: [...]` если general-purpose играл несколько ролей в одной session

**Recommended:** explicit honesty в frontmatter. Trail integrity > convenience.

## Bug #3: Subagent invocation gap (Claude Code limitation)

**Симптом:** project-level agents (`reviewer`, `planner`, `coder` из `.claude/agents/`) не registered в Agent tool's `subagent_type` enum в running session. CLI flag `claude /agents` показывает их, но из main session через Task tool — нет enum entry. Workaround:
1. `subagent_type: general-purpose` + role spec inline в промпте
2. Возможно session restart нужен для discovery
3. Полная template explanation в spawn-промпте — копирует agent prompt content into orchestrator

**Что починить:** unclear если это Claude Code bug, missing documentation, или intended behavior. Нужно:
- (a) Verify reproducer (новая сессия в product repo → попытка Task spawn project agent)
- (b) Если confirmed — open issue в anthropics/claude-code
- (c) Документировать workaround в `CLAUDE.md.tmpl` если bug persists

**Recommended:** (a) reproduce + (c) document workaround сейчас, (b) подождать verification.

## Scope

**In scope:**
- Patch `scripts/check-review-trail.sh.tmpl` с smart fallback для Bug #1
- Update `reviewer.md` prescribe Verdict format для Bug #2
- Document workaround для Bug #3 в CLAUDE.md.tmpl и/или reviewer.md
- Update CHANGELOG

**Out of scope:**
- File issue against anthropics/claude-code для Bug #3 — отдельная operator-task
- Verify reproducer для Bug #3 в clean session — отдельная investigation task
- Backfill check на existing repos с переименованными branches — manual

## NFR

- Bug #1 fix не должен breaking existing workflows (smart fallback)
- Bug #2 fix должен быть backward-compatible (старые `Verdict:` файлы парсятся)
- Bug #3 — purely documentation, no behavior change

## Recommendation

Bundle все 3 в один lite-mode bugfix PR. Все низкого риска, low LOC, related (все про subagent invocation workflow). Один review trail для трёх patches.
