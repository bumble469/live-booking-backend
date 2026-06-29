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
  gmailUser: required('GMAIL_USER'),
  gmailAppPassword: required('GMAIL_APP_PASSWORD'),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  frontendUrl: required('FRONTEND_URL'),
};