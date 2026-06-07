# Bootstrap project

Initialize this project with the ai-pm-protocol template.

## Agent dispatch

All agents below are project agents — use the Agent tool with the exact `subagent_type` shown.

| Agent | subagent_type |
|---|---|
| pm-stack-researcher | `"pm-stack-researcher"` |
| pm-architect | `"pm-architect"` |
| pm-codebase-reader | `"pm-codebase-reader"` |
| pm-product-advocate | `"pm-product-advocate"` |

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

- `CLAUDE.md` exists and contains `@.ai-pm/tooling/WORKFLOW.md` → already initialized. Check for **pending template-upgrade migrations** (below); if none, confirm and exit.
- No `CLAUDE.md` but code exists → **legacy adoption**
- No `CLAUDE.md` and no production code → **greenfield**

### Pending template-upgrade migrations

**Pending-migration detection & procedures — the conditions and per-version migration procedures live in `MIGRATIONS.md` (the single source).** On an already-initialized project, before confirming-and-exiting, check whether a template upgrade (`git submodule update --remote`) left a migration to run. Trigger on PM request ("migrate", "обнови шаблон", "мигрируй на v2.2") or proactively when detected. When a scenario is detected, follow the matching `### Pending-migration detection` condition and per-version procedure in `MIGRATIONS.md`. (The `## Product map generation procedure` that those procedures call stays below, in this file.)

---

## Greenfield

Ask the PM these questions (one conversation, not a form):

0. **Project kind** — is the deliverable **software** (source code) or **documentation** (one or several human-facing documents with no executable code — an SOP, a runbook, a guide, a spec, diagrams — e.g. integrating a device into the company ecosystem, diagnosing a crashed server, soldering a board, a user guide)? See `### Project kind` in `workflow/project-kind.md` (the single source of the enum and the `absent OR unrecognized ⇒ software` default — do not re-state them here). The answer is stored single-source as the `## Project kind:` line in `CLAUDE.md` (default `software`). On `kind = documentation`, follow the **Documentation-kind scaffolding** note below instead of the software-only scaffolding.
1. What does this product do? (one sentence)
2. Who uses it? (be specific — role, context)
3. What problem does it replace or eliminate?

**Product front-door Q&A** (mirrors the stack Q&A below — its answers feed `pm-architect`, which authors `docs/product.md`):

- **Why does this exist?** (the problem, and for whom — in product language)
- **What is deliberately out of scope for now?** (what you are *not* building yet — e.g. "only dimmable lights so far, no RGB", "single-user, no teams yet")

(`pm-architect` derives "what it does today" from the contracts and architecture itself — you do not need to enumerate features here.)

4. Does your company or team have technology standards? (approved languages, forbidden dependencies, codestyle guide — link or describe key rules)
5. Tech stack? (language, framework, database — and why each choice)
6. Does the project have a UI? Three cases:
   - **Custom UI** (HTML/CSS/components the project builds) → create `docs/ui-guide.md`
   - **Platform UI** (generated forms, admin panels, dashboards provided by a platform — e.g., WB jsoneditor/confed, Django admin, Grafana) → no `ui-guide.md`. Add a "UI pattern" section to `docs/architecture.md` describing what platform surfaces exist and what the project owns (e.g., the JSON schema, the virtual device topics). Add same note to `CLAUDE.md`.
   - **UI planned but not started** → add a note to CLAUDE.md `## Docs` table: `docs/ui-guide.md — not created yet, create when UI work starts`. Do NOT create the file now.
   - **No UI** → skip entirely
7. Any known security requirements? (auth, payments, PII, encryption)
8. **Decision authority** — neutral, default interactive. Ask: "Who makes the product decisions on this project — you, each time (**interactive**), or the pipeline, from your bootstrap + the project's canon (**autonomous**)? Either way, opening and merging PRs always stays with you." Default **interactive** if the PM skips or abstains. See `### Decision authority` in `workflow/decision-authority.md` (the single source of the enum and the `absent file OR unrecognized ⇒ interactive` default — do not re-state them here).
9. **Cross-model review** — default `auto` (cross-model). Ask: "Plan and code run on your session model. Review and audit run on a **different** model by default for independent blind spots (a different model catches what the maker-model misses) — keep that cross-model default (`auto`), pin a specific reviewer (`opus` / `sonnet`), or put review back on the session model (`session`)?" Default **`auto`** (cross-model) if the PM skips or abstains. See `### Cross-model review` in `workflow/review-typology.md` (the single source of the enum, the `absent file OR unrecognized ⇒ auto` default, and the Haiku-blacklist — do not re-state them here).

