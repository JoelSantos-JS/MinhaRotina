import { formatDateLabel, formatTime, daysAgo, todayString, yesterdayString } from '../utils/dateUtils';

// ─── todayString / yesterdayString ───────────────────────────────────────────

describe('todayString', () => {
  it('retorna string no formato YYYY-MM-DD', () => {
    expect(todayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('retorna a data de hoje', () => {
    const expected = new Date().toISOString().split('T')[0];
    expect(todayString()).toBe(expected);
  });
});

describe('yesterdayString', () => {
  it('retorna string no formato YYYY-MM-DD', () => {
    expect(yesterdayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('retorna data diferente de hoje', () => {
    expect(yesterdayString()).not.toBe(todayString());
  });

  it('ontem é exatamente 1 dia antes de hoje', () => {
    const today = new Date(todayString() + 'T00:00:00');
    const yesterday = new Date(yesterdayString() + 'T00:00:00');
    const diffDays = (today.getTime() - yesterday.getTime()) / 86400000;
    expect(diffDays).toBe(1);
  });
});

// ─── formatDateLabel ──────────────────────────────────────────────────────────

describe('formatDateLabel', () => {
  it('retorna "Hoje" para a data de hoje', () => {
    expect(formatDateLabel(todayString())).toBe('Hoje');
  });

  it('retorna "Ontem" para a data de ontem', () => {
    expect(formatDateLabel(yesterdayString())).toBe('Ontem');
  });

  it('retorna string formatada para datas mais antigas (não "Hoje" nem "Ontem")', () => {
    // 10 dias atrás
    const old = new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0];
    const label = formatDateLabel(old);
    expect(label).not.toBe('Hoje');
    expect(label).not.toBe('Ontem');
    expect(label.length).toBeGreaterThan(0);
  });

  it('a string para data antiga contém o dia numérico', () => {
    const date = '2024-01-15';
    const label = formatDateLabel(date);
    expect(label).toContain('15');
  });
});

// ─── formatTime ───────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('retorna string no formato HH:MM', () => {
    const result = formatTime('2024-03-15T14:30:00.000Z');
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('retorna string com exatamente 5 caracteres', () => {
    const result = formatTime('2024-06-20T09:05:00.000Z');
    expect(result).toHaveLength(5);
  });

  it('inclui dois pontos como separador', () => {
    const result = formatTime('2024-01-01T00:00:00.000Z');
    expect(result).toContain(':');
  });
});

// ─── daysAgo ─────────────────────────────────────────────────────────────────

describe('daysAgo', () => {
  it('retorna 0 para o timestamp de hoje', () => {
    const now = new Date().toISOString();
    expect(daysAgo(now)).toBe(0);
  });

  it('retorna 1 para ontem', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(daysAgo(yesterday)).toBe(1);
  });

  it('retorna 7 para uma semana atrás', () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    expect(daysAgo(sevenDaysAgo)).toBe(7);
  });

  it('retorna 30 para 30 dias atrás', () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    expect(daysAgo(thirtyDaysAgo)).toBe(30);
  });

  it('retorna número não-negativo', () => {
    const past = new Date(Date.now() - 5 * 86400000).toISOString();
    expect(daysAgo(past)).toBeGreaterThanOrEqual(0);
  });
});
