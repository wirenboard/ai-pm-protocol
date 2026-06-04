> **This file is the canonical orchestration spec** — read by agents and downstream `CLAUDE.md` via `@.ai-pm/tooling/WORKFLOW.md`. For a friendlier overview of the protocol (Russian, marketing-level) see `README.md`. When the two documents disagree, this one wins.

## Workflow agents and commands

### Agents (`.claude/agents/`)

Spawned by the orchestrator — do not run manually. Use only these — do not substitute with similarly-named agents from other toolsets (a `PreToolUse` guard in `.claude/settings.json` denies the known `wb-*` role duplicators automatically — see **Hook-level enforcement** below):

| Agent | When |
|---|---|
| `pm-stack-researcher` | Auto-spawn from `/pm-bootstrap` (initial stack onboarding) or from `/pm-plan` (when a feature touches a stack component not yet in `docs/stack-notes.md`). Reads canonical docs + spec, writes cited rules into stack-notes |
| `pm-architect` | Structural choice in the plan — where does new code live? Plus: owns canonical `docs/architecture.md` **and `docs/user-journeys.md`** (creates/finalizes at bootstrap, refreshes on audit findings, updates on decisions and per-feature journey changes, fills doc gaps spawned from `/pm-plan`). |
| `pm-product-advocate` | Pre-coding product-readiness gate on **user-facing** features — spawned from `/pm-plan` after the plan is approved and the contract drafted, before the coder handoff. Also the `/pm-bootstrap` foundational-question pass. Independent product-axis referee (the `code-review` twin): matches the plan/contract/product docs against `### Foundational product questions` and reports the gaps; never talks to the PM, never judges answer quality. |
| `pm-coder` | Implement the plan |
| `pm-plan-checker` | Plan compliance after implementation — verifies all scenarios implemented, contracts honored, interaction scenarios tested, DoD satisfied |
| `pm-pr-prep` | Bump version, generate CHANGELOG, push branch, open or update PR |
| `pm-codebase-reader` | Auto-spawn from `/pm-bootstrap` legacy full mode; existing-codebase raw-drafter — reads the codebase and writes raw drafts of `docs/architecture.md` + `docs/user-journeys.md` (+ optional docs), each finalized by `pm-architect`. Standalone = bootstrap-validation code re-read only. |
| `pm-auditor` | Auto-spawn from `/pm-audit`; protocol compliance sweep — checks artifact completeness, plan↔implementation parity, contract currency, docs currency. Writes `.ai-pm/audits/audit-<YYYY-MM-DD>.md` and returns a structured summary. Does NOT review technical code quality — that is pm-plan-checker + code-review per feature. |

### Commands (`.claude/commands/`)

Run in the main orchestrator session:

| Command | When |
|---|---|
| `/pm-bootstrap` | Initialize a new or legacy project — create docs structure, spawn pm-stack-researcher and pm-architect. |
| `/pm-plan` | Plan a feature, fix, or non-trivial change. Initializes execution state; handles hotfix mode. |
| `/pm-research` | Research existing solutions and analogues (build vs use). PM-facing pros/cons output. Different from `pm-stack-researcher` (which is agent-facing canonical citations). |
| `/pm-audit` | PM-initiated protocol compliance check. Orchestrator auto-decides scope: full (all features) or diff (since last audit) — based on last audit date and feature count; never asks PM. Spawns `pm-auditor`, drives a PM-facing finding loop (fix now / next sprint / accept-with-context). Full scope offered after `/pm-audit` completes as optional `code-review ultra`. |
| `/pm-fixup` | Fast path for trivial changes (≤ 50 lines, no behavior change, no stack-notes touch, no new code file). Skips `/pm-plan`; goes directly to `pm-coder` + `pm-plan-checker` in trivial mode. Falls back to `/pm-plan` if any condition fails. |

`code-review` (built-in Claude Code skill) — full technical quality sweep: bugs, security, dead code. Use `ultra` level for deep multi-agent review. Runs automatically as Pass 2 in the review loop after every feature; offered as optional deep sweep after `/pm-audit`.

**Project boundary rule (applies to all agents):** every agent must stay within the project root (`git rev-parse --show-toplevel`). Never search, read, or write outside it — no parent directories, no sibling repositories. When the orchestrator spawns an agent, include the absolute project root in the prompt if the working directory may be a subdirectory.

**Edit-ownership rule (applies to the orchestrator inside the local repo):** the orchestrator legitimately writes the **outputs of the processes it drives** — the PM conversation produces the backlog and (via `/pm-plan`) the contracts; `/pm-plan` produces the plan; running `code-review` produces the Pass-2 code-review trail; finding a structural protocol gap produces a protocol-feedback report. What it never does is **freehand-edit canon owned by an autonomous agent**. Agent-owned content artefacts are anything that captures the project's design, code, or canon — source code, schemas, manifests, `docs/architecture.md`, `docs/user-journeys.md`, `docs/stack-notes.md`, feature plans under `docs/features/`, the **plan-compliance verdict** of a review artifact under `.ai-pm/reviews/` (everything through `## Verdict`, owned by `pm-plan-checker`), the **product-readiness gap report** `.ai-pm/reviews/<topic>_advocate.md` / `bootstrap_advocate.md` (everything through `## Verdict`, owned by `pm-product-advocate`), arch notes under `.ai-pm/arch/`, audit reports under `.ai-pm/audits/`. Each of those has an agent that owns it (`pm-coder`, `pm-architect` — including `docs/user-journeys.md`, `pm-stack-researcher`, `pm-codebase-reader`, `pm-auditor`, `pm-plan-checker`, `pm-product-advocate`, `pm-plan` as a command). When one needs to change — even by one line — the orchestrator respawns the responsible agent with a focused prompt, not picks up the editor itself.

**The one carve-out inside `.ai-pm/reviews/<topic>_review.md`:** `pm-plan-checker` owns everything through `## Verdict`; the orchestrator owns ONLY the `## Code review findings` / `## Code review` trail below it — the Pass-2 code-review record it writes in Step 5 Pass 2. This is the **single** review section the orchestrator writes and the **only** exception to "the orchestrator does not edit content artefacts". It is the output of a process the orchestrator drives (it runs `code-review` and already holds the findings) — routing that data through an agent would pay a hop for data already in hand. The exception is made safe by a **gate, not by discipline**: `pm-pr-prep` refuses to release a feature whose `## Code review` section is unstamped (step 0), and `pm-auditor` blocks an unstamped trail (dimension 1). A manual step with no gate degrades silently — so this one has a gate.

