import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { theaterRoutes } from './modules/theaters/theater_route.js';
import { screenRoutes } from './modules/screens/screen_route.js';
import { seatRoutes } from './modules/seats/seat_route.js';
import { lockRoutes } from './modules/locks/lock_route.js';
import { bookingRoutes } from './modules/bookings/booking_route.js';
import { showRoutes } from './modules/shows/show_route.js';
import { screeningRoutes } from './modules/screenings/screening_route.js';
import { homeRoutes } from "./modules/home/home_route.js";
import { verificationRoutes } from "./modules/verification/verification_route.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });
  app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (_req, context) => ({
      error: `Too many requests. Please wait ${Math.ceil(context.ttl / 1000)} seconds before trying again.`,
    }),
  });
  app.register(cors, { origin: true });
  app.get('/api/health', async () => ({ status: 'ok' }));
  app.register(theaterRoutes);
  app.register(screenRoutes);
  app.register(seatRoutes);
  app.register(lockRoutes);
  app.register(bookingRoutes);
  app.register(showRoutes);
  app.register(screeningRoutes);
  app.register(homeRoutes);
  app.register(verificationRoutes);
  
  return app;
}