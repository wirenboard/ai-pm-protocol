# Research: protocol-process-flavor

## What we looked for

Whether (and how) the protocol can develop **company processes and documentation** (no
executable code) — e.g. an SOP for "integrating a new device into the company ecosystem" — and
whether the PM's intended shape (a **conditional split on presence-of-code**: code → tests +
code-review + pipeline; no code → document + artifact-based validation; doc artefacts like the
threat-model shared across both) is the right architecture.

## Bottom line first

The PM's intended shape is **confirmed by mature practice on every axis tested:**

- **Doing dev-discipline on non-code artefacts is mainstream**, not novel — *docs-as-code*
  (Git + peer review + CI + linting on Markdown) is the closest precedent, and this repo already
  lives it.
- **"Tests pass" for a process has a real analogue**, and it is layered: the **strongest**
  validation is an **artifact-based dry-run (tabletop / pilot)**; cheap supporting gates are a
  **structural/prose lint (Vale)** and an **expert sign-off**.
- **One pipeline branching on a declared "kind" with DRY shared stages is standard
  build-tooling** (Bazel `select()`, Gradle variants with a shared `main`, CI matrices) — which
  validates the **conditional-split-with-shared-doc-artefacts** design over a separate fork.
- A **dedicated process/SOP artefact is warranted** — an operator-journey doc captures
  *experience flow*, not roles / inputs / decision-points / exception-handling / revision
  discipline (medium confidence — see caveat).

So: build the **process flavor as a presence-of-code conditional**, with the no-code mode's
"tests" = a dry-run/tabletop + a structural lint + sign-off, a dedicated SOP artefact, and
shared doc artefacts (threat-model) in the common layer.

---

## Candidates

### Docs-as-code (Write the Docs) — the direct precedent

**What it is:** a philosophy of "writing documentation with the same tools as code" — Git
version control, peer **code review**, **automated tests**, issue trackers, plain-text markup
(Markdown/reST/Asciidoc).

**Contributes:** confirms the protocol's git-submodule + Markdown delivery is mainstream for a
no-code artefact; the whole plan→review→audit discipline transfers directly. **This repo is
already a docs-as-code project** ("no automated tests by design — validation by use").

**Downsides:** docs-as-code by itself says *use code tools*, not *what "test" means* for prose
— that gap is filled by the validation candidates below.

**Fit:** native. **Source:** <https://www.writethedocs.org/guide/docs-as-code/> (primary)

### Validation without a compiler — the "tests pass" analogue (the key question)

Ranked by strength for a no-code process artefact:

1. **Artifact-based dry-run — tabletop / pilot (STRONGEST).** A **discussion-based simulation**
   that exercises the *written process* with the people who run it — explicitly **no tools/code
   executed**. AWS Well-Architected (SEC10-BP07): a tabletop "focuses on processes, people, and
   collaboration… the actual use of tools or scripts is generally not part of it," and it
   **tests the accuracy and efficiency of the workflow** against the documented plan.
   Corroborated by CISA (discussion-based vs operations-based) and NIST SP 800-61. **This is the
   real analogue of "tests pass" for an SOP** — and it maps onto the protocol's existing Step 5.5
   "run it for real" (here: a pilot device-integration / a tabletop walkthrough, human-driven).
   *Source:* <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_incident_response_run_game_days.html>
2. **Structural / prose lint (cheap automated gate).** **Vale** — MIT, offline CLI prose linter,
   11 programmable check types (existence, substitution, consistency, capitalization, …),
   shareable style rules, CI/editor integration. Real automated gating of *form/terminology/
   structure* — but it checks **form, not whether the process works**. *Source:* <https://vale.sh/>
   For any **structured** fields an artefact carries (a metadata block, a checklist schema),
   **OPA `opa test` / conftest** give genuine PASS/FAIL assertions — but they validate
   **structured/declarative data, not free prose** (important scoping caveat). *Sources:*
   <https://www.openpolicyagent.org/docs/policy-testing>, <https://www.conftest.dev/>
3. **Expert sign-off + Definition-of-Done gate.** A structured human gate. (Efficacy
   vs rubber-stamp not separately verified here — design it as a checklist gate, not a
   signature; see open questions.)

