# Specification Review: Clarifications Required

**Reviewed documents:** `spec/constitution.md`, `spec/specification.md`  
**Review date:** 2026-08-24  
**Reviewer:** Senior developer review

This review identifies gaps, contradictions, and unclear requirements that should be resolved before implementation planning. The constitution governs engineering practice; the specification governs product behavior. Where the two conflict, the constitution currently does not define a tie-break rule for product decisions.

## 1. Blocking Contradictions

### C-001: Confluence page title format conflicts

- `project_spec.md` defines `Weekly Status Report — YYYY-MM-DD` using an em dash.
- The detailed specification now defines `Weekly Status Report - YYYY-MM-DD` using a hyphen.

**Resolved by T-001:** The detailed specification is authoritative for the web application. The canonical title is `Weekly Status Report - YYYY-MM-DD`, with the date interpreted in UTC.

### C-002: One page per run conflicts with report uniqueness

- The scope and success criteria say one new Confluence page per run.
- The `reports` table proposes unique `(report_date, sprint_id)`, which prevents a second run for the same sprint and date.

**Clarify:** Is the desired behavior one page per run, one page per sprint/date, or idempotent publishing? Define how retries and intentional reruns behave.

### C-003: PostgreSQL is both system of record and a reporting cache

The constitution calls PostgreSQL the system of record for application-owned data, while Jira remains the source of sprint and issue data. The specification does not distinguish authoritative source data from cached snapshots or calculated report values.

**Clarify:** Which fields are authoritative in PostgreSQL, how long Jira snapshots are retained, and whether a report can be regenerated from stored data when Jira is unavailable.

### C-004: Preview persistence is undefined

- `GET /api/reports/preview` generates a report without publishing.
- `FR-018` and `FR-019` require persistence of generated and previewed report status.
- The `reports` schema includes `content_markdown`, but the preview endpoint does not say whether it creates a report record or returns an unsaved preview.

**Clarify:** Does preview create a persisted report ID that publishing must use, or does `POST /api/reports` create the report and the preview endpoint only format it? Define the lifecycle transitions and allowed status changes.

### C-005: Failure behavior conflicts with persistence requirements

The error rules say database unavailability prevents operations requiring persistence, while Confluence failure must save a local fallback. It is unclear whether fallback saving is allowed when PostgreSQL is unavailable and whether a fallback report must later be reconciled into the database.

**Clarify:** Define fallback behavior for each combination of Jira, PostgreSQL, filesystem, and Confluence availability.

## 2. Missing Product Decisions

### G-001: RAG calculation is not specified

`FR-010` requires an overall RAG status, but no thresholds or precedence rules define how it is calculated. The open-decisions section acknowledges this but does not block implementation explicitly.

**Clarify:** Define inputs, thresholds, precedence when multiple risks exist, handling of missing metrics, and whether the result is configurable.

### G-002: Completion percentage rules are incomplete

The specification requires completion percentages and division-by-zero safety but does not define whether completion is based on story points, tickets, or both, how null story points are handled, or rounding precision.

**Clarify:** Define formulas, denominator-zero output, treatment of unestimated issues, and display precision.

### G-003: Bug trend source and time window are missing

`FR-006` requires bugs opened and closed, but the Jira query section contains no bug query, date window, issue-type definition, or sprint association rule.

**Clarify:** Define what counts as a bug, whether opened/closed means created/resolved, the time range, and how reopened bugs are counted.

### G-004: “This week” is ambiguous

The completed-issues query uses `updated >= -7d`, while the report is described as weekly and can accept a report date. Relative Jira time is evaluated at request time, so historical report generation may not reproduce the original week.

**Resolved by T-001:** The report period is the explicit seven-day UTC interval derived from `reportDate`, start inclusive and end exclusive. FR-002 retains the specified Jira `updated` timestamp as the qualifying field; changing to resolved date remains part of T-002 calculation rules.

### G-005: Sprint selection is underspecified

The system is configured with a board ID, project key, and quick-filter ID, but the query examples use only project and sprint functions. It is unclear whether the board and quick filter must constrain every query.

**Clarify:** Define the authoritative Jira selection mechanism and behavior when multiple active sprints or no future sprint exist.

### G-006: Next-sprint data has no endpoint or persistence contract

The report requires Next Sprint Goals and the scope includes a next-sprint preview, but the API list only defines `/api/sprints/current`. No endpoint, response shape, or stored entity is specified for next-sprint issues.

**Clarify:** Add an endpoint or include next-sprint data in the current-report response, and define behavior when no future sprint exists.

### G-007: Report history behavior is incomplete

The specification includes `GET /api/reports/:reportId` but does not define how users discover report IDs, whether there is a list/history endpoint, or which reports are visible.

