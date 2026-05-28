# Bootstrap project

Initialize this project with the ai-pm-protocol template.

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
4. Tech stack? (language, framework, database — and why each choice)
5. Does the project have a UI? If yes, what kind (web / mobile / desktop / CLI / TUI)?
6. Any known security requirements? (auth, payments, PII, encryption)

Then create from templates:

- `CLAUDE.md` from `CLAUDE.md.tmpl` — fill in all placeholders
- `README.md` from `README.md.tmpl`
- `docs/architecture.md` from `architecture.md.tmpl`
- `docs/user-journeys.md` from `user-journeys.md.tmpl` — leave as guided skeleton for PM to fill
- `docs/ui-guide.md` from `ui-guide.md.tmpl` — only if project has UI
- `docs/threat-model.md` from `threat-model.md.tmpl` — only if security requirements mentioned
- `docs/features/` directory

Show PM what was created. Ask: anything wrong or missing?

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

---

## After initialization

Tell PM: "Project initialized. Describe a feature and I'll help plan it."

Do NOT start planning a feature until PM explicitly asks.
