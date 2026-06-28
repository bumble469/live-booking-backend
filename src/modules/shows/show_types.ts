export interface ShowRow {
    id: number;
    title: string;
    description: string | null;
    duration_minutes: number;
    poster_url: string | null;
}

export interface ShowListQuery {
  page?: string;
  limit?: string;
  q?: string;
}

export interface PaginatedShows {
  rows: ShowRow[];
  total: number;
}