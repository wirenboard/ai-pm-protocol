# Contract: cross-session-enforcement

**The load-bearing rules hold even across separate AI sessions that share no memory** — an enforcement layer mechanically blocks the violations a fresh or forgetful session might commit, while leaving legitimate work untouched.

Prose rules only hold while a session remembers to read them. A fresh session, a different model, or a long conversation that paged the rules out would otherwise be free to do the forbidden thing. The load-bearing rules are *mechanical*: before-tool guards block the specific dangerous actions at the moment they are attempted. The guards are a named deny-list, not a blanket block, so they never get in the way of legitimate work.

## Must work

- A role-duplicator or generic built-in agent occupying a protocol seat is denied (invariant 1).
- An empty/whitespace-only whole-file write over an existing non-empty file is denied (the truncation guard).
- A write/read/search resolving outside the project root is denied; the enforcer's own source is off-limits to read and write.
- A force-push, a no-verify commit, or a mutating remote action is surfaced for confirmation where the platform supports an "ask" outcome.
- The guards hold without the session having re-read the rules, and are themselves tested so a regression fails CI. The merge-gate stamp test covers both the canonical inline form and the split-line fallback (verdict on the next line), as well as empty, `NOT YET RUN`, blank-separator, and next-heading edge cases.

## Must not break

- The deny-list stays a *named* list, never an "everything but the protocol agents" block — built-in review/research engines and read-only diagnostics are never gated.
- Semantic judgements a regex cannot make (is this user-facing? is this a security touch?) are soft-enforced by gates, deliberately not by hooks.
- The *rules* are platform-neutral; the wiring and the available outcomes differ per platform — honestly labelled, never silently divergent (see `dual-harness-from-one-source`).
