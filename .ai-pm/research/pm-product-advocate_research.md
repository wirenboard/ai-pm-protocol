# Research: pm-product-advocate — an independent product-axis referee

## What we looked for

Whether to add a new independent "product advocate" agent that generates the
uncomfortable foundational product questions and **blocks the handoff to the
coder** until the PM answers or consciously descopes — and how to design that
gate so it catches real gaps instead of becoming bureaucratic theater. Two
bodies of evidence were checked: established **product-discipline practice**
(is there a recognized "ready to build?" gate, separate from "done"?) and the
**LLM-agent literature** (does an *independent* critic actually beat a
self-check by the same agent, and what makes a critic gate fail?).

## Bottom line first

The evidence points clearly to a **new, separate agent** rather than folding
the product check into the orchestrator — for the same reason `code-review` is
not done by the author. Both pillars converge:

- **Product practice already has this gate.** The strongest names in product
  management (Cagan/SVPG, Amazon, Basecamp) all run a *pre-build* product
  readiness discipline that is distinct from technical readiness — and all
  three frame it as a **forcing function + human decision**, never a hard veto.
  That is exactly the "block but PM stays sovereign" shape we want.
- **A self-check by the orchestrator would be the weak configuration.** The
  agent literature shows models are bad at self-correcting without *external*
  feedback, and that an LLM judging its own output is measurably biased toward
  it. The orchestrator is currently both player (elicits product detail, drives
  to code) and would-be referee — the precise setup these papers flag.

So: yes, a new agent — with its own role/context, a **fixed** foundational
checklist, and a **block-but-overridable** mechanism.

---

## Part A — Product-discipline precedent (the gate already exists)

### Cagan / SVPG — the four product risks

**What it is:** Marty Cagan (Silicon Valley Product Group) defines four risks
every product idea must clear *before* engineering capacity is committed:

- **Value** — will users actually choose to use / buy it?
- **Usability** — can users figure out how to use it?
- **Feasibility** — can engineers build it with the time/skills/tech we have?
- **Viability** — does it work for the *business* (legal, finance, sales,
  marketing, brand)?

"Discovery exists to kill all four before delivery starts."

**Why it matters for us:** This is the missing map. The protocol today has
strong independent referees on **feasibility** (the whole technical axis —
`code-review`, `pm-plan-checker`, `pm-auditor`, `pm-stack-researcher`) and
**zero** on value / usability / viability. The four risks *are* the product
axis the protocol leaves un-refereed.

**Important nuance / downside:** Cagan insists discovery is **continuous /
dual-track**, NOT one big upfront waterfall gate. → the advocate must de-risk
**per user-facing feature** and at bootstrap, never as one monolithic
"product phase" that stalls the whole project.

**Source:** <https://www.svpg.com/four-big-risks/> (primary)

### Amazon — Working Backwards (PR/FAQ)

**What it is:** Before any code, the team writes a customer-facing **press
release** plus an **FAQ**, and iterates the document "until the team achieves
clarity of thought around what to build." The press release is written *first*
(though normally it would be the last step) precisely as a **forcing function**
to keep the focus on the customer, not on competitors or the P&L.

The FAQ is split — and this split is a ready-made question template:

- **External FAQ** — the questions a customer/press would ask: "How does it
  work? What does it cost? What's the warranty?"
- **Internal FAQ** — anticipates questions "from every department: finance,
  marketing, customer support, operations, HR…"

**Why it matters for us:** It is a documented *pre-build readiness gate* whose
output is exactly a question set. The "write and iterate the doc" framing (not
"approve/veto") is the proportionality model: it forces clarity without an
authority figure blocking.

**Source:** <https://workingbackwards.com/resources/working-backwards-pr-faq/>
(primary — Bryar & Carr, the ex-Amazon method creators)

### Basecamp — Shape Up (pitch + betting table)

**What it is:** The closest precedent to our exact design. Shape Up calls
handing builders an underspecified problem a **defect** — "a problem without a
solution is unshaped work. Giving it to a team means pushing research and
exploration down to the wrong level." Before build, someone writes a **pitch**
with five fixed ingredients:

1. **Problem** — the raw idea / use case
2. **Appetite** — how much time we're willing to spend (this *constrains* the
   solution — proportionality built in)
3. **Solution** — the shaped approach
4. **Rabbit Holes** — known traps to avoid
5. **No-Gos** — what we explicitly will NOT do (scope boundary)

At the **betting table**, humans decide: bet it (→ build) or "let it go." The
gate is **sequencing + a human bet, not a veto.**

**Why it matters for us:** This is the block-but-sovereign pattern verbatim.
"Unshaped work is a defect" = the advocate's blocking stance; "the team bets or
lets it go" = the PM stays sovereign (answer or descope). **Appetite** and
**No-Gos** are also the proportionality mechanism — the gate constrains scope
rather than demanding unlimited rigor.

**Source:** <https://basecamp.com/shapeup/1.5-chapter-06> (primary — the
Shape Up book)

---

## Part B — Why a SEPARATE agent (the LLM-agent evidence)

