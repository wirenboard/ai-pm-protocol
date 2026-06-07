# Context-leanness — design notes

## Context

The plan (`doc/features/context-leanness_plan.md`, DRAFT) targets input-token COUNT: every agent spawn reloads large docs in full, chiefly `doc/architecture.md` (~185 KB measured, ~46K tokens). The feature makes a CONSUMER read the relevant section of a large structured doc via its index, not the whole file. The owner (`pm-architect`) authoring its own canon keeps reading FULL.

The plan correctly names the load-bearing risk: read less → an agent loses context it needs → degraded decisions. This note is the safety gate. It must define a targeted-reading discipline that is provably sufficient per role, and it must NOT trade protocol fidelity for tokens — so for any role where targeted reading is genuinely risky, the recommendation is to leave it FULL.

**Two facts from the codebase make this tractable and low-risk:**

1. **`doc/architecture.md` is already a reliable index.** Its `## Architectural decisions` section is ~40 `### ` decision records, each with a descriptive, greppable title (e.g. `### Cross-model review: …`, `### Review typology: …`), plus stable `## ` section headers (`## Operational limits & budgets`, `## Security constraints`, `## State model`, `## Integration contract`, …). A consumer can grep the `### `/`## ` header list, pick the relevant record, and offset-read just it. The structure is the navigation; no doc restructuring is needed (and the plan puts that out of scope).
2. **The discipline already exists in the protocol — for one agent.** `pm-coder` step 2 reads the project entry file as: *"Read the relevant sections … Read in full only when the plan mentions a constraint area not visible from those sections."* That is exactly the index-first + widen-when-needed pattern, already shipped and trusted. This feature generalizes a proven in-protocol pattern; it does not invent one.

## Adjacent implementations (the read-input steps consumers use today)

1. **`pm-coder`** at `src/agents/pm-coder.body.md` step 2 — already targeted ("relevant sections … in full only when …"). The template for the whole feature.
2. **`pm-auditor`** at `src/agents/pm-auditor.body.md` step 1 — reads `docs/architecture.md` + `docs/user-journeys.md` "first", then runs many whole-doc consistency dimensions (File-layout completeness, threat↔constraint `SCn` wiring, System-invariants index, journey identifier-restatement). Its job IS cross-cutting whole-document consistency.
3. **`pm-stack-researcher`** at `src/agents/pm-stack-researcher.body.md` — "`docs/architecture.md` already lists components, read it." It needs the component list (`## File layout` / `## Tech stack` / `## Dependencies`), a bounded set of sections.
4. **`pm-product-advocate`** at `src/agents/pm-product-advocate.body.md` — reads `docs/architecture.md` only in the `bootstrap` tier (whole-product check, runs once); per-feature tier reads `docs/product.md` + the plan + `docs/user-journeys.md` (small docs).
5. **The orchestrator** — Step 1 (`workflow/pipeline.md`) "I read the project context first: `docs/architecture.md`, `docs/user-journeys.md`, `docs/features/`", and Step 5 deployment-context enrichment reads specific named sections (`## Operational limits & budgets` + `## Architectural constraints`).
6. **`pm-architect`** (owner) at `src/agents/pm-architect.body.md` — authors the file; A4 cross-checks File-layout/Release-flow/Integration-contract against tree/CI/README. Reads/writes FULL by definition.

## The read pattern (the safe sequence a consumer follows)

A targeted consumer of a large structured doc follows this sequence; the widen step is an explicit escape hatch so nothing is structurally blocked:

1. **Index first.** Read the doc's header list — grep the `## ` / `### ` headers (or read the navigation map / section index). The consumer always sees WHAT exists before choosing what to read. This is the anti-blinding guarantee: you cannot fail to consider a section you can see in the index.
2. **Locate.** Match the task to the relevant section(s) by header title.
3. **Read just that.** Grep-to-locate the header line number, then offset-read that section.
4. **Widen when the task needs it.** Read more sections, or the whole file, whenever the task genuinely needs broad context — a cross-cutting consistency check, an ambiguity the section doesn't resolve, or any doubt about sufficiency. Widening is always permitted and is never a defect; the default is targeted, the ceiling is full.