**Design takeaway:** no-code "validation" = **dry-run/tabletop (the load-bearing gate)** +
**Vale-style structural lint (cheap pre-gate)** + **DoD/expert sign-off** — never a single
rubber-stamp.

### Policy-as-code / compliance-as-code (OPA, conftest, OSCAL) — testable declarative artefacts

**What it is:** OPA/Rego makes policy genuinely testable (`opa test` is a real PASS/FAIL/coverage
runner); conftest writes Rego assertions against 20+ structured formats; NIST **OSCAL** turns
prose compliance docs into machine-readable XML/JSON/YAML to "operationalize policy-as-code."

**Contributes:** the precedent that a *declarative* non-code artefact can be machine-tested — so
if a process artefact carries a **structured block** (e.g. a roles table, a checklist schema, a
threat-model as data), that part can be lint/assert-tested, not just eyeballed.

**Downsides / fit:** tests **structured** data, **not free prose** — so for a Markdown SOP the
realistic automated layer is **Vale + structural lint of any embedded structured fields**, not
opa-style assertions unless the SOP carries a structured metadata block. **Sources:** OPA, conftest, <https://pages.nist.gov/OSCAL/> (primary; OSCAL automation clause was a 2-1 split — it's a format that *enables* tooling, not an assessor).

### ADRs — decision discipline in both modes

**What it is:** Architecture Decision Records — one decision + rationale + trade-offs +
consequences per record; the collection is a maintained decision log.

**Contributes:** a lightweight, version-controlled rationale artefact that applies **unchanged in
both modes** — a *process* design decision is as recordable as an architectural one (the protocol
already does this via `.ai-pm/arch/` notes + architecture.md decisions). **Source:** <https://adr.github.io/> (primary)

### Parameterizing one pipeline by artifact kind — the architecture validator

**What it is:** mainstream build tooling branches a single pipeline on a declared kind while
keeping shared stages DRY:

- **Bazel** `select()` + `config_setting` — a value chosen per named config condition, no separate
  targets; branch criteria decoupled from the consumer.
