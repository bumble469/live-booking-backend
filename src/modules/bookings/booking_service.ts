import { confirmBooking } from './booking_repository.js';
import { getIO, emitAvailabilityUpdate } from '../../websockets/socket.js';
import { sendBookingConfirmation } from './booking_email.js';

interface BookSeatsResult {
  success: boolean;
  bookingReference?: string | undefined;
  reason?: string | undefined;
}

export async function bookSeats(
  seatIds: string[],
  screeningId: string,
  sessionId: string,
  fullname: string,
  email: string,
  phone: string,
  seatLabels: string[]
): Promise<BookSeatsResult> {
  const result = await confirmBooking(
    seatIds.map(Number),
    Number(screeningId),
    sessionId,
    fullname,
    email,
    phone
  );

  if (!result.success) {
    return { success: false, reason: result.reason };
  }

  getIO().to(`screening-${screeningId}`).emit('seat_booked', { seatIds, screeningId });

  void emitAvailabilityUpdate(Number(screeningId));

  void sendBookingConfirmation({
    to: email,
    fullname,
    bookingReference: result.bookingReference!,
    seatLabels,
  });

  return { success: true, bookingReference: result.bookingReference };
}