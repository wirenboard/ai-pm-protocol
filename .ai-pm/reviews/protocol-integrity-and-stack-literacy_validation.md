# Validation: simulating the updated /audit on wb-mqtt-matter

This is a paper-trace validation of the plan in
`protocol-integrity-and-stack-literacy_plan.md`. It applies the **updated** 10-dimension `/audit` (after this PR) to the real state of `wb-mqtt-matter` as observed on 2026-05-30 and lists the findings that the new audit would produce.

The point of this artifact: for each known protocol failure on wb-mqtt-matter, we check whether the **new** audit dimensions would catch it as `blocking` or `note` — without the orchestrator going around the protocol. If every known failure surfaces as a finding, the audit side of the new template works on this real case.

Source artifacts (all pulled read-only):
- `docs/architecture.md`, `docs/features/matter-bridge-mvp_plan.md`, `docs/features/matter-bridge-mvp_arch.md`, `docs/features/matter-bridge-mvp_review.md`
- `src/value-mapping.ts`, `src/handlers/dimmable-light-handler.ts`, `src/__tests__/value-mapping.test.ts`
- `Dockerfile`, `docker-compose.yml`, `CLAUDE.md`
- `schemas/wb-mqtt-matter.schema.json`, `wb-mqtt-matter.conf.example`
- Active config and `journalctl -u wb-mqtt-confed` from controller `A25NDEMJ`

---

## Simulated audit report

### Summary

The project has shipped a Matter bridge that builds, passes its self-consistent tests, and deploys via Docker — but it violates the Matter spec at the wire, ships a JSON schema that wb-mqtt-confed cannot accept, and has no canonical delivery path for that schema to its consumer. The bridge runs on the controller, the Apple Home tile is present, but the underlying contracts are broken in several places.

Stack literacy gap: `docs/stack-notes.md` does not exist. The project has been planning, coding and reviewing against `docs/architecture.md` alone, with no canonical reference for Matter spec, wb-mqtt-confed schema convention, or WB MQTT topic convention. Every known failure below traces back to this single missing file.

### Blocking

**1. `docs/stack-notes.md` missing entirely — dim 10**
Components used in code with no stack-notes entry: `matter.js`, `Matter protocol`, `wb-mqtt-confed`, `mqtt.js`, `WB MQTT topic convention`, `Docker host networking on WB`. Without stack-notes the rest of the audit cannot evaluate spec compliance.
**Fix:** orchestrator spawns `stack-researcher` against the stack listed in `docs/architecture.md`, populates `docs/stack-notes.md` for at least the six components above. Re-audit after.

**2. `src/handlers/dimmable-light-handler.ts` — `currentLevel: 0` violates Matter spec — dim 9**
Initial state passes `currentLevel: 0, minLevel: 0` into the matter.js Endpoint. Matter spec § 1.6.6 LevelControl: `currentLevel` MUST NOT be 0; off-state lives in OnOff cluster, not in `currentLevel`. matter.js logs this at startup:
```
WARN  LevelControlServer  The currentLevel value of 0 is invalid according to Matter specification.
WARN  LevelControlServer  The minLevel value of 0 is invalid according to Matter specification.
```
**Fix:** new plan, `audit-fixup-levelcontrol-spec`. Stack expectations section cites the Matter spec range. Coder changes init to `currentLevel: 1, minLevel: 1`. Off-state set via `onOff.onOff = false`, `currentLevel` retains last non-zero value when off.

**3. `src/__tests__/value-mapping.test.ts` codifies the spec violation — dim 9**
Tests freeze `0` as a valid Matter brightness level:
```ts
it("maps 0 to 0 with default range", () => {
    expect(wbBrightnessToMatter("0")).toBe(0);
});
it("property: round-trip is within 1 unit", () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 100 }), …));  // domain starts at 0
});
```
These are dim 9 blockers: tests that codify a spec-forbidden value freeze the wrong contract. Property-based test is especially harmful — it formally asserts that 0 must round-trip, preventing any future fix.
**Fix:** part of the same audit-fixup plan. Domain of property test becomes `fc.integer({ min: 1, max: 100 })`. `maps 0 to 0` test replaced with `maps WB-off to Matter onOff=false, currentLevel preserves` once the architecture matches spec.

