- Use `tools/sprint_workload.py` when asked about individual developer workload, task assignments, who is working on what, or per-person story point distribution for a sprint.
- Requires Python 3 and dependencies from `requirements.txt`; run from project root.

## When to invoke

- User asks "show developer workload", "who is assigned what", "how are tasks distributed", "which dev has the most points", or "sprint assignments".
- User names a specific sprint number — pass it via `--sprint`.
- User gives no sprint context — omit `--sprint` to default to the current active sprint.

## Invocation

```
python tools/sprint_workload.py [--sprint <number>]
```

- `--sprint` — optional sprint number (e.g. `23`); omit to use the active sprint.

## Data source

- Check whether `.env` exists and contains `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_BOARD_ID`, `JIRA_PROJECT_KEY`.
- If Jira is not configured, the script prints a `WARNING: fake data` notice automatically — surface this notice to the user verbatim.
- If Jira is configured, output reflects real assignee and issue data from the sprint.

## Presenting results

- Show the script output verbatim.
- Follow with a brief highlight: top contributor by SP assigned and any `Unassigned` issues that need an owner.
- If the fake data warning is present, remind the user to configure `.env` to get real data.
- Do not explain the grouping logic unless the user asks.
