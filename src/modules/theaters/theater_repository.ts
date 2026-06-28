import { pool } from '../../db/pool.js';
import type { TheaterRow } from './theater_types.js';

export async function findAllTheaters(
  page: number,
  limit: number,
  query?: string
): Promise<{ rows: TheaterRow[]; total: number }> {
  const offset = (page - 1) * limit;
  const params: (string | number)[] = [];

  let searchFilter = '';
  if (query) {
    params.push(`%${query}%`);
    // $1 referenced twice — valid in PostgreSQL
    searchFilter = `WHERE name ILIKE $1 OR city ILIKE $1`;
  }

  params.push(limit, offset);
  const limitIdx  = params.length - 1;
  const offsetIdx = params.length;

  const { rows } = await pool.query<TheaterRow & { total_count: number }>(
    `SELECT id, name, city, COUNT(*) OVER()::int AS total_count
     FROM theaters
     ${searchFilter}
     ORDER BY id
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );

  return {
    rows,
    total: rows[0]?.total_count ?? 0,
  };
}