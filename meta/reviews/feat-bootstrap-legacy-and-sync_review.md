---
pr: TBD
branch: feat/bootstrap-legacy-and-sync
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-24
trail_type: committed-review
spawned_agents: N/A (agent prompts rewrite)
---

**Verdict:** approve

PR2 of 4-PR plan. Project-bootstrap agent rewrite (legacy detection + 3-choice flow + Tier 0 routine + architecture-overview keyword + template-sync workflow + Tier 2/3 routines + backwards compat) + release-helper template-side SemVer extension.

# Coverage

## project-bootstrap.md rewrite (~500 lines, was 432)

- ✅ **4 ситуации** (было 3): Greenfield Init / Legacy adoption / Resume / Lifecycle routing
- ✅ **Detection logic** при first action — distinguish Greenfield vs Legacy (`.ai-pm/` отсутствует + heuristics for existing code)
- ✅ **Legacy adoption — 3-choice routine** (Quick / Staged / Skip) с full step-by-step для каждого
- ✅ **Tier 0 routine** detailed:
  - Stack detection через manifest files
  - `ui_kind` heuristic table (React/Vue→web, RN/Flutter→mobile, etc.)
  - `db_kind` heuristic table (sqlite→embedded, pg/mongo→external)
  - `topology.md` sketch (filesystem walk + imports graph)
  - `ui-style-guide-base.md` extract (CSS vars / Tailwind config / design tokens)
  - `database-design-*.md` extract (migrations / Prisma / SQLAlchemy)
- ✅ **Lifecycle routing matrix** обновлён — добавлены rows:
  - «обнови template» → template-sync
  - «составь архитектуру» → architecture overview
  - «адаптируй полностью» → Tier 2 promotion
  - «skip X с reason» → Tier 3 override
- ✅ **Template-sync workflow** — detailed steps (read state, compare versions, generate diff, safe auto-apply, manual review items, PR generation, conflict resolution)
- ✅ **Architecture overview keyword routing** — read-only Tier 0 pass, output `meta/architecture-extract-<date>.md` (template) или `doc/architecture-extract-<date>.md` (product), не trigger'ит adoption
- ✅ **Tier 2 promotion routine** — scan mini-* sections, consolidate, draft project-wide artifacts
- ✅ **Tier 3 overrides routine** — operator-initiated AskUserQuestion + hard floor check (stage-e-hooks/trust_profile/stack — refuse) + state append
- ✅ **Backwards compatibility section** — defaults для missing new fields + mode aliases (new-feature → feature, rework-feature → rework)
- ✅ **Stage F handoff routine** обновлён — behavior зависит от foundation_completeness (`complete` standard read-pass, `partial/minimal/none` Tier 1 mini-research inline)

## release-helper.md extension

- ✅ **§ 7 NEW** — Template-side release (когда template repo делает self-release)
- ✅ SemVer rules для template:
  - MAJOR: bootstrap-state.md.tmpl schema incompatible / removed APs / breaking subagent prompts / removed _templates
  - MINOR: new subagent / new AP additive / new ui_kind/db_kind / new template file / new mode
  - PATCH: typos / clarifications / non-functional changes
- ✅ Tagging discipline (git tag + push + GitHub release)
- ✅ Downstream impact guidance (MAJOR strongly recommended template-sync, MINOR recommended, PATCH opportunistic)
- ✅ `[skip-review]` discipline для template self-release (PATCH allowed, MINOR/MAJOR require reviewer)

# Cross-cutting findings

## Spec coverage

PR2 covers все PR2 scope items из plan file и design doc § O:
- Project-bootstrap legacy detection ✅
- 3-choice AskUserQuestion ✅
- Tier 0 auto-extract routine (description; scripts в PR3) ✅
- Architecture-overview keyword routing ✅
- Template-sync mode routine ✅
- Tier 2 promotion routine ✅
- Tier 3 overrides routine ✅
- Backwards compat ✅
- Release-helper template SemVer ✅

NOT covered (deferred к PR3):
- Actual Tier 0 extract scripts (этот PR описывает routine, scripts будут в PR3)
- feature-spec.md.tmpl mini-* sections для Tier 1 inline
- Planner/coder/reviewer awareness of foundation_completeness в их prompts

NOT covered (deferred к PR4):
- check-spec-discipline.sh state-aware logic
- Reviewer downgrade per adoption_overrides

## Plan adherence

Соответствует Phase 1 PR2 scope в plan file. Consolidated approach — combined original PR2 (bootstrap rewrite) + PR3 (template-sync) в один PR.

## Test discipline

