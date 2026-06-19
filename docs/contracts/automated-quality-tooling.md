# Contract: automated-quality-tooling

**The protocol sets up stack-appropriate automated quality tools in every project — not just LLM judgement and deny-rules, but real linters, formatters, type-checkers, and a security (SAST) scanner — configured on-site, tuned to the stack, and run every loop.**

Every project gets a real automated quality toolkit — linters, type-checkers, SAST — chosen for its stack, wired and tuned at setup, and run on every loop. An AI reviewer catches different failure classes than a deterministic linter; both run.

## Must work

- At setup the project's stack is discovered, a stack-appropriate toolkit is proposed (linter · formatter · type-checker · doc linter · a security/SAST scanner), and — on the Operator's go — each tool is installed, configured, registered in the quality registry (`src/quality/tools.json`), and verified green.
- The registered tools run on every loop through the runner (`node src/quality/run.mjs <beat>`); a red tool is not green.
- The toolkit is tuned to the project: standard rulesets by default, with any relaxation recorded as a deliberate Operator decision in the tool's own config.

## Must not break

- No specific tool is hard-coded in the core or the template — the stack is discovered and the right tools are chosen per project; a downstream on a different stack gets different tools by the same procedure (the project-agnostic rule).
- A quality-gate config is never loosened to make code pass: the AI fixes the code to the standard, and a config relaxation is a deliberate Operator decision, recorded with its reason — never the author's (and never the AI-author's) convenience.
- The tools augment the independent-review floor, they never replace it — on guarantee profiles (`full`/`lite`/`solo`) a separate fresh Reviewer/audit still gates every change.
