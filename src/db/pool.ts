// src/db/pool.ts
import { Pool } from 'pg';
import { env } from '../config/environment.js';

export const pool = new Pool({
  connectionString: env.databaseUrl,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});