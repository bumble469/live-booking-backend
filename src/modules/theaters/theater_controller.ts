import type { FastifyRequest, FastifyReply } from 'fastify';
import { getAllTheaters } from './theater_service.js';
import type { TheaterListQuery } from './theater_types.js';

export async function listTheaters(
  request: FastifyRequest<{ Querystring: TheaterListQuery }>,
  reply: FastifyReply
) {
  const page  = Math.max(1, parseInt(request.query.page  ?? '1', 10));
  const limit = Math.min(20, Math.max(1, parseInt(request.query.limit ?? '6', 10)));
  const q     = request.query.q?.trim() || undefined;
  const result = await getAllTheaters(page, limit, q);
  return reply.send(result);
}