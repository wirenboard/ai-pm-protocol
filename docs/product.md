# Product brief

> The one home for **what this project is and why**. Every feature grounds in it.

## 0. The idea — what is this product?

A platform-neutral protocol that gives AI-assisted software and documentation development a disciplined, reviewable loop — three roles (Orchestrator / Builder / Reviewer), five beats (understand → plan → build → review → ship), and a mechanical enforcement layer — so the builder and the reviewer are always different contexts and nothing ships unreviewed.

## 1. Customer — who exactly?

**Primary (confirmed):** technical operators already using Claude Code or OpenCode to build real products — solo devs, technical leads, technical PMs. They want to move fast but cannot afford silent quality failures, unreviewed security surfaces, or "the AI did whatever I asked."

**Hypothesis (not yet validated):** a non-technical PM or founder who wants to ship product using AI without reading code. The onboarding (git submodule + Node CLI) and the protocol ("Never show code") are currently hostile to this segment. This is a future bet, not a served segment today.

**Not for:** one-off scripts, vibe-coding experiments, teams that already have a mature CI/CD and code-review culture, anyone who does not care whether the AI cuts corners.

**Speed↔quality dial.** One axis, implemented as `profile` in `ai-pm.config.json`:

- **Prototype mode** (`lite` / `solo`) — verify the hypothesis fast; the Orchestrator may build directly, plan ceremony is lighter. The floor holds: code works, review by a fresh independent Reviewer still runs.
- **Quality mode** (`full`) — trade speed for no-rewrites; full research, independent deep review, explicit plan. The change is right and works before it ships.

## 2. Problem — from their point of view

Four pains in play:

- **No independent review.** The model that built the change reviews it — a structural conflict of interest.
- **No product grounding.** Features are planned against "what sounds good" rather than a written brief naming the customer, the problem, and the competition.
- **No enforceable floor.** A "don't go outside the project root" instruction in a CLAUDE.md is a request, not a guard; a session that forgets to re-read it has no protection.
- **Process chaos.** AI development is ad-hoc: every session starts over, no repeatable loop, no memory/state; outcome is unpredictable.

## 3. Discovery & onboarding — zero to working

**How a new user finds out it exists:** organic / GitHub (open repo, README, word-of-mouth in the dev community) and the platform's plugin marketplace (Claude Code / OpenCode).

**First steps from nothing to working:**

1. Wire the protocol — one command: `node src/adapter/install.mjs <target-dir> --platform claude|opencode`.
2. Start a fresh session; the harness loads as the orchestrator.
3. `/pm-setup` — plain-language config dialog that writes `ai-pm.config.json`.
4. Product discovery — writes this brief before the first feature.
5. Build loop.

Prerequisite: Claude Code or OpenCode installed and authenticated; no other dependency. No hosted service, no account.

## 4. Continuity & recovery

- **Across sessions and machines:** state carries through the resume pointer (`.ai-pm/state/current.md`) plus git — a fresh session reads the pointer to continue; any machine with the repo continues.
- **Crash recovery:** the same resume pointer and git history pick up where the loop stopped.
- **Lost access / keys:** N/A — no accounts, no keys beyond the LLM API credentials the harness manages.
- **Multi-party:** single-Operator by design. Several people = several branches coordinated by ordinary git — not the protocol's concern.

## 5. Competition / the incumbent

**What users reach for today (June 2026):**

- **BMAD-Method** v6 (~47k stars) — closest competitor; ~12+ agents, 42 platforms, Scale-Adaptive Planning (Quick Flow / L0–L4 routing) — a speed↔quality dial that ships today. Large community.
- **Kiro (AWS)** — vibe↔spec toggle inside the IDE; backed by AWS.
- **GSD** (~64k stars) — lightweight + structured; model profiles for quality-vs-cost.
- **Cursor native review / Copilot PR reviewers** — platform-native reviewers with effort levels.
- **Raw AI coding** — Cursor / Claude Code / Aider with no protocol ("vibe coding"): no floor at any speed.

**Residual gap — the compound matters, not any one part:**

