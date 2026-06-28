// Git / merge-topic + review-stamp logic for the enforcement engine. Resolves the
// merge-gate topic from a push/merge command (or the .git/HEAD fallback), classifies
// tag and trunk pushes, and reads the review stamp. Pure regex reads — no shell, no
// interpolation. The traversal guard (isCleanTopic) is the choke point every topic
// source funnels through before a stamp path is built.

import fs from "node:fs";
import path from "node:path";
import { maskQuotedSpans } from "./engine-bash.mjs";

// Resolve the merge-gate topic from ANY branch, prefix stripped: the topic is the
// branch name with its leading work-prefix dropped (feature/foo→foo, fix/bar→bar,
// hotfix/x→x, a bare `topic`→topic). The ref named in the push/merge command
// OUTRANKS the checkout — pushing branch A from branch B's checkout must read A's
// stamp, not B's (live 4.19.x failure); .git/HEAD is the fallback for a bare
// `git push`/`git merge` naming no ref. A non-feature prefix (fix/…) must resolve
// too, or its unstamped push escapes the floor. Pure regex reads — no
// interpolation, no shell.
function stripPrefix(branch) {
  const slash = branch.indexOf("/");
  return slash === -1 ? branch : branch.slice(slash + 1);
}
// One refspec token → topic. Only a slashed token is a branch ref (a remote name
// has no slash). In a <src>:<dst> refspec the slashed side carries the topic —
// src preferred (the local feature being shipped); `HEAD:feature/x` resolves the
// dst side, its only named ref. The safe ref character class must hold over the
// WHOLE side (plus `<>` excluded — redirect chars, never a ref the gate trusts);
// a dirty token resolves nothing rather than mis-parse.
const REF_SIDE = /^[^\s;&|"':~^@<>]+$/;
function topicFromRefToken(token) {
  if (token.startsWith("+")) token = token.slice(1); // refspec force marker
  const sides = token.split(":");
  if (sides.length > 2) return null; // not a refspec shape
  for (const side of sides) {
    if (!REF_SIDE.test(side)) continue;
    const slash = side.indexOf("/");
    if (slash > 0 && slash < side.length - 1) return side.slice(slash + 1);
  }
  return null;
}
// The ref named in the command, read from each `git push|merge` invocation's OWN
// argument span (to the next shell separator) — never an unrelated slashed token
// elsewhere in a compound command (`cd src/foo && git push` resolves no ref).
// Quoted spans are masked first, so `-m "mentions feature/x"` prose never
// resolves. push's first non-flag argument is the <remote> (possibly a slashed
// URL — never a topic) and is skipped; merge's arguments are all candidates.
function refTopicFromCommand(command) {
  const masked = maskQuotedSpans(command);
  // `merge(?![-\w])` rejects `merge-base`/`merge-tree`/`merge-file`/`mergetool` — the
  // hyphen/word-char after `merge` marks a plumbing subcommand, not a real merge whose
  // ref we'd parse. `push\b` keeps its boundary (no `push-*` plumbing to confuse). A
  // real merge always has whitespace after `merge`, so none is newly excluded.
  const inv = /\bgit\s+(push\b|merge(?![-\w]))([^;&|\n]*)/g;
  let m;
  while ((m = inv.exec(masked)) !== null) {
    const args = m[2].split(/\s+/).filter((t) => t && !t.startsWith("-"));
    const candidates = m[1] === "push" ? args.slice(1) : args;
    for (const token of candidates) {
      const topic = topicFromRefToken(token);
      if (topic) return topic;
    }
  }
  return null;
}
// Tag pushes (--tags flag, refs/tags/ prefix, or vN.N.N-style token) never
// need a review stamp. Evaluated per git-push invocation so a compound
// command mixing a feature push and a tag push (`push feature/foo && push
// v1.0`) is NOT treated as a tag push — only when ALL push invocations in
// the command are tag pushes does this return true.
function isTagPush(command) {
  const masked = maskQuotedSpans(command || "");
  const inv = /\bgit\s+push\b([^;&|\n]*)/g;
  let hasPush = false;
  let m;
  while ((m = inv.exec(masked)) !== null) {
    hasPush = true;
    const span = m[1];
    if (!/\s--tags\b/.test(span) && !/\srefs\/tags\//.test(span) && !/\sv\d+\.\d+/.test(span)) {
      return false; // this invocation is not a tag push → compound is not all-tag
    }
  }
  return hasPush; // at least one push, and every one is a tag push
}
// True when a `git push` command carries an EXPLICIT non-flag, non-remote ref
// token that `topicFromRefToken` could not parse as a slashed branch (e.g. a
// tag name or a trunk branch name). In that case the HEAD fallback would
// resolve the wrong topic — the explicit ref IS the target, we just can't read
// a topic from it. A bare `git push origin` has no such token (only the remote)
// and correctly falls through to HEAD.
function pushHasUnparsedExplicitRef(command) {
  if (!/\bgit\s+push\b/.test(command)) return false;
  const masked = maskQuotedSpans(command);
  const inv = /\bgit\s+push\b([^;&|\n]*)/g;
  let m;
  while ((m = inv.exec(masked)) !== null) {
    const args = m[1].split(/\s+/).filter((t) => t && !t.startsWith("-"));
    // args[0] = remote (skip); args[1+] = explicit refs
    for (const token of args.slice(1)) {
      if (!topicFromRefToken(token)) return true; // explicit but unresolvable
    }
  }
  return false;
}
// True when a `git push` command carries an EXPLICIT trunk ref (`main` or `master`)
// as a pushed branch — the F1 case the merge-gate otherwise escaped: `git push origin
// main` left the topic unresolvable (a bare `main` has no slash), so the gate fell
// through to the ask rule, which degrades to a SILENT PASS on a platform with no
// ask-return (OpenCode). In this protocol main moves ONLY via PR squash-merge on the
// forge, never a direct push from a session (PROTOCOL.md `## Git flow`), so a direct
// trunk push is already a violation — deny it mechanically on BOTH platforms.
// Whole-token equality (NOT includes) so `maintenance`/`mainline` never match. Both
// sides of a <src>:<dst> refspec are tested (`HEAD:main` is a trunk push too); the
// `+` force marker is stripped. A tag token (`vN.N`, `refs/tags/…`) never equals a
// bare `main`, so tag pushes are excluded by construction; isTagPush is the explicit
// early-out at the call site for defense in depth.
// Returns the trunk ref name (`main`/`master`) when found, else null. The found name
// IS the stamp topic the gate checks — a project that legitimately reviewed a change
// branched/named `main` would carry `main_review.md`, so a *stamped* trunk push still
// passes; only the unstamped one denies (symmetry with the bare-push path).
function pushExplicitTrunkRef(command) {
  if (!/\bgit\s+push\b/.test(command || "")) return null;
  const masked = maskQuotedSpans(command);
  const inv = /\bgit\s+push\b([^;&|\n]*)/g;
  const trunkOf = (side) => (side === "main" || side === "master" ? side : null);
  let m;
  while ((m = inv.exec(masked)) !== null) {
    const args = m[1].split(/\s+/).filter((t) => t && !t.startsWith("-"));
    // args[0] = remote (skip); args[1+] = explicit refs.
    for (let token of args.slice(1)) {
      if (token.startsWith("+")) token = token.slice(1); // refspec force marker
      for (const side of token.split(":")) { // either side of <src>:<dst>
        const t = trunkOf(side);
        if (t) return t;
      }
    }
  }
  return null;
}
// Resolution stays SYNTACTIC — it returns the extracted topic as-is, even an
// unclean one. Traversal validation lives downstream at the stamp boundary
// (isCleanTopic in reviewStampSatisfied), NOT here: nulling an unclean
// command-ref topic here would fall back to HEAD and could read a stamped
// checkout's stamp instead — a bypass. An unclean topic must stay non-null so
// the gate denies it, never resolves around it.
function resolveMergeTopic(command, root) {
  if (typeof command !== "string" || !command) return null;
  const fromCommand = refTopicFromCommand(command);
  if (fromCommand) return fromCommand;
  // Skip HEAD fallback when the push names an explicit unresolvable ref
  // (a tag or a trunk branch): falling back to HEAD here would resolve the
  // WRONG topic. A bare `git push origin` has no such token and correctly
  // falls through to HEAD (pushing the current branch implicitly).
  if (pushHasUnparsedExplicitRef(command)) return null;
  try {
    const head = fs.readFileSync(path.join(path.resolve(root), ".git", "HEAD"), "utf8").trim();
    const hm = head.match(/^ref:\s*refs\/heads\/(.+)$/);
    if (hm) {
      const topic = stripPrefix(hm[1].trim());
      if (topic) return topic;
    }
  } catch { /* no usable HEAD ⇒ unresolvable */ }
  return null;
}
// A merge-gate topic becomes a path SEGMENT (`<topic>_review.md`), so it must be
// a single clean segment. Anything carrying a path separator (`/` / `\`), a NUL,
// or a bare dot-segment (`.` / `..`) is not a usable topic — it could traverse
// out of reviews/. Plain character tests, no regex (no backtracking surface in
// the deny layer).
function isCleanTopic(topic) {
  return typeof topic === "string" && topic.length > 0 &&
    !topic.includes("/") && !topic.includes("\\") && !topic.includes("\0") &&
    topic !== "." && topic !== "..";
}
// The CHOKE POINT every topic source (command ref, HEAD, any future source)
// funnels through before a stamp path is built — so the traversal guard here
// cannot be bypassed by a second entry path. A crafted ref `feature/../EVIL`
// resolves topic `../EVIL`; left unguarded, `.ai-dev/reviews/../EVIL_review.md`
// escapes reviews/ and a planted stamp would satisfy the [mechanical] floor. An
// unclean topic leaves the stamp UNsatisfiable ⇒ the merge-gate DENIES (fail
// toward deny). A nested branch name (feature/sub/topic → `sub/topic`) is
// rejected by the same rule: the convention is a single `<prefix>/<topic>`.
function reviewStampSatisfied(root, topic) {
  if (!isCleanTopic(topic)) return false;
  const file = path.join(path.resolve(root), ".ai-dev", "reviews", topic + "_review.md");
  let text;
  try { text = fs.readFileSync(file, "utf8"); } catch { return false; }
  const stampOK = (label) => {
    // Heading level is incidental — the gate reads the verdict's PRESENCE, not
    // the markdown level. Accept any level (#…######): a reviewer authoring a
    // fresh file naturally opens with an H1 title, and pinning ## only cost a
    // blocked push + a wasted re-review (8D reviewer-stamp-heading-level).
    const m = text.match(new RegExp("^#{1,6}[ \\t]+" + label + ":[ \\t]*(.*)$", "m"));
    if (!m) return false;
    let content = m[1].trim();
    // Also accept the verdict on the very next non-blank line after the heading
    // (resilient to reviewers that split "## Code review:" and "APPROVED").
    if (!content) {
      const after = text.slice(text.indexOf(m[0]) + m[0].length);
      const next = after.match(/^\r?\n([^\r\n#][^\r\n]*)/);
      if (next) content = next[1].trim();
    }
    if (!content || /^NOT YET RUN$/i.test(content)) return false;
    return true;
  };
  // The accepted heading labels are exactly the Reviewer's documented stamp
  // forms (src/agents/reviewer.md, Verdict).
  return stampOK("Code review") || stampOK("Doc review");
}

export {
  stripPrefix,
  topicFromRefToken,
  refTopicFromCommand,
  isTagPush,
  pushHasUnparsedExplicitRef,
  pushExplicitTrunkRef,
  resolveMergeTopic,
  isCleanTopic,
  reviewStampSatisfied,
};
