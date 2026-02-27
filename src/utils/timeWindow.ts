import type { Routine } from '../types/models';

export type DayPeriod = Exclude<Routine['type'], 'custom'>;

const MORNING_START_HOUR = 5;
const AFTERNOON_START_HOUR = 12;
const NIGHT_START_HOUR = 18;

export function getCurrentDayPeriod(date = new Date()): DayPeriod {
  const hour = date.getHours();

  if (hour >= MORNING_START_HOUR && hour < AFTERNOON_START_HOUR) {
    return 'morning';
  }

  if (hour >= AFTERNOON_START_HOUR && hour < NIGHT_START_HOUR) {
    return 'afternoon';
  }

  return 'night';
}

export function isRoutineAvailableNow(
  routineType: Routine['type'],
  date = new Date()
): boolean {
  if (routineType === 'custom') return true;
  return routineType === getCurrentDayPeriod(date);
}
