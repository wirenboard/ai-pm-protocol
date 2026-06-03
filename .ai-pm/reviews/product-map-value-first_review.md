# product-map-value-first — plan compliance review

Branch: `feature/product-map-value-first` (commits `848c638` code+plan, `f3f864c` architecture.md).
Diff base: `git diff main...HEAD` — 6 files, +260/-8. Nature: prose/template/agent-definition repo; verification by review against the plan's named checks (no generation harness). `tests/hooks.sh` is the only executable test.

## Plan completeness
- Stack expectations: plan declares "None" with a documented reason (document-body markdown is not a tracked stack component per `doc/stack-notes.md`). No "Stack expectations touched" gap.
- Interaction scenarios section present (feature explicitly **not** provably isolated — auditor re-reads the map; downstream old-format maps exist). OK.
- Not a `hotfix-` topic. No Incident facts required.
- Categorical coverage: the description-field set is the categorical element. Plan projects exactly two siblings (`User value`, `Out of scope`) and lists every excluded sibling — `Who uses it`, `Must work`, `Must not break`, and the proposed "logic" field — under Out of scope with reasons. Full set accounted for.

## Plan compliance
- ✓ **Scenario 1 (value lines lead)** — `pm-bootstrap.md:308-311` Structure step 2 leads each block with `Что даёт:` (from `## User value`) then `Границы:` (from `## Out of scope`), before any table/link/date. Output format `pm-bootstrap.md:336-338` and Worked example `:364-366`,`:375-377` render them first. Check `worked-example-value-first` satisfied.
- ✓ **Scenario 2 (demoted table under `Чем построено:`, pure markdown)** — `pm-bootstrap.md:311` places the build table under a plain `Чем построено:` label "**pure markdown, no HTML — no `<details>`**"; columns Фича/Готово/Ревью preserved. Worked example carries `↑ та же работа` under the second contract's table (`scene-engine` row reused). No `<details>`/`<summary>` HTML tag emitted anywhere (only the negating instruction). Check satisfied.
- ✓ **Scenario 3 (empty Out of scope → no `Границы:`)** — `pm-bootstrap.md:310` "**Omit this line entirely** when the contract has no `## Out of scope` content … do not emit an empty `Границы:` line." Output-format placeholder `:337` repeats the omit rule. Check `empty-out-of-scope` satisfied.
- ✓ **Scenario 4 (Infrastructure bucket unchanged)** — `pm-bootstrap.md:312` step 3: bucket "has no contract, so it carries **no** `Что даёт` / `Границы` lines and **no** `Чем построено:` label — just its existing plain table." Check `infra-bucket-unchanged` satisfied.
- ✓ **Scenario 5 (auditor reads rows under `Чем построено:`, no prose-policing)** — `pm-auditor.md:111` reads feature rows from the table under `Чем построено:` (and handles old-format under the `Guarantees:` line), compares **by content not byte format**, and states value lines are "**not** a required-presence content check." Check `auditor-reads-labeled-table` satisfied.
- ✓ **Scenario 6 (proactive format-refresh nudge)** — detection condition added at `pm-bootstrap.md:54`; `/pm-plan` offer at `pm-plan.md:227-231`; non-blocking `/pm-audit` note at `pm-audit.md:88-91`; auditor non-blocking note at `pm-auditor.md:117`. All reference `### Pending-migration detection` by name and route to regeneration via the Product map generation procedure (idempotent, overwrite-from-source; no `git mv`/`git rm`). Checks `old-format-detection`, `old-format-refresh-note`, `plan-nudge-old-format` satisfied.

## Test plan checks
- ✓ `worked-example-value-first` — value lines precede labeled table in both Output format and Worked example; `↑ та же работа` retained.
- ✓ `empty-out-of-scope` — omit rule stated in both procedure and output template.
- ✓ `infra-bucket-unchanged` — no value lines / no label for the bucket.
- ✓ `output-emits-value-lines` — no `Guarantees:` **output template** remains (the three deleted lines were the step-2 instruction, the output placeholder, and two worked-example lines). `Guarantees:` survives only as a **detection signal** at `pm-bootstrap.md:54`, `pm-auditor.md:111,117`, `pm-audit.md:88`, `pm-plan.md:227`, and the architecture record — exactly the legitimate set the plan allows.
- ✓ `old-format-detection` — exactly **one** condition added to `### Pending-migration detection`; remediation is regenerate-from-source, not a structural migration; v2.2/v2.3 conditions (`:47-52`) and procedures untouched (verified: only one `+` line in that region; all `-` lines are output-template `Guarantees:`/table lines).
- ✓ `auditor-reads-labeled-table`, `old-format-refresh-note`, `plan-nudge-old-format` — see Scenario 5/6 above. Content-stale note and format-refresh note kept explicitly distinct in both `pm-auditor.md:117` and `pm-audit.md:88-91`; the format note is non-blocking.
- ✓ `bash tests/hooks.sh` — 65/65 PASS.

## Contracts / scope integrity
- ✓ `### Pending-migration detection` gained exactly one condition; v2.2/v2.3 byte-unchanged.
- ✓ Nudge surfaces (pm-plan, pm-audit, pm-auditor) reference the detection section **by name**, do not re-encode conditions.
- ✓ Content-stale note vs new format-refresh note kept distinct; format-refresh is non-blocking.
- ✓ No structural data migration added; no new contract field / 4-field model; no new generator input.
- ✓ `doc/architecture.md:104` updated — one paragraph addition recording the value-first block (render-only projection, pure markdown no HTML, old-format detection), plan added to Source list. Owner pm-architect, correct file.
- ✓ `product.md.tmpl`, `contract.md.tmpl`, and existing tests untouched (not in diff).
- No Product Contract touched (template-repo exception; this repo produces no `product-map.md`).

## Interaction scenarios
- ✓ Auditor re-derive after format change — `pm-auditor.md:111` covers the post-change read path.
- ✓ Old-format map is not a content-stale finding but gets a format-refresh note — `pm-auditor.md:111,117`, `pm-audit.md:88`.
- ✓ `/pm-plan` nudge path on old-format map — `pm-plan.md:227-231`, with declined-path fallback (handoff regenerates anyway).

## Definition of Done
- [x] All plan scenarios implemented and tested (review checks 1-6)
- [x] Interaction scenarios have concurrent/post-condition coverage (auditor re-derive, old-format note, plan nudge)
- [x] Stack expectations respected; stack-spec tests — none required (declared, justified)
- [x] Product Contract honored — N/A (template-repo exception; backend/protocol-only, no Product Contract touched)
- [x] Pipeline green — `tests/hooks.sh` 65/65
- [x] State file updated — N/A (this protocol repo has no `.ai-pm/state/`; not a plan DoD item)
- [x] Product Impact Report present — N/A (no contract touched)
- [x] Docs updates landed — pm-bootstrap, pm-auditor, pm-plan, pm-audit, architecture.md all in branch
- [x] Expected artifacts exist — plan (`doc/features/product-map-value-first_plan.md`) + this review. No contract (non-user-facing protocol change).

**DoD: pass**

## Blocking
None.

## Notes (product)
None. Scope matches the plan exactly (6 files, all named in Docs to update); no silent widening observed.

## Verdict
approve
