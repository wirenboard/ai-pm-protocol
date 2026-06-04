# pm-product-advocate — plan

*(the "user" of the protocol is the orchestrator / agents; the human in the loop is the PM)*

## Context

Anchor item of the EPIC "technical-over-product bias" (`.ai-pm/backlog.md`). The protocol
front-loads and **independently gates** the technical axis (architecture, stack-notes,
threat-model, invariants-as-`SCn`) with real referees — `pm-plan-checker`, `code-review`,
`pm-auditor`, `pm-stack-researcher`. The **product axis** (value, the zero-to-working
story, usability, scope boundary) has **zero** independent referee: the orchestrator both
*elicits* product detail from the PM and *drives* toward coding — player + referee — so an
under-specified product sails through. The downstream worked example: a messenger project
shipped five technical-substrate features with a skeletal `user-journeys.md` and a
contract-less product-map, and **nothing in the protocol raised a hand** to ask whether
that sequencing was intended.

`/pm-research` (2026-06-04, `.ai-pm/research/pm-product-advocate_research.md`) verified two
converging pillars:

- **Product practice already has a pre-build readiness discipline distinct from "done":**
  Cagan/SVPG's four risks (value / usability / feasibility / viability) must be de-risked
  *before* committing engineering capacity; Amazon Working Backwards iterates a PR/FAQ until
  there is "clarity of thought around what to build"; Shape Up treats handing builders "a
  problem without a solution" as a **defect** and requires a five-part pitch bet before
  build. All three are **forcing-functions + a human decision, never a hard veto** — exactly
  the block-but-sovereign shape wanted. *Sources: svpg.com/four-big-risks, workingbackwards.com PR-FAQ, basecamp.com/shapeup ch.6.*
- **A self-check by the orchestrator would be the weak configuration:** LLMs "cannot
  self-correct reasoning yet" without external feedback (Huang et al., DeepMind, ICLR 2024)
  and LLM judges score their own output higher than humans do — self-preference bias
  causally linked to self-recognition (Panickssery et al., NeurIPS 2024). The orchestrator
  judging its own elicitation is that biased setup. *Sources: arxiv 2310.01798, 2404.13076.*

Anti-theater caveat from the same research: an independent critic inherits its **own**
biases (position / length / format / perplexity-familiarity). The gate must therefore use a
**fixed checklist, stable ordering, criterion-by-criterion, and judge presence-of-an-answer
— never prose/vision quality** (the PM owns meaning). *Sources: arxiv 2410.21819, 2602.02219, 2602.06625.*

PM decisions (2026-06-04, via AskUserQuestion):

- **Scope of v1 = the full anchor:** the new agent + its checklist + a **per-feature
  pre-coding gate** (user-facing features) + a **`/pm-bootstrap` foundational-question
  pass** (the zero-to-working story). The adjacent backlog item "bootstrap *drafts* a
  populated `user-journeys.md`" (symmetric with the populated threat-model) stays a
  **separate** task — this feature forces the *questions* at bootstrap; auto-drafting the
  journeys from the answers is the fast-follow.
- **Reach = user-facing only** (human-role-subject test, the same extraction `pm-auditor`
  uses). Backend / infra / refactor / docs-only / trivial-fixup / diagnostic-probe stay
  **un-gated** — research and the epic both warn a blanket gate becomes the
  Definition-of-Ready anti-pattern that strangles legitimate substrate work.

## Key design decisions

(settled by research + the epic; recorded here so the coder/reviewer do not re-litigate)

1. **New agent, not a fold-in.** Independence beats self-check; the advocate is
   player-referee-**incompatible** with `pm-architect` (which *writes* `product.md`/journeys)
   and with `pm-plan-checker` (which runs *post*-coding with a compliance, not advocacy,
   stance). This is the product-axis twin of `code-review` on the technical axis.
2. **The advocate never talks to the PM directly.** It *generates* the foundational
   questions and a gap verdict; the **orchestrator relays** the unanswered ones in **one**
   `AskUserQuestion` pass. Preserves the "only the orchestrator talks to the PM" invariant.
3. **Block-but-sovereign.** "Block" = the coder handoff is held until each foundational gap
   is **answered** or **consciously descoped with a recorded rationale**. Never a permanent
   veto (Shape Up bet / dismissible-blocking-review / risk-acceptance precedent).
