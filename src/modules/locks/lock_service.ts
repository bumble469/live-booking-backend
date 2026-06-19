import { trySeatLock, releaseSeatLock, getLockedSeatDetails } from './lock_repository.js';
import { getIO } from '../../websockets/socket.js';

export async function lockSeat(
    seatId: string,
    screenId: string,
    sessionId: string,
) {
    const result = await trySeatLock(Number(seatId), sessionId);
    if (!result.success) {
        return { success: false, reason: result.status };
    }

    const seat = await getLockedSeatDetails(Number(seatId));


    // broadcast to everyone about the seat that got locked
    getIO().to(`screen-${screenId}`).emit('seat_locked', {
        seatId,
        screenId,
        lockedBy: sessionId,
        lockExpiresAt: seat.lock_expires_at,
    });

    return {
        success: true,
        lockExpiresAt: seat.lock_expires_at,
    };
}


export async function unlockSeat(
    seatId: string,
    screenId: string,
    sessionId: string
) {
    const released = await releaseSeatLock(Number(seatId), sessionId);

    if (!released) {
        return { success: false, reason: 'Lock not owned by this session or already released' };
    }

    // broadcast to everyone that seat is now available (unlocked)
    getIO().to(`screen-${screenId}`).emit('seat_unlocked', {
        seatId,
        screenId,
    });

    return { success: true };
}