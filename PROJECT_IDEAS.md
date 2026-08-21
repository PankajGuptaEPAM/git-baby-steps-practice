# Jira / Confluence Automation Ideas for Managers

---

## 1. Weekly Sprint Status Digest

**Problem it solves:**  
Managers spend time manually checking Jira boards and writing status update emails. This automation generates and sends a weekly digest summarising sprint progress, blockers, and velocity trends.

**Data needed:**
- Active sprint issues (status, assignee, story points)
- Issues flagged as blocked or overdue
- Completed vs. committed story points
- Team member workload distribution

---

## 2. Automatic Meeting Notes Publisher

**Problem it solves:**  
Action items discussed in meetings often get lost or never reach the right people. This automation takes structured meeting notes and creates a Confluence page with action items, owners, and due dates — then creates corresponding Jira tasks automatically.

**Data needed:**
- Meeting title, date, and attendees
- Raw meeting notes or transcript (structured format)
- Confluence space and parent page to publish under
- Jira project and default issue type for action items

---

## 3. Stale Ticket Escalation Reporter

**Problem it solves:**  
Tickets that haven't been updated in days or weeks fall through the cracks, delaying delivery. This automation identifies stale Jira issues, notifies assignees, and generates a Confluence report page for the manager to review unresolved blockers.

**Data needed:**
- All open issues with their last-updated timestamp
- Configurable staleness threshold (e.g., no update in 5+ days)
- Assignee email or Jira account ID for notifications
- Confluence space to publish the escalation report
