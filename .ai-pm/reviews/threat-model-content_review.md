## Code review: approve

Reviewer: independent context (claude-sonnet-4-6). Branch: `feature/threat-model-content`. All tests run fresh.

---

### 1. Content quality + brevity

**Reviewer fragment** (`modules/threat-model/reviewer.md`, 17 lines total):

- Lines 3–8: tight intro — names the module, states the deepening (enumeration), cites the cite-or-it-didn't-happen rule, labels `[persona]`. No padding.
- Lines 10–17: 8 surface bullets, each phrased as a verification question ("is each validated…?"). Each is actionable: a reviewer can read it and immediately know what to look for in the diff.
- The 5 `[light]` items cover the failure modes that kill real systems (input validation, secrets, boundary crossing, injection, fail-open). The 3 `[rich]` items add the lower-frequency-but-high-impact surfaces (privacy, authz, supply chain). The split is defensible: not arbitrary, not security-listicle padding.
- "blocks" at line 7 is used in the verdict/editorial sense ("a finding blocks the ship"), consistent with the floor bullet in `agents/reviewer.md:13`. No mechanical over-claim.

**Builder fragment** (`modules/threat-model/builder.md`, 17 lines total):

- Lines 3–8: parallel structure to the reviewer fragment. Adds "Silence on a surface means 'considered, not exposed' — not skipped" — this is the right pedagogical addition for a plan-time pass (a builder might skip surfaces; this closes that gap). Tight, no filler.
- Lines 10–17: 8 surface bullets, phrased as planning instructions ("validate each where untrusted data first enters"). Parallel to but not identical to the reviewer variant — the builder text is imperative (what to DO), the reviewer text is interrogative (what to VERIFY). That distinction is correct and useful.
- No vacuous items. "Supply chain — name and justify any new dependency; confirm its source is trusted before adding it" is concrete enough to act on.

**Content quality verdict:** tight and useful. Not generic listicle filler.

---

### 2. `depth` mechanism

**`applyDepth`** (`adapter/modules.mjs:125–136`):

- `[rich]` lines are stripped at `depth === "light"` (`modules.mjs:131`). Confirmed by test: `lightBody.length < richBody.length` (`install-modules.test.mjs:104`) and `light: rich-only item STRIPPED` (`install-modules.test.mjs:102`).
- Authoring tags are stripped from kept lines: `kept.push(\`${m[1]}${m[3]}\`)` (`modules.mjs:132`). No tag leaks in deployed files confirmed by grep (empty result).
- Banner injected: `> Depth: **rich** — the full enumeration.` or `> Depth: **light** — the core subset.` (`modules.mjs:134`). Confirmed in `.claude/agents/pm-reviewer.md:43` and `.opencode/agents/pm-reviewer.md:50`.
- Fail-safe: `const light = depth === "light"` (`modules.mjs:126`) — anything other than the literal string `"light"` resolves to rich. Tests confirm for `"garbage"`, `"LIGHT"`, `""`, `42`, `null` all give rich (`install-modules.test.mjs:113–116`).

**Single-tagged-fragment vs two variant files:** the single-file + tag-strip approach is the right call. Two variant files would share intro prose (duplication), would have no mechanical guarantee they stay in sync, and would be harder to reason about. The tags are an authoring signal stripped at compose time — correct and proven by the no-tag-leak test.

---

### 3. Single-home / no overlap

**Floor duty** lives only at `agents/reviewer.md:13` (one bullet: "a security-relevant change names its threats…"). The 8-surface enumeration lives only in `modules/threat-model/reviewer.md` and `modules/threat-model/builder.md`. Grep across `agents/`, `PROTOCOL.md`, `architecture.md`, `templates/` found zero enumeration items outside the module fragments. No duplication.

The floor bullet (`agents/reviewer.md:13`) correctly points to the module: "(The threat-model module deepens this into a per-surface enumeration when on.)" — it points, does not restate.

**Builder floor** (`agents/builder.md:12`): "Security surface — any auth, secrets, untrusted input, or network boundary touched? Name the threat and the mitigation." Untouched by this slice, consistent with the module deepening it.

---

### 4. Honesty

`[persona]` label present in both fragments (`reviewer.md:8`, `builder.md:8`): "this sharpens judgement, denies nothing" / "this sharpens the plan, denies nothing." No over-claim of mechanical enforcement. "blocks" in the reviewer fragment (`reviewer.md:7`) is editorial (same sense as "blocks" in `agents/reviewer.md:13`), not a claim about deny rules.

---

### 5. Floor tightening

`agents/reviewer.md:13` — old: "secrets read from a committed template, never a live secret file; the secret file git-ignored; no new untrusted-input path left open." New: "a security-relevant change names its threats and handles its exposures; an unhandled exposure or a security over-claim blocks. (The threat-model module deepens this into a per-surface enumeration when on.)"

The generalization is correct: the old text was repo-specific (committed-template pattern) and missed the broader class. The new text is general and accurate. The parenthetical "deepens … when on" is honest — the module is not always on, the floor is always on. One tight bullet, not two.

---

### 6. Deploy fresh

All four deployed agents regenerated with the rich enumeration, tags stripped, `Depth: **rich**` banner, floor bullet intact:

- `.claude/agents/pm-reviewer.md:25–44` — `## Threat model` section with all 8 items + banner at line 43.
- `.claude/agents/pm-builder.md:22–40` — `## Threat model` section with all 8 items + banner at line 40.
- `.opencode/agents/pm-reviewer.md:32–51` — identical content, offset by longer frontmatter.
- `.opencode/agents/pm-builder.md:23–50` — identical content, offset by longer frontmatter.

No `<!-- ai-pm:modules -->` marker in any deployed file. No `[light]`/`[rich]` tag in any deployed file (grep returned empty).

This repo uses `kind: software`, which defaults to `depth: rich` (`modules.json:17`). The assembled agents correctly reflect the full enumeration.

---

### 7. Tests

`adapter/install-modules.test.mjs` — section 3b added at lines 89–116, covering:

- Rich keeps both light-core and rich-only items (lines 95–97).
- No authoring tag leaks (line 98).
- Light strips rich-only, keeps light-core, is genuinely shorter (lines 100–104).
- Per-kind default drives depth (lines 106–110).
- Fail-safe: 5 malformed depth values all resolve to rich (lines 112–116).

FRAGMENT_MARK and REVIEWER_FLOOR constants updated (lines 32–35) to match the Slice 2 content — this is correct (the Slice 1 skeleton markers are gone; these now match the real content).

Test counts confirmed by fresh run:
- `install-modules.test.mjs`: **51 passed, 0 failed**
- `parity.test.mjs`: **55 passed, 0 failed**
- `install-model.test.mjs`: **11 passed, 0 failed**
- `install-commands.test.mjs`: **10 passed, 0 failed**
- `install-plugin.test.mjs`: **6 passed, 0 failed**
- `opencode-inject.test.mjs`: **10 passed, 0 failed**
- `rigor-profile.test.mjs`: **24 passed, 0 failed**
- `neutral-prose.test.mjs`: **PASS** (fragments scanned, platform-neutral)

No existing test edited to pass. Test count is higher (51 vs the prior state's fewer) — tests were added, not weakened.

---

### No findings

All checklist items satisfied with concrete `file:line` citations. No blockers.
