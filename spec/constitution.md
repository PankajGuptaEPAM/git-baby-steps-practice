# Project Constitution: Weekly Status Report Generator

**Version:** 1.0  
**Status:** Active  
**Project name:** Weekly Status Report Generator  
**Scope:** React frontend, Node.js backend, and PostgreSQL persistence

## 1. Product Purpose

The Weekly Status Report Generator shall fetch active Jira sprint data, calculate weekly delivery metrics, present an executive-friendly report, and publish the report to Confluence. The system shall support report preview, on-demand generation, and a local fallback when Confluence is unavailable.

The primary target user is the Delivery Manager, who uses the application to prepare and publish reports for executive and C-level stakeholders.

The initial scope is one Jira board and one Confluence parent page. Multi-board aggregation, editing or deleting historical pages, chart-image generation, and ticket-level drill-down pages are outside the initial scope.

## 2. Architecture Boundaries

- `frontend/` shall contain only the React 18 + Vite user interface.
- `backend/` shall contain the Node.js + Express API, integration clients, report-generation services, and persistence logic.
- PostgreSQL 15 shall be the system of record for application-owned data and shall run through Docker Compose.
- Jira and Confluence credentials and API calls shall remain in the backend. The frontend shall never receive or store third-party API tokens.
- Frontend and backend communication shall use documented JSON HTTP APIs with consistent error responses.
- Shared contracts shall be documented and versioned before dependent frontend and backend changes are implemented.

### Folder Conventions

- `frontend/src/components/` shall contain reusable presentation components.
- `frontend/src/pages/` shall contain route-level screens and page composition.
- `frontend/src/services/` shall contain frontend API clients and transport helpers.
- `backend/src/clients/` shall contain Jira and Confluence integration clients.
- `backend/src/services/` shall contain domain logic and report calculations.
- `backend/src/routes/` shall contain HTTP route definitions and request orchestration.
- `backend/src/formatters/` shall contain transformations to Confluence and API output formats.
- `backend/tests/` shall contain backend unit and integration tests; frontend tests shall remain close to the code they cover or in a dedicated frontend test directory.
- Root-level configuration and orchestration files shall include `docker-compose.yml`, `.env.example`, and documentation only.

## 3. Technology Standards

- Frontend: React 18 with Vite.
- Backend: Node.js 24 LTS with Express 5.
- Database: PostgreSQL 15.
- Local orchestration: Docker Compose using the Compose Specification.
- Configuration: environment variables loaded by the backend; `.env` files shall never be committed.
- Dependencies shall be pinned or constrained deliberately and updated through review.
- New libraries shall be justified by a concrete capability and shall not duplicate an existing project dependency.

## 4. Coding Standards

### Naming

- Use `camelCase` for JavaScript variables, functions, methods, and object properties.
- Use `PascalCase` for React components, classes, and component files.
- Use `UPPER_SNAKE_CASE` for constants shared across modules.
- Use descriptive names that express domain meaning; avoid one-letter names except for conventional short-lived callbacks.
- Name route modules, services, and clients after the domain responsibility they own, such as `reportRoutes.js` and `jiraClient.js`.

### File Organization

- Keep files focused on one responsibility and place code in the directory matching that responsibility.
- React components shall not contain Jira or Confluence integration logic.
- Express route modules shall delegate business rules to backend services rather than calculating report metrics inline.
- External API clients shall be the only modules that directly call Jira or Confluence.
- Keep shared validation, data contracts, and constants in explicit modules rather than duplicating them across frontend and backend.
- Prefer small, composable functions and explicit module exports over hidden global state.

## 5. Security and Privacy

- Secrets shall be supplied through environment variables or an approved secret store, never hardcoded in source, tests, images, or logs.
- `.env`, database credentials, Jira API tokens, and Confluence API tokens shall be excluded by `.gitignore`.
- All Jira and Confluence communication shall use HTTPS.
- Backend routes shall validate input, apply least-privilege access, and avoid exposing upstream credentials or raw sensitive responses.
- Logs shall be useful for diagnosis but shall not contain tokens, passwords, authorization headers, or unnecessary personal data.
- Database queries shall use parameterized statements or a trusted query builder/ORM.

## 6. Data and Integration Reliability

- Jira data shall be treated as external and potentially incomplete; missing fields and empty result sets shall be handled explicitly.
- The report shall preserve the nine required sections: Executive Summary, Sprint Progress, Completed Issues, In-Progress Items, Blockers / Flagged Issues, Team Workload, Bug Trend, Velocity Trend, and Next Sprint Goals.
- Missing or empty sections shall display a clear no-data state rather than failing silently.
- A Jira failure shall prevent publishing and return a descriptive error.
- A Confluence failure shall preserve the generated report as a local Markdown fallback and shall not discard report data.
- Retries, timeouts, and upstream error handling shall be bounded and observable.
- Database migrations shall be versioned, repeatable, and safe to run in a fresh Docker environment.

## 7. API and User Experience

- The backend shall expose a health endpoint that reports application and database readiness separately.
- API responses shall use stable field names and explicit status codes.
- The frontend shall provide loading, empty, success, and recoverable error states for every remote workflow.
- Publishing shall require an explicit user action and clear success or failure feedback.
- Report calculations displayed in the frontend shall come from the backend domain logic, avoiding duplicated business rules.
- The interface shall remain usable on supported desktop and mobile viewport sizes.

## 8. Testing and Quality Gates

- Every report calculation and integration service shall have automated tests for normal, empty, partial, and failure cases.
- API routes shall have integration tests covering validation, status codes, and error handling.
- Frontend tests shall cover report rendering, loading and empty states, and publish feedback.
- Tests shall not call live Jira, Confluence, or production databases; external services shall be mocked or run with controlled test fixtures.
- A change is complete only when linting, formatting, automated tests, and a production build pass for the affected application.
- Docker Compose shall be validated with a clean startup and health check before release.

## 9. Delivery and Operations

- The repository shall retain separate `frontend/` and `backend/` build contexts and a root `docker-compose.yml`.
- Services shall be reproducible from a clean checkout using documented commands.
- Container configuration shall use non-secret environment placeholders and persistent PostgreSQL volumes where appropriate.
- Database backups, data retention, and report fallback behavior shall be documented before production use.
- Breaking API or schema changes shall include migration and compatibility notes.
- Changes shall be small, reviewable, and traceable to a written requirement or acceptance criterion.

## 10. Spec-Driven Development Rules

- Each feature shall begin with a user-focused specification and measurable acceptance criteria.
- Ambiguous behavior, integration assumptions, and data decisions shall be resolved before implementation.
- The implementation plan shall identify affected frontend, backend, database, and Compose surfaces.
- Tasks shall be independently verifiable and shall include the validation needed to prove completion.
- When implementation reveals a requirement change, update the specification first or alongside the code; do not silently diverge from it.
- Reviews shall verify both functional behavior and compliance with this constitution.

## 11. Governance

This constitution is the governing engineering standard for the application. A proposed exception shall document the affected principle, reason, risk, mitigation, and expiration or review date. Exceptions require explicit approval from the project owner and shall not weaken secret handling, data protection, or required validation without an equivalent control.
