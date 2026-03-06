import { create } from 'zustand';
import {
  parentSettingsService,
  DEFAULT_PARENT_SETTINGS,
  type ParentAdvancedSettings,
} from '../services/parentSettingsService';

interface ParentSettingsState {
  settings: ParentAdvancedSettings;
  isLoaded: boolean;
  loadSettings: (parentId: string) => Promise<void>;
  updateSettings: (parentId: string, patch: Partial<ParentAdvancedSettings>) => Promise<void>;
  reset: () => void;
}

export const useParentSettingsStore = create<ParentSettingsState>((set, get) => ({
  settings: { ...DEFAULT_PARENT_SETTINGS },
  isLoaded: false,

  loadSettings: async (parentId) => {
    const settings = await parentSettingsService.getSettings(parentId);
    set({ settings, isLoaded: true });
  },

  updateSettings: async (parentId, patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    await parentSettingsService.saveSettings(parentId, next);
  },

  reset: () => set({ settings: { ...DEFAULT_PARENT_SETTINGS }, isLoaded: false }),
}));
