const express = require('express');
const reportRoutes = require('./routes/reportRoutes');
const publishRoutes = require('./routes/publishRoutes');

const app = express();

app.use((request, response, next) => {
	response.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
	response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
	response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	if (request.method === 'OPTIONS') {
		return response.sendStatus(204);
	}
	next();
});

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

app.use('/api', reportRoutes);
app.use('/api', publishRoutes);

module.exports = app;
