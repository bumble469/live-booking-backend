import { pool } from '../../db/pool.js';
import type { ScreenRow } from './screen_types.js';

export async function findScreensByTheaterId(theaterId: number): Promise<ScreenRow[]> {
  const result = await pool.query<ScreenRow>(
    `SELECT id, theater_id, name FROM screens WHERE theater_id = $1 ORDER BY id`,
    [theaterId]
  );
  return result.rows;
}