The pattern is **instructional, not deletional**: nothing is removed from access. That keeps the change reversible and safe.

## Which docs the discipline applies to

- **Apply (large + reliably-structured):** `doc/architecture.md` — primary win (~46K tokens, ~40 `### ` records, reliable index). Also `doc/stack-notes.md` (~75 KB) when a consumer needs one component's notes.
- **Do NOT apply (small / single-purpose — targeting adds nothing):** `docs/product.md` (~8 KB), a single feature plan, a single `.ai-pm/contracts/<feature>.md`, an individual `workflow/*.md` topic file, the agent's own body. Reading these whole is already lean; index-first ceremony would only add overhead. Don't over-apply.

## Per-role read policy (the core of the safety gate)

| Role | `doc/architecture.md` | Why this is sufficient (or why FULL) |
|---|---|---|
| **`pm-architect`** (owner) | **FULL** — carve-out | Authors/refreshes its own canon and runs A4 whole-doc cross-checks. The plan's explicit owner exemption. Never targeted. |
| **`pm-auditor`** | **FULL** — recommend keep | Its dimensions are inherently cross-cutting: File-layout completeness vs the tree, threat↔constraint `SCn` wiring, System-invariants index, journey identifier-restatement. These need the whole picture; targeting would blind a consistency referee. The one role where targeted reading is genuinely risky → leave FULL. |
| **`pm-coder`** | **TARGETED** (already is) | Needs the specific constraint/convention area the plan touches. Already practices "relevant sections … in full only when …". Highest-confidence target — no behavior change, just confirmation. |
| **Orchestrator** | **TARGETED** at Step 1 + Step 5; widen freely | Step 1 needs orientation (what the project is, relevant constraints for the feature at hand); Step 5 already reads named sections (`## Operational limits & budgets` + `## Architectural constraints`). It drives the whole pipeline and can always widen mid-feature. The single biggest COUNT win (orchestrator re-reads context across turns). |
| **`pm-stack-researcher`** | **TARGETED** | Needs the component list — `## Tech stack` / `## File layout` / `## Dependencies` / `## External standards`. A bounded section set, cleanly indexable. |
| **`pm-product-advocate`** | **TARGETED** in `bootstrap` tier | Whole-product product-axis check needs `## Project` + product-bearing sections, not the 40 engineering decision records. Per-feature tier doesn't read architecture.md at all (reads small docs) → no change. |
| **`pm-plan-checker`** | **TARGETED** | Verifies plan-compliance against the constraint/contract areas the plan names; reads the project entry file's relevant sections (same shape as pm-coder). |
| **`pm-codebase-reader`** | **N/A** | Reads source code and WRITES docs (legacy draft); does not consume architecture.md as input. No change. |

**Recommended split:** target `pm-coder`, the orchestrator, `pm-stack-researcher`, `pm-product-advocate (bootstrap)`, `pm-plan-checker`. Keep FULL: `pm-architect` (owner carve-out) and **`pm-auditor`** (cross-cutting referee — the risk role).

## The sufficiency guarantee (how we know no agent is blinded)

Three independent properties combine so targeted reading cannot starve a correct decision:

1. **Index-first ⇒ nothing is invisible.** Every targeted consumer reads the header list before choosing. It always knows WHAT exists; it can never "not know" about a section — only choose, on visible evidence, that it doesn't need it now.
2. **Widen-escape ⇒ more is always reachable.** The default is targeted; the ceiling is full. Any doubt, ambiguity, or cross-cutting need resolves by reading more. The discipline lowers the default, it never lowers the ceiling — so it cannot block a decision that needs broad context.
3. **Owner + referee read FULL.** The two roles whose correctness depends on the whole document — the OWNER authoring it (`pm-architect`) and the auditor refereeing whole-doc consistency (`pm-auditor`) — are exempt. Targeting is applied only to consumers that need a specific fact.

Together: a targeted consumer either finds its fact in the relevant section (sufficient by construction — the fact lives in exactly one indexed home) or widens (sufficient by escape). The change is instructional and reversible: a regression that drops the rule restores today's full-read behavior, never a worse one.

## Where the discipline lives (single source)

Put the rule in **one neutral-prose home**, referenced by each consumer body, not restated per body:

