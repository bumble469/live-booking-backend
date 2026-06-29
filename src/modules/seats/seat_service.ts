// src/modules/seats/seat.service.ts
import { findSeatsByScreenId } from './seat_repository.js';
import type { SeatDto } from './seat_types.js';

export async function getSeatsByScreenId(screenId: number): Promise<SeatDto[]> {
  const rows = await findSeatsByScreenId(screenId);
  return rows.map((row) => ({
    id: String(row.id),
    screenId: String(row.screen_id),
    row: row.row_label,
    number: row.seat_number,
    status: row.status,
  }));
}