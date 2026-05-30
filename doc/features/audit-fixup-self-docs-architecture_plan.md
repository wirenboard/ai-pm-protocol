# audit-fixup-self-docs-architecture — plan

## Audit reference

From `doc/features/audit-2026-05-30.md`, blocking finding #1:

> `doc/architecture.md` — missing entirely. **Why it matters:** every downstream project is told `docs/architecture.md` is mandatory and that agents read it before any feature. This template has its own architecture (Markdown personas + hooks + symlink convention + GitHub Actions release flow) and exposes its own constraints (e.g. "agents are plain Markdown", "settings.json is delivered via symlink", "WORKFLOW.md is imported via `@.ai-pm/tooling/WORKFLOW.md`") — none of this is documented in the place the template insists on. The auditor cannot evaluate the project against its own architecture rule.

## Scenarios

1. После выполнения этого плана `doc/architecture.md` существует и описывает: tech stack table (через ссылки в `doc/stack-notes.md`), key architectural decisions, constraints, file layout, integration contract template ↔ downstream, release flow.
2. Документ написан в формате, который шаблон сам рекомендует downstream-проектам (`doc/_templates/architecture.md.tmpl` структура). Если что-то из шаблона architecture.md.tmpl не применимо к шаблону самому (например, deploy section в смысле «application deployment» нерелевантен) — это явно отмечается с одной строкой пояснения.
3. Архитектурные решения, накопленные в `doc/features/template-v2_plan.md` (2026-05-22) и в последующих PR'ах #142–#145, явно перечислены и кратко обоснованы. Документ становится единственным источником правды о том, **почему** шаблон устроен именно так.
4. После merge этого плана последующие fixup'ы (`audit-fixup-hooks-quoted-form`, `audit-fixup-self-retroactive-plans`, и далее) могут ссылаться на architecture.md в своей секции «Stack expectations touched» и в plan compliance.

## Existing behaviors this feature touches

- Никакие user-journeys не затрагиваются (шаблон не имеет runtime user-journeys).
- Существующие документы (`README.md`, `WORKFLOW.md`, `.claude/agents/*.md`) не модифицируются. `audit-fixup-readme-workflow-split` (отдельный план) — место, где роли README и WORKFLOW будут разведены; до тех пор architecture.md ссылается на оба как они есть.
- `doc/stack-notes.md` (созданный в audit-fixup-self-stack-notes) — основной источник цитат для tech stack section.

## Categorical scope check

«Разделы документа» — категориальное множество. Какие из секций `architecture.md.tmpl` применимы к шаблону самому?

**В scope** (присутствуют как полноценные секции):
- **Project** — что шаблон даёт, кто им пользуется, какую задачу решает
- **Tech stack** — через ссылки в `doc/stack-notes.md` (jq, gh, git, GitHub Actions, Claude Code hooks API, Markdown frontmatter)
- **Architectural decisions** — agents-as-Markdown, persona files в `.claude/agents/`, command files в `.claude/commands/`, hooks layer для enforcement, symlink delivery для downstream
- **Architectural constraints** — no automated tests by design (validation by use), template stays application-agnostic, settings.json shipped via symlink, WORKFLOW.md imported via `@.ai-pm/tooling/WORKFLOW.md`
- **File layout** — структура repo (.claude/, doc/, doc/_templates/, doc/features/, WORKFLOW.md, README.md, .github/workflows/)
- **Integration contract** (template ↔ downstream) — submodule, symlink, bootstrap flow, version bumping
- **Release flow** — CHANGELOG.md → auto-tag.yml → tag + GitHub Release

**Out of scope** (не применимы или явно вне scope этого плана):
- **Security constraints** — N/A: шаблон не runtime, ничего не хранит, не имеет auth, не обрабатывает user input. Явная одна строка с этим объяснением.
- **Code conventions** — описание frontmatter формата для агентов уже подразумевается в `doc/stack-notes.md` (Markdown frontmatter секция). Не дублируем.
- **Deploy section в смысле runtime deployment** — для шаблона нет; есть «release» (другой раздел).
- **Database / state** — N/A.
- **UI guide** — N/A, шаблон не имеет UI.

