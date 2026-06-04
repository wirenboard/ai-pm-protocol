# legacy-reader-role-split — plan

*(the "user" of the protocol is the orchestrator / agents; the human in the loop is the PM)*

## Context

`pm-legacy-reader` carries **two unrelated roles** and its name describes only the first:

- **Role 1 — legacy-code reader.** At `/pm-bootstrap` legacy-full mode it reads an existing
  codebase and writes **raw drafts** of `docs/architecture.md`, `docs/user-journeys.md`, and
  optional `ui-guide.md` / `threat-model.md` / draft contracts. The name fits.
- **Role 2 — standing owner of `docs/user-journeys.md`** across the whole project lifecycle,
  all project types (not just legacy): per-feature "Docs to update" journey updates
  (`pm-plan.md:58`, `WORKFLOW.md:128`), `[?]`/gap-fill (`pm-plan.md:45`), "spawned standalone
  when `docs/user-journeys.md` has gaps" (`WORKFLOW.md:17`), stale-journeys remediation
  (`pm-audit.md:83`). This has nothing to do with "legacy." The name does **not** fit.

The protocol **already** has the resolving pattern: for `docs/architecture.md` and
`docs/threat-model.md`, `pm-legacy-reader` produces a *raw draft* and **`pm-architect` owns and
finalizes** it (`pm-bootstrap.md:191`; `pm-architect.md:52,97`; established in commit `ee99c10`
"pm-legacy-reader drafts, pm-architect owns architecture.md"). `docs/user-journeys.md` is the
**only** doc where this pattern breaks — there `pm-legacy-reader` is treated as the *owner*
rather than a raw-drafter.

PM decision 2026-06-04: do this split **before** the parked `bootstrap-populated-journeys`
feature (`doc/features/bootstrap-populated-journeys_plan.md`), so bootstrap journeys land on the
correct owner with no two-writer drift. (That parked plan references `pm-legacy-reader` as the
ongoing journeys updater and will be revised after this lands.)

## Key design decisions

1. **Move Role 2 to `pm-architect` AND rename the agent `pm-legacy-reader` →
   `pm-codebase-reader`** (PM decisions 2026-06-04, via AskUserQuestion). Two coupled moves:
   - **Ownership.** Make `pm-architect` the **owner** of `docs/user-journeys.md` — it already
     owns the sibling PM-facing/technical docs (`architecture.md`, `product.md`,
     `threat-model.md`) and the `## Behavioral contract` that journeys reference move-not-copy,
     and it already finalizes the reader's other drafts. The reader shrinks to a **pure
     raw-drafter** (Role 1 only).
   - **Rename.** `pm-legacy-reader` → **`pm-codebase-reader`**. After Role 2 leaves, the agent
     only reads an *existing codebase* at bootstrap and writes raw doc drafts; "codebase-reader"
     is neutral (the code may be modern, just pre-existing — "legacy" mis-narrows) and "reader"
     names its defining safety property (read-only on **code**; it still *writes* doc drafts).
   Consequences of the rename:
   - **All `subagent_type: "pm-legacy-reader"` sites + the agent filename + the frontmatter
     `name:` must change together.** Reference-completeness is the load-bearing check (a missed
     `subagent_type` is a dangling spawn). All sites are **in this repo** (command roster
     tables, prose, WORKFLOW.md, architecture.md) — enumerated under "Docs to update".
   - **Still no `MIGRATIONS.md` entry.** Downstream `.claude/agents/` is a symlink into the
     submodule and the agent is spawned only by the (also-submodule) command files via
     `subagent_type`; no downstream file names the agent by hand. A submodule bump propagates
     the new name transparently. (Reference-completeness within the repo is what guarantees this
     — hence the grep check in the Test plan.)
   - **No `.claude/settings.json` change.** The `PreToolUse` deny-list names only `wb-*` role
     duplicators, never the reader/architect roles (verified).
   - **Historical artifacts keep the old name.** `CHANGELOG.md`, past `doc/features/*_plan.md`,
     `.ai-pm/reviews|arch|audits|state/archive/*` are records of what happened — they are **not**
     rewritten. Only the live protocol surface is renamed.
   - **Rename and content-edit are separate commits** (the repo's git convention: a `git mv`
     commit, then the content/scope edits).
   **Alternative considered:** a new dedicated `pm-journeys` agent (Role 2 as its own agent).
   Rejected — it adds an agent for a role `pm-architect` already structurally fits (it owns every
   adjacent doc). The arch review confirms architect-consolidation vs new-agent before coding.
