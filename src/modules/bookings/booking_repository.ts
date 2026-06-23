import { pool } from '../../db/pool.js';
import { generateBookingReference } from '../../utils/bookingReference.js';

export async function confirmBooking(
  seatIds: number[],
  screeningId: number,
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

  if (trimmedName.length < 3) return { success: false, reason: 'Please enter a valid full name' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return { success: false, reason: 'Invalid email' };
  if (!/^[6-9]\d{9}$/.test(trimmedPhone)) return { success: false, reason: 'Invalid phone number' };
  if (seatIds.length === 0) return { success: false, reason: 'No seats selected' };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sortedIds = [...seatIds].sort((a, b) => a - b);

    // Lock the screening_seats rows in consistent order
    const { rows: seatRows } = await client.query(
      `SELECT seat_id, status, locked_by
       FROM screening_seats
       WHERE screening_id = $1 AND seat_id = ANY($2::int[])
       ORDER BY seat_id
       FOR UPDATE`,
      [screeningId, sortedIds]
    );

    if (seatRows.length !== sortedIds.length) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'One or more seats not locked for this screening' };
    }

    const notOwned = seatRows.find(
      (s) => s.status !== 'LOCKED' || s.locked_by !== sessionId
    );
    if (notOwned) {
      await client.query('ROLLBACK');
      return { success: false, reason: `Seat ${notOwned.seat_id} is not locked by this session` };
    }

    // Flip screening_seats to BOOKED
    await client.query(
      `UPDATE screening_seats
       SET status = 'BOOKED', locked_by = NULL, lock_expires_at = NULL
       WHERE screening_id = $1 AND seat_id = ANY($2::int[])`,
      [screeningId, sortedIds]
    );

    // Insert booking rows with retry on reference collision
    let bookingReference = '';
    const MAX_ATTEMPTS = 5;
    let inserted = false;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      bookingReference = generateBookingReference();
      await client.query('SAVEPOINT booking_insert');

      try {
        const values: string[] = [];
        const placeholders = sortedIds.map((seatId, i) => {
          const base = i * 7;
          values.push(
            String(seatId), String(screeningId), sessionId,
            trimmedName, trimmedEmail, trimmedPhone, bookingReference
          );
          return `($${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5}, $${base+6}, $${base+7})`;
        });

        await client.query(
          `INSERT INTO bookings (seat_id, screening_id, booked_by, fullname, email, phone, booking_reference)
           VALUES ${placeholders.join(', ')}`,
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
          return { success: false, reason: 'One or more seats already booked' };
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