---
description: Generate a weekly status report in Markdown
---

Generate a weekly status report using the rules below.

## Data source rules

- Before generating the report, check whether a real Jira connection is configured (i.e. `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_BOARD_ID`, `JIRA_PROJECT_KEY` environment variables are present and a `.env` file exists).
- If no real Jira connection is configured, generate the report using plausible placeholder data AND add this notice at the top of every output:
  ```
  > ⚠️ **Fake data** — no Jira connection configured. Set up `.env` with Jira credentials to use real data.
  ```
- If real Jira data is used, do NOT add the fake data notice.

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
