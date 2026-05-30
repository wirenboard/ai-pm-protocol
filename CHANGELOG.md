# Changelog

Формат — [Keep a Changelog 1.1.0](https://keepachangelog.com/ru/1.1.0/), versioning по [SemVer 2.0](https://semver.org/lang/ru/).

**SemVer для template:**
- **MAJOR** — breaking changes: несовместимые изменения структуры проекта, удалённые агенты/команды
- **MINOR** — новые агенты, команды, шаблонные документы
- **PATCH** — fixes, уточнения, нефункциональные изменения

---

## [Unreleased]

---

## [1.9.0] — 2026-05-30

### Added

- `doc/_templates/state.md.tmpl` — Execution State Protocol artefact: Status (idle | in-progress | blocked) / Done / Remaining / Touched files / Next step / Validation. Single source of truth for the active task; overwritten as progress lands, archived on completion. Agent step 1 reads it; agent step last updates it. (b599700)
- `doc/_templates/contract.md.tmpl` — Product Contract artefact (one per user-facing feature): User value / Who uses it / Must work / Must not break / Acceptance checks / Out of scope / Last reviewed. Backend-only changes don't need a contract; user-facing features must have one. (b599700)
- `coder` agent: reads `.ai-pm/state/current.md` as step 1; reads Product Contract for touched user-facing features as step 4; updates state at end (step 9); new Product Impact Report section in the closing report when contracts are touched. (49d83c1)
- `reviewer` agent: new dimension 11 'Product Contract compliance' — silent behavior change blocks merge; missing contract for touched user-facing feature blocks; failing Acceptance check blocks. New 'Definition of Done' section in verdict format with 7 explicit checks; pass requires all checked, fail requires request-changes regardless of Blocking count. (49d83c1)
- `auditor` agent: load context now includes `.ai-pm/contracts/` and `.ai-pm/state/current.md`; new dimension 11 'Product Contract integrity' mirrors reviewer dim 11 project-wide — missing contracts, stale contracts, drift between contract and code, phantom Acceptance checks. (49d83c1)
- `docs-extractor` agent: legacy bootstrap full mode now drafts initial Product Contracts from discovered journeys, mapped one-to-one. Drafts marked '(extracted from legacy — needs PM validation)' on Last reviewed. Cap of 8 contracts per extraction; remaining journeys surfaced as 'Pending contracts'. (49d83c1, d60612a)
- `bootstrap` command (greenfield, legacy-shallow, legacy-full): creates `.ai-pm/state/current.md` from `state.md.tmpl` with Status: idle, plus `.ai-pm/state/archive/` and `.ai-pm/contracts/` directories. Surfaces draft contract count in the PM brief. (18dc48c)
- `plan-feature` command: reads `.ai-pm/state/current.md` first (warns PM if active task exists); reads `.ai-pm/contracts/` in read-list. After plan approval: initialises Execution State; runs Product Contract check (asks PM one product question — drafts contract from plan Scenarios + Existing behaviors + Test plan if user-facing, notes 'no contract' if backend-only). Names explicit template path `.ai-pm/tooling/doc/_templates/contract.md.tmpl`. (18dc48c, d60612a)
- `WORKFLOW.md` — new 'How state is kept' section between release and prod-incident: `.ai-pm/state/current.md` as resume-from-pause artefact; `.ai-pm/contracts/` as user-facing feature contracts; PM read-only on both. New 'Three channels surface to PM, not one' subsection: Coder's Product Impact Report, Reviewer's product Notes, Reviewer's DoD line. The DoD rule (pass with unchecked box is contradiction) lives here. (1803b4c, d60612a)
- `doc/architecture.md` — three new architectural decisions cited from the integrate-consultancy plan: Execution State as single source of progress, Product Contracts as product-side complement to stack-notes, Definition of Done as explicit reviewer subsection. File layout updated with `state.md.tmpl` + `contract.md.tmpl` and a note about downstream `.ai-pm/state/` and `.ai-pm/contracts/` created at bootstrap. (1803b4c)

### Changed

- `README.md` — 'Что гарантирует' renamed to 'Что снижает риск'; guarantees reworded from absolutes (гарантирует) to risk reductions (реже). Three new entries: state persistence (context loss reduced), silent behavior change (Product Impact Report + dim 11), Definition of Done (objective 'done'). Section header grammar fixed; flow diagram updated with contract-draft step between plan approval and architect; reviewer dimension count 10 → 11; DoD pass | fail line added. (1803b4c, d60612a)
- `.gitignore` — dropped v0.x leftovers: `.bootstrap-state.local.md` (bootstrap state machine removed in v1.0.0 template-v2 rewrite); AP-16 local-trace mode (AP-N anti-patterns system removed in same rewrite); `.ai-pm/.reviews/release-*.json` exception (release-PR tracing model retired with auto-tag workflow). What remains: editor swp files, `.DS_Store`, `.reviews/`, Claude Code worktree scratch dir. Closes audit-fixup #23 in-line. (3f96a2b)
- `architect` agent — `design-review` reference (planned but never shipped in template-v2) rewritten as 'architecture review'. (3f96a2b)

### Notes

- Integrates external consultancy parts 1, 2, 7, 10. Rejects part 3 (modes-vs-agents, conflicts with subagent isolation), part 4 (strict One Logical Step, kept as guidance), part 6 (additional doc fragmentation). Plan and review trail in `doc/features/integrate-consultancy_plan.md`, `doc/features/integrate-consultancy_review.md`, `doc/features/integrate-consultancy_review.v2.md`. (277a90b, e7f0d9b)

---

## [1.8.1] — 2026-05-30

### Fixed

- `.claude/settings.json` hook regexes: ssh content-edit and ssh mutating-action gates now match the quoted form (`ssh host "sed -i ..."`, `ssh host 'rm /etc/foo'`, `ssh host "systemctl restart x"`), closing blocking #3 of `doc/features/audit-2026-05-30.md`; find boundary gate now blocks bare-root `find / -name x` / `find / -type f`, closing blocking #4. (7012c4d)

### Added

- `tests/hooks.sh` — 44 POSIX-shell unit cases over all 5 PreToolUse hooks (Read boundary, find boundary, ssh content-edit, ssh mutating, git force-push, git no-verify), with positive (deny/ask) and negative (pass) coverage and full `hookSpecificOutput` shape assertion (`hookEventName`, `permissionDecision`, `permissionDecisionReason`) on every positive case. (b3cca9c, 28e763c)
- `.github/workflows/lint-hooks.yml` — CI gate runs `tests/hooks.sh` on every PR/push that touches `.claude/settings.json`, `tests/hooks.sh`, or the workflow itself; failing tests block merge. Closes note #6 of `doc/features/audit-2026-05-30.md`. (dfac399)

### Changed

- `doc/architecture.md` — `tests/` directory and `.github/workflows/lint-hooks.yml` added to File layout; "no automated tests by design" constraint refined: tests on meta-infrastructure (hook regexes) are allowed, runtime/feature tests still are not. (6dd28dd)
- `WORKFLOW.md` — Hook-level enforcement section notes the new test-gate so PM sees rules are now verified, not only declared. (6dd28dd)

---

## [1.8.0] — 2026-05-30

### Added

- `doc/architecture.md` for the template itself: 7 in-scope sections (Project, Tech stack pointer into `doc/stack-notes.md`, 9 architectural decisions each citing commit SHA / PR / doc path, constraints, file layout, integration contract, release flow) + 5 explicit N/A sections (Security, Code conventions, Deploy, Database, UI) — every line of the template's own `architecture.md.tmpl` walked through. Closes finding #1 of `doc/features/audit-2026-05-30.md`. Second of 7 self-* audit-fixup plans in meta-audit priority order. (7bb6e05)

---

## [1.7.0] — 2026-05-30

### Added

- `doc/stack-notes.md` for 6 self-* components (architect, planner, coder, reviewer, pr-prep, auditor): documents the protocol's own stack — markdown spec, agent persona conventions, hook scripts, install layout. Closes finding #2 of `doc/features/audit-2026-05-30.md`. First of 7 self-* audit-fixup plans in meta-audit priority order. (4f71ab0)

---

## [1.5.1] — 2026-05-29

### Fixed

- Enforce project root boundary in all agents: hard rule prevents navigation above git toplevel, architect establishes boundary before any file search (d72da4e)

---

## [1.5.0] — 2026-05-29

### Added

- Bootstrap docs-extractor subagent: dedicated agent for deep legacy codebase reading, extracts patterns and conventions before bootstrap planning (14726cf)

---

## [1.4.1] — 2026-05-29

### Fixed

- Bootstrap full-mode gaps: self-resolve doubts without PM escalation, add coverage checklist (forms, DB procedures, exports, backups, settings screens), inline optional docs list for legacy bootstrap (13a01e0)

---

## [1.4.0] — 2026-05-29

### Added

- Two-tier findings and backlog mechanism: structured backlog for findings with PM approval gate to promote items to the main queue (6dd6c42)

---

## [1.3.0] — 2026-05-29

### Added

- Structured reviewer dimensions: distilled 8 review dimensions (security, stability, test coverage, regressions, conventions, simplification, docs drift, infrastructure) with severity levels and explicit "what NOT to flag" rules (5645844)
- Audit command: new optional /audit command for full-project health check using same review dimensions, generates PM-facing report in docs/audit-<date>.md (5645844)

---

## [1.2.0] — 2026-05-29

### Added

- Legacy bootstrap modes for agents and compatibility: two-mode bootstrap procedure, documentation gap handling, porting guidelines (8510e35)

### Fixed

- Release workflow: checks for GitHub Release existence instead of git tag (c240181)
- Release workflow: merge auto-tag and create-github-release into single workflow (ad3d30f)

---

## [1.1.0] — 2026-05-29

### Added

- Set model per agent: haiku for pr-prep/release-helper, sonnet for coder/reviewer/architect (870679a)

### Fixed

- Release workflow: release-helper runs on feature branch, auto-tag on merge to main (5bb8e24)
- Release-helper: remove confirmation gate before commit, report after execution (2ffb6ef)
- Pr-prep: no confirmation gate, execute and report PR URL to orchestrator (ac809b8)

---

## [1.0.7] — 2026-05-29

### Added

- auto-open release PR workflow on branch push — no gh CLI needed locally (eca5b45)

### Fixed

- 9 protocol gaps: bootstrap detection, coder frontmatter, research output path, reviewer cycle, architect trigger, bugfix branch naming, --no-verify in bootstrap, retrospective artifact, submodule command placement (6f74a4d)
- git workflow gaps: atomic commits, feature/fix branch naming, manual release steps (34414c0)

### Changed

- release model: tag main directly instead of release/vX.Y.Z branch + PR ceremony (ba5f613)
- WORKFLOW.md: full reviewer verdict cycle + Maintenance section for submodule update (6f74a4d)

---

## [1.0.6] — 2026-05-28

### Added

- Split CLAUDE.md into static project part + dynamic WORKFLOW.md — separates project config from orchestration workflow (dec55b4)

### Fixed

- orchestration flow: show PM what was built at each step (234cfe2)
- reviewer: checks hardcoded config values and missing infrastructure (acdee68)


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
