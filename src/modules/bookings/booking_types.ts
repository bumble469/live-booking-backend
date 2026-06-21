export interface BookingRequestBody {
  seatIds: string[];
  screenId: string;
  sessionId: string;
  fullname: string;
  email: string;
  phone: string;
}