/**
 * Bateria de testes — secureStorage + migração AsyncStorage
 *
 * Cobre:
 *  - secureStorage utility (leitura, escrita, remoção, migração, resiliência)
 *  - feedbackService (defaults, persistência, backward-compat, JSON corrompido)
 *  - onboardingService (fluxo completo)
 *  - parentSettingsService (defaults, persistência, backward-compat)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { secureStorage } from '../config/secureStorage';
import { feedbackService, DEFAULT_SETTINGS } from '../services/feedbackService';
import { onboardingService } from '../services/onboardingService';
import {
  parentSettingsService,
  DEFAULT_PARENT_SETTINGS,
} from '../services/parentSettingsService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clearAllMockStores() {
  (AsyncStorage.clear as jest.Mock).mockClear();
  // Limpa o store interno do mock de AsyncStorage
  (AsyncStorage as any).__store?.clear?.();
  // Limpa o store interno do mock de SecureStore via resetAllMocks não funciona
  // então usamos as implementações mock diretamente
  (SecureStore.getItemAsync as jest.Mock).mockReset();
  (SecureStore.setItemAsync as jest.Mock).mockReset();
  (SecureStore.deleteItemAsync as jest.Mock).mockReset();

  // Reimplementa os mocks com store limpo
  const secure: Record<string, string> = {};
  (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) => secure[k] ?? null);
  (SecureStore.setItemAsync as jest.Mock).mockImplementation(async (k: string, v: string) => { secure[k] = v; });
  (SecureStore.deleteItemAsync as jest.Mock).mockImplementation(async (k: string) => { delete secure[k]; });

  (AsyncStorage.clear as jest.Mock)();
}

beforeEach(() => {
  clearAllMockStores();
  jest.clearAllMocks();

  // Reimplementa AsyncStorage com store limpo
  const as: Record<string, string> = {};
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (k: string) => as[k] ?? null);
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (k: string, v: string) => { as[k] = v; });
  (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (k: string) => { delete as[k]; });

  // Reimplementa SecureStore com store limpo
  const ss: Record<string, string> = {};
  (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) => ss[k] ?? null);
  (SecureStore.setItemAsync as jest.Mock).mockImplementation(async (k: string, v: string) => { ss[k] = v; });
  (SecureStore.deleteItemAsync as jest.Mock).mockImplementation(async (k: string) => { delete ss[k]; });
});

// ══════════════════════════════════════════════════════════════════════════════
// secureStorage — utility
// ══════════════════════════════════════════════════════════════════════════════

test('SS-01: getItem retorna null quando vazio em ambos os stores', async () => {
  const result = await secureStorage.getItem('chave_teste');
  expect(result).toBeNull();
});

test('SS-02: getItem lê do SecureStore (caminho primário)', async () => {
  await SecureStore.setItemAsync('chave_teste', 'valor_seguro');
  const result = await secureStorage.getItem('chave_teste');
  expect(result).toBe('valor_seguro');
  // NÃO deve ter consultado AsyncStorage
  expect(AsyncStorage.getItem).not.toHaveBeenCalled();
});

test('SS-03: getItem faz fallback ao AsyncStorage quando SecureStore está vazio', async () => {
  await AsyncStorage.setItem('chave_teste', 'valor_legado');
  const result = await secureStorage.getItem('chave_teste');
  expect(result).toBe('valor_legado');
});

test('SS-04: getItem migra dado do AsyncStorage para SecureStore automaticamente', async () => {
  await AsyncStorage.setItem('chave_migrar', 'dado_legado');

  await secureStorage.getItem('chave_migrar');

  // Deve ter gravado no SecureStore
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('chave_migrar', 'dado_legado');
  // Deve ter removido do AsyncStorage
  expect(AsyncStorage.removeItem).toHaveBeenCalledWith('chave_migrar');
});

test('SS-05: getItem retorna dado correto mesmo após migração', async () => {
  await AsyncStorage.setItem('chave_migrar', 'dado_legado');
  const result = await secureStorage.getItem('chave_migrar');
  expect(result).toBe('dado_legado');
});

test('SS-06: setItem grava no SecureStore', async () => {
  await secureStorage.setItem('chave', 'valor');
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('chave', 'valor');
});

test('SS-07: setItem remove chave legada do AsyncStorage', async () => {
  await secureStorage.setItem('chave', 'valor');
  expect(AsyncStorage.removeItem).toHaveBeenCalledWith('chave');
});

test('SS-08: removeItem deleta do SecureStore', async () => {
  await secureStorage.setItem('chave', 'valor');
  await secureStorage.removeItem('chave');
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('chave');
  const result = await secureStorage.getItem('chave');
  expect(result).toBeNull();
});

test('SS-09: removeItem também remove do AsyncStorage (chave legada)', async () => {
  await secureStorage.removeItem('chave_legada');
  expect(AsyncStorage.removeItem).toHaveBeenCalledWith('chave_legada');
});

test('SS-10: getItem não lança exceção se SecureStore jogar erro (resiliência)', async () => {
  (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('SecureStore falhou'));
  await AsyncStorage.setItem('chave_segura', 'fallback');

  const result = await secureStorage.getItem('chave_segura');
  expect(result).toBe('fallback');
});

// ══════════════════════════════════════════════════════════════════════════════
// feedbackService
// ══════════════════════════════════════════════════════════════════════════════

test('FB-01: getSettings retorna DEFAULT_SETTINGS quando não há dados', async () => {
  const settings = await feedbackService.getSettings('child-123');
  expect(settings).toEqual(DEFAULT_SETTINGS);
});

test('FB-02: saveSettings persiste no SecureStore (não no AsyncStorage)', async () => {
  const custom = { ...DEFAULT_SETTINGS, musicVolume: 0.8 };
  await feedbackService.saveSettings('child-123', custom);

  // SecureStore deve ter sido chamado
  expect(SecureStore.setItemAsync).toHaveBeenCalled();
  // A chave do AsyncStorage NÃO deve ter recebido o dado novo
  const asyncValue = await AsyncStorage.getItem('feedback_settings_child-123');
  expect(asyncValue).toBeNull();
});

test('FB-03: getSettings lê o que foi salvo com saveSettings', async () => {
  const custom = { ...DEFAULT_SETTINGS, soundType: 'vibration' as const, musicVolume: 0.3 };
  await feedbackService.saveSettings('child-abc', custom);
  const loaded = await feedbackService.getSettings('child-abc');
  expect(loaded.soundType).toBe('vibration');
  expect(loaded.musicVolume).toBe(0.3);
});

test('FB-04: getSettings faz merge com defaults (backward-compat — chaves novas ausentes)', async () => {
  // Simula dado antigo sem as novas chaves soundType/favoriteInstrument
  const legacyData = { vibrationIntensity: 'light', celebrationStyle: 'normal' };
  await SecureStore.setItemAsync('feedback_settings_child-old', JSON.stringify(legacyData));

  const settings = await feedbackService.getSettings('child-old');

  // Chaves antigas preservadas
  expect(settings.vibrationIntensity).toBe('light');
  expect(settings.celebrationStyle).toBe('normal');
  // Novas chaves preenchidas com defaults
  expect(settings.soundType).toBe(DEFAULT_SETTINGS.soundType);
  expect(settings.favoriteInstrument).toBe(DEFAULT_SETTINGS.favoriteInstrument);
});

test('FB-05: getSettings retorna defaults quando JSON está corrompido', async () => {
  await SecureStore.setItemAsync('feedback_settings_child-broken', 'json_invalido{{{{');
  const settings = await feedbackService.getSettings('child-broken');
  expect(settings).toEqual(DEFAULT_SETTINGS);
});

test('FB-06: getSettings migra dado legado do AsyncStorage', async () => {
  await AsyncStorage.setItem(
    'feedback_settings_child-migrate',
    JSON.stringify({ ...DEFAULT_SETTINGS, musicVolume: 0.99 })
  );

  const settings = await feedbackService.getSettings('child-migrate');
  expect(settings.musicVolume).toBe(0.99);
  // Deve ter migrado para SecureStore
  expect(SecureStore.setItemAsync).toHaveBeenCalled();
});

// ══════════════════════════════════════════════════════════════════════════════
// onboardingService
// ══════════════════════════════════════════════════════════════════════════════

test('ON-01: hasSeenOnboarding retorna false quando vazio', async () => {
  const result = await onboardingService.hasSeenOnboarding();
  expect(result).toBe(false);
});

test('ON-02: markAsCompleted grava no SecureStore', async () => {
  await onboardingService.markAsCompleted('parent-123');
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
    'parent_onboarding_completed',
    expect.any(String)
  );
});

test('ON-03: hasSeenOnboarding retorna true após markAsCompleted', async () => {
  await onboardingService.markAsCompleted('parent-123');
  const result = await onboardingService.hasSeenOnboarding();
  expect(result).toBe(true);
});

test('ON-04: clearOnboarding remove do SecureStore', async () => {
  await onboardingService.markAsCompleted('parent-123');
  await onboardingService.clearOnboarding();
  const result = await onboardingService.hasSeenOnboarding();
  expect(result).toBe(false);
});

test('ON-05: hasSeenOnboarding retorna false se SecureStore jogar erro', async () => {
  (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('erro'));
  const result = await onboardingService.hasSeenOnboarding();
  expect(result).toBe(false);
});

// ══════════════════════════════════════════════════════════════════════════════
// parentSettingsService
// ══════════════════════════════════════════════════════════════════════════════

test('PS-01: getSettings retorna DEFAULT_PARENT_SETTINGS quando vazio', async () => {
  const settings = await parentSettingsService.getSettings('parent-xyz');
  expect(settings).toEqual(DEFAULT_PARENT_SETTINGS);
});

test('PS-02: saveSettings grava no SecureStore (não no AsyncStorage)', async () => {
  await parentSettingsService.saveSettings('parent-xyz', DEFAULT_PARENT_SETTINGS);
  expect(SecureStore.setItemAsync).toHaveBeenCalled();
  const asyncValue = await AsyncStorage.getItem('parent_advanced_settings_parent-xyz');
  expect(asyncValue).toBeNull();
});

test('PS-03: getSettings lê o que foi salvo', async () => {
  const custom = { ...DEFAULT_PARENT_SETTINGS, miniCelebrationsEnabled: false };
  await parentSettingsService.saveSettings('parent-xyz', custom);
  const loaded = await parentSettingsService.getSettings('parent-xyz');
  expect(loaded.miniCelebrationsEnabled).toBe(false);
});

test('PS-04: getSettings faz merge com defaults (backward-compat)', async () => {
  // Simula dado antigo sem helpButtonEnabled
  const legacy = { educationalAlertsEnabled: false };
  await SecureStore.setItemAsync('parent_advanced_settings_parent-old', JSON.stringify(legacy));

  const settings = await parentSettingsService.getSettings('parent-old');

  expect(settings.educationalAlertsEnabled).toBe(false);
  // Chave nova preenchida com default
  expect(settings.helpButtonEnabled).toBe(DEFAULT_PARENT_SETTINGS.helpButtonEnabled);
});

test('PS-05: getSettings retorna defaults quando JSON está corrompido', async () => {
  await SecureStore.setItemAsync('parent_advanced_settings_parent-broken', '{{invalido');
  const settings = await parentSettingsService.getSettings('parent-broken');
  expect(settings).toEqual(DEFAULT_PARENT_SETTINGS);
});
