# Read-allow for the agent's own out-of-root scratch (invariant 2)

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

A **read-family** allow-set (Read + bash-read + `find`, **NOT write**) for two sanctioned
out-of-root roots, derived fail-closed from the harness env:

1. **tool-result overflow store** — `<CLAUDE_CONFIG_DIR>/projects/<slug>/tool-results/`.
   `<slug>` = the session-root absolute path with `/`→`-` (CC's `~/.claude/projects/`
   convention, verified empirically: `/home/…/ai-pm-protocol` → `-home-…-ai-pm-protocol`).
2. **per-session temp root** — `<TMPDIR|/tmp>/claude-<uid>/<slug>/<CLAUDE_CODE_SESSION_ID>/`.

Both are **read-only**: a write outside the root stays denied (the reported symptom is
reading fetched/overflow content back; widening write is a separate, riskier step not asked
for — the scratchpad's write use is a noted follow-up).

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

## Why read-only, why session-id-narrow

- **Read-only.** A read of the agent's own artifact is the round-trip the platform needs; a
  *write* outside the root is a different threat (exfiltration, planting files in a sibling
  project). The write deny (`writeTargetOutsideRoot`) does not consult the set, so a write
  to a sanctioned path stays denied. This bounds the blast radius: the widening can leak
  *nothing* out, only let the agent see what the platform already wrote for it.
- **Session-id-narrow.** The temp root is `<slug>/<sid>/`, not the shared `<slug>/`. A
  sibling session's transcripts (same project, different `sid`) stay denied — the role-scope
  persona rule (invariant 2 backstop) holds. The overflow store is already project-scoped
  (under `<configDir>/projects/<slug>/`), not session-scoped; it is admitted in full because
  it holds only this project's overflow, not other projects' dirs.

## Core/adapter split

- **engine (neutral)** — the read predicates consult a NEW passed allow-set
  `input.sanctionedScratch` alongside `isInsideAnyComponent`, via `isInsideSanctioned` in
  `engine-paths.mjs`. A read is in-boundary if inside any component OR inside a sanctioned
  root. `writeTargetOutsideRoot` does NOT consult it. The engine knows nothing of CC env.
- **claude shim (adapter)** — `src/adapter/claude/sanctioned-scratch.mjs` derives the two
  paths from `process.env` + `root`, fail-closed; the shim threads them onto the neutral
  input. CC conventions (the slug, the temp layout) live here, never in the engine.
- **opencode** — its deny is a plugin; the same `input.sanctionedScratch` channel is the
  contract. opencode's own derivation (or none) is its adapter's job; v1 lands Claude (the
  Operator's platform), opencode parity is the follow-up (its temp/tool-results conventions
  differ).

## Residual / follow-up

- **CC-version dependence.** The two path conventions are empirical (verified against a live
  CC session). If a CC release shifts them, the `realpathSync` existence check is the
  backstop: a no-longer-existing dir ⇒ no widening ⇒ the false-block returns (a regression
  the Operator sees and reports, never a silent boundary hole). The derivation is the one
  place to update.
- **An arbitrary Operator file** (e.g. `~/Downloads/img.png`, not harness scratch) is **not**
  covered — that is a DIFFERENT widening (declared additional read paths, à la components),
  out of scope here. Workaround today: `cp` into the root.
- **Durable notes home** — the "write to the scratchpad" use-case from v1 is superseded.
  Durable cross-session project knowledge belongs in **`.ai-dev/notes/`** (committed, in-project,
  team-shared). The scratchpad is for ephemeral tool-result overflow only, never a notes store.
  See orchestrator `## Your seat` knowledge taxonomy and `#316` feature notes.
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

This WIDENS a `[mechanical]` floor. Labelled honestly: a read-only carve-out within the
read-outside-root family, fail-closed, session-id-narrow. Over-claiming it as "safe" is a
review-blocking failure — it is a documented, guarded, independently-reviewed widening, not
"no risk." It does not allow writes outside root, does not allow reads of sibling sessions'
transcripts, and does not allow reads of `CLAUDE_CONFIG_DIR` broadly.
