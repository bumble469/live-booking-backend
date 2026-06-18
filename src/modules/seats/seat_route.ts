import type { FastifyInstance } from 'fastify';
import { listSeatsForScreen } from './seat_controller.js';

export async function seatRoutes(app: FastifyInstance) {
  app.get('/api/screens/:screenId/seats', listSeatsForScreen);
}