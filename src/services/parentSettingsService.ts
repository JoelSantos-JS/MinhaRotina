import { secureStorage } from '../config/secureStorage';

const KEY = (parentId: string) => `parent_advanced_settings_${parentId}`;

export interface ParentAdvancedSettings {
  educationalAlertsEnabled: boolean;
  autoSensoryDetectionEnabled: boolean;
  miniCelebrationsEnabled: boolean;
  helpButtonEnabled: boolean;
}

export const DEFAULT_PARENT_SETTINGS: ParentAdvancedSettings = {
  educationalAlertsEnabled: true,
  autoSensoryDetectionEnabled: true,
  miniCelebrationsEnabled: true,
  helpButtonEnabled: true,
};

export const parentSettingsService = {
  async getSettings(parentId: string): Promise<ParentAdvancedSettings> {
    try {
      const raw = await secureStorage.getItem(KEY(parentId));
      if (raw) return { ...DEFAULT_PARENT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return { ...DEFAULT_PARENT_SETTINGS };
  },

  async saveSettings(parentId: string, settings: ParentAdvancedSettings): Promise<void> {
    await secureStorage.setItem(KEY(parentId), JSON.stringify(settings));
  },
};
