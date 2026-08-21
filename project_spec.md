# Technical Specification: Weekly Status Report Generator

**Version:** 1.0  
**Date:** 2026-08-21  
**Author:** Pankaj Gupta  
**Role:** Delivery Manager  
**Project Context:** Diamond Industry Marketplace  

---

## 1. Overview

A Python command-line tool that fetches the active Jira sprint data for a given board, generates an executive-level weekly status report, and publishes it as a new Confluence page under a designated parent page. The tool can be triggered manually or scheduled.

---

## 2. Goals

- Eliminate manual effort in compiling weekly sprint reports.
- Deliver a consistent, executive-friendly summary to stakeholders.
- Publish directly to Confluence so no email/attachment workflow is needed.
- Be runnable on-demand and schedulable via Task Scheduler / cron.

---

## 3. Scope

| In Scope | Out of Scope |
|----------|--------------|
| Pull active sprint data from one Jira board | Multi-board aggregation |
| Publish one Confluence page per run | Editing/deleting past report pages |
| Auto-detect team members from sprint assignees | Manual team roster management |
| Last 5 sprints velocity trend (data only, text table) | Chart image generation |
| Executive summary section | Detailed ticket-level drill-down pages |

---

## 4. Stakeholder & Audience

| Audience | Detail Level |
|----------|-------------|
| Executive / C-level | High-level summary: RAG status, completion %, key risks |
| Delivery Manager (author) | Full detail view in console log |

---

## 5. System Integrations

### 5.1 Jira (Source)

| Parameter | Value |
|-----------|-------|
| Base URL | `https://jiraeu.epam.com` |
| Board ID | `279935` |
| Project Key | `EPMCDMETST` |
| Quick Filter | `969968` |
| Auth method | HTTP Basic Auth (`email` + `API token`) |
| Credentials storage | `.env` file |

**JQL patterns used:**
```
# Active sprint issues
project = EPMCDMETST AND sprint in openSprints()

# Completed this week
project = EPMCDMETST AND sprint in openSprints() AND status = Done AND updated >= -7d

# Blockers
project = EPMCDMETST AND sprint in openSprints() AND (flagged = Impediment OR priority = Blocker)

# Next sprint preview
project = EPMCDMETST AND sprint in futureSprints() ORDER BY priority ASC
```

### 5.2 Confluence (Destination)

| Parameter | Value |
|-----------|-------|
| Base URL | `https://kb.epam.com` |
| Parent Page ID | `2916852142` |
| Parent Page Title | `Test page` |
| Auth method | HTTP Basic Auth (`email` + `API token`) |
| Page title format | `Weekly Status Report — YYYY-MM-DD` |
| Content format | Confluence Storage Format (XHTML) generated from structured text |

---

## 6. Report Sections

The published Confluence page contains the following sections in order:

### 6.1 Executive Summary
- Sprint name, dates, overall RAG status (🟢 / 🟡 / 🔴)
- Story points: committed vs. completed vs. remaining
- Completion percentage
- One-line highlight and one-line risk

### 6.2 Sprint Progress
| Metric | Committed | Completed | Remaining | % Done |
|--------|-----------|-----------|-----------|--------|
| Story Points | | | | |
| Total Tickets | | | | |

### 6.3 Completed Issues
Table: Ticket ID | Summary | Assignee | Story Points | Resolved Date

### 6.4 In-Progress Items
Table: Ticket ID | Summary | Assignee | Status | % Done | Due Date

### 6.5 Blockers / Flagged Issues
Table: Ticket ID | Summary | Blocker Description | Assignee | Flagged Since

### 6.6 Team Workload
Table: Assignee | Assigned Tickets | Completed | In Progress | Story Points

### 6.7 Bug Trend
Table: Sprint | Bugs Opened | Bugs Closed | Net

### 6.8 Velocity Trend (Last 5 Sprints)
Table: Sprint Name | Committed | Completed | Velocity %

### 6.9 Next Sprint Goals
List of top issues from the next sprint (priority-ordered): Ticket ID | Summary | Priority | Story Points

---

## 7. Configuration

### `.env` file (never commit to Git)
```
JIRA_BASE_URL=https://jiraeu.epam.com
JIRA_EMAIL=pankaj_gupta@epam.com
JIRA_API_TOKEN=<your-jira-api-token>

CONFLUENCE_BASE_URL=https://kb.epam.com
CONFLUENCE_EMAIL=pankaj_gupta@epam.com
CONFLUENCE_API_TOKEN=<your-confluence-api-token>

JIRA_BOARD_ID=279935
JIRA_PROJECT_KEY=EPMCDMETST
CONFLUENCE_PARENT_PAGE_ID=2916852142
VELOCITY_SPRINTS=5
```

### `.gitignore` must include:
```
.env
__pycache__/
*.pyc
```

---

## 8. Project Structure

```
hello-genai/
├── report_generator/
│   ├── __init__.py
│   ├── jira_client.py       # Jira REST API calls
│   ├── confluence_client.py # Confluence REST API calls
│   ├── report_builder.py    # Assemble report sections
│   └── formatter.py         # Convert data to Confluence storage format
├── main.py                  # Entry point — run to generate & publish
├── .env                     # Credentials (gitignored)
├── requirements.txt
└── project_spec.md
```

---

## 9. Python Dependencies

```
requests>=2.31.0
python-dotenv>=1.0.0
```

---

## 10. CLI Usage

```bash
# Manual run — generate and publish report for the current active sprint
python main.py

# Dry run — print report to console, do not publish
python main.py --dry-run

# Generate for a specific date (past report recovery)
python main.py --date 2026-08-14
```

---

## 11. Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Jira API unreachable | Log error with timestamp, exit with code 1 — do NOT publish |
| No active sprint found | Log warning, exit — do NOT publish an empty page |
| Confluence API unreachable | Log error, save report as local `.md` file as fallback |
| Missing `.env` variable | Raise descriptive `ValueError` at startup before any API call |
| Partial data (e.g. no blockers) | Publish report with section showing "None this sprint" |

---

## 12. Scheduling

The user configures the schedule externally:

**Windows Task Scheduler** (recommended for this environment):
```
Program:  python
Arguments: C:\...\hello-genai\main.py
Start in: C:\...\hello-genai
Trigger:  Weekly — Monday 8:00 AM
```

**Linux/macOS cron:**
```
0 8 * * 1 cd /path/to/hello-genai && python main.py >> logs/report.log 2>&1
```

---

## 13. Security Considerations

- API tokens stored only in `.env`, never hardcoded.
- `.env` added to `.gitignore` before first commit.
- No credentials written to console output or log files.
- Requests use HTTPS only.

---

## 14. Acceptance Criteria

- [ ] Running `python main.py` publishes a new Confluence child page under page `2916852142`.
- [ ] Page title matches format `Weekly Status Report — YYYY-MM-DD`.
- [ ] All 9 report sections are present and populated from live Jira data.
- [ ] `--dry-run` prints formatted output to console without publishing.
- [ ] Failure to reach Jira exits cleanly with a log message and no Confluence publish.
- [ ] No credentials appear in any output or log.
