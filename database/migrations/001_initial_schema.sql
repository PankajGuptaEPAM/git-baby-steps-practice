CREATE TABLE IF NOT EXISTS sprints (
    id SERIAL PRIMARY KEY,
    jira_sprint_id INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    state TEXT,
    committed_points NUMERIC(10,2) DEFAULT 0,
    completed_points NUMERIC(10,2) DEFAULT 0,
    remaining_points NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    jira_user_id TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    jira_issue_key TEXT UNIQUE NOT NULL,
    sprint_id INTEGER REFERENCES sprints(id),
    summary TEXT,
    status TEXT,
    assignee_id INTEGER REFERENCES team_members(id),
    priority TEXT,
    story_points NUMERIC(10,2),
    issue_type TEXT,
    due_date DATE,
    resolved_date TIMESTAMPTZ,
    blocker_description TEXT,
    flagged_since TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS velocity_records (
    id SERIAL PRIMARY KEY,
    sprint_id INTEGER REFERENCES sprints(id) UNIQUE NOT NULL,
    committed_points NUMERIC(10,2) DEFAULT 0,
    completed_points NUMERIC(10,2) DEFAULT 0,
    velocity_percentage NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    report_date DATE NOT NULL,
    sprint_id INTEGER REFERENCES sprints(id),
    status TEXT DEFAULT 'generated' CHECK (status IN ('generated','previewed','published','fallback')),
    content_markdown TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    confluence_page_id TEXT,
    confluence_page_url TEXT,
    fallback_file_path TEXT,
    UNIQUE (report_date, sprint_id)
);
