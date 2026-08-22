import argparse
import os
import sys
from collections import defaultdict

from dotenv import load_dotenv

load_dotenv()

_JIRA_CONFIGURED = all(
    os.getenv(k) for k in ("JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN", "JIRA_BOARD_ID", "JIRA_PROJECT_KEY")
)

_FAKE_ISSUES = [
    {"assignee": "Alice",   "summary": "Design login flow",           "type": "Story", "sp": 5,  "status": "Done"},
    {"assignee": "Alice",   "summary": "Fix auth token expiry bug",   "type": "Bug",   "sp": 3,  "status": "Done"},
    {"assignee": "Alice",   "summary": "Write unit tests for auth",   "type": "Task",  "sp": 2,  "status": "In Progress"},
    {"assignee": "Bob",     "summary": "Build report generator",      "type": "Story", "sp": 8,  "status": "In Progress"},
    {"assignee": "Bob",     "summary": "Integrate Jira REST API",     "type": "Task",  "sp": 5,  "status": "Done"},
    {"assignee": "Bob",     "summary": "Pagination support",          "type": "Task",  "sp": 3,  "status": "To Do"},
    {"assignee": "Carol",   "summary": "Set up CI pipeline",          "type": "Task",  "sp": 5,  "status": "Done"},
    {"assignee": "Carol",   "summary": "Confluence publisher module", "type": "Story", "sp": 8,  "status": "In Progress"},
    {"assignee": "David",   "summary": "Sprint planning doc",         "type": "Task",  "sp": 2,  "status": "Done"},
    {"assignee": "David",   "summary": "Backlog grooming",            "type": "Task",  "sp": 1,  "status": "Done"},
    {"assignee": "David",   "summary": "Performance profiling",       "type": "Story", "sp": 5,  "status": "To Do"},
    {"assignee": "Unassigned", "summary": "Update README",            "type": "Task",  "sp": 1,  "status": "To Do"},
]


def _sp(issue):
    return issue["fields"].get("customfield_10016") or 0


def _assignee_name(issue):
    a = issue["fields"].get("assignee")
    return a["displayName"] if a else "Unassigned"


def _issue_type(issue):
    return issue["fields"].get("issuetype", {}).get("name", "Unknown")


def _status(issue):
    return issue["fields"].get("status", {}).get("name", "Unknown")


def _fetch_from_jira(sprint_number):
    from report_generator.jira_client import JiraClient
    jira = JiraClient()

    if sprint_number is None:
        sprint = jira.get_active_sprint()
        sprint_id, sprint_name = sprint["id"], sprint["name"]
    else:
        closed = jira.get_closed_sprints(limit=50)
        match = [s for s in closed if str(sprint_number) in s["name"]]
        if not match:
            print(f"Sprint {sprint_number} not found.", file=sys.stderr)
            sys.exit(1)
        sprint_id, sprint_name = match[0]["id"], match[0]["name"]

    jql = f"project = {jira.project_key} AND sprint = {sprint_id}"
    raw = jira._search(jql, ["summary", "assignee", "status", "issuetype", "customfield_10016"])

    issues = [
        {
            "assignee": _assignee_name(i),
            "summary":  i["fields"]["summary"],
            "type":     _issue_type(i),
            "sp":       _sp(i),
            "status":   _status(i),
        }
        for i in raw
    ]
    return sprint_name, issues


def _fetch_fake(sprint_number):
    name = f"Sprint {sprint_number} (fake)" if sprint_number else "Sprint 24 — current (fake)"
    return name, _FAKE_ISSUES


def _build_workload(issues):
    workload = defaultdict(lambda: {"total_sp": 0, "done_sp": 0, "issues": []})
    for issue in issues:
        dev = issue["assignee"]
        workload[dev]["total_sp"] += issue["sp"]
        if issue["status"].lower() in ("done", "closed", "resolved"):
            workload[dev]["done_sp"] += issue["sp"]
        workload[dev]["issues"].append(issue)
    return workload


def _print_report(sprint_name, workload):
    total_sp = sum(v["total_sp"] for v in workload.values())
    print(f"Sprint: {sprint_name}")
    print(f"{'='*60}")

    for dev in sorted(workload):
        data = workload[dev]
        pct = data["done_sp"] / data["total_sp"] * 100 if data["total_sp"] else 0
        print(f"\n{dev}  —  {data['total_sp']} SP assigned  |  {data['done_sp']} SP done  ({pct:.0f}%)")
        print(f"  {'TYPE':<8} {'SP':>3}  {'STATUS':<14} SUMMARY")
        print(f"  {'-'*55}")
        for issue in data["issues"]:
            print(f"  {issue['type']:<8} {issue['sp']:>3}  {issue['status']:<14} {issue['summary']}")

    print(f"\n{'='*60}")
    print(f"Team total:  {total_sp} SP across {sum(len(v['issues']) for v in workload.values())} issues  |  {len(workload)} contributors")


def main():
    parser = argparse.ArgumentParser(description="Show per-developer workload for a sprint")
    parser.add_argument("--sprint", type=int, default=None,
                        help="Sprint number to analyse (omit for current/active sprint)")
    args = parser.parse_args()

    if not _JIRA_CONFIGURED:
        print("WARNING: No Jira connection configured — using fake data.")
        print("         Set JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_BOARD_ID, JIRA_PROJECT_KEY in .env\n")
        sprint_name, issues = _fetch_fake(args.sprint)
    else:
        sprint_name, issues = _fetch_from_jira(args.sprint)

    workload = _build_workload(issues)
    _print_report(sprint_name, workload)


if __name__ == "__main__":
    main()
