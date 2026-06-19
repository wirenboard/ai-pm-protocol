// The shared enforcement engine. ONE copy of every check, read by every
// platform shim. A shim normalises its harness payload to the neutral `input`
// shape and calls `evaluate`; the engine returns { verdict, ruleId, reason }.
// The engine holds the PREDICATES (the logic); deny-rules.json holds the rules
// and their data. No platform names appear here — that is the whole point.
//
// Several predicates port hard-won, defect-fixed logic from the previous
// OpenCode plugin (the slice-15 quote-masking + cp/mv redirect fixes). The
// rationale is kept terse here; the long form lives in git history.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── neutral input shape ──────────────────────────────────────────────────────
// { act:'read'|'write'|'bash'|'spawn'|'prompt', root, path?, command?,
//   content?, contentEmpty?, spawnTarget?, isOrchestrator?, prompt? }

// ── ported pure helpers ──────────────────────────────────────────────────────
function isInsideRoot(root, resolved) {
  const r = path.resolve(root);
  return resolved === r || resolved.startsWith(r + path.sep);
}
function resolveTarget(root, target) {
  if (typeof target !== "string" || target.length === 0) return null;
  return path.resolve(root, target);
}
function findAbsolutePathArg(command) {
  if (typeof command !== "string" || !command) return null;
  const m = command.match(/(?:^|[\s;&|(])find[ \t]+(\/[^\s|;&"']*)/);
  return m ? m[1] : null;
}
// Mask spans where `>` is not a redirect (quoted strings, `(( ))`, `[[ ]]`) so
// the write-idiom scans never mistake them for a write target — except a quoted
// redirect TARGET, which is preserved. (slice-15 over-deny fix.)
function maskQuotedSpans(command) {
  const fill = (s) => "_".repeat(s.length);
  let out = command.replace(/\(\([^)]*\)\)|\[\[[^\]]*\]\]/g, fill);
  out = out.replace(/(\d?>>?\s*)?("[^"]*"|'[^']*')/g, (match, redirPrefix, quoted) =>
    redirPrefix !== undefined ? match : fill(quoted)
  );
  return out;
}
// Strip non-shell heredoc BODIES from a bash command before any rule pattern
// runs (applied once in evaluate(), so every predicate sees the same prepared
// string). A heredoc body fed to a non-shell consumer (python3, node, cat, …)
// is data — prose in it mentioning `git push` must not trip the verb rules
// (live 4.19.x false deny). Strict-side carve-outs — each keeps the body matched:
//   • a SHELL consumer (sh/bash/zsh/dash/…) executes its body;
//   • an ambiguous opener (several heredocs on one line, unparseable delimiter,
//     no visible consuming command);
//   • an unterminated body (no closing-delimiter line) — malformed ⇒ keep.
// Line-anchored literal scanning only — no nested quantifiers, no backtracking
// surface. The opener line and the closing-delimiter line are KEPT, so a real
// push before or after the heredoc in the same compound still matches.
// Known limit: an indirect execution of the body (python os.system, a heredoc
// written to a file and run later) is invisible here — persona is the backstop.
const SHELL_CONSUMERS = new Set(["sh", "bash", "zsh", "dash", "ksh", "mksh", "ash", "csh", "tcsh", "fish"]);
function stripHeredocBodies(command) {
  if (typeof command !== "string" || !command.includes("<<")) return command;
  const lines = command.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    out.push(line); // the opener line itself always stays matched
    i += 1;
    const masked = maskQuotedSpans(line); // a quoted "<<" is not an operator
    const ops = [...masked.matchAll(/<{2,3}/g)].filter((m) => m[0] === "<<"); // <<< is a herestring, not a heredoc
    if (ops.length !== 1) continue; // none, or several on one line (ambiguous) ⇒ keep
    const at = ops[0].index;
    // The delimiter word, read from the RAW line (the mask hides a quoted one).
    const dm = line.slice(at).match(/^<<(-?)[ \t]*(?:'([A-Za-z0-9_.-]+)'|"([A-Za-z0-9_.-]+)"|\\?([A-Za-z0-9_.-]+))/);
    if (!dm) continue; // unparseable opener ⇒ keep
    const delim = dm[2] ?? dm[3] ?? dm[4];
    // The consuming command: the simple-command segment the operator belongs to.
    const words = masked.slice(0, at).split(/[;&|()`]/).pop().trim().split(/\s+/)
      .filter((w) => w && !/^[A-Za-z_][A-Za-z0-9_]*=/.test(w)); // skip env assignments
    if (words.length === 0) continue; // no visible consumer ⇒ ambiguous ⇒ keep
    if (words.some((w) => SHELL_CONSUMERS.has(w.slice(w.lastIndexOf("/") + 1)))) continue;
    // Find the closing-delimiter line (exact match; <<- permits leading tabs).
    let close = -1;
    for (let j = i; j < lines.length; j += 1) {
      const cand = dm[1] === "-" ? lines[j].replace(/^\t+/, "") : lines[j];
      if (cand === delim) { close = j; break; }
    }
    if (close === -1) continue; // unterminated ⇒ malformed ⇒ keep (deny-side)
    out.push(lines[close]); // body dropped; the closer and everything after stay
    i = close + 1;
  }
  return out.join("\n");
}
// Best-effort write-target extraction from a bash command (redirect / tee /
// sed -i / cp|mv dest / dd of=). Not a shell parser — permissive on miss (the
// persona is the fail-safe). Runs on a quote-masked copy.
function bashWriteTargets(command) {
  if (typeof command !== "string" || !command) return [];
  command = maskQuotedSpans(command);
  // Drop heredoc openers (`<<EOF`, `<<-'EOF'` → masked to `<<_____`) — an operator,
  // never a write target; left in, `tee file <<EOF` extracts a phantom `<<EOF`.
  command = command.replace(/<<-?[ \t]*[\w.-]*/g, " ");
  const targets = [];
  const isStream = (t) =>
    t === "/dev/null" || t === "/dev/stdout" || t === "/dev/stderr" ||
    t === "&1" || t === "&2" || t.startsWith("&");
  const redir = /(?:^|\s)\d?>>?\s*("[^"]*"|'[^']*'|[^\s|;&<>()]+)/g;
  let r;
  while ((r = redir.exec(command)) !== null) {
    const tok = r[1].replace(/^["']|["']$/g, "");
    if (tok && !isStream(tok)) targets.push(tok);
  }
  const tee = command.match(/(?:^|[\s;&|(])tee\b([^|;&\n]*)/);
  if (tee) for (const tok of tee[1].split(/\s+/)) {
    if (tok && !tok.startsWith("-") && !isStream(tok)) targets.push(tok.replace(/^["']|["']$/g, ""));
  }
  const sed = command.match(/(?:^|[\s;&|(])sed\b[^|;&\n]*?\s-i\b([^|;&\n]*)/);
  if (sed) for (const tok of sed[1].split(/\s+/)) {
    if (!tok || tok.startsWith("-") || isStream(tok)) continue;
    const clean = tok.replace(/^["']|["']$/g, "");
    if (/^[sy]\W/.test(clean) || (clean.includes("/") === false && /[{};]/.test(clean))) continue;
    targets.push(clean);
  }
  const cpmv = command.match(/(?:^|[\s;&|(])(?:cp|mv)\b([^|;&\n]*)/);
  if (cpmv) {
    const toks = cpmv[1].split(/\d?>>?|</)[0].split(/\s+/).filter((t) => t && !t.startsWith("-") && !isStream(t));
    if (toks.length) targets.push(toks[toks.length - 1].replace(/^["']|["']$/g, ""));
  }
  const dd = command.match(/(?:^|[\s;&|(])dd\b[^|;&\n]*?\bof=("[^"]*"|'[^']*'|[^\s|;&<>()]+)/);
  if (dd) {
    const tok = dd[1].replace(/^["']|["']$/g, "");
    if (tok && !isStream(tok)) targets.push(tok);
  }
  return targets;
}
function isPureGitCommand(command) {
  if (typeof command !== "string" || !command) return false;
  let sawGit = false;
  for (const seg of command.split(/&&|\|\||;|\|/)) {
    const t = seg.trim();
    if (!t) continue;
    if (!/^git\b/.test(t)) return false;
    sawGit = true;
  }
  return sawGit;
}
// Match a root-relative path against a registry entry. An entry ending in "/"
// matches that dir and everything under it; otherwise the exact path or anything
// under it as a dir.
function relMatches(rel, entry) {
  if (entry.endsWith("/")) return rel === entry.slice(0, -1) || rel.startsWith(entry);
  return rel === entry || rel.startsWith(entry + "/");
}
// A resolved in-root path the orchestrator MAY author, per the registry's
// orchestrator_writable (allow_prefixes minus never). DATA-DRIVEN — no hard-coded
// paths; deny-rules.json is the single home for the writable set.
function isOrchestratorAuthorable(root, resolved, ow) {
  const rel = path.relative(path.resolve(root), resolved);
  if (rel === "" || rel.startsWith("..")) return false;
  if ((ow?.never || []).some((e) => relMatches(rel, e))) return false;
  return (ow?.allow_prefixes || []).some((e) => relMatches(rel, e));
}
function writesIntoNever(root, resolved, ow) {
  const rel = path.relative(path.resolve(root), resolved);
  return (ow?.never || []).some((e) => relMatches(rel, e));
}
// The `.ai-dev/tooling/` carve-out is the UNCONDITIONAL enforcer-source deny
// (invariant 2). It must hold under EVERY declared component root, not just the
// session root: a manifest must never widen INTO a sibling's tooling dir and
// re-expose that sibling's enforcer. So this tests the never-list against EACH
// root in the validated component set — true iff `resolved` is inside ANY root's
// never-list (tooling) subtree. Used by (a) the self-patch WRITE deny
// (writesIntoTooling), so a write into ANY root's tooling reports the meaningful
// `self-patch-enforcer` ruleId per-root; and (b) the read/find boundary predicates
// (pathOutsideRoot / findTargetOutsideRoot), which have no dedicated tooling rule
// and so apply this carve-out themselves — tooling deny outranks the component-set
// allow. With an invalid manifest componentRoots collapses to [sessionRoot], so the
// sibling is wholly denied as out-of-boundary anyway; this stays fail-safe.
function writesIntoAnyNever(root, resolved, ow) {
  return componentRoots(root).some((r) => writesIntoNever(r, resolved, ow));
}
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
function fileNonEmpty(p) {
  try { return fs.statSync(p).size > 0; } catch { return false; }
}
// The checkout's current branch name (the FULL name, prefix NOT stripped), read from
// .git/HEAD — null on a detached HEAD or an unreadable/missing HEAD. Used by the
// commit-to-trunk deny (commitOnUnstampedMain): a `git commit` names no branch, so the
// branch is the checkout, exactly the signal resolveMergeTopic's HEAD fallback reads —
// but here we need the WHOLE name (`main`, not a stripped topic) to compare against trunk.
function headBranch(root) {
  try {
    const head = fs.readFileSync(path.join(path.resolve(root), ".git", "HEAD"), "utf8").trim();
    const hm = head.match(/^ref:\s*refs\/heads\/(.+)$/);
    return hm ? hm[1].trim() : null;
  } catch { return null; }
}
// Does the repo already have at least one commit? True iff a packed-ref or a loose ref
// exists, or a reflog records history — i.e. NOT a freshly-`git init`'d repo with no
// commit yet. This is the carve-out signal for the commit-to-main deny: the only
// legitimate direct commit to main is the day-zero bootstrap (Setup step 0: `git init`
// + initial commit of the existing tree), where there is no history to bypass. A repo
// with ANY commit history is past that day-zero moment. Cheapest reliable check: a
// HEAD ref pointing at a branch whose loose-ref file exists, OR any packed-refs, OR a
// populated logs/HEAD. Fail toward "has commits" (deny-side) on doubt — a false
// "no commits" would WIDEN the carve-out (allow a commit that should deny), the wrong
// direction; so an unreadable .git makes this true (assume history ⇒ no carve-out).
function repoHasCommits(root) {
  const git = path.join(path.resolve(root), ".git");
  try {
    const branch = headBranch(root);
    if (branch && fs.existsSync(path.join(git, "refs", "heads", branch))) return true;
    if (fileNonEmpty(path.join(git, "packed-refs"))) return true;
    if (fileNonEmpty(path.join(git, "logs", "HEAD"))) return true;
    return false; // none of the history markers present ⇒ fresh init (carve-out applies)
  } catch { return true; } // unreadable ⇒ assume history (deny-side: no carve-out)
}
const TRUNK_BRANCHES = new Set(["main", "master"]);
// Is the project configured? True iff .ai-dev/config.json exists. Root-relative,
// fs-checked — the lazy-setup predicate reads only this presence (it adds context,
// never executes), within invariant 2.
function projectConfigured(root) {
  return fs.existsSync(path.join(path.resolve(root), ".ai-dev", "config.json"));
}
// Does the project have a FILLED product brief? False when docs/product.md is
// absent OR still the install-landed template — the installer copies the
// template verbatim, so presence alone proved nothing and the discovery nudge
// could never fire on a real install (the 4.18.0 fix). Template detection is
// TWO literal-substring layers (includes() on fixed text, never a regex — no
// prompt data reaches this read, no backtracking surface):
//   1. the sentinel `<!-- ai-dev:template -->` the template carries as line 1
//      (forward-looking; discovery deletes it on fill),
//   2. the §0 placeholder line, byte-identical in every template version ever
//      shipped (legacy; catches installs that copied a pre-sentinel template).
// Same fixed root-relative read as projectConfigured, within invariant 2.
const BRIEF_TEMPLATE_MARKERS = [
  "<!-- ai-dev:template -->",
  "<one plain sentence: what this product is and what it does",
];
function productBriefFilled(root) {
  let text;
  try { text = fs.readFileSync(path.join(path.resolve(root), "docs", "product.md"), "utf8"); }
  catch { return false; } // absent or unreadable ⇒ no brief
  return !BRIEF_TEMPLATE_MARKERS.some((m) => text.includes(m));
}
// The project's rigor profile (.ai-dev/config.json `profile`). Defaults to "solo"
// on absent / unreadable / malformed / unknown value — proportionality by default
// (PROTOCOL.md `## Project config`), a deliberate Operator decision, not fail-strict.
// Predicates that read the profile:
//   - orchestrator-content deny: relaxed on lite/solo/yolo (the original gate).
//   - merge-gate: short-circuits (returns false) on yolo — the explicit gate-off.
// All other floor predicates (tooling, boundary, truncation, stamp-write) do NOT
// read the profile — the default ("solo") widens none of those floors.
// Only an explicit "full" keeps the strict orchestrator-content lane.
// Same presence/value read within invariant 2 as projectConfigured — never a write.
function projectProfile(root) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(path.resolve(root), ".ai-dev", "config.json"), "utf8"));
    if (cfg.profile === "full" || cfg.profile === "lite") return cfg.profile;
    if (cfg.profile === "yolo") return "yolo"; // only an explicit value enters the escape hatch
    return "solo"; // absent / unrecognised / malformed ⇒ solo (never yolo by default)
  } catch { return "solo"; }
}

// ── multi-repo components: the fail-CLOSED manifest loader/validator ──────────
// Reads .ai-dev/components.json from the session root and returns the set of
// canonical absolute roots an agent may touch — ALWAYS including the session root.
// This is the riskiest logic on the security floor: a crafted manifest must NEVER
// widen the boundary to an attacker-chosen path. So it fails CLOSED — on ANY doubt
// the set collapses to the single session root (byte-identical to today's behaviour).
//
// The three project-boundary predicates (pathOutsideRoot / findTargetOutsideRoot /
// writeTargetOutsideRoot) consult this set via isInsideAnyComponent; isInsideRoot
// itself stays single-root, and the tooling/stamp/merge/truncation/orchestrator-content
// denies stay session-root-anchored (only the boundary read/find/write denies widen).
//
// The manifest schema (one home: docs/architecture.md `## Components`): a non-empty
// JSON array of objects, each { "root": "<rel path>", "role": "<str>", "stack": "<str>" }.
// `root` is resolved RELATIVE TO the manifest's own directory (the session root),
// canonicalised with path.resolve + fs.realpathSync (defeats symlink escapes).
//
// Fail-closed rules (every one collapses to the single root):
//   • absent / unreadable file                         ⇒ single root
//   • JSON parse failure                               ⇒ single root
//   • shape not a non-empty array of valid root objects⇒ single root
//   • a declared root that does not realpath to an
//     EXISTING directory                               ⇒ WHOLE manifest rejected
//   • an OVERBROAD root — resolves to a filesystem root,
//     or to an ancestor of / the session root itself   ⇒ WHOLE manifest rejected
// Rejection is ALL-OR-NOTHING: one bad entry rejects the whole manifest, never a
// partial honour (a partial honour is a fail-open seam — plan-adversary inversion).
function isFilesystemRoot(p) {
  return path.dirname(p) === p; // "/" on POSIX, "C:\\" on Windows — dirname is itself
}
// `ancestor` is an ancestor of (or equal to) `descendant`. Both must be canonical
// absolute paths. Used to reject a declared root that contains the session root —
// widening to a parent would re-expose everything above the work, including the
// enforcer's own tree.
function isAncestorOrEqual(ancestor, descendant) {
  return descendant === ancestor || descendant.startsWith(ancestor + path.sep);
}
function componentRoots(root) {
  const sessionRoot = path.resolve(root);
  const single = [sessionRoot];
  let text;
  try {
    text = fs.readFileSync(path.join(sessionRoot, ".ai-dev", "components.json"), "utf8");
  } catch { return single; } // absent / unreadable ⇒ fail closed
  let parsed;
  try { parsed = JSON.parse(text); } catch { return single; } // unparseable ⇒ fail closed
  if (!Array.isArray(parsed) || parsed.length === 0) return single; // wrong/empty shape ⇒ fail closed
  const set = new Set([sessionRoot]);
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return single; // not a root object
    if (typeof entry.root !== "string" || entry.root.length === 0) return single; // missing/blank root
    // Resolve RELATIVE TO the manifest dir (the session root), then canonicalise
    // through realpath so a symlinked declared root cannot escape to /etc.
    let canon;
    try { canon = fs.realpathSync(path.resolve(sessionRoot, entry.root)); }
    catch { return single; } // does not resolve to an existing path ⇒ reject whole manifest
    let stat;
    try { stat = fs.statSync(canon); } catch { return single; }
    if (!stat.isDirectory()) return single; // must be an existing DIRECTORY
    // OVERBROAD guards — reject the whole manifest (never partially honour):
    if (isFilesystemRoot(canon)) return single; // a filesystem root
    if (isAncestorOrEqual(canon, sessionRoot)) return single; // ancestor of / equal to the session root
    set.add(canon);
  }
  return [...set];
}
// Boundary membership across the validated component SET (Step 2 wiring). A target
// is inside the boundary iff it is inside ANY validated declared root. With no/invalid
// manifest, componentRoots returns just [sessionRoot], so this is byte-identical to the
// single-root isInsideRoot — the no-manifest regression tripwire. ONLY the three
// project-boundary denies (pathOutsideRoot / findTargetOutsideRoot / writeTargetOutsideRoot)
// call this; the stamp/merge/truncation/orchestrator-content denies stay anchored
// to the session root via isInsideRoot (`.ai-dev/plans/multi-repo-components.md`).
//
// Tooling carve-out — NOT folded into this allow. Writes into ANY root's
// `.ai-dev/tooling/` are owned by the dedicated self-patch deny (writesIntoTooling
// → writesIntoAnyNever), so a tooling write reports the meaningful `self-patch-enforcer`
// ruleId, per-root. Reads/finds have no dedicated tooling rule, so the read/find
// boundary predicates apply the per-root tooling carve-out themselves
// (writesIntoAnyNever) BEFORE the component-set allow — tooling deny outranks the
// allow, so a declared sibling's tooling is denied on read/find exactly like a write.
function isInsideAnyComponent(root, resolved) {
  return componentRoots(root).some((r) => isInsideRoot(r, resolved));
}

