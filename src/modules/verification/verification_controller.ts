import type { FastifyRequest, FastifyReply } from 'fastify';
import { sendOTP, confirmOTP } from './verification_service.js';
import type { SendOTPBody, ConfirmOTPBody } from './verification_types.js';

export async function sendOTPHandler(
  request: FastifyRequest<{ Body: SendOTPBody }>,
  reply: FastifyReply
) {
  const { email } = request.body;
  const result = await sendOTP(email);
  if (!result.success) return reply.status(500).send({ error: result.reason });
  return reply.send({ message: 'OTP sent' });
}

export async function confirmOTPHandler(
  request: FastifyRequest<{ Body: ConfirmOTPBody }>,
  reply: FastifyReply
) {
  const { email, otp } = request.body;
  const valid = confirmOTP(email, otp);
  if (!valid) return reply.status(400).send({ error: 'Invalid or expired OTP' });
  return reply.send({ verified: true });
}