Then create from templates:

- `CLAUDE.md` from `CLAUDE.md.tmpl` — fill in all placeholders, **including the `## Project kind:` line** from Q0 (default `software` if unanswered). Pipeline section is left with `<test command>` and `<lint command>` as placeholders for now — extended after `pm-stack-researcher` runs. (On `kind = documentation` there is no test/build pipeline to populate — see **Documentation-kind scaffolding** below.)
- `README.md` from `README.md.tmpl`
- `docs/architecture.md` from `architecture.md.tmpl`
- `docs/user-journeys.md` from `user-journeys.md.tmpl` — leave as guided skeleton for PM to fill
- `docs/stack-notes.md` from `stack-notes.md.tmpl` — empty shell; `pm-stack-researcher` fills the components on the next step
- `docs/ui-guide.md` from `ui-guide.md.tmpl` — only if **custom** UI (case 1 above)
- `docs/threat-model.md` — only if Q7 mentioned security. **Do NOT copy the empty `threat-model.md.tmpl` skeleton.** Instead `pm-architect` **drafts a populated** threat-model from the Q7 security answers in the same Section A spawn that authors `architecture.md` + `product.md` (see below). Conditionality preserved: no security in Q7 → no threat-model drafted, nothing scaffolded.
- `docs/features/` directory
- `docs/product.md` — the **authored** product front door. Scaffold from `product.md.tmpl` (the funnel skeleton: `## Why this exists`, `## What it does today`, `## Documents`, `## Features`). It is **not** generated and carries **no** generator signature line. `pm-architect` fills it from the PM's product Q&A answers (see below) — the orchestrator does not hand-write the prose.
- `docs/product-map.md` — the **generated** contract→features map. On a fresh greenfield project there are no contracts yet, so it renders with just the component sections (from `docs/architecture.md`) plus a final `## Infrastructure (no user-facing contract)` section; rows appear as features are planned. Generate via the **Product map generation procedure** below.
- `.ai-pm/decision-authority.md` — write from Q8 (the decision-authority answer): `mode: autonomous | interactive` (default `interactive`) + `veto-window-seconds: 15`. See `### Decision authority` in `workflow/decision-authority.md` for the keys, the default, and the timer-honesty caveat — do not re-encode the default here. This file is created at bootstrap, but no consumer may *require* it: its absence elsewhere ⇒ `interactive` (so every older project is unaffected and no migration is introduced).
- `.ai-pm/review-config.md` — write from Q9 (the cross-model answer): the three model settings `review-diff-model` / `review-full-model` / `audit-model` (default `auto`) + `review-scope: auto`. See `### Cross-model review` in `workflow/review-typology.md` for the keys, the enum, the `absent file OR unrecognized ⇒ auto` default, and the Haiku-blacklist — do not re-encode them here. Created at bootstrap, but no consumer may *require* it: its absence elsewhere ⇒ `auto`. When Q9's answer is a single value (e.g. `opus`, or `session` to opt out), set all three model settings to it unless the PM scoped a specific setting.
- `.ai-pm/state/current.md` from `state.md.tmpl` — initial state set to `Status: idle`; updated by every coder run thereafter
- `.ai-pm/state/archive/` directory — completed task states get archived here
- `.ai-pm/reviews/` directory — review artifacts (plan compliance + code review findings)
- `.ai-pm/arch/` directory — per-feature architecture analysis notes
- `.ai-pm/contracts/` directory — Product Contracts get created here as features are planned (one file per user-facing feature)
- `.ai-pm/research/` directory — research artifacts written by `/pm-research`
- `.ai-pm/audits/` directory — protocol audit reports

**Documentation-kind scaffolding (only when Q0 = `documentation`).** On a `documentation`-kind project (`### Project kind` in `workflow/project-kind.md`), the deliverable is one or several human-facing documents, not code. Adjust the scaffolding:

- **Create the deliverable location, not a forced template:** create the `deliverable/` directory (the `src/`-analogue where the produced document(s) / diagrams / images live — per `### Project kind`). Do **not** author any deliverable file at bootstrap and do **not** drop a template into it — the deliverable is open. **Offer** the optional starters under `.ai-pm/tooling/doc/_templates/starters/` (`sop.md.tmpl` for an SOP / runbook, `guide.md.tmpl` for a reference doc) as a "pick one if it fits, or none"; the first feature's plan decides whether to seed from a starter (then `pm-coder` copies it into `deliverable/` and authors freely).
- **Keep the shared pillars:** `docs/product.md`, `docs/stack-notes.md` (here the **what / who / tools** — the people, instruments, company systems & standards the document must respect, not language idioms), `docs/architecture.md` (constraints / behavioral contract for any token the document names), `docs/user-journeys.md` (reader / operator experience flow), and `docs/threat-model.md` **only if** Q7 mentioned security — all created exactly as above.
- **Skip the software-only scaffolding that has no documentation meaning:** the `CLAUDE.md` `## Pipeline` block carries no `<test command>` / build validators (markdownlint is the structural pre-gate — record it as the validator); the stack-researcher step still runs but documents the what / who / tools the document must respect, not language idioms. `docs/ui-guide.md` is created only on the same UI rule as software (a documentation project rarely has one).
- The `## Project kind: documentation` line in `CLAUDE.md` is what makes the mandatory-table rider, the Pass-2 routing, and the `## Validation` gate fire downstream (all reference `### Project kind` by name).

**WIP doc snapshot (before the first doc-mutating spawn).** The docs above exist on disk but are still **untracked** — so a destructive write to one (an empty `Write` that zeroes it) is unrecoverable, the file simply vanishes. Before spawning any agent that mutates an already-created doc, commit a WIP snapshot on the bootstrap branch so every later state is recoverable via `git checkout <file>`:

```
git add docs/ CLAUDE.md README.md .ai-pm/decision-authority.md .ai-pm/state/current.md && git commit --no-verify -m "chore: bootstrap WIP doc snapshot"
```

(`--no-verify` matches the bootstrap-commit convention below — no test framework exists yet. The P1 hook now denies the destructive empty `Write` outright; this snapshot is the recoverability backstop for anything P1 does not catch — e.g. a tiny non-empty stub that still loses authored content. Closes the untracked-docs window that made the 2026-06-06 doc-loss incident unrecoverable.) **Re-snapshot after each authoring spawn returns** (the same `git add … && git commit --no-verify -m "chore: bootstrap WIP doc snapshot"`), before any refinement or re-spawn that would mutate the just-authored docs.

**Stack literacy onboarding (mandatory, no PM questions).** Spawn the `pm-stack-researcher` agent (`subagent_type: "pm-stack-researcher"`) with the stack components from PM's answers (language, runtime, framework, database, key libraries, target platform). The agent reads canonical docs and spec, writes `docs/stack-notes.md` with cited idioms, constraints, validators and integration contracts.

After `pm-stack-researcher` returns:
- Take its "New validators" list and add each command to the `Pipeline` block in `CLAUDE.md` — these are mandatory gates alongside `<test command>` and `<lint command>`.
- **Wire the AI-specific minimums into the project's `<lint command>` config** using `pm-stack-researcher`'s AI-minimums→linter-rule mapping in `docs/stack-notes.md` (it maps each minimum from `docs/architecture.md` `### AI-specific minimums` to the concrete rule that enforces it — e.g. for Python a pylint config carrying `max-module-lines` / `max-args` / mccabe / `R0801`, ruff and vulture; **examples only — use the mapping for this project's actual stack, never a hardcoded list**). The config parameter *carries* the number (enforcement), it does not re-declare it — the values stay single-sourced in `### AI-specific minimums`. Any minimum the mapping records as **convention-only** (the stack's linter cannot express it) stays AI-review-backstopped, not forced into the config. So a diff that crosses a minimum fails the Pipeline lint step.
- Take its "Open questions" list and surface to PM as a brief technical caveats block (one sentence each, plain language) — PM does not have to act on them now, but they exist on record.
- **Re-snapshot:** `pm-stack-researcher` has authored `docs/stack-notes.md` (and the `CLAUDE.md` Pipeline / lint edits above). Commit the WIP snapshot again (`git add … && git commit --no-verify -m "chore: bootstrap WIP doc snapshot"`) before the next doc-mutating spawn, so the freshly-authored stack notes are recoverable.