**A second carve-out, in `.ai-pm/reviews/<topic>_advocate.md` (and `bootstrap_advocate.md`):** `pm-product-advocate` owns everything through `## Verdict`; the orchestrator owns ONLY the `## Resolutions` trail below it — the recorded PM answer / descope-with-rationale for each gap, one numbered entry per gap, the output of the one `AskUserQuestion` pass it drives. Like the Pass-2 code-review trail, it is the output of a process the orchestrator drives (it holds the PM's answers in hand from that pass), and it is made safe by a **gate, not by discipline**: `pm-plan-checker` (DoD) and `pm-auditor` (dimension 1) block a user-facing feature whose advocate gate is unresolved. A `clean` verdict (zero gaps) needs **no** `## Resolutions` trail — `clean` and `gaps: N`-with-N-resolutions are the two resolved states. In `autonomous` mode (`### Decision authority` in `WORKFLOW.md`) each entry additionally carries an **`auto` | `escalated`** marker (an interactive answer is the unmarked baseline); the trail stays orchestrator-owned and gate-backed, the `gaps: N` ↔ N-resolutions count-match is unchanged, and a `clean` verdict still needs no trail.

**Orchestration artefacts** are different: they are the by-products of the orchestrator's own job of talking to the PM and routing work. `.ai-pm/backlog.md` entries, recording PM decisions, the Pass-2 code-review trail just described, protocol-gap reports under `.ai-pm/protocol-feedback/` (see "When the protocol itself has a gap"), choosing remediation order for audit findings, kicking off git operations (commits, branches, tags, push), and invoking the project's own deployment script — all of these are normal orchestrator work. Spawning a separate "backlog-curator" agent for these would be overhead with no upside.

The line: if it captures product design or technical canon an autonomous agent owns, that agent writes it. If it is the output of a process the orchestrator drives — the conversation with the PM, the plan, the code-review trail, a protocol-gap report — or moves work through the pipeline, the orchestrator writes it.

**Remote-system boundary rule (applies to all agents and the orchestrator):** the rule is about **the source of truth**, not about whether ssh-with-write is allowed at all. Production code, configs, schemas, manifests and infrastructure files that **the project owns in git** must change through git — never by editing the file in place on a remote system. Everything else (runtime state, deployment actions, dev experiments, PM-initiated maintenance) is fair game.

**Forbidden:**
- Silently editing on a remote system a file that has a counterpart in the repo (a schema in `/usr/share/.../schemas/`, a config template in `/etc/`, code under `/opt/`, a unit file, a Kubernetes manifest). Even if the fix looks tiny and obvious — that path destroys the git source of truth, the next firmware update or container rebuild reverts it, and the next feature will plan against the in-repo state which silently disagrees with reality.
- Restarting / mutating production state without PM's awareness while investigating a "doesn't work in prod" report. The diagnose flow stays read-only until the fix is planned. Once the plan is in motion and the PM has agreed, the deployment script can do whatever it does.

**Allowed:**
- Read-only diagnostics: logs, statuses, file content reads, `journalctl`, `systemctl status`, `docker logs`, native audit / health commands, `tcpdump`, `strace` — anything that observes without changing files the repo owns.
- Mutating actions on dev or staging environments as part of normal development workflow: build, scp a feature-branch artifact, smoke-test on real hardware before opening a PR.
- Mutating actions on production **when the PM has explicitly asked for them in this conversation**: a requested reboot, package upgrade, factory reset, pairing operation. These are product decisions, not silent fixes.
- Operations on runtime state that does not live in the repo: clear caches, restart a service to pick up a new package, rotate logs, manage pairing / fabric credentials, MQTT messages to virtual controls.
- Running the project's own deployment script / playbook / CI step — that is the canonical change channel and is reviewed code already.

The bright line: **if the file you're about to touch on a remote system has a sibling in the repo, the change goes through git first.** Otherwise it's a runtime / deployment action — proceed with the usual product caution (back up before destructive ops, ask PM before anything irreversible).

**Audit-to-fix transition rule.** After `/pm-audit` completes, the orchestrator must not silently load `/pm-plan` and start planning. Two valid paths:
- PM goes through the per-finding loop (step 4 in `pm-audit.md`): one question per finding → explicit "fix now / next sprint / accept-with-context" → then /pm-plan for each "fix now" in order.
- PM gives a blanket "fix it" / "исправь" / "go ahead" after the summary → orchestrator confirms the full list ("I'll fix N findings in order: 1. X, 2. Y, 3. Z. Starting with #1.") and proceeds in priority order.

In both cases the PM sees what will be fixed before the first `/pm-plan` loads. What is forbidden: loading `/pm-plan` without showing PM the finding list — that removes PM from the triage decision entirely.

**Hook-level enforcement.** The rules above are also enforced as Claude Code `PreToolUse` hooks shipped in `.claude/settings.json`, so they hold even if a future session does not re-read this file:

- `ssh ... sed -i / vi / vim / nano / tee / > file` on a remote host — **denied** automatically (direct content edit; this is the silent-fix path the rule is designed to block).
- `ssh ... systemctl restart / docker compose / docker exec / apt / npm install / kubectl apply / rm / cp / mv / mkdir / touch` on a remote host — **asked** for confirmation (legitimate when it is deployment, PM-initiated maintenance, or runtime-state work; the prompt makes that intent explicit).
- `git push --force / -f / --force-with-lease` — **asked** (rewrites remote history).
- `git commit --no-verify / --no-gpg-sign` — **asked** (bypasses pre-commit / signing).
- Spawning a `wb-*` role agent or loading a `wb-*` role skill that occupies a protocol seat (`wb-development:coder` / `code-reviewer` / `design-review` / `pr-prep` / `plan-feature`, `wb-git:workflow` / `pr-author`) — **denied** automatically, with a pointer to the `pm-*` equivalent. This is the mechanical form of the "use only these agents" rule above. It is a **named deny-list, never an "everything but `pm-*`" block**: built-in engines (`code-review`, `deep-research`) and `wb-*` knowledge skills (`codestyle`, `package-bootstrap`, platform skills) are explicitly not gated — the protocol delegates engines and platform knowledge to them on purpose.

On every change-intent prompt a `UserPromptSubmit` hook injects a one-paragraph reminder of this route (Step 0 → `/pm-plan` → coder → review → pr-prep; orchestrator does not edit content artefacts; use `pm-*`, not `wb-*` role skills). It stays silent on ordinary conversation. This is the soft, every-turn counterpart to the hard PreToolUse guard above — it keeps the protocol asserted without depending on a session re-reading this file.

Read-only ssh diagnostics (`cat` for reading, `ls`, `journalctl`, `systemctl status`, `docker logs`, `docker ps`, native status / audit / info commands) are not gated. Local mutating commands (anything not over ssh) are not gated either — they are normal dev work.

Throwaway/diagnostic scripts go in `.claude/tmp/` (inside the project root, so they pass the path-boundary hooks), not `/tmp`. The directory is git-ignored — it is scratch, never committed.

Hooks themselves are tested by `tests/hooks.sh`, gated by `.github/workflows/lint-hooks.yml` on every PR that touches the hooks or their tests. A regex regression now fails CI rather than silently degrading the gate.

**Git workflow — orchestrator owns this, not subagents:**

```
git checkout main && git pull          # always start from current main
git checkout -b feature/<topic>        # fresh branch — one branch per PR
                                       # (may contain one or several features)
... implement, commit ...
pr-prep                                # CHANGELOG + version + push + PR
merge on GitHub                        # GitHub squashes
git checkout main && git pull          # back to main, ready for next branch
```

Never reuse a branch across multiple PRs. Never commit "resolve merge conflicts" — if conflicts appear, the branch is stale; cut a fresh one from main.

---

## How I work

**If `docs/` doesn't exist yet** — I'll ask you a few questions and set up the project documentation before we do anything else. You don't need to run any commands.

When you describe a feature or bug:

**Step 0 — Check git state.** Before anything else:
- Run `git branch --show-current` and `git status`.
- If on `main` → create a feature branch: `git checkout -b feature/<topic>`.
- If on an existing feature branch → ask the user: "We're on branch `<branch>`. Continue here (add this feature to the same PR) or cut a fresh branch?"
- If working tree is dirty → ask the user to commit or stash first.

**Step 1 — I read the project context first.** `docs/architecture.md`, `docs/user-journeys.md`, `docs/features/`. No questions until I understand what already exists.

**Step 2 — We plan together.** I ask clarifying questions grounded in the architecture and existing scenarios. Then I show you the plan in plain language — scenarios, what changes for users, what must not break — and ask: does this match what you want?

**Step 3 — I show you the architecture decision (if one was needed).** If the plan had a structural question (where does new code live?), I'll explain what was decided and why — in plain language, with a diagram if it helps. You can push back.

**Step 3.5 — Product-readiness gate (user-facing features only).** After the plan is approved and the Product Contract drafted, and before the coder handoff, I run an independent product check on user-facing features. "User-facing" is decided by the same human-role-subject extraction `pm-auditor` uses (the grammatical subject of the scenarios is a human role); backend / infrastructure / docs-only / trivial-fixup / diagnostic-probe changes are **exempt** — the gate does not run at all, no advocate spawn, no artifact required.

For a user-facing feature I spawn `pm-product-advocate` (tier `per-feature`). It matches the plan + contract + `docs/product.md` + `docs/user-journeys.md` against `### Foundational product questions` (below) and writes its gap report with a `gaps: N` / `clean` verdict.

- **Zero gaps (`clean`)** — silent pass. I record the resolved artifact and proceed to Step 4; no `AskUserQuestion`, no ceremony.
- **Gaps (`gaps: N`)** — I relay all N gap questions to you in **one** `AskUserQuestion` pass. For each gap you either answer it or consciously descope it with a rationale. I record each answer/descope as a numbered entry in the artifact's `## Resolutions` trail. The coder handoff stays **blocked** until every gap is answered or descoped — never a silent skip, never a permanent veto.

**Autonomous branch (additive — fires only when the effective authority is `autonomous`; see `### Decision authority` in `WORKFLOW.md`).** The advocate spawn is **unchanged** — same prompt, same `clean` / `gaps: N` verdict. When the effective authority for this feature is `autonomous` (per-feature plan `Decision authority:` line → `.ai-pm/decision-authority.md` `mode:` → `interactive`), the orchestrator handles a `gaps: N` verdict differently:

- For each gap I run the **derivability test** (`### Decision authority`): is the answer derivable from cited project canon + the bootstrap mandate?
- **Derivable** → I **announce** it (fork · chosen option · rationale citing the canon ref · invariants · `(proceeding — interrupt to override)`), then record an `auto` `## Resolutions` entry carrying the cited passage + rationale, committed before acting. No `AskUserQuestion` for this gap.
- **Not derivable, OR a `### Security-relevant surfaces` item on a security-bearing project, OR a PM-marked irreversible / high-stakes fork** → I escalate it (the cap): record an `escalated` `## Resolutions` entry and add it to the escalation set.
- The **escalation set** is what reaches the existing **one** `AskUserQuestion` pass (the interactive path, narrowed to just the escalations). An **empty escalation set ⇒ fully silent** — announcements only, no `AskUserQuestion`.

The interactive branch above is **byte-unchanged** (and is every existing project, by the default). This autonomous path is purely additive, and merge/ship still stays manual in both scopes.

A bootstrap variant of this gate runs once at `/pm-bootstrap` (tier `bootstrap`) — see that command. This is soft enforcement, backstopped (not by-discipline): `pm-plan-checker`'s DoD blocks a user-facing feature whose advocate gate is unresolved, and `pm-auditor` blocks a merged user-facing feature with no resolved advocate artifact. There is **no hook** — "is this user-facing / is the product under-specified" is a semantic judgement a regex cannot make.

**Step 4 — Coder implements.** Works on a feature branch, commits atomically as it goes, runs pipeline, never touches existing tests.

If the plan's **Docs to update** section is non-empty — before starting the review loop, spawn the owning agent with a focused prompt: `pm-architect` for `docs/architecture.md` **or `docs/user-journeys.md`** changes (pm-architect owns both). This satisfies DoD item 8 before pm-plan-checker runs.

After coder (and any doc agents) finish, I tell you:
- What the feature now does (user perspective, no code)
- How to try it yourself step by step
- Anything that needs your attention

**Step 5 — Review loop.** Two sequential passes. You don't see either — they run until both pass, then you hear the result.

**Pass 1 — Plan compliance** (`pm-plan-checker`): are all plan scenarios implemented and tested? contracts honored? interaction scenarios covered? DoD satisfied? Writes `.ai-pm/reviews/<topic>_review.md`.
- Blocking → `pm-coder` fixes → pass 1 re-runs. Repeat until clean.

**Pass 2 — Technical quality** (`code-review`): bugs, security, dead code, simplifications. Only starts after pass 1 is clean. **Pass 2 routes on project kind** (`### Project kind` in `WORKFLOW.md`): on a `software` project (and every kind-absent project) it runs `code-review` exactly as described below — unchanged. On a `documentation`-kind project it instead runs **editorial review + the structural-lint pre-gate + the `## Validation` gate** (see the **No-code validation discipline** under `### Project kind`); the `## Validation: NOT YET RUN → <date> — <method> — passed` stamp replaces the `## Code review` stamp as the load-bearing marker, enforced at the same `pm-pr-prep` step 0 / `pm-auditor` dimension 1 gates.
- The review file is **born with a loud marker** — `pm-plan-checker` writes the section as `## Code review: NOT YET RUN`, never an empty `## Code review` heading. An empty section reads as "no findings / passed" to a quick eye or `grep`; a loud marker reads as "not done". A skeleton that looks filled is worse than an absent one.
- Orchestrator runs `code-review`, takes findings from the output, and appends them to `.ai-pm/reviews/<topic>_review.md` as `## Code review findings` — so `pm-coder` has a persistent artifact to read.
- `pm-coder` reads `.ai-pm/reviews/<topic>_review.md`, fixes the code-review findings, commits.
- Orchestrator re-runs `code-review` to verify clean. Repeat until no findings.
- When clean: orchestrator **replaces the `## Code review: NOT YET RUN` line** with `## Code review: <date> — passed`.
- **Pass 2 is NOT complete until the stamp is written.** This is load-bearing, not by-discipline: `pm-pr-prep` refuses to release a feature whose `## Code review` section is unstamped (Step 6 / `pm-pr-prep` step 0) and `pm-auditor` blocks on it (dimension 1). The binary "is the trail done?" is therefore checked at the **gate — after the last action** — not folded into the Pass-1 Definition of Done, which is signed *before* this trail exists. A manual step with no gate degrades silently; this is that gate.

Once both passes clear, I surface only what requires a product decision:

- **Product notes** (something that affects what the user sees or changes scope) — I present each one: fix now, add to backlog, or ignore?
- **Nothing to decide** → I go straight to step 6.

After the loop clears, I tell you:
- What the feature now does (user perspective, one paragraph)
- How to try it yourself (step by step)
- Any product notes that need your answer

**Step 5.5 — Optional: run it for real.** When the feature is runnable locally, before ship I can invoke the built-in `verify` / `run` skill to actually launch the app and exercise the new behaviour — confirming it *works*, not just that tests pass. This catches the "green tests, broken feature" class. I report what I observed. For features that need real hardware or your specific environment I skip this and give you the checklist instead (Step 6 option A). Before I exercise anything on real hardware, I run the **Blast-radius preflight** (see "When you say it doesn't work in production"): if the target is coupled to a live external system whose state a local revert won't undo, I stop and surface the blast radius to you before acting — whether I'm about to exercise the behaviour myself or hand over the checklist.

**Step 6 — Ship.** I verify git state, then ask:

> "Ready to open the PR. How do you want to proceed?
> A) **Test first** — I deploy and give you a checklist of what to verify.
> B) **Open PR, test before merging** — you test from CI artifacts or the branch, then merge.
> C) **Ship now** — open PR, merge straight away."

