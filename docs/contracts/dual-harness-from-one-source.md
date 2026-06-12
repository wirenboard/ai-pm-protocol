# Contract: dual-harness-from-one-source

**The protocol runs on two AI coding platforms from a single source of truth** — one neutral core, one thin adapter per platform, enforcement faithful on both.

The protocol's guarantees should not be tied to one AI coding tool. It runs on Claude Code and OpenCode without maintaining two divergent copies: one platform-neutral core (this constitution, the role bodies, the deny-rules data) plus a thin adapter per platform that maps each neutral act to the platform's concrete tool. The Operator can adopt the protocol on either platform and get the same disciplined behaviour.

## Must work

- Both platforms run from one neutral core — the deny rules are shared data loaded by a thin per-platform shim; neither adapter re-authors the rules.
- The shared core names every platform-specific concept with a neutral noun, resolved per platform through one tool-map table.
- The deployed OpenCode plugin is generated from the source entry, not hand-copied — a byte-identity check guards that the two cannot drift.
- Enforcement is faithful on both platforms — the same rules, realised through each platform's own deny primitive.

## Must not break

- A new platform is supported by writing only its adapter (tool map, deny shim, spawn/load/install glue) against the fixed contract — zero edits to the core. A new platform forcing a core edit means the boundary leaked.
- A behavioural skew between platforms (e.g. a guard with no "ask" outcome on one, the actor-resolution gap on Claude) is honestly labelled, never silently divergent.
- The deployed plugin stays generated, not hand-edited — a relocation must never introduce a hand-edited deployed file that could drift from the audited source.
