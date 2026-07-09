# Plan: Universal image-cache carve-out

## Goal

Fix the hardcoded `.claude-proxy` assumption — that was just a profile folder name chosen by the user, not a proxy program. Rewrite the carve-out to discover **any** sibling directory with an `image-cache/` subdirectory.

## Design

**Where:** `src/adapter/claude/sanctioned-scratch.mjs` — replace block (3) with a universal discovery pattern.

**New approach:**
- Scan parent of `CLAUDE_CONFIG_DIR` for sibling directories
- For each sibling, check if `<sibling>/image-cache/` exists
- If yes, add to carve-out with `writable: false`
- Fail-closed: if no sibling with `image-cache/` found → nothing added (no error)

**Why:** Works regardless of profile folder name (`.claude-proxy`, `.my-claude`, etc.) — only requires the `image-cache/` subdir pattern.

## Files

- `src/adapter/claude/sanctioned-scratch.mjs` — replace hardcoded proxyPath with sibling scan
- `src/adapter/claude/sanctioned-scratch.test.mjs` — update tests

## Verification

- Unit tests pass
- Real test: create temp sibling with `image-cache/`, verify Read tool succeeds

## Semver

PATCH — fixing a hardcoded assumption, no new capability

## Decisions under autonomy

None expected — bug fix for overly narrow pattern.