**Clarify:** Decide whether report history is part of the first release. If it is, define `GET /api/reports`, filters, pagination, ordering, and access rules. If not, remove the retrieval endpoint and related data requirements.

### G-008: Scheduling is stated but not designed

The goals mention scheduled execution, but no scheduler, endpoint, worker, command, or deployment behavior is defined. The out-of-scope list does not explicitly exclude scheduling.

**Clarify:** Is scheduling a first-release requirement? If yes, define the scheduler owner, trigger format, job status, retries, and duplicate-run handling. If no, remove it from the goals.

### G-009: Authentication and authorization are unresolved

User account management is out of scope, but the application performs a privileged Confluence publish operation and the constitution requires least-privilege access. No trust boundary, authentication method, authorization rule, or deployment assumption is defined.

**Clarify:** Is this an internal single-user tool, protected by an upstream identity proxy, or expected to implement authentication? Define who may preview and publish.

### G-010: Report editing is not defined

The user previews and approves a report, but there is no way to edit a highlight, risk, RAG status, or other generated content. It is unclear whether all content is read-only and sourced entirely from Jira.

**Clarify:** Confirm whether the report is read-only in the first release. If edits are allowed, define editable fields, persistence, auditability, and publish behavior.

## 3. API and Contract Gaps

### G-011: Endpoint ownership and payload schemas are incomplete

The endpoint table names requests and responses but does not define JSON schemas, required fields, date formats, enum values, pagination, correlation IDs, or content size limits.

**Clarify:** Add request/response examples or schemas for every endpoint, including successful and error responses.

### G-012: Preview and report-generation endpoints overlap

`GET /api/reports/preview` generates a report, while `POST /api/reports` also generates and persists one. The specification does not define which endpoint performs Jira calls, whether results are identical, or how a preview becomes publishable.

**Clarify:** Choose a single generation flow, for example `POST /api/reports` creates a report and `GET /api/reports/:id/preview` formats it, or define the two flows explicitly.

### G-013: Publish idempotency and concurrency are missing

No idempotency key, state precondition, locking rule, or duplicate prevention is defined for `POST /api/reports/:reportId/publish`. Double-clicks, retries, and two operators could create duplicate Confluence pages.

**Clarify:** Define allowed source statuses, idempotency behavior, concurrent publish behavior, and whether a published report can be retried.

### G-014: Health endpoint dependencies are inconsistent

The constitution requires application and database readiness separately. The UI lists Jira and Confluence readiness indicators, but the API contract does not require Jira or Confluence health checks.

**Clarify:** Define the exact health response fields and whether upstream integrations are checked live, checked with a lightweight request, or reported as configured/unknown.

### G-015: Error response semantics are incomplete

Status codes are listed, but there is no mapping from upstream failures to error codes, no retry guidance, no distinction between partial report data and failed generation, and no rule for preserving upstream request IDs.

**Clarify:** Define an error-code catalog, retryable versus terminal failures, partial-success semantics, and safe diagnostic fields.

### G-016: API versioning and CORS are absent

The constitution requires documented, versioned shared contracts, but the specification does not define an API version prefix or compatibility policy. There is also no cross-origin policy for a separately hosted Vite frontend.

**Clarify:** Choose an API versioning strategy and define allowed origins, development proxy behavior, and production deployment topology.

## 4. Data Model and Database Gaps

### G-017: Relational schema is not implementable as written

The tables list columns but omit data types, nullability, defaults, primary-key definitions, foreign-key actions, indexes, and check constraints. The `reports.sprint_id` reference does not state whether it is nullable for historical or fallback records.

**Clarify:** Add a migration-level schema or a complete data dictionary with types, constraints, indexes, and deletion behavior.

### G-018: Issue uniqueness conflicts with sprint history

`issues.jira_issue_key` is globally unique, but an issue can appear in multiple sprints or report snapshots. This prevents storing historical per-sprint values unless the table is modeled as a current issue table plus snapshot table.

**Clarify:** Decide between normalized current Jira entities and immutable report snapshots. Define the uniqueness key for historical issue data.

### G-019: Team-member aggregate fields are misplaced

The logical Team Member entity includes assigned, completed, in-progress, and story-point counts, but the `team_members` table only stores identity fields. It is unclear whether aggregates are calculated per report, persisted, or derived from issues.

**Clarify:** Store report-specific workload snapshots in a related table, or state that these values are computed and never persisted.

### G-020: Report content format is incomplete

The `reports` table stores Markdown, but Confluence publishing requires XHTML and the API can return JSON, Markdown, or Storage Format. No field or regeneration rule covers the canonical structured report and formatted variants.

**Clarify:** Define the canonical persisted representation and whether formatted content is generated on demand or stored as immutable output.

### G-021: Fallback storage is not deployable

