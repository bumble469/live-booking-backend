export interface TheaterRow {
    id: number;
    name: string;
    city: string;
}

export interface TheaterDto {
    id: string;
    name: string;
    city: string;
}

export interface TheaterListQuery {
  page?: string;
  limit?: string;
  q?: string;
}