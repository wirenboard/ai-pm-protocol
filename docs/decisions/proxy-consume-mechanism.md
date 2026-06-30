# How the protocol consumes `modelpipe` (retiring the in-repo router copy)

**Status: RATIFIED by the Operator (2026-06-30) — Option 3 (synced, drift-guarded
vendor-copy).** This is the phase-2 packaging call the extraction decision
(`docs/decisions/router-extraction.md`) deferred to the Operator. The concrete build it
implies (`## The concrete next build`) is the follow-up feature; option 2 (npm dependency)
stays recorded as the deliberate future end-state once both repos are published.

**Question (2026-06-30).** The transport was extracted to a standalone repo `modelpipe`
(`aadegtyarev/modelpipe`; local checkout at the gitignored `_scratch/modelpipe`, `#1`
merged). The protocol still carries an in-repo copy — `src/adapter/model-router.mjs` +
`model-providers.json` + `model-router.example.json` — and `router-launch.mjs` imports
`createRouter`/`pickRoute` from `./model-router.mjs`. The Operator wants the in-repo copy
retired and `modelpipe` consumed instead (first instinct: a git submodule). **How should
the protocol consume `modelpipe`?**

The duplication is no longer theoretical: `modelpipe` already shipped the vision-rewrite
`forImagesModel` hop (`#1`) that the in-repo `model-router.mjs` lacks — the two copies
have **already diverged**. Resolving the consume mechanism is what closes that drift.

---

## The hard constraint (the crux)

The protocol adopts a downstream by **vendoring** `src/adapter/` (plus `src/agents`,
`src/modules`, `src/quality`, `src/templates`, `PROTOCOL.md`) into
`<target>/.ai-dev/tooling/` — `install-core.mjs` `vendorTooling`, the one-command-install
contract (`docs/contracts/one-command-install.md`, `src/adapter/INSTALL.md` *## The one
command*). The launcher the downstream runs lives at `.ai-dev/tooling/src/adapter/
router-launch.mjs` and must `import` the router from a path that exists **after a plain
recursive copy** — because that is all `vendorTooling` does, and all an `npx github:`
fetch delivers.

Two mechanisms break that silently:

- A **git submodule** is an empty directory after a plain copy or an `npx github:` fetch —
  it needs `git clone --recurse-submodules` / `git submodule update --init`, neither of
  which the install path runs. The vendored launcher would `import` a path that resolves
  to nothing.
- An **npm dependency** lives in `node_modules`, **outside** `src/adapter/`, so
  `vendorTooling` never copies it; the downstream gets a launcher importing a package that
  was never installed at the target.

So the consume mechanism is judged first by one test: **does the downstream get a working
router from the one install command, with no extra manual step** (the
`one-command-install` contract held true)?

---

## Option 1 — git submodule under `src/adapter/`

Add `modelpipe` as a submodule (e.g. `src/adapter/modelpipe/`), pinned to a commit;
`router-launch.mjs` imports `createRouter`/`pickRoute` from `./modelpipe/src/router.mjs`.

- **one-command-install:** **breaks unless `install.mjs` is taught to vendor the
  submodule's checked-out working tree** into `.ai-dev/tooling/` like any other source
  dir. `vendorTooling` does a `copyTree` — a submodule path is a real directory on the dev
  machine *once initialised*, so `copyTree(src/adapter/modelpipe)` would copy its contents
  (the submodule pointer is a `.git` file, not copied). The break is upstream of that:
  an `npx github:` fetch and a fresh `git clone` without `--recurse-submodules` leave the
  submodule **empty**, so the protocol's own dev checkout and the npx-distribution path
  both ship an empty dir into the vendor copy. The fix is real but spread: the dev-setup /
  clone instructions, the CI checkout (`submodules: true`), and a vendor-time guard that
  the submodule is populated (fail loud, never copy an empty dir into `.ai-dev/tooling/`).
- **dev-workflow cost:** highest. Every contributor and every CI job must remember
  `--recurse-submodules` / `submodules: true`; a forgotten init is a silent empty-dir
  failure of exactly the fail-open class the backlog already catalogues (a tool tested
  only in the populated dev layout, broken in the fetched one). Pinning to a commit is
  explicit and git-native (a pro), but updating is a two-step dance (`cd modelpipe &&
  git fetch`, then commit the moved pointer).
- **supply-chain / security:** good — `modelpipe` is first-party (same author, MIT,
  no deps), pinned to an exact commit, and changes through git (invariant 4). No
  third-party package runs with the API keys (the very surface
  `per-seat-model-routing.md` option B rejects LiteLLM/CCR for). Equal-best with options
  2 and 3 on this axis.
- **maintenance / drift:** the pinned commit is the single source; no copy to drift. But
  the vendoring path must be taught the submodule, and the drift-guard suite
  (`install-drift.test.mjs`, the `tools.json` drift rows) must cover "the vendored copy
  matches the submodule's checked-out tree" — a new guarded surface.
