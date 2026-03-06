// Mock simples do Supabase para testes do service.
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

jest.mock('../utils/pinUtils', () => ({
  generateRandomPin: jest.fn(() => '5678'),
}));

import { childService } from '../services/child.service';
import { supabase } from '../config/supabase';

const mockFrom = supabase.from as jest.Mock;
const mockRpc = supabase.rpc as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

function setupInsertSuccess(child: any) {
  mockFrom.mockReturnValue({
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: child, error: null }),
      }),
    }),
    update: jest.fn(),
    delete: jest.fn(),
    select: jest.fn(),
  });
}

describe('childService - validacao de PIN', () => {
  it('lanca erro para PIN com letras', async () => {
    await expect(
      childService.createChild('p1', { name: 'Ana', age: 5, pin: 'abcd' })
    ).rejects.toThrow(/digitos/i);
  });

  it('lanca erro para PIN com menos de 4 digitos', async () => {
    await expect(
      childService.createChild('p1', { name: 'Ana', age: 5, pin: '123' })
    ).rejects.toThrow(/digitos/i);
  });

  it('lanca erro para PIN com mais de 4 digitos', async () => {
    await expect(
      childService.createChild('p1', { name: 'Ana', age: 5, pin: '12345' })
    ).rejects.toThrow(/digitos/i);
  });

  it('aceita PIN numerico de 4 digitos e cria o filho com hash seguro', async () => {
    const fakeChild = { id: 'c1', name: 'Ana', age: 5, pin_hash: '$2b$10$abc' };

    mockRpc
      .mockResolvedValueOnce({ data: false, error: null })
      .mockResolvedValueOnce({ data: '$2b$10$abc', error: null });

    setupInsertSuccess(fakeChild);

    const result = await childService.createChild('p1', { name: 'Ana', age: 5, pin: '1234' });

    expect(result.id).toBe('c1');
    expect(mockRpc).toHaveBeenNthCalledWith(1, 'is_sibling_pin_in_use', {
      p_parent_id: 'p1',
      p_pin: '1234',
      p_exclude_child_id: null,
    });
    expect(mockRpc).toHaveBeenNthCalledWith(2, 'hash_pin_secure', { p_pin: '1234' });
  });
});

describe('childService - isPinUsedBySibling', () => {
  it('retorna false quando RPC retorna false', async () => {
    mockRpc.mockResolvedValueOnce({ data: false, error: null });
    expect(await childService.isPinUsedBySibling('p1', '1234')).toBe(false);
  });

  it('retorna true quando RPC retorna true', async () => {
    mockRpc.mockResolvedValueOnce({ data: true, error: null });
    expect(await childService.isPinUsedBySibling('p1', '1234')).toBe(true);
  });

  it('passa excludeChildId quando informado', async () => {
    mockRpc.mockResolvedValueOnce({ data: false, error: null });
    await childService.isPinUsedBySibling('p1', '1234', 'c1');
    expect(mockRpc).toHaveBeenCalledWith('is_sibling_pin_in_use', {
      p_parent_id: 'p1',
      p_pin: '1234',
      p_exclude_child_id: 'c1',
    });
  });
});

describe('childService - updateChild', () => {
  it('lanca erro para PIN invalido no update', async () => {
    await expect(childService.updateChild('c1', { pin: '99' })).rejects.toThrow(/digitos/i);
  });

  it('usa hash seguro e salva no update quando PIN e alterado', async () => {
    mockRpc
      .mockResolvedValueOnce({ data: false, error: null })
      .mockResolvedValueOnce({ data: '$2b$10$hash5678', error: null });

    mockFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'c1', name: 'Ana', pin_hash: '$2b$10$hash5678' },
              error: null,
            }),
          }),
        }),
      }),
      insert: jest.fn(),
      delete: jest.fn(),
      select: jest.fn(),
    });

    await childService.updateChild('c1', { pin: '5678' }, 'p1');

    expect(mockRpc).toHaveBeenNthCalledWith(1, 'is_sibling_pin_in_use', {
      p_parent_id: 'p1',
      p_pin: '5678',
      p_exclude_child_id: 'c1',
    });
    expect(mockRpc).toHaveBeenNthCalledWith(2, 'hash_pin_secure', { p_pin: '5678' });
  });
});