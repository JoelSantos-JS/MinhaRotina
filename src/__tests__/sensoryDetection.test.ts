import { detectSensoryCategory, normalizeText } from '../utils/sensoryDetection';

describe('normalizeText', () => {
  it('converte para minúsculas', () => {
    expect(normalizeText('BANHO')).toBe('banho');
  });

  it('remove acentos', () => {
    expect(normalizeText('Escovação')).toBe('escovacao');
    expect(normalizeText('ção')).toBe('cao');
    expect(normalizeText('café')).toBe('cafe');
    expect(normalizeText('tênis')).toBe('tenis');
  });
});

describe('detectSensoryCategory', () => {
  // ── Retorna null ─────────────────────────────────────────────────────────

  it('retorna null para string vazia', () => {
    expect(detectSensoryCategory('')).toBeNull();
  });

  it('retorna null para string menor que 3 caracteres', () => {
    expect(detectSensoryCategory('ab')).toBeNull();
  });

  it('retorna null para texto sem palavras-chave', () => {
    expect(detectSensoryCategory('Brincar no parque')).toBeNull();
  });

  // ── Categoria: teeth ─────────────────────────────────────────────────────

  it('detecta "teeth" para "escovar os dentes"', () => {
    expect(detectSensoryCategory('Escovar os dentes')).toBe('teeth');
  });

  it('detecta "teeth" para "usar pasta dental"', () => {
    expect(detectSensoryCategory('Usar pasta dental')).toBe('teeth');
  });

  it('detecta "teeth" para "fio dental"', () => {
    expect(detectSensoryCategory('Usar fio dental')).toBe('teeth');
  });

  // ── Categoria: bath ──────────────────────────────────────────────────────

  it('detecta "bath" para "tomar banho"', () => {
    expect(detectSensoryCategory('Tomar banho')).toBe('bath');
  });

  it('detecta "bath" para "lavar com shampoo"', () => {
    expect(detectSensoryCategory('Lavar com shampoo')).toBe('bath');
  });

  it('detecta "bath" para "secar com toalha"', () => {
    expect(detectSensoryCategory('Secar com toalha')).toBe('bath');
  });

  // ── Categoria: bathroom ──────────────────────────────────────────────────

  it('detecta "bathroom" para "ir ao banheiro"', () => {
    expect(detectSensoryCategory('Ir ao banheiro')).toBe('bathroom');
  });

  it('detecta "bathroom" para "dar descarga"', () => {
    expect(detectSensoryCategory('Dar descarga')).toBe('bathroom');
  });

  it('detecta "bathroom" para "fazer xixi"', () => {
    expect(detectSensoryCategory('Fazer xixi')).toBe('bathroom');
  });

  // ── Categoria: clothes ───────────────────────────────────────────────────

  it('detecta "clothes" para "vestir roupa"', () => {
    expect(detectSensoryCategory('Vestir roupa')).toBe('clothes');
  });

  it('detecta "clothes" para "colocar meias"', () => {
    expect(detectSensoryCategory('Colocar meias')).toBe('clothes');
  });

  it('detecta "clothes" para "trocar de camisa"', () => {
    expect(detectSensoryCategory('Trocar de camisa')).toBe('clothes');
  });

  // ── Categoria: hair ──────────────────────────────────────────────────────

  it('detecta "hair" para "pentear o cabelo"', () => {
    expect(detectSensoryCategory('Pentear o cabelo')).toBe('hair');
  });

  it('detecta "hair" para "cortar cabelo"', () => {
    expect(detectSensoryCategory('Cortar cabelo')).toBe('hair');
  });

  // ── Categoria: food ──────────────────────────────────────────────────────

  it('detecta "food" para "hora de comer"', () => {
    expect(detectSensoryCategory('Hora de comer')).toBe('food');
  });

  it('detecta "food" para "almoço"', () => {
    expect(detectSensoryCategory('Almoço')).toBe('food');
  });

  it('detecta "food" para "comer fruta"', () => {
    expect(detectSensoryCategory('Comer fruta')).toBe('food');
  });

  // ── Prioridade ───────────────────────────────────────────────────────────

  it('teeth (prioridade 1) vence food (prioridade 3) quando ambos presentes', () => {
    // "escovar dentes antes do café" tem teeth e food
    expect(detectSensoryCategory('escovar dentes antes do cafe')).toBe('teeth');
  });

  it('bath (prioridade 1) vence clothes (prioridade 2) quando ambos presentes', () => {
    expect(detectSensoryCategory('banho e trocar roupa')).toBe('bath');
  });

  // ── Acentos e variações ──────────────────────────────────────────────────

  it('detecta com acentos (normalização NFD)', () => {
    expect(detectSensoryCategory('Escovação dos dentes')).toBe('teeth');
    expect(detectSensoryCategory('Tomar banhão')).toBe('bath');
    expect(detectSensoryCategory('Vestir calça')).toBe('clothes');
  });
});
