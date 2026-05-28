# Research alternatives

Research existing solutions, libraries, and analogues for a problem. Produces a PM-readable analysis — not code, not implementation advice. PM reads it, decides direction.

## When to use

- **At project start** (always useful): are there existing tools that solve this? Should we build or use/adapt?
- **For a feature** (when useful): is there a library that handles this? Are there established patterns worth following?

## Input

What to research — one of:
- The whole project: "research alternatives to building X from scratch"
- A feature area: "research libraries for Y"
- A specific question: "how do others solve Z?"

Also read `docs/architecture.md` if it exists — constraints narrow the search (e.g., "TypeScript only", "local network only", "ARM Docker" filters out many options).

## What to do

### 1. Define search scope

From the input and architecture constraints, identify 2-3 search angles:
- Existing complete solutions (ready-made products/services)
- Libraries/frameworks that cover the core problem
- Open source projects that solved a similar problem

### 2. Search

Use WebSearch for each angle. Search in English — most technical resources are in English.

Good search patterns:
- `"<technology> <problem>" github`
- `"<protocol> bridge <platform>" open source`
- `"<library name>" alternatives`
- `site:github.com <keyword>`

Read landing pages, READMEs, docs summaries — not source code. You are researching what exists, not how to implement.

### 3. Analyse each candidate

For each relevant result (aim for 3-5 candidates):

```
Name: <project/library name>
What it does: <one sentence>
Licence: <MIT / Apache / proprietary / etc>
Maturity: <actively maintained / stable / abandoned>
Solves our problem: yes / partially / no — why
Pros: ...
Cons: ...
Fit with our constraints: <e.g., "TypeScript ✓, ARM Docker ✓, local-only ✓">
```

Skip candidates that clearly don't fit architecture constraints — note why in one line.

### 4. Conclusion

One of:
- **Use as-is:** [name] solves the problem, no custom code needed
- **Adapt/wrap:** [name] covers 80%, build a thin layer on top
- **Build custom:** no good fit — because [reason]. Closest reference: [name] for patterns.

## Output

Write to `docs/research/<topic>_research.md`.

Format for PM:

```markdown
# Research: <topic>

## What we looked for
<one sentence: what problem we researched>

## Candidates

### <Name>
**What it is:** <plain language description>
**Licence:** <licence>
**Solves our problem:** yes / partially / no
**Pros:** ...
**Cons:** ...
**Would work for us:** yes / no — <why, in plain language>

### <Name 2>
...

## Conclusion
<One paragraph: what we found, what we recommend, why>

## Sources
- [name](url)
```

Then tell PM: "Research готов: `docs/research/<topic>_research.md`. Нашёл N вариантов. Рекомендация: [one sentence]."

## Hard rules

- Write for PM, not for a developer — no code, no technical jargon without explanation
- Cite every claim with a source URL
- Don't recommend building custom if a good existing solution fits — say clearly when something already exists
- Don't evaluate implementation quality — evaluate fit with the problem and constraints
