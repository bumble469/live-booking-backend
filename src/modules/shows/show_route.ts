import type { FastifyInstance } from 'fastify';
import { listShows, getShowById } from './show_controller.js';

export async function showRoutes(app: FastifyInstance) {
  app.get('/api/shows', listShows);
  app.get('/api/shows/:showId', getShowById);
}