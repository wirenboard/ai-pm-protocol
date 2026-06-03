# Extract migrations reference — design notes

## Context

`extract-migrations-reference_plan.md` pulls the migration catalogue out of
`.claude/commands/pm-bootstrap.md` (lines 39–142: the `### Pending template-upgrade
migrations` / `### Pending-migration detection` block plus the per-version procedures —
v2.2, v2.3, old-format-map, README front-gate, product.md header-migration, contract
two-layer) into one dedicated reference, leaving a short pointer behind. The
`## Product map generation procedure` (line 364) **stays** in `pm-bootstrap.md`.

The structural choice is **where the new reference lives and how it is referenced**, so
that the by-name reference resolves in **both** contexts:

- **This repo (dogfood):** command files at `.claude/commands/`, agents at
  `.claude/agents/`, docs at `doc/`.
- **A downstream project:** the protocol ships as a submodule at `.ai-pm/tooling/`;
  `.claude/commands` and `.claude/agents` are **symlinks** into
  `.ai-pm/tooling/.claude/...`; the project's own docs are at `docs/` while this repo's
  are at `doc/`.

Six live referrers must keep resolving by name after the move: `pm-plan.md`,
`pm-audit.md`, `pm-auditor.md`, `pm-plan-checker.md`, plus `pm-bootstrap.md`'s own
pointer. Today they all say "`### Pending-migration detection` in `pm-bootstrap.md`" — a
**bare command filename**, which resolves in both contexts precisely because Claude Code
loads the command files (the symlink/path difference between `doc/` and `docs/` never
enters into it).

## Adjacent implementations (how shipped protocol prose is referenced today)

Two distinct reference mechanisms already exist in this codebase. They are the only
viable patterns, so the choice reduces to picking which one the new reference adopts.

1. **Command file, referenced by bare filename** — `pm-bootstrap.md` at
   `.claude/commands/pm-bootstrap.md`. Referred to as "… in `pm-bootstrap.md`" from
   `pm-plan.md:222/227/230/232/235/237/240/242/245/269`, `pm-audit.md:84/91/95/99/103`,
   `pm-auditor.md:38/103/111/119/123/126`, `pm-plan-checker.md:53`. The bare filename
   resolves in both contexts because the file is a loaded command (dogfood: real file;
   downstream: symlinked from the submodule). **This is the current home of the catalogue
   and the reference style the plan wants preserved.** Cost: a `.claude/commands/<name>.md`
   file **registers as a `/<name>` slash command**.

2. **Protocol-root doc, dual-referenced** — `WORKFLOW.md` at the repo root. Referenced
   two ways: (a) by **bare filename in prose** — "see WORKFLOW.md", "per WORKFLOW.md's
   language canon" — from `pm-architect.md:73`, `pm-coder.md:51`, `pm-plan.md:127/140`,
   `pm-audit.md:28`, `pm-fixup.md:13`, `pm-bootstrap.md:202/259/289`; and (b) by an
   **explicit downstream import** `@.ai-pm/tooling/WORKFLOW.md` in
   `doc/_templates/CLAUDE.md.tmpl:73` and the live detect-scenario check
   (`pm-bootstrap.md:35`). `WORKFLOW.md` is **not** a command (no phantom `/WORKFLOW`) and
   **not** under `doc/`; it sits at the protocol root and is read as ambient prose, never
   dispatched.

**Counter-pattern to avoid — `doc/` path references.** The templates are referenced as
`.ai-pm/tooling/doc/_templates/<x>.tmpl` (e.g. `pm-architect.md:49/75`,
`pm-stack-researcher.md:46`, `pm-bootstrap.md:78/280/281`). That prefix resolves
**downstream only** — in this repo there is no `.ai-pm/tooling/` (the repo *is* the
tooling), so dogfood reads of those paths are technically broken and survive only because
templates are scaffolding the agents rarely re-read mid-flow. A *live, hot-path* reference
(four agents evaluating migration conditions on every plan/audit) cannot adopt a
`doc/`-vs-`docs/` path that resolves in only one context. This rules out putting the
reference under `doc/` and pointing at it by path.

## Behavioral risks in this area

Not event-driven code — no subscriptions/emit feedback loops. The behavioral risk is
**reference resolution**: a referrer pointing at a home that does not resolve in one of
the two contexts is a silent dangling reference (the agent simply fails to find the
conditions and may re-encode or skip them — the exact single-source drift this extraction
exists to prevent). The `move-not-copy` invariant (catalogue in exactly one place) and
the `single-source-of-conditions` invariant both depend entirely on the chosen home being
reachable by all six referrers in both contexts.

Secondary risk: the moved procedures cross-reference `## Product map generation procedure`
which **stays** in `pm-bootstrap.md` (3 call sites: detection-block line 54, v2.2 step 2
line 66, contract-two-layer verify line 117). After the split these become **cross-file**
references and must name the target file (`pm-bootstrap.md`) — same bare-filename
mechanism — instead of "below".

## Variant A: new command file `.claude/commands/pm-migrations.md`

- **Where:** `.claude/commands/pm-migrations.md` (dogfood) → symlinked
  `.ai-pm/tooling/.claude/commands/pm-migrations.md` downstream.
- **Reference style:** bare filename, identical to today —
  "`### Pending-migration detection` in `pm-migrations.md`". Zero change to the *form* of
  the six referrers (only the filename token changes).
- **Resolves in both contexts:** yes — Claude Code loads command files; bare filename
  works in dogfood (real file) and downstream (symlink). Identical resolution proof to the
  current `pm-bootstrap.md` reference.
