# Research: what good *human* documentation looks like — grounding for the doc-frugality fix

Practitioner standards only (no ISO/GOST). Four research sweeps: structure frameworks, brevity/minimalism, doc-type norms (ADR/arch/README), front-loading + human↔machine convergence. This file grounds the `doc-frugality` protocol-gap fix.

## Keystone — human-readability and machine-readability are the SAME goal (the justification for the whole effort)

A skimming human and a long-context LLM share **one** failure mode, demonstrated from two independent literatures:

- **Lost in the Middle** (Liu et al., TACL 2024, [arXiv:2307.03172](https://arxiv.org/abs/2307.03172), 2500+ citations): LLMs retrieve facts from the **start and end** of a long context far better than from the **middle** — a U-shaped accuracy curve, *even in long-context models*. "Current language models do not robustly make use of information in long input contexts."
- **F-pattern eyetracking** (Nielsen Norman Group, 20-year-stable): humans scan, skip the middle and right of long prose, and navigate by headings ("layer-cake" pattern). Critical facts stranded in the lower-right or mid-block get skipped.

Same fix for both: **front-load the bottom line, and chunk into short, clearly-headed, self-contained sections.** Markdown headings are the shared substrate — simultaneously the human's scan path and the retriever's chunk boundary (heading-aware chunking reports ~15-35% retrieval gains + 20-30% token reduction; directional vendor figures, sound mechanism). So "write for humans" and "write for the model" do not compete — **optimizing one optimizes the other.** This is exactly the project owner's intuition ("модель видит мегабайт, не читает, дописывает кусок"; "люди не понимают") — now backed.

## Cross-framework CONSENSUS rules (3+ independent sources — adopt first, highest confidence)

1. **One unit = one purpose.** Diátaxis (one mode per doc), Information Mapping (one point per chunk), Every-Page-is-Page-One (one purpose/one level per topic), C4 (one zoom per diagram). *The single most universal rule.* Mixing purposes inside one unit is the named root cause of bad docs.
2. **Front-load / BLUF.** US-military BLUF, journalism inverted pyramid, Microsoft "get to the point fast", Plain Language "state your major point first", topic sentences (NN/g). Survives truncation, skimming, and lost-in-the-middle.
3. **Label every unit.** Information Mapping (labeling), C4 (title+legend per diagram), Diátaxis (named sections), arc42 (fixed named sections).
4. **Brevity + single-source-of-truth (don't restate what another artifact/code owns).** arc42 ("as short as possible"; don't restate requirements docs), C4 ("don't hand-author what the code says"), Docs-as-Code (DRY), Ambler (SSOT, one home per fact).
5. **Bound scope by purpose, not by filling a quota.** arc42 (leave drawers empty, don't force-fill), Diátaxis ("as complex as it needs to be"), JBGE, EPPO. Don't pad; don't force-complete every section.
6. **Short sentences + short paragraphs, one idea each.** Plain Language (≤20 words/sentence, ≤6 sentences/paragraph, one idea), Hemingway (split ≥20, always-split ≥30 words), Microsoft (3-7 line paragraphs), Carroll.
7. **Less can beat more.** Carroll's minimalism (empirical: task cards beat a 94-page manual, ~half the learning time); ADR ("no one reads large documents"); JBGE ("documentation is a liability with a maintenance cost").

## The anti-drift mechanism that directly fixes our bloat — supersede-don't-edit (ADR)

Michael Nygard's ADR rationale is *explicitly* about drift and is the most quotable justification:
> "Large documents are never kept up to date. Small, modular documents have at least a chance at being updated. Nobody ever reads large documents, either."

Mechanism (Nygard / MADR / AWS prescriptive guidance):
- A decision record is **immutable** once accepted. **To change a decision you write a NEW record** and flip the old one's status to `superseded` with a reference — **never edit the body to tell the story of how it changed.**
- **History = the chain of superseded records (separate files), not edits to the live doc.**

This is precisely our "current-state-only, history goes elsewhere" principle with a battle-tested realization — and it directly kills the wb-mqtt-matter `Supersedes` / `corrects-the-earlier-wording` inline-history bloat and the nula `[x] Resolved (date)` inline pattern. (Ambler's corollary: "developers rarely trust docs out of sync with code" — out-of-sync docs are *worse* than none.)

## Numeric norms (concrete, practitioner-sourced — candidates for auditor smells / authoring targets)

| Rule | Number | Source |
|---|---|---|
| Sentence length | avg 15-20 words; split ≥20; always-split ≥30 | Plain Language / Hemingway |
| Paragraph | 3-7 lines, ≤6 sentences, one idea | Microsoft / Plain Language |
| Reading grade | ≤ grade 9-10 (Flesch-Kincaid) | Hemingway |
| Decision record | ≤ 1-2 pages, ONE decision per record | Nygard ADR |
| README one-liner | ≤120 chars (must match package + repo desc — SSOT) | standard-readme |
| README | ≤~100 lines before it needs a ToC (TOC-needed = bloat signal) | standard-readme |
| Doc unit | fits one screen / "above the fold" | Microsoft |
| Navigation list | ≤7 items, else order mechanically or subdivide | Diátaxis |
| Top quality goals/drivers | 3 (max 5) | arc42 |

## Per-doc-TYPE discipline (Diátaxis-aware — each protocol doc maps to a mode)

- **`docs/architecture.md`** → arc42-lean + ADR decisions. Fixed named sections, empty allowed, prioritize risky/special over complete, quality-goals ≤5. Decisions as compact current-state (table or short blocks); **full rationale/rejected/trade-offs = "explanation" mode, one click away in `.ai-pm/arch/`**; history via supersede-chain. (This is the on-demand split we already applied to `WORKFLOW.md`.)
- **`docs/stack-notes.md`** → Diátaxis **reference** mode + Information-Mapping chunking. `####` sub-headings (kills lost-in-the-middle on the matter.js 195KB sheet), one-idea-per-chunk, classify by type, consistent structure. Investigation-narrative → distilled rule + one `Source:` line.
- **`docs/user-journeys.md`** → how-to/explanation; one journey = one self-contained topic.
- **`README.md`** → **front door, not a manual**: name + ≤120-char one-liner + install + minimal usage + links out. ≤~100 lines. Detail lives in `docs/`, linked.
- **`docs/features/*_plan.md`** → task-oriented; one purpose; front-loaded.
- **Contracts** → already small on nula (two-layer works); keep the PM layer to product language, machine grammar referenced.

## Conflicts / honest design implications

- **Fixed template vs need-driven.** arc42 prescribes fixed numbered sections; Diátaxis/EPPO reject rigid schemes ("author for a human, not a scheme"). Reconcile: arc42's fixed slots fit *architecture.md* specifically; Diátaxis modes govern the *corpus*. Not a real contradiction at our scale.
- **Hard length cap is contested.** Only arc42/C4 back explicit brevity mandates. Diátaxis, EPPO, and Information Mapping deliberately decline a length rule and bound size by **purpose** — they would call a hard word-count gate a category error. → **Design implication:** make the numeric norms **auditor smells + authoring targets, not hard merge-gates** — with the few well-supported hard caps as exceptions (README one-liner ≤120 chars, decision record ≤1-2 pages, nav ≤7, quality-goals ≤5). The *structural* rules (one-purpose-per-unit, front-load, supersede-don't-edit) are what actually bound size; numbers are the smell detector, not the law.
- **Unit granularity differs** (chunk < topic < section < doc). When writing a rule, name which unit it binds.

## Primary sources

Diátaxis (diataxis.fr) · arc42 (arc42.org, docs.arc42.org) · C4 (c4model.com) · Information Mapping (Horn) · Every Page is Page One (Mark Baker) · Docs-as-Code (writethedocs.org) · Carroll minimalism (MIT Press, Nurnberg Funnel) · Google developer style guide (developers.google.com/style) · Microsoft Writing Style Guide (learn.microsoft.com/style-guide) · Plain Language (plainlanguage.gov, NARA, OPM, DOL) · Hemingway / Flesch-Kincaid · NN/g progressive disclosure · Nygard ADR (cognitect 2011) + MADR + Y-statements · Ambler Agile Modeling / JBGE · standard-readme + Art of README · Liu et al. "Lost in the Middle" (TACL 2024, arXiv:2307.03172) · NN/g F-pattern + inverted pyramid eyetracking · BLUF (US military).
