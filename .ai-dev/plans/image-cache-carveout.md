# Plan: image-cache carve-out for claude-proxy

## Goal

Add a third carve-out to `src/adapter/claude/sanctioned-scratch.mjs` so the Read tool can access screenshots cached in `~/.claude-proxy/image-cache/`. Currently blocked by deny layer.

## Design

**Where:** `src/adapter/claude/sanctioned-scratch.mjs` — add a third derivation block after the existing two (tool-results and per-session temp root).

**Pattern:**
- If `CLAUDE_CONFIG_DIR` = `/home/user/.claude`, the proxy dir is the sibling `/home/user/.claude-proxy`
- Image cache = `<config-parent>-proxy/image-cache/` (read-only, never writable)
- Admissible check with boundary = config-parent directory (same as tool-results)

**Implementation:**
1. Derive `configParent` from `CLAUDE_CONFIG_DIR` (strip last path component)
2. Build proxy path: `<configParent>-proxy/image-cache/`
3. Call `realDir(proxyPath)` and `admissible()` with boundary = configParent
4. Push to out array with `writable: false`

**Verification:**
- Unit test in `src/adapter/claude/sanctioned-scratch.test.mjs`
- Real test: create a temp image in actual image-cache, verify Read tool succeeds

## Files

- `src/adapter/claude/sanctioned-scratch.mjs` — add third carve-out block
- `src/adapter/claude/sanctioned-scratch.test.mjs` — add test case

## Verification

- Unit tests pass
- Real test: Read tool can access a temp screenshot in `~/.claude-proxy/image-cache/`

## Semver

MINOR — new capability in sanctioned-scratch (third carve-out)

## Decisions under autonomy

None expected — pure extension of existing carve-out pattern, no security surface change (read-only, same fail-closed discipline).
