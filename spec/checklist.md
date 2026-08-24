# WSRG-001 Implementation Checklist

**Reviewed:** 2026-08-25  
**Specification:** [specification.md](specification.md)  
**Scope:** Current repository implementation, including the legacy Python report generator and the newer React/Express/PostgreSQL foundation.

## How to read this checklist

- **Implemented** means the behavior is present in the current code path.
- **Partial** means only a prototype/legacy path exists, or an important part of the contract is missing.
- **Missing** means no relevant implementation was found.
- **Works** is **Yes** only when the behavior is demonstrated by an executable check or is a directly verified local behavior. **Unverified** means code exists but there is no automated test or reliable runtime evidence. **No** means the implementation contradicts the requirement or cannot satisfy the stated workflow.

## 1. Time and Report Identity

| Requirement | Implemented? | Works? | Evidence and finding |
|---|---|---|---|
| **T-001:** Canonical title is `Weekly Status Report - YYYY-MM-DD`. | Partial | No | `main.py` creates an em dash title (`Weekly Status Report — ...`); the Node web path has no title generation. |
| `reportDate` is a UTC `YYYY-MM-DD` calendar date. | Partial | Unverified | `main.py` and `report_builder.py` use `datetime.utcnow()`, but there is no web request validation or end-to-end test. |
| Report period is explicit UTC start inclusive/end exclusive, covering seven calendar days. | Missing | No | `report_generator/jira_client.py` uses Jira `updated >= -7d`; no explicit period boundaries are passed. |
| Omitted report date defaults to the current UTC date. | Partial | Unverified | Implemented only by the Python CLI; no web API equivalent. |
| Timestamps are stored in UTC and displayed with explicit UTC semantics. | Missing | No | No persistence schema exists; displayed dates do not identify UTC. |
| Historical generation uses explicit boundaries and never relative Jira expressions. | Missing | No | The completed-issue JQL directly uses `-7d`. |

## 2. User Scenarios and Acceptance Criteria

| Requirement | Implemented? | Works? | Evidence and finding |
|---|---|---|---|
| Scenario 1 retrieves the configured active sprint and required issue data. | Partial | Unverified | Python Jira client has retrieval methods; the web backend registers only health. |
| Frontend displays report sections in defined order. | Missing | No | `frontend/src/App.jsx` contains a dashboard placeholder; no report rendering. |
| Response includes sprint dates, RAG, story points, ticket totals, and completion. | Partial | Unverified | Python `build_report()` returns most metrics; no API response exposes them. |
| Frontend shows loading state during report retrieval. | Missing | No | Loading exists only for the health page. |
| No active sprint gives a clear UI message and publishes nothing. | Partial | No | Python raises an exception; no API/UI handling exists. |
| Scenario 2 includes all nine report sections. | Partial | Unverified | Python formatter has nine renderers; the web application has none. |
| Completed issues contain ID, summary, assignee, story points, and resolved date. | Implemented | Unverified | `report_generator/report_builder.py` and `formatter.py` produce these fields in the legacy path. |
| In-progress items contain ID, summary, assignee, status, percentage complete, and optional due date. | Partial | No | Legacy output omits percentage complete. |
| Blockers contain ID, summary, description, assignee, and optional flagged-since date. | Implemented | Unverified | Legacy builder/formatter produce these fields, subject to Jira response shape. |
| Empty collections show `None this sprint` or equivalent. | Missing | No | Formatter renders em-dash cells rather than an explicit no-data message. |
| Calculations belong to backend domain logic. | Partial | Unverified | Calculations exist in Python; the specified Node services are empty and no web route uses them. |
| Scenario 3 previews the same structured data that would be published. | Missing | No | Preview page and backend route are placeholders/missing. |
| Preview does not create or modify a Confluence page. | Missing | No | No preview workflow exists to verify this boundary. |
| Backend returns JSON, Markdown, or Storage Format preview. | Missing | No | No preview endpoint. |
| Preview identifies the proposed hyphenated page title. | Missing | No | Only the legacy CLI emits a differently formatted title. |
| Scenario 4 requires explicit user action to publish. | Partial | No | CLI publishes unless `--dry-run`; there is no web publish action or persisted report workflow. |
| Publishing creates one child page under parent `2916852142`. | Partial | No | Python creates a child when absent, but updates an existing same-title page; no Node route. |
| Page title follows the canonical format. | Missing | No | Legacy title uses an em dash. |
| Page content uses Confluence Storage Format/XHTML. | Partial | Unverified | Python formatter creates Storage-like XHTML; no web publish path or integration test. |
| Success shows Confluence URL or page identifier. | Partial | Unverified | Python logs a URL; frontend has no publish response handling. |
| Jira failure prevents publishing. | Partial | Unverified | Python exits before publish on Jira exception; no API test. |
| Confluence failure returns a clear error and saves Markdown fallback. | Missing | No | Python logs and exits; it does not save fallback content. |
| Scenario 5 reports application and database readiness separately. | Implemented | Unverified | `backend/src/app.js` returns separate `application` and `database` readiness fields; no health test exists. |

