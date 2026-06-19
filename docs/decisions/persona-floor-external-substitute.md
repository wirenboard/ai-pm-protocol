# The external substitute for the ask-class on a platform that cannot ask

**Decision (2026-06-19).** The Operator picked **F2-1** (loud, mandatory, recorded
branch-protection offer — the Orchestrator prints the `gh api` recipe; the Operator
runs it) and **F5-1** (accept the audit cadence as `[persona]`, with branch protection
named as its real safety floor). Both reframes shipped together as one small prose
feature (`orchestrator.md` `## Setup` step 5 + `## Your seat` + `## Audit`).
**F2-2 — the agent runs the `gh api` call itself on confirm — is the deferred
fast-follow**, a separate feature, not built here. F5-2 (the Claude-only inject nudge)
stays parked. The analysis below is the grounding for these calls.

**Question (2026-06-19, batch B of the persona-floor epic).** Direction A shipped
(5.18.0, F1/F4) — hardening the engine so the merge-gate and the trunk-push deny no
longer depend on model cooperation. Two design holes remain:

- **F2** — on OpenCode the plugin's `tool.execute.before` can only allow or deny;
  it has **no `ask` return**, so the whole ask-class (`force-push`,
  `ssh-mutating-action`, `git-commit-no-verify`, `merge-topic-unresolvable`) falls
  back to **persona**. A non-compliant Orchestrator model on OpenCode therefore has
  almost no mechanical backstop for those acts. The intended compensating control —
  the once-per-project forge branch-protection + required-CI offer
  (`orchestrator.md ## Your seat`) — is today a soft `[persona]` offer the downstream
  symptom suggests was never set up. **Make it mandatory/loud and name it explicitly
  as the ask-class substitute on OpenCode.**
- **F5** — the audit cadence (the `lite`/`yolo` compensating control) is itself
  `[persona]`: a runaway high-throughput session skips the every-N-features offer.

Neither can ever become `[mechanical]` in our own deny layer — they are positive acts
(spawn a reviewer, offer a setting) and an external-system setting. The honest framing
is *what each layer actually guarantees*, not a new claim of mechanical enforcement.

---

## What each layer actually guarantees (the honesty frame)

| Layer | Where it lives | What it guarantees | What it cannot |
| --- | --- | --- | --- |
| Local deny (plugin/hook) | `engine.mjs` + `deny-rules.json` | Blocks a tool call **on the model's own machine**, when the plugin is loaded. On OpenCode the ask-class degrades to persona. | Force a positive act; reach the remote; survive a dead/unloaded plugin. |
| Persona prose | role agents | Shapes a cooperative model's reasoning. | Stop a non-compliant model — it emits no blockable call the enforcer can read. |
| Remote forge protection | GitHub branch protection + required status checks | **Holds regardless of model, platform, or whether the plugin even loaded** — `main` cannot move except through a PR whose CI is green. | Be set up silently; exist offline / without admin token. |

The load-bearing insight from the downstream incident (backlog, 5.17.4 root cause): a
**dead plugin** had *zero* local mechanical protection — every `[mechanical]` row was
silently absent. The only layer that would have held in that world is the **remote
forge protection**, because it is enforced by GitHub, not by the agent's machine. That
is precisely why F2's substitute is the right compensating control: it is the one floor
that survives both a non-compliant model *and* a non-functional local deny layer.

---

## F2 — making the forge substitute robust

### Mechanism evidence — automating branch protection via `gh api`

Verified 2026-06-19 against GitHub REST docs + `gh` CLI behaviour (confidence: high
for the endpoint shape; medium for the exact nullable-required-field set — triangulated
across the official docs and two community recipes, see Sources).

- **Endpoint:** `PUT /repos/{owner}/{repo}/branches/{branch}/protection`.
- **Auth scope:** **admin (or owner) on the repo.** A plain push token is not enough.
  `gh auth status` shows the active scopes; the call 403s without admin. This is the
  central constraint — many Operators run the loop with a token that *cannot* set
  protection, so the path must degrade gracefully (see below).
- **Body shape:** the PUT is a **full replace** — `required_status_checks`,
  `enforce_admins`, `required_pull_request_reviews`, and `restrictions` must **all be
  present as top-level keys**, each nullable. Nested objects (the `checks` array) do
  not pass cleanly through `gh api -f`; the reliable form is `--input` with a JSON body
  on stdin. Minimal shape for our purpose (require the quality job green + a PR, no
  direct push to main):

  ```json
  {
    "required_status_checks": { "strict": true, "checks": [ { "context": "quality" } ] },
    "enforce_admins": true,
    "required_pull_request_reviews": { "required_approving_review_count": 0 },
    "restrictions": null
  }
  ```

  `gh api --method PUT repos/{o}/{r}/branches/main/protection --input body.json`. The
  `context` string must match the **check-run name** GitHub sees from our workflow
  (the job named `quality` in `.github/workflows/checks.yml`). `enforce_admins: true`
  is what closes the "admin can still direct-push" hole; without it the Operator can
  bypass protection.
