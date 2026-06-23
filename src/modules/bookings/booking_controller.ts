import type { FastifyRequest, FastifyReply } from 'fastify';
import { bookSeats } from './booking_service.js';
import type { BookingRequestBody } from './booking_types.js';

export async function createBooking(
  request: FastifyRequest<{ Body: BookingRequestBody & { seatLabels?: string[] } }>,
  reply: FastifyReply
) {
  const { seatIds, screeningId, sessionId, fullname, email, phone, seatLabels = [] } = request.body;
  const result = await bookSeats(seatIds, screeningId, sessionId, fullname, email, phone, seatLabels);
  if (!result.success) return reply.status(409).send({ error: result.reason });
  return reply.status(201).send({ success: true, bookingReference: result.bookingReference });
}