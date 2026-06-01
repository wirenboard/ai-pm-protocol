# audit-fixup-self-stack-notes — reviewer verdict v2 (re-check)

## Scope of this pass

Narrow re-check. v1 verdict (`audit-fixup-self-stack-notes_review.md`) was **approve** with three technical notes. The researcher acted on notes #1 and #3 (note #2 was already routed as "drop on merge"). This pass verifies only the two touched lines in `doc/stack-notes.md`. Everything else carries over from v1.

## Plan compliance

No change since v1. All scenarios remain satisfied.

## Re-check of v1 notes

### v1 Note #1 — `doc/stack-notes.md:60` (gh auth status gotcha)

**v1 ask:** drop the stale "issue still open at the time of writing" parenthetical or replace it with "fixed in PR #9240, behaviour pre-fix still affects older gh releases".

**v2 state of line 60:**

> `gh auth status` exit-code bug: in certain releases it returned 0 even when authentication had failed (fixed in `cli/cli#9240`, merged 2024-07-26; behaviour pre-fix still affects older `gh` releases — downstream code should not depend on the exit code as the sole signal). Source: <https://github.com/cli/cli/issues/8845>, fix: <https://github.com/cli/cli/pull/9240>.

**Verification against upstream:**

- `gh issue view 8845 --repo cli/cli` returns `state: CLOSED`, `closedAt: 2024-07-26T12:23:55Z`, title "`gh auth status` returns wrong exit code when failing". Confirmed closed.
- `gh pr view 9240 --repo cli/cli` returns `state: MERGED`, `mergedAt: 2024-07-26T12:23:54Z`, title "Exit with 1 on authentication issues". Confirmed merged the same day (the issue closed one second after the PR merged — standard auto-close behaviour).
- The researcher's cited date (2024-07-26) matches the merge timestamp exactly.
- The new wording correctly says "behaviour pre-fix still affects older `gh` releases" — substantively true; the project does not pin `gh` version, so callers on older `gh` may still hit it.

**Accepted.** The fix matches the v1 ask verbatim. No new finding.

### v1 Note #3 — `doc/stack-notes.md:107` (GitHub Actions `if:` operator caveat, bold "Treat as" wording)

**v1 ask:** verify whether <https://docs.github.com/en/actions/concepts/workflows-and-actions/expressions> now states the operator rule directly. If yes — soften the bold caveat (redundant). If no — keep the caveat.

**WebFetch of the docs page (two passes, different prompts):**

The page contains exactly two sentences that touch `if:`:

1. "Expressions are commonly used with the conditional `if` keyword in a workflow file to determine whether a step should run. When an `if` conditional is `true`, the step will run."
2. "The exception to this rule is when you are using expressions in an `if` clause, where, optionally, you can usually omit `${{` and `}}`."

The page does **not** mention `!` negation, `&&`, `||`, or function-with-operators in the context of `if:` clauses. No warning, no example, no note. The operator caveat is still implicit on the live docs page.

**v2 state of line 107:** the bold **Treat as:** caveat is unchanged from v1.

**Deferral accepted.** WebFetch confirms the docs page still leaves the operator rule implicit, so the researcher's caution is justified. The bold caveat earns its keep — it carries information the docs page does not. The original v1 ask was conditional ("defer if WebFetch on the docs page shows the rule still implicit"), and that condition is met.

## Blocking

None.

## Notes (product)

None new. The v1 product note (overall scope of 6 components, with Out-of-scope deferred to later plans) carries over unchanged.

## Notes (technical)

None new. v1 note #2 (researcher's empirical-marker count being off by one in the handoff summary) was already routed "drop on merge"; nothing in the v2 touches changes that calculus.

## New findings introduced by v2 changes

None. Both edits are surgical: line 60 swaps a parenthetical, line 107 was not touched. Neither alters citations, reorders sections, or affects field-count invariants checked in v1.

## Verdict

approve

The two cosmetic fixes land cleanly. Line 60's gh-auth-status gotcha now correctly cites the closing PR (#9240, merged 2024-07-26) and softens the lingering-risk language to "older `gh` releases" — verified against both the issue and the PR via `gh` CLI. Line 107's bold `if:` operator caveat is retained because GitHub's own expressions docs page still does not document the rule directly — verified via WebFetch. Nothing new found.
