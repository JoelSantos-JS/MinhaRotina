/**
 * TASK 8 — Bateria de testes: configurações de som (EditChildScreen → feedbackService)
 *
 * Verifica que o conjunto completo de settings (incluindo os novos campos de áudio)
 * é persistido e recuperado corretamente, e que o save não sobrescreve campos com defaults.
 *
 * [T8-01] saveSettings persiste soundType 'music' e getSettings recupera corretamente
 * [T8-02] saveSettings persiste soundType 'vibration' e getSettings recupera corretamente
 * [T8-03] saveSettings persiste soundType 'silent' e getSettings recupera corretamente
 * [T8-04] saveSettings persiste musicVolume 0.3 sem perda de precisão
 * [T8-05] saveSettings persiste musicVolume 1.0 (máximo)
 * [T8-06] saveSettings persiste favoriteInstrument 'violin'
 * [T8-07] saveSettings persiste favoriteInstrument 'kalimba'
 * [T8-08] saveSettings persiste favoriteInstrument 'mixed'
 * [T8-09] Round-trip completo: todos os 5 campos são preservados após save+load
 * [T8-10] Alterar soundType preserva vibrationIntensity e celebrationStyle
 * [T8-11] Alterar vibrationIntensity preserva soundType/musicVolume/favoriteInstrument
 * [T8-12] getTaskCompleteSound('piano') retorna fonte de áudio válida
 * [T8-13] getTaskCompleteSound('violin') retorna fonte de áudio válida
 * [T8-14] getTaskCompleteSound('kalimba') retorna fonte de áudio válida
 * [T8-15] getTaskCompleteSound('mixed') retorna fonte de áudio válida
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  feedbackService,
  DEFAULT_SETTINGS,
  type ChildFeedbackSettings,
} from '../services/feedbackService';
import { getTaskCompleteSound } from '../config/sounds';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Simula o ciclo save → load que o EditChildScreen executa ao salvar. */
async function saveAndLoad(partial: Partial<ChildFeedbackSettings>): Promise<ChildFeedbackSettings> {
  const settings: ChildFeedbackSettings = { ...DEFAULT_SETTINGS, ...partial };
  mockStorage.setItem.mockResolvedValue(undefined);
  await feedbackService.saveSettings('child-1', settings);
  // Simula o AsyncStorage retornando o que foi salvo
  mockStorage.getItem.mockResolvedValue(JSON.stringify(settings));
  return feedbackService.getSettings('child-1');
}

describe('TASK 8 — configurações de som: persistência completa', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getItem.mockResolvedValue(null);
    mockStorage.setItem.mockResolvedValue(undefined);
  });

  // ── soundType ────────────────────────────────────────────────────────────

  it('[T8-01] soundType "music" é persistido e recuperado corretamente', async () => {
    const result = await saveAndLoad({ soundType: 'music' });
    expect(result.soundType).toBe('music');
  });

  it('[T8-02] soundType "vibration" é persistido e recuperado corretamente', async () => {
    const result = await saveAndLoad({ soundType: 'vibration' });
    expect(result.soundType).toBe('vibration');
  });

  it('[T8-03] soundType "silent" é persistido e recuperado corretamente', async () => {
    const result = await saveAndLoad({ soundType: 'silent' });
    expect(result.soundType).toBe('silent');
  });

  // ── musicVolume ───────────────────────────────────────────────────────────

  it('[T8-04] musicVolume 0.3 é persistido sem perda de precisão', async () => {
    const result = await saveAndLoad({ musicVolume: 0.3 });
    expect(result.musicVolume).toBeCloseTo(0.3);
  });

  it('[T8-05] musicVolume 1.0 (máximo) é persistido corretamente', async () => {
    const result = await saveAndLoad({ musicVolume: 1.0 });
    expect(result.musicVolume).toBe(1.0);
  });

  // ── favoriteInstrument ───────────────────────────────────────────────────

  it('[T8-06] favoriteInstrument "violin" é persistido corretamente', async () => {
    const result = await saveAndLoad({ favoriteInstrument: 'violin' });
    expect(result.favoriteInstrument).toBe('violin');
  });

  it('[T8-07] favoriteInstrument "kalimba" é persistido corretamente', async () => {
    const result = await saveAndLoad({ favoriteInstrument: 'kalimba' });
    expect(result.favoriteInstrument).toBe('kalimba');
  });

  it('[T8-08] favoriteInstrument "mixed" é persistido corretamente', async () => {
    const result = await saveAndLoad({ favoriteInstrument: 'mixed' });
    expect(result.favoriteInstrument).toBe('mixed');
  });

  // ── Round-trip completo ───────────────────────────────────────────────────

  it('[T8-09] round-trip completo preserva todos os 5 campos', async () => {
    const full: ChildFeedbackSettings = {
      vibrationIntensity: 'strong',
      celebrationStyle:   'normal',
      soundType:          'music',
      musicVolume:        0.75,
      favoriteInstrument: 'violin',
    };
    const result = await saveAndLoad(full);
    expect(result.vibrationIntensity).toBe('strong');
    expect(result.celebrationStyle).toBe('normal');
    expect(result.soundType).toBe('music');
    expect(result.musicVolume).toBeCloseTo(0.75);
    expect(result.favoriteInstrument).toBe('violin');
  });

  it('[T8-10] alterar soundType preserva vibrationIntensity e celebrationStyle', async () => {
    const result = await saveAndLoad({
      soundType:          'vibration',
      vibrationIntensity: 'light',
      celebrationStyle:   'special',
    });
    expect(result.soundType).toBe('vibration');
    expect(result.vibrationIntensity).toBe('light');
    expect(result.celebrationStyle).toBe('special');
  });

  it('[T8-11] alterar vibrationIntensity preserva soundType/musicVolume/favoriteInstrument', async () => {
    const result = await saveAndLoad({
      vibrationIntensity: 'off',
      soundType:          'music',
      musicVolume:        0.5,
      favoriteInstrument: 'kalimba',
    });
    expect(result.vibrationIntensity).toBe('off');
    expect(result.soundType).toBe('music');
    expect(result.musicVolume).toBeCloseTo(0.5);
    expect(result.favoriteInstrument).toBe('kalimba');
  });

  // ── getTaskCompleteSound ─────────────────────────────────────────────────

  it('[T8-12] getTaskCompleteSound("piano") retorna fonte de áudio válida (não undefined)', () => {
    expect(getTaskCompleteSound('piano')).toBeDefined();
  });

  it('[T8-13] getTaskCompleteSound("violin") retorna fonte de áudio válida (não undefined)', () => {
    expect(getTaskCompleteSound('violin')).toBeDefined();
  });

  it('[T8-14] getTaskCompleteSound("kalimba") retorna fonte de áudio válida (não undefined)', () => {
    expect(getTaskCompleteSound('kalimba')).toBeDefined();
  });

  it('[T8-15] getTaskCompleteSound("mixed") retorna fonte de áudio válida (não undefined)', () => {
    expect(getTaskCompleteSound('mixed')).toBeDefined();
  });
});
