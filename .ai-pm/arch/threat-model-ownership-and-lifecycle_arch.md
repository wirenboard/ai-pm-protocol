# threat-model-ownership-and-lifecycle — design notes

## Context

The plan (`doc/features/threat-model-ownership-and-lifecycle_plan.md`) gives the
threat-model a full lifecycle on **security-bearing projects only**, owned by
`pm-architect` (scope-extension, no new agent — already decided by PM). Two structural
choices are deferred to this pass, plus four wiring specs the coder needs.

The two open choices both have a strong **local precedent already in `doc/architecture.md`**:

- The single-source-of-conditions invariant for the **migration catalogue** lives in
  `MIGRATIONS.md` — a protocol-root reference, sibling to `WORKFLOW.md`, referenced by
  **bare filename** so it resolves in both the dogfood repo (root) and downstream
  (`.ai-pm/tooling/MIGRATIONS.md`). The rationale is recorded verbatim in
  `doc/architecture.md:122` ("Migration catalogue is a single protocol-root reference").
  That decision explicitly rejected a `doc/<name>.md` home because "`doc/`-vs-`docs/`
  path resolves in only one of the two contexts, fatal for a hot-path reference."
- The **contract two-layer** decision (and the backlog tension it records): centralize the
  enforceable machine rule in `docs/architecture.md` `## Behavioral contract`, let the
  PM-facing surface **reference it by name**, never restate it. Coupling-to-a-central-
  taxonomy is accepted *only* for the enforceable rule, not for the descriptive layer.

Both choices below are resolved by **applying the existing precedent**, not inventing a
new mechanism — which is itself the plan's stated constraint (scenarios 6 and "Existing
behaviors this feature touches": follow the migration-conditions pattern, "not a
competing one").

---

## Choice 1 — where the single-source "security-relevant surface" list lives

The list — *authentication, cryptography / key management, data-at-rest / storage,
network / transport, user input, PII, access control* — must be defined **once** and
referenced **by name** from `/pm-plan` (`pm-plan.md`), `pm-plan-checker`
(`pm-plan-checker.md`), and `pm-auditor` (`pm-auditor.md`). All three are hot-path
agents: the list is consulted on **every plan** (plan + check) and **every audit** on a
security-bearing project.

### Candidate homes

**A. Named subsection in `WORKFLOW.md`.**
- Resolution: `WORKFLOW.md` is referenced by bare filename and imported into every
  downstream `CLAUDE.md` via `@.ai-pm/tooling/WORKFLOW.md`. Resolves in **both** contexts
  (dogfood root + downstream) — the already-proven mechanism, same as MIGRATIONS.md.
- Hot-path fit: all three readers already read `WORKFLOW.md` as orchestration canon; a
  named subsection reference (`### Security-relevant surfaces` in `WORKFLOW.md`) is the
  identical addressing pattern they already use for `### Pending-migration detection in
  MIGRATIONS.md`.
- Cost: adds one more orchestration-canon subsection. But the list **is**
  orchestration policy (it defines *when a pipeline gate fires*), so it is topically at
  home — unlike the migration catalogue, which was a distinct lifecycle (project version
  movement) large enough to earn its own root file.

**B. Header of `doc/_templates/threat-model.md.tmpl`.**
- The template already says "Read by agents before planning any feature that touches
  auth, data storage, network, or user input" — tempting as a pre-existing anchor.
- **Fatal flaw:** a `*.tmpl` is a *scaffolding source*, copied into `docs/threat-model.md`
  downstream. It is not on any agent's read-path at plan/audit time; the three readers
  would have to reach into the protocol's own template directory
  (`.ai-pm/tooling/doc/_templates/…`) to read a policy list. That couples a runtime
  pipeline gate to a scaffold artifact and re-introduces the `doc/`-vs-`docs/` resolution
  trap (the template lives under `doc/` singular in this repo,
  `.ai-pm/tooling/doc/_templates/` downstream — but the *populated* copy is `docs/`
  plural). Reject for the same reason `doc/<name>.md` was rejected for MIGRATIONS.md.

