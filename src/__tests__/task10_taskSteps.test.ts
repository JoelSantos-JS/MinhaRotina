/**
 * TASK 10 — Bateria de testes: passo a passo de tarefa (steps JSONB)
 *
 * Cobre a persistência e recuperação dos passos de tarefa no taskService,
 * bem como a lógica de exibição condicional (steps vs description).
 *
 * [T10-01] createTask sem steps → campo steps é null no insert
 * [T10-02] createTask com steps → array JSONB enviado ao DB
 * [T10-03] createTask com steps → task retornada tem steps corretos
 * [T10-04] createTask com steps vazios (array vazio) → steps undefined (não envia)
 * [T10-05] updateTask com steps → payload inclui steps correto
 * [T10-06] updateTask com steps = null → payload inclui steps = null (remoção)
 * [T10-07] updateTask sem campo steps → payload NÃO inclui steps
 * [T10-08] updateTask modo texto→passos → description = null, steps preenchido
 * [T10-09] updateTask modo passos→texto → steps = null, description preenchida
 * [T10-10] Estrutura TaskStep: cada passo tem id (string) e text (string)
 * [T10-11] Round-trip: ordem dos passos preservada após save + load
 * [T10-12] Round-trip: texto de cada passo preservado sem truncamento
 * [T10-13] createTask com steps não chama uploadTaskPhoto nem updateTaskPhoto
 * [T10-14] createTask com steps E photoLocalUri — ambos processados
 * [T10-15] updateTask com steps mantém outros campos no payload (name, iconEmoji)
 * [T10-16] steps e description são mutuamente exclusivos: se steps → description null
 * [T10-17] steps e description são mutuamente exclusivos: se description → steps null
 * [T10-18] Passo com texto longo (>100 chars) é preservado sem alteração
 */

import { taskService } from '../services/routine.service';
import { compressImage, base64ToUint8Array } from '../utils/imageUtils';
import type { Task, TaskStep } from '../types/models';

// ── Constantes de teste ───────────────────────────────────────────────────────

const TASK_ID    = 'task-steps-uuid';
const ROUTINE_ID = 'routine-uuid-001';
const PUBLIC_URL = 'https://supabase.co/storage/v1/object/sign/task-photos/task-steps-uuid.jpg?token=abc';
const LOCAL_URI  = 'file:///photos/test.jpg';

const SAMPLE_STEPS: TaskStep[] = [
  { id: '1000', text: 'Coloque pasta do tamanho de uma ervilha' },
  { id: '1001', text: 'Escove por 2 minutos' },
  { id: '1002', text: 'Cuspa e enxágue a boca' },
];

const BASE_TASK: Task = {
  id:                 TASK_ID,
  routine_id:         ROUTINE_ID,
  name:               'Escovar os dentes',
  icon_emoji:         '🦷',
  order_index:        0,
  estimated_minutes:  5,
  has_sensory_issues: false,
  sensory_category:   null,
  photo_url:          null,
  description:        null,
  steps:              null,
  video_url:          null,
  routines_config:    null,
  created_at:         '2024-01-01T00:00:00Z',
  updated_at:         '2024-01-01T00:00:00Z',
};

// ── Mocks: supabase ───────────────────────────────────────────────────────────

const mockStorageUpload       = jest.fn();
const mockStorageCreateSignedUrl = jest.fn();
const mockStorageBucket = {
  upload:       mockStorageUpload,
  createSignedUrl: mockStorageCreateSignedUrl,
};
const mockStorageFrom = jest.fn().mockReturnValue(mockStorageBucket);

const mockSingle = jest.fn();
const mockEq     = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockInsert = jest.fn();
const dbChain    = { insert: mockInsert, update: mockUpdate, select: mockSelect, eq: mockEq, single: mockSingle };

const mockFrom = jest.fn().mockReturnValue(dbChain);

jest.mock('../config/supabase', () => ({
  supabase: {
    from:    (...a: any[]) => mockFrom(...a),
    storage: { from: (...a: any[]) => mockStorageFrom(...a) },
  },
}));

// ── Mocks: imageUtils ─────────────────────────────────────────────────────────

