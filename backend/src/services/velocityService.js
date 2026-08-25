'use strict';

function calculateVelocityRecords(sprints) {
    return sprints.map(s => {
        const committed = Number(s.committedPoints || 0);
        const completed = Number(s.completedPoints || 0);
        const pct = committed > 0 ? Math.round((completed / committed) * 100) : 0;
        return { sprintName: s.name, committed, completed, velocityPercentage: pct };
    });
}

module.exports = { calculateVelocityRecords };
