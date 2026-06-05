# WORKFLOW.md progressive disclosure — design notes

## Context

`WORKFLOW.md` (564 lines, ~17k tokens) is the canonical orchestration spec. Downstream
projects load it via `@.ai-pm/tooling/WORKFLOW.md` in their `CLAUDE.md`. The plan asks: shrink
the always-loaded surface without losing any rule, gate, named anchor, or single-source
statement, and without forcing a downstream migration.

The structural choice is real and has multiple plausible homes for "the bulk": an on-demand
Read-on-demand split (PM's direction), Skills (progressive disclosure), path-scoped
`.claude/rules/`, or a hybrid. The cost being paid today is concrete and grounded in verified
Claude Code facts (claude-code-guide agent; sources: code.claude.com/docs memory.md, skills.md,
sub-agents.md, how-claude-code-works.md):

- **`@`-imports are EAGER.** They load the file's full text at every session start; splitting
  via `@` "helps organization but does not reduce context." So the ~17k tokens are paid in the
  main loop on every session.
- **Subagents load the project `CLAUDE.md`** (all built-in/custom subagents except `Explore`
  and `Plan`). Because `CLAUDE.md` `@`-imports `WORKFLOW.md`, the ~17k tokens are **also** paid
  on nearly every subagent spawn. The protocol spawns 8 agents heavily, so this is the dominant
  multiplier.
- **Recommended `CLAUDE.md` size: under 200 lines.** WORKFLOW.md alone is 2.8× over before the
  downstream's own `CLAUDE.md` body is counted.
- **Skills are the official progressive-disclosure pattern:** only frontmatter+description
  (~60 tokens) is in context at start; the body loads on trigger; reference files load on
  demand via Read.
- **Subagents do NOT auto-inherit skills** — a skill must be declared in the subagent's
  `skills:` frontmatter to be available to it.
- **Path-scoped rules** (`.claude/rules/*.md` with `paths:` frontmatter) load only when Claude
  touches files matching the glob.

**Trigger nature (decisive).** Every rule in WORKFLOW.md is triggered by a **workflow STEP or a
semantic condition** — "when planning a feature", "when resolving a product fork", "when the
plan touches a security surface", "before running it on hardware" — never by *which source file
is open*. This is the single most important fact for choosing the mechanism (see Variant
comparison).

This rethink **supersedes** the prior plan `doc/features/workflow-extract-to-refs_plan.md`,
which moved only the *illustrative* blocks (the ✓/✗ PM-comms pairs, the ASCII diagram, the
Matter worked example, the probe-proposal template) into a `WORKFLOW-examples.md` companion. That
plan explicitly scoped out "splitting WORKFLOW.md into multiple rule files" as "a separate,
larger decision the PM has not asked for." The PM has now asked for it. The examples-extraction
is **one slice** of this broader decomposition — the illustrative blocks are simply the most
obviously-lazy-loadable content and become the first `workflow/*.md` topic file (or fold into
the relevant topic files). It is not a competing effort; it is subsumed.

## Adjacent implementations (existing single-source + by-name-reference patterns in this repo)

The protocol already has a mature, repeatedly-applied pattern for "one rule, one home, referenced
by name, never re-encoded." The decomposition must extend it, not invent a new discipline.

1. **`### `-subsections of WORKFLOW.md referenced by name.** `### Project kind`,
   `### Decision authority`, `### Review typology`, `### Security-relevant surfaces`,
   `### Foundational product questions`, `### Threat-model lifecycle` each live once and are
   referenced as `` `### X` in `WORKFLOW.md` `` from their consumers, with the explicit
   discipline "never re-encode the enum or the default." Verified live counts (live consumers
   only — `.claude/`, `MIGRATIONS.md`, `README.md`, `doc/_templates/`): Project kind ×20,
   Decision authority ×16, Foundational product questions ×9, Security-relevant surfaces ×6,
   Review typology ×2, Threat-model lifecycle ×1.

2. **`MIGRATIONS.md` as a protocol-root sibling referenced by bare filename**
   (`doc/architecture.md` decision "Migration catalogue is a single protocol-root reference").
   The decisive rationale recorded there: the file is referenced by **bare filename** so it
   resolves in **both** contexts — this repo (dogfood, read at the repo root) and downstream
   (read at `.ai-pm/tooling/MIGRATIONS.md`). It explicitly rejected a `doc/<name>.md` home
   because "a `doc/`-vs-`docs/` path resolves in only one of the two contexts, fatal for a
   hot-path reference." This is the exact dual-context resolution constraint the new
   `workflow/*.md` files inherit.

3. **The "references by name, never re-encode the default" clause family.** `### Project kind`
   and `### Decision authority` both carry a load-bearing `absent OR unrecognized ⇒ <safe
   default>` rule and an explicit prohibition on any consumer re-encoding it. The move must
   carry these clauses *verbatim* into their topic files — the prohibition is what prevents
   back-compat drift.

## Behavioral risks in this area

Not event-driven code — no subscription/emit feedback loops. The risk is **silent rule-skip**:
a load-bearing rule that today is guaranteed-present (because the whole file is eager-loaded)
becomes guaranteed-present *only if a consumer remembers to Read its topic file*. Three concrete
failure shapes to design against:

- **A.** A rule that must hold on *every* action regardless of step (use `pm-*` not `wb-*`;
  never commit to main; edit-ownership; remote-system boundary) is moved into a lazy file and
  then is simply never loaded for an action that didn't think to Read it. → These MUST stay in
  the always-loaded core.
- **B.** A by-name reference is repointed to a file path, but the consumer is *not* given an
  explicit "Read this file before X" step — so it has a pointer it never follows. → Every
  repointed reference must become a *procedural* Read step, not a passive citation.
- **C.** A subagent (fresh context, loads `CLAUDE.md` → gets the thin core, but does **not**
  auto-inherit anything beyond it) reaches a step whose rule now lives in a topic file and never
  Reads it. → Subagent prompts/personas must carry the explicit Read step for the topic files
  their job needs.

## Variant A: Thin core + on-demand `workflow/*.md`, read via the Read tool by consumers (PM's direction)

- **Where:** `WORKFLOW.md` stays at the same path as a ~150-line "constitution + router";
  the bulk moves to `workflow/*.md` siblings inside the same submodule. Consumers (commands,
  agents) get an explicit "Read `workflow/<topic>.md` before X" step where they reach that step.
- **Relation to adjacent:** *Symmetric* with the existing single-source + by-name discipline
  (#1, #3) and with the `MIGRATIONS.md` bare-filename / dual-context pattern (#2). The by-name
  references `` `### X` in `WORKFLOW.md` `` become `` `### X` in `workflow/<topic>.md` `` — same
  shape, new target. It is the natural continuation of `MIGRATIONS.md` (extract a hot cluster to
  a sibling, reference by relative path that resolves in both contexts), one level finer-grained.
- **Pros:**
  - **Fits the step/condition trigger model exactly.** A consumer that *reaches* a step is the
    right actor to *load* that step's rules. The trigger ("when planning") is already encoded as
    a procedural step in the command/agent, so the Read attaches to something that already exists.
  - **Additive, zero migration.** The `@.ai-pm/tooling/WORKFLOW.md` line is unchanged; the new
    `workflow/*.md` ride the submodule (downstream owns no copy). No `MIGRATIONS.md` entry, no
    downstream-owned file changes.
  - **Reliability is procedural, not hopeful.** A Read step in a command/agent is an instruction
    the model executes, not a passive link it may ignore — and the router in the thin core is
    eager-loaded, so it is unmissable.
  - **Largest always-loaded win** (see "Quantify the win"): only ~150 lines are eager-loaded in
    the main loop *and* in every subagent spawn.
  - **No new mechanism to learn.** It reuses Read-on-demand (already how agents read plans,
    contracts, stack-notes) and the by-name discipline already in force.
- **Cons:**
  - **Read-discipline is by-instruction, not by-platform.** Unlike Skills (platform loads the
    body on trigger) or path-rules (platform loads on glob match), nothing in the runtime
    *forces* the Read — it depends on the consumer carrying the step. Mitigated by Reliability
    section below, but it is the honest residual.
  - **Every consumer must be touched** to add Read steps — the blast radius is the by-name
    reference set (bounded and enumerated below, but real).
- **Risks:** failure shapes B and C above. Both are closed by the Reliability design (explicit
  Read steps + the unmissable router + subagent prompts carrying the Read step).

## Variant B: Full conversion of the spec into Skills

- **Where:** each topic becomes a Skill under `.claude/skills/<name>/SKILL.md`; the body loads
  on trigger; reference files load on demand.
- **Relation to adjacent:** *Asymmetric* — introduces a new artifact kind the protocol does not
  use for its own rules today, and a new loading model.
- **Pros:** the officially-recommended progressive-disclosure mechanism; the platform loads the
  body just-in-time, so the always-loaded cost is genuinely ~60 tokens/skill (frontmatter only);
  reliability of *loading* is platform-handled once a skill triggers.
- **Cons (decisive against full conversion):**
  - **Trigger mismatch.** Skills trigger on a model-judged match against the skill's
    `description`. The protocol's triggers are workflow-STEP/condition based ("when resolving a
    product fork", "when the plan touches a security surface") — these are *procedural pipeline
    positions*, not topics the model spontaneously recognizes mid-conversation. A step-based rule
    is reliably reached by a command's *procedure*, far less reliably by a description-match
    heuristic.
  - **Subagents do NOT auto-inherit skills.** Every `pm-*` agent that needs a rule would have to
    declare it in `skills:` frontmatter — a large, drift-prone wiring surface across 8 agents,
    and a skill not declared is silently unavailable (exactly failure shape C, but now
    platform-level and harder to see).
  - **Higher migration cost / weaker single-source fit.** Skills are a different home shape than
    the existing `### subsection` + by-name discipline; converting wholesale abandons the proven
    pattern rather than extending it.
- **Risks:** load-bearing invariants (never-commit-to-main, edit-ownership) are exactly the rules
  that must NOT depend on a trigger match — Skills are wrong for the always-on core, and
  awkward for step-triggered rules.

## Variant C: Path-scoped `.claude/rules/*.md`

- **Where:** topic files with `paths:` frontmatter; the platform loads a rule when Claude works
  on files matching the glob.
- **Relation to adjacent:** *Asymmetric* and, for this protocol, a category error.
- **Pros:** truly automatic loading, zero per-consumer wiring, when the trigger genuinely *is* a
  file path.
- **Cons (decisive against):** the protocol's triggers are **not file-path based.** "When
  planning a feature" or "when resolving a product fork" does not correspond to editing a
  particular glob — planning happens before any file is touched; a product-fork decision touches
  no source file at all. There is no glob that means "the orchestrator is about to relay a PM
  decision." Path-scoping would mis-fire (load nothing at the moment the rule is needed) for the
  majority of WORKFLOW.md rules.
- **Risks:** the rules that *do* have a natural path (e.g. "editing a hook → read hook
  discipline") are a tiny minority; using path-scoping for the rest means the rule is absent
  exactly when needed.

## Variant D: Hybrid (recommended target shape — Variant A as the spine, with two narrow borrowings)

The recommendation is **Variant A as the architecture**, with two small, well-bounded borrowings
that cost nothing and close A's residual risk where another mechanism is strictly better:

- **A is the spine:** thin eager-loaded `WORKFLOW.md` core + router → `workflow/*.md` topic
  files read on-demand by consumers via explicit Read steps. This is the only variant that fits
  the step/condition trigger model and is additive/no-migration.
- **Borrow path-scoping (C) for the *genuinely* path-triggered rule only:** the hook discipline
  ("editing `.claude/settings.json` → the hooks are tested by `tests/hooks.sh`, gated by CI")
  *does* have a real glob. If and only if a clean path exists, that single topic MAY also carry a
  `paths:` rule so it auto-loads when a hook file is edited. This is optional polish, not core —
  do not force it.
- **Do NOT borrow Skills (B)** for any rule. The trigger mismatch + no-subagent-inheritance make
  Skills a net negative for this rule set. (If the protocol later wants a *PM-facing capability*
  that is genuinely topic-triggered and main-loop-only, Skills become reconsiderable — out of
  scope here.)

Everything below specifies Variant A/D concretely.

## Recommendation

**Variant A (PM's direction), framed as the Variant D hybrid: thin core + router + on-demand
`workflow/*.md` read via explicit Read steps, with at most one optional path-scoped borrowing for
the hook-edit case.** It is the only option whose loading model matches the protocol's
step/condition triggers, it extends the proven single-source + by-name + dual-context-filename
discipline instead of replacing it, and it is the only one that is additive with zero downstream
migration. Skills (B) lose on trigger mismatch + no subagent inheritance; path-scoping (C) loses
because the triggers are not file paths.

---

## Decision 2 — the always-on / on-demand boundary

Partition of every WORKFLOW.md section. **Always-on** = an invariant that must hold on *every*
action regardless of which step you are in, OR the router itself. **On-demand** = consulted only
when a specific step/condition is reached.

### MUST stay in the always-loaded thin core (~150 lines)

These are the cross-cutting invariants (failure shape A) plus the navigation map:

- **The top banner** ("canonical orchestration spec … when the two documents disagree, this one
  wins") — orients every reader.
- **Agent/skill identity invariant:** use only the `pm-*` agents, never the `wb-*` role
  duplicators (the one-paragraph form + the pointer that the deny-list is hook-enforced). The
  *full roster table* and the *full Hook-level-enforcement detail* are on-demand; the
  always-true one-liner stays.
- **Project boundary rule:** every agent stays within the project root; never read/write outside
  it. (Holds on every action.)
- **Edit-ownership rule — the one-liner:** the orchestrator never freehand-edits canon owned by
  an autonomous agent; it respawns the owner. (The two detailed carve-outs and the full artefact
  enumeration are on-demand.)
- **Remote-system boundary — the one-liner:** a repo-owned file changes through git, never by
  in-place edit on a remote system. (The full Forbidden/Allowed lists are on-demand.)
- **Git workflow skeleton:** never commit to `main`; one branch per PR; the checkout/branch/
  pr-prep/merge loop. (Holds on every change.)
- **The Step 0–7 pipeline skeleton:** the named steps in order, each as a one-line "what happens
  + where to read the detail" — this *is* the router for the step-keyed topic files.
- **PM-comms core:** language canon (conversation = PM's language; disk = English), and the
  one-line rules (lead with user impact; one question at a time; AskUserQuestion for substantive
  forks; never show code). The *examples* are on-demand.
- **The navigation map / router:** the explicit table of "for X → read `workflow/<topic>.md`",
  covering every topic file. Unmissable because it is eager-loaded.

### Safe to lazy-load (on-demand `workflow/*.md`)

- Full agent roster table + full command roster table.
- Full Hook-level-enforcement detail (the deny-list specifics, the PreToolUse/UserPromptSubmit
  mechanics, `tests/hooks.sh`).
- The `## How I work` step bodies (the full prose of each Step 0–7, including Step 3.5
  product-readiness, Step 5 review-loop, Step 5.5 run-for-real, Step 6 ship gate, Step 7 PR
  comments).
- `## What is mandatory when` (the change-type table + the three riders).
- All six `### `-subsections (Project kind, Decision authority, Review typology,
  Security-relevant surfaces, Foundational product questions, Threat-model lifecycle).
- `## How state is kept` + `### Three channels surface to PM`.
- `## When you say it doesn't work in production` (incident/probe flow + Blast-radius preflight).
- `## When the protocol itself has a gap`.
- `## Maintenance`.
- `## How to talk to the PM` (the full rule list + the examples — the thin core keeps only the
  one-line rules + language canon).
- The illustrative blocks the superseded plan targeted (PM-comms ✓/✗ pairs, ASCII diagram,
  Matter worked example, probe-proposal template).

## Decision 3 — the decomposition map (proposed file set)

Each `### `-subsection and each large `## ` section is a natural seam. Proposed
`workflow/*.md` files (siblings inside `.ai-pm/tooling/`, referenced by relative path that
resolves in both dogfood and downstream contexts, exactly like `MIGRATIONS.md`):

| File | One-line purpose | Source section(s) |
|---|---|---|
| `workflow/roster.md` | Full agent + command roster tables; `code-review` note. | `## Workflow agents and commands` (tables) |
| `workflow/enforcement.md` | Hook-level enforcement detail, the `wb-*` deny-list specifics, `tests/hooks.sh`, the boundary/edit-ownership/remote-system *full* rules + both edit-ownership carve-outs. | `### Agents` boundary/edit/remote paragraphs + `Hook-level enforcement` |
| `workflow/pipeline.md` | The full Step 0–7 bodies (`## How I work`), incl. Step 3.5 / 5 / 5.5 / 6 / 7. | `## How I work` |
| `workflow/mandatory-matrix.md` | The change-type table + Product-readiness / Threat-model / Project-kind riders. | `## What is mandatory when` |
| `workflow/project-kind.md` | `### Project kind` (enum + `absent OR unrecognized ⇒ software` default + no-code validation discipline + deliverable convention). | `### Project kind` |
| `workflow/decision-authority.md` | `### Decision authority` (enum + `absent ⇒ interactive` default + derivability test + escalate cap + procedural-gate progression). | `### Decision authority` |
| `workflow/review-typology.md` | `### Review typology` (the five review types + new-code-gating + det/AI split). | `### Review typology` |
| `workflow/security-surfaces.md` | `### Security-relevant surfaces` + `### Threat-model lifecycle`. | `### Security-relevant surfaces`, `### Threat-model lifecycle` |
| `workflow/foundational-questions.md` | `### Foundational product questions` (three tiers). | `### Foundational product questions` |
| `workflow/state.md` | `## How state is kept` + `### Three channels surface to PM`. | `## How state is kept` |
| `workflow/incident.md` | `## When you say it doesn't work in production` (Step A/A.5/B/C/D + Blast-radius preflight). | that section |
| `workflow/protocol-gap.md` | `## When the protocol itself has a gap`. | that section |
| `workflow/maintenance.md` | `## Maintenance` (submodule bump + post-bump audit). | that section |
| `workflow/pm-comms.md` | `## How to talk to the PM` full rule list. | that section |
| `workflow/examples.md` | The illustrative blocks (PM-comms ✓/✗ pairs, ASCII diagram, Matter worked example, probe-proposal template). Subsumes the superseded `WORKFLOW-examples.md` plan. | scattered examples |

Notes:

- **Granularity is "one seam per file" deliberately** — finer than necessary would multiply Read
  steps; coarser would re-bloat a single lazy file. The `### subsection` seams are the natural
  unit because they are already the single-source homes referenced by name.
- `workflow/security-surfaces.md` merges two small related subsections (surfaces + threat-model
  lifecycle) because they are always consulted together (the threat-model rider keys on the
  surfaces list).
- **The "never re-encode the enum/default" clauses move verbatim** into `project-kind.md`,
  `decision-authority.md`, `review-typology.md`. The prohibition itself is part of the rule.
- This file count (~15) is a proposal, not a contract — the implementing plan may merge a couple
  if a seam proves too thin. The boundary (Decision 2) is the load-bearing part; exact file
  granularity is tunable.

## Decision 4 — by-name reference migration (the biggest blast-radius surface)

**Method.** Grepped `WORKFLOW.md` across `.claude/`, `doc/`, `MIGRATIONS.md`, `README.md`:
**258 total matches.** These split into two classes:

- **Live consumers (must repoint):** `.claude/agents/*`, `.claude/commands/*`,
  `.claude/settings.json`, `MIGRATIONS.md`, `README.md`, `doc/_templates/*`. These are read at
  runtime and their references must keep resolving.
- **Frozen historical records (must NOT touch):** `doc/features/*_plan.md` and
  `doc/protocol-vs-builtins-analysis.md` — past plans/analyses that are an audit trail. Editing
  them would falsify history. (`doc/architecture.md` is a special case — see below.)
  `doc/features/` alone accounts for ~140 of the 258 matches and is explicitly out of scope.

### Live by-name section references (the set that must be repointed)

Tallied from live consumers only — each `` `### X` in `WORKFLOW.md` `` becomes
`` `### X` in `workflow/<topic>.md` `` **plus** an explicit Read step where the consumer reaches
that step:

| By-name anchor | Live occurrences | New target | Repoint |
|---|---|---|---|
| `### Project kind` | 20 | `workflow/project-kind.md` | text + Read step at kind-branch points |
| `### Decision authority` | 16 | `workflow/decision-authority.md` | text + Read step at fork-resolution |
| `### Foundational product questions` | 9 | `workflow/foundational-questions.md` | text + Read step in advocate / pm-plan / pm-bootstrap |
| `### Security-relevant surfaces` | 6 | `workflow/security-surfaces.md` | text + Read step in pm-plan / pm-plan-checker / pm-auditor |
| `### Review typology` | 2 | `workflow/review-typology.md` | text + Read step in pm-audit |
| `### Threat-model lifecycle` | 1 | `workflow/security-surfaces.md` | text + Read step |
| `### Expected-discipline manifest` | 1 | (lives in `MIGRATIONS.md`, NOT WORKFLOW.md) | unchanged — not a WORKFLOW.md ref |
| "PM communication rules from WORKFLOW.md" | 3 | `workflow/pm-comms.md` (rules) / thin core (one-liners) | text + Read step |
| "Edit-ownership rule" (in WORKFLOW.md) | 3 | one-liner in thin core; detail in `workflow/enforcement.md` | the always-on one-liner satisfies most; detail refs repoint |
| "remote-system boundary" | 1 | one-liner in thin core; detail in `workflow/enforcement.md` | as above |
| "Hook-level enforcement" | 1 | `workflow/enforcement.md` | text + Read step |
| "language canon" | 1 | thin core (it is an always-on invariant) | stays resolvable in core |
| "Step 3.5" / "Step 5" (step labels) | 5 | `workflow/pipeline.md` | the router lists the step; detail in pipeline.md |

**`### section` (×2)** is a literal placeholder token in prose ("a `file` / `### section`
reference"), not a real anchor — no repoint.

### Migration rule for each reference (so none is orphaned)

1. **Section name unchanged.** Keep `### Project kind` etc. as the heading inside its new file —
   the by-name resolution is "find the `### X` heading", now in `workflow/<topic>.md`. This keeps
   diffs minimal and preserves the "never re-encode" discipline (the name is the anchor).
2. **Reference text:** `` `### X` in `WORKFLOW.md` `` → `` `### X` in `workflow/<topic>.md` ``.
   One mechanical find/replace per anchor, target chosen from the Decision-3 map.
3. **Add the Read step:** wherever the consumer *acts* on that rule, insert "Read
   `workflow/<topic>.md` before X" as a procedural step (closes failure shape B). A passive
   citation alone is insufficient.
4. **Always-on one-liners need no Read step** — language canon, the edit-ownership/remote/
   boundary/`pm-*` one-liners are in the eager-loaded core, so consumers that only need the
   one-liner are already covered; only consumers needing the *full detail* get a Read step to
   `workflow/enforcement.md`.
5. **`MIGRATIONS.md` references** to `WORKFLOW.md` subsections (e.g. the Expected-discipline
   manifest pointing at foundational questions) repoint to the same `workflow/*.md` targets,
   relative path — `MIGRATIONS.md` is itself a protocol-root sibling, so the relative path
   resolves identically in both contexts.

### `doc/architecture.md` — the one historical-record exception

`doc/architecture.md` has **46** `WORKFLOW.md` mentions, almost all inside *decision records*
that legitimately say things like "single-sourced in `### X` of `WORKFLOW.md`". These decision
records are historical narrative and should NOT be rewritten to chase the new file paths (that
would churn the audit trail). The **two** sections `pm-architect` cross-checks (A4) — `## File
layout` and `## Integration contract` — DO need updating:

- **`## File layout`** gains the `workflow/` directory row (A4: File layout ↔ `git ls-tree`).
- **`## Integration contract`** item 3 ("WORKFLOW.md imported via `@`-directive") is unchanged —
  the import line stays — but a sentence noting the `workflow/*.md` siblings ride the same
  submodule keeps the contract honest.

This edit is owned by `pm-architect` on the post-coding Docs-to-update handoff (the same pattern
the superseded plan used for its single File-layout row).

**Orphan check:** every live anchor in the table above has a named target file; the section
*name* is preserved as the heading, so even a missed Read-step addition still leaves the by-name
reference resolvable (degraded to a passive pointer, not broken). The objective floor is an
**anchor-inventory clean-grep** (carried over from the superseded plan's Test plan): every
`### subsection` heading + every named rule/step label still grep-resolves *somewhere* in
`WORKFLOW.md` (router) or `workflow/*.md` (home) after the change. A single unresolved anchor is
a blocking finding.

## Decision 5 — reliability mitigation (keeping a load-bearing rule from being silently skipped)

On-demand loading trades guaranteed-presence for context economy. The design keeps a rule from
being silently skipped through four layers, none "by discipline" alone:

1. **The cross-cutting invariants stay eager-loaded in the thin core.** The rules that must hold
   on *every* action (never-commit-to-main, edit-ownership one-liner, remote-system one-liner,
   `pm-*`-not-`wb-*`, project boundary, language canon) are NOT lazy-loaded — they are in the
   ~150-line core that every session and every subagent eager-loads. Failure shape A is closed by
   construction.
2. **The router is unmissable.** The thin core carries the Step 0–7 skeleton *as* the navigation
   map — each step names its `workflow/<topic>.md`. Because the core is eager-loaded, the map is
   always present; a consumer always knows the topic file exists and where it is.
3. **Procedural Read steps, not hopeful pointers.** Each consumer that reaches a step carries an
   explicit "Read `workflow/<topic>.md` before X" instruction (Decision 4 rule 3). A Read step is
   an action the model executes within its procedure, not a passive link it may skip (closes
   failure shape B).
4. **The subagent angle is handled explicitly.** Subagents load `CLAUDE.md` → get the thin core
   (so they always have the invariants + the router), but they do **not** auto-inherit anything
   beyond it and do **not** auto-inherit skills. Therefore every `pm-*` agent persona that needs
   a topic rule must carry the explicit Read step in its own prompt (e.g. `pm-plan-checker` and
   `pm-auditor` Read `workflow/security-surfaces.md`; `pm-product-advocate` Reads
   `workflow/foundational-questions.md`). This is the same discipline the agents already use to
   Read plans/contracts/stack-notes — extended to the topic files. (Closes failure shape C.)

**Backstop already in place:** the existing hooks (`PreToolUse` deny-list for `wb-*`,
`UserPromptSubmit` route reminder) are wired in `.claude/settings.json` and survive regardless of
which markdown is loaded — they enforce the most safety-critical invariants (the `pm-*`/`wb-*`
split, the remote-edit boundary) mechanically, independent of the doc split. The decomposition
does not touch hooks, so this hard floor is unchanged.

## Decision 6 — downstream / migration story (additive, no migration)

- **`@.ai-pm/tooling/WORKFLOW.md` is unchanged.** WORKFLOW.md stays at the same path; only its
  *body* shrinks. The downstream import line is byte-identical → additive.
- **`workflow/*.md` ride the submodule.** They live under `.ai-pm/tooling/` (referenced as
  `workflow/<topic>.md` relative to the protocol root, resolving in both dogfood and downstream
  contexts — the proven `MIGRATIONS.md` mechanism). Downstream owns no copy of WORKFLOW.md or of
  the topic files; they arrive on the next `git submodule update --remote`.
- **No `MIGRATIONS.md` pending-migration entry.** No downstream-owned artifact changes. The
  symlinked surfaces (`.claude/agents`, `.claude/commands`, `.claude/settings.json`) already
  point into the submodule, so the repointed agent/command references propagate transparently.
- **Confirmed: no downstream-owned file must change.** The only downstream-owned file that
  mentions WORKFLOW.md is `CLAUDE.md` (the `@`-import line + a Project-kind comment that points
  at `### Project kind` "in WORKFLOW.md"). The import line is unchanged. The Project-kind comment
  in `CLAUDE.md.tmpl` is template-owned (ships with the bump); an *already-bootstrapped*
  downstream `CLAUDE.md` may carry a stale "in WORKFLOW.md" phrasing in that comment — but it is
  a *comment*, not a resolving reference, and `### Project kind` still exists (its name is the
  anchor, now in a topic file). So nothing downstream breaks. **Flag for the plan:** confirm the
  `CLAUDE.md.tmpl` Project-kind comment is updated to point at the new home (template-owned,
  rides the bump, still no migration) — this is the one place to double-check, not a blocker.

## Decision 7 — single-source discipline preserved

- **One rule, one file.** Each rule moves to exactly one `workflow/*.md`; the thin core holds
  *only* the always-on invariants + the router (the router is a navigation index, not a second
  copy of the rules). No rule is duplicated between core and topic file — the core carries the
  *one-liner invariant*, the topic file carries the *full rule*, and they are different
  granularities of the same single source, not two copies. (Where a one-liner and the full rule
  coexist, the topic file is canonical and the core one-liner is the always-true subset — the
  same relationship the spec already uses between a rule and its summary.)
- **Deliberate cross-references stay by-reference.** The existing "references `### X` by name,
  never re-encode" clauses move verbatim into the topic files. The threat → constraint one-way
  `SCn` wiring, the move-not-copy journey/Behavioral-contract discipline, etc. are untouched —
  they reference *other* docs, not WORKFLOW.md internals.
- **The "never re-encode the default/enum" discipline survives the move.** This is the most
  fragile invariant. It moves *with* its subsection into `workflow/project-kind.md` /
  `decision-authority.md` / `review-typology.md`, including the explicit prohibition sentence. A
  consumer still references the subsection by name and still must not re-encode the enum/default —
  the only change is the file the name lives in. **Do not** lift any enum or default into the
  thin core "for convenience" — that would re-encode it in a second place and reintroduce exactly
  the back-compat drift these clauses exist to prevent.

## Decision 8 — quantify the win + residual risks

**Rough token math** (WORKFLOW.md = 564 lines ≈ 17k tokens today):

- **Thin core target:** ~150 lines ≈ **~4.5k tokens** eager-loaded (banner + invariant
  one-liners + Step 0–7 router + PM-comms one-liners + nav map).
- **Always-loaded delta, main loop:** ~17k → ~4.5k ≈ **−12.5k tokens (~−74%)** per session
  start.
- **Always-loaded delta, per subagent spawn:** the same ~−12.5k, paid on *nearly every* spawn
  (all except `Explore`/`Plan`). With the protocol spawning 8 agent types repeatedly across a
  feature, this is the dominant aggregate saving — each spawn previously re-paid the full ~17k
  for rules it mostly didn't need.
- **On-demand cost when a topic is needed:** a consumer that Reads one `workflow/*.md` pays that
  file's tokens *only at that step* — typically one or two topic files per agent run, far less
  than the whole spec. Net: the protocol pays for what each actor actually uses.
- **Brings the import under the recommended ceiling:** ~4.5k tokens for WORKFLOW.md leaves
  headroom under the "<200 line CLAUDE.md" guidance once combined with the downstream's own
  CLAUDE.md body — today WORKFLOW.md alone blows it 2.8×.

(Numbers are estimates from the line/token ratio; the implementing plan should measure the actual
thin-core size — the ~150-line target is the design constraint, not a measured result.)

**Residual risks (honest):**

1. **Read-discipline is by-instruction, not platform-enforced.** Unlike Skills/path-rules,
   nothing in the runtime forces the Read. Mitigated by the always-on invariants in core + the
   procedural Read steps + the unmissable router + the existing hard hooks — but a consumer that
   *forgets* to carry a Read step for a *non-invariant* rule could skip it. The
   anchor-inventory clean-grep catches a missing *home*; it does not catch a missing *Read
   step* — so the plan needs a per-consumer Read-step checklist as a verification item.
2. **More files to keep in sync.** 15 topic files vs one — a rule could be edited in a topic file
   while a stale summary lingers in the core. Mitigated by keeping the core strictly to
   *one-liners + router* (minimal surface to drift) and forbidding enum/default duplication.
3. **The thin-core boundary is a judgment call.** "Must hold on every action" vs "consulted at a
   step" is mostly clear, but a few rules sit near the line (e.g. the AskUserQuestion convention).
   Erring toward the core for anything genuinely cross-cutting is the safe default; the cost of a
   borderline rule in the core is a few tokens, the cost of wrongly lazy-loading a true invariant
   is a silent skip.
4. **Stale "in WORKFLOW.md" phrasing in already-bootstrapped downstream `CLAUDE.md` comments**
   (Decision 6) — cosmetic, non-resolving, non-blocking, but worth a one-line note in the
   downstream's next audit.

## Plan should be updated to…

- Treat the superseded `doc/features/workflow-extract-to-refs_plan.md` examples-extraction as
  *one slice* of this decomposition (fold its `WORKFLOW-examples.md` into `workflow/examples.md`,
  or keep the name — implementer's call), and mark that plan superseded.
- Carry forward that plan's **anchor-inventory clean-grep** verification floor, and **add** a
  per-consumer **Read-step checklist** (residual risk 1) — the clean-grep alone does not verify
  the procedural Read steps were added.
- Include the `doc/architecture.md` `## File layout` + `## Integration contract` updates as a
  `pm-architect` post-coding Docs-to-update item (A4 cross-check), and the `CLAUDE.md.tmpl`
  Project-kind comment repoint (Decision 6 flag).
