import type { FastifyInstance } from 'fastify';
import { getFeaturedShowsController } from './home_controller.js';

export async function homeRoutes(app: FastifyInstance) {
  app.get('/api/home/featured', getFeaturedShowsController);
}