# Contract: one-command-install

**One command installs the protocol into a target project** — it vendors the shared adapter, wires the active platform (its deny hooks, agents, commands, and any plugin), and lays down the structure (the constitution, the role agents, the quality-layer shape, the capability modules, the doc templates, and a config slot) — **idempotently**, so re-running is always safe.

Adopting the protocol must not be a manual checklist a person follows by hand and gets wrong. One command turns a plain repository into a protocol-driven one: the adapter the enforcement layer needs is vendored where the platform can reach it, the active platform is wired to the shared engine, and the downstream gets the core files and doc templates it needs to start the loop. Re-running the command is a safe no-op-shaped operation — it converges the target to the same wired state rather than duplicating a hook, an import, or a file. The single home for *what each step does* is `src/adapter/INSTALL.md`; this contract names only the guarantee.

## Must work

- One command (`node src/adapter/install.mjs <target-dir> [--platform claude|opencode]`) installs the protocol into the target: the shared adapter is vendored into the target's tooling location, the active platform is wired (deny hooks, the spawnable agents, the setup command, and the plugin where the platform has one), and the load-instructions surface imports the constitution.
- The core the downstream needs lands in the target — the constitution, the role agents, the quality-registry shape (the format, not this repo's own tool rows), the capability modules — and the doc templates (contracts, architecture, README, product) are laid down where the target does not already have them.
- The active platform is resolved from the `--platform` flag, else the target's `ai-dev.config.json` `platform`, else a clear error — never a silent guess.
- The command finishes by reporting what it did and the next step (run `/dev-setup` to configure the project).

## Must not break

- **Idempotent** — re-running yields the same wired state: no duplicated deny hook, no duplicated constitution import, no duplicated or corrupted file. A second run is safe.
- **Never clobbers a project's real docs** — a doc template is laid down only where the target does not already have that doc; an existing `contracts.md` / `architecture.md` / `README.md` / `product.md` is left untouched.
- **Stays inside the target root** — every write lands beneath the resolved target directory; the installer never writes outside it (the project-boundary floor, enforced mechanically by the deny layer regardless).
- **No platform name leaks into the neutral core** — the installer is adapter-layer code, platform-specific by nature; the concrete platform wiring it performs never adds a platform primitive to `PROTOCOL.md`, the role bodies, or `docs/architecture.md` prose.
