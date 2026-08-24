import argparse
import logging
from pathlib import Path
import sys
from datetime import datetime

from dotenv import load_dotenv

from report_generator.jira_client import JiraClient
from report_generator.confluence_client import ConfluenceClient
from report_generator.report_builder import build_report
from report_generator.formatter import to_confluence_storage, to_markdown

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Generate and publish weekly sprint status report")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print report to console; do not publish to Confluence")
    parser.add_argument("--date", help="Report date override (YYYY-MM-DD)")
    args = parser.parse_args()

    report_date = args.date or datetime.utcnow().strftime("%Y-%m-%d")
    try:
        datetime.strptime(report_date, "%Y-%m-%d")
    except ValueError:
        parser.error("--date must be an ISO YYYY-MM-DD date")

    log.info("Fetching Jira data…")
    try:
        jira = JiraClient()
        active_sprint = jira.get_active_sprint()
        all_issues = jira.get_sprint_issues()
        completed_issues = jira.get_completed_issues(report_date)
        blockers = jira.get_blockers()
        next_sprint_issues = jira.get_next_sprint_issues()

        closed_sprints = jira.get_closed_sprints()
        velocity_data = []
        for sprint in reversed(closed_sprints):
            committed, completed = jira.get_sprint_velocity(sprint["id"])
            velocity_data.append({
                "sprint": sprint["name"],
                "committed": committed,
                "completed": completed,
            })

        bug_trend = jira.get_bug_trend()
    except Exception as exc:
        log.error("Jira fetch failed: %s", exc)
        sys.exit(1)

    log.info("Building report…")
    report = build_report(
        active_sprint, all_issues, completed_issues, blockers,
        next_sprint_issues, velocity_data, bug_trend,
    )
    report["report_date"] = report_date

    page_title = f"Weekly Status Report - {report_date}"
    body = to_confluence_storage(report)

    if args.dry_run:
        print(f"\n{'=' * 60}")
        print(f"TITLE: {page_title}")
        print("=" * 60)
        print(body)
        return

    log.info("Publishing to Confluence…")
    try:
        confluence = ConfluenceClient()
        url, action = confluence.create_or_update_page(page_title, body)
        log.info("Page %s: %s", action, url)
    except Exception as exc:
        log.error("Confluence publish failed: %s", exc)
        fallback_path = Path("reports") / f"weekly-status-report-{report_date}.md"
        fallback_path.parent.mkdir(parents=True, exist_ok=True)
        fallback_path.write_text(to_markdown(report), encoding="utf-8")
        log.error("Markdown fallback saved to %s", fallback_path)
        sys.exit(1)


if __name__ == "__main__":
    main()