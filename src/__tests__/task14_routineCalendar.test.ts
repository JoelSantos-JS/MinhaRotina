/**
 * TASK 14 — Bateria de testes: routineCalendarService
 *
 * [T14-01] getDays retorna [] quando não há dados
 * [T14-02] getDays retorna [] com JSON corrompido
 * [T14-03] getDays retorna [] quando getItem lança exceção
 * [T14-04] setDays chama setItem com chave routine_days_${routineId}
 * [T14-05] setDays serializa o array de dias corretamente
 * [T14-06] Round-trip: setDays → getDays preserva os dias
 * [T14-07] clearDays chama removeItem com chave correta
 * [T14-08] isAvailableToday retorna true quando days = [] (sem restrição)
 * [T14-09] isAvailableToday retorna true quando dia atual está na lista
 * [T14-10] isAvailableToday retorna false quando dia atual NÃO está na lista
 * [T14-11] isAvailableToday aceita date como segundo parâmetro
 * [T14-12] isAvailableToday com todos os 7 dias retorna true
 * [T14-13] getDaysForRoutines retorna mapa correto para múltiplas rotinas
 * [T14-14] getDaysForRoutines com lista vazia retorna {}
 * [T14-15] Chave usa routineId corretamente (isolamento)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { routineCalendarService } from '../services/routineCalendarService';

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('TASK 14 — routineCalendarService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getItem.mockResolvedValue(null);
    mockStorage.setItem.mockResolvedValue(undefined);
    mockStorage.removeItem.mockResolvedValue(undefined);
  });

  // ── getDays ───────────────────────────────────────────────────────────────

  it('[T14-01] getDays retorna [] quando não há dados', async () => {
    mockStorage.getItem.mockResolvedValue(null);
    const result = await routineCalendarService.getDays('routine-1');
    expect(result).toEqual([]);
  });

  it('[T14-02] getDays retorna [] com JSON corrompido', async () => {
    mockStorage.getItem.mockResolvedValue('{ INVALID {{');
    const result = await routineCalendarService.getDays('routine-corrupt');
    expect(result).toEqual([]);
  });

  it('[T14-03] getDays retorna [] quando getItem lança exceção', async () => {
    mockStorage.getItem.mockRejectedValue(new Error('Storage error'));
    const result = await routineCalendarService.getDays('routine-err');
    expect(result).toEqual([]);
  });

  // ── setDays ───────────────────────────────────────────────────────────────

  it('[T14-04] setDays chama setItem com chave routine_days_${routineId}', async () => {
    await routineCalendarService.setDays('routine-abc', [1, 2, 3]);
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'routine_days_routine-abc',
      expect.any(String)
    );
  });

  it('[T14-05] setDays serializa o array de dias corretamente', async () => {
    await routineCalendarService.setDays('routine-1', [1, 3, 5]);
    const [, value] = mockStorage.setItem.mock.calls[0];
    expect(JSON.parse(value)).toEqual([1, 3, 5]);
  });

  it('[T14-06] Round-trip: setDays → getDays preserva os dias', async () => {
    await routineCalendarService.setDays('routine-1', [0, 6]);
    const [, saved] = mockStorage.setItem.mock.calls[0];
    mockStorage.getItem.mockResolvedValue(saved);

    const result = await routineCalendarService.getDays('routine-1');
    expect(result).toEqual([0, 6]);
  });

  // ── clearDays ─────────────────────────────────────────────────────────────

  it('[T14-07] clearDays chama removeItem com chave correta', async () => {
    await routineCalendarService.clearDays('routine-xyz');
    expect(mockStorage.removeItem).toHaveBeenCalledWith('routine_days_routine-xyz');
  });

  // ── isAvailableToday ──────────────────────────────────────────────────────

  it('[T14-08] isAvailableToday retorna true quando days = [] (sem restrição)', async () => {
    mockStorage.getItem.mockResolvedValue(null);
    const result = await routineCalendarService.isAvailableToday('routine-1');
    expect(result).toBe(true);
  });

  it('[T14-09] isAvailableToday retorna true quando dia atual está na lista', async () => {
    // new Date(year, month, day) usa horário LOCAL — evita ambiguidade de UTC
    const monday = new Date(2025, 0, 6); // Janeiro 6, 2025 = Segunda-feira (1)
    mockStorage.getItem.mockResolvedValue(JSON.stringify([1, 2, 3]));
    const result = await routineCalendarService.isAvailableToday('routine-1', monday);
    expect(result).toBe(true);
  });

  it('[T14-10] isAvailableToday retorna false quando dia atual NÃO está na lista', async () => {
    const sunday = new Date(2025, 0, 5); // Janeiro 5, 2025 = Domingo (0)
    mockStorage.getItem.mockResolvedValue(JSON.stringify([1, 2, 3, 4, 5])); // Seg-Sex
    const result = await routineCalendarService.isAvailableToday('routine-1', sunday);
    expect(result).toBe(false);
  });

  it('[T14-11] isAvailableToday aceita date como segundo parâmetro', async () => {
    const saturday = new Date(2025, 0, 4); // Janeiro 4, 2025 = Sábado (6)
    mockStorage.getItem.mockResolvedValue(JSON.stringify([6]));
    const result = await routineCalendarService.isAvailableToday('routine-1', saturday);
    expect(result).toBe(true);
  });

  it('[T14-12] isAvailableToday com todos os 7 dias retorna true', async () => {
    const anyDay = new Date(2025, 0, 7); // Janeiro 7, 2025 = Terça (2)
    mockStorage.getItem.mockResolvedValue(JSON.stringify([0, 1, 2, 3, 4, 5, 6]));
    const result = await routineCalendarService.isAvailableToday('routine-1', anyDay);
    expect(result).toBe(true);
  });

  // ── getDaysForRoutines ────────────────────────────────────────────────────

  it('[T14-13] getDaysForRoutines retorna mapa correto para múltiplas rotinas', async () => {
    mockStorage.getItem
      .mockResolvedValueOnce(JSON.stringify([1, 2])) // routine-a
      .mockResolvedValueOnce(JSON.stringify([5, 6])); // routine-b

    const result = await routineCalendarService.getDaysForRoutines(['routine-a', 'routine-b']);
    expect(result['routine-a']).toEqual([1, 2]);
    expect(result['routine-b']).toEqual([5, 6]);
  });

  it('[T14-14] getDaysForRoutines com lista vazia retorna {}', async () => {
    const result = await routineCalendarService.getDaysForRoutines([]);
    expect(result).toEqual({});
    expect(mockStorage.getItem).not.toHaveBeenCalled();
  });

  // ── Isolamento por routineId ──────────────────────────────────────────────

  it('[T14-15] Chave usa routineId corretamente (isolamento)', async () => {
    await routineCalendarService.setDays('my-routine-id', [1]);
    expect(mockStorage.setItem.mock.calls[0][0]).toBe('routine_days_my-routine-id');

    jest.clearAllMocks();
    mockStorage.getItem.mockResolvedValue(null);

    await routineCalendarService.getDays('other-routine-id');
    expect(mockStorage.getItem.mock.calls[0][0]).toBe('routine_days_other-routine-id');
  });
});
