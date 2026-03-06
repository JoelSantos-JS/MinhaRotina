/**
 * TASK 5 — Bateria de testes: FAB (Floating Action Button) para pais
 *
 * [T5-01] FAB_ACTIONS é um array
 * [T5-02] FAB_ACTIONS tem exatamente 4 ações
 * [T5-03] todos os ids são únicos
 * [T5-04] todos os emojis são strings não vazias
 * [T5-05] todos os labels são strings não vazias
 * [T5-06] todos os tabs são valores válidos de ParentTabParamList
 * [T5-07] não há tabs repetidos entre as ações
 * [T5-08] cada ação tem as propriedades obrigatórias (id, emoji, label, tab)
 * [T5-09] VALID_TABS contém exatamente os 6 tabs da app
 * [T5-10] todos os tabs das ações estão em VALID_TABS
 * [T5-11] getActionById retorna a ação correta por id
 * [T5-12] getActionById retorna undefined para id inexistente
 * [T5-13] getActionByTab retorna a ação correta por tab
 * [T5-14] getActionByTab retorna undefined para tab sem ação mapeada
 * [T5-15] primeira ação (rotinas) aponta para tab Filhos
 */

import {
  FAB_ACTIONS,
  VALID_TABS,
  getActionById,
  getActionByTab,
  type FabAction,
} from '../utils/fabActions';

const EXPECTED_TABS = ['Resumo', 'Filhos', 'Diario', 'Biblioteca', 'Ajustes', 'Ajuda'] as const;

describe('TASK 5 — fabActions', () => {

  // ── FAB_ACTIONS array ────────────────────────────────────────────────────────

  it('[T5-01] FAB_ACTIONS é um array', () => {
    expect(Array.isArray(FAB_ACTIONS)).toBe(true);
  });

  it('[T5-02] FAB_ACTIONS tem exatamente 4 ações', () => {
    expect(FAB_ACTIONS).toHaveLength(4);
  });

  it('[T5-03] todos os ids são únicos', () => {
    const ids = FAB_ACTIONS.map((a) => a.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('[T5-04] todos os emojis são strings não vazias', () => {
    FAB_ACTIONS.forEach((action) => {
      expect(typeof action.emoji).toBe('string');
      expect(action.emoji.trim().length).toBeGreaterThan(0);
    });
  });

  it('[T5-05] todos os labels são strings não vazias', () => {
    FAB_ACTIONS.forEach((action) => {
      expect(typeof action.label).toBe('string');
      expect(action.label.trim().length).toBeGreaterThan(0);
    });
  });

  it('[T5-06] todos os tabs são valores válidos de ParentTabParamList', () => {
    FAB_ACTIONS.forEach((action) => {
      expect(EXPECTED_TABS).toContain(action.tab);
    });
  });

  it('[T5-07] não há tabs repetidos entre as ações', () => {
    const tabs = FAB_ACTIONS.map((a) => a.tab);
    const unique = new Set(tabs);
    expect(unique.size).toBe(tabs.length);
  });

  it('[T5-08] cada ação tem as propriedades obrigatórias (id, emoji, label, tab)', () => {
    FAB_ACTIONS.forEach((action: FabAction) => {
      expect(action).toHaveProperty('id');
      expect(action).toHaveProperty('emoji');
      expect(action).toHaveProperty('label');
      expect(action).toHaveProperty('tab');
    });
  });

  // ── VALID_TABS ───────────────────────────────────────────────────────────────

  it('[T5-09] VALID_TABS contém exatamente os 6 tabs da app', () => {
    expect(VALID_TABS.size).toBe(6);
    EXPECTED_TABS.forEach((tab) => {
      expect(VALID_TABS.has(tab)).toBe(true);
    });
  });

  it('[T5-10] todos os tabs das ações estão em VALID_TABS', () => {
    FAB_ACTIONS.forEach((action) => {
      expect(VALID_TABS.has(action.tab)).toBe(true);
    });
  });

  // ── getActionById ────────────────────────────────────────────────────────────

  it('[T5-11] getActionById retorna a ação correta por id', () => {
    const action = getActionById('routines');
    expect(action).toBeDefined();
    expect(action?.id).toBe('routines');
    expect(action?.tab).toBe('Filhos');
  });

  it('[T5-12] getActionById retorna undefined para id inexistente', () => {
    expect(getActionById('nao-existe')).toBeUndefined();
    expect(getActionById('')).toBeUndefined();
  });

  // ── getActionByTab ───────────────────────────────────────────────────────────

  it('[T5-13] getActionByTab retorna a ação correta por tab', () => {
    const action = getActionByTab('Biblioteca');
    expect(action).toBeDefined();
    expect(action?.id).toBe('library');
    expect(action?.emoji).toBe('💡');
  });

  it('[T5-14] getActionByTab retorna undefined para tab sem ação mapeada', () => {
    expect(getActionByTab('Resumo')).toBeUndefined();
    expect(getActionByTab('Ajuda')).toBeUndefined();
  });

  // ── Verificações específicas ─────────────────────────────────────────────────

  it('[T5-15] primeira ação (rotinas) aponta para tab Filhos', () => {
    const first = FAB_ACTIONS[0];
    expect(first.id).toBe('routines');
    expect(first.tab).toBe('Filhos');
  });
});
