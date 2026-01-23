import { create, StateCreator } from 'zustand';
import { queryClient } from '../queryClient';
import foodRepository from '../repositories/foodRepository';

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
      const res = await queryClient.fetchQuery({
        queryKey: ['foodsSearch', query.toLowerCase()],
        queryFn: () => foodRepository.searchFoods(query),
      });
      const unique: any[] = [];
      res.forEach((r: any) => {
        if (!unique.find(u => u.name.toLowerCase() === r.name.toLowerCase() && (u.brand || '').toLowerCase() === (r.brand || '').toLowerCase())) {
          unique.push(r);
        }
      });
      set({ results: unique, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },
  getByBarcode: async (barcode: string) => queryClient.fetchQuery({
    queryKey: ['foodByBarcode', barcode],
    queryFn: () => foodRepository.getByBarcode(barcode),
  }),
});

export const useFoodStore = create<FoodState>(creator);
