# Specification: Weekly Status Report Generator

**Spec ID:** WSRG-001  
**Version:** 1.0  
**Status:** Draft for implementation  
**Constitution:** `spec/constitution.md`  
**Source specification:** `project_spec.md`

## 1. Summary

Build a web application that retrieves the active Jira sprint for one configured board, calculates weekly delivery metrics, presents an executive-friendly status report, and publishes one new report page under a configured Confluence parent page.

The application shall provide a React 18 + Vite frontend, a Node.js 24 LTS + Express 5 backend, and PostgreSQL 15 persistence running through Docker Compose.

### T-001 Report Identity and Time Decisions

- The canonical Confluence page title is `Weekly Status Report - YYYY-MM-DD`.
- `reportDate` is an ISO `YYYY-MM-DD` calendar date interpreted in UTC.
- The report period is the seven-day UTC interval from `reportDate - 6 calendar days at 00:00:00` through `reportDate + 1 calendar day at 00:00:00`, with the start inclusive and end exclusive.
- When `reportDate` is omitted, the system uses the current UTC calendar date.
- Timestamps are stored in UTC and displayed as ISO date or datetime values with explicit UTC semantics.
- Historical report generation uses these explicit boundaries; it shall not use relative Jira expressions such as `-7d`.

## 2. Problem and Users

### Problem

The Delivery Manager currently spends manual effort gathering Jira data, calculating sprint metrics, formatting an executive report, and publishing it to Confluence. The process is repetitive and can produce inconsistent results.

### Primary User

The primary user is the Delivery Manager, who generates, reviews, and publishes the weekly report.

### Report Audience

Executive and C-level stakeholders consume the published report. They need a concise summary of delivery status, completion, risks, workload, and upcoming goals.

## 3. Goals

- Generate a consistent weekly report from live Jira data.
- Allow the Delivery Manager to preview a report before publishing.
- Publish one dated child page to Confluence on explicit user confirmation.
- Preserve a local Markdown fallback when Confluence is unavailable.
- Make report generation repeatable, observable, and suitable for scheduled execution.

## 4. Scope

### In Scope

- One configured Jira board and project.
- The active sprint and a preview of the next sprint.
- Automatic team-member discovery from sprint assignees.
- Five-sprint velocity trend data.
- Report preview in the web interface.
- Publishing a new Confluence child page per run.
- PostgreSQL storage for generated report metadata and local fallback references.
- Docker Compose-based local development for frontend, backend, and PostgreSQL.

### Out of Scope

- Aggregating multiple Jira boards.
- Editing or deleting previously published Confluence pages.
- Chart image generation.
- Detailed ticket-level drill-down pages beyond the required report tables.
- Manual team-roster management.
- User account management or role administration in the first release.

## 5. User Scenarios and Acceptance Criteria

### Scenario 1: View the Current Sprint Report

**As a** Delivery Manager,  
**I want** to request the current sprint report,  
**so that** I can review delivery status in one place.

**Acceptance criteria:**

- Given the backend and database are ready and Jira is reachable, when the user requests the current report, then the backend retrieves the configured active sprint and required issue data.
- The frontend displays the report sections in the defined order.
- The response includes the sprint name, start date, end date, RAG status, story-point totals, ticket totals, and completion percentage.
- The frontend shows a loading state while data is being retrieved.
- If no active sprint exists, the frontend shows a clear no-active-sprint message and no report is published.

### Scenario 2: Review Report Details

**As a** Delivery Manager,  
**I want** to inspect the calculated report tables,  
**so that** I can identify progress, risks, workload, and next-sprint priorities.

**Acceptance criteria:**

- The report includes all nine sections defined in Section 7.
- Completed issues show ticket ID, summary, assignee, story points, and resolved date.
- In-progress items show ticket ID, summary, assignee, status, percentage complete, and due date where available.
- Blockers show ticket ID, summary, blocker description, assignee, and flagged-since date where available.
- Empty collections render an explicit `None this sprint` or equivalent no-data state.
- Calculations are performed by backend domain logic and are not reimplemented in the frontend.

### Scenario 3: Preview Before Publishing

**As a** Delivery Manager,  
**I want** to preview the formatted report,  
**so that** I can verify its contents before creating a Confluence page.

**Acceptance criteria:**

- The preview uses the same structured report data that would be published.
- Preview does not create or modify a Confluence page.
- The user can request a Markdown or Confluence Storage Format representation from the backend.
- The preview identifies the proposed page title in the format `Weekly Status Report - YYYY-MM-DD`.

### Scenario 4: Publish the Report

**As a** Delivery Manager,  
**I want** to explicitly publish an approved report,  
**so that** stakeholders can access it in Confluence.

