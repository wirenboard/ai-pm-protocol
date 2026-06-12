# Contract: decision-authority

**Product forks resolve at the right level of human involvement** — a non-derivable, security-relevant, or irreversible fork escalates to the Operator, while merge and ship always need the Operator's explicit authorization, in both authority modes.

A protocol that asks about *everything* is exhausting; one that decides *everything* is dangerous. The dial has two ends and a clear rule for which applies to each fork. By default the Operator answers each product fork (interactive). Optionally the loop resolves forks itself from cited project canon (autonomous) — but only when the answer is genuinely derivable, announcing each decision before acting, and always escalating a fork that is not derivable, touches a security surface, or is irreversible. Whichever mode is in force, the Operator keeps the merge and ship decision — authorizing each explicitly, then either acting by hand or letting the loop execute it.

## Must work

- A fork resolves under one of two modes (`autonomous | interactive`); an absent or unrecognised setting resolves to `interactive` — the safe default, never an error.
- In autonomous mode a fork is auto-resolved only when its answer is derivable from cited canon; the decision is announced before acting.
- A fork that is not derivable, OR touches a security-relevant surface, OR is Operator-marked irreversible — escalates regardless of mode.
- Merge and ship need the Operator's explicit authorization in both modes — autonomy carries a feature to a finished, reviewed result and stops there; nothing merges without the Operator's per-merge authorization (never inferred), though the loop may *execute* the merge once it is given.

## Must not break

- Autonomy is an upper bound, never a requirement — the escalate-regardless cap always overrides autonomy.
- An autonomous decision never confabulates a direction the canon did not imply — no citable passage means no auto-decision.
- A numeric self-confidence threshold is explicitly rejected — the gate is a citable-canon test, not a confidence score.
- A merge never happens on an inferred or standing grant — the authorization is **explicit and per-merge**; only the *execution* of the merge is delegable to the loop, never the *decision*.
