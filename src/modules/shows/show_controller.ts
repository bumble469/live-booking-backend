import type { FastifyRequest, FastifyReply } from 'fastify';
import { getActiveShows, getShow } from './show_service.js';
import type { ShowListQuery } from './show_types.js';

export async function listShows(
  request: FastifyRequest<{ Querystring: ShowListQuery }>,
  reply: FastifyReply
) {
  const page  = Math.max(1, parseInt(request.query.page  ?? '1', 10));
  const limit = Math.min(20, Math.max(1, parseInt(request.query.limit ?? '8', 10)));
  const q     = request.query.q?.trim() || undefined;
  const result = await getActiveShows(page, limit, q);
  return reply.send(result);
}

export async function getShowById(
  request: FastifyRequest<{ Params: { showId: string } }>,
  reply: FastifyReply
) {
  const show = await getShow(request.params.showId);
  if (!show) return reply.status(404).send({ error: 'Show not found' });
  return reply.send(show);
}