import { confirmBooking } from './booking_repository.js';
import { getIO } from '../../websockets/socket.js';

export async function bookSeats(
    seatIds: string[],
    screenId: string,
    sessionId: string,
    fullname: string,
    email: string,
    phone: string
) {
    const result = await confirmBooking(
        seatIds.map(Number),
        sessionId,
        fullname,
        email,
        phone
    );

    if (!result.success) {
        return result;
    }

    getIO().to(`screen-${screenId}`).emit('seat_booked', {
        seatIds,
        screenId,
    });

    return {
        success: true,
        bookingReference: result.bookingReference,
    };
}