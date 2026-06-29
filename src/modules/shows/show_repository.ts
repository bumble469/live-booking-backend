import { pool } from '../../db/pool.js';
import type { ShowRow, PaginatedShows } from './show_types.js';

export async function findAllActiveShows(
  page: number,
  limit: number,
  query?: string
): Promise<PaginatedShows> {
  const offset = (page - 1) * limit;
  const params: (string | number)[] = [];

  let searchFilter = '';
  if (query) {
    params.push(`%${query}%`);
    searchFilter = `AND sh.title ILIKE $${params.length}`;
  }

  params.push(limit, offset);
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  const { rows } = await pool.query<ShowRow & { total_count: string }>(
    `WITH active_shows AS (
       SELECT DISTINCT ON (sh.id)
         sh.id, sh.title, sh.description, sh.duration_minutes, sh.poster_url
       FROM shows sh
       JOIN screenings sc ON sc.show_id = sh.id
       WHERE sc.starts_at + (sh.duration_minutes || ' minutes')::interval > now()
         ${searchFilter}
       ORDER BY sh.id
     )
     SELECT a.*, (SELECT COUNT(*) FROM active_shows)::int AS total_count
     FROM active_shows a
     ORDER BY a.id
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );

  return {
    rows,
    total: rows[0]?.total_count ? Number(rows[0].total_count) : 0,
  };
}

export async function findShowById(showId: number): Promise<ShowRow | null> {
  const { rows } = await pool.query<ShowRow>(
    `SELECT id, title, description, duration_minutes, poster_url
     FROM shows WHERE id = $1`,
    [showId]
  );
  return rows[0] ?? null;
}