# audit-fixup-self-docs-architecture — review v2 (re-check)

**Reviewed file:** `doc/architecture.md` (uncommitted, architect re-spawn after v1 review).
**Plan:** `doc/features/audit-fixup-self-docs-architecture_plan.md`.
**Previous verdict:** v1 — `approve` with 1 product note (PM chose: strict 1:1 → add the two N/A sections) and 3 technical notes (PM-approved technical note #1 fix; #2 and #3 dropped on merge).

**Scope of this re-check:** the two specific areas touched since v1. Everything else carried forward from v1 approve, not re-checked.

---

## What was touched since v1

1. **N/A sections added for `External standards` and `Dependencies`** (product note from v1 — PM chose strict 1:1 fidelity with the architecture template).
2. **Citation correction for technical note #1** (the phantom `§ "Обновление шаблона"` header reference inside line 126 of architecture.md).

---

## Re-check 1: N/A sections added

- ✓ `## External standards` present at `doc/architecture.md:148`, with one-line reason: "N/A — this is a downstream-projects concept. The template itself sets the standards that downstream projects adopt; it does not adopt company / team standards from anywhere upstream." Honest, accurate, and matches the spirit of the existing N/A clauses.
- ✓ `## Dependencies` present at `doc/architecture.md:154`, with one-line reason: "N/A — the template has no runtime dependencies in the package-manifest sense (no `package.json`, no `requirements.txt`, no `go.mod`). The ambient CLI tools the agents and hooks rely on (`jq`, `gh`, `git`) are documented per-component in `doc/stack-notes.md` instead." Accurate; correctly cross-references where ambient tooling actually lives.
- ✓ Both new N/A sections are placed adjacent to the other out-of-scope sections (External standards → Dependencies → Security constraints → Code conventions → Deploy / runtime → Database / state → UI guide), forming a single contiguous block at the tail of the document. The visual cluster the v1 product note implicitly asked for is now in place.
- ✓ Section ordering follows the template (`doc/_templates/architecture.md.tmpl`): the template's order is `External standards → Tech stack → Key decisions → Constraints → Security constraints → Code conventions → Dependencies` (Dependencies is the last section in the template). The architecture.md applies a small reordering — it puts External standards and Dependencies together with the rest of the N/A block, rather than scattering them at template positions. This is a defensible local choice given the meta-case ("all of these are N/A, so cluster them"); it does not silently drop any template section.

**Verdict on this slice:** clean.

---

## Re-check 2: Technical note #1 citation fix

v1 technical note #1: `doc/architecture.md:126` cited `README.md § "Установка" + § "Обновление шаблона"`, but `Обновление шаблона:` is not a `##`-level header in README — it is an inline line (`README.md:74`) inside the `## Установка` section. Suggested fix: collapse to `README.md § "Установка"`.

Current `doc/architecture.md:126`:

> **Source:** `README.md` § "Установка" (the inline `git submodule update --remote .ai-pm/tooling` line at the end of the install block) + `WORKFLOW.md` § "Maintenance".

- ✓ The phantom `§ "Обновление шаблона"` header reference is gone.
- ✓ The citation now quotes the actual inline anchor (the `git submodule update --remote .ai-pm/tooling` line). Verified: this line exists at `README.md:77` inside the `## Установка` section, and is the canonical install-block reference for submodule version bumping.
- ✓ Cross-reference `WORKFLOW.md § "Maintenance"` is a real section header (verified at `WORKFLOW.md:145`). New citation is not introducing a phantom anchor.

**Verdict on this slice:** clean.

---

## Plan compliance (re-check, scoped)

- ✓ Plan scenario 2 — "Если что-то из шаблона architecture.md.tmpl не применимо к шаблону самому … это явно отмечается с одной строкой пояснения": with `External standards` and `Dependencies` now N/A-marked, the document is fully 1:1 with the template's section roster. The plan's strict reading is now satisfied.
- ✓ Plan scenario 1 unchanged (all in-scope sections still present from v1).
- ✓ Plan's "Out of scope" categorical list still cleanly mirrored.

---

## Blocking

None.

---

## Notes (product)

None.

---

## Notes (technical)

None new.

(v1 technical notes #2 and #3 — release-flow prose mixing developer + CI sides; persona names listed three times — were marked `drop on merge` in v1 and remain in that disposition. Not re-raised.)

---

## New findings introduced by the v1 → v2 changes

None. The two surgical edits did not introduce any new factual claim that needed re-verification beyond the two new N/A reasons and the WORKFLOW.md § "Maintenance" cross-reference, both of which check out.

---

## Verdict

**approve**

The architect's two fixes land cleanly: the two missing N/A sections (External standards, Dependencies) are present with honest one-line reasons and cluster correctly with the other N/A sections, and the phantom README header in the citation at line 126 is replaced with a quote of the actual inline line. No regressions or new findings. Ready for `pr-prep`.