**4. `value-mapping.ts` and `architecture.md` both freeze `[0..254]` — dim 8 (docs drift) + dim 9**
`docs/architecture.md` § "Control value mapping" table records the conversion as `round(wbValue / wbMax * 254)`, range `0–254`. This is not the coder going off-script — the architecture document itself encodes the spec violation. Even if a future plan asks for compliance, architecture.md will look like the source of truth and contradict the fix.
**Fix:** same plan updates `docs/architecture.md` table to `1–254` with a citation to the Matter spec. Stack-notes entry for `matter.js` is the canonical source going forward; architecture.md just references it.

**5. `schemas/wb-mqtt-matter.schema.json` does not describe `mqtt`, `bridge`, `commissioning` — dim 10 (integration contract)**
The active config `/mnt/data/etc/wb-mqtt-matter.conf` contains three root keys (`mqtt`, `bridge`, `commissioning`) that the schema does not enumerate. `"strictProps": false` was added to the schema but wb-mqtt-confed ignores it for top-level extra properties. Confed log over five attempts on 2026-05-28/29:
```
ERROR: Invalid config file /etc/wb-mqtt-matter.conf
  - (root): Additional property commissioningWindowMinutes is not allowed
  - (root): Additional property storagePath is not allowed
```
**Fix:** plan to extend the schema to fully describe all top-level keys actually used in the config. Stack-notes entry for `wb-mqtt-confed` cites the schema convention. Reviewer dim 10 will block any future PR that adds an unschemaed key.

**6. `schemas/wb-mqtt-matter.schema.json` declares `"service": "wb-mqtt-matter"` for a Docker deploy — dim 9 (stack idiom)**
The schema's `configFile.service` field tells wb-mqtt-confed to restart the service via systemd after edits:
```
ERROR: Error restarting wb-mqtt-matter: Unit wb-mqtt-matter.service not found.
```
This service does not exist — the bridge runs in Docker (architecture.md "Deploy | Docker --network host"). The `"service":` field was copied from a systemd-targeting schema template.
**Fix:** plan to either remove the `"service":` field (accept config edits without auto-restart) or supply a Docker-aware restart hook. Stack-notes entry for `wb-mqtt-confed` documents that `"service":` targets systemd only.

**7. Handler vs schema vs example mismatch on topic format — dim 1 (plan completeness) + dim 9 (stack idiom)**
Three sources disagree:
- Schema `pattern` requires `device/control` short form: `^[^/\+#]+/[^/\+#]+$`
- `wb-mqtt-matter.conf.example` uses short form: `"wb-mr6c_2/K1"`
- Handler publishes literal topic + `/on`: `mqttClient.publish(\`${topic}/on\`, …)` — that produces `wb-mr6c_2/K1/on`, which has no subscriber. The wb-mqtt-serial subscriber expects `/devices/wb-mr6c_2/controls/K1/on`. WB MQTT topic convention: command topic is the long form.

To make the bridge actually drive a relay, someone changed the active config to the long form `/devices/wb-mr6c_2/controls/K1` — schema rejects it, confed logs:
```
ERROR: devices.0.controls.onOff.0: Does not match pattern '^[^/\+#]+/[^/\+#]+$'
```
The original plan `matter-bridge-mvp_plan.md` § Contracts says `controls.onOff: ["/devices/<id>/controls/<ctrl>"]` (long form) — i.e. **plan and schema disagree from day one**. This is dim 1: plan touches a stack convention (`WB MQTT topic`), has no `Stack expectations touched` section, no schema/handler/plan consistency check.
**Fix:** plan to define the topic convention in stack-notes, choose one canonical form (short in config — handler builds full path), bring schema pattern, example, plan section and handler in sync.

