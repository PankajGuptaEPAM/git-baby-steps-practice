'use strict';

const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const confluence = require('../clients/confluenceClient');

const router = Router();

router.post('/reports/:reportId/publish', async (req, res) => {
    if (!/^\d+$/.test(req.params.reportId)) {
        return res.status(400).json({ error: { code: 'INVALID_ID', message: 'reportId must be numeric.', fields: { reportId: 'invalid' } } });
    }
    const db = req.app.locals.db;
    if (!db) return res.status(503).json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable.' } });

    try {
        const result = await db.query('SELECT * FROM reports WHERE id = $1', [req.params.reportId]);
        if (!result.rows.length) return res.status(404).json({ error: { code: 'NOT_FOUND', message: `Report ${req.params.reportId} not found.` } });

        const row = result.rows[0];
        const reportDate = String(row.report_date).slice(0, 10);
        const title = `Weekly Status Report - ${reportDate}`;
        const storageBody = row.content_markdown
            ? `<ac:structured-macro ac:name="noformat"><ac:plain-text-body><![CDATA[${row.content_markdown}]]></ac:plain-text-body></ac:structured-macro>`
            : '<p>No content available.</p>';

        let page;
        try {
            page = await confluence.createPage(title, storageBody);
        } catch (confErr) {
            console.error('[publish] Confluence error:', confErr.message);
            const dir = path.resolve(__dirname, '../../../../reports');
            fs.mkdirSync(dir, { recursive: true });
            const fallback = path.join(dir, `${title.replace(/\s+/g, '-')}.md`);
            fs.writeFileSync(fallback, row.content_markdown || '');
            await db.query(`UPDATE reports SET status='fallback', fallback_file_path=$1 WHERE id=$2`, [fallback, req.params.reportId]);
            return res.status(503).json({
                error: { code: 'CONFLUENCE_UNAVAILABLE', message: 'Confluence publish failed. Report saved locally.' },
                data: { fallbackFilePath: fallback },
            });
        }

        const pageUrl = page._links?.webui ? `${process.env.CONFLUENCE_BASE_URL}${page._links.webui}` : null;
        await db.query(`UPDATE reports SET status='published', published_at=NOW(), confluence_page_id=$1, confluence_page_url=$2 WHERE id=$3`,
            [page.id, pageUrl, req.params.reportId]);

        res.json({ data: { pageId: page.id, pageUrl, title } });
    } catch (err) {
        console.error('[publish]', err.message);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Publish failed.' } });
    }
});

module.exports = router;
