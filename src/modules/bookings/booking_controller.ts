// booking_controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { bookSeats } from './booking_service.js';
import type { BookingRequestBody } from './booking_types.js';

export async function createBooking(
  request: FastifyRequest<{ Body: BookingRequestBody }>,
  reply: FastifyReply
) {
  const { seatIds, screenId, sessionId, fullname, email, phone } = request.body;

  const result = await bookSeats(seatIds, screenId, sessionId, fullname, email, phone);

  if (!result.success) {
    return reply.status(409).send({ error: result });
  }

  return reply.status(201).send({ success: true, bookingReference: result.bookingReference });
}