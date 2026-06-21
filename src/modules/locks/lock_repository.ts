import { pool } from '../../db/pool.js';

export async function trySeatLock(
    seatId: number,
    sessionId: string,
    lockDurationMinutes: number = 5
): Promise<{success: boolean; lockedBy: string | null; status: string}>
{
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // GET THE SEAT
        const { rows } = await client.query(
            `SELECT id, status, locked_by
            FROM seats
            WHERE id = $1
            FOR UPDATE NOWAIT`,
            [seatId]
        );

        const seat = rows[0];

        // IF SEAT NOT FOUND
        if (!seat) {
            await client.query('ROLLBACK');
            return { success: false, lockedBy: null, status: 'NOT_FOUND' };
        }

        // IF SEAT ALREADY LOCKED
        if (seat.status !== 'AVAILABLE') {
            await client.query('ROLLBACK');
            return { success: false, lockedBy: seat.locked_by, status: seat.status };
        }

        // IF SEAT IS AVAILABLE, LOCK IT
        await client.query(
            `UPDATE seats
            SET status = 'LOCKED',
                locked_by = $1,
                lock_expires_at = now() + ($2 || ' minutes')::interval
            WHERE id = $3`,
            [sessionId, lockDurationMinutes, seatId]
        );

        await client.query('COMMIT');
        return { success: true, lockedBy: sessionId, status: 'LOCKED' };
    } catch(err: unknown){
        await client.query('ROLLBACK');
        if (
            typeof err === 'object' &&
            err !== null &&
            'code' in err &&
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
    sessionId: string
): Promise<boolean> {
    const result = await pool.query(
    `UPDATE seats
     SET status = 'AVAILABLE',
         locked_by = NULL,
         lock_expires_at = NULL
     WHERE id = $1
       AND locked_by = $2
       AND status = 'LOCKED'`,
    [seatId, sessionId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getLockedSeatDetails(seatId: number) {
  const { rows } = await pool.query(
    `SELECT id, screen_id, status, locked_by, lock_expires_at
     FROM seats WHERE id = $1`,
    [seatId]
  );
  return rows[0] ?? null;
}