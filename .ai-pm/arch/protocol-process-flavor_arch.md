# protocol-process-flavor (v1 slice) — design notes

## Context

The plan (`doc/features/protocol-process-flavor_plan.md`) makes the protocol usable for **process / documentation** projects (no executable code) via a **declared `kind` (`software | process`)** that conditions the existing pipeline rather than forking it (research: Bazel `select()` / Gradle variants / CI-matrix — shared defaults + per-kind overrides). v1 is the slice: a bootstrap kind question + a process template set + no-code validation; whole-project kind; the per-feature artifact-kind axis and the automation scanner are deferred.

This is a **protocol-spec / agent-prompt change** to the template repo itself — no runtime, no shared mutable state. So every "structural choice" below is a choice about *where a rule lives in the spec* and *which agent owns which artefact*, not about code modules. The binding protocol patterns the variants are judged against: **single-source-of-conditions** (one canonical list, referenced by name — e.g. `### Security-relevant surfaces`, `### Foundational product questions`), **soft-enforcement + load-bearing backstop** (the review-stamp gate is the model), **reuse-not-new-surface** (no new agent, no new hook), **presence-not-quality** (the advocate flags absence, never grades), **application-agnostic** (cross-domain vocabulary, never one domain baked in).

This meta-feature is itself gate-exempt (its scenario subjects are agents/process, the repo is the no-contract exception) — but the mechanisms it ships must fire for **downstream** process-kind features.

## Adjacent implementations (the patterns each fork must respect)

