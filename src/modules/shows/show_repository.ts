import { pool } from '../../db/pool.js';
import type { ShowRow } from './show_types.js';

export async function findAllActiveShows(): Promise<ShowRow[]> {
  const { rows } = await pool.query<ShowRow>(
    `SELECT DISTINCT ON (sh.id) sh.id, sh.title, sh.description, sh.duration_minutes, sh.poster_url
     FROM shows sh
     JOIN screenings sc ON sc.show_id = sh.id
     WHERE sc.starts_at + (sh.duration_minutes || ' minutes')::interval > now()
     ORDER BY sh.id`
  );
  return rows;
}

export async function findShowById(showId: number): Promise<ShowRow | null> {
  const { rows } = await pool.query<ShowRow>(
    `SELECT id, title, description, duration_minutes, poster_url
     FROM shows WHERE id = $1`,
    [showId]
  );
  return rows[0] ?? null;
}