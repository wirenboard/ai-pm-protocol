# readme-template-canonical-shape — plan

Source: PM-directed 2026-06-05 — "идея для ЛЮБОГО ридми: что это такое, зачем оно надо, как поставить, подробности и лицензия … можно прямо в протокол вшить". Follow-up to `readme-rewrite` (v2.24.1), which applied this shape to the protocol's OWN README; this slice bakes it into the **downstream template + a discipline** so every project scaffolded from the protocol gets it.

*Make `doc/_templates/README.md.tmpl` — the README every downstream project is scaffolded from at `/pm-bootstrap` — follow the canonical front-door shape **что это → зачем → как поставить → подробности → лицензия** (what it is → why → install → details → license), and give `pm-architect` an authoring rule so it maintains downstream READMEs to that shape. The hard constraint: the shape must **honor the existing README front-gate discipline** — the README is a thin front door that owns **no** capability/value statement and points to `docs/product.md` for "what it does, for whom, limits". So the "зачем" beat is satisfied by the **existing front-gate pointer to `docs/product.md`**, never by a new value/capability section that would re-introduce the drift the front-gate removed.*

Meta-feature on the template repo: **software-kind**, non-user-facing (subjects = the README template / `pm-architect` / downstream READMEs / the scaffold step). No Product Contract, no advocate gate, no `## Validation` gate. Verification = editorial + clean-grep; `tests/hooks.sh` 71/71 (no hook touched).

## Scenarios

1. **The template follows the canonical shape — reconciled with the front-gate.** `doc/_templates/README.md.tmpl` is restructured to the canonical order:
   - **что это** — `# <Project Name>` + the one-paragraph intro (what it is / who uses it / what problem it solves).
   - **зачем** — the **existing front-gate pointer line** `→ What it does, for whom, and current limits: docs/product.md` — this *is* the "why you need it / what it does" beat, **owned by `docs/product.md`, referenced not restated** (front-gate preserved; the README gains **no** new value/capability section).
   - **как поставить** — the install / quick-start section, near the top (right after the front-gate pointer).
   - **подробности** — the deeper sections (architecture one-liner + `docs/architecture.md` pointer; development test/lint + `CLAUDE.md` pointer; any other doc pointers), grouped as the "details" tier.
   - **лицензия** — License, last.
   A guidance comment at the top of the template names the canonical beats so a `pm-architect` (or a human) filling it knows the organizing principle.

2. **Front-gate discipline intact — no second capability statement.** The restructured template carries **no** `## What it does` capability list and **no** value/“why” section that duplicates `docs/product.md` `## What it does today`. The "зачем" beat is the pointer line only. This keeps the `pm-auditor` old-template-README front-gate check and the `pm-architect` A4 `Integration contract ↔ README install` cross-check valid, and does not re-create the drift the README front-gate migration removed.

3. **`pm-architect` authoring rule.** `pm-architect` (the README front-door owner — it performs the README front-gate migration) gains a one-paragraph rule: when it authors or restructures a downstream `README.md`, follow the canonical **что→зачем(→product.md)→install→details→license** shape, keeping the README a thin front door (no capability statement; the "зачем" is the `docs/product.md` pointer). This is the authoring counterpart to the template skeleton.

4. **Optional `pm-auditor` structural note — decided in arch-review.** Whether to add a light, structure-only `pm-auditor` check that a downstream README follows the canonical shape (e.g. install + license present; front-gate pointer present) is a **proportionality question deferred to the arch note** — the existing old-template-README front-gate check already covers the most important drift (a `## What it does` capability list). The default leaning is **no new auditor check this slice** (the template + the authoring rule are the mechanism; an auditor shape-check risks over-firing on legitimately-varied READMEs and prose-policing structure). The arch note settles it.

5. **Additive, ships downstream, no migration.** New projects scaffold the canonical README from the updated template. **Existing downstream READMEs are NOT force-restructured** — there is no new migration; a project's README is reshaped only if/when `pm-architect` next authors it (or the PM asks). The existing README front-gate migration (capability-list → pointer) is unchanged and remains the one README migration. No template structural migration, no `MIGRATIONS.md` change.

## Existing behaviors this feature touches

(what must not break)

