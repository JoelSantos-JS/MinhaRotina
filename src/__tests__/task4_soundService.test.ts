/**
 * TASK 4 — Bateria de testes: soundService (núcleo de reprodução de áudio)
 *
 * [T4-01] playNote chama Audio.Sound.createAsync com a fonte correta
 * [T4-02] playNote chama setVolumeAsync com o volume correto
 * [T4-03] playNote chama playAsync após setVolumeAsync
 * [T4-04] playNote chama unloadAsync após didJustFinish
 * [T4-05] playNote não lança erro se Audio.Sound.createAsync rejeitar
 * [T4-06] playNote não lança erro se playAsync rejeitar
 * [T4-07] playNote chama unloadAsync mesmo quando playAsync rejeita
 * [T4-08] playNote resolve quando o callback recebe status.error
 * [T4-09] playNote usa volume padrão 0.65 quando não especificado
 * [T4-10] volume maior que 1.0 é clampado para 1.0
 * [T4-11] volume menor que 0.0 é clampado para 0.0
 * [T4-12] playSequence com array vazio resolve imediatamente sem criar sons
 * [T4-13] playSequence chama createAsync para cada source
 * [T4-14] playSequence com uma nota resolve após _finish
 * [T4-15] playSequence resolve quando todas as notas terminam (playAsync + unloadAsync x3)
 * [T4-16] playNote resolve via timeout de 5s quando o callback nunca dispara
 */

import { Audio } from 'expo-av';
import { makeMockSound } from '../__mocks__/expo-av';
import { soundService } from '../services/soundService';

// cast para acessar mockResolvedValueOnce
const mockCreateAsync = Audio.Sound.createAsync as jest.Mock;

/** Drena a fila de microtasks (Promises) sem avançar timers fake. */
const flushMicrotasks = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};

