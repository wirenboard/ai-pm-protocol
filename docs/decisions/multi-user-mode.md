# Multi-user collaboration mode — research + design sketch

Researched 2026-06-28 via a fan-out web-research run (sources cited inline) plus
the established git/forge domain. **Honesty caveat:** the research harness hit a
transient server-side rate-limit during its adversarial-verification and
synthesis stages, so most extracted claims did not get their 3-vote check. Every
claim below is sourced; confidence is marked **[src]** = a source URL was fetched
and quoted in the run, **[kn]** = established, widely-documented domain fact not
re-verified this run. No claim here is an unsourced guess.

The question: add **opt-in multi-user (team) development** to the protocol —
pull → branch → commit → push → PR → **colleague review** → merge — with forge
issues optionally replacing the file backlog, the AI Reviewer kept as a mandatory
floor, and merge conflicts handled safely. Forge-agnostic (GitHub / GitLab /
Gitea). Operator decisions (2026-06-28): AI review is a permanent floor, colleague
review layers **on top**; forge support is **abstracted from day one**; output is
research **plus** a design sketch; conflict handling is in scope.

## The headline finding

**Most of the requested flow already exists in the protocol.** The git flow
(`PROTOCOL.md`, `## Git flow`) is already pull-main → fresh-branch → commit → push
→ PR; the local merge-gate (AI-Reviewer stamp) plus the remote `quality`
branch-protection check (`orchestrator.md`, `## Your seat` / `## Setup` step 5)
already gate merge. So
multi-user mode is **not a new pipeline** — it is **a few additive deltas** on the
existing one (config + side-tool + an adapter abstraction), never core-loop bloat
(`docs/decisions/direction.md`, the architecture principle). The one place that
looked like a hard new problem — making the AI review a *remote* floor for a team —
is resolved by **not** doing it: the AI verdict rides the PR for visibility, the
mechanical remote floor stays quality-CI + the forge's own approval rules (§4,
Decisions).

## 1 — Team git flow (the baseline is sound)

- GitHub Flow = a single always-deployable `main` + short-lived feature branches;
  trunk-based development eliminates long-lived branches entirely. **[src]**
  (steven-giesel.com GitHub-Flow writeup; TBD sources). The protocol's per-PR
  short branch already matches this; nothing to change in the loop shape.
- The dominant failure modes are **stale branches, long-lived branches, and large
  PRs** — all conflict amplifiers. **[kn]** The protocol's atomic-one-purpose-step
  rule and "cut a fresh branch from main, never resolve a conflict-merge"
  (`## Git flow`) already counter these; multi-user only raises the stakes.
- **Delta:** none to the flow. The team dimension is enforced at the *forge*, not
  in the loop prose (§4).

## 2 — Forge issues as the backlog (forge-agnostic abstraction)

The three forges share one issue model: **title · body · labels · state ·
assignee · milestone · comments · cross-links**. Each exposes it via CLI:

- **GitHub** `gh issue create` — `-t/--title`, `-b/--body` or `-F/--body-file -`
  (stdin, the agent's non-interactive path), `-l/--label`, `-a/--assignee @me`,
  `-m/--milestone`. **[src]** (cli.github.com/manual/gh_issue_create).
- **GitLab** `glab issue create` — `-t/--title`, `-d/--description`, `-l/--label`,
  `-m/--milestone`, `-a/--assignee`. **[src]** (docs.gitlab.com/cli/issue/create).
- **Gitea** `tea issue create` + the Gitea REST API `/repos/{o}/{r}/issues` —
  same fields. **[kn]** (tea is the official Gitea CLI; API is Swagger-documented).
- Issue↔PR linking via `closes #N` / `fixes #N` in the PR body auto-closes the
  issue on merge, on all three. **[kn]**
- The GitHub Copilot coding agent already treats **the issue as the unit of work**
  assigned to the agent (web / mobile / `gh`), confirming the issue-as-task model
  for AI agents. **[src]** (github.blog coding-agent post).

**Trade-off (file backlog vs forge issues):** the file (`.ai-dev/backlog.md`) is
offline, single-home, git-versioned, but invisible to non-cloning teammates. Forge
issues are **online, visible to the whole team, assignable, and the single source
of truth across people** — at the cost of offline access and a network dependency.
**[kn]** This is exactly the Operator's stated motivation.

**Design implication:** the backlog becomes a **swappable adapter point** — `file`
(today's `.ai-dev/backlog.md`, the zero-config default) or `forge` (issues via the
CLI). The neutral act is *"record / read a backlog item"*; the adapter realises it
as a file edit or a `gh/glab/tea issue` call. This mirrors the existing
core+adapter split exactly (`docs/architecture.md ## Integration`).

## 3 — Merge-conflict handling (avoid first, resolve carefully, escalate early)

- **Avoid:** small atomic PRs, short-lived branches, frequent sync from main,
  disjoint file ownership, feature flags. **[kn]** The protocol already mandates
  atomic steps and fresh branches; multi-user adds *sync-before-push* discipline.
- **Resolve:** `git rerere` records a conflict resolution and **reapplies it
  automatically when the same conflict recurs**, targeting the long-lived-branch
  repeated-conflict failure mode. **[src]** (git-scm.com/docs/git-rerere). The
  protocol's existing rule — "if conflicts appear, the branch is stale; cut a
  fresh one from main, never commit a resolve-merge" (`## Git flow`) — is the
  **safe default** and should stay the floor.
- **AI-agent-specific risk:** an agent resolving conflicts blindly can silently
  drop the other author's change (a semantically-wrong but textually-clean merge).
  **[kn]** So the protocol's stance should be: a Builder **never auto-resolves a
  non-trivial conflict** — it re-syncs from main, and on a real content conflict
  **escalates to the Operator** (this is just the existing "stale branch ⇒ stop"
  rule, made explicit for the concurrent-author case). Trivial, mechanical
  conflicts (a CHANGELOG/version line, an import-order clash) may be re-applied,
  named in the plan progress note.

## 4 — Human + AI review combined (defense in depth, AI as the floor)

The mechanical merge gate on every forge is **required-status-checks +
required-approvals**, both set in branch protection:

- GitHub branch protection can **require a configurable number of approving PR
  reviews** before merge, from write-access users or a **CODEOWNER**. **[src,
  2-0 verified]** (docs.github.com about-protected-branches).
- It can **require status checks to pass**, and **"require branches to be up to
  date" (strict)** so a PR is tested against the latest base. **[src, 2-0
  verified]** (docs.github.com managing-a-branch-protection-rule).
