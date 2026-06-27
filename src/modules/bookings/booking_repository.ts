import { pool } from '../../db/pool.js';
import { generateBookingReference } from '../../utils/bookingReference.js';
import type { SeatRow } from '../seats/seat_types.js';
import type { BookingDetails } from './booking_types.js';

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

export async function lookupBooking(
  ref: string,
  email: string
): Promise<BookingDetails | null> {
  const { rows } = await pool.query<{
    booking_reference: string;
    fullname: string;
    email: string;
    status: string;
    screening_id: number;
    show_title: string;
    screen_name: string;
    theatre_name: string;
    starts_at: string;
    seat_labels: string[];
    seat_ids: number[];
  }>(
    `SELECT
       b.booking_reference,
       b.fullname,
       b.email,
       b.status,
       sc.id            AS screening_id,
       sh.title         AS show_title,
       sr.name          AS screen_name,
       t.name           AS theatre_name,
       sc.starts_at,
       ARRAY_AGG(s.row_label || s.seat_number::text ORDER BY s.row_label, s.seat_number) AS seat_labels,
       ARRAY_AGG(b.seat_id ORDER BY s.row_label, s.seat_number)                          AS seat_ids
     FROM bookings b
     JOIN screenings sc ON sc.id = b.screening_id
     JOIN shows      sh ON sh.id = sc.show_id
     JOIN screens    sr ON sr.id = sc.screen_id
     JOIN theaters   t  ON t.id  = sr.theater_id
     JOIN seats      s  ON s.id  = b.seat_id
     WHERE b.booking_reference = $1
       AND LOWER(b.email) = LOWER($2)
     GROUP BY b.booking_reference, b.fullname, b.email, b.status,
              sc.id, sh.title, sr.name, t.name, sc.starts_at`,
    [ref, email]
  );

  if (!rows[0]) return null;

  const r = rows[0];
  return {
    bookingReference: r.booking_reference,
    fullname: r.fullname,
    email: r.email,
    status: r.status,
    screeningId: r.screening_id,
    showTitle: r.show_title,
    screenName: r.screen_name,
    theatreName: r.theatre_name,
    startsAt: r.starts_at,
    seatLabels: r.seat_labels,
    seatIds: r.seat_ids,
  };
}

export async function cancelBooking(
  ref: string,
  email: string
): Promise<{ success: boolean; reason?: string; screeningId?: number; seatIds?: number[] }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock rows and fetch what we need in one shot
    const { rows } = await client.query<{
      seat_id: number;
      status: string;
      screening_id: number;
      starts_at: string;
    }>(
      `SELECT b.seat_id, b.status, b.screening_id, sc.starts_at
       FROM bookings b
       JOIN screenings sc ON sc.id = b.screening_id
       WHERE b.booking_reference = $1
         AND LOWER(b.email) = LOWER($2)
       FOR UPDATE`,
      [ref, email]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'Booking not found.' };
    }

    const booking = rows[0]!;

    if (rows.some((r) => r.status === 'CANCELLED')) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'This booking has already been cancelled.' };
    }

    const startsAt = new Date(booking.starts_at);
    const twoHoursBefore = new Date(startsAt.getTime() - 2 * 60 * 60 * 1000);
    if (new Date() >= twoHoursBefore) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'Cancellations are not allowed within 2 hours of showtime.' };
    }

    const screeningId = booking.screening_id;
    const seatIds = rows.map((r) => r.seat_id);

    await client.query(
      `UPDATE bookings
       SET status = 'CANCELLED', cancelled_at = now()
       WHERE booking_reference = $1 AND LOWER(email) = LOWER($2)`,
      [ref, email]
    );

    await client.query(
      `UPDATE screening_seats
       SET status = 'AVAILABLE', locked_by = NULL, lock_expires_at = NULL
       WHERE screening_id = $1 AND seat_id = ANY($2::int[])`,
      [screeningId, seatIds]
    );

    await client.query('COMMIT');
    return { success: true, screeningId, seatIds };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}