// Compile a config-sourced pattern and test it, returning FALSE on a compile error.
// SCOPED TO INJECT-CLASS PREDICATES ONLY (promptMatchesChangeVerb / promptNeedsSetup /
// promptNeedsProductBrief): for an inject, false = "no nudge fires", the SAFE direction
// (a missing nudge is a lost reminder, never a missing deny). A DENY-class predicate
// must NOT reuse this — a deny needs fail-toward-deny (treat a bad pattern as a MATCH,
// not a miss), so `return false` there would fail OPEN. No deny predicate compiles a
// config pattern today (the floor predicates use literal inline regexes); this guard
// prevents a later footgun. `pat` is trusted internal data (deny-rules.json), not
// external injection — the try/catch handles a broken-install/malformed registry, not
// an attack.
function safeTest(pat, str) {
  if (!pat) return false;
  try { return new RegExp(pat, "i").test(str); }
  catch { return false; } // malformed pattern ⇒ no inject (safe for inject class only)
}

// ── predicates: (input, config) => boolean ───────────────────────────────────
// A predicate inspects only the neutral input + the rule data in config. The
// `actor` signal (isOrchestrator) is supplied by the shim where the platform
// can resolve it; where it cannot, the actor-dependent rules (orchestrator-content,
// stamp-write) fall back to persona (isOrchestrator undefined ⇒ predicate is
// false ⇒ allow, never a false deny).
function writeTargetsOf(input) {
  if (input.act === "write" && input.path) return [input.path];
  if (input.command) return bashWriteTargets(input.command);
  return [];
}
const PREDICATES = {
  // Read/find: a target is outside the boundary if it is in NO declared root, OR it
  // is inside ANY root's `.ai-dev/tooling/` carve-out (no dedicated tooling rule
  // covers reads, so the per-root carve-out is applied here — tooling deny outranks
  // the component-set allow, so a declared sibling's tooling is denied on read/find).
  pathOutsideRoot(input, config) {
    const r = resolveTarget(input.root, input.path);
    if (!r) return false;
    if (writesIntoAnyNever(input.root, r, config?.orchestrator_writable)) return true;
    return !isInsideAnyComponent(input.root, r);
  },
  findTargetOutsideRoot(input, config) {
    const p = findAbsolutePathArg(input.command);
    if (!p) return false;
    const r = path.resolve(p);
    if (writesIntoAnyNever(input.root, r, config?.orchestrator_writable)) return true;
    return !isInsideAnyComponent(input.root, r);
  },
  // Write: tooling writes are owned by the dedicated self-patch deny (writesIntoTooling,
  // per-root), which reports `self-patch-enforcer` — so this boundary predicate stays a
  // pure in-set membership test; a sibling's tooling write falls through here (sibling IS
  // in the set) and is caught by writesIntoTooling with the meaningful ruleId.
  writeTargetOutsideRoot(input) {
    return writeTargetsOf(input).some((t) => {
      const r = resolveTarget(input.root, t);
      return !!r && !isInsideAnyComponent(input.root, r);
    });
  },
  emptyWriteOverNonEmpty(input) {
    if (input.act !== "write" || !input.contentEmpty) return false;
    const r = resolveTarget(input.root, input.path);
    return !!r && fileNonEmpty(r);
  },
  orchestratorWritingContent(input, config) {
    if (!input.isOrchestrator) return false;
    if (input.act === "bash" && isPureGitCommand(input.command)) return false;
    // Configurable rigor: a lite/solo profile lets the orchestrator build directly,
    // so it MAY author source/doc paths — relax THIS predicate only. The tooling
    // (self-patch), boundary, truncation, merge-gate, and stamp-write denies are
    // SEPARATE predicates and untouched, so the floor never relaxes (`## Project config`).
    const profile = projectProfile(input.root);
    if (profile === "lite" || profile === "solo" || profile === "yolo") return false;
    const ow = config.orchestrator_writable;
    return writeTargetsOf(input).some((t) => {
      const r = resolveTarget(input.root, t);
      return !!r && isInsideRoot(input.root, r) && !isOrchestratorAuthorable(input.root, r, ow);
    });
  },
  // The stamp-fabrication guard: a review stamp is the Reviewer's deliverable —
  // the orchestrator never authors one, in ANY profile (the Reviewer seat never
  // collapses into the orchestrator, so this floor ignores the rigor relaxation).
  // Actor-resolved platforms deny; an undefined actor (Claude) fails open and
  // the guard is persona there. Pure git stays allowed (restore, not authorship).
  orchestratorWritesReviewStamp(input, config) {
    if (!input.isOrchestrator) return false;
    if (input.act === "bash" && isPureGitCommand(input.command)) return false;
    const prefix = config.review_stamps?.prefix;
    if (!prefix) return false;
    return writeTargetsOf(input).some((t) => {
      const r = resolveTarget(input.root, t);
      if (!r || !isInsideRoot(input.root, r)) return false;
      return relMatches(path.relative(path.resolve(input.root), r), prefix);
    });
  },
  // Self-patch deny — the `.ai-dev/tooling/` carve-out, PER-ROOT and unconditional:
  // a write into ANY validated component root's tooling dir is denied, not just the
  // session root's, so a manifest can never widen into a sibling's enforcer source
  // (invariant 2). The boundary deny (writeTargetOutsideRoot) already catches a
  // sibling-tooling write via the isInsideAnyComponent carve-out; this keeps the
  // dedicated self-patch deny consistent with it for defense in depth.
  writesIntoTooling(input, config) {
    const ow = config.orchestrator_writable;
    return writeTargetsOf(input).some((t) => {
      const r = resolveTarget(input.root, t);
      return !!r && writesIntoAnyNever(input.root, r, ow);
    });
  },
  mergeWithUnstampedReview(input) {
    // `merge(?![-\w])` lets read-only `git merge-base`/`merge-tree`/`merge-file`/`mergetool`
    // fall through (a hyphen/word-char after `merge` is plumbing, not a merge) while a real
    // `git merge <topic>` (whitespace/EOL after `merge`) still matches. `push\b` unchanged.
    if (!/git\s+(merge(?![-\w])|push\b)/.test(input.command || "")) return false;
    if (projectProfile(input.root) === "yolo") return false; // gate explicitly off — Operator's merge word is the only remaining check
    if (isTagPush(input.command)) return false; // tags never need a review stamp
    // F1: an EXPLICIT unstamped trunk push (`git push origin main`/`master`) DENIES on
    // both platforms — the bare `main` ref is unresolvable as a topic, so without this
    // it fell through to the ask rule, which a no-ask-return platform (OpenCode) silently
    // passed. Deny here (deny holds on both platforms; ask does not). The trunk ref IS
    // the stamp topic, so a reviewed `main`-named change (carrying main_review.md) still
    // ships; only the unstamped trunk push denies. Sits before the resolveMergeTopic null
    // check so it is never shadowed by the unresolvable-topic ask.
    const trunk = pushExplicitTrunkRef(input.command);
    if (trunk) return !reviewStampSatisfied(input.root, trunk);
    const topic = resolveMergeTopic(input.command, input.root);
    if (!topic) return false; // unresolved topic ⇒ the sibling ask rule (mergeTopicUnresolvable), never a silent pass
    return !reviewStampSatisfied(input.root, topic);
  },
  // The merge-gate's no-silent-pass companion: a merge/push whose topic cannot be
  // resolved (detached HEAD and no branch ref in the command) leaves the stamp
  // uncheckable — escalate to the Operator instead of passing.
  mergeTopicUnresolvable(input) {
    // Same `merge(?![-\w])` tightening as mergeWithUnstampedReview — a `merge-*` plumbing
    // command must not be routed to the unresolvable-topic ask either.
    if (!/git\s+(merge(?![-\w])|push\b)/.test(input.command || "")) return false;
    if (isTagPush(input.command)) return false; // tags are fine — no topic, no ask
    // An explicit trunk push is handled by the DENY rule (mergeWithUnstampedReview),
    // never routed to ask — deny outranks ask regardless, this keeps the intent clean.
    if (pushExplicitTrunkRef(input.command)) return false;
    return resolveMergeTopic(input.command, input.root) === null;
  },
  spawnTargetInDenySet(input, config) {
    const set = [
      ...(config.role_deny_set?.role_duplicators || []),
      ...(config.role_deny_set?.generic_builtins || []),
    ];
    return typeof input.spawnTarget === "string" && set.includes(input.spawnTarget);
  },
  sshContentEdit(input) {
    const c = input.command || "";
    return /(^|[\s;&|`(])ssh(\s|$)/.test(c) &&
      /(sed[\s"'`]+-i|[\s"'`]vi[\s"'`]|[\s"'`]vim[\s"'`]|[\s"'`]nano[\s"'`]|[\s"'`]tee[\s"'`]|>\s*[^\s&|;>]+)/.test(c);
  },
  sshMutatingAction(input) {
    const c = input.command || "";
    return /(^|[\s;&|`(])ssh(\s|$)/.test(c) &&
      /([\s"'`]systemctl[\s"'`]+(restart|reload|stop|start|enable|disable)|[\s"'`]docker[\s"'`]+(exec|compose[\s"'`]+(up|down|run|restart|exec))|[\s"'`]apt(-get)?[\s"'`]+(install|upgrade|remove|purge|autoremove)|[\s"'`]npm[\s"'`]+(install|update|uninstall)|[\s"'`]kubectl[\s"'`]+(edit|apply|patch|delete|create|replace)|[\s"'`]rm[\s"'`]|[\s"'`]cp[\s"'`]|[\s"'`]mv[\s"'`]|[\s"'`]mkdir[\s"'`]|[\s"'`]touch[\s"'`])/.test(c);
  },
  gitForcePush(input) {
    return /git\s+push(\s+[^\s]+)*\s+(--force|--force-with-lease|-f)([ =]|$)/.test(input.command || "");
  },
  gitCommitNoVerify(input) {
    return /git\s+commit(\s+[^\s]+)*\s+(--no-verify|--no-gpg-sign)([ =]|$)/.test(input.command || "");
  },
  // F4a: `git add -A` / `git add .` / `git add --all` / `git add *` — a blind bulk-stage.
  // The orchestrator rule (`## Your seat`: "Stage named paths only — never git add -A/.")
  // makes this never legitimate: the tree holds untracked transients (plans, stamps) by
  // design and a blind stage leaks them into durable history. DENY on both platforms
  // (Operator decision — deny holds where ask degrades to persona on OpenCode; the
  // day-zero bootstrap stages NAMED paths instead). Runs on the quote-masked command so a
  // commit-message mention never trips it. Whole-token matching: `git add .gitignore` (a
  // file literally named `.gitignore`) and `git add -p` (interactive patch) are NOT bulk
  // stages and fall through.
  gitAddAll(input) {
    const masked = maskQuotedSpans(input.command || "");
    // Each `git add` invocation's own argument span (to the next shell separator).
    const inv = /\bgit\s+add\b([^;&|\n]*)/g;
    let m;
    while ((m = inv.exec(masked)) !== null) {
      const toks = m[1].split(/\s+/).filter((t) => t.length > 0);
      for (const tok of toks) {
        if (tok === "-A" || tok === "--all" || tok === "." || tok === "*" || tok === "-all") return true;
        // A combined short-flag bundle containing A (e.g. `-Av`) is also a bulk stage.
        if (/^-[A-Za-z]*A[A-Za-z]*$/.test(tok)) return true;
      }
    }
    return false;
  },
  // F4b: a `git commit` whose checkout HEAD is `main`/`master` and which carries no
  // satisfied trunk stamp. "Never commit to main" is absolute (PROTOCOL.md `## Git flow`):
  // main moves via PR squash-merge, never a direct commit — so this DENIES on both
  // platforms (Operator decision; deny holds where ask degrades on OpenCode). Two
  // carve-outs preserve the only legitimate cases:
  //   • a STAMPED trunk change (main_review.md present) still commits (symmetric with the
  //     trunk-push allow) — a reviewed change branched/named main is honoured;
  //   • the day-zero bootstrap: an UNCONFIGURED project (no .ai-dev/config.json) OR a
  //     fresh-init repo with no commit history yet (Setup step 0: `git init` + the
  //     initial commit). A configured project with history committing to main is a
  //     violation and denies.
  // yolo turns the gate off (consistency with the merge-gate). Runs on the masked command.
  commitOnUnstampedMain(input) {
    if (!/\bgit\s+commit\b/.test(maskQuotedSpans(input.command || ""))) return false;
    if (projectProfile(input.root) === "yolo") return false; // gate explicitly off
    const branch = headBranch(input.root);
    if (!branch || !TRUNK_BRANCHES.has(branch)) return false; // not on a trunk checkout
    // Bootstrap carve-out: an unconfigured project, or a fresh-init repo with no commits.
    if (!projectConfigured(input.root)) return false;
    if (!repoHasCommits(input.root)) return false;
    // A reviewed trunk-named change still commits (the stamp carve-out).
    return !reviewStampSatisfied(input.root, branch);
  },
  promptMatchesChangeVerb(input, config) {
    return safeTest(config.change_verbs?.pattern, input.prompt || "");
  },
  // Lazy-setup nudge: a work-request prompt (same change_verbs list — no second
  // verb list) to a project with NO .ai-dev/config.json. Reinforces the persona
  // act, never forces it. False once the config is present (a configured project
  // gets the change-route-reminder instead).
  promptNeedsSetup(input, config) {
    if (!safeTest(config.change_verbs?.pattern, input.prompt || "")) return false;
    return !projectConfigured(input.root);
  },
  // Lazy product-discovery nudge: a work-request prompt (same change_verbs list)
  // to a CONFIGURED project whose docs/product.md is absent OR still the unfilled
  // install template (productBriefFilled). Ordered after promptNeedsSetup (an
  // UNconfigured project gets the setup nudge first) and before
  // change-route-reminder (a configured project WITH a filled brief gets the
  // route reminder). Reinforces the persona act, never forces it.
  promptNeedsProductBrief(input, config) {
    if (!safeTest(config.change_verbs?.pattern, input.prompt || "")) return false;
    return projectConfigured(input.root) && !productBriefFilled(input.root);
  },
};