1. **`### Security-relevant surfaces` / `### Foundational product questions` in `WORKFLOW.md`** — the canonical single-source-list pattern: one list, in one place, **referenced by name** by `/pm-plan`, `pm-plan-checker`, `pm-auditor`, the advocate; consumers must "never re-encode the list". This is the template for how `kind` and the process question-tier must be declared.
2. **The "What is mandatory when" table** — the existing conditional-overhead matrix (rows = change type; columns = State / Contract / DoD / Stack). The plan's decision 1 generalizes exactly this table. Plus its two **riders** (Product-readiness rider, Threat-model rider): orthogonal conditions layered on top of a row without rewriting the row — the precedent for adding `kind` without touching software rows.
3. **The review-stamp gate** (`WORKFLOW.md` Step 5 Pass 2 + `pm-plan-checker` template's `## Code review: NOT YET RUN` loud marker + `pm-pr-prep` step 0 + `pm-auditor` dim 1) — the canonical "soft step made load-bearing by a gate, not by discipline": a **born-loud** marker (`NOT YET RUN`, never an empty heading that greps as passed), a **greppable stamp** (`## Code review: <date> — passed`), enforced at a **downstream gate after the last action**. The dry-run gate (fork 3) must clone this shape exactly.
4. **`pm-product-advocate`** — the independent presence-only referee, spawned per-feature and at bootstrap, driven by a **tier** passed into one canonical checklist; owns through `## Verdict`, greppable `gaps: N | clean`, block-but-sovereign, relayed in one `AskUserQuestion`. Fork 4 reuses this verbatim, only adding a question source.
5. **Edit-ownership rule** (`WORKFLOW.md`) — the agent-owns-its-canon discipline; `docs/` is owned by `pm-architect` / `pm-codebase-reader` / `pm-stack-researcher` / `pm-plan`, and **`pm-coder` "never touches `docs/`"** (its own hard rule). This is the constraint fork 2 must not break.

## Behavioral risks in this area

No event-driven code (spec change). The feedback-loop analogue here is **back-compat drift**: a consumer that reads `kind` but does not default an *absent* `kind` to `software` silently changes behavior for every existing downstream project. The mitigation is a single defaulting rule stated once and referenced (fork 1 + fork 6).

---

## Fork 1 — where `kind` is declared/stored and how the table references it

### Variant A (recommended) — `## Project kind` in downstream `CLAUDE.md`, `### Project kind` subsection in `WORKFLOW.md` as the single source of the rule, table gets a kind **column**

- **Storage:** a `## Project kind: software | process` line in the **downstream** `CLAUDE.md`. Every agent already reads `CLAUDE.md` (it `@`-imports `WORKFLOW.md`); zero new read surface. **`CLAUDE.md.tmpl`** carries the line defaulting to `software`.
- **The rule (single source):** add a `### Project kind` subsection to `WORKFLOW.md` stating the declaration home, the enum, and the **load-bearing defaulting rule** — *absent `## Project kind` ⇒ `software`*. Consumers reference it **by name** ("`### Project kind` in `WORKFLOW.md`"), the established single-source-of-conditions pattern — they never re-encode the enum or the default.
- **Table wiring:** the "What is mandatory when" table stays **byte-unchanged for software**. `kind` enters as a **rider** (the proven Product-readiness / Threat-model rider pattern), **not** a new column and **not** a kind-prefixed row duplication: a **"Project-kind rider"** paragraph below the table — *"On a `process`-kind project, the code-only obligations (automated tests, Pass-2 `code-review`, the build pipeline) are **inert**; plan + journeys + contracts (as good-outcome definition) + threat-model + audit + state still apply. `software` (and kind-absent) is unchanged."* A column would force a value into every existing row (touching software rows → self-inflicted churn + a back-compat review burden); a rider adds the dimension orthogonally, exactly as the two existing riders do.
- **doc/-vs-docs/ trap:** in the **template repo** the file is `doc/_templates/CLAUDE.md.tmpl`; in a **downstream** project it lands as `CLAUDE.md` at root and the docs live in `docs/`. The `## Project kind` line lives in `CLAUDE.md` (root), not under `docs/` — so there is no `doc/`-vs-`docs/` ambiguity for the kind datum itself. (The template-repo authoring path is `doc/`; the runtime read path is the root `CLAUDE.md`. The plan's "Docs to update" already lists `CLAUDE.md.tmpl` correctly.)

*Rationale: reuses the exact single-source + rider pattern the table already uses, keeps software rows byte-unchanged, and adds zero read surface.*

### Variant B — a `.ai-pm/state/`-style field or a `WORKFLOW.md`-only setting

- A `kind` field in `.ai-pm/` state, or `kind` declared inside `WORKFLOW.md` directly.
- **Cons:** `WORKFLOW.md` is the **shared** tooling submodule (canon owned upstream) — a *per-project* value cannot live there. `.ai-pm/state/current.md` is per-task and agent-rewritten every run (wrong lifetime for a project-constant); not every agent reads it (the advocate, stack-researcher don't). Both add a new read path for data `CLAUDE.md` already carries to every agent.

*Rejected: wrong lifetime / wrong ownership / new read surface — Variant A's `CLAUDE.md` home is where every agent already looks.*

**Recommendation: Variant A** — kind in `CLAUDE.md`, the rule single-sourced in a named `### Project kind` `WORKFLOW.md` subsection, the table extended by a rider not a column; software byte-unchanged.

---

## Fork 2 — who authors the process document, and the pm-coder remit wording

### Variant A (recommended) — pm-coder authors the plan's *deliverable artefact*; `docs/`-canon stays pm-architect's

The clean split is **deliverable vs canon**, which the protocol already draws for software:

- In **software** mode pm-coder writes source code (the deliverable) and **never** `docs/` (the canon — architecture/journeys/stack-notes/product, pm-architect-owned).
- In **process** mode the deliverable *is a document* (`process.md`, the SOP) — but it is the **implementation artefact**, the analogue of source code, **not** the canonical context docs. So `process.md` is pm-coder's to author; `docs/architecture.md`, `docs/user-journeys.md`, `docs/product.md`, `docs/threat-model.md` remain pm-architect's exactly as today.

**Exact remit-wording change** (`pm-coder.md`, the "Never touch `docs/`" hard rule). Today:

> **Never touch `docs/`.** Documentation is owned by `pm-plan` (as command), `pm-architect`, `pm-codebase-reader`, and `pm-stack-researcher`.

Reword the rule to carve out the deliverable, **not** to drop the `docs/`-canon ban:

> **Author the plan's deliverable artefact; never touch the canonical context docs.** In **software** mode the deliverable is source code. In **process** mode the deliverable is the **process/SOP document the plan names** (`process.md`) — author it; it is the implementation artefact, the analogue of source code. In **both** modes the canonical context docs — `docs/architecture.md`, `docs/user-journeys.md`, `docs/product.md`, `docs/stack-notes.md`, `docs/threat-model.md` — remain owned by `pm-architect` / `pm-codebase-reader` / `pm-stack-researcher` / `pm-plan`; never edit them. If the plan/stack-notes/docs contradict the deliverable — stop and report, do not resolve.

So the home of `process.md` is **the project's working tree where the plan places it** (the SOP *is* the product of a process-kind project — likely at repo root or a project-chosen path), distinct from `docs/` canon. Where `process.md.tmpl` lives in the template repo is `doc/_templates/process.md.tmpl` (fork 5).

*Rationale: preserves the existing deliverable-vs-canon line that already governs software (code = coder; `docs/` = architect), so the edit-ownership rule stays coherent — only the word "code" generalizes to "the plan's deliverable".*

### Variant B — pm-architect authors `process.md` too

- pm-architect already owns every canonical `docs/` doc, so "it owns the SOP" looks tidy.
- **Cons:** breaks the deliverable-vs-canon line — pm-architect is the **context/canon** owner (read-mostly, decision-recording, citation-backed), **never the per-feature implementer**. Making it author the per-feature deliverable collapses the planner/architect/implementer separation the whole protocol rests on, and leaves **no** implementer role in process mode (who runs the pipeline, commits atomically, fixes review findings?). It also strands the review loop: pm-coder is the agent the review loop hands findings back to.

*Rejected: collapses the implementer role and the review-fix loop; pm-architect is a canon owner, not a deliverable author.*

**Recommendation: Variant A** — pm-coder authors the deliverable (code or process doc); pm-architect keeps all `docs/` canon. One word generalizes ("code" → "the plan's deliverable"); the `docs/` ban is preserved verbatim.

---

## Fork 3 — the no-code validation gate, made load-bearing

Three layers, mapped onto existing steps, with the **dry-run** as the load-bearing gate cloned from the review-stamp pattern.

### Variant A (recommended) — dry-run stamp lives in the review file, cloned from the `## Code review` stamp; enforced at the same downstream gates

- **Step 5.5 ("run it for real") becomes the dry-run/tabletop** in process mode — the human-driven pilot/walkthrough is the real "tests pass" for a process (research: AWS SEC10-BP07 tabletop). This is a **reinterpretation** of an existing step, not a new step.
- **Stamp shape (clone fork-3-of-the-protocol = the review-stamp gate):**
  - `pm-plan-checker` writes the review file **born loud** with a process-mode marker alongside the code-review marker — `## Dry-run: NOT YET RUN` (never an empty `## Dry-run` heading; an empty heading greps as "passed"). On a software-kind feature this line is **not** emitted (or emitted as `## Dry-run: n/a (software)`), so software review files are unchanged.
  - When the tabletop/pilot clears, the orchestrator **replaces the whole line** with `## Dry-run: <date> — passed` (the greppable done marker, `^## Dry-run:.*— passed$`), and records the walkthrough observations as `## Dry-run findings` above it (the analogue of `## Code review findings`).
- **Gate / backstop (no new gate — extend the two that already enforce the code-review stamp):**
  - `pm-pr-prep` step 0: its stamp check is **keyed on section presence, no filename special-casing**. Extend it so that, in addition to the `## Code review` rule, a review file containing a `## Dry-run` section must carry `## Dry-run: <date> — passed`; a file with no `## Dry-run` section is exempt (every software review file). A skipped dry-run is then **blocked at release**, non-silent.
  - `pm-auditor` dim 1: an unstamped `## Dry-run` on a process-kind feature is **blocking**, the same class as an unstamped code-review trail.
- **Structural-lint pre-gate:** markdownlint (already in the repo's authoring discipline — MD022/MD032) is the cheap form gate, wired into the process-kind feature's pipeline exactly as a validator. Vale is noted optional/future (a stack-notes entry **if** added later), **not** added in v1.
- **DoD / sign-off (not a rubber-stamp):** add a `pm-plan-checker` DoD item, **kind-conditioned**, mirroring the existing per-feature gate items: *"(process-kind only) Dry-run/tabletop resolved — `## Dry-run` stamped `— passed`; structural lint green."* A bare signature is forbidden; the checklist DoD is the gate (research open-question: design sign-off as a DoD checklist, not a signature).
- **Pass-2 reinterpretation without breaking software:** Pass-2 routes on `kind`. `software` ⇒ `code-review` (unchanged, byte-for-byte). `process` ⇒ **editorial review + structural lint** (no bug/security/dead-code analogue), with the dry-run as the Step-5.5 load-bearing gate. The routing is one conditional in `WORKFLOW.md` Step 5 keyed on the fork-1 `### Project kind` rule; the software branch is the existing text untouched.

*Rationale: clones the proven born-loud + greppable-stamp + downstream-gate triad instead of inventing a parallel mechanism; software review files, pr-prep, and auditor behavior are unchanged because the new rule is presence-keyed and kind-gated.*

### Variant B — dry-run recorded in `.ai-pm/state/` or a standalone `.ai-pm/dry-runs/<topic>.md`

- A separate artefact/dir for the dry-run record.
- **Cons:** new artefact + new owner + a *new* gate to enforce it (a manual step with no gate degrades silently — the protocol's own lesson). The review file already exists, already has a born-loud-marker convention, and is already gated by pr-prep step 0 + auditor dim 1; piggybacking is strictly less surface.

*Rejected: invents a new artefact and a new gate where the review-file stamp already gives both for free.*

**Recommendation: Variant A** — dry-run as a `## Dry-run: NOT YET RUN → — passed` stamp in the existing review file, enforced by extending pr-prep step 0 + auditor dim 1 (presence-keyed, kind-gated); markdownlint pre-gate; a kind-conditioned DoD line; Pass-2 routes on kind with software untouched.

---

## Fork 4 — the process tier of `### Foundational product questions`

### Variant A (recommended) — a new **`process`** tier in `### Foundational product questions`, advocate reused verbatim

- Add a third tier to the **single-source** `### Foundational product questions` subsection (alongside `per-feature` and `bootstrap`), passed as `tier: process` exactly as the advocate already takes a tier. The advocate, its relay (`/pm-plan` Step 3.5 one-`AskUserQuestion` pass), and its backstops (`pm-plan-checker` DoD item, `pm-auditor` dim 1) are **reused unchanged** — only the question *source* gains a tier, the proven extension shape.
- **Questions (presence-of-an-answer, fixed order, mapped to the SOP canonical sections of fork 5):**
  1. Roles — who performs this, and who is accountable/consulted/informed (RACI)?
  2. Prerequisites/inputs — what must be in place before step 1 (the SIPOC inputs)?
  3. Decision points — where does the operator branch, and on what condition?
  4. Exception / failure handling + recovery — what happens when a step fails, and how does the operator recover?
  5. Zero-to-done — what does the operator's first complete run from nothing to a finished outcome look like?
- **Advocate fires on process-kind features.** A process project is human-facing — the **operator is a human role** — so the human-role-subject extraction that gates the per-feature advocate **fires** on a process-kind feature. The advocate is the natural independent referee finding **holes in the instruction** (missing roles / failure-handling / decision-points block the handoff) — presence-only, never grading the prose.
- **Exemption boundary (state it explicitly).** The gate is exempt for *this* meta-feature (subjects = agents/process, repo = no-contract exception) but **applies to downstream process-kind features** (subject = the operator, a human role). These are different things; the rider in fork 1 plus the standing human-role-subject extraction already produce the right answer — no special-casing.

*Rationale: a tier is the established way the advocate's single-source checklist grows (`per-feature`, `bootstrap` already coexist); reinterpreting the per-feature tier would overload five product-value questions to mean five SOP-completeness questions — drift against the single-source pattern.*

### Variant B — reinterpret the existing `per-feature` tier for an SOP

- Pass `tier: per-feature` and read its five questions "as if" about an SOP.
- **Cons:** the per-feature questions are product-value/usability/scope-boundary framed (incumbent, discovery, zero-to-working, No-Gos); an SOP needs roles/RACI, prerequisites, decision-points, failure-recovery — a different axis. Overloading one tier to mean two things breaks the "fixed list, fixed order, one meaning" guarantee the advocate and its backstops rely on for a mechanical presence check.

*Rejected: overloads one tier with two meanings; a distinct `process` tier keeps each question single-meaning.*

**Recommendation: Variant A** — a new `process` tier in the single-source `### Foundational product questions`; advocate/relay/backstops reused unchanged; advocate fires on process-kind features (operator = human role), this meta-feature stays exempt.

---

## Fork 5 — `process.md.tmpl` canonical sections

**Research caveat:** angle 4 (SOP section methodology) was **medium confidence / unverified at 3-vote** — treat the section list as **design guidance to confirm**, not verified fact. Cross-checked against the primary-methodology names the research does cite (ISO 9001 documented-information, BPMN, SIPOC, RACI, Toyota standard work).

**Relation to existing artefacts (additive, no duplication):**

- **vs `user-journeys.md`** — journeys = the **operator experience flow** (what the person does/expects/what-can-go-wrong, human language, identifiers move to the Behavioral contract). `process.md` = **roles / inputs / steps / decisions / exceptions / revision** — the SOP discipline a journey does *not* carry. **Additive, alongside, not instead** (research conclusion (c)). A journey references; the SOP specifies.
- **vs contracts** — the contract is the **"good-outcome" definition** (Must work / Must not break / Acceptance checks). In process mode the SOP's `## Outputs` and its dry-run acceptance map onto that good-outcome notion; the contract stays the source of the pass/fail bar.
- **vs `docs/architecture.md` Behavioral contract** — any machine/structured token an SOP step would name (a status enum, an ID grammar) lives **once** in the Behavioral contract and is referenced (the move-not-copy rule the journeys template already enforces).

### Drop-in skeleton (`doc/_templates/process.md.tmpl`)

```markdown
# <Process name> — Standard Operating Procedure

> The deliverable of a `process`-kind project. Operator experience flow lives in
> `docs/user-journeys.md`; the good-outcome bar lives in the contract; any status
> enumeration / identifier grammar lives once in `docs/architecture.md`
> `## Behavioral contract (taxonomies & invariants)` and is referenced, never restated.

## Purpose
<why this process exists, in one or two sentences — the outcome it produces>

## Scope
<what this procedure covers and what it explicitly does NOT cover (the No-Gos)>

## Roles (RACI)
| Role | Responsible | Accountable | Consulted | Informed |
|---|---|---|---|---|
| <role> | <x> | <x> | <x> | <x> |

## Inputs and outputs (SIPOC)
**Inputs / prerequisites:** <what must exist before step 1>
**Outputs:** <the finished artefact / state this produces — the good-outcome>

## Procedure (standard work)
| Step | Actor | Action | Expected result |
|---|---|---|---|
| 1. | <role> | <action in plain language> | <observable result> |
| 2. | <role> | <action> | <result> |
| N. | <role> | <completion> | <done state> |

## Decision points
| At step | Condition | If yes | If no |
|---|---|---|---|
| <step> | <condition> | <branch> | <branch> |

## Exceptions / failure handling and recovery
| Failure | Detected by | Recovery action | Who |
|---|---|---|---|
| <what can go wrong> | <signal> | <how to recover> | <role> |

## References
<standards, systems, related SOPs the process must respect — e.g. cited stack-notes standards>

## Revision history
| Date | Version | Change | Author |
|---|---|---|---|
| <YYYY-MM-DD> | <vX> | <what changed> | <role> |
```

**Recommendation:** ship this section list (purpose · scope · roles/RACI · inputs+outputs/SIPOC · procedure · decision points · exceptions/recovery · references · revision history) as v1, flagged in the template comment as **confirm-against-methodology** per the research caveat. No meaningful second variant — the methodology names converge on this set; the only open knob is per-section ceremony, handled by fork 6 proportionality.

---

## Fork 6 — back-compat and proportionality (no new mechanism)

### Back-compat (absent-kind = software, airtight)

- **Single defaulting rule, stated once** in the fork-1 `### Project kind` `WORKFLOW.md` subsection: *absent `## Project kind` ⇒ `software`*. Every consumer references it by name; none re-encodes it. Enumerate the consumers and confirm each defaults correctly:
  - `/pm-bootstrap` — only an **existing** (already-initialized) downstream project lacks the line; treated as `software`. New greenfield/legacy writes the line from the kind question.
  - The "What is mandatory when" **rider** (fork 1) — names `software`-and-kind-absent together; software rows byte-unchanged.
  - **Step 5 Pass-2 routing** (fork 3) — default branch = `code-review` (the existing path).
  - **`## Dry-run` stamp** (fork 3) — presence-keyed: a software review file has **no** `## Dry-run` section, so pr-prep step 0 and auditor dim 1 are exempt on it — unchanged.
  - **advocate tier** (fork 4) — process tier only passed when `kind = process`; software still gets `per-feature`/`bootstrap`.
- Net: a `software`-kind or kind-absent project sees **zero** behavior change — the load-bearing back-compat guarantee. The one risk (a consumer that reads `kind` but forgets the default) is closed by single-sourcing the default and the plan's editorial verification.

### Proportionality (reuse the existing change-type matrix, no new knob)

- Ceremony scales to stakes through the **existing** "What is mandatory when" change-type rows — **not** a new process-stakes mechanism. A low-stakes one-off process is classified down (docs-only-fix / trivial-fixup style) and inherits that row's lighter obligations (dry-run/sign-off skipped with the standard one-line reason); a high-stakes multi-role SOP rides the full user-facing-equivalent discipline (advocate process tier + dry-run stamp + full DoD). The SOP template's sections that don't apply to a trivial process are marked `N/A — <reason>` (the architecture.md per-section discipline), not deleted.
- This is exactly the protocol's existing proportionality instinct (research failure-mode lesson: discipline helps high-stakes/repeated/multi-role, strangles low-stakes one-offs) applied through the matrix it already owns.

**Recommendation:** make the absent-kind-⇒-software default a **single named rule** that every listed consumer references; scale ceremony through the existing change-type matrix and the per-section `N/A` discipline — introduce no process-specific proportionality mechanism.

---

## Cross-cutting note for the plan

The plan is sound and needs no revision; these are the structural resolutions it explicitly deferred to this review. One emphasis for implementation: every new conditional (kind rider, Pass-2 routing, dry-run stamp, process tier) must key on the **one** `### Project kind` rule and reference it **by name** — re-encoding the enum or the default in any consumer would reintroduce the drift the single-source pattern exists to prevent.
