/**
 * TASK 18 — Adaptações sensoriais e suporte visual em CurrentTaskScreen
 *
 * Grupo A — visual_support_type: regras de exibição de conteúdo
 * [T18-01] 'images_text'  → showSteps = true  quando task tem steps
 * [T18-02] 'reduced_text' → showSteps = false (steps ocultos, mostra descrição)
 * [T18-03] 'images_only'  → showSteps = false
 * [T18-04] 'images_only'  → showDescription = false
 * [T18-05] 'reduced_text' → showDescription = true quando steps ausentes
 * [T18-06] 'images_only'  → showVideo = false
 * [T18-07] 'reduced_text' → showVideo = true
 * [T18-08] null/undefined visual_support_type → comporta-se como 'images_text'
 *
 * Grupo B — sensory_profile: alerta tátil
 * [T18-09] tactile 'hyper-reactive' + has_sensory_issues=true  → showWarning = true
 * [T18-10] tactile 'typical'        + has_sensory_issues=true  → showWarning = false
 * [T18-11] tactile 'hyper-reactive' + has_sensory_issues=false → showWarning = false
 * [T18-12] sensory_profile ausente   + has_sensory_issues=true  → showWarning = false
 *
 * Grupo C — sensory_profile: mini-celebração para visual hyper-reactive
 * [T18-13] visual 'typical'       → isVisualSensitive = false (partículas habilitadas)
 * [T18-14] visual 'hyper-reactive' → isVisualSensitive = true  (partículas desativadas)
 * [T18-15] visual 'hypo-reactive'  → isVisualSensitive = false
 *
 * Grupo D — feedbackService: integridade das rotas de som e vibração
 * [T18-16] soundType 'silent'    → triggerTaskComplete não chama playNote
 * [T18-17] soundType 'vibration' → triggerTaskComplete não chama playNote
 * [T18-18] soundType 'music'     → triggerTaskComplete chama playNote
 * [T18-19] vibrationIntensity 'off' → vibrateOnce não chama impactAsync
 * [T18-20] celebrationStyle 'silent' → triggerRoutineComplete não chama playSequence
 */

import type { VisualSupportType, SensoryProfile } from '../types/models';
import type { Task } from '../types/models';

// ─── Helpers de lógica pura (extraídos da lógica do componente) ───────────────

type TaskStep = { id: string; text: string };

interface TaskLike {
  steps?: TaskStep[] | null;
  description?: string | null;
  video_url?: string | null;
  has_sensory_issues?: boolean;
}

/**
 * Replica a lógica de exibição de passos do CurrentTaskScreen.
 * visualSupport === 'images_text' AND task tem steps → true
 */
function shouldShowSteps(visualSupport: VisualSupportType, task: TaskLike): boolean {
  return (
    visualSupport === 'images_text' &&
    Array.isArray(task.steps) &&
    task.steps.length > 0
  );
}

/**
 * Replica a lógica de exibição de descrição:
 * (não é images_only) AND (sem steps visíveis ou é reduced_text) AND tem description
 */
function shouldShowDescription(visualSupport: VisualSupportType, task: TaskLike): boolean {
  if (visualSupport === 'images_only') return false;
  const stepsVisible = shouldShowSteps(visualSupport, task);
  return !stepsVisible && !!task.description;
}

/** Botão de vídeo oculto apenas para images_only */
function shouldShowVideo(visualSupport: VisualSupportType, task: TaskLike): boolean {
  return visualSupport !== 'images_only' && !!task.video_url;
}

/** Alerta sensorial tátil */
function shouldShowSensoryWarning(
  profile: SensoryProfile | null | undefined,
  task: TaskLike
): boolean {
  return profile?.tactile === 'hyper-reactive' && !!task.has_sensory_issues;
}

/** Mini-celebração desativada para visual hyper-reactive */
function isVisualSensitive(profile: SensoryProfile | null | undefined): boolean {
  return profile?.visual === 'hyper-reactive';
}

