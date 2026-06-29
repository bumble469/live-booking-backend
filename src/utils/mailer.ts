import { Resend } from 'resend';
import { env } from '../config/environment.js';

export const resend = new Resend(env.resendApiKey);