import AsyncStorage from '@react-native-async-storage/async-storage';

const DAYS_KEY = (routineId: string) => `routine_days_${routineId}`;

export const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export const routineCalendarService = {
  async getDays(routineId: string): Promise<number[]> {
    try {
      const raw = await AsyncStorage.getItem(DAYS_KEY(routineId));
      if (raw) return JSON.parse(raw) as number[];
    } catch {}
    return [];
  },

  async setDays(routineId: string, days: number[]): Promise<void> {
    await AsyncStorage.setItem(DAYS_KEY(routineId), JSON.stringify(days));
  },

  async clearDays(routineId: string): Promise<void> {
    await AsyncStorage.removeItem(DAYS_KEY(routineId));
  },

  async isAvailableToday(routineId: string, date?: Date): Promise<boolean> {
    const days = await routineCalendarService.getDays(routineId);
    if (days.length === 0) return true;
    const today = (date ?? new Date()).getDay();
    return days.includes(today);
  },

  async getDaysForRoutines(routineIds: string[]): Promise<Record<string, number[]>> {
    if (routineIds.length === 0) return {};
    const entries = await Promise.all(
      routineIds.map(async (id) => [id, await routineCalendarService.getDays(id)] as const)
    );
    return Object.fromEntries(entries);
  },
};
