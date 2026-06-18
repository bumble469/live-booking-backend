import type { FastifyRequest, FastifyReply } from 'fastify';
import { getScreensByTheaterId } from './screen_service.js';

interface ScreenParams {
  theaterId: string;
}

export async function listScreensForTheater(
  request: FastifyRequest<{ Params: ScreenParams }>,
  reply: FastifyReply
) {
  const theaterId = Number(request.params.theaterId);

  if (!Number.isInteger(theaterId)) {
    return reply.status(400).send({ error: 'theaterId must be a valid integer' });
  }

  const screens = await getScreensByTheaterId(theaterId);
  return reply.send(screens);
}