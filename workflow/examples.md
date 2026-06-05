> **Topic file of the orchestration spec** — read on demand from `WORKFLOW.md`'s navigation map. This is the illustration catalog: the worked examples and ✓/✗ pairs that make the rules concrete. Read it for a fuller picture of any rule whose one-liner is in `WORKFLOW.md` or whose body is in another `workflow/*.md` file.

## Illustrations

The illustrative blocks live **with the rule they illustrate** — moving an example away from its rule would leave the rule less self-contained for an agent that Reads only that one topic file. This catalog points at each worked example in its home and reproduces the two free-standing diagrams.

### Where each worked example lives

- **PM-communication ✓/✗ pairs** (lead-with-impact, trade-offs, one-question-at-a-time, jargon, report-without-panic) — inline with each rule in `workflow/pm-comms.md` (`## How to talk to the PM`). They are the rule's own demonstration, not a detachable appendix.
- **The Matter / smart-home blast-radius worked example** — inline under **Blast-radius preflight** in `workflow/incident.md` (`## When you say it doesn't work in production`). It is the canonical illustration of *reversible locally ≠ reversible for a coupled external peer*.
- **The probe-proposal template** (Problem / hypothesis / Probe / What we'll watch / After / Authorize?) — inline under **Step A.5** in `workflow/incident.md`.

### The offline-delivery flow (PM diagram example)

The "draw a diagram when structure matters" rule (`workflow/pm-comms.md`) uses this as its model — ASCII is fine, used to show flows / states / relationships:

```
User offline → messages queue → user reconnects → messages delivered in order
                    ↑
             (stored locally, max 500)
```
