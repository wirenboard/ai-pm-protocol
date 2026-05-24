# Changelog

Все значимые изменения template'а ai-pm-protocol будут документироваться здесь.

Формат — [Keep a Changelog 1.1.0](https://keepachangelog.com/ru/1.1.0/), versioning по [SemVer 2.0](https://semver.org/lang/ru/).

**SemVer для template:**
- **MAJOR** — breaking changes: bootstrap-state.md.tmpl schema incompatible, removed APs с consumers в downstream products, breaking subagent prompt format, removed/renamed `_templates/` files.
- **MINOR** — additive features: new subagent, new AP additive only, new `ui_kind`/`db_kind` support, new template file, new mode value.
- **PATCH** — fixes / refinements: typo fixes, clarifications, bug fixes в scripts, non-functional formatting changes.

См. release-helper.md § 7 для template self-release process.

---

## [Unreleased]

(Изменения после v0.2.0 будут собираться здесь до следующего release.)

---

## [0.2.0] — 2026-05-25

v0.2.0 fix wave + silent-break gaps closure. PATCH defects + MINOR additive features (new CI gates / new APs).

### Added

- **2 new anti-patterns:**
  - **AP-23** — Test assertion weakened без declared behaviour change. Closes user pain «AI правит тесты под свои выдумки». Coarse `git diff` detection + ADR-NNNN reference или `[test-modify-override:]` marker required.
  - **AP-24** — Architectural decisions buried in spec без ADR. Closes AP-1 dead letter pattern (proven на live test'е). Explicit relationship table с AP-1 (proactive Step 2 vs retroactive Step 7), boundary heuristic (forks vs documentation), precedence (ADR ref в spec → > 50 LOC OK).

- **4 new CI gates** в `_templates/scripts/check-spec-discipline.sh.tmpl`:
  - `spec-test-mapping` (gap 1) — каждый Gherkin Scenario имеет matching test (multi-stack discovery: Go/Python/JS/TS/Ruby/Java/Kotlin/C#/Gherkin)
  - `test-assertion-weakening` (gap 2 / AP-23) — detect modified test files без ADR ref
  - `regression-coverage-for-shared-modules` (gap 3 / AP-14 ext.) — spec с `topology_impact: yes` обязан содержать `## Regression coverage plan`
  - `adr-auto-extraction` (AP-24) — section с architectural keywords > 30 LOC warn, > 50 LOC без ADR ref fail

- **Reviewer Step 1.6 size + content-aware fan-out gate** (`.claude/agents/reviewer.md`):
  - PR < 100 LOC → только protocol-compliance-reviewer (skip domain fan-out)
  - Content-aware override для security-sensitive paths (`auth/` / `payments/` / `db/migrations/` / `crypto/` / `*.lock`) → full fan-out независимо от LOC
  - Configurable per-project через `.claude/settings.json` или development-protocol-overlay

- **AP-14 extended** — Regression coverage discipline subsection (требование plan section для `topology_impact: yes`, 60% coverage growth для legacy adoption)

- **New `## Regression coverage plan` section** в `_templates/feature-spec.md.tmpl` (shared modules / existing tests / new regression tests / coverage delta verification)

- **YAML frontmatter** в `_templates/feature-spec.md.tmpl` head (topic / mode / lite-mode / created / spec_approved / plan_approved / acceptance / merged / review_url / pr_ordering / template_version_applied + 7 impact полей)

- **Verdict line restored** в `_templates/feature-review.md.tmpl` — `**Verdict:** approve | request-changes | block` (AP-16 hook парсит), reviewer roster обновлён на актуальный v0.1.0+

- **Session start Step 1.5** в `_templates/CLAUDE.md.tmpl` — foundation_completeness check (complete/partial/minimal/none routing)

- **Sanitized live-test feedback audit** (`meta/audits/2026-05-24_first-prod-run-feedback.md`) — general lessons из первого live test'а template'а

- **Validation gate artifacts** (`meta/research/`, `meta/experiments/`) — operator pain mapping + silent-break prevention verification

### Changed

- **«Mode 1/2/3» terminology sweep** → named modes (`new-product` / `feature` / `rework` / `bug-fix` / `template-sync`) во всех ~21 production файле. Mapping: Mode 1→new-product, Mode 2→feature, Mode 3→rework, Mode 4→bug-fix, Mode 5→template-sync.

- **Scripts location convention unified** — `.tmpl` headers + protocol § 9 ссылаются на product `scripts/` (генерируются на Stage E из `_templates/`), не `.ai-pm/tooling/scripts/`. Tooling submodule — read-only, scripts генерируются в product.

- **meta/ references в product workflow** → unified `.ai-pm/migrations/` и `.ai-pm/extracts/` convention'ы (`meta/` остаётся template-internal, не копируется в product).

- **AP-16 metadata documented** — `trail_type` field declared informational metadata с enum (`committed-review` / `local-trace` / `skip-marker`).

- **Mini-foundation section в feature-spec template** — добавлен HTML comment marker с explicit instruction УДАЛИТЬ при `foundation_completeness=complete` (~95% случаев в greenfield).

### Fixed

- 4 Blocking defects из post-refactor audit:
  - **B-1** Mode renaming sweep incomplete (~80% template still on old terminology)
  - **B-2** feature-spec.md.tmpl missing YAML frontmatter example
  - **B-3** feature-review.md.tmpl missing Verdict line + orphan security-reviewer references
  - **B-4** scripts location inconsistency в `.tmpl` headers vs protocol

- 5 High findings batch:
  - **H-1** CLAUDE.md.tmpl session start missing foundation_completeness check
  - **H-2** orphan `trail_type` field documented в AP-16
  - **H-3** meta/ references в template-sync workflow → `.ai-pm/migrations/`
  - **H-4** architecture-extract location consistency → `.ai-pm/extracts/`
  - **H-5** Mini-foundation section friction в complete state (HTML comment marker)

### Architecture notes

v0.2.0 закрывает proven gaps от first live test (через `meta/audits/2026-05-24_first-prod-run-feedback.md`) и silent-break audit. Mental model оператора («PM пишет хорошую спеку → автоматика проверяет код → линтеры enforce качество → не читать код») теперь работает на 100% для main feature flow — все 3 silent-break gaps closed + AP-1 dead letter pattern закрыт через AP-24.

8 axes мультироутинга (uplift с 7 в v0.1.0): + новая ось «size + content-aware reviewer routing» (AP-20 extension).

См. detailed план реализации v0.2.0..v0.5.0 в `meta/design/2026-05-25_merged-optimization-plan.md`.

---

## [0.1.0] — 2026-05-24

Initial public release. Foundation для template ai-pm-protocol с полной mode matrix, legacy adoption support и template versioning.

### Added

- **Five modes** (Stage F workflow): `new-product` / `feature` / `rework` / `bug-fix` / `template-sync`
- **Foundation state** orthogonal в `.bootstrap-state.md`:
  - `foundation_completeness: complete | partial | minimal | none`
  - `adoption_path: greenfield | legacy-quick | legacy-staged | legacy-skip | null`
  - `template_version_applied: vX.Y.Z`
  - `adoption_overrides: []`
- **Six stages** lifecycle: Discovery (A) → Constraints (B) → Solution shape (C) → Process (D) → Bootstrap (E) → Production (F)
- **Three integration modes** для `.ai-pm/tooling/`: gitignore / submodule / vendor
- **Three Trust profiles** A/B/C — operator behavior differentiation (PM-manager / cross-stack senior / full-stack pro)
- **Composition matrices**: multi-value `ui_kind` (web / native-mobile / native-desktop / tui / cli / embedded / backend) + multi-value `db_kind` (embedded / external / none)
- **Tier framework для legacy adoption**:
  - Tier 0 — auto-extract (stack / ui_kind / db_kind / topology / ui-style / database-design)
  - Tier 1 — per-feature mini-research (Mini-persona / Journey context / Mini-threat-list inline в feature spec)
  - Tier 2 — operator-initiated promotion (consolidation mini-* sections → project-wide)
  - Tier 3 — declared overrides (`adoption_overrides` с reason + accepted-risk)
- **Specialized reviewer routing** (primary + ONE domain reviewer + always protocol-compliance):
  - `reviewer.md` (primary / orchestrator)
  - `protocol-compliance-reviewer.md` (always-spawned)
  - `backend-reviewer.md` / `frontend-reviewer.md` / `design-reviewer.md` / `database-reviewer.md`
- **Eight foundational artifacts** Stage A: vision / personas / user-journeys / competitive-analysis / positioning / brand-voice / ui-style-guide-base + per-kind
- **Stage E developer ergonomics**: dev-environment.md, optional refactor-playbook.md, optional dependency-policy.md
- **22 Anti-patterns** (AP-1 .. AP-22) — discipline invariants:
  - AP-1: ADR reactive, не upfront
  - AP-2: No premature Stage E
  - AP-3: Operator-gate между stages
  - AP-4: Specification First
  - AP-5: Tests First
  - AP-6: No silent deviation from plan
  - AP-7: Foundational docs — separate PRs
  - AP-8: Useful, не technically-correct
  - AP-9: No state pre-fill
  - AP-10: No git config override
  - AP-11: Critical analysis before draft
  - AP-12: Anglicism discipline
  - AP-13: Operational/legal/validation artifacts
  - AP-14: Structural read-pass
  - AP-15: UI-style-guide foundation
  - AP-16: Offline review trail с verdict-gate
  - AP-17: No product-name leak в template
  - AP-18: Unsafe deploys (expand-contract)
  - AP-19: Per-PR atomicity
  - AP-20: Specialized reviewer routing
  - AP-21: Бесконечный rework без exit condition
  - AP-22: Adoption-override без declared trade-off
- **Auto-extract scripts** (Tier 0): `extract-stack.sh` / `extract-ui-kind.sh` / `extract-db-kind.sh` / `extract-topology.py` / `extract-ui-style.py` / `extract-database-design.py` / `extract-all.sh` (orchestrator с `--read-only` mode для architecture-overview keyword)
- **Foundation maintenance scripts**:
  - `promote-foundation.py` (Tier 2 consolidation)
  - `template-sync-doc-migrate.py` (template-sync Phase 3 documentation migration helper)
- **State-aware CI** (`check-spec-discipline.sh.tmpl`) — reads `foundation_completeness` + `adoption_overrides`, downgrades affected checks с tag «adoption-trade-off accepted by operator»
- **Template-sync workflow** (4 phases): template files apply → schema migration → documentation migration → PR. Manual-only invocation, AI не auto-suggests.
- **Architecture overview** keyword routing — read-only Tier 0 pass, output в `meta/architecture-extract-<date>.md`, не trigger adoption
- **5-layer enforcement**: CLAUDE.md briefing → settings.json hooks → subagent routine → git hooks → CI gates
- **AI-specific linting catalogue** (§ 6 protocol)
- **Architecture linting catalogue** (§ 7 protocol)
- **Spec/use-case linting catalogue** (§ 9 protocol)
- **Security scanning catalogue** (§ 10 protocol, anchored в OWASP / CWE / NIST / CIS / SLSA standards)

### Architecture

- Operator-aware terminology (PM при Trust profile A / developer при Trust profile B/C — далее «оператор»; convention из AP-16)
- README symmetric thesis (PM ↔ Developer) + bidirectional learning
- Template-internal artifacts в `meta/` (audits / reviews / design) — НЕ копируется в product
- Product-side artifacts в `doc/_templates/*.tmpl` — копируется на Stage E с slot fill
- 10 subagents в `.claude/agents/` (project-bootstrap, planner, coder, reviewer, protocol-compliance-reviewer, backend-reviewer, frontend-reviewer, design-reviewer, database-reviewer, release-helper)

### Notes

Это **initial release**. Шаблон обкатывается на реальных prod-run'ах; правила и templates уточняются по мере того, как реальный проект сталкивается с реальностью.

[Unreleased]: https://github.com/aadegtyarev/ai-pm-protocol/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/aadegtyarev/ai-pm-protocol/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/aadegtyarev/ai-pm-protocol/releases/tag/v0.1.0
