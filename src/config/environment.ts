import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  brevoApiKey: required('BREVO_API_KEY'),
  brevoSenderEmail: required('BREVO_SENDER_EMAIL'),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  frontendUrl: required('FRONTEND_URL'),
};