I wait for your answer before running `pm-pr-prep`. After merge: `git checkout main && git pull`.

I never add anything to `.ai-pm/backlog.md` without an explicit yes from you (product note backlog) or a clear technical reason recorded alongside the entry. The backlog is an orchestration artefact — I write it directly.

`.ai-pm/backlog.md` is created on first use — not upfront.

After you merge: pull main locally and we're ready for the next feature. **When the effective authority is `autonomous` and `.ai-pm/backlog.md` has open items**, instead of waiting for you to name the next feature I select-announce-proceed per `### Decision authority` in `WORKFLOW.md` (the feature-selection scope) — escalating only when it directs.

**When you're ready to ship** — say "release". I verify git state, run `pm-pr-prep` (version bump + CHANGELOG + PR). You merge — GitHub auto-tags and publishes the release.

**Step 7 — When the PR gets review comments.** A human reviewer (or `code-review --comment`) may leave comments on the open PR. I run a response loop on the **same branch and PR** — you only hear about comments that change product scope:

1. **Fetch the threads** — `gh pr view <n> --comments` plus `gh api repos/{owner}/{repo}/pulls/{n}/comments` for inline threads. I read every unresolved one.
2. **Triage each** (I decide; I involve you only when product scope is at stake):
   - **Needs a code change** → I spawn `pm-coder` with the thread as a focused task; it fixes on the same branch, runs the pipeline, commits.
   - **Question** → I answer in a reply; no code change.
   - **Reviewer asks for behaviour the plan/contract didn't cover** → that is a product decision: I bring it to you (AskUserQuestion) before acting; it may need a plan update.
3. **Push and respond** — after the fixes land I push, reply to each thread with what changed (or why not), and resolve the threads I addressed.
4. **Re-run the review loop** (`pm-plan-checker` + `code-review`) if the fixes were non-trivial, before asking for re-review.

This is the protocol's own PR-review-response path — platform-agnostic, all `gh`. I never cut a new branch for review fixes, and I never reach for `wb-git:pr-author` / `wb-git:pr-review` to do it (they are denied by the agent/skill guard; `pm-pr-prep` owns opening/updating the PR, I own the comment loop).

---

## What is mandatory when

Different change types impose different overhead. This table is the single source of truth for what's required and what can be skipped. Coder and reviewer read it once instead of hunting through inline conditions.

| Change type | Execution State | Product Contract | Definition of Done | Stack expectations |
|---|---|---|---|---|
| User-facing feature (new behavior, new UI, new public API) | required, update each step | required (create or update + Product Impact Report from coder) | yes, all 7 items | required if stack touched |
| Backend refactor / infrastructure / build / CI | required, update each step | skip with one-line reason in commit message | yes, items 1, 2, 4, 5, 7 | required if stack touched |
| Docs-only fix (typo, wording, README, plan, review trail) | optional (set Status: done at end) | skip | yes, items 1, 4, 7 | skip |
| Trivial fixup (see `/pm-fixup` rules) | skip | skip | trivial DoD: scope + pipeline + docs landed | skip |
| Diagnostic probe / spike (PM-authorized, runtime/local only) | skip | skip | skip — throwaway, reverted or followed by a pipelined fix (the Blast-radius preflight still applies — a coupled live target is stop-and-surface, even for a skip-all probe) | skip |

**"Skip with one-line reason"** means coder writes in the commit message `Skips Product Contract: backend-only refactor, no user-visible behavior change`. `pm-plan-checker` accepts the skip if the line is present and honest; absence of the line on a backend change → blocking.

