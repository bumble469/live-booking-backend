export interface BookingRequestBody {
  seatIds: string[];
  screeningId: string;
  sessionId: string;
  fullname: string;
  email: string;
  phone: string;
  seatLabels?: string[];
  showTitle?: string;
  screenName?: string;
  theatreName?: string;
  startsAt?: string;
}

export interface BookingDetails {
  bookingReference: string;
  fullname: string;
  email: string;
  status: string;
  screeningId: number;
  showTitle: string;
  screenName: string;
  theatreName: string;
  startsAt: string;
  seatLabels: string[];
  seatIds: number[];
}

export interface SendBookingConfirmationArgs {
  to: string;
  fullname: string;
  bookingReference: string;
  seatLabels: string[];
  showTitle: string;
  screenName: string;
  theatreName: string;
  startsAt: string;
}

export interface SendCancellationConfirmationArgs {
  to: string;
  fullname: string;
  bookingReference: string;
  seatLabels: string[];
  showTitle: string;
  screenName: string;
  theatreName: string;
  startsAt: string;
}

export interface CancelLookupQuery { 
  ref: string;
  email: string;
}

export interface CancelRequestBody {
  ref: string;
  email: string;
}

