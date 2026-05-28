# Bootstrap project

Initialize this project with the ai-pm-protocol template.

## Check for leftover git hooks

Before anything else — check `.git/hooks/` for non-sample hooks:

```bash
ls .git/hooks/ | grep -v '\.sample$'
```

If any exist — they are from a previous setup and may conflict with this template or fail on an empty project. Tell PM:

> "Found existing git hooks: [list]. These are from a previous setup and may block commits or pushes unexpectedly. Recommended: remove them — this template doesn't require custom hooks. Remove now?"

If PM says yes — `rm .git/hooks/<each>`. If PM says no — note it and continue, but warn that pipeline failures on commit may be caused by these hooks.

---

## Detect scenario

Check what exists:

- `CLAUDE.md` exists and has "How I work" section → already initialized, confirm and exit
- No `CLAUDE.md` but code exists → **legacy adoption**
- No `CLAUDE.md` and no production code → **greenfield**

---

## Greenfield

Ask the PM these questions (one conversation, not a form):

1. What does this product do? (one sentence)
2. Who uses it? (be specific — role, context)
3. What problem does it replace or eliminate?
4. Does your company or team have technology standards? (approved languages, forbidden dependencies, codestyle guide — link or describe key rules)
5. Tech stack? (language, framework, database — and why each choice)
6. Does the project have a UI? Three cases:
   - **Custom UI** (HTML/CSS/components the project builds) → create `docs/ui-guide.md`
   - **Platform UI** (generated forms, admin panels, dashboards provided by a platform — e.g., WB jsoneditor/confed, Django admin, Grafana) → no `ui-guide.md`. Add a "UI pattern" section to `docs/architecture.md` describing what platform surfaces exist and what the project owns (e.g., the JSON schema, the virtual device topics). Add same note to `CLAUDE.md`.
   - **UI planned but not started** → add a note to CLAUDE.md `## Docs` table: `docs/ui-guide.md — not created yet, create when UI work starts`. Do NOT create the file now.
   - **No UI** → skip entirely
7. Any known security requirements? (auth, payments, PII, encryption)

Then create from templates:

- `CLAUDE.md` from `CLAUDE.md.tmpl` — fill in all placeholders
- `README.md` from `README.md.tmpl`
- `docs/architecture.md` from `architecture.md.tmpl`
- `docs/user-journeys.md` from `user-journeys.md.tmpl` — leave as guided skeleton for PM to fill
- `docs/ui-guide.md` from `ui-guide.md.tmpl` — only if **custom** UI (case 1 above)
- `docs/threat-model.md` from `threat-model.md.tmpl` — only if security requirements mentioned
- `docs/features/` directory

Ask PM: "Хочешь исследовать существующие решения — библиотеки, готовые продукты, аналоги? Это полезно на старте чтобы не строить то, что уже есть. Запустить /research?"

If yes — run `/research` before any feature planning.

Show PM what was created. Ask: anything wrong or missing?

**Initial commit:** commit the created docs files. If there is no source code yet (no package.json, no test runner) — the pipeline cannot run and that is expected. Use `git commit --no-verify` for this first documentation-only commit. State explicitly to PM: "Pipeline check skipped — no source code yet. Will be enforced on all subsequent commits once code exists."

---

## Legacy adoption

Read existing code first:
- Scan entry points, main modules, config files
- Identify: language, framework, database, key abstractions
- Read any existing README or docs

Draft the missing documents:
- `CLAUDE.md` — fill from code reading + ask PM to confirm/correct
- `docs/architecture.md` — extract stack and decisions from code, mark inferred items clearly
- `docs/user-journeys.md` — ask PM: what are the main things users do?
- Optional docs — same rules as greenfield

Show PM the drafts. Iterate until PM says ok. Then save files.

Same UI note and initial commit rules as greenfield apply.

---

## After initialization

Tell PM: "Project initialized. Describe a feature and I'll help plan it."

Do NOT start planning a feature until PM explicitly asks.

---

## Setup (run once when connecting template to a new repo)

If `.claude/agents/` and `.claude/commands/` don't exist or aren't linked yet:

```bash
git submodule add git@github.com:aadegtyarev/ai-pm-protocol.git .ai-pm/tooling
mkdir -p .claude
ln -s ../.ai-pm/tooling/.claude/agents .claude/agents
ln -s ../.ai-pm/tooling/.claude/commands .claude/commands
git add .ai-pm/tooling .claude/agents .claude/commands .gitmodules
git commit -m "chore: connect ai-pm-protocol template"
```

To update to a newer template version:
```bash
git submodule update --remote .ai-pm/tooling
git add .ai-pm/tooling
git commit -m "chore: bump ai-pm-protocol"
```
