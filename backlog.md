# Implementation Backlog — Weekly Status Report Generator

**Project:** Diamond Industry Marketplace  
**Owner:** Pankaj Gupta  
**Last updated:** 2026-08-22  

**Decisions recorded here:**
- MVP = full end-to-end (Jira → Confluence) in one run
- Jira integration is the first priority; report shape follows the data
- Error handling = retry with exponential backoff for transient API errors (429 / 503)
- Tests = unit (mocks) + integration (live API, separate suite)
- Docs = README + inline docstrings on all public functions
- Scheduling = post-MVP phase

---

## Phase 1 — Setup

- [x] Create project repository
- [x] Configure `.gitignore` (`.env`, `__pycache__/`, `*.pyc`)
- [x] Add `requirements.txt` with `requests>=2.31.0` and `python-dotenv>=1.0.0`
- [x] Create `.env.example` with all required environment variables
- [x] Create `report_generator/` package (`__init__.py`)
- [ ] Verify minimum Python version (3.9+) and document it in README <!-- #1 -->
- [ ] Create `requirements-dev.txt` with `pytest>=7`, `pytest-mock`, `responses` (HTTP mocking) <!-- #2 -->

---

## Phase 2 — Core Features

### 2a. Jira Client _(priority: first)_

- [x] `JiraClient.__init__()` — load config from `.env`, initialise authenticated `requests.Session`
- [x] `JiraClient.get_active_sprint()` — `GET /rest/agile/1.0/board/{boardId}/sprint?state=active`
- [x] `JiraClient.get_sprint_issues()` — JQL `openSprints()`, paginated across all results — Approach 3
- [x] `JiraClient.get_completed_issues()` — JQL `status = Done AND updated >= -7d`
- [x] `JiraClient.get_blockers()` — JQL `flagged = Impediment OR priority = Blocker`
- [x] `JiraClient.get_next_sprint_issues()` — JQL `futureSprints() ORDER BY priority ASC`, top 20
- [x] `JiraClient.get_closed_sprints()` — last N closed sprints ordered by start date
- [x] `JiraClient.get_sprint_velocity()` — committed vs completed story points per sprint ID
- [x] `JiraClient.get_bug_trend()` — bugs opened / closed per sprint for last N sprints
- [ ] Add retry with exponential backoff in `JiraClient._get()` — handle HTTP 429 and 503, max 3 attempts
- [ ] Handle story points field alias — fall back to `customfield_10028` if `customfield_10016` is null on all issues
- [ ] Add docstrings to all public `JiraClient` methods

### 2b. Report Builder

- [x] `build_report()` — assemble all 9 report sections into a structured dict
- [x] Compute RAG status (🟢 ≥ 80%, 🟡 50–79%, 🔴 < 50% completion)
- [x] Compute story point tallies — committed, completed, remaining, completion %
- [x] Compute per-assignee workload (assigned, completed, in-progress, story points)
- [x] Normalise completed, in-progress, blocker, and next-sprint issues into clean dicts
- [ ] Derive auto-generated executive highlight — surface the highest-SP completed ticket as a one-liner
- [ ] Derive auto-generated risk summary — surface the oldest open blocker as a one-liner
- [ ] Add docstrings to all public functions in `report_builder.py`

### 2c. Confluence Storage Formatter

- [x] `to_confluence_storage()` — render all 9 sections as Confluence XHTML — Approach 3
- [x] Render Sprint Progress, Completed Issues, In-Progress, Blockers, Team Workload, Bug Trend, Velocity, Next Sprint as tables
- [x] Escape all user-supplied strings via `xml.sax.saxutils.escape`
- [x] Render "—" placeholder row for any section that has no data
- [ ] Replace plain RAG text with Confluence Status macro for colour coding:
  ```xml
  <ac:structured-macro ac:name="status">
    <ac:parameter ac:name="colour">Green</ac:parameter>
    <ac:parameter ac:name="title">On Track</ac:parameter>
  </ac:structured-macro>
  ```
- [ ] Add module-level docstring to `formatter.py` explaining storage format constraints

### 2d. Confluence Client