## 3. Functional Requirements

| ID | Requirement | Implemented? | Works? | Evidence and finding |
|---|---|---|---|---|
| FR-001 | Retrieve active sprint for configured board. | Partial | Unverified | `JiraClient.get_active_sprint()` exists in Python; Node client/service/routes are empty. |
| FR-002 | Retrieve completed issues within explicit report period. | Missing | No | Python uses `updated >= -7d`, not calculated UTC boundaries. |
| FR-003 | Retrieve in-progress active-sprint items. | Partial | Unverified | Python retrieves all open-sprint issues and filters `indeterminate` in `build_report()`. |
| FR-004 | Retrieve flagged and Blocker-priority issues. | Partial | Unverified | Python `get_blockers()` has the required JQL; no web path/tests. |
| FR-005 | Discover team members from sprint assignees. | Partial | Unverified | Python workload is derived from assignees; no `team_members` persistence or web path. |
| FR-006 | Retrieve bug-opened and bug-closed values. | Partial | Unverified | Python `get_bug_trend()` counts sprint bugs and Done bugs; no tests. |
| FR-007 | Retrieve committed/completed values for five sprints. | Partial | Unverified | Python uses `VELOCITY_SPRINTS` and closed sprint queries; no web path/tests. |
| FR-008 | Retrieve priority-ordered next-sprint issues. | Partial | Unverified | Python uses `futureSprints() ORDER BY priority ASC`; no web path/tests. |
| FR-009 | Calculate remaining work and zero-safe completion percentages. | Partial | Unverified | Python guards zero committed points and zero tickets; no unit tests and no web implementation. |
| FR-010 | Determine RAG using documented business rules. | Partial | No | Python hardcodes 80/50 thresholds, while the specification leaves thresholds as an unresolved decision and does not document the rule. |
| FR-011 | Create structured report object before formatting. | Partial | Unverified | Python `build_report()` returns a dictionary before formatting; Node report service is empty. |
| FR-012 | React views for preview, details, and publish status. | Partial | No | Routes exist in `App.jsx`, but Preview and Publish Status are placeholders and details are absent. |
| FR-013 | JSON endpoints for health, current sprint, preview, retrieval, and publishing. | Missing | No | Only `GET /api/health` is registered; `reportRoutes.js` is empty. |
| FR-014 | Stable field names and explicit HTTP status codes. | Partial | Unverified | Health has a basic stable shape and 200/503; report contracts do not exist. |
| FR-015 | Field-level safe validation errors. | Missing | No | No validation or error middleware exists. |
| FR-016 | Loading, success, empty, and recoverable-error states for every remote workflow. | Missing | No | Only health has minimal loading/error behavior. |
| FR-017 | Frontend never calls Jira or Confluence directly. | Implemented | Unverified | Current frontend calls only `VITE_API_URL`; report calls are not implemented. |
| FR-018 | Persist report metadata and status in PostgreSQL 15. | Missing | No | No database schema, repository, or report persistence code exists. |
| FR-019 | Record generated, previewed, published, and fallback lifecycle states. | Missing | No | No report lifecycle implementation exists. |
| FR-020 | Save Markdown fallback on Confluence failure. | Missing | No | No fallback write exists. |
| FR-021 | Repeatable migrations initialize a fresh PostgreSQL container. | Missing | No | `database/migrations/` does not exist and Compose runs no migration step. |