**8. `schemas/wb-mqtt-matter.schema.json` does not reach wb-mqtt-confed via repo's delivery mechanism — dim 8 (delivery)**
`docs/architecture.md` declares: "`/usr/share/wb-mqtt-confed/schemas/wb-mqtt-matter.schema.json` — confed UI schema — reinstalled by package". But the repo has no Debian package — only `Dockerfile` and `docker-compose.yml`. The Dockerfile does not `COPY` schema anywhere outside the Node app stage. The compose file does not mount the schema into `/usr/share/wb-mqtt-confed/schemas/`. On the controller the file is present (`/usr/share/wb-mqtt-confed/schemas/wb-mqtt-matter.schema.json` plus a `.bak`) but it was put there by hand — a fresh deploy on a new controller would not have it.
**Fix:** plan to add either a Debian packaging path (build `.deb` with `postinst` placing the schema) or a `docker-compose.override.yml` for WB that mounts the schema. Add `wb-mqtt-confed-validate schemas/*.schema.json wb-mqtt-matter.conf.example` to `CLAUDE.md` Pipeline so future schema changes are gated.

**9. `CLAUDE.md` Pipeline block lacks native validators — dim 10 (stack-notes integrity)**
Current Pipeline: `npm test` + `npm run lint`. Neither runs `wb-mqtt-confed-validate` (would catch findings 5, 6, 7 on every commit). Neither runs a matter.js init-only start that surfaces WARN as exit-1 (would catch finding 2 on every commit). Once stack-notes lists those validators, Pipeline must include them.
**Fix:** plan to extend Pipeline. After stack-researcher finishes, the listed validators get added; reviewer dim 9 enforces that the Pipeline includes them on every subsequent PR.

**10. Post-approval fix coverage outside the protocol — dim 1 (plan completeness, retrospective)**
`docs/features/` contains exactly one plan family: `matter-bridge-mvp_plan.md`, `_arch.md`, `_review.md`. Git history after `4864ba2 docs: add matter-bridge-mvp review — approved (third pass)` includes:
```
b1182e0 feat: add Dockerfile and docker-compose.yml
a17039f fix: stable device endpoint identity, brightness meta, commissioning window, error logging
104c13d fix: mount /mnt/data/etc as dir so atomic config rename works in Docker
b85d341 fix: update Dockerfile ENV to match new config path
4ad0e06 feat: add confed schema and device/control topic format normalization
ce0635c fix: keep device/control format in config, convert to MQTT path at use time
bb9ee49 fix: schema accepts both device/control and full /devices/.../controls/... paths
409ed62 fix: exclude __tests__ from production build
```
Eight commits, including `feat:` additions of Dockerfile/compose/schema — none of which have a corresponding plan/review/arch artifact in `docs/features/`. These changes happened in orchestrator-direct-to-coder mode, bypassing the cycle. Reviewer never saw them. This is dim 1 retrospective failure and the most concrete instance of the guarantee-10 (all changes go through pipeline) violation.
**Fix:** plan to retroactively document each of the eight commits in `docs/features/` as an `audit-retroactive-<area>` entry, citing the commit SHA and the rationale. No code changes; just paper-trail recovery so future audits can compare against intent. From this point forward, the new WORKFLOW.md "When you say it doesn't work" + the remote-system boundary rule prevent recurrence.

### Notes

**1. `architecture.md` references `wb-ext-conventions` for future mapping precision — dim 7**
"After MVP, this project will adopt wb-ext-conventions as the mapping source and update accordingly." This is a roadmap item with no plan yet. Worth a backlog entry so the architectural intent is not lost.

**2. `docs/backlog.md` is empty — dim 7**
Despite three review passes that produced notes (deviceName/deviceId rename, MqttClient typing), nothing landed in backlog. Either the notes were resolved silently in-PR or backlog discipline drifted. Worth a one-line PM check.

