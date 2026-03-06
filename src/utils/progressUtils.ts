import type { TaskProgress } from '../types/models';

export function groupByDate(records: TaskProgress[]): Record<string, TaskProgress[]> {
  const groups: Record<string, TaskProgress[]> = {};
  for (const r of records) {
    const date = r.completed_at.split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(r);
  }
  return groups;
}

export function buildDateRange(days: number): string[] {
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}

export function calcStreak(grouped: Record<string, TaskProgress[]>): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (grouped[key]?.length) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function calcCompletionRate(activeDays: number, selectedDays: number): number {
  return Math.min(Math.round((activeDays / selectedDays) * 100), 100);
}
