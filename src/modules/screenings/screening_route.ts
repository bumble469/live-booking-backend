import type { FastifyInstance } from 'fastify';
import {
  listScreeningsByShow,
  listScreeningsByTheatre,
  listSeatsForScreening,
} from './screening_controller.js';

export async function screeningRoutes(app: FastifyInstance) {
  app.get('/api/shows/:showId/screenings', listScreeningsByShow);
  app.get('/api/theatres/:theatreId/screenings', listScreeningsByTheatre);
  app.get('/api/screenings/:screeningId/seats', listSeatsForScreening);
}