- **Pros:** smallest possible delta from the status quo; reference style preserved
  verbatim; resolution mechanism already proven by the file it is moving *out of*.
- **Cons:** **registers a phantom `/pm-migrations` slash command.** The catalogue is a
  pure reference (detection conditions + procedures the orchestrator follows), never a
  user-invoked command. A `/pm-migrations` entry would appear in the command palette
  alongside `/pm-plan`, `/pm-audit`, etc., inviting a PM to "run migrations" directly and
  bypass the `/pm-bootstrap` re-bootstrap flow that owns detect-and-run. This is the
  failure mode the plan explicitly flags ("likely undesirable — assess this"). The phantom
  command is real and user-visible, not cosmetic.
- **Risks:** PM discoverability of a non-command; future confusion about whether
  `/pm-migrations` is a supported entry point.

## Variant B: new protocol-root reference `MIGRATIONS.md` (the WORKFLOW.md pattern)

- **Where:** `MIGRATIONS.md` at the **protocol root** (dogfood:
  `/MIGRATIONS.md`; downstream: `.ai-pm/tooling/MIGRATIONS.md`) — the exact shelf
  `WORKFLOW.md` already occupies.
- **Reference style:** bare filename in prose, identical mechanism to `WORKFLOW.md` —
  "`### Pending-migration detection` in `MIGRATIONS.md`". The six referrers change only the
  filename token (`pm-bootstrap.md` → `MIGRATIONS.md`); the by-name form is preserved.
- **Resolves in both contexts:** yes — and by the **already-proven** `WORKFLOW.md`
  mechanism. In dogfood the file is read at the repo root by bare name; downstream the
  agents read it by bare name too (the same way they say "see WORKFLOW.md"), and the
  `/pm-bootstrap` flow that *runs* migrations can reach it explicitly via
  `.ai-pm/tooling/MIGRATIONS.md` if it ever needs the absolute path (mirroring
  `@.ai-pm/tooling/WORKFLOW.md`). No `doc/`-vs-`docs/` divergence — the protocol root is
  the one shelf that is path-symmetric under a bare name.
- **Pros:** **no phantom slash command** — a root-level `.md` is not a command and never
  registers `/MIGRATIONS`. Sits with its natural sibling: `WORKFLOW.md` is the canon for
  *how the protocol behaves*; `MIGRATIONS.md` is the canon for *how a project moves between
  protocol versions* — both are ambient protocol references, neither is dispatched.
  Reference style preserved. Resolution mechanism is the codebase's existing, dual-context
  precedent for exactly "a shipped protocol prose doc referenced by name from agents."
- **Cons:** introduces a new protocol-root file (the root currently holds `WORKFLOW.md`,
  `README.md`, `CHANGELOG.md`); slightly larger surface than reusing the commands
  directory. The cross-file references to `## Product map generation procedure` now point
  *back into* `pm-bootstrap.md` from a root doc (rather than command-to-command) — still a
  bare-filename reference, fully resolvable, but it does mean `MIGRATIONS.md` names
  `pm-bootstrap.md` for the generation step. (This is inherent to "generation stays in
  bootstrap" and is unavoidable in either variant.)
- **Risks:** none specific to resolution. One authoring note: the detection block's
  self-reference "see `### Pending-migration detection` above" stays *intra-file* (both the
  detection block and the procedures move together into `MIGRATIONS.md`), so those
  in-catalogue cross-references remain `above`/`below` and do not become cross-file — only
  the generation-procedure references cross the file boundary.

## Recommendation

**Variant B (`MIGRATIONS.md` at the protocol root).** It is the only placement that
preserves the by-name reference style **and** avoids registering a phantom slash command
**and** resolves in both contexts via a mechanism the codebase already proves
(`WORKFLOW.md`): a shipped protocol-prose doc, referenced by bare filename from the
agents, imported by explicit `.ai-pm/tooling/` path where a hard path is needed. Variant A
matches today's reference token most literally but pays for it with a real, user-visible
`/pm-migrations` phantom command that invites bypassing the `/pm-bootstrap` detect-and-run
flow — the cost the plan asked to weigh, and the deciding factor against it.

Implementation notes for the coder (design only — not prescribing edits):

- Move lines 39–142 of `pm-bootstrap.md` (the `### Pending template-upgrade migrations`
  header through the `---` before `## Greenfield`) into `MIGRATIONS.md` verbatim in
  substance; leave a short pointer in `pm-bootstrap.md` at that location naming
  `MIGRATIONS.md`.
- Re-point the by-name references in `pm-plan.md`, `pm-audit.md`, `pm-auditor.md`,
  `pm-plan-checker.md` from "… in `pm-bootstrap.md`" to "… in `MIGRATIONS.md`".
- The 3 cross-references to `## Product map generation procedure` (now in a different
  file) must name `pm-bootstrap.md` — change "the **Product map generation procedure**
  below" → "… in `pm-bootstrap.md`".
- `## Product map generation procedure` and its five referrers (pm-audit, pm-architect,
  pm-auditor, pm-plan, architecture.md) stay untouched — they already reference it as "in
  `pm-bootstrap.md`", which remains correct.
- **Plan should be updated to** name the chosen home explicitly as `MIGRATIONS.md` (the
  plan leaves the path to the architect/coder; recording the decision closes that gap).
  `doc/architecture.md` should record the structural decision per the plan's "Docs to
  update" (pm-architect, post-coder).
