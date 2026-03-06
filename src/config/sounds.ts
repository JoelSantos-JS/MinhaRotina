/**
 * Centraliza todos os assets de som do app.
 *
 * Estrutura: /assets/sounds/<instrumento>/<nota>.mp3
 *
 * Substitua os placeholders pelos arquivos reais baixados de:
 * https://philharmonia.co.uk/resources/sound-samples/
 *
 * Notas usadas:
 *   C5  = 523 Hz  (Dó)   → completar tarefa
 *   D5  = 587 Hz  (Ré)   → próxima tarefa
 *   E5  = 659 Hz  (Mi)   → sequência final (2ª nota)
 *   F3  = 175 Hz  (Fá)   → modo calmo
 *   G4  = 392 Hz  (Sol)  → iniciar rotina
 *   G5  = 784 Hz  (Sol)  → sequência final (3ª nota)
 *   A4  = 440 Hz  (Lá)   → não consigo / skip
 *   Bb4 = 466 Hz  (Si♭)  → ação inválida
 */

// ─── Arquivos individuais por instrumento ────────────────────────────────────

export const PIANO = {
  c5:  require('../../assets/sounds/piano/c5.wav'),
  e5:  require('../../assets/sounds/piano/e5.wav'),
  g5:  require('../../assets/sounds/bell/g5.mp3'),    // nota G5 correta (bell/g5.mp3 disponível)
  bb4: require('../../assets/sounds/piano/c4.wav'),   // c4 mais grave que e5 — som distinto para ação inválida
} as const;

export const VIOLIN = {
  d5: require('../../assets/sounds/violin/d5.mp3'),
} as const;

export const CELLO = {
  f3: require('../../assets/sounds/cello/f3.mp3'),
} as const;

export const FLUTE = {
  a4: require('../../assets/sounds/flute/a4.mp3'),
} as const;

export const KALIMBA = {
  g4: require('../../assets/sounds/kalimba/g4.wav'),
} as const;

export const BELL = {
  e5: require('../../assets/sounds/bell/e5.mp3'),
  g5: require('../../assets/sounds/bell/g5.mp3'),
} as const;

// ─── Instrumento preferido → nota principal ──────────────────────────────────

export type FavoriteInstrument = 'piano' | 'violin' | 'kalimba' | 'mixed';

/**
 * Retorna o arquivo de som da nota C5 (completar tarefa)
 * de acordo com o instrumento favorito da criança.
 */
export function getTaskCompleteSound(instrument: FavoriteInstrument) {
  switch (instrument) {
    case 'violin':  return VIOLIN.d5;    // D5 é a nota mais impactante do violino
    case 'kalimba': return KALIMBA.g4;   // G4 é o tom mais característico da kalimba
    case 'piano':
    case 'mixed':
    default:        return PIANO.c5;
  }
}

/**
 * Retorna o arquivo de som para "próxima tarefa"
 * de acordo com o instrumento favorito.
 */
export function getNextTaskSound(instrument: FavoriteInstrument) {
  switch (instrument) {
    case 'violin':
    case 'mixed':   return VIOLIN.d5;
    case 'kalimba': return KALIMBA.g4;
    case 'piano':
    default:        return PIANO.c5;
  }
}

// ─── Mapeamento de eventos → sons ───────────────────────────────────────────

/**
 * Sons fixos (não variam por instrumento preferido).
 */
export const EVENT_SOUNDS = {
  /** Completar rotina inteira: sequência C5 → E5 → G5 (tríade maior) */
  routineComplete: {
    files: [PIANO.c5, PIANO.e5, PIANO.g5],
    delays: [0, 420, 840],   // ms entre cada nota
  },

  /** Entrar em modo calmo: Fá grave (F3) no violoncelo */
  calmMode: {
    files: [CELLO.f3],
    delays: [0],
  },

  /** Não consigo / skip: Lá (A4) na flauta */
  cantDo: {
    files: [FLUTE.a4],
    delays: [0],
  },

  /** Iniciar rotina: Sol (G4) na kalimba */
  routineStart: {
    files: [KALIMBA.g4],
    delays: [0],
  },

  /** Ação inválida: Si♭ (Bb4) no piano */
  invalid: {
    files: [PIANO.bb4],
    delays: [0],
  },
} as const;

export type SoundEventKey = keyof typeof EVENT_SOUNDS;

// ─── Volumes padrão ─────────────────────────────────────────────────────────

export const DEFAULT_VOLUME = 0.65;  // 65% — audível mas não estridente
