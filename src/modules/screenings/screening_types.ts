export interface ScreeningRow {
  id: number;
  show_id: number;
  show_title: string;
  duration_minutes: number;
  screen_id: number;
  screen_name: string;
  theater_id: number;
  theater_name: string;
  theater_city: string;
  starts_at: Date;
  total_seats: number;
  available_seats: number;
}