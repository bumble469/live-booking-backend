// src/modules/locks/lock_route.ts
import type { FastifyInstance } from 'fastify';
import { acquireLock, releaseLockHandler } from './lock_controller.js';

export async function lockRoutes(app: FastifyInstance) {
  app.post('/api/locks', {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
  }, acquireLock);

  app.post('/api/locks/release', {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
  }, releaseLockHandler);
}