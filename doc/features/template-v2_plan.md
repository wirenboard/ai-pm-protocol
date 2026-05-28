# template-v2 — plan

## Scenarios

1. PM starts a new project — says "начни проект" in natural language, Claude asks questions, creates foundation docs from templates.
2. PM adds a feature — describes it in conversation, Claude reads docs/ first, plans together with PM (including regression risks), saves plan.md, spawns coder → reviewer, surfaces verdict.
3. PM adopts the template in a legacy project — says "адаптируй шаблон", Claude reads existing code, drafts missing docs from templates, PM reviews.
4. Coder hits a failing existing test — stops, Claude surfaces to PM as behavioral question ("поведение X ломается — это намеренно?"), test is NOT modified.
5. Review finds blocking issues — Claude surfaces them to PM in plain language, PM decides: fix or override.
6. Template updated upstream — `git submodule update`, new agent behavior immediately.
7. Developer-operator wants to invoke a step explicitly — runs `/plan-feature` or `/bootstrap` as shortcuts.

## Key design decisions

**PM never knows about agents or skills.** PM talks to Claude in natural language. Claude reads CLAUDE.md, understands the workflow, orchestrates agents automatically.

**Slash commands are developer shortcuts, not PM interface.** `/bootstrap`, `/plan-feature` — for operators who know the pipeline and want explicit control.

**CLAUDE.md.tmpl is the primary artifact.** It contains orchestration logic: when to plan, when to spawn coder, when to surface to PM. Agents are specialized executors.

**Tests = behavioral contract.** Existing tests can only be changed when a new plan explicitly changes that behavior. Otherwise coder fixes code to match tests, never the reverse.

**Templates encode domain expertise.** Optional docs (ui-guide.md, threat-model.md) are created from templates at bootstrap — templates provide structure and principles so the model doesn't produce generic output. Same expertise that was in domain-*.md files, now transferred into project documentation as human-readable files.

## What's removed vs current protocol

- `development-protocol.md` — eliminated. Orchestration logic lives in CLAUDE.md.
- `bootstrap-state.md` and Stage A-D state machine — eliminated. Bootstrap is natural language + optional `/bootstrap` shortcut.
- `domain-*.md` agent-loaded files — eliminated. Domain expertise lives in project docs created from templates at bootstrap.
- AP-1 through AP-29 checklist — eliminated. Agents use judgment + read architecture.md for constraints.
- Formal spec.md with frontmatter — eliminated. Planning is a conversation, output is plan.md.
- Multi-tier foundation completeness — eliminated.
- Bootstrap agents (greenfield, legacy, resume, template-sync) — eliminated.
- Planner agent — eliminated. Planning is interactive in main session.

## Template repo structure

```
.claude/
  agents/
    coder.md          — implements plan, runs pipeline, never touches existing tests
    reviewer.md       — plan compliance + code quality + security, verdict in PM language
    design-review.md  — optional architectural pass (code structure only, not UI/UX)
    pr-prep.md        — squash + PR creation
  commands/
    bootstrap.md      — /bootstrap shortcut for developer-operators
    plan-feature.md   — /plan-feature shortcut for developer-operators

doc/
  _templates/
    CLAUDE.md.tmpl            — orchestration logic + project instructions
    README.md.tmpl            — project overview for humans
    architecture.md.tmpl      — tech stack + decisions + security constraints
    user-journeys.md.tmpl     — user scenarios
    ui-guide.md.tmpl          — UI principles + adaptivity decisions + project-specific slots
    threat-model.md.tmpl      — security model structure + common attack vectors per app type
```

## Downstream project structure (after bootstrap)

```
README.md                   — what and why, for humans
CLAUDE.md                   — orchestration logic + project context
docs/
  architecture.md           — stack, decisions, security constraints
  user-journeys.md          — user scenarios
  ui-guide.md               — optional: only if project has UI
  threat-model.md           — optional: only if complex security model needed
  features/
    <topic>_plan.md         — accumulates per feature
.ai-pm/tooling/             — git submodule → ai-pm-protocol
.claude/
  agents/   → symlink to .ai-pm/tooling/.claude/agents/
  commands/ → symlink to .ai-pm/tooling/.claude/commands/
```

Agents read what exists — they don't fail if an optional file is absent.

## Contracts

### CLAUDE.md.tmpl — sections
- **Project** — what it is, who the user is, what problem it solves
- **Architecture** — stack with reasons, constraints agents must not violate (including security)
- **Pipeline** — how to run tests + linters (mandatory before coder done)
- **Orchestration** — how Claude behaves in main session:
  - PM describes feature → read docs/ → plan together → spawn coder → spawn reviewer → surface verdict
  - PM describes bug → plan fix → spawn coder → spawn reviewer → surface verdict
  - Project not initialized → bootstrap flow
  - Architectural fork detected → surface to PM before proceeding

### Orchestration before planning
Before starting planning conversation, orchestrator reads:
- `docs/architecture.md` — constraints, tech stack, security constraints
- `docs/user-journeys.md` — existing scenarios (identifies regression risk, informs questions)
- `docs/features/` — existing plans (avoids duplication)

Questions to PM emerge from this context, not from general model knowledge.

### plan.md format
```markdown
## Scenarios
(user-visible behaviors after this change)

## Existing behaviors this feature touches
(explicit list from user-journeys.md — what must not break)

## Contracts
(new APIs, data shapes, config keys — omit if none)

## Test plan
- Existing tests that must pass: ...
- New tests to add: ...

## Out of scope
(explicitly what this plan does NOT touch)
```

### Template files — purpose
- `architecture.md.tmpl` — guides: tech stack, why each choice, architectural constraints, security constraints (passwords, keys, tokens)
- `ui-guide.md.tmpl` — guides: adaptivity decision (mobile? tablet? desktop-only? why?), component library, accessibility rules, readability standards, project-specific patterns
- `threat-model.md.tmpl` — guides: assets to protect, threat actors, attack vectors relevant to this app type, mitigations
- All templates have sections + explanatory prompts so bootstrap produces project-specific content, not generic placeholders

### Bootstrap flow (natural language or /bootstrap)
- Detects: greenfield / legacy (code exists, no docs) / already initialized
- Greenfield: asks PM → creates mandatory docs + optional docs based on project type
- Legacy: reads code → drafts docs from templates → PM reviews
- Already initialized: confirms, nothing to do

### design-review agent scope
Structural/architectural decisions about code: where does new logic live, how does it relate to existing modules, what are the behavioral risks. NOT UI/UX design — that lives in ui-guide.md and reviewer checks against it.

### Security in reviewer
Reviewer has security mandate (not a checklist): reads architecture.md security constraints + thinks adversarially about the diff — what could leak, be forged, be stored unsafely. Surfaces as blocking findings in PM language.

## Test plan

Validation by use: this template's development follows the new workflow itself.

No automated tests in protocol repo. Validation after implementation:
- Natural language feature request triggers correct orchestration
- Planning conversation is grounded in docs/ context
- Coder does not modify existing tests on failure
- Reviewer verdict is readable by PM (no technical jargon)
- Security issue in diff → reviewer surfaces it as blocking in plain language
- `/bootstrap` creates correct file structure from templates

## Out of scope

- Migration of existing downstream projects
- Linter configs (per-project, template documents the requirement only)
- pr-prep: adapt from wb-agent-tools with minimal changes