**Spawn `pm-architect`** (`subagent_type: "pm-architect"`) **(Section A — canonical architecture.md + authored product.md).** Architect reads PM's stack answers, the freshly-written `docs/stack-notes.md`, and the template at `.ai-pm/tooling/doc/_templates/architecture.md.tmpl`. It walks every template section (Tech stack, Architectural decisions, Architectural constraints, File layout (module map), Integration contract, Behavioral contract (taxonomies & invariants), Release flow), marking N/A sections explicitly (Security, Code conventions, Deploy if not applicable). It cites the bootstrap conversation for each decision rationale. The result replaces the placeholder content created from the template. This is the new owner of `docs/architecture.md` — orchestrator no longer writes architecture inline.

In the same spawn, **pass the PM's product front-door Q&A answers** (why / for whom / deliberately-out-of-scope-for-now). pm-architect authors `docs/product.md` — the funnel front door — from those answers, deriving `## What it does today` from existing contracts (their `## User value`) and architecture components. pm-architect is the sole writer of the authored `docs/product.md`; it never writes the generated `docs/product-map.md`.

**When Q7 mentioned security**, also **pass the Q7 security answers** (assets, adversaries, the obvious threats, the explicit "what we do NOT protect" list) in this same spawn. pm-architect **drafts a populated** `docs/threat-model.md` from `.ai-pm/tooling/doc/_templates/threat-model.md.tmpl` — Assets, Adversaries, Threats rows and the do-NOT-protect list filled, not left as `<placeholders>`; gaps it cannot fill from Q7 → `[?]` (the same discipline Section A uses for architecture). This is how the threat-model is finalized — the orchestrator never copies the empty template. **Conditionality preserved:** no security in Q7 → no threat-model spawned, nothing scaffolded.

**Re-snapshot:** `pm-architect` Section A has rewritten `docs/architecture.md` and `docs/product.md` (and drafted `docs/threat-model.md` when Q7 had security). Commit the WIP snapshot again (`git add … && git commit --no-verify -m "chore: bootstrap WIP doc snapshot"`) before any refinement re-spawn that would mutate these just-authored docs — so a destructive re-spawn write is recoverable rather than lost to an untracked file (the exact 2026-06-06 failure mode).

Then ask PM: "Want to research existing solutions — libraries, ready products, analogues? Useful at the start so you don't build what already exists. Run /pm-research?"

If yes — run `/pm-research` before any feature planning.

Present a brief to PM summarizing what was captured. Follow the PM communication rules in `workflow/pm-comms.md`: plain language, user perspective, no code, no unexplained technical terms.

**What we're building** — one paragraph: problem, solution, for whom. Written from PM's answers, not copied verbatim.

**User** — who specifically, in what context.

**Stack** — the chosen stack with the reasons behind each choice.

**What's defined** — what the docs already contain (architecture constraints, security requirements, UI approach if applicable).

**What's left open** — `docs/user-journeys.md` is a skeleton; user scenarios will be filled in as features are planned.

Then ask: "Does this match your vision? Anything wrong or missing before we start?"

Then run the **Foundational-question pass** (below) before the project is ready for its first feature.

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
- `CLAUDE.md` — fill what's clear from reading; mark gaps as `[?]`. **Write `## Project kind: software`** (legacy adoption reads an existing codebase — `software`; see `### Project kind` in `workflow/project-kind.md`).
- `docs/architecture.md` — stack and key decisions extracted from code; mark gaps as `[?]`
- `docs/user-journeys.md` — write only what's visible from entry points and module names; leave the rest as `[?]`
- `docs/stack-notes.md` from `stack-notes.md.tmpl` — empty shell
- `docs/product.md` — scaffold the **authored** front door from `product.md.tmpl` (funnel skeleton, no generator signature line). `pm-architect` fills it (see below); the orchestrator does not hand-write the prose.
- `docs/product-map.md` — the **generated** map; generate using the **Product map generation procedure** below.
- `.ai-pm/state/current.md` from `state.md.tmpl` — initial state `Status: idle`
- `.ai-pm/state/archive/`, `.ai-pm/contracts/`, `.ai-pm/reviews/`, `.ai-pm/arch/`, `.ai-pm/audits/`, `.ai-pm/research/` directories
- Optional docs — skip; create only if code clearly requires them (e.g., obvious security constraints)

