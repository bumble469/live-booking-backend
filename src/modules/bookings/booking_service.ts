import { confirmBooking, lookupBooking, cancelBooking } from './booking_repository.js';
import { getIO, emitAvailabilityUpdate } from '../../websockets/socket.js';
import { sendBookingConfirmation, sendCancellationConfirmation } from './booking_email.js';
import type { BookingDetails } from './booking_types.js';

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
  seatLabels: string[],
  showTitle: string,
  screenName: string,
  theatreName: string,
  startsAt: string
): Promise<BookSeatsResult> {
  const result = await confirmBooking(
    seatIds.map(Number),
    Number(screeningId),
    sessionId,
    fullname,
    email,
    phone
  );

  if (!result.success) return { success: false, reason: result.reason };

  getIO().to(`screening-${screeningId}`).emit('seat_booked', { seatIds, screeningId });
  void emitAvailabilityUpdate(Number(screeningId));
  void sendBookingConfirmation({ to: email, fullname, bookingReference: result.bookingReference!, seatLabels, showTitle, screenName, theatreName, startsAt });

  return { success: true, bookingReference: result.bookingReference };
}

export async function lookupBookingByRef(
  ref: string,
  email: string
): Promise<{ success: boolean; booking?: BookingDetails; reason?: string }> {
  const booking = await lookupBooking(ref, email);
  if (!booking) return { success: false, reason: 'No booking found for that reference and email.' };
  return { success: true, booking };
}

export async function cancelBookingByRef(
  ref: string,
  email: string
): Promise<{ success: boolean; reason?: string }> {
  const booking = await lookupBooking(ref, email);
  if (!booking) return { success: false, reason: 'No booking found for that reference and email.' };

  const result = await cancelBooking(ref, email);
  if (!result.success) {
    return result.reason
      ? { success: false, reason: result.reason }
      : { success: false };
  }

  const io = getIO();
  for (const seatId of result.seatIds ?? []) {
    io.to(`screening-${result.screeningId}`).emit('seat_unlocked', {
      seatId: String(seatId),
      screeningId: String(result.screeningId),
    });
  }
  void emitAvailabilityUpdate(result.screeningId!);

  void sendCancellationConfirmation({
    to: email,
    fullname: booking.fullname,
    bookingReference: ref,
    seatLabels: booking.seatLabels,
    showTitle: booking.showTitle,
    screenName: booking.screenName,
    theatreName: booking.theatreName,
    startsAt: booking.startsAt,
  });

  return { success: true };
}