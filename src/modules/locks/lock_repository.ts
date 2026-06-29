import { pool } from '../../db/pool.js';

export async function trySeatLock(
  seatId: number,
  screeningId: number,
  sessionId: string,
  lockDurationMinutes = 5
): Promise<{ success: boolean; lockedBy: string | null; status: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Upsert the screening_seats row, then lock it
    await client.query(
      `INSERT INTO screening_seats (screening_id, seat_id, status)
       VALUES ($1, $2, 'AVAILABLE')
       ON CONFLICT (screening_id, seat_id) DO NOTHING`,
      [screeningId, seatId]
    );

    const { rows } = await client.query(
      `SELECT id, status, locked_by
       FROM screening_seats
       WHERE screening_id = $1 AND seat_id = $2
       FOR UPDATE NOWAIT`,
      [screeningId, seatId]
    );

    const row = rows[0];

    if (!row) {
      await client.query('ROLLBACK');
      return { success: false, lockedBy: null, status: 'NOT_FOUND' };
    }

    if (row.status !== 'AVAILABLE') {
      await client.query('ROLLBACK');
      return { success: false, lockedBy: row.locked_by, status: row.status };
    }

    await client.query(
      `UPDATE screening_seats
       SET status = 'LOCKED',
           locked_by = $1,
           lock_expires_at = now() + ($2 || ' minutes')::interval
       WHERE screening_id = $3 AND seat_id = $4`,
      [sessionId, lockDurationMinutes, screeningId, seatId]
    );

    await client.query('COMMIT');
    return { success: true, lockedBy: sessionId, status: 'LOCKED' };
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    if (
      typeof err === 'object' && err !== null && 'code' in err &&
      (err as { code: string }).code === '55P03'
    ) {
      return { success: false, lockedBy: null, status: 'LOCKED' };
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function releaseSeatLock(
  seatId: number,
  screeningId: number,
  sessionId: string
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE screening_seats
     SET status = 'AVAILABLE', locked_by = NULL, lock_expires_at = NULL
     WHERE seat_id = $1 AND screening_id = $2 AND locked_by = $3 AND status = 'LOCKED'`,
    [seatId, screeningId, sessionId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getLockedSeatDetails(seatId: number, screeningId: number) {
  const { rows } = await pool.query(
    `SELECT ss.status, ss.locked_by, ss.lock_expires_at, s.screen_id
     FROM screening_seats ss
     JOIN seats s ON s.id = ss.seat_id
     WHERE ss.seat_id = $1 AND ss.screening_id = $2`,
    [seatId, screeningId]
  );
  return rows[0] ?? null;
}