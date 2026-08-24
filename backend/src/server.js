require('dotenv').config();

const { Pool } = require('pg');
const app = require('./app');

const port = Number(process.env.PORT || 3000);
const databasePool = process.env.DATABASE_URL
	? new Pool({ connectionString: process.env.DATABASE_URL })
	: null;

app.locals.checkDatabase = async () => {
	if (!databasePool) {
		return false;
	}

	try {
		await databasePool.query('SELECT 1');
		return true;
	} catch (error) {
		return false;
	}
};

const server = app.listen(port, () => {
	console.log(`Backend listening on port ${port}`);
});

const closeServer = async () => {
	server.close();
	if (databasePool) {
		await databasePool.end();
	}
};

process.on('SIGINT', closeServer);
process.on('SIGTERM', closeServer);
