import { BrevoClient } from '@getbrevo/brevo';
import { env } from '../config/environment.js';

const brevo = new BrevoClient({ apiKey: env.brevoApiKey });

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: 'Showaholic', email: env.brevoSenderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });
  } catch (error) {
    console.error('[mailer] Failed to send email:', error);
  }
}