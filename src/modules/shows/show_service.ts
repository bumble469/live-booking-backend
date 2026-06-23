import { findAllActiveShows, findShowById } from './show_repository.js';

export async function getActiveShows() {
  const rows = await findAllActiveShows();
  return rows.map((r) => ({
    id: String(r.id),
    title: r.title,
    description: r.description ?? undefined,
    durationMinutes: r.duration_minutes,
    posterUrl: r.poster_url ?? undefined,
  }));
}

export async function getShow(showId: string) {
  const row = await findShowById(Number(showId));
  if (!row) return null;
  return {
    id: String(row.id),
    title: row.title,
    description: row.description ?? undefined,
    durationMinutes: row.duration_minutes,
    posterUrl: row.poster_url ?? undefined,
  };
}