**Acceptance criteria:**

- Publishing requires an explicit user action after preview or report generation.
- The backend creates one child page under Confluence parent page `2916852142`.
- The page title follows `Weekly Status Report - YYYY-MM-DD`.
- The page uses Confluence Storage Format (XHTML).
- On success, the frontend displays the Confluence page URL or page identifier.
- A Jira failure prevents publishing.
- A Confluence failure returns a clear error and saves the generated report locally as a Markdown fallback.

### Scenario 5: Diagnose Service Health

**As a** Delivery Manager or operator,  
**I want** to see application and dependency readiness,  
**so that** I can diagnose failures before attempting a report run.

**Acceptance criteria:**

- `GET /api/health` reports application readiness and database readiness separately.
- The health response does not expose credentials or sensitive upstream details.
- A database-unavailable state is distinguishable from an application-unavailable state.

## 6. Functional Requirements

### Report Generation

- **FR-001:** The system shall retrieve the active sprint for the configured Jira board.
- **FR-002:** The system shall retrieve data for completed issues whose qualifying Jira timestamp falls within the explicit seven-day report period derived from `reportDate`.
- **FR-003:** The system shall retrieve in-progress items for the active sprint.
- **FR-004:** The system shall retrieve flagged issues and issues with Blocker priority.
- **FR-005:** The system shall discover team members from sprint assignees.
- **FR-006:** The system shall retrieve bug-opened and bug-closed values needed for the bug trend.
- **FR-007:** The system shall retrieve committed and completed values for the last five sprints.
- **FR-008:** The system shall retrieve priority-ordered issues from the next sprint.
- **FR-009:** The system shall calculate remaining work and completion percentages without division-by-zero errors.
- **FR-010:** The system shall determine an overall RAG status using documented business rules.
- **FR-011:** The system shall generate a structured report object before formatting it for the frontend or Confluence.

### Frontend and API

- **FR-012:** The React frontend shall provide views for report preview, report details, and publish status.
- **FR-013:** The backend shall expose JSON endpoints for health, current sprint report, report preview, report retrieval, and report publishing.
- **FR-014:** API responses shall use stable field names and explicit HTTP status codes.
- **FR-015:** API validation errors shall identify the invalid request field without exposing secrets.
- **FR-016:** The frontend shall provide loading, success, empty, and recoverable error states for every remote workflow.
- **FR-017:** The frontend shall not call Jira or Confluence directly.

### API Endpoints

The backend shall expose these endpoints under `/api`:

| Method | Endpoint | Request | Response | Purpose |
|---|---|---|---|---|
| `GET` | `/api/health` | None | Application and database readiness | Verify service health without exposing secrets. |
| `GET` | `/api/sprints/current` | Optional `date` query parameter | Active sprint summary and source metadata | Retrieve the configured active sprint. |
| `GET` | `/api/reports/preview` | Optional `date` query parameter and `format` (`json`, `markdown`, or `storage`) | Structured report or formatted preview | Generate a report without publishing. |
| `GET` | `/api/reports/:reportId` | `reportId` path parameter | Stored report metadata and report content reference | Retrieve a previously generated report. |
| `POST` | `/api/reports` | Optional report date and generation options | Created report identifier and structured report | Generate and persist a report. |
| `POST` | `/api/reports/:reportId/publish` | `reportId` path parameter | Publish status, Confluence page ID, and URL | Explicitly publish one generated report. |

API behavior:

- Successful reads shall return `200`; successful report creation shall return `201`.
- Invalid input shall return `400`; missing reports shall return `404`; unavailable dependencies shall return `503`; unexpected failures shall return `500`.
- Error responses shall use a stable shape: `{ "error": { "code": "...", "message": "...", "fields": {} } }`.
- The frontend sends requests to the backend only. Jira and Confluence calls happen server-side and their credentials never cross the API boundary.

### UI Screens

The React application shall provide these screens:

| Screen | User sees | Primary actions |
|---|---|---|
| Dashboard / Current Sprint | Sprint dates, RAG status, completion metrics, highlights, risks, and report sections | Generate or refresh the current report; open preview. |
| Report Preview | The complete nine-section report in readable tables, proposed title, data timestamp, and source status | Return to dashboard; proceed to publish. |
| Publish Status | Publishing progress, success confirmation with Confluence link, or fallback/error status | Retry an eligible publish; open the fallback reference. |
| Service Health | Application, database, Jira, and Confluence readiness indicators with safe messages | Refresh health checks. |

Each screen shall define loading, empty, error, and success states. The UI shall not display API tokens or raw upstream error payloads.

### Persistence and Fallback

