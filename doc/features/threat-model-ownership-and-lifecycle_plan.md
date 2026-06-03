# threat-model-ownership-and-lifecycle — plan

## Context

`docs/threat-model.md` is scaffold-and-forget. Bootstrap creates a skeleton from
`doc/_templates/threat-model.md.tmpl` only if Q7 mentioned security
(`pm-bootstrap.md:77`; `pm-legacy-reader.md:83-85` for legacy-full). After that: no
owner agent, no pipeline step fills or updates it, `pm-auditor` has zero coverage (an
empty/stale threat-model is never flagged), and `pm-plan` / `pm-coder` /
`pm-plan-checker` never reference it. Security implementation rules live separately in
`architecture.md § Security constraints` (owned by `pm-architect`) with no wiring to
the threat model.

Real downstream pain: a security-critical project whose whole premise is "the server
is untrusted" had `threat-model.md` scaffolded but left an empty skeleton, while
threat-driven decisions piled up unconsolidated in `architecture.md` (decisions
#2/#9/#10/#11), plans, and backlog.

PM decisions (2026-06-04): **full lifecycle** (owner + bootstrap-draft + per-feature
update + audit + plan-checker gate), gated on **security-bearing projects only**
(non-security projects are unaffected).

## Scenarios

*(the "user" of the protocol is the orchestrator / agents)*

1. At bootstrap of a **security-bearing project** (Q7 mentioned security, or legacy
   code has security artifacts), the protocol **drafts a populated** `threat-model.md`
   from the security Q&A (assets, adversaries, the obvious threats, the
   "what we explicitly do NOT protect" list) — it never leaves an empty skeleton.
   Owner: **pm-architect**.
2. `threat-model.md` has a **single owner — pm-architect** — which also owns the
   adjacent `architecture.md § Security constraints`. The two are **complementary**:
   threat-model = *what we protect / from whom / likelihood-impact*; Security
   constraints = *the enforceable implementation rules*. They are wired
   **threat → constraint by reference**, with no duplicated content
   (one-fact-one-owner / move-not-copy).
3. When a feature touches a **security-relevant surface** (the single-sourced list:
   authentication, cryptography / key management, data-at-rest / storage,
   network / transport, user input, PII, access control), `/pm-plan` requires
   `docs/threat-model.md` in the plan's "Docs to update" with the relevant Threat rows
   added or updated; after coding, `pm-architect` updates it (the same pattern as
   `architecture.md`).
4. `pm-plan-checker` **blocks** a security-touching plan (on a security-bearing
   project) that omits the threat-model update from "Docs to update" — the same class
   of block as a missing "Stack expectations touched" section.
5. `pm-auditor`, on a security-bearing project, flags: an **empty / skeleton**
   threat-model → **blocking**; a **stale** threat-model (a security-touching feature
   merged after the threat-model's `Last reviewed` date) → **note**. Remediation:
   spawn `pm-architect` to draft / refresh it (including backfilling from threat-driven
   decisions already recorded in `architecture.md`).
6. The list of **security-relevant surfaces is defined once** (single-source) and
   referenced by name from `/pm-plan` and `pm-plan-checker` — never re-encoded,
   mirroring the single-source-of-conditions invariant used for the migration
   conditions in `MIGRATIONS.md`. `pm-auditor` does **not** need the list at all: it
   keys off the durable artifact instead — a feature is "security-touching" when its
   plan named `docs/threat-model.md` in "Docs to update" (which the plan-checker gate
   guarantees) — so the list still appears in exactly one place.
7. **Non-security projects are unaffected** — no threat-model is required and nothing
   is flagged.

## Existing behaviors this feature touches

*(what must not break)*

- Bootstrap Q7 + the conditional scaffold (`pm-bootstrap.md:77`) — now "draft
  populated" instead of "copy empty"; the **conditionality is preserved** (only when
  security is in play).
- `pm-legacy-reader.md:83-85` — the conditional threat-model write in legacy-full is
  preserved, finalized by `pm-architect` (the same handoff as `architecture.md`).
- `pm-architect`'s ownership of `architecture.md § Security constraints` — **extended**,
  not changed; that section stays where it is.
- `pm-auditor`'s existing 5 dimensions and `pm-plan-checker`'s existing gates — the new
  checks are **additive**; existing checks are untouched.
- The single-source-of-conditions invariant (migration conditions in `MIGRATIONS.md`) —
  the new security-surface list follows the same pattern, not a competing one.

## Contracts

*(none — this is a prose change to protocol agents / commands / WORKFLOW.md / a
template; no code APIs or config keys)*

## Stack expectations touched

*(N/A — this repository's "stack" is the protocol docs themselves; the change touches
no external library, wire protocol, or delivered artifact. Recorded explicitly so the
plan-checker sees the section was considered, not omitted.)*

## Interaction scenarios

**Provably isolated** (from runtime): the edits are static prose in `.md` files and
touch no executable surface — `tests/hooks.sh` is unaffected. The one "interaction" is
**cross-file consistency**: the single-source security-surface list and the
owner / reference wiring must agree across `pm-plan`, `pm-plan-checker`, `pm-auditor`,
and `WORKFLOW.md`. That is an editorial consistency check (verified by review), not a
runtime interaction.

## Test plan

- **Existing tests that must pass:** `tests/hooks.sh` (currently 71/71) — unaffected by
  a prose change (no new hook); run to confirm it stays green.
- **New executable tests:** none — the change is prose. Verification is editorial:
  `pm-plan-checker` and `code-review` read the diff against this plan and confirm all 7
  scenarios are realized, the security-surface list is single-sourced (not duplicated
  across the three reader agents), threat-model ↔ Security constraints carry no
  duplicated content, and the non-security path is untouched.
- **Mandatory-table classification:** mechanically **docs-only** (no Product Contract,
  no executable tests), but it encodes substantive protocol behaviour — scenario
  coverage is verified editorially rather than by a test runner.

## Docs to update

- **WORKFLOW.md** — define the single-source "security-relevant surface" list and the
  threat-model lifecycle (owner, bootstrap-draft, per-feature update, audit); add a
  note to the "What is mandatory when" table if it fits. Owner: `pm-coder`.
- **Protocol agents / commands** (`pm-bootstrap.md`, `pm-architect.md`,
  `pm-legacy-reader.md`, `pm-plan.md`, `pm-plan-checker.md`, `pm-auditor.md`) — wire in
  bootstrap-draft / per-feature trigger / plan-checker gate / audit dimension /
  ownership, each referencing the single-source list by name. Owner: `pm-coder`.
- **doc/_templates/threat-model.md.tmpl** — add a dated `Last reviewed` field (for the
  staleness check) and make the Threats-table Mitigation column reference the
  `architecture.md § Security constraints` rules by name (the threat → constraint
  wiring). Owner: `pm-coder`.
- **doc/architecture.md** (this repo's own canon) — record the decision: owner-extension
  (no new agent), the single-source surface list, the threat ↔ constraint wiring, and
  soft-enforcement-not-hook. Owner: `pm-architect`.

## Out of scope

- **Downstream backfill** of `wb-mqtt-matter`'s own empty threat-model (consolidating
  its decisions #2/#9/#10/#11) — a separate downstream cycle. This protocol change
  *enables* it (via the audit flag + remediation), but the actual consolidation is not
  done here. Cross-reference only.
- **A hard `PreToolUse` hook** enforcing the threat-model — rejected: "security-touch"
  is a semantic judgement, not a regex match; enforcement is via pipeline gates
  (plan-checker block + audit finding), consistent with the Blast-radius precedent and
  the 2026-06-02 rejection of a hard edit-ownership guard.
- **"Every project gets a threat-model"** — rejected (PM chose security-bearing only).
- **`ui-guide.md`** — the sibling scaffold-and-forget optional doc has the same class of
  gap but is not load-bearing for security; a separate plan if ever wanted.

## Key design decisions

1. **Owner = pm-architect extends scope** (lean agent roster; it already owns the
   adjacent Security constraints; the threat → constraint wiring wants a single owner).
   No new security agent.
2. **Triggers** — project-level = security-bearing (PM-confirmed); per-feature = the
   single-source security-surface list.
3. **threat-model ↔ Security constraints** — complementary, one-fact-one-owner, wired by
   reference (move-not-copy), no duplicated content.
4. **Single-source the security-surface list** — referenced by name from `pm-plan` /
   `pm-plan-checker` / `pm-auditor`, the same invariant as the migration conditions.
5. **Soft enforcement** via pipeline gates (plan-checker block + audit finding), not a
   hook — the trigger is a semantic judgement; consistent with prior precedent.
6. **Bootstrap drafts a populated threat-model** (no empty skeleton) — this is the root
   cause of the downstream pain.
7. **Staleness needs a dated `Last reviewed` field** in the template, compared by the
   auditor against security-touching features' merge dates.

> Structural choices (where the single-source list physically lives; the exact shape of
> the threat → constraint wiring) are deferred to a `pm-architect` design pass before
> coding — see `.ai-pm/arch/threat-model-ownership-and-lifecycle_arch.md`.
