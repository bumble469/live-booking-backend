import { pool } from '../../db/pool.js';

export async function confirmBooking(
    seatId: number,
    sessionId: string
): Promise<{success:boolean; reason?: string}>
{
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { rows } = await client.query(
            `SELECT id, status, locked_by FROM seats WHERE id = $1 FOR UPDATE`,
            [seatId]
        )

        const seat = rows[0];

        if(!seat) {
            await client.query('ROLLBACK');
            return { success: false, reason: 'Seat not found' };
        }

        if (seat.status !== 'LOCKED' || seat.locked_by !== sessionId) {
            await client.query('ROLLBACK');
            return { success: false, reason: 'Seat is not locked by this session' };
        }

        await client.query(
            `UPDATE seats
            SET status = 'BOOKED',
                locked_by = NULL,
                lock_expires_at = NULL
            WHERE id = $1`,
            [seatId]
        );

        await client.query(
            `INSERT INTO bookings (seat_id, booked_by) VALUES ($1, $2)`,
            [seatId, sessionId]
        );

        await client.query('COMMIT');
        return { success: true };
    } catch(err: unknown) {
        await client.query('ROLLBACK');
        if (
            typeof err === 'object' &&
            err !== null &&
            'code' in err &&
            (err as { code: string }).code === '23505'
        ) {
            return { success: false, reason: 'Seat already booked' };
        }
        throw err;
    } finally {
        client.release();
    }
}