- **The README front-gate discipline** (`pm-auditor` old-template-README check; the README front-gate migration in `MIGRATIONS.md`; the `docs/product.md` pointer as the single capability owner) — **preserved exactly**. The canonical shape reuses the front-gate pointer as its "зачем" beat; it adds no capability/value section.
- **`pm-architect` A4 `Integration contract ↔ README install` cross-check** — stays valid: the install section is kept (reordered/renamed at most), so `docs/architecture.md` `Integration contract` still has a matching README install to cross-check against.
- **The `/pm-bootstrap` scaffold step** (`README.md` from `README.md.tmpl`) — unchanged mechanism; it just scaffolds the new canonical skeleton.
- **The protocol's OWN README** (`README.md`, restructured in `readme-rewrite` v2.24.1) — already on this shape; untouched here (this slice is the downstream *template*).
- **Proportionality** — existing downstream projects are not force-migrated; no new mandatory structure on a tiny project.

## Contracts

None. Documentation-template restructure + an authoring rule. No API, data shape, or downstream-consumed runtime artifact.

## Interaction scenarios

Provably isolated: a template-file restructure + an agent authoring-rule note + (per arch) maybe a doc decision record — no runtime, no shared state, no concurrency, no I/O. The only coupling (the template ↔ the front-gate pointer ↔ `pm-architect`'s authoring rule ↔ the A4 cross-check) is read sequentially and covered by Scenarios 1–5 and clean-grep.

## Test plan

*Repo discipline: no automated tests by design — verification is editorial + clean-grep, the same as every prior meta-feature; `tests/hooks.sh` stays green (no hook touched).*

- Existing tests that must pass: `tests/hooks.sh` (71/71 — unchanged).
- New tests: none (prose/template change). Verification instead:
  - **Editorial walkthrough** — the template follows что→зачем(pointer)→install→details→license; carries no `## What it does` / value section; the front-gate pointer is the "зачем" beat; the guidance comment names the canonical beats.
  - **Clean-grep — front-gate intact:** the template has **no** `## What it does` heading and no capability/value list; the `→ … docs/product.md` pointer line is present and is the only "what it does / зачем" statement.
  - **Clean-grep — install + license present:** the install section and the License section are both present (install near the top), so A4 `Integration contract ↔ README install` still has a target.
  - **Clean-grep — authoring rule:** `pm-architect` carries the canonical-shape authoring rule referencing the front-gate (no capability statement; зачем = product.md pointer).
  - **Clean-grep — no new migration:** no `MIGRATIONS.md` entry, no template structural-migration trigger added (existing downstream READMEs are not force-restructured).
- Interaction scenario tests: none (provably isolated).
- Stack-spec tests: none (no stack component touched).

## Docs to update

- `doc/_templates/README.md.tmpl` — restructure to the canonical **что это → зачем(→`docs/product.md` pointer) → как поставить(install) → подробности(architecture/development/doc pointers) → лицензия** shape, with a top guidance comment naming the beats and the front-gate rule (no capability/value section; зачем = the product.md pointer). Keep the install section and the License; keep English canonical headers.
- `.claude/agents/pm-architect.md` — add the **canonical-README-shape authoring rule** (one paragraph, in the README/front-door area): when authoring or restructuring a downstream `README.md`, follow что→зачем(product.md pointer)→install→details→license and keep it a thin front door (no capability statement). References the front-gate discipline; does not duplicate it.
- *(`.claude/agents/pm-auditor.md` — a canonical-shape structural note is **deferred to the arch note's recommendation**; default no new check this slice.)*
- *(`doc/architecture.md` — a short decision record only if the arch note judges the front-gate↔canonical-shape reconciliation worth recording; pm-architect's post-coding handoff. Otherwise omitted — a template restructure is not necessarily an architectural decision.)*
- *(No `MIGRATIONS.md` / hook change — additive, no migration.)*

## Out of scope

- **Force-restructuring existing downstream READMEs** — no new migration; existing projects' READMEs reshape only when `pm-architect` next authors them. The existing README front-gate migration (capability-list → pointer) is the one README migration and is unchanged.
- **A "зачем/why" capability or value section in the README** — explicitly rejected (it would re-introduce the second-capability-statement drift the front-gate removed). The "зачем" beat is the `docs/product.md` pointer, owned there, referenced not restated.
- **The protocol's own `README.md`** — already on this shape (readme-rewrite v2.24.1); not touched here.
- **A blanket mandatory `pm-auditor` canonical-shape check** — at most a light structure-only note, and only if the arch note recommends it; the default is no new check (the template + authoring rule are the mechanism; a shape-check risks prose-policing legitimately-varied READMEs).
- **English/Russian prose policy** — unchanged: template headers stay English-canonical; downstream prose follows the PM's language per the existing doc-language rule.
