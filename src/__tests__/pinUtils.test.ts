import { hashPin, verifyPin, generateRandomPin } from '../utils/pinUtils';

describe('hashPin', () => {
  it('retorna uma string não-vazia', async () => {
    const hash = await hashPin('1234');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('retorna o mesmo hash para o mesmo PIN', async () => {
    const hash1 = await hashPin('1234');
    const hash2 = await hashPin('1234');
    expect(hash1).toBe(hash2);
  });

  it('retorna hashes diferentes para PINs diferentes', async () => {
    const hash1 = await hashPin('1234');
    const hash2 = await hashPin('5678');
    expect(hash1).not.toBe(hash2);
  });

  it('inclui o salt na geração do hash (diferente de hash sem salt)', async () => {
    const withSalt = await hashPin('1234');
    // hash raw sem salt seria diferente
    const { createHash } = require('crypto');
    const rawHash = createHash('sha256').update('1234').digest('hex');
    expect(withSalt).not.toBe(rawHash);
  });
});

describe('verifyPin', () => {
  it('retorna true para PIN correto', async () => {
    const hash = await hashPin('4321');
    expect(await verifyPin('4321', hash)).toBe(true);
  });

  it('retorna false para PIN incorreto', async () => {
    const hash = await hashPin('4321');
    expect(await verifyPin('9999', hash)).toBe(false);
  });

  it('retorna false para hash vazio', async () => {
    expect(await verifyPin('1234', '')).toBe(false);
  });

  it('é case-insensitive ao hash (sempre hexadecimal)', async () => {
    const hash = await hashPin('0000');
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });
});

describe('generateRandomPin', () => {
  it('retorna uma string de exatamente 4 dígitos', () => {
    const pin = generateRandomPin();
    expect(pin).toMatch(/^\d{4}$/);
  });

  it('retorna valor entre 1000 e 9999', () => {
    // Roda várias vezes para garantir
    for (let i = 0; i < 20; i++) {
      const n = parseInt(generateRandomPin(), 10);
      expect(n).toBeGreaterThanOrEqual(1000);
      expect(n).toBeLessThanOrEqual(9999);
    }
  });

  it('não retorna sempre o mesmo valor (aleatoriedade básica)', () => {
    const pins = new Set(Array.from({ length: 20 }, () => generateRandomPin()));
    expect(pins.size).toBeGreaterThan(1);
  });
});
