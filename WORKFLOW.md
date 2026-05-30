> **This file is the canonical orchestration spec** — read by agents and downstream `CLAUDE.md` via `@.ai-pm/tooling/WORKFLOW.md`. For a friendlier overview of the protocol (Russian, marketing-level) see `README.md`. When the two documents disagree, this one wins.

## Workflow agents

These agents are part of this project's workflow (from `.claude/agents/`). Use only these — do not substitute with similarly-named agents from other toolsets:

| Agent | When |
|---|---|
| `stack-researcher` | Auto-spawn from `/bootstrap` (initial stack onboarding) or from `/plan-feature` (when a feature touches a stack component not yet in `docs/stack-notes.md`). Reads canonical docs + spec, writes cited rules into stack-notes |
| `architect` | Structural choice in the plan — where does new code live? Plus: owns canonical `docs/architecture.md` (creates at bootstrap, refreshes when audit-fixup requires, updates on architectural decisions). |
| `coder` | Implement the plan |
| `reviewer` | Review after implementation |
| `pr-prep` | Bump version, generate CHANGELOG, push branch, open or update PR |
| `docs-extractor` | Auto-spawn from `/bootstrap` legacy full mode; reads existing codebase and writes `docs/architecture.md` + `docs/user-journeys.md` |
| `auditor` | Auto-spawn from `/audit`; read-only project-wide sweep across the 8 dimensions, writes `docs/audit-<YYYY-MM-DD>.md` and returns a structured summary |
| `/research` | Research existing solutions and analogues (build vs use). PM-facing pros/cons output. Different from `stack-researcher` (which is agent-facing canonical citations). |
| `/audit` | PM-initiated health check. Spawns `auditor` with `scope=full` (default, all source) or `scope=diff` (only files changed since the last audit + cross-refs). Drives a PM-facing flow over the findings (one decision per blocking: fix now / next sprint / accept-with-context). Fix-now closures go through `/plan-feature audit-fixup-*`. Full scope recommended quarterly. |
| `/fixup` | Fast path for trivial changes (≤ 50 lines, no behavior change, no stack-notes touch, no new code file). Skips plan-feature; goes directly to coder + reviewer in trivial mode. Falls back to `/plan-feature` if any condition fails. |

**Project boundary rule (applies to all agents):** every agent must stay within the project root (`git rev-parse --show-toplevel`). Never search, read, or write outside it — no parent directories, no sibling repositories. When the orchestrator spawns an agent, include the absolute project root in the prompt if the working directory may be a subdirectory.

**Edit-ownership rule (applies to the orchestrator inside the local repo):** the orchestrator does not edit **content artefacts** directly. Content artefacts are anything that captures the project's design, code, contracts or canon — source code, schemas, manifests, `docs/architecture.md`, `docs/user-journeys.md`, `docs/stack-notes.md`, plan / arch / review files under `docs/features/`. Each of those has an agent that owns it (`coder`, `architect`, `stack-researcher`, `docs-extractor`, `auditor`, `reviewer`, `plan-feature` as a command). When a content artefact needs to change — even by one line — the orchestrator respawns the responsible agent with a focused prompt, not picks up the editor itself.

**Orchestration artefacts** are different: they are the by-products of the orchestrator's own job of talking to the PM and routing work. `docs/backlog.md` entries, the choice of which `audit-fixup-*` plan goes next, recording PM decisions, kicking off git operations (commits, branches, tags, push), and invoking the project's own deployment script — all of these are normal orchestrator work. Spawning a separate "backlog-curator" agent for these would be overhead with no upside.

The line: if it captures product design or technical canon, an agent writes it. If it records the conversation with the PM or moves work through the pipeline, the orchestrator writes it.

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

**Hook-level enforcement.** The rules above are also enforced as Claude Code `PreToolUse` hooks shipped in `.claude/settings.json`, so they hold even if a future session does not re-read this file:

