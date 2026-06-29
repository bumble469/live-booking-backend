// src/modules/seats/seat.repository.ts
import { pool } from '../../db/pool.js';
import type { SeatRow } from './seat_types.js';

export async function findSeatsByScreenId(screenId: number): Promise<SeatRow[]> {
  const result = await pool.query<SeatRow>(
    `SELECT id, screen_id, row_label, seat_number, status
     FROM seats
     WHERE screen_id = $1
     ORDER BY row_label, seat_number`,
    [screenId]
  );
  return result.rows;
}