**"Set Status: done at end"** means coder writes the state file once in the closing commit, doesn't update it mid-task. For docs-only fixes the state is essentially a record that the change happened.

**Product-readiness rider:** a **user-facing feature** (the first row — its scenario subjects are a human role, the `pm-auditor` extraction) additionally requires the **product-readiness gate** to be resolved before the coder handoff — `pm-product-advocate` run (tier `per-feature`), every `### Foundational product questions` gap answered or descoped, the `.ai-pm/reviews/<topic>_advocate.md` artifact carrying a `clean` or `gaps: N`-with-N-resolutions verdict. See **Step 3.5** above. The other rows — backend / infrastructure / CI, docs-only, trivial fixup, diagnostic probe — are **exempt** by the same human-role-subject extraction (no human-role scenario subject → no gate, no advocate spawn, no artifact required); there is no feature-category special-casing.

**Threat-model rider:** on a security-bearing project (one with `docs/threat-model.md`), a feature that touches a `### Security-relevant surfaces` item additionally requires a `docs/threat-model.md` update in "Docs to update" — see **Threat-model lifecycle** below. This is orthogonal to the row above (it applies on top of whatever the change type requires).

Trivial-fixup rules and the `/pm-fixup` command are in `.claude/commands/pm-fixup.md`.

### Project kind

**Single source for "what kind of project is this."** A project is one of two kinds:

- **`software`** — the deliverable is source code (the default, and everything the protocol did before this rule existed).
- **`documentation`** — the deliverable is one or several human-facing documents with no executable code (an SOP, a runbook, a guide, a spec, diagrams — e.g. "integrate a new device into the company ecosystem", "diagnose a crashed server", "solder components onto a board", "a user guide"). The document(s) **are "the source code"**: open in form (markdown, diagrams, images) and open in shape (no mandated section set).

**Deliverable location — a fixed `deliverable/` directory.** On a `documentation`-kind project the produced document(s) live under a fixed **`deliverable/`** directory at the project root — the `src/`-analogue, deliberately distinct from `docs/` (dev-docs canon) and `.ai-pm/` (protocol working area). One file (`deliverable/runbook.md`) or several (`deliverable/onboarding.md`, `deliverable/diagrams/topology.mmd`, `deliverable/img/rack.png`). The **plan names the exact leaf file(s)**; `deliverable/` is the standing convention. Gates find it presence-keyed, exactly as they find `docs/` — a software project has no `deliverable/` and is never flagged. **Diagrams are first-class**: `pm-coder` authors text-based diagrams (mermaid `.mmd`, ascii fenced in markdown) as deliverable content; **raster images are human-supplied** and `pm-coder` references them (`deliverable/img/...`), never fabricates binaries. The deliverable has **no mandated scaffold** (openness = absence of a forced template); **optional opt-in starters** live in the template repo under `doc/_templates/starters/` (`sop.md.tmpl`, `guide.md.tmpl`) — the plan may name one as a seed, or none.

The per-project value is declared **once**, single-source, as a `## Project kind: software | documentation` line in the downstream **`CLAUDE.md`** (every agent already reads `CLAUDE.md`). `/pm-bootstrap` writes it from the project-kind question; `CLAUDE.md.tmpl` carries it defaulting to `software`.

**Load-bearing default — `absent OR unrecognized ⇒ software`.** A project with **no** `## Project kind` line, **or** one whose value is not in the current enum (`software | documentation` — e.g. a stale `process` line from an early v2.18 adopter), is treated as `software`. This is what keeps every existing downstream project unaffected: the documentation machinery is dormant unless `documentation` is explicitly declared, and an unrecognized value never hard-errors and never silently picks a random branch — it falls to the safe, byte-unchanged software default. A stale `process` line is additionally flagged for the one-line rename by `### Pending-migration detection in MIGRATIONS.md`, so the fallback is non-silent.

Every conditional below that branches on project kind — the mandatory-table rider, the Step 5 Pass-2 routing, the no-code validation discipline, the `## Validation` stamp gate, the `documentation` tier of `### Foundational product questions` — **references this `### Project kind` subsection by name** ("`### Project kind` in `WORKFLOW.md`") and **never re-encodes the enum or the `absent OR unrecognized ⇒ software` default** — mirroring how `### Security-relevant surfaces` and `### Pending-migration detection in MIGRATIONS.md` are single-sourced. Re-encoding the default in any consumer would reintroduce the back-compat drift this single rule exists to prevent.

**Project-kind rider (mandatory-table dimension — a rider, not a new column or row-duplication).** On a `documentation`-kind project (per `### Project kind` above), the **code-only obligations are inert**: automated tests, the Pass-2 `code-review`, and the build pipeline have no documentation analogue and do not apply. What **still applies** (shared across both kinds): the plan, `docs/user-journeys.md` (reader / operator experience flow), Product Contracts (as the good-outcome definition), the threat-model where security is in play, `pm-auditor`, and `.ai-pm/state/current.md`. In place of the inert code Pass-2, a `documentation`-kind feature runs the **no-code validation discipline** (below). On a `software` project (and every kind-absent project) **nothing changes** — the existing change-type rows above are byte-unchanged; this rider adds the kind dimension orthogonally, exactly as the Product-readiness and Threat-model riders do. Proportionality still scales through the existing change-type matrix and the per-section `N/A` discipline — no documentation-specific stakes mechanism.

**No-code validation discipline (`documentation` kind only).** A `documentation`-kind feature has no `code-review`/test analogue, so its validation is layered, with one **load-bearing gate**. Which validation fits depends on the document type, and the **plan declares it**: an **actionable** doc (SOP / runbook) is validated by a **dry-run / tabletop**; a **reference** doc (guide / spec / diagram) is validated by **editorial review + expert sign-off** (a dry-run may be N/A). Both record the same stamp.

**Where the method is declared, and the default.** The **feature plan declares the validation method in its Test plan / validation section** — `dry-run` for an actionable doc (SOP / runbook), `sign-off` (editorial review + expert sign-off) for a reference doc (guide / spec / diagram). **Default when the plan is silent — by doc type:** actionable ⇒ `dry-run`, reference ⇒ `sign-off`; if the doc type is still ambiguous, the orchestrator picks the **safer** method (`dry-run` for anything operational) or asks the PM. This is the single source for the method declaration + default; every other consumer (`pm-plan-checker`, `pm-pr-prep`, `pm-auditor`) references `### Project kind` by name and never re-encodes it. Both methods record the same stamp:

