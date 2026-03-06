/**
 * TASK 11 — Bateria de testes: onboardingService
 *
 * [T11-01] hasSeenOnboarding → false quando getItem retorna null
 * [T11-02] markAsCompleted → chama setItem com a chave correta
 * [T11-03] markAsCompleted → JSON gravado inclui parentId
 * [T11-04] markAsCompleted → JSON gravado inclui completedAt (ISO string)
 * [T11-05] hasSeenOnboarding → true quando getItem retorna dados (não null)
 * [T11-06] Round-trip: markAsCompleted salva → hasSeenOnboarding retorna true
 * [T11-07] clearOnboarding → chama deleteItemAsync com a chave correta
 * [T11-08] hasSeenOnboarding → false após clearOnboarding
 * [T11-09] hasSeenOnboarding → false quando getItem lança exceção (safe default)
 * [T11-10] getItemAsync chamado com chave 'parent_onboarding_completed'
 * [T11-11] setItemAsync chamado com chave 'parent_onboarding_completed'
 * [T11-12] markAsCompleted com parentIds diferentes → hasSeenOnboarding sempre true
 */

import * as SecureStore from 'expo-secure-store';
import { onboardingService } from '../services/onboardingService';

const mockSecure = SecureStore as jest.Mocked<typeof SecureStore>;
const ONBOARDING_KEY = 'parent_onboarding_completed';

describe('TASK 11 — onboardingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Store limpo a cada teste
    const store: Record<string, string> = {};
    mockSecure.getItemAsync.mockImplementation(async (k) => store[k] ?? null);
    mockSecure.setItemAsync.mockImplementation(async (k, v) => { store[k] = v; });
    mockSecure.deleteItemAsync.mockImplementation(async (k) => { delete store[k]; });
  });

  // ── hasSeenOnboarding ────────────────────────────────────────────────────

  it('[T11-01] hasSeenOnboarding → false quando getItem retorna null', async () => {
    mockSecure.getItemAsync.mockResolvedValue(null);
    const result = await onboardingService.hasSeenOnboarding();
    expect(result).toBe(false);
  });

  it('[T11-05] hasSeenOnboarding → true quando getItem retorna dados', async () => {
    mockSecure.getItemAsync.mockResolvedValue(
      JSON.stringify({ parentId: 'p1', completedAt: new Date().toISOString() })
    );
    const result = await onboardingService.hasSeenOnboarding();
    expect(result).toBe(true);
  });

  it('[T11-09] hasSeenOnboarding → false quando getItem lança exceção', async () => {
    mockSecure.getItemAsync.mockRejectedValue(new Error('Storage unavailable'));
    const result = await onboardingService.hasSeenOnboarding();
    expect(result).toBe(false);
  });

  it('[T11-10] hasSeenOnboarding → getItemAsync chamado com chave correta', async () => {
    mockSecure.getItemAsync.mockResolvedValue(null);
    await onboardingService.hasSeenOnboarding();
    expect(mockSecure.getItemAsync).toHaveBeenCalledWith(ONBOARDING_KEY);
  });

  // ── markAsCompleted ──────────────────────────────────────────────────────

  it('[T11-02] markAsCompleted → chama setItemAsync com a chave correta', async () => {
    await onboardingService.markAsCompleted('parent-123');
    expect(mockSecure.setItemAsync).toHaveBeenCalledWith(
      ONBOARDING_KEY,
      expect.any(String)
    );
  });

  it('[T11-11] markAsCompleted → setItemAsync chamado com chave parent_onboarding_completed', async () => {
    await onboardingService.markAsCompleted('parent-456');
    const [key] = mockSecure.setItemAsync.mock.calls[0];
    expect(key).toBe(ONBOARDING_KEY);
  });

  it('[T11-03] markAsCompleted → JSON gravado inclui parentId', async () => {
    await onboardingService.markAsCompleted('parent-abc');
    const [, value] = mockSecure.setItemAsync.mock.calls[0];
    const parsed = JSON.parse(value);
    expect(parsed.parentId).toBe('parent-abc');
  });

  it('[T11-04] markAsCompleted → JSON gravado inclui completedAt como ISO string', async () => {
    await onboardingService.markAsCompleted('parent-abc');
    const [, value] = mockSecure.setItemAsync.mock.calls[0];
    const parsed = JSON.parse(value);
    expect(parsed.completedAt).toBeDefined();
    const date = new Date(parsed.completedAt);
    expect(date.toISOString()).toBe(parsed.completedAt);
  });

  // ── clearOnboarding ──────────────────────────────────────────────────────

  it('[T11-07] clearOnboarding → chama deleteItemAsync com a chave correta', async () => {
    await onboardingService.clearOnboarding();
    expect(mockSecure.deleteItemAsync).toHaveBeenCalledWith(ONBOARDING_KEY);
  });

  it('[T11-08] hasSeenOnboarding → false após clearOnboarding', async () => {
    mockSecure.getItemAsync.mockResolvedValueOnce(
      JSON.stringify({ parentId: 'p1', completedAt: new Date().toISOString() })
    );
    const before = await onboardingService.hasSeenOnboarding();
    expect(before).toBe(true);

    await onboardingService.clearOnboarding();

    mockSecure.getItemAsync.mockResolvedValueOnce(null);
    const after = await onboardingService.hasSeenOnboarding();
    expect(after).toBe(false);
  });

  // ── Round-trip ───────────────────────────────────────────────────────────

  it('[T11-06] Round-trip: markAsCompleted → hasSeenOnboarding retorna true', async () => {
    mockSecure.getItemAsync.mockResolvedValueOnce(null);
    const before = await onboardingService.hasSeenOnboarding();
    expect(before).toBe(false);

    await onboardingService.markAsCompleted('parent-round-trip');
    const [, savedValue] = mockSecure.setItemAsync.mock.calls[0];

    mockSecure.getItemAsync.mockResolvedValueOnce(savedValue);
    const after = await onboardingService.hasSeenOnboarding();
    expect(after).toBe(true);
  });

  it('[T11-12] markAsCompleted com parentIds diferentes → hasSeenOnboarding sempre true', async () => {
    const parentIds = ['p-1', 'p-2', 'p-3'];

    for (const parentId of parentIds) {
      jest.clearAllMocks();
      mockSecure.setItemAsync.mockResolvedValue(undefined);

      await onboardingService.markAsCompleted(parentId);
      const [, savedValue] = mockSecure.setItemAsync.mock.calls[0];

      mockSecure.getItemAsync.mockResolvedValue(savedValue);
      const hasSeen = await onboardingService.hasSeenOnboarding();

      expect(hasSeen).toBe(true);
    }
  });
});