## 4. Required API Endpoints and HTTP Behavior

| Endpoint/behavior | Implemented? | Works? | Evidence and finding |
|---|---|---|---|
| `GET /api/health` | Implemented | Unverified | Registered in `backend/src/app.js`; depends on a live configured database and has no automated test. |
| `GET /api/sprints/current` | Missing | No | No route. |
| `GET /api/reports/preview` | Missing | No | No route. |
| `GET /api/reports/:reportId` | Missing | No | No route. |
| `POST /api/reports` | Missing | No | No route. |
| `POST /api/reports/:reportId/publish` | Missing | No | No route. |
| Successful reads return 200 and report creation returns 201. | Partial | No | Only health can return 200; no creation route. |
| Invalid input returns 400; missing report 404; unavailable dependency 503; unexpected error 500. | Missing | No | No report routes, validation, or centralized error handling. |
| Errors use `{ error: { code, message, fields } }`. | Missing | No | Health errors are not in this shape and report errors do not exist. |
| Jira/Confluence credentials stay server-side. | Partial | Unverified | Python clients are server-side and frontend has no third-party calls; the required Node integration boundary is absent. |

## 5. Report Content Contract

| Section/field requirement | Implemented? | Works? | Evidence and finding |
|---|---|---|---|
| Nine sections exist in the specified order. | Partial | Unverified | Legacy `to_confluence_storage()` emits all nine headings in order; not available from the web app. |
| Executive Summary includes sprint identity/dates, RAG, committed/completed/remaining points, completion, highlight, and risk. | Partial | No | Legacy formatter includes identity, RAG, metrics, and completion but lacks highlight and risk. |
| Sprint Progress includes point and ticket committed/completed/remaining/% done. | Implemented | Unverified | Legacy formatter emits both rows and zero-safe ticket percentage. |
| Completed Issues has all five required columns. | Implemented | Unverified | Legacy formatter emits the required columns. |
| In-Progress Items has all six required columns. | Partial | No | Percentage done is missing from builder and formatter. |
| Blockers / Flagged Issues has all five required columns. | Implemented | Unverified | Legacy formatter emits required columns; comment body assumptions may fail on structured Jira bodies. |
| Team Workload has all five required columns. | Implemented | Unverified | Legacy workload and formatter emit assigned/completed/in-progress/story points. |
| Bug Trend has sprint, opened, closed, and net change. | Implemented | Unverified | Legacy client and formatter provide these values. |
| Velocity Trend has five sprint records and required values. | Partial | Unverified | Legacy path requests five by default, but count depends on available closed sprints and is not tested. |
| Next Sprint Goals are priority ordered with four required fields. | Implemented | Unverified | Legacy JQL and formatter provide the fields. |
| Empty report collections use explicit no-data states. | Missing | No | Legacy `_table()` renders em-dashes. |

## 6. External Integration Contract

| Requirement | Implemented? | Works? | Evidence and finding |
|---|---|---|---|
| Jira base URL, board 279935, project EPMCDMETST, and credentials are configurable. | Partial | Unverified | `.env.example` and Python client support the values; Node client is empty. |
| Jira quick filter 969968 is used. | Missing | No | No reference found in implementation or `.env.example`. |
| Jira uses email plus API token Basic Auth. | Partial | Unverified | Python uses `HTTPBasicAuth`; no Node implementation. |
| Required active-sprint JQL intent is implemented. | Partial | Unverified | Python has related open-sprint retrieval, but active sprint itself is retrieved through Agile API and the web path is missing. |
| Completed JQL uses explicit report boundaries. | Missing | No | Uses `-7d`. |
| Blocker JQL intent is implemented. | Partial | Unverified | Present in Python `get_blockers()`, absent from Node path. |
| Next-sprint JQL is priority ordered. | Partial | Unverified | Present in Python, absent from Node path. |
| Confluence base URL, parent 2916852142, and credentials are configurable. | Partial | Unverified | Python reads environment variables; Node client is empty. |
| A new child page is created for each run. | Missing | No | Python deliberately updates an existing same-title page. |
| New page title is canonical and content is Storage Format. | Partial | No | Storage-like formatting exists, but title is wrong and web publishing is absent. |

