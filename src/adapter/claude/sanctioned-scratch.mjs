// Claude adapter — derive the agent's OWN sanctioned out-of-root scratch roots from
// the harness environment, fail-CLOSED. The boundary deny (invariant 2) is anchored to
// the session root (+ declared components) to keep an agent out of OTHER projects. But it
// also false-blocks the agent's OWN workspaces the harness itself hands it — the tool-result
// overflow store (a fetched doc/image body that exceeded the inline cap) and the per-session
// temp root (the scratchpad, staged pasted files, the tasks/ dir). This module derives those
// two roots from the Claude Code env so the read-family boundary predicates can carve them
// out. CC env conventions live HERE (the adapter), never in the neutral engine.
//
// Fail-closed throughout: a path is admitted ONLY if it is built from present env, realpath-
// resolves to an existing directory, and passes the overbroad/ancestor guard (mirrors
// componentRoots in engine-components.mjs — the riskiest widening logic). Bad/absent env ⇒
// empty set ⇒ byte-identical to today's strict behaviour. The two paths are derived
// INDEPENDENTLY — one failing its check does not poison the other.
//
// Read-only widening: this set is consulted by the READ boundary predicates only; writes
// outside the root stay denied (the reported symptom is reading fetched/overflow content
// back, not writing to scratch). See docs/decisions/out-of-root-scratch-allow.md.

import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { isFilesystemRoot, isAncestorOrEqual } from "../engine-paths.mjs";

// realpath or null — a missing / unreadable path yields null (fail-closed skip), never throws.
function realDir(p) {
  try {
    const real = fs.realpathSync(p);
    // Confirm it resolved to a directory (a stale file at the path is not a usable scratch root).
    const st = fs.statSync(real);
    return st.isDirectory() ? real : null;
  } catch {
    return null;
  }
}

// CC's project-slug convention: the session-root absolute path with `/` → `-`
// (verified empirically: /home/.../ai-pm-protocol → -home-...-ai-pm-protocol; case preserved,
// no lowercasing). Matches the `~/.claude/projects/<slug>/` dir CC itself creates.
function projectSlug(root) {
  return path.resolve(root).replace(/\//g, "-");
}

// The overbroad guard, shared with componentRoots' discipline: a sanctioned root must NOT
// contain the session root (widening to a parent re-exposes everything above the work,
// including the enforcer's own tree) and must NOT be a filesystem root. It may be INSIDE the
// session root (harmless — already allowed by the component set), though in practice both
// derived roots are outside it. `boundary` is the parent the sanctioned root must stay a
// proper descendant of (the config dir for the tool-results store; the per-project temp base
// for the session root) — a symlink that realpath-escaped the boundary is rejected.
function admissible(sanctionedReal, rootReal, boundaryReal) {
  if (!sanctionedReal) return false;
  if (isFilesystemRoot(sanctionedReal)) return false;
  if (isAncestorOrEqual(sanctionedReal, rootReal)) return false; // would contain the session root
  if (boundaryReal && !isAncestorOrEqual(boundaryReal, sanctionedReal)) return false; // escaped its parent
  if (boundaryReal && sanctionedReal === boundaryReal) return false; // the parent itself (too broad)
  return true;
}

// Derive the sanctioned-scratch roots for THIS session from env. Returns canonical
// (realpath'd) absolute paths — possibly empty. `env` defaults to process.env so the shim
// can call it with no args; tests pass a mock env + a real tmp tree.
export function deriveSanctionedScratch(env = process.env, root = process.cwd()) {
  const out = [];
  const rootReal = (() => { try { return fs.realpathSync(path.resolve(root)); } catch { return path.resolve(root); } })();
  const slug = projectSlug(root);

  // (1) tool-result overflow store: <CLAUDE_CONFIG_DIR>/projects/<slug>/tool-results/
  const configDir = typeof env.CLAUDE_CONFIG_DIR === "string" && env.CLAUDE_CONFIG_DIR.trim()
    ? env.CLAUDE_CONFIG_DIR
    : null;
  if (configDir) {
    const boundaryReal = realDir(configDir);
    if (boundaryReal) {
      const p = realDir(path.join(configDir, "projects", slug, "tool-results"));
      if (admissible(p, rootReal, boundaryReal)) out.push(p);
    }
  }

  // (2) per-session harness temp root: <TMPDIR|/tmp>/claude-<uid>/<slug>/<CLAUDE_CODE_SESSION_ID>/
  const sid = typeof env.CLAUDE_CODE_SESSION_ID === "string" && env.CLAUDE_CODE_SESSION_ID.trim()
    ? env.CLAUDE_CODE_SESSION_ID
    : null;
  if (sid) {
    const tmp = (typeof env.TMPDIR === "string" && env.TMPDIR.trim()) ? env.TMPDIR : os.tmpdir();
    const uid = typeof process.getuid === "function" ? process.getuid() : null;
    const segs = [tmp, uid !== null ? `claude-${uid}` : "claude", slug, sid];
    const base = path.join(...segs.slice(0, 3)); // <tmp>/claude-<uid>/<slug> — the boundary
    const boundaryReal = realDir(base);
    if (boundaryReal) {
      const p = realDir(path.join(...segs));
      if (admissible(p, rootReal, boundaryReal)) out.push(p);
    }
  }

  return out;
}

// Exported for the unit test (mirrors engine.mjs's `_internals` pattern) so the overbroad
// guard is exercised directly with controlled paths, not only through the env-derived
// black box (which cannot plausibly produce an overbroad path from real harness env).
export const _internals = { admissible, projectSlug, realDir };