### Self-critique is structurally weak without external feedback

**Finding:** "LLMs struggle to self-correct their responses without external
feedback, and at times their performance even *degrades* after self-correction"
— models flip correct answers to wrong. The paper endorses the inverse: when
valid *external* feedback is available, use it. (Apparent counterexamples all
rely on fine-tuned auxiliary verifiers — i.e. external mechanisms — which only
reinforces the point.)

**Why it matters:** This is the single strongest argument against folding the
product check into the orchestrator. A self-review by the same agent that wrote
the plan is exactly the configuration shown to be weak.

**Caveat:** measured on reasoning/factual tasks, not specifically on "detect
product under-specification" — the transfer is by strong analogy, not direct
measurement.

**Source:** <https://arxiv.org/abs/2310.01798> (Huang et al., DeepMind,
ICLR 2024, ~1000+ citations)

### LLMs favor their own output (self-preference bias)

**Finding:** "An LLM evaluator scores its own outputs higher than others' while
human annotators consider them of equal quality." This self-preference is
**causally linked to self-recognition** (GPT-4 recognizes its own text ~73.5%
of the time; the stronger the self-recognition, the stronger the bias). The
authors explicitly warn this interferes with reward modeling, constitutional
AI, and self-refinement.

**Why it matters:** The orchestrator judging its own product elicitation is the
**player + referee** setup this paper indicts. A critic with a *distinct role,
prompt persona, and context* reduces that bias. (Open question: a *different
underlying model* would suppress it further — feasibility TBD, see below.)

**Sources:** <https://arxiv.org/abs/2404.13076> (Panickssery, Bowman & Feng,
NeurIPS/COLM 2024); corroborated by <https://arxiv.org/abs/2410.21819>
(Wataoka et al.)

### Structured critique loops DO work — but bounded

**Finding:** Reflexion (verbal self-reflection in episodic memory → 91% pass@1
on HumanEval vs GPT-4's 80%) and Self-Refine (single LLM as generator + critic
+ feedback → ~20% average improvement across 7 tasks) both show natural-language
critique fed back into attempts genuinely helps — no weight updates needed.

**Why it matters / nuance:** This says critique *as a mechanism* is sound, so
the advocate's "generate questions → force a fix" loop is well-founded.
**But** Self-Refine is the *same-model* baseline the field deliberately
contrasts against independent critics, and Reflexion leans on an external
feedback signal. Conclusion: structured critique helps; an **independent**
critic with its own rubric is the stronger gate, with reflection as a
within-agent aid.

**Sources:** <https://arxiv.org/abs/2303.11366> (Reflexion, NeurIPS 2023);
<https://arxiv.org/abs/2303.17651> (Self-Refine, NeurIPS 2023)

### An independent critic has its OWN biases — engineer them out

**Finding:** LLM judges show systematic, well-documented biases: **position**
(consistent preference for the first option), **length**, **format**, **model
provenance**, and **perplexity/familiarity** (they over-reward fluent,
low-perplexity text "regardless of whether the output was self-generated" — a
style bias, not a correctness signal). They also give **inconsistent verdicts
across modes** (pointwise vs pairwise).

**Why it matters — this is the anti-theater design spec:**

- Give the advocate a **fixed foundational-question rubric** so it can't drift
  to surface cues.
- Evaluate **criterion-by-criterion / pointwise against the checklist**, not by
  pairwise comparison.
- Keep **question ordering stable** (counter position bias).
- Judge **presence of an answer** to each foundational question — **not prose
  polish / vision quality** (style bias is real; this also keeps the PM
  sovereign over meaning). This matches the protocol's existing "shape, not
  meaning" rule used by the structural-token-lint and `pm-auditor`'s
  no-prose-policing stance.

**Sources:** <https://arxiv.org/abs/2410.21819>;
<https://arxiv.org/html/2602.02219>; <https://arxiv.org/pdf/2602.06625>
(the last two are recent-2026 preprints; treat as corroborating, not load-bearing)

### Block-but-sovereign has direct governance precedent

**Finding:** The "you must answer or consciously accept the risk" mechanism is
standard: a **dismissible blocking PR review** (block + dismiss-with-rationale),
and **risk-acceptance sign-off** (owner consciously waives an open risk with a
recorded justification). The product frameworks themselves model it — Shape Up's
bet ("build, descope, or let it go") and Working Backwards' forcing function
(write/iterate, not approve).

**Maps to our design:** the advocate **blocks the coder handoff** until each
foundational gap is either **(a) answered** or **(b) explicitly descoped /
risk-accepted by the PM with a recorded rationale** — never a hard, permanent
veto.

**Confidence:** medium — the override/waiver pattern is from general practice;
the forcing-function and proportionality pieces are high-confidence primary.

**Sources:** <https://basecamp.com/shapeup/1.5-chapter-06>;
<https://workingbackwards.com/resources/working-backwards-pr-faq/>;
<https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/dismissing-a-pull-request-review>

---

## Conclusion

