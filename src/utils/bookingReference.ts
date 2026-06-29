// src/utils/bookingReference.ts
import { randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateBookingReference(length = 10): string {
  const bytes = randomBytes(length);
  let ref = '';
  for (let i = 0; i < length; i++) {
    const byte = bytes[i];
    if (byte === undefined) {
      throw new Error('Unreachable: index always within bytes bounds');
    }
    const char = ALPHABET[byte % ALPHABET.length];
    if (char === undefined) {
      throw new Error('Unreachable: index always within ALPHABET bounds');
    }
    ref += char;
  }
  return ref;
}