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


def to_markdown(report: dict) -> str:
    """Render a readable local fallback without requiring Confluence."""
    es = report["executive_summary"]
    sprint = report["sprint"]
    lines = [
        f"# Weekly Status Report - {report['report_date']}",
        "",
        "## Executive Summary",
        f"- Sprint: {sprint['name']} ({sprint['start']} to {sprint['end']})",
        f"- Overall status: {es['rag']}",
        f"- Story points: {es['committed_sp']} committed, {es['completed_sp']} completed, {es['remaining_sp']} remaining",
        f"- Completion: {es['completion_pct']}% ({es['done_tickets']} of {es['total_tickets']} tickets)",
        f"- Highlight: {es['highlight']}",
        f"- Risk: {es['risk']}",
        "",
    ]
    sections = [
        ("Sprint Progress", [
            ["Story Points", es["committed_sp"], es["completed_sp"], es["remaining_sp"], f"{es['completion_pct']}%"],
            ["Total Tickets", es["total_tickets"], es["done_tickets"], es["total_tickets"] - es["done_tickets"], f"{round(es['done_tickets'] / es['total_tickets'] * 100) if es['total_tickets'] else 0}%"],
        ]),
        ("Completed Issues", [[i["key"], i["summary"], i["assignee"], i["sp"], i["resolved"]] for i in report["completed_issues"]]),
        ("In-Progress Items", [[i["key"], i["summary"], i["assignee"], i["status"], i.get("percentage_done", ""), i["due"]] for i in report["in_progress_issues"]]),
        ("Blockers / Flagged Issues", [[i["key"], i["summary"], i["description"], i["assignee"], i["flagged_since"]] for i in report["blockers"]]),
        ("Team Workload", [[name, data["assigned"], data["completed"], data["in_progress"], data["sp"]] for name, data in report["team_workload"].items()]),
        ("Bug Trend", [[i["sprint"], i["opened"], i["closed"], i["net"]] for i in report["bug_trend"]]),
        ("Velocity Trend", [[i["sprint"], i["committed"], i["completed"], f"{round(i['completed'] / i['committed'] * 100) if i['committed'] else 0}%"] for i in report["velocity_data"]]),
        ("Next Sprint Goals", [[i["key"], i["summary"], i["priority"], i["sp"]] for i in report["next_sprint_issues"]]),
    ]
    headers = {
        "Sprint Progress": ["Metric", "Committed", "Completed", "Remaining", "% Done"],
        "Completed Issues": ["Ticket ID", "Summary", "Assignee", "Story Points", "Resolved Date"],
        "In-Progress Items": ["Ticket ID", "Summary", "Assignee", "Status", "% Done", "Due Date"],
        "Blockers / Flagged Issues": ["Ticket ID", "Summary", "Blocker Description", "Assignee", "Flagged Since"],
        "Team Workload": ["Assignee", "Assigned Tickets", "Completed", "In Progress", "Story Points"],
        "Bug Trend": ["Sprint", "Bugs Opened", "Bugs Closed", "Net"],
        "Velocity Trend": ["Sprint Name", "Committed", "Completed", "Velocity %"],
        "Next Sprint Goals": ["Ticket ID", "Summary", "Priority", "Story Points"],
    }
    for title, rows in sections:
        lines.extend([f"## {title}", ""])
        lines.extend(_markdown_table(headers[title], rows))
        lines.append("")
    return "\n".join(lines)


def _markdown_table(headers, rows):
    if not rows:
        return ["None this sprint."]
    format_row = lambda row: "| " + " | ".join(str(value).replace("|", "\\|") for value in row) + " |"
    return [format_row(headers), format_row(["---"] * len(headers)), *[format_row(row) for row in rows]]


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
        f"({es['done_tickets']} of {es['total_tickets']} tickets done)</p>\n"
        f"<p><strong>Highlight:</strong> {escape(es['highlight'])}</p>\n"
        f"<p><strong>Risk:</strong> {escape(es['risk'])}</p>"
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
         escape(i["status"]), str(i.get("percentage_done", "")), escape(i["due"])]
        for i in r["in_progress_issues"]
    ]
    return "<h2>In-Progress Items</h2>\n" + _table(
        ["Ticket ID", "Summary", "Assignee", "Status", "% Done", "Due Date"], rows
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
        body_rows = f'<tr><td colspan="{len(headers)}">None this sprint</td></tr>\n'
    return f"<table><tbody><tr>{header_cells}</tr>\n{body_rows}</tbody></table>"