**Stack literacy onboarding (mandatory, no PM questions).** Once stack components are identified from the code, spawn `pm-stack-researcher` (`subagent_type: "pm-stack-researcher"`) with that list. It fills `docs/stack-notes.md`. Take its "New validators" list and add commands to the Pipeline block in `CLAUDE.md`. **Wire the AI-specific minimums into the `<lint command>` config** via its AI-minimums→linter-rule mapping (same as the greenfield stack-setup step above — config carries the numbers, never re-declares them; convention-only minimums stay AI-backstopped). Take its "Open questions" — surface to PM as caveats.

**Authored front door.** Before presenting findings, ask the PM the two product front-door questions (why this exists / what is deliberately out of scope for now), then spawn `pm-architect` (`subagent_type: "pm-architect"`) to author `docs/product.md` from those answers, deriving `## What it does today` from existing contracts and the architecture. pm-architect is the sole writer of the authored `docs/product.md`; it never writes the generated `docs/product-map.md`. If the PM is not ready, leave the scaffolded skeleton for a later `pm-architect` run.

Present findings to PM. Follow the PM communication rules in `workflow/pm-comms.md`: plain language, user perspective, no code, no unexplained technical terms.

**What the product appears to do** — one paragraph from what's visible at the entry points and module names. Be honest about confidence level.

**Who the user seems to be** — inferred from the code structure and naming.

**Main scenarios visible** — what the system clearly supports based on entry points and key modules. Mark anything uncertain.

**Stack** — language, framework, database, key dependencies.

**Gaps** — list all `[?]` items so PM knows what's not yet understood.

Then ask: "Does this match the project? Anything critically wrong?"

Do not ask PM to fill the gaps in detail — `[?]` items get resolved naturally as work on the project progresses.

Then run the **Foundational-question pass** (below) before the project is ready for its first feature.

### Full (complete documentation)

Invoke the `pm-codebase-reader` agent using the Agent tool with `subagent_type: "pm-codebase-reader"`. It reads all significant modules at defined depth and writes raw drafts of `docs/architecture.md`, `docs/user-journeys.md`, and optional docs (`ui-guide.md`, `threat-model.md`). Wait for it to complete and read its summary output.

