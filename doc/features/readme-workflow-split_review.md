# readme-workflow-split — review

## Plan compliance

- ✓ Scenario 1 — README.md carries cross-reference banners at the top of the three named sections ("Как это работает", "Какие риски снижает", "Что остаётся за PM"). Verified at `README.md:9`, `README.md:92`, `README.md:128`. Each points to `WORKFLOW.md`.
- ✓ Scenario 2 — WORKFLOW.md carries a one-line header note pointing to README.md as the friendlier overview. Verified at `WORKFLOW.md:1`. Note also marks WORKFLOW as canonical and adds the conflict-resolution rule ("when the two documents disagree, this one wins") — a minor extension over the plan's "one-line header note" but consistent with the plan's intent of making the role split visible.
- ✓ Scenario 3 — Future drift becomes visible. The cross-references are now load-bearing pointers; an editor changing one side will see the other side referenced and have a reason to look at it. Validation is by review, not by test.

## Test plan validation

The plan declares "Validation by review" — no automated tests added or required for prose cross-refs. Validation criteria applied:

- ✓ Each cross-reference points at a section that actually exists. README's three banners all link to `WORKFLOW.md` (file exists). The PM-communication banner cites `§ "How to talk to the PM"` — section header confirmed at `WORKFLOW.md:187`.
- ✓ No content is duplicated, removed, or rephrased — diff is purely additive: 3 quote-block lines in `README.md`, 1 quote-block line in `WORKFLOW.md`. Verified via `git diff main..HEAD --stat` (+72/-0, of which 64 are the plan file itself).
- ✓ README install instructions and Russian voice preserved — install block at `README.md:67-88` untouched; new banners written in Russian register matching the surrounding prose.
- ✓ WORKFLOW.md header note is one line and does not contradict the existing intro. It precedes the first `## Workflow agents` heading and frames the file's role.

## Stack expectations

The plan declares "None — pure prose edit." Confirmed: no Markdown frontmatter, no schema, no code paths touched. Dimension 10 is N/A.

## Product Contract

No `.ai-pm/contracts/` directory in this repo (this is the template/source repo, not a downstream consumer). No user-facing feature touched — README and WORKFLOW are protocol documentation for downstream consumers, not a user-facing application. Dimension 11: no Product Contract touched.

## Definition of Done

- [x] Code changes are within the plan's scope (no scope creep). Exact files declared in plan's "Docs to update" landed; no other files changed besides the plan itself.
- [x] Plan's "Stack expectations touched" rules respected; stack-spec tests pass. None declared, none required.
- [x] Product Contract (if any) honored; Acceptance checks pass; no silent behavior change. No contract touched (template repo, no user-facing surface).
- [x] Tests run; pipeline (test + lint + validators) green. `bash tests/hooks.sh` → 44/44 pass.
- [x] `.ai-pm/state/current.md` updated; Done / Remaining / Next step current. N/A for this repo — `.ai-pm/state/` is a downstream-consumer artefact, not present in the template/source repo itself.
- [x] Coder's Product Impact Report present (when contract touched). N/A — no contract touched.
- [x] Docs updates listed in plan are landed in this branch. `README.md` (3 inline cross-refs) and `WORKFLOW.md` (one header note) landed exactly as plan declared.

**DoD: pass**

## Blocking

None.

## Notes (product)

None. The cross-references match the plan's chosen "inline parenthetical pointer" style. The three placements in README correspond exactly to the three sections enumerated in "Docs to update".

## Notes (technical)

1. `WORKFLOW.md:1` — the header note slightly exceeds the plan's "one-line header note pointing to README.md for the marketing-level overview". It also marks the file as canonical and adds a conflict-resolution rule ("when the two documents disagree, this one wins"). This is a benign extension that strengthens scenario 1's "reader who needs the binding rules knows where to go" by also answering "what happens if the two say different things" — but it is technically wider than the plan's literal text. Routing: drop on merge — the addition is in service of the same goal (making the role split visible) and reads naturally; no value in narrowing the wording.

2. `README.md:128` — the third cross-reference cites `§ "How to talk to the PM"` with a fragment-free link (`WORKFLOW.md` without `#how-to-talk-to-the-pm`). GitHub auto-generates anchor IDs from headings, so a fragment link would jump directly. Readers currently land at the top and must scroll. Routing: respawn `coder` if the orchestrator finds the cost trivial, otherwise drop on merge — adding `#how-to-talk-to-the-pm` is a one-character change but the other two banners also link without fragments, so consistency is the trade-off.

## Verdict

approve

This PR adds three short pointers in README.md and one header note in WORKFLOW.md that make the role split between the two files explicit to readers: README is the friendly overview, WORKFLOW is the canonical spec. No content was moved or rephrased — only signposts added so a reader (or a future editor) knows where the authoritative text lives.
