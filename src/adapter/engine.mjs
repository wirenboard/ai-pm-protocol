// The shared enforcement engine. ONE copy of every check, read by every
// platform shim. A shim normalises its harness payload to the neutral `input`
// shape and calls `evaluate`; the engine returns { verdict, ruleId, reason }.
// The engine holds the PREDICATES (the logic dispatch) + evaluate; deny-rules.json
// holds the rules and their data. The helper families the predicates lean on live
// in sibling modules (one home each), re-exported via `_internals` for the tests:
//   • engine-paths.mjs      — path/root resolution
//   • engine-bash.mjs       — bash-command parsing (write/read target extraction)
//   • engine-git.mjs        — merge-topic resolution + review-stamp reads
//   • engine-config.mjs     — config + filesystem-state reads
//   • engine-components.mjs — multi-repo boundary + orchestrator-writable
// No platform names appear here — that is the whole point.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isInsideRoot, resolveTarget } from "./engine-paths.mjs";
import {
  findAbsolutePathArg,
  maskQuotedSpans,
  stripHeredocBodies,
  isStreamTarget,
  bashWriteTargets,
  bashReadTargets,
  isPureGitCommand,
} from "./engine-bash.mjs";
import {
  isTagPush,
  pushExplicitTrunkRef,
  resolveMergeTopic,
  reviewStampSatisfied,
} from "./engine-git.mjs";
import {
  fileNonEmpty,
  headBranch,
  repoHasCommits,
  TRUNK_BRANCHES,
  projectConfigured,
  productBriefFilled,
  projectProfile,
  disabledSafeguards,
  safeguardRegistry,
} from "./engine-config.mjs";
import {
  relMatches,
  isOrchestratorAuthorable,
  writesIntoAnyNever,
  componentRoots,
  isInsideAnyComponent,
} from "./engine-components.mjs";

// ── neutral input shape ──────────────────────────────────────────────────────
// { act:'read'|'write'|'bash'|'spawn'|'prompt', root, path?, command?,
//   content?, contentEmpty?, spawnTarget?, isOrchestrator?, prompt? }

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
  // Bash READ boundary — best-effort, the read twin of findTargetOutsideRoot.
  // For each extracted read target: a leading `~` is treated as outside-root (it
  // is $HOME — path.resolve would forge a fake in-root path; this also covers
  // `find ~/…` conceptually), then the same tooling carve-out (writesIntoAnyNever,
  // per-root) and component-set allow (isInsideAnyComponent) the other two
  // boundary read/find predicates use. A recognised+resolved out-of-root target
  // ⇒ deny (fail-closed); an unparseable command or a statically unresolvable
  // token ($VAR/$(…)/interpreter/unlisted) yields no target ⇒ allow (fail-open).
  bashReadTargetOutsideRoot(input, config) {
    for (const t of bashReadTargets(input.command)) {
      if (t.startsWith("~")) return true; // $HOME — near-always outside a project root
      const r = resolveTarget(input.root, t);
      if (!r) continue;
      if (writesIntoAnyNever(input.root, r, config?.orchestrator_writable)) return true;
      if (!isInsideAnyComponent(input.root, r)) return true;
    }
    return false;
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
    if (!/(^|[\s;&|`(])ssh(\s|$)/.test(c)) return false;
    // An in-place editor / tee always intends a real-file edit → deny.
    if (/(sed[\s"'`]+-i|[\s"'`]vi[\s"'`]|[\s"'`]vim[\s"'`]|[\s"'`]nano[\s"'`]|[\s"'`]tee[\s"'`])/.test(c)) return true;
    // A `>` / `>>` redirect denies ONLY when its target is a real file. A stream
    // redirect (`2>/dev/null`, `> /dev/null`, `2>&1`) is read-only and must ALLOW —
    // it is a diagnostic, not a remote edit. Scan every redirect target and fire on
    // the first non-stream one (isStreamTarget is the single home for "what is a
    // stream"; an `&N` fd-dup never matches the target group, so it never trips).
    const redir = /\d?>>?\s*("[^"]*"|'[^']*'|[^\s&|;<>()]+)/g;
    let m;
    while ((m = redir.exec(c)) !== null) {
      const tok = m[1].replace(/^["']|["']$/g, "");
      if (tok && !isStreamTarget(tok)) return true;
    }
    return false;
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
  // Consciously-disabled guards (.ai-dev/config.json `safeguards`), read ONCE.
  // The skip below is gated on `rule.toggleable === true` too, so a deny/merge-gate
  // rule (no such flag) is never skipped — the mechanical floor holds regardless.
  const disabled = disabledSafeguards(input.root);
  let ask = null;
  for (const rule of config.rules) {
    if (!rule.act.split("|").includes(input.act)) continue;
    if (rule.toggleable === true && disabled.has(rule.id)) continue; // opted-out guard
    const pred = PREDICATES[rule.predicate];
    if (!pred || !pred(input, config)) continue;
    if (rule.class === "deny") return { verdict: "deny", ruleId: rule.id, reason: rule.intent };
    if (rule.class === "ask" && !ask) ask = { verdict: "ask", ruleId: rule.id, reason: rule.intent };
    if (rule.class === "inject") return { verdict: "inject", ruleId: rule.id, reason: rule.intent };
  }
  return ask || { verdict: "allow", ruleId: null, reason: "" };
}

export const _internals = { bashWriteTargets, bashReadTargets, isOrchestratorAuthorable, resolveMergeTopic, reviewStampSatisfied, stripHeredocBodies, projectProfile, disabledSafeguards, safeguardRegistry, componentRoots, pushExplicitTrunkRef, PREDICATES };