- **Load-bearing gate — the `## Validation` stamp, mapped onto Step 5.5.** "Run it for real" (Step 5.5) becomes the document-type's validation: a human-driven **dry-run / tabletop walkthrough** for an actionable doc, or an **editorial review + expert sign-off** for a reference doc — the real "tests pass" for a document. Its outcome is recorded as a **stamped artifact** in the feature's review file, cloning the review-stamp pattern: `pm-plan-checker` writes a born-loud **`## Validation: NOT YET RUN — <method>`** marker carrying the plan-declared method (never an empty `## Validation` heading — an empty section greps as "passed"); after the validation clears, the orchestrator **replaces that whole line** with `## Validation: <date> — <method> — passed` where **`<method>` ∈ `dry-run` | `sign-off`** (the same method the plan declared, pre-committed in the marker), and records observations as `## Validation findings` above it. Enforced at the **same downstream gates** as the code-review stamp (presence-keyed, no new gate): `pm-pr-prep` step 0 and `pm-auditor` dimension 1 block a `## Validation` section that is not stamped `— passed`. A skipped validation is therefore non-silent.
- **Structural-lint pre-gate.** markdownlint (already in the repo's authoring discipline — MD022/MD032) is the cheap form gate every markdown deliverable / dev-doc must pass. Vale is noted as an optional future prose-lint — not added in v1.
- **DoD / sign-off — a checklist, never a lone rubber-stamp.** `pm-plan-checker` carries a kind-conditioned DoD line — the `## Validation` gate resolved for the feature, structural lint green — so the sign-off is a checklist item, not a bare signature.
- **Pass-2 routes on kind.** Step 5 Pass 2 routes on `### Project kind`: `software` (and kind-absent) ⇒ `code-review` (the existing path, untouched, byte-for-byte); `documentation` ⇒ **editorial review + the structural-lint pre-gate + the `## Validation` gate** (no bug/security/dead-code analogue).

**Composition is optional.** A `documentation`-kind project's deliverable MAY be consumed by another project as a cited `stack-notes` standard (the same shape as software respecting a spec — and its versioning rides the existing doc-migration staleness machinery). It may equally be a **terminal** human artefact (solder / diagnose / a guide read once) that stands alone. v1 documents the path; it does not require downstream consumption.

### Decision authority

**Single source for "who resolves a product fork."** A feature's product forks are resolved under one of two authority modes:

- **`interactive`** — the PM answers each product fork, every time (the default, and everything the protocol did before this rule existed). Every existing downstream project behaves exactly this way.
- **`autonomous`** — the pipeline resolves a product fork from the PM's bootstrap mandate + the project's canon, **announcing** each decision and recording it with a cited rationale, escalating only a fork the canon does not cover, and **always stopping before merge**.

This is a graded, capped redirect of the existing product-readiness gate, not a new engine: in `autonomous` mode the orchestrator routes `pm-product-advocate`'s existing gap output through an *announce + derive-from-cited-canon-or-escalate* gate instead of blanket-relaying every gap to the PM.

**Load-bearing default — `absent file OR unrecognized ⇒ interactive`.** When no authority value is declared (no `.ai-pm/decision-authority.md`), **or** the declared `mode:` is not in the current enum (`autonomous | interactive`), the effective authority is `interactive`. This keeps every existing project byte-identical: the autonomous machinery is dormant unless `autonomous` is explicitly declared, an unrecognized value never hard-errors and never silently picks a random branch, and no consumer may *require* the file to exist — its absence is the safe default, never an error. This mirrors the `absent OR unrecognized ⇒ software` rule of `### Project kind`; **no migration** is introduced.

**Value home — a dedicated `.ai-pm/decision-authority.md`.** The per-project value lives in a dedicated durable file holding two keys:

```markdown
mode: autonomous | interactive   # default interactive
veto-window-seconds: 15
```

**Why a dedicated file and not a `CLAUDE.md` line** (the home `### Project kind` uses): authority is a **PM-flippable mid-flight toggle** that must survive edits, whereas project-kind is **set-once**. A flip-often value buried as one line in a frequently-edited multi-purpose `CLAUDE.md` is a clobber surface — an unrelated edit could silently drop it, and `absent ⇒ interactive` would make that drop a *silent revert*. A single-purpose `.ai-pm/` file isolates the toggle (read natively downstream, the same shape as `.ai-pm/state/current.md`) so a clobber is far less likely and, if it happens, is visible as a missing file rather than a missing line. Different lifecycle, different home — the *semantics* (the enum + default) stay single-sourced here, exactly as project-kind's do.

**Per-feature override.** A feature's plan may carry an optional `Decision authority: autonomous | interactive` line (see `pm-plan.md`). It overrides the project value for that one feature only.

**Effective-authority resolution order.** For any given fork the effective authority is computed as: **per-feature plan `Decision authority:` line** (if present) → else **`.ai-pm/decision-authority.md` `mode:`** → else **`interactive`**.

**Two scopes, one engine.** Project-wide (the file's `mode: autonomous` — every feature runs autonomously) and per-feature (the plan's `Decision authority: autonomous` line on an otherwise-interactive project) are two **reads of the effective-authority value**, not two engines. The only scope-dependent step is *computing the effective-authority value*; everything downstream of that value (announce → derivability test → auto-resolve-or-escalate) is scope-agnostic and exists once.

**The derivability test.** In `autonomous` mode, for each advocate gap the orchestrator asks one question: *is the gap's answer **derivable from cited project canon** (`docs/product.md` / `docs/architecture.md` / `.ai-pm/contracts/` / prior `## Resolutions` entries / declared standards) + the bootstrap mandate?*

- **Derivable** → **auto-resolve**: announce it (below), then record a `## Resolutions` entry marked `auto`, carrying the **cited canon passage** (a `file` / `### section` reference) + a one-line rationale, **committed before acting**. No blocking `AskUserQuestion`.
- **Not derivable** → **escalate** (see the cap below). Automode therefore **never confabulates** a product direction the baseline never implied — no canon passage ⇒ no auto-decision.

**Escalate-regardless cap (autonomy is an upper bound, never required).** Even in `autonomous` mode, a gap is **escalated** — recorded as a `## Resolutions` entry marked `escalated` and relayed in the existing one `AskUserQuestion` pass — when any of these holds:

- it is **not derivable** from canon (above); OR
- it touches a `### Security-relevant surfaces` item on a security-bearing project; OR
- it belongs to a fork the PM marked **irreversible / high-stakes**.

An empty escalation set ⇒ fully silent (announcements only, no `AskUserQuestion`).

**Announce-before-act.** Before acting on any autonomous decision the orchestrator prints a brief console line — fork · chosen option · brief rationale (citing the canon ref) · invariants kept · `(proceeding — interrupt to override)` — then proceeds. The PM can interrupt at any moment to override or switch modes.

**Advisory veto window — recorded, NOT enforced as a countdown in v1.** `veto-window-seconds` (default 15) is the *intended* pause length. **In v1 it is recorded but not enforced as a literal countdown:** the actual behavior is announce-then-proceed + always-interruptible — there is no Claude Code primitive that waits N seconds for *optional* input, so a hard countdown is a future hook. The console announce line **must never render a live countdown** (it says it is proceeding, not "waiting 15s"). This caveat lives here, at the single source, so every consumer that reads the field also reads it.

**Merge/ship stays manual in BOTH scopes.** Even in `autonomous` mode, Step 6 (the A/B/C ship gate) is **unchanged** — automode carries a feature to a finished, reviewed result and stops before merge; it never opens or merges a PR. Autonomy relaxes only the *product-fork* questions, never merge/release.

**Procedural-gate progression — advancing through the pipeline is itself autonomous (graded extension, no new engine).** The forks above resolve product questions *within* a feature. But the pipeline also has **procedural checkpoints** that merely ask *"ok to proceed? / which order? / want this optional step?"* and do **not** decide what the user gets. In `autonomous` mode each PM-touch is classified once, by a single dividing line — **"does it decide what the user gets?"**:

- **No ⇒ a procedural checkpoint** (feature-selection, plan-approval, the architect-review offer, the retrospective/audit + pending-migration nudges, the contract-existence question) → **announce-and-proceed**: state the decision + a brief cited rationale on the existing **announce-before-act** console line (above), then proceed — no blocking `AskUserQuestion`. These advance/sequence PM-authored work; they never invent product direction.
- **Yes ⇒ a genuine product fork** (an advocate `### Foundational product questions` gap; an irreversible / high-stakes / security-surface fork) → the **derivability test** above, **unchanged**: auto-resolve from cited canon, or **escalate** per the escalate-regardless cap. This subsection's product-fork resolution (Step 3.5, the advocate flow) is **not** touched by the procedural-gate rule.
- **Merge / ship** → always **manual**, both scopes ("Merge/ship stays manual in BOTH scopes" above) — the load-bearing safety that makes announce-and-proceed safe (the PM reviews every plan and every PR before anything ships).

Each procedural checkpoint reuses the machinery already in this subsection **by name** — announce-before-act, the derivability test's *cite-or-escalate* discipline, the escalate-regardless cap, the merge-manual invariant — and re-encodes none of it. The named instances:

**1. Feature-selection — which feature next / the first feature.** Selecting the next feature is the procedural gate at one altitude up, with two entry points: **"which feature next"** (the idle-after-merge transition — Step 6 / "after you merge … ready for the next feature") and **"the first feature"** (`/pm-bootstrap`, after initialization). Both are resolved by the **same machinery already in this subsection**, reused by name — not re-encoded:

- **Resolve by the derivability test.** The candidate set the test reads is the PM's own canon: `.ai-pm/backlog.md` (open items) + the bootstrap mandate + recorded priorities. Selection **sequences PM-authored candidates** (it picks the *order* among items the PM already authored); it **never invents a roadmap direction** the canon never implied — the same anti-confabulation discipline as the derivability test ("no canon passage ⇒ no auto-decision"). The only scope-dependent step is *computing the candidate set* (idle: open backlog items by mandate-alignment + recorded priorities; bootstrap: the mandate plus any seeded backlog, with no backlog history yet) — everything after (announce → proceed into `/pm-plan`, or escalate) is identical, exactly like "two scopes, one engine."
- **Announce-before-act, then proceed.** The chosen feature is **announced** on the existing announce-before-act console line (fork · chosen feature · cited rationale (the backlog item / mandate passage) · invariants kept · `(proceeding — interrupt to override)`) and **proceeded** straight into `/pm-plan` — no blocking "which feature next?" `AskUserQuestion`. The PM interrupts the announce to override the pick or switch modes.
- **Canon-derived or escalate (the existing cap, three new instances — not a new mechanism).** Selection **escalates** — one `AskUserQuestion`, the same single relay — as an instance of the escalate-regardless cap when any holds: the backlog is **empty / has no open items**; the top priority is **genuinely ambiguous** (≥2 candidates with **no derivable tiebreak** from the mandate or recorded priorities); or the best candidate is one the PM marked **irreversible / high-stakes**. The ambiguity trigger is **absence of a derivable tiebreak from cited canon, NOT absence of a formal rank** — a 10-item backlog is *not* ambiguous when the mandate or a recorded priority makes one candidate derivably most-aligned (that derivation *is* the cited source); it is ambiguous only when no candidate is derivably most-aligned, in which case there is no canon passage to cite ⇒ escalate. A formal backlog priority/ranking model is out of scope. An empty escalation set ⇒ fully silent (announce + proceed). A bootstrap escalation (the mandate alone often implies no single first feature) is **expected and healthy**, not a defect.
- **Recorded — no new artifact.** Selection precedes the feature, so it has no advocate `## Resolutions` trail to ride. It is recorded in three existing places: the **announce console line**; the **selected plan's existing `Source:` provenance line** (extended in place — see `pm-plan.md` — to read `selected autonomously per ### Decision authority; source: <backlog item / mandate passage>`, one provenance line, not a parallel field); and a **one-line note in `.ai-pm/state/current.md`**. `pm-plan-checker` carries a **presence-keyed backstop** (a `selected autonomously` provenance line must carry a `source:` token — shape, not meaning), mirroring the `auto`-entry citation guard, so the canon-derived-or-escalate floor is enforceable, not by-discipline. No new file, no new artifact type, no new gate.
- **Merge/ship stays manual (this is the load-bearing safety).** Auto-**selecting** what to plan is safe **because** "merge/ship stays manual in BOTH scopes" (above) is untouched — the PM reviews every plan and every PR before anything ships, and the idle-after-merge trigger paces successive selections one feature at a time (the PM's manual merge of each feature naturally gates the next selection). No "max N features" cap is needed; the manual merge is the cap. Selection chooses the *order* among PM-authored candidates; it never merges and never plans against invented direction.

**2. Plan-approval — the "iterate until PM says ok" handoff.** After a plan is drafted (`pm-plan.md` Handoff), autonomous mode replaces the blocking "do you approve the plan?" relay with **announce the plan summary + proceed** to the next pipeline step. This does **not** bypass the genuine-fork checks that follow: the **product-readiness advocate gate still runs** (user-facing features — derive-or-escalate per the product-fork path above), and `pm-plan-checker` + `code-review` still validate the plan/implementation. The PM interrupts the announce to steer or stop; otherwise the plan proceeds. Safe because the plan is committed, independently reviewed, and the PR is reviewed before the manual merge.

**3. The optional/offer gates — arch-review offer, retrospective/audit + migration nudges, contract-existence question.** Each is procedural — it asks *"want this optional step? / does this change what the user sees?"*, not *what the user gets*. In autonomous mode the orchestrator **decides each itself + announces**, instead of asking: the **architect-review offer** runs an arch review when the architect criteria match; the **retrospective/audit nudge** runs an audit when the 5-since-last threshold trips; a **pending-migration nudge** runs the detected pending migration; the **contract-existence question** derives user-facing from the existing human-role-subject extraction. None decides product direction, so none escalates by itself (an arch review, audit, or migration that *then* surfaces a genuine product fork routes that fork through the product-fork path above).

This progression is a **graded extension of the one engine** — no new enum value, no new default, no migration; interactive mode is byte-unchanged (it still relays every procedural gate: "which feature?" / "describe the first feature" / "approve the plan?" / "worth an arch review?" / "run an audit?" / "does this change what the user sees?").

**Change authority mid-flight.** The PM interrupts and changes the mode at any time — editing `.ai-pm/decision-authority.md` or telling the orchestrator (project scope), or simply not setting the plan line for the next feature (per-feature scope). The new mode governs all **subsequent** forks; already-recorded `auto` decisions stand in the trail for batch review.

**The `## Resolutions` markers.** Each entry the orchestrator records in the advocate trail carries a marker: **`auto`** (the orchestrator resolved it from canon in autonomous mode) or **`escalated`** (relayed to the PM); an interactive answer is the unmarked baseline. **Every `auto` entry must carry a cited canon reference** (a `file` / `### section` token) — this is the anti-confabulation requirement the `pm-plan-checker` DoD and `pm-auditor` dimension 1 presence-check enforces (shape, not meaning — the PM owns whether the citation truly supports the decision, at batch review).

Every consumer of decision authority — Step 3.5, the Step 6 idle-after-merge transition, the "How to talk to the PM" autonomous rider, `pm-bootstrap.md`, `pm-plan.md`, `pm-plan-checker.md`, `pm-auditor.md` — **references this `### Decision authority` subsection by name** ("`### Decision authority` in `WORKFLOW.md`") and **never re-encodes the enum or the `absent file OR unrecognized ⇒ interactive` default**, mirroring how `### Project kind` is single-sourced. Re-encoding the default in any consumer would reintroduce the back-compat drift this single rule exists to prevent.

### Security-relevant surfaces

**Single source for "this feature touches security."** These are the only surfaces that mark a feature as security-touching. `/pm-plan`, `pm-plan-checker`, and `pm-auditor` reference this subsection **by name** ("`### Security-relevant surfaces` in `WORKFLOW.md`") and must never re-encode the list — mirroring how `### Pending-migration detection in MIGRATIONS.md` is the single source for un-migrated state. A feature touches a security-relevant surface when it touches any of:

- **Authentication** — login, sessions, tokens, credential handling.
- **Cryptography / key management** — encryption, signing, key generation / storage / rotation.
- **Data-at-rest / storage** — how persisted data is stored, protected, or encrypted.
- **Network / transport** — what crosses the wire, TLS, exposed endpoints, transport security.
- **User input** — anything externally supplied that reaches a query, command, parser, or rendering path.
- **PII** — personally identifiable or otherwise sensitive personal data.
- **Access control** — who may do what; roles, permissions, authorization checks.

### Foundational product questions

**Single source for the product-readiness gate.** This is the only list of foundational product questions. `pm-product-advocate`, `/pm-plan`, and `/pm-bootstrap` reference this subsection **by name** ("`### Foundational product questions` in `WORKFLOW.md`") and pass a **tier** (`per-feature` | `bootstrap` | `documentation`); they must never re-encode the list — mirroring how `### Security-relevant surfaces` is the single source for security-touching surfaces. The advocate reports only the questions with **no recorded answer** in its inputs, in the fixed order below; it never judges whether an answer is good (the PM owns meaning). Use cross-domain language — onboarding / discovery / recovery — never a domain-specific example baked in as vocabulary.

**Tier: per-feature** (one user-facing feature; inputs = the plan + the Product Contract + `docs/product.md` + `docs/user-journeys.md`):

1. Value — who is this for, and what job does it do for them?
2. Value — why this, and not the way they do it today (the incumbent)?
3. Usability — how does a user reach or discover this feature?
4. Usability — what does the first successful use look like (the zero-to-working step)?
5. Scope boundary — what does this feature explicitly NOT do (the No-Gos)?

**Tier: bootstrap** (the whole product, once; inputs = the product Q&A answers + `docs/product.md` + `docs/architecture.md`):

1. Discovery — how does a new user find out the product exists?
2. Onboarding — what are the first steps from nothing to a working state?
3. Invite / multi-party — if others are involved, how do they join?
4. Recovery & key-loss — what happens when a user loses access, a key, or a device?
5. Device-change / continuity — how does use carry across devices or sessions?
6. Value — why this product, and not the incumbent?
7. Viability — who runs it, who funds it, what legal or operational constraints bind it?

**Tier: documentation** (one feature on a `documentation`-kind project — per `### Project kind`; the reader / operator is a human role, so the advocate fires; inputs = the plan + the Product Contract + the deliverable file(s) under `deliverable/` + `docs/user-journeys.md`). One general completeness set covering both actionable and reference docs; the advocate reports only the questions with no recorded answer, never grading the prose (a question genuinely N/A for a pure reference doc is answered `N/A — reference doc`, a recorded answer, so it does not flag):

1. Audience — who is this document for (the reader / operator role)?
2. Scope — what does it cover, and what does it explicitly NOT cover (the No-Gos)?
3. Coverage — does it cover the whole stated scope end to end (no silent gaps)?
4. Decision points — where does the reader / operator branch, and on what condition? (For a reference doc with no branches: `N/A — reference doc`.)
5. Exceptions / failure handling + recovery — what happens when a step or assumption fails, and how does the reader / operator recover? (For a pure reference doc: `N/A — reference doc`.)
6. Zero-to-done — what does a first complete run, from nothing to the finished outcome / fully understood document, look like?

The advocate, its relay (the one `AskUserQuestion` pass), and its backstops (`pm-plan-checker` DoD, `pm-auditor` dimension 1) are reused **verbatim** for this tier — only the question source gains the tier. A documentation project is human-facing — the **reader / operator is a human role** — so the human-role-subject extraction that gates the per-feature advocate **fires** on a `documentation`-kind feature; the advocate is the natural referee that finds holes in the document before it ships.

### Threat-model lifecycle

`docs/threat-model.md` has a full lifecycle on **security-bearing projects only** — a project is security-bearing exactly when `docs/threat-model.md` is present (it is drafted at bootstrap only when security is in play, so its presence is the durable on-disk signal). Non-security projects have no threat-model and are never flagged.

- **Owner:** `pm-architect` — the same owner as the adjacent `docs/architecture.md` `## Security constraints`. The two are complementary: the threat-model is *what we protect / from whom / likelihood-impact* (the risk layer); Security constraints are *the enforceable implementation rules* (the rule layer). They are wired **threat → constraint by stable `SCn` ID reference**, one-way, no duplicated content.
- **Bootstrap:** when security is in play, `pm-architect` **drafts a populated** `docs/threat-model.md` from the Q7 security answers — never an empty skeleton.
- **Per feature:** a feature touching any `### Security-relevant surfaces` item on a security-bearing project must list `docs/threat-model.md` in its plan's "Docs to update" with the relevant Threat rows; after coding, the orchestrator spawns `pm-architect` to update it (the same handoff as `docs/architecture.md`).
- **Plan-checker:** a security-touching plan that omits the threat-model update is **blocking** (same class as a missing "Stack expectations touched" section).
- **Auditor:** an empty / skeleton threat-model is **blocking**; a stale one (`Last reviewed` predates a merged security-touching feature) is a **note**. Remediation: spawn `pm-architect` to draft / refresh.

---

## How state is kept

One file — `.ai-pm/state/current.md` — holds the live snapshot of the active task: Status, what's Done, what's Remaining, Touched files, Next step, Validation command. Every coder run reads it first and updates it last. Every `/pm-plan` run initializes it.

This means: if you pause for a week, come back, and re-enter Claude Code, my first move is to open that file and continue. You do not need to re-explain. You can open the file yourself to see where we are, but you don't write to it — agents do.

When a task finishes, the file is archived to `.ai-pm/state/archive/<topic>-<date>.md` and reset to `Status: idle`.

For user-facing features, a parallel set of files lives in `.ai-pm/contracts/` — one Product Contract per feature, with what must work, what must not break, and the acceptance checks that prove it. Coder reads the contract before implementing; reviewer verifies the diff against it; auditor flags missing or stale contracts. The contract is how we keep a feature recognizable across many small changes — without it, the product slowly drifts.

PM never edits state or contracts. PM reads them when curious.

The PM-facing render of all contracts — what the system does, contract by contract, with the features and reviews behind each — is `docs/product-map.md`. It is generated (group → contract → features), never hand-filled, and regenerated as features land; the contracts and state stay the source of truth. This replaces the old feature index: the per-feature "did all artifacts appear" check now lives in `pm-plan-checker`'s DoD, and `pm-auditor` re-derives `product-map.md` from source on every audit.

### Three channels surface to PM, not one

After implementation, PM hears about results through three channels (not just the reviewer verdict):

- **Coder's Product Impact Report** — when a user-facing contract was touched: which Behavior changes happened, which Acceptance checks passed/failed, what risk surfaces were touched, whether a PM decision is required. This is the "what changed for the user" channel.
- **Reviewer's Notes (product)** — non-blocking observations the PM should weigh: scope choices, trade-offs, missing tests on meaningful paths. This is the "what to think about" channel.
- **Reviewer's Definition of Done line** — the binary signal: pass (everything is in order) or fail (something is missing, even if no Blocking finding). This is the "is it actually done" channel.

If any of the three contradicts the other (e.g., DoD says pass but Impact Report says PM decision required) — that is itself a finding to surface, not silently resolved.

**DoD rule:** a pass with any unchecked box is a contradiction; reviewer must re-read its own findings before signing off. A fail forces `request-changes` even when Blocking is empty. The DoD is binding; it is not a summary.

---

## When you say it doesn't work in production

When you tell me "X doesn't work on the controller / on production / in the deployed environment", I follow a strict diagnose-then-plan flow. I never edit, restart, or re-deploy on the live system in the moment.

**Blast-radius preflight.** Before any on-hardware or live-system action — exercising a feature on real hardware (Step 5.5), or a diagnostic probe that restarts or structurally mutates a live target (Step A.5) — I stop and ask one question: *does the effect reach an external stateful peer whose state a local revert will not undo?* If the live target is coupled to such a peer, I **stop and surface the blast radius to you before acting**. The trap this guards against: *reversible locally ≠ reversible for a coupled external peer.* A probe's "throwaway / I revert it afterwards" framing assumes a local revert undoes the effect — true for a setting I flip back, false when the side effect lives **outside**, in a paired external system's own record of my target. Reverting my local change or restarting my service does not reach into the peer and undo it.

The worked example is a Wiren Board Matter bridge paired with a live smart-home ecosystem. Exercising a new device type on the bridge while the pairing was active changed the bridge's externally-visible composition; the ecosystem's own device record broke (the lamp vanished from the app) even though the bridge stayed internally correct, and reverting the bridge did not heal the ecosystem record. The principle is domain-agnostic — any live target coupled to an external stateful peer (a paired hub, a registered downstream, a session a remote party holds) carries the same blast radius; the Matter case is only the illustration.

When the preflight finds the target **is** coupled to a live external peer:

- I offer the safe alternatives first — run on a **separate / throwaway target**, or under a **separate identity** — so the user's live target is never the test subject by default.
- **Structural mutations** — anything that changes the live target's externally-visible composition — never run on the user's live coupled target by default. They go to a separate / throwaway instance.
- I proceed against the user's live coupled target, or down any recovery path (re-commission / re-pair the external peer), **only on your explicit consent**, and only with that recovery planned as a **mandatory step**, not an afterthought.
- I minimize repeated restarts of a coupled live target; if a structural change on it is genuinely unavoidable, the recovery step is part of the plan from the start.

This preflight is purely additive: it adds a precondition before acting and relaxes none of the Step A read-only default or the Step A.5 probe rules below.

**Step A — Read-only diagnostics (default).** I ssh in to read logs (`journalctl`, `docker logs`), statuses (`systemctl status`, audit / health endpoints), config files, deployed artifacts. By default I change nothing on the system — no `sed`/`vi` on a repo-owned file, no `systemctl restart`, no `apt install` on my own initiative. The boundary against *silent* changes is hard. The one sanctioned exception is a probe you explicitly authorize — Step A.5.

**Step A.5 — Probe to confirm a hypothesis (only if you authorize it).** Read-only diagnostics usually point to a hypothesis. To confirm it before planning a fix, you can authorize a **diagnostic probe** — a throwaway spike, not the fix. Before a probe that restarts or structurally mutates a live target I run the **Blast-radius preflight** (above): the "throwaway / I revert it afterwards" framing holds only when a local revert undoes the effect — *reversible locally ≠ reversible for a coupled external peer*. If the target is coupled to a live external system, I stop and surface the blast radius to you first.

Before I touch anything I show you a **probe proposal** in plain language and wait for your yes:

> **Problem:** <what's broken, from the user's side>.
> **My hypothesis:** <the likely cause, plain>.
> **Probe:** I'll set `<setting>` in `<where>` from `<current value>` to `<new value>` — this controls <plain-language explanation of what that setting does>.
> **What we'll watch:** <the observable that confirms or refutes the hypothesis>.
> **After:** I revert it; if it confirms the cause, the real fix goes through the normal pipeline (`/pm-plan` → coder → review → PR → deploy).
> Authorize this probe?

This is the one place I show you the concrete before→after — you're authorizing a touch on a live system, so you need the specifics — but every technical item gets a plain-language gloss, never a raw dump. Rules of the probe:

- I act only on your explicit yes, and I name it a probe, not the fix.
- If the probe restarts or structurally mutates a live target, the **Blast-radius preflight** runs first — a coupled external peer is a stop-and-surface, not a "throwaway" I can quietly revert.
- It touches **runtime / local state only** — a runtime setting, a service restart, a value in a live config a redeploy resets, a local dev file. It **never** edits in place a file the repo owns in git (schema, config template, code, unit file); that stays the forbidden silent-fix path even for a probe. The real fix to a repo-owned file always goes through the pipeline.
- Afterwards I revert it, or — if confirmed — carry the real fix through the pipeline. No silent permanent trace remains.
- I record what I changed and what I observed; it becomes the plan's **Incident facts**.

**Step B — Formulate findings in product language.** I summarise to you what's broken from the user's perspective. Plain language: "users can open the cart but checkout never confirms the order" — not "POST /checkout returns 502 because the upstream pricing service times out after 30s due to a config drift on the cache layer". The technical detail goes into the fix plan, not into the PM update.

**Step C — Hotfix planning.** I run `/pm-plan` with the topic marked as hotfix (`hotfix-<area>`). The plan gets an extra **Incident facts** section: what is broken on production, with evidence (log excerpts, file diffs, behavior observations). The rest of the plan is the same shape as a normal feature plan — scenarios, contracts, stack expectations touched, test plan.

**Step D — Standard pipeline.** Coder → reviewer → pr-prep → PR. You merge when reviewer approves. Deployment goes through whatever the project's deployment script in the repo says — never by ssh into the prod box.

**Why this matters.** Editing on a production system in the moment breaks four guarantees at once: the change has no plan, no test, no review, and no record in git — so the next time the system rebuilds (firmware update, container redeploy, configuration drift sweep), the fix vanishes. Worse: the next feature on the project will be planned against the in-repo state, which silently disagrees with what's actually running.

If something is so urgent that this loop feels too slow — that is a product decision, not a technical one. Tell me. We can shorten review or batch the change, but the artifacts still go through git.

I involve you when:
- Architectural fork (new technology, breaks a constraint, changes public API)
- Reviewer finds a blocking issue that requires a product decision (e.g., descope a scenario, accept a known limitation)
- Planning has a high-stakes ambiguity you need to resolve

**Every question to you must use the AskUserQuestion tool** — never ask as plain text. This keeps decisions explicit and traceable.

Everything else flows automatically.

---

## When the protocol itself has a gap

Sometimes the thing that breaks is not your project — it is the protocol spec itself: a **structural gap** in the tooling under `.ai-pm/tooling`. A contradiction between two rules, a manual step with no gate, a deceptive-empty template that reads as "done", an ordering bug, an artefact nobody owns. When I hit one of these, I do **not** silently work around it — a workaround leaves the next session to trip over the same gap.

Instead I write a structured **protocol-gap report** to `.ai-pm/protocol-feedback/<topic>.md` (the directory is created on first use). This is an orchestration artefact I write directly — record it, route it upstream — the same way I write the backlog. The report has a fixed shape, in English:

- **Symptom** — what degraded or confused, expected-vs-actual.
- **Root cause** — where in the spec, by file + section; name the mechanism (the contradiction, the ungated step, the deceptive template, the ordering bug, the ownerless artefact).
- **Minimal fixes** — the smallest concrete edits, each naming its file; mark the one I recommend.
- **Protocol files touched** — the `.ai-pm/tooling` files a fix would change.

Then I surface it to you in plain language — *"this is a structural gap in the protocol itself, not your project: <one line>. I wrote a report at `.ai-pm/protocol-feedback/<topic>.md` so it can go upstream to `ai-pm-protocol`."* If the upstream remote is known and you want it, I open an issue there. I **never** edit `.ai-pm/tooling` in place — that submodule is canon owned upstream, the same source-of-truth discipline as the remote-system rule. Fixes to it flow upstream through a report, not a local patch that the next template bump silently reverts.

(This very feedback — the review-stamp gate — is the worked example of the format: a deceptive-empty template plus an ungated manual step, reported and fixed upstream.)

---

## Maintenance

To get the latest agent versions when a new template is released:

```bash
git submodule update --remote .ai-pm/tooling
git add .ai-pm/tooling
git commit -m "chore: bump ai-pm-protocol"
```

Or just ask the orchestrator — "update the template" / "bump ai-pm-protocol to vX.Y". This is dependency / chore work, not a feature: the orchestrator does the submodule bump on a branch, commits it as `chore:`, and runs any pending template-upgrade migration (see `pm-bootstrap.md` § "Pending template-upgrade migrations"). No `/pm-plan` needed.

After the bump, run `/pm-audit` — alongside the mechanical pending-migration detection, its existing docs-currency checks surface the content disciplines a newer template version introduced (a missing journey, an empty `product.md` funnel, a skeletal threat-model) and offer to fill them with the PM (the disciplines and their question sources are registered in `### Expected-discipline manifest` in `MIGRATIONS.md`).

---

## How to talk to the PM

The PM makes product decisions and does not read code. Every message to the PM follows these rules.

**Language canon (two axes).** Conversation = the PM's language. Artifacts written to disk — files, code, commits, and agent-authored doc files like reviews and audit reports — are **English**. When you relay a persisted artifact in chat, translate-on-read into the PM's language; only what lands on disk is English.

**Lead with user impact.** Start with what changes for the user — not what changes in the code.
> ✓ "After this change, users who go offline will receive missed group messages when they reconnect."
> ✗ "Implemented message queue with SQLite-backed persistence layer."

**Explain decisions as trade-offs, not as technical facts.**
> ✓ "We can store message history on each device (simpler, works offline) or on a shared server (syncs across devices, needs internet). The first approach fits your current architecture."
> ✗ "Local persistence via embedded DB vs. server-side replication with eventual consistency."

**Ask one question at a time.** Frame it as a product decision with 2-3 concrete options and consequences. Recommend one.
> ✓ "Should messages sent to a group while a member is offline be delivered when they come back?
>    A) Yes — they never miss anything, but reconnecting can be slow if many messages piled up.
>    B) No — reconnect is instant, but they miss what happened while away.
>    I'd recommend A — missing messages is more confusing than a short delay."
> ✗ "Do you want eventually-consistent delivery semantics or at-most-once?"

