# Implementation Tasks: Weekly Status Report Generator

**Task plan:** `spec/plan.md`  
**Specification:** `spec/specification.md`  
**Constitution:** `spec/constitution.md`  
**Status:** Ready after clarification decisions

## Task Workflow

Complete tasks in order within each phase. A task may begin only after its dependencies are complete. Each task must update the relevant specification traceability notes and include tests where behavior is introduced.

## Phase 0: Clarification Gate

### T-001: Resolve report identity and time rules

**Depends on:** None  
**References:** C-001, G-004, G-031

Decide the canonical page-title punctuation, report timezone, display format, and inclusive report-period boundaries.

**Acceptance criteria:** `spec/specification.md` contains one canonical title example, timezone, date format, and historical report-period rule.

### T-002: Define report calculation rules

**Depends on:** T-001  
**References:** G-001, G-002, G-003

Define RAG thresholds, completion formulas, null story-point handling, rounding, bug classification, bug windows, and reopened-bug behavior.

**Acceptance criteria:** Every calculated report field has a documented formula and an example input/output, including zero-denominator behavior.

### T-003: Define report lifecycle and rerun policy

**Depends on:** T-001  
**References:** C-002, C-004, C-005, G-012, G-013

Choose the preview, generated, published, and fallback state transitions; define duplicate prevention, retries, concurrency, and fallback reconciliation.

**Acceptance criteria:** The specification contains a state diagram or table showing allowed transitions and the behavior of repeated generation and publish requests.

### T-004: Resolve scope and trust boundary

**Depends on:** None  
**References:** G-008, G-009, G-029

Decide whether history, scheduling, authentication, authorization, and production deployment are first-release features.

**Acceptance criteria:** Each item is marked in scope or deferred, with an owner and a documented first-release behavior.

### T-005: Approve API contract strategy

**Depends on:** T-003, T-004  
**References:** G-011, G-014, G-015, G-016, A-001, A-002

Choose the API version prefix, contract format/location, health-check ownership, CORS policy, and error-code catalog.

**Acceptance criteria:** A contract location and versioning rule are recorded, and every listed endpoint has an owner and contract status.

### T-006: Approve database, Compose, and fallback decisions

**Depends on:** T-003, T-004  
**References:** G-017 through G-024, G-028, A-003 through A-005

Choose schema types and constraints, migration tool, snapshot strategy, retention, Compose services/ports/volumes, and fallback paths.

**Acceptance criteria:** The specification documents the database schema decision, migration command, Compose topology, and fallback volume mapping.

### M0: Clarification gate complete

**Depends on:** None

All clarification decisions required for implementation are resolved or explicitly deferred.

**Acceptance criteria:** T-001 through T-006 are complete; no blocking item in `spec/clarify.md` remains unresolved or unassigned.

## Phase 1: Backend Setup

### T-101: Create backend project structure

**Depends on:** M0  
**References:** Constitution Section 2, FR-013

Create `backend/src/clients`, `services`, `routes`, `formatters`, `backend/tests`, `database/migrations`, `reports`, and the API contract location.

**Acceptance criteria:** All required directories exist and each directory has a documented responsibility.

### T-102: Initialize backend runtime

**Depends on:** T-101  
**References:** Constitution Section 3

Initialize Node.js 24 LTS and Express 5 with package scripts for development, production, linting, formatting, and tests.

**Acceptance criteria:** The backend installs from a clean checkout and its version and quality scripts execute successfully.

### T-103: Configure backend code quality

**Depends on:** T-102  
**References:** Constitution Section 4, Section 8

Add the selected lint, format, and test configurations following the naming and file-organization rules.

**Acceptance criteria:** A deliberately formatted/linted test fixture is detected, and a valid backend file passes all configured checks.

### T-104: Add Docker Compose backend and database services

**Depends on:** T-102, T-006  
**References:** FR-021, Constitution Section 9

Add the backend Dockerfile and PostgreSQL 15 Compose service with documented ports, environment placeholders, network, and startup dependency.

**Acceptance criteria:** `docker compose config` succeeds and the backend and database services can start with safe placeholder configuration.

### T-105: Add database volume and fallback mount

**Depends on:** T-104  
**References:** FR-020, G-021

Configure persistent PostgreSQL storage and a writable, host-visible fallback report directory.

**Acceptance criteria:** Data survives a database container restart and a test fallback file is visible at the documented host path.

### T-106: Implement environment validation

**Depends on:** T-102, T-104  
**References:** FR-015, Constitution Section 5

Validate all required Jira, Confluence, database, and application variables before external API calls.

**Acceptance criteria:** Startup reports missing variable names without values and exits before any upstream request.

### T-107: Publish API contracts and error codes

