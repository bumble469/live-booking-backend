import { Resend } from 'resend';
import { setOTP, verifyOTP } from '../../utils/otpStore.js';
import { env } from '../../config/environment.js';

const resend = new Resend(env.resendApiKey);

export async function sendOTP(email: string): Promise<{ success: boolean; reason?: string }> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  setOTP(email, otp);

  const { error } = await resend.emails.send({
    from: 'Showaholic <onboarding@resend.dev>',
    to: email,
    subject: 'Your Showaholic Booking OTP',
    html: `
      <div style="font-family: sans-serif; max-width: 400px;">
        <h2>Your OTP</h2>
        <p>Use the code below to confirm your booking:</p>
        <h1 style="letter-spacing: 8px; color: #E3B23C;">${otp}</h1>
        <p>Valid for <strong>10 minutes</strong>. Do not share this with anyone.</p>
      </div>
    `,
  });

  if (error) return { success: false, reason: error.message };
  return { success: true };
}

export function confirmOTP(email: string, otp: string): boolean {
  return verifyOTP(email, otp);
}