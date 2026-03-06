/**
 * TASK 12 — Bateria de testes: parentSettingsService
 *
 * [T12-01] DEFAULT_PARENT_SETTINGS tem os 4 campos obrigatórios
 * [T12-02] Todos os defaults são true
 * [T12-03] getSettings retorna defaults quando getItem é null
 * [T12-04] getSettings retorna defaults sem erro com JSON corrompido
 * [T12-05] saveSettings chama setItemAsync com chave parent_advanced_settings_${parentId}
 * [T12-06] saveSettings grava JSON com todos os 4 campos
 * [T12-07] Round-trip: save → load preserva todos os campos
 * [T12-08] educationalAlertsEnabled: false preservado no round-trip
 * [T12-09] autoSensoryDetectionEnabled: false preservado no round-trip
 * [T12-10] miniCelebrationsEnabled: false preservado no round-trip
 * [T12-11] helpButtonEnabled: false preservado no round-trip
 * [T12-12] Backward-compat: dados antigos sem helpButtonEnabled → preenchido com true
 * [T12-13] getSettings com parentIds diferentes usa chaves diferentes
 * [T12-14] getSettings retorna defaults quando getItem lança exceção
 * [T12-15] Chave inclui o parentId corretamente
 */

import * as SecureStore from 'expo-secure-store';
import {
  parentSettingsService,
  DEFAULT_PARENT_SETTINGS,
  type ParentAdvancedSettings,
} from '../services/parentSettingsService';

const mockSecure = SecureStore as jest.Mocked<typeof SecureStore>;

