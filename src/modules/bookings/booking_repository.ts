// src/modules/bookings/booking_repository.ts
import { pool } from '../../db/pool.js';
import { generateBookingReference } from '../../utils/bookingReference.js';

export async function confirmBooking(
    seatIds: number[],
    sessionId: string,
    fullname: string,
    email: string,
    phone: string
): Promise<{
    success: boolean;
    bookingReference?: string;
    bookedSeatIds?: number[];
    reason?: string;
}> {
    const trimmedName = fullname.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 3) {
        return { success: false, reason: 'Please enter a valid full name' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return { success: false, reason: 'Invalid email' };
    }
    if (!/^[6-9]\d{9}$/.test(trimmedPhone)) {
        return { success: false, reason: 'Invalid phone number' };
    }
    if (seatIds.length === 0) {
        return { success: false, reason: 'No seats selected' };
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const sortedIds = [...seatIds].sort((a, b) => a - b);

        const { rows: seats } = await client.query(
            `
            SELECT id, status, locked_by, screen_id
            FROM seats
            WHERE id = ANY($1::int[])
            ORDER BY id
            FOR UPDATE
            `,
            [sortedIds]
        );

        if (seats.length !== sortedIds.length) {
            await client.query('ROLLBACK');
            return { success: false, reason: 'One or more seats not found' };
        }

        const notOwned = seats.find(
            (s) => s.status !== 'LOCKED' || s.locked_by !== sessionId
        );
        if (notOwned) {
            await client.query('ROLLBACK');
            return { success: false, reason: `Seat ${notOwned.id} is not locked by this session` };
        }

        await client.query(
            `
            UPDATE seats
            SET status = 'BOOKED', locked_by = NULL, lock_expires_at = NULL
            WHERE id = ANY($1::int[])
            `,
            [sortedIds]
        );

        // ---- everything below this line is the part that changed ----

        let bookingReference = '';
        const MAX_ATTEMPTS = 5;
        let inserted = false;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            bookingReference = generateBookingReference();

            await client.query('SAVEPOINT booking_insert');

            try {
                const values: string[] = [];
                const placeholders = sortedIds.map((seatId, i) => {
                    const base = i * 6;
                    values.push(
                        String(seatId), sessionId, trimmedName, trimmedEmail, trimmedPhone, bookingReference
                    );
                    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
                });

                await client.query(
                    `
                    INSERT INTO bookings (seat_id, booked_by, fullname, email, phone, booking_reference)
                    VALUES ${placeholders.join(', ')}
                    `,
                    values
                );

                inserted = true;
                break;
            } catch (err: unknown) {
                await client.query('ROLLBACK TO SAVEPOINT booking_insert');

                const code = (err as { code?: string }).code;
                const constraint = (err as { constraint?: string }).constraint;

                if (code === '23505' && constraint?.includes('seat_id')) {
                    await client.query('ROLLBACK');
                    return { success: false, reason: 'One or more seats were already booked' };
                }
                if (code === '23505' && constraint?.includes('booking_reference') && attempt < MAX_ATTEMPTS - 1) {
                    continue;
                }

                await client.query('ROLLBACK');
                throw err;
            }
        }

        if (!inserted) {
            await client.query('ROLLBACK');
            return { success: false, reason: 'Could not generate a unique booking reference' };
        }

        await client.query('COMMIT');
        return { success: true, bookingReference, bookedSeatIds: sortedIds };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}