4. **Self-preference bias is structurally sidestepped, not just mitigated.** The advocate's
   output goes to the **human PM** (via `AskUserQuestion`), not back to the orchestrator to
   be scored — the final arbiter is the human, so the player-as-judge failure mode does not
   apply to the *decision*. The advocate inheriting the session model is therefore
   acceptable; independence comes from a **separate role / context / prompt / fixed rubric**,
   the primary lever the research identifies. (A *different underlying model* "would suppress
   further" but is inconsistent with every other `pm-*` agent inheriting the session model;
   accepted residual.)
5. **Single critic for v1, not a debate panel.** A debate / critic+judge panel is plausible
   future robustness but overkill for a non-technical PM's flow; deferred (Out of scope).
6. **Fixed checklist, presence-not-quality.** The advocate matches each plan/contract/journey
   against a **fixed** foundational-question set in stable order and reports only the
   questions with **no recorded answer**. It never judges whether the answer is *good* —
   that is the PM's call. Same "shape, not meaning" discipline as the structural-token-lint
   and `pm-auditor`'s no-prose-policing rule.
7. **Soft enforcement + load-bearing backstop, no `PreToolUse` hook.** "Is this feature
   user-facing / is the product under-specified" is a semantic judgement a regex guard
   cannot make — consistent with the threat-model and blast-radius decisions to enforce by
   prose + a downstream gate, not a hook. Primary enforcement: the `/pm-plan` step that runs
   the advocate before handoff. Load-bearing backstop (so a skip does not degrade silently,
   the review-stamp lesson): `pm-plan-checker` DoD blocks a user-facing feature whose
   advocate gate is unresolved, and `pm-auditor` blocks a user-facing feature missing a
   resolved advocate artifact.
8. **Single-source checklist.** The foundational-question set lives **once** as a named
   subsection `### Foundational product questions` in `WORKFLOW.md` and is referenced **by
   name** from `pm-product-advocate`, `/pm-plan`, and `/pm-bootstrap` — the exact
   single-source-of-conditions pattern already used by `### Security-relevant surfaces` and
   `### Pending-migration detection in MIGRATIONS.md`. Never re-encoded.

## Scenarios

1. **Per-feature gate fires on user-facing plans.** When the PM approves a plan whose
   Scenarios have a **human-role subject** (integrator / operator / user / admin / … — the
   `pm-auditor` extraction), the orchestrator — before the coder handoff — spawns
   `pm-product-advocate` with the approved plan, the draft/existing contract, `product.md`,
   and `user-journeys.md`. The advocate returns the per-feature foundational-question gaps:
   only questions with **no recorded answer** in those artifacts.
2. **Gaps are relayed in one pass; the PM resolves each.** If the advocate returns gaps, the
   orchestrator relays them to the PM in **one** `AskUserQuestion` pass. For each gap the PM
   either **answers** it or **consciously descopes** it with a recorded rationale. The coder
   handoff stays **blocked** until every gap is answered or descoped — never a silent skip,
   never a permanent veto.
