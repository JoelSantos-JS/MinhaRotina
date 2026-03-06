/**
 * TASK 6 — Bateria de testes: coordenadores de eventos de tarefa (CurrentTaskScreen)
 *
 * [T6-01] onTaskCompleted chama triggerTaskComplete com o childId correto
 * [T6-02] onTaskCompleted NÃO chama triggerRoutineComplete (CelebrationScreen é o dono)
 * [T6-03] onTaskCompleted é fire-and-forget (retorna void imediatamente)
 * [T6-04] Erro em triggerTaskComplete é silenciado (não propaga)
 * [T6-05] onMoveToNextTask chama triggerNextTask com o childId correto
 * [T6-06] onMoveToNextTask é fire-and-forget (retorna void imediatamente)
 * [T6-07] onTaskSkipped chama triggerCantDo com o childId correto
 * [T6-08] onTaskSkipped é fire-and-forget (retorna void imediatamente)
 * [T6-09] onCalmModeEntered chama triggerCalmMode com o childId correto
 * [T6-10] onCalmModeEntered é fire-and-forget (retorna void imediatamente)
 * [T6-11] onRoutineStarted chama triggerRoutineStart com o childId correto
 * [T6-12] onRoutineStarted é fire-and-forget (retorna void imediatamente)
 * [T6-13] Erro em triggerCantDo é silenciado (não propaga)
 * [T6-14] Erro em triggerNextTask é silenciado (não propaga)
 * [T6-15] Erro em triggerCalmMode é silenciado (não propaga)
 * [T6-16] Erro em triggerRoutineStart é silenciado (não propaga)
 */

import { feedbackService } from '../services/feedbackService';
import {
  onTaskCompleted,
  onMoveToNextTask,
  onTaskSkipped,
  onCalmModeEntered,
  onRoutineStarted,
} from '../utils/taskEventHandlers';

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

describe('TASK 6 — taskEventHandlers: coordenação de eventos (CurrentTaskScreen)', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── onTaskCompleted ───────────────────────────────────────────────────────

  it('[T6-01] onTaskCompleted chama triggerTaskComplete com o childId correto', async () => {
    onTaskCompleted('child-1');
    await Promise.resolve();
    expect(mock.triggerTaskComplete).toHaveBeenCalledWith('child-1');
  });

  it('[T6-02] onTaskCompleted NÃO chama triggerRoutineComplete (CelebrationScreen é o dono)', async () => {
    onTaskCompleted('child-1');
    await Promise.resolve();
    expect(mock.triggerRoutineComplete).not.toHaveBeenCalled();
  });

  it('[T6-03] onTaskCompleted é fire-and-forget (retorna void imediatamente)', () => {
    const result = onTaskCompleted('child-1');
    expect(result).toBeUndefined();
  });

  it('[T6-04] Erro em triggerTaskComplete é silenciado (não propaga)', async () => {
    mock.triggerTaskComplete.mockRejectedValueOnce(new Error('Audio error'));
    onTaskCompleted('child-1');
    await Promise.resolve(); // flush — não deve lançar
  });

  // ── onMoveToNextTask ──────────────────────────────────────────────────────

  it('[T6-05] onMoveToNextTask chama triggerNextTask com o childId correto', async () => {
    onMoveToNextTask('child-2');
    await Promise.resolve();
    expect(mock.triggerNextTask).toHaveBeenCalledWith('child-2');
  });

  it('[T6-06] onMoveToNextTask é fire-and-forget (retorna void imediatamente)', () => {
    expect(onMoveToNextTask('child-1')).toBeUndefined();
  });

  // ── onTaskSkipped ─────────────────────────────────────────────────────────

  it('[T6-07] onTaskSkipped chama triggerCantDo com o childId correto', async () => {
    onTaskSkipped('child-3');
    await Promise.resolve();
    expect(mock.triggerCantDo).toHaveBeenCalledWith('child-3');
  });

  it('[T6-08] onTaskSkipped é fire-and-forget (retorna void imediatamente)', () => {
    expect(onTaskSkipped('child-1')).toBeUndefined();
  });

  // ── onCalmModeEntered ─────────────────────────────────────────────────────

  it('[T6-09] onCalmModeEntered chama triggerCalmMode com o childId correto', async () => {
    onCalmModeEntered('child-4');
    await Promise.resolve();
    expect(mock.triggerCalmMode).toHaveBeenCalledWith('child-4');
  });

  it('[T6-10] onCalmModeEntered é fire-and-forget (retorna void imediatamente)', () => {
    expect(onCalmModeEntered('child-1')).toBeUndefined();
  });

  // ── onRoutineStarted ──────────────────────────────────────────────────────

  it('[T6-11] onRoutineStarted chama triggerRoutineStart com o childId correto', async () => {
    onRoutineStarted('child-5');
    await Promise.resolve();
    expect(mock.triggerRoutineStart).toHaveBeenCalledWith('child-5');
  });

  it('[T6-12] onRoutineStarted é fire-and-forget (retorna void imediatamente)', () => {
    expect(onRoutineStarted('child-1')).toBeUndefined();
  });

  // ── Silenciamento de erros ────────────────────────────────────────────────

  it('[T6-13] Erro em triggerCantDo é silenciado (não propaga)', async () => {
    mock.triggerCantDo.mockRejectedValueOnce(new Error('Haptic error'));
    onTaskSkipped('child-1');
    await Promise.resolve();
  });

  it('[T6-14] Erro em triggerNextTask é silenciado (não propaga)', async () => {
    mock.triggerNextTask.mockRejectedValueOnce(new Error('Audio error'));
    onMoveToNextTask('child-1');
    await Promise.resolve();
  });

  it('[T6-15] Erro em triggerCalmMode é silenciado (não propaga)', async () => {
    mock.triggerCalmMode.mockRejectedValueOnce(new Error('Audio error'));
    onCalmModeEntered('child-1');
    await Promise.resolve();
  });

  it('[T6-16] Erro em triggerRoutineStart é silenciado (não propaga)', async () => {
    mock.triggerRoutineStart.mockRejectedValueOnce(new Error('Audio error'));
    onRoutineStarted('child-1');
    await Promise.resolve();
  });
});