describe('TASK 12 — parentSettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const store: Record<string, string> = {};
    mockSecure.getItemAsync.mockImplementation(async (k) => store[k] ?? null);
    mockSecure.setItemAsync.mockImplementation(async (k, v) => { store[k] = v; });
    mockSecure.deleteItemAsync.mockImplementation(async (k) => { delete store[k]; });
  });

  // ── DEFAULT_PARENT_SETTINGS ──────────────────────────────────────────────

  it('[T12-01] DEFAULT_PARENT_SETTINGS tem os 4 campos obrigatórios', () => {
    expect(DEFAULT_PARENT_SETTINGS).toHaveProperty('educationalAlertsEnabled');
    expect(DEFAULT_PARENT_SETTINGS).toHaveProperty('autoSensoryDetectionEnabled');
    expect(DEFAULT_PARENT_SETTINGS).toHaveProperty('miniCelebrationsEnabled');
    expect(DEFAULT_PARENT_SETTINGS).toHaveProperty('helpButtonEnabled');
  });

  it('[T12-02] Todos os defaults são true', () => {
    expect(DEFAULT_PARENT_SETTINGS.educationalAlertsEnabled).toBe(true);
    expect(DEFAULT_PARENT_SETTINGS.autoSensoryDetectionEnabled).toBe(true);
    expect(DEFAULT_PARENT_SETTINGS.miniCelebrationsEnabled).toBe(true);
    expect(DEFAULT_PARENT_SETTINGS.helpButtonEnabled).toBe(true);
  });

  // ── getSettings ──────────────────────────────────────────────────────────

  it('[T12-03] getSettings retorna defaults quando getItem é null', async () => {
    mockSecure.getItemAsync.mockResolvedValue(null);
    const result = await parentSettingsService.getSettings('parent-1');
    expect(result).toEqual(DEFAULT_PARENT_SETTINGS);
  });

  it('[T12-04] getSettings retorna defaults sem erro com JSON corrompido', async () => {
    mockSecure.getItemAsync.mockResolvedValue('{ INVALID {{');
    await expect(
      parentSettingsService.getSettings('parent-corrupt')
    ).resolves.toEqual(DEFAULT_PARENT_SETTINGS);
  });

  it('[T12-14] getSettings retorna defaults quando getItem lança exceção', async () => {
    mockSecure.getItemAsync.mockRejectedValue(new Error('Storage unavailable'));
    const result = await parentSettingsService.getSettings('parent-err');
    expect(result).toEqual(DEFAULT_PARENT_SETTINGS);
  });

  // ── saveSettings ─────────────────────────────────────────────────────────

  it('[T12-05] saveSettings chama setItemAsync com chave parent_advanced_settings_${parentId}', async () => {
    await parentSettingsService.saveSettings('parent-xyz', DEFAULT_PARENT_SETTINGS);
    expect(mockSecure.setItemAsync).toHaveBeenCalledWith(
      'parent_advanced_settings_parent-xyz',
      expect.any(String)
    );
  });

  it('[T12-15] Chave inclui o parentId corretamente', async () => {
    await parentSettingsService.saveSettings('my-parent-id', DEFAULT_PARENT_SETTINGS);
    const [key] = mockSecure.setItemAsync.mock.calls[0];
    expect(key).toBe('parent_advanced_settings_my-parent-id');
  });

  it('[T12-06] saveSettings grava JSON com todos os 4 campos', async () => {
    await parentSettingsService.saveSettings('parent-1', DEFAULT_PARENT_SETTINGS);
    const [, value] = mockSecure.setItemAsync.mock.calls[0];
    const parsed: ParentAdvancedSettings = JSON.parse(value);
    expect(parsed).toHaveProperty('educationalAlertsEnabled');
    expect(parsed).toHaveProperty('autoSensoryDetectionEnabled');
    expect(parsed).toHaveProperty('miniCelebrationsEnabled');
    expect(parsed).toHaveProperty('helpButtonEnabled');
  });

  // ── Round-trip ───────────────────────────────────────────────────────────

  it('[T12-07] Round-trip: save → load preserva todos os campos', async () => {
    const custom: ParentAdvancedSettings = {
      educationalAlertsEnabled: false,
      autoSensoryDetectionEnabled: true,
      miniCelebrationsEnabled: false,
      helpButtonEnabled: true,
    };
    await parentSettingsService.saveSettings('parent-1', custom);
    const [, saved] = mockSecure.setItemAsync.mock.calls[0];

    mockSecure.getItemAsync.mockResolvedValue(saved);
    const result = await parentSettingsService.getSettings('parent-1');

    expect(result.educationalAlertsEnabled).toBe(false);
    expect(result.autoSensoryDetectionEnabled).toBe(true);
    expect(result.miniCelebrationsEnabled).toBe(false);
    expect(result.helpButtonEnabled).toBe(true);
  });

  it('[T12-08] educationalAlertsEnabled: false preservado no round-trip', async () => {
    const s = { ...DEFAULT_PARENT_SETTINGS, educationalAlertsEnabled: false };
    mockSecure.getItemAsync.mockResolvedValue(JSON.stringify(s));
    const result = await parentSettingsService.getSettings('parent-1');
    expect(result.educationalAlertsEnabled).toBe(false);
  });

  it('[T12-09] autoSensoryDetectionEnabled: false preservado no round-trip', async () => {
    const s = { ...DEFAULT_PARENT_SETTINGS, autoSensoryDetectionEnabled: false };
    mockSecure.getItemAsync.mockResolvedValue(JSON.stringify(s));
    const result = await parentSettingsService.getSettings('parent-1');
    expect(result.autoSensoryDetectionEnabled).toBe(false);
  });

  it('[T12-10] miniCelebrationsEnabled: false preservado no round-trip', async () => {
    const s = { ...DEFAULT_PARENT_SETTINGS, miniCelebrationsEnabled: false };
    mockSecure.getItemAsync.mockResolvedValue(JSON.stringify(s));
    const result = await parentSettingsService.getSettings('parent-1');
    expect(result.miniCelebrationsEnabled).toBe(false);
  });

  it('[T12-11] helpButtonEnabled: false preservado no round-trip', async () => {
    const s = { ...DEFAULT_PARENT_SETTINGS, helpButtonEnabled: false };
    mockSecure.getItemAsync.mockResolvedValue(JSON.stringify(s));
    const result = await parentSettingsService.getSettings('parent-1');
    expect(result.helpButtonEnabled).toBe(false);
  });

  // ── Backward-compatibility ───────────────────────────────────────────────

  it('[T12-12] Backward-compat: dados antigos sem helpButtonEnabled → preenchido com true', async () => {
    const legacy = {
      educationalAlertsEnabled: false,
      autoSensoryDetectionEnabled: false,
      miniCelebrationsEnabled: false,
    };
    mockSecure.getItemAsync.mockResolvedValue(JSON.stringify(legacy));
    const result = await parentSettingsService.getSettings('parent-legacy');

    expect(result.educationalAlertsEnabled).toBe(false);
    expect(result.autoSensoryDetectionEnabled).toBe(false);
    expect(result.miniCelebrationsEnabled).toBe(false);
    expect(result.helpButtonEnabled).toBe(true);
  });

  // ── Isolamento por parentId ──────────────────────────────────────────────

  it('[T12-13] getSettings com parentIds diferentes usa chaves diferentes', async () => {
    mockSecure.getItemAsync.mockResolvedValue(null);
    await parentSettingsService.getSettings('parent-a');
    await parentSettingsService.getSettings('parent-b');

    const calls = mockSecure.getItemAsync.mock.calls;
    expect(calls[0][0]).toBe('parent_advanced_settings_parent-a');
    expect(calls[1][0]).toBe('parent_advanced_settings_parent-b');
    expect(calls[0][0]).not.toBe(calls[1][0]);
  });
});
