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

- `CLAUDE.md` exists and contains `@.ai-pm/tooling/WORKFLOW.md` → already initialized, confirm and exit
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

- `CLAUDE.md` from `CLAUDE.md.tmpl` — fill in all placeholders. Pipeline section is left with `<test command>` and `<lint command>` as placeholders for now — extended after `stack-researcher` runs.
- `README.md` from `README.md.tmpl`
- `docs/architecture.md` from `architecture.md.tmpl`
- `docs/user-journeys.md` from `user-journeys.md.tmpl` — leave as guided skeleton for PM to fill
- `docs/stack-notes.md` from `stack-notes.md.tmpl` — empty shell; `stack-researcher` fills the components on the next step
- `docs/ui-guide.md` from `ui-guide.md.tmpl` — only if **custom** UI (case 1 above)
- `docs/threat-model.md` from `threat-model.md.tmpl` — only if security requirements mentioned
- `docs/features/` directory
- `.ai-pm/state/current.md` from `state.md.tmpl` — initial state set to `Status: idle`; updated by every coder run thereafter
- `.ai-pm/state/archive/` directory — completed task states get archived here
- `.ai-pm/contracts/` directory — Product Contracts get created here as features are planned (one file per user-facing feature)

**Stack literacy onboarding (mandatory, no PM questions).** Spawn the `stack-researcher` subagent with the stack components from PM's answers (language, runtime, framework, database, key libraries, target platform). The agent reads canonical docs and spec, writes `docs/stack-notes.md` with cited idioms, constraints, validators and integration contracts.

After `stack-researcher` returns:
- Take its "New validators" list and add each command to the `Pipeline` block in `CLAUDE.md` — these are mandatory gates alongside `<test command>` and `<lint command>`.
- Take its "Integration contracts" findings and reflect them in `docs/architecture.md` deploy / infrastructure section (e.g., "schema delivered via package postinst to the system's standard schema directory", "manifest applied via CI step", "config rendered into platform-expected path").
- Take its "Open questions" list and surface to PM as a brief technical caveats block (one sentence each, plain language) — PM does not have to act on them now, but they exist on record.

Then ask PM: "Want to research existing solutions — libraries, ready products, analogues? Useful at the start so you don't build what already exists. Run /research?"

If yes — run `/research` before any feature planning.

Present a brief to PM summarizing what was captured. Follow the PM communication rules from WORKFLOW.md: plain language, user perspective, no code, no unexplained technical terms.

**What we're building** — one paragraph: problem, solution, for whom. Written from PM's answers, not copied verbatim.

**User** — who specifically, in what context.

**Stack** — the chosen stack with the reasons behind each choice.

**What's defined** — what the docs already contain (architecture constraints, security requirements, UI approach if applicable).

**What's left open** — `docs/user-journeys.md` is a skeleton; user scenarios will be filled in as features are planned.

Then ask: "Does this match your vision? Anything wrong or missing before we start?"

**Initial commit:** commit the created docs files with a normal `git commit -m "chore: bootstrap project docs"`. If pre-commit hooks run and fail because no test framework exists yet, that is expected — tell PM:

> "The commit failed because the pipeline requires code that doesn't exist yet. Run this once to create the initial documentation commit:
> ```
> git commit --no-verify -m 'chore: bootstrap project docs'
> ```
> Pipeline will be enforced on all commits once source code exists."

Do NOT run `--no-verify` yourself. Give PM the command to run.

---

## Legacy adoption

Ask PM one question before reading anything:

> "Quick start — minimal docs to begin working? Or full documentation — understand the system deeply, e.g. before porting to a new stack?"

Both modes are stack-agnostic: read code as text, reason about structure — no language-specific tooling required.

### Shallow (quick start)

Read:
- Entry points, main modules, config files
- Existing README or docs if present

From this, determine: language, framework, database, key abstractions.

Write minimal docs — enough to start adding features:
- `CLAUDE.md` — fill what's clear from reading; mark gaps as `[?]`
- `docs/architecture.md` — stack and key decisions extracted from code; mark gaps as `[?]`
- `docs/user-journeys.md` — write only what's visible from entry points and module names; leave the rest as `[?]`
- `docs/stack-notes.md` from `stack-notes.md.tmpl` — empty shell
- `.ai-pm/state/current.md` from `state.md.tmpl` — initial state `Status: idle`
- `.ai-pm/state/archive/` and `.ai-pm/contracts/` directories
- Optional docs — skip; create only if code clearly requires them (e.g., obvious security constraints)

**Stack literacy onboarding (mandatory, no PM questions).** Once stack components are identified from the code, spawn `stack-researcher` with that list. It fills `docs/stack-notes.md`. Take its "New validators" list and add commands to the Pipeline block in `CLAUDE.md`. Take its "Open questions" — surface to PM as caveats.

Present findings to PM. Follow the PM communication rules from WORKFLOW.md: plain language, user perspective, no code, no unexplained technical terms.

