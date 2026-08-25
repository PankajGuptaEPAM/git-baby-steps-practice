const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function req(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json().catch(() => null);
    if (!res.ok && res.status !== 503) throw new Error(data?.error?.message || `HTTP ${res.status}`);
    return { status: res.status, data };
}

export const api = {
    getHealth: () => req('GET', '/api/health'),
    getCurrentSprint: () => req('GET', '/api/sprints/current'),
    getReportPreview: (date, format = 'json') => {
        const p = new URLSearchParams({ format });
        if (date) p.set('date', date);
        return req('GET', `/api/reports/preview?${p}`);
    },
    getReport: (id) => req('GET', `/api/reports/${id}`),
    createReport: (date) => req('POST', '/api/reports', date ? { date } : {}),
    publishReport: (id) => req('POST', `/api/reports/${id}/publish`),
};
