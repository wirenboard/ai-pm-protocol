> **Topic file of the orchestration spec** — read on demand from `WORKFLOW.md`'s navigation map. The always-on one-liner forms of these rules (project-boundary, edit-ownership, remote-system, `pm-*`-not-`wb-*`, git-flow skeleton) live in `WORKFLOW.md` and hold on every action; this file is the **full** detail — the carve-outs, the forbidden/allowed lists, the hook mechanics. Read it before acting on the full rule (e.g. when an edit-ownership carve-out or a remote-system boundary judgement is in play).

## Boundary, edit-ownership, and remote-system rules (full)

**Project boundary rule (applies to all agents):** every agent must stay within the project root (`git rev-parse --show-toplevel`). Never search, read, or write outside it — no parent directories, no sibling repositories. When the orchestrator spawns an agent, include the absolute project root in the prompt if the working directory may be a subdirectory.

**Edit-ownership rule (applies to the orchestrator inside the local repo):** the orchestrator legitimately writes the **outputs of the processes it drives** — the PM conversation produces the backlog and (via `/pm-plan`) the contracts; `/pm-plan` produces the plan; running `code-review` produces the Pass-2 code-review trail; finding a structural protocol gap produces a protocol-feedback report. What it never does is **freehand-edit canon owned by an autonomous agent**. Agent-owned content artefacts are anything that captures the project's design, code, or canon — source code, schemas, manifests, `docs/architecture.md`, `docs/user-journeys.md`, `docs/stack-notes.md`, feature plans under `docs/features/`, the **plan-compliance verdict** of a review artifact under `.ai-pm/reviews/` (everything through `## Verdict`, owned by `pm-plan-checker`), the **product-readiness gap report** `.ai-pm/reviews/<topic>_advocate.md` / `bootstrap_advocate.md` (everything through `## Verdict`, owned by `pm-product-advocate`), arch notes under `.ai-pm/arch/`, audit reports under `.ai-pm/audits/`. Each of those has an agent that owns it (`pm-coder`, `pm-architect` — including `docs/user-journeys.md`, `pm-stack-researcher`, `pm-codebase-reader`, `pm-auditor`, `pm-plan-checker`, `pm-product-advocate`, `pm-plan` as a command). When one needs to change — even by one line — the orchestrator respawns the responsible agent with a focused prompt, not picks up the editor itself.

**The one carve-out inside `.ai-pm/reviews/<topic>_review.md`:** `pm-plan-checker` owns everything through `## Verdict`; the orchestrator owns ONLY the `## Code review findings` / `## Code review` trail below it — the Pass-2 code-review record it writes in Step 5 Pass 2. This is the **single** review section the orchestrator writes and the **only** exception to "the orchestrator does not edit content artefacts". It is the output of a process the orchestrator drives (it runs `code-review` and already holds the findings) — routing that data through an agent would pay a hop for data already in hand. The exception is made safe by a **gate, not by discipline**: `pm-pr-prep` refuses to release a feature whose `## Code review` section is unstamped (step 0), and `pm-auditor` blocks an unstamped trail (dimension 1). A manual step with no gate degrades silently — so this one has a gate.

**A second carve-out, in `.ai-pm/reviews/<topic>_advocate.md` (and `bootstrap_advocate.md`):** `pm-product-advocate` owns everything through `## Verdict`; the orchestrator owns ONLY the `## Resolutions` trail below it — the recorded PM answer / descope-with-rationale for each gap, one numbered entry per gap, the output of the one `AskUserQuestion` pass it drives. Like the Pass-2 code-review trail, it is the output of a process the orchestrator drives (it holds the PM's answers in hand from that pass), and it is made safe by a **gate, not by discipline**: `pm-plan-checker` (DoD) and `pm-auditor` (dimension 1) block a user-facing feature whose advocate gate is unresolved. A `clean` verdict (zero gaps) needs **no** `## Resolutions` trail — `clean` and `gaps: N`-with-N-resolutions are the two resolved states. In `autonomous` mode (`### Decision authority` in `workflow/decision-authority.md`) each entry additionally carries an **`auto` | `escalated`** marker (an interactive answer is the unmarked baseline); the trail stays orchestrator-owned and gate-backed, the `gaps: N` ↔ N-resolutions count-match is unchanged, and a `clean` verdict still needs no trail.

**Orchestration artefacts** are different: they are the by-products of the orchestrator's own job of talking to the PM and routing work. `.ai-pm/backlog.md` entries, recording PM decisions, the Pass-2 code-review trail just described, protocol-gap reports under `.ai-pm/protocol-feedback/` (see "When the protocol itself has a gap" in `workflow/protocol-gap.md`), choosing remediation order for audit findings, kicking off git operations (commits, branches, tags, push), and invoking the project's own deployment script — all of these are normal orchestrator work. Spawning a separate "backlog-curator" agent for these would be overhead with no upside.

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

## Hook-level enforcement

The rules above are also enforced as Claude Code `PreToolUse` hooks shipped in `.claude/settings.json`, so they hold even if a future session does not re-read this file:

- `ssh ... sed -i / vi / vim / nano / tee / > file` on a remote host — **denied** automatically (direct content edit; this is the silent-fix path the rule is designed to block).
- `ssh ... systemctl restart / docker compose / docker exec / apt / npm install / kubectl apply / rm / cp / mv / mkdir / touch` on a remote host — **asked** for confirmation (legitimate when it is deployment, PM-initiated maintenance, or runtime-state work; the prompt makes that intent explicit).
- `git push --force / -f / --force-with-lease` — **asked** (rewrites remote history).
- `git commit --no-verify / --no-gpg-sign` — **asked** (bypasses pre-commit / signing).
- Spawning a `wb-*` role agent or loading a `wb-*` role skill that occupies a protocol seat (`wb-development:coder` / `code-reviewer` / `design-review` / `pr-prep` / `plan-feature`, `wb-git:workflow` / `pr-author`) — **denied** automatically, with a pointer to the `pm-*` equivalent. This is the mechanical form of the "use only these agents" rule above. It is a **named deny-list, never an "everything but `pm-*`" block**: built-in engines (`code-review`, `deep-research`) and `wb-*` knowledge skills (`codestyle`, `package-bootstrap`, platform skills) are explicitly not gated — the protocol delegates engines and platform knowledge to them on purpose.

On every change-intent prompt a `UserPromptSubmit` hook injects a one-paragraph reminder of this route (Step 0 → `/pm-plan` → coder → review → pr-prep; orchestrator does not edit content artefacts; use `pm-*`, not `wb-*` role skills). It stays silent on ordinary conversation. This is the soft, every-turn counterpart to the hard PreToolUse guard above — it keeps the protocol asserted without depending on a session re-reading this file.

Read-only ssh diagnostics (`cat` for reading, `ls`, `journalctl`, `systemctl status`, `docker logs`, `docker ps`, native status / audit / info commands) are not gated. Local mutating commands (anything not over ssh) are not gated either — they are normal dev work.

Throwaway/diagnostic scripts go in `.claude/tmp/` (inside the project root, so they pass the path-boundary hooks), not `/tmp`. The directory is git-ignored — it is scratch, never committed.

Hooks themselves are tested by `tests/hooks.sh`, gated by `.github/workflows/lint-hooks.yml` on every PR that touches the hooks or their tests. A regex regression now fails CI rather than silently degrading the gate.

## Git workflow — orchestrator owns this, not subagents

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
