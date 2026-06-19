import { confirmBooking } from './booking_repository.js';
import { getIO } from '../../websockets/socket.js';

export async function bookSeat(
    seatId: string,
    screenId: string,
    sessionId: string
) {
    const result = await confirmBooking(Number(seatId), sessionId);
    if (!result.success) {
        return result;
    }

    getIO().to(`screen-${screenId}`).emit('seat_booked', {
        seatId,
        screenId
    });

    return { success: true };
}