import type { FastifyRequest, FastifyReply } from 'fastify';
import { bookSeat } from './booking_service.js';
import type { BookingRequestBody } from './booking_types.js';

export async function createBooking(
  request: FastifyRequest<{ Body: BookingRequestBody }>,
  reply: FastifyReply
) {
  const { seatId, screenId, sessionId } = request.body;

  const result = await bookSeat(seatId, screenId, sessionId);

  if (!result.success) {
    return reply.status(409).send({ error: result.reason });
  }

  return reply.status(201).send({ success: true });
}