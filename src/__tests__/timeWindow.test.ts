import { getCurrentDayPeriod, isRoutineAvailableNow } from '../utils/timeWindow';

const makeDateAtHour = (hour: number, minute = 0) =>
  new Date(2026, 1, 27, hour, minute, 0, 0);

describe('timeWindow', () => {
  describe('getCurrentDayPeriod', () => {
    it('returns night before 05:00', () => {
      expect(getCurrentDayPeriod(makeDateAtHour(4, 59))).toBe('night');
    });

    it('returns morning from 05:00', () => {
      expect(getCurrentDayPeriod(makeDateAtHour(5, 0))).toBe('morning');
    });

    it('returns morning until 11:59', () => {
      expect(getCurrentDayPeriod(makeDateAtHour(11, 59))).toBe('morning');
    });

    it('returns afternoon from 12:00', () => {
      expect(getCurrentDayPeriod(makeDateAtHour(12, 0))).toBe('afternoon');
    });

    it('returns afternoon until 17:59', () => {
      expect(getCurrentDayPeriod(makeDateAtHour(17, 59))).toBe('afternoon');
    });

    it('returns night from 18:00', () => {
      expect(getCurrentDayPeriod(makeDateAtHour(18, 0))).toBe('night');
    });
  });

  describe('isRoutineAvailableNow', () => {
    it('allows routine for current period', () => {
      expect(isRoutineAvailableNow('morning', makeDateAtHour(9, 0))).toBe(true);
    });

    it('blocks routine outside current period', () => {
      expect(isRoutineAvailableNow('night', makeDateAtHour(9, 0))).toBe(false);
    });

    it('always allows custom routines', () => {
      expect(isRoutineAvailableNow('custom', makeDateAtHour(9, 0))).toBe(true);
      expect(isRoutineAvailableNow('custom', makeDateAtHour(21, 0))).toBe(true);
    });
  });
});