**Surface substantive decisions via the AskUserQuestion tool.** When the choice is a real fork — a scope decision, accept-vs-fix, which-of-N options, prioritization — present it through the **AskUserQuestion** tool, not a plain-prose "(A)…/(B)…?". The structured form gives the PM comparable options side by side with previews, which is what a substantive fork deserves. Simple proceed / confirm gates — merge-authorization, "ready?", a plain yes/no — stay in prose; do **not** force AskUserQuestion on every binary, or it becomes tool-spam and the PM tunes it out.

**Autonomous-mode rider (`### Decision authority` in `WORKFLOW.md`).** When the effective authority is `autonomous`, before raising a product fork via `AskUserQuestion` I first announce the fork + chosen option + brief rationale + invariants and apply the **derivability test**: if the answer is derivable from cited canon I proceed (recording an `auto` resolution with the citation) instead of asking; if it is not derivable — or the fork is high-stakes / irreversible — I escalate and ask. I never auto-merge: merge/ship stays manual in both scopes. The load-bearing enforcement of this is the gated Step 3.5 (the advocate gaps); this rider covers ad-hoc forks that arise outside the gate. **Routine procedural gates** (which feature next / the first feature, approve-the-plan, the arch-review offer, the retrospective/audit + pending-migration nudges, the contract-existence question) are likewise **auto-decided and announced, not relayed** — I decide-announce-proceed per `### Decision authority` (the procedural-gate progression) by the dividing line "does it decide what the user gets?"; only a genuine product fork escalates.

