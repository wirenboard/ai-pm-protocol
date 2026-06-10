# Plan: restructure into docs/ + src/, and enforce transient-artifact retention

> Progress note: PLAN BEAT. Not yet built. Two slices; A first (safe), then B (risky).
> Companion plan `.ai-pm/plans/product-advocate.md` is PAUSED — untouched by this work.

## Behaviour

What changes for the human reader and the downstream installer:
- The repo's durable surface gets two clear roots: **`docs/`** (compact human documentation) and **`src/`** (the machinery). Root keeps only the read-first constitution + repo-standard files.
- The protocol gains an explicit **retention rule**: transient pipeline artifacts (plan, review stamp, audit) are deleted after their job is done — the same discipline the protocol already applies to the plan, now extended and stated once as a rule.
- `.ai-pm/` becomes transient + lean only: state pointer, backlog, active plans. No review/audit graveyard.

What stays the same (load-bearing — must not regress):
- **`PROTOCOL.md` stays at repo root** (read-first constitution / entry point — fork 5, recommended ROOT).
- The **live deny hook** and the **merge-gate** keep working through every step (they self-locate by file position and by `.ai-pm/reviews/<topic>` — both addressed below).
- The **single-source / no-drift** guarantees: one engine, one rule list, generated-not-copied deployed plugin (byte-identity test stays green).
- The **downstream tooling-submodule contract** — only its documented path prefix shifts (`.ai-pm/tooling/adapter/` → `.ai-pm/tooling/src/adapter/`), nothing else.

## Scope

In scope: the two slices below — retention rule + cleanup (A), and the physical move + full path-rewiring (B).
Out of scope (to backlog, not this change):
- Compacting `backlog.md` (99 KB) — it is the live deferred-work home, not a graveyard; trimming it is a separate editorial pass.
- Any change to the deny-rule *logic*, the engine predicates, or the role contracts — this is a relocation + retention-rule change, not a behaviour change to enforcement.
- Re-homing `.opencode/node_modules` / lockfiles (deployment artifacts, untouched).

## Structural choice — forks for the Operator

Each fork carries a recommendation; the Operator decides before build.

1. **Slice order — A then B, or together?**
   Recommend **A first, shipped on its own, then B**. A is low-risk editorial + a doc rule and an immediate win (deletes the 24-file pile); B is a high-risk mechanical move whose safety net is the test suite. Landing A first means B starts from an already-clean `.ai-pm/`, and a B regression can't be confused with A's cleanup. Two PRs, not one.

2. **`templates/` placement.**
   Recommend **`src/templates/`**. The templates are the downstream scaffold — code-of-the-template (the `architecture.md` / `contracts.md` / `README.md` shells a new project starts from), assembled/copied by the machinery, not human-read documentation about *this* repo. They belong with `src/` next to the installers that ship them. (Alternative considered: `docs/templates/` — rejected, they are not documentation of this project; root — rejected, root is for the constitution + repo-standard files only.)

3. **The decision-base — `.ai-pm/{design,research}` (10 files) keep/compact/drop split.**
   Recommend, per the Operator's rule (documentation = compact + human-readable, not a bulk dump):
   - **KEEP + COMPACT into `docs/decisions/`:**
     - `design/direction-product-engine.md` — **LIVE**: `current.md` cites it as the active compass. Keep as the decision-base's spine, lightly compacted.
     - `design/minimal-ai-pm.md` — the minimal-core design rationale; compact to a lean "why the core is shaped this way" note.
   - **DROP (value spent — git history is the archive):** the 8 `research/*.md` files. They are working research that has already landed in shipped features (automode, review-typology, doc-migration, product-advocate, semgrep/stack-idioms). Their durable value is the code + the CHANGELOG; the raw research is exactly the "bulk swept into `.ai-pm/`" the directive names. If any single decision is still load-bearing and *not* captured in a contract or the CHANGELOG, distil one or two sentences into `docs/decisions/` before dropping — don't relocate the bulk.
   - Net `docs/decisions/`: ~1-2 compact files, human-readable, no raw research dumps.

