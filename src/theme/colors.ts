export const BlueyColors = {
  // Backgrounds
  backgroundMain: '#FFFFFD',
  backgroundBlue: '#D2EBFF',
  backgroundGreen: '#C8E6C9',
  backgroundYellow: '#F5E5C0',

  // Cores principais
  blueyMain: '#88CAFC',
  blueyLight: '#D4EBFB',
  blueyDark: '#404066',
  blueyNight: '#2B2C41',

  // Verde
  blueyGreen: '#A8C98E',
  blueyGreenDark: '#8FB875',

  // Amarelo/Laranja
  bingoMain: '#EDCC6F',
  bingoAccent: '#F1B873',

  // Outros
  blueyBlue: '#64B5F6',
  alertOrange: '#E27A37',
  errorRed: '#E57373',
  successGreen: '#4CAF50',

  // Textos
  textPrimary: '#2B2C41',
  textSecondary: '#404066',
  textPlaceholder: '#88CAFC',
  textDisabled: '#BDBDBD',

  // Bordas
  borderLight: '#E0E0E0',
  borderMedium: '#D2EBFF',
  borderActive: '#88CAFC',

  // Extra
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorKey = keyof typeof BlueyColors;

export const BlueyGradients = {
  blueHorizontal: ['#88CAFC', '#D2EBFF'] as const,
  blueVertical: ['#D2EBFF', '#FFFFFD'] as const,
  greenHorizontal: ['#A8C98E', '#8FB875'] as const,
  greenVertical: ['#A8C98E', '#C8E6C9'] as const,
  yellowHorizontal: ['#EDCC6F', '#F1B873'] as const,
  celebrationVertical: ['#A8C98E', '#8FB875'] as const,
  skyVertical: ['#88CAFC', '#D4EBFB'] as const,
} as const;
