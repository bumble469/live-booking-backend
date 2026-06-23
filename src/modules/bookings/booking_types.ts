export interface BookingRequestBody {
  seatIds: string[];
  screeningId: string;
  sessionId: string;
  fullname: string;
  email: string;
  phone: string;
}