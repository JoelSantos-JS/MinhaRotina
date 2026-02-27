// Mock dos services antes de importar a store
jest.mock('../services/routine.service', () => ({
  routineService: {
    getRoutinesByChild: jest.fn(),
  },
  taskService: {
    getTasksByRoutine: jest.fn(),
  },
}));

import { useRoutineStore } from '../stores/routineStore';
import { routineService, taskService } from '../services/routine.service';
import type { Routine, Task } from '../types/models';

// Helpers para criar objetos de teste
const makeRoutine = (overrides?: Partial<Routine>): Routine => ({
  id: 'r1',
  child_id: 'c1',
  name: 'Rotina Manhã',
  type: 'morning',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const makeTask = (overrides?: Partial<Task>): Task => ({
  id: 't1',
  routine_id: 'r1',
  name: 'Escovar os dentes',
  icon_emoji: '🦷',
  order_index: 0,
  estimated_minutes: 5,
  has_sensory_issues: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Reseta a store antes de cada teste
beforeEach(() => {
  useRoutineStore.setState({
    routines: [],
    tasks: [],
    currentTaskIndex: 0,
    isLoading: false,
    fetchError: null,
  });
  jest.clearAllMocks();
});

// ─── Estado inicial ───────────────────────────────────────────────────────────

describe('routineStore — estado inicial', () => {
  it('inicia com listas vazias e sem erro', () => {
    const state = useRoutineStore.getState();
    expect(state.routines).toEqual([]);
    expect(state.tasks).toEqual([]);
    expect(state.currentTaskIndex).toBe(0);
    expect(state.isLoading).toBe(false);
    expect(state.fetchError).toBeNull();
  });
});

// ─── addRoutine ───────────────────────────────────────────────────────────────

describe('routineStore — addRoutine', () => {
  it('adiciona uma rotina à lista', () => {
    useRoutineStore.getState().addRoutine(makeRoutine());
    expect(useRoutineStore.getState().routines).toHaveLength(1);
    expect(useRoutineStore.getState().routines[0].name).toBe('Rotina Manhã');
  });

  it('adiciona múltiplas rotinas', () => {
    useRoutineStore.getState().addRoutine(makeRoutine({ id: 'r1', name: 'Manhã' }));
    useRoutineStore.getState().addRoutine(makeRoutine({ id: 'r2', name: 'Noite' }));
    expect(useRoutineStore.getState().routines).toHaveLength(2);
  });
});

// ─── addTask ─────────────────────────────────────────────────────────────────

describe('routineStore — addTask', () => {
  it('adiciona uma tarefa à lista', () => {
    useRoutineStore.getState().addTask(makeTask());
    expect(useRoutineStore.getState().tasks).toHaveLength(1);
  });

  it('ordena tarefas por order_index automaticamente', () => {
    useRoutineStore.getState().addTask(makeTask({ id: 't2', order_index: 2, name: 'Última' }));
    useRoutineStore.getState().addTask(makeTask({ id: 't0', order_index: 0, name: 'Primeira' }));
    useRoutineStore.getState().addTask(makeTask({ id: 't1', order_index: 1, name: 'Segunda' }));

    const tasks = useRoutineStore.getState().tasks;
    expect(tasks[0].name).toBe('Primeira');
    expect(tasks[1].name).toBe('Segunda');
    expect(tasks[2].name).toBe('Última');
  });
});

// ─── updateTask ───────────────────────────────────────────────────────────────

describe('routineStore — updateTask', () => {
  it('atualiza uma tarefa existente pelo id', () => {
    useRoutineStore.getState().addTask(makeTask({ id: 't1', name: 'Original' }));
    useRoutineStore.getState().updateTask(makeTask({ id: 't1', name: 'Atualizada' }));

    const tasks = useRoutineStore.getState().tasks;
    expect(tasks[0].name).toBe('Atualizada');
  });

  it('não altera tarefas com id diferente', () => {
    useRoutineStore.getState().addTask(makeTask({ id: 't1', name: 'Tarefa 1' }));
    useRoutineStore.getState().addTask(makeTask({ id: 't2', name: 'Tarefa 2' }));
    useRoutineStore.getState().updateTask(makeTask({ id: 't1', name: 'Tarefa 1 Editada' }));

    const tasks = useRoutineStore.getState().tasks;
    const unchanged = tasks.find((t) => t.id === 't2');
    expect(unchanged?.name).toBe('Tarefa 2');
  });
});

// ─── removeTask ───────────────────────────────────────────────────────────────

describe('routineStore — removeTask', () => {
  it('remove uma tarefa pelo id', () => {
    useRoutineStore.getState().addTask(makeTask({ id: 't1' }));
    useRoutineStore.getState().addTask(makeTask({ id: 't2', order_index: 1 }));
    useRoutineStore.getState().removeTask('t1');

    const tasks = useRoutineStore.getState().tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('t2');
  });

  it('não altera lista quando id não existe', () => {
    useRoutineStore.getState().addTask(makeTask({ id: 't1' }));
    useRoutineStore.getState().removeTask('id-inexistente');
    expect(useRoutineStore.getState().tasks).toHaveLength(1);
  });
});

// ─── nextTask / resetProgress ─────────────────────────────────────────────────

describe('routineStore — navegação de tarefas', () => {
  it('nextTask incrementa o índice', () => {
    useRoutineStore.getState().nextTask();
    expect(useRoutineStore.getState().currentTaskIndex).toBe(1);
  });

  it('resetProgress volta o índice para 0', () => {
    useRoutineStore.getState().nextTask();
    useRoutineStore.getState().nextTask();
    useRoutineStore.getState().resetProgress();
    expect(useRoutineStore.getState().currentTaskIndex).toBe(0);
  });
});

// ─── fetchRoutines ────────────────────────────────────────────────────────────

describe('routineStore — fetchRoutines', () => {
  it('salva rotinas na store após fetch bem-sucedido', async () => {
    const routines = [makeRoutine({ id: 'r1' }), makeRoutine({ id: 'r2' })] as Routine[];
    (routineService.getRoutinesByChild as jest.Mock).mockResolvedValue(routines);

    await useRoutineStore.getState().fetchRoutines('c1');

    expect(useRoutineStore.getState().routines).toHaveLength(2);
    expect(useRoutineStore.getState().isLoading).toBe(false);
    expect(useRoutineStore.getState().fetchError).toBeNull();
  });

  it('define fetchError quando o fetch falha', async () => {
    (routineService.getRoutinesByChild as jest.Mock).mockRejectedValue(
      new Error('Sem conexão')
    );

    await useRoutineStore.getState().fetchRoutines('c1');

    expect(useRoutineStore.getState().fetchError).toBe('Sem conexão');
    expect(useRoutineStore.getState().isLoading).toBe(false);
  });
});

// ─── fetchTasks ───────────────────────────────────────────────────────────────

describe('routineStore — fetchTasks', () => {
  it('salva tarefas ordenadas após fetch bem-sucedido', async () => {
    const tasks = [
      makeTask({ id: 't2', order_index: 1 }),
      makeTask({ id: 't1', order_index: 0 }),
    ] as Task[];
    (taskService.getTasksByRoutine as jest.Mock).mockResolvedValue(tasks);

    await useRoutineStore.getState().fetchTasks('r1');

    const stored = useRoutineStore.getState().tasks;
    expect(stored).toHaveLength(2);
    expect(stored[0].order_index).toBe(0);
    expect(useRoutineStore.getState().currentTaskIndex).toBe(0);
    expect(useRoutineStore.getState().isLoading).toBe(false);
  });

  it('define fetchError quando o fetch falha', async () => {
    (taskService.getTasksByRoutine as jest.Mock).mockRejectedValue(
      new Error('Tabela bloqueada')
    );

    await useRoutineStore.getState().fetchTasks('r1');

    expect(useRoutineStore.getState().fetchError).toBe('Tabela bloqueada');
    expect(useRoutineStore.getState().isLoading).toBe(false);
  });
});
