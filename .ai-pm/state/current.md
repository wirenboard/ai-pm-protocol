# Execution State

> Resume pointer — READ FIRST, by this exact path. Deferred detail: `.ai-pm/backlog.md`. History: commits + CHANGELOG.

**Status (2026-06-11).** `main` = `uni/main` = `3e08abe` (**4.0.4**). Queue #1 + #2 SHIPPED AND MERGED. Now starting **#3**.
- #1 — 4.0.3 — `PROTOCOL.md` instructions-only (PR #15, merged).
- #2 — 4.0.4 — readability sweep across agent + adapter docs (PR #16, merged).

## ⚠️ FIRST on resume
- `main` is clean and synced to `uni/main`. Work on #3 happens on a fresh `feature/<topic>` branch off `main`.
- Git note: local state-commits to `main` diverge from `uni/main` after each squash-merge → the standard fix is `git fetch uni && git reset --hard uni/main`, then rewrite this pointer fresh (disjoint files, no real conflict).

## The principle the Operator hammered (the lens for the whole queue)
**Every doc is INSTRUCTIONS, human-readable — NOT prose.** AND: **every failure the Operator catches by hand must become a protocol mechanism that catches it** — acceptance test: *it fires WITHOUT the Operator's vigilance.* The queue exists to end the Operator being the workhorse.

## ⚠️⚠️ ARCHITECTURAL CONSTRAINT on #3 (Operator hammered — do NOT regress)
**Checks must be PROJECT-AGNOSTIC. The protocol/core/template carries only the MECHANISM + LOGIC of checking + development, NEVER specific tools.** A downstream project may have NO `tools.json` like ours, a totally different stack (Python/Go/…), or different code. So:
- **Core/template gets LOGIC, project-agnostic:** (a) build-beat runs the WHOLE `src/quality/tools.json` registry set (whatever it contains), not a subset; (b) a **contracts-regression** item in the Reviewer checklist (a change touching a behavioural guarantee re-checks the project's `contracts/`, if any) — persona logic; (c) a **doc-quality dimension** in the Reviewer (brevity · structure · human-readability · format tidiness) — persona *reasoning about prose*, NOT a linter, works where no markdownlint exists; (d) **comment-discipline** (invariant 6 on code) — persona.
- **The template ships only the SHAPE** (registry format + this logic) — NEVER eslint/markdownlint as baked defaults.

## ⚠️⚠️ THIS REPO IS DOWNSTREAM PROJECT #1 (Operator: "разработка протокола — тоже даунстрим проект, как и сотни других")
Developing the protocol IS a downstream project running on the protocol — not special. Consequences for #3:
- The eslint + markdownlint setup here is **mandatory, not deferrable** — it is THIS repo (Node + markdown-prose) acting as the FIRST downstream consumer, wiring its own linters **through** the new mechanism. That wiring is the **proof the mechanism actually works** for a real downstream.
- **Sequence (firm):** (1) build the project-agnostic MECHANISM + rules INSIDE the protocol first; (2) THEN this repo consumes it — register eslint + markdownlint as `src/quality/` rows + configs, exactly the way a downstream Python project would register `ruff`/`mypy`. Same logic, different rows.
- Do it the dogfood way: no privileged shortcut — the linter rows go through the same loop and the same mechanism a downstream uses.

## The GAP that seeded #3 (Operator caught by hand)
During the #2 sweep the Builders ran only `parity` + `neutral-prose`, NOT the full build-beat suite; and there is **no contracts-regression step**. Operator asked "а contracts прогоняли?". Ran the full suite manually then — all green. `docs/contracts/` = the 10-file product-contract regression floor (persona, no autotest). #3 mechanizes both so neither depends on Operator vigilance.

## Queue, IN ORDER (detail in `.ai-pm/backlog.md`)
1. ~~`PROTOCOL.md` rewrite~~ — **DONE (#15, 4.0.3).**
2. ~~Systemic readability sweep~~ — **DONE (#16, 4.0.4).**
3. **← ACTIVE — Doc + code-quality MECHANISMS.** Sub-sequence: **3a (mechanism, agnostic, FIRST):** full-suite build-beat + contracts-regression + doc-quality Reviewer dimension + comment-discipline + sharpen the Reviewer's code dimension — all logic/persona in core+template. **3b (dogfood, this repo, AFTER 3a):** register eslint + markdownlint in `src/quality/` (rows + configs + init), as downstream-#1 consuming 3a; de-bloat over-commented adapters. *Proportionate — catch real cruft, don't strangle with style.*
4. **`audit` realized** — a proactive health-check the protocol runs itself.
5. **`research`** — a doing side-tool (not a module).
6. **Resume product-advocate** (`.ai-pm/plans/product-advocate.md`).
7. **`install.mjs`** (unified installer) — real-downstream rollout into `/home/adegtyarev/Develop/Hobby/ad-md-editor/` (out-of-root deny blocks a cross-repo install from here; needs the installer or a session rooted there).

## Direction (compass: `docs/decisions/direction.md`)
The protocol as a product-creation engine; four pillars, all as side-tools/config/modules, never core bloat. Shipped: **3.0.0 → 4.0.4** (minimal core · setup live on opencode · configurable rigor · module constructor + threat-model · docs/+src/ restructure + retention · `/pm-setup` · constitution de-watered · agent+adapter docs readable).

**Conventions:** Russian chat; English artifacts; the human is the **Operator**; `interactive` mode (merge/ship manual — Operator merges, never the orchestrator, even on autopilot). THIS repo: `kind: software`, `profile: full`, `threat-model: rich` — AND it is downstream-project-#1 of the protocol. Gates: `src/quality/tools.json` (run the WHOLE set on build). **Remotes:** `uni` (`aadegtyarev/ai-pm-protocol-uni`) is the live fork — local `main` tracks it; public `origin` is OLD. **Branches pending cleanup:** `backup-2026-06-10`, stale `feature/opencode-harness-support--*`.
