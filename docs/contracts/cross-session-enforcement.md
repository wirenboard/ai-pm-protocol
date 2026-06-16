# Contract: cross-session-enforcement

**The load-bearing rules hold even across separate AI sessions that share no memory** — an enforcement layer mechanically blocks the violations a fresh or forgetful session might commit, while leaving legitimate work untouched.

Prose rules only hold while a session remembers to read them. A fresh session, a different model, or a long conversation that paged the rules out would otherwise be free to do the forbidden thing. The load-bearing rules are *mechanical*: before-tool guards block the specific dangerous actions at the moment they are attempted. The guards are a named deny-list, not a blanket block, so they never get in the way of legitimate work.

## Must work

- A role-duplicator or generic built-in agent occupying a protocol seat is denied (invariant 1).
- An empty/whitespace-only whole-file write over an existing non-empty file is denied (the truncation guard).
- A write/read/search resolving outside the project root — or, where a `.ai-dev/components.json` manifest is present, outside the declared component set — is denied; the enforcer's own source is off-limits to read and write under every declared root.
- On a platform that resolves the actor, the orchestrator session is denied the direct write forms into the review-stamp directory (write/edit tools, redirects, tee, sed -i, cp/mv, dd) — best-effort like the sibling write guards, with persona as the fail-safe. Never relaxed by profile; persona where the actor cannot be resolved (Claude), labelled honestly.
- A force-push, a no-verify commit, a mutating remote action, or a merge/push whose branch topic the merge-gate cannot resolve (the stamp is uncheckable) is surfaced for confirmation where the platform supports an "ask" outcome.
- The guards hold without the session having re-read the rules, and are themselves tested so a regression fails CI — the merge-gate's stamp forms and edge cases are pinned by `src/adapter/merge-gate.test.mjs`.
- The merge-gate floor applies to guarantee profiles (`full`/`lite`/`solo`). A `yolo`-profile project turns the gate off explicitly — the stamp-write guard and all other mechanical floors still apply (only the stamp-presence check is off); see `PROTOCOL.md ## Project config`.

## Must not break

- The deny-list stays a *named* list, never an "everything but the protocol agents" block — built-in review/research engines and read-only diagnostics are never gated.
- Semantic judgements a regex cannot make (is this user-facing? is this a security touch?) are soft-enforced by gates, deliberately not by hooks.
- The *rules* are platform-neutral; the wiring and the available outcomes differ per platform — honestly labelled, never silently divergent (see `dual-harness-from-one-source`).
