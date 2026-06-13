# Universal verification floor — exercise through the primary integration layer

**Decision (2026-06-13, 5.11.4):** the expectation "exercise one real path through the artifact's *primary integration layer*" is a **universal floor**, not a web-only or GUI-only module row.

## The deficit

Three `[rich]` capability-module rows (test-methodology builder "UI exercised" + reviewer "UI claim backed", ui-ux reviewer "Browser walkthrough") each named the runtime-exercise expectation as **web/Playwright-only** and **depth-gated**. Two failures followed:

1. **Web-only wording** is unsatisfiable off the web — Playwright cannot reach a Tauri IPC layer — and implies nothing else counts. The downstream that surfaced this (ad-md-editor, Tauri) had a UI the protocol could not tell it to exercise.
2. **Depth/kind gating** put the organ off by default where it was needed: ui-ux defaults to `light` on `kind: code`, the typical desktop-app kind.

## Why universal, why the floor

Every consumer-facing artifact has a primary interface — a CLI has flags→stdout→exit code, a library has its public API, a service its socket, a web app a browser, a desktop app its IPC. "Exercise through the real surface" is therefore **kind-agnostic**, and a kind-agnostic expectation cannot live in a per-`kind`-defaulted toggle module without being silently off somewhere. It belongs in the floor, beside the verification ladder and the Builder's Verification-scenario item — both already universal.

This also merges two siblings left open in `ratchet-and-verification.md`: the "minimum-rung expectation" (the ladder accepted `NOT RUN` unconditionally) and the "desktop/native smoke gap" were one deficit seen from two angles.

## The shape — write always, run on offer + confirm

The split that keeps the floor honest without forcing expensive e2e on every change: **naming** the scenario is always-on and free; **running** it through the real layer is offered and Operator-confirmed, never automatic.

- **Floor (`builder.md ## Plan`)** — the Verification-scenario item always names the path AND its primary integration layer, so the scenario is *walkable* on the real stack, not just narrated. This is writing, not running — it costs nothing and stays floor.
- **Floor (`reviewer.md ## Verdict`, ladder paragraph)** — the reviewer claims the rung it actually reached (by default `static`/`suite`) and says plainly when the real-layer run was not performed; never implies it was. Running the real layer is explicitly *not* a per-review duty.
- **Offer (`orchestrator.md`)** — the real-layer exercise (`exercised`/`target` rungs) is *expensive* (wall-time, boots the artifact), so it is offered on a user-facing change — declinable, one-line cost note, run only on the Operator's confirm — and again as an audit dimension (one run covers the batch). Default: not run; a declined offer is noted in the ship relay (honesty, not a block).
- **Modules (supersede, invariant 6)** — the two web-only test-methodology rows are deleted; ui-ux's browser-walkthrough is re-anchored as the **graphical deepening** of the offered exercise (drive the browser/UI driver, capture screenshot + a11y snapshot + console) — the visual/a11y capture on top of the universal walk, not a parallel requirement.

## Why offered, not a per-change floor

E2e through the real surface costs real time and boots the artifact; making it a per-change expectation would tax every change and pressure the agent toward a run nobody asked for. The honest, cheap floor is *naming* the scenario+layer (so it is concrete and runnable) plus *truthful rung reporting* (no overclaim). The expensive run is opt-in: offered on a user-facing change (with a cost note + confirm) and batched at the audit cadence, where one run amortises across the shipped set. Default off — the audit cadence is the periodic catch.

## Out of scope

Choosing a concrete UI driver for any stack is the downstream project's quality-toolkit decision at setup, not a protocol floor edit. The floor names *that* the real layer is exercised; the stack names *how*.