- [x] `ConfluenceClient.__init__()` — load config from `.env`, initialise authenticated session
- [x] `ConfluenceClient.find_page()` — search for existing page by title
- [x] `ConfluenceClient.create_or_update_page()` — idempotent: create new or bump version and update
- [ ] Add retry with exponential backoff in `ConfluenceClient._post()` / `_put()` — handle 429 / 503, max 3 attempts
- [ ] Auto-resolve `space_key` from the parent page ID via `GET /rest/api/content/{id}` so callers never need to pass it manually
- [ ] Add docstrings to all public `ConfluenceClient` methods

---

## Phase 3 — Integration

- [x] `main.py` — wire Jira → `build_report()` → `to_confluence_storage()` → Confluence publish
- [x] `--dry-run` flag — print Confluence storage body to stdout, skip publish
- [x] `--date` flag — override report date in the page title (`YYYY-MM-DD`)
- [ ] Validate all required env vars at startup; print a clear list of missing vars and exit before making any API calls
- [ ] Add `--board-id` CLI flag to override `JIRA_BOARD_ID` without editing `.env`
- [ ] Add `--space-key` CLI flag for explicit Confluence space targeting
- [ ] Print a one-line success summary to stdout: sprint name, completion %, Confluence page URL
- [ ] Confirm exit code 0 on success, exit code 1 on any error (Jira or Confluence)

---

## Phase 4 — Testing

### Unit tests (all API calls mocked)

- [ ] Create `tests/` directory with `__init__.py`
- [ ] Create `tests/conftest.py` — shared fixtures: sample sprint dict, sample issue dict (done / in-progress / blocker variants)
- [ ] Create `tests/unit/test_report_builder.py`:
  - RAG status thresholds (80%, 50%, below 50%)
  - Story point tally correctness with mixed SP values including nulls
  - Team workload aggregation
  - Empty sprint edge case (zero issues)
- [ ] Create `tests/unit/test_formatter.py`:
  - XHTML output contains expected section headings
  - Special characters are escaped (`<`, `>`, `&`)
  - Empty section renders "—" placeholder row
  - Velocity % computed correctly from data
- [ ] Create `tests/unit/test_jira_client.py` (using `responses` or `pytest-mock`):
  - Pagination stops at correct total
  - `get_active_sprint()` raises `RuntimeError` when no active sprint found
  - `get_sprint_velocity()` returns (0, 0) for sprint with no story points
- [ ] Create `tests/unit/test_confluence_client.py`:
  - `create_or_update_page()` calls POST when page does not exist
  - `create_or_update_page()` calls PUT with incremented version when page exists
- [ ] Add `pytest.ini` with `testpaths = tests` and markers for `unit` and `integration`

### Integration tests (live API — require `.env`)

- [ ] Create `tests/integration/test_jira_live.py`:
  - Assert `get_active_sprint()` returns a dict with `id`, `name`, `startDate`, `endDate`
  - Assert `get_sprint_issues()` returns a non-empty list
  - Mark with `@pytest.mark.integration` so CI can skip unless credentials are present
- [ ] Create `tests/integration/test_confluence_live.py`:
  - Create a test page under the parent, assert URL is returned
  - Re-run and assert the page is updated (version incremented), not duplicated
  - Clean up (delete) the test page after the test
  - Mark with `@pytest.mark.integration`

---

## Phase 5 — Documentation

- [ ] Rewrite `README.md`:
  - Project overview and purpose
  - Prerequisites (Python 3.9+, Jira / Confluence access)
  - Setup steps (clone → copy `.env.example` → install deps)
  - CLI usage examples (`--dry-run`, `--date`, `--board-id`)
  - Expected output description
- [ ] Add per-variable inline comments to `.env.example` explaining each setting
- [ ] Add docstrings to all public methods in `jira_client.py` _(tracked in 2a above)_
- [ ] Add docstrings to all public methods in `confluence_client.py` _(tracked in 2d above)_
- [ ] Add docstrings to all public functions in `report_builder.py` _(tracked in 2b above)_
- [ ] Add module-level docstring to `formatter.py` _(tracked in 2c above)_

---

## Phase 6 — Post-MVP: Scheduling

- [ ] Create `schedule/` directory
- [ ] Add `windows_task.xml` — Task Scheduler XML template (weekly trigger, Friday 17:00, `python main.py`)
- [ ] Add `cron_example.txt` — cron expression and command for Linux / macOS
- [ ] Create `SCHEDULING.md` with step-by-step setup instructions for both platforms
- [ ] Consider wrapping in a minimal `Dockerfile` for portable, dependency-isolated execution
