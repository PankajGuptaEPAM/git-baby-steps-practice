'use strict';

function calculateWorkload(issues) {
    const map = new Map();
    for (const issue of issues) {
        const a = issue.fields?.assignee;
        if (!a) continue;
        const key = a.accountId || a.name || a.displayName;
        if (!map.has(key)) {
            map.set(key, { assignee: a.displayName || key, assigneeId: key, assigned: 0, completed: 0, inProgress: 0, storyPoints: 0 });
        }
        const m = map.get(key);
        m.assigned++;
        const st = (issue.fields?.status?.name || '').toLowerCase();
        if (st === 'done') m.completed++;
        else if (!['to do', 'open', 'backlog'].includes(st)) m.inProgress++;
        m.storyPoints += Number(issue.fields?.customfield_10016 || 0);
    }
    return Array.from(map.values());
}

module.exports = { calculateWorkload };
