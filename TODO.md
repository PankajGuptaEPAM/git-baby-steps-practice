# Project Tasks

## Phase 1: Setup
– [x] Create project repository
– [x] Configure .gitignore
– [x] Set up development environment

## Phase 2: Implementation
– [x] Create data fetching module
– [x] Build report template
– [x] Add formatting logic

## Progress Notes
- Created `report_generator/` package with four modules:
  - `jira_client.py` — fetches active sprint, issues, blockers, velocity, bug trend via Jira REST API
  - `confluence_client.py` — creates or updates a Confluence page under the configured parent
  - `report_builder.py` — assembles all report sections into a structured dict with RAG status
  - `formatter.py` — converts the report dict to Confluence Storage Format (XHTML)
- Updated `main.py` as the CLI entry point supporting `--dry-run` and `--date` flags