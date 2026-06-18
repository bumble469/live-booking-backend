// src/modules/theaters/theater.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { getAllTheaters } from './theater_service.js';

export async function listTheaters(_request: FastifyRequest, reply: FastifyReply) {
  const theaters = await getAllTheaters();
  return reply.send(theaters);
}