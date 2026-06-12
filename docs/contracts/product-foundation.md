# Contract: product-foundation

**A project defines its product and its users — a durable brief — before it builds features, through GENUINE discovery: gather the product's real zero-to-working story prejudice-free, then conclude — able, at the end, to conclude "we built the wrong thing." Every feature then grounds in that brief.**

Onboarding wires the machinery but never establishes *what product, and for whom* — discovery inserts that missing first step: a dialog recording a durable brief (`docs/product.md`) that every feature then grounds in. It is grounded in the established discovery frameworks (*Working Backwards*, *Lean Canvas*, Cagan's four risks, Torres): customer and problem first, the competition named explicitly, a case-against built in. The procedure lives in `src/agents/orchestrator.md` `## Product discovery`; the brief's shape in `src/templates/product.md`.

## Must work

- Discovery runs at onboarding (right after `setup`), is offered — short, declinable — on the first feature request to a configured project with no brief, and runs on demand.
- Discovery anchors on the idea (brief §0) and reasons around it — every question's options plausible *given* the product; the idea is a seed discovery may reshape or reject, not a lock.
- The brief's spine is the concrete zero-to-working story — questions a non-expert can actually answer, preferred over abstract prompts.
- The competition is named, never skipped; an unknown landscape is researched first (the `research` side-tool) and drafted for the Operator to correct.
- Gathering and concluding never mix: while gathering it is a gap detector, not a judge; the case against is weighed only at the end (the two-phase procedure: the orchestrator's `## Product discovery`).
- The brief lives in its single home (`docs/product.md`) — features point to it, never restate it.
- A feature plan's product questions check the change against the brief — does it serve the product and user the brief names — not in isolation.

## Must not break

- Discovery never retrofits the brief onto what is already built — a dialog shaped to confirm the existing product is theater, not this contract. The ban targets confirmation theater when the Operator *knows* the product; an Operator who *declares it unfamiliar* gets the legitimate sibling path — provenance-labelled reconstruction (the orchestrator's draft-first mode), kept honest by the `[?]` discipline and the unchanged conclude phase.
- The gathering phase does not pre-judge — grading an answer or planting risk flags mid-stream contaminates the data; weighing belongs to the end.
- A discovery that cannot conclude "wrong product / cut / pivot" is not this contract — an invalidation-incapable rubber stamp is a break.
- Offered options are genuinely different directions with their tradeoffs — never flattering variations of one, never a fake fork on an axis that is really a spectrum.
- The orchestrator never invents the product — a number the Operator has not fixed is `[?]`, never guessed.
- Discovery is an offer, never a block — declinable; the nudge only reinforces a `[persona]` act, it cannot force one.
- The brief is kept current, not a one-time throwaway — a change that shifts who/why updates it.