- **Offline / no-`gh` / no-permission:** all three are graceful-degrade cases.
  No network or no `gh` ⇒ cannot call; record the decision as "wanted, unwirable here"
  and point the Operator at the GitHub web UI recipe. No admin scope ⇒ the call 403s;
  surface that plainly ("your token lacks admin on this repo — set protection in the
  web UI, or re-auth with admin scope"), never silently skip.

### What comparable setups do (brief)

Branch protection as the real gate is the **industry-standard** pattern: the local
hook/CI is advisory, the *remote required status check + no-direct-push* is the
enforced floor (every mature GitHub-flow repo relies on it, not on developer
discipline). CODEOWNERS and required reviews are adjacent controls — out of scope here
(our review is the protocol's own Reviewer, not GitHub reviewers), but
`required_status_checks` + `enforce_admins` is exactly the subset that substitutes for
our ask-class: it makes "merge only through a green-CI PR" a server-side fact.

### Options for "where the mandatory/loud lives"

**Option F2-1 — Loud mandatory OFFER at setup, manual-apply, recorded decision.**
The quality-toolkit setup step (`## Setup` step 5) gains a **required** accept-or-decline
on branch protection: the Operator must answer (not a silent skip), and the answer is
recorded in config/state. On accept, the Orchestrator prints the exact `gh api` command
(or the web-UI recipe) for the Operator to run; it does **not** run it itself.

- *Pros:* zero new permission surface for the agent (the Operator runs the privileged
  call); honest — the agent never claims it set protection; works offline (prints the
  recipe). Cheapest to build.
- *Cons:* relies on the Operator to execute; the "loud" lives only in setup prose +
  one recorded flag — a session that skipped setup never sees it.

**Option F2-2 — Automated apply via `gh api` on accept, graceful-degrade.**
As F2-1, but on accept the Orchestrator **runs** the `gh api` PUT itself (Operator's
explicit confirm — it is a mutating remote action, ask-class by our own rules), with
the three graceful-degrade branches (no `gh` / no network / 403-no-admin → fall back to
printing the recipe + recording "unwired, why").

- *Pros:* the protection actually gets set, not just recommended; the highest real
  guarantee delivered.
- *Cons:* needs admin token (often absent); a mutating remote call the agent makes
  (must be Operator-confirmed each time — consistent with invariant 7 and the
  ssh-mutating-action posture); more to build and test (the degrade branches).

**Option F2-3 — Pure persona reinforcement, no automation.**
Reword `## Your seat` to make the offer mandatory-loud and name it the ask-class
substitute, change nothing mechanical.

- *Pros:* trivial; honest.
- *Cons:* does nothing for the actual gap — it is still a `[persona]` offer a
  non-compliant model skips. Rejected: it re-describes the hole without narrowing it.

### Recommendation — F2-1 now, F2-2 as a fast-follow

Ship **F2-1** as the first buildable feature: a **mandatory, recorded** branch-protection
step in setup that names branch protection explicitly as *the* substitute for the
OpenCode ask-class (and the real remote floor on every platform), prints the exact
`gh api`/web-UI recipe, and records the Operator's accept/decline so a later audit can
see it was a conscious choice. This is proportionate, honest, builds cleanly, and needs
no new agent permission.

Layer **F2-2 (automated apply)** as a fast-follow once F2-1 is in: it is strictly an
upgrade on the "apply" half, gated behind admin-scope detection and an Operator confirm.
Splitting it keeps the first feature small and lets the Operator decide whether the
agent should hold the privileged call at all.

Crucially, **the substitute already has its mechanical teeth half-built**: the CI
workflow (`checks.yml`) and the merge-gate exist. F2 is wiring the *forge setting* that
turns "CI runs" into "CI **must** be green and main **cannot** be direct-pushed" —
server-side, model-independent. The decision doc's honest claim: F2 does not make our
deny layer mechanical; it moves the floor to a layer (GitHub) that is mechanical *for us*.

---

## F5 — audit-cadence robustness

The cadence counter already rides a **mandatory ship step** (`## Your seat`: after
merge-confirm, refresh the audit-cadence marker in the state pointer). So the counter
is not free-floating prose — it is pinned to an act the loop must perform to ship.

### Options

**Option F5-1 — Accept it as persona, lean on the structural anchor + CI/branch-protection.**
The counter rides a mandatory step; the real backstop against a runaway session is the
**remote forge protection** F2 delivers (broken code cannot reach main without green
CI, audit or no audit). Honestly record that the cadence is `[persona]` and its real
compensating control is F2's remote floor, not the offer's reliability.

- *Pros:* honest; no new mechanism; recognises that the *audit* is a quality sweep, not
  a safety gate — the safety gate is the merge-gate + branch protection, which F2 hardens.
- *Cons:* a high-throughput session can still let quality debt accumulate un-swept; the
  catch is lagged.

**Option F5-2 — Mechanical nudge at threshold.**
An inject/loud reminder when features-since-audit ≥ N. **Blocked on OpenCode:** the
inject-class is dropped there (5.17.7 — `chat.message` crashed opencode 1.17.8, see
backlog), so an inject nudge restores parity only on Claude. On Claude it is realisable
via the existing `UserPromptSubmit` hook reading the state-pointer counter.

- *Pros:* a real nudge on Claude.
- *Cons:* platform-asymmetric (the gap is worst exactly where inject is unavailable —
  OpenCode); needs the hook to read project state (it currently reads only the tool
  call); building it for one platform re-creates the parity debt the epic is trying to
  close.

**Option F5-3 — Fold the cadence check into the F2 setup-recorded decision.**
When branch protection is set (F2), record the audit-cadence expectation alongside it,
so the once-per-project setup is the single home where both compensating controls are
made conscious.

- *Pros:* one home; cheap.
- *Cons:* still persona at run time — it makes the *intent* conscious at setup, not the
  per-N-features offer reliable.

### Recommendation — F5-1 (accept as persona) + record the reframe

Recommend **F5-1**: accept that the audit cadence is inherently `[persona]` and record
**why that is acceptable** — the audit is a *quality* sweep, and the *safety* floor
(broken/unreviewed code reaching main) is held by the merge-gate + F2's branch
protection, which are model-independent. The cadence missing a beat costs a lagged
quality sweep, not an unsafe ship. This is the honest posture: do not dress a persona
control as mechanical, and point at the layer that *is* the real floor.

Reject F5-2 as the primary answer (platform-asymmetric, deepens the parity debt). Note
it as a **Claude-only future nicety** in the backlog if the Operator wants the nudge —
but it is not the answer to F5's risk, F2 is.

---

## Scope split

**Buildable now (the first feature after the Operator picks the forks):**

- **F2-1 — mandatory recorded branch-protection step.** Edit `orchestrator.md`
  `## Setup` (step 5, beside CI wiring) + `## Your seat` (the existing soft offer): the
  offer becomes a **required accept-or-decline** that names branch protection as the
  ask-class substitute on OpenCode and the remote floor on every platform; prints the
  exact `gh api --input` recipe (the verified body shape above) and the web-UI
  fallback; records the decision. Plus the durable home: **this decision doc** (already
  landed) cited from the orchestrator prose. `kind: docs/mixed` change — through the
  normal loop, fixup-to-small grade.

**Design-settled, build as fast-follow (separate features):**

- **F2-2 — automated `gh api` apply** on accept, gated behind `gh auth` admin-scope
  detection + Operator confirm, with the three graceful-degrade branches. Bigger
  (engine/CLI logic + degrade-path tests); its own feature.
- **F5 reframe** — a prose change recording the audit cadence as honestly `[persona]`
  with F2's branch protection named as the real safety floor (`orchestrator.md`
  `## Audit` section + this doc). Can ride F2-1's PR or be its own fixup; recommend
  riding F2-1 so the two compensating-control reframes land together.

**Design-only / parked:**

- **F5-2 Claude-only inject nudge** — recorded as a backlog nicety, not built unless
  the Operator asks; deepens parity debt, not the answer to F5.

### The concrete first feature to propose

A single small feature: **"Mandatory branch-protection substitute + audit-cadence
honesty reframe"** — F2-1 + the F5 reframe (items 1 + 3), landing the prose changes and
citing this doc. It is the proportionate first step: it makes the OpenCode ask-class
substitute conscious and recorded, names the real remote floor, and corrects the F5
honesty posture, without committing to the agent holding the admin-scoped `gh api` call
(that is F2-2, a deliberate fast-follow).

---

## Forks the Operator must decide before any build

1. **F2 apply mechanism** — F2-1 (loud mandatory offer, Operator runs the `gh api`
   recipe) now, F2-2 (agent runs it on confirm) as fast-follow? *Recommended.* Or
   F2-2 straight away (agent holds the admin-scoped call sooner, more to build)?
2. **F5 posture** — accept the cadence as `[persona]` with F2's branch protection named
   as the real floor (F5-1, *recommended*)? Or invest in the Claude-only inject nudge
   (F5-2) despite the parity asymmetry?
3. **First-feature scope** — land F2-1 + the F5 reframe together as one small prose
   feature (*recommended*), or split them?

---

## Sources

- GitHub REST — Branch protection update: `PUT /repos/{owner}/{repo}/branches/{branch}/protection`,
  admin permission required, full-replace body with `required_status_checks` /
  `enforce_admins` / `required_pull_request_reviews` / `restrictions` all present
  (nullable). docs.github.com/en/rest/branches/branch-protection (verified 2026-06-19).
- `gh api --method PUT … --input` for nested JSON bodies; `-f key[]=` for empty arrays;
  community recipes confirming all required keys must be present
  (github.com/orgs/community/discussions/24758; cli/cli#7338; ricky-lim.github.io
  branch-protection recipe) — triangulated, medium confidence on the exact minimal set.
- Internal: `docs/decisions/opencode-task-capabilities.md` (OpenCode platform limits),
  `.ai-dev/backlog.md` "Persona floor collapses…" (F1/F4 shipped, F2/F5 open;
  5.17.4 dead-plugin root cause), `.github/workflows/checks.yml` (the `quality` job the
  required status check binds to), `orchestrator.md ## Your seat` / `## Setup` /
  `## Audit`.
