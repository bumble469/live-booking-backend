import { trySeatLock, releaseSeatLock, getLockedSeatDetails } from './lock_repository.js';
import { getIO } from '../../websockets/socket.js';

export async function lockSeat(seatId: string, screeningId: string, sessionId: string) {
  const result = await trySeatLock(Number(seatId), Number(screeningId), sessionId);
  if (!result.success) {
    return { success: false, reason: result.status };
  }

  const detail = await getLockedSeatDetails(Number(seatId), Number(screeningId));

  getIO().to(`screening-${screeningId}`).emit('seat_locked', {
    seatId,
    screeningId,
    lockedBy: sessionId,
    lockExpiresAt: detail?.lock_expires_at,
  });

  return { success: true, lockExpiresAt: detail?.lock_expires_at };
}

export async function unlockSeat(seatId: string, screeningId: string, sessionId: string) {
  const released = await releaseSeatLock(Number(seatId), Number(screeningId), sessionId);
  if (!released) {
    return { success: false, reason: 'Lock not owned by this session or already released' };
  }

  getIO().to(`screening-${screeningId}`).emit('seat_unlocked', { seatId, screeningId });
  return { success: true };
}