- **`install.mjs` + test changes:** `vendorTooling` copies `src/adapter/modelpipe/src` (or
  the whole submodule dir); a populated-submodule precondition check that fails loud;
  `install.test.mjs` must set up a populated submodule in its temp source and assert the
  router lands under `.ai-dev/tooling/`. The npx/clone-recurse requirement is documented,
  not mechanically enforceable by `install.mjs` (it runs *after* the fetch).

## Option 2 — npm dependency

`package.json` depends on `modelpipe@<version>`; `router-launch.mjs` imports
`createRouter`/`pickRoute` from the package (`import { createRouter, pickRoute } from
"modelpipe"` once it declares those exports, or from `modelpipe/src/router.mjs`).

- **one-command-install:** **breaks unless `install.mjs` is taught to vendor from
  `node_modules`** — the package is not under `src/adapter/`, so `vendorTooling` never
  copies it, and the downstream `.ai-dev/tooling/` launcher imports a bare-specifier
  `modelpipe` that the target has no `node_modules` for. Two sub-routes, both with cost:
  (a) vendor `node_modules/modelpipe/{src,providers.json}` into `.ai-dev/tooling/` and
  rewrite the import to a relative path — re-introducing a copy (option 3 in disguise,
  but sourced from a published artifact); (b) have the downstream run `npm i modelpipe`
  at install — a network step and an extra `node_modules` in `.ai-dev/`, which today
  carries none.
- **prerequisite — npm publish is DEFERRED.** This option **cannot ship until `modelpipe`
  is published to npm** (`.ai-dev/backlog.md` *npm registry publish* — the protocol's own
  npm publish is also deferred; the brand-path README lead `npx ai-dev-protocol@latest` is
  flagged as not-yet-published). `modelpipe`'s `package.json` is publish-ready (`bin`,
  `files`, no deps, MIT), so the prerequisite is "the Operator publishes `modelpipe`",
  but it is a hard gate: until then this option is unbuildable. That is its dominant cost.
- **dev-workflow cost:** lowest *once published* — `npm i`, a version bump in
  `package.json`, standard tooling. No submodule dance.
- **supply-chain / security:** good for a first-party published package pinned by exact
  version + lockfile (`modelpipe` is first-party, no transitive deps). The honest residual
  vs option 1/3: an npm dependency is fetched from the registry, so the supply chain now
  includes "the registry served the bytes the lockfile names" — mitigated by the lockfile
  integrity hash, but a strictly larger trust surface than a git-pinned first-party tree.
  Still nowhere near the LiteLLM-class third-party-runs-with-keys risk
  (`per-seat-model-routing.md` option B) — `modelpipe` is the Operator's own code.
- **maintenance / drift:** cleanest model conceptually (a versioned dependency, the
  industry norm) — but only if the downstream actually resolves the package. Sub-route (a)
  re-introduces a vendored copy to drift-guard; sub-route (b) adds a per-install network
  dependency the protocol deliberately avoids elsewhere.
- **`install.mjs` + test changes:** either a `node_modules`-sourced vendor step + import
  rewrite (a), or a downstream `npm i` orchestration + the `node_modules`-present
  assumption in the launcher (b). `install.test.mjs` must simulate the chosen route in its
  temp target. Comparable surface to option 1, gated behind the publish.

## Option 3 — synced vendor-copy *(recommended)*

Keep `modelpipe`'s router (`src/router.mjs` → `src/adapter/model-router.mjs`) + catalog +
example **inside `src/adapter/` as today**, but make the copy a **generated, drift-guarded
mirror** of `modelpipe` at a pinned ref — a `sync` script that pulls the named files from
the `modelpipe` repo at a pinned version, plus a `tools.json` drift row asserting the
in-repo copy is byte-identical to the script's output.

- **one-command-install:** **unchanged — nothing to teach `install.mjs`.** The files are
  already under `src/adapter/`, so `vendorTooling` copies them as it does today, the npx
  fetch carries them, and the downstream launcher's existing
  `import … from "./model-router.mjs"` keeps working byte-for-byte. The contract stays true
  with **zero install-path change** — the only option that touches no install code.
- **dev-workflow cost:** low and familiar — this is the **same pattern the protocol
  already uses** for the assembled agents and the deployed procedures
  (`install-drift.test.mjs`, the `assembled-drift-guard` / `install-drift` rows): a
  generated artifact is committed and a drift row guards it against its source. Updating
  `modelpipe` = bump the pinned ref, run the sync script, commit the regenerated copy — one
  reviewed PR, no submodule init, no publish gate.
- **supply-chain / security:** equal-best with option 1 — first-party, pinned to an exact
  `modelpipe` ref, committed and reviewed, changes through git (invariant 4). The synced
  bytes are visible in the diff of every sync PR (a reviewer reads exactly what changed),
  which is a *stronger* review surface than a submodule pointer bump or an opaque npm
  version bump. No third-party-with-keys surface (`per-seat-model-routing.md` option B).
