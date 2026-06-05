> **Topic file of the orchestration spec** — read on demand from `WORKFLOW.md`'s navigation map. The cross-cutting always-on invariants live in `WORKFLOW.md`; this file is the single home for the rule named in its heading. Read it before acting on that rule.

### Foundational product questions

**Single source for the product-readiness gate.** This is the only list of foundational product questions. `pm-product-advocate`, `/pm-plan`, and `/pm-bootstrap` reference this subsection **by name** ("`### Foundational product questions` in `workflow/foundational-questions.md`") and pass a **tier** (`per-feature` | `bootstrap` | `documentation`); they must never re-encode the list — mirroring how `### Security-relevant surfaces` is the single source for security-touching surfaces. The advocate reports only the questions with **no recorded answer** in its inputs, in the fixed order below; it never judges whether an answer is good (the PM owns meaning). Use cross-domain language — onboarding / discovery / recovery — never a domain-specific example baked in as vocabulary.

**Tier: per-feature** (one user-facing feature; inputs = the plan + the Product Contract + `docs/product.md` + `docs/user-journeys.md`):

1. Value — who is this for, and what job does it do for them?
2. Value — why this, and not the way they do it today (the incumbent)?
3. Usability — how does a user reach or discover this feature?
4. Usability — what does the first successful use look like (the zero-to-working step)?
5. Scope boundary — what does this feature explicitly NOT do (the No-Gos)?

**Tier: bootstrap** (the whole product, once; inputs = the product Q&A answers + `docs/product.md` + `docs/architecture.md`):

1. Discovery — how does a new user find out the product exists?
2. Onboarding — what are the first steps from nothing to a working state?
3. Invite / multi-party — if others are involved, how do they join?
4. Recovery & key-loss — what happens when a user loses access, a key, or a device?
5. Device-change / continuity — how does use carry across devices or sessions?
6. Value — why this product, and not the incumbent?
7. Viability — who runs it, who funds it, what legal or operational constraints bind it?

**Tier: documentation** (one feature on a `documentation`-kind project — per `### Project kind`; the reader / operator is a human role, so the advocate fires; inputs = the plan + the Product Contract + the deliverable file(s) under `deliverable/` + `docs/user-journeys.md`). One general completeness set covering both actionable and reference docs; the advocate reports only the questions with no recorded answer, never grading the prose (a question genuinely N/A for a pure reference doc is answered `N/A — reference doc`, a recorded answer, so it does not flag):

1. Audience — who is this document for (the reader / operator role)?
2. Scope — what does it cover, and what does it explicitly NOT cover (the No-Gos)?
3. Coverage — does it cover the whole stated scope end to end (no silent gaps)?
4. Decision points — where does the reader / operator branch, and on what condition? (For a reference doc with no branches: `N/A — reference doc`.)
5. Exceptions / failure handling + recovery — what happens when a step or assumption fails, and how does the reader / operator recover? (For a pure reference doc: `N/A — reference doc`.)
6. Zero-to-done — what does a first complete run, from nothing to the finished outcome / fully understood document, look like?

The advocate, its relay (the one `AskUserQuestion` pass), and its backstops (`pm-plan-checker` DoD, `pm-auditor` dimension 1) are reused **verbatim** for this tier — only the question source gains the tier. A documentation project is human-facing — the **reader / operator is a human role** — so the human-role-subject extraction that gates the per-feature advocate **fires** on a `documentation`-kind feature; the advocate is the natural referee that finds holes in the document before it ships.
