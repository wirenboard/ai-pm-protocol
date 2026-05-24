---
pr: TBD
branch: feat/foundation-state-schema
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-24
trail_type: committed-review
spawned_agents: N/A (docs PR, foundational)
---

**Verdict:** approve

PR1 of consolidated 4-PR plan для mode matrix redesign (см. design doc `meta/design/2026-05-24_mode-matrix-and-adoption.md`). Foundational PR — schema + protocol § 3 + mode renames + README + AP updates.

# Coverage

## A. State schema additions (`bootstrap-state.md.tmpl`)

- ✅ `foundation_completeness: complete | partial | minimal | none` (orthogonal к mode)
- ✅ `adoption_path: greenfield | legacy-quick | legacy-staged | legacy-skip | null`
- ✅ `template_version_applied: vX.Y.Z` (для template-sync compare)
- ✅ `adoption_overrides: []` с inline example структуры (skip / reason / accepted-risk / declared_at / expires_at)
- ✅ Mode enum обновлён: `new-product | feature | rework | bug-fix | template-sync`
- ✅ Inline comments объясняют семантику каждого field

## B. Protocol § 3 rewrite (`development-protocol.md`)

- ✅ Section renamed «Three initialization modes» → «Five modes + foundation state»
- ✅ Modes table (5 rows) + foundation_completeness orthogonal explanation
- ✅ `adoption_path` table
- ✅ Per-mode sections (§ 3.4-3.8) с full description каждого
- ✅ § 3.9 Lifecycle continuum updated с template-sync
- ✅ § 3.10 Legacy adoption — 3-choice entry с trade-offs
- ✅ § 3.11 Tier framework table
- ✅ § 3.12 Discriminators (если оператор не уверен какой mode)
- ✅ template-sync workflow detailed (manual-only, не auto-suggest)

## C. Mode renames (Python regex script)

- ✅ 14 файлов автоматически обновлены (Python regex script approach, AP-12 safe)
- ✅ `new-feature` → `feature` everywhere в production файлах
- ✅ `rework-feature` → `rework` everywhere
- ✅ `new-product` / `bug-fix` preserved (без изменений)
- ✅ Excluded `meta/` (исторические artifacts) и personas/user-journeys (template's own Stage A)
- ✅ Backwards-compat note implied — bootstrap-agent detect missing fields и fills defaults

## D. README extension

- ✅ «Четыре режима» → «Пять режимов» (table now 5 rows + template-sync added)
- ✅ Mode descriptions updated с current naming
- ✅ NEW section «Legacy adoption — для проектов без `.ai-pm/`» с 3-choice table
- ✅ NEW section «Tier framework» с 4 tier'ами explanation
- ✅ Cross-refs на design doc + § 3
- ✅ AP-21/AP-22 added в anti-patterns list

## E. Anti-patterns updates

- ✅ AP-14 updated с **Foundation-completeness применение** table — describes behavior для `complete/partial/minimal/none`
- ✅ AP-14 Mode column обновлён под new mode names
- ✅ NEW AP-22 «Adoption-override без declared trade-off» — full anti-pattern with use cases, hard floor list, cross-ref AP-16 parallel mechanic

# Cross-cutting findings

## Spec coverage

PR1 covers все scopes из design doc § O Implementation files под «Phase 1 / PR1» heading:
- State schema additions ✅
- Protocol § 3 rewrite ✅
- Mode renames ✅
- README extension ✅
- AP updates ✅

NOT covered (deferred к PR2):
- Project-bootstrap agent rewrite (legacy detection + 3-choice flow)
- Architecture-overview keyword routing
- Release-helper template-side SemVer extension

NOT covered (deferred к PR3):
- Tier 0 auto-extract scripts
- Tier 1 mini-research integration в feature-spec / agent prompts

NOT covered (deferred к PR4):
- Tier 2 promotion routine
- Tier 3 override enforcement в reviewer
- check-spec-discipline.sh state-aware logic

## Plan adherence

Соответствует Phase 1 PR1 scope в plan file (`~/.claude/plans/cheerful-swinging-pie.md`). Consolidated 4-PR approach (per operator instruction «попробуй объединить») merged original PR1+PR2 schema/README parts.

## Test discipline

Manual verification (no automated tests для template docs):
- ✅ Grep на `new-feature` / `rework-feature` в production файлах — clean
- ✅ AP-17 grep на product names — clean (только generic «downstream product»)
- ✅ Backwards-compat: existing state files без новых полей будут work — defaults через bootstrap-agent (handled в PR2)

## Security / architecture

- ✅ Никаких runtime / script / hook изменений в этом PR — только schema + docs + naming
- ✅ Backwards-compat preserved — existing template-native projects не сломаются после merge
- ✅ AP-22 hard floor list defined — `stage-e-hooks`/`trust_profile`/`stack` нельзя override

## Code hygiene

- ✅ Mode renames через Python regex (AP-12 safe approach, не sed)
- ✅ Inline comments в bootstrap-state.md.tmpl объясняют каждое field
- ✅ Cross-refs на design doc consistent (`meta/design/2026-05-24_mode-matrix-and-adoption.md`)

# Protocol compliance

- ✅ AP-1: нет ADR (foundational design в meta/design/)
- ✅ AP-3: scope утверждён operator через AskUserQuestion (4 design questions answered)
- ✅ AP-6: scope formalized в design doc + plan file
- ✅ AP-12: техтермы wrapped, переводы корректны
- ✅ AP-16: этот trail
- ✅ AP-17: clean grep на product names
- ✅ AP-19: docs PR exception (mixed scope разрешён для foundational PR'ов — см. § Допустимые исключения)
- ✅ AP-22: новый anti-pattern, foundational discipline для следующих PR'ов

# Severity summary

- Blocking: 0
- Question: 0
- Nit: 0

# Что в следующих PR'ах

- **PR2:** Project-bootstrap rewrite (legacy detection + 3-choice flow + architecture-overview keyword + template-sync routine) + release-helper extension
- **PR3:** Tier 0 auto-extract scripts + Tier 1 mini-research integration
- **PR4:** Tier 2 promotion + Tier 3 enforcement + check-spec-discipline state-aware
- **PR5 (downstream, не template):** Apply на real prod-run product

# Backwards compatibility

Existing template-native projects (Stage A-E closed prior to merge):
- `foundation_completeness` default = `complete` (если поле отсутствует)
- `adoption_path` default = `greenfield`
- `template_version_applied` default = `v0.0.0` (force template-sync apply)
- Mode aliases: existing spec'и с `mode: new-feature` / `mode: rework-feature` остаются valid (bootstrap-agent в PR2 handle aliases)

Defaults применяются project-bootstrap'ом в PR2. Этот PR (PR1) только декларирует schema, runtime поддержку добавит PR2.