- **FR-018:** The backend shall persist generated report metadata and report status in PostgreSQL 15.
- **FR-019:** The system shall record whether a report was generated, previewed, published, or saved as a fallback.
- **FR-020:** The system shall save a Markdown fallback when Confluence publishing fails.
- **FR-021:** Database migrations shall initialize a fresh PostgreSQL container repeatably.

## 7. Report Content Contract

The generated report shall contain these sections in this order:

1. **Executive Summary:** sprint name, sprint dates, overall RAG status, committed/completed/remaining story points, completion percentage, one-line highlight, and one-line risk.
2. **Sprint Progress:** committed, completed, remaining, and percentage done for story points and total tickets.
3. **Completed Issues:** ticket ID, summary, assignee, story points, and resolved date.
4. **In-Progress Items:** ticket ID, summary, assignee, status, percentage done, and due date.
5. **Blockers / Flagged Issues:** ticket ID, summary, blocker description, assignee, and flagged-since date.
6. **Team Workload:** assignee, assigned tickets, completed tickets, in-progress tickets, and story points.
7. **Bug Trend:** sprint, bugs opened, bugs closed, and net change.
8. **Velocity Trend:** sprint name, committed points, completed points, and velocity percentage for the last five sprints.
9. **Next Sprint Goals:** priority-ordered ticket ID, summary, priority, and story points.

## 8. External Integration Contract

### Jira

- Base URL: `https://jiraeu.epam.com`
- Board ID: `279935`
- Project key: `EPMCDMETST`
- Quick filter: `969968`
- Authentication: email plus API token using HTTP Basic Auth.
- Credentials shall be loaded by the backend from environment variables.

Required query intent:

```text
Active sprint: project = EPMCDMETST AND sprint in openSprints()
Completed in report period: project = EPMCDMETST AND sprint in openSprints() AND status = Done AND updated >= "{periodStartUtc}" AND updated < "{periodEndUtc}"
Blockers: project = EPMCDMETST AND sprint in openSprints() AND (flagged = Impediment OR priority = Blocker)
Next sprint: project = EPMCDMETST AND sprint in futureSprints() ORDER BY priority ASC
```

### Confluence

- Base URL: `https://kb.epam.com`
- Parent page ID: `2916852142`
- Parent page title: `Test page`
- Authentication: email plus API token using HTTP Basic Auth.
- New page title: `Weekly Status Report - YYYY-MM-DD`
- Content format: Confluence Storage Format (XHTML).

## 9. Data Model

The first release shall support these logical entities:

- **Report:** identifier, report date, sprint identity, status, generated timestamp, published timestamp, Confluence page reference, and fallback file reference.
- **Sprint:** Jira sprint identifier, name, start date, end date, state, committed points, completed points, and remaining points.
- **Issue:** Jira ticket ID, summary, status, assignee, priority, story points, issue type, due date, resolved date, blocker description, and flagged-since date.
- **Team Member:** Jira user identifier, display name, assigned issue count, completed count, in-progress count, and story points.
- **Velocity Record:** sprint name, committed points, completed points, and velocity percentage.

### Relational Storage Model

PostgreSQL 15 shall store the following tables. Every table shall have a generated primary key unless a stable external identifier is explicitly used.

| Table | Required columns | Relationships and constraints |
|---|---|---|
| `reports` | `id`, `report_date`, `sprint_id`, `status`, `content_markdown`, `created_at`, `published_at`, `confluence_page_id`, `confluence_page_url`, `fallback_file_path` | `status` is one of `generated`, `previewed`, `published`, or `fallback`; unique `(report_date, sprint_id)` prevents accidental duplicate reports. |
| `sprints` | `id`, `jira_sprint_id`, `name`, `start_date`, `end_date`, `state`, `committed_points`, `completed_points`, `remaining_points`, `created_at` | `jira_sprint_id` is unique; report records reference the sprint. |
| `issues` | `id`, `jira_issue_key`, `sprint_id`, `summary`, `status`, `assignee_id`, `priority`, `story_points`, `issue_type`, `due_date`, `resolved_date`, `blocker_description`, `flagged_since`, `updated_at` | `jira_issue_key` is unique; `sprint_id` references `sprints`; nullable fields are allowed when Jira has no value. |
| `team_members` | `id`, `jira_user_id`, `display_name`, `created_at` | `jira_user_id` is unique; issues reference the member when assigned. |
| `velocity_records` | `id`, `sprint_id`, `committed_points`, `completed_points`, `velocity_percentage`, `created_at` | One record per sprint; `sprint_id` references `sprints`. |

Database rules:

- Foreign keys shall preserve report, sprint, issue, team-member, and velocity-record relationships.
- Timestamps shall be stored consistently in UTC.
- Metrics persisted in the database shall be reproducible from stored source data or include the calculation snapshot used to produce them.
- Schema changes shall be introduced through ordered migrations in `database/migrations/`.

