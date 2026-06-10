# Contract: regression-protection

**A change cannot quietly break what already worked** — every user-facing feature records what must keep working, and any change that violates one of those recorded promises blocks the PR.

The most dangerous failure in fast development is the silent regression — a new feature that quietly breaks an old one nobody re-tested. Every user-facing feature carries a contract naming, in plain language, what it must do and what must never break; a change that touches the feature re-checks those promises against the diff, and a violation blocks rather than slipping through. Protection accumulates without re-describing it each time.

## Must work

- Each user-facing feature has a contract recording its must-work and must-not-break promises in plain product language.
- A change that touches a feature is checked against that feature's promises before it can pass; touching a must-item without updating the contract is blocking.
- A user-facing quantified limit the product promises is recorded as a must-not-break invariant; a limit not yet quantifiable is recorded for the PM, never invented.

## Must not break

- A recorded must-not-break invariant cannot be silently relaxed — a plan's "out of scope" may not quietly weaken it; a migration that drops or weakens a guarantee is blocked.
- A regression against a recorded promise blocks the PR; it never passes as a mere note.
- Backend-only changes legitimately skip contract checks, but a change that *does* alter visible behaviour cannot use that exemption to dodge regression-protection.
