import type { FastifyRequest, FastifyReply } from 'fastify';
import { lockSeat, unlockSeat } from './lock_service.js';
import type { LockRequestBody, UnlockRequestBody } from './lock_types.js';

export async function acquireLock(
  request: FastifyRequest<{ Body: LockRequestBody }>,
  reply: FastifyReply
) {
  const { seatId, screeningId, sessionId } = request.body;
  const result = await lockSeat(seatId, screeningId, sessionId);
  if (!result.success) return reply.status(409).send({ error: result.reason });
  return reply.status(200).send(result);
}

export async function releaseLockHandler(
  request: FastifyRequest<{ Body: UnlockRequestBody }>,
  reply: FastifyReply
) {
  const { seatId, screeningId, sessionId } = request.body;
  const result = await unlockSeat(seatId, screeningId, sessionId);
  if (!result.success) return reply.status(400).send({ error: result.reason });
  return reply.status(200).send(result);
}