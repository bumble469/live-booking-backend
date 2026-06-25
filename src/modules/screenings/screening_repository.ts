import { pool } from '../../db/pool.js';
import type { ScreeningRow } from './screening_types.js';

const ACTIVE_SCREENING_FILTER = `
  sc.starts_at + (sh.duration_minutes || ' minutes')::interval > now()
`;

const SCREENING_SELECT = `
  SELECT
    sc.id,
    sc.show_id,
    sh.title AS show_title,
    sh.duration_minutes,
    sc.screen_id,
    sr.name AS screen_name,
    t.id AS theater_id,
    t.name AS theater_name,
    t.city AS theater_city,
    sc.starts_at,
    (
      SELECT COUNT(*)
      FROM seats s
      WHERE s.screen_id = sc.screen_id
    )::int AS total_seats,
    (
      SELECT COUNT(*)
      FROM seats s
      LEFT JOIN screening_seats ss
        ON ss.seat_id = s.id AND ss.screening_id = sc.id
      WHERE s.screen_id = sc.screen_id
        AND COALESCE(ss.status, 'AVAILABLE') = 'AVAILABLE'
    )::int AS available_seats
  FROM screenings sc
  JOIN shows sh ON sh.id = sc.show_id
  JOIN screens sr ON sr.id = sc.screen_id
  JOIN theaters t ON t.id = sr.theater_id
`;

export async function findScreeningsByShow(
  showId: number,
  theatreId?: number
): Promise<ScreeningRow[]> {
  const params: number[] = [showId];
  let theatreFilter = '';
  if (theatreId !== undefined) {
    params.push(theatreId);
    theatreFilter = `AND t.id = $${params.length}`;
  }
  const { rows } = await pool.query<ScreeningRow>(
    `${SCREENING_SELECT}
     WHERE sc.show_id = $1
       AND ${ACTIVE_SCREENING_FILTER}
       ${theatreFilter}
     ORDER BY sc.starts_at`,
    params
  );
  return rows;
}

export async function findScreeningsByTheatre(theatreId: number): Promise<ScreeningRow[]> {
  const { rows } = await pool.query<ScreeningRow>(
    `${SCREENING_SELECT}
     WHERE t.id = $1
       AND ${ACTIVE_SCREENING_FILTER}
     ORDER BY sh.title, sc.starts_at`,
    [theatreId]
  );
  return rows;
}

export async function findScreeningById(screeningId: number): Promise<ScreeningRow | null> {
  const { rows } = await pool.query<ScreeningRow>(
    `${SCREENING_SELECT} WHERE sc.id = $1`,
    [screeningId]
  );
  return rows[0] ?? null;
}

export async function findSeatsByScreeningId(screeningId: number) {
  const { rows } = await pool.query(
    `SELECT
       s.id,
       s.screen_id,
       s.row_label,
       s.seat_number,
       COALESCE(ss.status, 'AVAILABLE') AS status,
       ss.locked_by  
     FROM screenings sc
     JOIN seats s ON s.screen_id = sc.screen_id
     LEFT JOIN screening_seats ss ON ss.seat_id = s.id AND ss.screening_id = sc.id
     WHERE sc.id = $1
     ORDER BY s.row_label, s.seat_number`,
    [screeningId]
  );
  return rows;
}

export async function countAvailableSeats(
  screeningId: number
): Promise<{ availableSeats: number; totalSeats: number }> {
  const { rows } = await pool.query<{ available_seats: number; total_seats: number }>(
    `SELECT
       COUNT(*)::int AS total_seats,
       COUNT(*) FILTER (
         WHERE COALESCE(ss.status, 'AVAILABLE') = 'AVAILABLE'
       )::int AS available_seats
     FROM seats s
     JOIN screenings sc ON sc.screen_id = s.screen_id
     LEFT JOIN screening_seats ss
       ON ss.seat_id = s.id AND ss.screening_id = sc.id
     WHERE sc.id = $1`,
    [screeningId]
  );
  return {
    availableSeats: rows[0]?.available_seats ?? 0,
    totalSeats: rows[0]?.total_seats ?? 0,
  };
}