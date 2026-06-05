> **Topic file of the orchestration spec** — read on demand from `WORKFLOW.md`'s navigation map. Read it before any "doesn't work in production" diagnose flow, and before any on-hardware / live-system action (the Blast-radius preflight lives here).

## When you say it doesn't work in production

When you tell me "X doesn't work on the controller / on production / in the deployed environment", I follow a strict diagnose-then-plan flow. I never edit, restart, or re-deploy on the live system in the moment.

**Blast-radius preflight.** Before any on-hardware or live-system action — exercising a feature on real hardware (Step 5.5), or a diagnostic probe that restarts or structurally mutates a live target (Step A.5) — I stop and ask one question: *does the effect reach an external stateful peer whose state a local revert will not undo?* If the live target is coupled to such a peer, I **stop and surface the blast radius to you before acting**. The trap this guards against: *reversible locally ≠ reversible for a coupled external peer.* A probe's "throwaway / I revert it afterwards" framing assumes a local revert undoes the effect — true for a setting I flip back, false when the side effect lives **outside**, in a paired external system's own record of my target. Reverting my local change or restarting my service does not reach into the peer and undo it.

The worked example is a Wiren Board Matter bridge paired with a live smart-home ecosystem. Exercising a new device type on the bridge while the pairing was active changed the bridge's externally-visible composition; the ecosystem's own device record broke (the lamp vanished from the app) even though the bridge stayed internally correct, and reverting the bridge did not heal the ecosystem record. The principle is domain-agnostic — any live target coupled to an external stateful peer (a paired hub, a registered downstream, a session a remote party holds) carries the same blast radius; the Matter case is only the illustration.

When the preflight finds the target **is** coupled to a live external peer:

- I offer the safe alternatives first — run on a **separate / throwaway target**, or under a **separate identity** — so the user's live target is never the test subject by default.
- **Structural mutations** — anything that changes the live target's externally-visible composition — never run on the user's live coupled target by default. They go to a separate / throwaway instance.
- I proceed against the user's live coupled target, or down any recovery path (re-commission / re-pair the external peer), **only on your explicit consent**, and only with that recovery planned as a **mandatory step**, not an afterthought.
- I minimize repeated restarts of a coupled live target; if a structural change on it is genuinely unavoidable, the recovery step is part of the plan from the start.

This preflight is purely additive: it adds a precondition before acting and relaxes none of the Step A read-only default or the Step A.5 probe rules below.

**Step A — Read-only diagnostics (default).** I ssh in to read logs (`journalctl`, `docker logs`), statuses (`systemctl status`, audit / health endpoints), config files, deployed artifacts. **Passive observation of a live signal counts here too** — sniffing or capturing what is already on the wire or in the air (`tcpdump`, a BLE / mDNS scan, a bus capture, reading advertisements) is read-only-grade, the same class as reading a log: it changes nothing and reaches no external peer, so it is **not** a probe — no Step A.5 authorization, no Blast-radius preflight. I reach for it early. The boundary is observe vs emit: this carve-out is for *listening* to what is already present. Anything that **transmits** toward a coupled external stateful peer — injecting traffic, an active scan that solicits scan-responses from a paired peer, pairing / commissioning, writing to a bus — is judged on whether it reaches or mutates that peer and stays under Step A.5 + the Blast-radius preflight. By default I change nothing on the system — no `sed`/`vi` on a repo-owned file, no `systemctl restart`, no `apt install` on my own initiative. The boundary against *silent* changes is hard. The one sanctioned exception is a probe you explicitly authorize — Step A.5.

**Bisect before you hypothesize.** When a multi-stage path fails (hardware → driver → transport → protocol → app logic) and the symptom is silent or ambiguous, my first move is the cheapest observation that splits the path in half — "does the signal physically reach us at all?" — before I reason top-down from the most likely software cause. I establish ground truth at the lowest cheaply-observable layer first. Passive observation (above) is usually that cheapest split, which is why I reach for it early.

**Step A.5 — Probe to confirm a hypothesis (only if you authorize it).** Read-only diagnostics usually point to a hypothesis. To confirm it before planning a fix, you can authorize a **diagnostic probe** — a throwaway spike, not the fix. Before a probe that restarts or structurally mutates a live target I run the **Blast-radius preflight** (above): the "throwaway / I revert it afterwards" framing holds only when a local revert undoes the effect — *reversible locally ≠ reversible for a coupled external peer*. If the target is coupled to a live external system, I stop and surface the blast radius to you first.

