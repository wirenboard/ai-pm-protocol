# Direction — the protocol as a development engine

The compass for the next arc (Operator, 2026-06-10). Lean by design: the *why*, not a spec.

The protocol is a **development engine**, not a product — the products built on it are arbitrary. For it to be viable, the process it drives must carry **product and security discipline first-class**, without bloating the thin core (`PROTOCOL.md` must stay readable in one sitting).

## Four pillars

1. **Product discovery** — force *aiming* (market · users · where each feature lands), not just coding what's asked.
2. **Threat model** — an explicit, assembleable security capability, not a discipline diffused across the Reviewer checklist + deny layer. (Shipped as the `threat-model` capability module.)
3. **Discipline** — relentless doc + code brevity, no prose-in-comments, whole-surface no-duplication. **Pillar 3 polices the other three.**
4. **Configurable rigor** — at setup a project chooses where to cut ceremony (orchestrator-builds vs spawn-a-Builder, plan formality, optional beats). The speed↔quality dial is the project's choice, never a fixed cost. (Shipped as the `profile` config: `full | lite | solo | yolo`; see `## Project config` in `PROTOCOL.md`.)

## The architecture principle (non-negotiable)

Pillars 1, 2, 4 grow as **side-tools, config, and capability modules — never as core-constitution bloat.** The failure mode is not "too few features" — it is **"the core bloats chasing them."** Every pillar ships under the whole-surface no-duplication guard.

## The mechanism principle (the protocol must pull its own weight)

**A mechanism counts only if it fires WITHOUT the Operator's vigilance.** If the Operator still has to *notice* a failure class for it to be caught, the mechanism failed — convert that catch into a check, a rule, or a module. (This is why a deny rule beats a paragraph, a parity test beats "remember to keep them in sync", and a module beats a persona reminder.)

## The floor (configurable rigor must not cut the value)

Some rigor is **not** cuttable by a guarantee profile: **independent review by a separate context** (builder ≠ reviewer), the **honesty gates**, and **the Operator's explicit merge authorization** (the orchestrator may execute the merge, never decide it). A guarantee profile (`full`/`lite`/`solo`) trims ceremony, never the floor. `yolo` is the explicit off-guarantee escape hatch — merge-gate off, no Reviewer required; the Operator's explicit merge word remains (see `PROTOCOL.md` `## Project config`).

## Sequence

Configurable rigor first (done) → threat model (done) → product discovery, each a side-tool, one at a time. Discipline is ongoing. Competitor/market research lands per-pillar, when there is something concrete to position.
