'use strict';

function toMarkdown(report) {
    if (report.noActiveSprint) return `# Weekly Status Report - ${report.reportDate}\n\nNo active sprint found.\n`;
    const s = report.executiveSummary;
    const p = report.sprintProgress;
    const row = cells => `| ${cells.join(' | ')} |`;
    const lines = [
        `# Weekly Status Report - ${report.reportDate}`,
        `\n## 1. Executive Summary`,
        `- **Sprint:** ${s.sprintName}`,
        `- **Period:** ${s.sprintStartDate} ? ${s.sprintEndDate}`,
        `- **RAG Status:** ${s.ragStatus}`,
        `- **Story Points:** ${s.completedPoints}/${s.committedPoints} (${s.completionPercentage}%)`,
        `- **Highlight:** ${s.highlight}`,
        `- **Risk:** ${s.risk}`,
        `\n## 2. Sprint Progress`,
        row(['Metric', 'Value']), row(['---', '---']),
        ...[ ['Committed Points', p.committedPoints], ['Completed Points', p.completedPoints], ['Remaining Points', p.remainingPoints], ['% Done', `${p.percentageDone}%`], ['Total Tickets', p.totalTickets], ['Completed Tickets', p.completedTickets] ].map(r => row(r)),
        `\n## 3. Completed Issues`,
        ...(report.completedIssues.length ? [row(['Ticket','Summary','Assignee','Points','Resolved']), row(['---','---','---','---','---']), ...report.completedIssues.map(i => row([i.ticketId, i.summary, i.assignee, i.storyPoints, i.resolvedDate || '-']))] : ['None this sprint.']),
        `\n## 4. In-Progress Items`,
        ...(report.inProgressItems.length ? [row(['Ticket','Summary','Assignee','Status','% Done','Due']), row(['---','---','---','---','---','---']), ...report.inProgressItems.map(i => row([i.ticketId, i.summary, i.assignee, i.status, `${i.percentageDone}%`, i.dueDate || '-']))] : ['None this sprint.']),
        `\n## 5. Blockers / Flagged Issues`,
        ...(report.blockers.length ? [row(['Ticket','Summary','Description','Assignee','Flagged Since']), row(['---','---','---','---','---']), ...report.blockers.map(b => row([b.ticketId, b.summary, b.blockerDescription, b.assignee, b.flaggedSince || '-']))] : ['None this sprint.']),
        `\n## 6. Team Workload`,
        ...(report.teamWorkload.length ? [row(['Assignee','Assigned','Completed','In Progress','Points']), row(['---','---','---','---','---']), ...report.teamWorkload.map(m => row([m.assignee, m.assigned, m.completed, m.inProgress, m.storyPoints]))] : ['None this sprint.']),
        `\n## 7. Bug Trend`,
        row(['Sprint','Bugs Opened','Bugs Closed','Net Change']), row(['---','---','---','---']),
        ...report.bugTrend.map(b => row([b.sprint, b.bugsOpened, b.bugsClosed, b.netChange])),
        `\n## 8. Velocity Trend`,
        ...(report.velocityTrend.length ? [row(['Sprint','Committed','Completed','Velocity %']), row(['---','---','---','---']), ...report.velocityTrend.map(v => row([v.sprintName, v.committed, v.completed, `${v.velocityPercentage}%`]))] : ['No historical sprint data.']),
        `\n## 9. Next Sprint Goals`,
        ...(report.nextSprintGoals.length ? [row(['Ticket','Summary','Priority','Points']), row(['---','---','---','---']), ...report.nextSprintGoals.map(g => row([g.ticketId, g.summary, g.priority, g.storyPoints]))] : ['None scheduled.']),
        `\n---\n*Generated: ${report.generatedAt}*`,
    ];
    return lines.join('\n');
}