**1. New agent — yes.** Both the product-discipline precedent (an independent
"ready to build?" discipline exists and is distinct from "done") and the
LLM-agent evidence (self-check is weak; self-preference bias is real) support a
**new agent with its own role/context**, not a self-review folded into the
orchestrator. This is the product-axis twin of `code-review`.

**2. The foundational-question checklist** should be assembled from the three
primary frames (they overlap cleanly):

- **Value** — who is this for, what job does it do, why this and not the
  incumbent? (Cagan value; Working Backwards "why the customer cares")
- **Usability / zero-to-working** — the foundational journeys: discovery,
  onboarding, invite, recovery/key-loss, device-change. (Cagan usability;
  the explicit bootstrap gap in the epic)
- **Viability** — does it work for whoever runs/funds it; legal/operational
  constraints. (Cagan viability; Working Backwards internal FAQ)
- **Scope boundary** — what we explicitly will NOT do. (Shape Up No-Gos)
- **Appetite / proportionality** — how much is this worth. (Shape Up Appetite)

The check is **presence of an answer** to each, never quality of the prose.

**3. Block-but-overridable:** model it on the dismissible blocking review —
emit blocking product-gaps + forks; the handoff to `pm-coder` stays blocked
until the PM **answers** or **consciously descopes with a recorded rationale**.
Never a permanent veto.

**4. Proportional:** run it **only on user-facing features** (human-role-subject
test, same as `pm-auditor`) plus at `/pm-bootstrap`; substrate/backend/fixup
stay un-gated. And per Cagan, run it **per-feature / per-bootstrap-decision**,
not as one monolithic upfront product phase.

**5. The three design forks from the epic — resolved by the evidence:**

- *Advocate doesn't talk to the PM directly* → consistent with the
  forcing-function framing; it **generates** the questions, the orchestrator
  **relays** them in one `AskUserQuestion` pass. Keeps "only the orchestrator
  talks to the PM." ✓
- *A new agent is justified* → strongly supported (independence beats
  self-check; player≠referee). It is also player-referee-incompatible with
  `pm-architect` (which *writes* product.md) and with `pm-plan-checker` (which
  runs *post*-coding with a compliance, not advocacy, stance). ✓
- *Blocks but PM sovereign* → direct precedent (Shape Up bet, dismissible
  review, risk-acceptance). ✓

---

## Open questions (carry into `/pm-plan`)

These returned **no verified claims** in this pass — treat as unanswered, not
as negative results:

- **Clarifying-question generation evidence (angle 4).** No surviving claim on
  how well LLMs *detect under-specification and generate the right questions*
  (vs guessing), or how to keep that proportional. The design leans on the
  fixed-rubric mitigation instead — worth a focused second look during planning
  if we want empirical backing.
- **Definition-of-Ready criticism (angle 1).** The contrarian DoR sources were
  fetched but no claim survived 3-vote verification, so the "when does a hard
  readiness gate become ceremony" critique is **not** independently
  substantiated here — though the proportionality guards above (per-feature,
  user-facing only, Appetite/No-Gos) are the standard answer to that risk.
- **Debate / multi-critic vs single critic** — does a debate or critic+judge
  panel beat one independent critic enough to justify the extra orchestration
  for a non-technical PM's flow? Likely overkill for v1; note and defer.
- **Different model for the critic** — a *different underlying model* (not just
  a different role/context) would further suppress self-preference bias. Is
  that operationally feasible in a Markdown-defined Claude-subagent protocol?
  (The protocol currently has all `pm-*` agents inherit the session model.)

## Sources

Primary (load-bearing):

- [SVPG — The Four Big Risks](https://www.svpg.com/four-big-risks/)
- [Working Backwards — PR/FAQ](https://workingbackwards.com/resources/working-backwards-pr-faq/)
- [Shape Up — Ch. 6 (Set the Table / pitch)](https://basecamp.com/shapeup/1.5-chapter-06)
- [Huang et al. — LLMs Cannot Self-Correct Reasoning Yet (ICLR 2024)](https://arxiv.org/abs/2310.01798)
- [Panickssery et al. — LLM Evaluators Recognize and Favor Their Own Generations (NeurIPS/COLM 2024)](https://arxiv.org/abs/2404.13076)
- [Wataoka et al. — Self-Preference Bias in LLM-as-a-Judge](https://arxiv.org/abs/2410.21819)
- [Shinn et al. — Reflexion (NeurIPS 2023)](https://arxiv.org/abs/2303.11366)
- [Madaan et al. — Self-Refine (NeurIPS 2023)](https://arxiv.org/abs/2303.17651)
- [GitHub — Dismissing a pull request review](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/dismissing-a-pull-request-review)

Corroborating (recent preprints, not load-bearing):

- [Position bias in rubric-based judges](https://arxiv.org/html/2602.02219)
- [FairJudge — non-semantic-cue biases](https://arxiv.org/pdf/2602.06625)

---

*Research run 2026-06-04 via `deep-research` (5 angles, 22 sources fetched,
96 claims extracted, 25 adversarially verified at 3-vote, 0 killed).*