**Depends on:** T-005, T-102  
**References:** FR-013 through FR-015

Document request/response schemas, date formats, enums, status codes, and stable error shape for every endpoint.

**Acceptance criteria:** Contract files validate successfully and include success and failure examples for every endpoint.

### T-108: Implement database migrations

**Depends on:** T-006, T-104  
**References:** FR-018, FR-019, FR-021, G-017

Implement migrations for reports, sprints, issues, team members, velocity records, and any approved snapshot/workload tables.

**Acceptance criteria:** A fresh PostgreSQL 15 database can be migrated repeatedly, and constraints reject invalid references and statuses.

### T-109: Implement data access and transactions

**Depends on:** T-108  
**References:** Constitution Section 5, G-023

Add parameterized queries, repositories, transaction boundaries, rollback behavior, and UTC timestamp handling.

**Acceptance criteria:** Database tests prove parameterization, relationship integrity, successful rollback, and UTC persistence.

### T-110: Implement backend health endpoint

**Depends on:** T-109, T-107  
**References:** Scenario 5, FR-013, G-014

Implement `GET /api/health` with separate application and database readiness fields.

**Acceptance criteria:** Healthy and database-failure cases return documented payloads and never expose credentials or raw upstream details.

### T-111: Add backend route placeholders

**Depends on:** T-107, T-110  
**References:** FR-013, G-006, G-007

Register sprint, report generation, preview, retrieval, and publish routes with validation and placeholder service boundaries.

**Acceptance criteria:** Every documented route is reachable, returns the documented temporary response or safe not-implemented status, and has a route test.

### M1: Backend foundation complete

**Depends on:** M0

The backend runtime, database, API contracts, migrations, and health endpoint are ready for frontend work.

**Acceptance criteria:** T-101 through T-111 pass; clean Compose startup, migrations, API contract tests, database tests, and health checks pass.

## Phase 2: Frontend Setup

### T-201: Initialize React frontend

**Depends on:** M1  
**References:** Constitution Section 3

Initialize React 18 with Vite and package scripts for development, production build, linting, formatting, and tests.

**Acceptance criteria:** The frontend installs and produces a successful production build from a clean checkout.

### T-202: Configure frontend container and quality tools

**Depends on:** T-201  
**References:** Constitution Sections 4 and 9

Add the frontend Dockerfile, linting, formatting, test runner, and development/production commands.

**Acceptance criteria:** The frontend container starts using documented Compose settings and all quality scripts pass on the starter shell.

### T-203: Create frontend folders and API client

**Depends on:** T-201, T-107  
**References:** Constitution Folder Conventions, FR-017

Create components, pages, and services folders and implement a single backend API client boundary.

**Acceptance criteria:** No frontend module calls Jira or Confluence directly, and API-client tests cover base URL and error normalization.

### T-204: Add frontend routes

**Depends on:** T-203  
**References:** FR-012, G-032

Add routes for Dashboard / Current Sprint, Report Preview, Publish Status, and Service Health.

**Acceptance criteria:** Each route loads directly and through in-app navigation, including browser refresh behavior.

### T-205: Build UI skeleton

**Depends on:** T-204  
**References:** FR-016, G-033, G-035

Create page headings, navigation, action placeholders, responsive layout regions, and accessible semantic structure.

**Acceptance criteria:** All four screens render at supported viewport sizes with keyboard-accessible navigation and no feature-specific business logic.

### T-206: Connect service health screen

**Depends on:** T-205, T-110  
**References:** Scenario 5, G-014

Connect the health screen to `/api/health` and render application/database readiness states.

**Acceptance criteria:** Healthy, loading, database-failure, and backend-unavailable fixtures produce distinct safe UI states.

### T-207: Add shared UI states and tests

**Depends on:** T-205  
**References:** FR-016, Constitution Section 8

Standardize loading, empty, success, and recoverable-error states and add component/routing tests.

**Acceptance criteria:** Tests cover each shared state and all frontend routes; lint, format, test, and build commands pass.

### M2: Frontend foundation complete

**Depends on:** M1

The React application shell, routes, API client, and shared UI states are ready for feature delivery.

**Acceptance criteria:** T-201 through T-207 pass; all routes load, health data renders, and the frontend communicates only through the backend API client.

## Phase 3: Feature Implementation

Each feature below must be completed, tested, and accepted before the next feature begins.

### T-301: Implement current sprint retrieval

**Depends on:** M2, T-111  
**References:** FR-001, Scenario 1

Implement the current-sprint service, route, API client call, and Dashboard display.

**Acceptance criteria:** A controlled Jira fixture produces the configured active sprint on the dashboard; no active sprint produces the documented empty state and no publish action.

### T-302: Implement sprint progress

