> **Topic file of the orchestration spec** — read on demand from `WORKFLOW.md`'s navigation map. The Step 0–7 *skeleton* (the named steps in order, each a one-liner) lives in `WORKFLOW.md` as the router; this file is the **full body** of each step. Read it before driving a feature through the pipeline.

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

For a user-facing feature I spawn `pm-product-advocate` (tier `per-feature`). It matches the plan + contract + `docs/product.md` + `docs/user-journeys.md` against `### Foundational product questions` (in `workflow/foundational-questions.md`) and writes its gap report with a `gaps: N` / `clean` verdict.

- **Zero gaps (`clean`)** — silent pass. I record the resolved artifact and proceed to Step 4; no `AskUserQuestion`, no ceremony.
- **Gaps (`gaps: N`)** — I relay all N gap questions to you in **one** `AskUserQuestion` pass. For each gap you either answer it or consciously descope it with a rationale. I record each answer/descope as a numbered entry in the artifact's `## Resolutions` trail. The coder handoff stays **blocked** until every gap is answered or descoped — never a silent skip, never a permanent veto.

**Autonomous branch (additive — fires only when the effective authority is `autonomous`; see `### Decision authority` in `workflow/decision-authority.md`).** **Read `workflow/decision-authority.md` before running the derivability test below** (it carries the derivability test, the procedural-gate progression, and the escalate-regardless cap this branch executes). The advocate spawn is **unchanged** — same prompt, same `clean` / `gaps: N` verdict. When the effective authority for this feature is `autonomous` (per-feature plan `Decision authority:` line → `.ai-pm/decision-authority.md` `mode:` → `interactive`), the orchestrator handles a `gaps: N` verdict differently:

- For each gap I run the **derivability test** (`### Decision authority`): is the answer derivable from cited project canon + the bootstrap mandate?
- **Derivable** → I **announce** it (fork · chosen option · rationale citing the canon ref · invariants · `(proceeding — interrupt to override)`), then record an `auto` `## Resolutions` entry carrying the cited passage + rationale, committed before acting. No `AskUserQuestion` for this gap.
- **Not derivable, OR a `### Security-relevant surfaces` item on a security-bearing project, OR a PM-marked irreversible / high-stakes fork** → I escalate it (the cap): record an `escalated` `## Resolutions` entry and add it to the escalation set.
- The **escalation set** is what reaches the existing **one** `AskUserQuestion` pass (the interactive path, narrowed to just the escalations). An **empty escalation set ⇒ fully silent** — announcements only, no `AskUserQuestion`.

The interactive branch above is **byte-unchanged** (and is every existing project, by the default). This autonomous path is purely additive, and merge/ship still stays manual in both scopes.

A bootstrap variant of this gate runs once at `/pm-bootstrap` (tier `bootstrap`) — see that command. This is soft enforcement, backstopped (not by-discipline): `pm-plan-checker`'s DoD blocks a user-facing feature whose advocate gate is unresolved, and `pm-auditor` blocks a merged user-facing feature with no resolved advocate artifact. There is **no hook** — "is this user-facing / is the product under-specified" is a semantic judgement a regex cannot make.

**Step 4 — Coder implements.** Works on a feature branch, commits atomically as it goes, runs pipeline, never touches existing tests. When a coder stops at a blocking question and the same agent cannot be continued, the orchestrator spawns a fresh agent with a brief that explicitly quotes the stopped agent's conclusions from `state/current.md` — this is the protocol's designed fault-tolerance path, not an emergency workaround.

If the plan's **Docs to update** section is non-empty — before starting the review loop, spawn the owning agent with a focused prompt: `pm-architect` for `docs/architecture.md`, `docs/user-journeys.md`, `docs/threat-model.md`, **or `README.md`** changes (pm-architect owns all of these; `README.md` rides this same handoff when the `/pm-plan` README-currency check named it). This satisfies DoD item 8 before pm-plan-checker runs.

After coder (and any doc agents) finish, I tell you:
- What the feature now does (user perspective, no code)
- How to try it yourself step by step
- Anything that needs your attention

**Step 5 — Review loop.** Two sequential passes. You don't see either — they run until both pass, then you hear the result.

**Pass 1 — Plan compliance** (`pm-plan-checker`): are all plan scenarios implemented and tested? contracts honored? interaction scenarios covered? DoD satisfied? Writes `.ai-pm/reviews/<topic>_review.md`.
- Blocking → `pm-coder` fixes → pass 1 re-runs. Repeat until clean.