4. **Downstream-submodule path implication — confirm + express.**
   **Confirmed.** A downstream vendors the protocol at `.ai-pm/tooling/`; today it references `.ai-pm/tooling/adapter/…`. After the move that becomes **`.ai-pm/tooling/src/adapter/…`**. Three places express this convention and must shift together (detailed in Slice B inventory): the deny-hook command path (INSTALL.md + `hooks.json`), the engine/plugin resolution segments, and the `install-plugin` generator's "downstream layout" branch + its byte-identity test. The INSTALL.md "Convention used below" line is the single home for the prose statement of the convention.

5. **Does `PROTOCOL.md` move to `docs/` or stay at root?**
   Recommend **ROOT.** It is the read-first constitution and the entry every harness loads (`CLAUDE.md` `@PROTOCOL.md`, `opencode.json` `instructions: ["PROTOCOL.md"]`, the neutral-prose test surface). `docs/` is *the rest* of the documentation; the constitution is the front door. Moving it would churn the harness load paths for zero clarity gain.

## Target structure

```
docs/                          human-readable documentation, COMPACT, single-home
  architecture.md              (from repo root)
  contracts/                   feature contracts, compact (from .ai-pm/contracts/, 10 files)
  decisions/                   the compacted decision-base (fork 3: ~1-2 files)
src/                           the machinery
  adapter/                     (from root/adapter)
  agents/                      (from root/agents)
  quality/                     (from root/quality)
  modules/                     (from root/modules)
  templates/                   (from root/templates — fork 2)
root:
  PROTOCOL.md  README.md  CHANGELOG.md  LICENSE
  ai-pm.config.json  modules.json  AGENTS.md  CLAUDE.md  .gitignore
.ai-pm/                        TRANSIENT + lean ONLY
  state/current.md  backlog.md  plans/   (active only — already clean)
  reviews/  audits/            run -> DELETED after use (the retention RULE)
```

Note: `modules.json` and `ai-pm.config.json` stay at root (config the engine reads root-relative — `projectConfigured`/`projectProfile` read `ai-pm.config.json` at root; `modules.mjs` reads `modules.json` at `ROOT`). Moving them would add resolution churn for no gain; root config is the convention.

---

## SLICE A — retention discipline + cleanup (lower risk, lead with it)

### A1. The retention RULE (the dogfood — state it once, in PROTOCOL.md)

Extend the existing plan-deletion discipline into a single named rule: **transient pipeline artifacts are deleted after their job is done; the durable record is the commit + CHANGELOG (+ `contracts.md` for a user-facing change), never the stamp.**

