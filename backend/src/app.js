const express = require('express');

const app = express();

app.use(express.json());

app.get('/api/health', async (request, response) => {
	const databaseReady = typeof request.app.locals.checkDatabase === 'function'
		? await request.app.locals.checkDatabase()
		: false;

	response.status(databaseReady ? 200 : 503).json({
		status: databaseReady ? 'ready' : 'degraded',
		application: { ready: true },
		database: { ready: databaseReady },
	});
});

module.exports = app;
