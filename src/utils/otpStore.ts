interface OTPEntry {
  otp: string;
  expiresAt: number;
}

const store = new Map<string, OTPEntry>();

export function setOTP(email: string, otp: string) {
  store.set(email, {
    otp,
    expiresAt: Date.now() + 3 * 60 * 1000,
  });
}

export function verifyOTP(email: string, otp: string): boolean {
  const entry = store.get(email);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(email);
    return false;
  }
  if (entry.otp !== otp) return false;
  store.delete(email); 
  return true;
}