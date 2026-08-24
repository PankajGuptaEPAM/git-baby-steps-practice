import os
import requests
from requests.auth import HTTPBasicAuth
from datetime import date, datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()


class JiraClient:
    def __init__(self):
        self.base_url = os.environ["JIRA_BASE_URL"]
        self.auth = HTTPBasicAuth(os.environ["JIRA_EMAIL"], os.environ["JIRA_API_TOKEN"])
        self.board_id = os.environ["JIRA_BOARD_ID"]
        self.project_key = os.environ["JIRA_PROJECT_KEY"]
        self.velocity_sprints = int(os.getenv("VELOCITY_SPRINTS", "5"))
        self.session = requests.Session()
        self.session.auth = self.auth
        self.session.headers.update({"Accept": "application/json"})

    def _get(self, path, params=None):
        url = f"{self.base_url}{path}"
        resp = self.session.get(url, params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def _search(self, jql, fields, max_results=200):
        all_issues = []
        start_at = 0
        while True:
            data = self._get("/rest/api/2/search", params={
                "jql": jql,
                "fields": ",".join(fields),
                "maxResults": max_results,
                "startAt": start_at,
            })
            issues = data.get("issues", [])
            all_issues.extend(issues)
            if start_at + len(issues) >= data.get("total", 0):
                break
            start_at += len(issues)
        return all_issues

    def get_active_sprint(self):
        data = self._get(
            f"/rest/agile/1.0/board/{self.board_id}/sprint",
            params={"state": "active"},
        )
        sprints = data.get("values", [])
        if not sprints:
            raise RuntimeError(f"No active sprint found for board {self.board_id}")
        return sprints[0]

    def get_sprint_issues(self):
        jql = f"project = {self.project_key} AND sprint in openSprints()"
        fields = [
            "summary", "status", "assignee", "customfield_10016",
            "priority", "issuetype", "updated", "duedate", "flagged",
        ]
        return self._search(jql, fields)

    def get_completed_issues(self, report_date=None):
        report_day = _parse_report_date(report_date)
        period_start = datetime.combine(report_day - timedelta(days=6), datetime.min.time(), tzinfo=timezone.utc)
        period_end = datetime.combine(report_day + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)
        jql = (
            f"project = {self.project_key} AND sprint in openSprints() "
            f'AND status = Done AND updated >= "{period_start:%Y-%m-%d %H:%M}" '
            f'AND updated < "{period_end:%Y-%m-%d %H:%M}"'
        )
        fields = ["summary", "status", "assignee", "customfield_10016", "resolutiondate", "updated"]
        return self._search(jql, fields)

    def get_blockers(self):
        jql = (
            f"project = {self.project_key} AND sprint in openSprints() "
            "AND (flagged = Impediment OR priority = Blocker)"
        )
        fields = ["summary", "assignee", "priority", "flagged", "created", "comment"]
        return self._search(jql, fields)

    def get_next_sprint_issues(self):
        jql = f"project = {self.project_key} AND sprint in futureSprints() ORDER BY priority ASC"
        fields = ["summary", "priority", "customfield_10016", "assignee"]
        return self._search(jql, fields, max_results=20)

    def get_closed_sprints(self, limit=None):
        n = limit or self.velocity_sprints
        data = self._get(
            f"/rest/agile/1.0/board/{self.board_id}/sprint",
            params={"state": "closed", "maxResults": n},
        )
        sprints = data.get("values", [])
        return sorted(sprints, key=lambda s: s.get("startDate", ""), reverse=True)[:n]

    def get_sprint_velocity(self, sprint_id):
        """Return (committed_sp, completed_sp) for a given sprint."""
        jql = f"project = {self.project_key} AND sprint = {sprint_id}"
        issues = self._search(jql, ["status", "customfield_10016"])
        committed = sum(_sp(i) for i in issues)
        completed = sum(
            _sp(i) for i in issues
            if i["fields"]["status"]["statusCategory"]["key"] == "done"
        )
        return committed, completed

    def get_bug_trend(self):
        """Return per-sprint bug open/close counts for the last N closed sprints."""
        sprints = self.get_closed_sprints()
        trend = []
        for sprint in reversed(sprints):
            sid = sprint["id"]
            opened = len(self._search(
                f"project = {self.project_key} AND sprint = {sid} AND issuetype = Bug",
                ["summary"],
            ))
            closed = len(self._search(
                f"project = {self.project_key} AND sprint = {sid} AND issuetype = Bug AND status = Done",
                ["summary"],
            ))
            trend.append({
                "sprint": sprint["name"],
                "opened": opened,
                "closed": closed,
                "net": opened - closed,
            })
        return trend


def _sp(issue):
    return issue["fields"].get("customfield_10016") or 0


def _parse_report_date(report_date):
    if report_date is None:
        return datetime.now(timezone.utc).date()
    if isinstance(report_date, date):
        return report_date
    try:
        return date.fromisoformat(report_date)
    except (TypeError, ValueError) as exc:
        raise ValueError("report_date must be an ISO YYYY-MM-DD date") from exc
