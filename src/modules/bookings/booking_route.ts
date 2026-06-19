import type { FastifyInstance } from 'fastify';
import { createBooking } from './booking_controller.js';

export async function bookingRoutes(app: FastifyInstance) {
  app.post('/api/bookings', createBooking);
}