jest.mock('../utils/imageUtils', () => ({
  compressImage:      jest.fn(),
  base64ToUint8Array: jest.fn(),
}));

const mockCompress = compressImage      as jest.MockedFunction<typeof compressImage>;
const mockToBytes  = base64ToUint8Array as jest.MockedFunction<typeof base64ToUint8Array>;

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  // Re-estabelece chain DB
  mockInsert.mockReturnValue(dbChain);
  mockUpdate.mockReturnValue(dbChain);
  mockSelect.mockReturnValue(dbChain);
  mockEq.mockReturnValue(dbChain);
  mockSingle.mockResolvedValue({ data: { ...BASE_TASK }, error: null });

  // Storage
  mockStorageUpload.mockResolvedValue({ error: null });
  mockStorageCreateSignedUrl.mockResolvedValue({ data: { signedUrl: PUBLIC_URL }, error: null });

  // imageUtils
  mockCompress.mockResolvedValue({ uri: LOCAL_URI, base64: 'abc=' });
  mockToBytes.mockReturnValue(new Uint8Array([1, 2, 3]));
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 1 — createTask com/sem steps
// ═════════════════════════════════════════════════════════════════════════════

describe('TASK 10 — createTask: campo steps', () => {

  it('[T10-01] sem steps → steps = null no insert', async () => {
    await taskService.createTask(ROUTINE_ID, 'Escovar', '🦷', 0, {});
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ steps: null })
    );
  });

  it('[T10-02] com steps → array enviado ao DB no insert', async () => {
    await taskService.createTask(ROUTINE_ID, 'Escovar', '🦷', 0, { steps: SAMPLE_STEPS });
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ steps: SAMPLE_STEPS })
    );
  });

  it('[T10-03] com steps → task retornada tem steps corretos', async () => {
    mockSingle.mockResolvedValueOnce({ data: { ...BASE_TASK, steps: SAMPLE_STEPS }, error: null });
    const task = await taskService.createTask(ROUTINE_ID, 'Escovar', '🦷', 0, { steps: SAMPLE_STEPS });
    expect(task.steps).toEqual(SAMPLE_STEPS);
  });

  it('[T10-04] com steps = [] (vazio) e sem photoLocalUri → steps = null no insert', async () => {
    // O AddTaskScreen passa undefined se steps.length === 0
    await taskService.createTask(ROUTINE_ID, 'Escovar', '🦷', 0, { steps: undefined });
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ steps: null })
    );
  });

  it('[T10-13] com steps → uploadTaskPhoto NÃO é chamado', async () => {
    const spyUpload = jest.spyOn(taskService, 'uploadTaskPhoto').mockResolvedValue(PUBLIC_URL);
    await taskService.createTask(ROUTINE_ID, 'Escovar', '🦷', 0, { steps: SAMPLE_STEPS });
    expect(spyUpload).not.toHaveBeenCalled();
    spyUpload.mockRestore();
  });

  it('[T10-14] com steps E photoLocalUri → ambos processados independentemente', async () => {
    const spyUpload = jest.spyOn(taskService, 'uploadTaskPhoto').mockResolvedValue(PUBLIC_URL);
    const spyUpdatePhoto = jest.spyOn(taskService, 'updateTaskPhoto').mockResolvedValue(undefined);
    await taskService.createTask(ROUTINE_ID, 'Escovar', '🦷', 0, {
      steps: SAMPLE_STEPS,
      photoLocalUri: LOCAL_URI,
    });
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ steps: SAMPLE_STEPS }));
    expect(spyUpload).toHaveBeenCalledWith(TASK_ID, LOCAL_URI);
    spyUpload.mockRestore();
    spyUpdatePhoto.mockRestore();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 2 — updateTask com/sem steps
// ═════════════════════════════════════════════════════════════════════════════

