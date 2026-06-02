# product-map-migration-detection — plan compliance review

Branch `feature/product-map-migration-detection` (diff `git diff main...HEAD`). Protocol-prose
change (agents/commands markdown, no app code). Verified by inspection per the meta-infrastructure
exception (`doc/architecture.md`); `tests/hooks.sh` is the only automated harness and hooks are
untouched. No automated-test blocking applied (correct for prose).

## Plan compliance
- ✓ Scenario 1 (`pm-auditor` flags lingering `_index.md` as a note, never an inventory source; `product-map.md`-exists is a hard early step) — `pm-auditor.md:38` makes inventory `git log`+`*_plan.md` only and routes a present `_index.md` to a Docs-currency note; `pm-auditor.md:108-111` reorders the map check so the existence gate (line 110) runs before and independent of the re-derivation (line 111 — "do not re-derive until the file is known to exist"). Implemented.
- ✓ Scenario 2 (`/pm-audit` offers to run the pending migration; auditor read-only) — `pm-audit.md:84-87` adds an un-migrated-structure remediation branch in the findings walk with a plain-language offer; "The auditor only flagged it; the orchestrator runs it." Action/offer grammar lives only in the command. Implemented.
- ✓ Scenario 3 (`/pm-plan` retrospective pending-migration nudge cloned from the 5+-features block) — `pm-plan.md:222-226` adds a sibling **Pending-migration nudge** in `## Retrospective check`, PM decides, never auto-runs, "Don't implement fixes" guard preserved below it. Implemented.
- ✓ Scenario 4 (greenfield/feature-less exemption preserved, only made stricter) — `pm-auditor.md:109` evaluates the exemption first and adds `_index.md`-absent to its preconditions (a lingering index is evidence of a non-greenfield project, so it cannot misfire). A missing map with no `_index.md` / no contracts / no plans is still not a finding. Preserved.

## Arch-notes structural decisions
- ✓ Single-sourcing — new named `### Pending-migration detection` subsection at the top of `## Pending template-upgrade migrations` (`pm-bootstrap.md:43-54`) holds both conditions and the frozen v2.3 signature string. The frozen string `Source of truth = contracts. One contract, many features. Generated, not hand-filled.` appears in **exactly one place** (`pm-bootstrap.md:50`) — verified by repo-wide grep. The v2.2 and v2.3 migration entries (`:56`, `:64`) now defer their detection guards to the subsection by name; the migration **procedures/steps** are unchanged (diff only trimmed the inline detection prose).
- ✓ All three consumers cite the subsection **by name**, never by line number, never re-encode — `pm-auditor.md:38` & `:110`, `pm-plan.md:222`, `pm-audit.md:84` all reference "`### Pending-migration detection` in `pm-bootstrap.md`". `pm-plan`/`pm-audit` add a short gloss pointer (e.g. "a lingering `_index.md`, or … no `product-map.md`") for PM readability but do not reproduce the literal frozen string — that stays in bootstrap only. Acceptable name-citation, not a fork.
- ✓ Auditor given NO action/auto-fix capability — hard rules (`pm-auditor.md` "Hard rules": read-only, write only to the audit file, "Don't propose technical fixes — only protocol remediation steps") are intact and untouched. The new note (`:110`) uses flag/remediation grammar ("remediation: the orchestrator runs the pending `/pm-bootstrap` migration") with no action verbs. Read-only split honored.

## Plan hygiene (arch-notes item 5)
- ✓ Plan's prior line-number citations (`:43`/`:51`) replaced with the named-subsection reference (`doc/features/...plan.md:17,22,44`); no `:43/:51/:56/:61` refs remain. Line-rot the feature removes is not reintroduced by the plan.

## Definition of Done
- [x] All plan scenarios implemented and tested — all 4 implemented; verified by inspection (prose, meta-infra exception; no automated-test gate applies)
- [x] Interaction scenarios have concurrent-state tests — plan declares `Provably isolated` (prose change, no runtime state); correct, no concurrent-state test required
- [x] Stack expectations respected; stack-spec tests pass — none touched (`doc/stack-notes.md` untouched); n/a
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change — no Product Contract touched (this is protocol-internal agent/command prose, not a user-facing app feature)
- [x] Pipeline green — `bash tests/hooks.sh` → 65/65, hooks untouched
- [x] State file updated — n/a and correct: NO `.ai-pm/state/current.md` created or present on branch (confirmed absent); a stray state file would itself be scope creep
- [x] Product Impact Report present (when contract touched) — n/a, no contract touched
- [x] Docs updates landed — plan lists "None under `docs/`"; CHANGELOG + MINOR bump explicitly deferred to `pm-pr-prep` (confirmed absent from diff, as intended)
- [x] Expected artifacts exist — plan (`doc/features/product-map-migration-detection_plan.md`), arch notes (`.ai-pm/arch/...arch.md`), and this review present; no Product Contract required (not user-facing)

**DoD: pass**

## Scope
Files touched exactly: `pm-bootstrap.md`, `pm-auditor.md`, `pm-audit.md`, `pm-plan.md` + plan + arch notes. No creep, no spurious state file, no premature CHANGELOG/version bump. Categorical coverage: both un-migrated conditions (v2.2 `_index.md`, v2.3 signature) are single-sourced together — no sibling silently dropped.

## Blocking
None.

## Notes (product)
None. Scope matches the plan exactly; the recommended arch Variant B (two offer surfaces, single-sourced conditions) is implemented as decided.

## Verdict
approve
