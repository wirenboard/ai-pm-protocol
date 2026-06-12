# Contract: project-boundary

**Agents stay within the project, and repo-owned files change only through git** — no agent reads, searches, or writes outside the project root, and a repo-owned file is never silently edited in place on a remote system.

An AI agent loose on the filesystem — reading sibling repos, editing production files in place — is a trust and integrity hazard. Two hard lines: every agent stays inside the project root; and any file the repo owns changes through git, never by an in-place edit on a remote system, so git history stays the single source of truth.

## Must work

- Every agent stays within the project root — never reads, searches, or writes outside it; the carve-out inside the root is that the enforcer's own source (`.ai-pm/tooling/`) is off-limits to read and write.
- A repo-owned file (code, schema, config template, manifest) changes through git — never by an in-place edit on a remote system.
- Runtime state, deployment actions, dev experiments, and Operator-initiated remote maintenance remain permitted — the boundary is about the source of truth, not about whether remote access is allowed at all.

## Must not break

- The boundary holds across sessions — mechanically enforced at the tool boundary, not dependent on a session re-reading the rule.
- Legitimate read-only diagnostics and the project's own deployment/CI channel are never blocked — the bright line is "does the remote file have a sibling in the repo?", not "is remote access allowed?".
