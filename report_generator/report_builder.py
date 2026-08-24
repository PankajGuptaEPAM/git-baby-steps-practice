from collections import defaultdict
from datetime import datetime


def build_report(active_sprint, all_issues, completed_issues, blockers,
                 next_sprint_issues, velocity_data, bug_trend):
    """Assemble all report sections into a structured dict."""

    # ── Story point tallies ──────────────────────────────────────────────────
    committed_sp = sum(_sp(i) for i in all_issues)
    completed_sp = sum(_sp(i) for i in completed_issues)
    remaining_sp = committed_sp - completed_sp
    completion_pct = round(completed_sp / committed_sp * 100) if committed_sp else 0

    total_tickets = len(all_issues)
    done_tickets = sum(
        1 for i in all_issues
        if i["fields"]["status"]["statusCategory"]["key"] == "done"
    )

    # ── RAG status ───────────────────────────────────────────────────────────
    if completion_pct >= 80:
        rag = "🟢 Green"
    elif completion_pct >= 50:
        rag = "🟡 Yellow"
    else:
        rag = "🔴 Red"

    highlight = f"{done_tickets} of {total_tickets} sprint tickets completed"
    risk = "No material delivery risk identified" if not blockers else f"{len(blockers)} blocker(s) require attention"

    # ── In-progress issues ───────────────────────────────────────────────────
    in_progress = [
        i for i in all_issues
        if i["fields"]["status"]["statusCategory"]["key"] == "indeterminate"
    ]

    # ── Team workload ────────────────────────────────────────────────────────
    workload = defaultdict(lambda: {"assigned": 0, "completed": 0, "in_progress": 0, "sp": 0})
    for issue in all_issues:
        assignee = _assignee(issue)
        cat = issue["fields"]["status"]["statusCategory"]["key"]
        workload[assignee]["assigned"] += 1
        workload[assignee]["sp"] += _sp(issue)
        if cat == "done":
            workload[assignee]["completed"] += 1
        elif cat == "indeterminate":
            workload[assignee]["in_progress"] += 1

    return {
        "report_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "sprint": {
            "name": active_sprint.get("name", ""),
            "start": (active_sprint.get("startDate") or "")[:10],
            "end": (active_sprint.get("endDate") or "")[:10],
        },
        "executive_summary": {
            "rag": rag,
            "committed_sp": committed_sp,
            "completed_sp": completed_sp,
            "remaining_sp": remaining_sp,
            "completion_pct": completion_pct,
            "total_tickets": total_tickets,
            "done_tickets": done_tickets,
            "highlight": highlight,
            "risk": risk,
        },
        "completed_issues": [_fmt_completed(i) for i in completed_issues],
        "in_progress_issues": [_fmt_in_progress(i) for i in in_progress],
        "blockers": [_fmt_blocker(i) for i in blockers],
        "team_workload": dict(workload),
        "bug_trend": bug_trend,
        "velocity_data": velocity_data,
        "next_sprint_issues": [_fmt_next(i) for i in next_sprint_issues],
    }


# ── Issue field helpers ──────────────────────────────────────────────────────

def _sp(issue):
    return issue["fields"].get("customfield_10016") or 0


def _assignee(issue):
    a = issue["fields"].get("assignee")
    return a["displayName"] if a else "Unassigned"


def _fmt_completed(issue):
    fields = issue["fields"]
    resolved = (fields.get("resolutiondate") or fields.get("updated") or "")[:10]
    return {
        "key": issue["key"],
        "summary": fields.get("summary", ""),
        "assignee": _assignee(issue),
        "sp": _sp(issue),
        "resolved": resolved,
    }


def _fmt_in_progress(issue):
    fields = issue["fields"]
    return {
        "key": issue["key"],
        "summary": fields.get("summary", ""),
        "assignee": _assignee(issue),
        "status": fields["status"]["name"],
        "percentage_done": fields.get("progress", {}).get("percent", ""),
        "due": (fields.get("duedate") or "")[:10],
    }


def _fmt_blocker(issue):
    fields = issue["fields"]
    comments = fields.get("comment", {}).get("comments", [])
    # Use the most recent comment body as the blocker description if available
    description = _comment_text(comments[-1].get("body"))[:120] if comments else fields.get("priority", {}).get("name", "Blocker")
    return {
        "key": issue["key"],
        "summary": fields.get("summary", ""),
        "description": description,
        "assignee": _assignee(issue),
        "flagged_since": (fields.get("created") or "")[:10],
    }


def _comment_text(body):
    if isinstance(body, str):
        return body
    if isinstance(body, dict):
        text = []
        for item in body.get("content", []):
            text.extend(node.get("text", "") for node in item.get("content", []) if isinstance(node, dict))
        return " ".join(text)
    return ""


def _fmt_next(issue):
    fields = issue["fields"]
    return {
        "key": issue["key"],
        "summary": fields.get("summary", ""),
        "priority": fields.get("priority", {}).get("name", ""),
        "sp": _sp(issue),
    }
