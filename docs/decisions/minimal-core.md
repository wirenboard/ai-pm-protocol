# Decision — why the core is minimal

Why this protocol is ~one constitution + 3 roles, not the ~2,200-line, 8-persona, 17-file machine it replaced.

## The one test

A tech-PM reads the whole protocol in one sitting and holds its shape. `PROTOCOL.md` states this as a hard design constraint, not a wish: if the core ever grows past what a person holds in their head, the protocol has failed and is cut back.

## The rule of the cut (non-negotiable)

The complexity that was removed was **not noise** — most of it prevented a real failure (corner-cutting, boundary breach, slop, lost context). So we do not "delete to shrink." Every cut either:

- (a) keeps the failure out by a **cheaper mechanism** — a mechanical deny instead of a paragraph, one sharp invariant instead of five overlapping ones, killing a duplicate; or
- (b) **consciously accepts the risk**, written down.

A cut that silently re-opens a failure is forbidden. (Example accepted risk: a generalist Reviewer may miss what a dedicated advocate once caught — mitigated by a sharp checklist, not by more roles.)

## The design principles the shape comes from

1. **Human-holds-it** — small enough to read whole. The master constraint; it kills most machinery by itself (when the whole thing loads every turn, the progressive-disclosure / on-demand-topic machinery that existed *because* the total was huge dies with it).
2. **One home per fact** — zero duplication; the drift between two copies is the disease.
3. **Mechanical floor over prose** — a rule worth enforcing becomes a deny; prose-only rules are admitted as `[persona]`, never dressed as mechanical.
4. **Reader-goal-first docs** — every doc leads with what its reader came to do.
5. **Fewer, sharper** — collapse N overlapping rules/roles/checks into one.
6. **Neutral core, thin adapter** — the loop, roles, invariants, and deny-rules are platform-neutral; each platform is a thin adapter. (See `dual-harness-from-one-source`; the architecture is in `docs/architecture.md`.)

## What survives every cut

Independent review by a separate context (builder ≠ reviewer), the honesty gates, the deny-list, git-flow, and plain-language PM comms. These are load-bearing and already short — they are the floor a `lite`/`solo` profile trims ceremony around but never cuts (see `docs/decisions/direction.md`).
