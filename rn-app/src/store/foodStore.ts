import { create, StateCreator } from 'zustand';
import { foodService } from '../services/foodService';

interface FoodState {
  search: string;
  results: any[];
  loading: boolean;
  setSearch: (s: string) => void;
  runSearch: (term?: string) => Promise<void>;
  getByBarcode: (barcode: string) => Promise<any>;
}

const creator: StateCreator<FoodState> = (set, get) => ({
  search: '',
  results: [],
  loading: false,
  setSearch: (s) => set({ search: s }),
  runSearch: async (term) => {
    const query = term ?? get().search;
    if (!query.trim()) { set({ results: [] }); return; }
    set({ loading: true });
    try {
      const res = await foodService.searchFoods(query);
      set({ results: res, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },
  getByBarcode: async (barcode: string) => foodService.getFoodByBarcode(barcode),
});

export const useFoodStore = create<FoodState>(creator);
