# BMAD Method — what to adopt

**Question.** The Operator used BMAD Method's creative team on another project and
found two things genuinely effective: dialog-driven idea extraction (it pulled the
idea out through changing angles, including the user's) and a UX/UI design reviewer
driving the live surface through Playwright. What does BMAD actually do there, and
what belongs in this protocol?

**Answer.** BMAD (Breakthrough Method for Agile AI-Driven Development, v6) is an
agent-roster framework: Analyst → brief → PM → PRD → UX spec → Architect →
story files → Dev → QA, with modules (Creative Intelligence Suite, Test Architect).
The three mechanics behind the Operator's experience:

1. **Advanced elicitation** — a catalog of ~79 reasoning techniques (Six Thinking
   Hats, pre-mortem, inversion, role-play, red-vs-blue…). Mechanically: after a
   draft section, the agent offers ~5 contextually fitting techniques as a menu;
   the user picks one; it is applied to the draft; repeat or accept.
2. **Party mode** — multiple personas discussing in one session, user moderates.
3. **Browser-driven UX review** — the reviewer walks a live URL: screenshots,
   accessibility tree, console errors, happy-path click-through, friction score,
   heuristic pass, annotated report.

**Decision (Operator, 2026-06-12).** Adopt all three, our shape, in one feature
(shipped as 5.6.0):

- **`elicitation` capability module** — a compact ~12-technique catalog
  (`src/modules/elicitation/catalog.md`, one home; the persona panel is a catalog
  row, not a separate mechanic) + a Builder plan-beat fragment; the interactive
  offer is `src/agents/procedures/elicitation.md`. Hard rules from the Operator:
  depth choice at entry (light default / deeper / skip), one technique per round,
  never drag the brief out, fires for features and idea capture — not only new
  products. This closes the "capture-time elicitation" backlog item.
- **Browser walkthrough** — a `[rich]` item in the ui-ux reviewer fragment, re-anchored in 5.11.4 as the graphical deepening of the *offered* real-layer exercise (`docs/decisions/verification-floor.md`): when the Operator confirms the exercise AND a UI driver is available, the Reviewer drives the graphical surface — screenshot + a11y snapshot + console + primary-path click-through; honest residual where it cannot.
- **Not adopted:** the 12-agent roster (our three-role split with folds is the
  deliberate opposite), story-file pipelines (our plan file covers it), the
  79-technique catalog size (a menu nobody reads is ceremony — we start at a
  compact ~dozen and delete rows that go unpicked).

**Evidence.** [BMAD-METHOD repo](https://github.com/bmad-code-org/BMAD-METHOD) ·
[Advanced elicitation docs](https://docs.bmad-method.org/explanation/advanced-elicitation/) ·
[Playwright-driven UX review workflow](https://medium.com/@yaron.been/3-mcp-server-workflows-that-actually-stuck-playwright-for-ux-bright-data-for-fact-checking-codex-71ecfed2a72c) —
fetched 2026-06-12; the elicitation mechanics (menu-of-5, pick-apply-repeat) are
from the official docs, the UX-review phase structure from a practitioner write-up
(secondary source, marked as such).
