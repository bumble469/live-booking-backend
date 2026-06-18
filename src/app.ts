import Fastify, { type FastifyInstance } from 'fastify';
import cors from "@fastify/cors";
import { theaterRoutes } from './modules/theaters/theater_route.js';
import { screenRoutes } from './modules/screens/screen_route.js';
import { seatRoutes } from './modules/seats/seat_route.js';

export function buildApp(): FastifyInstance {
    const app = Fastify({ 
        logger: true,
    });
    app.register(cors, {
        origin: true,
    });
    app.get('/api/health', async() => {
        return { status: 'ok' };
    });
    app.register(theaterRoutes);
    app.register(screenRoutes);
    app.register(seatRoutes);
    return app;
}