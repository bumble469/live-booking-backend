import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  getScreeningsByShow,
  getScreeningsByTheatre,
  getSeatsForScreening,
} from './screening_service.js';

export async function listScreeningsByShow(
  request: FastifyRequest<{ Params: { showId: string }; Querystring: { theatreId?: string } }>,
  reply: FastifyReply
) {
  const { showId } = request.params;
  const { theatreId } = request.query;
  const screenings = await getScreeningsByShow(showId, theatreId);
  return reply.send(screenings);
}

export async function listScreeningsByTheatre(
  request: FastifyRequest<{ Params: { theatreId: string } }>,
  reply: FastifyReply
) {
  const screenings = await getScreeningsByTheatre(request.params.theatreId);
  return reply.send(screenings);
}

export async function listSeatsForScreening(
  request: FastifyRequest<{ Params: { screeningId: string } }>,
  reply: FastifyReply
) {
  const seats = await getSeatsForScreening(request.params.screeningId);
  return reply.send(seats);
}