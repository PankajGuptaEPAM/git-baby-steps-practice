# Implementation Plan: Weekly Status Report Generator

**Plan ID:** WSRG-PLAN-001  
**Specification:** `spec/specification.md`  
**Constitution:** `spec/constitution.md`  
**Clarifications:** `spec/clarify.md`  
**Status:** Proposed

## 1. Delivery Strategy

Implement the application as a Docker Compose monorepo with independently testable frontend, backend, and database boundaries. The backend owns Jira and Confluence access and all report calculations. The React frontend consumes documented backend APIs and never handles third-party credentials.

Work proceeds in dependency order: resolve product decisions first, establish the backend and database foundation, create the frontend shell, implement features one at a time, then complete integration and testing.

## 2. Milestone Summary

| Milestone | Outcome | Exit condition |
|---|---|---|
| M0: Clarified baseline | No blocking product or architecture decisions remain | Required decisions are recorded in the specification and clarification review is closed. |
| M1: Backend foundation | Database, migrations, API contracts, and Express skeleton run locally | Clean Compose startup passes database and API health checks. |
| M2: Frontend foundation | React UI shell and routing consume the backend health endpoint | Frontend routes load and the UI handles loading and error states. |
| M3: Feature increments | Each report feature is implemented and verified independently | Every feature increment passes its acceptance criteria before the next begins. |
| M4: Integrated release | Jira, Confluence, frontend, backend, and PostgreSQL work together | End-to-end, security, accessibility, performance, and clean-start checks pass. |

## 3. Phase 0: Clarify and Baseline

**Goal:** Resolve decisions that would otherwise cause rework.

### Tasks

1. Select the canonical Confluence title format and report timezone.
2. Define report period boundaries for current and historical report dates.
3. Define RAG inputs, thresholds, precedence, and missing-data behavior.
4. Define story-point and ticket completion formulas, null handling, and rounding.
5. Define bug classification, opened/closed date windows, and reopened behavior.
6. Decide whether publishing is one-page-per-run or idempotent per sprint/date.
7. Define the preview-to-publish lifecycle and allowed report status transitions.
8. Decide whether report history, scheduling, and application authentication are first-release features.
9. Choose canonical report persistence format and historical snapshot strategy.
10. Choose API contract format and location, such as OpenAPI under `spec/api/`.
11. Define database types, indexes, migration tool, retention, and fallback volume behavior.
12. Define Compose services, ports, health checks, and local versus production scope.

### Milestone M0 acceptance

- `spec/specification.md` contains resolved decisions rather than open alternatives.
- `spec/clarify.md` marks each blocking item as resolved or explicitly deferred out of scope.
- One canonical report example exists, including title, date range, RAG result, and empty-data behavior.
- API, database, and Compose decisions are recorded before implementation begins.

## 4. Phase 1: Backend Setup

**Goal:** Establish the PostgreSQL, Express, API, and Docker foundation before frontend development.

### Tasks

1. Create or confirm `backend/`, `database/migrations/`, `reports/`, and `spec/api/` directories.
2. Initialize the backend with Node.js 24 LTS and Express 5.
3. Add backend linting, formatting, test runners, and common npm scripts.
4. Add the backend Dockerfile and define the PostgreSQL 15 service in `docker-compose.yml`.
5. Add a persistent PostgreSQL volume and a mounted fallback-report directory.
6. Add `.env.example` with safe placeholders and validate required variables at backend startup.
7. Document and implement API request/response schemas and stable error codes.
8. Implement versioned migrations for the report, sprint, issue, team-member, and velocity data model.
9. Add parameterized data-access functions and transaction boundaries.
10. Add `/api/health` with separate application and database readiness.
11. Add backend route placeholders for sprint, report, preview, retrieval, and publish operations.

### Milestone M1 acceptance

- `docker compose config` succeeds with placeholder configuration.
- A clean `docker compose up` starts all required services.
- PostgreSQL reports healthy before backend database readiness becomes healthy.
- Backend responds on its documented port and exposes the health endpoint.
- Missing configuration fails with a descriptive error before external API calls.
- API contract and migration tests pass from an empty database.

## 5. Phase 2: Frontend Setup

**Goal:** Establish the React 18 + Vite UI shell and navigation against stable backend contracts.

### Tasks

1. Initialize the frontend with React 18 and Vite.
2. Add the frontend Dockerfile, linting, formatting, test runner, and common npm scripts.
3. Create `frontend/src/components/`, `frontend/src/pages/`, and `frontend/src/services/`.
4. Implement the frontend API client for the documented backend contracts.
5. Add routes for Dashboard / Current Sprint, Report Preview, Publish Status, and Service Health.
6. Build the UI skeleton with navigation, page headings, action placeholders, and responsive layout regions.
7. Connect the Service Health screen to `/api/health`.
8. Define shared loading, empty, success, and recoverable-error presentation states.
9. Add frontend component and routing tests.

### Milestone M2 acceptance

