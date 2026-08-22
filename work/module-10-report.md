# Module 10 Completion Report

## Instruction Files
```
    Directory: C:\Users\pankaj_gupta\OneDrive - EPAM\Documents\EPAMCode\hello-genai\instructions


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---l        21-08-2026     20:12           1324 create-status-report.agent.md
-a---l        21-08-2026     20:47          16578 creating-instructions.agent.md
-a---l        21-08-2026     20:47           1030 main.agent.md
```

## main.agent.md Contents
# Instructions Catalog

Each entry below is an instruction file with a one-line description. Optional sub-fields after `+`:
- **Keywords** — trigger words/phrases: if user's request matches, load this instruction.
- **Target** — file glob pattern: if current file or context matches, consider this instruction relevant.
- **Exceptions** — edge cases or clarifications that don't fit in the one-liner.

---

- [`./instructions/create-status-report.agent.md`](./create-status-report.agent.md) — Generate a weekly status report in Markdown with fixed sections and format rules.
  + Keywords: status report, weekly report, team report, create report, generate report

- [`./instructions/creating-instructions.agent.md`](./creating-instructions.agent.md) — Create, update, and manage instruction files and IDE wrappers across Copilot, Cursor, and Claude Code.
  + Keywords: create instruction, update instruction, new instruction, add instruction, manage instructions, set up instructions, bootstrap instructions

## Sample Instruction
- File: create-status-report.agent.md
- Contents:
---
description: Generate a weekly status report in Markdown
---

Generate a weekly status report using the rules below.

## Format rules

- Output format: Markdown only
- Structure: exactly three `##` sections in this order: `Accomplishments`, `Blockers`, `Next Week`
- Content: bullet points only — no prose paragraphs, no numbered lists
- Length: 20 lines maximum (including headings and blank lines)
- Tone: professional and direct
- Forbidden words: leverage, synergy, seamless, robust, streamline, utilize, facilitate, touch base, circle back, move the needle, deep dive, cutting-edge, game-changer, impactful

## Content rules

- Each bullet starts with a past-tense verb (Accomplishments), a noun phrase (Blockers), or an infinitive verb (Next Week)
- State facts and outcomes only — no filler, no vague claims
- If a section has nothing to report, write a single bullet: `- None`

## Example output

```markdown
## Accomplishments
- Delivered Jira data-fetch module with pagination support
- Published sprint report to Confluence for week of 2026-08-14

## Blockers
- Jira API token expires 2026-08-28; renewal request pending with IT

## Next Week
- Implement retry logic with exponential backoff in JiraClient
- Write unit tests for report_builder and formatter modules
```
