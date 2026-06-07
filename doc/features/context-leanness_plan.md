# Context-leanness — targeted reading + leaner always-on — plan

Source: PM 2026-06-07 — token COUNT concern ("гигантский расход", Opus dev side). The spike showed INPUT context per agent spawn dominates (~84% of tokens); the biggest single item is agents reading **whole large docs** (`doc/architecture.md` ≈ 184 KB ≈ 46K tokens) every spawn. PM: "делаем фичей … **очень аккуратно чтобы не сломать протокол**." Continues on the local integration branch `feature/opencode-harness-support`.

> **STATUS: DRAFT.** Protocol-sensitive (changes HOW agents consume context — get it wrong and an agent loses needed context and degrades). **Gated on a `pm-architect` arch note** for the targeted-but-sufficient reading discipline. No coding until the arch note + PM greenlight.

## Problem

Every agent spawn reloads tens of K of INPUT: the always-on core (`WORKFLOW.md` + the OpenCode `AGENTS.md`), the agent's own body, and the docs the agent **reads in full** (chiefly `doc/architecture.md`, ≈184 KB, read whole by the orchestrator + most agents on every feature). Caching cuts COST, not COUNT — the input is re-counted each turn. The dominant COUNT lever is reading **less input per spawn without losing correctness**.

## Scenarios

1. **Agents read the RELEVANT SECTION of a large doc, not the whole file.** A consumer (the orchestrator, pm-coder, pm-plan-checker, …) that needs an architecture fact reads the specific `### ` decision record / section it needs — found via grep/glob over the doc's existing navigable structure — instead of loading all 184 KB. The doc's structure (the `### ` decision records, the section headers) is the index. **The doc OWNER (`pm-architect`) still reads/authors the whole file** when refreshing it — targeted reading is a CONSUMER discipline, never applied to the owner authoring its own canon.
2. **Correctness is preserved — read targeted BUT SUFFICIENT.** The change is instructional (how to read), not a removal of content: everything is still accessible; agents read targeted by default and read more when the task genuinely needs broad context (the arch note defines the "read the navigation/index first → then the relevant section → widen only if needed" pattern + which agents/steps are exempt). No agent is left blind to context it needs to do its job — that is the load-bearing safety the arch note must guarantee.
3. **The always-on stays thin.** `WORKFLOW.md` is already a thin constitution + router (progressive disclosure — topic files on-demand). This feature confirms that discipline and trims any eager-loaded redundancy that crept into the OpenCode `AGENTS.md` (preview labels, cross-model/orchestrator notes) WITHOUT dropping a load-bearing rule. (Lower-risk than scenario 1; smaller win.)
4. **Both harnesses, neutral.** The reading discipline lives in the shared neutral prose (agent bodies + the relevant `workflow/*.md` reading guidance), so it serves Claude self-host AND OpenCode + the protocol's own dogfood; stated in the neutral vocabulary; the Claude `.claude/` golden is re-frozen if a body changes (same as the neutralization slices).

## Existing behaviors this feature touches (what must NOT break)

- **The agents' context-gathering (Step 1, and each agent's "read inputs" step).** The agents currently read docs in full; changing to targeted reading MUST keep every agent's decisions as well-informed (the arch note proves sufficiency per role). This is the core risk.
- **`doc/architecture.md` structure as the index.** Targeted reading relies on its `### ` decision records + section headers being a reliable navigation — already true (it is a structured doc). No doc restructuring in this slice.
- **The neutral-prose standard + the golden.** Agent-body edits stay neutral (`tests/neutral-prose.sh`) and re-freeze the golden (Claude byte-equivalence test follows the new bodies). Mechanism unchanged from slices 10–11.
- **The dogfood self-host.** The protocol reads its OWN architecture.md (184 KB) targeted too — must not lose the orchestrator/agents' ability to drive correctly.

## Test plan

- **Existing:** `tests/hooks.sh` 79/79; `tests/generator.sh` 4/4 (golden re-frozen if bodies change); `tests/opencode.sh` + plugin-unit + neutral-prose green.
- **New:**
  - `targeted-reading-discipline-present`: a form check that the consumer agent bodies / the reading-guidance state the targeted-read rule (read the relevant section of a large doc via the index, not the whole file; owner reads fully) — specific enough to catch a regression that drops it.
  - (arch-note-dependent) any guard the arch note specifies to keep "sufficient" provable.

## Docs to update

- `doc/architecture.md`: a decision record — **consumer agents read large docs targeted (by section/index), the doc owner reads fully; the always-on stays thin** — the context-leanness discipline, motivated by token COUNT, safety = read-targeted-but-sufficient. Owned by `pm-architect`, post-coding.
- the relevant `workflow/*.md` (pipeline / the agents' read steps) + the agent bodies ARE the artifacts changed (the discipline lives there), neutral-prose-clean.

## Out of scope

- **Restructuring or shrinking the docs themselves** (e.g. splitting architecture.md) — this slice changes HOW agents READ, not the docs. A doc-split is a separate, bigger question.
- **Shrinking the agent bodies / the always-on aggressively** — scenario 3 trims only safe redundancy; a deep body-rewrite is a separate effort (and risky).
- **Fewer agent spawns / batching** — that is the orchestrator's operating discipline, not a protocol artifact.
- **Caching** — reduces COST, not COUNT; not this feature.

## Key design decisions

- **The arch note is mandatory and is the safety gate.** The whole risk is "read less → lose needed context → degrade." The `pm-architect` arch note must define: which agents/steps read targeted vs full; the read pattern (index/navigation first → relevant section → widen only if the task needs it); the per-role sufficiency argument; and the owner-reads-fully carve-out. Nothing ships until that discipline is proven not to blind an agent.
- **Instructional, not deletional.** Targeted reading is a default behaviour in the prose, not a removal of access — agents can always widen. This keeps the change reversible and safe.
- **Phase it:** scenario 1 (targeted reading of the big doc — the real win) first; scenario 3 (always-on trim — smaller, also-safe) can ride along or follow. Do the high-value, well-understood part carefully; don't over-reach.