**Pass 2 — Technical quality** (`code-review`): bugs, security, dead code, simplifications. Only starts after pass 1 is clean. **Pass 2 routes on project kind** (`### Project kind` in `workflow/project-kind.md`): on a `software` project (and every kind-absent project) it runs `code-review` exactly as described below — unchanged. On a `documentation`-kind project it instead runs **editorial review + the structural-lint pre-gate + the `## Validation` gate** (see the **No-code validation discipline** under `### Project kind`); the `## Validation: NOT YET RUN → <date> — <method> — passed` stamp replaces the `## Code review` stamp as the load-bearing marker, enforced at the same `pm-pr-prep` step 0 / `pm-auditor` dimension 1 gates.
- **Cross-model resolution (which *model* runs this review — `### Cross-model review` in `workflow/review-typology.md`).** Before running `code-review`, resolve `review-diff-model` per `### Cross-model review` (read `.ai-pm/review-config.md` fresh — absent/unrecognized ⇒ the rule's default). When it resolves to a model **≠ session** and the change is in `review-scope` (`auto` = every change; `high-risk` = only a security-surface / irreversible / PM-flagged change), run the built-in `code-review` **inside a subagent pinned to that model** and announce it per the per-review announce ("Code review on Sonnet…"). When it resolves to `session`, equals the session, or the model is unavailable, run on the session and announce the fallback line. **The engine, the `## Code review` trail, the stamp, and the `pm-pr-prep` gate are unchanged — only the model changes.** Read the rule by name; do not re-encode the enum/default/Haiku-blacklist/fallback here.
- The review file is **born with a loud marker** — `pm-plan-checker` writes the section as `## Code review: NOT YET RUN`, never an empty `## Code review` heading. An empty section reads as "no findings / passed" to a quick eye or `grep`; a loud marker reads as "not done". A skeleton that looks filled is worse than an absent one.
- Apply **review history awareness** per `### Review history awareness` in `workflow/review-typology.md` — dedup against the feature's existing `.ai-pm/reviews/<topic>_review.md` and `.ai-pm/backlog.md` accepted entries before recording any finding.
- Orchestrator runs `code-review`, takes findings from the output, and runs the **seam-completeness angle** per `### Seam-completeness per-diff angle` in `workflow/review-typology.md` (a separate Agent with the 3-item checklist — exception-boundary, store-contract-consistency, symmetry-of-paranoia). Both code-review findings and seam-check findings are appended to `.ai-pm/reviews/<topic>_review.md` as `## Code review findings` — so `pm-coder` has a persistent artifact to read.
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

**Step 5.5 — Optional: run it for real.** When the feature is runnable locally, before ship I can invoke the built-in `verify` / `run` skill to actually launch the app and exercise the new behaviour — confirming it *works*, not just that tests pass. This catches the "green tests, broken feature" class. I report what I observed. For features that need real hardware or your specific environment I skip this and give you the checklist instead (Step 6 option A). Before I exercise anything on real hardware, I run the **Blast-radius preflight** (see "When you say it doesn't work in production" in `workflow/incident.md`): if the target is coupled to a live external system whose state a local revert won't undo, I stop and surface the blast radius to you before acting — whether I'm about to exercise the behaviour myself or hand over the checklist.

**Step 6 — Ship.** I verify git state, then ask:

> "Ready to open the PR. How do you want to proceed?
> A) **Test first** — I deploy and give you a checklist of what to verify.
> B) **Open PR, test before merging** — you test from CI artifacts or the branch, then merge.
> C) **Ship now** — open PR, merge straight away."

Before running `pm-pr-prep`, I archive the state: copy `.ai-pm/state/current.md` to `.ai-pm/state/archive/<topic>-<date>.md`, reset `current.md` to `Status: idle`, and commit both on the feature branch. The archive therefore lands in the same PR as the feature it describes.

I wait for your answer before running `pm-pr-prep`. After merge: `git checkout main && git pull`.

I never add anything to `.ai-pm/backlog.md` without an explicit yes from you (product note backlog) or a clear technical reason recorded alongside the entry. The backlog is an orchestration artefact — I write it directly.

`.ai-pm/backlog.md` is created on first use — not upfront.

After you merge: pull main locally and we're ready for the next feature. **When the effective authority is `autonomous`**, instead of waiting for you to name the next feature I select-announce-proceed per `### Decision authority` in `workflow/decision-authority.md` (the feature-selection scope, which handles the empty-backlog escalation) — escalating only when it directs.

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
