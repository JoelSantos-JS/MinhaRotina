/**
 * TASK 9 — Bateria de testes: upload de foto de tarefa (taskService → Supabase Storage)
 *
 * Cobre toda a cadeia de foto de tarefa:
 *   uploadTaskPhoto  →  compressImage + base64ToUint8Array + storage.upload + getPublicUrl
 *   updateTaskPhoto  →  supabase.from('tasks').update({ photo_url })
 *   createTask       →  comportamento com e sem photoLocalUri
 *   updateTask       →  troca de foto, remoção e ausência de alteração
 *
 * [T9-01] uploadTaskPhoto chama compressImage com o localUri correto
 * [T9-02] uploadTaskPhoto chama base64ToUint8Array com o base64 retornado por compressImage
 * [T9-03] uploadTaskPhoto faz upload para o bucket 'task-photos'
 * [T9-04] uploadTaskPhoto usa o path correto: '{taskId}.jpg'
 * [T9-05] uploadTaskPhoto envia os bytes corretos e as opções de contentType/upsert
 * [T9-06] uploadTaskPhoto retorna a URL pública gerada por getPublicUrl
 * [T9-07] uploadTaskPhoto lança erro quando o upload no Storage falha
 * [T9-08] updateTaskPhoto atualiza a tabela 'tasks' com o photo_url correto
 * [T9-09] updateTaskPhoto filtra pelo taskId correto
 * [T9-10] updateTaskPhoto aceita null para remover a foto
 * [T9-11] updateTaskPhoto lança erro quando Supabase falha
 * [T9-12] createTask sem photoLocalUri não chama uploadTaskPhoto
 * [T9-13] createTask sem photoLocalUri não chama updateTaskPhoto
 * [T9-14] createTask sem photoLocalUri retorna task sem photo_url alterada
 * [T9-15] createTask com photoLocalUri chama uploadTaskPhoto com (task.id, localUri)
 * [T9-16] createTask com photoLocalUri chama updateTaskPhoto com (task.id, publicUrl)
 * [T9-17] createTask com photoLocalUri retorna task com photo_url = publicUrl
 * [T9-18] createTask com photoLocalUri — falha no upload propaga o erro
 * [T9-19] updateTask com nova foto chama uploadTaskPhoto com (taskId, localUri)
 * [T9-20] updateTask com nova foto chama updateTaskPhoto com (taskId, publicUrl)
 * [T9-21] updateTask com nova foto retorna task com photo_url atualizada
 * [T9-22] updateTask com photoLocalUri = null chama updateTaskPhoto(taskId, null)
 * [T9-23] updateTask com photoLocalUri = null retorna task com photo_url = null
 * [T9-24] updateTask sem campo photoLocalUri (undefined) não chama uploadTaskPhoto
 * [T9-25] updateTask sem campo photoLocalUri (undefined) não chama updateTaskPhoto
 * [T9-26] updateTask com nova foto — falha no upload propaga o erro
 */

import { taskService } from '../services/routine.service';
import { compressImage, base64ToUint8Array } from '../utils/imageUtils';
import type { Task } from '../types/models';

// ── Constantes de teste ───────────────────────────────────────────────────────

const TASK_ID    = 'task-uuid-abc';
const ROUTINE_ID = 'routine-uuid-xyz';
const LOCAL_URI  = 'file:///data/user/0/com.minha_rotina/cache/IMG_20240101.jpg';
const SIGNED_URL = 'https://odgiljvvmglmmncbbupl.supabase.co/storage/v1/object/sign/task-photos/task-uuid-abc.jpg?token=abc';
const STORAGE_REF = 'storage://task-photos/task-uuid-abc.jpg';
const B64        = 'aGVsbG8gd29ybGQ=';
const BYTES      = new Uint8Array([104, 101, 108, 108, 111]);

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
  video_url:          null,
  routines_config:    null,
  created_at:         '2024-01-01T00:00:00Z',
  updated_at:         '2024-01-01T00:00:00Z',
};

// ── Mocks: supabase ───────────────────────────────────────────────────────────

