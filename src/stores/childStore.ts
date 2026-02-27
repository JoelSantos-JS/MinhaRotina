import { create } from 'zustand';
import type { ChildAccount } from '../types/models';
import { childService } from '../services/child.service';

interface ChildState {
  children: ChildAccount[];
  selectedChild: ChildAccount | null;
  isLoading: boolean;
  fetchChildren: (parentId: string) => Promise<void>;
  setSelectedChild: (child: ChildAccount | null) => void;
  addChild: (child: ChildAccount) => void;
  updateChild: (child: ChildAccount) => void;
  removeChild: (childId: string) => void;
}

export const useChildStore = create<ChildState>((set) => ({
  children: [],
  selectedChild: null,
  isLoading: false,

  fetchChildren: async (parentId: string) => {
    set({ isLoading: true });
    try {
      const children = await childService.getChildrenByParent(parentId);
      set({ children, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setSelectedChild: (child) => set({ selectedChild: child }),

  addChild: (child) =>
    set((state) => ({ children: [...state.children, child] })),

  updateChild: (child) =>
    set((state) => ({
      children: state.children.map((c) => (c.id === child.id ? child : c)),
    })),

  removeChild: (childId) =>
    set((state) => ({
      children: state.children.filter((c) => c.id !== childId),
    })),
}));