## 7. Data Model and Persistence

| Requirement | Implemented? | Works? | Evidence and finding |
|---|---|---|---|
| Logical entities Report, Sprint, Issue, Team Member, and Velocity Record. | Missing | No | No persistence/domain model for the specified Node application. |
| `reports` table and required lifecycle/content/reference columns. | Missing | No | No migrations or SQL. |
| `sprints` table and unique Jira sprint identifier. | Missing | No | No migrations or SQL. |
| `issues` table, unique Jira issue key, sprint foreign key, and nullable Jira fields. | Missing | No | No migrations or SQL. |
| `team_members` table and unique Jira user identifier. | Missing | No | No migrations or SQL. |
| `velocity_records` table, one record per sprint, and sprint relationship. | Missing | No | No migrations or SQL. |
| Report uniqueness `(report_date, sprint_id)`. | Missing | No | No schema constraint. |
| Foreign keys preserve entity relationships. | Missing | No | No schema. |
| UTC timestamps and reproducible calculation snapshots. | Missing | No | No schema or snapshot strategy implemented. |
| Ordered migrations under `database/migrations/`. | Missing | No | Directory does not exist. |

## 8. Error Handling

| Condition | Implemented? | Works? | Evidence and finding |
|---|---|---|---|
| Missing environment variables fail startup descriptively before external calls. | Partial | No | Python relies on `os.environ[...]` and raises `KeyError`; Node starts without required Jira/Confluence validation. |
| Jira unavailable logs timestamped failure, returns failure, and does not publish. | Partial | Unverified | Python catches and logs Jira failures before publish; no API response or test. |
| No active sprint returns a warning and does not generate/publish an empty page. | Partial | No | Python raises; required warning/API/UI behavior is absent. |
| Partial Jira data renders available fields and explicit no-data states. | Partial | No | Legacy formatter handles empty rows with em-dashes and assumes some nested fields. |
| Confluence unavailable logs failure, saves Markdown, and returns fallback status. | Missing | No | No fallback implementation. |
| Database unavailable reports readiness failure and prevents persistence operations. | Partial | Unverified | Health returns 503 when its database check fails; no persistence operations exist. |
| Invalid requests return safe field-level 4xx details. | Missing | No | No request validation. |
| Unexpected errors are generic to clients and detailed only in protected logs. | Missing | No | No API error middleware or structured diagnostic logging. |

## 9. Non-Functional Requirements

| Requirement | Implemented? | Works? | Evidence and finding |
|---|---|---|---|
| No credentials in source, browser code, images, logs, or API responses. | Partial | Unverified | `.env` is ignored and frontend has no credentials; no secret-redaction tests or complete history/log audit. |
| All upstream calls use HTTPS. | Partial | Unverified | Example URLs use HTTPS, but clients do not enforce the scheme and Node clients are absent. |
| External calls use bounded timeouts and bounded retries. | Partial | Unverified | Python requests use a 30-second timeout; no retries. |
| Failed publish does not discard report content. | Missing | No | No fallback persistence. |
| Report requests expose progress and do not block health checks. | Missing | No | Report workflow does not exist. |
| Core data/actions are keyboard accessible with semantic HTML and labels. | Partial | Unverified | Basic navigation and headings exist; report controls and accessibility tests are absent. |
| Frontend/backend/integration code follows maintainable folder conventions. | Partial | Unverified | Directory skeleton exists, but required modules are empty and migrations are absent. |
| Clean Compose startup is reproducible with documented environment variables. | Missing | No | Compose starts PostgreSQL/backend/frontend skeleton, but backend receives only `DATABASE_URL`, `.env.example` omits `DATABASE_URL`, and migrations/config validation are absent. |
| Logs include operation, timestamp, outcome, and correlation context without secrets. | Partial | No | Python has basic timestamped logs; Node logs startup and suppresses database error details, with no correlation context. |

