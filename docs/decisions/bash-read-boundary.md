# Bash-read project boundary (invariant 2)

## Question

The boundary deny (invariant 2) catches a `find` that searches outside the root, but **no
Bash READ command** — `cat ~/.ssh/id_rsa`, `grep -c . /tmp/.../tasks/x.output`,
`head /other-project/secret`, `cmd < /etc/shadow`. Invariant 2 claims "Read … a path
outside the root ⇒ denied"; for Bash that is true **only for `find`**. How should the
deny be extended to close the confidentiality hole, given that parsing arbitrary Bash for
read targets is genuinely hard?

## The gap (verified live, v5.23.0, against `src/adapter/engine.mjs`)

Three boundary predicates exist. Two cover only narrow surfaces:

- `pathOutsideRoot` (rule `read-outside-root`) — fires on `act:"read"`, i.e. the **Read
  TOOL** (`input.path`). Clean and precise: the tool hands over a single path.
- `findTargetOutsideRoot` (rule `find-outside-root`) — fires on `act:"bash"` but parses
  **only** `find`, via `findAbsolutePathArg` (`/(?:^|[\s;&|(])find[ \t]+(\/[^\s|;&"']*)/`).
  Absolute paths only — `find ~/x` and `find ../x` already slip.
- `writeTargetOutsideRoot` — writes only (`bashWriteTargets`: redirect / tee / sed -i /
  cp|mv / dd of=).

A Bash READ is `act:"bash"`; nothing extracts its read target. Confirmed by running the
engine: `grep`, `cat`, `head`, a `< /etc/shadow` input redirect → all `allow`. Only
`find /etc …` and the Read tool on `/etc/passwd` deny. Observed live: a downstream
`dev-reviewer` `grep`-ed a sibling agent's out-of-root transcript, unblocked.

This is a `[mechanical]` confidentiality-boundary gap — invariant 2 over-claims for Bash.