const mockStorageUpload      = jest.fn();
const mockStorageCreateSignedUrl = jest.fn();
const mockStorageBucket = {
  upload:       mockStorageUpload,
  createSignedUrl: mockStorageCreateSignedUrl,
};
const mockStorageFrom = jest.fn().mockReturnValue(mockStorageBucket);

// DB chain — todos os métodos retornam o próprio chain, exceto single() que é Promise
const mockSingle = jest.fn();
const mockEq     = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockInsert = jest.fn();
const dbChain    = { insert: mockInsert, update: mockUpdate, select: mockSelect, eq: mockEq, single: mockSingle };
mockInsert.mockReturnValue(dbChain);
mockUpdate.mockReturnValue(dbChain);
mockSelect.mockReturnValue(dbChain);
mockEq.mockReturnValue(dbChain);

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

// ── Setup padrão ──────────────────────────────────────────────────────────────
// NOTA: clearAllMocks() não apaga implementações (mockReturnValue/mockResolvedValue),
// por isso re-estabelecemos o chain completo aqui para isolar cada grupo de testes.

beforeEach(() => {
  jest.clearAllMocks();

  // Re-estabelece o chain do DB (pode ter sido sobrescrito por grupos anteriores)
  mockInsert.mockReturnValue(dbChain);
  mockUpdate.mockReturnValue(dbChain);
  mockSelect.mockReturnValue(dbChain);
  mockEq.mockReturnValue(dbChain);
  mockSingle.mockResolvedValue({ data: { ...BASE_TASK }, error: null });

  // Storage defaults (happy path)
  mockStorageUpload.mockResolvedValue({ error: null });
  mockStorageCreateSignedUrl.mockResolvedValue({ data: { signedUrl: SIGNED_URL }, error: null });

  // imageUtils defaults
  mockCompress.mockResolvedValue({ uri: LOCAL_URI, base64: B64 });
  mockToBytes.mockReturnValue(BYTES);
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 1 — uploadTaskPhoto
// ═════════════════════════════════════════════════════════════════════════════

describe('TASK 9 — uploadTaskPhoto: pipeline de compressão e envio', () => {

  it('[T9-01] chama compressImage com o localUri correto', async () => {
    await taskService.uploadTaskPhoto(TASK_ID, LOCAL_URI);
    expect(mockCompress).toHaveBeenCalledWith(LOCAL_URI);
  });

  it('[T9-02] chama base64ToUint8Array com o base64 retornado por compressImage', async () => {
    await taskService.uploadTaskPhoto(TASK_ID, LOCAL_URI);
    expect(mockToBytes).toHaveBeenCalledWith(B64);
  });

  it('[T9-03] acessa o bucket "task-photos"', async () => {
    await taskService.uploadTaskPhoto(TASK_ID, LOCAL_URI);
    expect(mockStorageFrom).toHaveBeenCalledWith('task-photos');
  });

  it('[T9-04] usa o path correto: "{taskId}.jpg"', async () => {
    await taskService.uploadTaskPhoto(TASK_ID, LOCAL_URI);
    expect(mockStorageUpload).toHaveBeenCalledWith(
      `${TASK_ID}.jpg`,
      expect.anything(),
      expect.anything()
    );
  });

  it('[T9-05] envia os bytes e opções corretas (contentType image/jpeg, upsert true)', async () => {
    await taskService.uploadTaskPhoto(TASK_ID, LOCAL_URI);
    expect(mockStorageUpload).toHaveBeenCalledWith(
      expect.any(String),
      BYTES,
      { contentType: 'image/jpeg', upsert: true }
    );
  });

  it('[T9-06] retorna a URL pública gerada por getPublicUrl', async () => {
    const url = await taskService.uploadTaskPhoto(TASK_ID, LOCAL_URI);
    expect(url).toBe(SIGNED_URL);
  });

  it('[T9-07] lança erro quando o upload no Storage falha', async () => {
    mockStorageUpload.mockResolvedValueOnce({ error: { message: 'Bucket not found' } });
    await expect(taskService.uploadTaskPhoto(TASK_ID, LOCAL_URI)).rejects.toMatchObject({
      message: 'Bucket not found',
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 2 — updateTaskPhoto
// ═════════════════════════════════════════════════════════════════════════════

describe('TASK 9 — updateTaskPhoto: persistência do photo_url', () => {

  beforeEach(() => {
    // updateTaskPhoto encerra a chain em .eq() (sem .select()/.single())
    // Então mockEq precisa retornar uma Promise com { error }
    mockEq.mockResolvedValue({ error: null });
  });

  it('[T9-08] atualiza a tabela "tasks" com o photo_url correto', async () => {
    await taskService.updateTaskPhoto(TASK_ID, SIGNED_URL);
    expect(mockFrom).toHaveBeenCalledWith('tasks');
    expect(mockUpdate).toHaveBeenCalledWith({ photo_url: STORAGE_REF });
  });

  it('[T9-09] filtra pelo taskId correto via .eq("id", taskId)', async () => {
    await taskService.updateTaskPhoto(TASK_ID, SIGNED_URL);
    expect(mockEq).toHaveBeenCalledWith('id', TASK_ID);
  });

  it('[T9-10] aceita null para remover a foto', async () => {
    await taskService.updateTaskPhoto(TASK_ID, null);
    expect(mockUpdate).toHaveBeenCalledWith({ photo_url: null });
  });

  it('[T9-11] lança erro quando Supabase falha', async () => {
    mockEq.mockResolvedValueOnce({ error: { message: 'RLS policy denied' } });
    await expect(taskService.updateTaskPhoto(TASK_ID, SIGNED_URL)).rejects.toMatchObject({
      message: 'RLS policy denied',
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 3 — createTask: comportamento com e sem foto
// ═════════════════════════════════════════════════════════════════════════════

describe('TASK 9 — createTask: fluxo de foto', () => {

  let spyUpload: jest.SpyInstance;
  let spyUpdate: jest.SpyInstance;

  beforeEach(() => {
    spyUpload = jest
      .spyOn(taskService, 'uploadTaskPhoto')
      .mockResolvedValue(SIGNED_URL);
    spyUpdate = jest
      .spyOn(taskService, 'updateTaskPhoto')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    spyUpload.mockRestore();
    spyUpdate.mockRestore();
  });

  // ── Sem foto ────────────────────────────────────────────────────────────

  it('[T9-12] sem photoLocalUri → uploadTaskPhoto NÃO é chamado', async () => {
    await taskService.createTask(ROUTINE_ID, 'Escovar', '🦷', 0, {});
    expect(spyUpload).not.toHaveBeenCalled();
  });

  it('[T9-13] sem photoLocalUri → updateTaskPhoto NÃO é chamado', async () => {
    await taskService.createTask(ROUTINE_ID, 'Escovar', '🦷', 0, {});
    expect(spyUpdate).not.toHaveBeenCalled();
  });

  it('[T9-14] sem photoLocalUri → task retornada tem photo_url null/undefined (igual ao DB)', async () => {
    const task = await taskService.createTask(ROUTINE_ID, 'Escovar', '🦷', 0, {});
    expect(task.photo_url ?? null).toBeNull();
  });

  // ── Com foto ────────────────────────────────────────────────────────────

  it('[T9-15] com photoLocalUri → uploadTaskPhoto é chamado com (task.id, localUri)', async () => {
    await taskService.createTask(ROUTINE_ID, 'Escovar', '🦷', 0, { photoLocalUri: LOCAL_URI });
    expect(spyUpload).toHaveBeenCalledWith(TASK_ID, LOCAL_URI);
  });

  it('[T9-16] com photoLocalUri → updateTaskPhoto é chamado com (task.id, publicUrl)', async () => {
    await taskService.createTask(ROUTINE_ID, 'Escovar', '🦷', 0, { photoLocalUri: LOCAL_URI });
    expect(spyUpdate).toHaveBeenCalledWith(TASK_ID, SIGNED_URL);
  });

  it('[T9-17] com photoLocalUri → task retornada tem photo_url = publicUrl', async () => {
    const task = await taskService.createTask(ROUTINE_ID, 'Escovar', '🦷', 0, { photoLocalUri: LOCAL_URI });
    expect(task.photo_url).toBe(SIGNED_URL);
  });

  it('[T9-18] com photoLocalUri — falha no upload propaga o erro', async () => {
    spyUpload.mockRejectedValueOnce(new Error('Storage bucket not found'));
    await expect(
      taskService.createTask(ROUTINE_ID, 'Escovar', '🦷', 0, { photoLocalUri: LOCAL_URI })
    ).rejects.toThrow('Storage bucket not found');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 4 — updateTask: troca, remoção e ausência de alteração de foto
// ═════════════════════════════════════════════════════════════════════════════

describe('TASK 9 — updateTask: fluxo de foto', () => {

  let spyUpload: jest.SpyInstance;
  let spyUpdate: jest.SpyInstance;

  beforeEach(() => {
    spyUpload = jest
      .spyOn(taskService, 'uploadTaskPhoto')
      .mockResolvedValue(SIGNED_URL);
    spyUpdate = jest
      .spyOn(taskService, 'updateTaskPhoto')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    spyUpload.mockRestore();
    spyUpdate.mockRestore();
  });

  // ── Troca de foto ───────────────────────────────────────────────────────

  it('[T9-19] nova foto → uploadTaskPhoto chamado com (taskId, localUri)', async () => {
    await taskService.updateTask(TASK_ID, { photoLocalUri: LOCAL_URI });
    expect(spyUpload).toHaveBeenCalledWith(TASK_ID, LOCAL_URI);
  });

  it('[T9-20] nova foto → updateTaskPhoto chamado com (taskId, publicUrl)', async () => {
    await taskService.updateTask(TASK_ID, { photoLocalUri: LOCAL_URI });
    expect(spyUpdate).toHaveBeenCalledWith(TASK_ID, SIGNED_URL);
  });

  it('[T9-21] nova foto → task retornada tem photo_url atualizada', async () => {
    const task = await taskService.updateTask(TASK_ID, { photoLocalUri: LOCAL_URI });
    expect(task.photo_url).toBe(SIGNED_URL);
  });

  // ── Remoção de foto ─────────────────────────────────────────────────────

  it('[T9-22] photoLocalUri = null → updateTaskPhoto chamado com null', async () => {
    await taskService.updateTask(TASK_ID, { photoLocalUri: null });
    expect(spyUpdate).toHaveBeenCalledWith(TASK_ID, null);
  });

  it('[T9-23] photoLocalUri = null → task retornada tem photo_url = null', async () => {
    const task = await taskService.updateTask(TASK_ID, { photoLocalUri: null });
    expect(task.photo_url).toBeNull();
  });

  it('[T9-23b] photoLocalUri = null → uploadTaskPhoto NÃO é chamado', async () => {
    await taskService.updateTask(TASK_ID, { photoLocalUri: null });
    expect(spyUpload).not.toHaveBeenCalled();
  });

  // ── Sem alteração de foto ───────────────────────────────────────────────

  it('[T9-24] sem campo photoLocalUri (undefined) → uploadTaskPhoto NÃO é chamado', async () => {
    await taskService.updateTask(TASK_ID, { name: 'Novo nome' });
    expect(spyUpload).not.toHaveBeenCalled();
  });

  it('[T9-25] sem campo photoLocalUri (undefined) → updateTaskPhoto NÃO é chamado', async () => {
    await taskService.updateTask(TASK_ID, { name: 'Novo nome' });
    expect(spyUpdate).not.toHaveBeenCalled();
  });

  // ── Erro no upload ──────────────────────────────────────────────────────

  it('[T9-26] nova foto — falha no upload propaga o erro', async () => {
    spyUpload.mockRejectedValueOnce(new Error('Upload failed: 403 Forbidden'));
    await expect(
      taskService.updateTask(TASK_ID, { photoLocalUri: LOCAL_URI })
    ).rejects.toThrow('Upload failed: 403 Forbidden');
  });
});
