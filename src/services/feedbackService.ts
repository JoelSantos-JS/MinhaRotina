import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type VibrationIntensity = 'off' | 'light' | 'medium' | 'strong';
export type CelebrationStyle = 'silent' | 'normal' | 'special';

export interface ChildFeedbackSettings {
  vibrationIntensity: VibrationIntensity;
  celebrationStyle: CelebrationStyle;
}

const DEFAULT_SETTINGS: ChildFeedbackSettings = {
  vibrationIntensity: 'medium',
  celebrationStyle: 'special',
};

function storageKey(childId: string) {
  return `feedback_settings_${childId}`;
}

export const feedbackService = {
  async getSettings(childId: string): Promise<ChildFeedbackSettings> {
    try {
      const raw = await AsyncStorage.getItem(storageKey(childId));
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return { ...DEFAULT_SETTINGS };
  },

  async saveSettings(childId: string, settings: ChildFeedbackSettings): Promise<void> {
    await AsyncStorage.setItem(storageKey(childId), JSON.stringify(settings));
  },

  async triggerTaskComplete(childId: string): Promise<void> {
    const settings = await feedbackService.getSettings(childId);
    feedbackService.vibrateOnce(settings.vibrationIntensity);
  },

  async triggerRoutineComplete(childId: string): Promise<void> {
    const settings = await feedbackService.getSettings(childId);
    if (settings.celebrationStyle === 'silent') return;
    if (settings.celebrationStyle === 'special') {
      feedbackService.vibratePattern(settings.vibrationIntensity);
    } else {
      feedbackService.vibrateOnce(settings.vibrationIntensity);
    }
  },

  vibrateOnce(intensity: VibrationIntensity): void {
    if (intensity === 'off') return;
    const style =
      intensity === 'light'
        ? Haptics.ImpactFeedbackStyle.Light
        : intensity === 'strong'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Medium;
    Haptics.impactAsync(style).catch(() => {});
  },

  vibratePattern(intensity: VibrationIntensity): void {
    if (intensity === 'off') return;
    const style =
      intensity === 'light'
        ? Haptics.ImpactFeedbackStyle.Light
        : intensity === 'strong'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Medium;
    // Three pulses for celebration
    Haptics.impactAsync(style).catch(() => {});
    setTimeout(() => Haptics.impactAsync(style).catch(() => {}), 300);
    setTimeout(() => Haptics.impactAsync(style).catch(() => {}), 600);
  },

  previewVibration(intensity: VibrationIntensity): void {
    feedbackService.vibrateOnce(intensity);
  },
};
