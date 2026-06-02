# Backlog

Observations and follow-ups recorded during reviews/audits.

## From architect-owns-architecture-md review v1

- ~~Bootstrap full-mode has the orchestrator writing `docs/architecture.md` inline after the docs-extractor; reconcile the legacy/greenfield asymmetry.~~ **Resolved** (self-audit 2026-06-02): `pm-bootstrap.md` legacy-full now spawns `pm-architect` (Section A) to finalize `docs/architecture.md` — no orchestrator inline edit remains; the two paths are symmetric.
