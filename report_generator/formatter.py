"""Convert a report dict into Confluence Storage Format (XHTML)."""

from xml.sax.saxutils import escape


def to_confluence_storage(report: dict) -> str:
    parts = [
        _executive_summary(report),
        _sprint_progress(report),
        _completed_issues(report),
        _in_progress_issues(report),
        _blockers(report),
        _team_workload(report),
        _bug_trend(report),
        _velocity_trend(report),
        _next_sprint_goals(report),
    ]
    return "\n".join(parts)


# ── Section renderers ────────────────────────────────────────────────────────

def _executive_summary(r: dict) -> str:
    es = r["executive_summary"]
    sprint = r["sprint"]
    return (
        f"<h1>Executive Summary</h1>\n"
        f"<p><strong>Sprint:</strong> {escape(sprint['name'])} "
        f"({escape(sprint['start'])} – {escape(sprint['end'])})</p>\n"
        f"<p><strong>Overall Status:</strong> {escape(es['rag'])}</p>\n"
        f"<p><strong>Story Points:</strong> "
        f"Committed: {es['committed_sp']} | "
        f"Completed: {es['completed_sp']} | "
        f"Remaining: {es['remaining_sp']}</p>\n"
        f"<p><strong>Completion:</strong> {es['completion_pct']}% "
        f"({es['done_tickets']} of {es['total_tickets']} tickets done)</p>"
    )


def _sprint_progress(r: dict) -> str:
    es = r["executive_summary"]
    tc = es["total_tickets"]
    td = es["done_tickets"]
    tr_ = tc - td
    tp = round(td / tc * 100) if tc else 0
    return (
        "<h2>Sprint Progress</h2>\n"
        + _table(
            ["Metric", "Committed", "Completed", "Remaining", "% Done"],
            [
                ["Story Points", str(es["committed_sp"]), str(es["completed_sp"]),
                 str(es["remaining_sp"]), f"{es['completion_pct']}%"],
                ["Total Tickets", str(tc), str(td), str(tr_), f"{tp}%"],
            ],
        )
    )


def _completed_issues(r: dict) -> str:
    rows = [
        [escape(i["key"]), escape(i["summary"]), escape(i["assignee"]),
         str(i["sp"]), escape(i["resolved"])]
        for i in r["completed_issues"]
    ]
    return "<h2>Completed Issues</h2>\n" + _table(
        ["Ticket ID", "Summary", "Assignee", "Story Points", "Resolved Date"], rows
    )


def _in_progress_issues(r: dict) -> str:
    rows = [
        [escape(i["key"]), escape(i["summary"]), escape(i["assignee"]),
         escape(i["status"]), escape(i["due"])]
        for i in r["in_progress_issues"]
    ]
    return "<h2>In-Progress Items</h2>\n" + _table(
        ["Ticket ID", "Summary", "Assignee", "Status", "Due Date"], rows
    )


def _blockers(r: dict) -> str:
    rows = [
        [escape(i["key"]), escape(i["summary"]), escape(i["description"]),
         escape(i["assignee"]), escape(i["flagged_since"])]
        for i in r["blockers"]
    ]
    return "<h2>Blockers / Flagged Issues</h2>\n" + _table(
        ["Ticket ID", "Summary", "Blocker Description", "Assignee", "Flagged Since"], rows
    )


def _team_workload(r: dict) -> str:
    rows = [
        [escape(name), str(d["assigned"]), str(d["completed"]),
         str(d["in_progress"]), str(d["sp"])]
        for name, d in sorted(r["team_workload"].items())
    ]
    return "<h2>Team Workload</h2>\n" + _table(
        ["Assignee", "Assigned Tickets", "Completed", "In Progress", "Story Points"], rows
    )


def _bug_trend(r: dict) -> str:
    rows = [
        [escape(b["sprint"]), str(b["opened"]), str(b["closed"]), str(b["net"])]
        for b in r["bug_trend"]
    ]
    return "<h2>Bug Trend</h2>\n" + _table(
        ["Sprint", "Bugs Opened", "Bugs Closed", "Net"], rows
    )


def _velocity_trend(r: dict) -> str:
    rows = []
    for v in r["velocity_data"]:
        pct = round(v["completed"] / v["committed"] * 100) if v["committed"] else 0
        rows.append([escape(v["sprint"]), str(v["committed"]), str(v["completed"]), f"{pct}%"])
    return f"<h2>Velocity Trend (Last {len(rows)} Sprints)</h2>\n" + _table(
        ["Sprint Name", "Committed", "Completed", "Velocity %"], rows
    )


def _next_sprint_goals(r: dict) -> str:
    rows = [
        [escape(i["key"]), escape(i["summary"]), escape(i["priority"]), str(i["sp"])]
        for i in r["next_sprint_issues"]
    ]
    return "<h2>Next Sprint Goals</h2>\n" + _table(
        ["Ticket ID", "Summary", "Priority", "Story Points"], rows
    )


# ── HTML table builder ───────────────────────────────────────────────────────

def _table(headers: list, rows: list) -> str:
    header_cells = "".join(f"<th><strong>{escape(h)}</strong></th>" for h in headers)
    if rows:
        body_rows = "".join(
            "<tr>" + "".join(f"<td>{cell}</td>" for cell in row) + "</tr>\n"
            for row in rows
        )
    else:
        empty = "".join("<td>—</td>" for _ in headers)
        body_rows = f"<tr>{empty}</tr>\n"
    return f"<table><tbody><tr>{header_cells}</tr>\n{body_rows}</tbody></table>"