## 10. Project Structure and Configuration

| Requirement | Implemented? | Works? | Evidence and finding |
|---|---|---|---|
| React 18 + Vite frontend exists under `frontend/`. | Implemented | Unverified | `frontend/package.json`, Vite config, and React entry files exist; build has not been run as part of this review. |
| Node 24 + Express 5 backend exists under `backend/`. | Implemented | Unverified | Dockerfile and package manifest use Node 24 image and Express 5. |
| Direct Jira/Confluence calls are only in `backend/src/clients/`. | Missing | No | Required Node client modules are empty; only legacy Python clients call upstream services. |
| Domain calculations/orchestration are in `backend/src/services/`. | Missing | No | Service directory is empty. |
| HTTP mapping is in `backend/src/routes/`. | Partial | Unverified | Health is in `app.js`; `reportRoutes.js` is empty. |
| `database/migrations/` exists with versioned schema changes. | Missing | No | Directory is absent. |
| `reports/` contains local fallback Markdown output. | Partial | Unverified | Directory and example/template files exist, but runtime fallback writes are absent. |
| Required environment variables are validated: Jira, Confluence, board/project, parent, velocity, and database. | Missing | No | `.env.example` omits `DATABASE_URL`; no centralized startup validation. |
| `.env` is ignored and `.env.example` has safe placeholders. | Implemented | Unverified | `.gitignore` ignores `.env`/`.env.*` while allowing `.env.example`; example contains placeholders, but tracking/history was not audited. |

## 11. Validation and Quality Gates

| Requirement | Implemented? | Works? | Evidence and finding |
|---|---|---|---|
| Unit tests cover normal, empty, partial, and failure calculations. | Missing | No | No test files or test script found. |
| Integration tests cover API validation, client failures, database readiness, and fallback persistence. | Missing | No | No backend tests or test runner. |
| Frontend tests cover rendering, loading, no-data, and publish feedback. | Missing | No | No frontend test files or test script. |
| External services are mocked/controlled in automated tests. | Missing | No | No automated tests or fixtures found. |
| `docker compose config` succeeds with documented placeholders. | Partial | Yes | `docker compose config` succeeds, but the rendered backend environment contains only `DATABASE_URL` and `PORT`; required Jira/Confluence placeholders and migrations are absent. |
| Clean Compose startup waits for healthy PostgreSQL before backend readiness. | Partial | Unverified | Backend depends on a healthy database container and health endpoint checks PostgreSQL; migrations and a startup verification are absent. |
| Linting, formatting, tests, and production builds pass. | Partial | No | `npm --prefix frontend run build` passes and backend syntax checks pass, but no lint/format/test scripts or automated suites exist. |
| Every acceptance criterion is automated or manually documented. | Missing | No | No acceptance evidence set or test documentation exists. |

## 12. Success Criteria

| Success criterion | Implemented? | Works? | Finding |
|---|---|---|---|
| Delivery Manager requests a current-sprint report from React. | Missing | No | Dashboard is a placeholder and no report endpoint exists. |
| Backend returns all nine sections from Jira data. | Missing | No | Legacy Python can format sections, but the specified backend does not expose them. |
| Displayed calculations match backend report model. | Missing | No | No frontend report model or integration. |
| User previews without publishing. | Missing | No | Preview route is a placeholder. |
| Explicit publish creates correctly titled Confluence child page. | Missing | No | No web publish route; legacy title and update behavior conflict with the requirement. |
| Jira failures prevent publishing with safe diagnostic. | Partial | Unverified | Legacy CLI aborts, but no safe API diagnostic or test. |
| Confluence failures produce local Markdown fallback. | Missing | No | Not implemented. |
| PostgreSQL persists report lifecycle metadata. | Missing | No | Not implemented. |
| Complete stack runs reproducibly through Compose. | Partial | Unverified | Container skeleton exists; required configuration, migrations, and verification are missing. |
| No credentials appear in source, browser output, API responses, or logs. | Partial | Unverified | Basic ignore/frontend boundary exists; no complete verification. |

