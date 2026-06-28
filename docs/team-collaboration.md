# Team collaboration — onboarding & usage

How a team turns on and runs the opt-in **multi-user (team) mode**: pull → branch →
build → push → PR → **colleague approval on the forge** → merge, with the AI Reviewer
kept as a floor and forge issues optionally replacing the file backlog.

This is the **HOW-TO**. The *why* — the design, the trade-offs, the honesty calls —
lives in [`docs/decisions/multi-user-mode.md`](decisions/multi-user-mode.md); this
guide does not restate it.

You run every step below **in your own project's session**, not here — this protocol
repo cannot reach into a downstream project (the project boundary).

## 0 — Prerequisites

- A forge with issues + branch protection: **GitHub**, **GitLab**, or **Gitea**.
- **Admin** access to the repo (branch protection in step 3 needs it).
- The forge CLI installed and authenticated: `gh`, `glab`, or `tea`.

## 1 — Install (or upgrade) the protocol in the team repo

Get the team repo onto a current protocol version. The install command, and the
**clear-the-npx-cache** caveat that otherwise makes an upgrade silently no-op, are in
the README — [`## Install`](../README.md#install) and
[`## Updating an existing install`](../README.md#updating-an-existing-install). Run it
once for the repo; each developer also installs in their own clone (step 5).

## 2 — Enable team mode (automated)

In the team repo's session, the Operator just states the intent in plain language —
*"switch this project to team development"* — in any language. The orchestrator:

- flips `collaboration.team: true`;
- asks the **backlog** choice — `file` (today's `.ai-dev/backlog.md`) vs **`forge`**
  (issues replace the file) — pick **forge** if you want tasks visible online to the
  whole team — and confirms the **forge** (auto-detected from the `origin` host, or
  named by you);
- enables the `team-collaboration` capability module (the conflict-avoidance
  discipline);
- applies the config (re-assembles the agents).

No setup re-run is needed — this is the mid-stream switch. Procedure:
[`orchestrator.md`](../src/agents/orchestrator.md) `## Setup` (the `collaboration`
question) and *Collaboration switch mid-stream*.

## 3 — ⚠ Wire the forge branch-protection (THE load-bearing manual step — do not skip)

This is what makes colleague review an actual **merge gate**. On the repo's `main`,
require:

- the **`quality`** status check to pass;
- **≥ 1 approving review** before merge;
- **admin enforcement** (so an admin cannot direct-push past it).

The orchestrator **prints the ready recipe** ([`orchestrator.md`](../src/agents/orchestrator.md)
`## Setup` step 5); a repo **admin runs it** (the protocol never runs the privileged
apply for you). No CLI or no admin scope ⇒ set the same rule in the forge's web UI.

**Without this step, "colleague review" is a convention, not a gate** — `main` can
move with no approval. This is the one step that turns the team flow from a habit
into something the forge enforces. Do not skip it.

## 4 — Backlog migration (only if you chose `backlog: forge`)

When you switch to `forge`, the orchestrator offers to export the open
`.ai-dev/backlog.md` items to forge **issues**, then retire the local file to a
marker that points at the forge. Thereafter every task and bug lives as an issue —
the forge is the single home. Procedure: [`orchestrator.md`](../src/agents/orchestrator.md)
`## Backlog`; the issue CLI verbs per forge are in
[`src/adapter/forge-map.json`](../src/adapter/forge-map.json).

## 5 — Each developer works the loop

Every developer **installs the protocol in their own clone** (step 1) — so each gets
the role agents and the local enforcement layer. Then the loop, per feature:

1. pull `main`;
2. cut a fresh feature branch;
3. build until the quality suite is green;
4. **sync from `main` before push** (team mode does this for you) and push;
5. open a PR;
6. get a **colleague's approval on the forge**;
7. merge on the Operator's go.

Keep PRs **small and atomic** and sync from `main` often — that is what keeps
conflicts rare. A **real content conflict is escalated, never blind-resolved**: an
agent resolving blindly can silently drop a teammate's change, so the protocol
re-cuts from `main` or stops and asks.

## 6 — When it fails you

Team mode is **N=1** — the first real team run is its first real test. When the
protocol gets in your way (a deny blocking legitimate work, a gap, a gate you cannot
satisfy honestly), use the **downstream-feedback** channel: the orchestrator drafts a
leak-swept self-report and shows you the exact text before anything is sent
([`orchestrator.md`](../src/agents/orchestrator.md) `## Downstream feedback`). That
is how the rough edges of the first team run come back to be fixed.

## Honest limits — read these before you rely on the mode

- **Not yet battle-tested.** The mode shipped as design, config, persona discipline,
  and the forge adapter. It has **not** been exercised end-to-end with real concurrent
  developers. Expect the first team run to surface rough edges.
- **AI review is a local gate + a visible PR artifact, not a remote mechanical gate.**
  The AI Reviewer stops *your* push locally, and its verdict is attached to the PR for
  everyone to read — but a teammate who does not run the protocol agent gets only the
  `quality` CI check + the forge's human approval. That is by design
  ([`multi-user-mode.md`](decisions/multi-user-mode.md) §4), not a gap to close.
- **Some forge flags are unverified.** A few `glab` / `tea` issue-CLI flags in
  [`forge-map.json`](../src/adapter/forge-map.json) are marked `[unverified]`. On a
  non-GitHub forge the orchestrator may confirm a flag (`<cli> issue <op> --help`)
  before using it.
