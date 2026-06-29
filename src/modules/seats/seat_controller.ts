// src/modules/seats/seat.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { getSeatsByScreenId } from './seat_service.js';

interface SeatParams {
  screenId: string;
}

export async function listSeatsForScreen(
  request: FastifyRequest<{ Params: SeatParams }>,
  reply: FastifyReply
) {
  const screenId = Number(request.params.screenId);

  if (!Number.isInteger(screenId)) {
    return reply.status(400).send({ error: 'screenId must be a valid integer' });
  }

  const seats = await getSeatsByScreenId(screenId);
  return reply.send(seats);
}