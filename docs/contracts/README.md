# Product contracts

The protocol's own product is a set of **enforced behavioural guarantees**. Each file here states one: what it must do for its user (the PM and the AI agent driving the loop), and what must never break. They are the regression floor — a change that touches a guarantee re-checks it; a violation blocks.

These are the *promises*, not the mechanism. Where a rule is enforced lives in its single home — `PROTOCOL.md` (the loop, invariants, enforcement map), `docs/architecture.md` (the mental model), the `src/adapter/` deny-rules + tests. A contract names the guarantee; it never restates the rule.

| Contract | Guarantees |
| --- | --- |
| `disciplined-pipeline` | every change runs the fixed plan → build → review → ship loop; nothing ships without a review stamp |
| `plan-fidelity` | the code that lands matches the approved plan — no silent scope drift, every scenario built and tested |
| `cross-model-review` | review runs on a different model than the one that wrote the work — independent blind spots, announced, with graceful fallback |
| `cross-session-enforcement` | the load-bearing rules hold mechanically across fresh/forgetful sessions — a named deny-list, not a blanket block |
| `project-boundary` | agents stay inside the project root; repo-owned files change only through git |
| `regression-protection` | a recorded promise cannot be silently broken or weakened — a violation blocks the PR |
| `product-readiness-gate` | a user-facing feature cannot reach code while a foundational product question is unanswered |
| `decision-authority` | product forks resolve at the right human-involvement level; merge and ship always stay manual |
| `documentation-discipline` | every project carries a maintained doc set with one owner per doc; the protocol dogfoods it |
| `dual-harness-from-one-source` | the protocol runs on Claude Code and OpenCode from one neutral core; both adapters faithful |
| `automated-quality-tooling` | every project gets stack-appropriate automated quality tools (linters, type-checkers, SAST) wired and tuned at setup, run every loop |
