import type { FastifyRequest, FastifyReply } from 'fastify';
import { bookSeats, lookupBookingByRef, cancelBookingByRef } from './booking_service.js';
import type { BookingRequestBody, CancelLookupQuery, CancelRequestBody } from './booking_types.js';

export async function createBooking(
  request: FastifyRequest<{ Body: BookingRequestBody }>,
  reply: FastifyReply
) {
  const {
    seatIds, screeningId, sessionId, fullname, email, phone,
    seatLabels = [], showTitle = '', screenName = '', theatreName = '', startsAt = '',
  } = request.body;

  const result = await bookSeats(
    seatIds, screeningId, sessionId, fullname, email, phone,
    seatLabels, showTitle, screenName, theatreName, startsAt
  );

  if (!result.success) return reply.status(409).send({ error: result.reason });
  return reply.status(201).send({ success: true, bookingReference: result.bookingReference });
}

export async function getBookingForCancel(
  request: FastifyRequest<{ Querystring: CancelLookupQuery }>,
  reply: FastifyReply
) {
  const { ref, email } = request.query;
  const result = await lookupBookingByRef(ref, email);
  if (!result.success) return reply.status(404).send({ error: result.reason });
  return reply.send(result.booking);
}

export async function cancelBooking(
  request: FastifyRequest<{ Body: CancelRequestBody }>,
  reply: FastifyReply
) {
  const { ref, email } = request.body;
  const result = await cancelBookingByRef(ref, email);
  if (!result.success) return reply.status(409).send({ error: result.reason });
  return reply.send({ success: true });
}