- All frontend routes load without feature-specific business logic.
- The frontend communicates through the backend API client only.
- Health data renders successfully and backend failures show safe error states.
- Frontend build, lint, formatting, and routing tests pass.

## 6. Phase 3: Feature Implementation

**Goal:** Deliver the report workflow incrementally, implementing and validating one feature at a time.

### Tasks

For each increment, update the specification traceability checklist, implement backend behavior, connect the relevant frontend screen, add tests, and verify the increment before starting the next one.

1. **Current sprint retrieval:** retrieve and display the configured active sprint.
2. **Sprint progress:** calculate and display story-point and ticket progress.
3. **Completed issues:** retrieve, transform, and display issues completed in the report period.
4. **In-progress items:** retrieve and display current work with available due dates and completion values.
5. **Blockers:** retrieve and display flagged or Blocker-priority issues.
6. **Team workload:** derive and display assignee-level workload metrics.
7. **Bug trend:** calculate and display the defined bug opened/closed trend.
8. **Velocity trend:** calculate and display the last five sprint velocity records.
9. **Next sprint goals:** retrieve and display priority-ordered future-sprint issues.
10. **Report formatting:** render the complete nine-section report as JSON, Markdown, and Confluence Storage Format.
11. **Report lifecycle:** persist generation/preview/fallback state and expose report retrieval.
12. **Preview workflow:** connect the report model to the Report Preview screen.

### Milestone M3 acceptance

- Each feature increment has passing unit, API, and relevant frontend tests.
- Each increment has explicit normal, empty, partial, and failure behavior.
- The complete report contains all nine sections in the specified order.
- Calculations and formatting match the resolved specification.
- No feature increment requires live Jira or Confluence services in automated tests.

## 7. Phase 4: Integration and Testing

**Goal:** Connect external systems, exercise the complete workflow, and verify release quality.

### Tasks

1. Implement the Jira client and verify API version, pagination, fields, permissions, and rate-limit handling.
2. Connect all report features to Jira through backend clients.
3. Implement bounded timeouts, retries, backoff, and safe upstream error mapping.
4. Implement the Confluence client and child-page creation with the canonical title and XHTML content.
5. Add publish idempotency, concurrency protection, and retry behavior.
6. Implement local Markdown fallback naming, volume mapping, permissions, and retention.
7. Add integration fixtures for authentication failure, rate limits, timeouts, partial data, and outages.
8. Add end-to-end tests for generate, preview, publish, and fallback workflows.
9. Add security tests for secret redaction in logs, responses, errors, and browser-visible data.
10. Add accessibility and performance tests against approved targets.
11. Verify Docker startup ordering, migrations, health checks, volumes, and restart behavior.
12. Run linting, formatting, unit tests, integration tests, frontend/backend builds, and Compose validation.
13. Document local development, environment setup, migrations, fallback recovery, and deployment.
14. Perform a clean-checkout acceptance run with no existing volumes or generated artifacts.

### Milestone M4 acceptance

- Backend client tests pass with controlled fixtures.
- Jira failure prevents publishing.
- Confluence failure produces the required fallback and accurate report status.
- End-to-end generate, preview, publish, and fallback flows pass.
- Security, accessibility, performance, build, and Compose quality gates pass.
- The clean-checkout run satisfies all first-release success criteria.

## 10. Cross-Phase Workstreams

### Security

Review secrets, token handling, HTTPS, CORS, authentication boundary, log redaction, and least-privilege permissions in every phase.

### Testing

Write tests with each behavior rather than postponing them to Phase 6. Prefer fixture-driven tests and contract tests at every boundary.

### Documentation

Update API contracts, migrations, Compose instructions, and resolved decisions when behavior changes. No implementation should silently diverge from the specification.

### Traceability

Tag implementation tasks and tests with requirement IDs such as `FR-001` through `FR-021` and scenario identifiers. Maintain a simple acceptance checklist for each milestone.

## 11. Key Dependencies and Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Unresolved report semantics | Rework across domain, API, and UI | Complete M0 before implementation. |
| Jira or Confluence API differences | Integration delays or incorrect metrics | Confirm API versions and use fixtures before live verification. |
| Duplicate publish attempts | Multiple Confluence pages | Resolve idempotency and enforce database/state protection. |
| Large or slow upstream responses | Poor user experience or request timeouts | Define performance targets and choose synchronous versus asynchronous execution in M0. |
| Historical snapshot ambiguity | Incorrect report reconstruction | Decide persistence strategy before migrations. |
| Secret leakage | Security incident | Keep clients backend-only and test logs, responses, and browser boundaries. |
| Docker environment drift | Non-reproducible setup | Pin versions, validate Compose from a clean checkout, and document prerequisites. |

## 12. Definition of Done

A phase or milestone is complete only when:

- The relevant specification and constitution requirements are satisfied.
- Code follows the prescribed folder and naming conventions.
- Automated tests cover normal, empty, partial, and failure paths where applicable.
- No secrets are introduced into source, tests, images, logs, or browser output.
- Documentation and contracts match the implemented behavior.
- The milestone acceptance checks pass from a reproducible environment.