**3. `bridge.uniqueId` equals `bridge.serialNumber` in active config — dim 9**
matter.js logs at start: "uniqueId and serialNumber shall not be the same". The plan in `matter-bridge-mvp_plan.md` § Contracts says both should be set from `short_sn.conf` on first start — making them identical by design. This is at the Matter spec boundary (BasicInformation cluster) — not crashing, but pollutes commissioning UX with a warning. Worth fixing alongside finding 2.

**4. Tests use `mockMqttClient as any` — dim 6**
Already flagged in review pass 3 as cosmetic. Still cosmetic. Not surfacing as a separate finding; already on PM's record.

### What looks healthy

- Plan/arch/review discipline through `matter-bridge-mvp` was visibly strong: three review passes caught real defects (UUIDs persistence, missing tests), and finally approved a working bridge. The protocol's behavioral correctness layer functioned.
- Test coverage is broad — 25 plan-required tests, all with real assertions.
- Docker setup is mostly correct: host networking for mDNS, volume mounts for matter.js storage, Unix socket for MQTT. The infra side of the deploy is solid.
- The architectural decision to build custom on matter.js rather than Matterbridge is well-reasoned and recorded.

---

## Coverage matrix — does the new audit catch every known wb-mqtt-matter failure?

| Known failure | Detected by | Severity |
|---|---|---|
| `docs/stack-notes.md` missing | dim 10 (Stack-notes integrity) | blocking |
| `currentLevel: 0` in handler | dim 9 (Stack expectations) | blocking |
| Property test freezes `0` as valid level | dim 9 (test codifies spec-forbidden value) | blocking |
| architecture.md table encodes `[0..254]` | dim 8 (docs drift) + dim 9 | blocking |
| Schema does not describe mqtt/bridge/commissioning | dim 10 (integration contract incomplete) | blocking |
| Schema `"service":` targets nonexistent systemd unit | dim 9 (stack idiom) | blocking |
| Plan/schema/example/handler topic format disagreement | dim 1 + dim 9 | blocking |
| Schema not delivered to `/usr/share/wb-mqtt-confed/schemas/` | dim 8 (delivery) | blocking |
| Pipeline lacks `wb-mqtt-confed-validate` and matter.js init-check | dim 10 (validators missing) | blocking |
| 8 post-approval commits with no plan/review | dim 1 retrospective | blocking |
| `uniqueId == serialNumber` per matter.js WARN | dim 9 | note |
| backlog empty, drift | dim 7 | note |

**All 10 stack-literacy / orchestrator-discipline failures detected at blocking severity. 2 secondary observations as notes.**

## What this validation does NOT prove

- It does not prove that the **closure** of these findings will actually happen — closure depends on PM saying "Fix now" and the orchestrator faithfully following `/plan-feature audit-fixup-*` instead of editing in-place. The text rules in WORKFLOW.md and `audit.md` say it must; nothing technically blocks it.
- It does not prove that any **future** wb-mqtt-matter feature will catch *new* spec violations before deploy — that depends on `stack-researcher` being spawned, `plan-feature` finding the "Stack expectations touched" section in the plan, reviewer running dim 10 honestly. Same trust assumption.
- It does not test the `.claude/settings.json` hooks layer (because we did not add any). A hook on `PreToolUse:Bash` blocking remote-edit ssh commands would convert several blocking rules from "instructions" to "constraints". This is a logical follow-up PR.

## Conclusion

On the captured snapshot of wb-mqtt-matter, the updated 10-dimension audit produces a complete map of the known protocol failures. Every gap from the original diagnosis surfaces as a finding with severity matching the actual harm. The fix path for every blocking finding is a `/plan-feature audit-fixup-*` cycle — which by template rules cannot regress into ad-hoc remote edits.

This is sufficient empirical evidence that the audit-side of the new template works for at least one real downstream project. It is not sufficient evidence that the entire protocol cannot be bypassed by a future orchestrator session — that gap requires the hooks layer.
