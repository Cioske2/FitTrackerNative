import { create } from 'zustand';
import { goalItemsService, GoalItem } from '../services/goalItemsService';

interface GoalItemsState {
  items: GoalItem[];
  loading: boolean;
  load: () => Promise<void>;
  add: (payload: Partial<GoalItem>) => Promise<void>;
  update: (id: string, patch: Partial<GoalItem>) => Promise<void>;
  complete: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useGoalItemsStore = create<GoalItemsState>((set, get) => ({
  items: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    try {
      const data = await goalItemsService.list();
      set({ items: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  add: async (payload) => {
    const item = await goalItemsService.add(payload);
    set({ items: [...get().items, item] });
  },
  update: async (id, patch) => {
    const updated = await goalItemsService.update(id, patch);
    set({ items: get().items.map(i => i.id === id ? updated : i) });
  },
  complete: async (id) => {
    const updated = await goalItemsService.complete(id);
    set({ items: get().items.map(i => i.id === id ? updated : i) });
  },
  remove: async (id) => {
    await goalItemsService.remove(id);
    set({ items: get().items.filter(i => i.id !== id) });
  }
}));

export default useGoalItemsStore;