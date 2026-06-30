// Session-root + target-repo resolution for the platform shims. This is fs/git-BOUND
// glue (it shells out to `git` and stats the tree), the shim's job — NOT the engine's:
// the engine stays pure and consumes the resolved boolean (`input.targetsSessionRepo`),
// it never resolves a repo itself. One home so both platform shims resolve identically.
//
// The bug this closes: the old root resolution was `git rev-parse --show-toplevel` from
// cwd, which flips to a NESTED repo's toplevel when cwd is inside one (e.g. a separate
// repo bootstrapped under `_scratch/proj/.git`). That mis-anchored the write-boundary,
// the stamp read, and the merge-gate onto the nested repo — false positives on a
// legitimate separate-repo bootstrap. The session is anchored instead to the nearest
// `.ai-dev/config.json` marker (the protocol/downstream root carries it; a nested repo
// does not), and the git-targeting denies are scoped to the SESSION repo's git db.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Walk up from `cwd` to the nearest ancestor dir carrying `.ai-dev/config.json` (the
// session marker). Returns that dir, or null when none is found (an unconfigured
// project — the caller falls back to the git toplevel). The NEAREST (deepest) marker
// wins: a configured project nested under another resolves to its own root, not the
// parent's.
export function findSessionMarkerRoot(cwd) {
  let dir = path.resolve(cwd);
  for (;;) {
    if (fs.existsSync(path.join(dir, ".ai-dev", "config.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null; // filesystem root reached, no marker
    dir = parent;
  }
}

// The git work-tree toplevel of `cwd`, or null when cwd is not in a work tree / git
// errors / git is absent. POSITIVE resolution only — a null means "could not be
// positively resolved", which every caller treats as the fail-CLOSED direction.
export function gitToplevel(cwd) {
  try {
    const top = execFileSync("git", ["rev-parse", "--show-toplevel"],
      { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return top || null;
  } catch { return null; }
}

// Resolve the SESSION root for a hook whose working dir is `cwd`. Priority:
//   1. the nearest `.ai-dev/config.json` marker dir (the session anchor — a nested
//      `.git` under it never flips the root);
//   2. the git toplevel (an unconfigured project still gets its repo root — the old
//      behaviour, unchanged);
//   3. cwd (no marker, no git — the last-resort fallback, unchanged).
// NORMAL case is byte-identical to the old git-toplevel resolution: at a real session
// root the marker dir IS the git toplevel; only the nested-cwd case is corrected.
export function resolveSessionRoot(cwd) {
  const base = path.resolve(cwd);
  return findSessionMarkerRoot(base) || gitToplevel(base) || base;
}

// Does the command's working dir target the SESSION repo's git db? Compares cwd's git
// toplevel against the SESSION repo's git toplevel (the git root containing the session
// root) — NOT the marker dir, so a configured project that is itself a subdir of a
// larger git repo is still correctly recognised as the session repo (its commands are
// NOT exempted).
//
// FAIL-CLOSED — load-bearing for the floor: returns TRUE (the deny applies) unless cwd
// is POSITIVELY confirmed a DIFFERENT repo. Any doubt — cwd's toplevel unresolvable, the
// session repo's toplevel unresolvable — defaults TRUE. It returns FALSE only when BOTH
// toplevels resolve and differ: cwd is provably a separate nested repo, whose `add -A` /
// `push main` target a different git db + origin and can never move the protocol's main.
export function targetsSessionRepo(cwd, sessionRoot) {
  const cwdTop = gitToplevel(cwd);
  if (cwdTop === null) return true; // cwd repo unresolvable ⇒ fail-closed (deny applies)
  const sessionTop = gitToplevel(sessionRoot);
  if (sessionTop === null) return true; // session repo unresolvable ⇒ fail-closed
  return path.resolve(cwdTop) === path.resolve(sessionTop);
}
