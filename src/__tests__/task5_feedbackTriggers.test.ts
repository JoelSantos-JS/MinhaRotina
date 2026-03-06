/**
 * TASK 5 — Bateria de testes: triggers musicais do feedbackService
 *
 * [T5-01] triggerTaskComplete com soundType 'music' chama soundService.playNote
 * [T5-02] triggerTaskComplete com soundType 'music' também chama vibrateOnce
 * [T5-03] triggerTaskComplete com soundType 'vibration' chama vibrateOnce mas NÃO playNote
 * [T5-04] triggerTaskComplete com soundType 'silent' NÃO chama playNote nem vibrateOnce
 * [T5-05] triggerTaskComplete passa musicVolume correto para playNote
 * [T5-06] triggerTaskComplete com favoriteInstrument 'violin' usa getTaskCompleteSound('violin')
 * [T5-07] triggerNextTask com soundType 'music' chama soundService.playNote
 * [T5-08] triggerNextTask com soundType 'vibration' NÃO chama soundService
 * [T5-09] triggerNextTask com soundType 'silent' NÃO chama soundService
 * [T5-10] triggerRoutineComplete com 'special'+'music' chama playSequence com 3 notas
 * [T5-11] triggerRoutineComplete com 'normal'+'music' chama playNote (não playSequence)
 * [T5-12] triggerRoutineComplete com celebrationStyle 'silent' NÃO chama soundService
 * [T5-13] triggerRoutineComplete com soundType 'silent' NÃO chama soundService
 * [T5-14] triggerCantDo com soundType 'music' chama soundService.playNote
 * [T5-15] triggerCantDo com soundType 'silent' NÃO chama soundService nem vibrateOnce
 * [T5-16] triggerCalmMode com soundType 'music' chama soundService.playNote
 * [T5-17] triggerCalmMode com soundType 'vibration' NÃO chama soundService
 * [T5-18] triggerRoutineStart com soundType 'music' chama soundService.playNote
 * [T5-19] triggerRoutineStart com soundType 'vibration' NÃO chama soundService
 */

