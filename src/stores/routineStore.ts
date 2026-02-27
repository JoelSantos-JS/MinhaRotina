import { create } from 'zustand';
import type { Routine, Task } from '../types/models';
import { routineService, taskService } from '../services/routine.service';

interface RoutineState {
  routines: Routine[];
  tasks: Task[];
  currentTaskIndex: number;
  isLoading: boolean;
  fetchError: string | null;
  fetchRoutines: (childId: string) => Promise<void>;
  fetchTasks: (routineId: string) => Promise<void>;
  addRoutine: (routine: Routine) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  nextTask: () => void;
  resetProgress: () => void;
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  routines: [],
  tasks: [],
  currentTaskIndex: 0,
  isLoading: false,
  fetchError: null,

  fetchRoutines: async (childId: string) => {
    set({ isLoading: true, fetchError: null });
    try {
      const routines = await routineService.getRoutinesByChild(childId);
      set({ routines, isLoading: false });
    } catch (e: unknown) {
      set({ isLoading: false, fetchError: e instanceof Error ? e.message : 'Erro ao carregar rotinas' });
    }
  },

  fetchTasks: async (routineId: string) => {
    set({ isLoading: true, fetchError: null });
    try {
      const tasks = await taskService.getTasksByRoutine(routineId);
      set({ tasks: [...tasks].sort((a, b) => a.order_index - b.order_index), currentTaskIndex: 0, isLoading: false });
    } catch (e: unknown) {
      set({ isLoading: false, fetchError: e instanceof Error ? e.message : 'Erro ao carregar tarefas' });
    }
  },

  addRoutine: (routine) =>
    set((state) => ({ routines: [...state.routines, routine] })),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task].sort((a, b) => a.order_index - b.order_index),
    })),

  updateTask: (updated) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === updated.id ? updated : t)),
    })),

  removeTask: (taskId) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) })),

  nextTask: () =>
    set((state) => ({ currentTaskIndex: state.currentTaskIndex + 1 })),

  resetProgress: () => set({ currentTaskIndex: 0 }),
}));