After the extractor finishes:
- Write `CLAUDE.md` from `.ai-pm/tooling/doc/_templates/CLAUDE.md.tmpl` — fill in all placeholders using the stack and architecture the extractor documented. Pipeline section left as placeholders until `pm-stack-researcher` runs.
- Create `docs/stack-notes.md` from `.ai-pm/tooling/doc/_templates/stack-notes.md.tmpl` (empty shell).
- **WIP doc snapshot (before the first doc-mutating spawn).** `pm-codebase-reader` has drafted `docs/architecture.md`, `docs/user-journeys.md`, and the optional docs, but they are still **untracked** — a destructive write would lose them unrecoverably. Before spawning `pm-stack-researcher` / `pm-architect`, commit a WIP snapshot on the bootstrap branch so every later state is recoverable via `git checkout <file>`: `git add docs/ CLAUDE.md && git commit --no-verify -m "chore: bootstrap WIP doc snapshot"` (`--no-verify` matches the bootstrap-commit convention — no test framework exists yet; closes the untracked-docs window that made the 2026-06-06 doc-loss incident unrecoverable). **Re-snapshot after each authoring spawn returns** (`pm-stack-researcher` after it writes `docs/stack-notes.md`, `pm-architect` after Section A finalizes), before any refinement re-spawn that would mutate the just-authored docs.
- Spawn `pm-stack-researcher` (`subagent_type: "pm-stack-researcher"`) with the stack components the extractor put in `architecture.md` (mandatory, no PM questions). After it returns: extend the Pipeline block in `CLAUDE.md` with its "New validators"; **wire the AI-specific minimums into the `<lint command>` config** via its AI-minimums→linter-rule mapping (same as the greenfield stack-setup step above — config carries the numbers, never re-declares them; convention-only minimums stay AI-backstopped); reflect "Integration contracts" in `architecture.md` deploy section; record "Open questions" for the PM brief below.
- **Spawn `pm-architect`** (`subagent_type: "pm-architect"`) **(Section A)** to finalize `docs/architecture.md` **and `docs/user-journeys.md`** to canonical format, and — passing the PM's product front-door answers (ask the two product questions: why this exists / deliberately out of scope for now) — to author `docs/product.md`. `pm-codebase-reader` produces raw architecture and user-journeys drafts — `pm-architect` is the owner of both and must walk every template section, fill gaps from `stack-notes.md`, mark N/A sections explicitly, and cite each decision; for the journeys it finalizes the draft to canonical form (the draft is the source of truth for facts, the same extractor-drafts / architect-owns handoff as the architecture draft). For `docs/product.md`, it authors the funnel from the PM answers, deriving `## What it does today` from the drafted contracts and architecture. pm-architect is the sole writer of the authored `docs/product.md`; it never writes the generated `docs/product-map.md`. **If `pm-codebase-reader` drafted `docs/threat-model.md`** (security artifacts present in the code — see `pm-codebase-reader.md`), pm-architect **finalizes that draft** to canonical form in this same spawn — the identical handoff it already does for the `architecture.md` draft (extractor drafts, architect owns). Wait for it to complete before presenting to PM. **Re-snapshot once it returns** (`git add docs/ CLAUDE.md && git commit --no-verify -m "chore: bootstrap WIP doc snapshot"`) before any re-invocation of `pm-codebase-reader` / `pm-architect` from PM validation below — so a destructive re-spawn write over the finalized docs is recoverable rather than lost to an untracked file.
- Create `docs/features/` directory if it doesn't exist
- Create `docs/product.md` — the **authored** front door. Scaffold from `product.md.tmpl` (no generator signature line) so `pm-architect` (above) can author it.
- Create `docs/product-map.md` — the **generated** map; generate using the **Product map generation procedure** below.
- Create `.ai-pm/state/current.md` from template (`Status: idle`), `.ai-pm/state/archive/`, `.ai-pm/contracts/`, `.ai-pm/reviews/`, `.ai-pm/arch/`, `.ai-pm/audits/`, `.ai-pm/research/` (pm-codebase-reader already drafted contracts into the contracts/ directory — surface their count and `(needs PM validation)` markers in the PM brief)

Present to PM. Follow the PM communication rules in `workflow/pm-comms.md`: plain language, user perspective, no code, no unexplained technical terms. Structure as follows:

**What the product does** — one paragraph, no jargon. What problem it solves, for whom.

**Who the user is** — specific role and context, not "end user".

**Key user scenarios** — the main things a user can do, numbered list. Each in one sentence from the user's perspective ("User imports a price list from XLS → system maps columns → prices update in the catalog").

**How it's structured** — ASCII diagram of the main components and how they connect. Show data flow, not file tree.

**What we're not sure about** — take this from the extractor's "Judgment calls" list. These are the items PM should pay attention to.

Then ask: "Does this match how you understand the system? What's wrong or missing?"

PM's role is validation only — confirming accuracy, not filling gaps. If PM points out something wrong — re-invoke `pm-codebase-reader` with a focused prompt: "Re-read [module], current docs say X but PM says Y."

Result: docs complete enough to plan porting without opening the legacy codebase again.

After PM validates — tell PM:

> "Documentation is ready. We can either start working on the project with the current stack, or port to a new one — that's a significant separate undertaking. What's next?"

If PM says porting — run the porting procedure below. Otherwise run the **Foundational-question pass** (below) before the project is ready for its first feature.

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

## Product map generation procedure

Used by bootstrap (all modes) and by `/pm-plan` to regenerate `docs/product-map.md` — the PM-facing, contract-centric map of what the application does. It is **generated, never hand-filled**: every run rebuilds it from the source files (`.ai-pm/contracts/`, `docs/features/`, `.ai-pm/reviews/`, git). `docs/product-map.md` lives at the docs root, so links are `features/<topic>_plan.md` and `../.ai-pm/...`.

