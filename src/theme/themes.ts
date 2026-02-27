export type ThemeId = 'bluey' | 'vibrant' | 'high-contrast' | 'night' | 'pastel';

export interface AppTheme {
  id: ThemeId;
  name: string;
  emoji: string;
  description: string;
  intensity: number; // 1-5
  // Colors
  backgroundMain: string;
  backgroundCard: string;
  primaryColor: string;
  primaryLight: string;
  successColor: string;
  infoColor: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  // Gradient for task screen
  gradientStart: string;
  gradientEnd: string;
  // Button
  buttonText: string;
}

export const THEMES: Record<ThemeId, AppTheme> = {
  bluey: {
    id: 'bluey',
    name: 'Bluey',
    emoji: '🐾',
    description: 'Cores suaves e brandas — ideal para a maioria das crianças',
    intensity: 1,
    backgroundMain: '#FFFFFD',
    backgroundCard: '#FFFFFF',
    primaryColor: '#88CAFC',
    primaryLight: '#D4EBFB',
    successColor: '#A8C98E',
    infoColor: '#EDCC6F',
    textPrimary: '#2B2C41',
    textSecondary: '#404066',
    borderColor: '#D2EBFF',
    gradientStart: '#D2EBFF',
    gradientEnd: '#FFFFFD',
    buttonText: '#FFFFFF',
  },
  vibrant: {
    id: 'vibrant',
    name: 'Vibrante',
    emoji: '🌈',
    description: 'Cores vivas e saturadas para crianças que preferem mais estímulo',
    intensity: 3,
    backgroundMain: '#FFFFFF',
    backgroundCard: '#F5F5F5',
    primaryColor: '#2196F3',
    primaryLight: '#BBDEFB',
    successColor: '#4CAF50',
    infoColor: '#FFC107',
    textPrimary: '#212121',
    textSecondary: '#424242',
    borderColor: '#BBDEFB',
    gradientStart: '#BBDEFB',
    gradientEnd: '#FFFFFF',
    buttonText: '#FFFFFF',
  },
  'high-contrast': {
    id: 'high-contrast',
    name: 'Alto Contraste',
    emoji: '⚡',
    description: 'Preto e branco com acentos fortes — máxima legibilidade',
    intensity: 4,
    backgroundMain: '#FFFFFF',
    backgroundCard: '#F8F8F8',
    primaryColor: '#FF5722',
    primaryLight: '#FFCCBC',
    successColor: '#00C853',
    infoColor: '#FFD600',
    textPrimary: '#000000',
    textSecondary: '#212121',
    borderColor: '#BDBDBD',
    gradientStart: '#F5F5F5',
    gradientEnd: '#FFFFFF',
    buttonText: '#FFFFFF',
  },
  night: {
    id: 'night',
    name: 'Noturno',
    emoji: '🌙',
    description: 'Fundo escuro para uso à noite — menos cansaço visual',
    intensity: 2,
    backgroundMain: '#1E1E2E',
    backgroundCard: '#2A2A3E',
    primaryColor: '#64B5F6',
    primaryLight: '#1565C0',
    successColor: '#81C784',
    infoColor: '#FFD54F',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0BEC5',
    borderColor: '#37474F',
    gradientStart: '#2A2A3E',
    gradientEnd: '#1E1E2E',
    buttonText: '#1E1E2E',
  },
  pastel: {
    id: 'pastel',
    name: 'Pastel',
    emoji: '🌸',
    description: 'Tons suaves e quentes — alternativa acolhedora ao Bluey',
    intensity: 2,
    backgroundMain: '#FFF9F5',
    backgroundCard: '#FFFFFF',
    primaryColor: '#B39DDB',
    primaryLight: '#EDE7F6',
    successColor: '#C5E1A5',
    infoColor: '#FFE082',
    textPrimary: '#3E2723',
    textSecondary: '#5D4037',
    borderColor: '#E1BEE7',
    gradientStart: '#EDE7F6',
    gradientEnd: '#FFF9F5',
    buttonText: '#FFFFFF',
  },
};

export const THEME_LIST = Object.values(THEMES);
