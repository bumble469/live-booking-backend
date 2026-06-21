import type { FastifyInstance } from 'fastify';
import { listTheaters } from './theater_controller.js';

export async function theaterRoutes(app: FastifyInstance) {
  app.get('/api/theaters', listTheaters);
}