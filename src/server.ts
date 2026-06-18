import { buildApp } from './app.js';
import { env } from './config/environment.js';
import { pool } from './db/pool.js';

const app = buildApp();

async function start() {
  try {
    await pool.query('SELECT 1');
    app.log.info('Database connection verified');

    await app.listen({ port: env.port, host: '0.0.0.0' });
    app.log.info(`Server listening on port ${env.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

async function shutdown() {
  app.log.info('Shutting down gracefully...');
  await app.close();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);