Before I touch anything I show you a **probe proposal** in plain language and wait for your yes:

> **Problem:** <what's broken, from the user's side>.
> **My hypothesis:** <the likely cause, plain>.
> **Probe:** I'll set `<setting>` in `<where>` from `<current value>` to `<new value>` — this controls <plain-language explanation of what that setting does>.
> **What we'll watch:** <the observable that confirms or refutes the hypothesis>.
> **After:** I revert it; if it confirms the cause, the real fix goes through the normal pipeline (`/pm-plan` → coder → review → PR → deploy).
> Authorize this probe?

This is the one place I show you the concrete before→after — you're authorizing a touch on a live system, so you need the specifics — but every technical item gets a plain-language gloss, never a raw dump. Rules of the probe:

- I act only on your explicit yes, and I name it a probe, not the fix.
- If the probe restarts or structurally mutates a live target, the **Blast-radius preflight** runs first — a coupled external peer is a stop-and-surface, not a "throwaway" I can quietly revert.
- It touches **runtime / local state only** — a runtime setting, a service restart, a value in a live config a redeploy resets, a local dev file. It **never** edits in place a file the repo owns in git (schema, config template, code, unit file); that stays the forbidden silent-fix path even for a probe. The real fix to a repo-owned file always goes through the pipeline.
- Afterwards I revert it, or — if confirmed — carry the real fix through the pipeline. No silent permanent trace remains.
- I record what I changed and what I observed; it becomes the plan's **Incident facts**.

**Stop-and-research tripwire (anti-thrash).** If a fix attempt does *not* clear the "doesn't work" symptom and the observed behavior still contradicts my model of how the component works, my next move is **not another patch**. I stop and consult the canonical source — the library's reference implementation, an official example, the spec — before the next code change. **Two failed fixes in a row on the same symptom** is a hard signal that the model is wrong, not the line; reactive patching past that point burns live-system iterations and converges slowly. This adds a brake only: it relaxes nothing in the Step A read-only default or the Step A.5 probe rules — authorization for the next touch is still required exactly as before.

**Stack-research is a mid-diagnosis escalation, not only an up-front step.** I spawn `pm-stack-researcher` *whenever reality contradicts an already-cited stack rule* — hardware behaves unlike the documented idiom, or the high-level API does not do what `docs/stack-notes.md` says — not only from `/pm-plan` when a component is undocumented. Re-researching the canonical flow mid-debug, and correcting the stale cited rule, is a first-class move, not an admission of failure: I prefer "find how the library's own example does it" over "iterate a guess." This pairs with the tripwire above — when a fix fails against my model, the canonical source I consult is often the corrected stack rule the researcher brings back.

**Step B — Formulate findings in product language.** I summarise to you what's broken from the user's perspective. Plain language: "users can open the cart but checkout never confirms the order" — not "POST /checkout returns 502 because the upstream pricing service times out after 30s due to a config drift on the cache layer". The technical detail goes into the fix plan, not into the PM update.

**Step C — Hotfix planning.** I run `/pm-plan` with the topic marked as hotfix (`hotfix-<area>`). The plan gets an extra **Incident facts** section: what is broken on production, with evidence (log excerpts, file diffs, behavior observations). The rest of the plan is the same shape as a normal feature plan — scenarios, contracts, stack expectations touched, test plan.

**Step D — Standard pipeline.** Coder → reviewer → pr-prep → PR. You merge when reviewer approves. Deployment goes through whatever the project's deployment script in the repo says — never by ssh into the prod box.

**Why this matters.** Editing on a production system in the moment breaks four guarantees at once: the change has no plan, no test, no review, and no record in git — so the next time the system rebuilds (firmware update, container redeploy, configuration drift sweep), the fix vanishes. Worse: the next feature on the project will be planned against the in-repo state, which silently disagrees with what's actually running.

If something is so urgent that this loop feels too slow — that is a product decision, not a technical one. Tell me. We can shorten review or batch the change, but the artifacts still go through git.

I involve you when:
- Architectural fork (new technology, breaks a constraint, changes public API)
- Reviewer finds a blocking issue that requires a product decision (e.g., descope a scenario, accept a known limitation)
- Planning has a high-stakes ambiguity you need to resolve

**Every question to you must use the AskUserQuestion tool** — never ask as plain text. This keeps decisions explicit and traceable.

Everything else flows automatically.
