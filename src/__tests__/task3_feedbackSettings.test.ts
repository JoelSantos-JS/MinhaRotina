/**
 * TASK 3 — Bateria de testes: tipos e persistência de ChildFeedbackSettings
 *
 * [T3-01] DEFAULT_SETTINGS tem todos os campos obrigatórios
 * [T3-02] DEFAULT_SETTINGS.soundType é 'music'
 * [T3-03] DEFAULT_SETTINGS.musicVolume está entre 0 e 1
 * [T3-04] DEFAULT_SETTINGS.favoriteInstrument é um valor válido
 * [T3-05] DEFAULT_SETTINGS.vibrationIntensity é 'medium'
 * [T3-06] DEFAULT_SETTINGS.celebrationStyle é 'special'
 * [T3-07] getSettings retorna DEFAULT_SETTINGS quando não há dados salvos
 * [T3-08] saveSettings + getSettings: round-trip preserva todos os campos
 * [T3-09] getSettings faz merge: campos novos preenchem dados antigos sem soundType
 * [T3-10] getSettings não lança erro em dados corrompidos no SecureStore
 * [T3-11] saveSettings lança se SecureStore falhar
 * [T3-12] getSettings com soundType 'vibration' preserva o valor salvo
 * [T3-13] getSettings com soundType 'silent' preserva o valor salvo
 * [T3-14] musicVolume salvo como 0.3 é recuperado como 0.3
 * [T3-15] favoriteInstrument 'violin' é persistido corretamente
 */

import * as SecureStore from 'expo-secure-store';
import { feedbackService, DEFAULT_SETTINGS, type ChildFeedbackSettings } from '../services/feedbackService';

const mockSecure = SecureStore as jest.Mocked<typeof SecureStore>;

