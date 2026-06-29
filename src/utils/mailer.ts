import nodemailer from 'nodemailer';
import { env } from '../config/environment.js';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.gmailUser,
    pass: env.gmailAppPassword,
  },
});