2. **`pm-legacy-reader` keeps drafting `docs/user-journeys.md` at bootstrap legacy-full** — that
   is Role 1 (reading code). What changes is the **finalize handoff**: `pm-architect` now
   finalizes the user-journeys draft too (parallel to how it already finalizes the architecture
   and threat-model drafts), so the journeys draft is finalized by its owner, not left as the
   reader's output.
3. **`pm-legacy-reader`'s standalone invocation narrows** to code re-reading at bootstrap
   validation ("re-read module X, PM says the docs are wrong"). The per-feature / gap-fill
   journey-authoring standalone role moves to `pm-architect`.
4. **Move-not-copy journeys-format rules travel with the ownership.** The human-language steps +
   identifiers-referenced-not-restated rule (already in `user-journeys.md.tmpl` and
   `pm-legacy-reader.md:70`) must be present in `pm-architect`'s journeys-authoring instructions
   so the format discipline is not lost in the move.
5. **No behavior change to the journeys themselves** — same format, same template, same
   move-not-copy discipline; only *which agent authors/owns* them changes. Existing
   `docs/user-journeys.md` files are untouched by this protocol change.

## Scenarios

*(scenario subjects are agents / the orchestrator / the bootstrap process — non-human; this is a
protocol-mechanism change, exempt from the product-readiness gate by the human-role-subject
extraction, like the `pm-product-advocate` and `bootstrap-populated-journeys` features)*

1. **`pm-architect` owns `docs/user-journeys.md`.** Per-feature "Docs to update" journey changes,
   `[?]`/gap-fill, standalone-when-gaps, and stale-journeys remediation all spawn `pm-architect`
   — the same owner that already handles `docs/architecture.md`.
2. **`pm-codebase-reader` is a pure existing-codebase raw-drafter.** It is spawned only at
   `/pm-bootstrap` legacy-full (and for bootstrap-validation code re-reads); it still drafts
   `architecture.md` + `user-journeys.md` (+ optional docs) from code, but each draft is
   finalized by `pm-architect`.
3. **Bootstrap legacy-full finalizes the journeys draft too.** In the same `pm-architect`
   finalize spawn that already finalizes the architecture (and threat-model) draft, the
   `user-journeys.md` draft is finalized to canonical form — the draft stays the source of truth
   for facts, architect structures it.
4. **Every agent reference is consistent under the rename.** No reference points
   `user-journeys.md` ownership at the reader after this change; **no `subagent_type` is dangling**
   — every `"pm-legacy-reader"` spawn target, the agent filename, and the frontmatter `name:` are
   updated to `pm-codebase-reader`; the roster, edit-ownership list, and architecture decision all
   describe the renamed, narrowed agent. Historical artifacts (CHANGELOG, past plans/reviews)
   keep the old name.
5. **Journeys format discipline is preserved.** `pm-architect`'s journeys authoring obeys the
   human-language + identifiers-referenced (move-not-copy to `## Behavioral contract`) rule, the
   same rule the template and the former owner carried.
6. **Downstream is unaffected with no migration.** The agent is named only via `subagent_type`
   in the (submodule) command files and spawned by the orchestrator; no downstream file names it
   by hand. A submodule bump picks up the renamed agent + new behavior transparently — no
   `MIGRATIONS.md` entry, provided every in-repo reference is updated (the reference-completeness
   check).