- **maintenance / drift:** the one real cost — a copy exists, so it *can* drift. But that
  is precisely what the drift row mechanises away: the copy cannot **silently** diverge
  (the failure mode the current un-synced duplication already hit with `forImagesModel`),
  because the drift guard goes red the moment the committed copy stops matching the pinned
  source. The maintenance is "remember to sync on a `modelpipe` release" — a `[persona]`
  step, but one with a mechanical red-on-drift backstop, the protocol's standard posture
  for generated artifacts.
- **`install.mjs` + test changes:** **none to `install.mjs`.** New: a sync script
  (`src/adapter/sync-modelpipe.mjs` or similar) that fetches the pinned files, and a
  `tools.json` drift row running it in check-mode (`run.mjs build` goes red if the copy
  drifted) — mirroring the existing drift rows exactly. `install.test.mjs` is untouched;
  the new test is the drift check itself.

---

## Recommendation

**Option 3 — the synced, drift-guarded vendor-copy.** It is the only option that keeps
`one-command-install` true with **zero change to the install path**, it reuses the
protocol's existing generated-artifact-plus-drift-guard pattern (so it adds a known shape,
not a new mechanism), it carries the equal-best first-party-pinned supply-chain posture,
and it has **no external prerequisite** — option 2 is blocked behind the deferred npm
publish, and option 1 forces a `--recurse-submodules` requirement onto every clone/fetch/CI
path (the exact silent fail-open class the backlog warns against). The single cost of
option 3 — a copy that *could* drift — is the cost the drift row exists to neutralise: it
cannot drift *silently*, which is the only kind of drift that matters. The current un-synced
duplication (`forImagesModel` already missing in-repo) is the live proof that an **un**guarded
copy is the real hazard; a **guarded** copy fixes it without breaking the install model.

The transport/policy boundary stays exactly as `router-extraction.md` drew it: `modelpipe`
owns the transport (router + catalog + example + the vision hop), the protocol keeps the
policy (`router-launch.mjs` + the per-role baking) and **consumes** the transport as a
pinned synced mirror.

**Reconsider option 2 later, not now.** If/when `modelpipe` and the protocol are both
published to npm (the deferred packaging epic), an npm dependency becomes the cleanest
long-term model and can supersede option 3 — at which point the sync script is deleted and
the import becomes a package specifier. Recording it here so the future reader knows option
3 is the *interim* answer, deliberately chosen because it is buildable today and reversible,
not the permanent end-state.

## The concrete next build (if ratified)

A single feature through the loop, gated on `modelpipe#1` already merged (it is):

1. Add `src/adapter/sync-modelpipe.mjs` — pull `src/router.mjs` (→ `model-router.mjs`),
   `providers.json` (→ `model-providers.json`), `routes.example.json` (→
   `model-router.example.json`) from `aadegtyarev/modelpipe` at a **pinned ref** recorded
   in the script; a `--check` mode for the drift guard.
2. Run it once to bring the in-repo copy current with `modelpipe` (this closes the live
   `forImagesModel` drift). Reconcile the cosmetic `_doc` differences in the catalog
   (the in-repo copy carries launcher-specific notes — decide whether the synced source or
   a post-sync overlay owns them, so the drift guard has a stable target).
3. Add a `tools.json` drift row running `sync-modelpipe.mjs --check` on the `build` beat,
   mirroring `assembled-drift-guard` / `install-drift`.
4. Confirm `router-launch.mjs`'s imports still resolve (no import change needed — the file
   names are preserved by the sync targets).
5. No `install.mjs` change; `install.test.mjs` untouched. The new test surface is the drift
   row, exercised by `node src/quality/run.mjs build`.

## Sources

- The extraction decision + transport/policy boundary + the two phase-2 options the
  Operator must choose between: `docs/decisions/router-extraction.md` (this doc answers its
  deferred phase 2).
- The vendoring install model: `docs/contracts/one-command-install.md`,
  `src/adapter/INSTALL.md` *## The one command*, `src/adapter/install-core.mjs`
  (`vendorTooling`).
- The third-party-runs-with-keys supply-chain framing options 1–3 all avoid:
  `docs/decisions/per-seat-model-routing.md` option B (LiteLLM/CCR).
- The generated-artifact-plus-drift-guard pattern option 3 reuses:
  `src/quality/tools.json` (`assembled-drift-guard`, `install-drift` rows),
  `src/adapter/install-drift.test.mjs`.
- The deferred-publish prerequisite blocking option 2: `.ai-dev/backlog.md` *npm registry
  publish — external half of npx distribution*, and the *Proxy as a git submodule* entry
  (this doc is its design resolution).
- `modelpipe` shape (v0.2.0): `package.json` (`bin: modelpipe`, `files`, no deps, MIT);
  `src/router.mjs` exports `createRouter` + `pickRoute` (the two `router-launch.mjs`
  imports) and the vision-rewrite `forImagesModel`; `README.md` install path
  (`npx modelpipe` / `npm i -g modelpipe`). Local checkout `_scratch/modelpipe`,
  remote `aadegtyarev/modelpipe`, `#1` merged (confidence: high — direct read of the
  checked-out tree, 2026-06-30).
