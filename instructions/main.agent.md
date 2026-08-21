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