import * as Crypto from 'expo-crypto';

export async function hashPin(pin: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin + 'minharotina_salt_2024'
  );
  return digest;
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const digest = await hashPin(pin);
  return digest === hash;
}

export function generateRandomPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