/** Fallback: null/undefined → 'images_text' */
function resolveVisualSupport(raw: VisualSupportType | null | undefined): VisualSupportType {
  return raw ?? 'images_text';
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TASK_WITH_STEPS: TaskLike = {
  steps: [{ id: '1', text: 'Passo 1' }, { id: '2', text: 'Passo 2' }],
  description: 'Descrição da tarefa',
  video_url: 'https://youtube.com/watch?v=abc',
  has_sensory_issues: true,
};

const TASK_NO_STEPS: TaskLike = {
  steps: [],
  description: 'Só descrição',
  video_url: 'https://youtube.com/watch?v=xyz',
  has_sensory_issues: false,
};

const TASK_SENSORY: TaskLike = {
  steps: null,
  description: null,
  video_url: null,
  has_sensory_issues: true,
};

// ─── Grupo A: visual_support_type ────────────────────────────────────────────

describe('TASK 18 — Adaptações sensoriais e suporte visual', () => {

  describe('Grupo A — visual_support_type: regras de exibição', () => {

    it('[T18-01] images_text + steps existem → showSteps = true', () => {
      expect(shouldShowSteps('images_text', TASK_WITH_STEPS)).toBe(true);
    });

    it('[T18-02] reduced_text + steps existem → showSteps = false', () => {
      expect(shouldShowSteps('reduced_text', TASK_WITH_STEPS)).toBe(false);
    });

    it('[T18-03] images_only + steps existem → showSteps = false', () => {
      expect(shouldShowSteps('images_only', TASK_WITH_STEPS)).toBe(false);
    });

    it('[T18-04] images_only → showDescription = false mesmo com description', () => {
      expect(shouldShowDescription('images_only', TASK_WITH_STEPS)).toBe(false);
    });

    it('[T18-05] reduced_text + sem steps → showDescription = true quando tem description', () => {
      expect(shouldShowDescription('reduced_text', TASK_NO_STEPS)).toBe(true);
    });

    it('[T18-06] images_only → showVideo = false mesmo com video_url', () => {
      expect(shouldShowVideo('images_only', TASK_WITH_STEPS)).toBe(false);
    });

    it('[T18-07] reduced_text → showVideo = true quando tem video_url', () => {
      expect(shouldShowVideo('reduced_text', TASK_WITH_STEPS)).toBe(true);
    });

    it('[T18-08] visual_support_type null → comporta-se como images_text', () => {
      const resolved = resolveVisualSupport(null);
      expect(resolved).toBe('images_text');
      expect(shouldShowSteps(resolved, TASK_WITH_STEPS)).toBe(true);
    });

  });

  // ─── Grupo B: alerta sensorial tátil ───────────────────────────────────────

  describe('Grupo B — alerta sensorial tátil', () => {

    it('[T18-09] tactile hyper-reactive + has_sensory_issues=true → showWarning = true', () => {
      const profile: SensoryProfile = { auditory: 'typical', tactile: 'hyper-reactive', visual: 'typical' };
      expect(shouldShowSensoryWarning(profile, TASK_SENSORY)).toBe(true);
    });

    it('[T18-10] tactile typical + has_sensory_issues=true → showWarning = false', () => {
      const profile: SensoryProfile = { auditory: 'typical', tactile: 'typical', visual: 'typical' };
      expect(shouldShowSensoryWarning(profile, TASK_SENSORY)).toBe(false);
    });

    it('[T18-11] tactile hyper-reactive + has_sensory_issues=false → showWarning = false', () => {
      const profile: SensoryProfile = { auditory: 'typical', tactile: 'hyper-reactive', visual: 'typical' };
      expect(shouldShowSensoryWarning(profile, TASK_NO_STEPS)).toBe(false);
    });

    it('[T18-12] sensory_profile ausente + has_sensory_issues=true → showWarning = false', () => {
      expect(shouldShowSensoryWarning(null, TASK_SENSORY)).toBe(false);
      expect(shouldShowSensoryWarning(undefined, TASK_SENSORY)).toBe(false);
    });

  });

  // ─── Grupo C: mini-celebração para visual hyper-reactive ─────────────────

  describe('Grupo C — mini-celebração: visual hyper-reactive', () => {

    it('[T18-13] visual typical → isVisualSensitive = false (partículas habilitadas)', () => {
      const profile: SensoryProfile = { auditory: 'typical', tactile: 'typical', visual: 'typical' };
      expect(isVisualSensitive(profile)).toBe(false);
    });

    it('[T18-14] visual hyper-reactive → isVisualSensitive = true (partículas desativadas)', () => {
      const profile: SensoryProfile = { auditory: 'typical', tactile: 'typical', visual: 'hyper-reactive' };
      expect(isVisualSensitive(profile)).toBe(true);
    });

    it('[T18-15] visual hypo-reactive → isVisualSensitive = false', () => {
      const profile: SensoryProfile = { auditory: 'hyper-reactive', tactile: 'hypo-reactive', visual: 'hypo-reactive' };
      expect(isVisualSensitive(profile)).toBe(false);
    });

  });

  // ─── Grupo D: feedbackService — rotas de som e vibração ─────────────────

  describe('Grupo D — feedbackService: rotas de som e vibração', () => {

    const mockPlayNote = jest.fn().mockResolvedValue(undefined);
    const mockPlaySequence = jest.fn().mockResolvedValue(undefined);
    const mockImpact = jest.fn().mockResolvedValue(undefined);

    jest.mock('../services/soundService', () => ({
      soundService: {
        playNote: (...args: unknown[]) => mockPlayNote(...args),
        playSequence: (...args: unknown[]) => mockPlaySequence(...args),
      },
    }));

    jest.mock('expo-haptics', () => ({
      ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
      impactAsync: (...args: unknown[]) => mockImpact(...args),
    }));

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('[T18-16] soundType "silent" → triggerTaskComplete não toca som nem vibra', async () => {
      const { feedbackService } = require('../services/feedbackService');
      jest.spyOn(feedbackService, 'getSettings').mockResolvedValue({
        soundType: 'silent',
        vibrationIntensity: 'medium',
        celebrationStyle: 'normal',
        musicVolume: 0.65,
        favoriteInstrument: 'piano',
      });
      await feedbackService.triggerTaskComplete('child-1');
      expect(mockPlayNote).not.toHaveBeenCalled();
      expect(mockImpact).not.toHaveBeenCalled();
    });

    it('[T18-17] soundType "vibration" → triggerTaskComplete vibra mas não toca nota', async () => {
      const { feedbackService } = require('../services/feedbackService');
      jest.spyOn(feedbackService, 'getSettings').mockResolvedValue({
        soundType: 'vibration',
        vibrationIntensity: 'medium',
        celebrationStyle: 'normal',
        musicVolume: 0.65,
        favoriteInstrument: 'piano',
      });
      await feedbackService.triggerTaskComplete('child-2');
      expect(mockPlayNote).not.toHaveBeenCalled();
      expect(mockImpact).toHaveBeenCalled();
    });

    it('[T18-18] soundType "music" → triggerTaskComplete chama playNote', async () => {
      const { feedbackService } = require('../services/feedbackService');
      jest.spyOn(feedbackService, 'getSettings').mockResolvedValue({
        soundType: 'music',
        vibrationIntensity: 'medium',
        celebrationStyle: 'normal',
        musicVolume: 0.65,
        favoriteInstrument: 'piano',
      });
      await feedbackService.triggerTaskComplete('child-3');
      expect(mockPlayNote).toHaveBeenCalled();
    });

    it('[T18-19] vibrationIntensity "off" → vibrateOnce não chama impactAsync', () => {
      const { feedbackService } = require('../services/feedbackService');
      feedbackService.vibrateOnce('off');
      expect(mockImpact).not.toHaveBeenCalled();
    });

    it('[T18-20] celebrationStyle "silent" → triggerRoutineComplete não chama playSequence', async () => {
      const { feedbackService } = require('../services/feedbackService');
      jest.spyOn(feedbackService, 'getSettings').mockResolvedValue({
        soundType: 'music',
        vibrationIntensity: 'medium',
        celebrationStyle: 'silent',
        musicVolume: 0.65,
        favoriteInstrument: 'piano',
      });
      await feedbackService.triggerRoutineComplete('child-4');
      expect(mockPlaySequence).not.toHaveBeenCalled();
      expect(mockPlayNote).not.toHaveBeenCalled();
    });

  });

});