Manual verification (agent prompts):
- ✅ Все routing matrix rows покрыты соответствующими sections внизу
- ✅ Cross-refs consistent (§ Tier 0 routine, § Template-sync workflow, etc.)
- ✅ Backwards compat path documented for existing template-native projects
- ✅ Hard floor enforcement (stage-e-hooks/trust_profile/stack) explicit

## Security / architecture

- ✅ Никаких runtime / hook / script изменений в agent prompts — это все behavioral instructions
- ✅ Hard floor protection — AP-22 enforced («Это hard floor, refuse, escalate»)
- ✅ Manual-only template-sync (operator-initiated, не auto-suggest) — respects AP-3 operator-gate
- ✅ Tier 3 overrides operator-initiated only — AI отказывает proactive suggestion

## Code hygiene

- ✅ Sections organized logically: detection → routines → reference sections
- ✅ Preserved sections labeled «(preserved)» для backwards compat awareness
- ✅ Cross-refs use file:section anchors consistently

# Protocol compliance

- ✅ AP-1: нет ADR (foundational в meta/design/)
- ✅ AP-3: scope утверждён operator + design doc
- ✅ AP-6: scope formalized in plan
- ✅ AP-12: техтермы wrapped (Tier, mode, foundation_completeness, etc. — established)
- ✅ AP-16: этот trail
- ✅ AP-17: clean grep (нет product names)
- ✅ AP-19: docs PR exception (agent prompts mixed scope per consolidation directive)
- ✅ AP-22: enforcement codified в Tier 3 routine

# Severity summary

- Blocking: 0
- Question: 0
- Nit: 0

# Backlog для следующих PR'ов

- **PR3:** Tier 0 auto-extract scripts (бэкенд этого PR routine descriptions) + feature-spec.md.tmpl mini-* sections + planner/coder/reviewer awareness
- **PR4:** check-spec-discipline.sh state-aware + reviewer adoption_overrides downgrade logic
- **PR5 (downstream):** Apply на real prod-run product

# Backwards compat note

Existing template-native projects продолжают работать:
- Default values для missing new fields обрабатываются bootstrap-agent'ом на first session после template bump
- Mode aliases (new-feature/rework-feature) transparently mapped
- No forced migration

---

# Post-initial-review update (2026-05-24 second pass)

**Operator feedback:** «обновление шаблона разработки не вижу синхронизации документации проекта под новый шаблон, оно же тоже разъезжается. надо явно запрашивать разрешение и проверкой миграции, что ничего не потерялось»

**Critical gap addressed:** initial template-sync workflow покрывал только template-controlled files (subagents, scripts, anti-patterns). Product documentation тоже разъезжается с новой schema/conventions — silent migration или missing migration → потеря context.

**Changes (additional commit):**

## project-bootstrap.md — template-sync разделён на 3 phases

### Phase 1 — Template files apply (preserved existing routine)

Same as before — auto-apply safe, flag manual.

### Phase 2 — Schema migration (NEW)

Detect changes в `bootstrap-state.md.tmpl` schema vs product state file:
- Missing fields → AskUserQuestion с предложенным default
- Removed fields → migrate values или drop с reason
- Type changes → convert + verify
- Per-field operator approval

### Phase 3 — Documentation migration (NEW, critical)

**Каждая migration требует explicit operator approval с preview diff.**

Detection categories:
- Spec frontmatter additions (new fields, defaults)
- Spec sections additions (new optional/mandatory sections)
- Foundational artifact splits (e.g. ui-style-guide split на base + per-kind)
- Mode renames (alias preservation)
- State field renames
- AP discipline introduction

Per-category routine:
1. AskUserQuestion с описанием + preview diff (sample 1-2 файла) + affected files list
2. 4 options: Apply migration / Apply selectively / Skip с reason / Show full diff first
3. После approval — AI применяет changes, content preserved
4. **Verification phase** — diff before/after, content integrity check, length comparison, generate verification report в `meta/template-sync-verification-v0.X.Y.md`
5. Если detected потеря content — STOP, rollback, escalate

### Phase 4 — Generate PR

PR body sections: Phase 1 summary, Phase 2 schema changes, Phase 3 documentation migrations с counts, verification report link, adoption overrides declared.

## release-helper.md — Documentation migration impact в CHANGELOG

Template release **обязательно** документирует какие product documentation migrations потребует new version:
- Spec frontmatter additions
- Spec sections additions
- Foundational artifact restructure
- Mode/state field renames
- AP discipline introduction

Format в CHANGELOG body — это input для downstream template-sync Phase 3.

**Verdict (post-update):** approve. Critical gap addressed — documentation migration теперь explicit phase с approval + verification.
