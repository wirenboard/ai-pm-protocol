# readme-currency — plan

Source: `.ai-pm/backlog.md` "README currency + template-conformance must be actively watched" (PM complaint 2026-06-05, raised twice). Selected by the PM as the next feature; doubles as **validation-by-use** of the just-shipped on-demand `workflow/*.md` structure (v2.29.0).

*Make README currency + template-conformance **actively watched during ordinary feature work**, not only at `/pm-audit` or template bump. Two complementary mechanisms, one per gap the PM named: **(a)** a per-feature **README-currency check** in `/pm-plan` — a semantic, judgment-triggered, no-hook check (the NFR / state-model pattern) that, when a feature touches install / packaging / quick-start / the architecture one-liner / a doc pointer, requires the plan to name `README.md` in "Docs to update" so `pm-architect` refreshes it on the existing post-coding handoff; **(b)** a **`pm-auditor` README-conformance dimension** — structure-only, that an existing README still carries the canonical beats (install present, License present, the `docs/product.md` front-gate pointer present) and that the install block matches the `Integration contract`. Both reference the canonical README shape by name (readme-template-canonical-shape / the front-gate discipline) and **never re-encode the beats**; both are **proportional and structure-only — never prose-policing**.*

Meta-feature on the template repo: **software-kind**, non-user-facing (subjects = `/pm-plan`, `pm-auditor`, `pm-architect` — the protocol's own command/agents). No Product Contract, no advocate gate, no `## Validation` gate. Verification = editorial + clean-grep; `tests/hooks.sh` stays green (no hook touched — both mechanisms are no-hook by design).

## Scenarios

1. **Per-feature README-currency check fires when a feature touches a README-bearing surface.** `/pm-plan` gains a conditional, judgment-triggered check (the same shape as the NFR / state-model checks — a semantic judgement, **no hook**, no mandatory plan section): when the feature touches **install / packaging / quick-start / the architecture one-liner / a doc pointer**, the plan **must name `README.md` in its "Docs to update"** section, and `pm-architect` (the README front-door owner) refreshes it on the **existing post-coding "Docs to update" handoff** — the same trigger/owner as `docs/architecture.md`. When the feature touches none of those surfaces, the check is **silent** (no README mention required) — proportional, never blanket-mandatory.

2. **`pm-auditor` gains a README-conformance dimension — structure-only.** Beyond the existing old-template front-gate check (positive presence of a `## What it does` capability list), the auditor additionally asserts an existing `README.md` still carries the **canonical beats**: an install / quick-start section present, a `## License` section present, and the `→ … docs/product.md` front-gate pointer present; and that the install block still **matches the `Integration contract`** (generalizing the `pm-architect` A4 install pairing into the periodic audit). Missing a canonical beat or an install↔Integration-contract divergence → **note** (non-blocking, structural). It **detects structure only — never prose-polices** wording/quality (that stays `pm-architect`'s / the PM's call), exactly like the adjacent front-gate and value-line checks.

3. **Both reference the canonical shape, never re-encode it.** The check and the dimension both point at the **single source** of the canonical README shape — the `doc/_templates/README.md.tmpl` guidance comment + the `pm-architect` canonical-README-shape authoring rule + the README front-gate discipline (readme-template-canonical-shape, v2.26.0) — by name. Neither restates the beat list (что→зачем→install→details→license) as a parallel definition, mirroring the "references … by name, never re-encode" discipline of the single-sourced subsections.

4. **No contradiction with existing README machinery.** The new dimension **complements** (does not duplicate or conflict with) the existing old-`## What it does` front-gate check, the `pm-architect` A4 `Integration contract ↔ README install` cross-check, and the README front-gate migration. The honest nuance the PM named is preserved: routing a product-canon README edit to `pm-architect` stays **correct** — this feature does not change ownership; it only adds the **triggers that make the protocol look** (per-feature) and **verify conformance** (per-audit).

5. **Additive, ships downstream via the submodule, no migration.** The check lives in `/pm-plan` (a command) and the dimension in `pm-auditor` (an agent) — both consumed downstream via the existing symlinks; no downstream-owned file changes, no `@`-line change. Therefore **no `MIGRATIONS.md` pending-migration entry** and no template structural migration. (An existing downstream README is **not** force-migrated — the per-feature check only fires when a future feature touches a README-bearing surface; the audit dimension only **notes**.)

## Existing behaviors this feature touches

(what must not break)

- **The README front-gate discipline** (the `pm-auditor` old-`## What it does` check; the README front-gate migration in `MIGRATIONS.md`; `docs/product.md` as the single capability owner) — preserved exactly; the new dimension asserts the pointer is **present**, the inverse of the existing "no second capability list" check, and never asks the README to own capability.
- **`pm-architect` A4 cross-check** (`Integration contract ↔ README install`, one of the fixed three pairings) — unchanged as the architecture-authoring-time check; the new audit dimension **reuses the same pairing** at audit time (generalization, not replacement) and must not contradict it.
- **readme-template-canonical-shape** (v2.26.0 — the template skeleton + the `pm-architect` authoring rule) — the **single source** the new check/dimension reference; not re-encoded, not duplicated.
- **Proportionality** — the per-feature check is judgment-triggered and silent when no README-bearing surface is touched (NFR / state-model pattern); existing downstream READMEs are not force-restructured; the audit dimension only **notes**.
- **The no-prose-policing rule** in `pm-auditor` — the new dimension is **structure-only** (beats present / install matches Integration contract), never a judgement of wording or currency-of-content.
- **`tests/hooks.sh`** — no hook / `.claude/settings.json` touched; 74/74 stays green. (Both mechanisms are no-hook semantic checks.)
- **The new on-demand `workflow/*.md` structure** (v2.29.0) — this feature edits `/pm-plan` + `pm-auditor`, which now carry Read-steps/pointers into `workflow/*.md`; the edits must not break those pointers. (This feature is also the live validation that the structure works.)

## Contracts

None. A protocol-behavior change expressed in command/agent instruction prose (a new conditional check + a new audit dimension). No API, data shape, schema, or downstream-consumed runtime artifact.

## Stack expectations touched

None. No library/framework/runtime API, no external protocol, no build/packaging change. (The Claude Code context-loading model in `doc/stack-notes.md` is not touched.)

## Interaction scenarios

Provably isolated: a static change to two instruction files (`/pm-plan` command + `pm-auditor` agent) — no runtime, no shared mutable state, no concurrency, no I/O. The only coupling — the new check/dimension vs the existing front-gate check / A4 pairing / canonical-shape source — is read sequentially and covered by Scenarios 3–4 and the clean-grep (no duplicate/contradictory README rule; the canonical shape referenced, not re-encoded).

## Test plan

*Repo discipline: no automated tests by design — verification is editorial + clean-grep; `tests/hooks.sh` stays green (no hook touched).*

- Existing tests that must pass: `tests/hooks.sh` (74/74 — unchanged).
- New tests: none (instruction-prose change). Verification instead:
  - **Per-feature check present + proportional.** `/pm-plan` carries the README-currency check; it is judgment-triggered (no hook, no mandatory section), names the README-bearing surfaces (install / packaging / quick-start / architecture-one-liner / doc-pointer) as the full trigger set, requires `README.md` in "Docs to update" only when one is touched, and is **silent** otherwise. It routes the refresh through the existing `pm-architect` post-coding handoff (same owner/trigger as `docs/architecture.md`), not a new mechanism.
  - **Auditor dimension present + structure-only.** `pm-auditor` carries the README-conformance dimension: asserts install + License + `docs/product.md` pointer present and install ↔ `Integration contract` match; emits a **note** (non-blocking, structural); explicitly **does not prose-police**; complements (does not duplicate) the old-`## What it does` check.
  - **Single-source clean-grep.** Neither the check nor the dimension re-encodes the canonical beat list — both reference readme-template-canonical-shape / the front-gate discipline by name. Grep confirms no parallel restatement of что→зачем→install→details→license.
  - **No-contradiction check.** The new dimension and the existing front-gate check + A4 pairing coexist without conflict (no rule says both "README must have a capability list" and "must not").
  - **No-migration / no-hook check.** No `MIGRATIONS.md` entry; no `.claude/settings.json` / `tests/hooks.sh` change; `tests/hooks.sh` 74/74.
  - **`workflow/*.md` pointer integrity.** The edits to `/pm-plan` + `pm-auditor` leave their existing `workflow/<topic>.md` Read-steps/pointers intact and resolving (validation-by-use of v2.29.0).
- Interaction scenario tests: none (provably isolated).
- Stack-spec tests: none (no stack component touched).

## Docs to update

- `.claude/commands/pm-plan.md` — **the deliverable (part 1)**: add the README-currency conditional check (Scenario 1), in the conditional-checks area alongside the NFR / state-model checks, referencing the canonical shape by name. Authored by `pm-coder`.
- `.claude/agents/pm-auditor.md` — **the deliverable (part 2)**: add the README-conformance dimension (Scenario 2), beside the existing old-`## What it does` README check, structure-only / note. Authored by `pm-coder`.
- `.claude/agents/pm-architect.md` — if needed, a one-line note that the per-feature README refresh rides the existing "Docs to update" post-coding handoff (pm-architect already owns `README.md`); only if not already implied. Authored by `pm-coder`.
- `workflow/pipeline.md` — if the Step 4 "Docs to update" handoff needs an explicit mention that `README.md` (when named by the new check) is refreshed by `pm-architect` on the same handoff. Authored by `pm-coder` (minimal; only if it sharpens the trigger).
- *(No `doc/architecture.md` decision record — the substantive decision (README is a thin front gate; `docs/product.md` is the single capability owner) was recorded when the front-gate landed; this slice adds enforcement, not a new decision — same call as readme-template-canonical-shape.)*
- *(No `MIGRATIONS.md` entry, no `CLAUDE.md` Pipeline / validator change, no new `workflow/*.md` file — additive, no migration, no new stack component.)*

## Out of scope

- **(c) Making the `pm-architect` A4 cross-check bidirectional / not-architecture-authored-gated** — deferred. The audit-time install ↔ Integration-contract check in Scenario 2 covers most of (c)'s value; a separate change to A4's direction is a marginal refinement, its own slice if still wanted.
- **Prose-policing the README** — explicitly rejected; both mechanisms are structure-only (beats present / install matches the contract), never a judgement of wording, completeness, or currency-of-content (that is `pm-architect`'s / the PM's call).
- **Force-migrating existing downstream READMEs** — no new migration; the per-feature check only fires on a future README-bearing feature, the audit dimension only notes.
- **A new capability/value section in the README** — rejected (re-introduces the second-capability drift the front-gate removed); the "зачем" beat stays the `docs/product.md` pointer.
- **Changing README ownership** — `pm-architect` remains the front-door owner; this slice adds triggers that make the protocol *look*, not a new editor.
- **Sibling surfaces of the categorical trigger set** — the full README-bearing surface set (install / packaging / quick-start / architecture-one-liner / doc-pointer) is covered by the check; no element is singled out.