// ── config + evaluate ────────────────────────────────────────────────────────
export function loadConfig(dir) {
  const base = dir || path.dirname(fileURLToPath(import.meta.url));
  return JSON.parse(fs.readFileSync(path.join(base, "deny-rules.json"), "utf8"));
}

// Evaluate one neutral input against the registry. Returns the first DENY hit
// (deny outranks ask), else the first ASK hit, else an INJECT for a prompt, else
// allow. `ruleId`/`reason` identify what fired.
export function evaluate(input, config) {
  // Prepare the command string ONCE for every rule: non-shell heredoc bodies are
  // data, not commands — stripped here so no predicate pattern-matches prose.
  if (input.act === "bash" && typeof input.command === "string") {
    const prepared = stripHeredocBodies(input.command);
    if (prepared !== input.command) input = { ...input, command: prepared };
  }
  let ask = null;
  for (const rule of config.rules) {
    if (!rule.act.split("|").includes(input.act)) continue;
    const pred = PREDICATES[rule.predicate];
    if (!pred || !pred(input, config)) continue;
    if (rule.class === "deny") return { verdict: "deny", ruleId: rule.id, reason: rule.intent };
    if (rule.class === "ask" && !ask) ask = { verdict: "ask", ruleId: rule.id, reason: rule.intent };
    if (rule.class === "inject") return { verdict: "inject", ruleId: rule.id, reason: rule.intent };
  }
  return ask || { verdict: "allow", ruleId: null, reason: "" };
}

export const _internals = { bashWriteTargets, isOrchestratorAuthorable, resolveMergeTopic, reviewStampSatisfied, stripHeredocBodies, projectProfile, componentRoots, pushExplicitTrunkRef, PREDICATES };
