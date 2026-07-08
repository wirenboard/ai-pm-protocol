# Out-of-root scratch allow — reads (v1) + the per-session temp write carve-out (v2)

## Question

The boundary deny (invariant 2) `[mechanical]`-denies any read outside the permitted root
set. But the platform itself places some of a role's OWN artifacts outside that root — the
**tool-result overflow store** (a fetched doc/image whose body exceeded the inline cap) and
the **per-session temp root** (the scratchpad, staged pasted files, task outputs). An agent
reading its own spilled/fetched content back — a legitimate round-trip the platform relies
on — is false-blocked. The live symptom (2026-07-01, Operator-escalated P0): an agent could
not recognise a fetched image, because the spilled bytes lived under the overflow store and
the deny treated that as "out of root." How should the protocol widen invariant 2 without
dissolving the boundary it enforces? Settled by: how the existing `componentRoots`
fail-closed widening (`docs/decisions/multi-repo-components.md`) maps onto this case.

## The widening

A **read-family** allow-set (Read + bash-read + `find`) for two sanctioned out-of-root
roots, derived fail-closed from the harness env:

1. **tool-result overflow store** — `<CLAUDE_CONFIG_DIR>/projects/<slug>/tool-results/`.
   `<slug>` = the session-root absolute path with `/`→`-` (CC's `~/.claude/projects/`
   convention, verified empirically: `/home/…/ai-pm-protocol` → `-home-…-ai-pm-protocol`).
2. **per-session temp root** — `<TMPDIR|/tmp>/claude-<uid>/<slug>/<CLAUDE_CODE_SESSION_ID>/`.

Both are read-allowed. **Write is narrower** (v2, `#401`): ONLY the per-session temp root
(2) is write-allowed — the harness's own system prompt directs the agent to write temp
files there, and the original read-only-everywhere posture false-blocked that compliant
write (observed live, twice, on this session). The **tool-result overflow store (1) stays
write-denied forever** — it is the harness's own artifact (a fetched/spilled body), never
the agent's to mutate; there is no legitimate write path to it. See "Why write is narrower
than read" below for the rationale and the security invariants this carve-out preserves.

## Why fail-closed derivation, not a manifest

`componentRoots` already solved "widen a `[mechanical]` deny without trusting attacker-
controlled input": a declared set, validated by a fail-closed guard (overbroad ⇒ collapse
to the single root), canonicalised through `realpathSync` so a symlink cannot escape, and
byte-identical to today when the input is absent/bad. The same posture applies here, with
one difference: the "manifest" is the **harness env** (`CLAUDE_CONFIG_DIR`,
`CLAUDE_CODE_SESSION_ID`, uid), not a committed file. So the derivation:

- builds a path only from PRESENT env (missing either ⇒ no entry, the other still derives);
- requires `fs.realpathSync` to resolve it (the dir actually exists — a shifted CC convention
  ⇒ no widening, no crash);
- rejects **overbroad** derivations: a filesystem root, an ancestor of / equal to the
  session root, the shared `<slug>` parent that would leak a sibling session (only the
  session-id child is admitted), or `CLAUDE_CONFIG_DIR` itself (only the narrow
  `…/tool-results/` subdir).

Bad/absent env ⇒ empty set ⇒ byte-identical to today. Two paths derive **independently**
(one failing does not poison the other). Mirrors `componentRoots` deliberately — the
precedent this repo already ships and tests.

## Why write is narrower than read, why session-id-narrow

- **Why the overflow store stays write-denied.** The overflow store is the harness's OWN
  spill artifact — content the platform wrote there when a fetched doc/image exceeded the
  inline cap. The agent has no legitimate reason to write into it (there is no observed
  symptom asking for it, unlike the temp root); admitting it to the write set would let an
  agent overwrite harness-owned state for no product benefit, so the derivation tags it
  `writable:false` and it never enters `deriveSanctionedScratchWritable`'s output.
- **Why the temp root IS write-allowed.** The harness's own system prompt directs the agent
  to write ephemeral temp files to the per-session scratchpad under this root — a compliant
  write that the read-only-everywhere v1 posture false-blocked (the observed symptom this
  extension fixes). Widening exactly this one root, and no further, keeps the blast radius
  the same shape as the read widening: the agent can only touch a workspace the platform
  already scoped to IT, never a sibling's or a foreign path.
- **One derivation, two consulted sets.** `sanctioned-scratch.mjs` computes a single tagged
  list (`{path, writable}`) once; `deriveSanctionedScratch` (all paths) feeds the read-family
  predicates, `deriveSanctionedScratchWritable` (writable-only) feeds the write predicate.
  No derivation logic is duplicated between them — a change to the fail-closed guard applies
  to both read and write in one place.
- **Session-id-narrow.** The temp root is `<slug>/<sid>/`, not the shared `<slug>/`. A
  sibling session's transcripts or temp files (same project, different `sid`) stay denied
  for BOTH read and write — the role-scope persona rule (invariant 2 backstop) holds. The
  overflow store is already project-scoped (under `<configDir>/projects/<slug>/`), not
  session-scoped; it is read-admitted in full because it holds only this project's overflow,
  not other projects' dirs — but it is never write-admitted, at any scope.
