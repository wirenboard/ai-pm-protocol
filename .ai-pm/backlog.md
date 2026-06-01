# Backlog

Observations and follow-ups recorded during reviews/audits.

## From architect-owns-architecture-md review v1

- Bootstrap full-mode (`bootstrap.md:149`) still has orchestrator writing `docs/architecture.md` inline after docs-extractor. The greenfield path now uses architect Section A; this legacy/greenfield asymmetry should be reconciled in a future plan that has docs-extractor hand off to architect for canonical architecture.md instead of orchestrator inline-edit. Not urgent — bootstrap full-mode is invoked rarely (legacy adoption) and the workaround is documented.
