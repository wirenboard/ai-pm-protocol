# secrets-review-hygiene — review

Small security-discipline addition (not a planned feature; no plan file). Grounded in a live nula observation: a code-review subagent reached for the real `.env` (caught by OpenCode's permission prompt) when `.env.example` carried the same keys.

## What shipped
- **Canonical rule** (`workflow/security-surfaces.md`, `e344878`): a new sub-section "Secrets are read from the committed template, never the live file" — agents inspect env/secret config via the committed template (`.env.example` / `*.example` / `*.sample`) + verify `.gitignore` covers the real secret file; never read the live `.env` (or any real secret file) into context (template mirrors structure → nothing review-useful lost; live values are never review-needed + must not enter an LLM transcript). Harness-neutral, cross-harness.
- **OpenCode reviewer echo** (`code-review.body.md` → regenerated agent, `4032b0a`): the security aspect's inspection clause single-sources the rule.
- **Test** (`tests/opencode.sh` `oc-reviewer-secrets-from-template`): asserts the reviewer carries the read-template-not-live-`.env` discipline.

## Code review findings
**Pass-2 `code-review` (cross-model Sonnet).** Over-reach check: CLEAN (the rule is scoped to inspection — it does NOT block the Step-5.5 run-it-for-real / diagnostic-probe flows; the app reads `.env` at runtime, the agent never needs the secret VALUES in context). Coherence: CLEAN (right altitude; body single-sources, no conflict with the existing flag-hardcoded-secrets rule — how-to-inspect vs what-to-flag). 2 findings, both FIXED:
1. (test false-pass) the `oc-reviewer-secrets-from-template` 3-independent-grep form could pass for the wrong reason (the pre-existing bullet already has "not" + `.env`). → `9948f47`: single contiguous sentinel match (`never read the live \`.env\``) + template-list assert. **Non-vacuity verified: reversing the prohibition now FAILS the test (the bug is caught).**
2. (body dropped `*.sample`) the canonical rule says `*.example / *.sample` but the body listed only `*.example`. → `9948f47`: `*.sample` added to the body.

## Code review: FIXED — `9948f47` (Pass-2 2 findings; over-reach + coherence clean)
Re-verified: opencode 40/40, generator 4/4 (Claude byte-identical), neutral-prose 5/5, hooks 79/79, oc-plugin-unit 63/63, core-delegation 2/2, targeted-reading 7/7, ultra-absent 2/2.

## Verdict (Pass 2): approve