describe('TASK 4 — soundService: reprodução de áudio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── playNote ──────────────────────────────────────────────────────────────

  it('[T4-01] playNote chama Audio.Sound.createAsync com a fonte correta', async () => {
    const ms = makeMockSound();
    mockCreateAsync.mockResolvedValueOnce({ sound: ms, status: {} });

    const source = 'test-file-stub';
    const play = soundService.playNote(source);
    await flushMicrotasks();
    ms._finish();
    await play;

    expect(mockCreateAsync).toHaveBeenCalledWith(source, { shouldPlay: false });
  });

  it('[T4-02] playNote chama setVolumeAsync com o volume correto', async () => {
    const ms = makeMockSound();
    mockCreateAsync.mockResolvedValueOnce({ sound: ms, status: {} });

    const play = soundService.playNote('test-file-stub', 0.8);
    await flushMicrotasks();
    ms._finish();
    await play;

    expect(ms.setVolumeAsync).toHaveBeenCalledWith(0.8);
  });

  it('[T4-03] playNote chama playAsync após setVolumeAsync', async () => {
    const ms = makeMockSound();
    mockCreateAsync.mockResolvedValueOnce({ sound: ms, status: {} });

    const play = soundService.playNote('test-file-stub');
    await flushMicrotasks();
    ms._finish();
    await play;

    // Verifica tanto que playAsync foi chamado quanto a ordem relativa
    expect(ms.setVolumeAsync).toHaveBeenCalled();
    expect(ms.playAsync).toHaveBeenCalled();
    expect(ms.setVolumeAsync.mock.invocationCallOrder[0])
      .toBeLessThan(ms.playAsync.mock.invocationCallOrder[0]);
  });

  it('[T4-04] playNote chama unloadAsync após didJustFinish', async () => {
    const ms = makeMockSound();
    mockCreateAsync.mockResolvedValueOnce({ sound: ms, status: {} });

    const play = soundService.playNote('test-file-stub');
    await flushMicrotasks();
    ms._finish();
    await play;

    expect(ms.unloadAsync).toHaveBeenCalledTimes(1);
  });

  it('[T4-05] playNote não lança erro se Audio.Sound.createAsync rejeitar', async () => {
    mockCreateAsync.mockRejectedValueOnce(new Error('AVAudioSession error'));

    await expect(soundService.playNote('test-file-stub')).resolves.toBeUndefined();
  });

  it('[T4-06] playNote não lança erro se playAsync rejeitar', async () => {
    const ms = makeMockSound();
    ms.playAsync.mockRejectedValueOnce(new Error('playback failed'));
    mockCreateAsync.mockResolvedValueOnce({ sound: ms, status: {} });

    await expect(soundService.playNote('test-file-stub')).resolves.toBeUndefined();
  });

  it('[T4-07] playNote chama unloadAsync mesmo quando playAsync rejeita', async () => {
    const ms = makeMockSound();
    ms.playAsync.mockRejectedValueOnce(new Error('playback failed'));
    mockCreateAsync.mockResolvedValueOnce({ sound: ms, status: {} });

    await soundService.playNote('test-file-stub');

    expect(ms.unloadAsync).toHaveBeenCalledTimes(1);
  });

  it('[T4-08] playNote resolve quando o callback recebe status.error', async () => {
    const ms = makeMockSound();
    mockCreateAsync.mockResolvedValueOnce({ sound: ms, status: {} });

    const play = soundService.playNote('test-file-stub');
    await flushMicrotasks();
    ms._error('Decoder error');
    await play;

    expect(ms.unloadAsync).toHaveBeenCalled();
  });

  it('[T4-09] playNote usa volume padrão 0.65 quando não especificado', async () => {
    const ms = makeMockSound();
    mockCreateAsync.mockResolvedValueOnce({ sound: ms, status: {} });

    const play = soundService.playNote('test-file-stub');
    await flushMicrotasks();
    ms._finish();
    await play;

    expect(ms.setVolumeAsync).toHaveBeenCalledWith(0.65);
  });

  it('[T4-10] volume maior que 1.0 é clampado para 1.0', async () => {
    const ms = makeMockSound();
    mockCreateAsync.mockResolvedValueOnce({ sound: ms, status: {} });

    const play = soundService.playNote('test-file-stub', 2.5);
    await flushMicrotasks();
    ms._finish();
    await play;

    expect(ms.setVolumeAsync).toHaveBeenCalledWith(1);
  });

  it('[T4-11] volume menor que 0.0 é clampado para 0.0', async () => {
    const ms = makeMockSound();
    mockCreateAsync.mockResolvedValueOnce({ sound: ms, status: {} });

    const play = soundService.playNote('test-file-stub', -0.5);
    await flushMicrotasks();
    ms._finish();
    await play;

    expect(ms.setVolumeAsync).toHaveBeenCalledWith(0);
  });

  // ── playNote — timeout de 5s ───────────────────────────────────────────────

  it('[T4-16] playNote resolve via timeout de 5s quando o callback nunca dispara', async () => {
    const ms = makeMockSound();
    // Sobrescreve setOnPlaybackStatusUpdate para não registrar o callback
    // simulando cenário onde o evento de fim de reprodução nunca chega
    ms.setOnPlaybackStatusUpdate.mockImplementation(() => { /* não registra _cb */ });
    mockCreateAsync.mockResolvedValueOnce({ sound: ms, status: {} });

    const play = soundService.playNote('test-file-stub');
    await flushMicrotasks();      // espera playAsync terminar e setTimeout ser registrado
    jest.runAllTimers();          // dispara o setTimeout(resolve, 5000)
    await flushMicrotasks();      // deixa o finally (unloadAsync) executar
    await play;

    expect(ms.unloadAsync).toHaveBeenCalled();
  });

  // ── playSequence ──────────────────────────────────────────────────────────

  it('[T4-12] playSequence com array vazio resolve imediatamente sem criar sons', async () => {
    await expect(soundService.playSequence([], [], 0.65)).resolves.toBeUndefined();
    expect(mockCreateAsync).not.toHaveBeenCalled();
  });

  it('[T4-13] playSequence chama createAsync para cada source', async () => {
    const ms1 = makeMockSound();
    const ms2 = makeMockSound();
    mockCreateAsync
      .mockResolvedValueOnce({ sound: ms1, status: {} })
      .mockResolvedValueOnce({ sound: ms2, status: {} });

    const seq = soundService.playSequence(['src1', 'src2'], [0, 0], 0.65);
    jest.runAllTimers();       // dispara os setTimeout(fn, 0) da sequência
    await flushMicrotasks();   // createAsync → setVolumeAsync → playAsync → setOnPlaybackStatusUpdate
    ms1._finish();
    ms2._finish();
    await flushMicrotasks();   // finaliza _play de cada nota
    await seq;

    expect(mockCreateAsync).toHaveBeenCalledTimes(2);
  });

  it('[T4-14] playSequence com uma nota resolve após _finish', async () => {
    const ms = makeMockSound();
    mockCreateAsync.mockResolvedValueOnce({ sound: ms, status: {} });

    const seq = soundService.playSequence(['src1'], [0], 0.65);
    jest.runAllTimers();
    await flushMicrotasks();
    ms._finish();
    await flushMicrotasks();
    await seq;

    expect(ms.playAsync).toHaveBeenCalledTimes(1);
    expect(ms.unloadAsync).toHaveBeenCalledTimes(1);
  });

  it('[T4-15] playSequence resolve quando todas as notas terminam (playAsync + unloadAsync x3)', async () => {
    const ms1 = makeMockSound();
    const ms2 = makeMockSound();
    const ms3 = makeMockSound();
    mockCreateAsync
      .mockResolvedValueOnce({ sound: ms1, status: {} })
      .mockResolvedValueOnce({ sound: ms2, status: {} })
      .mockResolvedValueOnce({ sound: ms3, status: {} });

    const seq = soundService.playSequence(['s1', 's2', 's3'], [0, 0, 0], 0.7);
    jest.runAllTimers();
    await flushMicrotasks();
    ms1._finish();
    ms2._finish();
    ms3._finish();
    await flushMicrotasks();
    await seq;

    expect(mockCreateAsync).toHaveBeenCalledTimes(3);
    expect(ms1.playAsync).toHaveBeenCalledTimes(1);
    expect(ms2.playAsync).toHaveBeenCalledTimes(1);
    expect(ms3.playAsync).toHaveBeenCalledTimes(1);
    expect(ms1.unloadAsync).toHaveBeenCalledTimes(1);
    expect(ms2.unloadAsync).toHaveBeenCalledTimes(1);
    expect(ms3.unloadAsync).toHaveBeenCalledTimes(1);
  });
});
