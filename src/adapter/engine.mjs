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
// Best-effort write-target extraction from a bash command (redirect / tee /
// sed -i / cp|mv dest / dd of=). Not a shell parser — permissive on miss (the
// persona is the fail-safe). Runs on a quote-masked copy.
function bashWriteTargets(command) {
  if (typeof command !== "string" || !command) return [];
  command = maskQuotedSpans(command);
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
// hotfix/x→x, a bare `topic`→topic). The reliable signal is HEAD (the actual
// checked-out branch); the command match is a fallback for a push naming a
// <prefix>/<topic> ref. A non-feature prefix (fix/…) must resolve too, or its
// unstamped push escapes the floor. Pure regex reads — no interpolation, no shell.
function stripPrefix(branch) {
  const slash = branch.indexOf("/");
  return slash === -1 ? branch : branch.slice(slash + 1);
}
function resolveMergeTopic(command, root) {
  if (typeof command !== "string" || !command) return null;
  try {
    const head = fs.readFileSync(path.join(path.resolve(root), ".git", "HEAD"), "utf8").trim();
    const hm = head.match(/^ref:\s*refs\/heads\/(.+)$/);
    if (hm) {
      const topic = stripPrefix(hm[1].trim());
      if (topic) return topic;
    }
  } catch { /* fall through to the command match */ }
  // Fallback: a <prefix>/<topic> ref named in the command. A remote name has no
  // slash, so only a slashed token is a branch ref; take the segment after its
  // first slash, with the same safe character class as the ref body.
  const m = command.match(/[^\s;&|"':~^@/]+\/([^\s;&|"':~^@]+)/);
  if (m) return m[1];
  return null;
}
function reviewStampSatisfied(root, topic) {
  const file = path.join(path.resolve(root), ".ai-pm", "reviews", topic + "_review.md");
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
  return stampOK("Code review") || stampOK("Doc review") || stampOK("Validation");
}
function fileNonEmpty(p) {
  try { return fs.statSync(p).size > 0; } catch { return false; }
}
// Is the project configured? True iff ai-pm.config.json exists at the project
// root. Root-relative, fs-checked — the lazy-setup predicate reads only this
// presence (it adds context, never executes), within invariant 2.
function projectConfigured(root) {
  return fs.existsSync(path.join(path.resolve(root), "ai-pm.config.json"));
}
// Does the project have a product brief? True iff docs/product.md exists at the
// project root. Same presence-only, root-relative, fs-checked read as
// projectConfigured (a fixed literal path under the resolved root — no prompt
// data reaches it), within invariant 2. The lazy-discovery predicate adds
// context, never executes.
function productBriefPresent(root) {
  return fs.existsSync(path.join(path.resolve(root), "docs", "product.md"));
}
// The project's rigor profile (ai-pm.config.json `profile`). Fails SAFE to the
// strict default "full" on absent / unreadable / malformed / unknown value — so a
// bad value can only ever DENY more, never widen a floor (mirrors absent-mode →
// the safer "interactive"). Only "lite"/"solo" relax; everything else ⇒ "full".
// Same presence/value read within invariant 2 as projectConfigured — never a write.
function projectProfile(root) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(path.resolve(root), "ai-pm.config.json"), "utf8"));
    return cfg.profile === "lite" || cfg.profile === "solo" ? cfg.profile : "full";
  } catch { return "full"; }
}

// ── predicates: (input, config) => boolean ───────────────────────────────────
// A predicate inspects only the neutral input + the rule data in config. The
// `actor` signal (isOrchestrator) is supplied by the shim where the platform
// can resolve it; where it cannot, the orchestrator-content rule falls back to
// persona (isOrchestrator undefined ⇒ predicate is false ⇒ allow, never a false
// deny — matches the previous plugin's fail-open-on-actor).
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
    // (self-patch), boundary, truncation, and merge-gate denies are SEPARATE
    // predicates and untouched, so the floor never relaxes (`## Project config`).
    const profile = projectProfile(input.root);
    if (profile === "lite" || profile === "solo") return false;
    const ow = config.orchestrator_writable;
    return writeTargetsOf(input).some((t) => {
      const r = resolveTarget(input.root, t);
      return !!r && isInsideRoot(input.root, r) && !isOrchestratorAuthorable(input.root, r, ow);
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
  // verb list) to a project with NO ai-pm.config.json. Reinforces the persona
  // act, never forces it. False once the config is present (a configured project
  // gets the change-route-reminder instead).
  promptNeedsSetup(input, config) {
    const pat = config.change_verbs?.pattern;
    if (!pat || !new RegExp(pat, "i").test(input.prompt || "")) return false;
    return !projectConfigured(input.root);
  },
  // Lazy product-discovery nudge: a work-request prompt (same change_verbs list)
  // to a CONFIGURED project that has NO docs/product.md. Ordered after
  // promptNeedsSetup (an UNconfigured project gets the setup nudge first) and
  // before change-route-reminder (a configured project WITH a brief gets the
  // route reminder). Reinforces the persona act, never forces it.
  promptNeedsProductBrief(input, config) {
    const pat = config.change_verbs?.pattern;
    if (!pat || !new RegExp(pat, "i").test(input.prompt || "")) return false;
    return projectConfigured(input.root) && !productBriefPresent(input.root);
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

export const _internals = { bashWriteTargets, isOrchestratorAuthorable, resolveMergeTopic, reviewStampSatisfied, projectProfile, PREDICATES };