import * as SecureStore from 'expo-secure-store';
import { feedbackService, DEFAULT_SETTINGS, type ChildFeedbackSettings } from '../services/feedbackService';
import { soundService } from '../services/soundService';
import * as soundsModule from '../config/sounds';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../services/soundService', () => ({
  soundService: {
    playNote:     jest.fn().mockResolvedValue(undefined),
    playSequence: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockSecure   = SecureStore as jest.Mocked<typeof SecureStore>;
const mockPlayNote     = soundService.playNote     as jest.Mock;
const mockPlaySequence = soundService.playSequence as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Configura o SecureStore para retornar as settings informadas. */
function mockSettings(partial: Partial<ChildFeedbackSettings>) {
  const s: ChildFeedbackSettings = { ...DEFAULT_SETTINGS, ...partial };
  mockSecure.getItemAsync.mockResolvedValue(JSON.stringify(s));
  return s;
}

describe('TASK 5 — feedbackService: triggers musicais', () => {
  let vibrateOnceSpy:   jest.SpyInstance;
  let vibratePatternSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSecure.getItemAsync.mockResolvedValue(null); // default: sem dados salvos
    vibrateOnceSpy    = jest.spyOn(feedbackService, 'vibrateOnce').mockImplementation(() => {});
    vibratePatternSpy = jest.spyOn(feedbackService, 'vibratePattern').mockImplementation(() => {});
  });

  afterEach(() => {
    vibrateOnceSpy.mockRestore();
    vibratePatternSpy.mockRestore();
  });

  // ── triggerTaskComplete ──────────────────────────────────────────────────

  it('[T5-01] triggerTaskComplete com soundType "music" chama soundService.playNote', async () => {
    mockSettings({ soundType: 'music' });
    await feedbackService.triggerTaskComplete('child-1');
    expect(mockPlayNote).toHaveBeenCalledTimes(1);
  });

  it('[T5-02] triggerTaskComplete com soundType "music" também chama vibrateOnce', async () => {
    mockSettings({ soundType: 'music', vibrationIntensity: 'medium' });
    await feedbackService.triggerTaskComplete('child-1');
    expect(vibrateOnceSpy).toHaveBeenCalledTimes(1);
  });

  it('[T5-03] triggerTaskComplete com soundType "vibration" chama vibrateOnce mas NÃO playNote', async () => {
    mockSettings({ soundType: 'vibration' });
    await feedbackService.triggerTaskComplete('child-1');
    expect(vibrateOnceSpy).toHaveBeenCalledTimes(1);
    expect(mockPlayNote).not.toHaveBeenCalled();
  });

  it('[T5-04] triggerTaskComplete com soundType "silent" NÃO chama playNote nem vibrateOnce', async () => {
    mockSettings({ soundType: 'silent' });
    await feedbackService.triggerTaskComplete('child-1');
    expect(mockPlayNote).not.toHaveBeenCalled();
    expect(vibrateOnceSpy).not.toHaveBeenCalled();
  });

  it('[T5-05] triggerTaskComplete passa musicVolume correto para playNote', async () => {
    mockSettings({ soundType: 'music', musicVolume: 0.4 });
    await feedbackService.triggerTaskComplete('child-1');
    expect(mockPlayNote).toHaveBeenCalledWith(expect.anything(), 0.4);
  });

  it('[T5-06] triggerTaskComplete com favoriteInstrument "violin" chama getTaskCompleteSound com "violin"', async () => {
    mockSettings({ soundType: 'music', favoriteInstrument: 'violin' });
    const spy = jest.spyOn(soundsModule, 'getTaskCompleteSound');
    await feedbackService.triggerTaskComplete('child-1');
    expect(spy).toHaveBeenCalledWith('violin');
    spy.mockRestore();
  });

  // ── triggerNextTask ──────────────────────────────────────────────────────

  it('[T5-07] triggerNextTask com soundType "music" chama soundService.playNote', async () => {
    mockSettings({ soundType: 'music' });
    await feedbackService.triggerNextTask('child-1');
    expect(mockPlayNote).toHaveBeenCalledTimes(1);
  });

  it('[T5-08] triggerNextTask com soundType "vibration" NÃO chama soundService', async () => {
    mockSettings({ soundType: 'vibration' });
    await feedbackService.triggerNextTask('child-1');
    expect(mockPlayNote).not.toHaveBeenCalled();
    expect(mockPlaySequence).not.toHaveBeenCalled();
  });

  it('[T5-09] triggerNextTask com soundType "silent" NÃO chama soundService', async () => {
    mockSettings({ soundType: 'silent' });
    await feedbackService.triggerNextTask('child-1');
    expect(mockPlayNote).not.toHaveBeenCalled();
  });

  // ── triggerRoutineComplete ────────────────────────────────────────────────

  it('[T5-10] triggerRoutineComplete "special"+"music" chama playSequence com 3 notas', async () => {
    mockSettings({ soundType: 'music', celebrationStyle: 'special', musicVolume: 0.7 });
    await feedbackService.triggerRoutineComplete('child-1');
    expect(mockPlaySequence).toHaveBeenCalledTimes(1);
    const [sources, delays, volume] = mockPlaySequence.mock.calls[0];
    expect(sources).toHaveLength(3);        // C5, E5, G5
    expect(delays).toHaveLength(3);
    expect(delays[1]).toBe(420);            // 420ms entre notas
    expect(delays[2]).toBe(840);
    expect(volume).toBe(0.7);
  });

  it('[T5-11] triggerRoutineComplete "normal"+"music" chama playNote (não playSequence)', async () => {
    mockSettings({ soundType: 'music', celebrationStyle: 'normal' });
    await feedbackService.triggerRoutineComplete('child-1');
    expect(mockPlayNote).toHaveBeenCalledTimes(1);
    expect(mockPlaySequence).not.toHaveBeenCalled();
  });

  it('[T5-12] triggerRoutineComplete com celebrationStyle "silent" NÃO chama soundService', async () => {
    mockSettings({ soundType: 'music', celebrationStyle: 'silent' });
    await feedbackService.triggerRoutineComplete('child-1');
    expect(mockPlayNote).not.toHaveBeenCalled();
    expect(mockPlaySequence).not.toHaveBeenCalled();
  });

  it('[T5-13] triggerRoutineComplete com soundType "silent" NÃO chama soundService', async () => {
    mockSettings({ soundType: 'silent', celebrationStyle: 'special' });
    await feedbackService.triggerRoutineComplete('child-1');
    expect(mockPlayNote).not.toHaveBeenCalled();
    expect(mockPlaySequence).not.toHaveBeenCalled();
  });

  // ── triggerCantDo ────────────────────────────────────────────────────────

  it('[T5-14] triggerCantDo com soundType "music" chama soundService.playNote', async () => {
    mockSettings({ soundType: 'music', musicVolume: 0.5 });
    await feedbackService.triggerCantDo('child-1');
    expect(mockPlayNote).toHaveBeenCalledTimes(1);
    expect(mockPlayNote).toHaveBeenCalledWith(expect.anything(), 0.5);
  });

  it('[T5-15] triggerCantDo com soundType "silent" NÃO chama soundService nem vibrateOnce', async () => {
    mockSettings({ soundType: 'silent' });
    await feedbackService.triggerCantDo('child-1');
    expect(mockPlayNote).not.toHaveBeenCalled();
    expect(vibrateOnceSpy).not.toHaveBeenCalled();
  });

  // ── triggerCalmMode ──────────────────────────────────────────────────────

  it('[T5-16] triggerCalmMode com soundType "music" chama soundService.playNote', async () => {
    mockSettings({ soundType: 'music', musicVolume: 0.6 });
    await feedbackService.triggerCalmMode('child-1');
    expect(mockPlayNote).toHaveBeenCalledTimes(1);
    expect(mockPlayNote).toHaveBeenCalledWith(expect.anything(), 0.6);
  });

  it('[T5-17] triggerCalmMode com soundType "vibration" NÃO chama soundService', async () => {
    mockSettings({ soundType: 'vibration' });
    await feedbackService.triggerCalmMode('child-1');
    expect(mockPlayNote).not.toHaveBeenCalled();
  });

  // ── triggerRoutineStart ───────────────────────────────────────────────────

  it('[T5-18] triggerRoutineStart com soundType "music" chama soundService.playNote', async () => {
    mockSettings({ soundType: 'music', musicVolume: 0.65 });
    await feedbackService.triggerRoutineStart('child-1');
    expect(mockPlayNote).toHaveBeenCalledTimes(1);
    expect(mockPlayNote).toHaveBeenCalledWith(expect.anything(), 0.65);
  });

  it('[T5-19] triggerRoutineStart com soundType "vibration" NÃO chama soundService', async () => {
    mockSettings({ soundType: 'vibration' });
    await feedbackService.triggerRoutineStart('child-1');
    expect(mockPlayNote).not.toHaveBeenCalled();
  });
});