**Depends on:** T-301, T-002  
**References:** FR-009, Report Sections 1-2

Implement story-point and ticket totals, remaining work, percentages, and zero-denominator behavior.

**Acceptance criteria:** Unit and API tests verify normal, zero, missing-estimate, and rounding cases; the dashboard displays the documented values.

### T-303: Implement completed issues

**Depends on:** T-302  
**References:** FR-002, Report Section 3

Retrieve issues completed in the resolved report period and render the completed-issues table.

**Acceptance criteria:** Fixture data appears with ticket ID, summary, assignee, story points, and resolved date; out-of-period issues are excluded.

### T-304: Implement in-progress items

**Depends on:** T-303  
**References:** FR-003, Report Section 4

Retrieve and render active work with status, completion value, assignee, and optional due date.

**Acceptance criteria:** Missing due dates and completion values render safely without changing table layout or causing an error.

### T-305: Implement blockers

**Depends on:** T-304  
**References:** FR-004, Report Section 5

Retrieve flagged and Blocker-priority issues and render blocker details.

**Acceptance criteria:** Both blocker sources are included once, duplicate issues are de-duplicated according to the resolved rule, and empty results show the no-data state.

### T-306: Implement team workload

**Depends on:** T-305  
**References:** FR-005, Report Section 6, G-019

Derive assignee-level assigned, completed, in-progress, and story-point totals.

**Acceptance criteria:** Workload totals reconcile with issue fixtures and the selected persistence/snapshot strategy is covered by tests.

### T-307: Implement bug trend

**Depends on:** T-306, T-002  
**References:** FR-006, Report Section 7, G-003

Implement approved bug classification and opened/closed/net calculations.

**Acceptance criteria:** Tests cover created, resolved, reopened, non-bug, and empty cases using the approved report period.

### T-308: Implement velocity trend

**Depends on:** T-307  
**References:** FR-007, Report Section 8

Retrieve and render committed/completed/velocity values for the last five sprints.

**Acceptance criteria:** At most five records are shown in the approved order, missing historical sprints are handled explicitly, and percentages match the calculation rule.

### T-309: Implement next sprint goals

**Depends on:** T-308, T-005  
**References:** FR-008, Report Section 9

Retrieve priority-ordered future-sprint issues and display the next-sprint goals.

**Acceptance criteria:** Issues are ordered by the approved priority rule, and no future sprint produces the documented empty state.

### T-310: Implement report model and formatters

**Depends on:** T-309  
**References:** FR-011, Scenario 3, C-001

Create the canonical structured report and render JSON, Markdown, and Confluence Storage Format from it.

**Acceptance criteria:** All nine sections appear in order and equivalent fixture data produces consistent content across all three formats.

### T-311: Implement report lifecycle and retrieval

**Depends on:** T-310, T-003, T-109  
**References:** FR-018, FR-019, G-007, G-020

Persist report states and implement report retrieval according to the approved lifecycle and history scope.

**Acceptance criteria:** Allowed state transitions succeed, invalid transitions fail safely, and retrieval returns the documented report metadata/content representation.

### T-312: Implement preview workflow

**Depends on:** T-310, T-311  
**References:** Scenario 3, FR-012, FR-013

Connect report preview API behavior to the Report Preview screen.

**Acceptance criteria:** Preview performs no Confluence write, displays the canonical title and all nine sections, and supports the approved output format.

### M3: Feature increments complete

**Depends on:** M2

The complete report workflow is implemented as independently accepted feature increments.

**Acceptance criteria:** T-301 through T-312 pass individually; every feature has normal, empty, partial, and failure coverage where applicable; the complete nine-section report is accepted.

## Phase 4: Integration and Testing

### T-401: Implement Jira client

**Depends on:** M3, T-005  
**References:** FR-001 through FR-008, G-025, G-027

Implement authenticated Jira access with the approved API version, pagination, field selection, board/project/filter semantics, timeouts, retries, and rate-limit handling.

**Acceptance criteria:** Client tests cover successful pagination, authentication failure, timeout, rate limit, malformed response, and partial data without logging secrets.

### T-402: Connect report features to Jira

**Depends on:** T-401  
**References:** FR-001 through FR-008

Replace feature fixtures with Jira client calls behind backend services.

**Acceptance criteria:** Each report section is populated through backend clients, and routes contain no direct Jira API calls or duplicated domain calculations.

### T-403: Implement Confluence publishing

**Depends on:** T-310, T-401, T-005  
**References:** Scenario 4, FR-013, G-025

Implement authenticated child-page creation with canonical title, parent page, XHTML content, timeout, retry, and safe error mapping.

**Acceptance criteria:** Controlled fixtures verify successful page creation, permission failure, timeout, rate limit, and safe response mapping.

