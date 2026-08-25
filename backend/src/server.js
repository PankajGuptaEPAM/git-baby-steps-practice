require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const app = require('./app');

const port = Number(process.env.PORT || 3000);
const databasePool = process.env.DATABASE_URL
	? new Pool({ connectionString: process.env.DATABASE_URL })
	: null;

app.locals.db = databasePool;

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

async function runMigrations() {
	if (!databasePool) return;
	const dir = path.resolve(__dirname, '../../database/migrations');
	if (!fs.existsSync(dir)) return;
	const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
	for (const file of files) {
		try {
			await databasePool.query(fs.readFileSync(path.join(dir, file), 'utf8'));
			console.log(`[migration] ${file}`);
		} catch (err) {
			console.error(`[migration] Error in ${file}:`, err.message);
		}
	}
}

runMigrations().then(() => {
	const server = app.listen(port, () => {
		console.log(`Backend listening on port ${port}`);
	});
	const closeServer = async () => { server.close(); if (databasePool) await databasePool.end(); };
	process.on('SIGINT', closeServer);
	process.on('SIGTERM', closeServer);
});
