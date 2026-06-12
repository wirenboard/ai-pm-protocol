# Decision — downstream feedback transport

**Question:** how does a downstream project's experience feed back into this repo's protocol?

**Answer:** the Operator carries the report. The upstream session maps it to the protocol's structure and lands a compact entry — the protocol finding, not raw downstream content — in `.ai-dev/backlog.md` or as a GitHub issue on the Operator's authorization. The procedure lives in orchestrator `## Downstream feedback`.

## Design constraints resolved

- **Transport:** Operator paste. The downstream's session emits a problem report; the Operator copies it into the upstream session. The upstream session never reads into a downstream repo (project-boundary deny — invariant 2).
- **Privacy:** only the protocol-level mapping lands in the durable record. Raw downstream content is not committed unless the Operator explicitly OKs it.
- **Opt-in:** the triage fires on explicit Operator action. The Operator decides which downstream reports to feed back; the upstream session never solicits them.
- **One home (invariant 6):** a duplicate finding merges into an existing backlog item rather than creating a parallel entry for the same root cause. The downstream signal is noted on the existing item.
- **GitHub issue vs backlog item:** a finding is a backlog item by default. It becomes a GitHub issue when it is actionable enough to track publicly — the Operator makes that call; the session drafts and the Operator authorizes.