- `enforce_admins: true` closes the admin-can-still-direct-push hole. **[src]**
  (already used in `## Setup` step 5's recipe).
- GitLab = *approval rules* (`approvals_required`); Gitea = *required approvals* +
  CODEOWNERS. **[kn]** Same shape, different field names — an adapter row.

**The real two-layer picture — and the gap multi-user exposes.** Today the
protocol has TWO distinct review surfaces, and they are not the same thing:

- the **AI Reviewer** produces a **local, transient stamp** (`.ai-dev/reviews/`),
  read by the local merge-gate deny and **deleted at ship** (`PROTOCOL.md`
  beat 5; the gate "checks the stamp's presence", `PROTOCOL.md ## Enforcement`).
  It is **not** a remote forge check.
- the **remote required-status-check** is the **`quality`** suite (linters, tests),
  set in branch protection — and it is deliberately **model-independent**, "the
  floor that survives a non-compliant model or a dead local plugin"
  (`orchestrator.md ## Your seat`, `## Setup` step 5). It is the quality suite, not
  the AI review.

The colleague's approval maps cleanly onto a third, independent forge mechanism —
**required-approvals ≥ 1** — which stacks with the quality status-check without
duplicating it (`main` moves only when both are satisfied). The configurable-
approvals capability itself is **[src, 2-0 verified]**; the stacking is a derived
inference **[kn]**.

**Resolution — the mechanical remote floor, and where the AI verdict goes**
(Operator, 2026-06-28):

- **Human approval is out of protocol scope.** *Whatever* forge the team uses
  (GitHub, GitLab, Gitea, GitVerse, …) owns required-approvals and CODEOWNERS — this
  is forge-agnostic precisely because the protocol does not touch it; the team
  configures it on their own repo. The protocol does **not** manage an approval
  count — it simply does not interfere. So the mechanical remote floor for a team =
  the `quality` required-status-check (already wired) **+** the team's own forge
  approval rules. (Note: the *backlog* adapter — §sketch — targets the three forges
  whose issue CLIs we wire, `github|gitlab|gitea`; approval-ownership above is
  broader because we implement nothing for it.)
- **The AI-review verdict is surfaced on the PR, not turned into a CI gate.** At
  ship, the orchestrator copies the AI Reviewer's verdict into the **PR
  description** and attaches the **full review file** to the PR. This **reuses the
  already-produced local stamp** — zero new CI machinery, no AI-in-CI. Teammates
  and the human reviewer read the AI's findings directly on the PR, and "pull the
  review out" for diagnosis when something is wrong.
- **Honesty — this is visibility + reuse, NOT a tamper-proof mechanical gate.** A
  PR description is author-written (and the author may be the agent), so an attached
  verdict cannot *count* as a blocking check the way a status check does. The AI
  review stays exactly what it is today: a **local** gate (the orchestrator will not
  push without the stamp) **plus**, now, a **visible artifact** on the PR. The
  thing that mechanically stops a bad merge for a teammate remains quality-CI + the
  forge's approval rules — by design (`docs/decisions/persona-floor-external-substitute.md`:
  the model-independent remote floor is deliberately the quality suite, never the
  AI review). This closes the *visibility* gap cheaply; it does not (and need not)
  promote AI review into a mechanical remote gate.