### T-404: Enforce publish idempotency

**Depends on:** T-311, T-403, T-003  
**References:** C-002, G-013

Implement the approved duplicate prevention, idempotency key, state precondition, and concurrency behavior.

**Acceptance criteria:** Repeated and concurrent publish requests produce the approved number of Confluence pages and consistent database status.

### T-405: Implement fallback recovery

**Depends on:** T-105, T-403, T-003  
**References:** FR-020, C-005, G-021

Write Markdown fallback files on Confluence failure and implement the approved reconciliation or recovery path.

**Acceptance criteria:** Confluence failure creates a correctly named, readable, host-visible fallback; database and retry behavior match the documented availability matrix.

### T-406: Complete backend API workflow

**Depends on:** T-402, T-404, T-405  
**References:** Scenarios 1-5, FR-012 through FR-020

Connect generation, preview, retrieval, publishing, health, errors, and persistence through the final API routes.

**Acceptance criteria:** API integration tests verify every endpoint, status code, payload schema, validation error, dependency failure, and lifecycle transition.

### T-407: Complete frontend report workflow

**Depends on:** T-312, T-406  
**References:** Scenarios 1-4, FR-012, FR-016, G-033, G-034

Connect Dashboard, Preview, and Publish Status screens to the final APIs with progress, success, fallback, and error handling.

**Acceptance criteria:** A Delivery Manager can generate, review, and explicitly publish a report through the UI without third-party credentials appearing in browser requests or responses.

### T-408: Add integration and end-to-end fixtures

**Depends on:** T-406, T-407  
**References:** Constitution Section 8, G-041

Add controlled Jira, Confluence, and PostgreSQL fixtures for normal, empty, partial, timeout, authentication, rate-limit, and failure workflows.

**Acceptance criteria:** End-to-end tests run without live third-party services and cover generate, preview, publish, and fallback paths.

### T-409: Add security and secret-boundary tests

**Depends on:** T-406, T-407  
**References:** Constitution Section 5, G-040

Verify secret redaction in logs, errors, API responses, container configuration, and browser-visible data.

**Acceptance criteria:** Tests fail when a token appears in frontend bundles, network payloads, serialized errors, or captured logs.

### T-410: Add accessibility and responsive tests

**Depends on:** T-407, T-004  
**References:** Constitution Section 7, G-035, G-036

Test the approved WCAG target, keyboard navigation, screen-reader labels, supported browsers, and viewport behavior.

**Acceptance criteria:** Automated accessibility checks and documented browser/viewport checks pass for all required screens.

### T-411: Add performance and observability checks

**Depends on:** T-406, T-004  
**References:** G-030, G-042

Add approved response-time tests, structured logs, correlation IDs, metrics, and upstream-latency assumptions.

**Acceptance criteria:** Tests report against documented dataset sizes and targets, and logs contain required context without sensitive data.

### T-412: Validate Compose operations

**Depends on:** T-104, T-108, T-405, T-406  
**References:** FR-021, G-028, G-043

Verify clean startup, migration ordering, health checks, volumes, restart behavior, and fallback persistence.

**Acceptance criteria:** A clean checkout with no existing volumes starts the stack, applies migrations, reports readiness, and completes a controlled report workflow.

### T-413: Run release quality gates

**Depends on:** T-408 through T-412  
**References:** Constitution Section 8, Success Criteria

Run linting, formatting, unit tests, integration tests, frontend/backend builds, contract validation, security tests, accessibility tests, performance tests, and Compose validation.

**Acceptance criteria:** All required commands pass and their results are recorded with the release candidate.

### T-414: Publish operational documentation

**Depends on:** T-412, T-413  
**References:** Constitution Section 9, G-026, G-029

Document prerequisites, environment setup, migrations, local startup, token provisioning/rotation, fallback recovery, backup, retention, and deployment.

**Acceptance criteria:** A new developer can run the stack from a clean checkout using only the documented steps and safe placeholder configuration.

### M4: Integrated release complete

**Depends on:** M3

External integrations, end-to-end behavior, and release quality checks are complete.

**Acceptance criteria:** T-401 through T-414 pass; all first-release success criteria are demonstrated, no secrets are exposed, and the clean-start acceptance run succeeds.

## Traceability Checklist

- [ ] T-001 through T-006 resolve all clarification blockers.
- [ ] FR-001 through FR-021 map to one or more completed tasks.
- [ ] Scenarios 1 through 5 have automated acceptance coverage.
- [ ] All nine report sections have feature and formatting tests.
- [ ] Constitution security, folder, testing, and Docker rules are verified.
- [ ] All M0 through M4 milestone exit conditions pass.
