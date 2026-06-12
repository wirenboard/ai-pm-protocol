# Contract: product-readiness-gate

**A user-facing feature cannot proceed to code while still under-specified** — the foundational product questions are matched against the plan, and the build is held until each gap is answered or consciously descoped.

The orchestrator both elicits product detail and pushes toward coding — player and referee at once — so an under-specified product could sail straight into implementation. This inserts an independent product check between planning and coding: on a user-facing feature it matches the plan against a fixed set of foundational product questions and holds the build until each gap is either answered or deliberately descoped with a recorded reason. The answer always stays the Operator's — the check judges presence of an answer, never its quality.

## Must work

- On a user-facing feature, the foundational product questions are matched against the plan, contract, and docs before the build starts; each gets a recorded answer or a conscious descope.
- The result is a positive, greppable signal: clean (zero gaps) or a blocking list until resolved — never a silent skip, never a permanent veto.
- Backend / infrastructure / docs-only / trivial / diagnostic changes are exempt — the gate does not run.

## Must not break

- The gate judges presence of a recorded answer, never answer quality — the Operator owns meaning; the gate never overrides the Operator.
- A blocking gate is dismissible by answering or descoping, never a permanent veto.
- The signal stays positive-presence (clean, or N gaps with N resolutions), never an empty absence that reads as "passed".
