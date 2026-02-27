import { create } from 'zustand';
import type { ParentAccount, ChildAccount } from '../types/models';

interface AuthState {
  parent: ParentAccount | null;
  child: ChildAccount | null;
  isLoading: boolean;
  setParent: (parent: ParentAccount | null) => void;
  setChild: (child: ChildAccount | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  parent: null,
  child: null,
  isLoading: true,
  setParent: (parent) => set({ parent, child: null }),
  setChild: (child) => set({ child }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ parent: null, child: null }),
}));