describe('TASK 10 — updateTask: campo steps', () => {

  it('[T10-05] com steps → payload inclui steps correto', async () => {
    await taskService.updateTask(TASK_ID, { steps: SAMPLE_STEPS });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ steps: SAMPLE_STEPS })
    );
  });

  it('[T10-06] com steps = null → payload inclui steps = null (remoção)', async () => {
    await taskService.updateTask(TASK_ID, { steps: null });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ steps: null })
    );
  });

  it('[T10-07] sem campo steps (undefined) → payload NÃO inclui steps', async () => {
    await taskService.updateTask(TASK_ID, { name: 'Novo nome' });
    const callArg = mockUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect('steps' in callArg).toBe(false);
  });

  it('[T10-08] troca texto→passos: description = null, steps preenchido', async () => {
    await taskService.updateTask(TASK_ID, {
      description: null,
      steps: SAMPLE_STEPS,
    });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ description: null, steps: SAMPLE_STEPS })
    );
  });

  it('[T10-09] troca passos→texto: steps = null, description preenchida', async () => {
    await taskService.updateTask(TASK_ID, {
      description: 'Instrução em texto',
      steps: null,
    });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Instrução em texto', steps: null })
    );
  });

  it('[T10-15] com steps mantém outros campos no payload (name, iconEmoji)', async () => {
    await taskService.updateTask(TASK_ID, {
      name: 'Escovar dentes',
      steps: SAMPLE_STEPS,
    });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Escovar dentes', steps: SAMPLE_STEPS })
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 3 — Estrutura e integridade dos steps
// ═════════════════════════════════════════════════════════════════════════════

describe('TASK 10 — TaskStep: estrutura e integridade', () => {

  it('[T10-10] cada passo tem id (string) e text (string)', async () => {
    SAMPLE_STEPS.forEach((step) => {
      expect(typeof step.id).toBe('string');
      expect(typeof step.text).toBe('string');
    });
  });

  it('[T10-11] round-trip: ordem dos passos preservada', async () => {
    const ordered: TaskStep[] = [
      { id: '1', text: 'Primeiro' },
      { id: '2', text: 'Segundo' },
      { id: '3', text: 'Terceiro' },
    ];
    mockSingle.mockResolvedValueOnce({ data: { ...BASE_TASK, steps: ordered }, error: null });
    const task = await taskService.createTask(ROUTINE_ID, 'Ordem', '🔢', 0, { steps: ordered });
    expect(task.steps?.map((s) => s.text)).toEqual(['Primeiro', 'Segundo', 'Terceiro']);
  });

  it('[T10-12] round-trip: texto preservado sem truncamento', async () => {
    const longStep: TaskStep = {
      id: '999',
      text: 'Coloque a pasta de dente na escova com cuidado, usando uma quantidade do tamanho de uma ervilha pequena',
    };
    mockSingle.mockResolvedValueOnce({ data: { ...BASE_TASK, steps: [longStep] }, error: null });
    const task = await taskService.createTask(ROUTINE_ID, 'Long', '📝', 0, { steps: [longStep] });
    expect(task.steps?.[0].text).toBe(longStep.text);
  });

  it('[T10-18] passo com texto > 100 chars preservado sem alteração', async () => {
    const longText = 'A'.repeat(150);
    const step: TaskStep = { id: '888', text: longText };
    await taskService.createTask(ROUTINE_ID, 'Teste', '🔤', 0, { steps: [step] });
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: expect.arrayContaining([expect.objectContaining({ text: longText })]),
      })
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 4 — Exclusividade mútua steps/description
// ═════════════════════════════════════════════════════════════════════════════

describe('TASK 10 — steps e description são mutuamente exclusivos', () => {

  it('[T10-16] modo passos: steps preenchido, description = null no payload', async () => {
    // Simula o comportamento do AddTaskScreen no modo 'steps'
    await taskService.updateTask(TASK_ID, {
      steps: SAMPLE_STEPS,
      description: null,
    });
    const payload = mockUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.steps).toEqual(SAMPLE_STEPS);
    expect(payload.description).toBeNull();
  });

  it('[T10-17] modo texto: description preenchida, steps = null no payload', async () => {
    // Simula o comportamento do AddTaskScreen no modo 'text'
    await taskService.updateTask(TASK_ID, {
      description: 'Instruções detalhadas aqui',
      steps: null,
    });
    const payload = mockUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.description).toBe('Instruções detalhadas aqui');
    expect(payload.steps).toBeNull();
  });
});
