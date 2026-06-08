# delegation-role-integrity — review

Small protocol-hardening (no plan file). Grounded in a live nula observation: the orchestrator spawned a generic `general` subagent for the code-review role (then rationalized keeping it — "docker-db is mostly infra, little code") instead of the `code-review` engine + owning the Pass-2 trail itself.

## What shipped
- **Canonical rule** (`WORKFLOW.md` kernel + `workflow/roster.md` § "Role-delegation integrity" + `workflow/enforcement.md` deny-list, `3740144`): every pipeline role has ONE designated protocol agent/engine; never a generic harness built-in (`general`/`build`/`plan`) nor any non-protocol agent as a substitute. The on-purpose engines (`code-review`, `deep-research`) ARE the designated fillers, never gated. The Pass-2 `## Code review` trail is the orchestrator's own (only findings delegated to the engine).
- **Structural deny** (plugin `task`-guard, `5f002eb`): `GENERIC_BUILTIN_DENY = ["general","build","plan"]` — the orchestrator's `task`-spawn of a generic built-in is THROWN (same named-deny-list mechanism as the wb-* role-duplicator deny). Persona echo + tests.

## Code review findings
**Pass-2 `code-review` (cross-model Sonnet).** Over-block: NIL (the roster has no generic-exploration seat; no legit orchestrator `general` spawn to false-deny). Carve-out preserved (exact-id membership; `pm-*`/`code-review`/`deep-research` never matched). 2 findings, both FIXED:
1. (FALSE-ALLOW, real pre-existing) the wb-* deny read only `args.subagent_type` while the new generic deny read `subagent_type || agent` → a wb-* role spawned via `{ agent: 'wb-development:coder' }` (no subagent_type) ESCAPED both checks. → `7e854e5`: unified `target = subagent_type || agent` resolution, fed to BOTH denies (closes the wb-* `agent=`-arg bypass). Non-vacuity verified — the wb-* agent= deny test FAILS against the old subagent_type-only check.
2. (test gap) allow-path tested only the subagent_type form → `7e854e5`: added agent=-arg allow (`pm-coder`/`code-review`) + the wb-* agent= deny.

## Code review: FIXED — `7e854e5` (Pass-2 2 findings; over-block nil, carve-out preserved)
Re-verified: oc-plugin-unit 74/74 (63→74), opencode 41/41, generator 4/4 (Claude byte-identical), neutral-prose 5/5, hooks 79/79, core-delegation 2/2, targeted-reading 7/7, ultra-absent 2/2.

## Verdict (Pass 2): approve
Bonus: the unified target resolution also closed a pre-existing wb-* role-duplicator `agent=`-arg bypass that predated this slice.
