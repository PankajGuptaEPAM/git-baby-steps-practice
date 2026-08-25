'use strict';

const https = require('https');
const http = require('http');

function request(options, body) {
    const mod = options.protocol === 'https:' ? https : http;
    return new Promise((resolve, reject) => {
        const req = mod.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    reject(new Error(`Jira HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
                } else {
                    try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(`Jira parse error: ${e.message}`)); }
                }
            });
        });
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('Jira request timeout')); });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

class JiraClient {
    _init() {
        if (this._auth) return;
        const base = process.env.JIRA_BASE_URL;
        const email = process.env.JIRA_EMAIL;
        const token = process.env.JIRA_API_TOKEN;
        if (!base || !email || !token) throw new Error('Missing Jira environment variables');
        this._base = new URL(base);
        this._auth = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;
        this._boardId = process.env.JIRA_BOARD_ID;
        this._projectKey = process.env.JIRA_PROJECT_KEY;
    }

    _opts(path) {
        this._init();
        return {
            protocol: this._base.protocol,
            hostname: this._base.hostname,
            port: this._base.port || (this._base.protocol === 'https:' ? 443 : 80),
            path,
            method: 'GET',
            headers: { Authorization: this._auth, Accept: 'application/json' },
        };
    }

    async getActiveSprint() {
        const data = await request(this._opts(`/rest/agile/1.0/board/${this._boardId}/sprint?state=active&maxResults=1`));
        return data.values?.[0] || null;
    }

    async getCompletedSprints(count = 5) {
        const data = await request(this._opts(`/rest/agile/1.0/board/${this._boardId}/sprint?state=closed&maxResults=${count}`));
        const vals = data.values || [];
        return vals.slice(-count);
    }

    async searchIssues(jql, fields) {
        const f = fields || 'summary,status,assignee,priority,issuetype,duedate,resolutiondate,customfield_10016,customfield_10014,updated';
        const path = `/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=100&fields=${f}`;
        const data = await request(this._opts(path));
        return data.issues || [];
    }

    getCompletedIssues(periodStart, periodEnd) {
        this._init();
        const jql = `project = ${this._projectKey} AND sprint in openSprints() AND status = Done AND updated >= "${periodStart}" AND updated < "${periodEnd}"`;
        return this.searchIssues(jql);
    }

    getInProgressIssues() {
        this._init();
        return this.searchIssues(`project = ${this._projectKey} AND sprint in openSprints() AND status != Done`);
    }

    getBlockers() {
        this._init();
        return this.searchIssues(`project = ${this._projectKey} AND sprint in openSprints() AND (flagged = Impediment OR priority = Blocker)`);
    }

    getNextSprintIssues() {
        this._init();
        return this.searchIssues(
            `project = ${this._projectKey} AND sprint in futureSprints() ORDER BY priority ASC`,
            'summary,priority,customfield_10016,issuetype'
        );
    }
}

module.exports = new JiraClient();