**C. New protocol-root reference (a `SECURITY-SURFACES.md`, like `MIGRATIONS.md`).**
- Resolves correctly (bare filename, both contexts).
- **Over-weight:** MIGRATIONS.md earned a root file because it carried *both* detection
  conditions *and* multi-version migration **procedures** — a whole catalogue that was
  bloating `pm-bootstrap.md`. The security-surface list is a **single flat 7-item list**
  with no procedures. A root file per single-source list does not scale (the next such
  list would demand its own root file too) and clutters the protocol root. The architect's
  own recorded judgement (`doc/architecture.md:122`) chose a root file *because the
  content was a catalogue*; that justification does not transfer to a 7-item list.

### Recommendation — **A: named subsection in `WORKFLOW.md`.**

Reference token: **`### Security-relevant surfaces` in `WORKFLOW.md`** — addressed by
name, never re-encoded, exactly mirroring `### Pending-migration detection in
MIGRATIONS.md`. Reasoning, in priority order:

1. **Resolution parity (the load-bearing constraint).** Bare-filename + `@`-import means
   it resolves in both the dogfood repo and downstream — the one property that killed
   candidate B (and that `doc/architecture.md:122` calls "fatal" to get wrong).
2. **Topical home.** The list *is* orchestration policy (it defines a pipeline trigger),
   so it belongs in `WORKFLOW.md` alongside "What is mandatory when" — not in a scaffold
   template (B) and not weighty enough for its own root file (C).
3. **Minimal new surface.** No new root file, no new resolution context to reason about;
   the three readers already consume `WORKFLOW.md`.

Place the subsection near "What is mandatory when" (the existing single-source-of-
overhead table) — both answer "when does this overhead apply." Have the threat-model
lifecycle prose (owner / draft / per-feature / audit) sit adjacent so the list and its
consumers are co-located, but the **list itself is the named, referenced anchor**.

---

## Choice 2 — shape of the threat → constraint wiring

Two documents, one owner (`pm-architect`):
- `docs/threat-model.md` `## Threats` table — *what we protect / from whom / likelihood
  / impact*. The **risk** layer.
- `docs/architecture.md` `## Security constraints` — *the enforceable implementation
  rules*. The **rule** layer.

Invariant: one-fact-one-owner, move-not-copy, no duplicated content, each readable in
isolation during review.

This is **structurally identical** to the contract two-layer split already in the repo
(PM-facing value layer ⇄ `docs/architecture.md` `## Behavioral contract` enforceable
grammar). Apply the same judgement the backlog records: **centralize the enforceable
rule, let the risk layer name its own risk.**

### The fact-ownership split (who owns what, so they can't drift)

| Fact | Owner document | The other doc... |
|---|---|---|
| The risk: threat, affected assets, likelihood, impact | `threat-model.md` `## Threats` row | does not restate it |
| The enforceable rule that mitigates it | `architecture.md` `## Security constraints` | does not restate it |

Each row in the Threats table names its **own** risk in full (that is the risk layer's
job — analogous to a contract naming its own user value), and the **Mitigation column
references the constraint by stable name**, it does not copy the rule text. Symmetric to
how a token-free contract guarantee *references* the Behavioral contract rather than
inlining the grammar.

### Reference direction and key — recommendation: **one-way, by stable ID.**

- **Direction: one-way (threat → constraint).** The Threats table's Mitigation column
  points at the constraint; the constraint does **not** maintain a back-link to threats.
  Rationale: a constraint can mitigate several threats; forcing a back-link makes the
  rule layer carry a list that drifts every time a threat is added (the exact
  central-taxonomy coupling the backlog warns against). One-way keeps the rule layer
  free of risk-layer bookkeeping. The threat-model is the natural index *into* the
  constraints, not vice versa — same as the contract→Behavioral-contract direction.
