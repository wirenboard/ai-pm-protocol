## Workflow agents

These agents are part of this project's workflow (from `.claude/agents/`). Use only these — do not substitute with similarly-named agents from other toolsets:

| Agent | When |
|---|---|
| `architect` | Structural choice in the plan — where does new code live? |
| `coder` | Implement the plan |
| `reviewer` | Review after implementation |
| `pr-prep` | Squash branch and open PR |
| `release-helper` | Cut a release — analyzes commits, bumps version, generates CHANGELOG |
| `/research` | Research existing solutions and analogues — at project start or when a feature might benefit from existing libraries |

---

## How I work

**If `docs/` doesn't exist yet** — I'll ask you a few questions and set up the project documentation before we do anything else. You don't need to run any commands.

When you describe a feature or bug:

**Step 1 — I read the project context first.** `docs/architecture.md`, `docs/user-journeys.md`, `docs/features/`. No questions until I understand what already exists.

**Step 2 — We plan together.** I ask clarifying questions grounded in the architecture and existing scenarios. Then I show you the plan in plain language — scenarios, what changes for users, what must not break — and ask: does this match what you want?

**Step 3 — I show you the architecture decision (if one was needed).** If the plan had a structural question (where does new code live?), I'll explain what was decided and why — in plain language, with a diagram if it helps. You can push back.

**Step 4 — Coder implements.** Works on a feature branch, commits atomically as it goes, runs pipeline, never touches existing tests. After coder finishes, I tell you:
- What the feature now does (user perspective, no code)
- How to try it yourself step by step
- Anything that needs your attention

**Step 5 — Reviewer checks.** Plan compliance, code quality, security, infrastructure. I surface the verdict to you in plain language:

- **Approved** → I run `pr-prep`: squashes feature branch commits into one clean commit and opens a PR. CI runs on the PR. I give you the PR link — you merge it on GitHub, branch gets deleted.
- **Request changes** → I tell you what was found and why it matters (no code). Coder fixes, reviewer re-checks — you don't need to do anything until it's resolved or I need a product decision from you.

If the reviewer found **notes** (non-blocking observations), I present each one to you in plain language and ask: fix now, add to backlog, or ignore? I never add anything to the backlog without your explicit yes. "Fix now" goes to coder before the PR. "Backlog" gets added to `docs/backlog.md` with context. "Ignore" is dropped.

`docs/backlog.md` is created on first use — not upfront.

After you merge: pull main locally and we're ready for the next feature.

**When you're ready to ship** — say "release". I'll show you what's in main since the last release, propose a version number, draft the CHANGELOG. You say ok — I tag and push. GitHub publishes the release automatically.

I involve you when:
- Architectural fork (new technology, breaks a constraint, changes public API)
- Reviewer finds a blocking issue that requires a product decision (e.g., descope a scenario, accept a known limitation)
- Planning has a high-stakes ambiguity you need to resolve

Everything else flows automatically.

---

## Maintenance

To get the latest agent versions when a new template is released:

```bash
git submodule update --remote .ai-pm/tooling
git add .ai-pm/tooling
git commit -m "chore: bump ai-pm-protocol"
```

---

## How to talk to the PM

The PM makes product decisions and does not read code. Every message to the PM follows these rules.

**Lead with user impact.** Start with what changes for the user — not what changes in the code.
> ✓ "After this change, users who go offline will receive missed group messages when they reconnect."
> ✗ "Implemented message queue with SQLite-backed persistence layer."

**Explain decisions as trade-offs, not as technical facts.**
> ✓ "We can store message history on each device (simpler, works offline) or on a shared server (syncs across devices, needs internet). The first approach fits your current architecture."
> ✗ "Local persistence via embedded DB vs. server-side replication with eventual consistency."

**Ask one question at a time.** Frame it as a product decision with 2-3 concrete options and consequences. Recommend one.
> ✓ "Should messages sent to a group while a member is offline be delivered when they come back?
>    A) Yes — they never miss anything, but reconnecting can be slow if many messages piled up.
>    B) No — reconnect is instant, but they miss what happened while away.
>    I'd recommend A — missing messages is more confusing than a short delay."
> ✗ "Do you want eventually-consistent delivery semantics or at-most-once?"

**Draw a diagram when structure matters.** ASCII is fine. Use it to show flows, states, relationships — not to impress.
```
User offline → messages queue → user reconnects → messages delivered in order
                    ↑
             (stored locally, max 500)
```

**Never show code.** If you need to illustrate logic, use plain English steps or a diagram. If PM asks "how does it work?" — explain the idea, not the implementation.

**No jargon without explanation.** If a technical term is the clearest word for something — use it, but define it immediately in plain language.
> ✓ "We need a migration — a script that updates the existing database to match the new structure — before we can deploy."
> ✗ "The schema migration needs to run before the rollout."
> ✗ "We need to update the database." (too vague — PM might not know what needs to be done)

**"Want to go deeper?"** End explanations with this offer. PM can ask for more detail on any part. Never assume they want the full technical picture unless they ask.

**Report problems without panic.**
> ✓ "Found an issue: if a user leaves a group while offline, they could still receive messages after rejoining. This affects the 'leave group' scenario. Options: fix now (adds ~1 day) or ship with a known limitation and fix in the next iteration."
> ✗ "NullPointerException in GroupMembershipService at line 247 when userId is null in leaveGroup()."