> **This procedure writes only `docs/product-map.md`; it never creates or edits the authored `docs/product.md`.** The authored front door is owned by `pm-architect`; this generated map and that authored funnel are separate files that never share a writer.

### Structure: group → contract → features

1. **Group** — read `docs/architecture.md`, extract the major components/subsystems. Each becomes a `## <Component>` section.
2. **Contracts** — for each `.ai-pm/contracts/<name>.md`, place a block under the component it serves (match by the contract's subject / architecture component):
   - Heading is a **clickable markdown link** to the contract file followed by the status label: `### [<Contract name>](../.ai-pm/contracts/<name>.md) — <status>` — status `live` (default) or `deprecated` if the contract says so. Do not print a raw backtick path; the name itself is the link.
   - **Lead with the product-language value lines as a markdown bullet list, before any table** (bullets render on separate lines in every renderer; two adjacent plain lines would collapse into one paragraph on GitHub):
     - `- **User value:**` one line taken from the contract's `## User value` section (the human, product-language promise — **not** the technical first `Must work` item).
     - `- **Out of scope:**` a compact projection of the contract's `## Out of scope` bullets — join them into a short single line (keep up to the first couple of bullets if the list is long). **Omit this bullet entirely** when the contract has no `## Out of scope` content (empty or absent section) — do not emit an empty `Out of scope:` bullet.
   - Then the build-history table under a plain `Built by:` label line (**pure markdown, no HTML** — no `<details>`): the features that built or changed the contract, read from its **Built/changed by** list. `Done` = `git log --follow --diff-filter=A --format="%Y-%m-%d" -- .ai-pm/reviews/<topic>_review.md` (else `—`); `Review` = `[R](../.ai-pm/reviews/<topic>_review.md)` if it exists, else `—`.
3. **Infrastructure bucket** — a final `## Infrastructure (no user-facing contract)` section listing every `*_plan.md` in `docs/features/` not referenced by any contract's Built/changed by list (backend / infra features). It has no contract, so it carries **no** `User value` / `Out of scope` lines and **no** `Built by:` label — just its existing plain table.
4. Sort contracts alphabetically within a component; sort feature rows by `Done` (newest last).
5. **One feature, many contracts — render once.** A single feature can appear in several contracts' `Built/changed by` lists (it built or changed all of them). Render that feature's row **fully once** under the first contract (alphabetical order) where it appears; under every subsequent contract, render the feature as a single marked line `↑ same work` instead of a repeated full row, so the PM sees the shared work without duplicate Done/Review columns.

### Status legend

The map opens with a one-line legend so the status labels are self-explanatory (no bare jargon):

```markdown
> Status: **live** — contract is in force · **deprecated** — superseded, kept for history.
```

Do **not** print a generator-mechanics header ("Source of truth = contracts. Generated, not hand-filled.") — that is internal plumbing, not PM-facing.

### Output format

```markdown
# Product map — what the system does, by contract

> Status: **live** — contract is in force · **deprecated** — superseded, kept for history.

## <Component>

### [<Contract name>](../.ai-pm/contracts/<name>.md) — live

- **User value:** <one line from the contract's `## User value` section>
- **Out of scope:** <compact projection of the contract's `## Out of scope` bullets — omit this bullet when there is no Out of scope>

Built by:

| Feature | Done | Review |
|---|---|---|
| [topic](features/topic_plan.md) | 2025-10-15 | [R](../.ai-pm/reviews/topic_review.md) |

## Infrastructure (no user-facing contract)

| Feature | Done | Review |
|---|---|---|
| [build-pipeline](features/build-pipeline_plan.md) | 2025-09-02 | [R](../.ai-pm/reviews/build-pipeline_review.md) |
```

### Worked example

Two contracts (`dimmer-control`, `scene-recall`) live under a "Lighting" component; one feature (`bus-failover`) is backend-only. The feature `scene-engine` built **both** `dimmer-control` and `scene-recall`, so it is rendered fully under `dimmer-control` (alphabetically first) and marked `↑ same work` under `scene-recall`:

```markdown
# Product map — what the system does, by contract

> Status: **live** — contract is in force · **deprecated** — superseded, kept for history.

## Lighting

### [dimmer-control](../.ai-pm/contracts/dimmer-control.md) — live

- **User value:** A user can smoothly dim any connected dimmable light from the app, and the brightness it shows always matches the lamp.
- **Out of scope:** no RGB or colour-temperature control; non-dimmable fixtures are out of scope.

Built by:

| Feature | Done | Review |
|---|---|---|
| [dimmer-mvp](features/dimmer-mvp_plan.md) | 2025-09-10 | [R](../.ai-pm/reviews/dimmer-mvp_review.md) |
| [scene-engine](features/scene-engine_plan.md) | 2025-10-15 | [R](../.ai-pm/reviews/scene-engine_review.md) |

### [scene-recall](../.ai-pm/contracts/scene-recall.md) — live

- **User value:** A user can save the current lighting as a named scene and bring it back with one tap.
- **Out of scope:** no scheduled or location-triggered scenes; scenes are not shared between users.

Built by:

| Feature | Done | Review |
|---|---|---|
| [scene-engine](features/scene-engine_plan.md) — ↑ same work |  |  |

## Infrastructure (no user-facing contract)

| Feature | Done | Review |
|---|---|---|
| [bus-failover](features/bus-failover_plan.md) | 2025-09-02 | [R](../.ai-pm/reviews/bus-failover_review.md) |
```

---

## Foundational-question pass (after the product Q&A, before the first feature)

After the product Q&A is captured and `pm-architect` has authored `docs/product.md` (and `docs/architecture.md`), and **before** the project is treated as ready for its first feature, run the bootstrap product-readiness check. This is the project-birth, once-per-project counterpart to the `/pm-plan` Step 3.5 gate — it forces the zero-to-working story rather than letting an under-specified product proceed straight to feature work.

1. **Spawn `pm-product-advocate`** (`subagent_type: "pm-product-advocate"`) with tier `bootstrap`, the recorded product Q&A answers, `docs/product.md`, and `docs/architecture.md`. It matches them against the **bootstrap tier** of `### Foundational product questions` in `workflow/foundational-questions.md` (referenced by name; never re-list the questions here) and writes `.ai-pm/reviews/bootstrap_advocate.md` with a `gaps: N` / `clean` verdict.
2. **`clean` → silent pass.** Record the resolved artifact and continue to "After initialization".
3. **`gaps: N` → one relay pass.** Relay all N gap questions to the PM in **one** `AskUserQuestion` pass (never per-question tool-spam). For each gap the PM either answers it or consciously descopes it with a rationale. Record **each gap** as a numbered entry — one entry per gap, in gap order, matching the gap's number — in the artifact's `## Resolutions` trail below `## Verdict`, so the `gaps: N` ↔ N-resolutions count-match the backstops perform is mechanical. The answers belong in the bootstrap product docs — their owners record them (`pm-architect` for `docs/product.md` / `docs/architecture.md`); re-spawn the owner with the PM's answers when an answer should land in a doc.

This pass forces the **questions** only. It does **not** auto-draft a populated `docs/user-journeys.md` from the answers — that is a separate deferred feature; keep it out of scope here.

## After initialization

Tell PM: "Project initialized. Describe a feature and I'll help plan it."

Do NOT start planning a feature until PM explicitly asks (interactive mode — in autonomous mode the first feature is derived and announced, see the autonomous branch below).

**Autonomous branch (`### Decision authority` in `workflow/decision-authority.md`).** **Read `workflow/decision-authority.md` before deriving the first feature** (it carries the derivability test and the escalate-regardless cap this branch executes). When the effective authority is `autonomous`, the first feature is not relayed: derive it from the bootstrap mandate (and any seeded backlog), announce it on the announce-before-act line, and proceed into `/pm-plan` — per the feature-selection scope of `### Decision authority` (referenced by name; do not re-encode the enum/default or the selection rule). Escalate (one `AskUserQuestion`) only when the mandate yields no derivable first feature — an expected, healthy bootstrap escalation, not a defect.

---

## Setup (run once when connecting template to a new repo)

If `.claude/agents/` and `.claude/commands/` don't exist or aren't linked yet:

```bash
git submodule add git@github.com:wirenboard/ai-pm-protocol.git .ai-pm/tooling
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
