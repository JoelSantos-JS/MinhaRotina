import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, type AppTheme, type ThemeId } from '../theme/themes';

interface ThemeState {
  activeTheme: AppTheme;
  setTheme: (themeId: ThemeId) => void;
  loadThemeForChild: (childId: string) => Promise<void>;
  saveThemeForChild: (childId: string, themeId: ThemeId) => Promise<void>;
  resetToDefault: () => void;
}

function themeKey(childId: string) {
  return `child_theme_${childId}`;
}

export const useThemeStore = create<ThemeState>((set) => ({
  activeTheme: THEMES.bluey,

  setTheme: (themeId) => {
    set({ activeTheme: THEMES[themeId] ?? THEMES.bluey });
  },

  loadThemeForChild: async (childId) => {
    try {
      const saved = await AsyncStorage.getItem(themeKey(childId));
      if (saved && THEMES[saved as ThemeId]) {
        set({ activeTheme: THEMES[saved as ThemeId] });
      } else {
        set({ activeTheme: THEMES.bluey });
      }
    } catch {
      set({ activeTheme: THEMES.bluey });
    }
  },

  saveThemeForChild: async (childId, themeId) => {
    await AsyncStorage.setItem(themeKey(childId), themeId);
    set({ activeTheme: THEMES[themeId] ?? THEMES.bluey });
  },

  resetToDefault: () => {
    set({ activeTheme: THEMES.bluey });
  },
}));