`fallback_file_path` is stored, but the container volume, filename convention, permissions, retention, and host visibility for `reports/` are not defined.

**Clarify:** Define the Compose volume mapping and fallback naming convention, such as `reports/weekly-status-YYYY-MM-DD-report-id.md`, plus retention and failure behavior.

### G-022: Migration and seed strategy is missing

The specification requires repeatable migrations but does not identify a migration tool, startup ordering, migration ownership, or whether local development requires seed data.

**Clarify:** Choose the migration mechanism, define when migrations run, and define fixture/seed data for tests and local development.

### G-023: Transaction boundaries are unclear

Generating a report writes multiple related entities, while publishing updates report status and Confluence references. No transaction or recovery behavior is defined for partial database failures.

**Clarify:** Define transaction boundaries, rollback behavior, and reconciliation for a database commit followed by an external publish failure.

### G-024: Retention and deletion are unresolved

The open decisions mention retention, but the specification has no retention period or deletion policy for report content, Jira issue snapshots, logs, or fallback files.

**Clarify:** Define retention, deletion jobs, legal/privacy requirements, and whether published report metadata may be deleted.

## 5. Integration and Operational Gaps

### G-025: Jira and Confluence API versions are absent

The base URLs and authentication method are specified, but REST API version, endpoint paths, pagination limits, field expansion, and required scopes/permissions are not.

**Clarify:** Identify API versions and permissions, and define pagination and rate-limit handling.

### G-026: Authentication token lifecycle is missing

The documents require API tokens but do not define token rotation, expiration, secret injection in Docker, or behavior when credentials are invalid or expired.

**Clarify:** Define secret provisioning, rotation ownership, startup validation, and runtime invalid-credential handling.

### G-027: Timeout, retry, and rate-limit values are missing

The constitution requires bounded retries and timeouts, but no numeric values, backoff strategy, retry-safe operations, or Jira/Confluence rate-limit behavior are specified.

**Clarify:** Define per-integration connect/request timeouts, retry count, backoff, and rate-limit responses.

### G-028: Docker Compose contract is incomplete

The specification requires frontend, backend, and PostgreSQL services but does not define service names, images/build contexts, ports, health checks, network, volumes, startup dependencies, or development versus production profiles.

**Clarify:** Define the Compose topology and the exact readiness condition for the backend to start accepting requests.

### G-029: Production deployment is not defined

Docker Compose is described as local orchestration, but there is no deployment target, reverse proxy, TLS termination, frontend hosting model, or database backup strategy beyond a general documentation requirement.

**Clarify:** State whether this specification covers local development only or production deployment, and define the target environment for release acceptance.

### G-030: Observability requirements are not measurable

Logging requires operation type, timestamp, outcome, and correlation context, but there is no log format, log level policy, metric set, tracing requirement, or alerting behavior.

**Clarify:** Define structured log fields, correlation ID propagation, key metrics, and operator-visible failure signals.

### G-031: Timezone and locale behavior are missing

Dates appear in report titles and tables, but timezone, locale, date format, and daylight-saving behavior are not defined. PostgreSQL timestamps are required to be UTC while Jira may return timezone-aware values.

**Resolved by T-001:** Report dates and timestamps use UTC, report dates use ISO `YYYY-MM-DD`, and displayed timestamps carry explicit UTC semantics.

## 6. Frontend and UX Gaps

### G-032: Navigation and routing are unspecified

The UI screens are listed, but URL paths, default screen, browser refresh behavior, navigation between screens, and unsaved-state behavior are not defined.

**Clarify:** Define routes, entry point, navigation rules, and whether the application is a single-page workflow.

### G-033: Report data presentation is incomplete

The report section names and table columns are defined, but sorting, long-text handling, pagination, responsive behavior for wide tables, and timezone display are not.

**Clarify:** Define presentation rules for large sprints and narrow screens.

### G-034: Publish progress model is missing

The Publish Status screen requires progress, but the API is described as a synchronous `POST`. There is no polling, streaming, job identifier, or expected behavior during long Jira/Confluence calls.

**Clarify:** Choose synchronous request behavior with a timeout or asynchronous job behavior with status polling.

### G-035: Accessibility target is too broad

The specification says core data and actions must be accessible but does not state a target such as WCAG 2.2 AA, keyboard focus behavior, or screen-reader requirements.

**Clarify:** Set the accessibility conformance target and define testing expectations.

### G-036: Browser and support targets are absent

No supported browsers, viewport range, language, or localization behavior is defined.

**Clarify:** Define supported browser versions, minimum viewport, and whether localization is required.

## 7. Testing and Acceptance Gaps

### G-037: Acceptance criteria are not fully testable

Several criteria use subjective phrases such as “clear message,” “readable tables,” “executive-friendly,” “safe diagnostic message,” and “correctly titled.”

