import {
  buildTopPlacesByCategory,
  buildProfessionalTextQuery,
  buildWhatsAppUrlFromPhone,
  doesAddressMatchCity,
  extractCityFromLocationLabel,
  pickTopUniqueResultsByCategory,
  type ProfessionalPlaceResult,
  type ProfessionalSearchCategory,
} from '../utils/professionalSearch';

const makePlace = (overrides?: Partial<ProfessionalPlaceResult>): ProfessionalPlaceResult => ({
  id: 'p1',
  name: 'Clinica Exemplo',
  address: 'Rua A, 123',
  rating: 4.6,
  mapsUrl: 'https://maps.google.com/?q=1',
  clinicPhone: '(73) 99999-0000',
  whatsappUrl: 'https://wa.me/5573999990000',
  professionalId: 'fono',
  professionalName: 'Fonoaudiologo',
  ...overrides,
});

describe('professionalSearch utils', () => {
  describe('buildProfessionalTextQuery', () => {
    it('builds default query for known professional id', () => {
      const query = buildProfessionalTextQuery('fono');
      expect(query).toBe('fonoaudiologo infantil autismo');
    });

    it('adds location when provided', () => {
      const query = buildProfessionalTextQuery('to', 'Campinas, SP');
      expect(query).toBe('terapeuta ocupacional integracao sensorial infantil em Campinas, SP');
    });

    it('uses fallback query for unknown id', () => {
      const query = buildProfessionalTextQuery('outro');
      expect(query).toBe('outro autismo infantil');
    });
  });

  describe('extractCityFromLocationLabel', () => {
    it('extracts city when city and state are provided', () => {
      expect(extractCityFromLocationLabel('Jequie, BA')).toBe('Jequie');
      expect(extractCityFromLocationLabel('Sao Paulo, SP')).toBe('Sao Paulo');
    });

    it('returns null when value looks like state only', () => {
      expect(extractCityFromLocationLabel('Bahia')).toBeNull();
      expect(extractCityFromLocationLabel('SP')).toBeNull();
    });
  });

  describe('doesAddressMatchCity', () => {
    it('matches city names even with accents', () => {
      expect(doesAddressMatchCity('Centro, Jequie - BA', 'Jequié')).toBe(true);
    });

    it('does not match when city is not present in address', () => {
      expect(doesAddressMatchCity('Salvador - BA', 'Jequie')).toBe(false);
    });
  });

  describe('buildWhatsAppUrlFromPhone', () => {
    it('builds whatsapp url from brazil local phone', () => {
      expect(buildWhatsAppUrlFromPhone('(73) 99999-0000')).toBe('https://wa.me/5573999990000');
    });

    it('returns same country code when already international', () => {
      expect(buildWhatsAppUrlFromPhone('+55 73 99999-0000')).toBe('https://wa.me/5573999990000');
    });

    it('returns null for invalid values', () => {
      expect(buildWhatsAppUrlFromPhone('abc')).toBeNull();
      expect(buildWhatsAppUrlFromPhone(null)).toBeNull();
    });
  });

  describe('pickTopUniqueResultsByCategory', () => {
    const categories: ProfessionalSearchCategory[] = [
      { id: 'fono', name: 'Fonoaudiologo' },
      { id: 'psicologo', name: 'Psicologo' },
      { id: 'to', name: 'Terapeuta Ocupacional' },
    ];

    it('picks one result per category, prioritizing unique places', () => {
      const shared = makePlace({ id: 'shared' });
      const results = pickTopUniqueResultsByCategory(categories, {
        fono: [shared, makePlace({ id: 'f1' })],
        psicologo: [shared, makePlace({ id: 'p1' })],
        to: [makePlace({ id: 't1' })],
      });

      expect(results).toHaveLength(3);
      expect(results[0].id).toBe('shared');
      expect(results[1].id).toBe('p1');
      expect(results[2].id).toBe('t1');
    });

    it('falls back to first option when all are duplicates', () => {
      const shared = makePlace({ id: 'shared' });
      const results = pickTopUniqueResultsByCategory(categories, {
        fono: [shared],
        psicologo: [shared],
        to: [shared],
      });

      expect(results).toHaveLength(3);
      expect(results[0].id).toBe('shared');
      expect(results[1].id).toBe('shared');
      expect(results[2].id).toBe('shared');
    });
  });

  describe('buildTopPlacesByCategory', () => {
    const categories: ProfessionalSearchCategory[] = [
      { id: 'fono', name: 'Fonoaudiologo' },
      { id: 'psicologo', name: 'Psicologo' },
    ];

    it('returns top 3 places per category', () => {
      const grouped = buildTopPlacesByCategory(
        categories,
        {
          fono: [
            makePlace({ id: 'f1', professionalId: 'fono' }),
            makePlace({ id: 'f2', professionalId: 'fono' }),
            makePlace({ id: 'f3', professionalId: 'fono' }),
            makePlace({ id: 'f4', professionalId: 'fono' }),
          ],
          psicologo: [
            makePlace({ id: 'p1', professionalId: 'psicologo' }),
            makePlace({ id: 'p2', professionalId: 'psicologo' }),
          ],
        },
        3
      );

      expect(grouped).toHaveLength(2);
      expect(grouped[0].places.map((p) => p.id)).toEqual(['f1', 'f2', 'f3']);
      expect(grouped[1].places.map((p) => p.id)).toEqual(['p1', 'p2']);
    });

    it('deduplicates place ids inside each category', () => {
      const duplicated = makePlace({ id: 'same', professionalId: 'fono' });
      const grouped = buildTopPlacesByCategory(
        [{ id: 'fono', name: 'Fonoaudiologo' }],
        { fono: [duplicated, duplicated, makePlace({ id: 'f2', professionalId: 'fono' })] },
        3
      );

      expect(grouped[0].places.map((p) => p.id)).toEqual(['same', 'f2']);
    });
  });
});
