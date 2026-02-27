/** Opções de tempo estimado pré-definidas (em minutos). */
export const TIME_PRESETS = [1, 2, 3, 5, 10, 15, 20, 30, 45, 60];

/** Formata um preset de minutos para exibição. */
export function formatTimePreset(minutes: number): string {
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h`;
  return `${minutes}min`;
}

export interface TaskFormData {
  taskName: string;
  estimatedMinutes: number;
}

export type TaskFormError = 'NAME_EMPTY' | 'INVALID_TIME';

/**
 * Valida os campos do formulário de tarefa.
 * Retorna o primeiro erro encontrado, ou null se válido.
 */
export function validateTaskForm(data: TaskFormData): TaskFormError | null {
  if (!data.taskName.trim()) return 'NAME_EMPTY';
  if (data.estimatedMinutes < 1 || data.estimatedMinutes > 120) return 'INVALID_TIME';
  return null;
}

export const TASK_FORM_ERROR_MESSAGES: Record<TaskFormError, string> = {
  NAME_EMPTY: 'Digite o nome da tarefa.',
  INVALID_TIME: 'O tempo deve ser entre 1 e 120 minutos.',
};
