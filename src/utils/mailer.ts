import nodemailer from 'nodemailer';
import { env } from '../config/environment.js';

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: false,
  family: 4,
  auth: {
    user: env.gmailUser,
    pass: env.gmailAppPassword,
  },
} as nodemailer.TransportOptions);
