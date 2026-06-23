import {
  findScreeningsByShow,
  findScreeningsByTheatre,
  findSeatsByScreeningId,
} from './screening_repository.js';

function mapScreening(r: {
  id: number; show_id: number; show_title: string; duration_minutes: number;
  screen_id: number; screen_name: string; theater_id: number;
  theater_name: string; theater_city: string; starts_at: Date;
}) {
  const startsAt = new Date(r.starts_at);
  const endsAt = new Date(startsAt.getTime() + r.duration_minutes * 60000);
  return {
    id: String(r.id),
    showId: String(r.show_id),
    showTitle: r.show_title,
    screenId: String(r.screen_id),
    screenName: r.screen_name,
    theatreId: String(r.theater_id),
    theatreName: r.theater_name,
    theatreCity: r.theater_city,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}

export async function getScreeningsByShow(showId: string, theatreId?: string) {
  const rows = await findScreeningsByShow(Number(showId), theatreId ? Number(theatreId) : undefined);
  return rows.map(mapScreening);
}

export async function getScreeningsByTheatre(theatreId: string) {
  const rows = await findScreeningsByTheatre(Number(theatreId));
  return rows.map(mapScreening);
}

export async function getSeatsForScreening(screeningId: string) {
  const rows = await findSeatsByScreeningId(Number(screeningId));
  return rows.map((r: {
    id: number; screen_id: number; row_label: string; seat_number: number; status: string;
  }) => ({
    id: String(r.id),
    screenId: String(r.screen_id),
    row: r.row_label,
    number: r.seat_number,
    status: r.status as 'AVAILABLE' | 'LOCKED' | 'BOOKED',
  }));
}