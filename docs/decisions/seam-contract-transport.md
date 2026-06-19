# Seam-contract transport — how a consuming repo references a producer-owned contract (D6)

**Question.** In a multi-component project (frontend / backend / firmware as separate repos,
`docs/decisions/multi-repo-components.md`), the seam between two components IS a contract — a
React↔Python API, a Python↔firmware wire protocol. That contract has one OWNER. How does a
CONSUMING repo reference a contract OWNED by a PRODUCING repo, without reading the producer's
tree (the project-boundary deny, `docs/contracts/project-boundary.md`) and without copying it
into every repo (invariant 6, one home)? This is the open D6 question left for the plan in the
multi-repo-components decision.

## Evidence (research 2026-06-16)

Every mature approach to "one schema/contract, many consumers" converges on a single truth:
**one home plus a pinned reference — never copy-and-drift.** The mechanisms differ only in how
heavy the reference machinery is.

- **Snapshot-copy (the anti-pattern).** Copying the contract file into each consumer is what
  Claude Code's polyrepo "context mesh" does with its repository-ecosystem table
  ([source](https://rajiv.com/blog/2025/11/30/polyrepo-synthesis-synthesis-coding-across-multiple-repositories-with-claude-code-in-visual-studio-code/)).
  It is the fastest to set up and the surest to drift: N copies, N truths, no single home. It
  violates invariant 6 directly. Recorded in the multi-repo decision as a pattern to adapt, not
  adopt.
- **Git submodule.** A consumer pins the producer's contract dir as a submodule at a commit SHA.
  One home (the producer), a pinned reference (the SHA), no drift until you deliberately bump.
  The cost is submodule ergonomics — a real tool, heavier than this protocol needs for a doc.
- **Package distribution.** Publish the contract as a versioned artifact (an npm/PyPI package, a
  generated client) the consumer depends on by version. One home, pinned by semver. Strong for
  generated code; overkill for a markdown seam contract two repos share in one coordinated
  session.
- **Schema registry.** A dedicated service — Buf Schema Registry (BSR) for protobuf, Pact Broker
  for consumer-driven contracts — holds the contract centrally and serves pinned versions. The
  gold standard at scale: one home, versioned, with consumer/producer compatibility checks. Also
  the heaviest: an external service, not thin, not platform-neutral.

The unifying truth across all four: **the contract has exactly one home; consumers hold a pinned
reference to it, never a divergent copy.** The only question is how much machinery the reference
needs — and for a protocol whose manifesto demands a thin, neutral core, the answer is *the least
that delivers one-home + no-drift.*

## What this means for us — the load-bearing simplification

We already shipped the mechanism. The multi-repo epic (5.15.0 / 5.16.0) widened the
`[mechanical]` project-boundary deny from the single session root to the **declared component
set** a `.ai-dev/components.json` names (`docs/architecture.md` `## Components`). So **within a
coordinated session the widened boundary IS the transport**: the consuming repo reads the seam
contract DIRECTLY from its owner's `docs/contracts/` — the owner is a declared sibling root,
already inside the permitted set. No copy. No new transport mechanism. No submodule, no package,
no registry. The boundary we already shipped does the whole job. This is the load-bearing
simplification, and it is why D6 needs almost no new code.

## Decision

A seam contract lives in **one home** — its OWNING component's `docs/contracts/` (invariant 6).
Consumers reference it; they never hold a second home.

1. **One home.** The contract is authored and maintained in the owner's `docs/contracts/`,
   reviewed and shipped through the owner's loop like any contract.

2. **In-session transport = the already-shipped widened boundary.** When a valid
   `.ai-dev/components.json` is present, the boundary spans the declared set, so a multi-component
   session reads the seam contract directly from its owner's tree. The boundary IS the transport —
   nothing new.

3. **Declaration — an optional, additive `contracts` field** on a manifest component object,
   naming the seam contracts that component OWNS and who consumes them:

   ```json
   {
     "root": "../backend",
     "role": "backend",
     "stack": "python",
     "contracts": [
       { "path": "docs/contracts/api.md", "consumers": ["frontend"] }
     ]
   }
   ```

   The manifest stays a **JSON array of component objects** — no breaking shape change. (An
   object-wrapped `{ components, seams }` form was rejected: it would fail-CLOSE every existing
   array manifest, since the validator rejects a non-array shape.) The `contracts` field is
   **advisory metadata the orchestrator reads** to know which sibling owns a seam and who depends
   on it — it shapes coordination, nothing mechanical.

   **The security-critical validator (`componentRoots`) ignores `contracts` entirely.** It reads
   only `root` for the boundary set; it inspects no other key, so the advisory field is
   structurally inert and cannot widen the boundary. This is pinned by a characterisation test
   (`src/adapter/components.test.mjs`): a manifest carrying `contracts` still widens correctly,
   and a `contracts`-bearing entry with a bad/overbroad `root` still fails CLOSED to the single
   session root.

4. **Outside a coordinated session** (a consuming repo worked alone, no manifest) — it references
   the seam contract by **POINTER** (owner component + path, optionally a pinned commit), never a
   copy. If a build genuinely needs the file physically present, that local snapshot is a
   **DERIVED artifact with explicit provenance + a drift guard** — the same pattern this repo's
   assembled-agent drift guards use (`docs/decisions/assembled-drift-guard.md`): a generated copy
   that a quality-registry row re-generates and byte-compares against its source. Never a silent
   second home.

## Rejected alternatives

- **Copy the contract into every repo** (Claude Code's context-mesh table). Rejected — N copies,
  N truths, guaranteed drift; a direct invariant-6 violation.
- **A heavy external schema registry** (Buf BSR, Pact Broker). Rejected — an external service is
  not thin and not platform-neutral (the manifesto's two constraints). The protocol does not
  carry a service; the widened boundary already delivers one-home + no-drift for the in-session
  case, and a pointer covers the out-of-session case.
- **A git submodule / published package as the protocol's prescribed mechanism.** Not rejected as
  wrong — they are legitimate pinned-reference patterns a project MAY use — but not adopted as the
  protocol's mechanism: the in-session boundary makes them unnecessary, and prescribing one would
  add machinery the thin core does not need. They remain available to a project whose build needs
  the file present (the snapshot-with-drift-guard route above).

## Relation

- The schema's one home is `docs/architecture.md` `## Components`; this doc records the *why*, that
  doc carries the *shape*.
- The trust/transport posture (the boundary is the in-session transport; pointer-not-copy outside)
  is stated in the boundary contract (`docs/contracts/project-boundary.md`), pointed to from here.
- The orchestrator's procedure for using the field lives in `src/agents/orchestrator.md`
  `## Multi-component coordination`.
