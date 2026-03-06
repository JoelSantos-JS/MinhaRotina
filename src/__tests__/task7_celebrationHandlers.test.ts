/**
 * TASK 7 — Bateria de testes: onCelebrationShown (CelebrationScreen)
 *
 * [T7-01] onCelebrationShown chama triggerRoutineComplete com childId correto
 * [T7-02] onCelebrationShown é fire-and-forget (retorna void imediatamente)
 * [T7-03] onCelebrationShown com string vazia ainda chama triggerRoutineComplete('')
 * [T7-04] Erro em triggerRoutineComplete é silenciado (não propaga)
 * [T7-05] onCelebrationShown NÃO chama triggerTaskComplete
 * [T7-06] onCelebrationShown NÃO chama triggerCantDo
 * [T7-07] onCelebrationShown NÃO chama triggerCalmMode
 * [T7-08] Chamadas múltiplas a onCelebrationShown são independentes
 * [T7-09] onTaskCompleted NÃO chama triggerRoutineComplete (sem duplo disparo)
 * [T7-10] onCelebrationShown chama triggerRoutineComplete exatamente uma vez por chamada
 */

import { feedbackService } from '../services/feedbackService';
import { onCelebrationShown, onTaskCompleted } from '../utils/taskEventHandlers';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../services/feedbackService', () => ({
  feedbackService: {
    triggerTaskComplete:    jest.fn().mockResolvedValue(undefined),
    triggerRoutineComplete: jest.fn().mockResolvedValue(undefined),
    triggerNextTask:        jest.fn().mockResolvedValue(undefined),
    triggerCantDo:          jest.fn().mockResolvedValue(undefined),
    triggerCalmMode:        jest.fn().mockResolvedValue(undefined),
    triggerRoutineStart:    jest.fn().mockResolvedValue(undefined),
  },
}));

const mock = feedbackService as jest.Mocked<typeof feedbackService>;

describe('TASK 7 — onCelebrationShown: trigger de celebração completa', () => {
  beforeEach(() => jest.clearAllMocks());

  it('[T7-01] onCelebrationShown chama triggerRoutineComplete com childId correto', async () => {
    onCelebrationShown('child-1');
    await Promise.resolve();
    expect(mock.triggerRoutineComplete).toHaveBeenCalledWith('child-1');
  });

  it('[T7-02] onCelebrationShown é fire-and-forget (retorna void imediatamente)', () => {
    expect(onCelebrationShown('child-1')).toBeUndefined();
  });

  it('[T7-03] onCelebrationShown com string vazia ainda chama triggerRoutineComplete("")', async () => {
    onCelebrationShown('');
    await Promise.resolve();
    expect(mock.triggerRoutineComplete).toHaveBeenCalledWith('');
  });

  it('[T7-04] Erro em triggerRoutineComplete é silenciado (não propaga)', async () => {
    mock.triggerRoutineComplete.mockRejectedValueOnce(new Error('Audio failed'));
    onCelebrationShown('child-1');
    await Promise.resolve(); // flush — não deve lançar
  });

  it('[T7-05] onCelebrationShown NÃO chama triggerTaskComplete', async () => {
    onCelebrationShown('child-1');
    await Promise.resolve();
    expect(mock.triggerTaskComplete).not.toHaveBeenCalled();
  });

  it('[T7-06] onCelebrationShown NÃO chama triggerCantDo', async () => {
    onCelebrationShown('child-1');
    await Promise.resolve();
    expect(mock.triggerCantDo).not.toHaveBeenCalled();
  });

  it('[T7-07] onCelebrationShown NÃO chama triggerCalmMode', async () => {
    onCelebrationShown('child-1');
    await Promise.resolve();
    expect(mock.triggerCalmMode).not.toHaveBeenCalled();
  });

  it('[T7-08] Chamadas múltiplas a onCelebrationShown são independentes', async () => {
    onCelebrationShown('child-A');
    onCelebrationShown('child-B');
    await Promise.resolve();
    expect(mock.triggerRoutineComplete).toHaveBeenCalledTimes(2);
    expect(mock.triggerRoutineComplete).toHaveBeenCalledWith('child-A');
    expect(mock.triggerRoutineComplete).toHaveBeenCalledWith('child-B');
  });

  // ── Garantia anti-duplo-disparo ───────────────────────────────────────────

  it('[T7-09] onTaskCompleted NÃO chama triggerRoutineComplete (sem duplo disparo)', async () => {
    onTaskCompleted('child-1');
    await Promise.resolve();
    expect(mock.triggerRoutineComplete).not.toHaveBeenCalled();
    expect(mock.triggerTaskComplete).toHaveBeenCalledTimes(1);
  });

  it('[T7-10] onCelebrationShown chama triggerRoutineComplete exatamente uma vez por chamada', async () => {
    onCelebrationShown('child-1');
    await Promise.resolve();
    expect(mock.triggerRoutineComplete).toHaveBeenCalledTimes(1);
  });
});