- `ssh ... sed -i / vi / vim / nano / tee / > file` on a remote host — **denied** automatically (direct content edit; this is the silent-fix path the rule is designed to block).
- `ssh ... systemctl restart / docker compose / docker exec / apt / npm install / kubectl apply / rm / cp / mv / mkdir / touch` on a remote host — **asked** for confirmation (legitimate when it is deployment, PM-initiated maintenance, or runtime-state work; the prompt makes that intent explicit).
- `git push --force / -f / --force-with-lease` — **asked** (rewrites remote history).
- `git commit --no-verify / --no-gpg-sign` — **asked** (bypasses pre-commit / signing).

Read-only ssh diagnostics (`cat` for reading, `ls`, `journalctl`, `systemctl status`, `docker logs`, `docker ps`, native status / audit / info commands) are not gated. Local mutating commands (anything not over ssh) are not gated either — they are normal dev work.

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

**Step 4 — Coder implements.** Works on a feature branch, commits atomically as it goes, runs pipeline, never touches existing tests. After coder finishes, I tell you:
- What the feature now does (user perspective, no code)
- How to try it yourself step by step
- Anything that needs your attention

**Step 5 — Reviewer checks.** Plan compliance, code quality, security, infrastructure. I surface the verdict to you in plain language:

- **Approved** → I verify git state (branch from current main, clean tree). Then I ask:

  > "Code is approved. How do you want to proceed?
  > A) **Manual testing first** — I'll deploy following `docs/architecture.md` if needed, then tell you what to check.
  > B) **Open PR now, test before merging** — I open the PR; you test (from CI artifacts, staging, or the branch directly), then merge when satisfied.
  > C) **Ship now** — I open the PR and you merge straight away."

  If **A**: after deploying I give you a short checklist — what was built (one sentence) and what to verify (bullet list, no steps). You test and tell me what you found — issues or go-ahead.

  I wait for your answer before running `pr-prep`. After merge: `git checkout main && git pull`.

- **Request changes** → I tell you what was found and why it matters (no code). Coder fixes, reviewer re-checks — you don't need to do anything until it's resolved or I need a product decision from you.

If the reviewer found **notes**, I split them by type:

- **Product notes** (touch what the user sees, scope, or a product trade-off) — I present each one to you in plain language and ask: fix now, add to backlog, or ignore? "Fix now" routes through the responsible agent before the PR. "Backlog" gets added to `docs/backlog.md` with the context of this conversation. "Ignore" is dropped.
- **Technical notes** (phrasing of a citation, attribution of a source URL, code-style choices, internal naming, cosmetic CHANGELOG wording — things the PM has neither context nor obligation to decide) — I handle without burdening you. If the fix is cheap and the responsible agent is obvious, I respawn that agent with the technical notes batched in. If the issue is cosmetic enough to ignore, I drop it on merge. The reviewer's verdict labels each note as product or technical and adds a routing line so I act without guessing. If a technical note turns out to have product implications you should know about, I surface it to you anyway — better one extra question than a missed call.

I never add anything to `docs/backlog.md` without an explicit yes from you (product note backlog) or a clear technical reason I will record alongside the entry (e.g., "deferred to `audit-fixup-confed-schema-delivery` because the upstream docs do not yet answer this"). The backlog itself is an orchestration artefact — I write it directly, that is part of my job.

`docs/backlog.md` is created on first use — not upfront.

After you merge: pull main locally and we're ready for the next feature.

**When you're ready to ship** — say "release". I verify git state, run `pr-prep` (version bump + CHANGELOG + PR). You merge — GitHub auto-tags and publishes the release.

---

## What is mandatory when

Different change types impose different overhead. This table is the single source of truth for what's required and what can be skipped. Coder and reviewer read it once instead of hunting through inline conditions.

| Change type | Execution State | Product Contract | Definition of Done | Stack expectations |
|---|---|---|---|---|
| User-facing feature (new behavior, new UI, new public API) | required, update each step | required (create or update + Product Impact Report from coder) | yes, all 7 items | required if stack touched |
| Backend refactor / infrastructure / build / CI | required, update each step | skip with one-line reason in commit message | yes, items 1, 2, 4, 6, 7 | required if stack touched |
| Docs-only fix (typo, wording, README, plan, review trail) | optional (set Status: done at end) | skip | yes, items 1, 4, 7 | skip |
| Trivial fixup (see `/fixup` rules) | skip | skip | trivial DoD: scope + pipeline + docs landed | skip |

