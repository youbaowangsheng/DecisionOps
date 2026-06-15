import { create } from 'zustand';
import type { Task } from '../services/types';
import { taskApi } from '../services/api';
import { mockTasks } from '../services/mockData';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  currentFilter: string;
  useMockData: boolean;

  fetchTasks: (status?: string) => Promise<void>;
  executeTask: (id: string) => Promise<void>;
  cancelTask: (id: string) => Promise<void>;
  setCurrentFilter: (filter: string) => void;
  updateTaskInList: (id: string, updates: Partial<Task>) => void;
  addTask: (task: Task) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  currentFilter: 'pending',
  useMockData: false,

  fetchTasks: async (status) => {
    set({ loading: true, error: null });
    try {
      const { data } = await taskApi.list(status);
      set({ tasks: data.data || [], loading: false, useMockData: false });
    } catch (error) {
      // API 不可用，使用 Mock 数据
      console.log('API unavailable, using mock data');
      const filtered = mockTasks.filter(t => {
        if (status && t.status !== status) return false;
        return true;
      });
      set({ tasks: filtered, loading: false, useMockData: true, error: 'Using demo data' });
    }
  },

  executeTask: async (id) => {
    try {
      await taskApi.execute(id);
      get().updateTaskInList(id, { status: 'executing', progress: 0 });
    } catch (error) {
      if (get().useMockData) {
        get().updateTaskInList(id, { status: 'executing', progress: 0 });
        return;
      }
      set({ error: (error as Error).message });
      throw error;
    }
  },

  cancelTask: async (id) => {
    try {
      await taskApi.cancel(id);
      get().updateTaskInList(id, { status: 'cancelled' });
    } catch (error) {
      if (get().useMockData) {
        get().updateTaskInList(id, { status: 'cancelled' });
        return;
      }
      set({ error: (error as Error).message });
      throw error;
    }
  },

  setCurrentFilter: (filter) => set({ currentFilter: filter }),

  updateTaskInList: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  addTask: (task) => {
    set((state) => ({ tasks: [task, ...state.tasks] }));
  },
}));