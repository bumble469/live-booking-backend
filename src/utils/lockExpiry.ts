// src/jobs/lockExpiry.ts
import { pool } from '../db/pool.js';
import { getIO } from '../websockets/socket.js';

// Finds all seats whose lock has expired and resets them to AVAILABLE.
// Runs on an interval — this is your Phase 5 sweep job.
export async function releaseExpiredLocks(): Promise<void> {
  // This query uses your partial index idx_seats_lock_expiry directly —
  // only scans LOCKED rows, not the entire seats table
  const result = await pool.query<{ id: number; screen_id: number }>(
    `UPDATE seats
     SET status = 'AVAILABLE',
         locked_by = NULL,
         lock_expires_at = NULL
     WHERE status = 'LOCKED'
       AND lock_expires_at < now()
     RETURNING id, screen_id`
  );

  if (result.rowCount === 0) return;

  // For each expired seat, broadcast to the right screen room
  // so every connected client's UI updates immediately
  for (const seat of result.rows) {
    getIO().to(`screen-${seat.screen_id}`).emit('seat-unlocked', {
      seatId: String(seat.id),
      screenId: String(seat.screen_id),
    });
  }

  console.log(`Released ${result.rowCount} expired lock(s)`);
}

export function startLockExpiryJob(intervalSeconds: number = 30): NodeJS.Timeout {
  console.log(`Lock expiry job started — running every ${intervalSeconds}s`);
  return setInterval(async () => {
    try {
      await releaseExpiredLocks();
    } catch (err) {
      console.error('Lock expiry job error:', err);
    }
  }, intervalSeconds * 1000);
}