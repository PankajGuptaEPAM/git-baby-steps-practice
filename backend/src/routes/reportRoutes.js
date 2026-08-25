'use strict';

const { Router } = require('express');
const { buildReport } = require('../services/reportBuilder');
const { toMarkdown, toStorageFormat } = require('../formatters/confluenceFormatter');

const router = Router();

router.get('/sprints/current', async (req, res) => {
    try {
        const jira = require('../clients/jiraClient');
        const sprint = await jira.getActiveSprint();
        if (!sprint) return res.json({ data: null, message: 'No active sprint found.' });
        res.json({ data: sprint });
    } catch (err) {
        console.error('[sprints/current]', err.message);
        res.status(503).json({ error: { code: 'JIRA_UNAVAILABLE', message: 'Unable to reach Jira.' } });
    }
});

router.get('/reports/preview', async (req, res) => {
    const { date, format = 'json' } = req.query;
    if (!['json', 'markdown', 'storage'].includes(format)) {
        return res.status(400).json({ error: { code: 'INVALID_FORMAT', message: 'format must be json, markdown, or storage.', fields: { format: 'invalid' } } });
    }
    try {
        const report = await buildReport(date);
        if (report.noActiveSprint) return res.json({ data: null, message: 'No active sprint found.' });
        if (format === 'markdown') return res.type('text/plain').send(toMarkdown(report));
        if (format === 'storage') return res.type('text/plain').send(toStorageFormat(report));
        res.json({ data: report, proposedTitle: `Weekly Status Report - ${report.reportDate}` });
    } catch (err) {
        console.error('[reports/preview]', err.message);
        const isJira = err.message.includes('Jira') || err.message.includes('HTTP');
        res.status(isJira ? 503 : 500).json({ error: { code: isJira ? 'JIRA_UNAVAILABLE' : 'INTERNAL_ERROR', message: isJira ? 'Unable to reach Jira.' : 'Report generation failed.' } });
    }
});

router.get('/reports/:reportId', async (req, res) => {
    if (!/^\d+$/.test(req.params.reportId)) {
        return res.status(400).json({ error: { code: 'INVALID_ID', message: 'reportId must be numeric.', fields: { reportId: 'invalid' } } });
    }
    const db = req.app.locals.db;
    if (!db) return res.status(503).json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable.' } });
    try {
        const result = await db.query('SELECT * FROM reports WHERE id = $1', [req.params.reportId]);
        if (!result.rows.length) return res.status(404).json({ error: { code: 'NOT_FOUND', message: `Report ${req.params.reportId} not found.` } });
        res.json({ data: result.rows[0] });
    } catch (err) {
        console.error('[reports/:id]', err.message);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve report.' } });
    }
});

router.post('/reports', async (req, res) => {
    const db = req.app.locals.db;
    if (!db) return res.status(503).json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable.' } });
    try {
        const report = await buildReport(req.body?.date);
        if (report.noActiveSprint) return res.json({ data: null, message: 'No active sprint found. Report not generated.' });

        const markdown = toMarkdown(report);

        const sprintRow = await db.query(
            `INSERT INTO sprints (jira_sprint_id, name, start_date, end_date, state, committed_points, completed_points, remaining_points)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             ON CONFLICT (jira_sprint_id) DO UPDATE SET name=EXCLUDED.name, state=EXCLUDED.state,
               committed_points=EXCLUDED.committed_points, completed_points=EXCLUDED.completed_points, remaining_points=EXCLUDED.remaining_points
             RETURNING id`,
            [report.sprint.jiraSprintId, report.sprint.name, report.sprint.startDate, report.sprint.endDate, report.sprint.state,
             report.sprintProgress.committedPoints, report.sprintProgress.completedPoints, report.sprintProgress.remainingPoints]
        );

        const reportRow = await db.query(
            `INSERT INTO reports (report_date, sprint_id, status, content_markdown)
             VALUES ($1,$2,'generated',$3)
             ON CONFLICT (report_date, sprint_id) DO UPDATE SET status='generated', content_markdown=EXCLUDED.content_markdown, created_at=NOW()
             RETURNING id`,
            [report.reportDate, sprintRow.rows[0].id, markdown]
        );

        res.status(201).json({ data: { reportId: reportRow.rows[0].id, report } });
    } catch (err) {
        console.error('[POST /reports]', err.message);
        const isJira = err.message.includes('Jira') || err.message.includes('HTTP');
        res.status(isJira ? 503 : 500).json({ error: { code: isJira ? 'JIRA_UNAVAILABLE' : 'INTERNAL_ERROR', message: isJira ? 'Unable to reach Jira. Report not generated.' : 'Report generation failed.' } });
    }
});

module.exports = router;
