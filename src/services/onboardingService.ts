import { secureStorage } from '../config/secureStorage';

const ONBOARDING_KEY = 'parent_onboarding_completed';

export const onboardingService = {
  async markAsCompleted(parentId: string): Promise<void> {
    await secureStorage.setItem(
      ONBOARDING_KEY,
      JSON.stringify({ parentId, completedAt: new Date().toISOString() })
    );
  },

  async hasSeenOnboarding(): Promise<boolean> {
    try {
      const data = await secureStorage.getItem(ONBOARDING_KEY);
      return data !== null;
    } catch {
      return false;
    }
  },

  async clearOnboarding(): Promise<void> {
    await secureStorage.removeItem(ONBOARDING_KEY);
  },
};
