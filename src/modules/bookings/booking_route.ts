import type { FastifyInstance } from 'fastify';
import { createBooking, getBookingForCancel, cancelBooking } from './booking_controller.js';

export async function bookingRoutes(app: FastifyInstance) {
  app.post('/api/bookings', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, createBooking);

  app.get('/api/bookings/cancel', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, getBookingForCancel);

  app.post('/api/bookings/cancel', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, cancelBooking);
}