**What the product appears to do** — one paragraph from what's visible at the entry points and module names. Be honest about confidence level.

**Who the user seems to be** — inferred from the code structure and naming.

**Main scenarios visible** — what the system clearly supports based on entry points and key modules. Mark anything uncertain.

**Stack** — language, framework, database, key dependencies.

**Gaps** — list all `[?]` items so PM knows what's not yet understood.

Then ask: "Does this match the project? Anything critically wrong?"

Do not ask PM to fill the gaps in detail — `[?]` items get resolved naturally as work on the project progresses.

### Full (complete documentation)

Invoke the `docs-extractor` subagent (defined in `.claude/agents/docs-extractor.md`) using the Agent tool. It reads all significant modules at defined depth and writes `docs/architecture.md`, `docs/user-journeys.md`, and optional docs (`ui-guide.md`, `threat-model.md`). Wait for it to complete and read its summary output.

After the extractor finishes:
- Write `CLAUDE.md` from `.ai-pm/tooling/doc/_templates/CLAUDE.md.tmpl` — fill in all placeholders using the stack and architecture the extractor documented. Pipeline section left as placeholders until `stack-researcher` runs.
- Create `docs/stack-notes.md` from `.ai-pm/tooling/doc/_templates/stack-notes.md.tmpl` (empty shell).
- Spawn `stack-researcher` with the stack components the extractor put in `architecture.md` (mandatory, no PM questions). After it returns: extend the Pipeline block in `CLAUDE.md` with its "New validators"; reflect "Integration contracts" in `architecture.md` deploy section; record "Open questions" for the PM brief below.
- Create `docs/features/` directory if it doesn't exist
- Create `.ai-pm/state/current.md` from template (`Status: idle`), `.ai-pm/state/archive/`, `.ai-pm/contracts/` (the docs-extractor already drafted contracts into the contracts/ directory — surface their count and `(needs PM validation)` markers in the PM brief)

Present to PM. Follow the PM communication rules from WORKFLOW.md: plain language, user perspective, no code, no unexplained technical terms. Structure as follows:

**What the product does** — one paragraph, no jargon. What problem it solves, for whom.

**Who the user is** — specific role and context, not "end user".

**Key user scenarios** — the main things a user can do, numbered list. Each in one sentence from the user's perspective ("User imports a price list from XLS → system maps columns → prices update in the catalog").

**How it's structured** — ASCII diagram of the main components and how they connect. Show data flow, not file tree.

**What we're not sure about** — take this from the extractor's "Judgment calls" list. These are the items PM should pay attention to.

Then ask: "Does this match how you understand the system? What's wrong or missing?"

PM's role is validation only — confirming accuracy, not filling gaps. If PM points out something wrong — re-invoke `docs-extractor` with a focused prompt: "Re-read [module], current docs say X but PM says Y."

Result: docs complete enough to plan porting without opening the legacy codebase again.

After PM validates — tell PM:

> "Documentation is ready. We can either start working on the project with the current stack, or port to a new one — that's a significant separate undertaking. What's next?"

If PM says porting — run the porting procedure below.

---

### Porting procedure

Analyze the documented system and propose target stack options. Do not ask PM what stack they want — reason from the system's nature first.

Read `docs/architecture.md` and consider:
- What kind of system is this? (CLI tool, desktop app, web service, daemon, library, data pipeline...)
- What are the main constraints? (performance, portability, team skills, deployment target, UI requirements)
- What does the current stack do well, and where does it create problems?

Then propose 2–3 target stack variants. For each:
- Name the stack (language, framework, database, UI approach if applicable)
- Why it fits this system specifically — not generic praise
- What it solves compared to the current stack
- What it costs: migration complexity, new skills required, ecosystem risks
- Recommend one, explain why

Example framing:
> "Given that this is a desktop app with heavy data processing and cross-platform requirements, here are three options: [A], [B], [C]. I'd recommend [A] because..."

Once PM chooses a stack:

1. **Update docs** — replace the tech stack table in `docs/architecture.md` with the target stack, add a `## Porting notes` section with key mapping decisions (what maps to what, what gets dropped, what's new). `docs/user-journeys.md` stays untouched.

2. **Ensure git repository exists** — check for `.git/`. If missing, initialize and commit the current state as a snapshot of the legacy codebase:
   ```bash
   git init
   git add -A
   git commit -m "chore: legacy codebase snapshot before porting"
   ```

3. **Create a porting branch** named after the target stack:
   ```bash
   git checkout -b port/<target-stack>   # e.g. port/rust-tauri
   ```

4. **Remove all legacy files** — delete everything except the documentation created during bootstrap (`docs/`, `CLAUDE.md`, `README.md`). Commit:
   ```bash
   git add -A
   git commit -m "chore: remove legacy code, keep docs for porting"
   ```

5. Tell PM: "`architecture.md` updated. Legacy code removed from the porting branch — it stays preserved on the previous branch. Ready to plan the first phase."

---

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
