## Threat model

The **threat-model** module is on, so the floor's **Security** item is deepened from
"are the threats named" to a review-time **enumeration**: for a security-relevant
change, confirm each surface below was named in the plan AND handled in the diff,
tying every threat to the `file:line` that opens or closes it. An **unhandled
exposure, or a security claim the diff doesn't back, blocks** — same cite-or-it-
didn't-happen rule as the floor. Where the project has a standing threat model
(`docs/threat-model.md`), a security-relevant change that contradicts it is a finding.
`[persona]`: this sharpens judgement, denies nothing.

- `[light]` **Attack surface** — new input / endpoint / parser / format / interface; is each validated where untrusted data first enters?
- `[light]` **Secrets & credentials** — no secret read from a live file, logged, or committed; secrets come from a git-ignored source, keys are not hard-coded.
- `[light]` **Trust boundaries** — where untrusted input crosses into trusted code, validation sits AT the boundary, not after.
- `[light]` **Injection & unsafe ops** — no shell / SQL / path / template injection, `eval`, or unsafe deserialization on a tainted value.
- `[light]` **Fail-open vs fail-closed** — an error path tightens a guard, never relaxes it; the safe default is the strict side (the protocol's own fail-safe lesson).
- `[rich]` **Data & privacy exposure** — no over-broad read, no PII in a log, no sensitive value crossing an unintended boundary.
- `[rich]` **AuthZ / AuthN** — a new surface carries its access check; no caller reaches a privileged path with a missing or weaker check than its peers.
- `[rich]` **Supply chain** — a new dependency is named, justified, and from a trusted source; no unvetted transitive risk.