3. **A complete plan is a silent pass.** When every per-feature foundational question is
   already answered in the plan / contract / journeys, the advocate returns **zero gaps**;
   the gate passes silently — no `AskUserQuestion`, no ceremony. (The Cagan "per-idea, fires
   only on actual gaps" anti-ceremony mechanism.)
4. **Non-user-facing changes are un-gated.** For a feature whose every Scenario subject is
   non-human (the system / package / service / process / file), and for `/pm-fixup`,
   docs-only, and PM-authorized diagnostic probes, the gate **does not run at all** — silent,
   no advocate spawn, no artifact required.
5. **Bootstrap foundational-question pass.** At `/pm-bootstrap`, after the product Q&A and
   before the project is treated as ready for its first feature, the orchestrator runs the
   advocate's **bootstrap tier** of the checklist — the zero-to-working story (discovery /
   onboarding / invite / recovery & key-loss / device-change / "why this, not the
   incumbent") plus viability (who runs / funds it). Gaps are relayed in one
   `AskUserQuestion` pass; the PM answers or descopes; resolutions are recorded into the
   bootstrap product docs by their owners. (This feature forces the *questions*; auto-drafting
   a populated `user-journeys.md` from the answers is the separate fast-follow item.)
6. **The advocate generates, the orchestrator relays, the human decides.** The advocate
   **never** addresses the PM directly and **never** judges prose quality — it writes its gap
   analysis + verdict to its own report artifact; the orchestrator owns relaying the
   questions and recording the PM's answers/descopes (the output of a conversation it drives).
7. **Load-bearing, not by-discipline.** A user-facing feature that reaches `pm-plan-checker`
   with an **unresolved or absent** advocate gate is **blocking** (a new DoD item);
   `pm-auditor` treats a merged user-facing feature with no resolved advocate artifact as
   **blocking** (artifact-completeness backstop). A non-user-facing feature is exempt from
   both with no special-casing — the same human-role-subject extraction decides.

## Existing behaviors this feature touches

(what must not break)

- **`/pm-plan` handoff flow** — for a non-user-facing feature the flow is unchanged (no
  advocate, no new step). For a user-facing feature the only addition is the gate between
  plan-approval and coder handoff.
- **"Only the orchestrator talks to the PM" invariant** — preserved; the advocate's
  questions reach the PM solely via the orchestrator's `AskUserQuestion`.
- **AskUserQuestion convention** (`WORKFLOW.md` — substantive forks via the tool, one pass,
  simple confirms stay prose) — the gate uses **one** structured pass; it must not become
  per-question tool-spam.
- **`/pm-fixup` trivial fast path** — must NOT trigger the gate (trivial, no plan, no
  human-role gating step reached).
- **`pm-plan-checker` Definition of Done** — gains exactly one item; the existing 9 are
  unchanged.
- **`pm-auditor` artifact-completeness (dimension 1)** — gains one user-facing-only check;
  the human-role-subject extraction it already performs is reused, not duplicated.
- **`/pm-bootstrap` product Q&A** — the advocate pass runs **after** it, additively; the
  existing bootstrap steps are unchanged.
- **`tests/hooks.sh`** — stays green; this feature adds no hook.
- **Application-agnostic constraint** — the checklist must use cross-domain language
  (onboarding / discovery / recovery), never a domain-specific example baked in as vocabulary.

## Contracts

(protocol-internal interfaces — this repo has no user-facing Product Contracts, the
documented exception in `doc/architecture.md`)

- **`pm-product-advocate` I/O.** Input: the approved plan + contract (if any) + `product.md`
  + `user-journeys.md` + the checklist **tier** (`per-feature` | `bootstrap`). Output: a gap
  report — the foundational questions (from the named checklist, in fixed order) that have
  **no recorded answer** in the inputs — plus a verdict (`gaps: N` blocking vs `clean`). It
  writes the report and never edits any other artifact.
- **`### Foundational product questions` in `WORKFLOW.md`.** The single-source checklist, two
  tiers (`per-feature`, `bootstrap`), referenced by name; never re-encoded elsewhere.
- **Advocate report artifact** at `.ai-pm/reviews/<topic>_advocate.md` (per-feature) /
  `.ai-pm/reviews/bootstrap_advocate.md` (bootstrap): the advocate-owned gap analysis +
  verdict; the orchestrator appends the recorded PM resolutions (answer / descope-with-
  rationale) below the verdict — the same owner-split pattern as the Pass-2 code-review trail
  in `<topic>_review.md`. **Greppable verdict token** (the review-stamp lesson — a positive
  presence signal, never an absence that reads as "passed"): the advocate writes the verdict
  as a fixed token — `gaps: N` (N ≥ 1, blocking until resolved) or `clean` (zero gaps, silent
  pass) — through `## Verdict`; each gap is a **stably-numbered** list item. The orchestrator
  owns a `## Resolutions` trail below the verdict with one **numbered** entry per gap (the
  PM's answer / descope-with-rationale). **Three mechanically-distinguishable states:**
  *absent* (no file), *unresolved* (`gaps: N` with fewer than N entries under
  `## Resolutions`), *resolved* (`gaps: N` with N resolutions **or** `clean`). A `clean`
  verdict needs **no** `## Resolutions` trail — `clean` and `gaps: N`-with-N-resolutions are
  the two resolved states; the DoD/auditor wording must treat both as resolved so a clean
  pass is never mis-flagged. (Arch note §3.)
- **`pm-plan-checker` DoD item** (user-facing only): "Product-readiness gate resolved —
  advocate artifact present and every foundational gap answered or descoped."
- **`pm-auditor` dimension-1 check** (user-facing only): a merged user-facing feature must
  have a resolved advocate artifact; unresolved/absent → blocking.

## Stack expectations touched

- **Markdown frontmatter (YAML in Claude Code agent files)**: the new
  `.claude/agents/pm-product-advocate.md` must open with valid YAML frontmatter. "Only `name`
  and `description` are required." `name`: "Unique identifier using lowercase letters and
  hyphens." `model` defaults to `inherit` — omit it (every `pm-*` agent inherits the session
  model). A `tools:` field constrains the agent to read-only + report-write (`Read, Grep,
  Glob, Bash, Write`) — the same explicit-tools discipline the other read-only referees use.
  Source: <https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields>;
  `doc/stack-notes.md` § "Markdown frontmatter (YAML in Claude Code agent files)".

No other stack component is touched: no hook (`.claude/settings.json` unchanged — soft
enforcement by design, decision 7), no `jq`, no `gh`, no GitHub Actions, no `git` workflow
change.

## Interaction scenarios

This is a protocol-spec / agent-prompt change — **no runtime, no shared mutable state, no
concurrency**. The relevant interactions are with adjacent **protocol mechanisms** that read
the new artifact or share the pipeline:

- When `/pm-fixup` runs (trivial path, no `/pm-plan`): the gate is never reached — verify the
  gate is anchored in `/pm-plan` + the human-role-subject test, so a fixup cannot trip it.
- When a **backend/infra** feature flows through `/pm-plan` (all Scenario subjects
  non-human): the advocate is not spawned and no advocate artifact is required by
  `pm-plan-checker` or `pm-auditor` — silent, exempt by the same extraction.
- When a user-facing feature reaches `pm-plan-checker` with the advocate artifact **absent or
  unresolved** (gate skipped): DoD fails → `request-changes` (the load-bearing backstop).
- When `pm-auditor` sweeps a merged **user-facing** feature with no resolved advocate
  artifact: blocking; a **non-user-facing** feature with no advocate artifact: clean (not
  flagged).
- When the advocate returns **zero gaps**: the orchestrator records a resolved (clean)
  artifact and proceeds — no `AskUserQuestion` fired (silent-pass interaction with the
  AskUserQuestion-no-spam rule).

## Test plan

- **Existing tests that must pass:** `tests/hooks.sh` (currently green) — unaffected by a
  prose / agent-prompt change with no new hook; run to confirm it stays green.
- **New executable tests:** none — per the repo's "no automated tests by design" constraint
  (`doc/architecture.md` § Architectural constraints), validation is **by use** plus
  editorial review. The meta-infrastructure test exception covers hook regexes only; this
  feature adds no hook.
- **Editorial verification** (`pm-plan-checker` + `code-review` read the diff against this
  plan and confirm all 7 scenarios are realized), specifically that:
  - the gate is keyed on the **human-role-subject extraction** (reusing `pm-auditor`'s rule),
    so backend / fixup / docs / probe are exempt **without** feature-category special-casing;
  - the advocate **never** addresses the PM and **never** scores prose — it emits a
    fixed-order, presence-only gap list (decisions 2, 6);
  - the checklist lives **once** in `WORKFLOW.md` `### Foundational product questions` and is
    referenced by name from the advocate, `/pm-plan`, `/pm-bootstrap` — no re-encoding
    (decision 8, the single-source convention);
  - the block is **overridable** — answer **or** descope-with-rationale, never a permanent
    veto (decision 3);
  - enforcement is soft + backstopped: `/pm-plan` runs the gate, `pm-plan-checker` DoD blocks
    an unresolved gate, `pm-auditor` blocks a missing artifact — **no new hook** in
    `.claude/settings.json` (decision 7);
  - the bootstrap tier forces the zero-to-working questions but does **not** auto-draft
    `user-journeys.md` (the separate fast-follow item).
- **Mandatory-table classification:** mechanically a protocol/agent-prompt change with no
  Product Contract and no executable tests, but it encodes substantive protocol behaviour;
  scenario coverage is verified editorially, matching the `review-stamp-gate` precedent.

## Docs to update

- `doc/architecture.md` — add a new `### …` architectural decision recording: the
  `pm-product-advocate` agent (product-axis independent referee, the `code-review` twin), the
  per-feature pre-coding gate + bootstrap pass, the soft-enforcement + load-bearing-backstop
  shape (no hook), the single-source `### Foundational product questions` home, and the
  block-but-sovereign mechanism. Also add the agent to the roster references where the other
  six are enumerated (§ Project, § File layout). Owner: `pm-architect` — spawned after
  `pm-coder` finishes (standard `/pm-plan` post-coding handoff).
- `WORKFLOW.md` — (a) add `pm-product-advocate` to the **Agents** roster table; (b) add the
  gate as **Step 3.5 — product-readiness gate** in "How I work", between Step 3 (architecture
  decision) and Step 4 (coder), user-facing only, plus the bootstrap-pass note; (c) add the
  `### Foundational product questions` single-source subsection (two tiers — see arch note §2
  for the drop-in body); (d) add the gate row context to "What is mandatory when" (user-facing
  row gains the product-readiness gate; other rows explicitly exempt by the human-role-subject
  extraction); (e) **extend the Edit-ownership rule with a SECOND carve-out** for
  `.ai-pm/reviews/<topic>_advocate.md` / `bootstrap_advocate.md` (advocate owns through
  `## Verdict`; orchestrator owns ONLY the `## Resolutions` trail below — output of the one
  `AskUserQuestion` pass it drives; made safe by the DoD + auditor gate, not by discipline),
  worded by direct analogy to the existing code-review-trail carve-out, AND add
  `<topic>_advocate.md through ## Verdict, owned by pm-product-advocate` to the agent-owned-
  artefact list so the boundary is explicit on both sides (arch note §3). *These are the
  feature's own protocol-mechanism edits — `pm-coder` implements them, like the agent file and
  command edits.*
- `.claude/commands/pm-plan.md` — add the product-readiness gate step (run the advocate after
  PM approves a user-facing plan, relay gaps in one `AskUserQuestion` pass, record
  resolutions, block handoff until resolved); reference `### Foundational product questions`
  by name. *Implemented by `pm-coder`.*
- `.claude/commands/pm-bootstrap.md` — add the foundational-question pass after the product
  Q&A; reference the bootstrap tier of `### Foundational product questions` by name.
  *Implemented by `pm-coder`.*
- `.claude/agents/pm-plan-checker.md` — add the user-facing-only DoD item. *Implemented by
  `pm-coder`.*
- `.claude/agents/pm-auditor.md` — add the user-facing-only artifact-completeness check
  (dimension 1), reusing the existing human-role-subject extraction. *Implemented by
  `pm-coder`.*
- `README.md` — consider: the Russian capability/agent listing (`## Что гарантирует` /
  agent roster) should mention the new product-axis referee. Dogfoods the README-currency gap
  recorded in `.ai-pm/backlog.md` (the protocol's own README is currently self-exempt). Keep
  it a one-line capability mention, not a duplicate of the mechanism.

## Out of scope

- **Bootstrap auto-drafts a populated `user-journeys.md`** from the advocate's bootstrap
  answers (symmetric with the populated threat-model) — the adjacent epic item; this feature
  forces the *questions* only. Separate `/pm-plan`.
- **"Product story fell behind" auditor note** (soft `pm-auditor` nudge after N substrate
  features with skeletal journeys) — separate epic item.
- **Cross-document consistency auditor** (single-source drift, temporal-status conflation,
  ADR↔stack-notes backing, state-machine↔journeys, journeys↔threat-model UX) — separate epic
  item.
- **Debate / multi-critic or critic+judge panel** — v1 is a single independent critic
  (decision 5); a panel is deferred future robustness.
- **A different underlying model for the advocate** — inherits the session model like every
  `pm-*` agent (decision 4); revisiting model isolation is deferred.
- **A `PreToolUse` hook enforcing the gate** — deliberately none (decision 7); semantic
  judgement a regex cannot make, enforced by prose + downstream gate.
- **Sibling change-types of the categorical "user-facing feature" choice** — the gate covers
  **user-facing** only; each sibling is excluded with its reason:
  - **Backend refactor / infrastructure / build / CI** — no human-role scenario subject; a
    product gate would be the DoR anti-pattern strangling substrate work.
  - **Docs-only fix** — no product surface to de-risk.
  - **Trivial fixup (`/pm-fixup`)** — skips `/pm-plan` entirely; the gate is never reached.
  - **Diagnostic probe / spike** — throwaway, runtime-only, reverted; no product to gate.
