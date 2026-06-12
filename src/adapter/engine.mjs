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
  const inv = /\bgit\s+(push|merge)\b([^;&|\n]*)/g;
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
    const m = text.match(new RegExp("^##[ \\t]+" + label + ":[ \\t]*(.*)$", "m"));
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
// Is the project configured? True iff ai-dev.config.json exists at the project
// root. Root-relative, fs-checked — the lazy-setup predicate reads only this
// presence (it adds context, never executes), within invariant 2.
function projectConfigured(root) {
  return fs.existsSync(path.join(path.resolve(root), "ai-dev.config.json"));
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
// The project's rigor profile (ai-dev.config.json `profile`). Defaults to "solo"
// on absent / unreadable / malformed / unknown value — proportionality by default
// (PROTOCOL.md `## Project config`), a deliberate Operator decision, not fail-strict:
// the ONLY predicate this gates is the orchestrator-content deny; the floor
// predicates (tooling, boundary, truncation, merge-gate, stamp-write) never read
// the profile, so the default widens no floor. Only an explicit "full" keeps the
// strict lane. Same presence/value read within invariant 2 as projectConfigured —
// never a write.
function projectProfile(root) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(path.resolve(root), "ai-dev.config.json"), "utf8"));
    return cfg.profile === "full" || cfg.profile === "lite" ? cfg.profile : "solo";
  } catch { return "solo"; }
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
  pathOutsideRoot(input) {
    const r = resolveTarget(input.root, input.path);
    return !!r && !isInsideRoot(input.root, r);
  },
  findTargetOutsideRoot(input) {
    const p = findAbsolutePathArg(input.command);
    return !!p && !isInsideRoot(input.root, path.resolve(p));
  },
  writeTargetOutsideRoot(input) {
    return writeTargetsOf(input).some((t) => {
      const r = resolveTarget(input.root, t);
      return !!r && !isInsideRoot(input.root, r);
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
    if (profile === "lite" || profile === "solo") return false;
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
  writesIntoTooling(input, config) {
    const ow = config.orchestrator_writable;
    return writeTargetsOf(input).some((t) => {
      const r = resolveTarget(input.root, t);
      return !!r && writesIntoNever(input.root, r, ow);
    });
  },
  mergeWithUnstampedReview(input) {
    if (!/git\s+(merge|push)\b/.test(input.command || "")) return false;
    const topic = resolveMergeTopic(input.command, input.root);
    if (!topic) return false; // unresolved topic ⇒ the sibling ask rule (mergeTopicUnresolvable), never a silent pass
    return !reviewStampSatisfied(input.root, topic);
  },
  // The merge-gate's no-silent-pass companion: a merge/push whose topic cannot be
  // resolved (detached HEAD and no branch ref in the command) leaves the stamp
  // uncheckable — escalate to the Operator instead of passing.
  mergeTopicUnresolvable(input) {
    if (!/git\s+(merge|push)\b/.test(input.command || "")) return false;
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
  // Opaque-bash boundary-risk detector: a bash act that inline-executes code the
  // engine cannot trace (interpreter -c/-e flag, decode-pipe-shell, curl-pipe-shell,
  // eval-subst) AND whose opaque region contains a boundary-relevant token (absolute
  // path, path traversal, outbound HTTP(S) URL). The verdict is ask (never deny) —
  // a false deny on a flagged-but-legitimate command is worse than a confirmation;
  // anti-ritual tuning: `python3 -c 'print(1)'` has no boundary token → not flagged.
  // Honest ceiling: heuristic, not airtight — raises the bar on accidental/obvious
  // escapes; named [persona] on OpenCode (no ask-return there). See backlog item
  // "opaque-bash classifier" for the rationale and the arms-race caveat.
  opaqueBashBoundaryRisk(input) {
    const c = input.command || "";
    if (!c) return false;
    const isOpaque = (
      /(?:^|[\s;&|(])python3?\s+(?:-\w\s+)*-[ce]\b/.test(c) ||
      /(?:^|[\s;&|(])node\s+(?:-\w\s+)*-e\b/.test(c) ||
      /(?:^|[\s;&|(])perl\s+(?:-\w\s+)*-e\b/.test(c) ||
      /(?:^|[\s;&|(])ruby\s+(?:-\w\s+)*-e\b/.test(c) ||
      /(?:^|[\s;&|(])(?:ba)?sh\s+(?:-\w\s+)*-c\b/.test(c) ||
      /\bbase64\s+(?:-d|--decode)\b[^|]*\|\s*\b(?:ba)?sh\b/.test(c) ||
      /\bcurl\b[^|]*\|\s*\b(?:ba)?sh\b/.test(c) ||
      /(?:^|[\s;&|(])eval\s+["'`]?\$\(/.test(c)
    );
    if (!isOpaque) return false;
    // Flag only when a boundary-relevant token is visible in the opaque context:
    // an absolute path (preceded by a non-letter — avoids "hello/world" embedded
    // in a string), a path traversal, or an outbound HTTP(S) URL.
    return (
      /(?:^|['"\s(;`|,])\/[a-zA-Z]{2}/.test(c) ||
      /\.\.\//.test(c) ||
      /https?:\/\//.test(c)
    );
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
  promptMatchesChangeVerb(input, config) {
    const pat = config.change_verbs?.pattern;
    return !!pat && new RegExp(pat, "i").test(input.prompt || "");
  },
  // Lazy-setup nudge: a work-request prompt (same change_verbs list — no second
  // verb list) to a project with NO ai-dev.config.json. Reinforces the persona
  // act, never forces it. False once the config is present (a configured project
  // gets the change-route-reminder instead).
  promptNeedsSetup(input, config) {
    const pat = config.change_verbs?.pattern;
    if (!pat || !new RegExp(pat, "i").test(input.prompt || "")) return false;
    return !projectConfigured(input.root);
  },
  // Lazy product-discovery nudge: a work-request prompt (same change_verbs list)
  // to a CONFIGURED project whose docs/product.md is absent OR still the unfilled
  // install template (productBriefFilled). Ordered after promptNeedsSetup (an
  // UNconfigured project gets the setup nudge first) and before
  // change-route-reminder (a configured project WITH a filled brief gets the
  // route reminder). Reinforces the persona act, never forces it.
  promptNeedsProductBrief(input, config) {
    const pat = config.change_verbs?.pattern;
    if (!pat || !new RegExp(pat, "i").test(input.prompt || "")) return false;
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

export const _internals = { bashWriteTargets, isOrchestratorAuthorable, resolveMergeTopic, reviewStampSatisfied, stripHeredocBodies, projectProfile, PREDICATES };