## Existing behaviors this feature touches

(what must not break)

- **`docs/architecture.md` / `docs/threat-model.md` drafts-vs-owns pattern** — unchanged; this
  feature extends the *same* pattern to `user-journeys.md`, it does not alter the existing two.
- **`pm-architect`'s current ownership** (architecture.md, product.md, threat-model.md,
  behavioral contract) — unchanged; journeys ownership is added alongside.
- **`pm-legacy-reader`'s bootstrap legacy-full extraction depth** (the schema/logic/journey
  depth table, the contract-drafting budget rule) — unchanged; only the finalize-handoff and the
  standalone-scope wording change.
- **Per-feature journey-update path** (`/pm-plan` "Docs to update" → owner) — still fires; the
  spawn target changes from `pm-legacy-reader` to `pm-architect`.
- **The `/pm-plan` doc-gap-fill step** (`pm-plan.md:45`) — still fires; target changes to
  `pm-architect`.
- **`pm-stack-researcher`'s "after pm-legacy-reader enumerates components" trigger**
  (`pm-stack-researcher.md:14`) — unchanged (legacy-reader still enumerates at bootstrap).
- **`tests/hooks.sh`** — stays green; no hook touched (`.claude/settings.json` unchanged).
- **The parked `bootstrap-populated-journeys` plan** — will be revised after this lands to point
  journeys authoring at `pm-architect`; not part of this feature.

## Contracts

(protocol-internal — this repo has no user-facing Product Contracts, the documented exception)

- **`docs/user-journeys.md` owner = `pm-architect`.** All authoring/finalize/gap-fill/update of
  this file routes to `pm-architect`. Recorded in the `WORKFLOW.md` edit-ownership
  agent-owned-artefact list (the owner annotation for `user-journeys.md` moves to `pm-architect`).
- **`pm-codebase-reader` (renamed from `pm-legacy-reader`) scope = bootstrap legacy-full raw
  extraction + bootstrap-validation code re-read.** No standing doc ownership. The
  `subagent_type` token is `pm-codebase-reader` everywhere after this change.
- **Finalize handoff extended.** `pm-architect`'s legacy-finalization spawn finalizes the
  `user-journeys.md` draft in addition to `architecture.md` and `threat-model.md`.

## Stack expectations touched

None. No new agent file, no frontmatter field change beyond editing two agents' `description`
prose, no library, hook, schema, or external artefact. The change is agent-prompt prose
(`pm-architect.md`, `pm-legacy-reader.md`), command prose (`pm-plan.md`, `pm-bootstrap.md`,
`pm-audit.md`), `WORKFLOW.md`, and `doc/architecture.md`. No `docs/stack-notes.md` component is
touched, so no stack-spec test applies. (The `Markdown frontmatter` component is touched only in
the sense of editing the `description:` text of two existing agents — names and `tools:` are
unchanged; no structural frontmatter change.)

## Interaction scenarios

Protocol-spec / agent-prompt change — **no runtime, no shared mutable state, no concurrency**.
The relevant interactions are reference-consistency across the protocol surface:

- When `/pm-plan` hits a `user-journeys.md` gap or "Docs to update" entry: it must spawn
  `pm-architect` (not the reader) — verify both sites (`pm-plan.md:45,58`).
- When the orchestrator spawns the renamed agent anywhere: the `subagent_type` is
  `pm-codebase-reader` and the file `.claude/agents/pm-codebase-reader.md` exists with matching
  frontmatter `name:` — a stale `"pm-legacy-reader"` `subagent_type` would be a dangling spawn.
- When `/pm-bootstrap` legacy-full runs: `pm-codebase-reader` drafts journeys, then the
  `pm-architect` finalize spawn finalizes them — verify the handoff at `pm-bootstrap.md:191`
  names the journeys draft alongside architecture/threat-model.