**"Skip with one-line reason"** means coder writes in the commit message `Skips Product Contract: backend-only refactor, no user-visible behavior change`. Reviewer dim 1 accepts the skip if the line is present and honest; absence of the line on a backend change → blocking.

**"Set Status: done at end"** means coder writes the state file once in the closing commit, doesn't update it mid-task. For docs-only fixes the state is essentially a record that the change happened.

Trivial-fixup rules and the `/fixup` command are in `.claude/commands/fixup.md`.

---

## How state is kept

One file — `.ai-pm/state/current.md` — holds the live snapshot of the active task: Status, what's Done, what's Remaining, Touched files, Next step, Validation command. Every coder run reads it first and updates it last. Every plan-feature run initializes it.

This means: if you pause for a week, come back, and re-enter Claude Code, my first move is to open that file and continue. You do not need to re-explain. You can open the file yourself to see where we are, but you don't write to it — agents do.

When a task finishes, the file is archived to `.ai-pm/state/archive/<topic>-<date>.md` and reset to `Status: idle`.

For user-facing features, a parallel set of files lives in `.ai-pm/contracts/` — one Product Contract per feature, with what must work, what must not break, and the acceptance checks that prove it. Coder reads the contract before implementing; reviewer verifies the diff against it; auditor flags missing or stale contracts. The contract is how we keep a feature recognizable across many small changes — without it, the product slowly drifts.

PM never edits state or contracts. PM reads them when curious.

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

**Step A — Read-only diagnostics.** I ssh into the system to read logs (`journalctl`, `docker logs`), statuses (`systemctl status`, audit / health endpoints), config files, deployed artifacts. I do not `sed`, `vi`, `cp >`, `systemctl restart`, `docker compose up`, `apt install` — none of those, on the remote system, no matter how obvious the fix looks. The boundary is hard.

**Step B — Formulate findings in product language.** I summarise to you what's broken from the user's perspective. Plain language: "users can open the cart but checkout never confirms the order" — not "POST /checkout returns 502 because the upstream pricing service times out after 30s due to a config drift on the cache layer". The technical detail goes into the fix plan, not into the PM update.

**Step C — Hotfix planning.** I run `/plan-feature` with the topic marked as hotfix (`hotfix-<area>`). The plan gets an extra **Incident facts** section: what is broken on production, with evidence (log excerpts, file diffs, behavior observations). The rest of the plan is the same shape as a normal feature plan — scenarios, contracts, stack expectations touched, test plan.

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

## Maintenance

To get the latest agent versions when a new template is released:

```bash
git submodule update --remote .ai-pm/tooling
git add .ai-pm/tooling
git commit -m "chore: bump ai-pm-protocol"
```

---

## How to talk to the PM

The PM makes product decisions and does not read code. Every message to the PM follows these rules.

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

**Draw a diagram when structure matters.** ASCII is fine. Use it to show flows, states, relationships — not to impress.
```
User offline → messages queue → user reconnects → messages delivered in order
                    ↑
             (stored locally, max 500)
```

**Never show code.** If you need to illustrate logic, use plain English steps or a diagram. If PM asks "how does it work?" — explain the idea, not the implementation.

**No jargon without explanation.** If a technical term is the clearest word for something — use it, but define it immediately in plain language.
> ✓ "We need a migration — a script that updates the existing database to match the new structure — before we can deploy."
> ✗ "The schema migration needs to run before the rollout."
> ✗ "We need to update the database." (too vague — PM might not know what needs to be done)

**"Want to go deeper?"** End explanations with this offer. PM can ask for more detail on any part. Never assume they want the full technical picture unless they ask.

**Report problems without panic.**
> ✓ "Found an issue: if a user leaves a group while offline, they could still receive messages after rejoining. This affects the 'leave group' scenario. Options: fix now (adds ~1 day) or ship with a known limitation and fix in the next iteration."
> ✗ "NullPointerException in GroupMembershipService at line 247 when userId is null in leaveGroup()."
