# Execution State

- **Status:** idle
- **Last shipped:** `automode` — decision-authority mode (`autonomous | interactive`, default interactive). Two scopes (project-wide via `.ai-pm/decision-authority.md` + per-feature plan override), one engine; advocate gaps resolved by an announce + derive-from-cited-canon-or-escalate gate, recorded as `auto`/`escalated` `## Resolutions` entries with a citation guard (pm-plan-checker + pm-auditor); merge/ship stays manual in both scopes; `veto-window-seconds` recorded (not enforced as a v1 countdown); bootstrap asks the authority question; absent file/unrecognized ⇒ interactive, no migration. Released v2.20.0, PR #199 merged 2026-06-04. Archived: `.ai-pm/state/archive/automode-2026-06-04.md`.
- **This session shipped (2026-06-04):** v2.15.0 pm-product-advocate · v2.16.0 legacy-reader-role-split · v2.17.0 doc-migration-on-template-bump · v2.18.0 protocol-process-flavor · v2.19.0 documentation-flavor · v2.20.0 automode; + full audit 2026-06-04.
