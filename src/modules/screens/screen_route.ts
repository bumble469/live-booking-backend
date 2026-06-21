import type { FastifyInstance } from 'fastify';
import { listScreensForTheater } from './screen_controller.js';

export async function screenRoutes(app: FastifyInstance) {
  app.get('/api/theaters/:theaterId/screens', listScreensForTheater);
}