# Contract: regression-protection

**A change cannot quietly break what already worked** — every user-facing feature records what must keep working, and any change that violates one of those recorded promises blocks the PR.

Every user-facing feature carries a contract naming what must keep working; a change that violates one blocks the PR.

## Must work

- Each user-facing feature has a contract recording its must-work and must-not-break promises in plain product language.
- A change that touches a feature is checked against that feature's promises before it can pass; touching a must-item without updating the contract is blocking.
- A user-facing quantified limit the product promises is recorded as a must-not-break invariant; a limit not yet quantifiable is recorded for the Operator, never invented.
- A confirmed defect, once fixed, cannot recur silently: the fix carries the test that pins it — failing before the fix, passing after (the floor ratchet, `src/agents/builder.md`); a genuinely untestable fix records its deferral with a reason, never silence.

## Must not break

- A recorded must-not-break invariant cannot be silently relaxed — a plan's "out of scope" may not quietly weaken it; a migration that drops or weakens a guarantee is blocked.
- A regression against a recorded promise blocks the PR; it never passes as a mere note.
- Backend-only changes legitimately skip contract checks, but a change that *does* alter visible behaviour cannot use that exemption to dodge regression-protection.
