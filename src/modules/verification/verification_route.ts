import type { FastifyInstance } from 'fastify';
import { sendOTPHandler, confirmOTPHandler } from './verification_controller.js';

export async function verificationRoutes(app: FastifyInstance) {
  app.post('/api/verify/send', {
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '10 minutes',
        errorResponseBuilder: () => ({
          error: 'Too many OTP requests. Please wait 10 minutes before requesting another.',
        }),
      },
    },
  }, sendOTPHandler);

  app.post('/api/verify/confirm', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '5 minutes',
        errorResponseBuilder: () => ({
          error: 'Too many verification attempts. Please wait 5 minutes.',
        }),
      },
    },
  }, confirmOTPHandler);
}