- **Gradle build variants** — a strict source-set priority where a shared **`main`** holds
  defaults and variant/flavor/type sets **override** ("share common code in `main/`, selectively
  override").
- **CI matrix** — one job definition expanded into many runs via `${{ matrix.* }}`; steps written
  once, parametrized per variant.

**Contributes:** strong validation that the PM's **conditional-split / parameterized "artifact
kind = code | process-doc" axis** is the right pattern — **one pipeline, declared kind, DRY shared
stages (the protocol's `main`/defaults), specialized per-kind stages** — over a separate fork.
This is exactly the generalization of the existing `WORKFLOW.md` "What is mandatory when" change-
type table. **Sources:** <https://bazel.build/docs/configurable-attributes>, <https://developer.android.com/build/build-variants>, <https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs> (all primary, 3-0)

### Process/SOP authoring methodology — canonical artefact structure

**What it is:** ISO 9001 "documented information", BPMN, SIPOC, RACI, Toyota standard work supply
the canonical sections of a good SOP.

**Contributes:** a real methodological basis for a process-flavor template's sections —
**purpose, scope, roles (RACI), inputs/outputs (SIPOC), step-by-step procedure, decision points,
exceptions / failure handling, references, revision history.** An **operator-journey doc does NOT
fully substitute** for this — journeys capture *experience flow*, not roles/inputs/decision-
points/exception-handling/revision discipline → a **dedicated process/SOP artefact is additive**.

**Caveat:** **medium confidence** — no SOP-structure claim cleared 3-vote verification in this
run; treat the section list as sound design guidance to confirm in planning, not verified fact.

---

## Conclusion

**(a) Architecture — the conditional split is right.** Build the process flavor as a
**presence-of-code conditional / parameterized "artifact kind" axis**, **not a separate fork**:
one pipeline, a declared kind, DRY shared stages, specialized per-kind stages — directly
mirroring Bazel/Gradle/CI-matrix practice and generalizing the existing change-type table. Code
present → tests + `code-review` + pipeline; no code → document + artifact-based validation, with
the code-only steps **inert**. Cross-cutting doc artefacts (threat-model, ADRs, product/why,
constraints, journeys) live in the **shared layer**.

**(b) Validation in no-code mode (ranked):** **dry-run / tabletop / pilot = the load-bearing
gate** (the real "tests pass" for a process), backed by a **structural/prose lint (Vale)** as a
cheap pre-gate and a **DoD/expert sign-off** gate. Map the dry-run onto the protocol's Step 5.5
("run it for real" = a pilot/tabletop, human-driven). Never a lone rubber-stamp.

**(c) A dedicated process/SOP artefact is warranted** (medium confidence) — `user-journeys.md`
(operator experience flow) + contracts do **not** cover roles/RACI, inputs/SIPOC, decision
points, exception handling, and revision discipline. Add a process/SOP template alongside, not
instead of, journeys.

**(d) Canonical sections for the process-flavor template** (confirm in planning): purpose •
scope • roles (RACI) • inputs/outputs (SIPOC) • step-by-step procedure • decision points •
exceptions / failure handling • references • revision history. Plus the shared pillars
(why/for-whom = product; the company systems & standards it must respect = stack-notes;
constraints; threat-model where relevant).

**(e) Top failure modes to design against** (low confidence — verify in planning): doc-vs-reality
**drift**, **review fatigue**, **over-proceduralization/bureaucracy**, **dead/stale runbooks**,
**ownership gaps**. Proportionality lesson: the discipline **helps for high-stakes, repeated,
multi-role** processes and **strangles low-stakes one-offs** — so the flavor must scale its
ceremony to the artefact's stakes (the protocol's existing proportionality instinct).

**Build vs adapt:** no off-the-shelf tool does this end-to-end; the protocol **adapts** proven
disciplines (docs-as-code delivery, Vale lint, tabletop validation, ADRs, parameterized-kind
pipeline, SOP section methodology) into its existing plan→review→audit frame. The core
transfers; only the code-specific machinery (Pass-2 `code-review`, build/test pipeline) goes
inert in no-code mode.

## Open questions (carry into `/pm-plan`)

- **Canonical SOP sections** — confirm against primary BPMN/ISO-9001/standard-work sources
  (angle 4 was unverified here); decide the exact `process.md` / SOP template sections.
- **Failure-mode proportionality thresholds** — what credible postmortems say about when the
  discipline helps vs strangles (angle 5 unverified); set the ceremony-scaling rule.
- **Expert sign-off vs rubber-stamp** — design the sign-off as a DoD checklist gate, not a
  signature; confirm what makes it load-bearing.
- **Structure the shared threat-model (and other shared doc artefacts) as data?** — OSCAL-style
  machine-checkable vs prose + Vale + expert review; cost/benefit of structuring for testability.
- **Mechanism choice** — a first-class `artifact kind` axis on top of the `WORKFLOW.md` change-
  type table vs a `/pm-bootstrap` "project kind = software | process" question that selects the
  template set; how `pm-coder` (authoring a doc) and `pm-plan-checker` / `code-review` behave when
  kind = process-doc (Pass-2 code-review → editorial + dry-run instead).

## Sources

Primary (load-bearing, verified):

- [Write the Docs — Docs as Code](https://www.writethedocs.org/guide/docs-as-code/)
- [AWS Well-Architected — Run game days / tabletop (SEC10-BP07)](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_incident_response_run_game_days.html)
- [Vale — prose linter](https://vale.sh/)
- [Open Policy Agent — Policy testing](https://www.openpolicyagent.org/docs/policy-testing) · [conftest](https://www.conftest.dev/)
- [NIST OSCAL](https://pages.nist.gov/OSCAL/)
- [ADR](https://adr.github.io/)
- [Bazel — configurable attributes](https://bazel.build/docs/configurable-attributes) · [Android/Gradle — build variants](https://developer.android.com/build/build-variants) · [GitHub Actions — matrix](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)

Design guidance (angles 4 & 5 — not adversarially verified this run; confirm in planning):
ISO 9001 documented information, OMG BPMN, SIPOC, RACI, Toyota standard work; SRE/docs-as-code
failure-mode literature.

---

*Research run 2026-06-04 via `deep-research` (5 angles, ~19 sources, claims extracted, 25
adversarially verified at 3-vote, 0 killed; angles 4–5 under-covered — flagged).*