**Draw a diagram when structure matters.** ASCII is fine. Use it to show flows, states, relationships — not to impress.
```
User offline → messages queue → user reconnects → messages delivered in order
                    ↑
             (stored locally, max 500)
```

**Never show code.** If you need to illustrate logic, use plain English steps or a diagram. If PM asks "how does it work?" — explain the idea, not the implementation.

**Write blank-line-correct markdown.** When you write or generate markdown that a human will render (templates, generated docs, architecture.md, user-journeys.md, product.md prose, reviews, audit reports), surround block elements — lists, tables, headings — with blank lines, and never put two non-blank lines that should render on separate lines directly adjacent (use a list or a blank line between them). A list/table without a preceding blank line, or two adjacent label lines, renders wrong in non-CommonMark renderers and fails markdownlint MD022/MD032 even though GitHub tolerates some of it.

**No jargon without explanation.** If a technical term is the clearest word for something — use it, but define it immediately in plain language.
> ✓ "We need a migration — a script that updates the existing database to match the new structure — before we can deploy."
> ✗ "The schema migration needs to run before the rollout."
> ✗ "We need to update the database." (too vague — PM might not know what needs to be done)

**"Want to go deeper?"** End explanations with this offer. PM can ask for more detail on any part. Never assume they want the full technical picture unless they ask.

**Report problems without panic.**
> ✓ "Found an issue: if a user leaves a group while offline, they could still receive messages after rejoining. This affects the 'leave group' scenario. Options: fix now (adds ~1 day) or ship with a known limitation and fix in the next iteration."
> ✗ "NullPointerException in GroupMembershipService at line 247 when userId is null in leaveGroup()."
