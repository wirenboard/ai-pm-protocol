# template-dev-artifacts-inert — plan

Decision authority: autonomous

Source: selected autonomously per ### Decision authority; source: `.ai-pm/backlog.md` § "Template dev-artifacts must stay inert downstream" (2026-06-04).

## Scenarios

1. **`WORKFLOW.md` always-on kernel names the submodule exclusion.** The existing "Project boundary" one-liner gains a clause: `.ai-pm/tooling/` is inside the project root but outside the readable content surface — downstream agents never read its plans, backlog, reviews, or arch notes; only the named shipped surface is reachable: `WORKFLOW.md` (via `@`-import), `MIGRATIONS.md`, `.claude/agents|commands|settings.json`, `doc/_templates/`. This makes the invariant always-on, not just in the full enforcement rule.

2. **`workflow/enforcement.md` project-boundary rule elaborates the submodule exclusion.** The full detail: `.ai-pm/tooling/` is a read-only submodule (a separate git); downstream agents must not descend into it beyond the named shipped surface. The protection today rests on a `doc/`-vs-`docs/` path-naming coincidence, not an audited rule; this rule replaces the coincidence with an explicit invariant. An agent that finds itself about to `Read` or `Grep` a path under `.ai-pm/tooling/` beyond the named surface should stop — it is out of scope for a downstream project.

3. **`pm-auditor.md` inventory step gains an explicit exclusion note.** When building the feature inventory from `docs/features/`, a note clarifies: `docs/features/` is the downstream project path; `.ai-pm/tooling/doc/features/` (the protocol template's own plans) must never be included in the inventory. `pm-auditor` is the agent most likely to accidentally include template plans via a broad search.

## Existing behaviors this feature touches

- `WORKFLOW.md` "Project boundary" one-liner — gains the submodule exclusion clause. The rest of the cross-cutting invariants are unchanged.
- `workflow/enforcement.md` "Project boundary rule" paragraph — gains the submodule exclusion detail. The existing project-root, parent-directories, and sibling-repos constraints are unchanged.
- `pm-auditor.md` Step 2 inventory instruction — gains the exclusion note for `.ai-pm/tooling/doc/features/`. The inventory algorithm and all other audit steps are unchanged.

## Contracts

(No Product Contract — protocol boundary rule; not user-facing product behavior. No human-role subject.)

## Stack expectations touched

(None — Markdown prose additions to three protocol files. No library, format, or external-system idiom touched.)

## Interaction scenarios

Provably isolated: prose additions to three files. No shared mutable state, no concurrency, no I/O. No adjacent feature interference — the boundary rule is read-only; adding it does not change any agent's behavior on a project that was already well-behaved.

## Test plan

- Existing tests that must pass: all `tests/hooks.sh` — untouched (no hook touched); confirm 73/73.
- New tests: **none** — Markdown protocol-boundary rule in a markdown-prose repo with no runtime to host a test for "did the agent stay out of .ai-pm/tooling/". Verification is editorial: Pass-1 plan-compliance (three files updated, the invariant is named in the always-on kernel, elaborated in enforcement.md, and noted in pm-auditor) + Pass-2 `code-review` over the diff.

## Docs to update

- `doc/architecture.md`: a short decision record — "Template dev-artifacts inert downstream: `.ai-pm/tooling/` is outside the readable content surface for downstream agents; the protection was a `doc/`-vs-`docs/` path coincidence, now replaced by an explicit invariant in `WORKFLOW.md` (always-on kernel) + `workflow/enforcement.md` (full rule) + `pm-auditor.md` (inventory exclusion note). Named shipped surface: WORKFLOW.md, MIGRATIONS.md, `.claude/agents|commands|settings.json`, `doc/_templates/`." Authored by `pm-architect` post-coding.

(README not touched — no install/quickstart/architecture-one-liner/doc-pointer change.)

## Key design decisions

- **Always-on kernel + full rule + inventory note: three-layer coverage.** The always-on kernel (WORKFLOW.md) ensures the invariant is loaded into every session without reading enforcement.md. The full rule (enforcement.md) provides the detail and rationale any agent can read on demand. The inventory note (pm-auditor) closes the specific highest-risk use case. Together they turn a coincidence into an audited guarantee.
- **Named shipped surface, not a blanket ban.** The rule does not say "never touch .ai-pm/tooling/"; it names exactly what IS permitted (the shipped surface) and marks everything else off-limits. This preserves the designed reads (pm-stack-researcher reading `doc/_templates/stack-idioms/<stack>.md`, pm-codebase-reader reading `doc/_templates/contract.md.tmpl`) without accidentally banning them.
- **No hook enforcement.** "Is this read inside .ai-pm/tooling/?" is partially checkable by path-prefix, but the boundary check also needs to distinguish `doc/_templates/` (permitted) from `doc/features/` (prohibited) within the same tree. This dual condition is not reliably hook-expressible without a regex that becomes fragile. Soft rule only, consistent with the no-hook-for-complex-conditions family.
- **pm-auditor is the highest-risk agent.** It does the broadest inventory reads of any pm-* agent. The plan targets it specifically. Other agents (pm-architect, pm-codebase-reader, pm-stack-researcher) read named paths; their risk is lower and adding a note there would be disproportionate ceremony.

## Out of scope

- **Automated exclusion flags** (e.g., adding `--exclude-dir=.ai-pm/tooling` to every grep command in every agent) — overfit; the rule is simpler and more robust.
- **A `.ai-pm/tooling/.gitignore` or `exclude_file` config** — the submodule is already a separate git; the protection mechanism is the rule, not a filesystem guard.
- **Auditing all agents in this feature** — the audit is the plan's rationale, not a deliverable. Only pm-auditor gets an explicit note because it is the highest-risk agent; the rule in enforcement.md covers all others.
- **Changing the `doc/`-vs-`docs/` naming convention** — it is a useful defense in depth; this feature does not remove it.
