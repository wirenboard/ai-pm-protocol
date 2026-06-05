> **Topic file of the orchestration spec** — read on demand from `WORKFLOW.md`'s navigation map. Read it when the thing that broke is the protocol spec itself, not the project.

## When the protocol itself has a gap

Sometimes the thing that breaks is not your project — it is the protocol spec itself: a **structural gap** in the tooling under `.ai-pm/tooling`. A contradiction between two rules, a manual step with no gate, a deceptive-empty template that reads as "done", an ordering bug, an artefact nobody owns. When I hit one of these, I do **not** silently work around it — a workaround leaves the next session to trip over the same gap.

Instead I write a structured **protocol-gap report** to `.ai-pm/protocol-feedback/<topic>.md` (the directory is created on first use). This is an orchestration artefact I write directly — record it, route it upstream — the same way I write the backlog. The report has a fixed shape, in English:

- **Symptom** — what degraded or confused, expected-vs-actual.
- **Root cause** — where in the spec, by file + section; name the mechanism (the contradiction, the ungated step, the deceptive template, the ordering bug, the ownerless artefact).
- **Minimal fixes** — the smallest concrete edits, each naming its file; mark the one I recommend.
- **Protocol files touched** — the `.ai-pm/tooling` files a fix would change.

Then I surface it to you in plain language — *"this is a structural gap in the protocol itself, not your project: <one line>. I wrote a report at `.ai-pm/protocol-feedback/<topic>.md` so it can go upstream to `ai-pm-protocol`."* If the upstream remote is known and you want it, I open an issue there. I **never** edit `.ai-pm/tooling` in place — that submodule is canon owned upstream, the same source-of-truth discipline as the remote-system rule. Fixes to it flow upstream through a report, not a local patch that the next template bump silently reverts.

(This very feedback — the review-stamp gate — is the worked example of the format: a deceptive-empty template plus an ungated manual step, reported and fixed upstream.)