**Why only `find` today:** Bash is free-form; a real read target hides behind per-command
arg grammar (grep's pattern-first shape), quoting, pipes, redirects, `~`/`$VAR`
expansion, and interpreter indirection. The whole engine's Bash parsing is therefore
**best-effort, fail-open on a parse miss, persona as the backstop** — stated outright on
`bashWriteTargets` ("Not a shell parser — permissive on miss"). `find` was the cheapest
high-value catch; reads were never wired.

## Options

### A — Generalise into a best-effort read-target extractor over a command denylist

A `bashReadTargets(command)` over common read commands (`cat`/`head`/`tail`/`less`/`more`/
`nl`/`tac`/`rev`/`xxd`/`od`/`strings`/`wc`/`cut`/`sort`/`base64`/`*sum`/`grep`/`awk`/
`sed`-without-`-i`/`dd if=`…): extract path args, deny any outside root.

- **+** Closes the actual reported class; mirrors the existing `find`/write best-effort posture exactly.
- **−** False positives on **pattern-first** commands (`grep PATTERN [FILE…]`,
  `awk`, `sed`): `grep '/etc/passwd' infile` has an absolute-looking *pattern*, not a
  file — a naive "first slash-token" extractor false-denies a legitimate in-root grep.
  Needs a skip-the-pattern heuristic, imperfect on `-e`/`-f` forms.
- **−** Coverage gaps + arms race: any unlisted read primitive (`vim`, `perl -ne`) slips.

### B — Deny any Bash command referencing ANY absolute path outside root (catch the path, not the verb)

- **+** No per-command grammar.
- **−** Over-blocks fatally. Legitimate commands reference out-of-root paths constantly
  (`ls /proc`, `node /usr/bin/x`, `export FOO=/opt`, `#!/bin/bash`, `gh`/`git` touching
  `~/.config`, an absolute path inside a commit message or a grep pattern). Confidentiality
  is about reading *content*, not *referencing* a path. **Rejected** — breaks the harness.
  (Kernel worth keeping: an input redirect `< /abs` IS a verb-independent read primitive.)

### C — Honest relabel only

Accept the gap, downgrade invariant 2's Bash-read claim to "partial (`find` only)", lean
on the platform sandbox + the persona reviewer-scope rule.

- **+** Cheapest; no parser to maintain or mis-fire.
- **−** Leaves an observed hole. The platform Bash tool is **not** a reliable
  confidentiality sandbox for arbitrary paths, so persona becomes the *only* backstop for
  a `[mechanical]`-labelled invariant — overstated. Insufficient alone.

### D — Hybrid: best-effort extractor (A, conservative) + input-redirect catch + honest relabel (C)

Extractor for the high-value, low-false-positive surface; honest wording for the residual;
the persona reviewer-scope rule as the named second layer. Each layer covers the other's
failure mode.

## Recommendation — D

Neither a parser nor a relabel alone is honest: the parser cannot be airtight, and the
relabel leaves an observed leak. Ship both, layered.

### Mechanical layer — a new `bashReadTargetOutsideRoot` predicate

Add `bashReadTargets(command)` in `engine.mjs`, modelled on `bashWriteTargets`
(per-invocation arg span, quote-stripped tokens, run after the existing heredoc strip).
Two extraction families, conservative-first:

1. **Input redirect** `(?<!<)<(?!<)\s*<token>` — symmetric to the existing write-`>` scan,
   reusing `isStreamTarget` to drop `< /dev/null` etc. Verb-independent, near-zero false
   positive. Must exclude `<<` heredoc / `<<<` herestring (already stripped/guarded).
2. **Pure-file-arg read commands** (`cat`/`head`/`tail`/`less`/`more`/`nl`/`tac`/`rev`/
   `xxd`/`od`/`strings`/`wc`/`cut`/`base64`/`*sum`/`dd if=`…): every non-flag token is a
   file — extract all (absolute **and** relative; relative resolves against root, closing
   the `../` traversal hole `find` leaves open).
3. **Pattern-first commands** (`grep`/`egrep`/`fgrep`/`awk`/`sed`-without-`-i`): skip
   leading flags, skip **one** pattern token, treat remaining tokens as files. Closes the
   observed `grep -c . /tmp/.../x.output` case (flags `-c` → pattern `.` → file
   `/tmp/.../x.output` → deny) while letting `grep '/etc/passwd' infile` (pattern, not
   file) through. Documented as the highest false-positive risk (`-e`/`-f` forms imperfect).

Register `read-bash-outside-root` (`class:"deny"`, `act:"bash"`) in `deny-rules.json`,
beside `find-outside-root`. The predicate applies the same `writesIntoAnyNever` tooling
carve-out and `isInsideAnyComponent` component-set allow the other two boundary predicates
use — so it inherits multi-repo behaviour for free.

**Fail direction.** The unit of fail-closed is the *extracted-target* decision, not the
*whole-command* decision — identical to `find`/write:

- A recognised command whose extracted arg resolves outside root ⇒ **deny** (fail-closed
  where the parse is reliable).
- A command the extractor cannot parse, or a token it cannot resolve statically ⇒
  **allow** (fail-open), because fail-closed on every unparseable Bash command makes the
  harness unusable (the documented engine-wide rationale) and the Operator would disable
  the hook wholesale — strictly worse. Persona is the backstop for this residual.

**Named residuals (cannot be closed statically — must be in the relabel, not hidden):**

- `~/…` — `path.resolve(root,"~/x")` yields a *fake in-root* path → false negative.
  Special-case a leading-`~` token as **outside root** (it is `$HOME`, near-always outside
  a project root). This also retro-fixes `find ~/…`. Small false-positive risk only when
  the project root IS `$HOME` — acceptable, Operator-overridable.
- `$VAR` / `$(…)` — value known only at runtime; statically unresolvable ⇒ fail-open.
- Interpreter-mediated reads (`python3 -c "open('/etc/x')"`, `perl -ne`, `node -e`) and
  any unlisted read command ⇒ fail-open.
- Relative `../` traversal IS caught for the pure-file family (improvement over `find`).
- Quoting: the extractor MASKS quoted spans first (`maskQuotedSpans`, the helper
  `gitAddAll` uses) — a quoted argument body (a commit message, an `echo` string, a `grep`
  pattern, a quoted `sed` script) yields NO read target, so `git commit -m "... < /etc/x"`
  no longer false-denies (the live dogfood regression). The accepted consequence, in line
  with the conservative + fail-open posture: a genuinely quoted-path read (`cat
  '/etc/passwd'`) is now MISSED (fail-open), with the role-scope persona rule as backstop.
  Pipes: per-invocation arg spans segment naturally at `|`. Heredoc bodies: already
  stripped in `evaluate()` — consistent.

### Persona layer — the reviewer-scope rule (second layer, ships in the same change)

The observed leak was a *Reviewer reading another agent's transcript* — a **scope**
violation, not merely a path one. The mechanical extractor narrows the surface; the
durable fix for the residual (interpreters, vars, unlisted commands) is the scope
discipline: a Reviewer/Builder has no business reading another agent's out-of-root working
state at all. State it where role scope lives (`PROTOCOL.md` invariant 2 prose +/or the
role agents) so the persona floor is explicit, not implied.

### Honest invariant-2 wording change

Current text implies an airtight Bash-read deny. Replace with the truth:

> Read … a path outside the root ⇒ denied. For Bash this is **best-effort** — input
> redirects and a denylist of common read commands (`cat`/`grep`/`head`/…) are caught;
> an interpreter-mediated, variable-resolved, or unlisted-command read can still slip,
> with the role-scope persona rule as the documented backstop.

Over-claiming the Bash half as airtight would itself be a review-blocking honesty failure.

## Follow-up BUILD scope (its own careful loop — real `[mechanical]` change)

Touches `engine.mjs` (new `bashReadTargets` + `bashReadTargetOutsideRoot` predicate, `~`
special-case, export in `_internals`), `deny-rules.json` (new `read-bash-outside-root`
rule), `PROTOCOL.md` (invariant 2 honest wording + scope-rule line), and the test matrix.

**Test matrix** (extend `src/adapter/parity.test.mjs`, beside the existing boundary cases
at L71–79, parity-checked across both shims):

- DENY: `cat /etc/passwd` · `grep -c . /tmp/x/tasks/a.output` (the live case) ·
  `head /other-project/secret` · `cat ~/.ssh/id_rsa` · `cmd < /etc/shadow` ·
  `tail ../../secret` (relative traversal) · quoted `cat "/etc/passwd"`.
- ALLOW (no false positive): `grep '/etc/passwd' in-root-file` (pattern, not file) ·
  `cat subdir/file` · `cmd < /dev/null` · `cat ./README.md` · a read of an in-root path ·
  a declared-sibling read under a valid components manifest.
- Carve-out: a read targeting any root's `.ai-dev/tooling/` still denies.

**Risk to watch in the build:** the grep/awk/sed pattern-skip heuristic is where a false
deny would land — start conservative, and if the `-e`/`-f` forms prove noisy, narrow the
pattern-first family rather than loosen the pure-file family.

## Fork for the Operator

One genuine dial, not a blocker: **extractor aggressiveness vs false-deny tolerance.** The
recommendation starts conservative (closes the observed case at near-zero false-positive
cost) and expands on evidence. A more aggressive variant (more commands, treat every
out-of-root path reference as suspect) catches more but risks blocking legitimate
system-path reads and annoying the Operator. Recommended: ship conservative, widen only if
a real leak slips it. Surface this choice at plan approval of the build.
