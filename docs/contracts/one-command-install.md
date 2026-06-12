# Contract: one-command-install

**One command installs the protocol into a target project** — it vendors the shared adapter, wires the active platform (its deny hooks, agents, commands, and any plugin), and lays down the structure (the constitution, the role agents, the quality-layer shape, the capability modules, the doc templates, and a config slot) — **idempotently**, so re-running is always safe.

The single home for what each step does is `src/adapter/INSTALL.md`; this contract names only the guarantee.

## Must work

- One command (`node src/adapter/install.mjs <target-dir> [--platform claude|opencode]`) installs the protocol into the target: the shared adapter is vendored into the target's tooling location, the active platform is wired (deny hooks, the spawnable agents, the setup command, and the plugin where the platform has one), and the load-instructions surface imports the constitution.
- The core the downstream needs lands in the target — the constitution at `.ai-dev/PROTOCOL.md`, the quality-runner shape at `.ai-dev/quality/` (the format, not this repo's own tool rows), the role agents and capability modules vendored under `.ai-dev/tooling/`. Doc templates are NOT copied to the project root; they live in `.ai-dev/tooling/src/templates/` and are laid down on demand by product discovery / doc bootstrap.
- The active platform is resolved from the `--platform` flag, else the target's `.ai-dev/config.json` `platform`, else a clear error — never a silent guess.
- The command finishes by reporting what it did and the next step (run `/dev-setup` to configure the project).

## Must not break

- **Idempotent** — re-running yields the same wired state: no duplicated deny hook, no duplicated constitution import, no duplicated or corrupted file. A second run is safe.
- **Never touches the project's own docs** — the installer writes nothing to the target's `docs/` or `src/` directories; those belong to the downstream project. Doc templates are accessible under `.ai-dev/tooling/src/templates/` and laid down on demand by product discovery / doc bootstrap.
- **Stays inside the target root** — every write lands beneath the resolved target directory; the installer never writes outside it (the project-boundary floor, enforced mechanically by the deny layer regardless).
- **No platform name leaks into the neutral core** — the installer is adapter-layer code, platform-specific by nature; the concrete platform wiring it performs never adds a platform primitive to `PROTOCOL.md`, the role bodies, or `docs/architecture.md` prose.
