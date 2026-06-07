# OpenCode harness support — design notes (NARROWED: form C is fixed)

> **Scope of this note.** The A/B/C sync-mechanism choice is **DECIDED = form C** (build-time
> single-source, two-repo source/dist split) per the pass-4 PM decision in
> `doc/features/opencode-harness-support_plan.md` § "Key design decisions". This note does **not**
> re-litigate A/B/C. Its job is the four C-internal consequence problems the plan hands off so the
> groundwork slice (built on the integration branch `feature/opencode-harness-support`, treated as a
> local `main` with no remote per the git-flow override in `.ai-pm/state/current.md`) does not paint
> the later repo-split into a corner. The options-with-trade-offs below weigh **C-internal**
> alternatives on their merits, not A vs B vs C.
>
> **Nothing here is approved. The feature stays PARKED.** Where a decision genuinely needs the PM's
> new-repo target before it can finalize, it is recorded as an Open question, not invented.

## Context

What the plan adds: a second supported harness (OpenCode `.opencode/` alongside Claude Code
`.claude/`) realized by form C — one authored **neutral source** (a harness-neutral metalanguage core
+ a generator), with CI building the two full per-harness adapters and publishing them to a
**distribution repo** that downstream consumes via submodule. The topology is an **identity
inversion**: the current repo (`ai-pm-protocol`, the only repo today, holding the entire development
surface) becomes the lean **distribution** repo (built adapters only, downstream submodule URL
unchanged); a **new repo** (PM names later) becomes the **source** repo (neutral source + generator +
all dev artifacts).

Why it has structural choices left after C is fixed: form C decides *that* there is a build and *that*
source and dist split into two repos — but it leaves four genuine forks the plan explicitly hands to
this note (plan § "Key design decisions" → "newly-surfaced problems" + the four narrowed jobs):

