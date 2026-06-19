# Downstream upgrade + migration procedure

**Question.** How does a downstream project upgrade the protocol via `npx`, how does the
fresh session *detect* the version change, and where does the migration procedure live —
so that the installer half is `[mechanical]` and the session half is honest `[persona]`?

**Answer.** Version-stamp + handoff-marker + migration-notes-as-data, with the agent as
the migration executor (no codemods needed — markdown notes ARE the codemod when an LLM
executes them):

1. **Stamp** `[mechanical]` — the installer writes `.ai-dev/VERSION` (one line, the
   installing package's `version`) on **every** run, overwriting. It lives outside
   `.ai-dev/tooling/` because tooling is read-denied to agents (invariant 2,
   `src/adapter/deny-rules.json:28`) — a stamp the session cannot read detects nothing.
   Not a `config.json` field: config is the Operator's never-clobbered file
   (`src/adapter/install.mjs:123` "Written ONLY where absent"); mixing the installer's
   record into it would force a surgical-update write class and break the one-home split
   (config = Operator choices, VERSION = installer record).
2. **Detect + handoff** `[mechanical]` — before overwriting, the installer reads the prior
   stamp. Different (or absent over an existing `.ai-dev/` tree ⇒ "pre-stamp, <5.10")
   ⇒ it prints **"upgraded X → Y — restart your session"** and writes a transient marker
   `.ai-dev/UPGRADING.md` (`upgraded X → Y on <date>; next session: run the upgrade
   check`). The print is the whole "ask for restart" — an installer cannot restart a
   session; the act is the Operator's.
3. **Migration notes as data** — the per-version sections already exist in
   `src/adapter/INSTALL.md:25-61` (`## Upgrade`, MAJOR 5.0.0, MINOR 5.8.0) but are
   vendored under the read-denied tooling dir. Extract them to `src/adapter/upgrades.md`
   (one home; INSTALL.md points there); the installer lays it down at
   `.ai-dev/upgrades.md` (overwrite each run — it is the *new* version's notes).
4. **Session half** `[persona]` — a new `## Upgrade` section in
   `src/agents/orchestrator.md`, fired on the understand beat: `.ai-dev/UPGRADING.md`
   present ⇒ short declinable offer ("protocol upgraded X → Y — run the migration
   check?"). On accept: read the `(old, new]` sections of `.ai-dev/upgrades.md`, execute
   the applicable steps through the loop (fixup-grade for mechanical renames; full loop
   where docs need redrafting), delete the marker **last**, record in the state pointer.
   Declined ⇒ marker stays and the offer re-fires next session. Fallback signal when the
   marker is missing (e.g. a tooling bump without an installer run): stamp ≠ the version
   the state pointer last recorded. Optional inject-class reinforcement: an
   `upgrade-pending` prompt-hook rule ("an unconsumed upgrade marker exists") — nudges,
   never blocks, same class as the lazy-setup nudge.

**Honesty map.** Stamp write, prior-version detect, marker write, restart print, notes
lay-down — `[mechanical]` (installer code, deterministic, testable). The session noticing
the marker, offering, executing, deleting — `[persona]`: no deny can force a positive act
(PROTOCOL.md `## Enforcement`). The inject rule, if added, only *reinforces* the persona
offer.

## Evidence

- **No version metadata exists today** — `grep -n version src/adapter/install.mjs` → zero
  hits; `vendorTooling` (`install.mjs:94-99`) copies only `src/adapter|agents|modules`,
  never `package.json`. A downstream session **cannot** tell the version changed.
- **Re-run semantics today** — overwrite-idempotent for tooling/PROTOCOL/runner
  (`install.mjs:94-116`); only-if-absent for config and `tools.json` (`install.mjs:62-66,
  123-138`), so a new config key reaches an old install never — compat rests entirely on
  the absent⇒default rule (PROTOCOL.md `## Project config`), which holds for every current
  key. Claude hooks merge de-dups by exact command string and never prunes
  (`install.mjs:183-199`) — a *changed* hook command accumulates the stale group.
- **f4 migration test** (`src/adapter/install.test.mjs:139-156`) proves install-over-old
  coexistence (old artifacts kept, new structure laid) — it tests nothing about version
  detection; no test can, since no stamp exists.
- **Vendored installer self-re-run is BROKEN** (verified empirically 2026-06-13, high
  confidence): `node .ai-dev/tooling/src/adapter/install.mjs <target>` fails with
  `ENOENT .../tooling/PROTOCOL.md` — `layDownCore` reads `SOURCE/PROTOCOL.md`,
  `SOURCE/src/quality/run.mjs`, `SOURCE/src/templates/tools.json`, none of which
  `vendorTooling` vendors. The upgrade command INSTALL.md documents (`INSTALL.md:44,57`)
  cannot run; the same gap falsifies `INSTALL.md:14`'s claim that templates land at
  `.ai-dev/tooling/src/templates/`. **The npx path (full package) is today's only working
  upgrade path.**
- **CHANGELOG not shipped** — `package.json` `files: ["PROTOCOL.md", "src/"]`; yet
  `INSTALL.md:31` tells the upgrader to "read the CHANGELOG between the two versions" — a
  file the npx-installed downstream does not have.
- **Comparable tools** (verified 2026-06-13, official docs):
  - [ESLint migrate-to-9 / config-migrator](https://eslint.org/docs/latest/use/configure/migration-guide) —
    explicit per-major migration guide + a codemod tool the user runs once.
  - [Renovate config migration](https://docs.renovatebot.com/config-migration/) — ordered
    internal migration transforms applied at config load; legacy config keeps working
    silently (the no-stamp extreme — viable only when one program owns the config).
  - [Expo upgrade + expo-doctor](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) —
    version stamp in the project, `expo install --fix` aligns, `expo-doctor` detects skew
    (the "doctor" = our audit).
  - Minimal viable shape for markdown agents + JSON config + deny rules, no DB: **stamp +
    ordered per-version notes + doctor check** — Renovate's silent transform doesn't fit
    (the "program" here is an LLM session; silent mutation of Operator config violates the
    never-clobber rule), codemods reduce to the notes themselves.

## Also answered — nearby gaps

- **Rollback** — a version-pinned re-run: today `npx github:wirenboard/ai-pm-protocol#v5.8.1 <target>`
  (tags exist, `git tag` confirms), after npm publish `npx ai-dev-protocol@5.8.1 <target>`.
  Overwrite-idempotence converges the vendored files back. Named residuals: the hook-merge
  never prunes a stale group (above); only-if-absent files stay (correct); downgrade notes
  don't exist — a MAJOR downgrade is unsupported, say so in `upgrades.md`.
- **npm-publish interplay** (backlog entry "npm registry publish") — after publish the
  upgrade UX becomes `npx ai-dev-protocol@latest .`; the stamp/marker design is
  distribution-agnostic and needs no change then. Add `CHANGELOG.md` to `files` with that
  item so the downstream can read what shipped.
- **Audit skew check** — yes, one row: installed stamp (`.ai-dev/VERSION`) vs the vendored
  tooling's own version. Mechanical realisation: `vendorTooling` also writes the version
  *inside* tooling (e.g. `.ai-dev/tooling/VERSION`); a registered quality-runner script
  compares the two (a child-process file read, not an agent tool call — outside the deny's
  scope and its intent: the script is the installer's own deterministic family).

## The concrete changes this grounds

1. `src/adapter/install.mjs` — write `.ai-dev/VERSION` every run; read prior stamp first;
   on change write `.ai-dev/UPGRADING.md` + print the restart line; vendor `PROTOCOL.md`,
   `src/quality/`, `src/templates/` (+ the version) into tooling so the vendored installer
   is self-sufficient; lay down `.ai-dev/upgrades.md`. Optionally prune stale hook groups
   whose command targets the protocol shim path but matches no fragment command.
2. New `src/adapter/upgrades.md` — the per-version notes moved out of `INSTALL.md`
   (which points; one home), plus the downgrade-unsupported line.
3. `src/agents/orchestrator.md` — new `## Upgrade` section (understand-beat marker check,
   declinable offer, loop execution, marker deleted last, pointer update); one pointing
   clause in PROTOCOL.md's understand beat alongside the setup/discovery/bootstrap offers.
4. Config field — **not** added; the stamp file is the chosen home (rationale above).
5. `src/adapter/install.test.mjs` rows — stamp written on fresh install; re-run with a
   different source version ⇒ marker + updated stamp; same version ⇒ no marker; f4 gains
   a stamp assertion; vendored-installer self-re-run succeeds (the ENOENT regression).
6. `package.json` — `files` gains `CHANGELOG.md`.
7. Audit checklist (orchestrator `## Audit` step 2) — the version-skew row + its
   quality-runner script.
8. Optional: `deny-rules.json` inject-class `upgrade-pending` rule (nudge only).