- **Key: stable ID, not prose name.** Give each constraint in `architecture.md`
  `## Security constraints` a stable ID (e.g. `SC1`, `SC2`, …) — the same device the
  threat-model's own Threats table already uses for threats (`T01`, `T02` — see
  `threat-model.md.tmpl:46-48`, "Each gets an ID for cross-referencing"). The Mitigation
  column then reads, e.g., `SC2 (parameterized queries)` — **ID as the stable anchor,
  prose only as a human hint.** An ID survives rewording of the rule; a prose-name
  reference silently rots when the constraint's wording changes. The threat's own ID
  (`T01`) lets the constraint side be found by grep when needed without a stored
  back-link.

So: **`threat-model.md` Threats.Mitigation → `architecture.md` `## Security constraints`
`SCn`, one-way, ID-keyed.** Each document is independently readable: the threat-model
reads as a complete risk register (every threat names its risk + points to its
mitigation by ID); the Security constraints read as a complete rule list (each rule
stands alone, IDed). No rule text is duplicated; the only cross-doc datum is the bare
`SCn` token.

### Drift protection

- **No duplicated content** → nothing to drift between (the rule text lives once).
- A dangling `SCn` (Threats names an ID that no constraint defines) or an orphan
  constraint (an `SCn` no threat references) is a **review-time consistency check**, not
  a runtime one — consistent with the plan's "Interaction scenarios" stance (editorial
  cross-file consistency, verified by review). This is the auditor's stale-threat-model
  surface (below), not a new hook.

---

## Wiring specs for the coder

### W1 — Bootstrap-draft handoff (drafts populated, never empty skeleton)

Mirror **exactly** how `architecture.md` is finalized by `pm-architect`, already wired at
`pm-bootstrap.md:95-97` (greenfield) and `:184` (legacy-full). The orchestrator must
**not** copy the empty template; it spawns `pm-architect` to draft from the Q7 answers.

- **Greenfield** (`pm-bootstrap.md`): in the same `pm-architect` spawn that authors
  `architecture.md` + `product.md`, **when Q7 mentioned security**, pass the Q7
  security answers (assets, adversaries, the obvious threats, the explicit
  "what we do NOT protect" list). `pm-architect` populates `docs/threat-model.md` from
  `threat-model.md.tmpl` — Assets, Adversaries, Threats rows, and the do-NOT-protect
  list filled, not left as `<placeholders>`. Gaps it can't fill from Q7 → `[?]` (the
  same discipline Section A already uses for architecture). **Conditionality preserved:**
  no security in Q7 → no threat-model spawned, nothing scaffolded.
- **Legacy-full** (`pm-bootstrap.md:184` + `pm-legacy-reader.md:83-85`): the conditional
  threat-model write by `pm-legacy-reader` stays as the *draft*; `pm-architect` finalizes
  it to canonical form in its existing legacy-finalization spawn — the identical handoff
  it already does for the `architecture.md` draft (extractor drafts, architect owns).
- This belongs in **`pm-architect.md` Section A** as a new owned doc, listed alongside
  `architecture.md` and `product.md`, gated on "security-bearing project."

### W2 — Staleness mechanism (dated `Last reviewed`)

- **Template change** (`threat-model.md.tmpl`): add a dated field near the top — e.g.
  `**Last reviewed:** YYYY-MM-DD` — and update the existing `## Review` section to point
  at it. `pm-architect` sets/bumps this date whenever it drafts or updates the file.
- **Auditor comparison** (`pm-auditor.md`): the comparand is **the merge date of the most
  recent security-touching feature**. The auditor already builds `(feature topic, merge
  date)` from git log + `docs/features/*_plan.md` (`pm-auditor.md:36`). A feature is
  "security-touching" if its plan's "Docs to update" names `docs/threat-model.md` (the
  W3 gate guarantees a security-touching plan does). Compare: **max(merge date over
  security-touching features) > `Last reviewed`** → **stale → note**. This reuses the
  exact mechanism the contract-currency dimension already uses (`pm-auditor.md:100-101`:
  "`Last reviewed:` date vs. last `git log` date … changed after → note").

### W3 — Auditor: deciding "security-bearing" + the new checks