Edits (single-home each — no restating):
- **`PROTOCOL.md` `## The loop`, beat 5 (Ship):** the line already deletes the plan file. Broaden it to delete the **review stamp** too, *after* the push/PR step, and add **audits are transient** (a `audit` side-tool run is deleted after its findings land in the backlog/CHANGELOG). One sentence, naming the durable record. This is the rule's single home.
- **`agents/orchestrator.md`:** the Orchestrator owns git + state + deletion. Add one line to its ship procedure pointer (it already deletes the plan) — "and the review stamp, after the push succeeds" — pointing at the PROTOCOL rule, not restating it.
- **`agents/reviewer.md` / `agents/builder.md`:** no change needed (they author the stamp / plan; deletion is the Orchestrator's).

### A2. Sequencing the stamp deletion around the merge-gate (CAREFUL — this is the one real risk in A)

Hard constraint from the engine (`reviewStampSatisfied`, predicate `mergeWithUnstampedReview`, `deny-rules.json` `merge-while-unstamped`):
- The gate fires on **`git merge` OR `git push`** of a `feature/<topic>` branch, and reads `.ai-pm/reviews/<topic>_review.md`. **No file ⇒ stamp not satisfied ⇒ DENY** (fail-closed on the stamp's presence).
- The Orchestrator **pushes at ship** (gate reads the stamp THEN — it must exist). The Operator merges later on GitHub (off-machine — no local gate there).

Therefore the safe deletion point is **AFTER the push + PR-open succeed at ship**, never before:
- The stamp's only mechanical job — gating the push — is done once the push lands. Deleting it then cannot break that push.
- A *re-push* (e.g. an amended commit) after deletion WOULD be re-blocked. Mitigation: the retention rule deletes the stamp as the **final** ship step (push → PR open → delete plan → delete stamp); a re-ship of the same topic re-runs review (invariant 3: a fresh spawn this turn) and re-creates the stamp — which is correct, not a regression.
- **Do NOT change the engine predicate.** The gate stays exactly as-is (presence-checked, fail-closed). Only the Orchestrator's ship procedure changes (delete after, not retain). The `rigor-profile` test asserts the merge-gate floor "never relaxes" — leaving the predicate untouched keeps it green.

### A3. CLEAN the existing pile (value spent — git history is the archive)

- **Delete all 18 `.ai-pm/reviews/*.md`** — every one is a spent stamp for an already-shipped feature; git history keeps them.
- **Delete all 6 `.ai-pm/audits/*.md`** — spent health checks; findings already actioned.
- **`.ai-pm/tmp/wb-review-refs/` (13 files)** — already git-ignored (`.gitignore` lists `.ai-pm/tmp/`); delete the working dir.
- **`.ai-pm/protocol-feedback/` (2 files: `doc-frugality.md` + `_research.md`)** — fold any still-live finding into the backlog, then delete the dir (it is a second graveyard under a different name).
- **Two stale orphan config files** — `.ai-pm/decision-authority.md` and `.ai-pm/review-config.md`: both point at docs that no longer exist (`WORKFLOW.md`, `workflow/review-typology.md`) and are referenced by nothing; their config now lives in `ai-pm.config.json`. **Delete** (superseded — invariant 6).
- **`.ai-pm/state/archive/` (21 files)** — superseded resume pointers. Recommend **delete** (the resume pointer is by definition transient; history is in git + CHANGELOG). If the Operator wants a safety beat, this can be the one dir left for a follow-up — but the dogfood answer is delete.
- **`.ai-pm/research/` + the dropped `.ai-pm/design/`** files — handled by fork 3 (compact the 2 live design files into `docs/decisions/`, drop the 8 research files). NOTE: `docs/decisions/` is created in Slice B (it's part of the `docs/` tree). If A ships first, either (a) defer the design→`docs/decisions/` compaction to B and in A only drop the research, or (b) create `docs/decisions/` early in A. **Recommend (a)** — A is `.ai-pm/` hygiene only; the `docs/` tree is born in B. So in A: drop the 8 research files; leave the 2 live design files in place until B moves+compacts them.

### A4. Slice A Definition of Done

- `PROTOCOL.md` beat 5 states the retention rule once (plan + stamp + audit), naming the durable record.
- Orchestrator ship procedure deletes the stamp as its final step, after push+PR.
- `.ai-pm/` contains only: `state/current.md`, `backlog.md`, `plans/` (active), and the 2 live design files (pending B). `reviews/`, `audits/`, `tmp/`, `protocol-feedback/`, the 2 orphan configs, the 8 research files, and (recommended) `state/archive/` are gone.
- **All build-beat tests green** (`parity`, `install-model`, `install-plugin`, `install-modules`, `rigor-profile`) + `neutral-prose` — A touches no paths they resolve, but run them to prove the merge-gate floor and prose surface are intact.
- The deny hook still fires (smoke: a write into `.ai-pm/tooling/` is still blocked) and a `git push` on a stamped branch is still allowed / unstamped still denied.

---

## SLICE B — physical docs/ + src/ move + FULL path-rewiring (higher risk)

Strategy: **move in chunks, run the full suite after each chunk.** The tests import by path and resolve `ROOT`/`CORE` by file position — a broken path fails a test, so the suite is the safety net. Never move + rewire more than one coherent chunk before re-running `node src/adapter/parity.test.mjs && node src/adapter/install-model.test.mjs && node src/adapter/install-plugin.test.mjs && node src/adapter/install-modules.test.mjs && node src/adapter/rigor-profile.test.mjs && node src/quality/neutral-prose.test.mjs` (paths shown post-move).

### B0. The depth-shift fact that makes this NOT a pure move

Every script that derives the repo root does so by **counting `..` from its own file position**. The move changes that depth by one. Three depth classes:
- **`src/adapter/<platform>/*.mjs`** (install-agents, install-commands, install-plugin, plugin-entry): currently `path.resolve(dirname, "..", "..")` (2 up to root). After move → **3 up** (`"..","..",".."`).
- **`src/adapter/*.test.mjs`** (install-plugin.test, install-modules.test, parity, rigor-profile, opencode-inject) and **`src/quality/*.test.mjs`** (neutral-prose): currently `path.resolve(HERE, "..")` (1 up). After move → **2 up** (`"..",".."`).
- **`src/adapter/claude/shim.mjs`** `loadConfig(dirname(dirname(...)))` and **`src/adapter/engine.mjs`** `loadConfig` default: **self-relative to the adapter dir** — these move CLEANLY (no edit), because they resolve `deny-rules.json` relative to their own location, not the repo root.

### B1. FULL path-rewiring inventory (every reference — group by chunk)

**Chunk 1 — move `architecture.md` → `docs/architecture.md`.** Rewire every textual reference:
- `CLAUDE.md` `## Project kind` mentions `architecture.md`; `AGENTS.md` line 9; `PROTOCOL.md` (names `architecture.md` as a core doc in several places); `README.md`; `adapter/README.md`, `adapter/INSTALL.md`, `adapter/tool-map.json` `_doc`, `architecture.md`'s own self-references; `agents/orchestrator.md` (reads it in Understand beat); `modules.json` `_doc`; the deployed `.opencode/agents/ai-pm.md`. → all become `docs/architecture.md`.
- **`quality/neutral-prose.test.mjs`** surface list includes `"architecture.md"` and computes `CORE = HERE/..` (repo root). After both the test moves to `src/quality/` AND `architecture.md` moves to `docs/`, the surface entry becomes `"docs/architecture.md"` (or the test resolves it relative to the new `CORE`). Update together.

**Chunk 2 — move `agents/` → `src/agents/`.**
- `CLAUDE.md` `@agents/orchestrator.md` → **`@src/agents/orchestrator.md`** (the `@PROTOCOL.md` import stays — PROTOCOL stays at root).
- `install-agents.mjs` (both platforms): `path.join(ROOT, "agents", role+".md")` — `ROOT` now correct after B0 depth-fix, so the `"agents"` segment stays but resolves under the new root (root unchanged; `agents/` is now `src/agents/`). **So this segment must become `path.join(ROOT, "src", "agents", …)`.** (ROOT is still the repo root; the dir under it moved.)
- `neutral-prose.test.mjs` reads `agents/` under `CORE` → `src/agents/`.
- Prose refs: `PROTOCOL.md` (`agents/<role>.md`, "this repo's `agents/`"), `architecture.md` (`agents/` in the core list + the extension-point rows), `AGENTS.md` line 9, `adapter/INSTALL.md` (`agents/<role>.md` neutral body), `adapter/README.md`, `ai-pm.config.json` `_roles`, the `.fm` frontmatter comments, `modules.json` (floor body lives in `agents/<role>.md`). → `src/agents/`.

**Chunk 3 — move `modules/` → `src/modules/` (keep `modules.json` at root).**
- `modules.mjs` `resolveFragmentPath` resolves pointers from `modules.json` against `ROOT` (root-relative). The pointers in `modules.json` are `modules/<id>/<role>.md` → must become **`src/modules/<id>/<role>.md`** (the one home for the pointers is `modules.json`).
- `neutral-prose.test.mjs` `moduleFragments()` reads `CORE/modules` → `CORE/src/modules`.
- Prose: `architecture.md` (`modules/<id>/<role>.md`, `adapter/modules.mjs` assembler), `modules.json` `_doc`, `current.md` (compass mentions `modules/<id>/<role>.md` — but current.md is transient state; update on next write, low-stakes).

**Chunk 4 — move `quality/` → `src/quality/`.**
- `quality/tools.json` `run` commands: `node adapter/parity.test.mjs` → **`node src/adapter/parity.test.mjs`** (×5 adapter tests) and `node quality/neutral-prose.test.mjs` → `node src/quality/neutral-prose.test.mjs`.
- `neutral-prose.test.mjs` depth-fix (B0 class 2: `HERE/..` → `HERE/../..`) AND its surface entries that are now root-relative-from-a-deeper-dir.
- Prose: `PROTOCOL.md` (`## Quality tools` names `quality/`, `tools.json`), `architecture.md`, `CLAUDE.md`/`AGENTS.md` ("the `quality/` checks"), `adapter/README.md`.

**Chunk 5 — move `templates/` → `src/templates/` (fork 2).**
- `templates/README.md`, `templates/contracts.md` self-refs; `CLAUDE.md` ("the `templates/` + `quality/` scaffolding"); any installer that copies templates (grep `templates/` in `adapter/`); `architecture.md` if it names templates. → `src/templates/`.

**Chunk 6 — move `adapter/` → `src/adapter/` (the deepest rewiring; do LAST, it's the enforcement core).**
- **Live deny hook — TWO files, must match:**
  - `.claude/settings.json` (deployed, this repo): `node "$CLAUDE_PROJECT_DIR/adapter/claude/shim.mjs"` (×2 hooks) → `…/src/adapter/claude/shim.mjs`.
  - `adapter/claude/hooks.json` (the source template merged into downstream `.claude/settings.json`): `node "$CLAUDE_PROJECT_DIR/.ai-pm/tooling/adapter/claude/shim.mjs"` (×2) → `…/.ai-pm/tooling/src/adapter/claude/shim.mjs` (downstream convention — fork 4).
- **`adapter/INSTALL.md`** — the single home for wiring. Update: the "Convention used below" line (`.ai-pm/tooling/adapter/` → `.ai-pm/tooling/src/adapter/`); the two hook-command snippets; every `node adapter/<platform>/install-*.mjs` command → `node src/adapter/…`.
- **`adapter/tool-map.json`** `apply-config` commands (`node adapter/claude/install-agents.mjs`, etc., ×3) → `node src/adapter/…`; the `_doc` strings naming the in-repo `adapter/` path and the downstream `.ai-pm/tooling/adapter/` path; the `models._note` INSTALL.md pointer.
- **Depth-fix (B0 class 1, 3-up)** in: `claude/install-agents.mjs`, `claude/install-commands.mjs`, `opencode/install-agents.mjs`, `opencode/install-commands.mjs`, `opencode/install-plugin.mjs` (`ROOT`), `opencode/plugin-entry.mjs` (`ADAPTER` resolve). For the install-* scripts, the `ROOT` becomes correct again — BUT the segments that name moved dirs under ROOT must add `"src"`: `path.join(ROOT,"agents")`→`(ROOT,"src","agents")`, etc. (covered per-chunk above; do them when each dir moves, and re-verify here).
- **Depth-fix (B0 class 2, 2-up)** in: `parity.test.mjs`, `install-modules.test.mjs`, `install-plugin.test.mjs`, `rigor-profile.test.mjs`, `opencode-inject.test.mjs` (`ROOT = HERE/..` → `HERE/../..`).
- **The deployed OpenCode plugin + its generator + its byte-identity test (the trickiest — three files in lockstep):**
  - `adapter/opencode/plugin-entry.mjs` imports `../../.ai-pm/tooling/adapter/engine.mjs` + `…/opencode/normalise.mjs` (downstream layout, 2-up from `adapter/opencode/`). After move to `src/adapter/opencode/` these become `../../../.ai-pm/tooling/src/adapter/engine.mjs` (3-up; the source carries the DOWNSTREAM path).
  - `adapter/opencode/install-plugin.mjs` `resolveRewrite` dev branch literals: `"../../adapter"` → the deployed-file-relative dev path. The deployed file is at `.opencode/plugins/ai-pm.mjs` (2-up to root + `src/adapter` = `../../src/adapter`); and `SOURCE_RESOLVE_SEGS` / the `'"..", "..", "adapter"'` segment string → `'"..", "..", "src", "adapter"'`. Also `resolveRewrite`'s `fs.existsSync(path.join(root,".ai-pm","tooling","adapter"))` and `(root,"adapter")` detection paths → `…"src","adapter"`.
  - `.opencode/plugins/ai-pm.mjs` (deployed) imports `../../adapter/engine.mjs` → regenerated to `../../src/adapter/engine.mjs`. **Regenerate, don't hand-edit** (`node src/adapter/opencode/install-plugin.mjs`).
  - `adapter/install-plugin.test.mjs` expected strings (byte-identity guard): `'from "../../adapter/engine.mjs"'` → `'from "../../src/adapter/engine.mjs"'`; the downstream-layout expectation `'from "../../.ai-pm/tooling/adapter/engine.mjs"'` → `…/tooling/src/adapter/…`; the resolve-segs `'".ai-pm", "tooling", "adapter"'` → `…,"tooling","src","adapter"`; and `ROOT = HERE/..` depth-fix. **All four (entry, generator, deployed, test) move as ONE chunk** or the byte-identity test fails — that failure IS the safety net.
- **Engine `loadConfig` / shim `loadConfig` self-relative** — no edit (B0).
- **`adapter/engine.mjs` `_doc` in deny-rules.json** mentions `adapter/engine.js` — prose, update to `src/adapter/engine.mjs` (also a stale `.js`/`.mjs` typo — fix in passing, single-home).
- **`adapter/README.md`, `adapter/deny-rules.json` `_doc`, the `.fm` files, `setup.body.md`** — grep for `adapter/` self-refs and `agents/`/`modules/` refs; update.
- **Re-run all installers after the move** so the deployed `.claude/agents/`, `.opencode/agents/`, `.opencode/commands/`, `.opencode/plugins/ai-pm.mjs` are regenerated from the moved sources (they embed comments naming `adapter/…` paths). Verify the deployed files are byte-identical to a fresh generate (the install-plugin test enforces this for the plugin).

**Chunk 7 — create `docs/contracts/` + `docs/decisions/` (the documentation move, fork 3).**
- Move `.ai-pm/contracts/*.md` (10) → `docs/contracts/`, **compacting** each (they are ~5 KB each — trim to the compact contract shape; don't relocate bulk).
- Compact the 2 live `.ai-pm/design/*.md` → `docs/decisions/` (fork 3); the 8 research files were dropped in A3.
- Rewire refs: `current.md` cites `.ai-pm/design/direction-product-engine.md` → `docs/decisions/…`; `PROTOCOL.md` references `contracts.md` (the user-facing durable record) — confirm it points at the `docs/contracts/` convention or the template; `templates/contracts.md` is the *template*, distinct from `docs/contracts/` instances. The **merge-gate engine path** (`.ai-pm/reviews/…`) is UNAFFECTED — reviews stay in `.ai-pm/` (transient), only contracts/decisions move to `docs/`.

### B2. Slice B Definition of Done

- Directory layout matches the target tree; root holds only constitution + repo-standard + the two root configs.
- **Every reference in the B1 inventory is rewired**; a repo-wide `grep -rn 'adapter/\|/agents/\|/modules/\|quality/\|architecture\.md\|/templates/'` (excluding `.git`, `CHANGELOG`, `node_modules`) shows no stale root-relative path.
- **All build-beat tests green from their new `src/` paths**, run after EACH chunk and once at the end: `parity`, `install-model`, `install-plugin` (byte-identity — proves source⇆deployed lockstep), `install-modules`, `rigor-profile`, `neutral-prose`.
- **Live enforcement smoke-verified:** the Claude hook still fires from `src/adapter/claude/shim.mjs` (a write outside root / into `.ai-pm/tooling/` is blocked); the OpenCode deployed plugin still loads and blocks (re-generated import path resolves); the merge-gate still allows a stamped push and denies an unstamped one.
- **Deployed artifacts regenerated** (`.claude/agents/`, `.opencode/agents/`, `.opencode/commands/`, `.opencode/plugins/ai-pm.mjs`) from the moved sources, byte-identical to a fresh install run.
- **Downstream convention documented once** in `adapter/INSTALL.md` (`.ai-pm/tooling/src/adapter/…`); the hook, the engine/plugin resolution, and the generator's downstream branch all express it consistently.
- `docs/contracts/` + `docs/decisions/` are **compact + human-readable** (dogfood pillar 3) — not relocated bulk.

## Product questions

Not a user-facing product change (this is the protocol's own source). The "user" is the engineer reading the repo and the downstream installer. Success state: a reader opens the repo and finds docs in `docs/`, machinery in `src/`, the constitution at root, and `.ai-pm/` lean. Error state to avoid: a broken hook/gate (covered by the test net + smoke checks). No irreversible step — git history retains everything dropped.

## Security surface (threat-model: rich enumeration)

This change relocates the **enforcement core** and changes a **retention rule** — so it touches trust boundaries even though it adds no new input.

- **Attack surface.** No new input/endpoint/parser. The move must not weaken the existing boundary checks. Threat: a depth-fix error makes `ROOT` resolve to the wrong dir, so `isInsideRoot` / boundary denies evaluate against the wrong root and **fail open**. Mitigation: the depth-fix is exercised by `parity` + `rigor-profile` (boundary + truncation + merge-gate fixtures) — run after every chunk; plus the live-deny smoke check (`src/adapter/claude/shim.mjs` blocks a write into `.ai-pm/tooling/`). Closed at: `src/adapter/engine.mjs` `isInsideRoot` (unchanged logic), guarded by `src/adapter/parity.test.mjs`.
- **Trust boundaries — the merge-gate (the one live risk).** The retention rule deletes the review stamp. Threat: deleting it **before** a push leaves the gate reading a missing file ⇒ DENY a legitimate push (fail-closed annoyance) OR, worse, a sequencing change that makes the gate read a *stale* stamp and **allow an unreviewed push**. Mitigation: the engine predicate `mergeWithUnstampedReview` is **NOT touched** — it stays presence-checked + fail-closed; only the Orchestrator's *ship ordering* changes (delete strictly AFTER push+PR succeed). The stamp must exist at push time; a re-push re-blocks until re-review (correct). Closed at: `src/adapter/engine.mjs` `reviewStampSatisfied` (unchanged) + `agents/orchestrator.md` ship-step ordering; guarded by `src/adapter/rigor-profile.test.mjs` ("merge-gate floor never relaxes").
- **Injection / unsafe ops.** No shell/SQL/path construction from tainted input added. The deny-hook command strings in `.claude/settings.json` / `hooks.json` are static, quoted (`"$CLAUDE_PROJECT_DIR/…"`). Threat: a typo in the rewired hook path silently disables the hook (fail-open enforcement). Mitigation: live-deny smoke check after Chunk 6 — a blocked write must still be blocked.
- **Fail-open vs fail-closed.** Every relocated check must keep its current bias. The merge-gate is fail-closed on stamp presence (kept). The actor-content rule is fail-open-on-actor (kept — Claude capability gap, unchanged). No error path is loosened by this move.
- **Secrets & credentials.** None read/written/logged by this change. `.gitignore` already covers `.ai-pm/tmp/`; deleting it touches no secret.
- **Supply chain.** No new dependency. The deployed OpenCode plugin stays **generated, not hand-copied** (byte-identity test) — a relocation must not introduce a hand-edited deployed file that could drift from the audited source.
- **Data & privacy.** Dropped reviews/audits/research contain only this repo's own design notes; git history retains them; no PII.

## Docs touched (single-home each)

- `PROTOCOL.md` — beat 5 retention rule (the rule's one home); the `architecture.md`/`agents/`/`quality/`/`contracts.md` path mentions.
- `adapter/INSTALL.md` → `src/adapter/INSTALL.md` — the wiring single-home (hook paths, install commands, downstream convention).
- `architecture.md` → `docs/architecture.md` — the mental model + extension-point path rows.
- `agents/orchestrator.md` — ship-step stamp deletion (pointer to the PROTOCOL rule).
- `CLAUDE.md`, `AGENTS.md`, `README.md` — the structure description + `@`-imports.
- `docs/contracts/`, `docs/decisions/` — compacted, born in Chunk 7.

## Test / safety strategy (the safety net)

1. **Run the full build-beat suite after EVERY move-chunk**, not just at the end. A broken path fails a test (tests import by path / resolve ROOT by position). The `install-plugin` byte-identity test is the lockstep guard for the entry⇆generator⇆deployed trio.
2. **Live-deny smoke after Chunk 6:** confirm the Claude hook (`src/adapter/claude/shim.mjs`) and OpenCode plugin still block a write into `.ai-pm/tooling/`.
3. **Merge-gate smoke (Slice A + after Chunk 7):** a stamped `feature/<topic>` push is allowed; an unstamped one is denied — proving the relocation/retention change didn't open the gate.
4. **Regenerate-then-diff:** after the adapter move, re-run all installers; the deployed `.claude/` + `.opencode/` files must be byte-identical to a fresh generate (no stale embedded paths).
5. **Each move = an atomic, one-purpose commit boundary** for the Orchestrator (e.g. "move architecture.md → docs/ + rewire refs", "move adapter/ → src/adapter/ + depth-fix + regenerate"). Hand back on green only.

## Definition of Done (overall)

Slice A DoD (§A4) + Slice B DoD (§B2), both green, with the live hook + merge-gate verified at each risky step, and `docs/`/`src/`/lean-`.ai-pm/` matching the target tree — the restructure exemplifying the single-home, no-graveyard, compact-documentation discipline the protocol enforces.