- When `/pm-audit` finds stale journeys: remediation spawns `pm-architect` (verify
  `pm-audit.md:83`).
- When `pm-coder` reads the doc-ownership list (`pm-coder.md:50`): the list must reflect
  `user-journeys.md` → `pm-architect` and the renamed reader.
- When the orchestrator reads the `WORKFLOW.md` roster (line 17) / edit-ownership list (line 36)
  / Step-4 handoff (line 128): all three describe the renamed, narrowed `pm-codebase-reader` and
  the `pm-architect` journeys ownership consistently.

## Test plan

- **Existing tests that must pass:** `tests/hooks.sh` (green) — unaffected by a prose change with
  no hook touched; run to confirm.
- **New executable tests:** none — repo "no automated tests by design" constraint
  (`doc/architecture.md` § Architectural constraints); validation by use + editorial review (the
  `pm-product-advocate` / `review-stamp-gate` precedent).
- **Editorial verification** (`pm-plan-checker` + `code-review` read the diff against this plan),
  confirming:
  - **reference completeness (the load-bearing check)** — `grep -rn "pm-legacy-reader"` across
    the **live** surface (`.claude/`, `WORKFLOW.md`, `doc/architecture.md`,
    `doc/protocol-vs-builtins-analysis.md`, `README.md`, `.ai-pm/backlog.md`) returns **zero**
    hits; every former site now reads `pm-codebase-reader`; the agent file is renamed and its
    frontmatter `name:` matches; no `subagent_type` is dangling. Historical artifacts
    (`CHANGELOG.md`, `doc/features/*_plan.md`, `.ai-pm/reviews|arch|audits|state/archive`) **keep**
    the old name and must NOT be rewritten;
  - every site that formerly assigned `user-journeys.md` ownership/authoring to the reader now
    points to `pm-architect`;
  - `pm-architect` declares `docs/user-journeys.md` ownership (description + body) and carries
    the human-language + move-not-copy journeys-format rule;
  - `pm-codebase-reader` description/body reflect the narrowed scope (raw-drafter only; architect
    finalizes its journeys draft too) and the standalone role is code-re-read only;
  - the bootstrap legacy-full finalize handoff (`pm-bootstrap.md:191`) finalizes the journeys
    draft alongside architecture/threat-model;
  - **no `MIGRATIONS.md` entry and no `.claude/settings.json` change** — verify neither is
    touched (downstream is reached via the submodule symlink + `subagent_type`, so the rename
    needs no migration provided reference-completeness holds);
  - the rename (`git mv`) and the content/scope edits are **separate commits**;
  - `doc/architecture.md` records the rename + ownership decision (post-coding, `pm-architect`).
- **Mandatory-table classification:** protocol/agent-prompt change, no Product Contract, no
  executable tests; scenario coverage verified editorially.

## Docs to update

**A. The rename (`git mv` + frontmatter `name:`) — a SEPARATE first commit** (`pm-coder`):

- `git mv .claude/agents/pm-legacy-reader.md .claude/agents/pm-codebase-reader.md`, then set the
  frontmatter `name: pm-codebase-reader`. This commit is rename-only (no content change beyond the
  `name:` line) so the diff reads as a pure rename.

**B. Every `subagent_type` / prose reference → `pm-codebase-reader`** (second commit, `pm-coder`):

