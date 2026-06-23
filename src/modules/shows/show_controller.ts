import type { FastifyRequest, FastifyReply } from 'fastify';
import { getActiveShows, getShow } from './show_service.js';

export async function listShows(_req: FastifyRequest, reply: FastifyReply) {
  const shows = await getActiveShows();
  return reply.send(shows);
}

export async function getShowById(
  request: FastifyRequest<{ Params: { showId: string } }>,
  reply: FastifyReply
) {
  const show = await getShow(request.params.showId);
  if (!show) return reply.status(404).send({ error: 'Show not found' });
  return reply.send(show);
}