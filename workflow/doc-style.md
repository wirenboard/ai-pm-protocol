> **Topic file of the orchestration spec** — read on demand from `WORKFLOW.md`'s navigation map. The single home for the **durable-text frugality discipline** governing the family `{docs, code comments, commit messages}`. The sibling **legibility** discipline (read-before-ship clarity) lives in `## Human-facing text legibility` in `workflow/pm-comms.md` — referenced here by name, never restated. This file is **frugality** (what good structure is); legibility is **clarity** (is the prose readable). They never state the same rule.

## Durable-text frugality

Durable text — anything that lands and is read later: a doc section, a code comment, a commit message — is **reader-first and distilled, not accumulated**. The agents that author it (`pm-architect`, `pm-stack-researcher`, `pm-coder`) reference these rules **by name** (`### <anchor>`), never re-encode them. Author this file itself to the discipline it defines.

### Fact-first / BLUF

Every section opens with the statement that breaks if violated — the load-bearing fact, not the build-up to it. Bottom Line Up Front: a reader who stops after the first sentence still has the rule. Context, caveats, and elaboration come after, never before.

### Plain language / human-readable

Durable text leads with a statement a **non-specialist can read** — the load-bearing fact in plain words, not in domain shorthand. The plain-language statement comes **first**; the precise or technical form is the elaboration or a pointer, never the lede.

Jargon and acronyms are **glossed-or-deferred**. A technical term that is the clearest word is defined in plain language at first use; otherwise it is replaced with plain words or pushed to a `technical details → <pointer>` tail. No bare acronyms, no CS/math notation (`O(1)`, `Lost-in-the-Middle`) left standing unexplained in reader-facing durable text.

This is a **structure** rule — how to build the artifact so a non-specialist can read it, a sibling of `### Fact-first / BLUF`. It is not the read-back review act (`## Human-facing text legibility` in `workflow/pm-comms.md` — read your draft, rewrite if unclear) and not the live-chat rule (`## How to talk to the PM` there — no jargon without a gloss in PM chat). The three never state the same rule.

### Current-state-only

The live artifact states **what is true now**. No "Supersedes…", no "corrects-the-earlier-wording", no process-narrative of how the text got here. The story of a change is process — it lives in git, not in the artifact. A reader of the live doc reads the current truth without wading through its history.

### Supersede-don't-edit

A decision record is **current-state-only** (`### Current-state-only`). When a decision changes, the live record is **replaced in place** by the new decision; the superseded record collapses to a **one-line tombstone**, its body removed (git retains it):

```
### <decision title> — superseded by <new decision title> (YYYY-MM-DD) → <pointer>
```

The live doc never accretes decision history. The decision record carries a terse **one-line-per-rejected-alternative** so a contested decision's reasoning survives lean and durable (ADR norm — Nygard Consequences / MADR Considered-Options):

```
rejected <alternative>: <one-line because>
```

The verbose investigation narrative — the variant exploration that justified *getting to* the decision — evaporates to git. The one-line-per-rejected is the single durable-content trade the model makes: contested reasoning survives lean; everything else is process.

### Provenance = one-line pointer

Provenance is **one line, a pointer** — never an inline commit-hash block, never an inline `.ai-pm/` dump. A decision cites its source as a single reference (a path, a PR, a one-line "see git history"); a comment that needs a why points at the rule's home rather than transcribing it. The pointer survives; the transcribed block bloats and drifts.

### One-purpose-per-unit

Each durable unit — a doc, a section, a comment, a commit — serves **one purpose**. A doc that is two docs is split; a commit that does two things is two commits; a comment that explains three unrelated facts is three comments or, better, none (the code says what; the comment says only the one non-obvious why). One purpose per unit keeps each unit findable, reviewable, and lean.

### Comment-restraint

This is the **definition** of comment-restraint — a **first-class protocol rule applying on every project**, including a generic one with no per-project lint wiring. The template comment-restraint section and any stack-idiom lint config **realize** this rule (one-way: they reference it as the authority and implement it; they never redefine it). This promotes what was a template-only convention to a protocol rule.

**Why-not-what.** A comment justifies the non-obvious; it never narrates what readable code already says. No trivial docstrings. No inline rule-ID citations (`# SC1`, `# AC6`) — rule IDs belong in the plan/test, not inline where they drift.

**Single-home.** Each fact has exactly one home, never duplicated across homes:

- an **architectural invariant** → its decision record (the comment points at it, never transcribes it);
- a **local non-obvious why** → a terse comment at the code;
- the **what** → readable code, no comment.

### Numbers = targets, not gates

Numeric norms are **authoring targets and auditor smells, not merge-gates** — a doc over a soft target earns a review/audit note, not a block. The exception is a small **enforceable hard-cap set**:

- README one-liner ≤ 120 chars
- decision record ≤ ~2 screens
- navigation list ≤ 7 entries
- top quality-goals ≤ 5

These four are gate-able; every other number is guidance.

### Graduation targets

Durable knowledge graduates to one of a **closed enum of four homes** — a fact that fits none of the four is the signal it is process, not durable:

| Durable fact | Graduation target |
|---|---|
| An architectural decision | a decision record in `docs/architecture.md` |
| A product contract | the `.ai-pm/contracts/` registry |
| A deferred finding / accepted tech-debt | `.ai-pm/backlog.md` |
| A new stack rule / idiom | `docs/stack-notes.md` |

This enum is the home; the full graduation **lifecycle and gates** (the fixed-size dossier, distill-on-merge, the pre-ship merge gate, the auditor git-aware check) are defined separately in the artifact-lifecycle slice and check against this one list.