- **Cross-platform from one neutral core** — a vendor will never ship cross-platform policy; the core/adapter split is structurally un-absorbable.
- **Hook-enforced floor, not prose-only discipline** — a real deny layer (tool-call intercepts, merge-gate stamp check) at both Claude Code and OpenCode parity-tested from one engine. BMAD and Spec Kit are prose-held.
- **Product discovery as a first-class beat** — `docs/product.md` before any feature; vendors do code, not product-management loop.
- **Honest enforcement map** — every constraint labelled `[mechanical]` vs `[persona]`; over-claiming is a Reviewer blocking-find. Rare.

The protocol does not guarantee a "floor" — it is **protocol-held discipline with mechanical backstops** (boundary denies, stamp-presence merge-gate, role-substitution guard). Most rules are prose-held, as §7 states. The value is that the discipline is externally defined, version-controlled, and honest about its limits — not that it is infallible.

## 6. Viability — who runs and funds it

**Operated by:** the user, inside their own project's git repository. No central service, no account.

**Funded by:** the user's own model tokens; no other cost. The loop multiplies token usage vs a raw session — rough estimate: a reviewed feature (orchestrator + builder + reviewer) costs ≈2–3× the tokens of a single-pass session; the reviewer is the main addition.

**License:** MIT — free forever including commercial use.

**Constraints:** depends on Claude Code or OpenCode; breaking changes to either harness's hook surface can disable the mechanical enforcement. Both are live-verified and the parity tests are the regression guard.

**Maintenance:** hobby project, single author (bus-factor 1). No funding; sustained by author enthusiasm. Currently N=1 project (dogfood = this repo, the extreme technical-operator end).

**Success criteria (provisional):**

- One non-author project onboarded and shipping within 6 months of v5.0.
- A rework metric defined and tracked in the dogfood repo (reverted/re-opened features per shipped feature).
- Rough cost-per-feature measured and published for the dogfood repo.

## 7. The case against

- **The dial is no longer a differentiator.** BMAD v6 and Kiro ship speed↔quality toggles; GSD ships quality-vs-cost model profiles. The dial is now table stakes, not a moat.
- **Platform absorption risk is high and accelerating.** Claude Code shipped agent teams, dynamic workflows, result validation, and PreToolUse deny hooks natively. The protocol's value migrates from "provides the mechanism" to "provides the policy and the wiring." If the platform absorbs the policy layer, the protocol has no residual.
- **The reviewer is usually the same model.** `auto` resolves to a different model only where the environment offers one. Most installations have a single model — structurally independent context (separate spawn, no shared memory) but not model-independent. Stated honestly, not papered over.
- **Persona-only floor is thin.** The mechanical enforcement covers a narrow deny list (boundary writes, role substitution, merge-gate stamp presence). Spawning the Reviewer is a positive act the deny layer cannot force; the orchestrator-authors-content guard is `[persona]` on Claude, which is the platform this repo runs on. A session that pages out PROTOCOL.md can violate prose rules silently.
- **Light profile / lighter guarantee mismatch.** In `solo` or `lite`, plan ceremony is off by default — but the lighter the profile, the less the Operator can catch a wrong call. The protocol currently has no compensating mechanism (stronger automatic product-fit check at review time) for the lighter profiles. Descoped: recorded here, not designed away.
- **N=1 dogfood evidence.** Git history is single-author, at the extreme technical-operator end. Validates buildability; says nothing about demand, the PM segment, or the non-dogfood experience.
- **No distribution engine.** Discovery is essentially "find it on GitHub" — a great product nobody finds. No hosted onboarding, no marketplace listing yet.
- **Pure-OSS, bus-factor 1.** No funding; hard to sustain against funded rivals (BMAD, Kiro).
- **"Product brief quality is the Operator's responsibility."** If `docs/product.md` is based on wrong assumptions, the review and plan machinery faithfully executes on those wrong assumptions. The protocol enforces the loop, not the quality of the Operator's product thinking.
- **Wrong for:** someone who wants a one-click app (Lovable is simpler); a senior dev who finds the ceremony heavier than just coding; a team; a non-technical PM today (onboarding is hostile).