1. **Dogfood / self-host loop after the split** — after extraction the edited thing (source) and the
   running thing (compiled `.claude/`) live in different repos; the immediacy of today's
   "edit = run" plain-Markdown model (`doc/architecture.md` § "Agents are plain Markdown files, not
   compiled artefacts") is at stake.
2. **CI topology + artifact-push + version-sync** — how the source repo's CI builds and publishes to
   dist, the cross-repo credential, the matched-version-tag scheme, the split-brain guard, and the
   build-time source↔dist in-sync check.
3. **What moves to source vs stays as dist** (the identity-inversion work item) — the concrete map the
   later extraction follows.
4. **Migration-on-branch-then-extract sequencing** — build/validate on the branch first, extract
   later (gated on the PM's repo target); the safe order, the mechanical cut-over, the point of no
   return, reversibility.

Existing code/structure this shape touches (read, not assumed): the `@`-import chain
(`CLAUDE.md` → `@WORKFLOW.md` → on-demand `workflow/*.md`, `doc/architecture.md` § "WORKFLOW.md
imported via @"); the symlink delivery of agents/commands/settings (`doc/architecture.md`
§ "Settings.json delivered via symlink, not copy" + § "Integration contract"); the release CI
(`.github/workflows/auto-tag.yml`, CHANGELOG-driven, per `doc/architecture.md` § "Release flow"); the
hook test `tests/hooks.sh`; and the submodule data model (`doc/stack-notes.md` § "git": downstream
`git submodule update` runs **no build hooks**, so dist **must** ship pre-built plain files).

## Adjacent implementations

There is no pre-existing in-repo "generator" or "two-repo split" to copy — this is the first build
step the protocol introduces (the deliberately-changed "no build step" decision). So the adjacent
patterns are the protocol's own **single-source-of-truth + reference-don't-duplicate** mechanisms and
its **submodule delivery** mechanics, which the form-C design must stay symmetric with:

1. **Submodule delivery** — `doc/architecture.md` § "Integration contract" + `doc/stack-notes.md`
   § "git". Dispatch: downstream gets agents/commands/settings as **symlinks into the submodule** and
   `WORKFLOW.md` via an **`@`-import line**; a `git submodule update --remote` propagates everything
   with **no downstream build**. The load-bearing fact for jobs 2 + 3: the dist repo is what the
   submodule points at, and the submodule update runs no hooks — so **every file downstream loads must
   already be a finished plain file in dist**.
2. **Generated-not-hand-filled artifact precedent** — `doc/architecture.md` § "Contract-centric
   product map" + the `## Product map generation procedure`. `docs/product-map.md` is **generated
   wholesale from source, never hand-filled**, and an old-format map is **detected and offered a
   regenerate**. This is the in-protocol precedent for "the adapter is a build product, the source is
   the only authored copy" and for the `single-source-diff-clean` integrity check (regenerate →
   compare → fail on divergence).
3. **Reference-don't-duplicate, ID-keyed, one-way** — `doc/architecture.md` § "Threat-model … threat
   → constraint wiring is one-way and ID-keyed" and § "Migration catalogue … single-source-of-
   conditions". The neutral-source **harness-neutral vocabulary layer** (neutral capability name →
   each harness's primitive, plan scenario 2) is the same discipline: a capability is named **once**
   neutrally and the generator **resolves** it per harness; no body is hand-duplicated.

## Behavioral risks in this area

Form C is not event-driven code, but it has two feedback surfaces that bite if the design is naive:

- **Dogfood feedback loop (job 1).** After the split, "I edit the protocol that runs me" becomes "I
  edit source in repo X, but the session executing me loads compiled `.claude/` from repo Y." If the
  loop is not closed deliberately, an edit to a `pm-*` body or a `workflow/*.md` rule **does not take
  effect in the editing session** — the protocol would stop being able to develop itself under its own
  protocol. This is the first-class criterion, not an afterthought (plan, explicitly).
- **Split-brain feedback (job 2).** A half-failed publish (source tag advanced, dist not, or vice
  versa) leaves downstream `git submodule update --remote` pulling a dist that does not correspond to
  any consistent source — and because the build ran in source, the divergence is invisible at the dist
  repo unless a guard catches it. The integrity must be checked **at build time in source** and the
  **version tags matched across the two repos**, because there is no downstream build to re-derive
  anything.

---

## Job 1 — Dogfood / self-host loop after the split

**The criterion.** Today the loop is maximally immediate: `doc/architecture.md` § "Agents are plain
Markdown files" — edit `.claude/agents/pm-architect.md`, the next session loads it. **edit = run, zero
latency, zero ceremony.** Form C deliberately trades some of this away (the "no build step" amendment
preserves only the *downstream* "no build" guarantee, not the dev-side immediacy). The job is to pick
the **least-immediacy-loss** way to keep the protocol self-hostable after source and dist live apart.

### Option A — Build-then-run locally in the source repo (source builds its own runnable `.claude/`)

The source repo's local dev flow runs the generator on each change (or on a watch) to emit a runnable
`.claude/` (and `.opencode/`) **into the source working tree, git-ignored**, and the Claude session
dogfooding the protocol runs against that locally-built adapter. Dist is only ever produced by CI.

- **Where:** generator + a thin `make dev` / watch target in the source repo; built adapter is a
  git-ignored local artifact (it is *not* committed to source — source stays clean-source-only, the
  whole reason C beat B).
- **Pros:** single repo to edit and run in; no cross-repo round-trip; the built `.claude/` is always
  exactly the current source (no staleness window); reproduces today's "everything in one place"
  ergonomics minus the regenerate step. No dependency on dist being published to dogfood.
- **Cons:** introduces **regenerate-before-test** — the edit→run latency the plain-Markdown design
  eliminated comes back as a build step (mitigated, not removed, by a watch/`make dev`). Requires the
  generator to be fast and the local build to be trivially reproducible. The git-ignored built tree is
  a "is this generated?" surface inside the otherwise-clean source repo (smaller than B's problem
  because it is ignored, not committed).
- **Risks:** if the local build silently diverges from the CI build, you dogfood something CI never
  ships — must be the *same generator, same inputs* locally and in CI (shared build entrypoint, no
  fork).

### Option B — Pull the compiled artifacts back into source as a submodule (source consumes dist)

The source repo adds the **dist repo as its own `.ai-pm/tooling` submodule** and dogfoods against the
**published** compiled adapter, exactly as any downstream project does — the protocol becomes a
downstream consumer of itself.

- **Where:** source repo carries dist as a submodule; dogfood session loads the submodule's
  `.claude/`.
- **Pros:** the protocol dogfoods the **real published artifact** — maximum fidelity to what consumers
  get; zero special-case (source uses the exact downstream install path, the strongest possible test
  of the delivery contract).
- **Cons:** **the loop is broken for immediacy** — to dogfood a source change you must (1) edit, (2)
  push/build via CI, (3) publish to dist, (4) `submodule update --remote` back into source, (5) run.
  A multi-minute, multi-repo, network-dependent round-trip per iteration. Worse than B-the-rejected-
  one-repo form on the dev loop. Cannot dogfood an un-pushed local edit at all.
- **Risks:** every protocol-development iteration now depends on CI being green and the cross-repo
  credential working; a CI outage stops protocol development, not just publishing.

### Option C (hybrid, recommended) — Local build-then-run for the dev loop; dist-submodule pull only for release-fidelity checks

Default dev loop = **Option A** (local build-then-run, immediate). **Additionally**, a periodic /
pre-release **fidelity check** does Option B's pull (source adds dist as a submodule **only** to assert
"the published dist adapter byte-equals a fresh local build" — the same `single-source-diff-clean`
check, run cross-repo). The everyday loop keeps A's immediacy; B's fidelity is recovered as an
explicit gate, not paid on every edit.