- `.claude/commands/pm-plan.md` — roster table (line 12) `subagent_type`; **plus** lines 45 + 58:
  `user-journeys.md` gap-fill and "Docs to update" owner → `pm-architect` (these two stop naming
  the reader at all — journeys are architect's now).
- `.claude/commands/pm-bootstrap.md` — roster table (line 13) `subagent_type`; line 185 (the
  legacy-full reader spawn) → `pm-codebase-reader`; line 191 — the `pm-architect` finalize spawn
  also finalizes the `user-journeys.md` draft (alongside architecture/threat-model); line 211
  (code re-read) → `pm-codebase-reader`.
- `.claude/commands/pm-audit.md` — roster table (line 34) `subagent_type`; line 83: stale
  `user-journeys.md` remediation → `pm-architect`, and the reader reference → `pm-codebase-reader`
  where it remains (architecture/code re-read).
- `WORKFLOW.md` — line 17 roster row (rename + narrowed description: bootstrap existing-codebase
  raw-drafter only); line 36 edit-ownership agent-owned-artefact list (`user-journeys.md` owner →
  `pm-architect`; the agent-name list entry → `pm-codebase-reader`); line 128 Step-4 handoff
  (`user-journeys.md` → `pm-architect`).
- `.claude/agents/pm-coder.md` — line 50 doc-ownership list: `user-journeys.md` → `pm-architect`;
  rename the reader reference.
- `.claude/agents/pm-stack-researcher.md` — line 14: "after `pm-codebase-reader` enumerates
  components".
- `doc/protocol-vs-builtins-analysis.md` — line 88 table row: rename + update the scope cell.
- `README.md` — line 222 roster diagram: rename to `pm-codebase-reader` (no count change — no
  agent added/removed).
- `.ai-pm/backlog.md` — line 179 (a deferred item listing "writing agents"): rename the mention
  for accuracy (the renamed agent still drafts docs).

**C. Scope/ownership content edits** (second commit, `pm-coder`):

- `.claude/agents/pm-architect.md` — add `docs/user-journeys.md` to owned docs: description +
  body (per-feature updates, gap-fill, standalone-when-gaps, stale-journeys remediation, and
  finalize the `pm-codebase-reader` journeys draft at bootstrap legacy-full); include the journeys
  human-language + identifiers-referenced (move-not-copy) format rule. Also rename the
  reader references in its legacy-finalization prose (lines 28, 52, 54, 58, 97).
- `.claude/agents/pm-codebase-reader.md` (the renamed file) — narrow scope: description says
  `pm-architect` finalizes its `architecture.md` **and** `user-journeys.md` (and threat-model)
  drafts; narrow the standalone invocation to bootstrap-validation code re-reads (drop the
  standing journeys-update role).

**D. Architecture decision — POST-coding, `pm-architect`** (orchestrator handoff):

- `doc/architecture.md` — § Project agent list (line 11) and § File layout (line 181) rename;
  update the `### pm-auditor / pm-stack-researcher / pm-legacy-reader as read-only subagents`
  decision (heading + body, lines 56-58) to record the rename + the journeys-ownership
  consolidation under `pm-architect` (extending the existing drafts-vs-owns pattern from
  architecture to journeys). Owner: `pm-architect` — spawned post-coding (standard handoff).

## Out of scope

- **A new `pm-journeys` agent** — the rejected alternative (architect already fits); revisited
  only if the arch review overturns the recommendation.
- **Rewriting historical artifacts** — `CHANGELOG.md`, past `doc/features/*_plan.md`, and
  `.ai-pm/reviews|arch|audits|state/archive/*` keep the old `pm-legacy-reader` name as records;
  only the live protocol surface is renamed.
- **The `bootstrap-populated-journeys` feature** — parked; resumes after this lands, revised to
  point journeys authoring at `pm-architect`.
- **Changing journeys content/format/template** — `user-journeys.md.tmpl` and the journeys format
  are unchanged; only ownership moves.
- **`.claude/settings.json` deny-list / `MIGRATIONS.md`** — deliberately untouched (the re-scope,
  not a rename, makes both unnecessary).
- **Sibling elements of categorical choices:**
  - **The two roles** — the plan handles the **full set** (Role 1 stays with `pm-legacy-reader`,
    Role 2 moves to `pm-architect`); neither is left ambiguous.
  - **The docs `pm-legacy-reader` drafts** — `architecture.md` and `threat-model.md` ownership are
    **already** with `pm-architect` and are out of scope here (unchanged); only `user-journeys.md`
    ownership moves, completing the pattern.
