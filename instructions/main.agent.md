# Instructions Catalog

Each entry below is an instruction file with a one-line description. Optional sub-fields after `+`:
- **Keywords** — trigger words/phrases: if user's request matches, load this instruction.
- **Target** — file glob pattern: if current file or context matches, consider this instruction relevant.
- **Exceptions** — edge cases or clarifications that don't fit in the one-liner.

---

- [`./instructions/create-status-report.agent.md`](./create-status-report.agent.md) — Generate a weekly status report in Markdown with fixed sections and format rules. ✅ battle-tested
  + Keywords: status report, weekly report, team report, create report, generate report

- [`./instructions/creating-instructions.agent.md`](./creating-instructions.agent.md) — Create, update, and manage instruction files and IDE wrappers across Copilot, Cursor, and Claude Code.
  + Keywords: create instruction, update instruction, new instruction, add instruction, manage instructions, set up instructions, bootstrap instructions

- [`./instructions/validate-instructions.agent.md`](./validate-instructions.agent.md) — Validate instruction files individually for structure and SRP review signals.
  + Keywords: validate instructions, review SRP, check instruction files, instruction quality

- [`./instructions/calculate-compound-interest.agent.md`](./calculate-compound-interest.agent.md) — Invoke `tools/compound_interest.py` to calculate compound interest and present the results.
  + Keywords: compound interest, final amount, interest earned, investment growth, principal, annual rate

- [`./instructions/use-sprint-velocity.agent.md`](./use-sprint-velocity.agent.md) — Invoke `tools/sprint_velocity.py` to report committed vs completed story points and velocity % for a sprint.
  + Keywords: sprint velocity, story points, committed, completed, sprint performance, velocity report

- [`./instructions/use-sprint-workload.agent.md`](./use-sprint-workload.agent.md) — Invoke `tools/sprint_workload.py` to show per-developer task assignments and story point distribution for a sprint.
  + Keywords: sprint workload, developer workload, task assignment, who is working on what, story point distribution, assignee