import { transporter } from '../../utils/mailer.js';
import { setOTP, verifyOTP } from '../../utils/otpStore.js';
import { env } from '../../config/environment.js';

export async function sendOTP(email: string): Promise<{ success: boolean; reason?: string }> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  setOTP(email, otp);

  try {
    await transporter.sendMail({
      from: `Showaholic <${env.gmailUser}>`,
      to: email,
      subject: 'Your Showaholic Booking OTP',
      html: `
        <div style="font-family: sans-serif; max-width: 400px;">
          <h2>Your OTP</h2>
          <p>Use the code below to confirm your booking:</p>
          <h1 style="letter-spacing: 8px; color: #E3B23C;">${otp}</h1>
          <p>Valid for <strong>3 minutes</strong>. Do not share this with anyone.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    return { success: false, reason: String(error) };
  }
}

export function confirmOTP(email: string, otp: string): boolean {
  return verifyOTP(email, otp);
}