## Contracts

Новый артефакт: `doc/architecture.md`.

Формат — derived from `doc/_templates/architecture.md.tmpl`, адаптирован под мета-случай (шаблон сам себе). Каждый раздел, отсутствующий из шаблона, явно отмечается как «N/A — <reason>» вместо удаления, чтобы downstream-читатель понимал что шаблон сам прошёл по своей же структуре.

## Stack expectations touched

Из `doc/stack-notes.md` (созданного в предыдущем fixup):

- **Markdown frontmatter** — формат описания агентов в `.claude/agents/*.md`. Source: <https://yaml.org/spec/1.2.2/>.
- **git** — submodule semantics (template ships as `.ai-pm/tooling/` submodule in downstream). Source: <https://git-scm.com/docs/git-submodule>.
- **Claude Code hooks API** — `.claude/settings.json` структура и symlink delivery. Source: <https://docs.claude.com/en/docs/claude-code/hooks>.
- **GitHub Actions** — `auto-tag.yml` workflow для release flow. Source: <https://docs.github.com/en/actions>.

Полные цитаты с anchor'ами — в `doc/stack-notes.md` соответствующих секциях.

## Test plan

Validation by use (нет автотестов в шаблоне по дизайну):

- `doc/architecture.md` создан, содержит **все** in-scope разделы (Project, Tech stack, Architectural decisions, Architectural constraints, File layout, Integration contract, Release flow).
- **Out-of-scope разделы** (Security constraints, Code conventions, Deploy/runtime, Database, UI guide) явно отмечены как «N/A — <one-line reason>», не вычеркнуты.
- Каждое архитектурное решение (Architectural decisions section) имеет краткое обоснование — почему именно так, а не иначе. Reviewer проверяет, что обоснование не пустое и не trivially copy-paste из CHANGELOG.
- Tech stack section ссылается на `doc/stack-notes.md` за деталями (компонент → ссылка на anchor), не дублирует stack-notes контент.
- Release flow section согласуется с `.github/workflows/auto-tag.yml` (reviewer проверяет cross-check между описанием и actual workflow).
- File layout section согласуется с `ls` repo root (reviewer проверяет).
- Integration contract section согласуется с install instructions в README (reviewer проверяет).

## Docs to update

- `doc/architecture.md` — создаётся в этом плане (workaround: используется `architect` агент с extended prompt — нет dedicated owner для canonical architecture.md, gap зафиксирован в backlog).

`README.md` и `WORKFLOW.md` не обновляются здесь — split их ролей делается отдельным планом (`audit-fixup-readme-workflow-split`).

## Out of scope

- Refactor существующих агентов/команд/templates под architecture.md — это будут другие audit-fixup'ы при необходимости.
- README / WORKFLOW split (отдельный план).
- Расширение `architect` persona на canonical architecture.md ownership — workaround использует существующего architect с extended prompt; full persona fix вынесен в backlog как «template gap: architecture.md ownership».
- Описание Conventional Commits / SemVer / Keep a Changelog как components — они не в stack-notes (PM выбрал scope в предыдущем fixup'е), поэтому architecture.md не цитирует их как stack expectations.

## Handoff

1. PM подтверждает план.
2. Орчестратор спавнит `architect` агент с extended prompt: «напиши `doc/architecture.md` для этого шаблона на основе stack-notes». Architect работает read-only по коду (читает `.claude/`, `doc/`, `.github/`), пишет `doc/architecture.md`. Это **workaround** — architect persona обычно описывает arch notes для feature plan, не canonical architecture.md; gap зафиксирован в backlog.
3. Орчестратор спавнит `reviewer` для проверки против test plan.
4. При approve — `pr-prep` оформляет PR.
5. PM мерджит.