describe('TASK 3 — feedbackService: tipos e persistência de settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSecure.getItemAsync.mockResolvedValue(null);
    mockSecure.setItemAsync.mockResolvedValue(undefined);
  });

  // ── DEFAULT_SETTINGS ────────────────────────────────────────────────────

  it('[T3-01] DEFAULT_SETTINGS tem vibrationIntensity, celebrationStyle, soundType, musicVolume, favoriteInstrument', () => {
    expect(DEFAULT_SETTINGS).toHaveProperty('vibrationIntensity');
    expect(DEFAULT_SETTINGS).toHaveProperty('celebrationStyle');
    expect(DEFAULT_SETTINGS).toHaveProperty('soundType');
    expect(DEFAULT_SETTINGS).toHaveProperty('musicVolume');
    expect(DEFAULT_SETTINGS).toHaveProperty('favoriteInstrument');
  });

  it('[T3-02] DEFAULT_SETTINGS.soundType é "music"', () => {
    expect(DEFAULT_SETTINGS.soundType).toBe('music');
  });

  it('[T3-03] DEFAULT_SETTINGS.musicVolume está entre 0.0 e 1.0', () => {
    expect(DEFAULT_SETTINGS.musicVolume).toBeGreaterThan(0);
    expect(DEFAULT_SETTINGS.musicVolume).toBeLessThanOrEqual(1.0);
  });

  it('[T3-04] DEFAULT_SETTINGS.favoriteInstrument é um valor válido', () => {
    const valid = ['piano', 'violin', 'kalimba', 'mixed'];
    expect(valid).toContain(DEFAULT_SETTINGS.favoriteInstrument);
  });

  it('[T3-05] DEFAULT_SETTINGS.vibrationIntensity é "medium"', () => {
    expect(DEFAULT_SETTINGS.vibrationIntensity).toBe('medium');
  });

  it('[T3-06] DEFAULT_SETTINGS.celebrationStyle é "special"', () => {
    expect(DEFAULT_SETTINGS.celebrationStyle).toBe('special');
  });

  // ── getSettings ──────────────────────────────────────────────────────────

  it('[T3-07] getSettings retorna DEFAULT_SETTINGS quando não há dados salvos', async () => {
    mockSecure.getItemAsync.mockResolvedValue(null);
    const result = await feedbackService.getSettings('child-1');
    expect(result).toEqual(DEFAULT_SETTINGS);
  });

  it('[T3-08] saveSettings + getSettings: round-trip preserva todos os campos', async () => {
    const custom: ChildFeedbackSettings = {
      vibrationIntensity: 'strong',
      celebrationStyle: 'normal',
      soundType: 'music',
      musicVolume: 0.8,
      favoriteInstrument: 'violin',
    };
    await feedbackService.saveSettings('child-1', custom);
    mockSecure.getItemAsync.mockResolvedValue(JSON.stringify(custom));
    const result = await feedbackService.getSettings('child-1');

    expect(result.soundType).toBe('music');
    expect(result.musicVolume).toBe(0.8);
    expect(result.favoriteInstrument).toBe('violin');
    expect(result.vibrationIntensity).toBe('strong');
    expect(result.celebrationStyle).toBe('normal');
  });

  it('[T3-09] getSettings preenche soundType/musicVolume/favoriteInstrument com defaults quando dados antigos não têm esses campos', async () => {
    const legacySettings = { vibrationIntensity: 'light', celebrationStyle: 'normal' };
    mockSecure.getItemAsync.mockResolvedValue(JSON.stringify(legacySettings));

    const result = await feedbackService.getSettings('child-old');

    expect(result.vibrationIntensity).toBe('light');
    expect(result.celebrationStyle).toBe('normal');
    expect(result.soundType).toBe(DEFAULT_SETTINGS.soundType);
    expect(result.musicVolume).toBe(DEFAULT_SETTINGS.musicVolume);
    expect(result.favoriteInstrument).toBe(DEFAULT_SETTINGS.favoriteInstrument);
  });

  it('[T3-10] getSettings retorna DEFAULT_SETTINGS sem lançar erro quando JSON está corrompido', async () => {
    mockSecure.getItemAsync.mockResolvedValue('{ INVALID JSON {{');
    await expect(feedbackService.getSettings('child-corrupt')).resolves.toEqual(DEFAULT_SETTINGS);
  });

  it('[T3-11] saveSettings propaga erro se SecureStore.setItemAsync falhar', async () => {
    mockSecure.setItemAsync.mockRejectedValue(new Error('Storage full'));
    await expect(
      feedbackService.saveSettings('child-1', DEFAULT_SETTINGS)
    ).rejects.toThrow('Storage full');
  });

  // ── Persistência de valores específicos ──────────────────────────────────

  it('[T3-12] soundType "vibration" é preservado no round-trip', async () => {
    const s = { ...DEFAULT_SETTINGS, soundType: 'vibration' as const };
    mockSecure.getItemAsync.mockResolvedValue(JSON.stringify(s));
    const result = await feedbackService.getSettings('child-1');
    expect(result.soundType).toBe('vibration');
  });

  it('[T3-13] soundType "silent" é preservado no round-trip', async () => {
    const s = { ...DEFAULT_SETTINGS, soundType: 'silent' as const };
    mockSecure.getItemAsync.mockResolvedValue(JSON.stringify(s));
    const result = await feedbackService.getSettings('child-1');
    expect(result.soundType).toBe('silent');
  });

  it('[T3-14] musicVolume 0.3 é recuperado como 0.3', async () => {
    const s = { ...DEFAULT_SETTINGS, musicVolume: 0.3 };
    mockSecure.getItemAsync.mockResolvedValue(JSON.stringify(s));
    const result = await feedbackService.getSettings('child-1');
    expect(result.musicVolume).toBeCloseTo(0.3);
  });

  it('[T3-15] favoriteInstrument "violin" é persistido corretamente', async () => {
    const s = { ...DEFAULT_SETTINGS, favoriteInstrument: 'violin' as const };
    mockSecure.getItemAsync.mockResolvedValue(JSON.stringify(s));
    const result = await feedbackService.getSettings('child-1');
    expect(result.favoriteInstrument).toBe('violin');
  });
});
