// src/modules/locks/lock_route.ts
import type { FastifyInstance } from 'fastify';
import { acquireLock, releaseLockHandler } from './lock_controller.js';

export async function lockRoutes(app: FastifyInstance) {
  app.post('/api/locks', acquireLock);
  app.post('/api/locks/release', releaseLockHandler);
}