**Clarify:** Replace subjective wording with exact message categories, schemas, title examples, and observable state transitions.

### G-038: No acceptance criterion covers all API endpoints

The success criteria do not require `/api/sprints/current`, report retrieval, or health responses to be validated beyond the scenario-level health statement.

**Clarify:** Add endpoint-by-endpoint acceptance tests, including status codes, payload shape, and dependency failures.

### G-039: No acceptance criterion verifies persistence details

The success criteria say PostgreSQL persists report lifecycle metadata but do not specify which fields, status transitions, or recovery behavior must be verified.

**Clarify:** Add database acceptance tests for schema constraints, lifecycle transitions, relationships, and migration from an empty database.

### G-040: No acceptance criterion verifies security boundaries

The documents state that credentials must not leak but do not define tests for browser network payloads, API responses, logs, container inspection, or error serialization.

**Clarify:** Add automated secret-redaction and frontend-boundary tests.

### G-041: External test fixtures are undefined

The constitution requires controlled mocks or fixtures, but no Jira/Confluence response fixtures, partial-data cases, or contract-test ownership is defined.

**Clarify:** Define fixture scenarios and whether API contract tests are generated from schemas.

### G-042: Performance targets are deferred

The non-functional requirements say targets will be measured during planning, so release readiness cannot currently be evaluated against performance.

**Clarify:** Set report-generation, preview, health-check, and publish response targets, including dataset size and whether targets exclude upstream latency.

### G-043: Clean-start acceptance is incomplete

The specification requires Docker Compose reproducibility but does not define a clean-start command sequence, required environment placeholders, migration completion signal, or expected health response.

**Clarify:** Add a runnable acceptance procedure from a clean checkout with no existing volumes.

## 8. Constitution Alignment Issues

### A-001: Constitution requires versioned shared contracts but no shared-contract location exists

The constitution requires shared contracts to be documented and versioned, while the project structure has no `shared/`, OpenAPI, JSON Schema, or equivalent contract location.

**Clarify:** Choose a contract format and location, such as `spec/api/openapi.yaml` or shared TypeScript schemas.

### A-002: Constitution requires API clients to be the only direct integration callers, but health checks are unspecified

The UI wants Jira and Confluence readiness indicators. If health checks call those services, the specification must state that they use the integration clients and are not implemented in routes or frontend code.

**Clarify:** Define the integration health ownership and test boundary.

### A-003: Constitution requires all required config before startup, but `DATABASE_URL` is only in the detailed specification

The constitution describes environment configuration generally; the detailed specification adds `DATABASE_URL`, but the source Module 08 configuration does not. The complete required configuration set and precedence are not reconciled.

**Clarify:** Make the detailed configuration contract authoritative and document local/production overrides.

### A-004: Constitution says root-level files are configuration, orchestration, and documentation only, but `reports/` is also a root-level runtime output location

This is not necessarily a defect, but the convention is ambiguous because fallback output is operational data at the repository root.

**Clarify:** Explicitly permit `reports/` as a runtime-mounted output directory or move fallback files to a dedicated application data volume.

### A-005: Constitution requires frontend tests close to code or in a dedicated frontend test directory, but the project structure contract omits frontend test placement

The backend test location is explicit, while frontend test organization is not.

**Clarify:** Add `frontend/src/**/*.test.jsx` or `frontend/tests/` to the structure contract.

## 9. Recommended Clarification Order

Resolve these in order because later decisions depend on them:

1. Canonical report date, timezone, title format, and report-period rules: C-001, G-004, G-031.
2. Report lifecycle, rerun/idempotency behavior, preview flow, and persistence: C-002, C-004, G-012, G-013, G-020, G-023.
3. RAG, completion, bug trend, sprint selection, and next-sprint semantics: G-001 through G-006.
4. Authentication, secret lifecycle, and deployment trust boundary: G-009, G-026, G-029.
5. Complete API schemas and shared-contract location: G-011, G-014 through G-016, A-001.
6. Complete PostgreSQL schema, migrations, snapshots, retention, and fallback volume: G-017 through G-024, A-004.
7. Compose topology, timeout/retry policy, and observability: G-027 through G-030.
8. UI routing, long-running publish behavior, accessibility, and support targets: G-032 through G-036.
9. Test fixtures, measurable acceptance criteria, performance, and clean-start verification: G-037 through G-043.

## 10. Review Conclusion

The specification has a strong product outline and covers the primary report workflow, but it is not yet implementation-ready. The highest-risk areas are report lifecycle/idempotency, date and calculation semantics, API payload contracts, historical data modeling, and deployment/runtime behavior. Resolve the blocking contradictions and first four clarification groups before generating an implementation plan.
