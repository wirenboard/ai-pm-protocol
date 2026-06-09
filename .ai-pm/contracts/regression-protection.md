# Product Contract: regression-protection

User-facing contract for the guarantee that **a change cannot quietly break what already worked** — every user-facing feature records what must keep working, and any change that violates one of those recorded promises blocks the PR. The *user* is the PM (whose existing product behavior must survive new work) and the AI agent (which must re-verify every touched contract's must-not-break list before a change can pass).

---

## User value

The most dangerous failure in fast development is the silent regression — a new feature that quietly breaks an old one nobody re-tested. This guarantee closes that: every user-facing feature carries a Product Contract naming, in plain language, what it must do and what must never break; whenever a change touches that feature, those promises are re-checked against the diff, and a violation blocks the PR rather than slipping through. The PM gets durable, accumulating protection of everything the product already promises, without re-describing it each time.

## Who uses it

The AI coder (which must not break a recorded promise without a plan that explicitly changes the contract), the plan-compliance checker (which re-verifies the contract against every touching diff), the auditor (which flags missing or stale contracts project-wide), and the PM (who owns the meaning of each promise).

## Must work

- Each user-facing feature has a Product Contract recording its must-work and must-not-break promises in plain product language.
- A change that touches a feature is checked against that feature's must-work and must-not-break items before it can pass; touching a must-item without updating the contract is blocking.
- A user-facing quantified limit the product promises (max devices/endpoints, perceived throughput) is recorded as a must-not-break invariant; a limit not yet quantifiable is recorded for the PM, never invented.
- The auditor flags features with no contract, stale contracts, and contracts that drift from observed behavior.

## Must not break

- A recorded must-not-break invariant cannot be silently relaxed — a plan's "out of scope" may not quietly weaken a must-not-break item, and the checker compares migrated-vs-original wording and blocks if any guarantee is dropped or weakened.
- A regression against a recorded promise blocks the PR; it never passes as a mere note.
- The contract's PM-facing sections stay token-free product language; machine grammars are referenced from their single owner, never restated inline — so the promise stays readable and stable across changes.
- Backend-only changes legitimately skip contract checks, but a change that *does* alter visible behavior cannot use that exemption to dodge regression-protection.

## Acceptance checks

- `doc/_templates/contract.md.tmpl` § "How this file is used" — verifies the coder/plan-checker/auditor contract-check wiring.
- `doc/architecture.md` § "Product Contracts as the product-side complement to stack-notes" — verifies one-contract-per-feature and the dimension-1 compliance check.
- `doc/architecture.md` § "Contracts are two-layer" + the wire-token lint — verifies the migrate-without-dropping-a-guarantee block.

## Out of scope

- Protecting behavior of a change that has no user-facing surface — backend/infra refactors carry no contract unless they change visible behavior.
- Judging whether a promise is *worth* keeping — the PM owns the meaning of each must-work / must-not-break item; this guarantee only enforces that recorded promises survive.

## Last reviewed

2026-06-07 — by pm-architect, against current main

## Built/changed by

- integrate-consultancy — 2026-05-30 — Product Contracts as the product-side complement to stack-notes; the must-work / must-not-break shape.
- contract-two-layer-token-lint — 2026-06-03 — the migrate-without-dropping-a-guarantee block and the token-free PM layer.
- nfr-operational-limits-prompt — 2026-06-04 — user-facing quantified limits homed as must-not-break invariants.
- contract-centric-product-map — 2026-06-02 — contracts as the source of truth, with the per-feature artifact check as a DoD/auditor backstop.

---

## Behavioral contract

The regression-protection rules are single-sourced, not restated here: the contract shape and its check wiring in `doc/_templates/contract.md.tmpl`; the contract lifecycle and one-per-feature rule in `doc/architecture.md` § "Product Contracts as the product-side complement to stack-notes"; the two-layer / migrate-without-loss discipline in `doc/architecture.md` § "Contracts are two-layer".
