# Multi-component / multi-repo projects — where the protocol's single-root boundary should bend

**Question.** A real project is three separate git repositories — a React frontend, a
Python backend, a C firmware — each its own stack. The protocol assumes ONE project root
and `[mechanical]`-denies parent dirs and sibling repos (invariant 2,
`docs/contracts/project-boundary.md`). How should the protocol serve this without
dissolving the security boundary that deny enforces? Settled by: how comparable AI-coding
tools draw the same line, mapped onto our invariants 2 (boundary) and 6 (one home).

## Evidence (research 2026-06-16)

Two AI-coding tools already solved the "agent across N repos" problem; they converge on
the same two load-bearing decisions:

- **Codex CLI** ([source](https://codex.danielvaughan.com/2026/05/10/codex-cli-multi-directory-workflows-add-dir-writable-roots-cross-repo-coordination/)).
  A **declared set of writable roots** — `--add-dir`, persistent `writable_roots` in
  `.codex/config.toml`, or permission profiles whose `:project_roots` placeholder resolves
  against `.git` markers. The boundary is **kernel-enforced** (Seatbelt / Bubblewrap /
  DACL), not advisory — exactly our `[mechanical]` deny, but data-driven over a *set* of
  roots instead of a single one. Each repo's `AGENTS.md` loads independently, so per-repo
  conventions hold (pytest for Python, vitest for the frontend). **Crucial:** *"Codex does
  not attempt cross-repo commits — that remains a human decision."* Git history stays
  per-repo; only the working context is unified.

- **Claude Code polyrepo** ([source](https://rajiv.com/blog/2025/11/30/polyrepo-synthesis-synthesis-coding-across-multiple-repositories-with-claude-code-in-visual-studio-code/)).
  A VS Code multi-root workspace (`.code-workspace` lists the member repos) + a "context
  mesh": an **identical repository-ecosystem table copied into every repo's CLAUDE.md**.
  Hub-and-spoke (one source-of-truth repo), "follow the data" for cross-repo impact, and
  per-repo directory-verification warnings to stop a commit landing in the wrong tree.
  *Note:* the redundant-table approach **violates our invariant 6** (one home) — we cannot
  copy a manifest into every repo; this is a pattern to adapt, not adopt.

**Industry trade-off (background).** The monorepo↔polyrepo literature is unanimous that a
feature spanning frontend+backend in separate repos produces **separate PRs that must
converge** — there is no atomic cross-repo commit; coordination is explicit or it breaks
(API/contract mismatch between the sides). Hybrid (monorepo for front + shared libs,
polyrepo for backend services) is common. Firmware almost always stays its own repo.

## What this means for us

The seam between components **is a contract**: React↔Python is an API contract;
Python↔C-firmware is a wire protocol (Modbus / MQTT / serial). The protocol already has a
contracts home (`docs/contracts/`). So a cross-component feature is structurally *"change
the contract at the seam, then update each side."* That reframes the whole problem onto
machinery we already have, and tells us the hard part is **coordination + the shared
contract's one home**, not dissolving the boundary.

Both reference tools refuse atomic cross-repo commits and keep git per-repo. We should
too — it also keeps invariant 7 intact (the Operator authorizes each merge; N repos = N
merge words, which is honest, not a regression).

## Two design options

### Option A — coordination layer, boundary untouched (recommended first)

Keep each repo a **fully independent ai-dev project** (own `.ai-dev/`, own loop, own
Reviewer, own PR). Add a thin cross-repo coordination layer:

- A **component manifest with ONE home** — in a designated hub repo (e.g. the backend, or
  a tiny umbrella repo), `.ai-dev/components.json` naming each sibling component: its role
  (frontend/backend/firmware), stack, repo URL, and the **seam contracts** it
  participates in. One home (invariant 6) — *not* Claude Code's copy-into-every-repo table.
- A **cross-component feature = N coordinated loops**, sequenced contract-first: change the
  seam contract, then each side's loop consumes it. The orchestrator in each repo's session
  reads the manifest to know the seam and the sibling's contract; it never reads the
  sibling's *code* (project-boundary deny holds).
- The Operator drives the join at ship (the merge order across repos) — exactly what Codex
  leaves to the human.

**Cost:** invariant 2 unchanged — **zero loosening of the mechanical floor.** Delivers the
80%: explicit coordination, a single-home seam contract, per-stack quality each side.
**Limit:** no single Reviewer over a unified multi-repo diff; cross-repo coherence is
per-seam-contract + Operator-held, not one mechanical gate.

### Option B — declared component set, boundary widened (later, if A's friction bites)

Adopt Codex's model directly: a `components.json` of sibling roots, and **widen the
invariant-2 deny** from "the root" to "the declared component set" (read+write permitted
across the listed roots only, everything else still denied). Then ONE session + ONE plan +
ONE Reviewer can span the multi-repo diff.

**Cost:** the kernel-of-our-security boundary becomes **data-driven** — a bigger,
carefully-tested surface (a malformed/overbroad `components.json` must fail *closed*, never
open; the tooling dir and non-declared siblings stay denied unconditionally). Codex proves
it is doable safely, but it is a real change to the one `[mechanical]` floor we never
relax casually. **Not first** — only if Option A's per-feature coordination friction
proves too high in practice.

## Orthogonal: the embedded verification rung

Independent of the repo-layout choice — the C firmware needs a real-layer verification rung
the protocol does not name today: *flash the artifact to the device and probe it.* The
real-integration-layer offer (`src/agents/orchestrator.md` `## Your seat`) is described
only generically (CLI / IPC / socket / API). A flash-and-probe rung (and its safety: a
device that can be bricked is a blast-radius surface) is its own small feature, needed in
**any** layout. (WB context: this likely overlaps existing on-hardware-preflight thinking.)

## Decision

**Operator chose Option B (2026-06-16).** The protocol widens the invariant-2 deny from a
single root to a declared component set — research came back recommending A as the safer
first step, but the Operator opted for the full capability (one session + one plan + one
Reviewer over the unified multi-repo diff) directly. The research analysis above stands as
the record of *why* A was the conservative default and what B costs: the one `[mechanical]`
security floor becomes **data-driven**, so the implementation's load-bearing requirement is
**fail-closed** — a malformed, overbroad, or absent `components.json` denies everything
outside the original single root; the tooling dir and any non-declared sibling stay denied
unconditionally; widening is opt-in per project and never the default.

Retained from the analysis regardless of the layout choice:

- **Git stays per-repo** — B widens the read/write boundary, NOT the commit model. No atomic
  cross-repo commit (both reference tools refuse it); N repos = N Operator merge words
  (invariant 7 intact).
- **The seam is a contract** — cross-component work hangs on `docs/contracts/`; the shared
  seam contract's one home is settled by D6 (`docs/decisions/seam-contract-transport.md`):
  it lives in the OWNER's `docs/contracts/`, read in-session via the widened boundary.
- **The embedded verification rung** (flash-and-probe for the C firmware) is a separate
  small feature, needed in any layout.

**Open questions for the plan (Option A):**

- Where the manifest's hub lives when there is no natural umbrella repo (a tiny coord repo
  vs. designating the backend).
- ~~Where a *shared* seam contract's one home sits and how the consuming repo references it
  across the boundary without reading it.~~ **Answered (D6): `docs/decisions/seam-contract-transport.md`** —
  one home in the OWNER's `docs/contracts/`; within a coordinated session the already-shipped
  widened boundary IS the transport (read it directly); an optional additive `contracts` field
  declares ownership; pointer-not-copy outside a session.
- How the per-repo orchestrator learns "this feature is cross-component" and finds the
  manifest on the understand beat (a new lazy-offer trigger, like the existing ones).