- **Pros:** keeps edit→(fast build)→run for daily work; still proves source-equals-published before a
  release; the fidelity check **is** the cross-repo half of job 2's in-sync guard, so jobs 1 and 2
  share one mechanism rather than two.
- **Cons:** two modes to understand (local-build dev vs pull-dist check) — but they are
  cleanly separated (dev vs release-gate), not interleaved.
- **Risks:** the team must actually run the fidelity check before release; if skipped, A's local-build
  divergence risk returns. Make it a CI gate, not a manual step (see job 2).

### Recommendation (job 1)

**Option C (hybrid).** Daily dogfood is **local build-then-run** (A) — it preserves the most of the
plain-Markdown immediacy that the protocol's self-development depends on, at the cost of one
**regenerate-before-test** step (made cheap by a watch / `make dev` target and a deliberately *thin*
generator — see "Also covered"). The **release-fidelity pull** (B, source-adds-dist-as-submodule, run
only as a pre-publish gate) recovers full published-artifact fidelity without paying B's per-edit
round-trip, and it doubles as job 2's cross-repo in-sync check. Pure B is rejected for the dev loop:
its multi-repo, CI-dependent, network-bound round-trip per iteration would cripple the very
self-development the dogfood exists to enable. The regenerate-before-test cost is real and is the
**accepted price** of form C — record it in the architecture amendment as the named, conscious
trade-off (the dev side gains a build step; the downstream side keeps "no build").

---

## Job 2 — CI topology + artifact-push + version-sync + split-brain guard

The mechanics that build in source and publish to dist, keeping a downstream
`git submodule update --remote` always pulling a consistent source↔dist set. **Load-bearing
constraint** (`doc/stack-notes.md` § "git"): the downstream submodule update runs **no build hooks**,
so **dist must ship the finished plain files** — all building happens in source's CI before publish.

### Build trigger
- Source repo CI (`.github/workflows/`) runs the generator on every push to source's `main` (and on
  PRs, as a check). The build produces both full adapters + runs the integrity check (below).

