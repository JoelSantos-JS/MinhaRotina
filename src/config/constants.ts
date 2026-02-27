export const APP_NAME = 'Minha Rotina';

export const ROUTINE_TYPES = [
  { value: 'morning', label: 'Manhã', emoji: '🌅' },
  { value: 'afternoon', label: 'Tarde', emoji: '☀️' },
  { value: 'night', label: 'Noite', emoji: '🌙' },
  { value: 'custom', label: 'Personalizada', emoji: '⭐' },
] as const;

// Sem duplicatas — 🦋 aparecia duas vezes (causava o erro de chave duplicada)
export const CHILD_ICONS = [
  '🌸', '⭐', '🦋', '🐶', '🐱', '🦁', '🐻', '🐼',
  '🐨', '🦊', '🐸', '🦄', '🐙', '🌈', '🎈', '🐥',
] as const;

export const CHILD_COLORS = [
  '#88CAFC', '#A8C98E', '#EDCC6F', '#F1B873',
  '#E57373', '#CE93D8', '#80CBC4', '#FFB74D',
] as const;

export const TASK_EMOJIS = [
  '🦷', '🛁', '🚿', '👕', '👖', '🧦', '🍽️', '🥛',
  '📚', '🎒', '🪥', '✋', '😴', '🌙', '☀️', '🏃',
  '🧴', '🪮', '🎨', '🎮', '📱', '🎵', '🌿', '💊',
] as const;

export const SENSORY_CATEGORIES = [
  { value: 'teeth', label: 'Escovar dentes', emoji: '🦷' },
  { value: 'bath', label: 'Banho', emoji: '🛁' },
  { value: 'bathroom', label: 'Banheiro', emoji: '🚽' },
  { value: 'clothes', label: 'Roupas', emoji: '👕' },
  { value: 'hair', label: 'Cabelo', emoji: '💇' },
  { value: 'food', label: 'Alimentação', emoji: '🍎' },
] as const;
