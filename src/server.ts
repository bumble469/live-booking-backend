// src/server.ts
import { buildApp } from './app.js';
import { env } from './config/environment.js';
import { pool } from './db/pool.js';
import { initSocket } from './websockets/socket.js';
import { startLockExpiryJob } from './utils/lockExpiry.js';

const app = buildApp();

async function start() {
  try {
    await pool.query('SELECT 1');
    app.log.info('Database connection verified');

    await app.listen({ port: env.port, host: '0.0.0.0' });

    initSocket(app.server);

    const expiryJob = startLockExpiryJob(30);

    app.log.info(`Server listening on port ${env.port}`);

    async function shutdown() {
      app.log.info('Shutting down gracefully...');
      clearInterval(expiryJob); 
      await app.close();
      await pool.end();
      process.exit(0);
    }

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();