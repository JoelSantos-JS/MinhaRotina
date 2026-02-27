import { createHash } from 'crypto';

export const CryptoDigestAlgorithm = { SHA256: 'SHA-256' };

export async function digestStringAsync(
  _algorithm: string,
  input: string
): Promise<string> {
  return createHash('sha256').update(input).digest('hex');
}
