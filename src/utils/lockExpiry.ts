import { pool } from '../db/pool.js';
import { getIO, emitAvailabilityUpdate } from '../websockets/socket.js';

export async function releaseExpiredLocks(): Promise<void> {
  const result = await pool.query<{ seat_id: number; screening_id: number }>(
    `UPDATE screening_seats
     SET status = 'AVAILABLE', locked_by = NULL, lock_expires_at = NULL
     WHERE status = 'LOCKED' AND lock_expires_at < now()
     RETURNING seat_id, screening_id`
  );

  if (result.rowCount === 0) return;

  const affectedScreeningIds = [...new Set(result.rows.map((r) => r.screening_id))];

  for (const row of result.rows) {
    getIO().to(`screening-${row.screening_id}`).emit('seat_unlocked', {
      seatId: String(row.seat_id),
      screeningId: String(row.screening_id),
    });
  }

  for (const screeningId of affectedScreeningIds) {
    void emitAvailabilityUpdate(screeningId);
  }

  console.log(`Released ${result.rowCount} expired lock(s)`);
}

export function startLockExpiryJob(intervalSeconds = 30): NodeJS.Timeout {
  console.log(`Lock expiry job started — running every ${intervalSeconds}s`);
  return setInterval(async () => {
    try { await releaseExpiredLocks(); }
    catch (err) { console.error('Lock expiry job error:', err); }
  }, intervalSeconds * 1000);
}