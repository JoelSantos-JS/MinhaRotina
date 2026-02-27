export type SensoryAlertCategory = 'teeth' | 'bath' | 'bathroom' | 'clothes' | 'hair' | 'food';

export interface SensoryKeywordRule {
  keywords: string[];
  category: SensoryAlertCategory;
  priority: number; // lower = higher priority
}

export const SENSORY_KEYWORDS: SensoryKeywordRule[] = [
  {
    keywords: ['dente', 'escov', 'escova', 'pasta dental', 'floss', 'fio dental'],
    category: 'teeth',
    priority: 1,
  },
  {
    keywords: ['banho', 'banha', 'chuveiro', 'lavar corpo', 'toalha', 'shampoo'],
    category: 'bath',
    priority: 1,
  },
  {
    keywords: ['banheiro', 'vaso', 'descarga', 'xixi', 'coco', 'privada', 'toalete', 'sanitario'],
    category: 'bathroom',
    priority: 1,
  },
  {
    keywords: [
      'roupa', 'vestir', 'camisa', 'calcinha', 'cueca', 'meia', 'sapato',
      'tenis', 'blusa', 'calca', 'etiqueta', 'colocar roupa', 'trocar roupa',
    ],
    category: 'clothes',
    priority: 2,
  },
  {
    keywords: ['cabelo', 'pentear', 'tesoura', 'cortar cabelo', 'coque', 'tranca'],
    category: 'hair',
    priority: 2,
  },
  {
    keywords: [
      'comer', 'comida', 'almoco', 'jantar', 'cafe', 'lanche', 'fruta',
      'legume', 'refeicao', 'alimentar', 'mastigar', 'prato', 'talheres', 'seletiv',
    ],
    category: 'food',
    priority: 3,
  },
];

/** Normalizes a string: lowercase + strip NFD diacritics. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Detects the most likely sensory category from a task name.
 * Returns null if no category is detected or the name is too short.
 */
export function detectSensoryCategory(name: string): SensoryAlertCategory | null {
  if (name.trim().length < 3) return null;
  const lower = normalizeText(name);

  let bestMatch: { category: SensoryAlertCategory; priority: number } | null = null;

  for (const rule of SENSORY_KEYWORDS) {
    const matched = rule.keywords.some((kw) => lower.includes(normalizeText(kw)));
    if (matched) {
      if (!bestMatch || rule.priority < bestMatch.priority) {
        bestMatch = { category: rule.category, priority: rule.priority };
      }
    }
  }

  return bestMatch?.category ?? null;
}
