- Use `tools/sprint_velocity.py` when asked about sprint velocity, story point completion rate, committed vs completed points, or sprint performance.
- Requires Python 3 and dependencies from `requirements.txt`; run from project root.

## When to invoke

- User asks "what is our velocity", "how many points did we complete", "show sprint performance", or "committed vs completed".
- User names a specific sprint number — pass it via `--sprint`.
- User gives no sprint context — omit `--sprint` to default to the current active sprint.

## Invocation

```
python tools/sprint_velocity.py [--sprint <number>]
```

- `--sprint` — optional sprint number (e.g. `23`); omit to use the active sprint.

## Data source

- Check whether `.env` exists and contains `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_BOARD_ID`, `JIRA_PROJECT_KEY`.
- If Jira is not configured, the script prints a `WARNING: fake data` notice automatically — surface this notice to the user verbatim.
- If Jira is configured, output reflects real sprint data.

## Presenting results

- Show the script output verbatim.
- Follow with a one-line summary: sprint name, completed SP, committed SP, and velocity %.
- If the fake data warning is present, remind the user to configure `.env` to get real data.
- Do not explain the velocity formula unless the user asks.
