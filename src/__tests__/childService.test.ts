// jest.mock é hoistado — não pode referenciar variáveis externas dentro da factory.
// Usamos a factory simples e configuramos o mock dentro de cada teste.
jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('../utils/pinUtils', () => ({
  hashPin: jest.fn(async (pin: string) => `hashed_${pin}`),
  verifyPin: jest.fn(async (pin: string, hash: string) => hash === `hashed_${pin}`),
  generateRandomPin: jest.fn(() => '5678'),
}));

import { childService } from '../services/child.service';
import { supabase } from '../config/supabase';
import { hashPin } from '../utils/pinUtils';

const mockFrom = supabase.from as jest.Mock;

/** Configura supabase.from para simular uma lista de filhos. */
function setupGetChildren(children: any[]) {
  mockFrom.mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: children, error: null }),
      }),
    }),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  });
}

/** Configura supabase.from para simular insert bem-sucedido após getChildren vazio. */
function setupInsertSuccess(child: any) {
  let callCount = 0;
  mockFrom.mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // getChildrenByParent → sem irmãos
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      };
    }
    // insert
    return {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: child, error: null }),
        }),
      }),
    };
  });
}

beforeEach(() => jest.clearAllMocks());

// ─── Validação de PIN ─────────────────────────────────────────────────────────

describe('childService — validação de PIN', () => {
  it('lança erro para PIN com letras', async () => {
    await expect(
      childService.createChild('p1', { name: 'Ana', age: 5, pin: 'abcd' })
    ).rejects.toThrow(/d[ií]gito/i);
  });

  it('lança erro para PIN com menos de 4 dígitos', async () => {
    await expect(
      childService.createChild('p1', { name: 'Ana', age: 5, pin: '123' })
    ).rejects.toThrow(/d[ií]gito/i);
  });

  it('lança erro para PIN com mais de 4 dígitos', async () => {
    await expect(
      childService.createChild('p1', { name: 'Ana', age: 5, pin: '12345' })
    ).rejects.toThrow(/d[ií]gito/i);
  });

  it('lança erro para PIN vazio', async () => {
    await expect(
      childService.createChild('p1', { name: 'Ana', age: 5, pin: '' })
    ).rejects.toThrow(/d[ií]gito/i);
  });

  it('aceita PIN numérico de 4 dígitos e cria o filho', async () => {
    const fakeChild = { id: 'c1', name: 'Ana', age: 5, pin_hash: 'hashed_1234', access_pin: '1234' };
    setupInsertSuccess(fakeChild);
    const result = await childService.createChild('p1', { name: 'Ana', age: 5, pin: '1234' });
    expect(result.id).toBe('c1');
  });
});

// ─── isPinUsedBySibling ───────────────────────────────────────────────────────

describe('childService — isPinUsedBySibling', () => {
  it('retorna false quando não há irmãos', async () => {
    setupGetChildren([]);
    expect(await childService.isPinUsedBySibling('p1', '1234')).toBe(false);
  });

  it('retorna true quando irmão usa o mesmo PIN', async () => {
    setupGetChildren([{ id: 'c-existing', pin_hash: 'hashed_1234', name: 'Pedro' }]);
    expect(await childService.isPinUsedBySibling('p1', '1234')).toBe(true);
  });

  it('retorna false para PIN diferente do irmão', async () => {
    setupGetChildren([{ id: 'c-other', pin_hash: 'hashed_9999', name: 'Pedro' }]);
    expect(await childService.isPinUsedBySibling('p1', '1234')).toBe(false);
  });

  it('ignora o próprio filho ao verificar duplicata (edição)', async () => {
    setupGetChildren([{ id: 'c-me', pin_hash: 'hashed_1234', name: 'Ana' }]);
    expect(await childService.isPinUsedBySibling('p1', '1234', 'c-me')).toBe(false);
  });
});

// ─── updateChild ─────────────────────────────────────────────────────────────

describe('childService — updateChild', () => {
  it('lança erro para PIN inválido no update', async () => {
    await expect(
      childService.updateChild('c1', { pin: '99' })
    ).rejects.toThrow(/d[ií]gito/i);
  });

  it('chama hashPin ao atualizar o PIN', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // isPinUsedBySibling → getChildrenByParent → sem irmãos
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      // update
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'c1', name: 'Ana', pin_hash: 'hashed_5678' },
                error: null,
              }),
            }),
          }),
        }),
      };
    });

    await childService.updateChild('c1', { pin: '5678' }, 'p1');
    expect(hashPin).toHaveBeenCalledWith('5678');
  });
});
