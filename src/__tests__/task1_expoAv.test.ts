/**
 * TASK 1 — Bateria de testes: expo-av instalado e configurado
 *
 * Verifica:
 * [T1-01] Audio está exportado pelo módulo
 * [T1-02] Audio.setAudioModeAsync existe e é função
 * [T1-03] Audio.Sound.createAsync existe e é função
 * [T1-04] Sound retornado tem playAsync, setVolumeAsync, unloadAsync
 * [T1-05] setAudioModeAsync aceita playsInSilentModeIOS sem erros
 * [T1-06] Sound.createAsync retorna objeto com sound e status
 * [T1-07] sound.playAsync resolve sem throw
 * [T1-08] sound.setVolumeAsync aceita volume entre 0 e 1
 * [T1-09] sound.unloadAsync resolve sem throw
 * [T1-10] setOnPlaybackStatusUpdate pode ser chamado com callback
 */

import { Audio } from 'expo-av';

describe('TASK 1 — expo-av: instalação e API de Audio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── [T1-01] Audio exportado ──────────────────────────────────────────────────
  it('[T1-01] Audio está exportado pelo módulo expo-av', () => {
    expect(Audio).toBeDefined();
    expect(typeof Audio).toBe('object');
  });

  // ── [T1-02] setAudioModeAsync existe ────────────────────────────────────────
  it('[T1-02] Audio.setAudioModeAsync é uma função', () => {
    expect(typeof Audio.setAudioModeAsync).toBe('function');
  });

  // ── [T1-03] Sound.createAsync existe ────────────────────────────────────────
  it('[T1-03] Audio.Sound.createAsync é uma função', () => {
    expect(Audio.Sound).toBeDefined();
    expect(typeof Audio.Sound.createAsync).toBe('function');
  });

  // ── [T1-04] Sound tem métodos necessários ────────────────────────────────────
  it('[T1-04] Sound retornado tem playAsync, setVolumeAsync, unloadAsync e setOnPlaybackStatusUpdate', async () => {
    const { sound } = await Audio.Sound.createAsync({ uri: 'fake.mp3' });
    expect(typeof sound.playAsync).toBe('function');
    expect(typeof sound.setVolumeAsync).toBe('function');
    expect(typeof sound.unloadAsync).toBe('function');
    expect(typeof sound.setOnPlaybackStatusUpdate).toBe('function');
  });

  // ── [T1-05] setAudioModeAsync com playsInSilentModeIOS ───────────────────────
  it('[T1-05] setAudioModeAsync aceita playsInSilentModeIOS sem lançar erro', async () => {
    await expect(
      Audio.setAudioModeAsync({ playsInSilentModeIOS: true })
    ).resolves.not.toThrow();
  });

  // ── [T1-06] createAsync retorna { sound, status } ────────────────────────────
  it('[T1-06] Sound.createAsync retorna objeto com sound e status', async () => {
    const result = await Audio.Sound.createAsync({ uri: 'fake.mp3' });
    expect(result).toHaveProperty('sound');
    expect(result).toHaveProperty('status');
  });

  // ── [T1-07] playAsync resolve ────────────────────────────────────────────────
  it('[T1-07] sound.playAsync resolve sem lançar erro', async () => {
    const { sound } = await Audio.Sound.createAsync({ uri: 'fake.mp3' });
    await expect(sound.playAsync()).resolves.toBeDefined();
  });

  // ── [T1-08] setVolumeAsync aceita 0-1 ───────────────────────────────────────
  it('[T1-08] sound.setVolumeAsync aceita valores de 0.0 a 1.0', async () => {
    const { sound } = await Audio.Sound.createAsync({ uri: 'fake.mp3' });
    await expect(sound.setVolumeAsync(0.0)).resolves.toBeDefined();
    await expect(sound.setVolumeAsync(0.5)).resolves.toBeDefined();
    await expect(sound.setVolumeAsync(1.0)).resolves.toBeDefined();
  });

  // ── [T1-09] unloadAsync resolve ──────────────────────────────────────────────
  it('[T1-09] sound.unloadAsync resolve sem lançar erro', async () => {
    const { sound } = await Audio.Sound.createAsync({ uri: 'fake.mp3' });
    await expect(sound.unloadAsync()).resolves.toBeDefined();
  });

  // ── [T1-10] setOnPlaybackStatusUpdate aceita callback ────────────────────────
  it('[T1-10] setOnPlaybackStatusUpdate pode ser chamado com callback de status', async () => {
    const { sound } = await Audio.Sound.createAsync({ uri: 'fake.mp3' });
    const callback = jest.fn();
    expect(() => sound.setOnPlaybackStatusUpdate(callback)).not.toThrow();
  });
});
