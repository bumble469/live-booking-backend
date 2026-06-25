import { pool } from '../../db/pool.js';
import type { FeaturedShow } from './home_types.js';

export async function getFeaturedShows(): Promise<FeaturedShow[]> {
  const { rows } = await pool.query<FeaturedShow>(
    `
    SELECT *
    FROM (
        SELECT DISTINCT ON (s.id)
            s.id,
            s.title,
            s.description,
            s.poster_url AS "posterUrl",
            sc.starts_at AS "startsAt"
        FROM shows s
        JOIN screenings sc
            ON sc.show_id = s.id
        WHERE sc.starts_at >= NOW()
        ORDER BY s.id, sc.starts_at
    ) upcoming
    ORDER BY "startsAt"
    LIMIT 5;
    `
  );

  return rows;
}