function toStorageFormat(report) {
    if (report.noActiveSprint) return `<p>No active sprint found for report date ${report.reportDate}.</p>`;
    const s = report.executiveSummary;
    const p = report.sprintProgress;
    const ragColor = s.ragStatus === 'GREEN' ? '#00875a' : s.ragStatus === 'AMBER' ? '#ff8b00' : '#de350b';
    const th = cells => `<tr>${cells.map(c => `<th>${c}</th>`).join('')}</tr>`;
    const td = cells => `<tr>${cells.map(c => `<td>${c ?? '-'}</td>`).join('')}</tr>`;
    const table = (headers, rows, empty) => rows.length === 0 ? `<p><em>${empty}</em></p>` : `<table><tbody>${th(headers)}${rows.map(r => td(r)).join('')}</tbody></table>`;
    return [
        `<h1>Weekly Status Report - ${report.reportDate}</h1>`,
        `<h2>1. Executive Summary</h2><table><tbody>`,
        `<tr><td><strong>Sprint</strong></td><td>${s.sprintName}</td></tr>`,
        `<tr><td><strong>Period</strong></td><td>${s.sprintStartDate} ? ${s.sprintEndDate}</td></tr>`,
        `<tr><td><strong>RAG Status</strong></td><td><span style="color:${ragColor};font-weight:bold">${s.ragStatus}</span></td></tr>`,
        `<tr><td><strong>Story Points</strong></td><td>${s.completedPoints}/${s.committedPoints} (${s.completionPercentage}%)</td></tr>`,
        `<tr><td><strong>Highlight</strong></td><td>${s.highlight}</td></tr>`,
        `<tr><td><strong>Risk</strong></td><td>${s.risk}</td></tr>`,
        `</tbody></table>`,
        `<h2>2. Sprint Progress</h2>`,
        table(['Metric','Value'], [['Committed Points',p.committedPoints],['Completed Points',p.completedPoints],['Remaining Points',p.remainingPoints],['% Done',`${p.percentageDone}%`],['Total Tickets',p.totalTickets],['Completed Tickets',p.completedTickets]], ''),
        `<h2>3. Completed Issues</h2>`,
        table(['Ticket','Summary','Assignee','Points','Resolved'], report.completedIssues.map(i => [i.ticketId, i.summary, i.assignee, i.storyPoints, i.resolvedDate]), 'None this sprint.'),
        `<h2>4. In-Progress Items</h2>`,
        table(['Ticket','Summary','Assignee','Status','% Done','Due'], report.inProgressItems.map(i => [i.ticketId, i.summary, i.assignee, i.status, `${i.percentageDone}%`, i.dueDate]), 'None this sprint.'),
        `<h2>5. Blockers / Flagged Issues</h2>`,
        table(['Ticket','Summary','Description','Assignee','Flagged Since'], report.blockers.map(b => [b.ticketId, b.summary, b.blockerDescription, b.assignee, b.flaggedSince]), 'None this sprint.'),
        `<h2>6. Team Workload</h2>`,
        table(['Assignee','Assigned','Completed','In Progress','Points'], report.teamWorkload.map(m => [m.assignee, m.assigned, m.completed, m.inProgress, m.storyPoints]), 'None this sprint.'),
        `<h2>7. Bug Trend</h2>`,
        table(['Sprint','Bugs Opened','Bugs Closed','Net Change'], report.bugTrend.map(b => [b.sprint, b.bugsOpened, b.bugsClosed, b.netChange]), 'No data.'),
        `<h2>8. Velocity Trend</h2>`,
        table(['Sprint','Committed','Completed','Velocity %'], report.velocityTrend.map(v => [v.sprintName, v.committed, v.completed, `${v.velocityPercentage}%`]), 'No historical data.'),
        `<h2>9. Next Sprint Goals</h2>`,
        table(['Ticket','Summary','Priority','Points'], report.nextSprintGoals.map(g => [g.ticketId, g.summary, g.priority, g.storyPoints]), 'None scheduled.'),
        `<p><em>Generated: ${report.generatedAt}</em></p>`,
    ].join('\n');
}

module.exports = { toMarkdown, toStorageFormat };
