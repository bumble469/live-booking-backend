import { findAllTheaters } from './theater_repository.js';

export async function getAllTheaters(page: number, limit: number, query?: string) {
  const { rows, total } = await findAllTheaters(page, limit, query);
  return {
    theaters: rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      city: row.city,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}