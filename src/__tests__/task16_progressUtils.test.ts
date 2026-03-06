/**
 * TASK 16 — Bateria de testes: progressUtils
 *
 * [T16-01] groupByDate com array vazio retorna {}
 * [T16-02] groupByDate agrupa 1 registro corretamente
 * [T16-03] groupByDate múltiplos registros no mesmo dia ficam no mesmo grupo
 * [T16-04] groupByDate registros em dias diferentes ficam em grupos separados
 * [T16-05] buildDateRange com days=7 retorna array de 7 elementos
 * [T16-06] buildDateRange com days=1 retorna apenas hoje
 * [T16-07] buildDateRange retorna datas em ordem crescente
 * [T16-08] buildDateRange o último elemento é a data de hoje
 * [T16-09] calcStreak com {} retorna 0
 * [T16-10] calcStreak com hoje com atividade retorna ≥ 1
 * [T16-11] calcStreak só ontem (sem hoje) retorna 0
 * [T16-12] calcStreak hoje + ontem + anteontem retorna 3
 * [T16-13] calcCompletionRate 7 dias ativos em 7 → 100
 * [T16-14] calcCompletionRate 0 dias ativos → 0
 * [T16-15] calcCompletionRate é limitado a 100 (cap)
 */

import { groupByDate, buildDateRange, calcStreak, calcCompletionRate } from '../utils/progressUtils';
import type { TaskProgress } from '../types/models';

// ── Helper: cria um TaskProgress mínimo com completed_at como chave ──────────
function makeProgress(completed_at: string, overrides?: Partial<TaskProgress>): TaskProgress {
  return {
    id: Math.random().toString(36).slice(2),
    child_id: 'child-1',
    routine_id: 'routine-1',
    task_id: 'task-1',
    completed_at,
    ...overrides,
  } as TaskProgress;
}

// ── Helper: gera uma string de data ISO relativa a hoje ──────────────────────
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

describe('TASK 16 — progressUtils', () => {

  // ── groupByDate ─────────────────────────────────────────────────────────────

  it('[T16-01] groupByDate com array vazio retorna {}', () => {
    expect(groupByDate([])).toEqual({});
  });

  it('[T16-02] groupByDate agrupa 1 registro corretamente', () => {
    const record = makeProgress('2025-03-01T10:00:00Z');
    const result = groupByDate([record]);
    expect(result['2025-03-01']).toHaveLength(1);
    expect(result['2025-03-01'][0]).toBe(record);
  });

  it('[T16-03] groupByDate múltiplos registros no mesmo dia ficam no mesmo grupo', () => {
    const r1 = makeProgress('2025-03-01T08:00:00Z');
    const r2 = makeProgress('2025-03-01T14:30:00Z');
    const r3 = makeProgress('2025-03-01T20:00:00Z');
    const result = groupByDate([r1, r2, r3]);
    expect(result['2025-03-01']).toHaveLength(3);
  });

  it('[T16-04] groupByDate registros em dias diferentes ficam em grupos separados', () => {
    const r1 = makeProgress('2025-03-01T10:00:00Z');
    const r2 = makeProgress('2025-03-02T10:00:00Z');
    const r3 = makeProgress('2025-03-05T10:00:00Z');
    const result = groupByDate([r1, r2, r3]);
    expect(Object.keys(result)).toHaveLength(3);
    expect(result['2025-03-01']).toHaveLength(1);
    expect(result['2025-03-02']).toHaveLength(1);
    expect(result['2025-03-05']).toHaveLength(1);
  });

  // ── buildDateRange ──────────────────────────────────────────────────────────

  it('[T16-05] buildDateRange com days=7 retorna array de 7 elementos', () => {
    expect(buildDateRange(7)).toHaveLength(7);
  });

  it('[T16-06] buildDateRange com days=1 retorna apenas hoje', () => {
    const result = buildDateRange(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(daysAgo(0));
  });

  it('[T16-07] buildDateRange retorna datas em ordem crescente', () => {
    const result = buildDateRange(7);
    for (let i = 1; i < result.length; i++) {
      expect(result[i] > result[i - 1]).toBe(true);
    }
  });

  it('[T16-08] buildDateRange o último elemento é a data de hoje', () => {
    const result = buildDateRange(30);
    const today = daysAgo(0);
    expect(result[result.length - 1]).toBe(today);
  });

  // ── calcStreak ──────────────────────────────────────────────────────────────

  it('[T16-09] calcStreak com {} retorna 0', () => {
    expect(calcStreak({})).toBe(0);
  });

  it('[T16-10] calcStreak com hoje com atividade retorna ≥ 1', () => {
    const today = daysAgo(0);
    const grouped = { [today]: [makeProgress(today + 'T10:00:00Z')] };
    expect(calcStreak(grouped)).toBeGreaterThanOrEqual(1);
  });

  it('[T16-11] calcStreak só ontem (sem hoje) retorna 0', () => {
    const yesterday = daysAgo(1);
    const grouped = { [yesterday]: [makeProgress(yesterday + 'T10:00:00Z')] };
    // Streak exige hoje como ponto de partida — sem hoje = 0
    expect(calcStreak(grouped)).toBe(0);
  });

  it('[T16-12] calcStreak hoje + ontem + anteontem retorna 3', () => {
    const today = daysAgo(0);
    const yesterday = daysAgo(1);
    const twoDaysAgo = daysAgo(2);
    const grouped = {
      [today]: [makeProgress(today + 'T10:00:00Z')],
      [yesterday]: [makeProgress(yesterday + 'T10:00:00Z')],
      [twoDaysAgo]: [makeProgress(twoDaysAgo + 'T10:00:00Z')],
    };
    expect(calcStreak(grouped)).toBe(3);
  });

  // ── calcCompletionRate ──────────────────────────────────────────────────────

  it('[T16-13] calcCompletionRate 7 dias ativos em 7 → 100', () => {
    expect(calcCompletionRate(7, 7)).toBe(100);
  });

  it('[T16-14] calcCompletionRate 0 dias ativos → 0', () => {
    expect(calcCompletionRate(0, 7)).toBe(0);
  });

  it('[T16-15] calcCompletionRate é limitado a 100 mesmo quando activeDays > selectedDays', () => {
    // Caso impossível na prática mas o cap deve proteger
    expect(calcCompletionRate(10, 7)).toBe(100);
  });
});