- **Recommended home:** a named subsection in `workflow/pipeline.md` adjacent to Step 1 (the project-context read step) — e.g. a `### Targeted reading of large structured docs` rule, stating the index-first → locate → section-read → widen pattern, the apply/don't-apply doc list, and the owner+auditor FULL carve-out. Step 1 already names "read the project context first", so this is its natural single home, and the orchestrator (a primary consumer) reads pipeline.md anyway.
- **Per-agent pointer:** each targeted consumer body gains a one-line reference by name (the same `` `### X` in `workflow/<file>.md` `` convention the rest of the protocol uses), not a copy of the rule. `pm-coder` step 2 already embodies it — point it at the shared home so the two don't drift.
- **Vocabulary:** harness-neutral nouns only (per `### Harness-neutral instruction prose` in architecture.md) — "the doc's section index / navigation", not a harness-specific term. The discipline serves Claude self-host, OpenCode, and the dogfood identically.

## Golden / neutral-prose impact (no surprise)

Touching the shared agent bodies and `workflow/*.md` re-freezes the Claude `.claude/` golden (the byte-equivalence test follows the new bodies) and must pass `tests/neutral-prose.sh` — the same mechanism as neutralization slices 10–11. Expected, not a regression. The plan's new `targeted-reading-discipline-present` form check should assert the shared home states the rule and the consumer bodies point at it — catching a regression that silently drops the discipline.

## Recommendation

Single forced variant for the discipline's shape: **index-first targeted reading as the consumer default, single-homed in `workflow/pipeline.md` near Step 1, referenced per-body, with `pm-architect` (owner) and `pm-auditor` (cross-cutting referee) kept FULL.** There is no meaningful second variant for the *pattern* — index-first + widen-escape is the only design that is both leaner and provably non-blinding; a "read fixed section N always" rule would be brittle and could miss a needed section, and a "read less, no index" rule would blind agents. The genuine fork is not the pattern but the per-role FULL/TARGETED split, captured in the table and as open questions below.

Phase per the plan: ship scenario 1 (architecture.md targeting — the real win) first; scenario 3 (always-on / `AGENTS.md` redundancy trim) is smaller and can follow.

## Risks

- **Over-targeting `pm-auditor`.** Its consistency dimensions need the whole document; if it were switched to targeted it could miss a drift between sections. Mitigation: explicit FULL recommendation above. This is the single role where the WIN does not justify the RISK.
- **A consumer under-widening on a genuinely cross-cutting per-feature task.** Mitigation: the widen-escape is stated as always-permitted and never-a-defect, so the safe move is structurally available; the home prose must make widening obviously cheap to reach, not a reluctant exception.
- **Index reliability assumption.** The win rests on `doc/architecture.md`'s `### `/`## ` headers being a faithful index. They are today (~40 well-titled records). If a future doc edit buries a fact under a mismatched header, a targeted reader could miss it — but the OWNER (`pm-architect`) and `pm-auditor` (File-layout/structure checks) both read FULL and would catch the structural drift. The risk is bounded by the two FULL roles.
- **Body/home drift.** If a body restates the rule instead of referencing the single home, the two can diverge. Mitigation: per-body pointer-by-name only; the form-check test asserts presence at the home.

## Open questions (PM-gated — plan stays DRAFT, nothing approved here)

1. **Confirm the per-role split.** Endorse keeping `pm-auditor` FULL (recommended) vs accepting a leaner auditor with an explicit "widen for any consistency dimension" instruction? The note recommends FULL.
2. **Single home placement.** `workflow/pipeline.md` near Step 1 (recommended, co-located with the existing context-read step) vs a standalone `workflow/reading-discipline.md` topic file (more discoverable, one more file)?
3. **Scope of "large docs."** Apply targeting to `doc/stack-notes.md` (~75 KB) in this slice too, or architecture.md only first and stack-notes in a follow-up? The note suggests architecture.md is the clear primary; stack-notes is a smaller, also-safe add.
4. **Plan should be updated to** name the per-role FULL/TARGETED split explicitly in the "Docs to update" / scenarios, so the `targeted-reading-discipline-present` test has a concrete role list to assert against (not just "consumers read targeted").
