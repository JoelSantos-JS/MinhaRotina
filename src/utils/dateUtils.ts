/**
 * Retorna a data de hoje no formato 'YYYY-MM-DD' (fuso local).
 */
export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Retorna a data de ontem no formato 'YYYY-MM-DD' (fuso local).
 */
export function yesterdayString(): string {
  return new Date(Date.now() - 86400000).toISOString().split('T')[0];
}

/**
 * Converte uma string de data ('YYYY-MM-DD') para rótulo legível em PT-BR.
 * - Hoje → "Hoje"
 * - Ontem → "Ontem"
 * - Demais → "segunda-feira, 05 jan."
 */
export function formatDateLabel(dateStr: string): string {
  const today = todayString();
  const yesterday = yesterdayString();
  if (dateStr === today) return 'Hoje';
  if (dateStr === yesterday) return 'Ontem';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' });
}

/**
 * Formata um timestamp ISO para horário HH:MM em PT-BR.
 * Ex: "2024-03-15T14:30:00.000Z" → "11:30" (fuso local)
 */
export function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Retorna quantos dias atrás uma data ISO ocorreu (inteiro, baseado em dias corridos).
 * 0 = hoje, 1 = ontem, etc.
 */
export function daysAgo(isoStr: string): number {
  const date = new Date(isoStr).toISOString().split('T')[0];
  const today = todayString();
  const diffMs = new Date(today + 'T00:00:00').getTime() - new Date(date + 'T00:00:00').getTime();
  return Math.round(diffMs / 86400000);
}
