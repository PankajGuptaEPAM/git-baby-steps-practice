'use strict';

const https = require('https');
const http = require('http');

class ConfluenceClient {
    _init() {
        if (this._auth) return;
        const base = process.env.CONFLUENCE_BASE_URL;
        const email = process.env.CONFLUENCE_EMAIL;
        const token = process.env.CONFLUENCE_API_TOKEN;
        if (!base || !email || !token) throw new Error('Missing Confluence environment variables');
        this._base = new URL(base);
        this._auth = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;
        this._parentPageId = process.env.CONFLUENCE_PARENT_PAGE_ID;
    }

    async createPage(title, storageBody) {
        this._init();
        const payload = JSON.stringify({
            type: 'page',
            title,
            ancestors: [{ id: this._parentPageId }],
            body: { storage: { value: storageBody, representation: 'storage' } },
        });
        const mod = this._base.protocol === 'https:' ? https : http;
        return new Promise((resolve, reject) => {
            const opts = {
                protocol: this._base.protocol,
                hostname: this._base.hostname,
                port: this._base.port || (this._base.protocol === 'https:' ? 443 : 80),
                path: '/rest/api/content',
                method: 'POST',
                headers: {
                    Authorization: this._auth,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                },
            };
            const req = mod.request(opts, (res) => {
                let data = '';
                res.on('data', c => { data += c; });
                res.on('end', () => {
                    if (res.statusCode >= 400) {
                        reject(new Error(`Confluence HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
                    } else {
                        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(`Confluence parse error: ${e.message}`)); }
                    }
                });
            });
            req.setTimeout(15000, () => { req.destroy(); reject(new Error('Confluence request timeout')); });
            req.on('error', reject);
            req.write(payload);
            req.end();
        });
    }
}

module.exports = new ConfluenceClient();
