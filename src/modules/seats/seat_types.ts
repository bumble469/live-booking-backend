export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED';

export interface SeatRow {
  id: number;
  screen_id: number;
  row_label: string;
  seat_number: number;
  status: SeatStatus;
}

export interface SeatDto {
  id: string;
  screenId: string;
  row: string;
  number: number;
  status: SeatStatus;
}