### Publish step
- On a tagged release of source (CHANGELOG-driven tag, reusing the protocol's existing
  `auto-tag.yml` shape from `doc/architecture.md` § "Release flow"), CI generates the adapters and
  **pushes the built tree to the dist repo** (the current repo, downstream's submodule URL unchanged).
  Dist receives a commit containing only the built `.claude/` + `.opencode/` + the downstream-facing
  surface (see job 3), then CI tags dist with the **matching version**.

### Cross-repo write credential
- Source CI needs **write access to the dist repo** — a scoped deploy key or a fine-grained PAT /
  GitHub App installation token limited to the dist repo's contents. This is the (i) operational cost
  the PM already accepted (plan § "operational cost of C"). The credential is the new attack/ops
  surface; scope it to the single dist repo, contents-write only. **(Open question: the exact
  credential mechanism — deploy key vs App — depends on the PM's new-repo host/org choice.)**

### Matched-version-tag scheme
- **One version, two tags.** A release version `vX.Y.Z` is tagged on **both** source (the commit that
  built it) and dist (the commit that received the build). The version is the **single coordination
  token**: a downstream `submodule update --remote` lands on a dist `vX.Y.Z` that corresponds
  one-to-one to a source `vX.Y.Z`. Reuse the protocol's existing CHANGELOG-as-single-source-of-version
  mechanism — the CHANGELOG lives in **source** (it is a dev artifact, see job 3); CI propagates the
  version to the dist tag at publish.

### Split-brain guard (publish half-fails)
The publish is a two-write operation (push-to-dist, then tag-both) and can half-fail: source tagged but
dist push failed, or dist pushed but its tag missing. Guard:
- **Publish-then-tag ordering with a verify step.** CI (1) pushes the built tree to dist, (2) verifies
  the dist push landed (`gh`/`git ls-remote` the dist ref), (3) **only then** tags both repos with
  `vX.Y.Z`. If step 2 fails, the source tag is **not** created → no version claims to exist that dist
  cannot serve. The version tag is the *commit* of a successful publish, not its precondition.
- **The dist tag is the readiness signal.** Downstream tracks the dist tag; a half-published version
  has no dist tag, so `submodule update --remote` to a pinned `vX.Y.Z` cannot resolve to an
  inconsistent set. A floating (non-pinned) update could in principle catch a mid-publish dist `main`;
  mitigate by making CI push the built tree and the dist tag in a way where the tag is the last write,
  and recommend downstream pin to tags (already the protocol's `chore: bump … to <sha>` discipline,
  `doc/architecture.md` § "Integration contract").
- **A failed publish is loud + idempotent-retryable.** CI fails visibly; re-running the publish for
  the same version reproduces the same built tree (deterministic generator) and converges — never a
  partial second state. Mirrors `auto-tag.yml`'s existing idempotency (`doc/architecture.md`
  § "Release flow": pushing the same `main` twice does not double-tag).

### CI source↔dist diff-clean / in-sync check (build-time analogue of single-source integrity)
- **In-source build-time check** (`single-source-diff-clean`, plan Test plan): regenerate the adapters
  from the neutral source and assert the working tree is diff-clean — fails on a hand-edit to a
  generated file or a stale build. This runs in source CI on every push, **before** publish.
- **Cross-repo fidelity check** (job 1 Option C's pull, promoted to a CI gate): regenerate from source
  at `vX.Y.Z` and assert **byte-equality with the dist repo's published `vX.Y.Z` tree**. This is the
  post-publish proof that what dist serves is exactly what source built — the cross-repo half of
  single-source integrity. A mismatch here is a hard release-blocking failure.

> **Note:** the *live* behaviour of all of the above is **post-extraction** (there is no second repo
> yet). On the integration branch the build, the in-source `single-source-diff-clean`, and the
> `source-dist-version-match` **form** check (plan Test plan) all run **within the one repo** against a
> simulated dist surface. The cross-repo credential, the actual push, and the live split-brain path
> are wired only at extraction (job 4).

---

## Job 3 — What moves to source vs stays as dist (the identity-inversion map)

This is the map the later extraction follows. Today the current repo holds the **entire development
surface**; under C it becomes the **lean dist** repo. The governing rule: **dist contains exactly what
a downstream submodule consumer loads, build-free, and nothing else; everything that is authored,
developed, or only useful to protocol developers moves to source.** Grounded in the real tree
(`git ls-tree HEAD`: `.ai-pm/`, `.claude/`, `.github/`, `.gitignore`, `CHANGELOG.md`, `CLAUDE.md`,
`LICENSE`, `MIGRATIONS.md`, `README.md`, `WORKFLOW.md`, `doc/`, `tests/`, `workflow/`) and the
delivered-surface list in `doc/architecture.md` § "File layout" + § "Integration contract".

### MOVES to the new SOURCE repo (authored source + generator + all dev artifacts)
| Path | Why source |
|---|---|
| **The neutral source** (new) — neutral bodies of every `pm-*` agent/command, `WORKFLOW.md`, `workflow/*.md`, `doc/_templates/*`, expressed once in the harness-neutral metalanguage | This is the single authored copy; the whole point of source. |
| **The generator** (new) — code that resolves neutral capability names → each harness's primitive and emits both adapters | Build tool; never shipped to downstream. |
| `.ai-pm/` (arch, audits, research, reviews, state, backlog) | Development bookkeeping — never delivered downstream (already absent from the delivered surface per `doc/architecture.md` § "File layout": these exist "in downstream projects only", i.e. the template repo's own `.ai-pm/` is dev-only). |
| `doc/features/` | Plans/reviews/audits for the protocol's own development — pure dev artifact. |
| `doc/architecture.md`, `doc/stack-notes.md` | The protocol's **own** architecture/stack docs (dogfood dev docs), not downstream-delivered. |
| `tests/hooks.sh` + `.github/workflows/lint-hooks.yml` | Tests the *generated* adapter's hook regexes; the test is a dev/CI concern that runs in source against the build output (see job 4 note). |
| `CHANGELOG.md` | The version single-source drives source's release CI; the version is propagated to the dist tag at publish (job 2). |
| `.github/workflows/auto-tag.yml` (evolved) | Becomes the **source** repo's build+publish CI. |
| `CLAUDE.md` (the dogfood entry, `## Project kind: software`, `@WORKFLOW.md`) | The self-host entry point lives where the protocol is *developed* — source. The dogfood session runs against the locally-built adapter (job 1 Option C). |

### STAYS as DIST (the generated adapters + downstream-consumer surface)
| Path | Why dist |
|---|---|
| **Built `.claude/`** (agents, commands, `settings.json`) — generated | The downstream Claude path loads these via symlink; must be finished plain files (`doc/architecture.md` § "Integration contract"). Byte-equivalent to today's committed `.claude/` (plan scenario 3). |
| **Built `.opencode/`** (agent, command, plugin, skill, `opencode.json`) — generated | The downstream OpenCode path; self-contained, no `.claude/` cross-read (symmetry decision). |
| **Generated `WORKFLOW.md`** + **`workflow/*.md`** (the harness-neutral delivered core the `@`-import and `instructions` array point at) | Downstream loads these build-free via `@`-import (Claude) / `instructions` array (OpenCode). The neutral *source* of these lives in source; the **rendered** delivered copy is a build product in dist. |
| **`AGENTS.md`** (generated) — OpenCode entry surface with the preview label + supported-harness declaration | Downstream OpenCode entry file; a build product. |
| `MIGRATIONS.md` | Referenced by **bare filename** from downstream at `.ai-pm/tooling/MIGRATIONS.md` (`doc/architecture.md` § "Migration catalogue") — a downstream-consumed file → dist. **(See ambiguity note: it is consumed downstream but authored in dev; recommend dist with source as the authored origin.)** |
| `LICENSE` | Ships with the consumed artifact. |
| `.gitignore` | Dist's own ignore set (built-tree housekeeping). |

### Ambiguous — flagged, with a recommended home + one-line reason
| Path | Recommendation | Reason |
|---|---|---|
| `README.md` | **Dist** (front door downstream reads at the submodule URL) — but **authored in source** and rendered/copied to dist at build | It is both the public front door (consumer-visible) **and** carries dev-marketing; the consumer-facing copy is what dist must ship. Authoring stays a source concern; the generator copies/renders it to dist. (`pm-architect` is the README front-door owner — authored side lives in source.) |
| `MIGRATIONS.md` | **Dist** (downstream reads it via submodule) with the **authored origin in source** | Same shape as README: downstream-consumed (so dist) but a dev-authored reference (so source authors it, build publishes it). The bare-filename reference resolves in dist's `.ai-pm/tooling/` exactly as today. |
| `doc/_templates/*` (incl. `starters/`) | **Both, by role** — the **neutral source** of each template lives in source; the **rendered** `.tmpl` files `/pm-bootstrap` reads at `.ai-pm/tooling/doc/_templates/` ship in **dist** | `/pm-bootstrap` reads these downstream from the submodule (`doc/architecture.md` § "Integration contract" point 4), so the consumed copy must be in dist; if a template carries harness-specific content it is generated, else it is a straight copy. |
| `CHANGELOG.md` | **Source** (drives release CI), **version surfaced into dist** at publish | The full changelog is a dev artifact; downstream only needs the version (carried by the dist tag). If downstream wants release notes, dist's GitHub Releases (created from source's CHANGELOG section, `auto-tag.yml` shape) serve them. |
| `tests/hooks.sh` | **Source** (runs against the build output in source CI) | It validates the *generated* `.claude/settings.json`; it is a build-time guard, not a downstream-delivered file. **(Open question: should a copy ship in dist so a downstream could re-run it? Recommend no — downstream gets finished files, not a test harness; revisit only if a downstream asks to self-verify.)** |

> **The center-of-gravity observation (plan, restated as a design fact):** the **bulk of the current
> repo moves to source** — `.ai-pm/`, `doc/features/`, the protocol's own `doc/architecture.md` +
> `doc/stack-notes.md`, `tests/`, `CHANGELOG.md`, the dogfood `CLAUDE.md`, and the new neutral source +
> generator. Dist is left **lean**: built `.claude/` + built `.opencode/` + rendered `WORKFLOW.md` /
> `workflow/*.md` + `AGENTS.md` + `README.md` + `MIGRATIONS.md` + rendered `doc/_templates/` + `LICENSE`
> + `.gitignore`. This is an inversion, not an extraction: the repo that *was* "everything" becomes
> "the delivered build output only".

---

## Job 4 — Migration-on-branch-then-extract sequencing

Per the git-flow override (`.ai-pm/state/current.md`): all groundwork is built **on the integration
branch `feature/opencode-harness-support`** (treated as a local `main`, **no remote, no PR, no merge to
the repo's real `main`**), via sub-branches merged back into the integration branch. Extraction into
the new source repo is a **later, PM-gated** step. The safe order:

### Stage (a) — built and validated on the integration branch, in the current repo (this slice)
1. **Author the neutral source** — carve the harness-neutral bodies + the harness-neutral vocabulary
   layer (neutral capability names) out of the current `pm-*` / `WORKFLOW.md` / `workflow/*.md` /
   `doc/_templates/*`. Source is the single authored copy from here on.
2. **Build the generator** — neutral source → both full adapters (`.claude/` + `.opencode/`), resolving
   each neutral capability to the target harness's primitive (Claude `@`-import / `settings.json`
   hooks / comma-list `tools` vs OpenCode `instructions` array / TS-plugin throw / `tools`-object;
   per `doc/stack-notes.md` § "OpenCode").
3. **Generate both adapters into the working tree** and wire the integrity checks:
   - `generated-claude-adapter-byte-equivalent` — the generated `.claude/` byte-equals today's
     committed `.claude/` (the byte-equivalent guarantee, plan scenario 3 / Test plan).
   - `single-source-diff-clean` — regenerate → diff-clean (in-repo, since there is no dist yet).
   - `opencode-adapter-self-contained` — no `.opencode/` file references a `.claude/` path.
   - `tests/hooks.sh` green at current count against the generated `.claude/settings.json`.
4. **Validate the dogfood loop in its pre-split form.** *On the branch, before extraction, dogfood
   still works the old way* — the generated `.claude/` sits right here, so an edit-source →
   regenerate → run loop (job 1 Option A) is exercisable **in one repo**. This de-risks job 1's
   local-build mechanism **before** the split makes it mandatory. **This is the key sequencing
   property: the loop change does not bite until extraction, so job 1's mechanism is proven on the
   branch first.**
5. **Stub the dist-facing surface in-repo** — assemble the would-be dist tree (job 3's STAYS list) so
   the `source-dist-version-match` **form** check and the move-map are concrete before any second repo
   exists.

Everything in stage (a) is **fully reversible** — it is local commits on a branch that never touches
the real `main`. Abandoning the branch loses no shipped state.

### Stage (b) — extraction (LATER, gated on the PM's new-repo target)
Mechanically, once the PM provides the target repo:
1. **Create the new source repo**; move the job-3 MOVES set into it. To **preserve history**, prefer
   `git filter-repo` (or `git subtree split`) on the integration branch so the source repo carries the
   real development history rather than a flat import — **(Open question: whether full
   per-file history is required, or a clean snapshot suffices; depends on the PM's appetite vs the
   cost of a filter-repo on a branch that was never on `main`.)**
2. **Reduce the current repo to dist** — remove the MOVES set, leaving only the job-3 STAYS set
   (built adapters + downstream surface). The **submodule URL is unchanged**, so downstream sees no
   change (topology decision).
3. **Wire source → dist CI** (job 2): build + publish + the cross-repo credential + matched tags +
   split-brain guard.
4. **Re-establish the dogfood loop in its post-split form** (job 1 Option C): source's local
   build-then-run becomes the daily loop; the dist-submodule pull becomes the release-fidelity gate.
   Because job 1's mechanism was proven on the branch (stage a step 4), this is a re-wire, not a
   discovery.

### Point of no return + reversibility
- **The point of no return is the moment the current repo is reduced to dist (stage b step 2) and the
  source repo becomes the only home of the authored source.** Before that, everything lives on a
  local branch and is reversible by abandoning it. After it, the authored source is in repo X and the
  current repo is dist; reverting means re-merging two repos.
- **Reversibility window:** all of stage (a) is reversible. Stage (b) steps 1 (create + move) and 3
  (CI wiring) are reversible until step 2 (reduce-to-dist) lands — keep the current repo's full tree
  intact (do not delete the MOVES set) until source is verified building+publishing correctly, so a
  failed extraction can roll back to "one repo, everything here" with no loss. **Recommend: do not
  perform step 2 until stage (b) steps 1+3 are green and a full dist publish + downstream
  `submodule update` smoke test has succeeded.**
- **What becomes possible only after the new repo exists:** the live split-brain path, the real
  cross-repo credential, and the post-split dogfood loop (job 1 Option C's pull half). These are
  designed now but **cannot be live-tested on the branch** — they are inherently two-repo.

---

## Also covered (shaping the four jobs)

### Where the neutral source + generator physically live (proposed layout)
In the **source** repo (post-extraction; staged in the current repo on the branch first):

```
source-repo/
  src/                      # the authored neutral source
    agents/<name>.body.md   # neutral body, no harness frontmatter
    commands/<name>.body.md
    workflow/               # WORKFLOW.md + workflow/*.md neutral bodies
    templates/              # doc/_templates/* neutral source
    manifests/
      claude.manifest.*     # per-harness frontmatter + capability→primitive map
      opencode.manifest.*
  gen/                      # the generator
  dist-out/                 # git-ignored local build output (job 1 Option A)
  .ai-pm/ doc/features/ tests/ CHANGELOG.md CLAUDE.md   # dev artifacts (job 3 MOVES)
```

### How thin the metalanguage can be (recommended: thin)
Recommend the **thinnest viable** form: **neutral bodies + per-harness frontmatter manifests**, not an
abstract DSL. The plan's harness-neutral vocabulary layer (scenario 2) is a **lookup table** — neutral
capability name → each harness's primitive (e.g. `structured-question-tool` → Claude `AskUserQuestion`
/ OpenCode `question`; `deny-list-enforcement` → Claude `PreToolUse` in `settings.json` / OpenCode
`tool.execute.before` throw in a TS plugin; `route-reminder` → Claude `UserPromptSubmit` hook /
OpenCode always-on `AGENTS.md`/`instructions` content, per the plan's gap-handling). The generator's
job is: inline the neutral body, attach the target harness's frontmatter from the manifest, and
substitute each neutral capability token with the harness's primitive. **Why thin:** a thin generator
is fast (keeps job 1's regenerate-before-test cheap), easy to keep deterministic (required for the
diff-clean and byte-equivalent guarantees), and avoids re-introducing B's "is this generated?"
confusion as a heavyweight abstraction. An abstract DSL is rejected as over-engineering for two
harnesses — revisit only if the N-adapter generalization (plan Out of scope: Cursor/Codex/…) actually
materializes.

### How the diff-clean integrity check is shaped
`single-source-diff-clean` (in source CI, every push): run the generator over the neutral source into a
fresh output, compare to the committed/published adapter tree, **fail on any divergence**. It
regenerates **both** adapters and compares the whole adapter tree (not just `.claude/`). This is the
build-time analogue of the rejected runtime integrity check and the direct precedent of the
`docs/product-map.md` regenerate-and-compare discipline (`doc/architecture.md` § "Contract-centric
product map"). The cross-repo variant (job 2) extends the same compare across source↔dist at a version
tag.

### How the byte-equivalent-`.claude/` guarantee is verified at build time
`generated-claude-adapter-byte-equivalent` (plan Test plan): freeze today's committed `.claude/` as the
**golden reference** before carving the neutral source; after the generator exists, regenerate
`.claude/` from the neutral source and assert **byte-identity** with the golden reference (agents,
commands, `settings.json`). `tests/hooks.sh` green at its current count is the behavioural corollary.
This runs on the branch (stage a step 3) and stays a permanent source-CI gate — the new build step is
proven to introduce **zero** change to what the Claude self-host session loads.

---

## Open questions (need the PM's new-repo target or a PM call before they finalize)

1. **New source-repo target** — host/org/name. Blocks: the cross-repo credential mechanism (deploy key
   vs fine-grained PAT vs GitHub App), the source→dist CI wiring, and stage (b) entirely. *The plan
   already records this as the gate on extraction; restated here as the hard dependency.*
2. **History preservation at extraction** — full per-file history (`git filter-repo` / `subtree
   split`) into the source repo, or a clean snapshot import? Trade-off: history fidelity vs the cost
   of a filter-repo on a branch that was never on the real `main`.
3. **Does `tests/hooks.sh` ship in dist?** Recommend no (downstream gets finished files, not a test
   harness); revisit only if a downstream asks to self-verify the delivered hooks.
4. **`README.md` / `MIGRATIONS.md` authoring-vs-shipping split** — confirm the recommended "authored in
   source, rendered/copied to dist at build" home (this note recommends it; the PM owns whether the
   public front door is maintained in source or directly in dist).
5. **Spike-gated, topology-sensitive (carried from the plan, not resolved here):** OpenCode submodule-
   path sourcing (Spike A) **may shift under the dist topology** — the dist repo ships pre-built files,
   which can change what "sourcing from a submodule" means for the OpenCode loaders; and subagent
   hook containment (Spike B, `#5894`). Both stay `doc-cited (unverified)` until a runtime spike; if no
   runtime, `spike-deferred`. These shape the dist surface (job 3) but do not block the four jobs'
   shape.

---

## Notes for the plan (do not change the plan from here — flag only)

- The plan's job 1 framing ("build-then-run **or** pull-back") is resolvable to a **hybrid** (this note
  recommends Option C: local build-then-run for the loop + dist-pull as a release-fidelity gate) —
  worth folding into the architecture decision record's "dogfood/self-host loop after the split" line
  so the chosen mechanism is named, not left as an either/or.
- Job 2's cross-repo fidelity check and job 1's dist-pull are the **same mechanism** — the
  architecture record should state them once and cross-reference, not as two separate costs.
- The job-3 map shows the extraction is a **center-of-gravity inversion** (bulk moves to source, dist
  is left lean); the architecture record's topology paragraph should say "inversion", not
  "extraction", to set the right expectation for the later stage (b).
