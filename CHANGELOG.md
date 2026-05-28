# Changelog

Формат — [Keep a Changelog 1.1.0](https://keepachangelog.com/ru/1.1.0/), versioning по [SemVer 2.0](https://semver.org/lang/ru/).

**SemVer для template:**
- **MAJOR** — breaking changes: несовместимые изменения структуры проекта, удалённые агенты/команды
- **MINOR** — новые агенты, команды, шаблонные документы
- **PATCH** — fixes, уточнения, нефункциональные изменения

---

## [Unreleased]

---

## [1.0.5] — 2026-05-28

### Fixed

- coder: must not create directories outside project root — no /tmp/probe dirs. Library API research via WebSearch or project node_modules/ (88449ea)


## [1.0.4] — 2026-05-28

### Fixed

- research command: output path — feature research beside plan in `docs/features/<topic>_research.md`, project-level research in `docs/research.md` (2558671)


## [1.0.3] — 2026-05-28

### Added

- `/research` command: WebSearch-based analysis of existing solutions and analogues. PM-readable output with pros/cons/fit. Saves to `docs/research/<topic>_research.md`. (bc93ba6)
- bootstrap: asks PM about research at project start
- plan-feature: suggests research when feature area might benefit from existing libraries

### Fixed

- architect: reverted WebSearch (wrong place); scope strictly current repo only (1403b92)


## [1.0.2] — 2026-05-28

### Fixed

- Renamed architect agent output from `_design.md` to `_arch.md` — consistent with agent name, no confusion with UI/UX design artifacts (df2935b)

---

## [1.0.1] — 2026-05-28

### Fixed

- CLAUDE.md.tmpl: added explicit "Workflow agents" table so orchestrator uses template agents instead of similarly-named agents from other toolsets (5d9254d)

---

## [1.0.0] — 2026-05-28

### Breaking Changes

- **Full template rewrite (v2).** Downstream projects using v0.x cannot adopt v1.0.0 without a full re-bootstrap. Removed: development-protocol.md, bootstrap state machine (stages A-D), AP-1..AP-33 checklist, domain-*.md files, spec.md format with frontmatter, all bootstrap agents (greenfield/legacy/resume/template-sync), planner agent, shell scripts, regression test cases, review trail mechanism — 120+ files, ~22 000 lines. (#121)

### Added

- CLAUDE.md.tmpl as primary orchestration artifact — contains PM communication protocol, orchestration logic, and project context (#121)
- `architect` agent — optional structural pass between planning and coding (#121)
- `pr-prep` agent — squash and PR creation (#121)
- `/bootstrap` command — project initialization with hook detection, no-code state handling, platform UI vs custom UI distinction (#121, c800851, 4f1e0b9, c0225cd)
- `/plan-feature` command — interactive planning with PM, stale doc detection, retrospective trigger (#121)
- Templates: `README.md.tmpl`, `architecture.md.tmpl`, `ui-guide.md.tmpl`, `user-journeys.md.tmpl`, `threat-model.md.tmpl` (#121)
- PM communication protocol in CLAUDE.md.tmpl — plain language rules for all agents (#121)
- Architectural retrospective trigger in plan-feature — suggested every 5 features (#121)
- Company/team standards support in architecture.md.tmpl and bootstrap (#121)

### Changed

- `coder.md` rewritten — compact, declarative, reads CLAUDE.md for pipeline and conventions (#121)
- `reviewer.md` rewritten — broad mandate, test quality check (verifies tests encode scenarios from plan), security adversarial thinking (#121)
- `release-helper.md` rewritten — removed all v0.x references (#121)