- **Fail-closed unchanged.** Absent/blank env ⇒ `deriveTagged` returns `[]` ⇒ both derived
  sets are empty ⇒ a write outside the root is byte-identical to the pre-carve-out DENY. The
  overbroad/ancestor/symlink guard (`admissible`) runs identically before a path is tagged
  either way, so it protects the write-admitted root exactly as it protects reads.

## Core/adapter split

- **engine (neutral)** — the read predicates consult the passed allow-set
  `input.sanctionedScratch` alongside `isInsideAnyComponent`, via `isInsideSanctioned` in
  `engine-paths.mjs`. A read is in-boundary if inside any component OR inside a sanctioned
  root. `writeTargetOutsideRoot` consults the SAME `isInsideSanctioned` helper but with the
  narrower `input.sanctionedScratchWritable` set — one predicate function, two call sites,
  two different sets, no duplicated boundary logic. The engine knows nothing of CC env; it
  only ever sees the two arrays the shim hands it.
- **claude shim (adapter)** — `src/adapter/claude/sanctioned-scratch.mjs` derives a single
  tagged list (`{path, writable}`) from `process.env` + `root`, fail-closed; `shim.mjs`
  threads both `deriveSanctionedScratch` (all, for reads) and `deriveSanctionedScratchWritable`
  (writable-only, for writes) onto the neutral input. CC conventions (the slug, the temp
  layout, which root is writable) live here, never in the engine.
- **opencode** — its deny is a plugin; the same `input.sanctionedScratch` /
  `input.sanctionedScratchWritable` channels are the contract. opencode's own derivation (or
  none) is its adapter's job; this extension lands Claude (the Operator's platform), opencode
  parity is the follow-up (its temp/tool-results conventions differ).

## Residual / follow-up

- **CC-version dependence.** The two path conventions are empirical (verified against a live
  CC session). If a CC release shifts them, the `realpathSync` existence check is the
  backstop: a no-longer-existing dir ⇒ no widening ⇒ the false-block returns (a regression
  the Operator sees and reports, never a silent boundary hole). The derivation is the one
  place to update.
- **An arbitrary Operator file** (e.g. `~/Downloads/img.png`, not harness scratch) is **not**
  covered — that is a DIFFERENT widening (declared additional read paths, à la components),
  out of scope here. Workaround today: `cp` into the root.
- **Durable notes home — unaffected by the write carve-out (`#401`).** The temp root is now
  write-allowed for EPHEMERAL scratch (the harness's own directed use — temp files, staged
  intermediate output), never as a durable project-knowledge store. Durable cross-session
  project knowledge still belongs in **`.ai-dev/notes/`** (committed, in-project, team-shared)
  — writable there through the ordinary in-root path, not this carve-out. See orchestrator
  `## Your seat` knowledge taxonomy and `#316` feature notes.
- **Auto-memory divert (P2c #316)** — `autoMemoryDirectory` has no CC env var form; it is a
  `settings.json`-only key. An absolute in-project path in committed settings.json would be
  machine-specific, so the installer sets **`autoMemoryEnabled: false`** instead (same decision
  as this dogfood repo made manually). Downstream installs get `autoMemoryEnabled: false` in
  their `.claude/settings.json` — the wrapper-less `claude` path also gets protection via the
  committed settings.json (does not require the launcher).
- **Operator-pasted image-cache (#365 — deferred)** — empirical data point: an Operator-pasted
  image landed at `~/.claude/image-cache/<session-id>/1.png` under the DEFAULT `~/.claude/`
  (not under the active `CLAUDE_CONFIG_DIR` pointing to a non-default profile dir). This path is
  NOT currently covered by `deriveSanctionedScratch` (which uses `CLAUDE_CONFIG_DIR`, not the
  default dir). Derivation would require `os.homedir() + "/.claude/"` — not env-var-derived when
  a custom `CLAUDE_CONFIG_DIR` is in use. **Deferred**: (a) it is unclear whether a Read-tool
  call to the image-cache path is actually needed (pasted images arrive as binary in context,
  not requiring a Read); (b) hardcoding `~/.claude/` in the derivation violates the fail-closed
  env-derivation discipline; (c) a future investigation with a confirmed read-block symptom
  should add a third `deriveSanctionedScratch` entry, env-derived, session-id-narrow, with
  its own `admissible()` pass — same discipline as the two existing entries.
- **opencode parity** — its temp conventions differ; the same channel is ready, the
  derivation is the follow-up.

## Honesty

This WIDENS a `[mechanical]` floor — TWICE: a read carve-out (v1) and, narrower, a write
carve-out (`#401`) limited to the agent's own per-session temp root. Labelled honestly: a
fail-closed, session-id-narrow allow-set within the outside-root family, not "no risk" —
over-claiming it as safe is a review-blocking failure. It does NOT allow writes to the
tool-result overflow store (write-denied unconditionally, at every scope), does NOT allow
reads OR writes of a sibling session's temp files or transcripts, does NOT allow writes to
any other out-of-root path, and does NOT allow reads of `CLAUDE_CONFIG_DIR` broadly.