## 13. Open Decisions Still Blocking Completion

The specification itself marks these as unresolved and they affect testability and implementation: RAG thresholds/overrides, database retention and calculation snapshot design, synchronous versus background generation, application authentication/authorization, and concrete response-time targets. The clarification and planning documents also identify unresolved migration tooling, fixture/seed strategy, API contracts, and frontend test placement.

## Review Conclusion

The repository has a usable foundation and a partially functioning legacy Python prototype, but the WSRG-001 first-release acceptance criteria are not met. The only specified web behavior currently present is the basic application/database health response, and even that lacks automated verification. The highest-priority gaps are the Node report services/routes, explicit date-boundary handling, persistence/migrations, fallback publishing, frontend workflow states, and automated tests.

## Gap Triage and Remediation

This section is the current disposition for every item previously marked `No` or `Unverified`. The original evidence tables remain as the baseline review; entries below record what was fixed and how the remaining work is classified.

### Implemented Now

These were real gaps in the existing executable path and are now addressed:

- **T-001 and FR-002:** The Python report path now validates ISO report dates and generates explicit UTC start-inclusive/end-exclusive Jira boundaries instead of `-7d`.
- **Report identity:** The Python title is now `Weekly Status Report - YYYY-MM-DD`.
- **Scenario 2 / report contract:** In-progress output now includes Jira progress percentage; executive output now includes a highlight and risk; empty formatted collections say `None this sprint`.
- **FR-009:** Zero story points and zero tickets remain division-safe, with an executable smoke check.
- **FR-020:** Confluence failure in the CLI now saves a dated Markdown fallback under `reports/`.
- **Configuration:** `.env.example` and the Compose backend service now contain safe placeholders for the required database, Jira, and Confluence settings.
- **Input safety:** Invalid CLI dates fail with a field-specific parser message before Jira access.
- **Partial Jira data:** Structured Jira comment bodies are handled without slicing a dictionary as a string.

### Real Gaps Still Requiring Implementation

These are required by the specification and are not out of scope. They remain open because the repository still lacks the web application’s production path:

- **Node backend:** Jira/Confluence clients, domain services, report orchestration, all report routes, stable API contracts, validation, and safe error middleware.
- **Persistence:** PostgreSQL report lifecycle storage, the five required tables, constraints/foreign keys, UTC timestamps, calculation snapshots, and repeatable migrations.
- **Web workflows:** Current-sprint generation, nine-section report rendering, preview formats, report retrieval, explicit publish action, publish result/fallback status, and loading/empty/error states.
- **Integration behavior:** Backend-only Jira/Confluence access, quick-filter handling, bounded retries/timeouts, safe upstream error mapping, and create-only publish semantics.
- **Acceptance proof:** Backend, frontend, integration, fixture, security-boundary, accessibility, and Compose clean-start tests.
- **Startup and operations:** Centralized required-environment validation, migration execution/order, fallback persistence through the web path, and structured correlation-aware logs.

### Explicitly Out of Scope

The specification explicitly excludes these, so they do not need implementation for WSRG-001:

- Multiple Jira-board aggregation.
- Editing or deleting previously published Confluence pages.
- Chart image generation.
- Detailed ticket-level drill-down pages beyond the required report tables.
- Manual team-roster management.
- User account management or role administration in the first release.

### Nice-to-Have

These are polish or operational enhancements that do not block the core report workflow once the required behavior is implemented:

- Richer retry/backoff and rate-limit tuning beyond the required bounded behavior.
- Visual charting of the already-available bug and velocity trend data; chart image generation remains out of scope.
- More detailed correlation dashboards and latency metrics after the required safe logs exist.
- Additional responsive visual polish and expanded browser/accessibility regression coverage after core screens are complete.
- Automated release-report aggregation for all quality-gate results.

### Updated Conclusion

The first remediation slice is verified by Python compilation, a report-builder/formatter smoke check, invalid-date rejection, backend syntax checks, the frontend production build, and `docker compose config`. The remaining unchecked core items are genuine implementation gaps in the specified React/Express/PostgreSQL application, not polish or scope exclusions.