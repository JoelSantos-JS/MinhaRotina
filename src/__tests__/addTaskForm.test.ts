import {
  validateTaskForm,
  formatTimePreset,
  TIME_PRESETS,
  TASK_FORM_ERROR_MESSAGES,
} from '../utils/taskFormUtils';

// ─── validateTaskForm ─────────────────────────────────────────────────────────

describe('validateTaskForm — nome', () => {
  it('retorna NAME_EMPTY para nome vazio', () => {
    expect(validateTaskForm({ taskName: '', estimatedMinutes: 5 })).toBe('NAME_EMPTY');
  });

  it('retorna NAME_EMPTY para nome com apenas espaços', () => {
    expect(validateTaskForm({ taskName: '   ', estimatedMinutes: 5 })).toBe('NAME_EMPTY');
  });

  it('retorna null para nome válido', () => {
    expect(validateTaskForm({ taskName: 'Escovar os dentes', estimatedMinutes: 5 })).toBeNull();
  });

  it('aceita nome com 1 caractere', () => {
    expect(validateTaskForm({ taskName: 'A', estimatedMinutes: 5 })).toBeNull();
  });
});

describe('validateTaskForm — tempo estimado', () => {
  it('retorna INVALID_TIME para tempo 0', () => {
    expect(validateTaskForm({ taskName: 'Banho', estimatedMinutes: 0 })).toBe('INVALID_TIME');
  });

  it('retorna INVALID_TIME para tempo negativo', () => {
    expect(validateTaskForm({ taskName: 'Banho', estimatedMinutes: -1 })).toBe('INVALID_TIME');
  });

  it('retorna INVALID_TIME para tempo maior que 120', () => {
    expect(validateTaskForm({ taskName: 'Banho', estimatedMinutes: 121 })).toBe('INVALID_TIME');
  });

  it('aceita tempo igual a 1 (mínimo)', () => {
    expect(validateTaskForm({ taskName: 'Banho', estimatedMinutes: 1 })).toBeNull();
  });

  it('aceita tempo igual a 120 (máximo)', () => {
    expect(validateTaskForm({ taskName: 'Banho', estimatedMinutes: 120 })).toBeNull();
  });

  it('retorna null para tempo válido no meio do range', () => {
    expect(validateTaskForm({ taskName: 'Banho', estimatedMinutes: 5 })).toBeNull();
  });
});

describe('validateTaskForm — prioridade de erros', () => {
  it('retorna NAME_EMPTY antes de INVALID_TIME quando ambos estão errados', () => {
    expect(validateTaskForm({ taskName: '', estimatedMinutes: 0 })).toBe('NAME_EMPTY');
  });
});

// ─── formatTimePreset ─────────────────────────────────────────────────────────

describe('formatTimePreset', () => {
  it('formata 1 minuto', () => {
    expect(formatTimePreset(1)).toBe('1min');
  });

  it('formata minutos abaixo de 60', () => {
    expect(formatTimePreset(5)).toBe('5min');
    expect(formatTimePreset(10)).toBe('10min');
    expect(formatTimePreset(30)).toBe('30min');
    expect(formatTimePreset(45)).toBe('45min');
  });

  it('formata 60 minutos como 1h', () => {
    expect(formatTimePreset(60)).toBe('1h');
  });

  it('formata 120 minutos como 2h', () => {
    expect(formatTimePreset(120)).toBe('2h');
  });
});

// ─── TIME_PRESETS ─────────────────────────────────────────────────────────────

describe('TIME_PRESETS', () => {
  it('tem exatamente 10 valores', () => {
    expect(TIME_PRESETS).toHaveLength(10);
  });

  it('está em ordem estritamente crescente', () => {
    for (let i = 1; i < TIME_PRESETS.length; i++) {
      expect(TIME_PRESETS[i]).toBeGreaterThan(TIME_PRESETS[i - 1]);
    }
  });

  it('contém os valores obrigatórios do spec (1, 5, 10, 30, 60)', () => {
    expect(TIME_PRESETS).toContain(1);
    expect(TIME_PRESETS).toContain(5);
    expect(TIME_PRESETS).toContain(10);
    expect(TIME_PRESETS).toContain(30);
    expect(TIME_PRESETS).toContain(60);
  });

  it('todos os valores estão dentro do range válido (1-120)', () => {
    TIME_PRESETS.forEach((t) => {
      expect(t).toBeGreaterThanOrEqual(1);
      expect(t).toBeLessThanOrEqual(120);
    });
  });
});

// ─── TASK_FORM_ERROR_MESSAGES ─────────────────────────────────────────────────

describe('TASK_FORM_ERROR_MESSAGES', () => {
  it('tem mensagem para NAME_EMPTY', () => {
    expect(typeof TASK_FORM_ERROR_MESSAGES.NAME_EMPTY).toBe('string');
    expect(TASK_FORM_ERROR_MESSAGES.NAME_EMPTY.length).toBeGreaterThan(0);
  });

  it('tem mensagem para INVALID_TIME', () => {
    expect(typeof TASK_FORM_ERROR_MESSAGES.INVALID_TIME).toBe('string');
    expect(TASK_FORM_ERROR_MESSAGES.INVALID_TIME.length).toBeGreaterThan(0);
  });
});
