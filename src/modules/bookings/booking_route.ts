import type { FastifyInstance } from 'fastify';
import { createBooking, getBookingForCancel, cancelBooking } from './booking_controller.js';

export async function bookingRoutes(app: FastifyInstance) {
  app.post('/api/bookings', createBooking);
  app.get('/api/bookings/cancel', getBookingForCancel);
  app.post('/api/bookings/cancel', cancelBooking);
}