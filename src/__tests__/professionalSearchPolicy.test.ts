import {
  buildProfessionalSearchCacheKey,
  evaluateSearchRateLimit,
} from '../utils/professionalSearchPolicy';

describe('professionalSearchPolicy', () => {
  describe('buildProfessionalSearchCacheKey', () => {
    it('builds stable key regardless of category order', () => {
      const keyA = buildProfessionalSearchCacheKey({
        categoryIds: ['fono', 'psicologo', 'to'],
        locationLabel: 'Sao Paulo, SP',
        radiusMeters: 15000,
      });

      const keyB = buildProfessionalSearchCacheKey({
        categoryIds: ['to', 'fono', 'psicologo'],
        locationLabel: ' sao paulo, sp ',
        radiusMeters: 15000,
      });

      expect(keyA).toBe(keyB);
    });

    it('rounds coordinates to avoid key explosion', () => {
      const keyA = buildProfessionalSearchCacheKey({
        categoryIds: ['fono'],
        coordinates: { latitude: -23.5505201, longitude: -46.6333089 },
      });

      const keyB = buildProfessionalSearchCacheKey({
        categoryIds: ['fono'],
        coordinates: { latitude: -23.5505229, longitude: -46.6333091 },
      });

      expect(keyA).toBe(keyB);
    });
  });

  describe('evaluateSearchRateLimit', () => {
    const config = {
      windowMs: 60_000,
      maxRequestsPerWindow: 3,
      minIntervalMs: 5_000,
    };

    it('allows first request', () => {
      const decision = evaluateSearchRateLimit({
        nowMs: 100_000,
        config,
      });

      expect(decision.allowed).toBe(true);
      expect(decision.nextEntry.requestsInWindow).toBe(1);
    });

    it('blocks request when below minimum interval', () => {
      const first = evaluateSearchRateLimit({ nowMs: 100_000, config });
      const second = evaluateSearchRateLimit({
        nowMs: 102_000,
        previousEntry: first.nextEntry,
        config,
      });

      expect(second.allowed).toBe(false);
      expect(second.retryAfterMs).toBe(3000);
    });

    it('blocks when max requests per window is reached', () => {
      const first = evaluateSearchRateLimit({ nowMs: 100_000, config });
      const second = evaluateSearchRateLimit({
        nowMs: 106_000,
        previousEntry: first.nextEntry,
        config,
      });
      const third = evaluateSearchRateLimit({
        nowMs: 112_000,
        previousEntry: second.nextEntry,
        config,
      });
      const fourth = evaluateSearchRateLimit({
        nowMs: 118_000,
        previousEntry: third.nextEntry,
        config,
      });

      expect(fourth.allowed).toBe(false);
      expect(fourth.retryAfterMs).toBeGreaterThan(0);
    });

    it('resets window after time passes', () => {
      const first = evaluateSearchRateLimit({ nowMs: 100_000, config });
      const second = evaluateSearchRateLimit({
        nowMs: 106_000,
        previousEntry: first.nextEntry,
        config,
      });
      const third = evaluateSearchRateLimit({
        nowMs: 112_000,
        previousEntry: second.nextEntry,
        config,
      });

      const afterWindow = evaluateSearchRateLimit({
        nowMs: 170_001,
        previousEntry: third.nextEntry,
        config,
      });

      expect(afterWindow.allowed).toBe(true);
      expect(afterWindow.nextEntry.requestsInWindow).toBe(1);
    });
  });
});
