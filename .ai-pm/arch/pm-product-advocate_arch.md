# pm-product-advocate — design notes

## Context

The plan adds a new read-only referee — `pm-product-advocate` — that generates a
fixed-checklist gap report on the **product axis** (value / usability / viability /
scope boundary) and **blocks the coder handoff** until the PM answers or descopes
each gap. The plan's WHAT/WHY is settled (8 key design decisions, 7 scenarios). This
note resolves only the four **structural placement** questions the plan left open:
where the gate sits in the pipeline, where the single-source checklist lives and its
two-tier shape, where the report artifact lives + the owner-split, and the
load-bearing enforcement shape.

This is a protocol-spec change in the template repo. There is no runtime, no shared
mutable state, no concurrency — the only "interactions" are with adjacent **protocol
mechanisms** that share the pipeline or read the new artifact. So the usual
event-subscription / feedback-loop analysis (Section B step 2) is N/A; in its place
the relevant analysis is *which existing single-source, owner-split, and
soft-enforcement precedents this feature must structurally match.* Three precedents
are load-bearing and recur below:

- **Single-source-of-conditions** — `### Security-relevant surfaces` and
  `### Pending-migration detection in MIGRATIONS.md`: a condition list lives **once**
  in a protocol-root `.md`, referenced **by name** from every consumer, never
  re-encoded. The migrations decision (`architecture.md`) records why the home is a
  protocol-root file and **not** `doc/<name>.md` — the `doc/`-vs-`docs/` resolution
  trap: a `doc/` path resolves in this repo but a downstream reads it at
  `.ai-pm/tooling/`, so a hot-path reference breaks in one of the two contexts.
- **Owner-split with a gate, not discipline** — the Pass-2 code-review trail inside
  `.ai-pm/reviews/<topic>_review.md`: `pm-plan-checker` owns through `## Verdict`, the
  orchestrator owns the `## Code review` trail below. Made safe by a **positive-presence
  stamp** (`## Code review: <date> — passed`) that `pm-pr-prep` (step 0) and
  `pm-auditor` (dimension 1) gate on. The lesson the v2.14.0 work recorded: a manual
  step with no gate degrades silently, and an *empty* section reads as "passed" to a
  grep — so the gate keys on a **loud positive marker**, never on absence.
