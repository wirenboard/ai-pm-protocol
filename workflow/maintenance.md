> **Topic file of the orchestration spec** — read on demand from `WORKFLOW.md`'s navigation map. Read it for the template-bump / post-bump-audit procedure.

## Maintenance

To get the latest agent versions when a new template is released:

```bash
git submodule update --remote .ai-pm/tooling
git add .ai-pm/tooling
git commit -m "chore: bump ai-pm-protocol"
```

Or just ask the orchestrator — "update the template" / "bump ai-pm-protocol to vX.Y". This is dependency / chore work, not a feature: the orchestrator does the submodule bump on a branch, commits it as `chore:`, and runs any pending template-upgrade migration (see `pm-bootstrap.md` § "Pending template-upgrade migrations"). No `/pm-plan` needed.

After the bump, run `/pm-audit` — alongside the mechanical pending-migration detection, its existing docs-currency checks surface the content disciplines a newer template version introduced (a missing journey, an empty `product.md` funnel, a skeletal threat-model) and offer to fill them with the PM (the disciplines and their question sources are registered in `### Expected-discipline manifest` in `MIGRATIONS.md`).