## 5 — Opt-in / configurability

Multi-user is **off by default** (single-user is the common case, per the
Operator). A new config key gates it. Forge presence is **auto-detectable** (an
`origin` remote whose host resolves to a known forge) — but detection only
*enables the offer*; the mode itself stays an explicit Operator choice, mirroring
every other setup field's "never silently flip rigor" discipline.

## 6 — Prior art (what others do, what's missing)

- **GitHub Copilot coding agent** — issue-as-work-unit, opens a PR, and **forbids
  the issue creator from being the final approver**, forcing an independent human.
  **[src]** This is the strongest external validation of our exact design: *agent
  builds, independent human approves on top*. **[src]** (github.blog).
- **Aider / Cursor / OpenHands** — single-developer-centric; PR/issue integration
  is thin or manual; concurrent multi-author coordination is largely absent. **[kn]**
- **Gap nobody fills well:** a *protocol-level* contract that keeps an independent
  (AI) review mandatory **and** layers human approval **and** stays forge-agnostic.
  That is the niche this delta occupies.

## Design sketch — how it lands in the protocol

All additive; no new loop beat; thin-core preserved.

1. **Config (`.ai-dev/config.json`)** — one new block, e.g.
   `"collaboration": { "team": true|false, "backlog": "file|forge",
   "forge": "github|gitlab|gitea|auto" }` (shipped as `team` boolean, not a
   `mode` enum — to avoid the `mode`/`profile` axis collision). **No approval knob** — required-approvals
   is the forge's setting, not ours (Operator decision). Absent ⇒ today's behaviour
   byte-for-byte (`mode:solo`, `backlog:file`) — fail-safe to the single-user
   default, like every existing field.
2. **Backlog adapter** — a neutral *record/read-a-backlog-item* contract point in
   `tool-map.json`, realised as a file edit (`file`) or a forge-issue CLI call
   (`forge`). The orchestrator's backlog/feedback/audit-dispatch references
   (`orchestrator.md`) point at the contract point, not at `.ai-dev/backlog.md`
   directly. One home, swappable — exactly the role/quality/platform pattern.
   **Migration on `file → forge`** (Operator decision): export the open
   `.ai-dev/backlog.md` items to forge issues, then **empty the local file down to a
   marker** that points at the forge ("tickets now live in the forge — see issues").
   No two-way sync; the forge becomes the single home.
3. **Review surfaces in team mode** — **no core-loop change, no new CI.** The human
   approval is the **forge's** own required-approvals + CODEOWNERS — the team owns
   it, the protocol does not manage a count (Operator decision). The **AI Reviewer
   stays the local floor** (orchestrator will not push without the stamp), and at
   ship the orchestrator **copies the verdict into the PR description and attaches
   the review file** — reusing the already-produced stamp for team visibility and
   diagnosis. Honesty (§4): that PR attachment is *visibility*, not a mechanical
   gate; the mechanical remote floor stays quality-CI + the forge's approval rules.
4. **Conflict discipline** — a short addition to the Builder's `## Build` and the
   orchestrator's `## When something is off`: in team mode, *sync from main before
   push*; a non-trivial conflict ⇒ re-cut from main / escalate, **never blind
   auto-resolve**. Mostly a sharpening of the existing stale-branch rule.
5. **Side-tool, not core bloat** — the whole capability is most naturally a
   **capability module** (`team-collaboration`, per-kind default OFF) plus the
   config block + the backlog adapter point. The thin core (`PROTOCOL.md`) gains at
   most a one-line pointer, not a section.

## Decisions (Operator, 2026-06-28)

The four open questions are resolved:

- **Remote AI-review floor:** **no AI-in-CI.** The AI verdict is copied into the PR
  description + attached as the review file — visibility & diagnostic reuse of the
  existing local stamp, *not* a mechanical remote gate (§4). The mechanical remote
  floor stays quality-CI + the forge's own approval rules.
- **Human approval:** **out of protocol scope** — the forge/team owns
  required-approvals; the protocol does not manage a count. (No approval config knob.)
- **Backlog migration (`file → forge`):** export open backlog items to forge issues,
  then empty the local file to a marker pointing at the forge. No two-way sync.
- **Packaging:** ship as a **capability module** (`team-collaboration`, per-kind
  default OFF) + the config block + the backlog adapter point.

This doc is research + the agreed design decisions — it grounds the feature, it does
not implement one. Implementation (the module, the adapter point, the migration, the
PR-attach step) is its own loop pass.