- **Soft enforcement, no `PreToolUse` hook** — threat-model and blast-radius both
  rejected a hook because the trigger ("is this security-touching" / "is this coupled
  to a live peer") is a semantic judgement a regex cannot make; enforcement is prose
  + a downstream gate. "Is this feature user-facing / under-specified" is exactly that
  shape.

## Adjacent implementations (the referees this agent must match)

1. **`pm-plan-checker`** at `.claude/agents/pm-plan-checker.md` — read-only, frontmatter
   `tools: Read, Grep, Glob, Bash, Write`, no pinned `model:`. Writes its verdict to
   `.ai-pm/reviews/<topic>_review.md`, owns everything through `## Verdict`. Its DoD is
   a fixed 9-item checklist (the artifact-completeness item #9 is itself the
   index-replacement gate). Runs **post-coding** with a *compliance* stance. The new
   agent is its product-axis sibling but runs **pre-coding** with an *advocacy* stance —
   player-referee-incompatible, hence a separate agent (plan decision 1).
2. **`pm-auditor`** at `.claude/agents/pm-auditor.md` — read-only, same frontmatter
   shape. Dimension 1 already performs the **human-role-subject extraction** (extract
   the grammatical subject of scenario 1; human role → contract required) — the exact
   reach test the advocate gate reuses, not duplicates (plan: "reused, not
   duplicated"). Its threat-model dimension is the structural template for the new
   user-facing-only check: presence-keyed, security-bearing-only-by-analogy
   (user-facing-only here), remediation = spawn an agent.
3. **The `### Security-relevant surfaces` + threat-model lifecycle** mechanism
   (`WORKFLOW.md` + `architecture.md`) — the closest *whole-mechanism* precedent: a
   named single-source subsection in `WORKFLOW.md`, referenced by name from `/pm-plan`,
   `pm-plan-checker`, `pm-auditor`; soft enforcement (plan-checker block + auditor
   finding), no hook; an owner that updates a doc post-coding via the "Docs to update"
   handoff. The advocate is structurally the product-axis twin of this entire shape.

The new agent inherits the established referee shape verbatim: `tools: Read, Grep,
Glob, Bash, Write`, no `model:` (plan "Stack expectations touched" + the realignment
decision that *no* agent pins a model now).

---

## 1. Where the per-feature gate sits in the pipeline

The constraint: the gate is **between plan-approval and coder handoff**, user-facing
only, and must not perturb the non-user-facing flow or collide with the existing
post-coding "Docs to update" handoff.

In `pm-plan.md` the relevant tail is, in order: **Architect check** (after PM approves
the plan) → **Handoff** (save plan; regenerate product-map; after plan-checker approve,
append to contract / regenerate map; init Execution State; Product Contract check; then
"run architect check above"). The architect check and the gate are the same *kind* of
step — a post-approval, pre-coding, conditional-on-the-plan branch that may spawn a
read-only agent before the coder.

**Variant A — a dedicated `## Product-readiness gate` step in `pm-plan.md`, placed
after the Product Contract draft and before/folded-with the Architect check; mirrored
in WORKFLOW.md "How I work" as a new "Step 3.5".**
The contract is drafted *first* (it is one of the advocate's inputs — the gap analysis
reads `.ai-pm/contracts/<feature>.md`), then the advocate runs against {plan, contract,
`product.md`, `user-journeys.md`}, then architecture, then coder. Ordering rationale:
the advocate must see the contract that the Product Contract check just produced, so it
sits *after* that check; it is product-readiness (does the *what/why* hold up), which
precedes structural-readiness (where does the code live), so it sits *before or beside*
the Architect check; both precede the coder. In WORKFLOW.md "How I work" this is a new
**Step 3.5 — product-readiness gate** sitting between Step 3 (architecture decision)
and Step 4 (coder), user-facing only, with one line in "What is mandatory when" (the
user-facing row gains the gate; other rows explicitly exempt by the same extraction).

**Variant B — fold the gate into the Step 4 preamble (the existing "Docs to update"
post-coding handoff block).**
Rejected: that block runs *after* the coder finishes (it spawns `pm-architect` /
`pm-legacy-reader` to update docs before the review loop). The gate is **pre**-coding by
definition (decision 3 — it holds the coder handoff). Folding a pre-coding gate into a
post-coding block inverts the ordering the plan requires and would let the coder start
before the gate fires. The two handoffs must stay distinct: the advocate gate is
pre-coder; the "Docs to update" spawn (including this feature's own `architecture.md`
update by `pm-architect`) is post-coder. They never share a step.

**Recommendation: Variant A.** A dedicated post-contract, pre-coder step in
`pm-plan.md` mirrored as WORKFLOW.md "Step 3.5" matches the Architect-check precedent
exactly (same branch point, same spawn-a-read-only-agent-before-coder shape) and keeps
the pre-coding gate cleanly separated from the post-coding "Docs to update" handoff that
this very feature also rides. One ordering note for the plan author: the gate runs
**after** the Product Contract is drafted (the contract is an advocate input) and
**before or beside** the Architect check — both are post-approval pre-coder, and either
order between them is defensible, but the gate should not be gated *behind* an optional
architect run that the PM may decline.

---

## 2. Where the `### Foundational product questions` checklist lives + its two tiers

The constraint: one home, referenced by name, never re-encoded; two tiers (per-feature,
bootstrap); application-agnostic vocabulary.

**Variant A — a named subsection `### Foundational product questions` in
`WORKFLOW.md`, referenced by name from `pm-product-advocate`, `/pm-plan`,
`/pm-bootstrap`.** This is exactly what the plan proposes (decision 8) and it is the
correct home for three independent reasons:

- It is the **identical precedent** to `### Security-relevant surfaces` — also a
  WORKFLOW.md subsection, also referenced by name from a command + plan-checker +
  auditor, also feeding a soft gate. Same authors, same readers, same enforcement
  shape; putting the new checklist anywhere else would break the pattern symmetry the
  whole feature is built on.
- The **`doc/`-vs-`docs/` resolution trap** is decisive against the two alternatives.
  WORKFLOW.md is referenced by **bare filename / `@.ai-pm/tooling/WORKFLOW.md`**, which
  resolves in *both* contexts: this repo (dogfood, read at root) and downstream (read at
  `.ai-pm/tooling/WORKFLOW.md`). The migrations decision rejected a `doc/<name>.md` home
  for precisely this reason — a hot-path reference that four agents/commands follow must
  resolve in both contexts, and a `doc/` path resolves in only one. The advocate +
  `/pm-plan` + `/pm-bootstrap` + (transitively) `pm-plan-checker` + `pm-auditor` all
  read this list on the hot path; a template-file home would re-introduce the exact trap
  two prior decisions already closed.
- WORKFLOW.md is the doc **every agent already reads** (imported into downstream
  `CLAUDE.md`), so a checklist there is automatically in-context for the advocate
  without an extra read.

**Variant B — the checklist lives in the agent's own prompt
(`pm-product-advocate.md`), or in a template file under `doc/_templates/`.**
Rejected on both counts. *In the agent prompt:* `/pm-plan` and `/pm-bootstrap` also
need to reference the list (to know the gate exists and which tier to pass); if it lived
only in the agent, those two would either re-encode it (violating single-source) or
reference an agent-internal section (fragile, and agents are not designed to be
section-addressable canon). *In a template file:* re-introduces the `doc/`-vs-`docs/`
trap above and splits the list off from the `### Security-relevant surfaces` sibling it
is meant to mirror.

**Recommendation: Variant A** — `### Foundational product questions` in `WORKFLOW.md`,
referenced by name. Confirmed against the plan; the resolution trap makes the two
alternatives non-viable, not merely weaker.

**Proposed two-tier internal structure** (so the plan author / coder has a concrete
shape). Each tier is a fixed, stably-ordered list of *presence-checkable* questions —
"is there a recorded answer", never "is the answer good". Vocabulary is cross-domain
(onboarding / discovery / recovery), never a baked-in domain example (the
application-agnostic constraint). The two tiers overlap deliberately: the per-feature
tier is the value/usability/scope subset that applies to *one* user-facing feature; the
bootstrap tier adds the project-wide zero-to-working story and viability that only makes
sense once, at project birth.

```markdown
### Foundational product questions

Single source for the product-readiness gate. The advocate (`pm-product-advocate`),
`/pm-plan`, and `/pm-bootstrap` reference this subsection **by name** and pass a
**tier** (`per-feature` | `bootstrap`); never re-encode the list. The advocate reports
only questions with **no recorded answer** in its inputs — it never judges answer
quality (the PM owns meaning). Use cross-domain language; never a domain-specific
example as vocabulary.

**Tier: per-feature** (one user-facing feature; inputs = plan + contract +
`product.md` + `user-journeys.md`):

1. Value — who is this for, and what job does it do for them?
2. Value — why this, and not the way they do it today (the incumbent)?
3. Usability — how does a user reach / discover this feature?
4. Usability — what does the first successful use look like (the zero-to-working step)?
5. Scope boundary — what does this feature explicitly NOT do (the No-Gos)?

**Tier: bootstrap** (the whole product, once; inputs = the product Q&A answers +
`product.md` + architecture):

1. Discovery — how does a new user find the product exists?
2. Onboarding — what are the first steps from nothing to a working state?
3. Invite / multi-party — if others are involved, how do they join?
4. Recovery & key-loss — what happens when a user loses access / a key / a device?
5. Device-change / continuity — how does use move across devices or sessions?
6. Value — why this product, not the incumbent?
7. Viability — who runs it, who funds it, what legal/operational constraints bind it?
```

(The exact wording is the coder's to finalize against the research's three frames —
Cagan four-risks, Working Backwards external/internal FAQ, Shape Up Problem/No-Gos;
what is structurally load-bearing is: two named tiers, fixed order, presence-only,
cross-domain vocabulary.)

---

## 3. The advocate report artifact home + owner-split

The constraint: a per-feature and a bootstrap artifact; advocate owns the gap analysis
+ verdict; orchestrator appends recorded PM resolutions; "gate resolved" must be a
robust, greppable definition.

**Variant A — `.ai-pm/reviews/<topic>_advocate.md` (per-feature) +
`.ai-pm/reviews/bootstrap_advocate.md` (bootstrap), reusing the existing reviews
directory.** This is the plan's proposal and it is right:

- **Directory.** `.ai-pm/reviews/` already holds the per-feature referee trail
  (`<topic>_review.md`, `fixup-*_review.md`). The advocate is a referee; its artifact is
  the same *kind* of object (a per-feature, read-only-agent-authored verdict the
  orchestrator and downstream gates read). A new `.ai-pm/product-gaps/` directory would
  fragment the referee artifacts across two directories for no benefit and would need
  separate bootstrap-scaffolding lines, separate auditor globbing, separate `.gitignore`
  consideration — pure overhead. The `_advocate.md` suffix keeps it unambiguous from the
  `_review.md` plan-compliance trail in the same directory; `bootstrap_advocate.md` (no
  `<topic>`) mirrors how bootstrap artifacts are special-named.
- **Owner-split.** Mirror the `<topic>_review.md` carve-out exactly: the advocate owns
  the file **through its `## Verdict`** (gap analysis + the `gaps: N | clean` verdict);
  the orchestrator owns a **`## Resolutions` trail below the verdict** where it records,
  per gap, the PM's answer or descope-with-rationale (the output of the
  `AskUserQuestion` conversation it drives — exactly the "outputs of processes the
  orchestrator drives" the edit-ownership rule already permits).

**Variant B — a separate `.ai-pm/product-gaps/` directory and/or a single-owner file
(advocate rewrites the whole file including resolutions).** Rejected. Separate directory:
overhead, above. Single-owner-rewrite: the advocate would have to be re-spawned to
record each PM answer — paying an agent hop for data the orchestrator already holds in
hand from the `AskUserQuestion` pass. That is the precise inefficiency the code-review
carve-out exists to avoid; re-creating it here for no reason contradicts the established
model.

**Recommendation: Variant A** — `.ai-pm/reviews/<topic>_advocate.md` /
`bootstrap_advocate.md`, advocate owns through `## Verdict`, orchestrator owns the
`## Resolutions` trail below.

**On the edit-ownership tension and the carve-out wording.** Yes — this re-creates the
*same* tension the review-stamp gate had to carve out: the orchestrator writing into a
file an autonomous agent owns. The WORKFLOW.md "Edit-ownership rule" currently
enumerates **one** carve-out ("The one carve-out inside `.ai-pm/reviews/<topic>_review.md`").
This feature needs that enumeration extended to a **second** carve-out, worded by direct
analogy:

> A second carve-out, in `.ai-pm/reviews/<topic>_advocate.md` (and
> `bootstrap_advocate.md`): `pm-product-advocate` owns everything through `## Verdict`;
> the orchestrator owns ONLY the `## Resolutions` trail below it — the recorded PM
> answer / descope-with-rationale for each gap, the output of the one `AskUserQuestion`
> pass it drives. Like the Pass-2 code-review trail, it is the output of a process the
> orchestrator drives (it holds the PM's answers in hand), and it is made safe by a
> **gate, not by discipline**: `pm-plan-checker` (DoD) and `pm-auditor` (dimension 1)
> block a user-facing feature whose advocate gate is unresolved.

The edit-ownership *list* of agent-owned artefacts in WORKFLOW.md should also gain
"`<topic>_advocate.md` through `## Verdict`, owned by `pm-product-advocate`" alongside
the existing "`<topic>_review.md` through `## Verdict`, owned by `pm-plan-checker`"
entry, so the boundary is explicit on both sides.

**On "gate resolved" as a greppable DoD/auditor key.** "Every gap in the verdict has a
recorded resolution" is robust **if and only if** it is made a positive-presence signal,
the review-stamp lesson. Two structural requirements on the artifact for that to be
mechanically detectable (carry these into the plan as artifact-format rules):

- The verdict line is a **fixed, greppable token**: `gaps: N` (N ≥ 1, blocking until
  resolved) or `clean` (zero gaps, silent pass). A grep distinguishes the three states —
  *absent* (no file), *unresolved* (`gaps: N` with fewer than N entries under
  `## Resolutions`), *resolved* (`gaps: N` with N recorded resolutions, or `clean`).
- Each gap and each resolution is a **stably-numbered list item** so the
  count-match (N gaps ↔ N resolutions) is a mechanical comparison, not a prose read —
  exactly like the auditor's `SCn` ID-match consistency check for threat↔constraint
  wiring, and unlike anything that would require reading meaning.

A `clean` verdict needs **no** `## Resolutions` trail (zero gaps → nothing to resolve →
silent pass, scenario 3); the orchestrator records the clean artifact and proceeds with
no `AskUserQuestion` (this is the anti-tool-spam interaction). "Resolved" for a `clean`
artifact is simply "verdict is `clean`". Make sure the DoD/auditor wording treats
`clean` and `gaps: N with N resolutions` as the **two** resolved states, so a clean pass
is never mis-flagged as missing resolutions.

---

## 4. Load-bearing enforcement shape

The constraint: soft prose (the `/pm-plan` Step 3.5) + `pm-plan-checker` DoD +
`pm-auditor` backstop, **no `PreToolUse` hook** (decision 7).

**Variant A — soft enforcement + two load-bearing backstops, no hook** (the plan's
shape). This is coherent and is the *only* shape consistent with the established
precedents:

- **No hook is correct.** The gate's trigger is "is this feature user-facing"
  (human-role-subject extraction — a semantic read of the scenario's grammatical
  subject) and "is the product under-specified" (presence of an answer to each
  foundational question). Neither is a regex-decidable property of a tool call. This is
  the identical reasoning the threat-model decision ("'security-touch' is a semantic
  judgement a regex guard cannot make") and the blast-radius decision ("requires runtime
  state a regex guard cannot read") both used to reject a hook. A hook here would be the
  fourth member of a consistent family of *rejected* hooks, not a new exception.
- **Two backstops, both positive-presence-keyed.** `pm-plan-checker` gains exactly one
  DoD item (the existing 9 unchanged): "Product-readiness gate resolved — advocate
  artifact present and every foundational gap answered or descoped" — keyed on the
  greppable `gaps: N`-with-N-resolutions / `clean` signal from §3, user-facing only via
  the human-role-subject extraction it can reuse. `pm-auditor` gains one dimension-1
  check: a merged user-facing feature with no resolved advocate artifact → blocking;
  a non-user-facing feature → clean (not flagged), by the same extraction, no
  feature-category special-casing.

**Variant B — a `PreToolUse` hook that blocks the coder spawn when the advocate
artifact is absent/unresolved.** Rejected for the semantic-trigger reason above, and
because it would contradict the architectural constraint that hooks are a
*minimal* `PreToolUse` + one `UserPromptSubmit` surface that "gates at decision time …
but never reacts after the fact" — and adds the cost of a regex that cannot actually
decide the trigger, producing false blocks on non-user-facing features (the DoR
anti-pattern the plan explicitly guards against).

**Recommendation: Variant A.** Confirmed coherent; it is the product-axis copy of the
threat-model/blast-radius/review-stamp enforcement family.

**On the pre-gate / post-backstop ordering hazard (flagged, and acceptable).** The gate
is **pre-coding** (it holds the coder handoff) but both backstops are **post-coding**
(`pm-plan-checker` runs after implementation; `pm-auditor` sweeps merged features). So a
skip is caught only *after* the work is done — the same temporal gap the review-stamp
gate has (its `pm-pr-prep` step-0 + auditor backstops also fire after the code-review
trail should have been stamped). This is **acceptable for the identical reason**: the
backstops are not the *primary* enforcement (the `/pm-plan` Step 3.5 is); they exist so
a skip **cannot land silently** — a user-facing feature that reached the coder without
the gate firing is *blocked at the DoD before it can merge*, and re-blocked at audit if
it somehow merged. The cost of catching a skip post-coding (re-running the gate, the PM
answering gaps late, possibly minor rework) is strictly better than the cost of a hook
that cannot decide the trigger and false-blocks substrate work. The primary gate is
where the *cheap* catch lives; the backstops guarantee the *load-bearing* catch. The
plan author should make this explicit in the `pm-plan-checker` DoD-item rationale
(mirror the review-stamp note: "a manual step with no gate degrades silently; this is
that gate"), so a future session does not "optimize away" a backstop reading it as
redundant with the pre-coding step.

**Greppability requirement (restated as the cross-cutting enforcement contract).** All
three enforcement sites — the `/pm-plan` step, the `pm-plan-checker` DoD, the
`pm-auditor` dimension — must key on the **same** positive-presence tokens from §3
(`gaps: N` / `clean` + N-numbered `## Resolutions` entries). This is what makes "resolved
vs unresolved vs absent" a mechanical three-way grep rather than a prose judgement, and
it is the single most important load-bearing detail carried over from the review-stamp
lesson: never let the "done" state be representable by an empty/absent section that reads
as "passed".

---

## Recommendation (summary)

1. **Pipeline placement** — Variant A: a dedicated `## Product-readiness gate` step in
   `pm-plan.md` after the Product Contract draft and before/beside the Architect check;
   mirrored as WORKFLOW.md "How I work" **Step 3.5** (user-facing only); kept distinct
   from the post-coding "Docs to update" handoff.
2. **Checklist home** — Variant A: `### Foundational product questions` in `WORKFLOW.md`,
   referenced by name; two named tiers (`per-feature`, `bootstrap`), fixed order,
   presence-only, cross-domain vocabulary. The `doc/`-vs-`docs/` resolution trap rules
   out a template-file home outright.
3. **Artifact + owner-split** — Variant A: `.ai-pm/reviews/<topic>_advocate.md` /
   `bootstrap_advocate.md`; advocate owns through `## Verdict`, orchestrator owns a
   `## Resolutions` trail below; add a **second carve-out** to WORKFLOW.md's
   edit-ownership rule worded by analogy to the code-review-trail carve-out; make the
   verdict a greppable `gaps: N` / `clean` token with N-numbered resolution entries.
4. **Enforcement** — Variant A: soft `/pm-plan` step + `pm-plan-checker` DoD (one new
   item) + `pm-auditor` dimension-1 check, **no hook**; all three key on the same
   positive-presence token. The pre-gate/post-backstop temporal gap is acceptable —
   identical to the review-stamp gate — because the backstops exist to make a skip
   non-silent, not to be the primary enforcement.

## Notes for the plan / coder (not changes I'm making)

- **Plan is internally consistent** with these recommendations — no plan revision is
  required; the four resolutions above are *confirmations* of the plan's proposals plus
  the concrete structural shapes (Step 3.5, the two-tier checklist body, the
  `## Resolutions` trail, the greppable `gaps: N`/`clean` token, the second
  edit-ownership carve-out wording).
- **One thing the plan should make explicit (not currently spelled out):** the exact
  **carve-out wording** added to WORKFLOW.md's "Edit-ownership rule" (the second
  carve-out) and the matching entry in the agent-owned-artefact *list* — both are needed
  for the owner-split to be unambiguous, and §3 gives the drop-in text.
- **`architecture.md` decision (post-coding, owned by `pm-architect`):** when this
  feature lands, the new architectural-decision subsection should explicitly place
  `pm-product-advocate` in the *family* of soft-enforced, single-sourced,
  owner-split-with-gate mechanisms (threat-model, blast-radius, review-stamp, migrations)
  rather than as a standalone — that framing is the load-bearing rationale and prevents a
  future reader from treating any one backstop as removable.
