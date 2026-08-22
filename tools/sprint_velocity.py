import argparse
import os
import sys

from dotenv import load_dotenv

load_dotenv()

_JIRA_CONFIGURED = all(
    os.getenv(k) for k in ("JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN", "JIRA_BOARD_ID", "JIRA_PROJECT_KEY")
)

_FAKE_SPRINTS = {
    "current": {"name": "Sprint 24 (current)", "issues": [8, 5, 3, 13, 5, 2, 8, 3, 5, 0]},
    "23":      {"name": "Sprint 23",            "issues": [5, 8, 3, 5, 2, 13, 0, 3, 8, 5]},
    "22":      {"name": "Sprint 22",            "issues": [3, 5, 8, 0, 5, 2, 3, 13, 5, 8]},
}


def _sp(issue):
    return issue["fields"].get("customfield_10016") or 0


def _fetch_from_jira(sprint_number):
    from report_generator.jira_client import JiraClient
    jira = JiraClient()

    if sprint_number is None:
        sprint = jira.get_active_sprint()
        sprint_id = sprint["id"]
        sprint_name = sprint["name"]
    else:
        # find the closed sprint by number in its name
        closed = jira.get_closed_sprints(limit=50)
        match = [s for s in closed if str(sprint_number) in s["name"]]
        if not match:
            print(f"Sprint {sprint_number} not found.", file=sys.stderr)
            sys.exit(1)
        sprint_id = match[0]["id"]
        sprint_name = match[0]["name"]

    jql = f"project = {jira.project_key} AND sprint = {sprint_id}"
    issues = jira._search(jql, ["status", "customfield_10016", "summary"])
    committed = sum(_sp(i) for i in issues)
    completed = sum(
        _sp(i) for i in issues
        if i["fields"]["status"]["statusCategory"]["key"] == "done"
    )
    return sprint_name, issues, committed, completed


def _fetch_fake(sprint_number):
    key = str(sprint_number) if sprint_number is not None else "current"
    data = _FAKE_SPRINTS.get(key, _FAKE_SPRINTS["current"])
    points = data["issues"]
    # treat last 40% as "done" for plausible fake velocity
    done_count = max(1, int(len(points) * 0.6))
    committed = sum(points)
    completed = sum(points[:done_count])
    return data["name"], len(points), committed, completed


def main():
    parser = argparse.ArgumentParser(description="Calculate sprint velocity from Jira story points")
    parser.add_argument(
        "--sprint", type=int, default=None,
        help="Sprint number to analyse (omit for current/active sprint)"
    )
    args = parser.parse_args()

    if not _JIRA_CONFIGURED:
        print("WARNING: No Jira connection configured — using fake data.")
        print("         Set JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_BOARD_ID, JIRA_PROJECT_KEY in .env")
        print()
        sprint_name, issue_count, committed, completed = _fetch_fake(args.sprint)
    else:
        sprint_name, issues, committed, completed = _fetch_from_jira(args.sprint)
        issue_count = len(issues)

    velocity = completed / committed * 100 if committed else 0

    print(f"Sprint:          {sprint_name}")
    print(f"Total issues:    {issue_count}")
    print(f"Committed SP:    {committed}")
    print(f"Completed SP:    {completed}")
    print(f"Velocity:        {velocity:.1f}%")


if __name__ == "__main__":
    main()
