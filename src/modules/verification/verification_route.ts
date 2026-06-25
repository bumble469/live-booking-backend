import type { FastifyInstance } from 'fastify';
import { sendOTPHandler, confirmOTPHandler } from './verification_controller.js';

export async function verificationRoutes(app: FastifyInstance) {
  app.post('/api/verify/send', sendOTPHandler);
  app.post('/api/verify/confirm', confirmOTPHandler);
}