import * as Haptics from 'expo-haptics';
import { secureStorage } from '../config/secureStorage';
import type { FavoriteInstrument } from '../config/sounds';
import { EVENT_SOUNDS, getTaskCompleteSound, getNextTaskSound } from '../config/sounds';
import { soundService } from './soundService';

// ─── Tipos existentes ────────────────────────────────────────────────────────

export type VibrationIntensity = 'off' | 'light' | 'medium' | 'strong';
export type CelebrationStyle   = 'silent' | 'normal' | 'special';

/**
 * Tipo de feedback sonoro da criança:
 * - 'music'     → notas musicais de instrumentos (recomendado para TEA)
 * - 'vibration' → apenas vibração (sem som)
 * - 'silent'    → completamente silencioso
 */
export type SoundType = 'music' | 'vibration' | 'silent';

// ─── Interface principal ─────────────────────────────────────────────────────

export interface ChildFeedbackSettings {
  // Configurações existentes (vibração)
  vibrationIntensity: VibrationIntensity;
  celebrationStyle:   CelebrationStyle;

  // Configurações novas (áudio musical)
  soundType:           SoundType;
  musicVolume:         number;           // 0.0 – 1.0
  favoriteInstrument:  FavoriteInstrument;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: ChildFeedbackSettings = {
  vibrationIntensity:  'medium',
  celebrationStyle:    'special',
  soundType:           'music',
  musicVolume:         0.65,
  favoriteInstrument:  'piano',
};

// ─── Helpers internos ────────────────────────────────────────────────────────

function storageKey(childId: string) {
  return `feedback_settings_${childId}`;
}

function toHapticsStyle(intensity: VibrationIntensity): Haptics.ImpactFeedbackStyle {
  if (intensity === 'light')  return Haptics.ImpactFeedbackStyle.Light;
  if (intensity === 'strong') return Haptics.ImpactFeedbackStyle.Heavy;
  return Haptics.ImpactFeedbackStyle.Medium;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const feedbackService = {

  // ── Persistência ────────────────────────────────────────────────────────

  async getSettings(childId: string): Promise<ChildFeedbackSettings> {
    try {
      const raw = await secureStorage.getItem(storageKey(childId));
      // Spread com DEFAULT_SETTINGS garante backward-compat:
      // chaves antigas não têm soundType/musicVolume/favoriteInstrument,
      // mas o spread preenche com os defaults corretos.
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      // ignore parse/storage error
    }
    return { ...DEFAULT_SETTINGS };
  },

  async saveSettings(childId: string, settings: ChildFeedbackSettings): Promise<void> {
    await secureStorage.setItem(storageKey(childId), JSON.stringify(settings));
  },

  // ── Vibração ─────────────────────────────────────────────────────────────

  vibrateOnce(intensity: VibrationIntensity): void {
    if (intensity === 'off') return;
    Haptics.impactAsync(toHapticsStyle(intensity)).catch(() => {});
  },

  _patternTimers: [] as ReturnType<typeof setTimeout>[],

  vibratePattern(intensity: VibrationIntensity): void {
    if (intensity === 'off') return;
    // Cancel any in-flight pattern before starting a new one
    feedbackService._patternTimers.forEach(clearTimeout);
    feedbackService._patternTimers = [];
    const style = toHapticsStyle(intensity);
    Haptics.impactAsync(style).catch(() => {});
    feedbackService._patternTimers.push(setTimeout(() => Haptics.impactAsync(style).catch(() => {}), 300));
    feedbackService._patternTimers.push(setTimeout(() => Haptics.impactAsync(style).catch(() => {}), 600));
  },

  previewVibration(intensity: VibrationIntensity): void {
    feedbackService.vibrateOnce(intensity);
  },

  // ── Triggers de eventos ───────────────────────────────────────────────────

  /**
   * Criança completou uma tarefa individual.
   * - 'music'     → vibra + toca nota do instrumento favorito
   * - 'vibration' → vibra
   * - 'silent'    → sem feedback
   */
  async triggerTaskComplete(childId: string): Promise<void> {
    const s = await feedbackService.getSettings(childId);
    if (s.soundType === 'silent') return;
    feedbackService.vibrateOnce(s.vibrationIntensity);
    if (s.soundType === 'music') {
      await soundService.playNote(getTaskCompleteSound(s.favoriteInstrument), s.musicVolume);
    }
  },

  /**
   * App avança para a próxima tarefa.
   * - 'music'     → toca nota de transição (sem vibração — evita over-stimulation)
   * - outros      → sem feedback
   */
  async triggerNextTask(childId: string): Promise<void> {
    const s = await feedbackService.getSettings(childId);
    if (s.soundType !== 'music') return;
    await soundService.playNote(getNextTaskSound(s.favoriteInstrument), s.musicVolume);
  },

  /**
   * Criança completou a rotina inteira.
   * - 'special' + 'music'  → vibratePattern + tríade C5→E5→G5
   * - 'normal'  + 'music'  → vibrateOnce + nota do instrumento
   * - 'silent'  ou 'silent soundType' → sem feedback
   */
  async triggerRoutineComplete(childId: string): Promise<void> {
    const s = await feedbackService.getSettings(childId);
    if (s.celebrationStyle === 'silent' || s.soundType === 'silent') return;
    if (s.celebrationStyle === 'special') {
      feedbackService.vibratePattern(s.vibrationIntensity);
      if (s.soundType === 'music') {
        const { files, delays } = EVENT_SOUNDS.routineComplete;
        await soundService.playSequence([...files], [...delays], s.musicVolume);
      }
    } else {
      feedbackService.vibrateOnce(s.vibrationIntensity);
      if (s.soundType === 'music') {
        await soundService.playNote(getTaskCompleteSound(s.favoriteInstrument), s.musicVolume);
      }
    }
  },

  /**
   * Criança sinalizou que não consegue fazer a tarefa.
   * - 'music'     → vibra + toca nota de aviso (A4 flauta)
   * - 'vibration' → vibra
   * - 'silent'    → sem feedback
   */
  async triggerCantDo(childId: string): Promise<void> {
    const s = await feedbackService.getSettings(childId);
    if (s.soundType === 'silent') return;
    feedbackService.vibrateOnce(s.vibrationIntensity);
    if (s.soundType === 'music') {
      await soundService.playNote(EVENT_SOUNDS.cantDo.files[0], s.musicVolume);
    }
  },

  /**
   * App entra em modo calmo (criança sobrecarregada).
   * - 'music' → toca nota grave e suave (F3 cello) — sem vibração para não adicionar estímulos
   * - outros  → sem feedback
   */
  async triggerCalmMode(childId: string): Promise<void> {
    const s = await feedbackService.getSettings(childId);
    if (s.soundType !== 'music') return;
    await soundService.playNote(EVENT_SOUNDS.calmMode.files[0], s.musicVolume);
  },

  /**
   * Rotina inicia.
   * - 'music' → toca nota de boas-vindas (G4 kalimba) — sem vibração (não é alerta)
   * - outros  → sem feedback
   */
  async triggerRoutineStart(childId: string): Promise<void> {
    const s = await feedbackService.getSettings(childId);
    if (s.soundType !== 'music') return;
    await soundService.playNote(EVENT_SOUNDS.routineStart.files[0], s.musicVolume);
  },
};