## 10. Error Handling

| Condition | Required behavior |
|---|---|
| Missing environment variable | Fail startup validation with a descriptive error before any external API call. |
| Jira unavailable | Log a timestamped error, return failure, and do not publish. |
| No active sprint | Return a warning and do not generate or publish an empty page. |
| Partial Jira data | Render available data and explicit no-data states for missing sections or fields. |
| Confluence unavailable | Log the failure, save the generated Markdown report locally, and return fallback status. |
| Database unavailable | Report database readiness failure and prevent operations requiring persistence. |
| Invalid request | Return a 4xx response with safe, field-level validation details. |
| Unexpected backend error | Return a generic safe error to the client and retain diagnostic details only in protected logs. |

## 11. Non-Functional Requirements

- **Security:** No credentials in source, browser code, images, logs, or API responses. All upstream calls use HTTPS.
- **Reliability:** External calls use bounded timeouts and bounded retries. A failed publish shall not discard generated report content.
- **Performance:** A report request shall return a clear progress state and shall not block unrelated health requests. Performance targets shall be measured during implementation planning.
- **Accessibility:** Core report data and actions shall be keyboard accessible and represented with semantic HTML and accessible labels.
- **Maintainability:** Frontend components, backend routes, integration clients, and domain services shall follow the folder and naming conventions in the constitution.
- **Reproducibility:** The frontend, backend, and PostgreSQL 15 services shall start from a clean checkout with Docker Compose and documented environment variables.
- **Observability:** Logs shall include operation type, timestamp, outcome, and correlation context without secrets or unnecessary personal data.

## 12. Project Structure Contract

```text
hello-genai/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── services/
├── backend/
│   ├── src/
│   │   ├── clients/
│   │   ├── services/
│   │   ├── routes/
│   │   └── formatters/
│   └── tests/
├── database/
│   └── migrations/
├── reports/
├── spec/
├── .env.example
├── docker-compose.yml
└── README.md
```

- `frontend/` shall contain the React 18 + Vite application only.
- `backend/src/clients/` shall be the only location for direct Jira and Confluence calls.
- `backend/src/services/` shall own report calculations and orchestration.
- `backend/src/routes/` shall map HTTP requests to services.
- `database/migrations/` shall contain versioned schema changes.
- `reports/` shall contain local fallback Markdown output.

## 13. Configuration Contract

The backend shall require these environment variables before startup:

```text
JIRA_BASE_URL
JIRA_EMAIL
JIRA_API_TOKEN
CONFLUENCE_BASE_URL
CONFLUENCE_EMAIL
CONFLUENCE_API_TOKEN
JIRA_BOARD_ID
JIRA_PROJECT_KEY
CONFLUENCE_PARENT_PAGE_ID
VELOCITY_SPRINTS
DATABASE_URL
```

`.env` shall be ignored by Git. `.env.example` shall contain variable names and safe placeholder values only.

## 14. Validation and Quality Gates

- Unit tests shall cover report calculations for normal, empty, partial, and failure inputs.
- Integration tests shall cover API validation, Jira/Confluence client failure handling, database readiness, and fallback persistence.
- Frontend tests shall cover report rendering, loading states, no-data states, and publish feedback.
- External services shall be mocked or replaced with controlled fixtures in automated tests.
- `docker compose config` shall succeed with documented placeholder configuration.
- A clean Compose startup shall make PostgreSQL healthy before the backend reports database readiness.
- Linting, formatting, automated tests, and production builds shall pass for affected applications.
- No acceptance criterion is complete until its behavior is demonstrated by an automated test or documented manual verification.

## 15. Success Criteria

The first release is successful when:

- A Delivery Manager can request a current-sprint report from the React application.
- The backend retrieves Jira data and returns all nine required report sections.
- The displayed calculations match the backend report model.
- The user can preview the report without publishing.
- An explicit publish action creates one correctly titled Confluence child page.
- Jira failures prevent publishing and provide a safe diagnostic message.
- Confluence failures produce a local Markdown fallback.
- PostgreSQL persists report lifecycle metadata.
- The complete stack runs reproducibly through Docker Compose.
- No credentials appear in source control, browser output, API responses, or logs.

## 16. Open Decisions Before Planning

The following decisions must be resolved during clarification or technical planning before implementation:

- Exact RAG calculation thresholds and whether users may override them.
- Database schema details and retention period for generated report metadata.
- Whether report generation should run synchronously or through a background job for large sprints.
- Authentication and authorization for the web application beyond the initial trusted environment.
- Concrete response-time targets for report generation and preview.
