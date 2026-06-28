import { resend } from '../../utils/mailer.js';
import { env } from '../../config/environment.js';
import type { SendBookingConfirmationArgs, SendCancellationConfirmationArgs } from './booking_types.js';

function formatShowtime(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

function buildTicketHtml(args: SendBookingConfirmationArgs): string {
  const { fullname, bookingReference, seatLabels, showTitle, screenName, theatreName, startsAt } = args;
  const cancelUrl = `${env.frontendUrl}/cancel?ref=${bookingReference}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Booking Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#1C1014;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1C1014;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#2A1820;border-radius:12px;overflow:hidden;border:1px solid #4d2f3a;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 36px 24px;border-bottom:1px solid #4d2f3a;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.35em;color:#a6939a;text-transform:uppercase;">Booking Confirmed</p>
              <h1 style="margin:0;font-size:28px;color:#f3eae0;letter-spacing:0.05em;">You're All Set</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 36px;">
              <p style="margin:0 0 24px;font-size:15px;color:#a6939a;">
                Hi <span style="color:#f3eae0;font-weight:600;">${fullname}</span>, your booking is confirmed.
              </p>

              <!-- Show details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="padding:16px;background:#1C1014;border-radius:8px;border:1px solid #4d2f3a;">
                    <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.3em;color:#a6939a;text-transform:uppercase;">Show Details</p>
                    <p style="margin:0 0 6px;font-size:20px;color:#f3eae0;font-weight:700;letter-spacing:0.03em;">${showTitle}</p>
                    <p style="margin:0 0 4px;font-size:13px;color:#a6939a;">${theatreName}</p>
                    <p style="margin:0 0 4px;font-size:13px;color:#a6939a;">${screenName}</p>
                    <p style="margin:0;font-size:13px;color:#E3B23C;font-family:'Courier New',monospace;">${formatShowtime(startsAt)}</p>
                  </td>
                </tr>
              </table>

              <!-- Seats -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:16px;background:#1C1014;border-radius:8px;border:1px solid #4d2f3a;">
                    <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.3em;color:#a6939a;text-transform:uppercase;">Seats</p>
                    <p style="margin:0;font-size:20px;color:#E3B23C;font-family:'Courier New',monospace;font-weight:600;letter-spacing:0.1em;">
                      ${seatLabels.join(' &nbsp;·&nbsp; ')}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Reference -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px dashed #4d2f3a;margin-bottom:24px;">
                <tr>
                  <td style="padding-top:24px;">
                    <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.3em;color:#a6939a;text-transform:uppercase;">Booking Reference</p>
                    <p style="margin:0;font-size:26px;color:#f3eae0;font-family:'Courier New',monospace;letter-spacing:0.18em;font-weight:700;">
                      ${bookingReference}
                    </p>
                    <p style="margin:8px 0 0;font-size:12px;color:#a6939a;">
                      Keep this safe — you'll need it along with your email to cancel.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Cancel link -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${cancelUrl}"
                      style="display:inline-block;padding:12px 28px;background:#3b232c;border:1px solid #4d2f3a;border-radius:8px;font-size:13px;color:#a6939a;text-decoration:none;letter-spacing:0.05em;">
                      Cancel this booking →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #4d2f3a;">
              <p style="margin:0;font-size:11px;color:#4d2f3a;text-align:center;letter-spacing:0.05em;">
                Showaholic · This is a dev project, not a real ticket.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendBookingConfirmation(
  args: SendBookingConfirmationArgs
): Promise<void> {
  const { to, bookingReference, showTitle } = args;

  const { error } = await resend.emails.send({
    from: 'Showaholic <onboarding@resend.dev>',
    to,
    subject: `Booking confirmed — ${showTitle} · ${bookingReference}`,
    html: buildTicketHtml(args),
  });

  if (error) {
    console.error('[booking_email] Failed to send confirmation email:', error);
  }
}

function buildCancellationHtml(args: SendCancellationConfirmationArgs): string {
  const { fullname, bookingReference, seatLabels, showTitle, screenName, theatreName, startsAt } = args;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Booking Cancelled</title>
</head>
<body style="margin:0;padding:0;background:#1C1014;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1C1014;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#2A1820;border-radius:12px;overflow:hidden;border:1px solid #4d2f3a;">

          <tr>
            <td style="padding:32px 36px 24px;border-bottom:1px solid #4d2f3a;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.35em;color:#a6939a;text-transform:uppercase;">Booking Cancelled</p>
              <h1 style="margin:0;font-size:28px;color:#f3eae0;letter-spacing:0.05em;">Sorry to See You Go</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 36px;">
              <p style="margin:0 0 24px;font-size:15px;color:#a6939a;">
                Hi <span style="color:#f3eae0;font-weight:600;">${fullname}</span>, your booking has been successfully cancelled.
              </p>

              <!-- Show details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="padding:16px;background:#1C1014;border-radius:8px;border:1px solid #4d2f3a;">
                    <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.3em;color:#a6939a;text-transform:uppercase;">Cancelled Show</p>
                    <p style="margin:0 0 6px;font-size:20px;color:#f3eae0;font-weight:700;">${showTitle}</p>
                    <p style="margin:0 0 4px;font-size:13px;color:#a6939a;">${theatreName}</p>
                    <p style="margin:0 0 4px;font-size:13px;color:#a6939a;">${screenName}</p>
                    <p style="margin:0;font-size:13px;color:#E3B23C;font-family:'Courier New',monospace;">${formatShowtime(startsAt)}</p>
                  </td>
                </tr>
              </table>

              <!-- Seats -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:16px;background:#1C1014;border-radius:8px;border:1px solid #4d2f3a;">
                    <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.3em;color:#a6939a;text-transform:uppercase;">Cancelled Seats</p>
                    <p style="margin:0;font-size:20px;color:#a6939a;font-family:'Courier New',monospace;font-weight:600;letter-spacing:0.1em;text-decoration:line-through;">
                      ${seatLabels.join(' &nbsp;·&nbsp; ')}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Reference -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px dashed #4d2f3a;">
                <tr>
                  <td style="padding-top:24px;">
                    <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.3em;color:#a6939a;text-transform:uppercase;">Booking Reference</p>
                    <p style="margin:0;font-size:26px;color:#a6939a;font-family:'Courier New',monospace;letter-spacing:0.18em;font-weight:700;text-decoration:line-through;">
                      ${bookingReference}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 36px;border-top:1px solid #4d2f3a;">
              <p style="margin:0;font-size:11px;color:#4d2f3a;text-align:center;letter-spacing:0.05em;">
                Showaholic · This is a dev project, not a real ticket.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendCancellationConfirmation(
  args: SendCancellationConfirmationArgs
): Promise<void> {
  const { to, bookingReference, showTitle } = args;

  const { error } = await resend.emails.send({
    from: 'Showaholic <onboarding@resend.dev>',
    to,
    subject: `Booking cancelled — ${showTitle} · ${bookingReference}`,
    html: buildCancellationHtml(args),
  });

  if (error) {
    console.error('[booking_email] Failed to send cancellation email:', error);
  }
}