The new check lives in the **Docs currency dimension (5)**, additive to the existing 5 —
not a 6th dimension (consistent with the plan's "additive, existing untouched").

- **Security-bearing signal — recommendation: presence of `docs/threat-model.md`.**
  This is the cleanest binary the auditor can read with zero ambiguity, and it is exactly
  what the lifecycle produces: a security-bearing project *has* a threat-model (W1 drafts
  it at bootstrap); a non-security project never gets one scaffolded
  (`pm-bootstrap.md:77` conditionality, preserved). So:
  - `docs/threat-model.md` **absent** → project is non-security → **silent** (no finding).
    This correctly leaves non-security projects unaffected (scenario 7).
  - `docs/threat-model.md` **present but skeleton** (placeholder `<…>` tokens still in
    Assets / Threats, empty Threats table) → **blocking** (the downstream pain: a
    security project left as an empty skeleton).
  - `docs/threat-model.md` **present and populated but stale** (W2) → **note**.
  - Cross-check the architecture.md `## Security constraints` ↔ Threats wiring (Choice 2:
    dangling/orphan `SCn`) as part of this dimension — **note**.
  - Remediation for all: spawn `pm-architect` to draft / refresh, **backfilling from
    threat-driven decisions already in `architecture.md`** (the plan's scenario 5).
  - **Secondary signal as a guard, not the primary:** if a project has a security premise
    recorded in `architecture.md` (e.g. an explicit untrusted-server decision) **but no
    `docs/threat-model.md`** — that is the harder "should have one but doesn't" case. Keep
    the primary signal (presence) for simplicity, but the auditor *may* note a missing
    threat-model when `architecture.md` carries an explicit security premise. Recommend
    shipping the primary (presence) signal first; the architecture-premise signal is a
    judgement call and should be a **note**, never blocking, to avoid false-flagging.
    (The Q7 bootstrap record is **not** a good audit signal — it is not a durable on-disk
    artifact the auditor reads on every run; prefer the file-presence signal.)

### W4 — `/pm-plan` + `pm-plan-checker` gate

- **`pm-plan.md`:** when a feature touches any surface in
  `### Security-relevant surfaces` in `WORKFLOW.md` (referenced by name, never re-listed),
  the plan must name `docs/threat-model.md` in "Docs to update" with the relevant Threat
  rows added/updated. Wire the post-coding `pm-architect` spawn into the existing
  "Docs to update names `docs/architecture.md` → spawn `pm-architect`" branch at
  `pm-plan.md:57` — add `docs/threat-model.md` to the same architect-owned trigger (same
  owner, same handoff).
- **`pm-plan-checker.md`:** add to the structural-gate list (alongside
  `pm-plan-checker.md:25` "Stack expectations touched … → blocking"): on a
  security-bearing project, a plan that touches a surface in `### Security-relevant
  surfaces` in `WORKFLOW.md` but omits `docs/threat-model.md` from "Docs to update" →
  **blocking** — the same class of block as a missing "Stack expectations touched"
  section. Reference the list **by name**; do not re-encode the 7 surfaces.

---

## Plan should be updated to…

No plan changes required — the plan already defers exactly these two choices and lists
all four wiring targets in "Docs to update." One clarification the coder should fold in
(does not need a plan rewrite): the template's existing `T01/T02` ID convention should be
**extended to `SCn` IDs in `architecture.md` `## Security constraints`** so the Mitigation
column has a stable anchor (Choice 2) — call this out when editing
`doc/_templates/threat-model.md.tmpl` and the architecture template's Security-constraints
guidance.

## Repo scope note

This is the protocol template repo: it has no `docs/`, no `.ai-pm/contracts/`, no
`state/` of its own, and uses `doc/` (singular). All structural choices above are written
to **resolve for downstream projects** (`docs/` plural, `.ai-pm/tooling/` prefix) while
the dogfood repo reads the same bare-filename references at its own root — which is
precisely why bare-filename resolution (Choice 1) is the load-bearing constraint.
