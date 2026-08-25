'use strict';

const jira = require('../clients/jiraClient');
const { calculateWorkload } = require('./workloadService');
const { calculateVelocityRecords } = require('./velocityService');

function getReportPeriod(reportDate) {
    const d = new Date(`${reportDate}T00:00:00Z`);
    const end = new Date(d); end.setUTCDate(end.getUTCDate() + 1);
    const start = new Date(d); start.setUTCDate(start.getUTCDate() - 6);
    const fmt = dt => dt.toISOString().slice(0, 19).replace('T', ' ');
    return { start: fmt(start), end: fmt(end) };
}

function sp(issue) {
    return Number(issue.fields?.customfield_10016 || 0);
}

function ragStatus(pct, blockers) {
    if (pct >= 80 && blockers.length === 0) return 'GREEN';
    if (pct >= 50 || blockers.length <= 2) return 'AMBER';
    return 'RED';
}

async function buildReport(reportDateStr) {
    const reportDate = reportDateStr || new Date().toISOString().slice(0, 10);
    const period = getReportPeriod(reportDate);

    const activeSprint = await jira.getActiveSprint();
    if (!activeSprint) return { noActiveSprint: true, reportDate };

    const [completed, inProgress, blockers, nextSprint, closedSprints] = await Promise.all([
        jira.getCompletedIssues(period.start, period.end),
        jira.getInProgressIssues(),
        jira.getBlockers(),
        jira.getNextSprintIssues(),
        jira.getCompletedSprints(5),
    ]);

    const all = [...completed, ...inProgress];
    const committedPoints = all.reduce((s, i) => s + sp(i), 0);
    const completedPoints = completed.reduce((s, i) => s + sp(i), 0);
    const remainingPoints = committedPoints - completedPoints;
    const completionPct = committedPoints > 0 ? Math.round((completedPoints / committedPoints) * 100) : 0;

    return {
        reportDate,
        generatedAt: new Date().toISOString(),
        noActiveSprint: false,
        sprint: { jiraSprintId: activeSprint.id, name: activeSprint.name, startDate: activeSprint.startDate, endDate: activeSprint.endDate, state: activeSprint.state },
        executiveSummary: {
            sprintName: activeSprint.name,
            sprintStartDate: activeSprint.startDate,
            sprintEndDate: activeSprint.endDate,
            ragStatus: ragStatus(completionPct, blockers),
            committedPoints,
            completedPoints,
            remainingPoints,
            completionPercentage: completionPct,
            highlight: `${completed.length} issue(s) completed this week.`,
            risk: blockers.length > 0 ? `${blockers.length} blocker(s) require attention.` : 'No blockers identified.',
        },
        sprintProgress: { committedPoints, completedPoints, remainingPoints, percentageDone: completionPct, totalTickets: all.length, completedTickets: completed.length, remainingTickets: inProgress.length },
        completedIssues: completed.map(i => ({ ticketId: i.key, summary: i.fields?.summary || '', assignee: i.fields?.assignee?.displayName || 'Unassigned', storyPoints: sp(i), resolvedDate: i.fields?.resolutiondate || null })),
        inProgressItems: inProgress.map(i => ({ ticketId: i.key, summary: i.fields?.summary || '', assignee: i.fields?.assignee?.displayName || 'Unassigned', status: i.fields?.status?.name || '', percentageDone: Number(i.fields?.customfield_10014 || 0), dueDate: i.fields?.duedate || null })),
        blockers: blockers.map(b => ({ ticketId: b.key, summary: b.fields?.summary || '', blockerDescription: b.fields?.priority?.name === 'Blocker' ? 'Priority: Blocker' : 'Flagged as impediment', assignee: b.fields?.assignee?.displayName || 'Unassigned', flaggedSince: b.fields?.updated || null })),
        teamWorkload: calculateWorkload(all),
        bugTrend: [{ sprint: activeSprint.name, bugsOpened: inProgress.filter(i => i.fields?.issuetype?.name === 'Bug').length, bugsClosed: completed.filter(i => i.fields?.issuetype?.name === 'Bug').length, get netChange() { return this.bugsClosed - this.bugsOpened; } }],
        velocityTrend: calculateVelocityRecords(closedSprints.map(s => ({ name: s.name, committedPoints: s.committedPoints || 0, completedPoints: s.completedPoints || 0 }))),
        nextSprintGoals: nextSprint.map(i => ({ ticketId: i.key, summary: i.fields?.summary || '', priority: i.fields?.priority?.name || '', storyPoints: sp(i) })),
    };
}

module.exports = { buildReport };
