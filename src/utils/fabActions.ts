import type { ParentTabParamList } from '../types/navigation';

export type FabAction = {
  id: string;
  emoji: string;
  label: string;
  tab: keyof ParentTabParamList;
};

export const FAB_ACTIONS: FabAction[] = [
  { id: 'routines', emoji: '📝', label: 'Rotinas',      tab: 'Filhos'     },
  { id: 'library',  emoji: '💡', label: 'Estratégias',  tab: 'Biblioteca' },
  { id: 'diary',    emoji: '📖', label: 'Diário',       tab: 'Diario'     },
  { id: 'settings', emoji: '⚙️', label: 'Ajustes',      tab: 'Ajustes'    },
];

export const VALID_TABS = new Set<keyof ParentTabParamList>([
  'Resumo', 'Filhos', 'Diario', 'Biblioteca', 'Ajustes', 'Ajuda',
]);

export function getActionById(id: string): FabAction | undefined {
  return FAB_ACTIONS.find((a) => a.id === id);
}

export function getActionByTab(tab: keyof ParentTabParamList): FabAction | undefined {
  return FAB_ACTIONS.find((a) => a.tab === tab);
}
