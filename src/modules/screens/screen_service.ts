import { findScreensByTheaterId } from './screen_repository.js';
import type { ScreenDto } from './screen_types.js';

export async function getScreensByTheaterId(theaterId: number): Promise<ScreenDto[]> {
  const rows = await findScreensByTheaterId(theaterId);
  return rows.map((row) => ({
    id: String(row.id),
    theaterId: String(row.theater_id),
    name: row.name,
  }));
}