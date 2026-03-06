/**
 * TASK 2 — Bateria de testes: estrutura de sons e constantes
 *
 * [T2-01] PIANO tem todas as notas necessárias (c5, e5, g5, bb4)
 * [T2-02] VIOLIN tem a nota d5
 * [T2-03] CELLO tem a nota f3
 * [T2-04] FLUTE tem a nota a4
 * [T2-05] KALIMBA tem a nota g4
 * [T2-06] BELL tem as notas e5 e g5
 * [T2-07] EVENT_SOUNDS tem todos os 5 eventos definidos
 * [T2-08] routineComplete tem 3 arquivos e 3 delays
 * [T2-09] Delays de routineComplete são crescentes (sequência temporal correta)
 * [T2-10] calmMode, cantDo, routineStart, invalid têm 1 arquivo cada
 * [T2-11] getTaskCompleteSound retorna valor para cada instrumento
 * [T2-12] getTaskCompleteSound('piano') e 'mixed' retornam PIANO.c5
 * [T2-13] getTaskCompleteSound('violin') retorna VIOLIN.d5
 * [T2-14] getTaskCompleteSound('kalimba') retorna KALIMBA.g4
 * [T2-15] getNextTaskSound retorna valor para cada instrumento
 * [T2-16] DEFAULT_VOLUME está entre 0.1 e 1.0
 * [T2-17] Nenhum arquivo de som é undefined ou null
 */

import {
  PIANO,
  VIOLIN,
  CELLO,
  FLUTE,
  KALIMBA,
  BELL,
  EVENT_SOUNDS,
  DEFAULT_VOLUME,
  getTaskCompleteSound,
  getNextTaskSound,
  type FavoriteInstrument,
} from '../config/sounds';

describe('TASK 2 — Constantes e estrutura de sons', () => {
  // ── Instrumentos individuais ──────────────────────────────────────────────

  it('[T2-01] PIANO tem c5, e5, g5, bb4', () => {
    expect(PIANO.c5).toBeDefined();
    expect(PIANO.e5).toBeDefined();
    expect(PIANO.g5).toBeDefined();
    expect(PIANO.bb4).toBeDefined();
  });

  it('[T2-02] VIOLIN tem d5', () => {
    expect(VIOLIN.d5).toBeDefined();
  });

  it('[T2-03] CELLO tem f3', () => {
    expect(CELLO.f3).toBeDefined();
  });

  it('[T2-04] FLUTE tem a4', () => {
    expect(FLUTE.a4).toBeDefined();
  });

  it('[T2-05] KALIMBA tem g4', () => {
    expect(KALIMBA.g4).toBeDefined();
  });

  it('[T2-06] BELL tem e5 e g5', () => {
    expect(BELL.e5).toBeDefined();
    expect(BELL.g5).toBeDefined();
  });

  // ── EVENT_SOUNDS ──────────────────────────────────────────────────────────

  it('[T2-07] EVENT_SOUNDS tem os 5 eventos: routineComplete, calmMode, cantDo, routineStart, invalid', () => {
    expect(EVENT_SOUNDS).toHaveProperty('routineComplete');
    expect(EVENT_SOUNDS).toHaveProperty('calmMode');
    expect(EVENT_SOUNDS).toHaveProperty('cantDo');
    expect(EVENT_SOUNDS).toHaveProperty('routineStart');
    expect(EVENT_SOUNDS).toHaveProperty('invalid');
  });

  it('[T2-08] routineComplete tem 3 arquivos e 3 delays', () => {
    expect(EVENT_SOUNDS.routineComplete.files).toHaveLength(3);
    expect(EVENT_SOUNDS.routineComplete.delays).toHaveLength(3);
  });

  it('[T2-09] delays de routineComplete são crescentes (0 < d1 < d2)', () => {
    const [d0, d1, d2] = EVENT_SOUNDS.routineComplete.delays;
    expect(d0).toBe(0);
    expect(d1).toBeGreaterThan(d0);
    expect(d2).toBeGreaterThan(d1);
  });

  it('[T2-10] calmMode, cantDo, routineStart e invalid têm exatamente 1 arquivo cada', () => {
    expect(EVENT_SOUNDS.calmMode.files).toHaveLength(1);
    expect(EVENT_SOUNDS.cantDo.files).toHaveLength(1);
    expect(EVENT_SOUNDS.routineStart.files).toHaveLength(1);
    expect(EVENT_SOUNDS.invalid.files).toHaveLength(1);
  });

  // ── getTaskCompleteSound ──────────────────────────────────────────────────

  it('[T2-11] getTaskCompleteSound retorna valor definido para todos os instrumentos', () => {
    const instruments: FavoriteInstrument[] = ['piano', 'violin', 'kalimba', 'mixed'];
    for (const inst of instruments) {
      expect(getTaskCompleteSound(inst)).toBeDefined();
    }
  });

  it('[T2-12] getTaskCompleteSound("piano") e "mixed" retornam PIANO.c5', () => {
    expect(getTaskCompleteSound('piano')).toBe(PIANO.c5);
    expect(getTaskCompleteSound('mixed')).toBe(PIANO.c5);
  });

  it('[T2-13] getTaskCompleteSound("violin") retorna VIOLIN.d5', () => {
    expect(getTaskCompleteSound('violin')).toBe(VIOLIN.d5);
  });

  it('[T2-14] getTaskCompleteSound("kalimba") retorna KALIMBA.g4', () => {
    expect(getTaskCompleteSound('kalimba')).toBe(KALIMBA.g4);
  });

  // ── getNextTaskSound ──────────────────────────────────────────────────────

  it('[T2-15] getNextTaskSound retorna valor definido para todos os instrumentos', () => {
    const instruments: FavoriteInstrument[] = ['piano', 'violin', 'kalimba', 'mixed'];
    for (const inst of instruments) {
      expect(getNextTaskSound(inst)).toBeDefined();
    }
  });

  // ── DEFAULT_VOLUME ────────────────────────────────────────────────────────

  it('[T2-16] DEFAULT_VOLUME está entre 0.1 e 1.0', () => {
    expect(DEFAULT_VOLUME).toBeGreaterThan(0.1);
    expect(DEFAULT_VOLUME).toBeLessThanOrEqual(1.0);
  });

  // ── Nenhum valor undefined ────────────────────────────────────────────────

  it('[T2-17] Nenhum arquivo de som é undefined ou null', () => {
    const allFiles = [
      PIANO.c5, PIANO.e5, PIANO.g5, PIANO.bb4,
      VIOLIN.d5,
      CELLO.f3,
      FLUTE.a4,
      KALIMBA.g4,
      BELL.e5, BELL.g5,
    ];
    for (const file of allFiles) {
      expect(file).not.toBeUndefined();
      expect(file).not.toBeNull();
    }
  });
});
